/**
 * Gladi resik pencairan dana provider.
 *
 * Memeriksa dua hal yang tidak bisa dijawab dengan membaca kode saja:
 *
 *   1. Apakah angka yang diterima provider benar-benar mengikuti setelan di
 *      Pengaturan Platform — bukan angka yang dipatok mati di dalam kode.
 *      Diuji dengan MENGUBAH setelannya lalu melihat hasilnya ikut berubah.
 *
 *   2. Apakah uangnya utuh: yang dibayar pemenang = yang diterima provider +
 *      yang ditahan platform. Tidak ada rupiah yang lahir atau hilang.
 *
 * Perhitungan pembandingnya ditulis ULANG di sini langsung dari rumus pajak,
 * bukan disalin dari payments.service.ts. Kalau keduanya cuma saling menyalin,
 * pengujiannya tidak membuktikan apa-apa.
 *
 * MENULIS DATA. Menolak berjalan kecuali basis datanya localhost.
 *
 * Jalankan dengan server API lokal menyala:
 *   node scripts/gladi-resik-pencairan.js
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const p = new PrismaClient();
const API = process.env.API_BASE || 'http://localhost:8000/api/v1';
const ADMIN = { email: 'admin@indo-lelang.com', password: 'Admin123!' };
const TAG = 'gladicair';

if (!/@(localhost|127\.0\.0\.1)[:/]/.test(process.env.DATABASE_URL || '')) {
  console.error('DITOLAK: DATABASE_URL bukan basis data lokal.');
  process.exit(1);
}

let lolos = 0;
let gagal = 0;
const periksa = (nama, syarat, rincian = '') => {
  if (syarat) { lolos++; console.log(`    LOLOS  ${nama}`); }
  else { gagal++; console.log(`    GAGAL  ${nama}${rincian ? '\n           ' + rincian : ''}`); }
};
const rp = (n) => 'Rp ' + Number(n).toLocaleString('id-ID');
const judul = (t) => console.log(`\n${'='.repeat(66)}\n${t}\n${'='.repeat(66)}`);

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

async function setelan(key, value) {
  const ada = await p.platform_settings.findFirst({ where: { key } });
  if (ada) await p.platform_settings.update({ where: { id: ada.id }, data: { value: String(value) } });
  else await p.platform_settings.create({ data: { tenant_id: 'default', key, value: String(value), is_encrypted: false } });
}

/**
 * Hitungan pembanding, ditulis dari rumus pajaknya — bukan dari kode layanan.
 *
 *   fee lelang       = persentase dari harga ketok, atau nilai tetap
 *   DPP              = fee dikeluarkan PPN-nya
 *   DPP Nilai Lain   = DPP dikali pengali
 *   PPN              = DPP Nilai Lain dikali tarif PPN
 *   PPh 23           = (fee - PPN) dikali tarif PPh 23, DIPOTONG dari fee platform
 *   diterima provider= harga ketok - fee bersih (+ PMK41 bila provider menanggung)
 */
function hitungHarapan({ hammer, feeType, feeAmount, taxPct, dppLainMul, ppnPct, pph23Pct, pmk41Pct, pmk41OlehProvider }) {
  const fee = feeType === 'flat' ? feeAmount : Math.round(hammer * (feeAmount / 100));
  const dpp = Math.round(fee / (1 + taxPct / 100));
  const dppLain = Math.round(dpp * dppLainMul);
  const ppn = Math.round(dppLain * (ppnPct / 100));
  const pph23 = Math.round((fee - ppn) * (pph23Pct / 100));
  const feeBersih = fee - pph23;
  const pmk41 = pmk41OlehProvider ? Math.round(hammer * (pmk41Pct / 100)) : 0;
  return { fee, dpp, dppLain, ppn, pph23, feeBersih, pmk41, net: hammer - feeBersih + pmk41 };
}

async function bersihkan() {
  const sesi = await p.auction_sessions.findMany({ where: { title: { contains: TAG } } });
  for (const s of sesi) {
    const lots = await p.lots.findMany({ where: { session_id: s.id } });
    const ids = lots.map((l) => l.id);
    const inv = await p.invoices.findMany({ where: { lot_id: { in: ids } }, select: { id: true } });
    const set = await p.settlements.findMany({ where: { lot_id: { in: ids } }, select: { id: true } });
    await p.bids.deleteMany({ where: { lot_id: { in: ids } } });
    await p.nipl_codes.deleteMany({ where: { invoice_id: { in: inv.map((i) => i.id) } } });
    await p.transaction_profiles.deleteMany({ where: { transaction_id: { in: [...inv.map((i) => i.id), ...set.map((x) => x.id)] } } });
    await p.settlements.deleteMany({ where: { lot_id: { in: ids } } });
    await p.invoices.deleteMany({ where: { lot_id: { in: ids } } });
    await p.lots.deleteMany({ where: { session_id: s.id } });
    await p.deposits.deleteMany({ where: { session_id: s.id } });
    await p.auction_sessions.delete({ where: { id: s.id } });
  }
  await p.assets.deleteMany({ where: { title: { contains: TAG } } });
  await p.notifications.deleteMany({ where: { user: { email: { contains: TAG } } } });
  await p.providers.deleteMany({ where: { user: { email: { contains: TAG } } } });
  await p.users.deleteMany({ where: { email: { contains: TAG } } });
  await p.branches.deleteMany({ where: { name: { contains: TAG } } });
}

