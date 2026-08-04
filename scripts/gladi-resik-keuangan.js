/**
 * Gladi resik alur uang, dari beli NIPL sampai dana provider siap cair.
 *
 * Menjalankan tiap aksi lewat API sungguhan, lalu memeriksa DUA hal setiap
 * kali: keadaan di basis data, dan apa yang benar-benar DILIHAT masing-masing
 * pihak lewat endpoint mereka sendiri. Kelas cacat yang dicari adalah status
 * yang ditulis satu pihak tetapi tidak tertangkap penyaring pihak lain —
 * transaksi yang "hilang" dari layar admin atau peserta.
 *
 * Rantai yang dilalui:
 *
 *   beli NIPL          deposit 'pending'            admin: menunggu pembayaran
 *   unggah bukti       deposit 'pending_approval'   admin: menunggu approval
 *   admin setujui      deposit 'paid'               peserta: NIPL aktif
 *   menang lelang      invoice 'unpaid'             NIPL 'active' -> 'reserved'
 *                      settlement dibuat            lot 'sold', aset 'sold'
 *   checkout           invoice 'pending_checkout'   order 'unpaid'
 *   unggah bukti       order 'pending_approval'     admin: menunggu verifikasi
 *   admin verifikasi   order 'paid', invoice 'paid' NIPL 'reserved' -> 'used'
 *   minta refund       deposit 'pending_refund'     admin: menunggu refund
 *   admin refund       deposit 'refunded'           NIPL 'refunded'
 *
 * MENULIS BANYAK DATA. Menolak berjalan kecuali basis datanya localhost.
 *
 * Jalankan dengan server API lokal menyala:
 *   node scripts/gladi-resik-keuangan.js
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const p = new PrismaClient();
const API = process.env.API_BASE || 'http://localhost:8000/api/v1';
const ADMIN = { email: 'admin@indo-lelang.com', password: 'Admin123!' };
const TAG = 'gladiuang';

if (!/@(localhost|127\.0\.0\.1)[:/]/.test(process.env.DATABASE_URL || '')) {
  console.error('DITOLAK: DATABASE_URL bukan basis data lokal.');
  process.exit(1);
}

let lolos = 0;
let gagal = 0;
const periksa = (nama, syarat, rincian = '') => {
  if (syarat) { lolos++; console.log(`    LOLOS  ${nama}`); }
  else { gagal++; console.log(`    GAGAL  ${nama}${rincian ? ' -> ' + rincian : ''}`); }
};
const tahap = (n, teks) => console.log(`\n[${n}] ${teks}`);
const rp = (n) => 'Rp ' + Number(n).toLocaleString('id-ID');

async function req(method, path, token, body) {
  const r = await fetch(`${API}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const d = await r.json().catch(() => ({}));
  return { status: r.status, ok: r.ok, body: d, data: d.data };
}

async function login(email, password) {
  const r = await req('POST', '/auth/login', null, { email, password });
  if (!r.ok) throw new Error(`Login ${email} gagal: ${JSON.stringify(r.body).slice(0, 200)}`);
  return { token: r.data.accessToken, user: r.data.user };
}

async function bersihkan() {
  const sesi = await p.auction_sessions.findMany({ where: { title: { contains: TAG } } });
  for (const s of sesi) {
    const lots = await p.lots.findMany({ where: { session_id: s.id } });
    const ids = lots.map((l) => l.id);
    const inv = await p.invoices.findMany({ where: { lot_id: { in: ids } }, select: { id: true } });
    await p.bids.deleteMany({ where: { lot_id: { in: ids } } });
    await p.nipl_codes.deleteMany({ where: { invoice_id: { in: inv.map((i) => i.id) } } });
    await p.transaction_profiles.deleteMany({ where: { transaction_id: { in: inv.map((i) => i.id) } } });
    await p.settlements.deleteMany({ where: { lot_id: { in: ids } } });
    await p.invoices.deleteMany({ where: { lot_id: { in: ids } } });
    await p.lots.deleteMany({ where: { session_id: s.id } });
    await p.deposits.deleteMany({ where: { session_id: s.id } });
    await p.auction_sessions.delete({ where: { id: s.id } });
  }
  await p.assets.deleteMany({ where: { title: { contains: TAG } } });
  const dep = await p.deposits.findMany({ where: { user: { email: { contains: TAG } } }, select: { id: true } });
  await p.nipl_codes.deleteMany({ where: { deposit_id: { in: dep.map((d) => d.id) } } });
  await p.checkout_orders.deleteMany({ where: { bidder: { email: { contains: TAG } } } });
  await p.deposits.deleteMany({ where: { user: { email: { contains: TAG } } } });
  await p.notifications.deleteMany({ where: { user: { email: { contains: TAG } } } });
  await p.bidders.deleteMany({ where: { user: { email: { contains: TAG } } } });
  await p.users.deleteMany({ where: { email: { contains: TAG } } });
  await p.branches.deleteMany({ where: { name: { contains: TAG } } });
}

const kodeNipl = (depositId) => p.nipl_codes.findMany({ where: { deposit_id: depositId }, orderBy: { created_at: 'asc' } });
const hitungStatus = (arr) => arr.reduce((m, x) => ({ ...m, [x.status]: (m[x.status] || 0) + 1 }), {});

(async () => {
  console.log('\nGladi resik alur uang\n' + '='.repeat(50));
  await bersihkan();

  const admin = await login(ADMIN.email, ADMIN.password);
  const hash = await bcrypt.hash('Uji123!', 10);

  const branch = await p.branches.create({
    data: { tenant_id: 'default', name: `Cabang ${TAG}`, city: 'Jakarta', address: 'x', phone: '+62211', pic_name: 'x', is_active: true },
  });
  const sesi = await p.auction_sessions.create({
    data: { branch_id: branch.id, title: `Sesi ${TAG}`, scheduled_at: new Date(), status: 'published' },
  });

  const peserta = await p.users.create({
    data: {
      email: `peserta_${TAG}@t.test`, phone: '+628997654321', password_hash: hash,
      full_name: 'Peserta Keuangan', role: 'bidder', status: 'active',
    },
  });
  // Profil bidder wajib 'aktif' — createDeposit menolak kalau belum.
  await p.bidders.create({ data: { user_id: peserta.id, status: 'aktif' } });
  const sesiPeserta = await login(peserta.email, 'Uji123!');

  // Provider dibuat sebagai akun TERSENDIRI, bukan memakai akun admin.
  // Kalau keduanya orang yang sama, pemeriksaan "admin diberi tahu" dan
  // "provider diberi tahu" jatuh ke baris notifikasi yang sama dan tidak
  // membuktikan apa-apa.
  const provider = await p.users.create({
    data: {
      email: `provider_${TAG}@t.test`, phone: '+628991234567', password_hash: hash,
      full_name: 'Provider Keuangan', company_name: 'PT Uji Provider',
      role: 'provider', status: 'active',
    },
  });
  await p.providers.create({
    data: { user_id: provider.id, status: 'aktif', company_name: 'PT Uji Provider' },
  });

  // ---------------------------------------------------------------- tahap 1
  tahap(1, 'Peserta membeli NIPL (2 unit mobil)');
  const buat = await req('POST', '/deposits/create', sesiPeserta.token, {
    session_id: sesi.id, unit_type: 'mobil', package_type: '2', bank: 'bca',
  });
  periksa('Pembelian NIPL diterima API', buat.ok, `${buat.status} ${JSON.stringify(buat.body).slice(0, 160)}`);
  if (!buat.ok) throw new Error('berhenti: pembelian NIPL gagal');

  const depositId = buat.data.id;
  let dep = await p.deposits.findUnique({ where: { id: depositId } });
  periksa(`Deposit berstatus 'pending' (dapat '${dep.status}')`, dep.status === 'pending');
  // Kode NIPL memang sudah dicetak saat pembelian, tetapi yang menentukan hak
  // menawar adalah status DEPOSIT-nya. Jadi yang diperiksa di sini bukan
  // adanya kode, melainkan bahwa kuota belum diberikan sebelum dibayar.
  const kuotaSebelumBayar = await req('GET', '/nipl/status', sesiPeserta.token);
  const kuotaMobil = kuotaSebelumBayar.data?.mobil?.purchased ?? kuotaSebelumBayar.data?.mobil?.total ?? 0;
  periksa('NIPL yang belum dibayar TIDAK memberi kuota kepada peserta', Number(kuotaMobil) === 0,
    `/nipl/status membaca ${JSON.stringify(kuotaSebelumBayar.data || {}).slice(0, 140)}`);

  let adminLihat = await req('GET', '/deposits', admin.token);
  periksa('Admin melihat deposit ini di daftarnya', (adminLihat.data || []).some((d) => d.id === depositId));
  let pesertaLihat = await req('GET', '/deposits', sesiPeserta.token);
  periksa('Peserta melihat deposit ini di daftarnya', (pesertaLihat.data || []).some((d) => d.id === depositId));

  // ---------------------------------------------------------------- tahap 2
  tahap(2, 'Peserta mengunggah bukti transfer');
  const bukti = await req('POST', `/deposits/${depositId}/proof`, sesiPeserta.token, {
    transfer_proof_url: 'https://contoh/bukti-nipl.jpg',
  });
  periksa('Unggah bukti diterima', bukti.ok, `${bukti.status} ${JSON.stringify(bukti.body).slice(0, 160)}`);
  dep = await p.deposits.findUnique({ where: { id: depositId } });
  periksa(`Deposit pindah ke 'pending_approval' (dapat '${dep.status}')`, dep.status === 'pending_approval');

  adminLihat = await req('GET', '/deposits?status=pending_approval', admin.token);
  periksa('Admin menemukannya lewat saringan "Menunggu Approval"', (adminLihat.data || []).some((d) => d.id === depositId),
    `hanya ${(adminLihat.data || []).length} baris terbaca`);

  // ---------------------------------------------------------------- tahap 3
  tahap(3, 'Admin menyetujui pembayaran NIPL');
  const setuju = await req('PUT', `/deposits/${depositId}/mark-paid`, admin.token, {});
  periksa('Persetujuan diterima', setuju.ok, `${setuju.status} ${JSON.stringify(setuju.body).slice(0, 160)}`);
  dep = await p.deposits.findUnique({ where: { id: depositId } });
  periksa(`Deposit menjadi 'paid' (dapat '${dep.status}')`, dep.status === 'paid');

  let kode = await kodeNipl(depositId);
  periksa(`Terbit 2 kode NIPL berstatus aktif (dapat ${JSON.stringify(hitungStatus(kode))})`,
    kode.filter((k) => k.status === 'active').length === 2);
  periksa('Tiap kode punya kode unik pembayaran sendiri',
    new Set(kode.map((k) => k.payment_unique_code)).size === kode.length);

  // ---------------------------------------------------------------- tahap 4
  tahap(4, 'Peserta memenangkan satu lot');
  const aset = await p.assets.create({
    data: { provider_id: provider.id, category: 'mobil', title: `Unit ${TAG}`, base_price: 100_000_000, status: 'approved' },
  });
  const lot = await p.lots.create({
    data: { session_id: sesi.id, asset_id: aset.id, lot_number: 1, starting_price: 100_000_000, status: 'active' },
  });
  await p.bids.create({ data: { lot_id: lot.id, bidder_id: peserta.id, amount: 120_000_000, is_winning: true } });

  // Ditutup lewat endpoint Ruang Kontrol yang sungguhan, bukan memanggil
  // service langsung — supaya yang diuji jalur yang benar-benar dipakai admin.
  const tutup = await req('POST', `/admin/lots/${lot.id}/close`, admin.token, {});
  periksa('Admin menutup lot lewat Ruang Kontrol', tutup.ok, `${tutup.status} ${JSON.stringify(tutup.body).slice(0, 160)}`);

  const inv = await p.invoices.findFirst({ where: { lot_id: lot.id } });
  periksa('Tagihan pemenang terbit', !!inv);
  periksa(`Tagihan berstatus 'unpaid' (dapat '${inv?.status}')`, inv?.status === 'unpaid');
  periksa(`Biaya administrasi terpakai (${rp(inv?.admin_fee || 0)})`, Number(inv?.admin_fee) > 0);

  const lotSesudah = await p.lots.findUnique({ where: { id: lot.id } });
  const asetSesudah = await p.assets.findUnique({ where: { id: aset.id } });
  periksa(`Lot menjadi 'sold' (dapat '${lotSesudah.status}')`, lotSesudah.status === 'sold');
  periksa(`Aset menjadi 'sold' (dapat '${asetSesudah.status}')`, asetSesudah.status === 'sold');

  kode = await kodeNipl(depositId);
  periksa(`Satu kode NIPL disisihkan jadi 'reserved' (dapat ${JSON.stringify(hitungStatus(kode))})`,
    kode.filter((k) => k.status === 'reserved').length === 1 && kode.filter((k) => k.status === 'active').length === 1);
  periksa('Kode yang disisihkan terikat ke tagihan ini', kode.some((k) => k.status === 'reserved' && k.invoice_id === inv.id));

  const settle = await p.settlements.findFirst({ where: { lot_id: lot.id } });
  periksa('Settlement provider ikut terbit', !!settle, 'tidak ada baris settlement');
  periksa(`Settlement berstatus 'unpaid' selama tagihan belum lunas (dapat '${settle?.status}')`, settle?.status === 'unpaid');

  // --- Empat hal yang harus terjadi begitu sebuah unit terjual ---
  //
  // Bukan cuma datanya berubah: tiga pihak harus DIBERI TAHU. Peserta tahu ia
  // menang dan berapa tagihannya, admin tahu ada tagihan baru yang harus
  // ditunggu pembayarannya, dan provider tahu unitnya laku berikut berapa yang
  // akan ia terima. Tanpa ini mereka harus menebak atau bertanya.
  const notifPeserta = await p.notifications.findMany({ where: { user_id: peserta.id } });
  periksa('Peserta diberi tahu bahwa ia menang',
    notifPeserta.some((n) => n.type === 'bid_won'),
    `notif peserta: ${JSON.stringify(notifPeserta.map((n) => n.type))}`);

  const staf = await p.users.findMany({
    where: { role: { in: ['admin', 'superadmin', 'operator', 'finance'] } },
    select: { id: true },
  });
  // Disaring ke notifikasi yang benar-benar SOAL LOT INI. Sekadar menghitung
  // "ada notifikasi baru" akan tertipu oleh sisa tahap sebelumnya — misalnya
  // "Bukti Transfer NIPL Masuk" dari tahap 2 yang usianya juga masih muda.
  const semuaNotifStaf = await p.notifications.findMany({
    where: { user_id: { in: staf.map((s) => s.id) } },
    orderBy: { created_at: 'desc' },
  });
  const notifAdmin = semuaNotifStaf.filter(
    (n) => (n.body || '').includes(`Unit ${TAG}`) || (n.title || '').toLowerCase().includes('terjual')
  );
  periksa('Admin diberi tahu ada tagihan baru saat unit terjual',
    notifAdmin.length > 0,
    `notifikasi staf yang ada: ${semuaNotifStaf.map((n) => n.title).join(' | ') || '(kosong)'}`);
  periksa(`Notifikasi admin menyebut jumlah tagihannya (${rp(inv.total)})`,
    notifAdmin.some((n) => (n.body || '').includes(Number(inv.total).toLocaleString('id-ID'))),
    notifAdmin.length ? `isi notif: ${notifAdmin.map((n) => n.title).join(' | ')}` : 'tidak ada notif admin');

  const notifProvider = await p.notifications.findMany({ where: { user_id: provider.id } });
  const netProvider = Number(settle?.net_amount || 0);
  periksa('Provider diberi tahu unitnya terjual',
    notifProvider.some((n) => /terjual|laku|menang/i.test(n.title || '') || /terjual/i.test(n.body || '')),
    `notif provider: ${JSON.stringify(notifProvider.map((n) => n.type))}`);
  periksa(`Notifikasi provider menyebut berapa yang akan ia terima (${rp(netProvider)})`,
    notifProvider.some((n) => (n.body || '').includes(netProvider.toLocaleString('id-ID'))),
    'provider tidak diberi tahu nilai yang akan diterima');

  const keranjang = await req('GET', '/checkout/cart', sesiPeserta.token);
  const semuaInv = (keranjang.data?.groups || []).flatMap((g) => g.invoices || []);
  periksa('Tagihan muncul di keranjang peserta', semuaInv.some((i) => i.id === inv.id),
    `keranjang berisi ${semuaInv.length} tagihan`);

  // ---------------------------------------------------------------- tahap 5
  tahap(5, 'Peserta melakukan checkout dengan potongan NIPL');
  const co = await req('POST', '/checkout/checkout', sesiPeserta.token, {
    invoice_ids: [inv.id], bank: 'bca', use_nipl_invoice_ids: [inv.id],
  });
  periksa('Checkout diterima', co.ok, `${co.status} ${JSON.stringify(co.body).slice(0, 200)}`);
  const orderId = co.data?.id || co.data?.order_id;

  const invCo = await p.invoices.findUnique({ where: { id: inv.id } });
  periksa(`Tagihan pindah ke 'pending_checkout' (dapat '${invCo.status}')`, invCo.status === 'pending_checkout');
  periksa('Tagihan terikat ke order', invCo.order_id === orderId, `order_id=${invCo.order_id}`);
  periksa(`Potongan NIPL tercatat di tagihan (${rp(invCo.nipl_deduction)})`, Number(invCo.nipl_deduction) > 0);

  const order = await p.checkout_orders.findUnique({ where: { id: orderId } });
  periksa(`Order berstatus 'unpaid' (dapat '${order.status}')`, order.status === 'unpaid');
  periksa('Nominal transfer = subtotal dikurangi potongan NIPL ditambah kode unik',
    Number(order.final_amount) === Math.max(0, Number(order.subtotal_amount) - Number(order.deposit_deduction)) + Number(order.unique_code || 0) + Number(order.gateway_fee || 0),
    `subtotal ${rp(order.subtotal_amount)} potongan ${rp(order.deposit_deduction)} kode ${order.unique_code} final ${rp(order.final_amount)}`);

  // ---------------------------------------------------------------- tahap 6
  tahap(6, 'Peserta mengunggah bukti transfer pelunasan');
  const bukti2 = await req('POST', `/checkout/${orderId}/proof`, sesiPeserta.token, {
    transfer_proof_url: 'https://contoh/bukti-pelunasan.jpg',
  });
  periksa('Unggah bukti pelunasan diterima', bukti2.ok, `${bukti2.status} ${JSON.stringify(bukti2.body).slice(0, 160)}`);
  const orderBukti = await p.checkout_orders.findUnique({ where: { id: orderId } });
  periksa(`Order pindah ke 'pending_approval' (dapat '${orderBukti.status}')`, orderBukti.status === 'pending_approval');

  const daftarAdmin = await req('GET', '/checkout/admin/orders', admin.token);
  const barisAdmin = (daftarAdmin.data || []).find((o) => o.id === orderId);
  periksa('Admin melihat order menunggu verifikasi', !!barisAdmin, `admin membaca ${(daftarAdmin.data || []).length} order`);

  // ---------------------------------------------------------------- tahap 7
  tahap(7, 'Admin memverifikasi pelunasan');
  const verif = await req('POST', `/checkout/admin/orders/${orderId}/verify`, admin.token, { status: 'paid' });
  periksa('Verifikasi diterima', verif.ok, `${verif.status} ${JSON.stringify(verif.body).slice(0, 200)}`);

  const orderLunas = await p.checkout_orders.findUnique({ where: { id: orderId } });
  const invLunas = await p.invoices.findUnique({ where: { id: inv.id } });
  periksa(`Order menjadi 'paid' (dapat '${orderLunas.status}')`, orderLunas.status === 'paid');
  periksa(`Tagihan menjadi 'paid' (dapat '${invLunas.status}')`, invLunas.status === 'paid');
  periksa('Waktu pelunasan tercatat', !!invLunas.paid_at);

  kode = await kodeNipl(depositId);
  periksa(`Kode NIPL yang dipakai menjadi 'used' (dapat ${JSON.stringify(hitungStatus(kode))})`,
    kode.filter((k) => k.status === 'used').length === 1);

  const settleLunas = await p.settlements.findFirst({ where: { lot_id: lot.id } });
  periksa(`Settlement provider siap dicairkan (dapat '${settleLunas?.status}')`, settleLunas?.status === 'pending',
    `masih '${settleLunas?.status}' setelah pembeli melunasi`);

  const buku = await req('GET', '/payments/income', admin.token);
  if (buku.ok) {
    const adaBiayaAdmin = (buku.data || []).some((e) => e.category === 'biaya_admin');
    periksa('Biaya administrasi masuk buku pemasukan', adaBiayaAdmin, `${(buku.data || []).length} baris pemasukan`);
  } else {
    console.log(`    (buku pemasukan tidak diperiksa: ${buku.status})`);
  }

  // ---------------------------------------------------------------- tahap 8
  tahap(8, 'Peserta meminta refund sisa NIPL, admin memprosesnya');

  // Saat sebagian NIPL terpakai, checkout memindahkan sisanya ke deposit
  // pengganti dan menandai deposit asal 'consumed'. Refund harus menyasar
  // deposit pengganti itu — inilah yang dilihat peserta sebagai sisa jaminan.
  const depAsal = await p.deposits.findUnique({ where: { id: depositId } });
  periksa(`Deposit asal ditandai 'consumed' setelah NIPL-nya terpakai (dapat '${depAsal.status}')`, depAsal.status === 'consumed');

  const semuaDeposit = await p.deposits.findMany({ where: { user_id: peserta.id }, orderBy: { created_at: 'asc' } });
  const depSisa = semuaDeposit.find((d) => d.id !== depositId && d.status === 'paid');
  periksa('Sisa jaminan pindah ke deposit pengganti berstatus paid', !!depSisa,
    `deposit peserta: ${JSON.stringify(semuaDeposit.map((d) => d.status))}`);
  if (!depSisa) throw new Error('berhenti: deposit pengganti tidak ditemukan');

  const sisaKode = await kodeNipl(depSisa.id);
  periksa(`Deposit pengganti memegang kode NIPL yang belum terpakai (dapat ${JSON.stringify(hitungStatus(sisaKode))})`,
    sisaKode.length === 1);

  const daftarPeserta = await req('GET', '/deposits', sesiPeserta.token);
  periksa('Peserta melihat deposit sisa itu di daftarnya', (daftarPeserta.data || []).some((d) => d.id === depSisa.id));

  const depositRefund = depSisa.id;
  const minta = await req('POST', `/deposits/${depositRefund}/request-refund`, sesiPeserta.token, {});
  periksa('Permintaan refund diterima', minta.ok, `${minta.status} ${JSON.stringify(minta.body).slice(0, 160)}`);
  dep = await p.deposits.findUnique({ where: { id: depositRefund } });
  periksa(`Deposit pindah ke 'pending_refund' (dapat '${dep.status}')`, dep.status === 'pending_refund');

  const antrean = await req('GET', '/deposits?status=pending_refund', admin.token);
  periksa('Admin menemukannya lewat saringan "Menunggu Refund"', antrean.ok && (antrean.data || []).some((d) => d.id === depositRefund),
    `${antrean.status} — ${(antrean.data || []).length} baris`);

  const refund = await req('PUT', `/deposits/${depositRefund}/mark-refunded`, admin.token, {});
  periksa('Refund diproses admin', refund.ok, `${refund.status} ${JSON.stringify(refund.body).slice(0, 160)}`);
  dep = await p.deposits.findUnique({ where: { id: depositRefund } });
  periksa(`Deposit menjadi 'refunded' (dapat '${dep.status}')`, dep.status === 'refunded');

  const kodeSisa = await kodeNipl(depositRefund);
  const kodeTerpakai = await kodeNipl(depositId);
  periksa(`Kode sisa menjadi 'refunded' (dapat ${JSON.stringify(hitungStatus(kodeSisa))})`,
    kodeSisa.every((k) => k.status === 'refunded'));
  periksa(`Kode yang sudah terpakai TIDAK ikut direfund (dapat ${JSON.stringify(hitungStatus(kodeTerpakai))})`,
    kodeTerpakai.every((k) => k.status === 'used'));

  console.log('\n' + '='.repeat(50));
  console.log(`${lolos} lolos, ${gagal} gagal`);

  if (process.env.SIMPAN !== '1') await bersihkan();
  await p.$disconnect();
  process.exit(gagal === 0 ? 0 : 1);
})().catch(async (e) => {
  console.error('\nGladi resik berhenti:', e.message || e);
  console.log(`\n${lolos} lolos, ${gagal} gagal (berhenti di tengah)`);
  await p.$disconnect();
  process.exit(1);
});
