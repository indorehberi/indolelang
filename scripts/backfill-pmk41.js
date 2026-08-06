/**
 * Membetulkan arah PMK 41 pada pencairan yang BELUM dibayarkan.
 *
 * HANYA MEMBACA sampai dijalankan dengan --apply.
 *
 * Latar belakang: sebelum commit b579e15, ketika provider disetel menanggung
 * PMK 41, nilainya justru DITAMBAHKAN ke pencairannya:
 *
 *     lama : net = harga ketok - fee lelang bersih + PMK 41
 *     benar: net = harga ketok - fee lelang bersih - PMK 41
 *
 * Akibatnya provider yang menanggung PMK 41 dijadwalkan menerima 2 x PMK 41
 * lebih banyak daripada seharusnya, dan platform yang menanggung selisihnya.
 *
 * Yang diperbaiki HANYA yang uangnya belum berpindah:
 *
 *   'unpaid'  - pemenang belum melunasi, pencairan belum bisa dilakukan
 *   'pending' - pemenang sudah melunasi, tetapi admin belum mentransfer
 *
 * Yang berstatus 'processed' TIDAK disentuh: uangnya sudah ditransfer ke
 * rekening provider. Mengubah catatannya hanya membuat pembukuan tidak lagi
 * cocok dengan mutasi bank. Kelebihan bayar yang terlanjur adalah urusan
 * kesepakatan dengan provider, bukan urusan skrip.
 *
 * Pemakaian:
 *   node backfill-pmk41.js           # laporan saja
 *   node backfill-pmk41.js --apply   # jalankan perbaikan
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const APPLY = process.argv.includes('--apply');
const rupiah = (n) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(n));

(async () => {
  // Hanya settlement penjualan biasa yang punya PMK 41. Forfeiture NIPL tidak
  // pernah menyentuh PMK 41, jadi tidak mungkin terpengaruh.
  const semua = await prisma.settlements.findMany({
    where: { is_forfeiture: false, pmk41_amount: { gt: 0 } },
    include: {
      provider: { select: { full_name: true, company_name: true } },
      lot: { select: { lot_number: true, asset: { select: { title: true } } } },
    },
    orderBy: { created_at: 'asc' },
  });

  if (semua.length === 0) {
    console.log('Tidak ada pencairan yang memakai PMK 41. Tidak ada yang perlu diperbaiki.');
    await prisma.$disconnect();
    return;
  }

  const bisaDiperbaiki = [];
  const sudahCair = [];
  const sudahBenar = [];

  for (const s of semua) {
    const kotor = Number(s.gross_amount);
    const feeBersih = Number(s.commission_deducted);
    const pmk41 = Number(s.pmk41_amount);
    const net = Number(s.net_amount);

    const netBenar = kotor - feeBersih - pmk41;
    const baris = { s, kotor, feeBersih, pmk41, net, netBenar, selisih: net - netBenar };

    // Sudah benar (mis. dibuat setelah perbaikan) — jangan disentuh.
    if (net === netBenar) sudahBenar.push(baris);
    else if (s.status === 'processed') sudahCair.push(baris);
    else bisaDiperbaiki.push(baris);
  }

  const cetak = (daftar) => {
    for (const b of daftar) {
      const unit = b.s.lot?.asset?.title || `Lot ${b.s.lot?.lot_number ?? '-'}`;
      const prov = b.s.provider?.company_name || b.s.provider?.full_name || '-';
      console.log(`  [${b.s.status}] ${unit} — ${prov}`);
      console.log(
        `      ketok ${rupiah(b.kotor)} | fee ${rupiah(b.feeBersih)} | PMK41 ${rupiah(b.pmk41)}\n` +
          `      provider menerima ${rupiah(b.net)} → ${rupiah(b.netBenar)}  (turun ${rupiah(b.selisih)})`
      );
    }
  };

  console.log(`Pencairan yang memakai PMK 41: ${semua.length}\n`);

  console.log(`=== Belum dibayarkan, bisa diperbaiki: ${bisaDiperbaiki.length} ===`);
  cetak(bisaDiperbaiki);

  console.log(`\n=== Sudah dicairkan, TIDAK disentuh: ${sudahCair.length} ===`);
  cetak(sudahCair);
  if (sudahCair.length > 0) {
    const totalLebih = sudahCair.reduce((j, b) => j + b.selisih, 0);
    console.log(
      `\n  Uangnya sudah berpindah ke rekening provider. Total kelebihan ${rupiah(totalLebih)}.\n` +
        `  Ini perlu kesepakatan dengan providernya, bukan diubah diam-diam di basis data.`
    );
  }

  if (sudahBenar.length > 0) {
    console.log(`\n=== Sudah benar sejak awal, dilewati: ${sudahBenar.length} ===`);
  }

  if (!APPLY) {
    console.log(`\n(dry run — belum ada yang diubah. ${bisaDiperbaiki.length} akan diperbaiki dengan --apply.)`);
    await prisma.$disconnect();
    return;
  }

  if (bisaDiperbaiki.length === 0) {
    console.log('\nTidak ada yang perlu diperbaiki.');
    await prisma.$disconnect();
    return;
  }

  await prisma.$transaction(
    bisaDiperbaiki.flatMap((b) => [
      prisma.settlements.update({
        where: { id: b.s.id },
        data: { net_amount: b.netBenar },
      }),
      prisma.audit_logs.create({
        data: {
          action: 'SETTLEMENT_PMK41_BACKFILL',
          resource_type: 'settlement',
          resource_id: b.s.id,
          old_value: JSON.stringify({ net_amount: b.net }),
          new_value: JSON.stringify({ net_amount: b.netBenar, alasan: 'PMK41 dipotong, bukan ditambah' }),
        },
      }),
    ])
  );

  console.log(`\n✅ ${bisaDiperbaiki.length} pencairan diperbarui dan dicatat di audit_logs.`);
  await prisma.$disconnect();
})().catch(async (e) => {
  console.error('Gagal:', e);
  await prisma.$disconnect();
  process.exitCode = 1;
});