(async () => {
  console.log('\nGladi resik pencairan dana provider');
  await bersihkan();

  const admin = await login(ADMIN.email, ADMIN.password);
  const hash = await bcrypt.hash('Uji123!', 10);

  // Setelan sengaja dipakai angka yang mudah ditelusuri dengan tangan.
  const TAX = 11, DPP_LAIN = '11/12', PPN = 12, PPH23 = 2, PMK41 = 1.1;
  const DEFAULT_FEE = 1.5;
  await setelan('tax_percentage', TAX);
  await setelan('dpp_lain_multiplier', DPP_LAIN);
  await setelan('ppn_dpp_lain_percentage', PPN);
  await setelan('pph23_percentage', PPH23);
  await setelan('pmk41_percentage', PMK41);
  await setelan('default_provider_fee_type', 'percentage');
  await setelan('commission_percentage', DEFAULT_FEE);
  await setelan('admin_fee_tiers', JSON.stringify([
    { max_price: 500000000, fee_type: 'flat', fee: 3000000 },
    { max_price: null, fee_type: 'percentage', fee: 0.6 },
  ]));

  const branch = await p.branches.create({
    data: { tenant_id: 'default', name: `Cabang ${TAG}`, city: 'Jakarta', address: 'x', phone: '+62211', pic_name: 'x', is_active: true },
  });
  const sesi = await p.auction_sessions.create({
    data: { branch_id: branch.id, title: `Sesi ${TAG}`, scheduled_at: new Date(), status: 'published' },
  });
  const pemenang = await p.users.create({
    data: { email: `menang_${TAG}@t.test`, phone: '+628990000001', password_hash: hash, full_name: 'Pemenang', role: 'bidder', status: 'active' },
  });

  const HARGA = 100_000_000;
  let nomorLot = 0;

  /**
   * Jual satu unit milik provider dengan konfigurasi tertentu, lalu bandingkan
   * hasil sistem dengan hitungan pembanding.
   */
  async function ujiSkenario(nama, { feeType, feeAmount, pakaiDefault, defaultBerlaku, pmk41OlehProvider }) {
    // Ketika provider tidak punya fee sendiri, pembanding harus memakai nilai
    // default yang SEDANG berlaku di pengaturan — bukan konstanta di skrip ini.
    // Kalau dipatok, pengujian "setelan berpengaruh" akan menuduh sistem salah
    // padahal justru sistemnya yang benar mengikuti setelan baru.
    const feeDefault = defaultBerlaku ?? DEFAULT_FEE;
    judul(nama);
    nomorLot++;

    const provUser = await p.users.create({
      data: {
        email: `prov${nomorLot}_${TAG}@t.test`, phone: `+62899000100${nomorLot}`, password_hash: hash,
        full_name: `Provider ${nomorLot}`, company_name: `PT Uji ${nomorLot}`, role: 'provider', status: 'active',
        provider_fee_type: pakaiDefault ? null : feeType,
        provider_fee_amount: pakaiDefault ? null : feeAmount,
        pmk41_paid_by_provider: !!pmk41OlehProvider,
      },
    });
    await p.providers.create({
      data: { user_id: provUser.id, status: 'aktif', company_name: `PT Uji ${nomorLot}` },
    });

    const aset = await p.assets.create({
      data: { provider_id: provUser.id, category: 'mobil', title: `Unit ${TAG} ${nomorLot}`, base_price: HARGA, status: 'approved' },
    });
    const lot = await p.lots.create({
      data: { session_id: sesi.id, asset_id: aset.id, lot_number: nomorLot, starting_price: HARGA, status: 'active' },
    });
    await p.bids.create({ data: { lot_id: lot.id, bidder_id: pemenang.id, amount: HARGA, is_winning: true } });

    const tutup = await req('POST', `/admin/lots/${lot.id}/close`, admin.token, {});
    if (!tutup.ok) { periksa('Lot bisa ditutup', false, JSON.stringify(tutup.body).slice(0, 160)); return; }

    const inv = await p.invoices.findFirst({ where: { lot_id: lot.id } });
    const set = await p.settlements.findFirst({ where: { lot_id: lot.id } });

    const harap = hitungHarapan({
      hammer: HARGA,
      feeType: pakaiDefault ? 'percentage' : feeType,
      feeAmount: pakaiDefault ? feeDefault : feeAmount,
      taxPct: TAX, dppLainMul: 11 / 12, ppnPct: PPN, pph23Pct: PPH23,
      pmk41Pct: PMK41, pmk41OlehProvider,
    });

    console.log(`  Harga ketok ${rp(HARGA)} · fee ${pakaiDefault ? 'default ' + feeDefault + '%' : (feeType === 'flat' ? rp(feeAmount) : feeAmount + '%')}`);
    console.log(`  Rincian: fee ${rp(harap.fee)} | DPP ${rp(harap.dpp)} | DPP lain ${rp(harap.dppLain)} | PPN ${rp(harap.ppn)} | PPh23 ${rp(harap.pph23)}`);
    console.log('');

    periksa(`Fee lelang ${rp(harap.fee)} sesuai setelan`,
      Number(set.commission_deducted) === harap.feeBersih,
      `sistem: ${rp(set.commission_deducted)} (fee bersih setelah PPh23), harapan ${rp(harap.feeBersih)}`);
    periksa(`DPP ${rp(harap.dpp)}`, Number(set.fee_dpp) === harap.dpp, `sistem ${rp(set.fee_dpp)}`);
    periksa(`DPP Nilai Lain ${rp(harap.dppLain)}`, Number(set.fee_dpp_lain) === harap.dppLain, `sistem ${rp(set.fee_dpp_lain)}`);
    periksa(`PPN ${rp(harap.ppn)}`, Number(set.fee_ppn) === harap.ppn, `sistem ${rp(set.fee_ppn)}`);
    periksa(`PPh 23 ${rp(harap.pph23)}`, Number(set.fee_pph23) === harap.pph23, `sistem ${rp(set.fee_pph23)}`);
    periksa(`PMK 41 ${rp(harap.pmk41)}`, Number(set.pmk41_amount) === harap.pmk41, `sistem ${rp(set.pmk41_amount)}`);
    periksa(`PROVIDER MENERIMA ${rp(harap.net)}`, Number(set.net_amount) === harap.net,
      `sistem ${rp(set.net_amount)}, harapan ${rp(harap.net)}`);

    // --- Uang harus utuh ---
    const dibayarPemenang = Number(inv.total);
    const diterimaProvider = Number(set.net_amount);
    const ditahanPlatform = dibayarPemenang - diterimaProvider;
    console.log('');
    console.log(`  Pemenang membayar   ${rp(dibayarPemenang)}`);
    console.log(`  Provider menerima   ${rp(diterimaProvider)}`);
    console.log(`  Platform menahan    ${rp(ditahanPlatform)}`);

    const pmk41Tagihan = Number(inv.pmk41_amount);
    const harapDitahan = Number(inv.admin_fee) + harap.feeBersih + pmk41Tagihan - harap.pmk41;
    periksa('Uang utuh: bayar pemenang = terima provider + tahan platform',
      ditahanPlatform === harapDitahan,
      `platform menahan ${rp(ditahanPlatform)}, seharusnya ${rp(harapDitahan)}`);
    periksa('Platform tidak menahan nilai negatif', ditahanPlatform >= 0,
      `platform justru mengeluarkan ${rp(-ditahanPlatform)} lebih banyak daripada yang diterimanya`);

    return { set, inv, harap, ditahanPlatform };
  }

  await ujiSkenario('SKENARIO 1 — fee persentase 3%, PMK41 ditanggung pemenang',
    { feeType: 'percentage', feeAmount: 3, pmk41OlehProvider: false });

  await ujiSkenario('SKENARIO 2 — fee tetap Rp 2.500.000, PMK41 ditanggung pemenang',
    { feeType: 'flat', feeAmount: 2_500_000, pmk41OlehProvider: false });

  await ujiSkenario('SKENARIO 3 — provider tanpa fee sendiri, harus pakai default dari pengaturan',
    { pakaiDefault: true, pmk41OlehProvider: false });

  const s4 = await ujiSkenario('SKENARIO 4 — PMK41 DITANGGUNG PROVIDER',
    { feeType: 'percentage', feeAmount: 3, pmk41OlehProvider: true });

  // --- Setelan benar-benar berpengaruh? ---
  judul('SKENARIO 5 — fee lelang diubah di Pengaturan, hasilnya harus ikut berubah');
  await setelan('commission_percentage', 5);
  const s5 = await ujiSkenario('  (provider tanpa fee sendiri, default kini 5%)',
    { pakaiDefault: true, defaultBerlaku: 5, pmk41OlehProvider: false });
  await setelan('commission_percentage', DEFAULT_FEE);

  // --- Alur status pencairan ---
  judul('ALUR STATUS PENCAIRAN');
  const lotUji = await p.lots.findFirst({ where: { session_id: sesi.id }, orderBy: { lot_number: 'asc' } });
  const setUji = await p.settlements.findFirst({ where: { lot_id: lotUji.id } });
  periksa(`Settlement 'unpaid' selama pemenang belum melunasi (dapat '${setUji.status}')`, setUji.status === 'unpaid');

  const cair = await req('POST', `/payments/settlements/${setUji.id}/disburse`, admin.token, {});
  periksa('Pencairan DITOLAK selama tagihan belum lunas', !cair.ok,
    `justru diterima: ${JSON.stringify(cair.body).slice(0, 140)}`);

  console.log(`\n${'='.repeat(66)}`);
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
