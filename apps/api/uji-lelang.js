/**
 * Pengujian lelang lokal lewat server sungguhan.
 *
 * Menyiapkan sesi uji, lalu menghubungkan beberapa peserta sebagai klien
 * socket.io asli — persis seperti aplikasi peserta — untuk membuktikan
 * perilaku yang baru diperbaiki benar-benar sampai ke layar mereka:
 *
 *   - jaminan NIPL berkurang tepat saat menang
 *   - kalah cepat dijawab dengan bahasa lelang, bukan pesan kesalahan
 *   - jumlah penawar di harga yang sama disiarkan ke semua peserta
 *   - tombol BID terkunci saat NIPL habis
 *
 * Jalankan dari apps/api:  node uji-lelang.js
 * Aman dihapus setelah selesai.
 */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const { io } = require('socket.io-client');

const p = new PrismaClient();
const API = process.env.API_BASE || 'http://localhost:8000/api/v1';
const WS = process.env.WS_BASE || 'http://localhost:8000';
const ADMIN = { email: 'admin@indo-lelang.com', password: 'Admin123!' };
const TAG = 'ujilelang';
const HARGA = 100_000_000;
const KELIPATAN = 500_000;

if (!/@(localhost|127\.0\.0\.1)[:/]/.test(process.env.DATABASE_URL || '')) {
  console.error('DITOLAK: DATABASE_URL bukan database lokal.');
  process.exit(1);
}

const jeda = (ms) => new Promise((r) => setTimeout(r, ms));
const rp = (n) => Number(n).toLocaleString('id-ID');

let lolos = 0;
let gagal = 0;
function periksa(nama, syarat, rincian = '') {
  if (syarat) {
    lolos++;
    console.log(`  LOLOS  ${nama}`);
  } else {
    gagal++;
    console.log(`  GAGAL  ${nama}${rincian ? ' -> ' + rincian : ''}`);
  }
}

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

async function bersihkan() {
  await p.nipl_codes.deleteMany({ where: { deposit: { user: { email: { contains: TAG } } } } });
  const sesi = await p.auction_sessions.findMany({ where: { title: { contains: TAG } } });
  for (const s of sesi) {
    const lots = await p.lots.findMany({ where: { session_id: s.id } });
    const ids = lots.map((l) => l.id);
    await p.bids.deleteMany({ where: { lot_id: { in: ids } } });
    await p.nipl_codes.deleteMany({ where: { invoice: { lot_id: { in: ids } } } });
    await p.invoices.deleteMany({ where: { lot_id: { in: ids } } });
    await p.settlements.deleteMany({ where: { lot_id: { in: ids } } });
    await p.lots.deleteMany({ where: { session_id: s.id } });
    await p.assets.deleteMany({ where: { title: { contains: TAG } } });
    await p.deposits.deleteMany({ where: { session_id: s.id } });
    await p.auction_sessions.delete({ where: { id: s.id } });
  }
  await p.deposits.deleteMany({ where: { user: { email: { contains: TAG } } } });
  await p.users.deleteMany({ where: { email: { contains: TAG } } });
  await p.branches.deleteMany({ where: { name: { contains: TAG } } });
}

