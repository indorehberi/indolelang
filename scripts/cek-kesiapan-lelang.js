/**
 * Cek kesiapan sebelum sesi lelang berjalan.
 *
 * HANYA MEMBACA — tidak menulis apa pun ke basis data.
 *
 * Memeriksa hal-hal yang kalau salah baru ketahuan saat lelang sudah jalan
 * dan peserta sudah menonton: pemicu otomatis masih 'admin' sehingga lot tidak
 * pernah menutup sendiri, sesi masih 'draft' sehingga tidak bisa dimulai, lot
 * nyangkut 'active' dari sesi sebelumnya, SMTP kosong sehingga pendaftar baru
 * tidak pernah menerima email.
 *
 * Jalankan di server:
 *   docker exec indolelang_api_prod node cek-kesiapan-lelang.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

let jumlahGagal = 0;
let jumlahIngat = 0;

const OK = (pesan, nilai = '') => console.log(`  OK    ${pesan}${nilai ? ` — ${nilai}` : ''}`);
const INGAT = (pesan, nilai = '') => {
  jumlahIngat++;
  console.log(`  ⚠     ${pesan}${nilai ? ` — ${nilai}` : ''}`);
};
const GAGAL = (pesan, nilai = '') => {
  jumlahGagal++;
  console.log(`  ✗     ${pesan}${nilai ? ` — ${nilai}` : ''}`);
};

const judul = (teks) => console.log(`\n== ${teks} ==`);
const rupiah = (n) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

async function main() {
  const rows = await prisma.platform_settings.findMany();
  const S = new Map(rows.map((r) => [r.key, r.value]));
  const nilai = (k) => (S.get(k) ?? '').trim();
  const angka = (k) => {
    const n = parseInt(nilai(k), 10);
    return Number.isFinite(n) ? n : null;
  };

  // ---------------------------------------------------------------- pemicu
  judul('Pemicu otomatis mesin lelang');

  const rencana = [
    ['auction_session_start_trigger', 'admin', 'Sesi dimulai admin dari Ruang Kontrol'],
    ['auction_lot_end_trigger', 'system', 'Lot menutup sendiri saat waktu habis'],
    ['auction_lot_next_trigger', 'system', 'Lot berikutnya berjalan sendiri'],
    ['auction_session_end_trigger', 'system', 'Sesi menutup sendiri setelah lot terakhir'],
  ];

  for (const [key, harap, arti] of rencana) {
    const ada = nilai(key);
    if (!ada) {
      GAGAL(`${key} belum diatur — mesin memakai bawaan 'admin', jadi ${arti.toLowerCase()} TIDAK akan terjadi`);
    } else if (ada !== harap) {
      GAGAL(`${key} = '${ada}', seharusnya '${harap}'`, arti);
    } else {
      OK(`${key} = '${ada}'`, arti);
    }
  }

  // -------------------------------------------------------------- durasi
  judul('Durasi dan jeda');

  const pertama = angka('auction_lot_duration_secs');
  const kedua = angka('auction_lot_second_duration_secs');
  const jeda = angka('auction_lot_next_delay_secs');
  const beku = angka('auction_lot_canceled_duration_secs');

  if (pertama === null) GAGAL('auction_lot_duration_secs belum diatur (mesin memakai 120 detik)');
  else OK(`Waktu pertama ${pertama} detik`);

  if (kedua === null) GAGAL('auction_lot_second_duration_secs belum diatur (mesin memakai 60 detik)');
  else if (pertama !== null && kedua >= pertama) GAGAL(`Waktu kedua (${kedua}s) harus lebih kecil dari waktu pertama (${pertama}s)`);
  else OK(`Waktu kedua ${kedua} detik`);

  if (jeda === null) INGAT('auction_lot_next_delay_secs belum diatur, mesin memakai 10 detik');
  else if (jeda <= 0) GAGAL(`Jeda antar lot ${jeda} detik — lot berikutnya akan menimpa layar hasil lot sebelumnya`);
  else OK(`Jeda antar lot ${jeda} detik`);

  // Layar peserta memakai 5 detik secara tetap untuk overlay "lot dibatalkan"
  // yang dipicu admin. Kalau angka di sini berbeda, server dan layar peserta
  // berhenti pada detik yang tidak sama.
  if (beku === null) INGAT('auction_lot_canceled_duration_secs belum diatur, mesin memakai 5 detik (cocok dengan layar peserta)');
  else if (beku !== 5) INGAT(`Durasi tampil lot dibatalkan ${beku} detik, sedangkan overlay peserta terkunci 5 detik — akan ada selisih ${Math.abs(beku - 5)} detik`);
  else OK('Durasi tampil lot dibatalkan 5 detik, sama dengan layar peserta');

  const increment = angka('bid_increment_1');
  if (!increment || increment <= 0) GAGAL('bid_increment_1 belum diatur — kelipatan bid tidak jelas');
  else OK(`Kelipatan bid ${rupiah(increment)}`);

  // ---------------------------------------------------------------- uang
  judul('NIPL dan biaya');

  for (const [key, label] of [
    ['nipl_deposit_amount', 'Deposit NIPL mobil'],
    ['nipl_motor_deposit_amount', 'Deposit NIPL motor'],
  ]) {
    const n = angka(key);
    if (!n || n <= 0) GAGAL(`${key} belum diatur`);
    else OK(`${label} ${rupiah(n)}`);
  }

  const tiersRaw = nilai('admin_fee_tiers');
  if (!tiersRaw) {
    GAGAL('admin_fee_tiers belum diatur — setiap pemenang akan ditagih biaya administrasi Rp 0');
  } else {
    try {
      const t = JSON.parse(tiersRaw);
      if (!Array.isArray(t) || t.length === 0) GAGAL('admin_fee_tiers kosong — biaya administrasi akan Rp 0');
      else OK(`Tiered admin fee ${t.length} tier`, tiersRaw);
    } catch (e) {
      GAGAL('admin_fee_tiers tidak bisa dibaca sebagai JSON — biaya administrasi akan Rp 0');
    }
  }

  for (const [key, label] of [
    ['manual_payment_bank', 'Bank transfer manual'],
    ['manual_payment_account', 'Nomor rekening'],
    ['manual_payment_name', 'Nama rekening'],
  ]) {
    if (!nilai(key)) GAGAL(`${key} kosong — peserta tidak tahu harus transfer ke mana`);
    else OK(label, nilai(key));
  }

  // --------------------------------------------------------------- email
  judul('Email (pendaftaran akun baru)');

  // Urutannya sama dengan getTransporter() di apps/api/src/lib/email.ts:
  // pengaturan platform dulu, baru variabel lingkungan. Memeriksa salah
  // satunya saja akan memberi alarm palsu pada pemasangan yang memakai env.
  const smtp = (key, envKey) => {
    const dariDb = nilai(key);
    if (dariDb) return { ada: true, asal: 'pengaturan platform', nilai: dariDb };
    const dariEnv = (process.env[envKey] || '').trim();
    if (dariEnv) return { ada: true, asal: 'variabel lingkungan', nilai: dariEnv };
    return { ada: false };
  };

  const host = smtp('smtp_host', 'SMTP_HOST');
  const user = smtp('smtp_user', 'SMTP_USER');
  const pass = smtp('smtp_password', 'SMTP_PASS');

  if (!host.ada || host.nilai === 'localhost') {
    GAGAL('SMTP host belum diatur (atau masih localhost) — pendaftar baru tidak akan menerima email');
  } else if (!user.ada || !pass.ada) {
    GAGAL('SMTP host ada tetapi user/password kosong — pengiriman email kemungkinan besar ditolak server');
  } else {
    OK('SMTP terisi', `${host.nilai} (${host.asal}), user ${user.nilai}`);
  }

  // ---------------------------------------------------------------- data
  judul('Sesi dan lot');

  const awalHariIni = new Date();
  awalHariIni.setHours(0, 0, 0, 0);
  const akhirHariIni = new Date(awalHariIni);
  akhirHariIni.setDate(akhirHariIni.getDate() + 1);

  const sesiHariIni = await prisma.auction_sessions.findMany({
    where: { scheduled_at: { gte: awalHariIni, lt: akhirHariIni } },
    include: { lots: { include: { asset: { select: { title: true, category: true } } }, orderBy: { lot_number: 'asc' } } },
    orderBy: { scheduled_at: 'asc' },
  });

  if (sesiHariIni.length === 0) {
    GAGAL('Tidak ada sesi lelang terjadwal hari ini');
  } else {
    for (const s of sesiHariIni) {
      console.log(`\n  Sesi "${s.title}" — ${s.scheduled_at.toLocaleString('id-ID')}`);

      if (s.status === 'draft') {
        GAGAL(`  status '${s.status}' — sesi harus 'published' dulu sebelum bisa dijalankan admin`);
      } else if (s.status === 'closed') {
        GAGAL(`  status '${s.status}' — sesi ini sudah ditutup`);
      } else {
        OK(`  status '${s.status}'`);
      }

      const perStatus = s.lots.reduce((m, l) => ({ ...m, [l.status]: (m[l.status] || 0) + 1 }), {});
      if (s.lots.length === 0) {
        GAGAL('  sesi tidak punya lot sama sekali');
      } else {
        OK(`  ${s.lots.length} lot`, Object.entries(perStatus).map(([k, v]) => `${k}: ${v}`).join(', '));
      }

      const tanpaHarga = s.lots.filter((l) => !l.starting_price || Number(l.starting_price) <= 0);
      if (tanpaHarga.length > 0) GAGAL(`  ${tanpaHarga.length} lot tanpa harga awal`, tanpaHarga.map((l) => `#${l.lot_number}`).join(', '));
      else if (s.lots.length > 0) OK('  semua lot punya harga awal');

      const nomor = s.lots.map((l) => l.lot_number);
      if (new Set(nomor).size !== nomor.length) GAGAL('  ada nomor lot ganda');

      const dibatalkan = s.lots.filter((l) => l.status === 'cancelled');
      if (dibatalkan.length > 0) {
        console.log(`  catatan: ${dibatalkan.length} lot sudah berstatus dibatalkan dan akan tampil beku lalu dilewati — ${dibatalkan.map((l) => `#${l.lot_number}`).join(', ')}`);
      }
    }
  }

  // Lot yang tertinggal 'active' membuat mesin punya dua lot berjalan.
  const lotNyangkut = await prisma.lots.findMany({
    where: { status: 'active' },
    include: { session: { select: { title: true, status: true } } },
  });
  const nyangkutDiSesiLain = lotNyangkut.filter((l) => l.session.status !== 'live');
  if (nyangkutDiSesiLain.length > 0) {
    GAGAL(`${nyangkutDiSesiLain.length} lot tertinggal berstatus 'active' di sesi yang tidak sedang berjalan`,
      nyangkutDiSesiLain.map((l) => `#${l.lot_number} (${l.session.title}, sesi '${l.session.status}')`).join('; '));
  } else {
    OK('Tidak ada lot tertinggal berstatus active');
  }

  const sesiLive = await prisma.auction_sessions.findMany({ where: { status: 'live' }, select: { id: true, title: true } });
  if (sesiLive.length > 1) {
    GAGAL(`${sesiLive.length} sesi berstatus 'live' bersamaan`, sesiLive.map((s) => s.title).join('; '));
  } else if (sesiLive.length === 1) {
    INGAT(`Sesi "${sesiLive[0].title}" sudah berstatus 'live' sekarang`);
  }

  // ------------------------------------------------------------ ringkasan
  console.log('\n' + '='.repeat(60));
  if (jumlahGagal === 0 && jumlahIngat === 0) console.log('SIAP — semua pemeriksaan lolos.');
  else if (jumlahGagal === 0) console.log(`SIAP DENGAN CATATAN — ${jumlahIngat} hal untuk diperhatikan di atas.`);
  else console.log(`BELUM SIAP — ${jumlahGagal} masalah harus dibereskan${jumlahIngat ? `, dan ${jumlahIngat} catatan` : ''}.`);
  console.log('='.repeat(60));
}

main()
  .catch((e) => {
    console.error('Gagal menjalankan pemeriksaan:', e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
