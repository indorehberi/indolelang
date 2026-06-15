const fs = require('fs');
const path = require('path');

const targetFilePath = path.join(__dirname, '..', 'generate-html.js');
const ad27FilePath = path.join(__dirname, 'ad27_new.txt');

// Read files
let targetContent = fs.readFileSync(targetFilePath, 'utf8');
const ad27Content = fs.readFileSync(ad27FilePath, 'utf8').replace(/\r\n/g, '\n');

// Normalize line endings to LF
targetContent = targetContent.replace(/\r\n/g, '\n');

// 1. Inject Menu Item in adminMenu
const targetMenu = `  { title: 'Laporan & Pengaturan', items: [
    { id: 'ad21', icon: '📈', name: 'Dashboard Analitik', link: 'ad21-dashboard-analitik.html' },
    { id: 'ad23', icon: '📣', name: 'Campaign', link: 'ad23-campaign.html' },
    { id: 'ad25', icon: '⚙️', name: 'Pengaturan', link: 'ad25-pengaturan.html' },
    { id: 'ad26', icon: '🔒', name: 'Audit Trail', link: 'ad26-audit-trail.html' }
  ]}`;

const newMenu = `  { title: 'Laporan & Pengaturan', items: [
    { id: 'ad21', icon: '📈', name: 'Dashboard Analitik', link: 'ad21-dashboard-analitik.html' },
    { id: 'ad23', icon: '📣', name: 'Campaign', link: 'ad23-campaign.html' },
    { id: 'ad27', icon: '🏢', name: 'Manajemen Cabang', link: 'ad27-manajemen-cabang.html' },
    { id: 'ad25', icon: '⚙️', name: 'Pengaturan', link: 'ad25-pengaturan.html' },
    { id: 'ad26', icon: '🔒', name: 'Audit Trail', link: 'ad26-audit-trail.html' }
  ]}`;

if (targetContent.indexOf(targetMenu) !== -1) {
  targetContent = targetContent.replace(targetMenu, newMenu);
  console.log('1. Admin menu updated with ad27.');
} else {
  console.error('Error: Could not find target admin menu block!');
  process.exit(1);
}

// 2. Inject Page Register in area === 'admin'
const targetRegister = `  } else if (area === 'admin') {
    pages.push(
      { id: 'ad4b', name: 'Tambah Staf Baru', link: 'ad4b-tambah-staf.html' },
      { id: 'ad5', name: 'Detail Pengguna', link: 'ad5-detail-user.html' },
      { id: 'ad8', name: 'Detail Barang & Inspeksi', link: 'ad8-detail-barang.html' },
      { id: 'ad12', name: 'Buat / Edit Sesi Lelang', link: 'ad12-form-sesi.html' },
      { id: 'ad19', name: 'Laporan Sesi Lelang', link: 'ad19-laporan-sesi.html' },
      { id: 'ad20', name: 'Laporan Keuangan', link: 'ad20-laporan-keuangan.html' }
    );`;

const newRegister = `  } else if (area === 'admin') {
    pages.push(
      { id: 'ad4b', name: 'Tambah Staf Baru', link: 'ad4b-tambah-staf.html' },
      { id: 'ad5', name: 'Detail Pengguna', link: 'ad5-detail-user.html' },
      { id: 'ad8', name: 'Detail Barang & Inspeksi', link: 'ad8-detail-barang.html' },
      { id: 'ad12', name: 'Buat / Edit Sesi Lelang', link: 'ad12-form-sesi.html' },
      { id: 'ad19', name: 'Laporan Sesi Lelang', link: 'ad19-laporan-sesi.html' },
      { id: 'ad20', name: 'Laporan Keuangan', link: 'ad20-laporan-keuangan.html' },
      { id: 'ad27', name: 'Manajemen Cabang', link: 'ad27-manajemen-cabang.html' }
    );`;

if (targetContent.indexOf(targetRegister) !== -1) {
  targetContent = targetContent.replace(targetRegister, newRegister);
  console.log('2. Admin page push register updated with ad27.');
} else {
  console.error('Error: Could not find page push register block!');
  process.exit(1);
}

// 3. Inject ad27 template block after ad26
const ad26EndTag = `      } else if (p.id === 'ad26') { // Audit Trail
        specificContent = \`
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
        \`;
      }`;

const ad27Injection = `      } else if (p.id === 'ad26') { // Audit Trail
        specificContent = \`
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
        \`;
      } else if (p.id === 'ad27') { // Manajemen Cabang
        specificContent = \`
${ad27Content}
        \`;
      }`;

if (targetContent.indexOf(ad26EndTag) !== -1) {
  targetContent = targetContent.replace(ad26EndTag, ad27Injection);
  console.log('3. ad27 template content injected.');
} else {
  console.error('Error: Could not find ad26 template block ending!');
  process.exit(1);
}

// Write file back
fs.writeFileSync(targetFilePath, targetContent, 'utf8');
console.log('generate-html.js successfully updated with Manajemen Cabang (ad27)!');
