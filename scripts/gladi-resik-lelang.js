/**
 * Gladi resik satu sesi lelang penuh, dengan peserta sungguhan.
 *
 * Bukan uji unit dan bukan tiruan: skrip ini menyambungkan puluhan klien
 * socket.io asli — persis seperti aplikasi peserta — lalu menjalankan sesi
 * dari awal sampai tutup dan memeriksa hasilnya di basis data.
 *
 * Yang dibuktikan:
 *   - puluhan bid dilepas pada milidetik yang sama tidak membuat server jatuh,
 *     dan hanya satu yang menang tiap ronde
 *   - berapa lama antrean bid terkuras (yang terakhir menunggu berapa lama)
 *   - lot menutup sendiri saat waktu habis
 *   - lot yang dibatalkan tampil beku lalu dilewati
 *   - lot berikutnya berjalan sendiri setelah jeda
 *   - sesi menutup sendiri setelah lot terakhir
 *   - tagihan pemenang terbit sekali, dengan biaya administrasi sesuai tier
 *
 * MENULIS BANYAK DATA. Karena itu menolak berjalan kecuali basis datanya
 * localhost. Jangan pernah diarahkan ke produksi.
 *
 * Jalankan dari apps/api dengan server API lokal menyala:
 *   node ../../scripts/gladi-resik-lelang.js
 *
 * Pengaturan lewat variabel lingkungan:
 *   PESERTA=30      jumlah peserta (bawaan 30)
 *   RONDE=3         berapa kali semua peserta menekan BID serentak per lot
 *   CEPAT=1         pakai waktu pendek (12s/6s) supaya gladi selesai cepat
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const { io } = require('socket.io-client');

const p = new PrismaClient();
const API = process.env.API_BASE || 'http://localhost:8000/api/v1';
const WS = process.env.WS_BASE || 'http://localhost:8000';
const ADMIN = { email: 'admin@indo-lelang.com', password: 'Admin123!' };
const TAG = 'gladiresik';

const PESERTA = Number(process.env.PESERTA || 30);
const RONDE = Number(process.env.RONDE || 3);
const CEPAT = process.env.CEPAT === '1';

const HARGA_AWAL = 100_000_000;
const KELIPATAN = 500_000;

// Waktu pertama / kedua. Mode cepat hanya memendekkan hitungan mundur; jalur
// kode yang diuji sama persis.
const WAKTU_PERTAMA = CEPAT ? 12 : 60;
const WAKTU_KEDUA = CEPAT ? 6 : 30;
const JEDA_LOT = 5;
const BEKU_BATAL = 5;

if (!/@(localhost|127\.0\.0\.1)[:/]/.test(process.env.DATABASE_URL || '')) {
  console.error('DITOLAK: DATABASE_URL bukan basis data lokal. Gladi resik ini menulis banyak data.');
  process.exit(1);
}

const jeda = (ms) => new Promise((r) => setTimeout(r, ms));
const rp = (n) => 'Rp ' + Number(n).toLocaleString('id-ID');

let lolos = 0;
let gagal = 0;
const periksa = (nama, syarat, rincian = '') => {
  if (syarat) {
    lolos++;
    console.log(`  LOLOS  ${nama}`);
  } else {
    gagal++;
    console.log(`  GAGAL  ${nama}${rincian ? ' -> ' + rincian : ''}`);
  }
};

async function login(email, password) {
  const r = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const d = await r.json();
  if (!r.ok || !d.success) throw new Error(`Login ${email} gagal: ${JSON.stringify(d.error || d)}`);
  return { token: d.data.accessToken, user: d.data.user };
}

async function adminPost(token, path) {
  const r = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok || d.success === false) throw new Error(`${r.status} ${path} -> ${d.error?.message || JSON.stringify(d)}`);
  return d;
}

async function setelan(key, value) {
  const ada = await p.platform_settings.findFirst({ where: { key } });
  if (ada) await p.platform_settings.update({ where: { id: ada.id }, data: { value: String(value) } });
  else await p.platform_settings.create({ data: { tenant_id: 'default', key, value: String(value), is_encrypted: false } });
}

async function bersihkan() {
  const sesi = await p.auction_sessions.findMany({ where: { title: { contains: TAG } } });
  for (const s of sesi) {
    const lots = await p.lots.findMany({ where: { session_id: s.id } });
    const ids = lots.map((l) => l.id);
    await p.bids.deleteMany({ where: { lot_id: { in: ids } } });
    await p.nipl_codes.deleteMany({ where: { invoice: { lot_id: { in: ids } } } });
    await p.transaction_profiles.deleteMany({ where: { transaction_id: { in: (await p.invoices.findMany({ where: { lot_id: { in: ids } }, select: { id: true } })).map((i) => i.id) } } });
    await p.settlements.deleteMany({ where: { lot_id: { in: ids } } });
    await p.invoices.deleteMany({ where: { lot_id: { in: ids } } });
    await p.lots.deleteMany({ where: { session_id: s.id } });
    await p.deposits.deleteMany({ where: { session_id: s.id } });
    await p.auction_sessions.delete({ where: { id: s.id } });
  }
  await p.assets.deleteMany({ where: { title: { contains: TAG } } });
  await p.nipl_codes.deleteMany({ where: { deposit: { user: { email: { contains: TAG } } } } });
  await p.deposits.deleteMany({ where: { user: { email: { contains: TAG } } } });
  await p.notifications.deleteMany({ where: { user: { email: { contains: TAG } } } });
  await p.users.deleteMany({ where: { email: { contains: TAG } } });
  await p.branches.deleteMany({ where: { name: { contains: TAG } } });
}

(async () => {
  console.log(`\nGladi resik: ${PESERTA} peserta, ${RONDE} ronde bid serentak per lot, waktu ${WAKTU_PERTAMA}s/${WAKTU_KEDUA}s\n`);
  await bersihkan();

  // Pengaturan disamakan dengan rencana produksi: sesi dimulai admin, sisanya
  // berjalan sendiri.
  await setelan('auction_session_start_trigger', 'admin');
  await setelan('auction_lot_end_trigger', 'system');
  await setelan('auction_lot_next_trigger', 'system');
  await setelan('auction_session_end_trigger', 'system');
  await setelan('auction_lot_duration_secs', WAKTU_PERTAMA);
  await setelan('auction_lot_second_duration_secs', WAKTU_KEDUA);
  await setelan('auction_lot_next_delay_secs', JEDA_LOT);
  await setelan('auction_lot_canceled_duration_secs', BEKU_BATAL);
  await setelan('admin_fee_tiers', JSON.stringify([
    { max_price: 500000000, fee_type: 'flat', fee: 3000000 },
    { max_price: null, fee_type: 'percentage', fee: 0.6 },
  ]));
  await setelan('pmk41_percentage', '1.1');

  const admin = await login(ADMIN.email, ADMIN.password);
  const hash = await bcrypt.hash('Uji123!', 10);

  const branch = await p.branches.create({
    data: { tenant_id: 'default', name: `Cabang ${TAG}`, city: 'Jakarta', address: 'x', phone: '+62211', pic_name: 'x', is_active: true },
  });
  const sesi = await p.auction_sessions.create({
    data: { branch_id: branch.id, title: `Sesi ${TAG}`, scheduled_at: new Date(), status: 'published' },
  });

  // Tiga lot: dua dilelang, satu (nomor 2) sudah dibatalkan sejak awal supaya
  // jalur "lot batal di antrean" ikut terlewati.
  const lots = [];
  for (let n = 1; n <= 3; n++) {
    const aset = await p.assets.create({
      data: { provider_id: admin.user.id, category: 'mobil', title: `Unit ${TAG} ${n}`, base_price: HARGA_AWAL, status: 'approved' },
    });
    lots.push(await p.lots.create({
      data: {
        session_id: sesi.id, asset_id: aset.id, lot_number: n,
        starting_price: HARGA_AWAL, status: n === 2 ? 'cancelled' : 'pending',
      },
    }));
  }

  // Tiap peserta dibekali NIPL cukup untuk semua lot, supaya yang diuji
  // konkurensinya, bukan kuota jaminannya.
  const bidders = [];
  for (let i = 0; i < PESERTA; i++) {
    const u = await p.users.create({
      data: {
        email: `b${i}_${TAG}@t.test`,
        phone: `+62899${String(200000 + i).padStart(7, '0')}`,
        password_hash: hash, full_name: `Peserta ${i + 1}`, role: 'bidder', status: 'active',
      },
    });
    const dep = await p.deposits.create({
      data: {
        user_id: u.id, session_id: sesi.id, amount: 5_000_000 * 3 + i,
        unit_type: 'mobil', package_type: '3', unique_code: 200 + i,
        payment_method: 'manual_transfer', status: 'paid', paid_at: new Date(),
      },
    });
    for (let k = 0; k < 3; k++) {
      await p.nipl_codes.create({
        data: { deposit_id: dep.id, code: `NIPL-${TAG}-${i}-${k}`, unit_type: 'mobil', payment_unique_code: 1000 + i * 10 + k, status: 'active' },
      });
    }
    bidders.push(u);
  }
  console.log(`Data siap: 3 lot (lot 2 dibatalkan), ${PESERTA} peserta masing-masing 3 NIPL\n`);

  // ---------------------------------------------------------------- sambung
  const klien = [];
  const peristiwa = { closed: [], cancelled: [], start: [], sessionEnded: [], activated: [] };

  for (const b of bidders) {
    const s = await login(b.email, 'Uji123!');
    const sock = io(WS, { auth: (cb) => cb({ token: s.token }), transports: ['websocket'] });
    const k = { bidder: b, sock, balasan: [], update: 0, kalahCepat: 0, tolakSendiri: 0, errorLain: [], closed: [], beku: [], ended: 0 };

    sock.on('bid:update', () => { k.update++; });
    sock.on('bid:error', (d) => {
      k.balasan.push({ t: Date.now(), jenis: d.race_lost ? 'kalah-cepat' : 'error' });
      if (d.race_lost) k.kalahCepat++;
      // Pemenang ronde sebelumnya memang ditolak saat menawar lagi — dia sudah
      // pemegang harga tertinggi. Itu perilaku lelang yang benar, bukan cacat.
      else if (/penawaran tertinggi/i.test(d.message || '')) k.tolakSendiri++;
      else k.errorLain.push(d.message);
    });
    // Tiap peserta mencatat siarannya sendiri, supaya yang diperiksa adalah
    // "semua peserta menerima", bukan "ada satu yang menerima".
    sock.on('lot:closed', (d) => { k.closed.push(d); });
    sock.on('lot:cancelled', (d) => { k.beku.push({ ...d, dari: 'lot:cancelled' }); });
    sock.on('lot:start', (d) => { k.beku.push({ ...d, dari: 'lot:start' }); });
    sock.on('session:ended', () => { k.ended++; });
    sock.on('connect_error', (e) => k.errorLain.push('connect_error: ' + e.message));

    await new Promise((res, rej) => {
      sock.on('connect', res);
      sock.on('connect_error', rej);
      setTimeout(() => rej(new Error('timeout menyambung')), 10000);
    });
    // Persis seperti aplikasi peserta: masuk room sesi begitu tersambung,
    // supaya siaran sesi-lebar (lot batal, sesi ditutup) ikut diterima.
    sock.emit('bid:watch', { session_id: sesi.id });
    klien.push(k);
  }
  console.log(`${klien.length} peserta tersambung\n`);

  for (const k of klien) k.sock.emit('bid:watch', { lot_id: lots[0].id, session_id: sesi.id });
  await jeda(500);

  // ------------------------------------------------------------- jalankan
  console.log('Admin menjalankan sesi...\n');
  const mulai = Date.now();
  await adminPost(admin.token, `/admin/sessions/${sesi.id}/start`);

  const latensi = [];

  async function ronde(lot, hargaTarget, nomorRonde) {
    for (const k of klien) { k.balasan = []; }
    const t0 = Date.now();
    // Dilepas dalam satu putaran event loop: seluruh peserta menekan BID pada
    // milidetik yang sama, seperti detik-detik terakhir sebuah lot.
    klien.forEach((k) => k.sock.emit('bid:submit', { lot_id: lot.id, session_id: sesi.id, amount: hargaTarget }));

    // Tunggu sampai semua peserta menerima jawaban (menang atau kalah cepat).
    const batas = Date.now() + 15000;
    let terjawab = 0;
    while (Date.now() < batas) {
      terjawab = klien.filter((k) => k.balasan.length > 0).length;
      if (terjawab >= klien.length - 1) break; // pemenang tidak dapat bid:error
      await jeda(50);
    }
    const semua = klien.flatMap((k) => k.balasan.map((b) => b.t - t0));
    const terlama = semua.length ? Math.max(...semua) : -1;
    latensi.push({ lot: lot.lot_number, ronde: nomorRonde, terlama, terjawab });
    console.log(`  lot #${lot.lot_number} ronde ${nomorRonde}: ${klien.length} bid serentak di ${rp(hargaTarget)} — antrean terkuras ${terlama} ms, ${terjawab} peserta dijawab`);
  }

  async function jalankanLot(lot) {
    // Tunggu lot benar-benar aktif di basis data.
    const batas = Date.now() + 30000;
    while (Date.now() < batas) {
      const l = await p.lots.findUnique({ where: { id: lot.id } });
      if (l.status === 'active') break;
      await jeda(300);
    }
    for (const k of klien) k.sock.emit('bid:watch', { lot_id: lot.id, session_id: sesi.id });
    await jeda(300);

    let harga = HARGA_AWAL;
    for (let r = 1; r <= RONDE; r++) {
      harga += KELIPATAN;
      await ronde(lot, harga, r);
      await jeda(800);
    }

    console.log(`  lot #${lot.lot_number}: berhenti menawar, menunggu lot menutup sendiri...`);
    const tutupSebelum = Date.now() + (WAKTU_PERTAMA + 30) * 1000;
    while (Date.now() < tutupSebelum) {
      const l = await p.lots.findUnique({ where: { id: lot.id } });
      if (l.status !== 'active') {
        console.log(`  lot #${lot.lot_number} menutup sendiri sebagai '${l.status}' setelah ${Math.round((Date.now() - mulai) / 1000)}s sejak sesi mulai\n`);
        return l;
      }
      await jeda(500);
    }
    console.log(`  lot #${lot.lot_number} TIDAK menutup sendiri dalam batas waktu\n`);
    return await p.lots.findUnique({ where: { id: lot.id } });
  }

  const hasil1 = await jalankanLot(lots[0]);

  console.log('Menunggu lot batal dilewati dan lot 3 berjalan sendiri...\n');
  const hasil3 = await jalankanLot(lots[2]);

  console.log('Menunggu sesi menutup sendiri...\n');
  const batasSesi = Date.now() + 40000;
  let sesiAkhir = null;
  while (Date.now() < batasSesi) {
    sesiAkhir = await p.auction_sessions.findUnique({ where: { id: sesi.id } });
    if (sesiAkhir.status === 'closed') break;
    await jeda(500);
  }

  await jeda(1500);

  // ------------------------------------------------------------- periksa
  console.log('\n===== HASIL =====\n');

  const errorAneh = klien.flatMap((k) => k.errorLain);
  periksa('Tidak ada error di luar "kalah cepat"', errorAneh.length === 0, errorAneh.slice(0, 3).join(' | '));
  periksa('Semua peserta tetap tersambung sampai akhir', klien.every((k) => k.sock.connected));

  for (const l of [hasil1, hasil3]) {
    const bids = await p.bids.findMany({ where: { lot_id: l.id } });
    const menang = bids.filter((b) => b.is_winning);
    periksa(`Lot #${l.lot_number} menutup sendiri (status '${l.status}')`, l.status === 'sold' || l.status === 'unsold');
    periksa(`Lot #${l.lot_number} hanya punya satu bid pemenang`, menang.length === 1, `${menang.length} bid bertanda menang dari ${bids.length} bid`);

    const inv = await p.invoices.findMany({ where: { lot_id: l.id } });
    if (l.status === 'sold') {
      periksa(`Lot #${l.lot_number} terbit tepat satu tagihan`, inv.length === 1, `${inv.length} tagihan`);
      if (inv.length === 1) {
        const i = inv[0];
        const fee = Number(i.admin_fee);
        const total = Number(i.total);
        periksa(`Lot #${l.lot_number} biaya administrasi ${rp(fee)} sesuai tier`, fee === 3_000_000, `dapat ${rp(fee)}`);
        periksa(
          `Lot #${l.lot_number} total = ketok + admin + PMK`,
          total === Number(i.hammer_price) + fee + Number(i.pmk41_amount),
          `${rp(total)}`
        );
      }
    }
  }

  const lotBatal = await p.lots.findUnique({ where: { id: lots[1].id } });
  periksa('Lot yang dibatalkan tetap berstatus cancelled dan dilewati', lotBatal.status === 'cancelled');

  const terimaBeku = klien.filter((k) => k.beku.some((e) => e.is_canceled || e.dari === 'lot:cancelled'));
  periksa(
    'SEMUA peserta menerima siaran lot dibatalkan',
    terimaBeku.length === klien.length,
    `${terimaBeku.length}/${klien.length} peserta`
  );
  const bekuContoh = klien[0].beku.find((e) => e.is_canceled);
  periksa(
    'Siaran lot batal membawa durasi beku, bukan angka tetap di layar',
    !!bekuContoh && Number(bekuContoh.freeze_duration_secs) === BEKU_BATAL,
    bekuContoh ? `freeze_duration_secs=${bekuContoh.freeze_duration_secs}` : 'tidak ada siaran is_canceled'
  );

  const terimaTutup = klien.filter((k) => k.closed.length >= 2);
  periksa('SEMUA peserta menerima hasil kedua lot yang dilelang', terimaTutup.length === klien.length, `${terimaTutup.length}/${klien.length} peserta`);
  const contohTutup = klien[0].closed.find((d) => d.result === 'sold');
  periksa('Siaran hasil lot memuat pemenang dan harga akhir', !!contohTutup?.winner_name && !!contohTutup?.final_price, JSON.stringify(contohTutup || {}).slice(0, 120));
  periksa('Siaran lot terakhir ditandai is_last_lot', klien[0].closed.some((d) => d.is_last_lot === true));

  periksa('Sesi menutup sendiri', sesiAkhir?.status === 'closed', `status '${sesiAkhir?.status}'`);
  const terimaSelesai = klien.filter((k) => k.ended > 0);
  periksa('SEMUA peserta menerima siaran session:ended', terimaSelesai.length === klien.length, `${terimaSelesai.length}/${klien.length} peserta`);

  const tanpaUpdate = klien.filter((k) => k.update === 0);
  periksa('SEMUA peserta menerima siaran perubahan harga', tanpaUpdate.length === 0, `${tanpaUpdate.length} peserta tidak menerima satu pun bid:update`);

  const nyangkut = await p.lots.count({ where: { session_id: sesi.id, status: 'active' } });
  periksa('Tidak ada lot tertinggal berstatus active', nyangkut === 0, `${nyangkut} lot`);

  const totalRonde = latensi.length;
  const kalahTotal = klien.reduce((s, k) => s + k.kalahCepat, 0);
  periksa(
    'Tiap ronde hanya satu pemenang, sisanya dapat pesan "kalah cepat"',
    kalahTotal >= (klien.length - 1) * totalRonde * 0.9,
    `${kalahTotal} pesan kalah cepat dari harapan ~${(klien.length - 1) * totalRonde}`
  );

  console.log('\n----- antrean bid -----');
  const semuaLatensi = latensi.map((l) => l.terlama).filter((n) => n >= 0);
  for (const l of latensi) console.log(`  lot #${l.lot} ronde ${l.ronde}: ${l.terlama} ms`);
  if (semuaLatensi.length) {
    console.log(`  terlama keseluruhan: ${Math.max(...semuaLatensi)} ms untuk ${klien.length} bid serentak`);
    console.log(`  rata-rata per bid  : ${Math.round(Math.max(...semuaLatensi) / klien.length)} ms`);
  }

  console.log(`\n${lolos} lolos, ${gagal} gagal`);

  for (const k of klien) k.sock.close();
  await jeda(500);
  if (process.env.SIMPAN !== '1') await bersihkan();
  await p.$disconnect();
  process.exit(gagal === 0 ? 0 : 1);
})().catch(async (e) => {
  console.error('\nGladi resik berhenti:', e);
  await p.$disconnect();
  process.exit(1);
});
