/**
 * Menyelaraskan biaya administrasi pada tagihan pelunasan pemenang lelang
 * dengan tier yang diatur di Pengaturan Platform → "Aturan Keuangan: Tiered
 * Admin Fee (Untuk Bidder)".
 *
 * Latar belakang: key `admin_fee_tiers` tidak pernah ikut di-seed, sehingga
 * pada basis data yang tiernya belum pernah disimpan, settleLot() menerbitkan
 * tagihan dengan admin_fee = 0 tanpa terlihat. Skrip ini menghitung ulang
 * setiap tagihan memakai algoritma pemilihan tier yang PERSIS sama dengan
 * apps/api/src/modules/lots/bidding.service.ts, lalu melaporkan atau
 * memperbaiki selisihnya.
 *
 * Tagihan yang sudah 'paid' atau 'expired' TIDAK PERNAH disentuh: uangnya
 * sudah diterima, atau jaminannya sudah hangus. Mengubahnya hanya akan
 * membuat pembukuan tidak cocok.
 *
 * Ada dua kelompok yang bisa diperbaiki:
 *
 *   - status 'unpaid' dan belum terikat order (order_id NULL) — masih di
 *     keranjang, aman diubah sendirian. Ini perilaku default.
 *   - status 'pending_checkout' — sudah masuk checkout order dan menunggu
 *     transfer. Hanya ikut bila dijalankan dengan --pending, dan ketika ikut,
 *     checkout_orders.subtotal_amount serta final_amount ordernya WAJIB ikut
 *     dihitung ulang; kalau tidak, nominal yang harus ditransfer bidder tidak
 *     lagi sama dengan jumlah tagihannya.
 *
 * Pemakaian (default hanya melihat, tidak mengubah apa pun):
 *
 *   node backfill-admin-fee.js                     # laporan saja (dry run)
 *   node backfill-admin-fee.js --apply             # perbaiki yang masih di keranjang
 *   node backfill-admin-fee.js --pending --apply   # ikut perbaiki pending_checkout
 *   node backfill-admin-fee.js --set-default       # isi admin_fee_tiers bila belum ada
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const APPLY = process.argv.includes('--apply');
const SET_DEFAULT = process.argv.includes('--set-default');
const IKUT_PENDING = process.argv.includes('--pending');

// Sama dengan nilai di apps/api/prisma/seed.ts — mengikuti Syarat & Ketentuan
// untuk unit mobil: flat Rp 3.000.000 sampai Harga Terbentuk Rp 500 juta,
// lalu 0,6% di atasnya.
const TIER_DEFAULT = [
  { max_price: 500000000, fee_type: 'flat', fee: 3000000 },
  { max_price: null, fee_type: 'percentage', fee: 0.6 },
];

const rupiah = (n) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

/**
 * Salinan persis logika pemilihan tier di bidding.service.ts settleLotUnlocked().
 * Kalau logika di sana berubah, ubah juga di sini.
 */
function hitungAdminFee(hammerPrice, tiersRaw) {
  const parsed = JSON.parse(tiersRaw);
  const tiers = Array.isArray(parsed)
    ? parsed.sort((a, b) => {
        const maxA = a.max_price === null || a.max_price === undefined || a.max_price === '' ? Infinity : Number(a.max_price);
        const maxB = b.max_price === null || b.max_price === undefined || b.max_price === '' ? Infinity : Number(b.max_price);
        return maxA - maxB;
      })
    : [];

  let adminFee = 0;
  let found = false;
  for (const tier of tiers) {
    const maxPrice = tier.max_price === null || tier.max_price === undefined || tier.max_price === '' ? null : Number(tier.max_price);
    if (maxPrice === null || hammerPrice <= maxPrice) {
      adminFee = tier.fee_type === 'percentage' ? Math.round((hammerPrice * Number(tier.fee)) / 100) : Number(tier.fee);
      found = true;
      break;
    }
  }
  if (!found && tiers.length > 0) {
    const lastTier = tiers[tiers.length - 1];
    adminFee = lastTier.fee_type === 'percentage' ? Math.round((hammerPrice * Number(lastTier.fee)) / 100) : Number(lastTier.fee);
  }
  return adminFee;
}

async function ambilTiers() {
  let setting = await prisma.platform_settings.findFirst({ where: { key: 'admin_fee_tiers' } });

  if (!setting && SET_DEFAULT) {
    setting = await prisma.platform_settings.create({
      data: {
        tenant_id: 'default',
        key: 'admin_fee_tiers',
        value: JSON.stringify(TIER_DEFAULT),
        is_encrypted: false,
      },
    });
    console.log('✅ admin_fee_tiers dibuat dengan nilai default:', setting.value, '\n');
  }

  if (!setting) {
    console.error('❌ admin_fee_tiers belum ada di basis data ini.');
    console.error('   Isi lewat Pengaturan Platform → "Aturan Keuangan: Tiered Admin Fee (Untuk Bidder)",');
    console.error('   atau jalankan ulang skrip ini dengan --set-default untuk memakai tarif Syarat & Ketentuan.');
    process.exit(1);
  }

  const tiers = JSON.parse(setting.value);
  if (!Array.isArray(tiers) || tiers.length === 0) {
    console.error('❌ admin_fee_tiers tersimpan tetapi kosong. Setiap pemenang akan ditagih Rp 0.');
    process.exit(1);
  }

  return setting.value;
}

