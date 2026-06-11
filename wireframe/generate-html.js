const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname);

// --- Helpers ---
const htmlBoilerplate = (title, layoutClass, content, role) => `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - Platform Lelang Digital</title>
  <link rel="stylesheet" href="../style.css">
</head>
<body class="${layoutClass}">
  ${content}
  <div class="wf-label">WIREFRAME — Platform Lelang Digital</div>
</body>
</html>`;

const pubHeader = (active) => `
  <header class="pub-header">
    <div class="logo">🏛️ INDO-LELANG</div>
    <nav>
      <a href="p1-homepage.html" class="${active==='p1'?'active':''}">Home</a>
      <a href="p2-katalog.html" class="${active==='p2'?'active':''}">Katalog</a>
      <a href="p4-jadwal.html" class="${active==='p4'?'active':''}">Jadwal Lelang</a>
      <a href="p5-tentang.html" class="${active==='p5'?'active':''}">Tentang Kami</a>
      <a href="p7-faq.html" class="${active==='p7'?'active':''}">FAQ</a>
    </nav>
    <div class="auth-btns">
      <a href="../auth/a1-login.html" class="btn btn-outline" style="color:#fff; border-color:rgba(255,255,255,0.5)">Masuk</a>
      <a href="../auth/a2-register-bidder.html" class="btn btn-gold">Daftar</a>
    </div>
  </header>
`;

const pubFooter = `
  <footer class="pub-footer" style="background: var(--wf-primary); color: rgba(255,255,255,0.8); padding: 4rem 2rem 2rem; border-top: 1px solid var(--wf-border); margin-top: auto;">
    <div style="max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 2rem; text-align: left; padding-bottom: 2rem; border-bottom: 1px solid rgba(255,255,255,0.1);">
      <div>
        <div class="logo" style="font-weight: 700; font-size: 1.3rem; color: #fff; margin-bottom: 1rem;">🏛️ INDO-LELANG</div>
        <p style="font-size: 0.85rem; line-height: 1.6; color: rgba(255,255,255,0.6);">Platform lelang digital terintegrasi di Indonesia. Transparan, aman, cepat, dan terpercaya untuk mobil, motor, properti, dan alat berat.</p>
        <div style="margin-top: 1rem; font-size: 0.85rem;">
          <strong>Hubungi Kami:</strong><br>
          ✉️ support@indolelang.com<br>
          📞 (021) 5098-8888
        </div>
      </div>
      <div>
        <h4 style="color: var(--wf-gold); font-size: 0.95rem; margin-bottom: 1rem; text-transform: uppercase; letter-spacing: 0.5px;">Tautan Publik</h4>
        <ul style="list-style: none; padding: 0; font-size: 0.85rem; line-height: 2;">
          <li><a href="p2-katalog.html" style="color: rgba(255,255,255,0.7);">Katalog Lelang</a></li>
          <li><a href="p4-jadwal.html" style="color: rgba(255,255,255,0.7);">Jadwal Sesi Lelang</a></li>
          <li><a href="p5-tentang.html" style="color: rgba(255,255,255,0.7);">Tentang Kami</a></li>
          <li><a href="p7-faq.html" style="color: rgba(255,255,255,0.7);">FAQ & Pusat Bantuan</a></li>
          <li><a href="p8-kontak.html" style="color: rgba(255,255,255,0.7);">Kontak & Alamat</a></li>
        </ul>
      </div>
      <div>
        <h4 style="color: var(--wf-gold); font-size: 0.95rem; margin-bottom: 1rem; text-transform: uppercase; letter-spacing: 0.5px;">Panduan Bidder</h4>
        <ul style="list-style: none; padding: 0; font-size: 0.85rem; line-height: 2;">
          <li><a href="../auth/a2-register-bidder.html" style="color: rgba(255,255,255,0.7);">Registrasi Bidder</a></li>
          <li><a href="p6-syarat.html" style="color: rgba(255,255,255,0.7);">Aturan & Syarat Bidding</a></li>
          <li><a href="../auth/a6-ekyc-upload.html" style="color: rgba(255,255,255,0.7);">Verifikasi Akun (eKYC)</a></li>
          <li><a href="p7-faq.html" style="color: rgba(255,255,255,0.7);">Kebijakan Deposit & Refund</a></li>
        </ul>
      </div>
      <div>
        <h4 style="color: var(--wf-gold); font-size: 0.95rem; margin-bottom: 1rem; text-transform: uppercase; letter-spacing: 0.5px;">Portal Provider</h4>
        <ul style="list-style: none; padding: 0; font-size: 0.85rem; line-height: 2;">
          <li><a href="../auth/a3-register-provider.html" style="color: rgba(255,255,255,0.7);">Daftar Sebagai Provider</a></li>
          <li><a href="p6-syarat.html" style="color: rgba(255,255,255,0.7);">Ketentuan Titip Jual</a></li>
          <li><a href="p7-faq.html" style="color: rgba(255,255,255,0.7);">Skema Settlement Dana</a></li>
          <li><a href="p8-kontak.html" style="color: rgba(255,255,255,0.7);">Kerjasama Korporasi</a></li>
        </ul>
      </div>
    </div>
    <div style="max-width: 1200px; margin: 2rem auto 0; display: flex; justify-content: space-between; flex-wrap: wrap; font-size: 0.8rem; color: rgba(255,255,255,0.4);">
      <p>&copy; 2026 Indo-Lelang. Hak Cipta Dilindungi Undang-Undang.</p>
      <div style="display: flex; gap: 1.5rem;">
        <a href="p6-syarat.html" style="color: inherit;">Kebijakan Privasi</a>
        <a href="p6-syarat.html" style="color: inherit;">Syarat Penggunaan</a>
      </div>
    </div>
  </footer>
`;

const sidebar = (role, activeId, menuItems) => {
  let menuHtml = '';
  menuItems.forEach(group => {
    menuHtml += `<div class="nav-section">${group.title}</div>`;
    group.items.forEach(item => {
      menuHtml += `<a href="${item.link}" class="nav-item ${activeId===item.id?'active':''}"><span class="icon">${item.icon}</span> ${item.name}</a>`;
    });
  });

  return `
  <aside class="sidebar">
    <div class="sidebar-logo">🏛️ INDO-LELANG</div>
    <div class="sidebar-role">PANEL ${role.toUpperCase()}</div>
    <nav class="sidebar-nav">
      ${menuHtml}
    </nav>
    <div style="padding:1rem; text-align:center;">
      <a href="../index.html" class="btn btn-outline btn-sm" style="color:rgba(255,255,255,0.5); border-color:rgba(255,255,255,0.2);">Keluar ke Index</a>
    </div>
  </aside>`;
};

const topbar = (breadcrumb, userInitials) => `
  <header class="topbar">
    <div class="breadcrumb">${breadcrumb}</div>
    <div class="topbar-right">
      <input type="text" class="search-box" placeholder="Cari data...">
      <div class="notif-bell">🔔<div class="dot"></div></div>
      <div class="user-avatar">${userInitials}</div>
    </div>
  </header>
`;

// --- Menus ---
const bidderMenu = [
  { title: 'Main', items: [
    { id: 'b1', icon: '📊', name: 'Dashboard', link: 'b1-dashboard.html' },
    { id: 'b3', icon: '📋', name: 'Katalog', link: 'b3-katalog.html' },
    { id: 'b5', icon: '⭐', name: 'Watchlist', link: 'b5-watchlist.html' }
  ]},
  { title: 'Lelang', items: [
    { id: 'b7', icon: '🏛️', name: 'Ruang Lelang', link: 'b7-bidding-room.html' },
    { id: 'b12', icon: '📚', name: 'Riwayat Lelang', link: 'b12-riwayat-lelang.html' }
  ]},
  { title: 'Pembayaran', items: [
    { id: 'b6', icon: '💰', name: 'Deposit', link: 'b6-deposit.html' },
    { id: 'b10', icon: '💳', name: 'Pelunasan', link: 'b10-pelunasan.html' },
    { id: 'b13', icon: '📄', name: 'Riwayat Transaksi', link: 'b13-riwayat-transaksi.html' }
  ]},
  { title: 'Lainnya', items: [
    { id: 'b11', icon: '📦', name: 'Pengambilan Barang', link: 'b11-pengambilan.html' },
    { id: 'b2', icon: '👤', name: 'Profil & Pengaturan', link: 'b2-profil.html' },
    { id: 'b14', icon: '🔔', name: 'Notifikasi', link: 'b14-notifikasi.html' }
  ]}
];

const providerMenu = [
  { title: 'Main', items: [
    { id: 's1', icon: '📊', name: 'Dashboard', link: 's1-dashboard.html' },
    { id: 's5', icon: '📋', name: 'Daftar Barang', link: 's5-daftar-barang.html' },
    { id: 's3', icon: '➕', name: 'Ajukan Baru', link: 's3-ajukan-barang.html' }
  ]},
  { title: 'Aktivitas', items: [
    { id: 's7', icon: '📡', name: 'Monitoring Lelang', link: 's7-monitoring.html' },
    { id: 's9', icon: '📈', name: 'Riwayat Penjualan', link: 's9-riwayat.html' }
  ]},
  { title: 'Keuangan', items: [
    { id: 's8', icon: '📄', name: 'Settlement', link: 's8-settlement.html' },
    { id: 's10', icon: '💰', name: 'Pencairan Dana', link: 's10-pencairan.html' },
    { id: 's11', icon: '🛠️', name: 'Pengembalian', link: 's11-pengembalian.html' }
  ]},
  { title: 'Akun', items: [
    { id: 's2', icon: '🏢', name: 'Profil Perusahaan', link: 's2-profil.html' },
    { id: 's12', icon: '🔔', name: 'Notifikasi', link: 's12-notifikasi.html' }
  ]}
];

const adminMenu = [
  { title: 'Main', items: [
    { id: 'ad1', icon: '📊', name: 'Dashboard', link: 'ad1-dashboard.html' }
  ]},
  { title: 'Pengguna', items: [
    { id: 'ad2', icon: '👥', name: 'Bidder', link: 'ad2-list-bidder.html' },
    { id: 'ad3', icon: '🏢', name: 'Provider', link: 'ad3-list-provider.html' },
    { id: 'ad6', icon: '🔍', name: 'Verifikasi KYC', link: 'ad6-verifikasi-kyc.html' },
    { id: 'ad4', icon: '👮', name: 'Admin/Operator', link: 'ad4-list-admin.html' }
  ]},
  { title: 'Katalog', items: [
    { id: 'ad7', icon: '📦', name: 'Daftar Barang', link: 'ad7-list-barang.html' },
    { id: 'ad9', icon: '✔️', name: 'Approval Barang', link: 'ad9-approval-barang.html' },
    { id: 'ad10', icon: '📦', name: 'Penyusunan Lot', link: 'ad10-penyusunan-lot.html' }
  ]},
  { title: 'Lelang', items: [
    { id: 'ad11', icon: '📅', name: 'Daftar Sesi', link: 'ad11-list-sesi.html' },
    { id: 'ad13', icon: '🏛️', name: 'Ruang Kontrol', link: 'ad13-ruang-kontrol.html' },
    { id: 'ad14', icon: '📋', name: 'Hasil Sesi', link: 'ad14-hasil-sesi.html' }
  ]},
  { title: 'Keuangan', items: [
    { id: 'ad15', icon: '💰', name: 'Deposit', link: 'ad15-deposit.html' },
    { id: 'ad16', icon: '💳', name: 'Pelunasan', link: 'ad16-pelunasan.html' },
    { id: 'ad17', icon: '💸', name: 'Pencairan', link: 'ad17-pencairan.html' },
    { id: 'ad18', icon: '💵', name: 'Refund', link: 'ad18-refund.html' }
  ]},
  { title: 'Laporan & Pengaturan', items: [
    { id: 'ad21', icon: '📈', name: 'Dashboard Analitik', link: 'ad21-dashboard-analitik.html' },
    { id: 'ad23', icon: '📣', name: 'Campaign', link: 'ad23-campaign.html' },
    { id: 'ad25', icon: '⚙️', name: 'Pengaturan', link: 'ad25-pengaturan.html' },
    { id: 'ad26', icon: '🔒', name: 'Audit Trail', link: 'ad26-audit-trail.html' }
  ]}
];

// --- Generation Functions ---
function writePage(dir, filename, title, content) {
  const fpath = path.join(outDir, dir, filename);
  fs.writeFileSync(fpath, content, 'utf8');
}

