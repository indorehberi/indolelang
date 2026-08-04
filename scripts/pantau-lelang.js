/**
 * Pemantau sesi lelang yang sedang berjalan.
 *
 * HANYA MEMBACA — tidak menulis apa pun ke basis data.
 *
 * Timer lot dan kunci antrean bid hidup di memori proses API, jadi tidak
 * terlihat dari sini. Tetapi dua kegagalan yang paling merepotkan justru
 * terbaca dari basis data:
 *
 *   - lot MACET: statusnya 'active' jauh lebih lama daripada waktu pertama
 *     ditambah kelonggaran, artinya timer atau penutupan otomatis tidak jalan.
 *   - rantai PUTUS: sesi 'live' tetapi tidak ada satu pun lot 'active' padahal
 *     masih ada lot menunggu — ini gejala rantai lanjut-lot berhenti (lihat
 *     handleAutoNextAndSessionEnd di apps/api/src/lib/socket.ts).
 *
 * Jalankan di jendela terminal terpisah selama lelang:
 *   docker exec indolelang_api_prod node pantau-lelang.js
 *
 * Hentikan dengan Ctrl+C.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const JEDA_DETIK = Number(process.env.PANTAU_JEDA || 5);

const rupiah = (n) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(n));
const jam = (d) => new Date(d).toLocaleTimeString('id-ID');
const detikSejak = (d) => Math.floor((Date.now() - new Date(d).getTime()) / 1000);

// Peringatan yang sama tidak dicetak berulang tiap siklus; hanya saat berubah.
const peringatanTerakhir = new Set();
const alarm = (kunci, pesan) => {
  if (peringatanTerakhir.has(kunci)) return;
  peringatanTerakhir.add(kunci);
  console.log(`\n  ⚠  ${jam(Date.now())}  ${pesan}\n`);
};
const alarmSelesai = (kunci) => peringatanTerakhir.delete(kunci);

let invoiceTerlihat = new Set();
let lotTerlihat = new Map();

async function siklus() {
  const S = new Map((await prisma.platform_settings.findMany()).map((r) => [r.key, r.value]));
  const waktuPertama = parseInt(S.get('auction_lot_duration_secs') || '120', 10);
  const jedaAntarLot = parseInt(S.get('auction_lot_next_delay_secs') || '10', 10);
  const modeLanjut = S.get('auction_lot_next_trigger') || 'admin';

  const sesi = await prisma.auction_sessions.findMany({
    where: { status: 'live' },
    include: { lots: { include: { asset: { select: { title: true } } }, orderBy: { lot_number: 'asc' } } },
  });

  if (sesi.length === 0) {
    process.stdout.write(`\r${jam(Date.now())}  belum ada sesi berstatus 'live'…   `);
    return;
  }

  for (const s of sesi) {
    const hitung = s.lots.reduce((m, l) => ({ ...m, [l.status]: (m[l.status] || 0) + 1 }), {});
    const aktif = s.lots.filter((l) => l.status === 'active');
    const menunggu = s.lots.filter((l) => l.status === 'pending' || l.status === 'cancelled');

    const ringkas = Object.entries(hitung).map(([k, v]) => `${k} ${v}`).join(' | ');
    console.log(`\n[${jam(Date.now())}] "${s.title}"  ${ringkas}  (lanjut lot: ${modeLanjut})`);

    // ------------------------------------------------------------ lot aktif
    if (aktif.length > 1) {
      alarm('lot-ganda', `${aktif.length} lot berstatus 'active' bersamaan: ${aktif.map((l) => '#' + l.lot_number).join(', ')} — mesin seharusnya hanya menjalankan satu.`);
    } else {
      alarmSelesai('lot-ganda');
    }

    for (const l of aktif) {
      const umur = detikSejak(l.updated_at);
      const bids = await prisma.bids.findMany({
        where: { lot_id: l.id },
        orderBy: [{ amount: 'desc' }, { created_at: 'asc' }],
        include: { bidder: { select: { full_name: true } } },
      });
      const tertinggi = bids[0];
      const penawarUnik = new Set(bids.map((b) => b.bidder_id)).size;
      const bidTerakhir = bids.length
        ? Math.min(...bids.map((b) => detikSejak(b.created_at)))
        : null;

      console.log(
        `  lot #${l.lot_number} ${l.asset.title}\n` +
          `     aktif ${umur}s | ${bids.length} bid dari ${penawarUnik} penawar` +
          (tertinggi ? ` | tertinggi ${rupiah(tertinggi.amount)} (${tertinggi.bidder.full_name})` : ' | belum ada bid') +
          (bidTerakhir !== null ? ` | bid terakhir ${bidTerakhir}s lalu` : '')
      );

      // Kelonggaran lebar: setiap bid mengembalikan hitungan mundur, jadi lot
      // yang ramai memang wajar hidup lama. Yang tidak wajar adalah lot yang
      // jauh melewati waktu pertama TANPA bid baru.
      const ambangMacet = waktuPertama * 2 + 60;
      const sepiSejak = bidTerakhir === null ? umur : bidTerakhir;
      if (umur > ambangMacet && sepiSejak > ambangMacet) {
        alarm(
          `macet-${l.id}`,
          `Lot #${l.lot_number} sudah 'active' ${umur} detik tanpa bid baru selama ${sepiSejak} detik (waktu pertama ${waktuPertama}s). ` +
            `Timer atau penutupan otomatis kemungkinan tidak jalan — tutup manual dari Ruang Kontrol.`
        );
      } else {
        alarmSelesai(`macet-${l.id}`);
      }
    }

    // -------------------------------------------------------- rantai putus
    if (aktif.length === 0 && menunggu.length > 0) {
      const terakhirSelesai = s.lots
        .filter((l) => l.status === 'sold' || l.status === 'unsold')
        .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))[0];
      const diamSejak = terakhirSelesai ? detikSejak(terakhirSelesai.updated_at) : null;
      const ambang = Math.max(jedaAntarLot * 3, 45);

      if (modeLanjut === 'system' && diamSejak !== null && diamSejak > ambang) {
        alarm(
          'rantai-putus',
          `Sesi masih 'live', ${menunggu.length} lot menunggu, tetapi tidak ada lot aktif selama ${diamSejak} detik ` +
            `(jeda antar lot ${jedaAntarLot}s). Rantai lanjut-lot kemungkinan berhenti — jalankan lot berikutnya manual dari Ruang Kontrol.`
        );
      } else {
        console.log(`  tidak ada lot aktif; ${menunggu.length} lot menunggu` + (diamSejak !== null ? ` (${diamSejak}s sejak lot terakhir selesai)` : ''));
      }
    } else {
      alarmSelesai('rantai-putus');
    }

    // ------------------------------------------------- perubahan status lot
    for (const l of s.lots) {
      const sebelum = lotTerlihat.get(l.id);
      if (sebelum && sebelum !== l.status) {
        console.log(`  → lot #${l.lot_number} ${sebelum} menjadi ${l.status}`);
      }
      lotTerlihat.set(l.id, l.status);
    }
  }

  // ------------------------------------------------------------- tagihan
  // Tagihan yang baru terbit langsung diperiksa: biaya administrasinya
  // terpakai atau tidak, dan totalnya menjumlah dengan benar.
  const invoiceBaru = await prisma.invoices.findMany({
    where: { created_at: { gte: new Date(Date.now() - 1000 * 60 * 60 * 12) } },
    include: { lot: { select: { lot_number: true } }, bidder: { select: { full_name: true } } },
    orderBy: { created_at: 'asc' },
  });

  for (const inv of invoiceBaru) {
    if (invoiceTerlihat.has(inv.id)) continue;
    invoiceTerlihat.add(inv.id);

    const fee = Number(inv.admin_fee || 0);
    const total = Number(inv.total);
    const seharusnya = Number(inv.hammer_price) + fee + Number(inv.pmk41_amount || 0);

    console.log(
      `  tagihan lot #${inv.lot.lot_number} untuk ${inv.bidder.full_name}: ` +
        `ketok ${rupiah(inv.hammer_price)} + admin ${rupiah(fee)} + PMK ${rupiah(inv.pmk41_amount || 0)} = ${rupiah(total)}`
    );

    if (fee <= 0) {
      alarm(`fee-nol-${inv.id}`, `Tagihan lot #${inv.lot.lot_number} terbit dengan biaya administrasi Rp 0 — periksa Tiered Admin Fee.`);
    }
    if (total !== seharusnya) {
      alarm(`total-aneh-${inv.id}`, `Total tagihan lot #${inv.lot.lot_number} ${rupiah(total)} tidak sama dengan ketok + admin + PMK (${rupiah(seharusnya)}).`);
    }
  }
}

console.log(`Memantau setiap ${JEDA_DETIK} detik. Ctrl+C untuk berhenti.`);
let berjalan = true;
process.on('SIGINT', () => {
  berjalan = false;
  console.log('\nBerhenti memantau.');
  prisma.$disconnect().finally(() => process.exit(0));
});

(async () => {
  while (berjalan) {
    try {
      await siklus();
    } catch (e) {
      console.error(`\n  Gagal membaca basis data: ${e.message}`);
    }
    await new Promise((r) => setTimeout(r, JEDA_DETIK * 1000));
  }
})();