(async () => {
  console.log('Menyiapkan data uji...\n');
  await bersihkan();

  const admin = await login(ADMIN.email, ADMIN.password);
  const hash = await bcrypt.hash('Uji123!', 10);

  const branch = await p.branches.create({
    data: { tenant_id: 'default', name: `Cabang ${TAG}`, city: 'Jakarta', address: 'x', phone: '+62211', pic_name: 'x', is_active: true },
  });
  const sesi = await p.auction_sessions.create({
    data: { branch_id: branch.id, title: `Sesi ${TAG}`, scheduled_at: new Date(), status: 'published' },
  });

  // Tiga peserta: dua dengan 2 NIPL, satu dengan 1 NIPL (untuk menguji kunci
  // tombol saat jaminannya habis).
  const bidders = [];
  for (const [i, jumlahNipl] of [2, 2, 1].entries()) {
    const u = await p.users.create({
      data: {
        email: `b${i}_${TAG}@t.test`,
        phone: `+62899${String(100000 + i).padStart(7, '0')}`,
        password_hash: hash,
        full_name: `Peserta Uji ${i + 1}`,
        role: 'bidder',
        status: 'active',
      },
    });
    const dep = await p.deposits.create({
      data: {
        user_id: u.id, session_id: sesi.id,
        amount: 5_000_000 * jumlahNipl + 100 + i,
        unit_type: 'mobil', package_type: String(jumlahNipl),
        unique_code: 100 + i, payment_method: 'manual_transfer',
        status: 'paid', paid_at: new Date(),
      },
    });
    for (let k = 0; k < jumlahNipl; k++) {
      await p.nipl_codes.create({
        data: {
          deposit_id: dep.id, code: `NIPL-${TAG}-${i}-${k}`,
          unit_type: 'mobil', payment_unique_code: 100 + i * 10 + k, status: 'active',
        },
      });
    }
    bidders.push({ ...u, jumlahNipl });
  }

  for (let n = 1; n <= 2; n++) {
    const aset = await p.assets.create({
      data: { provider_id: admin.user.id, category: 'mobil', title: `Unit ${TAG} ${n}`, base_price: HARGA, status: 'approved' },
    });
    await p.lots.create({
      data: { session_id: sesi.id, asset_id: aset.id, lot_number: n, starting_price: HARGA, status: 'pending' },
    });
  }

  console.log(`Sesi "${sesi.title}" siap: 2 lot, 3 peserta (NIPL: 2, 2, 1)\n`);

  // Sambungkan peserta sebagai klien socket.io asli
  const klien = [];
  for (const b of bidders) {
    const sesiLogin = await login(b.email, 'Uji123!');
    const sock = io(WS, { auth: (cb) => cb({ token: sesiLogin.token }), transports: ['websocket', 'polling'] });
    const diterima = { error: [], contested: [], update: [] };
    sock.on('bid:error', (d) => diterima.error.push(d));
    sock.on('bid:contested', (d) => diterima.contested.push(d));
    sock.on('bid:update', (d) => diterima.update.push(d));
    await new Promise((res, rej) => {
      sock.on('connect', res);
      sock.on('connect_error', rej);
      setTimeout(() => rej(new Error('timeout menyambung')), 8000);
    });
    klien.push({ bidder: b, sock, diterima, token: sesiLogin.token });
  }
  console.log(`${klien.length} peserta tersambung ke server soket\n`);

  await adminPost(admin.token, `/admin/sessions/${sesi.id}/start`);
  await jeda(1500);

  const lotAktif = await p.lots.findFirstOrThrow({ where: { session_id: sesi.id, status: 'active' } });
  klien.forEach((k) => k.sock.emit('bid:watch', { lot_id: lotAktif.id, session_id: sesi.id }));
  await jeda(1000);

  console.log('=== UJI 1: tiga peserta menawar bersamaan di harga yang sama ===');
  const tawaran = HARGA + KELIPATAN;
  klien.forEach((k) => k.sock.emit('bid:submit', { lot_id: lotAktif.id, session_id: sesi.id, amount: tawaran }));
  await jeda(2500);

  const bidTersimpan = await p.bids.count({ where: { lot_id: lotAktif.id } });
  periksa('hanya satu penawaran tersimpan', bidTersimpan === 1, `tersimpan ${bidTersimpan}`);

  const semuaError = klien.flatMap((k) => k.diterima.error);
  const kalahCepat = semuaError.filter((e) => e.race_lost === true);
  periksa('dua peserta menerima penanda kalah cepat', kalahCepat.length === 2, `dapat ${kalahCepat.length}`);

  const contohPesan = kalahCepat[0]?.message || '(tidak ada)';
  periksa('pesannya memakai bahasa lelang, bukan "penawaran minimal"',
    /kalah cepat/i.test(contohPesan) && !/penawaran minimal/i.test(contohPesan), contohPesan);
  console.log(`         pesan: "${contohPesan}"`);

  const contested = klien.flatMap((k) => k.diterima.contested);
  const puncak = Math.max(0, ...contested.map((c) => c.contenders || 0));
  periksa('jumlah penawar disiarkan dan mencapai 3', puncak === 3, `puncak ${puncak}`);
  periksa('siaran jumlah penawar sampai ke semua peserta',
    klien.every((k) => k.diterima.contested.length > 0));

  console.log('\n=== UJI 2: NIPL berkurang saat menang ===');
  const pemenangBid = await p.bids.findFirstOrThrow({ where: { lot_id: lotAktif.id } });
  const pemenang = klien.find((k) => k.bidder.id === pemenangBid.bidder_id);
  const sebelum = await p.nipl_codes.count({
    where: { status: 'active', deposit: { user_id: pemenang.bidder.id, status: 'paid' } },
  });

  await adminPost(admin.token, `/admin/lots/${lotAktif.id}/close`);
  await jeda(2500);

  const sesudah = await p.nipl_codes.count({
    where: { status: 'active', deposit: { user_id: pemenang.bidder.id, status: 'paid' } },
  });
  const disisihkan = await p.nipl_codes.count({
    where: { status: 'reserved', deposit: { user_id: pemenang.bidder.id } },
  });
  const tagihan = await p.invoices.findFirst({ where: { lot_id: lotAktif.id } });

  console.log(`         pemenang: ${pemenang.bidder.full_name}, NIPL ${sebelum} -> ${sesudah}`);
  periksa('NIPL bebas berkurang satu', sesudah === sebelum - 1, `${sebelum} -> ${sesudah}`);
  periksa('satu kode disisihkan untuk tagihan', disisihkan === 1, `disisihkan ${disisihkan}`);
  periksa('tagihan terbit dan belum lunas', tagihan?.status === 'unpaid');
  periksa('hanya satu tagihan untuk lot ini',
    (await p.invoices.count({ where: { lot_id: lotAktif.id } })) === 1);

  console.log('\n=== UJI 3: data yang mengunci tombol BID ===');
  for (const k of klien) {
    const bebas = await p.nipl_codes.count({
      where: { status: 'active', deposit: { user_id: k.bidder.id, status: 'paid' } },
    });
    const r = await fetch(`${API}/deposits`, { headers: { Authorization: `Bearer ${k.token}` } });
    const d = await r.json();
    const dariApi = (d.data || []).reduce(
      (t, dep) => t + (dep.status === 'paid' ? (dep.nipl_codes || []).filter((c) => c.status === 'active').length : 0), 0);
    periksa(`${k.bidder.full_name}: sisa NIPL di API cocok dengan database (${bebas})`, dariApi === bebas, `api ${dariApi}`);
  }

  const habis = klien.find((k) => k.bidder.jumlahNipl === 1 && k.bidder.id === pemenangBid.bidder_id);
  if (habis) {
    const bebas = await p.nipl_codes.count({
      where: { status: 'active', deposit: { user_id: habis.bidder.id, status: 'paid' } },
    });
    periksa('peserta dengan 1 NIPL yang menang kini tidak punya sisa (tombol terkunci)', bebas === 0, `sisa ${bebas}`);
  } else {
    console.log('  LEWAT  peserta 1-NIPL tidak menang di putaran ini, penguncian tombol tidak teruji di sini');
  }

  klien.forEach((k) => k.sock.disconnect());
  await jeda(500);

  console.log(`\n=== HASIL: ${lolos} lolos, ${gagal} gagal ===`);
  console.log('\nMembersihkan data uji...');
  await bersihkan();
  await p.$disconnect();
  process.exit(gagal > 0 ? 1 : 0);
})().catch(async (e) => {
  console.error('\nGAGAL DIJALANKAN:', e.message);
  try { await bersihkan(); } catch {}
  await p.$disconnect();
  process.exit(1);
});