function generatePublicPages() {
  const pages = ['p1-homepage', 'p2-katalog', 'p3-detail-lot', 'p4-jadwal', 'p5-tentang', 'p6-syarat', 'p7-faq', 'p8-kontak'];
  
  pages.forEach(p => {
    let mainContent = `<div class="hero"><h1>${p.toUpperCase()}</h1><p>Halaman Publik</p></div>`;
    
    if (p === 'p1-homepage') {
      mainContent = `
        <!-- Hero Section -->
        <div class="hero" style="padding: 4rem 2rem; background: linear-gradient(135deg, var(--wf-primary), var(--wf-accent)); margin-bottom: 0;">
          <h1 style="font-size: 2.5rem; margin-bottom: 1rem;">Lelang Digital Terpercaya, Cepat & Transparan</h1>
          <p style="font-size: 1.1rem; margin-bottom: 2rem;">Temukan ribuan kendaraan, properti, dan alat berat dengan harga terbaik dari seluruh Indonesia.</p>
          
          <!-- Quick Search Bar -->
          <div style="background: white; padding: 1rem; border-radius: 8px; display: flex; gap: 1rem; max-width: 800px; margin: 0 auto; box-shadow: 0 4px 15px rgba(0,0,0,0.2);">
            <input type="text" class="form-input" placeholder="Cari merk, model, atau lokasi..." style="flex: 2; border: none; background: #f5f6fa;">
            <select class="form-select" style="flex: 1; border: none; background: #f5f6fa;">
              <option>Semua Kategori</option>
              <option>Mobil Penumpang</option>
              <option>Sepeda Motor</option>
              <option>Komersial & Alat Berat</option>
              <option>Properti</option>
            </select>
            <button class="btn btn-gold" style="padding: 0.5rem 2rem;">Cari</button>
          </div>
        </div>

        <!-- KPI / Stats -->
        <div class="kpi-grid" style="margin-top: -2rem; position: relative; z-index: 10; padding: 0 1rem;">
          <div class="kpi-card text-center"><div class="kpi-value" style="color: var(--wf-primary)">1,200+</div><div class="kpi-label">Lot Terjual</div></div>
          <div class="kpi-card text-center"><div class="kpi-value" style="color: var(--wf-primary)">3,400+</div><div class="kpi-label">Peserta Aktif</div></div>
          <div class="kpi-card text-center"><div class="kpi-value" style="color: var(--wf-primary)">15+</div><div class="kpi-label">Cabang Kota</div></div>
          <div class="kpi-card text-center"><div class="kpi-value" style="color: var(--wf-success)">98%</div><div class="kpi-label">Tingkat Kepuasan</div></div>
        </div>

        <!-- Kenapa Memilih IndoLelang -->
        <div style="margin-top: 5rem;">
          <h2 class="page-title text-center">Kenapa Memilih IndoLelang?</h2>
          <p class="page-subtitle text-center" style="max-width: 600px; margin: 0 auto 2.5rem;">Kami menghadirkan platform lelang digital yang modern dengan berbagai keunggulan dibanding lelang konvensional.</p>
          <div class="grid-3" style="grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem;">
            <div class="card text-center" style="padding: 2.5rem 1.5rem;">
              <div style="font-size: 2.5rem; margin-bottom: 1rem;">🛡️</div>
              <h3 class="fw-bold" style="font-size: 1.1rem; margin-bottom: 0.5rem;">Keamanan Terjamin (eKYC)</h3>
              <p class="fs-sm text-muted" style="line-height: 1.6;">Verifikasi identitas bidder dan provider secara cepat dengan sistem eKYC otomatis untuk memastikan integritas peserta.</p>
            </div>
            <div class="card text-center" style="padding: 2.5rem 1.5rem;">
              <div style="font-size: 2.5rem; margin-bottom: 1rem;">⚡</div>
              <h3 class="fw-bold" style="font-size: 1.1rem; margin-bottom: 0.5rem;">Sistem Bidding Real-Time</h3>
              <p class="fs-sm text-muted" style="line-height: 1.6;">Nikmati bidding live secara real-time dengan kelipatan penawaran otomatis dan perpanjangan waktu dinamis (Anti-Sniping).</p>
            </div>
            <div class="card text-center" style="padding: 2.5rem 1.5rem;">
              <div style="font-size: 2.5rem; margin-bottom: 1rem;">💵</div>
              <h3 class="fw-bold" style="font-size: 1.1rem; margin-bottom: 0.5rem;">Pembayaran Instan (VA)</h3>
              <p class="fs-sm text-muted" style="line-height: 1.6;">Transaksi aman menggunakan Virtual Account otomatis untuk pembelian deposit (NIPL), pembayaran pelunasan, hingga auto-refund.</p>
            </div>
          </div>
        </div>

        <!-- Video Sesi Demo / Cara Kerja -->
        <div style="margin-top: 5rem; background: var(--wf-white); padding: 3rem 2rem; border-radius: var(--radius); border: 1px solid var(--wf-border); box-shadow: var(--shadow);">
          <div class="grid-2-1" style="grid-template-columns: 1.2fr 1fr; align-items: center; gap: 3rem;">
            <div>
              <div class="img-placeholder" style="height: 320px; position: relative; cursor: pointer; background: linear-gradient(135deg, var(--wf-primary), var(--wf-accent)); border-radius: 8px;">
                <div style="position: absolute; font-size: 5rem; color: #fff;">▶️</div>
                <div style="position: absolute; bottom: 1.5rem; left: 1.5rem; color: #fff; font-weight: 600; text-shadow: 0 2px 4px rgba(0,0,0,0.5);">Video Tutorial: Cara Bidding di IndoLelang</div>
              </div>
            </div>
            <div>
              <h2 class="page-title" style="margin-bottom: 1rem;">Tonton Cara Kerjanya</h2>
              <p class="text-muted mb-2" style="line-height: 1.6;">Belum pernah mengikuti lelang online? Jangan khawatir! Video tutorial 3 menit ini akan memandu Anda mulai dari proses pendaftaran akun, verifikasi eKYC, pembelian jaminan (NIPL), hingga proses memenangkan lot lelang secara langsung.</p>
              <ul style="list-style: none; padding: 0; line-height: 2; font-size: 0.9rem;" class="text-muted">
                <li>✔️ Proses Registrasi & eKYC 5 Menit</li>
                <li>✔️ Cara Top Up Deposit untuk NIPL</li>
                <li>✔️ Simulasi Penawaran di Bidding Room</li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Kategori Lelang -->
        <div style="margin-top: 5rem;">
          <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 1.5rem;">
            <div>
              <h2 class="page-title">Jelajahi Kategori Aset</h2>
              <p class="page-subtitle" style="margin-bottom:0">Temukan barang berkualitas dengan harga pembukaan rendah</p>
            </div>
            <a href="p2-katalog.html" class="btn btn-outline">Lihat Semua &rarr;</a>
          </div>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem;">
            <div class="card text-center" style="cursor:pointer; border-bottom: 3px solid var(--wf-accent); transition: transform 0.2s; padding: 2rem 1rem;">
              <div style="font-size: 3rem; margin-bottom: 1rem;">🚗</div>
              <div class="fw-bold" style="font-size: 1.1rem; margin-bottom: 0.3rem;">Mobil Penumpang</div>
              <div class="fs-sm text-muted">450+ Lot Tersedia</div>
            </div>
            <div class="card text-center" style="cursor:pointer; border-bottom: 3px solid var(--wf-accent); transition: transform 0.2s; padding: 2rem 1rem;">
              <div style="font-size: 3rem; margin-bottom: 1rem;">🏍️</div>
              <div class="fw-bold" style="font-size: 1.1rem; margin-bottom: 0.3rem;">Sepeda Motor</div>
              <div class="fs-sm text-muted">820+ Lot Tersedia</div>
            </div>
            <div class="card text-center" style="cursor:pointer; border-bottom: 3px solid var(--wf-accent); transition: transform 0.2s; padding: 2rem 1rem;">
              <div style="font-size: 3rem; margin-bottom: 1rem;">🚜</div>
              <div class="fw-bold" style="font-size: 1.1rem; margin-bottom: 0.3rem;">Komersial & Alat Berat</div>
              <div class="fs-sm text-muted">85+ Lot Tersedia</div>
            </div>
            <div class="card text-center" style="cursor:pointer; border-bottom: 3px solid var(--wf-accent); transition: transform 0.2s; padding: 2rem 1rem;">
              <div style="font-size: 3rem; margin-bottom: 1rem;">🏢</div>
              <div class="fw-bold" style="font-size: 1.1rem; margin-bottom: 0.3rem;">Properti & Aset Lain</div>
              <div class="fs-sm text-muted">32+ Lot Tersedia</div>
            </div>
          </div>
        </div>

        <!-- Rekomendasi Lelang Mendatang -->
        <div style="margin-top: 5rem;">
          <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 1.5rem;">
            <div>
              <h2 class="page-title">Rekomendasi Lelang Terpopuler</h2>
              <p class="page-subtitle" style="margin-bottom:0">Lot-lot lelang dengan penawaran tertinggi yang akan segera dimulai</p>
            </div>
            <a href="p4-jadwal.html" class="btn btn-outline">Lihat Jadwal &rarr;</a>
          </div>
          <div class="lot-grid">
            <div class="lot-card">
              <div class="lot-img" style="font-size: 2rem;">🚘</div>
              <div class="lot-body">
                <div class="lot-title">Toyota Avanza 1.3 G MT 2022</div>
                <div class="lot-price">Rp 145.000.000</div>
                <div class="lot-meta">Lokasi: Jakarta Selatan • Grade: B</div>
                <div class="lot-countdown mt-1">Sesi: 12 Jun 2026, 10:00</div>
                <a href="p3-detail-lot.html" class="btn btn-primary w-100 mt-2" style="justify-content:center">Lihat Detail</a>
              </div>
            </div>
            <div class="lot-card">
              <div class="lot-img" style="font-size: 2rem;">🚘</div>
              <div class="lot-body">
                <div class="lot-title">Honda CR-V 1.5 Turbo Prestige 2021</div>
                <div class="lot-price">Rp 385.000.000</div>
                <div class="lot-meta">Lokasi: Bandung • Grade: A</div>
                <div class="lot-countdown mt-1">Sesi: 12 Jun 2026, 10:00</div>
                <a href="p3-detail-lot.html" class="btn btn-primary w-100 mt-2" style="justify-content:center">Lihat Detail</a>
              </div>
            </div>
            <div class="lot-card">
              <div class="lot-img" style="font-size: 2rem;">🚘</div>
              <div class="lot-body">
                <div class="lot-title">Mitsubishi Xpander Ultimate 2023</div>
                <div class="lot-price">Rp 215.000.000</div>
                <div class="lot-meta">Lokasi: Surabaya • Grade: A</div>
                <div class="lot-countdown mt-1">Sesi: 14 Jun 2026, 13:00</div>
                <a href="p3-detail-lot.html" class="btn btn-primary w-100 mt-2" style="justify-content:center">Lihat Detail</a>
              </div>
            </div>
            <div class="lot-card">
              <div class="lot-img" style="font-size: 2rem;">🏍️</div>
              <div class="lot-body">
                <div class="lot-title">Yamaha NMAX 155 ABS 2022</div>
                <div class="lot-price">Rp 21.500.000</div>
                <div class="lot-meta">Lokasi: Jakarta Pusat • Grade: B</div>
                <div class="lot-countdown mt-1">Sesi: 14 Jun 2026, 13:00</div>
                <a href="p3-detail-lot.html" class="btn btn-primary w-100 mt-2" style="justify-content:center">Lihat Detail</a>
              </div>
            </div>
          </div>
        </div>

        <!-- Artikel / Edukasi -->
        <div style="margin-top: 5rem;">
          <h2 class="page-title text-center">Tips & Artikel Terbaru</h2>
          <p class="page-subtitle text-center" style="max-width: 600px; margin: 0 auto 2.5rem;">Temukan informasi edukatif seputar prosedur lelang digital, hukum kepemilikan aset, dan tips pembelian kendaraan.</p>
          <div class="grid-3" style="gap: 1.5rem;">
            <div class="card">
              <div style="font-size: 3rem; margin-bottom: 1rem; text-align: center;">🚗</div>
              <div class="fs-sm text-muted">10 Juni 2026 • Edukasi Kendaraan</div>
              <h3 class="fw-bold mt-1" style="font-size: 1rem; line-height: 1.4;">Tips Mengikuti Inspeksi Fisik Mobil Bekas Sebelum Lelang</h3>
              <p class="fs-sm text-muted mt-1" style="line-height: 1.5;">Bagaimana cara membaca laporan Grade Appraisal dan detail apa saja yang harus diperiksa secara langsung di pool gudang...</p>
              <a href="#" class="btn btn-sm btn-outline mt-2 w-100" style="justify-content: center;">Baca Selengkapnya</a>
            </div>
            <div class="card">
              <div style="font-size: 3rem; margin-bottom: 1rem; text-align: center;">🛡️</div>
              <div class="fs-sm text-muted">08 Juni 2026 • Keamanan & Hukum</div>
              <h3 class="fw-bold mt-1" style="font-size: 1rem; line-height: 1.4;">Mengenal Keabsahan Hukum Dokumen Risalah Lelang Digital</h3>
              <p class="fs-sm text-muted mt-1" style="line-height: 1.5;">Penjelasan lengkap mengenai kedudukan Risalah Lelang yang dikeluarkan KPKNL atau Balai Lelang resmi di mata hukum...</p>
              <a href="#" class="btn btn-sm btn-outline mt-2 w-100" style="justify-content: center;">Baca Selengkapnya</a>
            </div>
            <div class="card">
              <div style="font-size: 3rem; margin-bottom: 1rem; text-align: center;">📄</div>
              <div class="fs-sm text-muted">05 Juni 2026 • Finansial</div>
              <h3 class="fw-bold mt-1" style="font-size: 1rem; line-height: 1.4;">Cara Membayar Deposit Jaminan NIPL Melalui Virtual Account</h3>
              <p class="fs-sm text-muted mt-1" style="line-height: 1.5;">Langkah mudah transfer deposit, batas waktu pemesanan NIPL, serta alur refund otomatis 100% jika Anda kalah lelang...</p>
              <a href="#" class="btn btn-sm btn-outline mt-2 w-100" style="justify-content: center;">Baca Selengkapnya</a>
            </div>
          </div>
        </div>

        <!-- Unduh Aplikasi Mobile -->
        <div style="margin-top: 5rem; background: linear-gradient(135deg, var(--wf-primary), var(--wf-accent)); color: #fff; padding: 4rem 2rem; border-radius: var(--radius); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 2rem;">
          <div style="max-width: 600px;">
            <h2 style="font-size: 2rem; font-weight: 700; margin-bottom: 0.5rem; color: #fff;">Unduh Aplikasi IndoLelang</h2>
            <p style="opacity: 0.9; line-height: 1.6;">Dapatkan akses penawaran lelang yang lebih cepat dan nyaman langsung dari smartphone Anda. Dapatkan notifikasi push real-time untuk lot favorit Anda!</p>
          </div>
          <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
            <div style="background: #000; color: #fff; padding: 0.75rem 1.5rem; border-radius: 8px; font-size: 0.85rem; font-weight: 700; cursor: pointer; border: 1px solid rgba(255,255,255,0.2); display: flex; align-items: center; gap: 0.5rem;">
              <span>🤖</span>
              <div>
                <div style="font-size: 0.65rem; font-weight: 400; opacity: 0.6;">GET IT ON</div>
                Google Play
              </div>
            </div>
            <div style="background: #000; color: #fff; padding: 0.75rem 1.5rem; border-radius: 8px; font-size: 0.85rem; font-weight: 700; cursor: pointer; border: 1px solid rgba(255,255,255,0.2); display: flex; align-items: center; gap: 0.5rem;">
              <span>🍎</span>
              <div>
                <div style="font-size: 0.65rem; font-weight: 400; opacity: 0.6;">Download on the</div>
                App Store
              </div>
            </div>
          </div>
        </div>

        <!-- Cara Kerja Lelang -->
        <div style="margin-top: 5rem; background: var(--wf-white); padding: 3rem 2rem; border-radius: var(--radius); border: 1px solid var(--wf-border); text-align: center; box-shadow: var(--shadow);">
          <h2 class="page-title mb-1">Cara Kerja Lelang Digital</h2>
          <p class="page-subtitle mb-3" style="max-width: 600px; margin: 0 auto 2rem;">Proses lelang yang mudah, aman, dan transparan dari mana saja.</p>
          
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 2rem; position: relative;">
            <div>
              <div style="width: 70px; height: 70px; background: var(--wf-gold-bg); color: var(--wf-gold); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.8rem; font-weight: bold; margin: 0 auto 1rem; border: 2px solid var(--wf-gold);">1</div>
              <div class="fw-bold fs-lg mb-1">Daftar & Verifikasi</div>
              <div class="fs-sm text-muted">Buat akun bidder dan verifikasi data e-KTP Anda dalam hitungan menit secara otomatis.</div>
            </div>
            <div>
              <div style="width: 70px; height: 70px; background: var(--wf-gold-bg); color: var(--wf-gold); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.8rem; font-weight: bold; margin: 0 auto 1rem; border: 2px solid var(--wf-gold);">2</div>
              <div class="fw-bold fs-lg mb-1">Beli NIPL / Deposit</div>
              <div class="fs-sm text-muted">Beli Nomor Induk Peserta Lelang (Deposit) sebagai syarat dan jaminan keikutsertaan Anda.</div>
            </div>
            <div>
              <div style="width: 70px; height: 70px; background: var(--wf-gold-bg); color: var(--wf-gold); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.8rem; font-weight: bold; margin: 0 auto 1rem; border: 2px solid var(--wf-gold);">3</div>
              <div class="fw-bold fs-lg mb-1">Ikuti Bidding Live</div>
              <div class="fs-sm text-muted">Lakukan penawaran (bidding) secara real-time bersama peserta lain saat sesi lelang dimulai.</div>
            </div>
            <div>
              <div style="width: 70px; height: 70px; background: var(--wf-gold-bg); color: var(--wf-gold); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.8rem; font-weight: bold; margin: 0 auto 1rem; border: 2px solid var(--wf-gold);">4</div>
              <div class="fw-bold fs-lg mb-1">Menang & Pelunasan</div>
              <div class="fs-sm text-muted">Lakukan pelunasan jika Anda menang. Jika kalah, deposit akan dikembalikan 100% tanpa potongan.</div>
            </div>
          </div>
        </div>

        <!-- Trust Badges / Partners -->
        <div style="margin-top: 5rem; text-align: center;">
          <p class="fw-bold text-muted text-uppercase mb-2" style="letter-spacing: 1px; font-size: 0.85rem;">Didukung Oleh Partner Perbankan & Pembayaran Resmi</p>
          <div style="display: flex; justify-content: center; gap: 1.5rem; flex-wrap: wrap; opacity: 0.5; filter: grayscale(100%); align-items: center;">
            <div style="padding: 1rem 2rem; border: 1px solid var(--wf-border); border-radius: 6px; font-weight: 800; font-size: 1.2rem; background: #fff;">BANK BCA</div>
            <div style="padding: 1rem 2rem; border: 1px solid var(--wf-border); border-radius: 6px; font-weight: 800; font-size: 1.2rem; background: #fff;">BANK MANDIRI</div>
            <div style="padding: 1rem 2rem; border: 1px solid var(--wf-border); border-radius: 6px; font-weight: 800; font-size: 1.2rem; background: #fff;">BANK BNI</div>
            <div style="padding: 1rem 2rem; border: 1px solid var(--wf-border); border-radius: 6px; font-weight: 800; font-size: 1.2rem; background: #fff;">MIDTRANS</div>
            <div style="padding: 1rem 2rem; border: 1px solid var(--wf-border); border-radius: 6px; font-weight: 800; font-size: 1.2rem; background: #fff;">GOPAY</div>
          </div>
        </div>

        <!-- CTA Section -->
        <div style="margin-top: 5rem; margin-bottom: 2rem; background: var(--wf-primary); color: white; padding: 4rem 2rem; border-radius: var(--radius); text-align: center; display: flex; flex-direction: column; align-items: center; box-shadow: var(--shadow-md);">
          <h2 style="font-size: 2.2rem; margin-bottom: 1rem; color: #fff;">Siap Menemukan Aset Impian Anda?</h2>
          <p style="font-size: 1.1rem; opacity: 0.85; margin-bottom: 2.5rem; max-width: 650px;">Bergabung dengan ribuan peserta lainnya dan nikmati pengalaman lelang digital yang cepat, aman, dan memuaskan. Mulai perjalanan Anda hari ini.</p>
          <div style="display: flex; gap: 1.5rem; flex-wrap: wrap; justify-content: center;">
            <a href="../auth/a2-register-bidder.html" class="btn btn-gold btn-lg" style="padding: 1rem 2.5rem; font-size: 1.1rem;">Daftar Sebagai Bidder</a>
            <a href="../auth/a3-register-provider.html" class="btn btn-outline btn-lg" style="color: white; border-color: rgba(255,255,255,0.4); padding: 1rem 2.5rem; font-size: 1.1rem;">Titip Jual Aset Anda</a>
          </div>
        </div>
      `;
    } else if (p === 'p2-katalog') {
      mainContent = `
        <div style="display: flex; gap: 2rem; margin-top: 2rem;">
          <!-- Filter Sidebar -->
          <div style="width: 250px; flex-shrink: 0;">
            <div class="card">
              <div class="card-header" style="font-weight: 700;">Filter Pencarian</div>
              <div class="form-group">
                <label class="form-label">Kategori</label>
                <select class="form-select">
                  <option>Semua Kategori</option>
                  <option>Mobil</option>
                  <option>Motor</option>
                  <option>Alat Berat</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Lokasi Gudang</label>
                <select class="form-select">
                  <option>Semua Lokasi</option>
                  <option>Jakarta</option>
                  <option>Bandung</option>
                  <option>Surabaya</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Kondisi (Grade)</label>
                <div style="display: flex; flex-direction: column; gap: 0.5rem; font-size: 0.85rem;">
                  <label><input type="checkbox" checked> Grade A (Sangat Baik)</label>
                  <label><input type="checkbox" checked> Grade B (Baik)</label>
                  <label><input type="checkbox"> Grade C (Cukup)</label>
                  <label><input type="checkbox"> Grade D (Kurang)</label>
                </div>
              </div>
              <button class="btn btn-primary w-100" style="justify-content: center; margin-top: 1rem;">Terapkan Filter</button>
            </div>
          </div>
          <!-- Catalog Grid -->
          <div style="flex: 1;">
            <div class="toolbar">
              <div class="toolbar-left">
                <input type="text" class="form-input" placeholder="Cari tipe kendaraan..." style="width: 300px;">
                <button class="btn btn-outline">Cari</button>
              </div>
              <div class="toolbar-right">
                <select class="form-select" style="width: 180px;">
                  <option>Harga Terendah</option>
                  <option>Harga Tertinggi</option>
                  <option>Waktu Terdekat</option>
                </select>
              </div>
            </div>
            <div class="lot-grid" style="grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));">
              ${[1, 2, 3, 4, 5, 6].map(i => `
                <div class="lot-card">
                  <div class="lot-img" style="font-size: 2.5rem;">🚗</div>
                  <div class="lot-body">
                    <div class="lot-title">Toyota Avanza 1.3 G MT 2022</div>
                    <div class="lot-price">Rp 145.000.000</div>
                    <div class="lot-meta">Jakarta • Grade B • 45rb KM</div>
                    <div class="lot-countdown mt-1" style="font-size: 0.85rem; font-weight: 600;">Sesi: 12 Jun 2026, 10:00</div>
                    <a href="p3-detail-lot.html" class="btn btn-primary w-100 mt-2" style="justify-content: center;">Lihat Detail</a>
                  </div>
                </div>
              `).join('')}
            </div>
            <div class="pagination">
              <button class="page-btn">Prev</button>
              <button class="page-btn active">1</button>
              <button class="page-btn">2</button>
              <button class="page-btn">Next</button>
            </div>
          </div>
        </div>
      `;
    } else if (p === 'p3-detail-lot') {
      mainContent = `
        <div class="grid-2-1" style="grid-template-columns: 1.5fr 1fr; gap: 2rem; margin-top: 2rem;">
          <div>
            <div class="img-placeholder" style="height: 380px; font-size: 3rem; background: linear-gradient(135deg, #dfe6e9, #b2bec3);">🚗 Foto Utama Kendaraan</div>
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.5rem; margin-top: 0.5rem;">
              <div class="img-placeholder" style="height: 80px;">Tampak Depan</div>
              <div class="img-placeholder" style="height: 80px;">Tampak Samping</div>
              <div class="img-placeholder" style="height: 80px;">Tampak Belakang</div>
              <div class="img-placeholder" style="height: 80px;">Mesin & Ban</div>
            </div>
            
            <div class="card mt-3">
              <div class="card-header" style="font-weight: 700;">Spesifikasi Lengkap Aset</div>
              <table style="width: 100%;">
                <tbody>
                  <tr><td class="fw-bold" style="width: 30%;">Merk / Model</td><td>Toyota Avanza 1.3 G MT</td></tr>
                  <tr><td class="fw-bold">Tahun Pembuatan</td><td>2022</td></tr>
                  <tr><td class="fw-bold">Nomor Polisi</td><td>B 2098 SJA (Jakarta)</td></tr>
                  <tr><td class="fw-bold">Transmisi / Bahan Bakar</td><td>Manual / Bensin</td></tr>
                  <tr><td class="fw-bold">Odometer (KM)</td><td>45,310 km</td></tr>
                  <tr><td class="fw-bold">Kondisi (Appraisal Grade)</td><td><span class="badge badge-success">Grade B</span> (Mesin Prima, Bodi Mulus)</td></tr>
                  <tr><td class="fw-bold">Status Surat-Surat</td><td>BPKB & STNK Ready (Pajak Hidup s/d Des 2026)</td></tr>
                </tbody>
              </table>
            </div>
          </div>
          <div>
            <div class="card" style="border-top: 4px solid var(--wf-gold);">
              <div class="badge badge-danger">Lelang Mendatang</div>
              <h1 class="page-title mt-1" style="font-size: 1.5rem;">Toyota Avanza 1.3 G MT 2022</h1>
              <p class="text-muted fs-sm">Lot #1045 • Sesi Mobil Penumpang JKT</p>
              <div class="separator"></div>
              
              <div style="margin-bottom: 1.5rem;">
                <div class="text-muted fs-sm">Harga Dasar Pembukaan:</div>
                <div class="bid-current-price" style="color: var(--wf-primary); font-size: 1.8rem; margin: 0.2rem 0;">Rp 145.000.000</div>
                <div class="text-muted fs-sm">Uang Jaminan (Deposit/NIPL): <strong>Rp 5.000.000</strong> per Lot</div>
              </div>
              
              <div class="alert alert-info" style="margin-bottom: 1.5rem;">
                <div>
                  <strong>Jadwal Mulai:</strong><br>
                  12 Juni 2026, 10:00 WIB (Sesi Live Online)
                </div>
              </div>
              
              <a href="../auth/a1-login.html" class="btn btn-gold w-100 btn-lg" style="justify-content: center; margin-bottom: 0.5rem;">Login untuk Bid</a>
              <button class="btn btn-outline w-100" style="justify-content: center;">⭐ Tambah ke Watchlist</button>
            </div>
            
            <div class="card mt-2">
              <div class="card-header" style="font-weight: 700;">Lokasi Gudang Penampungan</div>
              <p class="fs-sm"><strong>Gudang Utama JKT Selatan</strong><br>Jl. Gatot Subroto No. 45, Jakarta Selatan. Terbuka untuk Open House / Cek Fisik pada 10-11 Juni 2026, pukul 09:00 - 16:00 WIB.</p>
              <div class="img-placeholder mt-1" style="height: 120px;">🗺️ Peta Lokasi Gudang</div>
            </div>
          </div>
        </div>
      `;
    } else if (p === 'p4-jadwal') {
      mainContent = `
        <h2 class="page-title" style="margin-top: 2rem;">Jadwal Sesi Lelang Aktif</h2>
        <p class="page-subtitle">Daftarkan diri Anda pada sesi lelang dan bayar uang jaminan sebelum sesi dimulai.</p>
        
        <div class="card mt-2">
          <div class="toolbar">
            <div class="toolbar-left">
              <input type="text" class="form-input" placeholder="Cari nama sesi..." style="width: 250px;">
              <select class="form-select" style="width: 180px;">
                <option>Semua Wilayah</option>
                <option>Jakarta</option>
                <option>Bandung</option>
                <option>Surabaya</option>
              </select>
            </div>
          </div>
          <div class="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>ID Sesi</th>
                  <th>Nama Sesi Lelang</th>
                  <th>Tanggal & Waktu</th>
                  <th>Jumlah Lot</th>
                  <th>Uang Jaminan</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>#SESI-120</td>
                  <td class="fw-bold">Lelang Mobil Penumpang Jakarta - Batch 15</td>
                  <td>12 Juni 2026, 10:00 WIB</td>
                  <td>45 Mobil</td>
                  <td>Rp 5.000.000 / NIPL</td>
                  <td><span class="badge badge-success">Membuka Pendaftaran</span></td>
                  <td><a href="p2-katalog.html" class="btn btn-sm btn-primary">Lihat Katalog Sesi</a></td>
                </tr>
                <tr>
                  <td>#SESI-121</td>
                  <td class="fw-bold">Lelang Sepeda Motor Bandung - Batch 22</td>
                  <td>12 Juni 2026, 14:00 WIB</td>
                  <td>120 Motor</td>
                  <td>Rp 1.000.000 / NIPL</td>
                  <td><span class="badge badge-success">Membuka Pendaftaran</span></td>
                  <td><a href="p2-katalog.html" class="btn btn-sm btn-primary">Lihat Katalog Sesi</a></td>
                </tr>
                <tr>
                  <td>#SESI-122</td>
                  <td class="fw-bold">Lelang Alat Berat & Truk Komersial - Nasional</td>
                  <td>15 Juni 2026, 09:00 WIB</td>
                  <td>12 Unit</td>
                  <td>Rp 20.000.000 / NIPL</td>
                  <td><span class="badge badge-warning">Segera Hadir</span></td>
                  <td><a href="p2-katalog.html" class="btn btn-sm btn-outline">Lihat Katalog Sesi</a></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      `;
    } else if (p === 'p5-tentang') {
      mainContent = `
        <div class="grid-2" style="margin-top: 2rem; gap: 3rem;">
          <div>
            <h2 class="page-title">Tentang IndoLelang</h2>
            <p style="line-height: 1.7; margin-bottom: 1rem;">IndoLelang didirikan dengan visi menjadi platform lelang digital nomor satu di Indonesia yang mengedepankan asas kecepatan, kenyamanan, keamanan, dan transparansi (Hammer Price transparan).</p>
            <p style="line-height: 1.7; margin-bottom: 1rem;">Kami mengintegrasikan teknologi verifikasi eKYC modern, Virtual Account bank-bank terkemuka Indonesia untuk deposit instan dan auto-refund 100% tanpa potongan, serta sistem penawaran lelang anti-sniping real-time.</p>
            
            <div class="card mt-2">
              <h3 class="fw-bold" style="font-size: 1.1rem; color: var(--wf-primary);">Visi & Misi</h3>
              <p class="fs-sm text-muted mt-1"><strong>Visi:</strong> Mewujudkan ekosistem jual-beli aset bekas/lelang yang adil, efisien, dan dapat diakses dari mana saja secara digital.</p>
              <p class="fs-sm text-muted mt-1"><strong>Misi:</strong> Memberikan pengalaman penawaran live lelang terbaik, transparansi pencatatan log bid, dan kepastian hukum yang kuat melalui integrasi risalah lelang resmi.</p>
            </div>
          </div>
          <div>
            <div class="img-placeholder" style="height: 300px; background: linear-gradient(135deg, #b2bec3, #636e72); font-size: 1.5rem; color: #fff;">🏛️ Kantor Pusat IndoLelang Jakarta</div>
            <div style="margin-top: 2rem;">
              <h3 class="fw-bold" style="font-size: 1.1rem; margin-bottom: 1rem;">Jaringan Cabang Utama Kami</h3>
              <div class="grid-2" style="gap: 1rem;">
                <div class="card" style="margin-bottom: 0; padding: 0.8rem;">
                  <strong>📍 DKI Jakarta (HQ)</strong><br><span class="fs-sm text-muted">Kuningan, Jakarta Selatan</span>
                </div>
                <div class="card" style="margin-bottom: 0; padding: 0.8rem;">
                  <strong>📍 Jawa Barat</strong><br><span class="fs-sm text-muted">Soekarno Hatta, Bandung</span>
                </div>
                <div class="card" style="margin-bottom: 0; padding: 0.8rem;">
                  <strong>📍 Jawa Timur</strong><br><span class="fs-sm text-muted">Rungkut Industri, Surabaya</span>
                </div>
                <div class="card" style="margin-bottom: 0; padding: 0.8rem;">
                  <strong>📍 Sumatra Utara</strong><br><span class="fs-sm text-muted">Medan Baru, Kota Medan</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    } else if (p === 'p6-syarat') {
      mainContent = `
        <h2 class="page-title text-center" style="margin-top: 2rem;">Syarat & Ketentuan Umum Lelang</h2>
        <p class="page-subtitle text-center">Harap membaca panduan dan regulasi ini secara teliti sebelum mendaftar.</p>
        
        <div class="card mt-3" style="max-width: 800px; margin-left: auto; margin-right: auto; line-height: 1.7;">
          <h3 class="fw-bold" style="color: var(--wf-primary); font-size: 1.1rem; margin-bottom: 0.5rem;">1. Ketentuan Umum Pendaftaran</h3>
          <p class="fs-sm text-muted mb-2">Setiap peserta lelang (Bidder) wajib membuat akun terverifikasi menggunakan e-KTP dan nomor handphone yang aktif. Pendaftaran badan hukum/provider wajib menyertakan NPWP dan dokumen pendirian yang sah.</p>
          
          <h3 class="fw-bold" style="color: var(--wf-primary); font-size: 1.1rem; margin-top: 1.5rem; margin-bottom: 0.5rem;">2. Uang Jaminan Lelang (Deposit / NIPL)</h3>
          <p class="fs-sm text-muted mb-2">Untuk mengikuti penawaran lot lelang, Bidder wajib menyetorkan deposit jaminan melalui sistem Virtual Account resmi. Satu tiket NIPL berlaku untuk memenangkan satu lot kendaraan. Jika Bidder tidak memenangkan satu lot pun dalam sesi lelang, uang deposit jaminan akan dikembalikan (refund) 100% tanpa potongan dalam kurun waktu maksimal 2 hari kerja.</p>
          
          <h3 class="fw-bold" style="color: var(--wf-primary); font-size: 1.1rem; margin-top: 1.5rem; margin-bottom: 0.5rem;">3. Pelaksanaan Lelang & Hammer Price</h3>
          <p class="fs-sm text-muted mb-2">Penawaran harga lelang bersifat mengikat secara hukum. Ketika waktu sesi lelang berakhir dan tombol "Hammer Price" diketok oleh operator, penawar tertinggi dinyatakan sebagai Pemenang Lelang dan wajib melunasi sisa tagihan.</p>
          
          <h3 class="fw-bold" style="color: var(--wf-primary); font-size: 1.1rem; margin-top: 1.5rem; margin-bottom: 0.5rem;">4. Pembatalan Sepihak & Wanprestasi</h3>
          <p class="fs-sm text-muted mb-2">Apabila Pemenang Lelang tidak melakukan pelunasan sisa biaya pembelian dalam waktu maksimal 5 hari kerja setelah lelang selesai, pemenang dinyatakan Wanprestasi. Seluruh uang jaminan (deposit NIPL) akan hangus secara otomatis dan dialokasikan ke biaya administrasi platform.</p>
        </div>
      `;
    } else if (p === 'p7-faq') {
      mainContent = `
        <h2 class="page-title text-center" style="margin-top: 2rem;">Pertanyaan yang Sering Diajukan (FAQ)</h2>
        <p class="page-subtitle text-center">Temukan jawaban cepat untuk pertanyaan umum seputar proses lelang digital kami.</p>
        
        <div style="max-width: 800px; margin: 2rem auto;">
          <div class="accordion-item open" style="margin-bottom: 1rem;">
            <div class="accordion-header" style="font-weight: 700;">Bagaimana cara mendaftar sebagai peserta lelang? <span>▼</span></div>
            <div class="accordion-body" style="display: block; line-height: 1.6; padding-top: 0.5rem;">Anda dapat menekan tombol "Daftar" di header homepage, mengisi data formulir, melakukan verifikasi eKYC dengan mengambil foto e-KTP dan foto selfie. Setelah eKYC disetujui dalam 10 menit, akun Anda siap digunakan.</div>
          </div>
          <div class="accordion-item open" style="margin-bottom: 1rem;">
            <div class="accordion-header" style="font-weight: 700;">Apakah uang deposit akan hangus jika saya kalah lelang? <span>▼</span></div>
            <div class="accordion-body" style="display: block; line-height: 1.6; padding-top: 0.5rem;">Tidak. Uang jaminan (deposit NIPL) Anda dijamin aman 100%. Jika Anda kalah lelang atau tidak mengajukan penawaran, dana deposit akan di-refund sepenuhnya tanpa potongan administrasi langsung ke rekening bank yang Anda daftarkan dalam waktu maksimal 2 hari kerja.</div>
          </div>
          <div class="accordion-item open" style="margin-bottom: 1rem;">
            <div class="accordion-header" style="font-weight: 700;">Apa itu sistem Anti-Sniping? <span>▼</span></div>
            <div class="accordion-body" style="display: block; line-height: 1.6; padding-top: 0.5rem;">Anti-Sniping adalah sistem perlindungan untuk menghindari penawaran curang di detik-detik terakhir lelang. Jika ada peserta lelang melakukan bid baru dalam waktu kurang dari 2 menit sebelum penutupan lot, durasi countdown akan diperpanjang secara otomatis selama 2 menit tambahan untuk memberikan kesempatan kepada penawar lain.</div>
          </div>
        </div>
      `;
    } else if (p === 'p8-kontak') {
      mainContent = `
        <div class="grid-2" style="margin-top: 2rem; gap: 3rem;">
          <div>
            <h2 class="page-title">Hubungi Kami</h2>
            <p class="text-muted mb-2">Punya pertanyaan seputar lelang, kerjasama kemitraan provider, atau masalah teknis pembayaran? Silakan kirimkan pesan kepada kami melalui formulir di bawah ini.</p>
            
            <div class="card mt-2">
              <div class="form-group">
                <label class="form-label">Nama Lengkap <span class="required">*</span></label>
                <input type="text" class="form-input" placeholder="Masukkan nama Anda">
              </div>
              <div class="form-group">
                <label class="form-label">Alamat Email <span class="required">*</span></label>
                <input type="email" class="form-input" placeholder="Masukkan email Anda">
              </div>
              <div class="form-group">
                <label class="form-label">Subjek Pesan <span class="required">*</span></label>
                <input type="text" class="form-input" placeholder="Misal: Kerjasama Provider, Error Bayar">
              </div>
              <div class="form-group">
                <label class="form-label">Isi Pesan <span class="required">*</span></label>
                <textarea class="form-textarea" placeholder="Tuliskan detail pertanyaan atau keluhan Anda..."></textarea>
              </div>
              <button class="btn btn-primary w-100" style="justify-content: center;">Kirim Pesan</button>
            </div>
          </div>
          <div>
            <div class="card" style="background: var(--wf-primary); color: #fff;">
              <h3 class="fw-bold" style="color: var(--wf-gold); font-size: 1.2rem; margin-bottom: 1rem;">Informasi Kantor Pusat</h3>
              <p style="margin-bottom: 0.8rem;">🏛️ <strong>Gedung IndoLelang Tower</strong><br>Jl. Kuningan Mulia Blok X-5 No. 18, Jakarta Selatan, DKI Jakarta 12940.</p>
              <p style="margin-bottom: 0.8rem;">✉️ <strong>Email Resmi:</strong><br>info@indolelang.com / support@indolelang.com</p>
              <p style="margin-bottom: 0.8rem;">📞 <strong>Telepon Kantor:</strong><br>(021) 5098-8888</p>
              <p style="margin-bottom: 0.8rem;">💬 <strong>WhatsApp CS (24/7):</strong><br>+62-811-9988-7766</p>
            </div>
            
            <div class="card mt-2" style="padding: 0.5rem;">
              <div class="img-placeholder" style="height: 180px;">🗺️ Google Maps Placeholder</div>
            </div>
          </div>
        </div>
      `;
    }

    const content = `
      ${pubHeader(p.split('-')[0])}
      <main>${mainContent}</main>
      ${pubFooter}
    `;
    writePage('publik', p + '.html', p.replace('p', 'Halaman P'), htmlBoilerplate(p, 'layout-public', content, 'public'));
  });
}

function generateAuthPages() {
  const pages = ['a1-login', 'a2-register-bidder', 'a3-register-provider', 'a4-lupa-password', 'a5-verifikasi-otp', 'a6-ekyc-upload', 'a7-ekyc-status'];
  
  pages.forEach(p => {
    let cardContent = '';
    
    if (p === 'a1-login') {
      cardContent = `
        <div class="text-center mb-3">
          <h1 style="color:var(--wf-primary); margin-bottom:0.5rem;">🏛️ INDO-LELANG</h1>
          <p class="text-muted">Masuk ke Akun Anda</p>
        </div>
        <div class="form-group">
          <label class="form-label">Email / Nomor Handphone <span class="required">*</span></label>
          <input type="text" class="form-input" placeholder="Masukkan email atau no HP">
        </div>
        <div class="form-group">
          <label class="form-label">Password <span class="required">*</span></label>
          <input type="password" class="form-input" placeholder="Masukkan password">
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 1rem; font-size: 0.85rem;">
          <label><input type="checkbox"> Ingat Saya</label>
          <a href="a4-lupa-password.html">Lupa Password?</a>
        </div>
        
        <div style="display:flex; flex-direction:column; gap:0.5rem; margin-top:1.5rem;">
          <a href="../bidder/b1-dashboard.html" class="btn btn-primary w-100 text-center" style="justify-content:center;">Masuk Sebagai Bidder</a>
          <a href="../provider/s1-dashboard.html" class="btn btn-gold w-100 text-center" style="justify-content:center;">Masuk Sebagai Provider</a>
          <a href="../admin/ad1-dashboard.html" class="btn btn-outline w-100 text-center" style="justify-content:center;">Masuk Sebagai Admin</a>
        </div>
        <div class="text-center mt-3" style="font-size:0.85rem;">
          Belum punya akun? <a href="a2-register-bidder.html">Daftar Bidder</a> atau <a href="a3-register-provider.html">Daftar Provider</a>
        </div>
      `;
    } else if (p === 'a2-register-bidder') {
      cardContent = `
        <div class="text-center mb-3">
          <h1 style="color:var(--wf-primary); margin-bottom:0.5rem;">🏛️ INDO-LELANG</h1>
          <p class="text-muted">Daftar Akun Baru</p>
        </div>
        
        <!-- Tipe Akun Switcher -->
        <div class="tabs" style="display:flex; margin-bottom:1.5rem;">
          <a href="a2-register-bidder.html" class="tab active" style="flex:1; text-align:center; padding: 0.6rem 0; font-weight:600; text-decoration:none;">🙋 Bidder (Pembeli)</a>
          <a href="a3-register-provider.html" class="tab" style="flex:1; text-align:center; padding: 0.6rem 0; text-decoration:none;">🏢 Provider (Seller)</a>
        </div>

        <div class="form-group">
          <label class="form-label">Nama Lengkap Sesuai KTP <span class="required">*</span></label>
          <input type="text" class="form-input" placeholder="Misal: Budi Santoso">
        </div>
        <div class="form-group">
          <label class="form-label">Nomor Handphone (WhatsApp) <span class="required">*</span></label>
          <input type="text" class="form-input" placeholder="Misal: 08123456789">
        </div>
        <div class="form-group">
          <label class="form-label">Email Aktif <span class="required">*</span></label>
          <input type="email" class="form-input" placeholder="Masukkan alamat email">
        </div>
        <div class="form-group">
          <label class="form-label">Password Baru <span class="required">*</span></label>
          <input type="password" class="form-input" placeholder="Minimal 8 karakter">
        </div>
        <label style="display: block; margin-bottom: 1rem; font-size: 0.85rem;">
          <input type="checkbox" required> Saya menyetujui <a href="../publik/p6-syarat.html">Syarat & Ketentuan</a> IndoLelang.
        </label>
        <a href="a5-verifikasi-otp.html" class="btn btn-primary w-100 text-center" style="justify-content:center;">Daftar Akun</a>
        <div class="text-center mt-3" style="font-size:0.85rem;">
          Sudah memiliki akun? <a href="a1-login.html">Login di Sini</a>
        </div>
      `;
    } else if (p === 'a3-register-provider') {
      cardContent = `
        <div class="text-center mb-3">
          <h1 style="color:var(--wf-primary); margin-bottom:0.5rem;">🏛️ INDO-LELANG</h1>
          <p class="text-muted">Daftar Akun Baru</p>
        </div>
        
        <!-- Tipe Akun Switcher -->
        <div class="tabs" style="display:flex; margin-bottom:1.5rem;">
          <a href="a2-register-bidder.html" class="tab" style="flex:1; text-align:center; padding: 0.6rem 0; text-decoration:none;">🙋 Bidder (Pembeli)</a>
          <a href="a3-register-provider.html" class="tab active" style="flex:1; text-align:center; padding: 0.6rem 0; font-weight:600; text-decoration:none;">🏢 Provider (Seller)</a>
        </div>

        <div class="form-group">
          <label class="form-label">Nama Perusahaan / Lembaga <span class="required">*</span></label>
          <input type="text" class="form-input" placeholder="Misal: PT Astra Auto">
        </div>
        <div class="form-group">
          <label class="form-label">Nomor NPWP Perusahaan <span class="required">*</span></label>
          <input type="text" class="form-input" placeholder="Masukkan 16 digit NPWP">
        </div>
        <div class="form-group">
          <label class="form-label">Nama PIC / Penanggung Jawab <span class="required">*</span></label>
          <input type="text" class="form-input" placeholder="Misal: Andi Wijaya">
        </div>
        <div class="form-group">
          <label class="form-label">Email Resmi Perusahaan <span class="required">*</span></label>
          <input type="email" class="form-input" placeholder="Masukkan email perusahaan">
        </div>
        <div class="form-group">
          <label class="form-label">Password Akun <span class="required">*</span></label>
          <input type="password" class="form-input" placeholder="Buat password aman">
        </div>
        <a href="a5-verifikasi-otp.html" class="btn btn-gold w-100 text-center" style="justify-content:center;">Daftar Sebagai Provider</a>
        <div class="text-center mt-3" style="font-size:0.85rem;">
          Sudah memiliki akun? <a href="a1-login.html">Login di Sini</a>
        </div>
      `;
    } else if (p === 'a4-lupa-password') {
      cardContent = `
        <div class="text-center mb-3">
          <h1 style="color:var(--wf-primary); margin-bottom:0.5rem;">🏛️ INDO-LELANG</h1>
          <p class="text-muted">Reset Password Akun</p>
        </div>
        <p class="fs-sm text-muted mb-2 text-center">Masukkan email terdaftar Anda. Kami akan mengirimkan tautan verifikasi pemulihan password.</p>
        <div class="form-group">
          <label class="form-label">Alamat Email Terdaftar <span class="required">*</span></label>
          <input type="email" class="form-input" placeholder="Masukkan email">
        </div>
        <button class="btn btn-primary w-100" style="justify-content:center;">Kirim Link Reset</button>
        <div class="text-center mt-3"><a href="a1-login.html">&larr; Kembali ke Halaman Login</a></div>
      `;
    } else if (p === 'a5-verifikasi-otp') {
      cardContent = `
        <div class="text-center mb-3">
          <h1 style="color:var(--wf-primary); margin-bottom:0.5rem;">🏛️ INDO-LELANG</h1>
          <p class="text-muted">Verifikasi Kode OTP</p>
        </div>
        <p class="fs-sm text-muted mb-2 text-center">Kode OTP 6 digit telah dikirimkan ke nomor WhatsApp Anda. Masukkan kode tersebut di bawah ini.</p>
        
        <div style="display:flex; justify-content:center; gap:0.5rem; margin:1.5rem 0;">
          <input type="text" class="form-input text-center" style="width:50px; font-size:1.5rem; font-weight:700;" placeholder="3" maxlength="1">
          <input type="text" class="form-input text-center" style="width:50px; font-size:1.5rem; font-weight:700;" placeholder="5" maxlength="1">
          <input type="text" class="form-input text-center" style="width:50px; font-size:1.5rem; font-weight:700;" placeholder="1" maxlength="1">
          <input type="text" class="form-input text-center" style="width:50px; font-size:1.5rem; font-weight:700;" placeholder="9" maxlength="1">
          <input type="text" class="form-input text-center" style="width:50px; font-size:1.5rem; font-weight:700;" placeholder="" maxlength="1">
          <input type="text" class="form-input text-center" style="width:50px; font-size:1.5rem; font-weight:700;" placeholder="" maxlength="1">
        </div>
        
        <a href="a6-ekyc-upload.html" class="btn btn-primary w-100 text-center" style="justify-content:center;">Verifikasi OTP</a>
        <div class="text-center mt-3" style="font-size:0.85rem; color:var(--wf-text-light);">
          Tidak menerima kode? <a href="#">Kirim Ulang (01:45)</a>
        </div>
      `;
    } else if (p === 'a6-ekyc-upload') {
      cardContent = `
        <div class="text-center mb-3">
          <h1 style="color:var(--wf-primary); margin-bottom:0.5rem;">🏛️ INDO-LELANG</h1>
          <p class="text-muted">Lengkapi eKYC & Identitas</p>
        </div>
        <p class="fs-sm text-muted mb-2">Untuk keamanan transaksi lelang, harap upload data e-KTP dan foto selfie memegang KTP Anda.</p>
        
        <div class="form-group mt-2">
          <label class="form-label">Nomor Induk Kependudukan (NIK) <span class="required">*</span></label>
          <input type="text" class="form-input" placeholder="Masukkan 16 digit NIK KTP">
        </div>
        
        <div class="form-group">
          <label class="form-label">Foto e-KTP Depan <span class="required">*</span></label>
          <div class="upload-zone" style="padding:1rem;">
            <div class="upload-icon">📷</div>
            <div class="fs-sm">Ambil / Seret Foto KTP di sini</div>
            <div class="text-muted" style="font-size:0.75rem;">Format JPG/PNG maks. 5MB</div>
          </div>
        </div>
        
        <div class="form-group">
          <label class="form-label">Foto Selfie dengan KTP <span class="required">*</span></label>
          <div class="upload-zone" style="padding:1rem;">
            <div class="upload-icon">🤳</div>
            <div class="fs-sm">Ambil Foto Selfie Pegang KTP Anda</div>
          </div>
        </div>
        
        <a href="a7-ekyc-status.html" class="btn btn-primary w-100 text-center" style="justify-content:center;">Kirim Dokumen eKYC</a>
      `;
    } else if (p === 'a7-ekyc-status') {
      cardContent = `
        <div class="text-center mb-3">
          <h1 style="color:var(--wf-primary); margin-bottom:0.5rem;">🏛️ INDO-LELANG</h1>
          <p class="text-muted">Status eKYC & Identitas</p>
        </div>

        <!-- Mode Otomatis (SDK Pihak Ketiga) -->
        <div id="ekyc-sdk-container" style="display:none;">
          <div class="text-center" style="padding:1.5rem; background:rgba(30, 144, 255, 0.05); border:1px solid #1e90ff; border-radius:8px; margin-bottom:1.5rem;">
            <div id="sdk-scanner" style="position:relative; width:100px; height:100px; margin:0 auto 1rem; border-radius:50%; border:3px solid #1e90ff; display:flex; align-items:center; justify-content:center; overflow:hidden;">
              <div style="font-size:2.5rem;">🤳</div>
              <div id="sdk-scan-bar" style="position:absolute; width:100%; height:4px; background:#00ff00; top:0; left:0; box-shadow:0 0 8px #00ff00; animation: scanAnim 1.5s infinite alternate;"></div>
            </div>
            <h3 class="fw-bold" style="color:#1e90ff;" id="sdk-title">Privy e-KYC Verification</h3>
            <p class="fs-sm text-muted mt-1" id="sdk-status-desc">Menghubungkan ke server identitas...</p>
          </div>
          
          <div style="background:var(--wf-bg); padding:1rem; border-radius:8px; margin-bottom:1.5rem; font-size:0.85rem; text-align:left;">
            <div style="margin-bottom:0.5rem; display:flex; justify-content:space-between; align-items:center;">
              <span>1. Membaca data KTP (OCR)</span>
              <span id="chk-ocr" style="color:var(--wf-text-light);">⏳ Menunggu</span>
            </div>
            <div style="margin-bottom:0.5rem; display:flex; justify-content:space-between; align-items:center;">
              <span>2. Deteksi Keaktifan (Liveness)</span>
              <span id="chk-liveness" style="color:var(--wf-text-light);">⏳ Menunggu</span>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <span>3. Pencocokan Dukcapil</span>
              <span id="chk-dukcapil" style="color:var(--wf-text-light);">⏳ Menunggu</span>
            </div>
          </div>
        </div>

        <!-- Mode Manual -->
        <div id="ekyc-manual-container" style="display:none;">
          <div class="text-center" style="padding:1.5rem; background:var(--wf-gold-bg); border-radius:8px; margin-bottom:1.5rem;">
            <div style="font-size:3rem; margin-bottom:0.5rem;" id="manual-icon">⏳</div>
            <h3 class="fw-bold" style="color:#7d6608;" id="manual-title">Dokumen Sedang Diverifikasi</h3>
            <p class="fs-sm text-muted mt-1" id="manual-desc">Dokumen identitas Anda sedang diverifikasi secara manual oleh Tim Admin Indo-Lelang. Estimasi verifikasi selesai dalam 5-10 menit.</p>
          </div>
          
          <div style="font-size:0.85rem; line-height:1.8; text-align:left; background:var(--wf-bg); padding:1rem; border-radius:8px; margin-bottom:1rem;" class="text-muted">
            <strong>Detail Dokumen Terkirim:</strong><br>
            • NIK: 327310******9003<br>
            • Nama: Budi Santoso<br>
            • Metode: Verifikasi Manual Admin
          </div>
          
          <!-- Tombol Helper untuk Demo Cepat -->
          <div style="margin-bottom:1rem;">
            <button class="btn btn-outline w-100 btn-sm" id="btn-helper-approve-manual" style="justify-content:center; border-style:dashed;">⚡ Simulasikan Admin Approve Akun</button>
          </div>
        </div>

        <!-- Button Lanjut -->
        <a href="../bidder/b1-dashboard.html" class="btn btn-primary w-100 text-center" id="btn-ekyc-continue" style="justify-content:center;">Masuk ke Dashboard</a>

        <style>
          @keyframes scanAnim {
            0% { top: 0%; }
            100% { top: 100%; }
          }
        </style>

        <script>
          document.addEventListener('DOMContentLoaded', function() {
            const ekycMode = localStorage.getItem('ekyc_mode') || 'manual';
            const sdkContainer = document.getElementById('ekyc-sdk-container');
            const manualContainer = document.getElementById('ekyc-manual-container');
            const btnContinue = document.getElementById('btn-ekyc-continue');
            const btnHelper = document.getElementById('btn-helper-approve-manual');
            
            // Check current status
            let currentStatus = localStorage.getItem('user_ekyc_status') || 'pending';
            
            if (ekycMode === 'otomatis') {
              sdkContainer.style.display = 'block';
              btnContinue.style.display = 'none'; // Hide continue button during verification
              
              if (currentStatus === 'verified') {
                showOtomatisSuccess();
              } else {
                startOtomatisVerification();
              }
            } else {
              manualContainer.style.display = 'block';
              
              if (currentStatus === 'verified') {
                showManualSuccess();
              } else {
                // Pending state
                btnContinue.classList.add('btn-outline');
                btnContinue.style.pointerEvents = 'none';
                btnContinue.innerText = 'Menunggu Verifikasi Admin...';
              }
            }
            
            // Helper approve button for manual demo
            btnHelper.addEventListener('click', function() {
              localStorage.setItem('user_ekyc_status', 'verified');
              showManualSuccess();
              alert('Simulasi: Admin telah menyetujui dokumen eKYC Budi Santoso!');
            });
            
            function startOtomatisVerification() {
              const chkOcr = document.getElementById('chk-ocr');
              const chkLiveness = document.getElementById('chk-liveness');
              const chkDukcapil = document.getElementById('chk-dukcapil');
              const statusDesc = document.getElementById('sdk-status-desc');
              
              statusDesc.innerText = 'Menginisialisasi kamera...';
              
              setTimeout(() => {
                statusDesc.innerText = 'Membaca data KTP...';
                chkOcr.innerHTML = '<span style="color:#00ff00;">⏳ Proses...</span>';
              }, 800);
              
              setTimeout(() => {
                chkOcr.innerHTML = '<span style="color:var(--wf-success);">✔️ Sukses</span>';
                statusDesc.innerText = 'Menguji keaktifan wajah (liveness)...';
                chkLiveness.innerHTML = '<span style="color:#00ff00;">⏳ Proses...</span>';
              }, 2000);
              
              setTimeout(() => {
                chkLiveness.innerHTML = '<span style="color:var(--wf-success);">✔️ Sukses</span>';
                statusDesc.innerText = 'Mencocokkan data ke Dukcapil...';
                chkDukcapil.innerHTML = '<span style="color:#00ff00;">⏳ Proses...</span>';
              }, 3500);
              
              setTimeout(() => {
                chkDukcapil.innerHTML = '<span style="color:var(--wf-success);">✔️ Sukses</span>';
                localStorage.setItem('user_ekyc_status', 'verified');
                showOtomatisSuccess();
              }, 5000);
            }
            
            function showOtomatisSuccess() {
              const scanBar = document.getElementById('sdk-scan-bar');
              const scanner = document.getElementById('sdk-scanner');
              const statusDesc = document.getElementById('sdk-status-desc');
              const chkOcr = document.getElementById('chk-ocr');
              const chkLiveness = document.getElementById('chk-liveness');
              const chkDukcapil = document.getElementById('chk-dukcapil');
              const sdkTitle = document.getElementById('sdk-title');
              
              if (scanBar) scanBar.style.display = 'none';
              if (scanner) {
                scanner.style.borderColor = 'var(--wf-success)';
                scanner.innerHTML = '<div style="font-size:3rem;">✔️</div>';
              }
              if (statusDesc) statusDesc.innerHTML = '<span style="color:var(--wf-success); font-weight:bold;">e-KYC Sukses & Terverifikasi!</span>';
              if (sdkTitle) sdkTitle.innerText = 'Privy SDK';
              
              if (chkOcr) chkOcr.innerHTML = '<span style="color:var(--wf-success);">✔️ Sukses</span>';
              if (chkLiveness) chkLiveness.innerHTML = '<span style="color:var(--wf-success);">✔️ Sukses</span>';
              if (chkDukcapil) chkDukcapil.innerHTML = '<span style="color:var(--wf-success);">✔️ Sukses</span>';
              
              btnContinue.style.display = 'inline-flex';
              btnContinue.classList.remove('btn-outline');
              btnContinue.style.pointerEvents = 'auto';
              btnContinue.innerText = 'Lanjut ke Dashboard (Akun Aktif) 🚀';
            }
            
            function showManualSuccess() {
              const icon = document.getElementById('manual-icon');
              const title = document.getElementById('manual-title');
              const desc = document.getElementById('manual-desc');
              
              icon.innerText = '✔️';
              title.innerText = 'Akun Terverifikasi';
              title.style.color = 'var(--wf-success)';
              desc.innerText = 'Selamat! Tim Admin Indo-Lelang telah memverifikasi dokumen eKYC Anda. Akun Anda kini aktif.';
              
              btnHelper.style.display = 'none';
              btnContinue.classList.remove('btn-outline');
              btnContinue.style.pointerEvents = 'auto';
              btnContinue.innerText = 'Masuk ke Dashboard 🚀';
            }
          });
        </script>
      `;
    }

    const content = `
      <div style="min-height:100vh; display:flex; align-items:center; justify-content:center; padding:2rem; background:var(--wf-primary);">
        <div class="card" style="width:100%; max-width:480px; margin: 0;">
          ${cardContent}
        </div>
      </div>
    `;
    writePage('auth', p + '.html', p.replace('a', 'Auth '), htmlBoilerplate(p, 'layout-public', content, 'public'));
  });
}

function generatePanelPages(area, prefix, menuItems, initial) {
  const pages = menuItems.map(g => g.items).flat();
  
  // Add additional detailed screens
  if (area === 'bidder') {
    pages.push(
      { id: 'b4', name: 'Detail Lot (Login)', link: 'b4-detail-lot.html' },
      { id: 'b8', name: 'Ruang Lelang + Live Streaming', link: 'b8-bidding-stream.html' },
      { id: 'b9', name: 'Hasil Lelang / Invoice', link: 'b9-invoice.html' }
    );
  } else if (area === 'provider') {
    pages.push(
      { id: 's4', name: 'Batch Upload Barang', link: 's4-batch-upload.html' },
      { id: 's6', name: 'Detail Barang & Tracking', link: 's6-detail-barang.html' }
    );
  } else if (area === 'admin') {
    pages.push(
      { id: 'ad4b', name: 'Tambah Staf Baru', link: 'ad4b-tambah-staf.html' },
      { id: 'ad5', name: 'Detail Pengguna', link: 'ad5-detail-user.html' },
      { id: 'ad8', name: 'Detail Barang & Inspeksi', link: 'ad8-detail-barang.html' },
      { id: 'ad12', name: 'Buat / Edit Sesi Lelang', link: 'ad12-form-sesi.html' },
      { id: 'ad19', name: 'Laporan Sesi Lelang', link: 'ad19-laporan-sesi.html' },
      { id: 'ad20', name: 'Laporan Keuangan', link: 'ad20-laporan-keuangan.html' }
    );
  }

  pages.forEach(p => {
    let specificContent = '';
    
    // --- AREA 3: BIDDER PANEL SCREENS ---
    if (area === 'bidder') {
      if (p.id === 'b1') { // Bidder Dashboard
        specificContent = `
          <div class="alert alert-info" id="ekyc-alert-banner">
            <div>
              <strong>🔔 Pengingat eKYC:</strong> Akun Anda sedang diperiksa.
            </div>
          </div>
          
          <script>
            document.addEventListener('DOMContentLoaded', function() {
              const alertBanner = document.getElementById('ekyc-alert-banner');
              const ekycStatus = localStorage.getItem('user_ekyc_status') || 'pending';
              
              if (ekycStatus === 'verified') {
                alertBanner.className = 'alert alert-success';
                alertBanner.innerHTML = '<div><strong>🟢 Akun Terverifikasi (eKYC Aktif):</strong> Anda memiliki akses penuh ke fitur lelang dan pembelian NIPL.</div>';
              } else if (ekycStatus === 'rejected') {
                alertBanner.className = 'alert alert-danger';
                alertBanner.innerHTML = '<div><strong>❌ Verifikasi eKYC Ditolak:</strong> Dokumen Anda ditolak oleh admin. Harap unggah ulang dokumen yang valid. <a href="../auth/a6-ekyc-upload.html" class="fw-bold" style="text-decoration:underline; color:inherit; margin-left:0.5rem;">Unggah Ulang Dokumen</a></div>';
              } else {
                alertBanner.className = 'alert alert-warning';
                alertBanner.innerHTML = '<div><strong>⚠️ Akun Belum Terverifikasi (eKYC Pending):</strong> Anda tidak dapat membeli NIPL atau ikut serta dalam lelang sebelum melengkapi verifikasi eKYC. <a href="../auth/a6-ekyc-upload.html" class="fw-bold" style="text-decoration:underline; color:inherit; margin-left:0.5rem;">Verifikasi Sekarang</a></div>';
              }
            });
          </script>
          <div class="kpi-grid">
            <div class="kpi-card"><div class="kpi-label">NIPL Aktif</div><div class="kpi-value">2 Tiket</div><div class="kpi-trend up">Mobil & Motor</div></div>
            <div class="kpi-card gold"><div class="kpi-label">Lot Diikuti</div><div class="kpi-value">3 Lot</div><div class="kpi-trend">Sedang Berjalan</div></div>
            <div class="kpi-card success"><div class="kpi-label">Saldo Deposit</div><div class="kpi-value">Rp 6.000.000</div><div class="kpi-trend">VA Otomatis</div></div>
            <div class="kpi-card"><div class="kpi-label">Lot Dimenangkan</div><div class="kpi-value">1 Unit</div><div class="kpi-trend text-primary">Siap Dilunasi</div></div>
          </div>
          <div class="grid-2-1">
            <div class="card">
              <div class="card-header">Sesi Lelang yang Sedang Berlangsung</div>
              <div class="table-wrapper">
                <table>
                  <thead>
                    <tr><th>Nama Sesi</th><th>Jumlah Lot</th><th>Waktu Mulai</th><th>Status</th><th>Aksi</th></tr>
                  </thead>
                  <tbody>
                    <tr><td>Mobil Penumpang Jakarta - Batch 15</td><td>45 Lot</td><td>Hari ini, 10:00</td><td><span class="badge badge-success">LIVE</span></td><td><a href="b7-bidding-room.html" class="btn btn-sm btn-gold">Masuk Ruang Lelang</a></td></tr>
                    <tr><td>Sepeda Motor Bandung - Batch 22</td><td>120 Lot</td><td>Hari ini, 14:00</td><td><span class="badge badge-warning">Menunggu</span></td><td><a href="b3-katalog.html" class="btn btn-sm btn-outline">Lihat Katalog</a></td></tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div class="card">
              <div class="card-header">Notifikasi Terbaru</div>
              <div class="fs-sm">
                <div class="mb-1" style="padding: 0.5rem; background: var(--wf-bg); border-radius: 4px;">🎯 <strong>Lelang Dimenangkan:</strong> Lot #1045 Toyota Avanza 2022. Segera lunasi!</div>
                <div class="mb-1" style="padding: 0.5rem; background: var(--wf-bg); border-radius: 4px;">💰 <strong>Deposit Berhasil:</strong> Deposit Rp 5.000.000 terverifikasi. NIPL diterbitkan.</div>
              </div>
            </div>
          </div>
          <div class="grid-2" style="margin-top: 1rem;">
            <div class="card" style="margin-bottom:0;">
              <div class="card-header">📈 Tren Keikutsertaan Penawaran (Bids Placed)</div>
              <div style="padding:1rem 0;">
                <svg viewBox="0 0 400 150" style="width:100%; height:auto; display:block; overflow:visible;">
                  <line x1="40" y1="20" x2="380" y2="20" stroke="#f1f2f6" stroke-width="1" />
                  <line x1="40" y1="70" x2="380" y2="70" stroke="#f1f2f6" stroke-width="1" />
                  <line x1="40" y1="120" x2="380" y2="120" stroke="#dcdde1" stroke-width="1" />
                  <path d="M 60,110 L 120,90 L 180,40 L 240,85 L 300,50 L 360,30" fill="none" stroke="var(--wf-accent)" stroke-width="2.5" stroke-linecap="round" />
                  <circle cx="60" cy="110" r="3" fill="#fff" stroke="var(--wf-accent)" stroke-width="2" />
                  <circle cx="120" cy="90" r="3" fill="#fff" stroke="var(--wf-accent)" stroke-width="2" />
                  <circle cx="180" cy="40" r="3" fill="#fff" stroke="var(--wf-accent)" stroke-width="2" />
                  <circle cx="240" cy="85" r="3" fill="#fff" stroke="var(--wf-accent)" stroke-width="2" />
                  <circle cx="300" cy="50" r="3" fill="#fff" stroke="var(--wf-accent)" stroke-width="2" />
                  <circle cx="360" cy="30" r="4" fill="#fff" stroke="var(--wf-gold)" stroke-width="3" />
                  <text x="60" y="138" fill="var(--wf-text-muted)" font-size="9" text-anchor="middle">Sesi 1</text>
                  <text x="120" y="138" fill="var(--wf-text-muted)" font-size="9" text-anchor="middle">Sesi 2</text>
                  <text x="180" y="138" fill="var(--wf-text-muted)" font-size="9" text-anchor="middle">Sesi 3</text>
                  <text x="240" y="138" fill="var(--wf-text-muted)" font-size="9" text-anchor="middle">Sesi 4</text>
                  <text x="300" y="138" fill="var(--wf-text-muted)" font-size="9" text-anchor="middle">Sesi 5</text>
                  <text x="360" y="138" fill="var(--wf-text-muted)" font-size="9" text-anchor="middle">Sesi 6</text>
                </svg>
              </div>
            </div>
            <div class="card" style="margin-bottom:0;">
              <div class="card-header">📊 Status Penawaran & Anggaran Uang Jaminan</div>
              <div style="display:flex; justify-content:space-around; align-items:center; height:100%; padding:1rem 0;">
                <svg viewBox="0 0 100 100" style="width:90px; height:90px; transform: rotate(-90deg); display:block;">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#f1f2f6" stroke-width="12" />
                  <circle cx="50" cy="50" r="40" fill="none" stroke="var(--wf-primary)" stroke-width="12" stroke-dasharray="209.4 41.8" />
                  <circle cx="50" cy="50" r="40" fill="none" stroke="var(--wf-gold)" stroke-width="12" stroke-dasharray="42.0 209.2" stroke-dashoffset="-209.4" />
                </svg>
                <div style="font-size:0.8rem; display:flex; flex-direction:column; gap:0.4rem;">
                  <div>🔵 <strong>Uang Jaminan Aktif:</strong> Rp 5.000.000 (83%)</div>
                  <div>🟡 <strong>Saldo Bebas (Refundable):</strong> Rp 1.000.000 (17%)</div>
                </div>
              </div>
            </div>
          </div>
        `;
      } else if (p.id === 'b2') { // Bidder Profile
        specificContent = `
          <div class="grid-2">
            <div class="card">
              <div class="card-header">Profil Pengguna</div>
              <div class="form-group">
                <label class="form-label">Nama Lengkap</label>
                <input type="text" class="form-input" value="Budi Santoso" disabled>
              </div>
              <div class="form-group">
                <label class="form-label">Nomor Induk Kependudukan (NIK)</label>
                <input type="text" class="form-input" value="327310******9003" disabled>
              </div>
              <div class="form-group">
                <label class="form-label">Email</label>
                <input type="email" class="form-input" value="budi.santoso@gmail.com">
              </div>
              <div class="form-group">
                <label class="form-label">Nomor Handphone (WhatsApp)</label>
                <input type="text" class="form-input" value="08123456789">
              </div>
              <div class="form-group">
                <label class="form-label">Nama Bank Pemilik Rekening (Untuk Refund)</label>
                <select class="form-select">
                  <option selected>Bank Central Asia (BCA)</option>
                  <option>Bank Mandiri</option>
                  <option>Bank BNI</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Nomor Rekening Refund</label>
                <input type="text" class="form-input" value="8098765432">
              </div>
              <button class="btn btn-primary">Simpan Pengaturan</button>
            </div>
            <div class="card">
              <div class="card-header">Status eKYC & Keamanan</div>
              <div class="alert alert-success">
                <div>eKYC Anda Aktif dan Terverifikasi pada 10 Juni 2026.</div>
              </div>
              <div class="form-group">
                <label class="form-label">Password Lama</label>
                <input type="password" class="form-input">
              </div>
              <div class="form-group">
                <label class="form-label">Password Baru</label>
                <input type="password" class="form-input">
              </div>
              <button class="btn btn-outline">Ubah Password</button>
            </div>
          </div>
        `;
      } else if (p.id === 'b3') { // Bidder Catalog
        specificContent = `
          <div class="toolbar">
            <div class="toolbar-left">
              <input type="text" class="form-input" placeholder="Cari merk lot lelang..." style="width: 250px;">
              <select class="form-select"><option>Mobil</option><option>Motor</option></select>
            </div>
            <div class="toolbar-right">
              <span class="fs-sm mr-2">NIPL Aktif Anda: <strong>2 Tiket</strong></span>
              <a href="b6-deposit.html" class="btn btn-gold">+ Beli NIPL</a>
            </div>
          </div>
          <div class="lot-grid" style="grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));">
            ${[1, 2, 3, 4].map(i => `
              <div class="lot-card">
                <div class="lot-img" style="font-size:2.5rem;">🚗</div>
                <div class="lot-body">
                  <div class="lot-title">Toyota Avanza 1.3 G 2022</div>
                  <div class="lot-price">Rp 145.000.000</div>
                  <div class="lot-meta">Grade B • Gudang JKT</div>
                  <div class="lot-countdown mt-1" style="font-size:0.8rem; font-weight:700;">Waktu: 12 Jun, 10:00</div>
                  <div style="display:flex; gap:0.5rem;" class="mt-2">
                    <a href="b4-detail-lot.html" class="btn btn-sm btn-outline" style="flex:1; justify-content:center;">Detail</a>
                    <a href="b7-bidding-room.html" class="btn btn-sm btn-primary" style="flex:1; justify-content:center;">Bid</a>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        `;
      } else if (p.id === 'b4') { // Bidder Lot Detail
        specificContent = `
          <div class="grid-2-1" style="grid-template-columns: 1.5fr 1fr; gap: 2rem;">
            <div>
              <div class="img-placeholder" style="height: 320px; font-size: 3rem;">🚗 Toyota Avanza 2022</div>
              <div class="card mt-2">
                <div class="card-header">Detail & Hasil Inspeksi</div>
                <table style="width:100%;">
                  <tbody>
                    <tr><td>Tahun / Warna</td><td>2022 / Hitam Metalik</td></tr>
                    <tr><td>Odometer</td><td>45,310 KM</td></tr>
                    <tr><td>Transmisi</td><td>Manual</td></tr>
                    <tr><td>Kondisi Interior</td><td>Sangat Bersih, AC Dingin (Appraisal Grade B)</td></tr>
                    <tr><td>Kondisi Eksterior</td><td>Ada baret halus bumper depan (Appraisal Grade B)</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div>
              <div class="card" style="border-top: 4px solid var(--wf-gold);">
                <h2 style="font-size:1.3rem; font-weight:700;">Toyota Avanza 1.3 G MT 2022</h2>
                <p class="text-muted">Lot #1045 • Sesi Mobil Jakarta</p>
                <div class="separator"></div>
                <div class="mb-2">
                  <span class="text-muted fs-sm">Harga Dasar:</span>
                  <div class="bid-current-price" style="color:var(--wf-primary); font-size:1.8rem; margin:0.2rem 0;">Rp 145.000.000</div>
                </div>
                <div class="alert alert-info">
                  <div>Status NIPL Anda: <span class="badge badge-success">SIAP (NIPL #98122)</span></div>
                </div>
                <a href="b7-bidding-room.html" class="btn btn-gold w-100 text-center" style="justify-content:center;">Masuk Ruang Lelang</a>
              </div>
            </div>
          </div>
        `;
      } else if (p.id === 'b5') { // Watchlist
        specificContent = `
          <div class="card">
            <div class="table-wrapper">
              <table>
                <thead>
                  <tr><th>Foto</th><th>Detail Lot</th><th>Harga Dasar</th><th>Jadwal Lelang</th><th>Status</th><th>Aksi</th></tr>
                </thead>
                <tbody>
                  <tr>
                    <td style="font-size:2rem;">🚗</td>
                    <td class="fw-bold">Lot #1045 - Toyota Avanza 1.3 G MT 2022<br><span class="text-muted fs-sm">Grade B • Lokasi: Jakarta</span></td>
                    <td class="fw-bold text-primary">Rp 145.000.000</td>
                    <td>12 Juni 2026, 10:00 WIB</td>
                    <td><span class="badge badge-success">Segera Mulai</span></td>
                    <td>
                      <a href="b7-bidding-room.html" class="btn btn-sm btn-primary">Masuk Live</a>
                      <button class="btn btn-sm btn-outline text-danger">Hapus</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        `;
      } else if (p.id === 'b6') { // Deposit / NIPL
        specificContent = `
          <div class="grid-2-1" style="grid-template-columns: 1.5fr 1fr; gap:2rem;">
            <div class="card">
              <div class="card-header">Pembelian Jaminan Lelang (NIPL)</div>
              <div class="form-group">
                <label class="form-label">Pilih Sesi Lelang</label>
                <select class="form-select">
                  <option selected>Lelang Mobil Penumpang Jakarta - Batch 15 (Deposit: Rp 5.000.000 / NIPL)</option>
                  <option>Lelang Sepeda Motor Bandung - Batch 22 (Deposit: Rp 1.000.000 / NIPL)</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Jumlah Tiket NIPL Yang Ingin Dibeli</label>
                <input type="number" class="form-input" value="1" min="1">
                <span class="form-hint">Satu tiket NIPL hanya berlaku untuk memenangkan 1 unit lot.</span>
              </div>
              <div class="form-group">
                <label class="form-label">Pilih Metode Pembayaran</label>
                <div style="display:flex; flex-direction:column; gap:0.5rem; font-size:0.9rem;">
                  <label><input type="radio" name="paymethod" checked> Virtual Account BCA (Verifikasi Otomatis)</label>
                  <label><input type="radio" name="paymethod"> Virtual Account Mandiri (Verifikasi Otomatis)</label>
                  <label><input type="radio" name="paymethod"> GoPay / E-Wallet</label>
                </div>
              </div>
              <button class="btn btn-primary">Pesan & Dapatkan Nomor VA</button>
            </div>
            
            <div class="card">
              <div class="card-header">Instruksi Virtual Account</div>
              <div class="text-center" style="padding:1rem; background:var(--wf-bg); border-radius:6px; margin-bottom:1rem;">
                <div class="text-muted fs-sm">Nomor VA BCA:</div>
                <div class="fw-bold" style="font-size:1.4rem; color:var(--wf-primary);">8077708123456789</div>
                <div class="text-muted fs-sm">Total Pembayaran: <strong>Rp 5.000.000</strong></div>
              </div>
              <div class="fs-sm text-muted">
                <strong>Cara Transfer:</strong><br>
                1. Masuk ke m-BCA > Transfer > BCA Virtual Account.<br>
                2. Masukkan nomor VA di atas.<br>
                3. Pastikan nominal transfer sesuai tagihan.<br>
                4. Setelah transfer, NIPL Anda akan aktif otomatis dalam 1 menit.
              </div>
              <div class="separator"></div>
              <button class="btn btn-success w-100" id="btn-simulate-dep-pay" style="justify-content:center;">⚡ Simulasikan Pembayaran VA Sukses</button>
            </div>
          </div>
          
          <script>
            document.addEventListener('DOMContentLoaded', function() {
              const btnSimulate = document.getElementById('btn-simulate-dep-pay');
              const ekycStatus = localStorage.getItem('user_ekyc_status') || 'pending';
              
              if (ekycStatus !== 'verified') {
                const mainCard = document.querySelector('.grid-2-1');
                if (mainCard) {
                  const overlay = document.createElement('div');
                  overlay.style.cssText = 'position:absolute; top:0; left:0; width:100%; height:100%; background:rgba(255,255,255,0.9); z-index:100; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; padding:2rem; border-radius:8px;';
                  overlay.innerHTML = \`
                    <div style="font-size:3.5rem; margin-bottom:1rem;">🔒</div>
                    <h3 class="fw-bold" style="color:var(--wf-danger); margin-bottom:0.5rem;">Fitur Terkunci (e-KYC Dibutuhkan)</h3>
                    <p class="text-muted" style="max-width:400px; margin-bottom:1.5rem; line-height:1.6;">Anda harus melengkapi dan menyetujui verifikasi e-KYC terlebih dahulu sebelum melakukan pembelian deposit atau jaminan lelang (NIPL).</p>
                    <a href="../auth/a6-ekyc-upload.html" class="btn btn-primary">Lengkapi eKYC Sekarang</a>
                  \`;
                  const container = mainCard.parentElement;
                  container.style.position = 'relative';
                  container.appendChild(overlay);
                }
              }
              
              if (btnSimulate) {
                btnSimulate.addEventListener('click', function() {
                  alert('Simulasi: Pembayaran VA Rp 5.000.000 Berhasil! Deposit diterima, 1 tiket NIPL aktif.');
                  window.location.href = 'b3-katalog.html';
                });
              }
            });
          </script>
        `;
      } else if (p.id === 'b7') { // Bidding Room
        specificContent = `
          <div class="grid-2-1">
            <div class="card">
              <div class="img-placeholder" style="height:350px; margin-bottom:1rem; font-size: 3rem;">🚗 Toyota Avanza 2022</div>
              <h2 class="page-title">Toyota Avanza 1.3 G MT 2022</h2>
              <p class="text-muted">Lot #1045 • Sesi Kendaraan Jakarta</p>
              <div class="separator"></div>
              <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem; font-size:0.85rem;" class="text-muted">
                <div>• Lokasi Gudang: Jakarta Selatan</div>
                <div>• Tahun / Warna: 2022 / Hitam</div>
                <div>• Kondisi: Grade B (Bodi Mulus)</div>
                <div>• Transmisi / KM: Manual / 45K</div>
              </div>
            </div>
            <div class="bidding-panel">
              <div class="fs-sm text-uppercase" style="color: rgba(255,255,255,0.7);">Harga Penawaran Tertinggi</div>
              <div class="bid-current-price" id="current-price-val">Rp 167.500.000</div>
              <div class="fs-sm mb-2" style="color: rgba(255,255,255,0.7);">Kelipatan Bid: Rp 2.500.000 | NIPL Anda: #98122</div>
              <div class="bid-timer mb-3" id="bid-timer-val">00:45</div>
              <button class="btn btn-gold btn-lg w-100" id="btn-place-bid" style="justify-content:center; margin-bottom:0.5rem; font-size:1.2rem;">BID Rp 170.000.000</button>
              <div class="bid-buttons">
                <button class="btn btn-outline btn-sm btn-quick-bid" data-mult="1" style="color:#fff; border-color:rgba(255,255,255,0.3)">+Rp 2.5jt</button>
                <button class="btn btn-outline btn-sm btn-quick-bid" data-mult="2" style="color:#fff; border-color:rgba(255,255,255,0.3)">+Rp 5.0jt</button>
                <button class="btn btn-outline btn-sm btn-quick-bid" data-mult="4" style="color:#fff; border-color:rgba(255,255,255,0.3)">+Rp 10.0jt</button>
              </div>
              <div class="separator" style="border-color:rgba(255,255,255,0.1)"></div>
              <div class="text-left fw-bold mb-1 fs-sm" style="color:#fff;">Riwayat Penawaran (3)</div>
              <div class="bid-history text-left" id="bid-history-list">
                <div class="bid-history-item"><span>Bidder_A*** (Luar Kota)</span><span class="text-gold">Rp 167.500.000</span></div>
                <div class="bid-history-item"><span>Anda (#98122)</span><span>Rp 165.000.000</span></div>
                <div class="bid-history-item"><span>Bidder_B*** (Jakarta)</span><span>Rp 162.500.000</span></div>
              </div>
            </div>
          </div>
          
          <script>
            document.addEventListener('DOMContentLoaded', function() {
              let currentPrice = 167500000;
              const bidIncrement = 2500000;
              let sisaWaktu = 45;
              let highestBidder = 'Bidder_A***';
              let myNipl = '#98122';
              let isFinished = false;

              const priceEl = document.getElementById('current-price-val');
              const timerEl = document.getElementById('bid-timer-val');
              const btnBid = document.getElementById('btn-place-bid');
              const historyList = document.getElementById('bid-history-list');
              const quickBtns = document.querySelectorAll('.btn-quick-bid');

              function formatRupiah(num) {
                return 'Rp ' + num.toLocaleString('id-ID');
              }

              function updateUI() {
                priceEl.textContent = formatRupiah(currentPrice);
                btnBid.textContent = 'BID ' + formatRupiah(currentPrice + bidIncrement);
                
                let mins = Math.floor(sisaWaktu / 60);
                let secs = sisaWaktu % 60;
                timerEl.textContent = (mins < 10 ? '0' : '') + mins + ':' + (secs < 10 ? '0' : '') + secs;
                
                if (sisaWaktu <= 10) {
                  timerEl.style.color = '#e74c3c';
                  timerEl.style.fontWeight = 'bold';
                } else {
                  timerEl.style.color = '#fff';
                  timerEl.style.fontWeight = 'normal';
                }
              }

              function addBidLog(user, amount, isMe) {
                const row = document.createElement('div');
                row.className = 'bid-history-item';
                if (isMe) {
                  row.style.background = 'rgba(243,156,18,0.2)';
                  row.style.fontWeight = 'bold';
                }
                row.innerHTML = '<span>' + user + '</span><span class="' + (isMe || !user.includes('Anda') ? 'text-gold' : '') + '">' + formatRupiah(amount) + '</span>';
                historyList.insertBefore(row, historyList.firstChild);
                
                while (historyList.children.length > 8) {
                  historyList.removeChild(historyList.lastChild);
                }
              }

              const timerInterval = setInterval(function() {
                if (isFinished) return;
                sisaWaktu--;
                if (sisaWaktu <= 0) {
                  sisaWaktu = 0;
                  isFinished = true;
                  clearInterval(timerInterval);
                  showEndModal();
                }
                updateUI();
              }, 1000);

              function triggerFakeBid() {
                if (isFinished) return;
                if (highestBidder === 'Anda (' + myNipl + ')') {
                  highestBidder = 'Bidder_' + String.fromCharCode(65 + Math.floor(Math.random()*6)) + '***';
                  currentPrice += bidIncrement;
                  addBidLog(highestBidder, currentPrice, false);
                  if (sisaWaktu < 20) {
                    sisaWaktu = 30;
                    alertNotification("Sniping Alert: Waktu diperpanjang 30 detik!");
                  }
                  updateUI();
                }
                setTimeout(triggerFakeBid, 5000 + Math.random()*5000);
              }
              setTimeout(triggerFakeBid, 6000);

              function alertNotification(msg) {
                const banner = document.createElement('div');
                banner.style.position = 'absolute';
                banner.style.top = '10px';
                banner.style.left = '50%';
                banner.style.transform = 'translateX(-50%)';
                banner.style.background = '#f39c12';
                banner.style.color = '#fff';
                banner.style.padding = '5px 15px';
                banner.style.borderRadius = '4px';
                banner.style.fontSize = '0.8rem';
                banner.style.zIndex = '9999';
                banner.textContent = msg;
                document.body.appendChild(banner);
                setTimeout(() => banner.remove(), 2500);
              }

              function handleUserBid(customIncrement) {
                if (isFinished) return;
                
                currentPrice += customIncrement;
                highestBidder = 'Anda (' + myNipl + ')';
                addBidLog(highestBidder, currentPrice, true);
                
                if (sisaWaktu < 20) {
                  sisaWaktu = 45;
                  alertNotification("Anti-Sniping: Waktu diperpanjang ke 45 detik!");
                }
                
                updateUI();
                
                btnBid.disabled = true;
                btnBid.style.opacity = 0.5;
                setTimeout(() => {
                  btnBid.disabled = false;
                  btnBid.style.opacity = 1;
                }, 1200);
              }

              btnBid.addEventListener('click', function() {
                handleUserBid(bidIncrement);
              });

              quickBtns.forEach(btn => {
                btn.addEventListener('click', function() {
                  const mult = parseInt(btn.getAttribute('data-mult'));
                  handleUserBid(bidIncrement * mult);
                });
              });

              function showEndModal() {
                const modalOverlay = document.createElement('div');
                modalOverlay.className = 'modal-overlay';
                
                let isWinner = highestBidder.includes('Anda');
                let title = isWinner ? '🎉 SELAMAT! Anda Pemenang Lot!' : '🏁 Sesi Lelang Selesai';
                let desc = isWinner 
                  ? 'Anda memenangkan lot <strong>Toyota Avanza 1.3 G MT 2022</strong> dengan penawaran tertinggi <strong>' + formatRupiah(currentPrice) + '</strong>.'
                  : 'Lot lelang ditutup. Pemenang tertinggi adalah <strong>' + highestBidder + '</strong> seharga <strong>' + formatRupiah(currentPrice) + '</strong>.';
                
                let actionBtn = isWinner 
                  ? '<a href="b9-invoice.html" class="btn btn-primary" style="text-decoration:none;">Buka Invoice Pelunasan</a>'
                  : '<a href="b1-dashboard.html" class="btn btn-outline" style="text-decoration:none;">Kembali ke Dashboard</a>';

                modalOverlay.innerHTML = \`
                  <div class="modal" style="max-width: 450px;">
                    <div class="modal-header">
                      <span>\${title}</span>
                    </div>
                    <div class="modal-body text-center">
                      <div style="font-size: 4rem; margin-bottom: 1rem;">\${isWinner ? '🏆' : '🤝'}</div>
                      <p style="margin-bottom: 1.5rem; line-height: 1.6;">\${desc}</p>
                      \${isWinner ? '<p class="fs-sm text-muted">Uang jaminan (NIPL) Anda telah otomatis dipotong. Harap lakukan pelunasan sisa tagihan dalam waktu 5 hari kerja.</p>' : ''}
                    </div>
                    <div class="modal-footer" style="justify-content: center;">
                      \${actionBtn}
                    </div>
                  </div>
                \`;
                document.body.appendChild(modalOverlay);
              }
            });
          </script>
        `;
      } else if (p.id === 'b8') { // Bidding Room + Streaming
        specificContent = `
          <div class="grid-2-1">
            <div class="card" style="padding:0; overflow:hidden; position:relative; background:#000; margin-bottom:0;">
              <div style="position:absolute; top:1rem; left:1rem; z-index:10;"><span class="badge badge-danger" style="box-shadow:0 2px 8px rgba(255,0,0,0.5);">LIVE STREAM</span></div>
              <div style="position:relative; padding-bottom:56.25%; height:0; overflow:hidden; background:#000;">
                <iframe 
                  style="position:absolute; top:0; left:0; width:100%; height:100%; border:0;" 
                  src="https://www.youtube.com/embed/wOJTw2Xm0qk?autoplay=1&mute=1&loop=1&playlist=wOJTw2Xm0qk&controls=1&showinfo=0&rel=0&modestbranding=1" 
                  title="Live Auction Stream" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowfullscreen>
                </iframe>
              </div>
              <div style="padding: 1rem; background: var(--wf-card-bg);">
                <h3 class="fw-bold" style="font-size:1.1rem; margin-bottom: 0.25rem;">Toyota Avanza 1.3 G MT 2022</h3>
                <p class="text-muted fs-sm">Lot #1045 • Sesi Jakarta • Live Juru Lelang JBA</p>
              </div>
            </div>
            <div class="bidding-panel">
              <div class="fs-sm text-uppercase" style="color: rgba(255,255,255,0.7);">Harga Penawaran Tertinggi</div>
              <div class="bid-current-price" id="current-price-val">Rp 167.500.000</div>
              <div class="fs-sm mb-2" style="color: rgba(255,255,255,0.7);">Juru Lelang: Budi Operator</div>
              <div class="bid-timer mb-3" id="bid-timer-val" style="color:var(--wf-danger);">00:45</div>
              <button class="btn btn-gold btn-lg w-100" id="btn-place-bid" style="justify-content:center; margin-bottom:0.5rem; font-size:1.2rem;">BID Rp 170.000.000</button>
              <div class="separator" style="border-color:rgba(255,255,255,0.1)"></div>
              <div class="text-left fw-bold mb-1 fs-sm" style="color:#fff;">Chat / Q&A Live & Penawaran</div>
              <div class="bid-history text-left" id="bid-history-list" style="height:120px;">
                <div class="bid-history-item"><span>User_1:</span><span>Apakah STNK aktif?</span></div>
                <div class="bid-history-item"><span>Mod:</span><span>Aktif s/d Desember 2026.</span></div>
                <div class="bid-history-item"><span>Bidder_A***</span><span class="text-gold">Rp 167.500.000</span></div>
              </div>
            </div>
          </div>
          
          <script>
            document.addEventListener('DOMContentLoaded', function() {
              let currentPrice = 167500000;
              const bidIncrement = 2500000;
              let sisaWaktu = 45;
              let highestBidder = 'Bidder_A***';
              let myNipl = '#98122';
              let isFinished = false;

              const priceEl = document.getElementById('current-price-val');
              const timerEl = document.getElementById('bid-timer-val');
              const btnBid = document.getElementById('btn-place-bid');
              const historyList = document.getElementById('bid-history-list');

              function formatRupiah(num) {
                return 'Rp ' + num.toLocaleString('id-ID');
              }

              function updateUI() {
                priceEl.textContent = formatRupiah(currentPrice);
                btnBid.textContent = 'BID ' + formatRupiah(currentPrice + bidIncrement);
                
                let mins = Math.floor(sisaWaktu / 60);
                let secs = sisaWaktu % 60;
                timerEl.textContent = (mins < 10 ? '0' : '') + mins + ':' + (secs < 10 ? '0' : '') + secs;
              }

              function addChatLog(user, text, isBid, isMe) {
                const row = document.createElement('div');
                row.className = 'bid-history-item';
                if (isMe) row.style.background = 'rgba(243,156,18,0.2)';
                if (isBid) {
                  row.innerHTML = '<span>🚀 <strong>' + user + '</strong></span><span class="text-gold">' + formatRupiah(text) + '</span>';
                } else {
                  row.innerHTML = '<span>💬 ' + user + ':</span><span>' + text + '</span>';
                }
                historyList.insertBefore(row, historyList.firstChild);
              }

              const timerInterval = setInterval(function() {
                if (isFinished) return;
                sisaWaktu--;
                if (sisaWaktu <= 0) {
                  sisaWaktu = 0;
                  isFinished = true;
                  clearInterval(timerInterval);
                  showEndModal();
                }
                updateUI();
              }, 1000);

              function triggerFakeBid() {
                if (isFinished) return;
                if (highestBidder === 'Anda (' + myNipl + ')') {
                  highestBidder = 'Bidder_' + String.fromCharCode(65 + Math.floor(Math.random()*6)) + '***';
                  currentPrice += bidIncrement;
                  addChatLog(highestBidder, currentPrice, true, false);
                  if (sisaWaktu < 20) sisaWaktu = 30;
                  updateUI();
                }
                setTimeout(triggerFakeBid, 6000 + Math.random()*5000);
              }
              setTimeout(triggerFakeBid, 5000);

              btnBid.addEventListener('click', function() {
                if (isFinished) return;
                currentPrice += bidIncrement;
                highestBidder = 'Anda (' + myNipl + ')';
                addChatLog(highestBidder, currentPrice, true, true);
                if (sisaWaktu < 20) sisaWaktu = 45;
                updateUI();
              });

              function showEndModal() {
                const modalOverlay = document.createElement('div');
                modalOverlay.className = 'modal-overlay';
                let isWinner = highestBidder.includes('Anda');
                modalOverlay.innerHTML = \`
                  <div class="modal" style="max-width: 450px; color: var(--wf-text);">
                    <div class="modal-header"><span>\${isWinner ? '🎉 Pemenang Lelang!' : '🏁 Selesai'}</span></div>
                    <div class="modal-body text-center">
                      <p>\${isWinner ? 'Selamat! Anda memenangkan lot Avanza!' : 'Lot dimenangkan oleh ' + highestBidder}</p>
                    </div>
                    <div class="modal-footer" style="justify-content: center;">
                      <a href="b9-invoice.html" class="btn btn-primary">Lihat Detail</a>
                    </div>
                  </div>
                \`;
                document.body.appendChild(modalOverlay);
              }
            });
          </script>
        `;
      } else if (p.id === 'b9') { // Invoice
        specificContent = `
          <div class="card" style="max-width:800px; margin: 0 auto; padding: 2rem;">
            <div style="display:flex; justify-content:space-between; margin-bottom:2rem;">
              <div>
                <h2 style="font-weight:700; color:var(--wf-primary); font-size:1.5rem;">INVOICE PEMENANG LELANG</h2>
                <div class="text-muted fs-sm">Nomor: #INV/2026/06/1045</div>
              </div>
              <div class="text-right">
                <div class="badge badge-warning">Menunggu Pelunasan</div>
                <div class="text-muted fs-sm mt-1">Tanggal: 10 Juni 2026</div>
              </div>
            </div>
            
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:1.5rem; margin-bottom:2rem; font-size:0.85rem;" class="text-muted">
              <div>
                <strong>Ditagihkan Kepada:</strong><br>
                Budi Santoso (Bidder #98122)<br>
                budi.santoso@gmail.com<br>
                08123456789
              </div>
              <div>
                <strong>Lokasi Pengambilan Barang:</strong><br>
                Gudang Utama JKT Selatan<br>
                Jl. Gatot Subroto No. 45, Jakarta<br>
                PIC Gudang: Pak Jaka
              </div>
            </div>
            
            <table style="width:100%; margin-bottom:2rem;">
              <thead>
                <tr><th>Deskripsi Lot</th><th class="text-right">Total Harga</th></tr>
              </thead>
              <tbody>
                <tr>
                  <td>Lot #1045 - Toyota Avanza 1.3 G MT 2022 (Hammer Price)</td>
                  <td class="text-right fw-bold">Rp 167.500.000</td>
                </tr>
                <tr>
                  <td>Biaya Administrasi Balai Lelang (Buyer's Premium - 1.5%)</td>
                  <td class="text-right fw-bold">Rp 2.512.500</td>
                </tr>
                <tr>
                  <td>Pajak Pembelian (PPN - 1.1%)</td>
                  <td class="text-right fw-bold">Rp 1.842.500</td>
                </tr>
                <tr style="background:#f8f9fa;">
                  <td>Potongan Uang Jaminan (NIPL Deposit)</td>
                  <td class="text-right fw-bold text-success">- Rp 5.000.000</td>
                </tr>
                <tr style="font-size:1.1rem; border-top: 2px solid var(--wf-primary);">
                  <td class="fw-bold">Total Sisa Pelunasan Wajib Bayar</td>
                  <td class="text-right fw-bold text-danger">Rp 166.855.000</td>
                </tr>
              </tbody>
            </table>
            
            <div style="display:flex; justify-content:flex-end; gap:1rem;">
              <button class="btn btn-outline">📥 Download PDF</button>
              <a href="b10-pelunasan.html" class="btn btn-primary">Lanjutkan Pembayaran Pelunasan &rarr;</a>
            </div>
          </div>
        `;
      } else if (p.id === 'b10') { // Pelunasan
        specificContent = `
          <div class="card" style="max-width:600px; margin: 0 auto;">
            <div class="card-header">Lakukan Pelunasan Pembelian</div>
            <div class="alert alert-warning">
              <div>Batas Waktu Pelunasan: <strong>15 Juni 2026, 17:00 WIB</strong> (5 Hari Kerja setelah lelang).</div>
            </div>
            <div style="font-size:0.9rem;" class="mb-2">
              • Nomor Tagihan: #INV/2026/06/1045<br>
              • Aset: Toyota Avanza 1.3 G MT 2022 (Lot #1045)<br>
              • Nominal Pelunasan: <strong class="text-danger" style="font-size:1.1rem;">Rp 166.855.000</strong>
            </div>
            <div class="form-group mt-2">
              <label class="form-label">Pilih Rekening Virtual Account Tujuan</label>
              <div style="display:flex; flex-direction:column; gap:0.5rem; font-size:0.9rem;">
                <label><input type="radio" name="paylunas" checked> BCA Virtual Account (807772026061045)</label>
                <label><input type="radio" name="paylunas"> Mandiri Virtual Account (124002026061045)</label>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Upload Bukti Transfer Manual (Jika VA Gagal)</label>
              <div class="upload-zone" style="padding:1rem;">
                <div class="upload-icon">📷</div>
                <div class="fs-sm">Upload File Bukti Pembayaran</div>
              </div>
            </div>
            <button class="btn btn-success w-100" id="btn-simulate-lunas-pay" style="justify-content:center;">⚡ Simulasikan Pelunasan VA Sukses</button>
          </div>
          
          <script>
            document.addEventListener('DOMContentLoaded', function() {
              const btnSimulate = document.getElementById('btn-simulate-lunas-pay');
              btnSimulate.addEventListener('click', function() {
                alert('Simulasi: Pelunasan VA Rp 166.855.000 Berhasil! Pembayaran lunas terverifikasi otomatis.');
                window.location.href = 'b11-pengambilan.html';
              });
            });
          </script>
        `;
      } else if (p.id === 'b11') { // Pickup
        specificContent = `
          <div class="card">
            <div class="card-header">Tracking Status Pengambilan Aset</div>
            <div class="timeline mt-2">
              <div class="timeline-item done">
                <div class="timeline-date">10 Juni 2026, 21:50 WIB</div>
                <div class="timeline-title">Pelunasan Pembayaran Berhasil Terverifikasi</div>
                <div class="timeline-desc">Dana sebesar Rp 166.855.000 telah masuk ke kas balai lelang.</div>
              </div>
              <div class="timeline-item done">
                <div class="timeline-date">11 Juni 2026, 09:00 WIB</div>
                <div class="timeline-title">Berita Acara Serah Terima (BAST) Digital Siap</div>
                <div class="timeline-desc">Dokumen tanda tangan BAST telah diterbitkan secara digital.</div>
              </div>
              <div class="timeline-item active">
                <div class="timeline-date">Sedang Berjalan</div>
                <div class="timeline-title">Siap Diambil di Gudang Penampungan</div>
                <div class="timeline-desc">Harap bawa Kode Verifikasi QR / OTP di bawah ini saat mengambil barang di gudang.</div>
              </div>
            </div>
          </div>
          <div class="grid-2" style="gap:2rem;">
            <div class="card text-center" style="padding:2rem;">
              <div style="font-size: 1.2rem; font-weight:700; margin-bottom:1rem;">Kode Tiket Serah Terima</div>
              <div class="img-placeholder" style="width:180px; height:180px; margin: 0 auto;">QR Code Serah Terima</div>
              <div class="fw-bold mt-1" style="font-size:1.4rem; color:var(--wf-primary); letter-spacing:2px;">OTP: 897216</div>
              <p class="fs-sm text-muted mt-1">Tunjukkan kode QR atau OTP di atas kepada petugas gudang.</p>
            </div>
            <div class="card">
              <div class="card-header">Detail Informasi Pengambilan</div>
              <p class="fs-sm" style="line-height:1.7;">
                • <strong>Barang:</strong> Toyota Avanza 1.3 G MT 2022 (Lot #1045)<br>
                • <strong>Lokasi Gudang:</strong> Gudang Utama JKT Selatan, Jl. Gatot Subroto No. 45<br>
                • <strong>Jam Operasional Gudang:</strong> Senin - Jumat, 09:00 - 17:00 WIB<br>
                • <strong>Batas Waktu Pengambilan:</strong> 18 Juni 2026 (Keterlambatan dikenakan denda simpan Rp 50.000/hari)
              </p>
              <button class="btn btn-outline w-100 mt-2">📥 Unduh Surat Jalan & BAST Digital (PDF)</button>
            </div>
          </div>
        `;
      } else if (p.id === 'b12') { // Riwayat Lelang
        specificContent = `
          <div class="card">
            <div class="toolbar">
              <div class="toolbar-left">
                <input type="text" class="form-input" placeholder="Cari barang..." style="width:220px;">
                <select class="form-select"><option>Semua Status</option><option>Menang</option><option>Kalah</option></select>
              </div>
            </div>
            <div class="table-wrapper">
              <table>
                <thead>
                  <tr><th>Tanggal</th><th>Lot ID</th><th>Deskripsi Barang</th><th>Bid Maksimal Anda</th><th>Hammer Price</th><th>Status</th><th>Aksi</th></tr>
                </thead>
                <tbody>
                  <tr>
                    <td>10 Jun 2026</td>
                    <td>#1045</td>
                    <td class="fw-bold">Toyota Avanza 1.3 G MT 2022</td>
                    <td>Rp 165.000.000</td>
                    <td class="fw-bold">Rp 167.500.000</td>
                    <td><span class="badge badge-success">Menang</span></td>
                    <td><a href="b9-invoice.html" class="btn btn-sm btn-outline">Invoice</a></td>
                  </tr>
                  <tr>
                    <td>08 Jun 2026</td>
                    <td>#1012</td>
                    <td class="fw-bold">Yamaha NMAX 155 ABS 2021</td>
                    <td>Rp 18.000.000</td>
                    <td class="fw-bold">Rp 19.500.000</td>
                    <td><span class="badge badge-danger">Kalah</span></td>
                    <td><span class="text-muted fs-sm">Deposit Direfund</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        `;
      } else if (p.id === 'b13') { // Riwayat Transaksi
        specificContent = `
          <div class="card">
            <div class="table-wrapper">
              <table>
                <thead>
                  <tr><th>No Transaksi</th><th>Tanggal</th><th>Tipe Transaksi</th><th>Metode Pembayaran</th><th>Nominal</th><th>Status</th></tr>
                </thead>
                <tbody>
                  <tr>
                    <td>#TR-8972</td>
                    <td>10 Jun 2026, 21:50 WIB</td>
                    <td class="fw-bold">Pelunasan Tagihan (Lot #1045)</td>
                    <td>BCA Virtual Account</td>
                    <td class="fw-bold text-danger">Rp 166.855.000</td>
                    <td><span class="badge badge-success">Berhasil</span></td>
                  </tr>
                  <tr>
                    <td>#TR-8912</td>
                    <td>10 Jun 2026, 21:40 WIB</td>
                    <td class="fw-bold">Uang Jaminan Deposit NIPL</td>
                    <td>BCA Virtual Account</td>
                    <td class="fw-bold text-primary">Rp 5.000.000</td>
                    <td><span class="badge badge-success">Berhasil</span></td>
                  </tr>
                  <tr>
                    <td>#TR-8802</td>
                    <td>08 Jun 2026, 15:00 WIB</td>
                    <td class="fw-bold">Refund Otomatis Deposit NIPL (Kalah)</td>
                    <td>Transfer Rekening BCA</td>
                    <td class="fw-bold text-success">Rp 1.000.000</td>
                    <td><span class="badge badge-info">Refunded</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        `;
      } else if (p.id === 'b14') { // Notifikasi
        specificContent = `
          <div class="card">
            <div style="display:flex; flex-direction:column; gap:0.8rem;">
              <div style="padding:1rem; border:1px solid var(--wf-border); border-radius:6px; background:#fff; display:flex; gap:1rem; align-items:center;">
                <div style="font-size:2rem;">🎉</div>
                <div>
                  <div class="fw-bold" style="font-size:0.95rem;">Selamat! Anda Memenangkan Lot #1045</div>
                  <div class="fs-sm text-muted">Silakan selesaikan proses pelunasan sebelum tanggal 15 Juni 2026.</div>
                  <div class="fs-sm text-muted mt-1">10 Juni 2026, 21:48</div>
                </div>
              </div>
              <div style="padding:1rem; border:1px solid var(--wf-border); border-radius:6px; background:#fff; display:flex; gap:1rem; align-items:center;">
                <div style="font-size:2rem;">💰</div>
                <div>
                  <div class="fw-bold" style="font-size:0.95rem;">Deposit Rp 5.000.000 Berhasil Diterima</div>
                  <div class="fs-sm text-muted">Nomor Induk Peserta Lelang (NIPL) Anda untuk Sesi Mobil JKT kini telah aktif.</div>
                  <div class="fs-sm text-muted mt-1">10 Juni 2026, 21:40</div>
                </div>
              </div>
            </div>
          </div>
        `;
      }
    }
    
    // --- AREA 4: PORTAL PROVIDER SCREENS ---
    else if (area === 'provider') {
      if (p.id === 's1') { // Provider Dashboard
        specificContent = `
          <div class="kpi-grid">
            <div class="kpi-card"><div class="kpi-label">Barang Dititipkan</div><div class="kpi-value">12 Unit</div><div class="kpi-trend">Menunggu Sesi: 2</div></div>
            <div class="kpi-card gold"><div class="kpi-label">Aset Terjual</div><div class="kpi-value">7 Unit</div><div class="kpi-trend up">Tingkat Penjualan 58%</div></div>
            <div class="kpi-card success"><div class="kpi-label">Total Penjualan Kotor</div><div class="kpi-value">Rp 985.000.000</div><div class="kpi-trend">Harga Hammer</div></div>
            <div class="kpi-card"><div class="kpi-label">Dana Sudah Dicairkan</div><div class="kpi-value">Rp 820.000.000</div><div class="kpi-trend text-success">Bersih Setelah Komisi</div></div>
          </div>
          <div class="grid-2-1">
            <div class="card">
              <div class="card-header">Status Pengajuan Barang Terbaru</div>
              <div class="table-wrapper">
                <table>
                  <thead>
                    <tr><th>Nama Barang</th><th>Tanggal Ajukan</th><th>Grade</th><th>Status</th><th>Aksi</th></tr>
                  </thead>
                  <tbody>
                    <tr><td>Toyota Avanza 1.3 G MT 2022</td><td>09 Jun 2026</td><td>Grade B</td><td><span class="badge badge-success">Disetujui & Lotting</span></td><td><a href="s6-detail-barang.html" class="btn btn-sm btn-outline">Track</a></td></tr>
                    <tr><td>Honda Brio Satya 1.2 E CVT 2021</td><td>10 Jun 2026</td><td>-</td><td><span class="badge badge-warning">Menunggu Inspeksi</span></td><td><a href="s6-detail-barang.html" class="btn btn-sm btn-outline">Track</a></td></tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div class="card">
              <div class="card-header">Aksi Cepat</div>
              <div style="display:flex; flex-direction:column; gap:0.5rem;">
                <a href="s3-ajukan-barang.html" class="btn btn-primary" style="justify-content:center;">➕ Ajukan Barang Baru</a>
                <a href="s4-batch-upload.html" class="btn btn-outline" style="justify-content:center;">📥 Batch Upload Excel</a>
              </div>
            </div>
          </div>
          <div class="grid-2" style="margin-top: 1rem;">
            <div class="card" style="margin-bottom:0;">
              <div class="card-header">📈 Volume Penjualan Bulanan (Rp Juta)</div>
              <div style="padding:1rem 0;">
                <svg viewBox="0 0 400 150" style="width:100%; height:auto; display:block; overflow:visible;">
                  <line x1="40" y1="20" x2="380" y2="20" stroke="#f1f2f6" stroke-width="1" />
                  <line x1="40" y1="70" x2="380" y2="70" stroke="#f1f2f6" stroke-width="1" />
                  <line x1="40" y1="120" x2="380" y2="120" stroke="#dcdde1" stroke-width="1" />
                  <rect x="70" y="90" width="20" height="30" rx="3" fill="var(--wf-primary)" />
                  <rect x="130" y="75" width="20" height="45" rx="3" fill="var(--wf-primary)" />
                  <rect x="190" y="58" width="20" height="62" rx="3" fill="var(--wf-primary)" />
                  <rect x="250" y="20" width="20" height="100" rx="3" fill="var(--wf-gold)" />
                  <rect x="310" y="43" width="20" height="77" rx="3" fill="var(--wf-primary)" />
                  <text x="80" y="138" fill="var(--wf-text-muted)" font-size="9" text-anchor="middle">Jan</text>
                  <text x="140" y="138" fill="var(--wf-text-muted)" font-size="9" text-anchor="middle">Feb</text>
                  <text x="200" y="138" fill="var(--wf-text-muted)" font-size="9" text-anchor="middle">Mar</text>
                  <text x="260" y="138" fill="var(--wf-text-muted)" font-size="9" text-anchor="middle">Apr</text>
                  <text x="320" y="138" fill="var(--wf-text-muted)" font-size="9" text-anchor="middle">Mei</text>
                  <text x="35" y="23" fill="var(--wf-text-muted)" font-size="8" text-anchor="end">400M</text>
                  <text x="35" y="73" fill="var(--wf-text-muted)" font-size="8" text-anchor="end">200M</text>
                  <text x="35" y="123" fill="var(--wf-text-muted)" font-size="8" text-anchor="end">0</text>
                </svg>
              </div>
            </div>
            <div class="card" style="margin-bottom:0;">
              <div class="card-header">📊 Status Aset Titipan</div>
              <div style="display:flex; justify-content:space-around; align-items:center; height:100%; padding:1rem 0;">
                <svg viewBox="0 0 100 100" style="width:90px; height:90px; transform: rotate(-90deg); display:block;">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#f1f2f6" stroke-width="12" />
                  <circle cx="50" cy="50" r="40" fill="none" stroke="var(--wf-success)" stroke-width="12" stroke-dasharray="125.6 125.7" />
                  <circle cx="50" cy="50" r="40" fill="none" stroke="var(--wf-gold)" stroke-width="12" stroke-dasharray="83.7 167.6" stroke-dashoffset="-125.6" />
                  <circle cx="50" cy="50" r="40" fill="none" stroke="var(--wf-danger)" stroke-width="12" stroke-dasharray="42.0 209.3" stroke-dashoffset="-209.3" />
                </svg>
                <div style="font-size:0.8rem; display:flex; flex-direction:column; gap:0.4rem;">
                  <div>🟢 <strong>Disetujui:</strong> 6 Unit (50%)</div>
                  <div>🟡 <strong>Menunggu Inspeksi:</strong> 4 Unit (33%)</div>
                  <div>🔴 <strong>Draft/Ditolak:</strong> 2 Unit (17%)</div>
                </div>
              </div>
            </div>
          </div>
        `;
      } else if (p.id === 's2') { // Provider Profile
        specificContent = `
          <div class="card" style="max-width:800px; margin: 0 auto;">
            <div class="card-header">Profil Badan Usaha / Rekening Provider</div>
            <div class="form-group">
              <label class="form-label">Nama Perusahaan / Provider</label>
              <input type="text" class="form-input" value="PT Astra Auto Indonesia" disabled>
            </div>
            <div class="form-group">
              <label class="form-label">NPWP Perusahaan</label>
              <input type="text" class="form-input" value="01.234.567.8-901.000" disabled>
            </div>
            <div class="form-group">
              <label class="form-label">Alamat Kantor Pusat</label>
              <textarea class="form-textarea" rows="2">Jl. Yos Sudarso Kav. 24, Jakarta Utara, DKI Jakarta</textarea>
            </div>
            <div class="grid-2">
              <div class="form-group">
                <label class="form-label">Nama PIC Hubungan Lelang</label>
                <input type="text" class="form-input" value="Andi Wijaya">
              </div>
              <div class="form-group">
                <label class="form-label">Nomor HP PIC</label>
                <input type="text" class="form-input" value="082188776655">
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Nama Bank Rekening Pencairan Dana</label>
              <select class="form-select">
                <option selected>Bank Mandiri (IDR)</option>
                <option>Bank BCA</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Nomor Rekening Pencairan</label>
              <input type="text" class="form-input" value="124-00-987654-2">
            </div>
            <button class="btn btn-primary">Simpan Profil Perusahaan</button>
          </div>
        `;
      } else if (p.id === 's3') { // Ajukan Barang
        specificContent = `
          <div class="card" style="max-width:800px; margin: 0 auto;">
            <div class="card-header">Form Pengajuan Barang Titipan Lelang</div>
            <div class="form-group">
              <label class="form-label">Nama Aset / Kendaraan <span class="required">*</span></label>
              <input type="text" class="form-input" placeholder="Misal: Toyota Fortuner 2.4 VRZ A/T 2021">
            </div>
            <div class="grid-2">
              <div class="form-group">
                <label class="form-label">Kategori <span class="required">*</span></label>
                <select class="form-select">
                  <option selected>Mobil Penumpang</option>
                  <option>Sepeda Motor</option>
                  <option>Alat Berat</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Tahun Pembuatan <span class="required">*</span></label>
                <input type="number" class="form-input" value="2021">
              </div>
            </div>
            <div class="grid-2">
              <div class="form-group">
                <label class="form-label">Harga Harapan Penjualan (Reserve Price) <span class="required">*</span></label>
                <input type="text" class="form-input" placeholder="Rp 350.000.000">
                <span class="form-hint">Harga batas minimum rahasia di mana lot boleh terjual.</span>
              </div>
              <div class="form-group">
                <label class="form-label">Nomor Rangka & Mesin</label>
                <input type="text" class="form-input" placeholder="MHKW12...">
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Foto Aset Awal</label>
              <div class="upload-zone">
                <div class="upload-icon">📷</div>
                <div>Seret & Tarik 4+ foto (Depan, Samping, Interior, Mesin)</div>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Dokumen Kepemilikan (Upload STNK & BPKB PDF)</label>
              <div class="upload-zone" style="padding:1rem;">
                <div>Klik untuk upload file PDF surat-surat</div>
              </div>
            </div>
            <button class="btn btn-primary">Ajukan Barang ke Balai Lelang</button>
          </div>
        `;
      } else if (p.id === 's4') { // Batch Upload
        specificContent = `
          <div class="card" style="max-width:800px; margin: 0 auto;">
            <div class="card-header">Batch Upload Aset Via Excel / CSV</div>
            <p class="fs-sm text-muted mb-2">Unggah puluhan barang titipan lelang sekaligus untuk menghemat waktu pendaftaran.</p>
            <div style="background:var(--wf-bg); padding:1rem; border-radius:6px; display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
              <div>
                <strong>Langkah 1: Unduh File Template Excel</strong><br>
                <span class="fs-sm text-muted">Gunakan template resmi kami agar kolom terbaca dengan tepat.</span>
              </div>
              <button class="btn btn-outline btn-sm">📥 Unduh Template (.xlsx)</button>
            </div>
            <div class="form-group">
              <label class="form-label">Langkah 2: Unggah File Excel yang Sudah Diisi</label>
              <div class="upload-zone" style="padding:3rem;">
                <div class="upload-icon">📄</div>
                <div>Tarik & Lepas File Template Anda di sini</div>
                <div class="text-muted fs-sm">Mendukung format .xlsx atau .csv maksimal 10MB</div>
              </div>
            </div>
            <button class="btn btn-primary w-100" style="justify-content:center;">Proses & Validasi Upload</button>
          </div>
        `;
      } else if (p.id === 's5') { // Daftar Barang Saya
        specificContent = `
          <div class="card">
            <div class="toolbar">
              <div class="toolbar-left">
                <input type="text" class="form-input" placeholder="Cari nama barang..." style="width:220px;">
                <select class="form-select">
                  <option>Semua Status</option>
                  <option>Diajukan</option>
                  <option>Dilelang</option>
                  <option>Terjual</option>
                </select>
              </div>
              <div class="toolbar-right">
                <a href="s3-ajukan-barang.html" class="btn btn-primary">Ajukan Baru</a>
              </div>
            </div>
            <div class="table-wrapper">
              <table>
                <thead>
                  <tr><th>ID Barang</th><th>Nama Barang</th><th>Reserve Price</th><th>Grade Appraisal</th><th>Status</th><th>Aksi</th></tr>
                </thead>
                <tbody>
                  <tr>
                    <td>#BRG-102</td>
                    <td class="fw-bold">Toyota Avanza 1.3 G MT 2022</td>
                    <td>Rp 140.000.000</td>
                    <td><span class="badge badge-info">Grade B</span></td>
                    <td><span class="badge badge-success">Terjual</span></td>
                    <td><a href="s6-detail-barang.html" class="btn btn-sm btn-outline">Detail</a></td>
                  </tr>
                  <tr>
                    <td>#BRG-103</td>
                    <td class="fw-bold">Honda Brio Satya 1.2 E 2021</td>
                    <td>Rp 115.000.000</td>
                    <td>-</td>
                    <td><span class="badge badge-warning">Menunggu Inspeksi</span></td>
                    <td><a href="s6-detail-barang.html" class="btn btn-sm btn-outline">Detail</a></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        `;
      } else if (p.id === 's6') { // Detail Barang
        specificContent = `
          <div class="grid-2-1" style="grid-template-columns: 1.5fr 1fr; gap:2rem;">
            <div>
              <div class="card">
                <div class="card-header">Informasi Fisik & Surat Aset</div>
                <table style="width:100%;">
                  <tbody>
                    <tr><td class="fw-bold" style="width:35%;">Nama Barang</td><td>Toyota Avanza 1.3 G MT 2022</td></tr>
                    <tr><td class="fw-bold">NIK / NPWP PIC</td><td>Andi PIC Astra</td></tr>
                    <tr><td class="fw-bold">Reserve Price</td><td>Rp 140.000.000</td></tr>
                    <tr><td class="fw-bold">Hasil Inspeksi Mesin</td><td>Sangat Baik, Odometer 45k KM</td></tr>
                    <tr><td class="fw-bold">Hasil Inspeksi Body</td><td>Grade B (Ada baret halus bumper depan)</td></tr>
                  </tbody>
                </table>
              </div>
              
              <div class="card mt-2">
                <div class="card-header">Dokumen Serah Terima & BAST Titip Jual</div>
                <p class="fs-sm mb-2">Dokumen serah terima hak kuasa lelang (BAST Titip Jual) diterbitkan saat fisik kendaraan masuk ke gudang Balai Lelang.</p>
                <div style="background:var(--wf-bg); padding:1rem; border-radius:6px; display:flex; justify-content:space-between; align-items:center; font-size:0.85rem;">
                  <div>
                    <strong>Nomor Dokumen:</strong> BAST-TJ/2026/06/102<br>
                    <strong>Diserahterimakan pada:</strong> 09 Juni 2026, 11:30 WIB<br>
                    <strong>Penerima:</strong> Gudang Utama JKT Selatan (Balai Lelang)
                  </div>
                  <button class="btn btn-outline btn-sm">📥 Unduh PDF BAST</button>
                </div>
              </div>
            </div>
            
            <div class="card">
              <div class="card-header">Tracking Status Aset</div>
              <div class="timeline mt-2">
                <div class="timeline-item done">
                  <div class="timeline-title">1. Pengajuan Online</div>
                  <div class="timeline-desc">09 Juni 2026 - Data diunggah provider.</div>
                </div>
                <div class="timeline-item done">
                  <div class="timeline-title">2. Serah Terima Fisik & BAST</div>
                  <div class="timeline-desc">09 Juni 2026 - Mobil masuk gudang, BAST ditandatangani.</div>
                </div>
                <div class="timeline-item done">
                  <div class="timeline-title">3. Pemeriksaan Fisik (Appraisal)</div>
                  <div class="timeline-desc">10 Juni 2026 - Hasil penilaian Grade B dirilis.</div>
                </div>
                <div class="timeline-item active">
                  <div class="timeline-title">4. Terjadwal di Sesi Lelang</div>
                  <div class="timeline-desc">12 Juni 2026 - Lot #1045.</div>
                </div>
              </div>
            </div>
          </div>
        `;
      } else if (p.id === 's7') { // Monitoring
        specificContent = `
          <div class="card">
            <div class="card-header">Monitoring Lelang Aset Aktif Perusahaan Anda <span class="badge badge-danger">LIVE</span></div>
            <div class="grid-2" style="gap:2rem; margin-top:1.5rem;">
              <div style="border: 1px solid var(--wf-border); padding: 1.2rem; border-radius: 6px;">
                <div class="badge badge-success">Lot Sedang Berjalan</div>
                <h3 class="fw-bold mt-1">Toyota Avanza 1.3 G MT 2022 (Lot #1045)</h3>
                <div class="separator"></div>
                <div style="display:flex; justify-content:space-between; margin-bottom:1rem;">
                  <div>
                    <div class="text-muted fs-sm">Harga Pembukaan:</div>
                    <div class="fw-bold">Rp 145.000.000</div>
                  </div>
                  <div class="text-right">
                    <div class="text-muted fs-sm">Harga Bid Tertinggi saat ini:</div>
                    <div class="fw-bold" style="color:var(--wf-success); font-size:1.2rem;">Rp 167.500.000</div>
                  </div>
                </div>
                <div class="alert alert-info" style="margin-bottom:0; font-size:0.8rem;">
                  34 penawaran masuk dari 5 bidder berbeda. Sesi berakhir dalam 00:48.
                </div>
              </div>
            </div>
          </div>
        `;
      } else if (p.id === 's8') { // Settlement
        specificContent = `
          <div class="card">
            <div class="table-wrapper">
              <table>
                <thead>
                  <tr><th>Lot ID</th><th>Deskripsi Barang</th><th>Harga Hammer</th><th>Komisi Balai Lelang (3%)</th><th>Pajak (1.1%)</th><th>Nominal Transfer Bersih</th><th>Status</th><th>Aksi</th></tr>
                </thead>
                <tbody>
                  <tr>
                    <td>#1045</td>
                    <td class="fw-bold">Toyota Avanza 1.3 G MT 2022</td>
                    <td>Rp 167.500.000</td>
                    <td>Rp 5.025.000</td>
                    <td>Rp 1.842.500</td>
                    <td class="fw-bold text-success">Rp 160.632.500</td>
                    <td><span class="badge badge-warning">Proses Transfer</span></td>
                    <td><button class="btn btn-sm btn-outline">Unduh Rincian</button></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        `;
      } else if (p.id === 's9') { // Riwayat Penjualan
        specificContent = `
          <div class="card">
            <div class="toolbar">
              <div class="toolbar-left">
                <input type="text" class="form-input" placeholder="Cari..." style="width:200px;">
              </div>
            </div>
            <div class="table-wrapper">
              <table>
                <thead>
                  <tr><th>Tanggal</th><th>Lot ID</th><th>Nama Barang</th><th>Harga Terjual</th><th>Biaya Komisi</th><th>Pencairan Bersih</th></tr>
                </thead>
                <tbody>
                  <tr>
                    <td>10 Jun 2026</td>
                    <td>#1045</td>
                    <td class="fw-bold">Toyota Avanza 1.3 G MT 2022</td>
                    <td class="fw-bold">Rp 167.500.000</td>
                    <td>Rp 5.025.000</td>
                    <td class="fw-bold text-success">Rp 160.632.500</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        `;
      } else if (p.id === 's10') { // Pencairan Dana
        specificContent = `
          <div class="card">
            <div class="table-wrapper">
              <table>
                <thead>
                  <tr><th>Tanggal Cair</th><th>Ref Transfer</th><th>Bank Penerima</th><th>No Rekening</th><th>Nominal Bersih</th><th>Bukti Transfer</th></tr>
                </thead>
                <tbody>
                  <tr>
                    <td>11 Jun 2026</td>
                    <td>#TR-PAY-98722</td>
                    <td class="fw-bold">Bank Mandiri</td>
                    <td>124-00-987654-2</td>
                    <td class="fw-bold text-success">Rp 160.632.500</td>
                    <td><button class="btn btn-sm btn-outline">📥 Unduh PDF</button></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        `;
      } else if (p.id === 's11') { // Pengembalian
        specificContent = `
          <div class="card" style="max-width:600px; margin:0 auto;">
            <div class="card-header">Permintaan Pengembalian Barang Tidak Terjual</div>
            <div class="form-group">
              <label class="form-label">Pilih Aset Tidak Terjual</label>
              <select class="form-select">
                <option>Suzuki Karimun Wagon R 2019 (Lot #1002 - Status: Tidak Terjual)</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Metode Pengambilan</label>
              <div style="display:flex; flex-direction:column; gap:0.5rem; font-size:0.95rem;">
                <label><input type="radio" name="retmethod" checked> Diambil Sendiri oleh Driver Perusahaan</label>
                <label><input type="radio" name="retmethod"> Menggunakan Towing Balai Lelang (Dikenakan biaya tambahan)</label>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Jadwal Rencana Pengambilan</label>
              <input type="date" class="form-input" value="2026-06-15">
            </div>
            <div class="alert alert-info">
              <div><strong>Biaya Admin & Penyimpanan:</strong> Rp 250.000. Harus dilunasi saat serah terima barang kembali.</div>
            </div>
            <button class="btn btn-primary w-100" style="justify-content:center;">Kirim Permohonan Pengembalian</button>
          </div>
        `;
      } else if (p.id === 's12') { // Provider Notifications
        specificContent = `
          <div class="card">
            <div style="display:flex; flex-direction:column; gap:0.8rem;">
              <div style="padding:1rem; border:1px solid var(--wf-border); border-radius:6px; background:#fff; display:flex; gap:1rem; align-items:center;">
                <div style="font-size:2rem;">💸</div>
                <div>
                  <div class="fw-bold" style="font-size:0.95rem;">Aset Terjual! (Lot #1045)</div>
                  <div class="fs-sm text-muted">Aset Toyota Avanza 2022 Anda telah terjual seharga Rp 167.500.000. Proses settlement dana sedang disiapkan.</div>
                  <div class="fs-sm text-muted mt-1">10 Juni 2026, 21:48</div>
                </div>
              </div>
            </div>
          </div>
        `;
      }
    }
    
    // --- AREA 5: ADMIN BACK-OFFICE SCREENS ---
    else if (area === 'admin') {
      if (p.id === 'ad1') { // Admin Dashboard
        specificContent = `
          <div class="kpi-grid">
            <div class="kpi-card"><div class="kpi-label">Transaksi Hari Ini</div><div class="kpi-value">Rp 847.500.000</div><div class="kpi-trend up">↑ 12.3% dari kemarin</div></div>
            <div class="kpi-card gold"><div class="kpi-label">Lot Terjual</div><div class="kpi-value">127 Unit</div><div class="kpi-trend up">↑ 8.5% dari bulan lalu</div></div>
            <div class="kpi-card success"><div class="kpi-label">Pendapatan Komisi</div><div class="kpi-value">Rp 34,200,000</div><div class="kpi-trend up">↑ 15.2%</div></div>
            <div class="kpi-card"><div class="kpi-label">Verifikasi KYC Tertunda</div><div class="kpi-value">14 Akun</div><div class="kpi-trend text-danger">Butuh Approval</div></div>
          </div>
          <div class="grid-2-1">
            <div>
              <div class="card">
                <div class="card-header">Sesi Lelang Aktif <span class="badge badge-danger">LIVE</span></div>
                <div style="display:flex; justify-content:space-between; align-items:center;">
                  <div>
                    <h3 class="fw-bold">Sesi Mobil Penumpang JKT - Batch 15</h3>
                    <p class="text-muted fs-sm">45 peserta online • Lot berjalan: 12 dari 45</p>
                  </div>
                  <a href="ad13-ruang-kontrol.html" class="btn btn-gold">Buka Ruang Kontrol</a>
                </div>
              </div>
              <div class="card">
                <div class="card-header">Lelang Berdasarkan Kategori (Unit Terjual)</div>
                <div style="padding:1rem 0;">
                  <svg viewBox="0 0 400 160" style="width:100%; height:auto; display:block; overflow:visible;">
                    <line x1="50" y1="20" x2="380" y2="20" stroke="#f1f2f6" stroke-width="1" />
                    <line x1="50" y1="70" x2="380" y2="70" stroke="#f1f2f6" stroke-width="1" />
                    <line x1="50" y1="120" x2="380" y2="120" stroke="#dcdde1" stroke-width="1" />
                    
                    <!-- Mobil -->
                    <rect x="90" y="69" width="30" height="51" rx="3" fill="var(--wf-primary)" />
                    <text x="105" y="60" fill="var(--wf-text)" font-size="9" font-weight="bold" text-anchor="middle">245</text>
                    
                    <!-- Motor -->
                    <rect x="170" y="20" width="30" height="100" rx="3" fill="var(--wf-gold)" />
                    <text x="185" y="12" fill="var(--wf-text)" font-size="9" font-weight="bold" text-anchor="middle">480</text>
                    
                    <!-- Alat Berat -->
                    <rect x="250" y="113" width="30" height="7" rx="2" fill="var(--wf-primary)" />
                    <text x="265" y="105" fill="var(--wf-text)" font-size="9" font-weight="bold" text-anchor="middle">32</text>
                    
                    <!-- Properti -->
                    <rect x="330" y="117" width="30" height="3" rx="1" fill="var(--wf-primary)" />
                    <text x="345" y="110" fill="var(--wf-text)" font-size="9" font-weight="bold" text-anchor="middle">12</text>
                    
                    <text x="105" y="138" fill="var(--wf-text-muted)" font-size="9" text-anchor="middle">Mobil</text>
                    <text x="185" y="138" fill="var(--wf-text-muted)" font-size="9" text-anchor="middle">Motor</text>
                    <text x="265" y="138" fill="var(--wf-text-muted)" font-size="9" text-anchor="middle">Alat Berat</text>
                    <text x="345" y="138" fill="var(--wf-text-muted)" font-size="9" text-anchor="middle">Properti</text>
                    
                    <text x="45" y="23" fill="var(--wf-text-muted)" font-size="8" text-anchor="end">500</text>
                    <text x="45" y="73" fill="var(--wf-text-muted)" font-size="8" text-anchor="end">250</text>
                    <text x="45" y="123" fill="var(--wf-text-muted)" font-size="8" text-anchor="end">0</text>
                  </svg>
                </div>
              </div>
            </div>
            <div>
              <div class="card">
                <div class="card-header">Aksi Administratif Cepat</div>
                <div style="display:flex; flex-direction:column; gap:0.5rem;">
                  <a href="ad6-verifikasi-kyc.html" class="btn btn-primary" style="justify-content:center;">🔍 Antrian Verifikasi KYC</a>
                  <a href="ad9-approval-barang.html" class="btn btn-outline" style="justify-content:center;">✔️ Approval Pengajuan Barang</a>
                  <a href="ad10-penyusunan-lot.html" class="btn btn-outline" style="justify-content:center;">📦 Penyusunan Lot Baru</a>
                </div>
              </div>
            </div>
          </div>
        `;
      } else if (p.id === 'ad2') { // List Bidder
        specificContent = `
          <div class="card">
            <div class="toolbar">
              <div class="toolbar-left">
                <input type="text" class="form-input" placeholder="Cari nama bidder..." style="width:250px;">
                <select class="form-select"><option>Semua Status eKYC</option><option>Terverifikasi</option><option>Pending</option></select>
              </div>
            </div>
            <div class="table-wrapper">
              <table>
                <thead>
                  <tr><th>ID Bidder</th><th>Nama Lengkap</th><th>Email</th><th>No HP</th><th>eKYC</th><th>Status Akun</th><th>Aksi</th></tr>
                </thead>
                <tbody>
                  <tr>
                    <td>#BD-98122</td>
                    <td class="fw-bold">Budi Santoso</td>
                    <td>budi.santoso@gmail.com</td>
                    <td>08123456789</td>
                    <td><span class="badge badge-success">Terverifikasi</span></td>
                    <td><span class="badge badge-success">Aktif</span></td>
                    <td><a href="ad5-detail-user.html" class="btn btn-sm btn-outline">Detail</a></td>
                  </tr>
                  <tr>
                    <td>#BD-98123</td>
                    <td class="fw-bold">Hendra Wijaya</td>
                    <td>hendra.w@gmail.com</td>
                    <td>08529988776</td>
                    <td><span class="badge badge-warning">Pending</span></td>
                    <td><span class="badge badge-success">Aktif</span></td>
                    <td><a href="ad5-detail-user.html" class="btn btn-sm btn-outline">Detail</a></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        `;
      } else if (p.id === 'ad3') { // List Provider
        specificContent = `
          <div class="card">
            <div class="table-wrapper">
              <table>
                <thead>
                  <tr><th>ID Provider</th><th>Nama Perusahaan</th><th>PIC</th><th>NPWP</th><th>Total Barang</th><th>Status</th><th>Aksi</th></tr>
                </thead>
                <tbody>
                  <tr>
                    <td>#PRV-012</td>
                    <td class="fw-bold">PT Astra Auto Indonesia</td>
                    <td>Andi Wijaya</td>
                    <td>01.234.567.8-901.000</td>
                    <td>12 Unit</td>
                    <td><span class="badge badge-success">Terverifikasi</span></td>
                    <td><a href="ad5-detail-user.html" class="btn btn-sm btn-outline">Detail</a></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        `;
      } else if (p.id === 'ad4') { // List Admin
        specificContent = `
          <div class="card">
            <div class="toolbar">
              <div class="toolbar-right">
                <a href="ad4b-tambah-staf.html" class="btn btn-primary">➕ Tambah Staf Baru</a>
              </div>
            </div>
            <div class="table-wrapper">
              <table>
                <thead>
                  <tr><th>ID Staf</th><th>Nama Lengkap</th><th>Email</th><th>Role Hak Akses</th><th>Cabang Kantor</th><th>Status</th></tr>
                </thead>
                <tbody id="staff-table-body">
                  <tr>
                    <td>#ADM-001</td>
                    <td class="fw-bold">Super Admin Utama</td>
                    <td>admin.main@indolelang.com</td>
                    <td><span class="badge badge-success">Superadmin</span></td>
                    <td>Jakarta (HQ)</td>
                    <td><span class="badge badge-success">Aktif</span></td>
                  </tr>
                  <tr>
                    <td>#ADM-005</td>
                    <td class="fw-bold">Joko Appraisal</td>
                    <td>joko.inspektor@indolelang.com</td>
                    <td><span class="badge badge-info">Appraisal</span></td>
                    <td>Surabaya</td>
                    <td><span class="badge badge-success">Aktif</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          <script>
            document.addEventListener('DOMContentLoaded', function() {
              const tableBody = document.getElementById('staff-table-body');
              const customStaff = JSON.parse(localStorage.getItem('mock_staff') || '[]');
              customStaff.forEach((staf, idx) => {
                const row = document.createElement('tr');
                let badgeClass = 'badge-info';
                if (staf.role === 'Superadmin') badgeClass = 'badge-success';
                else if (staf.role === 'Keuangan') badgeClass = 'badge-warning';
                
                row.innerHTML = \`
                  <td>#ADM-0\${10 + idx}</td>
                  <td class="fw-bold">\${staf.nama}</td>
                  <td>\${staf.email}</td>
                  <td><span class="badge \${badgeClass}">\${staf.role}</span></td>
                  <td>\${staf.cabang}</td>
                  <td><span class="badge badge-success">Aktif</span></td>
                \`;
                tableBody.appendChild(row);
              });
            });
          </script>
        `;
      } else if (p.id === 'ad4b') { // Tambah Staf Baru
        specificContent = `
          <div class="card" style="max-width:600px; margin: 0 auto;">
            <div class="card-header">Form Registrasi Staf Baru</div>
            <div class="form-group">
              <label class="form-label">Nama Lengkap <span class="required">*</span></label>
              <input type="text" class="form-input" id="staff-name" placeholder="Misal: Rian Kurniawan">
            </div>
            <div class="form-group">
              <label class="form-label">Email Staf <span class="required">*</span></label>
              <input type="email" class="form-input" id="staff-email" placeholder="rian.k@indolelang.com">
            </div>
            <div class="grid-2">
              <div class="form-group">
                <label class="form-label">Role Hak Akses <span class="required">*</span></label>
                <select class="form-select" id="staff-role">
                  <option value="Superadmin">Superadmin</option>
                  <option value="Keuangan">Admin Keuangan</option>
                  <option value="Operator" selected>Operator Lelang</option>
                  <option value="Appraisal">Appraisal / Inspektor</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Cabang Kantor <span class="required">*</span></label>
                <select class="form-select" id="staff-cabang">
                  <option value="Jakarta (HQ)">Jakarta (HQ)</option>
                  <option value="Bandung">Bandung</option>
                  <option value="Surabaya">Surabaya</option>
                  <option value="Medan">Medan</option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Password Awal Staf</label>
              <input type="text" class="form-input" value="LelangStaf2026!" disabled>
              <span class="form-hint">Kata sandi default untuk login pertama kali. Staf akan diminta menggantinya saat pertama kali masuk.</span>
            </div>
            <div style="display:flex; justify-content:flex-end; gap:0.5rem; margin-top:1.5rem;">
              <a href="ad4-list-admin.html" class="btn btn-outline">Batal</a>
              <button class="btn btn-primary" id="btn-save-staff">Simpan Staf Baru</button>
            </div>
          </div>
          
          <script>
            document.addEventListener('DOMContentLoaded', function() {
              const btnSave = document.getElementById('btn-save-staff');
              btnSave.addEventListener('click', function() {
                const nama = document.getElementById('staff-name').value.trim();
                const email = document.getElementById('staff-email').value.trim();
                const role = document.getElementById('staff-role').value;
                const cabang = document.getElementById('staff-cabang').value;
                
                if (!nama || !email) {
                  alert('Harap isi Nama Lengkap dan Email staf!');
                  return;
                }
                
                const customStaff = JSON.parse(localStorage.getItem('mock_staff') || '[]');
                customStaff.push({ nama, email, role, cabang });
                localStorage.setItem('mock_staff', JSON.stringify(customStaff));
                
                alert('Sukses: Staf baru "' + nama + '" berhasil disimpan ke database mockup!');
                window.location.href = 'ad4-list-admin.html';
              });
            });
          </script>
        `;
      } else if (p.id === 'ad5') { // Detail User
        specificContent = `
          <div class="grid-2-1" style="grid-template-columns: 1.5fr 1fr; gap:2rem;">
            <div class="card">
              <div class="card-header">Informasi Profil Pengguna</div>
              <table style="width:100%;">
                <tbody>
                  <tr><td class="fw-bold" style="width:30%;">Nama Lengkap</td><td>Budi Santoso</td></tr>
                  <tr><td class="fw-bold">NIK / KTP</td><td>327310******9003</td></tr>
                  <tr><td class="fw-bold">Email / HP</td><td>budi.santoso@gmail.com / 08123456789</td></tr>
                  <tr><td class="fw-bold">Rekening Bank</td><td>BCA - 8098765432 (a/n Budi Santoso)</td></tr>
                </tbody>
              </table>
              <div style="margin-top:1.5rem; display:flex; gap:0.5rem;">
                <button class="btn btn-danger">Suspend Akun</button>
                <button class="btn btn-outline">Kirim Ulang Email Reset Sandi</button>
              </div>
            </div>
            <div class="card">
              <div class="card-header">Dokumen eKYC Upload</div>
              <div class="img-placeholder" style="height:150px; margin-bottom:0.5rem;">Foto KTP Depan</div>
              <div class="img-placeholder" style="height:150px;">Foto Selfie dengan KTP</div>
            </div>
          </div>
        `;
      } else if (p.id === 'ad6') { // Antrian Verifikasi KYC
        specificContent = `
          <!-- Toggle Banner eKYC -->
          <div class="card" style="margin-bottom: 1.5rem; display: flex; align-items: center; justify-content: space-between; padding: 1rem 1.5rem; background: var(--wf-bg); border-left: 4px solid var(--wf-primary); flex-wrap: wrap; gap: 1rem;">
            <div>
              <h3 class="fw-bold" style="margin-bottom:0.25rem;">⚙️ Mode Verifikasi e-KYC Platform</h3>
              <p class="fs-sm text-muted">Tentukan apakah pendaftaran pengguna diverifikasi secara manual oleh tim admin atau otomatis menggunakan SDK Privy/Verihubs.</p>
            </div>
            <div>
              <div style="display: flex; gap: 0.25rem; background: var(--wf-border); padding: 0.25rem; border-radius: 6px;">
                <button id="btn-mode-manual" class="btn btn-sm" style="border:none; cursor:pointer;">Manual (Admin)</button>
                <button id="btn-mode-otomatis" class="btn btn-sm" style="border:none; cursor:pointer;">Otomatis (SDK)</button>
              </div>
            </div>
          </div>

          <!-- Status Notice -->
          <div id="otomatis-status-notice" class="alert alert-success" style="display:none; margin-bottom:1.5rem;">
            <div>
              <strong>⚡ e-KYC Otomatis AKTIF:</strong> Sistem saat ini menggunakan integrasi pihak ketiga. Pendaftaran pengguna baru akan langsung disetujui dalam 3 detik. Antrean di bawah ini bersifat arsip/log historis.
            </div>
          </div>

          <div id="manual-status-notice" class="alert alert-info" style="margin-bottom:1.5rem;">
            <div>
              <strong>💡 e-KYC Manual AKTIF:</strong> Seluruh pendaftaran pengguna ditahan di status Pending dan membutuhkan review admin secara manual melalui panel di bawah ini.
            </div>
          </div>

          <div class="grid-1-2" style="grid-template-columns:1fr 1.5fr; gap:2rem;" id="kyc-content-grid">
            <div class="card">
              <div class="card-header">Daftar Permohonan Pending</div>
              <div style="display:flex; flex-direction:column; gap:0.5rem;" id="kyc-pending-list">
                <div id="kyc-item-budi" style="padding:0.75rem; border:1px solid var(--wf-accent); border-radius:6px; background:var(--wf-gold-bg); cursor:pointer;">
                  <strong>Budi Santoso (Anda)</strong><br>
                  <span class="fs-sm text-muted" id="budi-status-badge">Diajukan: Baru saja (Status: Pending)</span>
                </div>
                <div style="padding:0.75rem; border:1px solid var(--wf-border); border-radius:6px; cursor:pointer;">
                  <strong>Hendra Wijaya</strong><br>
                  <span class="fs-sm text-muted">Diajukan: Hari ini, 20:00 WIB</span>
                </div>
                <div style="padding:0.75rem; border:1px solid var(--wf-border); border-radius:6px; cursor:pointer;">
                  <strong>Rian Kurniawan</strong><br>
                  <span class="fs-sm text-muted">Diajukan: Hari ini, 19:30 WIB</span>
                </div>
              </div>
            </div>
            
            <div class="card" id="kyc-detail-card">
              <div class="card-header" id="kyc-detail-title">Verifikasi Detail: Budi Santoso</div>
              <div class="grid-2" style="gap:1rem; margin-bottom:1.5rem;">
                <div>
                  <div class="img-placeholder" style="height:140px;">KTP: Budi Santoso</div>
                </div>
                <div>
                  <div class="img-placeholder" style="height:140px;">Selfie: Budi Santoso</div>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Data Ekstraksi OCR vs NIK Tertera</label>
                <input type="text" class="form-input" value="327310******9003 (Cocok dengan NIK Dukcapil)" disabled>
              </div>
              <div style="display:flex; gap:0.5rem; justify-content:flex-end;" id="kyc-action-buttons">
                <button class="btn btn-danger" id="btn-reject-kyc">Tolak Verifikasi</button>
                <button class="btn btn-success" id="btn-approve-kyc">Setujui & Verifikasi</button>
              </div>
            </div>
          </div>

          <script>
            document.addEventListener('DOMContentLoaded', function() {
              const btnManual = document.getElementById('btn-mode-manual');
              const btnOtomatis = document.getElementById('btn-mode-otomatis');
              const noticeOtomatis = document.getElementById('otomatis-status-notice');
              const noticeManual = document.getElementById('manual-status-notice');
              
              // Load ekyc mode
              let ekycMode = localStorage.getItem('ekyc_mode') || 'manual';
              updateToggleUI();
              
              btnManual.addEventListener('click', function() {
                localStorage.setItem('ekyc_mode', 'manual');
                ekycMode = 'manual';
                updateToggleUI();
                alert('Mode Verifikasi e-KYC diubah ke MANUAL. Pendaftaran baru memerlukan persetujuan admin.');
              });
              
              btnOtomatis.addEventListener('click', function() {
                localStorage.setItem('ekyc_mode', 'otomatis');
                ekycMode = 'otomatis';
                updateToggleUI();
                alert('Mode Verifikasi e-KYC diubah ke OTOMATIS. Sistem akan menggunakan SDK Pihak Ketiga secara instan.');
              });
              
              function updateToggleUI() {
                if (ekycMode === 'otomatis') {
                  btnOtomatis.style.background = 'var(--wf-primary)';
                  btnOtomatis.style.color = '#fff';
                  btnManual.style.background = 'transparent';
                  btnManual.style.color = 'var(--wf-text-muted)';
                  
                  noticeOtomatis.style.display = 'block';
                  noticeManual.style.display = 'none';
                } else {
                  btnManual.style.background = 'var(--wf-primary)';
                  btnManual.style.color = '#fff';
                  btnOtomatis.style.background = 'transparent';
                  btnOtomatis.style.color = 'var(--wf-text-muted)';
                  
                  noticeManual.style.display = 'block';
                  noticeOtomatis.style.display = 'none';
                }
              }
              
              // Handle Budi Santoso manual approval simulation
              const btnApprove = document.getElementById('btn-approve-kyc');
              const btnReject = document.getElementById('btn-reject-kyc');
              const kycItemBudi = document.getElementById('kyc-item-budi');
              const budiStatusBadge = document.getElementById('budi-status-badge');
              
              // Update badge state based on localStorage
              const currentStatus = localStorage.getItem('user_ekyc_status') || 'pending';
              if (currentStatus === 'verified') {
                showBudiAsVerified();
              }
              
              btnApprove.addEventListener('click', function() {
                localStorage.setItem('user_ekyc_status', 'verified');
                showBudiAsVerified();
                alert('Akun Budi Santoso berhasil diverifikasi secara manual!');
              });
              
              btnReject.addEventListener('click', function() {
                localStorage.setItem('user_ekyc_status', 'rejected');
                budiStatusBadge.innerHTML = 'Diajukan: Baru saja (Status: DITOLAK)';
                budiStatusBadge.style.color = 'var(--wf-danger)';
                alert('Pendaftaran e-KYC Budi Santoso ditolak.');
              });
              
              function showBudiAsVerified() {
                budiStatusBadge.innerHTML = 'Diajukan: Baru saja (Status: TERVERIFIKASI)';
                budiStatusBadge.style.color = 'var(--wf-success)';
                if (kycItemBudi) {
                  kycItemBudi.style.background = 'rgba(46, 204, 113, 0.1)';
                  kycItemBudi.style.borderColor = 'var(--wf-success)';
                }
                document.getElementById('kyc-action-buttons').innerHTML = '<span style="color:var(--wf-success); font-weight:bold;">🟢 Disetujui & Aktif</span>';
              }
            });
          </script>
        `;
      } else if (p.id === 'ad7') { // List Semua Barang
        specificContent = `
          <div class="card">
            <div class="toolbar">
              <div class="toolbar-left">
                <input type="text" class="form-input" placeholder="Cari barang..." style="width:200px;">
                <select class="form-select"><option>Semua Status</option><option>Pending</option><option>Dilelang</option></select>
              </div>
            </div>
            <div class="table-wrapper">
              <table>
                <thead>
                  <tr><th>ID Barang</th><th>Nama Barang</th><th>Provider</th><th>Harga Dasar</th><th>Status</th><th>Aksi</th></tr>
                </thead>
                <tbody>
                  <tr>
                    <td>#BRG-102</td>
                    <td class="fw-bold">Toyota Avanza 1.3 G MT 2022</td>
                    <td>PT Astra Auto</td>
                    <td>Rp 145.000.000</td>
                    <td><span class="badge badge-success">Lotting Terjadwal</span></td>
                    <td><a href="ad8-detail-barang.html" class="btn btn-sm btn-outline">Detail</a></td>
                  </tr>
                  <tr>
                    <td>#BRG-103</td>
                    <td class="fw-bold">Honda Brio Satya 1.2 E 2021</td>
                    <td>PT Astra Auto</td>
                    <td>-</td>
                    <td><span class="badge badge-warning">Menunggu Inspeksi</span></td>
                    <td><a href="ad8-detail-barang.html" class="btn btn-sm btn-outline">Detail/Inspeksi</a></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        `;
      } else if (p.id === 'ad8') { // Detail Barang & Inspeksi
        specificContent = `
          <div class="grid-2-1" style="grid-template-columns: 1.5fr 1fr; gap:2rem;">
            <div>
              <div class="card">
                <div class="card-header">Form Hasil Inspeksi Teknis (Appraisal)</div>
                <div class="form-group">
                  <label class="form-label">Nama Barang / Kendaraan</label>
                  <input type="text" class="form-input" value="Honda Brio Satya 1.2 E 2021" disabled>
                </div>
                <div class="grid-2">
                  <div class="form-group">
                    <label class="form-label">Grade Mesin</label>
                    <select class="form-select"><option>Grade A (Sangat Baik)</option><option selected>Grade B (Baik)</option><option>Grade C</option></select>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Grade Interior</label>
                    <select class="form-select"><option selected>Grade A</option><option>Grade B</option></select>
                  </div>
                </div>
                <div class="form-group">
                  <label class="form-label">Rekomendasi Harga Dasar Minimum</label>
                  <input type="text" class="form-input" value="Rp 115.000.000">
                </div>
                <div class="form-group">
                  <label class="form-label">Catatan Hasil Pemeriksaan Fisik</label>
                  <textarea class="form-textarea" rows="3">Mesin berfungsi prima. Oli mesin bersih. Terdapat sedikit goresan halus di dekat gagang pintu pengemudi. AC berfungsi sangat baik.</textarea>
                </div>
                <button class="btn btn-primary">Simpan Laporan Inspeksi</button>
              </div>
            </div>
            
            <div>
              <div class="card">
                <div class="card-header">Serah Terima & BAST Titip Jual</div>
                <div style="font-size:0.85rem; line-height: 1.8;" class="mb-2">
                  • <strong>Status Fisik:</strong> <span class="badge badge-success">Diterima di Gudang JKT</span><br>
                  • <strong>Tanggal Masuk:</strong> 09 Juni 2026, 11:30 WIB<br>
                  • <strong>Diserahkan Oleh:</strong> Driver PT Astra Auto (Budi)<br>
                  • <strong>Penerima:</strong> Jaka (Staf Gudang Balai Lelang)<br>
                  • <strong>Nomor BAST:</strong> BAST-TJ/2026/06/102<br>
                  • <strong>Tanda Tangan BAST:</strong> <span class="badge badge-success">Lengkap (Dual-Sign)</span>
                </div>
                <button class="btn btn-outline btn-sm w-100">📥 Unduh PDF BAST Titip Jual</button>
              </div>
              
              <div class="card mt-2">
                <div class="card-header">Foto Fisik Kendaraan</div>
                <div class="img-placeholder" style="height:150px; margin-bottom:0.5rem;">Tampak Depan</div>
                <div class="img-placeholder" style="height:150px;">Nomor Rangka Mesin</div>
              </div>
            </div>
          </div>
        `;
      } else if (p.id === 'ad9') { // Approval Barang
        specificContent = `
          <div class="card">
            <div class="table-wrapper">
              <table>
                <thead>
                  <tr><th>ID Barang</th><th>Nama Barang</th><th>Provider</th><th>Appraisal Grade</th><th>Rekomendasi Harga</th><th>Status</th><th>Aksi</th></tr>
                </thead>
                <tbody>
                  <tr>
                    <td>#BRG-103</td>
                    <td class="fw-bold">Honda Brio Satya 1.2 E 2021</td>
                    <td>PT Astra Auto</td>
                    <td>Grade B / Interior A</td>
                    <td class="fw-bold">Rp 115.000.000</td>
                    <td><span class="badge badge-warning">Menunggu Approval Manager</span></td>
                    <td>
                      <button class="btn btn-sm btn-success">Setujui</button>
                      <button class="btn btn-sm btn-danger">Tolak</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        `;
      } else if (p.id === 'ad10') { // Penyusunan Lot
        specificContent = `
          <div class="grid-2-1" style="grid-template-columns: 1.2fr 1fr; gap:2rem;">
            <div class="card">
              <div class="card-header">Penyusunan Urutan Lot Sesi Lelang</div>
              <div class="form-group">
                <label class="form-label">Pilih Sesi Tujuan</label>
                <select class="form-select"><option>Lelang Mobil Penumpang JKT - 12 Juni 2026</option></select>
              </div>
              <div style="border:1px solid var(--wf-border); padding:1rem; border-radius:6px; background:#fff; display:flex; flex-direction:column; gap:0.5rem;">
                <div style="padding:0.5rem; background:var(--wf-bg); border:1px solid var(--wf-border); border-radius:4px; display:flex; justify-content:space-between;">
                  <span><strong>Lot 1:</strong> Toyota Avanza 1.3 G MT 2022</span>
                  <span>Rp 145.000.000</span>
                </div>
                <div style="padding:0.5rem; background:var(--wf-bg); border:1px solid var(--wf-border); border-radius:4px; display:flex; justify-content:space-between;">
                  <span><strong>Lot 2:</strong> Honda Brio Satya 1.2 E 2021</span>
                  <span>Rp 115.000.000</span>
                </div>
              </div>
              <button class="btn btn-primary mt-2">Simpan Susunan Lot</button>
            </div>
            
            <div class="card">
              <div class="card-header">Pool Barang Siap Lotting</div>
              <div style="display:flex; flex-direction:column; gap:0.5rem;">
                <div style="padding:0.5rem; border:1px dashed var(--wf-border); border-radius:4px; display:flex; justify-content:space-between; align-items:center;">
                  <span>Suzuki Ertiga GL 2020</span>
                  <button class="btn btn-sm btn-primary">Assign ke Lot 3</button>
                </div>
              </div>
            </div>
          </div>
        `;
      } else if (p.id === 'ad11') { // List Sesi
        specificContent = `
          <div class="card">
            <div class="toolbar">
              <div class="toolbar-right">
                <a href="ad12-form-sesi.html" class="btn btn-primary">➕ Tambah Sesi Lelang Baru</a>
              </div>
            </div>
            <div class="table-wrapper">
              <table>
                <thead>
                  <tr><th>ID Sesi</th><th>Nama Sesi Lelang</th><th>Tanggal & Waktu</th><th>Total Lot</th><th>Status</th><th>Aksi</th></tr>
                </thead>
                <tbody>
                  <tr>
                    <td>#SESI-120</td>
                    <td class="fw-bold">Lelang Mobil Penumpang Jakarta - Batch 15</td>
                    <td>12 Jun 2026, 10:00</td>
                    <td>45 Lot</td>
                    <td><span class="badge badge-success">LIVE</span></td>
                    <td>
                      <a href="ad13-ruang-kontrol.html" class="btn btn-sm btn-gold">Buka Kontrol</a>
                      <a href="ad14-hasil-sesi.html" class="btn btn-sm btn-outline">Hasil</a>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        `;
      } else if (p.id === 'ad12') { // Buat Sesi
        specificContent = `
          <div class="card" style="max-width:800px; margin:0 auto;">
            <div class="card-header">Form Pembuatan Sesi Lelang Baru</div>
            <div class="form-group">
              <label class="form-label">Nama Sesi Lelang <span class="required">*</span></label>
              <input type="text" class="form-input" placeholder="Misal: Lelang Motor Bandung - Batch 23">
            </div>
            <div class="grid-2">
              <div class="form-group">
                <label class="form-label">Tanggal Mulai <span class="required">*</span></label>
                <input type="date" class="form-input" value="2026-06-12">
              </div>
              <div class="form-group">
                <label class="form-label">Waktu Mulai (WIB) <span class="required">*</span></label>
                <input type="time" class="form-input" value="10:00">
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Anti-Sniping Mode</label>
              <label><input type="checkbox" checked> Aktifkan perpanjangan waktu 2 menit otomatis jika ada bid di 2 menit terakhir.</label>
            </div>
            <div class="form-group">
              <label class="form-label">Tipe Lelang</label>
              <select class="form-select">
                <option selected>Live Online Auction (Bidding Room)</option>
                <option>Close Bid / Tender</option>
              </select>
            </div>
            <button class="btn btn-primary">Buat Sesi Lelang</button>
          </div>
        `;
      } else if (p.id === 'ad13') { // Ruang Kontrol Admin
        specificContent = `
          <div class="grid-2-1">
            <div class="card">
              <div class="card-header">Kontrol Sesi Lelang Aktif <span class="badge badge-danger">LIVE</span></div>
              <h2 class="page-title mt-1">Sesi Mobil Jakarta - Batch 15</h2>
              <div class="separator"></div>
              
              <div style="background:var(--wf-bg); padding:1rem; border-radius:6px; margin-bottom:1.5rem;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                  <div>
                    <div class="text-muted fs-sm">Lot Berjalan: 12 dari 45</div>
                    <strong style="font-size:1.1rem;">Toyota Avanza 1.3 G MT 2022</strong>
                  </div>
                  <div class="text-right">
                    <div class="text-muted fs-sm">Sisa Waktu Bid:</div>
                    <div class="fw-bold text-danger" id="admin-timer-val" style="font-size:1.3rem;">00:48</div>
                  </div>
                </div>
              </div>
              
              <div style="background:var(--wf-white); border:1px solid var(--wf-border); border-radius:6px; padding:1rem; margin-bottom:1.5rem; display:flex; justify-content:space-between; align-items:center;">
                <div>
                  <span class="text-muted fs-sm">Harga Pembukaan: Rp 145.000.000</span><br>
                  <span class="fs-sm">Harga Hammer Terkini: <strong class="text-success" id="admin-price-val" style="font-size:1.1rem;">Rp 167.500.000</strong></span>
                </div>
                <div>
                  <span class="fs-sm">Penawar Tertinggi: <strong id="admin-leader-val">Bidder_A*** (8092)</strong></span>
                </div>
              </div>
              
              <div style="display:flex; gap:0.5rem; justify-content:flex-end;">
                <button class="btn btn-outline" id="btn-add-time">+30 Detik</button>
                <button class="btn btn-danger" id="btn-cancel-lot">Hentikan / Batal Lot</button>
                <button class="btn btn-success" id="btn-hammer-sold" style="font-size:1.1rem; font-weight:700;">🚨 KETOK PALU (SOLD)</button>
              </div>
            </div>
            
            <div class="card">
              <div class="card-header">Riwayat Bid Real-Time</div>
              <div class="bid-history" id="admin-bid-history-list" style="height:250px;">
                <div class="bid-history-item"><span>Bidder_A*** (8092)</span><span class="text-success fw-bold">Rp 167.500.000</span></div>
                <div class="bid-history-item"><span>Bidder_X*** (98122)</span><span>Rp 165.000.000</span></div>
              </div>
            </div>
          </div>
          
          <script>
            document.addEventListener('DOMContentLoaded', function() {
              let currentPrice = 167500000;
              const bidIncrement = 2500000;
              let sisaWaktu = 48;
              let highestBidder = 'Bidder_A*** (8092)';
              let isFinished = false;

              const timerEl = document.getElementById('admin-timer-val');
              const priceEl = document.getElementById('admin-price-val');
              const leaderEl = document.getElementById('admin-leader-val');
              const historyList = document.getElementById('admin-bid-history-list');

              const btnAddTime = document.getElementById('btn-add-time');
              const btnCancel = document.getElementById('btn-cancel-lot');
              const btnHammer = document.getElementById('btn-hammer-sold');

              function formatRupiah(num) {
                return 'Rp ' + num.toLocaleString('id-ID');
              }

              function updateUI() {
                priceEl.textContent = formatRupiah(currentPrice);
                leaderEl.textContent = highestBidder;
                
                let mins = Math.floor(sisaWaktu / 60);
                let secs = sisaWaktu % 60;
                timerEl.textContent = (mins < 10 ? '0' : '') + mins + ':' + (secs < 10 ? '0' : '') + secs;
                
                if (sisaWaktu <= 10) {
                  timerEl.style.color = '#e74c3c';
                  timerEl.style.fontWeight = 'bold';
                } else {
                  timerEl.style.color = 'var(--wf-danger)';
                  timerEl.style.fontWeight = 'normal';
                }
              }

              function addBidLog(user, amount) {
                const row = document.createElement('div');
                row.className = 'bid-history-item';
                row.innerHTML = '<span>' + user + '</span><span class="text-success fw-bold">' + formatRupiah(amount) + '</span>';
                historyList.insertBefore(row, historyList.firstChild);
                
                while (historyList.children.length > 8) {
                  historyList.removeChild(historyList.lastChild);
                }
              }

              const timerInterval = setInterval(function() {
                if (isFinished) return;
                sisaWaktu--;
                if (sisaWaktu <= 0) {
                  sisaWaktu = 0;
                  isFinished = true;
                  clearInterval(timerInterval);
                  triggerSold();
                }
                updateUI();
              }, 1000);

              function triggerFakeBid() {
                if (isFinished) return;
                const randomId = 1000 + Math.floor(Math.random()*9000);
                highestBidder = 'Bidder_' + String.fromCharCode(65 + Math.floor(Math.random()*6)) + '*** (' + randomId + ')';
                currentPrice += bidIncrement;
                addBidLog(highestBidder, currentPrice);
                if (sisaWaktu < 15) {
                  sisaWaktu = 30;
                }
                updateUI();
                
                setTimeout(triggerFakeBid, 5000 + Math.random()*4000);
              }
              setTimeout(triggerFakeBid, 4000);

              btnAddTime.addEventListener('click', function() {
                if (isFinished) return;
                sisaWaktu += 30;
                updateUI();
              });

              btnCancel.addEventListener('click', function() {
                if (isFinished) return;
                let conf = confirm('Apakah Anda yakin ingin membatalkan lot berjalan ini?');
                if (conf) {
                  isFinished = true;
                  clearInterval(timerInterval);
                  alert('Lot #1045 telah dibatalkan dari sesi lelang.');
                  window.location.reload();
                }
              });

              btnHammer.addEventListener('click', function() {
                if (isFinished) return;
                isFinished = true;
                clearInterval(timerInterval);
                triggerSold();
              });

              function triggerSold() {
                const modalOverlay = document.createElement('div');
                modalOverlay.className = 'modal-overlay';
                modalOverlay.innerHTML = \`
                  <div class="modal" style="max-width: 450px; color: var(--wf-text);">
                    <div class="modal-header">
                      <span>🔨 LOT SOLD! (Ketok Palu Selesai)</span>
                    </div>
                    <div class="modal-body text-center">
                      <div style="font-size: 4rem; margin-bottom: 1rem;">🔨</div>
                      <h3 class="fw-bold" style="color:var(--wf-success);">Lot #1045 Dinyatakan TERJUAL</h3>
                      <p style="margin-top: 1rem; line-height: 1.6;">
                        • Aset: <strong>Toyota Avanza 1.3 G MT 2022</strong><br>
                        • Harga Akhir: <strong>\\\${formatRupiah(currentPrice)}</strong><br>
                        • Pemenang: <strong>\\\${highestBidder}</strong>
                      </p>
                      <p class="fs-sm text-muted mt-2">Sistem sedang menerbitkan invoice pelunasan otomatis untuk pemenang lelang.</p>
                    </div>
                    <div class="modal-footer" style="justify-content: center;">
                      <a href="ad14-hasil-sesi.html" class="btn btn-primary">Buka Laporan Hasil Sesi</a>
                    </div>
                  </div>
                \`;
                document.body.appendChild(modalOverlay);
              }
            });
          </script>
        `;
      } else if (p.id === 'ad14') { // Hasil Sesi
        specificContent = `
          <div class="card">
            <div class="kpi-grid" style="margin-bottom:1.5rem;">
              <div class="kpi-card text-center"><div class="kpi-value">Rp 985.000.000</div><div class="kpi-label">Total Transaksi Sesi</div></div>
              <div class="kpi-card text-center"><div class="kpi-value">42 / 45</div><div class="kpi-label">Lot Terjual</div></div>
              <div class="kpi-card text-center"><div class="kpi-value">Rp 14,775,000</div><div class="kpi-label">Komisi Balai Lelang</div></div>
            </div>
            <div class="table-wrapper">
              <table>
                <thead>
                  <tr><th>Lot ID</th><th>Nama Barang</th><th>Pemenang</th><th>Harga Hammer</th><th>Status Pelunasan</th></tr>
                </thead>
                <tbody>
                  <tr>
                    <td>#1045</td>
                    <td class="fw-bold">Toyota Avanza 1.3 G MT 2022</td>
                    <td>Budi Santoso (#BD-98122)</td>
                    <td class="fw-bold text-primary">Rp 167.500.000</td>
                    <td><span class="badge badge-warning">Belum Lunas</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        `;
      } else if (p.id === 'ad15') { // Deposit Masuk
        specificContent = `
          <div class="card">
            <div class="table-wrapper">
              <table>
                <thead>
                  <tr><th>ID Transaksi</th><th>Nama Bidder</th><th>Sesi Lelang</th><th>Nominal</th><th>Metode Bayar</th><th>Status</th><th>Aksi</th></tr>
                </thead>
                <tbody>
                  <tr>
                    <td>#TR-8912</td>
                    <td class="fw-bold">Budi Santoso</td>
                    <td>Sesi Mobil Jakarta</td>
                    <td class="fw-bold">Rp 5.000.000</td>
                    <td>BCA VA (Auto)</td>
                    <td><span class="badge badge-success">Diterima / NIPL Aktif</span></td>
                    <td><span class="text-muted fs-sm">-</span></td>
                  </tr>
                  <tr>
                    <td>#TR-8901</td>
                    <td class="fw-bold">Ahmad Fauzi</td>
                    <td>Sesi Mobil Jakarta</td>
                    <td class="fw-bold">Rp 5.000.000</td>
                    <td>Transfer Manual</td>
                    <td><span class="badge badge-warning">Butuh Verifikasi Manual</span></td>
                    <td>
                      <button class="btn btn-sm btn-success">Setujui</button>
                      <button class="btn btn-sm btn-danger">Tolak</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        `;
      } else if (p.id === 'ad16') { // Pelunasan Pemenang
        specificContent = `
          <div class="card">
            <div class="table-wrapper">
              <table>
                <thead>
                  <tr><th>Invoice ID</th><th>Pemenang</th><th>Aset Kendaraan</th><th>Total Tagihan</th><th>Batas Pelunasan</th><th>Status</th><th>Aksi</th></tr>
                </thead>
                <tbody>
                  <tr>
                    <td>#INV-1045</td>
                    <td class="fw-bold">Budi Santoso</td>
                    <td>Toyota Avanza 2022 (Lot #1045)</td>
                    <td class="fw-bold text-danger">Rp 166.855.000</td>
                    <td>15 Juni 2026</td>
                    <td><span class="badge badge-warning">Menunggu Pembayaran</span></td>
                    <td><button class="btn btn-sm btn-outline">Kirim Tagihan WA</button></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        `;
      } else if (p.id === 'ad17') { // Pencairan ke Provider
        specificContent = `
          <div class="card">
            <div class="table-wrapper">
              <table>
                <thead>
                  <tr><th>Provider</th><th>Aset Terjual</th><th>Harga Hammer</th><th>Komisi & Pajak</th><th>Net Pencairan</th><th>Status</th><th>Aksi</th></tr>
                </thead>
                <tbody>
                  <tr>
                    <td class="fw-bold">PT Astra Auto</td>
                    <td>Toyota Avanza 2022</td>
                    <td>Rp 167.500.000</td>
                    <td>Rp 6.867.500</td>
                    <td class="fw-bold text-success">Rp 160.632.500</td>
                    <td><span class="badge badge-warning">Persetujuan Pencairan</span></td>
                    <td>
                      <button class="btn btn-sm btn-primary">Setujui Transfer Dana</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        `;
      } else if (p.id === 'ad18') { // Refund Deposit
        specificContent = `
          <div class="kpi-grid">
            <div class="kpi-card"><div class="kpi-label">Saldo Merchant (Disbursement Balance)</div><div class="kpi-value" id="merchant-balance">Rp 480.000.000</div><div class="kpi-trend text-success">Di-escrow via Xendit/Midtrans</div></div>
            <div class="kpi-card gold"><div class="kpi-label">Antrian Refund Pending</div><div class="kpi-value" id="pending-refund-count">3 Transaksi</div><div class="kpi-trend text-danger">Total Rp 356.000.000</div></div>
            <div class="kpi-card success"><div class="kpi-label">Refund Berhasil (Sesi Ini)</div><div class="kpi-value" id="success-refund-count">12 Transaksi</div><div class="kpi-trend text-success">Total Rp 60.000.000</div></div>
          </div>
          
          <div class="grid-2-1" style="grid-template-columns: 2fr 1.2fr; gap: 1.5rem; margin-top: 1.5rem;">
            <div class="card" style="margin-bottom:0;">
              <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
                <span>Daftar Antrian Refund Jaminan (Deposit)</span>
                <button class="btn btn-primary btn-sm" id="btn-bulk-refund">⚡ Jalankan Bulk Auto-Refund (Semua)</button>
              </div>
              <div class="table-wrapper">
                <table>
                  <thead>
                    <tr><th>Bidder</th><th>Bank Tujuan</th><th>No Rekening</th><th>Nominal</th><th>Jaringan Rute</th><th>Status</th><th>Aksi</th></tr>
                  </thead>
                  <tbody id="refund-table-body">
                    <tr id="row-rf-1" data-amount="5000000" data-bidder="Ahmad Fauzi" data-bank="BCA" data-acc="80981273912">
                      <td class="fw-bold">Ahmad Fauzi</td>
                      <td>Bank BCA</td>
                      <td><code>80981273912</code></td>
                      <td class="fw-bold">Rp 5.000.000</td>
                      <td><span class="badge badge-info">Auto (BI-FAST)</span></td>
                      <td class="status-cell"><span class="badge badge-warning">Menunggu</span></td>
                      <td class="action-cell"><button class="btn btn-sm btn-success btn-trigger-refund" data-row="1">Transfer</button></td>
                    </tr>
                    <tr id="row-rf-2" data-amount="1000000" data-bidder="Hendra Wijaya" data-bank="Mandiri" data-acc="1370018273918">
                      <td class="fw-bold">Hendra Wijaya</td>
                      <td>Bank Mandiri</td>
                      <td><code>1370018273918</code></td>
                      <td class="fw-bold">Rp 1.000.000</td>
                      <td><span class="badge badge-info">Auto (BI-FAST)</span></td>
                      <td class="status-cell"><span class="badge badge-warning">Menunggu</span></td>
                      <td class="action-cell"><button class="btn btn-sm btn-success btn-trigger-refund" data-row="2">Transfer</button></td>
                    </tr>
                    <tr id="row-rf-3" data-amount="350000000" data-bidder="PT Auto Transport" data-bank="BRI" data-acc="020601928371502">
                      <td class="fw-bold">PT Auto Transport</td>
                      <td>Bank BRI</td>
                      <td><code>020601928371502</code></td>
                      <td class="fw-bold">Rp 350.000.000</td>
                      <td><span class="badge badge-danger" style="background:#8e44ad; color:#fff;">Auto (RTGS)</span></td>
                      <td class="status-cell"><span class="badge badge-warning">Menunggu</span></td>
                      <td class="action-cell"><button class="btn btn-sm btn-success btn-trigger-refund" data-row="3">Transfer</button></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            
            <div class="card" style="margin-bottom:0; display:flex; flex-direction:column;">
              <div class="card-header">Logs API Payment Gateway (JSON Webhook)</div>
              <div style="background:#1e1e1e; color:#00ff00; padding:1rem; border-radius:6px; font-family:monospace; font-size:0.75rem; flex:1; overflow-y:auto; min-height:280px; max-height:360px;" id="api-log-box">
                // System idle. Menunggu aktivitas API...
              </div>
            </div>
          </div>
          
          <script>
            document.addEventListener('DOMContentLoaded', function() {
              let balance = 480000000;
              let successCount = 12;
              let pendingCount = 3;
              let refundTotal = 60000000;
              const fee = 2500; // Flat fee per disbursement
              
              const balanceEl = document.getElementById('merchant-balance');
              const pendingCountEl = document.getElementById('pending-refund-count');
              const successCountEl = document.getElementById('success-refund-count');
              const logBox = document.getElementById('api-log-box');
              
              function formatRupiah(num) {
                return 'Rp ' + num.toLocaleString('id-ID');
              }
              
              function writeLog(message, isJson = false) {
                const timestamp = new Date().toLocaleTimeString();
                if (isJson) {
                  logBox.innerHTML = '<span style="color:#85c1e9;">[' + timestamp + '] REQUEST & RESPONSE:</span>\\n' + message + '\\n\\n' + logBox.innerHTML;
                } else {
                  logBox.innerHTML = '<span style="color:#f39c12;">[' + timestamp + ']</span> ' + message + '\\n' + logBox.innerHTML;
                }
              }
              
              function triggerRefund(rowId, callback) {
                const tr = document.getElementById('row-rf-' + rowId);
                if (!tr || tr.dataset.processed === 'true') {
                  if (callback) callback();
                  return;
                }
                
                tr.dataset.processed = 'true';
                const amount = parseInt(tr.dataset.amount);
                const bidder = tr.dataset.bidder;
                const bank = tr.dataset.bank;
                const acc = tr.dataset.acc;
                
                const statusCell = tr.querySelector('.status-cell');
                const actionCell = tr.querySelector('.action-cell');
                
                statusCell.innerHTML = '<span class="badge badge-info">Memproses...</span>';
                actionCell.innerHTML = '<span style="font-size:0.8rem; color:var(--wf-text-muted);">In-Progress</span>';
                
                const method = amount > 250000000 ? 'RTGS' : 'BI-FAST';
                writeLog('Pemicu otomatisasi refund untuk ' + bidder + ' senilai ' + formatRupiah(amount));
                
                // Simulate network latency (1.5 seconds)
                setTimeout(function() {
                  // Deduct balance
                  balance -= (amount + fee);
                  successCount += 1;
                  pendingCount -= 1;
                  refundTotal += amount;
                  
                  // Update KPIs
                  balanceEl.textContent = formatRupiah(balance);
                  pendingCountEl.textContent = pendingCount + ' Transaksi';
                  successCountEl.textContent = successCount + ' Transaksi';
                  
                  // Update row status
                  statusCell.innerHTML = '<span class="badge badge-success">Selesai (Auto)</span>';
                  actionCell.innerHTML = '<span style="color:green; font-weight:bold;">✔️ Sent (' + method + ')</span>';
                  
                  // Mock JSON Payload
                  const requestPayload = {
                    external_id: "ref-dep-" + Math.floor(Math.random()*90000 + 10000),
                    amount: amount,
                    bank_code: bank,
                    account_number: acc,
                    description: "Refund Deposit NIPL Sesi Jakarta",
                    callback_url: "https://indolelang.com/webhooks/refund"
                  };
                  
                  const responsePayload = {
                    id: "disb-" + Math.random().toString(36).substring(2, 11),
                    external_id: requestPayload.external_id,
                    amount: amount,
                    status: "COMPLETED",
                    payment_method: method,
                    bank_code: bank,
                    account_holder_name: bidder.toUpperCase(),
                    account_number: acc,
                    disbursement_description: requestPayload.description,
                    failure_code: null,
                    created: new Date().toISOString(),
                    completed_at: new Date().toISOString(),
                    fee_charged: fee
                  };
                  
                  writeLog(JSON.stringify({
                    API_ENDPOINT: "POST /disbursements",
                    REQUEST: requestPayload,
                    RESPONSE: responsePayload
                  }, null, 2), true);
                  
                  writeLog("Refund berhasil dikirim melalui jaringan " + method + " ke " + bidder + " (" + bank + ")!");
                  
                  if (callback) callback();
                }, 1500);
              }
              
              // Event listeners for individual triggers
              document.addEventListener("click", function(e) {
                if (e.target && e.target.classList.contains("btn-trigger-refund")) {
                  const rowId = e.target.getAttribute("data-row");
                  triggerRefund(rowId);
                }
              });
              
              // Bulk trigger
              const btnBulk = document.getElementById("btn-bulk-refund");
              btnBulk.addEventListener("click", function() {
                btnBulk.disabled = true;
                btnBulk.style.opacity = 0.5;
                btnBulk.textContent = "Memproses Bulk Refund...";
                
                let i = 1;
                function processNext() {
                  if (i <= 3) {
                    const tr = document.getElementById("row-rf-" + i);
                    if (tr && tr.dataset.processed !== "true") {
                      triggerRefund(i, function() {
                        i++;
                        setTimeout(processNext, 500);
                      });
                    } else {
                      i++;
                      processNext();
                    }
                  } else {
                    btnBulk.textContent = "Bulk Refund Selesai ✔️";
                  }
                }
                processNext();
              });
            });
          </script>
        `;
      } else if (p.id === 'ad19') { // Laporan Sesi Lelang
        specificContent = `
          <div class="card">
            <div class="toolbar">
              <div class="toolbar-left">
                <input type="text" class="form-input" placeholder="Cari..." style="width:200px;">
              </div>
            </div>
            <div class="table-wrapper">
              <table>
                <thead>
                  <tr><th>Nama Sesi</th><th>Tanggal Sesi</th><th>Total Transaksi Sesi</th><th>Persentase Terjual</th><th>Download</th></tr>
                </thead>
                <tbody>
                  <tr>
                    <td class="fw-bold">Sesi Mobil Penumpang Jakarta - Batch 15</td>
                    <td>12 Jun 2026</td>
                    <td class="fw-bold">Rp 985.000.000</td>
                    <td>93.3%</td>
                    <td><button class="btn btn-sm btn-outline">📥 PDF</button> <button class="btn btn-sm btn-outline">📊 Excel</button></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        `;
      } else if (p.id === 'ad20') { // Laporan Keuangan
        specificContent = `
          <div class="card">
            <div class="kpi-grid">
              <div class="kpi-card success"><div class="kpi-label">Pendapatan Komisi Bersih</div><div class="kpi-value">Rp 127.500.000</div></div>
              <div class="kpi-card"><div class="kpi-label">Piutang Pelunasan</div><div class="kpi-value">Rp 166.855.000</div></div>
            </div>
            <div class="table-wrapper">
              <table>
                <thead>
                  <tr><th>Bulan</th><th>Pendapatan Kotor</th><th>Komisi Balai Lelang</th><th>PPN Disetor</th><th>Pencairan Provider</th></tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Juni 2026</td>
                    <td class="fw-bold">Rp 985.000.000</td>
                    <td class="text-success fw-bold">Rp 14.775.000</td>
                    <td>Rp 10.835.000</td>
                    <td>Rp 820.000.000</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        `;
      } else if (p.id === 'ad21') { // Analitik BI
        specificContent = `
          <!-- KPI Cards -->
          <div class="kpi-grid" style="margin-bottom: 2rem;">
            <div class="kpi-card" style="border-left-color: var(--wf-primary);">
              <div class="kpi-label">Nilai GMV Terjual (Bulan Ini)</div>
              <div class="kpi-value">Rp 12.450.000.000</div>
              <div class="kpi-trend up">↑ 14.2% dibanding Mei</div>
            </div>
            <div class="kpi-card gold">
              <div class="kpi-label">Rata-Rata Markup Harga (Hammer Price)</div>
              <div class="kpi-value">+18.5%</div>
              <div class="kpi-trend up">↑ Dari harga dasar pembukaan</div>
            </div>
            <div class="kpi-card success">
              <div class="kpi-label">Conversion Rate Lot Terjual</div>
              <div class="kpi-value">89.4%</div>
              <div class="kpi-trend">Target bulanan: 85%</div>
            </div>
            <div class="kpi-card" style="border-left-color: var(--wf-info);">
              <div class="kpi-label">Total Bidder Aktif Bidding</div>
              <div class="kpi-value">3.240 User</div>
              <div class="kpi-trend up">↑ 22% Pertumbuhan bulanan</div>
            </div>
          </div>

          <div class="grid-2-1" style="grid-template-columns: 1.5fr 1fr; gap: 2rem;">
            <!-- Line Chart Card -->
            <div class="card">
              <div class="card-header">
                <span>📈 Tren Nilai Penjualan Mingguan (GMV)</span>
                <span class="badge badge-success">Juni 2026</span>
              </div>
              <div style="position: relative; padding: 1rem 0;">
                <svg viewBox="0 0 500 200" style="width: 100%; height: auto; display: block; overflow: visible;">
                  <defs>
                    <linearGradient id="chart-grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stop-color="var(--wf-accent)" stop-opacity="0.3"/>
                      <stop offset="100%" stop-color="var(--wf-accent)" stop-opacity="0"/>
                    </linearGradient>
                  </defs>
                  
                  <!-- Grid Lines -->
                  <line x1="40" y1="30" x2="480" y2="30" stroke="#f1f2f6" stroke-width="1" />
                  <line x1="40" y1="80" x2="480" y2="80" stroke="#f1f2f6" stroke-width="1" />
                  <line x1="40" y1="130" x2="480" y2="130" stroke="#f1f2f6" stroke-width="1" />
                  <line x1="40" y1="170" x2="480" y2="170" stroke="#dcdde1" stroke-width="1" />
                  
                  <!-- Axes Labels -->
                  <text x="15" y="35" fill="var(--wf-text-muted)" font-size="9" text-anchor="middle">5M</text>
                  <text x="15" y="85" fill="var(--wf-text-muted)" font-size="9" text-anchor="middle">3M</text>
                  <text x="15" y="135" fill="var(--wf-text-muted)" font-size="9" text-anchor="middle">1M</text>
                  
                  <!-- X Labels -->
                  <text x="70" y="190" fill="var(--wf-text-muted)" font-size="9" text-anchor="middle">Minggu 1</text>
                  <text x="190" y="190" fill="var(--wf-text-muted)" font-size="9" text-anchor="middle">Minggu 2</text>
                  <text x="310" y="190" fill="var(--wf-text-muted)" font-size="9" text-anchor="middle">Minggu 3</text>
                  <text x="430" y="190" fill="var(--wf-text-muted)" font-size="9" text-anchor="middle">Minggu 4</text>
                  
                  <!-- Area path under curve -->
                  <path d="M 70,170 C 120,130 140,90 190,95 C 240,100 260,35 310,40 C 360,45 380,85 430,60 L 430,170 Z" fill="url(#chart-grad)" />
                  
                  <!-- Line Chart curve -->
                  <path d="M 70,170 C 120,130 140,90 190,95 C 240,100 260,35 310,40 C 360,45 380,85 430,60" fill="none" stroke="var(--wf-accent)" stroke-width="3" stroke-linecap="round" />
                  
                  <!-- Bullet dots -->
                  <circle cx="70" cy="170" r="4" fill="#fff" stroke="var(--wf-accent)" stroke-width="2" />
                  <circle cx="190" cy="95" r="4" fill="#fff" stroke="var(--wf-accent)" stroke-width="2" />
                  <circle cx="310" cy="40" r="5" fill="#fff" stroke="var(--wf-gold)" stroke-width="3" />
                  <circle cx="430" cy="60" r="4" fill="#fff" stroke="var(--wf-accent)" stroke-width="2" />
                  
                  <!-- Tooltip Marker label -->
                  <rect x="270" y="5" width="80" height="20" rx="3" fill="var(--wf-primary)" />
                  <text x="310" y="17" fill="#fff" font-size="9" font-weight="bold" text-anchor="middle">Rp 4.2 Miliar</text>
                </svg>
              </div>
            </div>
            
            <!-- Pie/Donut Chart Card -->
            <div class="card">
              <div class="card-header">🛒 Pembagian Nilai Aset Terjual</div>
              <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 0.5rem 0;">
                <svg viewBox="0 0 120 120" style="width: 130px; height: 130px; display: block; transform: rotate(-90deg);">
                  <!-- Donut Background -->
                  <circle cx="60" cy="60" r="45" fill="none" stroke="#f1f2f6" stroke-width="18" />
                  
                  <!-- Mobil: 55% -->
                  <circle cx="60" cy="60" r="45" fill="none" stroke="var(--wf-primary)" stroke-width="18" stroke-dasharray="155.5 127.2" stroke-dashoffset="0" />
                  
                  <!-- Motor: 30% -->
                  <circle cx="60" cy="60" r="45" fill="none" stroke="var(--wf-gold)" stroke-width="18" stroke-dasharray="84.8 197.9" stroke-dashoffset="-155.5" />
                  
                  <!-- Alat Berat: 15% -->
                  <circle cx="60" cy="60" r="45" fill="none" stroke="var(--wf-success)" stroke-width="18" stroke-dasharray="42.4 240.3" stroke-dashoffset="-240.3" />
                </svg>
                
                <div style="margin-top: 1.5rem; width: 100%; display: flex; flex-direction: column; gap: 0.5rem; font-size: 0.82rem;">
                  <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span>🔵 <strong>Mobil Penumpang</strong> (55%)</span>
                    <span class="fw-bold">Rp 6.847.500.000</span>
                  </div>
                  <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span>🟡 <strong>Sepeda Motor</strong> (30%)</span>
                    <span class="fw-bold">Rp 3.735.000.000</span>
                  </div>
                  <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span>🟢 <strong>Alat Berat</strong> (15%)</span>
                    <span class="fw-bold">Rp 1.867.500.000</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        `;
      } else if (p.id === 'ad23') { // Campaign Management
        specificContent = `
          <div class="card" style="max-width:800px; margin:0 auto;">
            <div class="card-header">Kirim Pesan Broadcast (Email & WhatsApp)</div>
            <div class="form-group">
              <label class="form-label">Penerima Kampanye</label>
              <select class="form-select">
                <option>Semua Bidder Terverifikasi (3,400+ Akun)</option>
                <option>Bidder yang memfavoritkan Kategori Mobil</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Judul Pesan Broadcast</label>
              <input type="text" class="form-input" value="Sesi Lelang Mobil Jakarta Batch 15 Segera Dibuka!">
            </div>
            <div class="form-group">
              <label class="form-label">Isi Pesan</label>
              <textarea class="form-textarea" rows="4">Halo Bidder! Jangan lewatkan kesempatan memenangkan Toyota Avanza 2022 di lelang mendatang kami hari ini pukul 10:00 WIB.</textarea>
            </div>
            <button class="btn btn-primary">Kirim Broadcast Sekarang</button>
          </div>
        `;
      } else if (p.id === 'ad25') { // Settings
        specificContent = `
          <div class="card" style="max-width:800px; margin:0 auto;">
            <div class="card-header">Konfigurasi Aturan Bisnis Platform</div>
            <div class="grid-2">
              <div class="form-group">
                <label class="form-label">Komisi Default Balai Lelang (%)</label>
                <input type="number" class="form-input" value="3.0">
              </div>
              <div class="form-group">
                <label class="form-label">Pajak Pertambahan Nilai (PPN %)</label>
                <input type="number" class="form-input" value="1.1">
              </div>
            </div>
            <div class="grid-2">
              <div class="form-group">
                <label class="form-label">Deposit NIPL Jaminan Mobil (Rp)</label>
                <input type="text" class="form-input" value="5.000.000">
              </div>
              <div class="form-group">
                <label class="form-label">Deposit NIPL Jaminan Motor (Rp)</label>
                <input type="text" class="form-input" value="1.000.000">
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Batas Waktu Pelunasan Invoice (Hari Kerja)</label>
              <input type="number" class="form-input" value="5">
            </div>
            
            <div class="separator" style="margin: 1.5rem 0;"></div>
            
            <div class="form-group">
              <label class="form-label" style="font-weight:bold; font-size:1.05rem;">⚙️ Integrasi Sistem & e-KYC</label>
              <p class="fs-sm text-muted mb-2">Tentukan bagaimana platform memproses verifikasi e-KYC untuk akun pendaftar baru.</p>
              <div style="display:flex; flex-direction:column; gap:0.75rem; margin-top:0.5rem;">
                <label style="display:flex; align-items:flex-start; gap:0.5rem; cursor:pointer;">
                  <input type="radio" name="ekyc_mode" value="manual" id="settings-ekyc-manual" style="margin-top:0.25rem;">
                  <div>
                    <strong>Verifikasi Manual (Queue Review)</strong>
                    <div class="fs-sm text-muted">Staf admin harus mencocokkan dokumen KTP & selfie secara manual di antrean KYC sebelum menyetujui akun.</div>
                  </div>
                </label>
                <label style="display:flex; align-items:flex-start; gap:0.5rem; cursor:pointer;">
                  <input type="radio" name="ekyc_mode" value="otomatis" id="settings-ekyc-otomatis" style="margin-top:0.25rem;">
                  <div>
                    <strong>Verifikasi Otomatis (Instant e-KYC SDK)</strong>
                    <div class="fs-sm text-muted">Sistem terintegrasi dengan pihak ketiga (Privy/Verihubs) untuk mengecek liveness & Dukcapil instan (3 detik).</div>
                  </div>
                </label>
              </div>
            </div>
            
            <button class="btn btn-primary" id="btn-save-settings">Simpan Aturan & Konfigurasi</button>
          </div>
          
          <script>
            document.addEventListener('DOMContentLoaded', function() {
              const ekycManual = document.getElementById('settings-ekyc-manual');
              const ekycOtomatis = document.getElementById('settings-ekyc-otomatis');
              const btnSave = document.getElementById('btn-save-settings');
              
              // Load active setting
              const currentMode = localStorage.getItem('ekyc_mode') || 'manual';
              if (currentMode === 'otomatis') {
                ekycOtomatis.checked = true;
              } else {
                ekycManual.checked = true;
              }
              
              btnSave.addEventListener('click', function() {
                const selectedMode = ekycManual.checked ? 'manual' : 'otomatis';
                localStorage.setItem('ekyc_mode', selectedMode);
                alert('Pengaturan berhasil disimpan! Mode Verifikasi e-KYC diubah menjadi: ' + selectedMode.toUpperCase());
              });
            });
          </script>
        `;
      } else if (p.id === 'ad26') { // Audit Trail
        specificContent = `
          <div class="card">
            <div class="table-wrapper">
              <table>
                <thead>
                  <tr><th>Timestamp</th><th>Pengguna Staf</th><th>Aksi Log</th><th>IP Address</th><th>Detail Aksi</th></tr>
                </thead>
                <tbody>
                  <tr>
                    <td>10 Jun 2026, 21:50:12</td>
                    <td class="fw-bold">Superadmin Utama</td>
                    <td>Verifikasi Pelunasan Tagihan</td>
                    <td>192.168.1.45</td>
                    <td>Menyetujui Invoice #INV-1045 senilai Rp 166.855.000</td>
                  </tr>
                  <tr>
                    <td>10 Jun 2026, 21:48:45</td>
                    <td class="fw-bold">Budi Operator</td>
                    <td>Ketok Palu Sesi (Hammer Price)</td>
                    <td>192.168.1.12</td>
                    <td>Menyetujui Lot #1045 dengan harga final Rp 167.500.000</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        `;
      }
    }

    // Default fallback list/daftar/riwayat logic if not handled above
    if (!specificContent) {
      if (p.link.includes('list') || p.link.includes('daftar') || p.link.includes('riwayat')) {
        specificContent = `
        <div class="card">
          <div class="toolbar">
            <div class="toolbar-left">
              <input type="text" class="form-input" placeholder="Cari..." style="width:250px">
              <button class="btn btn-outline">Filter</button>
            </div>
            <div class="toolbar-right">
              <button class="btn btn-primary">Export Excel</button>
            </div>
          </div>
          <div class="table-wrapper">
            <table>
              <thead>
                <tr><th>ID</th><th>Deskripsi Transaksi / Aset</th><th>Status</th><th>Tanggal</th><th>Aksi</th></tr>
              </thead>
              <tbody>
                ${[1, 2, 3, 4, 5].map(i => `
                  <tr>
                    <td>#${1000 + i}</td>
                    <td class="fw-bold">Contoh baris sampel ke-${i} untuk halaman ${p.name}</td>
                    <td><span class="badge badge-success">Selesai</span></td>
                    <td>10 Jun 2026</td>
                    <td><button class="btn btn-sm btn-outline">Detail</button></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          <div class="pagination">
            <button class="page-btn">Prev</button>
            <button class="page-btn active">1</button>
            <button class="page-btn">2</button>
            <button class="page-btn">Next</button>
          </div>
        </div>`;
      } else {
        // Form & Detail page fallback
        specificContent = `
        <div class="card">
          <div class="card-header">Formulir / Rincian Dokumen ${p.name}</div>
          <div class="alert alert-info">
            <div>Silakan isi data formulir di bawah ini dengan lengkap untuk memproses data.</div>
          </div>
          <div class="form-group">
            <label class="form-label">Nama Aset / Field Utama <span class="required">*</span></label>
            <input type="text" class="form-input" placeholder="Masukkan input di sini">
          </div>
          <div class="form-group">
            <label class="form-label">Deskripsi Keterangan</label>
            <textarea class="form-textarea" rows="3" placeholder="Tuliskan catatan..."></textarea>
          </div>
          <div style="display:flex; justify-content:flex-end; gap:0.5rem; margin-top:1.5rem;">
            <button class="btn btn-outline">Batal</button>
            <button class="btn btn-primary">Simpan Perubahan</button>
          </div>
        </div>`;
      }
    }

    const content = `
      ${sidebar(area, p.id, menuItems)}
      <div class="main-content">
        ${topbar('Menu &bull; <strong>' + p.name + '</strong>', initial)}
        <div class="page-content">
          <h1 class="page-title">${p.name}</h1>
          <p class="page-subtitle">Panel Area ${area} &bull; Prototipe Wireframe</p>
          ${specificContent}
        </div>
      </div>
    `;
    writePage(area, p.link, p.name, htmlBoilerplate(p.name, 'layout-panel', content, area));
  });
}

// Execute
generatePublicPages();
generateAuthPages();
generatePanelPages('bidder', 'B', bidderMenu, 'BS');
generatePanelPages('provider', 'S', providerMenu, 'AS');
generatePanelPages('admin', 'AD', adminMenu, 'AD');

console.log('Semua 66 halaman HTML wireframe berhasil digenerate dengan data mockup lengkap!');
