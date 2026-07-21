# 📋 Log Perubahan & Perbaikan Terlaksana — BIDKU

Dokumen ini mencatat daftar perubahan yang telah berhasil dieksekusi secara lokal di repositori dan siap di-deploy ke server production setelah seluruh proses pengerjaan selesai.

## Alur Kerja Pengerjaan:
`User Request ➡️ AI Eksekusi & Uji ➡️ AI Update Log ini ➡️ User Request Berikutnya ➡️ ... ➡️ Deploy ke Production`

---

## 🛠️ Daftar Perubahan & Perbaikan

### 1. WhatsApp Reset Password & Penyelarasan Halaman Registrasi
* **Status:**  Selesai & Teruji
* **File yang Diubah:**
  * [api/src/modules/auth/auth.service.ts](file:///c:/Users/han/Herd/indo-lelang/apps/api/src/modules/auth/auth.service.ts)
  * [landing-web/src/app/register/page.tsx](file:///c:/Users/han/Herd/indo-lelang/apps/landing-web/src/app/register/page.tsx)
* **Deskripsi Perubahan:**
  * Backend API mendeteksi nomor handphone terdaftar dan mengirimkan link reset password secara simultan ke email (SMTP) dan WhatsApp (Fonnte).
  * Tagline pendaftaran diubah menjadi: *"Daftar akun dan dapatkan fitur lelang modern dari BIDKU"*.
  * Menambahkan petunjuk di bawah kolom WA pendaftaran: *"Email dan No WA digunakan untuk reset Lupa Password."*
  * Label kolom isian form pendaftaran disederhanakan menjadi: *Nama sesuai KTP*, *Email*, *No WA*, *Password*, dan *Konfirmasi Password*.

### 2. Perbaikan Deep Link Reset Password di PWA (HP/Mobile)
* **Status:**  Selesai & Teruji
* **File yang Diubah:**
  * [landing-web/src/components/pwa/PWASplashScreen.tsx](file:///c:/Users/han/Herd/indo-lelang/apps/landing-web/src/components/pwa/PWASplashScreen.tsx)
  * [landing-web/src/app/page.tsx](file:///c:/Users/han/Herd/indo-lelang/apps/landing-web/src/app/page.tsx)
* **Deskripsi Perubahan:**
  * Memperbaiki *race condition* redirection splash screen PWA di HP. Redirect otomatis ke halaman login sekarang hanya dipicu jika pengguna berada di beranda root (`/`). Membuka link reset password (deep link) tidak lagi dialihkan ke login secara tidak sengaja.

### 3. Keamanan Kuota NIPL & Kebocoran Transaksi Akun Baru
* **Status:**  Selesai & Teruji
* **File yang Diubah:**
  * [api/src/modules/deposits/deposits.controller.ts](file:///c:/Users/han/Herd/indo-lelang/apps/api/src/modules/deposits/deposits.controller.ts)
  * [api/src/modules/documents/documents.controller.ts](file:///c:/Users/han/Herd/indo-lelang/apps/api/src/modules/documents/documents.controller.ts)
  * [api/src/modules/deposits/deposits.test.ts](file:///c:/Users/han/Herd/indo-lelang/apps/api/src/modules/deposits/deposits.test.ts)
  * [api/src/modules/documents/documents.test.ts](file:///c:/Users/han/Herd/indo-lelang/apps/api/src/modules/documents/documents.test.ts)
* **Deskripsi Perubahan:**
  * Membatasi endpoint API `/deposits` dan `/invoices` agar memaksa pengguna non-staf (role `user` dan `bidder`) hanya bisa melihat transaksinya sendiri.
  * Memperbaiki bug di mana akun baru yang baru didaftarkan (role `user`) secara tidak sengaja memperoleh daftar transaksi simulasi user lain sehingga memicu tampilan "NIPL Unlimited" palsu di PWA.
  * Memperbaiki urutan pembersihan database di unit test modul deposit & dokumen agar tidak crash akibat constraint *foreign key*.

### 4. Responsivitas & Penyelarasan Form Verifikasi KTP (Pengganti eKYC)
* **Status:** Selesai & Teruji
* **File yang Diubah:**
  * [landing-web/src/app/ekyc/upload/page.tsx](file:///c:/Users/han/Herd/indo-lelang/apps/landing-web/src/app/ekyc/upload/page.tsx)
  * [landing-web/src/app/ekyc/status/page.tsx](file:///c:/Users/han/Herd/indo-lelang/apps/landing-web/src/app/ekyc/status/page.tsx)
  * [landing-web/src/app/bidder/dashboard/page.tsx](file:///c:/Users/han/Herd/indo-lelang/apps/landing-web/src/app/bidder/dashboard/page.tsx)
  * [landing-web/src/app/bidder/deposit/page.tsx](file:///c:/Users/han/Herd/indo-lelang/apps/landing-web/src/app/bidder/deposit/page.tsx)
  * [landing-web/src/app/bidder/profile/page.tsx](file:///c:/Users/han/Herd/indo-lelang/apps/landing-web/src/app/bidder/profile/page.tsx)
* **Deskripsi Perubahan:**
  * Menyelaraskan seluruh isian form agar seragam di mode PWA (Mobile) dan Desktop. Seluruh kolom isian (NIK, Alamat Lengkap, Pekerjaan, Bank, No Rekening, Konfirmasi No Rekening, A/N Rekening, Unggah Foto KTP, dan Unggah/Ambil Foto Selfie via Kamera) dipertahankan sepenuhnya.
  * Meningkatkan responsivitas tampilan form pada layar lebar (Desktop). Lebar container kartu form verifikasi ditingkatkan (`md:max-w-[720px]`). Kolom isian upload Foto KTP dan Foto Selfie kini disusun berdampingan secara horizontal (2 kolom) pada tampilan desktop, sehingga tidak memanjang ke bawah.
  * Mengubah seluruh istilah "eKYC" atau "KYC" pada halaman verifikasi, status verifikasi, dashboard, info deposit, dan halaman profil menjadi **"Verifikasi KTP"** atau **"KTP"** agar konsisten di seluruh platform.

### 5. Verifikasi Provider, Pembatasan Titip Jual, Snapshot Transaksi, & Checkbox Persetujuan Profil
* **Status:** Selesai & Teruji
* **File yang Diubah:**
  * **Backend API (`apps/api`):**
    * [api/prisma/schema.prisma](file:///c:/Users/han/Herd/indo-lelang/apps/api/prisma/schema.prisma) (Menambahkan model `transaction_profiles`)
    * [api/prisma/migrations/20260720020000_add_transaction_profiles/migration.sql](file:///c:/Users/han/Herd/indo-lelang/apps/api/prisma/migrations/20260720020000_add_transaction_profiles/migration.sql) (Migrasi SQL untuk produksi)
    * [api/src/modules/providers/providers.schema.ts](file:///c:/Users/han/Herd/indo-lelang/apps/api/src/modules/providers/providers.schema.ts) (Menambahkan NIK dan merelaksasi NPWP/Nama Perusahaan)
    * [api/src/modules/providers/providers.service.ts](file:///c:/Users/han/Herd/indo-lelang/apps/api/src/modules/providers/providers.service.ts) (Menerima NIK & memproses data opsional)
    * [api/src/modules/users/users.service.ts](file:///c:/Users/han/Herd/indo-lelang/apps/api/src/modules/users/users.service.ts) (Mensinkronisasi update data user PIC ke tabel providers)
    * [api/src/modules/assets/assets.controller.ts](file:///c:/Users/han/Herd/indo-lelang/apps/api/src/modules/assets/assets.controller.ts) (Menolak pengajuan titip jual / asset creation jika status provider !== `'aktif'`)
    * [api/src/modules/lots/bidding.service.ts](file:///c:/Users/han/Herd/indo-lelang/apps/api/src/modules/lots/bidding.service.ts) (Menyimpan snapshot data bidder pemenang saat lot laku)
    * [api/src/modules/payments/payments.service.ts](file:///c:/Users/han/Herd/indo-lelang/apps/api/src/modules/payments/payments.service.ts) (Menyimpan snapshot data provider saat settlement dibuat, serta menyajikan snapshot data pada pencarian)
    * [api/src/modules/documents/documents.service.ts](file:///c:/Users/han/Herd/indo-lelang/apps/api/src/modules/documents/documents.service.ts) (Menerapkan snapshot data profil ke dokumen PDF Invoice, Surat Jalan, BAST, dan BAPL)
  * **Frontend Web (`apps/landing-web`):**
    * [landing-web/src/app/register/provider/page.tsx](file:///c:/Users/han/Herd/indo-lelang/apps/landing-web/src/app/register/provider/page.tsx) (Halaman verifikasi provider baru dengan form KTP + Selfie + Tipe Provider + NPWP Opsional + Kamera Selfie)
    * [landing-web/src/app/provider/status/page.tsx](file:///c:/Users/han/Herd/indo-lelang/apps/landing-web/src/app/provider/status/page.tsx) (Memperbaiki nama brand)
    * [landing-web/src/app/provider/ajukan-barang/page.tsx](file:///c:/Users/han/Herd/indo-lelang/apps/landing-web/src/app/provider/ajukan-barang/page.tsx) (Memeriksa verifikasi provider sebelum akses form titip jual)
    * [landing-web/src/app/bidder/profile/page.tsx](file:///c:/Users/han/Herd/indo-lelang/apps/landing-web/src/app/bidder/profile/page.tsx) (Menambahkan checkbox persetujuan syarat update data profil)
    * [landing-web/src/app/provider/profile/page.tsx](file:///c:/Users/han/Herd/indo-lelang/apps/landing-web/src/app/provider/profile/page.tsx) (Menambahkan checkbox persetujuan syarat update data profil)
* **Deskripsi Perubahan:**
  * **Verifikasi & Proteksi Provider:** Provider kini memiliki sistem verifikasi KTP dan Selfie kamera yang identik dengan bidder, ditambah dengan dropdown Tipe Provider (perorangan, perusahaan swasta, perusahaan negara) dan input NPWP (opsional). Halaman "Ajukan Titip Jual" di frontend dan endpoint API asset creation diblokir serta dialihkan dengan status `403 Forbidden` jika akun provider belum terverifikasi/aktif.
  * **Snapshot Transaksi (Immutable History):** Ditambahkan tabel database `transaction_profiles` yang otomatis mencatat snapshot identitas (nama, alamat, email, telepon, NIK, NPWP, bank, dll.) milik bidder (saat memenangkan lelang) dan provider (saat settlement dibuat). Dokumen PDF transaksi (Invoice, Surat Jalan, BAST, BAPL) yang diterbitkan setelah perubahan profil akan tetap menampilkan data snapshot pada waktu transaksi terjadi, menjamin data transaksi lama tidak berubah secara retroaktif.
  * **Checkbox Persetujuan:** Menambahkan klausul persetujuan wajib di halaman edit profil bidder dan provider: *"Perubahan data profil berlaku untuk transaksi berikutnya. Transaksi yang telah terjadi sebelumnya tidak akan berubah."* yang wajib dicentang sebelum dapat menyimpan perubahan data profil.

### 6. Waktu Pelunasan 3 Hari Kerja & Pengaturan Hari Libur Nasional
* **Status:** Selesai & Teruji
* **File yang Diubah:**
  * **Backend API (`apps/api`):**
    * [api/src/modules/lots/bidding.service.ts](file:///c:/Users/han/Herd/indo-lelang/apps/api/src/modules/lots/bidding.service.ts) (Menambahkan fungsi `calculateWorkingDaysDueDate` dan menghitung `due_date` invoice dinamis)
    * [api/src/modules/lots/bidding.test.ts](file:///c:/Users/han/Herd/indo-lelang/apps/api/src/modules/lots/bidding.test.ts) (Menambahkan unit test untuk validasi kalkulasi hari kerja dan tanggal libur)
  * **Frontend Admin Panel (`apps/admin-panel`):**
    * [admin-panel/src/app/settings/platform/page.tsx](file:///c:/Users/han/Herd/indo-lelang/apps/admin-panel/src/app/settings/platform/page.tsx) (Menambahkan kartu visual untuk "Hari Libur Nasional" dengan isian dinamis, tombol tambah/hapus baris tanggal, dan sinkronisasi API)
* **Deskripsi Perubahan:**
  * **Kalkulasi Hari Kerja:** Batas waktu pelunasan lelang (due date) kini dihitung sebagai 3 hari kerja sejak lot terjual. Hari Sabtu, Minggu, dan hari libur nasional tidak dihitung sebagai hari kerja.
  * **Pengelolaan Hari Libur:** Menambahkan isian dinamis untuk Tanggal Hari Libur Nasional di menu Pengaturan Platform Admin Panel. Admin dapat dengan mudah menambah baris tanggal libur baru (*tambah tanggal*) dan menghapusnya (*hapus tanggal*) serta menyimpannya ke database platform settings.
  * **Unit Test Lulus:** Unit test untuk `calculateWorkingDaysDueDate` dan test suite `bidding.test.ts` lulus 100% dengan validasi skenario pelompatan akhir pekan dan libur nasional.

### 7. Integrasi Link Sosial Media Dinamis di Footer
* **Status:** Selesai & Teruji
* **File yang Diubah:**
  * **Backend API (`apps/api`):**
    * [api/src/modules/public/public.service.ts](file:///c:/Users/han/Herd/indo-lelang/apps/api/src/modules/public/public.service.ts) (Mengizinkan kunci yang berawalan `socmed_` diakses secara publik)
  * **Frontend Admin Panel (`apps/admin-panel`):**
    * [admin-panel/src/app/settings/platform/page.tsx](file:///c:/Users/han/Herd/indo-lelang/apps/admin-panel/src/app/settings/platform/page.tsx) (Menambahkan kartu visual "Link Sosial Media" berisi input teks untuk link Instagram, Facebook, TikTok, YouTube, dan Twitter)
  * **Frontend Web (`apps/landing-web`):**
    * [landing-web/src/components/layout/Footer.tsx](file:///c:/Users/han/Herd/indo-lelang/apps/landing-web/src/components/layout/Footer.tsx) (Mengambil link sosial media secara dinamis dari API public settings dan merender icon interaktif yang responsif di footer)
  * **Tampilan Kaki (Footer) Website:** Link sosial media yang aktif (tidak kosong) akan ditampilkan di kolom "Brand & Hubungi Kami" pada bagian bawah (footer) website dengan style modern dan efek hover warna ikon masing-masing platform.

### 8. Penyaringan Pengguna Terhapus (Soft-Deleted) pada Daftar Bidder & Provider
* **Status:** Selesai & Teruji
* **File yang Diubah:**
  * **Backend API (`apps/api`):**
    * [api/src/modules/bidders/bidders.service.ts](file:///c:/Users/han/Herd/indo-lelang/apps/api/src/modules/bidders/bidders.service.ts) (Menambahkan filter `deleted_at: null` pada query `getBidders`)
    * [api/src/modules/providers/providers.service.ts](file:///c:/Users/han/Herd/indo-lelang/apps/api/src/modules/providers/providers.service.ts) (Menambahkan filter `deleted_at: null` pada query `getProviders`)
    * [api/src/modules/assets/assets.test.ts](file:///c:/Users/han/Herd/indo-lelang/apps/api/src/modules/assets/assets.test.ts) (Penyelarasan user & status aktif provider pada pengujian integrasi aset)
  * **Solusi Perbaikan:** Menambahkan filter relasional `user: { deleted_at: null }` pada query pencarian dan pagination bidder (`getBidders`) serta provider (`getProviders`). Pengguna yang sudah dihapus kini langsung bersih dan hilang dari daftar admin panel secara real-time.

### 9. Penghapusan Card "Tindakan Mitra" di Beranda Provider
* **Status:** Selesai & Teruji
* **File yang Diubah:**
  * **Frontend Web (`apps/landing-web`):**
    * [landing-web/src/app/provider/dashboard/page.tsx](file:///c:/Users/han/Herd/indo-lelang/apps/landing-web/src/app/provider/dashboard/page.tsx) (Menghapus card "Tindakan Mitra" dan mengubah layout grid kolom samping menjadi satu kolom full-width)
* **Deskripsi Perubahan:**
  * **Penyederhanaan Dashboard:** Menghapus card "Tindakan Mitra" pada sisi kanan beranda provider.
  * **Layout Responsif Baru:** Mengubah layout utama dari 2-kolom (`grid-2-1`) menjadi satu kolom full-width yang rapi. Card "Inventori Aset Terdaftar" dan "Grafik Penjualan Bulanan" kini melebar secara proporsional mengisi ruang dashboard secara efisien.

### 10. Sinkronisasi & Filter Duplikasi Live Bids Log (Ruang Kontrol)
* **Status:** Selesai & Teruji
* **File yang Diubah:**
  * **Backend API (`apps/api`):**
    * [api/src/modules/lots/lots.service.ts](file:///c:/Users/han/Herd/indo-lelang/apps/api/src/modules/lots/lots.service.ts) (Menambahkan REST API method `getLotBids` untuk mengambil riwayat penawaran langsung dari database)
    * [api/src/modules/lots/lots.controller.ts](file:///c:/Users/han/Herd/indo-lelang/apps/api/src/modules/lots/lots.controller.ts) (Menambahkan handler endpoint `getLotBids`)
    * [api/src/modules/lots/lots.routes.ts](file:///c:/Users/han/Herd/indo-lelang/apps/api/src/modules/lots/lots.routes.ts) (Mendaftarkan rute `GET /lots/:id/bids`)
    * [api/src/lib/socket.ts](file:///c:/Users/han/Herd/indo-lelang/apps/api/src/lib/socket.ts) (Menambahkan data `created_at` timestamp dari database pada siaran WebSocket `bid:update`)
  * **Frontend Admin Panel (`apps/admin-panel`):**
    * [admin-panel/src/app/auction/control-room/page.tsx](file:///c:/Users/han/Herd/indo-lelang/apps/admin-panel/src/app/auction/control-room/page.tsx) (Mengambil riwayat penawaran dari database saat inisialisasi lot, menyaring tick countdown duplikat dari WebSocket agar tidak mengacaukan log, dan menggunakan `created_at` untuk formatting waktu bid)
  * **Frontend Web (`apps/landing-web`):**
    * [landing-web/src/app/bidder/bidding-room/page.tsx](file:///c:/Users/han/Herd/indo-lelang/apps/landing-web/src/app/bidder/bidding-room/page.tsx) (Melakukan inisialisasi riwayat penawaran dari database dan menyelaraskan penulisan waktu log menggunakan database timestamp `created_at`)
* **Deskripsi Perubahan:**
  * **Penyebab Masalah:** Backend memancarkan event `bid:update` setiap 1 detik sebagai tick countdown timer lelang. Sebelumnya di sisi Admin Panel, setiap kali event tersebut diterima, client langsung memasukkan data penawaran terbaru ke log tanpa memverifikasi apakah harga/penawarannya berbeda dari sebelumnya. Hal ini membuat log dipenuhi oleh data duplikat setiap detik, yang jika terjadi delay internet atau lag pada browser admin, akan membuat urutan penawaran terlihat berantakan dan tidak urut.
  * **Solusi Perbaikan:** 
    1. **Filter Duplikasi:** Menambahkan validasi di client-side agar log hanya bertambah jika harga bid penawaran yang diterima benar-benar berubah (harga naik).
    2. **Waktu Akurat:** WebSocket kini menyertakan field `created_at` dari database saat ada bid baru, yang digunakan client untuk merender waktu penawaran secara presisi (mengurangi perbedaan waktu delay jaringan).
    3. **Seeding Awal:** Saat lot pertama kali dibuka/diakses di ruang kontrol admin dan ruang lelang bidder, aplikasi akan menarik data riwayat bid dari API database (`/lots/:id/bids`) sehingga log tidak kosong saat page di-refresh.

### 11. Penayangan Informasi NIPL dan Nama Bidder di Ruang Kontrol Admin
* **Status:** Selesai & Teruji
* **File yang Diubah:**
  * **Backend API (`apps/api`):**
    * [api/src/lib/socket.ts](file:///c:/Users/han/Herd/indo-lelang/apps/api/src/lib/socket.ts) (Mengambil `full_name` dari database dan menyertakan `bidder_name` serta `nipl_code` di setiap pancaran/siaran WebSocket `bid:update` baik pada bid baru maupun tick countdown)
    * [api/src/modules/lots/lots.service.ts](file:///c:/Users/han/Herd/indo-lelang/apps/api/src/modules/lots/lots.service.ts) (Menyediakan relasi bidder `full_name` pada query `getLotBids` database untuk riwayat lelang awal, dan memetakan data `bidder_name` serta `nipl_code` pada mapping `getLots` untuk lot berstatus aktif)
  * **Frontend Admin Panel (`apps/admin-panel`):**
    * [admin-panel/src/app/auction/control-room/page.tsx](file:///c:/Users/han/Herd/indo-lelang/apps/admin-panel/src/app/auction/control-room/page.tsx) (Memperluas tipe `BidLog`, mendengarkan data `bidder_name` dan `nipl_code` dari WebSocket dan REST seed, serta merendernya pada Card Penawar Tertinggi dan daftar Live Penawaran/Bid Log)
* **Deskripsi Perubahan:**
  * **Informasi Penawar Lengkap:** Admin kini dapat memantau secara langsung nama asli Bidder (sesuai profil pendaftaran) beserta Nomor NIPL aktif mereka (berformat `NIPL-XXXXXXXX` berdasarkan ID User) di panel **Penawar Tertinggi** dan pada baris **Live Penawaran (Bids Log)**.
  * **Keamanan Masking Bidder:** Masking `Peserta #XXXX` tetap dipertahankan dan ditampilkan sebagai detail pendukung untuk mencocokkan identitas dengan transparansi operasional admin.

### 12. Pemulihan & Penyesuaian Hari Kerja Invoice Lelang 16 Juli 2026 (Production Fix)
* **Status:** Selesai & Teruji (Dijalankan langsung di database Production)
* **File yang Diubah:**
  * **Scripts Deployment (`scripts/`):**
    * [scripts/ssh-fix-invoices.js](file:///c:/Users/han/Herd/indo-lelang/scripts/ssh-fix-invoices.js) (Script pemulihan data produksi via SSH, dibersihkan otomatis setelah eksekusi sukses)
* **Deskripsi Perubahan:**
  * **Penyebab Masalah:** Lelang riil pada tanggal 16 Juli 2026 (Kamis) menghasilkan invoice pelunasan yang kedaluwarsa (expired) pada tanggal 19 Juli 2026 (Minggu) karena dibuat saat sistem pelunasan 3 hari kerja (mengecualikan Sabtu-Minggu) belum aktif di server produksi. Hal ini mengakibatkan tagihan menghilang dari keranjang bidder sebelum hari kerja ke-3 (Selasa, 21 Juli 2026).
  * **Solusi Perbaikan:**
    1. **Eksekusi Remote:** Kami menjalankan skrip database langsung di container `indolelang_api_prod` melalui koneksi SSH.
    2. **Pemulihan Status:** Sebanyak **13 invoice** yang sempat kedaluwarsa atau menggantung berhasil dikembalikan statusnya ke `'unpaid'` (aktif/belum lunas).
    3. **Perpanjangan Waktu Bayar:** Batas akhir pelunasan (`due_date`) diperpanjang hingga **21 Juli 2026 pukul 23:59:59 UTC**, menyesuaikan dengan batas 3 hari kerja riil terhitung sejak tanggal 16 Juli 2026.
    4. **Keamanan Data:** Sebanyak 7 invoice yang sudah berstatus `'paid'` (lunas) dilewati secara aman tanpa mengalami modifikasi data.

### 13. Implementasi Fitur Lelang Exclusive & Alur Persetujuan Dokumen Pernyataan Bermaterai
* **Status:** Selesai, Teruji & Berhasil Dikompilasi Produksi
* **File yang Diubah:**
  * **Database Schema (`apps/api/prisma/`):**
    * [schema.prisma](file:///c:/Users/han/Herd/indo-lelang/apps/api/prisma/schema.prisma) (Menambahkan kolom `is_exclusive`, `exclusive_provider_id`, `registration_lead_hours` pada tabel `auction_sessions`, serta membuat model `exclusive_session_registrations` dengan status `pending`/`approved`/`rejected`)
    * [migrations/20260721090000_add_exclusive_sessions/migration.sql](file:///c:/Users/han/Herd/indo-lelang/apps/api/prisma/migrations/20260721090000_add_exclusive_sessions/migration.sql) (File migrasi Prisma baru untuk meng-alter database)
  * **Shared DTO (`packages/shared-types/`):**
    * [dto.ts](file:///c:/Users/han/Herd/indo-lelang/packages/shared-types/src/dto.ts) (Menambahkan properti eksklusif ke dalam `AuctionSessionDTO`)
  * **Backend API (`apps/api/src/`):**
    * [sessions.schema.ts](file:///c:/Users/han/Herd/indo-lelang/apps/api/src/modules/sessions/sessions.schema.ts) (Validasi Zod untuk parameter lelang eksklusif)
    * [sessions.service.ts](file:///c:/Users/han/Herd/indo-lelang/apps/api/src/modules/sessions/sessions.service.ts) (Service query database untuk pendaftaran lelang, detail pendaftar, batas lead hours, dan approval/rejection)
    * [exclusive.controller.ts](file:///c:/Users/han/Herd/indo-lelang/apps/api/src/modules/sessions/exclusive.controller.ts) (Generator Surat Pernyataan format PDF Puppeteer, input upload berkas, status, dan peninjauan berkas pendaftar)
    * [sessions.routes.ts](file:///c:/Users/han/Herd/indo-lelang/apps/api/src/modules/sessions/sessions.routes.ts) (Rute endpoints baru untuk pendaftaran eksklusif dan review admin)
    * [bidding.service.ts](file:///c:/Users/han/Herd/indo-lelang/apps/api/src/modules/lots/bidding.service.ts) (Validasi bid: hanya mengizinkan bidder dengan status registrasi `'approved'` pada lelang eksklusif)
  * **Admin Panel (`apps/admin-panel/src/`):**
    * [new/page.tsx](file:///c:/Users/han/Herd/indo-lelang/apps/admin-panel/src/app/sessions/new/page.tsx) (Input checkbox Lelang Exclusive, dropdown provider aktif, dan lead hours di Langkah 1 wizard)
    * [page.tsx](file:///c:/Users/han/Herd/indo-lelang/apps/admin-panel/src/app/sessions/page.tsx) (Badge 'Exclusive' pada tabel sesi, tombol review 'Pendaftar', dan dialog modal persetujuan/penolakan berkas)
  * **Bidder Layout (`apps/landing-web/src/`):**
    * [BidderLayout.tsx](file:///c:/Users/han/Herd/indo-lelang/apps/landing-web/src/components/layout/BidderLayout.tsx) (Deteksi otomatis sesi eksklusif aktif untuk user berstatus eKYC approved, popup pendaftaran, unduh berkas dinamis, dan upload PDF)
* **Deskripsi Perubahan:**
  * **Admin Wizard:** Admin dapat mencentang "Lelang Exclusive" saat membuat sesi baru, memilih provider dari daftar yang aktif, dan menentukan tenggat registrasi (`N` jam sebelum lelang dimulai).
  * **Alur Bidder:** Bidder yang terverifikasi (eKYC approved) akan melihat dialog popup ajakan lelang eksklusif. Bidder dapat mengunduh berkas pernyataan (terisi otomatis menggunakan NIK, Nama, HP, Alamat, dan Provider), membubuhi tanda tangan basah/meterai, lalu mengunggahnya kembali. Status pendaftaran bidder akan berada di status `pending` untuk ditinjau admin.
  * **Persetujuan Admin:** Di daftar sesi, admin dapat mengklik tombol "Pendaftar" pada sesi eksklusif untuk menyetujui (`approve`) atau menolak (`reject` dengan menyertakan alasan penolakan).
  * **Proteksi Bidding:** Hanya bidder yang pendaftarannya berstatus `'approved'` yang diizinkan sistem backend untuk mengajukan bid pada lot-lot di sesi lelang eksklusif tersebut.

### 14. Integrasi WhatsApp Broadcast & Penargetan Bidder Terverifikasi (status: approved) di Menu Campaign
* **Status:** Selesai, Teruji & Berhasil Dikompilasi Produksi
* **File yang Diubah:**
  * **Backend API (`apps/api/src/`):**
    * [campaigns.service.ts](file:///c:/Users/han/Herd/indo-lelang/apps/api/src/modules/campaigns/campaigns.service.ts) (Mengintegrasikan pengiriman via WhatsApp Fonnte untuk para penerima berstatus 'approved')
* **Deskripsi Perubahan:**
  * **Penargetan:** Filter `status: 'approved'` dipertahankan agar broadcast hanya ditujukan ke bidder (atau role target terpilih) yang sudah aktif dan terverifikasi oleh platform.
  * **Saluran Pengiriman:** Broadcast dikirimkan ke dua saluran secara paralel: **Email (SMTP)** dan **WhatsApp (Fonnte API)**. Format pesan WhatsApp dikompilasi secara otomatis menyertakan Judul Broadcast dan nama lengkap penerima.

### 15. Penambahan Field WhatsApp & Validasi Kecocokan Kontak di Halaman Lupa Password
* **Status:** Selesai, Teruji & Berhasil Dikompilasi Produksi
* **File yang Diubah:**
  * **Backend API (`apps/api/src/`):**
    * [auth.schema.ts](file:///c:/Users/han/Herd/indo-lelang/apps/api/src/modules/auth/auth.schema.ts) (Menambahkan validasi Zod untuk properti `phone` di `forgotPasswordSchema`)
    * [auth.controller.ts](file:///c:/Users/han/Herd/indo-lelang/apps/api/src/modules/auth/auth.controller.ts) (Mengambil `phone` dari payload body dan mengirimkannya ke auth service)
    * [auth.service.ts](file:///c:/Users/han/Herd/indo-lelang/apps/api/src/modules/auth/auth.service.ts) (Menambahkan validasi kecocokan nomor WhatsApp terdaftar menggunakan perbandingan data ter-normalisasi)
    * [auth.test.ts](file:///c:/Users/han/Herd/indo-lelang/apps/api/src/modules/auth/auth.test.ts) (Menyesuaikan test suite forgot-password payload dengan parameter nomor ponsel)
  * **Public Web App (`apps/landing-web/src/`):**
    * [lupa-password/page.tsx](file:///c:/Users/han/Herd/indo-lelang/apps/landing-web/src/app/lupa-password/page.tsx) (Menambahkan input field Nomor WhatsApp Terdaftar, state, logic validator input, serta update pesan notifikasi sukses)
* **Deskripsi Perubahan:**
  * **Keamanan Form:** Pengguna yang ingin mereset password kini wajib menginputkan **Email Terdaftar** dan **Nomor WhatsApp Terdaftar**.
  * **Verifikasi Backend:** Di level backend, sistem akan mengecek kecocokan email dan nomor telepon. Untuk mencegah kebocoran informasi (*user enumeration*), jika terjadi ketidakcocokan data, API akan tetap mengembalikan respon sukses `200` namun tidak akan mengirimkan tautan reset.
  * **Saluran Pengiriman:** Tautan reset dikirimkan secara paralel ke **Email (SMTP)** dan **WhatsApp (Fonnte API)** setelah nomor HP dinyatakan cocok secara normalisasi (menyamakan format kode negara `62`).

### 16. Tampilan Foto Lot Lelang Live (Badge 'Lelang Sedang Berlangsung', Harga Dasar, dan Harga Penawaran Tinggi Flashing Lembut)
* **Status:** Selesai, Teruji & Berhasil Dikompilasi Produksi
* **File yang Diubah:**
  * **Backend API (`apps/api/src/`):**
    * [public.service.ts](file:///c:/Users/han/Herd/indo-lelang/apps/api/src/modules/public/public.service.ts) (Menghubungkan data live state `activeLots` ke kueri `getFeaturedLots` agar memuat properti `current_price` real-time)
  * **Public Web App (`apps/landing-web/src/`):**
    * [LotCard.tsx](file:///c:/Users/han/Herd/indo-lelang/apps/landing-web/src/components/lots/LotCard.tsx) (Memperbarui komponen kartu lot publik dengan Badge 'Lelang Sedang Berlangsung', overlay 'Harga Dasar', serta 'Penawaran Tinggi' dengan animasi *soft pulse / flashing lembut*)
    * [page.tsx](file:///c:/Users/han/Herd/indo-lelang/apps/landing-web/src/app/page.tsx) (Memperbarui pemetaan lot beranda dan tampilan overlay kartu lot live pada landing page)
* **Deskripsi Perubahan:**
  * **Badge Status Live:** Pada foto lot yang sedang dalam sesi lelang aktif (`isLive`), ditambahkan badge merah beranimasi pulsing `🔴 Lelang Sedang Berlangsung` di pojok kanan atas foto unit.
  * **Informasi Harga Ganda pada Foto:** Di atas bagian foto bawah, layout overlay diperbarui untuk menyajikan dua tingkat harga sekaligus saat lelang aktif:
    1. **Harga Dasar:** Ditampilkan di baris atas overlay box dengan format font tebal berlatar bersih.
    2. **Penawaran Tinggi:** Ditampilkan di baris bawah overlay box dengan indikator merah, teks cetak tebal, serta efek **flashing lembut (*soft pulse animation*)** yang menarik perhatian tanpa menyilaukan mata pengguna.

### 17. Penambahan Vertical Scroller pada Sidebar Desktop Panel Admin, Bidder, dan Provider
* **Status:** Selesai, Teruji & Berhasil Dikompilasi Produksi
* **File yang Diubah:**
  * **Web Admin Panel (`apps/admin-panel/`):**
    * [globals.css](file:///c:/Users/han/Herd/indo-lelang/apps/admin-panel/src/app/globals.css) (Mengaktifkan kembali visual scroller dan styling custom pada `.sidebar .sidebar-nav`)
    * [Sidebar.tsx](file:///c:/Users/han/Herd/indo-lelang/apps/admin-panel/src/components/layout/Sidebar.tsx) (Menambahkan properti `flexShrink: 0` pada header dan footer logout agar area menu nav fleksibel untuk di-scroll)
  * **Public & Bidder/Provider Web App (`apps/landing-web/`):**
    * [globals.css](file:///c:/Users/han/Herd/indo-lelang/apps/landing-web/src/app/globals.css) (Menambahkan class utilitas `.sidebar-scroller` khusus mode desktop)
    * [BidderLayout.tsx](file:///c:/Users/han/Herd/indo-lelang/apps/landing-web/src/components/layout/BidderLayout.tsx) (Mengaplikasikan `.sidebar-scroller` dan `overflow-y-auto` pada kontainer navigasi sidebar desktop Bidder)
    * [ProviderLayout.tsx](file:///c:/Users/han/Herd/indo-lelang/apps/landing-web/src/components/layout/ProviderLayout.tsx) (Mengaplikasikan `.sidebar-scroller` dan `overflow-y-auto` pada kontainer navigasi sidebar desktop Provider)
* **Deskripsi Perubahan:**
  * **Kompatibilitas Layar Laptop Lama/Kecil:** Sidebar pada ketiga panel (Admin, Bidder, Provider) kini dilengkapi dengan **scroller vertikal (*overflow-y-auto*)** yang halus dan terlihat jelas (*custom styled thin scrollbar*). Pengguna laptop dengan resolusi vertikal rendah (seperti 768px) kini dapat menggeser/mengisi menu navigasi ke atas dan ke bawah tanpa terpotong.

### 18. Integrasi Fitur Export Excel (.xlsx) di Admin Panel
* **Status:** Selesai, Teruji & Berhasil Dikompilasi Produksi
* **File yang Diubah & Dibuat:**
  * **Modul Export Utility:**
    * [excelExport.ts](file:///c:/Users/han/Herd/indo-lelang/apps/admin-panel/src/lib/excelExport.ts) (Helper pembentuk sheet dan otomatisasi penyesuaian lebar kolom `.xlsx`)
  * **Halaman Web Admin Panel (`apps/admin-panel/`):**
    * [users/bidder/page.tsx](file:///c:/Users/han/Herd/indo-lelang/apps/admin-panel/src/app/users/bidder/page.tsx) (Tombol Export XLSX Daftar Bidder)
    * [users/provider/page.tsx](file:///c:/Users/han/Herd/indo-lelang/apps/admin-panel/src/app/users/provider/page.tsx) (Tombol Export XLSX Daftar Mitra Provider)
    * [assets/page.tsx](file:///c:/Users/han/Herd/indo-lelang/apps/admin-panel/src/app/assets/page.tsx) (Tombol Export XLSX Katalog Barang)
    * [assets/approval/page.tsx](file:///c:/Users/han/Herd/indo-lelang/apps/admin-panel/src/app/assets/approval/page.tsx) (Tombol Export XLSX Daftar Approved Barang)
    * [auction/results/page.tsx](file:///c:/Users/han/Herd/indo-lelang/apps/admin-panel/src/app/auction/results/page.tsx) (Tombol Export XLSX Rekapitulasi Hasil Sesi Lelang)
    * [FinanceManager.tsx](file:///c:/Users/han/Herd/indo-lelang/apps/admin-panel/src/components/finance/FinanceManager.tsx) (Tombol Export XLSX Monitoring Deposit NIPL)
* **Deskripsi Perubahan:**
  * **Pilihan Export:** Tombol hijau khas Excel `Export XLSX` ditambahkan di header toolbar pada 6 menu berikut:
    1. **Daftar Bidder:** Ekspor rincian identitas bidder, email, telepon, NIK KTP, NIPL, bank, dan status verifikasi.
    2. **Daftar Provider:** Ekspor nama perusahaan, NPWP, skema fee komisi, penanggung jawab, dan data kontak.
    3. **Daftar Barang (Katalog):** Ekspor katalog unit, harga dasar, kategori, status barang, dan pembuat.
    4. **Daftar Approved:** Ekspor rincian unit yang telah lolos inspeksi/persetujuan admin dan siap dimasukkan ke lot.
    5. **Hasil Sesi:** Ekspor rekapitulasi penutupan lelang (unit terjual / unsold, hammer price, pemenang, dan status invoice).
    6. **Monitoring Deposit Jaminan NIPL:** Ekspor log transaksi Virtual Account deposit NIPL, nominal jaminan, waktu bayar, dan status refund/lunas.

### 19. Tambah Kontrol & Tombol Next Lot di Ruang Kontrol Lelang Admin
* **Status:** Selesai, Teruji & Berhasil Dikompilasi Produksi
* **File yang Diubah:**
  * [control-room/page.tsx](file:///c:/Users/han/Herd/indo-lelang/apps/admin-panel/src/app/auction/control-room/page.tsx) (Halaman Ruang Kontrol Lelang Live Web Admin)
* **Deskripsi Perubahan:**
  * **Setting Option:** Ditambahkan pemilih mode `⚙️ Lot Berikutnya Dilanjutkan Oleh:` dengan pilihan:
    * `👤 Admin (Manual)` (Default)
    * `🤖 Otomatis (System)`
  * **Tombol Next Lot (Sesuai Urutan No. Lot):**
    * Pada mode **Admin (Manual)**, admin mendapatkan tombol khusus **`Next Lot (Mulai Lot #X)`** yang secara otomatis mendeteksi unit pending selanjutnya dalam urutan `lot_number`.
    * **Integrasi Bidding Workspace:** Ditambahkan tombol **`Ketok Palu & Next Lot (#X)`** di workspace lot aktif untuk mempermudah admin menyelesaikan lot saat ini dan langsung mengaktifkan lot berikutnya tanpa berpindah-pindah menu.
    * **Empty State Handling:** Jika tidak ada lot aktif, ditampilkan tombol besar **`Mulai Next Lot (#X)`** yang langsung menunjuk ke lot pending selanjutnya.

### 20. Filter Popup Modul Hasil Lelang di Bidding Room (Bidder Web)
* **Status:** Selesai, Teruji & Berhasil Dikompilasi Produksi
* **File yang Diubah:**
  * [bidding-room/page.tsx](file:///c:/Users/han/Herd/indo-lelang/apps/landing-web/src/app/bidder/bidding-room/page.tsx) (Ruang Lelang Live Bidder Public/Landing Web)
* **Deskripsi Perubahan:**
  * **Selective Popup Notification:**
    * **Penonton / Passive Visitor:** Bidder yang hanya menonton lelang live dan **TIDAK** pernah mengirimkan bid pada lot tersebut **TIDAK LAGI** menerima popup modal *"Maaf Anda Belum Memenangkan Lot Ini"*. Tampilan ruang lelang langsung beralih ke lot berikutnya secara tenang.
    * **Bidder Aktif (Pengirim Bid):** Modal *"Maaf Anda Belum Memenangkan Lot Ini"* **HANYA** ditampilkan kepada bidder yang memang pernah mengajukan penawaran harga (*placed a bid*) pada lot tersebut tetapi kalah oleh harga penawaran bidder lain.
    * **Pemenang Lelang:** Bidder pemenang tetap menerima modal perayaan *"Selamat Anda Memenangkan Lot X!"* beserta tombol pembayaran pelunasan.

### 21. Field Tipe & Fitur "+ Tambahkan Option" pada Dropdown Barang (Admin & Provider)
* **Status:** Selesai, Teruji & Berhasil Dikompilasi Produksi
* **File yang Diubah:**
  * [assets/new/page.tsx](file:///c:/Users/han/Herd/indo-lelang/apps/admin-panel/src/app/assets/new/page.tsx) (Form Tambah Barang Baru Admin)
  * [assets/page.tsx](file:///c:/Users/han/Herd/indo-lelang/apps/admin-panel/src/app/assets/page.tsx) (Form Modal Tambah & Kelola Barang Admin)
  * [assets/[id]/page.tsx](file:///c:/Users/han/Herd/indo-lelang/apps/admin-panel/src/app/assets/[id]/page.tsx) (Form Detail & Edit Barang Admin)
  * [ajukan-barang/page.tsx](file:///c:/Users/han/Herd/indo-lelang/apps/landing-web/src/app/provider/ajukan-barang/page.tsx) (Form Ajukan Titip Jual Provider)
* **Deskripsi Perubahan:**
  * **Pemberian Nama Label "Model":** Mengubah label yang sebelumnya *"Model / Tipe"* atau *"Tipe/Model"* menjadi **"Model"**.
  * **Penambahan Field "Tipe" (Dropdown List):** Menambahkan field isian baru **"Tipe"** (dropdown list) yang diletakkan tepat setelah field **"Model"** pada form Tambah Barang Admin & Form Titip Jual Provider (tersimpan pada kolom `body_type`).
  * **Fitur "+ Tambahkan" pada Options Dropdown:**
    * Menyediakan opsi `+ Tambahkan [Field] Baru...` di dalam menu dropdown dan tombol `+ Tambahkan` di samping label untuk field **Merek**, **Model**, **Tipe**, dan **Warna**.
    * Admin maupun Provider dapat menambahkan pilihan kustom baru secara langsung tanpa perlu repot keluar dari form. Opsi baru otomatis terpilih dan tersimpan bersama formulir.

### 22. Format Otomatis Huruf Kapital (UPPERCASE) pada Merek, Model, dan Tipe Kendaraan
* **Status:** Selesai, Teruji & Berhasil Dikompilasi Produksi
* **File yang Diubah:**
  * [assets.service.ts](file:///c:/Users/han/Herd/indo-lelang/apps/api/src/modules/assets/assets.service.ts) (Backend API Service Asset)
  * [assets/new/page.tsx](file:///c:/Users/han/Herd/indo-lelang/apps/admin-panel/src/app/assets/new/page.tsx) (Admin Panel New Asset Page)
  * [assets/page.tsx](file:///c:/Users/han/Herd/indo-lelang/apps/admin-panel/src/app/assets/page.tsx) (Admin Panel Assets Management Page)
  * [ajukan-barang/page.tsx](file:///c:/Users/han/Herd/indo-lelang/apps/landing-web/src/app/provider/ajukan-barang/page.tsx) (Landing Web Provider Ajukan Barang Page)
* **Deskripsi Perubahan:**
  * **Sanitasi Server-Side (API):** Seluruh input `brand`, `model`, dan `body_type` (Tipe) secara otomatis diubah menjadi `UPPERCASE` saat pembuatan aset (`createAsset`), inspeksi (`submitInspection`), dan pembaruan (`updateAsset`).
  * **Formatting Client-Side (Frontend):** Pada form Admin dan Provider, pilihan dropdown serta opsi custom yang diinputkan langsung dikonversi menjadi huruf kapital (Contoh: `TOYOTA`, `AVANZA G 1.3 MT`, `SUV SPORT`) untuk konsistensi data di seluruh platform.

### 23. Popup Modal Pengumuman Pemenang Lot di Ruang Kontrol Lelang Admin (5 Detik Timer)
* **Status:** Selesai, Teruji & Berhasil Dikompilasi Produksi
* **File yang Diubah:**
  * [socket.ts](file:///c:/Users/han/Herd/indo-lelang/apps/api/src/lib/socket.ts) (WebSocket Event Payload `lot:closed`)
  * [bidding.service.ts](file:///c:/Users/han/Herd/indo-lelang/apps/api/src/modules/lots/bidding.service.ts) (Settlement Service)
  * [control-room/page.tsx](file:///c:/Users/han/Herd/indo-lelang/apps/admin-panel/src/app/auction/control-room/page.tsx) (Ruang Kontrol Lelang Live Admin)
* **Deskripsi Perubahan:**
  * **Rincian Data Pemenang:** Saat lot selesai dan dimenangkan oleh bidder (*Ketok Palu* / status `sold`), layar admin menampilkan popup modal interaktif berisi rincian:
    1. Header: **`Lot [no lot] ini dimenangkan oleh:`**
    2. **Nama Mobil / Unit**
    3. **Nama Bidder Pemenang**
    4. **No NIPL Bidder**
    5. **Harga Dasar** (Rupiah)
    6. **Harga Terbentuk** (Rupiah / Hammer Price)
  * **Auto-Dismiss 5 Detik & Countdown Bar:** Popup dilengkapi dengan animasi progress bar dan penghitung mundur 5 detik yang otomatis menutup modal secara mulus tanpa mengganggu alur kontrol sesi lelang berikutnya. Admin juga dapat menutup popup secara manual sewaktu-waktu.

### 24. Popup Modal Ucapan Terima Kasih Penutupan Sesi Lelang Live untuk Bidder Active (5 Detik Timer)
* **Status:** Selesai, Teruji & Berhasil Dikompilasi Produksi
* **File yang Diubah:**
  * [socket.ts](file:///c:/Users/han/Herd/indo-lelang/apps/api/src/lib/socket.ts) (Event WebSocket `lot:closed` & `session:ended`)
  * [bidding-room/page.tsx](file:///c:/Users/han/Herd/indo-lelang/apps/landing-web/src/app/bidder/bidding-room/page.tsx) (Ruang Lelang Live Bidder Web)
* **Deskripsi Perubahan:**
  * **Filter Peserta Aktif:** Popup modal ucapan terima kasih akhir sesi HANYA ditampilkan kepada peserta/bidder yang pernah melakukan minimal 1 kali bid selama sesi lelang berlangsung (`hasSessionBidded === true` / terdeteksi di memori/sessionStorage).
  * **Pesan yang Ditampilkan:**
    * *"Terimakasih atas partisipasinya dalam Lelang [Nama Sesi]."*
    * *"Selamat kepada peserta yang berhasil memenangkan lelang."*
    * *"Mohon maaf kepada peserta yang belum memenangkan lelang."*
    * *"Sampai bertemu kembali di lelang berikutnya."*
  * **Timer 5 Detik:** Popup otomatis muncul saat lot terakhir dalam sesi telah selesai / sesi dinyatakan berakhir (`session:ended` atau `is_last_lot === true`), dilengkapi animasi progress bar dan penghitung mundur 5 detik.










