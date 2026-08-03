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
 * Yang diperbaiki otomatis HANYA tagihan yang masih berada di keranjang:
 * status 'unpaid' dan belum terikat checkout order (order_id NULL). Tagihan
 * yang sudah masuk order (`pending_checkout`) atau sudah 'paid' hanya
 * dilaporkan — mengubah nilainya akan membuat checkout_orders.subtotal_amount
 * dan pembayaran yang sudah diterima tidak lagi cocok, dan itu keputusan
 * bisnis, bukan keputusan skrip.
 *
 * Pemakaian (default hanya melihat, tidak mengubah apa pun):
 *
 *   node backfill-admin-fee.js                 # laporan saja (dry run)
 *   node backfill-admin-fee.js --apply         # jalankan perbaikan
 *   node backfill-admin-fee.js --set-default   # isi admin_fee_tiers bila belum ada
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const APPLY = process.argv.includes('--apply');
const SET_DEFAULT = process.argv.includes('--set-default');

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

  const bisaDiperbaiki = [];
  const perluKeputusan = [];

  for (const inv of invoices) {
    const hammerPrice = Number(inv.hammer_price);
    const feeSeharusnya = hitungAdminFee(hammerPrice, tiersRaw);
    const feeTersimpan = Number(inv.admin_fee ?? 0);
    if (feeSeharusnya === feeTersimpan) continue;

    // Selisihnya saja yang digeser, supaya komponen lain pada total tidak
    // ikut terhitung ulang dan berubah tanpa sengaja.
    const totalBaru = Number(inv.total) - feeTersimpan + feeSeharusnya;
    const baris = { ...inv, hammerPrice, feeTersimpan, feeSeharusnya, totalBaru };

    const masihDiKeranjang = inv.status === 'unpaid' && inv.order_id === null;
    (masihDiKeranjang ? bisaDiperbaiki : perluKeputusan).push(baris);
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
  console.log(`\n=== Bisa diperbaiki otomatis (masih di keranjang): ${bisaDiperbaiki.length} ===`);
  cetak(bisaDiperbaiki);

  console.log(`\n=== Perlu keputusan manual (sudah masuk order / sudah dibayar): ${perluKeputusan.length} ===`);
  cetak(perluKeputusan);
  if (perluKeputusan.length > 0) {
    console.log(
      '\n  Tagihan di atas TIDAK disentuh skrip ini. Menaikkan nilainya akan membuat\n' +
        '  checkout_orders dan pembayaran yang sudah diterima tidak lagi cocok.'
    );
  }

  if (!APPLY) {
    console.log('\n(dry run — belum ada yang diubah. Tambahkan --apply untuk menjalankan perbaikan.)');
    return;
  }

  if (bisaDiperbaiki.length === 0) {
    console.log('\nTidak ada yang perlu diperbaiki.');
    return;
  }

  await prisma.$transaction(
    bisaDiperbaiki.flatMap((b) => [
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
    ])
  );

  console.log(`\n✅ ${bisaDiperbaiki.length} tagihan diperbarui dan dicatat di audit_logs.`);
}

main()
  .catch((e) => {
    console.error('❌ Gagal:', e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