async function main() {
  const tiersRaw = await ambilTiers();
  console.log('Tier yang dipakai:', tiersRaw, '\n');

  const invoices = await prisma.invoices.findMany({
    select: {
      id: true,
      status: true,
      order_id: true,
      hammer_price: true,
      admin_fee: true,
      commission: true,
      pmk41_amount: true,
      total: true,
      lot: { select: { lot_number: true, asset: { select: { title: true } } } },
    },
    orderBy: { created_at: 'asc' },
  });

  const diKeranjang = [];   // unpaid, belum masuk order — aman diubah sendirian
  const pendingOrder = [];  // pending_checkout — ikut hanya dengan --pending
  const janganSentuh = [];  // paid, expired, dan status lain

  for (const inv of invoices) {
    const hammerPrice = Number(inv.hammer_price);
    const feeSeharusnya = hitungAdminFee(hammerPrice, tiersRaw);
    const feeTersimpan = Number(inv.admin_fee ?? 0);
    if (feeSeharusnya === feeTersimpan) continue;

    // Selisihnya saja yang digeser, supaya komponen lain pada total tidak
    // ikut terhitung ulang dan berubah tanpa sengaja.
    const totalBaru = Number(inv.total) - feeTersimpan + feeSeharusnya;
    const baris = { ...inv, hammerPrice, feeTersimpan, feeSeharusnya, totalBaru };

    if (inv.status === 'unpaid' && inv.order_id === null) diKeranjang.push(baris);
    else if (inv.status === 'pending_checkout') pendingOrder.push(baris);
    else janganSentuh.push(baris);
  }

  const cetak = (baris) => {
    for (const b of baris) {
      const unit = b.lot?.asset?.title || `Lot ${b.lot?.lot_number ?? '-'}`;
      console.log(
        `  [${b.status}${b.order_id ? ', sudah di order' : ''}] ${unit}\n` +
          `      hammer ${rupiah(b.hammerPrice)} | admin fee ${rupiah(b.feeTersimpan)} → ${rupiah(b.feeSeharusnya)} | total ${rupiah(Number(b.total))} → ${rupiah(b.totalBaru)}`
      );
    }
  };

  console.log(`Total tagihan diperiksa: ${invoices.length}`);

  console.log(`\n=== Masih di keranjang, aman diperbaiki: ${diKeranjang.length} ===`);
  cetak(diKeranjang);

  console.log(`\n=== Menunggu transfer (pending_checkout): ${pendingOrder.length} ===`);
  cetak(pendingOrder);
  if (pendingOrder.length > 0 && !IKUT_PENDING) {
    console.log('\n  Tidak ikut diubah. Tambahkan --pending kalau kelompok ini memang mau diperbaiki.');
  }

  console.log(`\n=== Tidak pernah disentuh (sudah dibayar / hangus): ${janganSentuh.length} ===`);
  cetak(janganSentuh);

  const sasaran = IKUT_PENDING ? [...diKeranjang, ...pendingOrder] : diKeranjang;

  // Order yang ikut terpengaruh harus dihitung ulang, kalau tidak nominal
  // yang harus ditransfer bidder tidak lagi sama dengan jumlah tagihannya.
  const orderIds = [...new Set(sasaran.map((b) => b.order_id).filter(Boolean))];
  const orders = orderIds.length
    ? await prisma.checkout_orders.findMany({
        where: { id: { in: orderIds } },
        include: { invoices: { select: { id: true, total: true } } },
      })
    : [];

  const totalBaruPerInvoice = new Map(sasaran.map((b) => [b.id, b.totalBaru]));
  const perbaikanOrder = [];
  const orderBermasalah = [];

  // unique_code adalah kode unik pencocokan pembayaran: angka kecil yang
  // menempel pada nominal transfer supaya bank bisa mengenali pembayaran itu
  // milik order yang mana. Kode checkout sekarang menyetelnya 0, tetapi order
  // lama masih membawanya — kalau dibuang saat menghitung ulang, bidder akan
  // mentransfer nominal yang tidak lagi bisa dicocokkan.
  const hitungFinal = (subtotal, o) =>
    Math.max(0, subtotal - Number(o.deposit_deduction)) + Number(o.unique_code || 0) + Number(o.gateway_fee || 0);

  for (const o of orders) {
    const subtotalBaru = o.invoices.reduce(
      (jml, inv) => jml + (totalBaruPerInvoice.has(inv.id) ? totalBaruPerInvoice.get(inv.id) : Number(inv.total)),
      0
    );
    const finalBaru = hitungFinal(subtotalBaru, o);
    const rincian = {
      id: o.id,
      subtotalLama: Number(o.subtotal_amount),
      subtotalBaru,
      finalLama: Number(o.final_amount),
      finalBaru,
      kodeUnik: Number(o.unique_code || 0),
    };

    // Bukti diri: rumus di atas harus bisa mereproduksi final_amount yang
    // TERSIMPAN dari subtotal yang tersimpan. Kalau tidak bisa, berarti order
    // ini dibentuk dengan cara yang tidak dipahami skrip — jangan ditimpa
    // dengan angka hasil tebakan.
    const finalLamaMenurutRumus = hitungFinal(Number(o.subtotal_amount), o);

    if (finalLamaMenurutRumus !== Number(o.final_amount)) {
      orderBermasalah.push({
        ...rincian,
        sebab: `rumus tidak cocok dengan data lama (final_amount tersimpan ${rupiah(Number(o.final_amount))}, menurut rumus ${rupiah(finalLamaMenurutRumus)})`,
      });
    } else if (o.transfer_proof_url) {
      orderBermasalah.push({ ...rincian, sebab: 'bukti transfer sudah diunggah' });
    } else if (finalBaru === 0 && Number(o.final_amount) > 0) {
      // Order yang jatuh ke nol berarti seluruhnya tertutup jaminan — alurnya
      // berbeda (checkout menandainya langsung 'paid'), jadi jangan ditebak.
      orderBermasalah.push({ ...rincian, sebab: 'final_amount jatuh ke Rp 0' });
    } else {
      perbaikanOrder.push(rincian);
    }
  }

  if (orders.length > 0) {
    console.log(`\n=== Checkout order yang ikut dihitung ulang: ${perbaikanOrder.length} ===`);
    for (const o of perbaikanOrder) {
      console.log(
        `  order ${o.id}\n      subtotal ${rupiah(o.subtotalLama)} → ${rupiah(o.subtotalBaru)} | yang harus ditransfer ${rupiah(o.finalLama)} → ${rupiah(o.finalBaru)}` +
          (o.kodeUnik ? `\n      kode unik ${o.kodeUnik} dari penerbitan NIPL — dipertahankan apa adanya, tidak dibuat ulang` : '')
      );
    }
  }

  if (orderBermasalah.length > 0) {
    console.log(`\n⚠️  ${orderBermasalah.length} order tidak bisa disentuh otomatis:`);
    for (const o of orderBermasalah) {
      console.log(`  order ${o.id} — ${o.sebab} (${rupiah(o.finalLama)} → ${rupiah(o.finalBaru)})`);
    }
    console.log('  Tangani manual; tagihan di dalamnya ikut dilewati.');
  }

  const orderDilewati = new Set(orderBermasalah.map((o) => o.id));
  const akanDiubah = sasaran.filter((b) => !b.order_id || !orderDilewati.has(b.order_id));

  if (!APPLY) {
    console.log(`\n(dry run — belum ada yang diubah. ${akanDiubah.length} tagihan akan diperbaiki dengan --apply.)`);
    return;
  }

  if (akanDiubah.length === 0) {
    console.log('\nTidak ada yang perlu diperbaiki.');
    return;
  }

  await prisma.$transaction([
    ...akanDiubah.flatMap((b) => [
      prisma.invoices.update({
        where: { id: b.id },
        data: {
          admin_fee: b.feeSeharusnya,
          // Kolom warisan yang skemanya masih mewajibkan nilai; dijaga tetap
          // cermin dari admin_fee seperti yang ditulis settleLot().
          commission: b.feeSeharusnya,
          total: b.totalBaru,
        },
      }),
      prisma.audit_logs.create({
        data: {
          action: 'INVOICE_ADMIN_FEE_BACKFILL',
          resource_type: 'invoices',
          resource_id: b.id,
          old_value: JSON.stringify({ admin_fee: b.feeTersimpan, total: Number(b.total) }),
          new_value: JSON.stringify({ admin_fee: b.feeSeharusnya, total: b.totalBaru }),
        },
      }),
    ]),
    ...perbaikanOrder.flatMap((o) => [
      prisma.checkout_orders.update({
        where: { id: o.id },
        data: { subtotal_amount: o.subtotalBaru, final_amount: o.finalBaru },
      }),
      prisma.audit_logs.create({
        data: {
          action: 'CHECKOUT_ORDER_ADMIN_FEE_BACKFILL',
          resource_type: 'checkout_orders',
          resource_id: o.id,
          old_value: JSON.stringify({ subtotal_amount: o.subtotalLama, final_amount: o.finalLama }),
          new_value: JSON.stringify({ subtotal_amount: o.subtotalBaru, final_amount: o.finalBaru }),
        },
      }),
    ]),
  ]);

  console.log(
    `\n✅ ${akanDiubah.length} tagihan` +
      (perbaikanOrder.length ? ` dan ${perbaikanOrder.length} checkout order` : '') +
      ' diperbarui, dicatat di audit_logs.'
  );
}

main()
  .catch((e) => {
    console.error('❌ Gagal:', e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
