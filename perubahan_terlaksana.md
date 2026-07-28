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

### 25. Perbaikan Kolom No. Polisi, Penambahan Sesi Lelang, dan Export XLSX Laporan Keuangan Panel Admin
* **Status:** Selesai, Teruji & Berhasil Dikompilasi Produksi
* **File yang Diubah:**
  * **Penyajian Data No. Polisi:** Memperbaiki API backend untuk menyertakan `police_number` dan `year` dari tabel `assets`, sehingga kolom No. Polisi pada tabel Laporan Keuangan kini terisi dengan benar (contoh: `B 1234 ABC`).
  * **Penambahan Kolom Sesi Lelang:** Menambahkan kolom **Nama Sesi Lelang** (`session.title`) dan **Tanggal Sesi** (`session.scheduled_at`) untuk mempermudah audit rekapitulasi per sesi.
  * **Fitur Export XLSX:** Mengintegrasikan tombol **`📥 Export Excel`** yang mengunduh seluruh data Laporan Keuangan (lengkap dengan No. Lot, Nama Sesi, Tanggal Sesi, No. Polisi, Unit, GMV, Fee Admin, Fee Lelang, DPP, PPN, PPh 23, PMK 41, Pengeluaran PG, dan Net Settlement) ke format file `.xlsx`.

### 26. Tombol Refresh Halaman khusus PWA App Bidder
* **Status:** Selesai, Teruji & Berhasil Dikompilasi Produksi
* **File yang Diubah:**
  * [BidderLayout.tsx](file:///c:/Users/han/Herd/indo-lelang/apps/landing-web/src/components/layout/BidderLayout.tsx) (Frontend Layout Bidder Web)
* **Deskripsi Perubahan:**
  * Menambahkan tombol refresh (`refresh` icon) khusus untuk pengguna PWA standalone.
  * Tombol refresh ditampilkan di bilah Header PWA (ketika topbar aktif).
  * Menambahkan Floating Action Button (FAB) melayang di pojok kanan bawah (`fixed bottom-24 right-6`) dengan animasi bounce untuk mempermudah reload halaman pada viewports yang menyembunyikan topbar (seperti halaman Beranda).
  * Tombol ini dinonaktifkan / disembunyikan otomatis pada peramban web desktop standard dan browser mobile biasa karena sudah memiliki navigasi refresh bawaan.

### 27. Proteksi Kerusakan Tampilan Font / Harga (Font Scaling Accessibility Fix)
* **Status:** Selesai, Teruji & Berhasil Dikompilasi Produksi
* **File yang Diubah:**
  * [globals.css](file:///c:/Users/han/Herd/indo-lelang/apps/landing-web/src/app/globals.css) (CSS Global Frontend Web)
  * [LotCard.tsx](file:///c:/Users/han/Herd/indo-lelang/apps/landing-web/src/components/lots/LotCard.tsx) (Kartu Unit Katalog)
* **Deskripsi Perubahan:**
  * **Text Size Adjust:** Menambahkan properti CSS `-webkit-text-size-adjust: 100%` dan `text-size-adjust: 100%` pada selector `html, body` untuk memblokir pembesaran font otomatis akibat konfigurasi aksesibilitas font bawaan OS HP (Android/iOS).
  * **Stacked Price Layout:** Mengubah struktur tata letak "Harga Dasar" dan "Penawaran Tinggi" menjadi bertingkat secara vertikal (vertical stack) guna memperluas ruang horizontal.
  * **Pelebaran Kontainer:** Memperlebar batas overlay kartu lot dan memperkecil padding agar muat lebih banyak digit harga.
  * **Font Unit Viewport (`vw`):** Menggunakan formula responsif berbasis `viewport width` (contoh: `min(14px, 3.8vw)`) untuk menjamin teks harga mengecil secara proporsional dan tidak akan pernah meluber (overflow) ke kanan pada grid 2-kolom mobile PWA.

### 28. Fitur Fullscreen & Tombol Keluar di Ruang Kontrol Lelang Admin
* **Status:** Selesai, Teruji & Berhasil Dikompilasi Produksi
* **File yang Diubah:**
  * [control-room/page.tsx](file:///c:/Users/han/Herd/indo-lelang/apps/admin-panel/src/app/auction/control-room/page.tsx) (Ruang Kontrol Lelang Live Admin)
* **Deskripsi Perubahan:**
  * Mengintegrasikan HTML5 Fullscreen API pada panel ruang kontrol lelang.
  * Admin dapat menyembunyikan sidebar kiri dan topbar header untuk menampilkan visual sesi lelang secara penuh satu layar penuh.
  * Menambahkan tombol toggle "Full Screen" di toolbar atas, serta tombol melayang "Keluar Full Screen" di pojok kanan atas layar agar admin dapat kapan saja keluar dari mode layar penuh dengan mudah.

### 29. Penyesuaian Pengalihan Logout Otomatis Admin (Redirect Destination)
* **Status:** Selesai, Teruji & Berhasil Dikompilasi Produksi
* **File yang Diubah:**
  * [api.ts](file:///c:/Users/han/Herd/indo-lelang/apps/admin-panel/src/lib/api.ts) (Core API Client Admin Panel)
* **Deskripsi Perubahan:**
  * Memperbaiki tujuan pengalihan sesi saat admin log out secara otomatis akibat masa aktif habis (idle timeout).
  * URL redirect diubah dari `/admin/login` (yang memicu error 404/Not Found) menjadi `/login`. Skema Next.js `basePath: '/admin'` akan otomatis mengarahkan url tersebut ke internal login page yang benar.

### 30. Penyelarasan Layout Overlays Bell Timer & Canceled Lot di Bidder App
* **Status:** Selesai, Teruji & Berhasil Dikompilasi Produksi
* **File yang Diubah:**
  * [bidding-room/page.tsx](file:///c:/Users/han/Herd/indo-lelang/apps/landing-web/src/app/bidder/bidding-room/page.tsx) (Ruang Lelang Bidder)
* **Deskripsi Perubahan:**
  * Mengubah posisi penayangan overlay "Bell Countdown" (lelang lot berikutnya akan dimulai) dan overlay "Lot Dibatalkan" dari posisi absolut card (`absolute inset-0`) menjadi posisi layar penuh (`fixed inset-0 z-[9999] backdrop-blur-md`).
  * Hal ini memastikan modal overlay terpusat sempurna di tengah-tengah layar fisik perangkat pengguna (desktop, mobile, maupun PWA) dan tidak lagi terpotong ke bawah / menghilang di bawah lipatan layar saat pengguna melakukan scrolling.

### 31. Form Lupa Password Kondisional (Metode Email vs No. WA)
* **Status:** Selesai, Teruji & Berhasil Dikompilasi Produksi
* **File yang Diubah:**
  * **Backend API (`apps/api/src/`):**
    * [auth.schema.ts](file:///c:/Users/han/Herd/indo-lelang/apps/api/src/modules/auth/auth.schema.ts) (Validasi ZodforgotPasswordSchema)
    * [auth.service.ts](file:///c:/Users/han/Herd/indo-lelang/apps/api/src/modules/auth/auth.service.ts) (Logika lookup user dinamis berdasarkan jenis pengiriman)
  * **Public Web App (`apps/landing-web/src/`):**
    * [lupa-password/page.tsx](file:///c:/Users/han/Herd/indo-lelang/apps/landing-web/src/app/lupa-password/page.tsx) (Form Reset Password)
* **Deskripsi Perubahan:**
  * **Input Dinamis:** Form lupa password kini menampilkan pill toggle selector untuk memilih metode pengiriman link reset password (Email atau WhatsApp).
  * **Kondisional Wajib:** Jika Email dipilih, maka hanya input email yang tampil dan berstatus `required`. Jika WhatsApp dipilih, maka hanya input no ponsel yang tampil dan berstatus `required`.
  * **Zod Preprocess:** Menambahkan preprocessing di backend Zod schema untuk mendeteksi string kosong `""` dan mengonversinya menjadi `undefined`, mencegah error format validasi email saat mengirim link via WA.
  * **Look Up Condisional:** Pencarian user di backend disesuaikan secara dinamis: mencari berdasarkan email saja jika memilih opsi Email, atau mencari berdasarkan nomor ponsel saja jika memilih opsi WhatsApp.

### 32. Proteksi Validasi Penghapusan Pengguna (User Deletion Safeguards)
* **Status:** Selesai, Teruji & Berhasil Dikompilasi Produksi
* **File yang Diubah:**
  * **Backend API (`apps/api/src/`):**
    * [users.service.ts](file:///c:/Users/han/Herd/indo-lelang/apps/api/src/modules/users/users.service.ts) (Metode deleteUser)
    * [index.ts](file:///c:/Users/han/Herd/indo-lelang/packages/utils/src/index.ts) (Kamus Error Code)
* **Deskripsi Perubahan:**
  * Mencegah admin menghapus pengguna (Bidder atau Provider) jika masih memiliki transaksi aktif/menggantung:
    1. **Deposit Tertunda:** Memiliki deposit berstatus `pending_approval` (bukti transfer diunggah tapi belum divalidasi).
    2. **NIPL Aktif:** Memiliki kuota NIPL aktif (`status: 'active'`) yang belum dipakai bertransaksi dan belum di-refund.
    3. **Tagihan Belum Lunas:** Memiliki tagihan `invoices` yang belum dibayar (`unpaid`/`pending_approval`) dan belum kedaluwarsa.
    4. **Settlement Tertunda:** Provider memiliki settlement yang statusnya masih `pending` (belum ditransfer).
  - Mengembalikan respon error yang jelas serta kode error spesifik (`PENDING_DEPOSIT_APPROVAL`, `ACTIVE_NIPL_EXISTS`, `UNPAID_INVOICE_EXISTS`, `PENDING_SETTLEMENT_EXISTS`).

### 33. Tombol Aksi "Verifikasi Ulang" di Panel Admin (Bidders & Providers)
* **Status:** Selesai, Teruji & Berhasil Dikompilasi Produksi
* **File yang Diubah:**
  * **Backend API (`apps/api/src/`):**
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

### 25. Perbaikan Kolom No. Polisi, Penambahan Sesi Lelang, dan Export XLSX Laporan Keuangan Panel Admin
* **Status:** Selesai, Teruji & Berhasil Dikompilasi Produksi
* **File yang Diubah:**
  * **Penyajian Data No. Polisi:** Memperbaiki API backend untuk menyertakan `police_number` dan `year` dari tabel `assets`, sehingga kolom No. Polisi pada tabel Laporan Keuangan kini terisi dengan benar (contoh: `B 1234 ABC`).
  * **Penambahan Kolom Sesi Lelang:** Menambahkan kolom **Nama Sesi Lelang** (`session.title`) dan **Tanggal Sesi** (`session.scheduled_at`) untuk mempermudah audit rekapitulasi per sesi.
  * **Fitur Export XLSX:** Mengintegrasikan tombol **`📥 Export Excel`** yang mengunduh seluruh data Laporan Keuangan (lengkap dengan No. Lot, Nama Sesi, Tanggal Sesi, No. Polisi, Unit, GMV, Fee Admin, Fee Lelang, DPP, PPN, PPh 23, PMK 41, Pengeluaran PG, dan Net Settlement) ke format file `.xlsx`.

### 26. Tombol Refresh Halaman khusus PWA App Bidder
* **Status:** Selesai, Teruji & Berhasil Dikompilasi Produksi
* **File yang Diubah:**
  * [BidderLayout.tsx](file:///c:/Users/han/Herd/indo-lelang/apps/landing-web/src/components/layout/BidderLayout.tsx) (Frontend Layout Bidder Web)
* **Deskripsi Perubahan:**
  * Menambahkan tombol refresh (`refresh` icon) khusus untuk pengguna PWA standalone.
  * Tombol refresh ditampilkan di bilah Header PWA (ketika topbar aktif).
  * Menambahkan Floating Action Button (FAB) melayang di pojok kanan bawah (`fixed bottom-24 right-6`) dengan animasi bounce untuk mempermudah reload halaman pada viewports yang menyembunyikan topbar (seperti halaman Beranda).
  * Tombol ini dinonaktifkan / disembunyikan otomatis pada peramban web desktop standard dan browser mobile biasa karena sudah memiliki navigasi refresh bawaan.

### 27. Proteksi Kerusakan Tampilan Font / Harga (Font Scaling Accessibility Fix)
* **Status:** Selesai, Teruji & Berhasil Dikompilasi Produksi
* **File yang Diubah:**
  * [globals.css](file:///c:/Users/han/Herd/indo-lelang/apps/landing-web/src/app/globals.css) (CSS Global Frontend Web)
  * [LotCard.tsx](file:///c:/Users/han/Herd/indo-lelang/apps/landing-web/src/components/lots/LotCard.tsx) (Kartu Unit Katalog)
* **Deskripsi Perubahan:**
  * **Text Size Adjust:** Menambahkan properti CSS `-webkit-text-size-adjust: 100%` dan `text-size-adjust: 100%` pada selector `html, body` untuk memblokir pembesaran font otomatis akibat konfigurasi aksesibilitas font bawaan OS HP (Android/iOS).
  * **Stacked Price Layout:** Mengubah struktur tata letak "Harga Dasar" dan "Penawaran Tinggi" menjadi bertingkat secara vertikal (vertical stack) guna memperluas ruang horizontal.
  * **Pelebaran Kontainer:** Memperlebar batas overlay kartu lot dan memperkecil padding agar muat lebih banyak digit harga.
  * **Font Unit Viewport (`vw`):** Menggunakan formula responsif berbasis `viewport width` (contoh: `min(14px, 3.8vw)`) untuk menjamin teks harga mengecil secara proporsional dan tidak akan pernah meluber (overflow) ke kanan pada grid 2-kolom mobile PWA.

### 28. Fitur Fullscreen & Tombol Keluar di Ruang Kontrol Lelang Admin
* **Status:** Selesai, Teruji & Berhasil Dikompilasi Produksi
* **File yang Diubah:**
  * [control-room/page.tsx](file:///c:/Users/han/Herd/indo-lelang/apps/admin-panel/src/app/auction/control-room/page.tsx) (Ruang Kontrol Lelang Live Admin)
* **Deskripsi Perubahan:**
  * Mengintegrasikan HTML5 Fullscreen API pada panel ruang kontrol lelang.
  * Admin dapat menyembunyikan sidebar kiri dan topbar header untuk menampilkan visual sesi lelang secara penuh satu layar penuh.
  * Menambahkan tombol toggle "Full Screen" di toolbar atas, serta tombol melayang "Keluar Full Screen" di pojok kanan atas layar agar admin dapat kapan saja keluar dari mode layar penuh dengan mudah.

### 29. Penyesuaian Pengalihan Logout Otomatis Admin (Redirect Destination)
* **Status:** Selesai, Teruji & Berhasil Dikompilasi Produksi
* **File yang Diubah:**
  * [api.ts](file:///c:/Users/han/Herd/indo-lelang/apps/admin-panel/src/lib/api.ts) (Core API Client Admin Panel)
* **Deskripsi Perubahan:**
  * Memperbaiki tujuan pengalihan sesi saat admin log out secara otomatis akibat masa aktif habis (idle timeout).
  * URL redirect diubah dari `/admin/login` (yang memicu error 404/Not Found) menjadi `/login`. Skema Next.js `basePath: '/admin'` akan otomatis mengarahkan url tersebut ke internal login page yang benar.

### 30. Penyelarasan Layout Overlays Bell Timer & Canceled Lot di Bidder App
* **Status:** Selesai, Teruji & Berhasil Dikompilasi Produksi
* **File yang Diubah:**
  * [bidding-room/page.tsx](file:///c:/Users/han/Herd/indo-lelang/apps/landing-web/src/app/bidder/bidding-room/page.tsx) (Ruang Lelang Bidder)
* **Deskripsi Perubahan:**
  * Mengubah posisi penayangan overlay "Bell Countdown" (lelang lot berikutnya akan dimulai) dan overlay "Lot Dibatalkan" dari posisi absolut card (`absolute inset-0`) menjadi posisi layar penuh (`fixed inset-0 z-[9999] backdrop-blur-md`).
  * Hal ini memastikan modal overlay terpusat sempurna di tengah-tengah layar fisik perangkat pengguna (desktop, mobile, maupun PWA) dan tidak lagi terpotong ke bawah / menghilang di bawah lipatan layar saat pengguna melakukan scrolling.

### 31. Form Lupa Password Kondisional (Metode Email vs No. WA)
* **Status:** Selesai, Teruji & Berhasil Dikompilasi Produksi
* **File yang Diubah:**
  * **Backend API (`apps/api/src/`):**
    * [auth.schema.ts](file:///c:/Users/han/Herd/indo-lelang/apps/api/src/modules/auth/auth.schema.ts) (Validasi ZodforgotPasswordSchema)
    * [auth.service.ts](file:///c:/Users/han/Herd/indo-lelang/apps/api/src/modules/auth/auth.service.ts) (Logika lookup user dinamis berdasarkan jenis pengiriman)
  * **Public Web App (`apps/landing-web/src/`):**
    * [lupa-password/page.tsx](file:///c:/Users/han/Herd/indo-lelang/apps/landing-web/src/app/lupa-password/page.tsx) (Form Reset Password)
* **Deskripsi Perubahan:**
  * **Input Dinamis:** Form lupa password kini menampilkan pill toggle selector untuk memilih metode pengiriman link reset password (Email atau WhatsApp).
  * **Kondisional Wajib:** Jika Email dipilih, maka hanya input email yang tampil dan berstatus `required`. Jika WhatsApp dipilih, maka hanya input no ponsel yang tampil dan berstatus `required`.
  * **Zod Preprocess:** Menambahkan preprocessing di backend Zod schema untuk mendeteksi string kosong `""` dan mengonversinya menjadi `undefined`, mencegah error format validasi email saat mengirim link via WA.
  * **Look Up Condisional:** Pencarian user di backend disesuaikan secara dinamis: mencari berdasarkan email saja jika memilih opsi Email, atau mencari berdasarkan nomor ponsel saja jika memilih opsi WhatsApp.

### 32. Proteksi Validasi Penghapusan Pengguna (User Deletion Safeguards)
* **Status:** Selesai, Teruji & Berhasil Dikompilasi Produksi
* **File yang Diubah:**
  * **Backend API (`apps/api/src/`):**
    * [users.service.ts](file:///c:/Users/han/Herd/indo-lelang/apps/api/src/modules/users/users.service.ts) (Metode deleteUser)
    * [index.ts](file:///c:/Users/han/Herd/indo-lelang/packages/utils/src/index.ts) (Kamus Error Code)
* **Deskripsi Perubahan:**
  * Mencegah admin menghapus pengguna (Bidder atau Provider) jika masih memiliki transaksi aktif/menggantung:
    1. **Deposit Tertunda:** Memiliki deposit berstatus `pending_approval` (bukti transfer diunggah tapi belum divalidasi).
    2. **NIPL Aktif:** Memiliki kuota NIPL aktif (`status: 'active'`) yang belum dipakai bertransaksi dan belum di-refund.
    3. **Tagihan Belum Lunas:** Memiliki tagihan `invoices` yang belum dibayar (`unpaid`/`pending_approval`) dan belum kedaluwarsa.
    4. **Settlement Tertunda:** Provider memiliki settlement yang statusnya masih `pending` (belum ditransfer).
  - Mengembalikan respon error yang jelas serta kode error spesifik (`PENDING_DEPOSIT_APPROVAL`, `ACTIVE_NIPL_EXISTS`, `UNPAID_INVOICE_EXISTS`, `PENDING_SETTLEMENT_EXISTS`).

### 33. Tombol Aksi "Verifikasi Ulang" di Panel Admin (Bidders & Providers)
* **Status:** Selesai, Teruji & Berhasil Dikompilasi Produksi
* **File yang Diubah:**
  * **Backend API (`apps/api/src/`):**
    * [bidders.service.ts](file:///c:/Users/han/Herd/indo-lelang/apps/api/src/modules/bidders/bidders.service.ts) & [bidders.controller.ts](file:///c:/Users/han/Herd/indo-lelang/apps/api/src/modules/bidders/bidders.controller.ts)
    * [providers.service.ts](file:///c:/Users/han/Herd/indo-lelang/apps/api/src/modules/providers/providers.service.ts) & [providers.controller.ts](file:///c:/Users/han/Herd/indo-lelang/apps/api/src/modules/providers/providers.controller.ts)
    * [bidders.routes.ts](file:///c:/Users/han/Herd/indo-lelang/apps/api/src/modules/bidders/bidders.routes.ts) & [providers.routes.ts](file:///c:/Users/han/Herd/indo-lelang/apps/api/src/modules/providers/providers.routes.ts)
  * **Web Admin Panel (`apps/admin-panel/src/`):**
    * [bidder/page.tsx](file:///c:/Users/han/Herd/indo-lelang/apps/admin-panel/src/app/users/bidder/page.tsx) (Daftar Bidder Admin)
    * [provider/page.tsx](file:///c:/Users/han/Herd/indo-lelang/apps/admin-panel/src/app/users/provider/page.tsx) (Daftar Provider Admin)
* **Deskripsi Perubahan:**
  * Menyediakan tombol aksi **"Verifikasi Ulang"** (warna emas dengan teks putih agar terbaca dengan jelas) pada baris daftar bidder dan provider untuk semua status.
  * Tombol ini memicu endpoint API `PUT .../re-verify` yang mengulangi proses verifikasi dari awal (seperti pengguna baru mendaftar) dengan menghapus baris tabel `kyc_documents` dan profil `bidders` / `providers` terkait, serta mengembalikan status `users` menjadi `'pending'`. Ini memastikan pengguna diarahkan kembali ke halaman unggah berkas KTP & Selfie kamera saat membuka aplikasi.
  * Dilengkapi dialog konfirmasi bawaan dan notifikasi pop-up toast status di sisi admin panel.
 
### 34. Akses Alur Pendaftaran & Pilihan Menjadi Mitra Provider
* **Status:** Selesai, Teruji & Berhasil Dikompilasi Produksi
* **File yang Diubah:**
  * **Public Web App (`apps/landing-web/src/`):**
    * [login/page.tsx](file:///c:/Users/han/Herd/indo-lelang/apps/landing-web/src/app/login/page.tsx) (Pengalihan Login Pengguna Baru)
    * [GoogleAuthModal.tsx](file:///c:/Users/han/Herd/indo-lelang/apps/landing-web/src/components/GoogleAuthModal.tsx) (Pengalihan Social Login Google)
    * [bidderNavItems.ts](file:///c:/Users/han/Herd/indo-lelang/apps/landing-web/src/components/layout/bidderNavItems.ts) (Penambahan Menu Sidebar Bidder)
    * [page.tsx](file:///c:/Users/han/Herd/indo-lelang/apps/landing-web/src/app/bidder/dashboard/page.tsx) (Banner CTA Halaman Beranda Bidder)
    * [status/page.tsx](file:///c:/Users/han/Herd/indo-lelang/apps/landing-web/src/app/provider/status/page.tsx) (Penambahan Link Kembali ke Dashboard)
* **Deskripsi Perubahan:**
  * **Pencegahan Lewat Pilihan Peran:** Pengguna baru yang mendaftar dan belum menentukan peran (role default `'user'`) kini secara otomatis dialihkan ke halaman **`/pilih-peran`** sesaat setelah berhasil masuk (Login standard maupun Social Login Google), alih-alih langsung masuk ke dashboard bidder. Di halaman ini, pengguna dapat memilih secara jelas apakah akan menjadi **Bidder** or **Mitra Provider**.
  * **Menu Pendaftaran Provider di PWA Bidder:** Ditambahkan menu navigasi **`Jadi Mitra Provider`** pada sidebar menu aplikasi web Bidder. Bidder yang sudah aktif dapat mengklik menu ini kapan saja untuk mengajukan pendaftaran kemitraan provider.
  * **Banner CTA di Dashboard Bidder:** Menambahkan banner kartu promosi bertema biru premium modern *"Ingin Titip Jual Kendaraan? Daftar Mitra Provider"* di bagian atas halaman Dashboard Bidder. Banner ini mengarahkan bidder yang tertarik melelang asetnya ke halaman formulir pendaftaran `/register/provider` dengan satu klik.
  * **Kemudahan Pengisian (Prefill Form):** Halaman pendaftaran provider secara otomatis mengambil data KTP, Selfie, Alamat, dan Rekening Bank yang sudah diverifikasi saat menjadi Bidder, sehingga pengguna hanya perlu melengkapi NPWP, nama badan usaha, dan jenis provider tanpa perlu unggah ulang dokumen KTP/Selfie.
  * **Tombol Kembali ke Dashboard di Halaman Status:** Menambahkan tombol **"Kembali ke Dashboard"** pada halaman status verifikasi provider `/provider/status` saat pengajuan berstatus `'pending'` (menunggu verifikasi) atau `'ditolak'`. Tombol ini mengarahkan pengguna kembali ke panel bidder agar mereka tidak terjebak/mengunci navigasinya dan tetap bisa menggunakan fitur lelang sebagai bidder selama akun provider belum disetujui.

### 35. Normalisasi Huruf Kapital (Uppercase) & Perbaikan Dropdown Merek, Model, & Bentuk Bodi Aset
* **Status:** Selesai, Teruji & Berhasil Dikompilasi Produksi
* **File yang Diubah:**
  * **Public Web App (`apps/landing-web/src/`):**
    * [ajukan-barang/page.tsx](file:///c:/Users/han/Herd/indo-lelang/apps/landing-web/src/app/provider/ajukan-barang/page.tsx) (Pengubahan konstanta preset & normalisasi `handleChange` ke uppercase)
  * **Web Admin Panel (`apps/admin-panel/src/`):**
    * [assets/page.tsx](file:///c:/Users/han/Herd/indo-lelang/apps/admin-panel/src/app/assets/page.tsx) (Normalisasi konstanta & form input utama ke uppercase)
    * [assets/new/page.tsx](file:///c:/Users/han/Herd/indo-lelang/apps/admin-panel/src/app/assets/new/page.tsx) (Penyelarasan input form tambah aset baru ke uppercase)
    * [assets/[id]/page.tsx](file:///c:/Users/han/Herd/indo-lelang/apps/admin-panel/src/app/assets/[id]/page.tsx) (Normalisasi sentralisasi `handleFormChange` ke uppercase)
* **Deskripsi Perubahan:**
  * **Penyebab Masalah Dropdown Terkunci:** Sebelumnya, konstanta daftar merek, model, bodi, dan warna menggunakan penulisan camelcase/mixed case (misal: `'Toyota'`, `'Sedan'`). Namun ketika pengguna memilih opsi tersebut, state form diubah paksa menjadi uppercase (misal: `'TOYOTA'`, `'SEDAN'`). Karena value di state (`'TOYOTA'`) tidak lagi cocok dengan value di opsi tag `<option>` (`'Toyota'`), elemen select HTML menganggap pilihan tersebut tidak valid/kosong, sehingga pilihan otomatis terpental kembali ke placeholder awal ("Pilih Tipe...") dan daftar model mobil yang bergantung pada merek tidak muncul.
  * **Solusi Normalisasi & Perbaikan:**
    1. **Konstanta Uppercase:** Mengubah semua data preset di list `CAR_BRANDS`, `MOTOR_BRANDS`, `CAR_MODELS_BY_BRAND`, `MOTOR_MODELS_BY_BRAND`, `COLORS`, dan `BODY_TYPES`/`BODY_OPTIONS` menjadi huruf kapital secara menyeluruh di landing-web maupun admin-panel.
    2. **Centralized Uppercasing:** Menambahkan pemrosesan penanganan input di `handleChange` (sisi provider) dan `handleFormChange` (sisi admin) agar semua input untuk `brand`, `model`, `type`, `body_type` (bentuk bodi), `color`, `transmission`, `fuel_type`, `police_number` (no polisi), `bpkb_number`, `frame_number` (no rangka), dan `engine_number` (no mesin) secara otomatis dikonversi ke uppercase secara real-time.
    3. **Edit Mode Prefill Safeguard:** Ketika memuat data barang untuk diedit (`fetchAssetForEdit`), data di-uppercase terlebih dahulu dan dimasukkan ke custom lists (`customBrands`, `customModels`, dll.) jika tidak terdaftar di preset default, memastikan input edit selalu sinkron dan tidak kosong.
    4. **Perbaikan Prompt Tambah Kustom:** Mengubah teks petunjuk (prompt dialog) pada tombol tambah bentuk bodi kustom dari *"Masukkan Tipe Baru"* menjadi *"Masukkan Bentuk Bodi Baru:"* agar lebih deskriptif dan akurat sesuai fungsionalitasnya.

### 36. Penyelarasan Alur Registrasi Default ke Bidder
* **Status:** Selesai, Teruji & Berhasil Dikompilasi Produksi
* **File yang Diubah:**
  * **Backend API (`apps/api/src/`):**
    * [auth.service.ts](file:///c:/Users/han/Herd/indo-lelang/apps/api/src/modules/auth/auth.service.ts) (Mengubah default role registrasi manual dari USER ke BIDDER)
    * [auth.test.ts](file:///c:/Users/han/Herd/indo-lelang/apps/api/src/modules/auth/auth.test.ts) (Menyesuaikan ekspektasi role default pengujian dari Role.USER ke Role.BIDDER)
* **Deskripsi Perubahan:**
  * **Penyelarasan Role Baru:** Mengubah logika pembuatan user pada pendaftaran manual lewat form agar otomatis mendapatkan role `BIDDER`, selaras dengan pendaftaran menggunakan Google OAuth.
  * **Bypass Pilih Peran:** Perubahan ini membuat pengguna yang baru mendaftar langsung diarahkan ke panel Bidder tanpa perlu masuk ke layar `/pilih-peran` yang lama, dengan opsi mendaftar sebagai provider tetap tersedia di dalam panel Bidder.

### 37. Sinkronisasi Status Transaksi & Dinamisasi Jenis Mutasi di Dashboard Bidder
* **Status:** Selesai, Teruji & Berhasil Dikompilasi Produksi
* **File yang Diubah:**
  * **Public Web App (`apps/landing-web/src/`):**
    * [dashboard/page.tsx](file:///c:/Users/han/Herd/indo-lelang/apps/landing-web/src/app/bidder/dashboard/page.tsx) (Sinkronisasi `getStatusBadge` dan penambahan fungsi pemilah jenis transaksi `getTxType`)
* **Deskripsi Perubahan:**
  * **Penyelarasan Status Deposit:** Sebelumnya, fungsi `getStatusBadge` di dashboard hanya membaca status `success` untuk badge berhasil. Sementara di backend status deposit tersimpan sebagai `paid`, sehingga transaksi deposit berstatus berhasil tertampil salah sebagai "Pending". Fungsi ini sekarang disinkronkan dengan halaman Riwayat Deposit & Refund agar mendukung status `paid` (sebagai "NIPL Aktif"), `pending_refund` (sebagai "Menunggu Refund"), `refunded` (sebagai "Refunded"), `consumed` (sebagai "Terpakai"), dan `expired`/`failed` (sebagai "Expired"/"Gagal").
  * **Dinamisasi Jenis Transaksi:** Mengubah kolom "Jenis Transaksi" yang sebelumnya di-hardcode sebagai "Pembelian NIPL (Jaminan)" menjadi dinamis berdasarkan status mutasi saldo (`refunded` -> "Refund NIPL (Jaminan)", `pending_refund` -> "Pengajuan Refund", `consumed` -> "NIPL Terpakai (Checkout)", dst).

### 38. Perbaikan Duplikasi Antrean Persetujuan Bidder Saat Mendaftar Provider
* **Status:** Selesai, Teruji & Berhasil Dikompilasi Produksi
* **File yang Diubah:**
  * **Backend API (`apps/api/src/`):**
    * [kyc/kyc.service.ts](file:///c:/Users/han/Herd/indo-lelang/apps/api/src/modules/kyc/kyc.service.ts) (Mencegah pembuatan/update status bidder menjadi `'antri'` jika user memiliki pengajuan/akun provider aktif)
    * [providers/providers.service.ts](file:///c:/Users/han/Herd/indo-lelang/apps/api/src/modules/providers/providers.service.ts) (Menonaktifkan status bidder secara menyeluruh tanpa memandang status awalnya ketika provider disetujui)
* **Deskripsi Perubahan:**
  * **Penyebab Bug Duplikasi Antrean:** Ketika pengguna mendaftar sebagai provider, mereka mengunggah dokumen KYC (KTP & Selfie). Alur pengunggahan KYC secara default memicu sinkronisasi yang menaruh user ke status `antri` di tabel `bidders`. Ketika admin menyetujui pengajuan provider, status bidder hanya dinonaktifkan jika sebelumnya berstatus `aktif` (`status: ApplicationStatus.AKTIF`). Karena status bidder masih menggantung di `'antri'` (belum aktif), baris bidder tersebut tidak terpengaruh dan tetap tersangkut di antrean persetujuan admin bidder.
  * **Solusi Perbaikan:**
    1. Di `kyc.service.ts`, saat mengunggah KYC, sistem memeriksa terlebih dahulu apakah pengguna memiliki pengajuan provider (baik status `'antri'` maupun `'aktif'`). Jika ya, status bidder diatur langsung ke `'nonaktif'`, sehingga tidak pernah masuk ke antrean persetujuan bidder.
    2. Di `providers.service.ts`, ketika pengajuan provider disetujui, query penonaktifan bidder diubah untuk menghapus status kondisi `status: ApplicationStatus.AKTIF`, sehingga profil bidder bermigrasi ke status `'nonaktif'` secara mutlak dan bersih.

### 39. Perbaikan Kunci Properti Render Pesan Notifikasi (Body vs Message) di Dashboard Bidder & Provider
* **Status:** Selesai, Teruji & Berhasil Dikompilasi Produksi
* **File yang Diubah:**
  * **Public Web App (`apps/landing-web/src/`):**
    * [bidder/dashboard/page.tsx](file:///c:/Users/han/Herd/indo-lelang/apps/landing-web/src/app/bidder/dashboard/page.tsx) (Mengubah rendering detail notifikasi dari `notif.message` menjadi `notif.body`)
    * [provider/dashboard/page.tsx](file:///c:/Users/han/Herd/indo-lelang/apps/landing-web/src/app/provider/dashboard/page.tsx) (Mengubah rendering detail notifikasi dari `notif.message` menjadi `notif.body`)
* **Deskripsi Perubahan:**
  * **Penyebab Masalah Notifikasi Kosong/Membingungkan:** Sebelumnya, kolom deskripsi notifikasi di panel bidder maupun provider mencoba mengambil properti `notif.message` dari JSON API. Namun, skema database (Prisma) menyimpan deskripsi notifikasi dalam kolom `body`. Ini menyebabkan visual notifikasi terender kosong (hanya judul yang terlihat), yang membingungkan pengguna jika terdapat banyak notifikasi berulang dengan judul sama, karena mereka tidak dapat membedakan isi pesannya saat menutap/menutup notifikasi.
  * **Solusi Perbaikan:** Mengubah pemanggilan objek data di sisi frontend Next.js agar membaca `notif.body` (sesuai struktur skema database `notifications`), sehingga teks deskripsi detail notifikasi sekarang tampil secara utuh dan jelas sebelum ditutup.

### 40. Penyaringan Mutlak Provider dari Daftar Bidder di Panel Admin
* **Status:** Selesai, Teruji & Berhasil Dikompilasi Produksi
* **File yang Diubah:**
  * **Backend API (`apps/api/src/`):**
    * [bidders/bidders.service.ts](file:///c:/Users/han/Herd/indo-lelang/apps/api/src/modules/bidders/bidders.service.ts) (Menambahkan penyaringan/filter database agar daftar bidder tidak mengikutsertakan user dengan role provider atau yang sedang mengajukan diri sebagai provider)
* **Deskripsi Perubahan:**
  * **Penyebab Tampil Ganda di Menu Bidder:** Sebelumnya, menu daftar bidder di admin memuat seluruh baris dari tabel `bidders` tanpa membedakan apakah pengguna tersebut sudah mengajukan diri menjadi provider (berstatus `antri`) atau sudah sah menjadi provider (berstatus `aktif`). Hal ini mengakibatkan duplikasi antrean dan tampilan akun provider berstatus "tidak aktif" di dalam menu bidder.
  * **Solusi Perbaikan:** Menambahkan query filter dinamis pada metode `getBidders`. Sekarang, database secara otomatis mengecualikan pengguna yang memiliki peran (`role`) sebagai `'provider'` ATAU yang memiliki data pengajuan provider (`provider_app`) dengan status `'antri'` (sedang diajukan) atau `'aktif'` (sudah aktif). Hal ini membuat daftar bidder steril dan hanya menampilkan bidder murni. Akun yang mendaftar provider otomatis hilang dari daftar/antrean bidder dan hanya muncul di menu provider.

### 41. Penyelarasan Menu Sidebar Bidder dengan Tab Navigasi PWA
* **Status:** Selesai, Teruji & Berhasil Dikompilasi Produksi
* **File yang Diubah:**
  * **Public Web App (`apps/landing-web/src/`):**
    * [components/layout/bidderNavItems.ts](file:///c:/Users/han/Herd/indo-lelang/apps/landing-web/src/components/layout/bidderNavItems.ts) (Menyelaraskan data array menu sidebar agar memiliki nama, ikon, dan tautan yang sama dengan PWA app)
    * [components/layout/BidderLayout.tsx](file:///c:/Users/han/Herd/indo-lelang/apps/landing-web/src/components/layout/BidderLayout.tsx) (Menghapus penyaringan penyembunyian item Beranda dan penggantian nama halaman statistik di sidebar)
* **Deskripsi Perubahan:**
  * **Penyebab Inkonsistensi Menu:** Sebelumnya, menu di PWA bottom nav (mobile) dan sidebar (desktop) memiliki perbedaan besar. Sidebar menyembunyikan halaman Beranda (`/bidder/home`), mengganti nama menu Statistik (`/bidder/dashboard`) menjadi "Beranda", tidak menampilkan menu Katalog, serta menggunakan ikon ruang lelang live yang berbeda (`play_circle` vs `gavel`).
  * **Solusi Perbaikan:** 
    1. Memperbarui `bidderNavItems.ts` agar menyertakan item yang sama dengan tab PWA: **Beranda** (home), **Katalog** (directions_car), **Beli NIPL** (payments), **Aktifitas** (query_stats), **Ruang Lelang Live** (gavel), dan menu-menu sekunder lainnya.
    2. Mengubah fungsi `navLinks` di `BidderLayout.tsx` agar merender semua item navigasi secara apa adanya tanpa memotong link `/bidder/home` dan tanpa memaksakan penggantian nama dashboard menjadi "Beranda". Ini menyamakan visual dan navigasi secara presisi di seluruh mode tampilan (Desktop, Mobile, Standalone PWA).

### 42. Perbaikan Tampilan Status NIPL Unlimited di Panel Admin
* **Status:** Selesai, Teruji & Berhasil Dikompilasi Produksi
* **File yang Diubah:**
  * **Admin Panel (`apps/admin-panel/src/`):**
    * [app/users/bidder/page.tsx](file:///c:/Users/han/Herd/indo-lelang/apps/admin-panel/src/app/users/bidder/page.tsx) (Memperbaiki kondisi pengecekan paket NIPL unlimited di tabel daftar, detail info, dan modal edit)
* **Deskripsi Perubahan:**
  * **Penyebab Tampilan Angka 999:** Sebelumnya, panel admin hanya merender teks `"Unlimited"` jika pengguna memiliki **kedua** jenis paket unlimited (Mobil DAN Motor) secara bersamaan (`bidder.is_unlimited_mobil && bidder.is_unlimited_motor`). Jika pengguna hanya membeli salah satu (misalnya hanya Unlimited Mobil), maka kondisi bernilai `false` dan panel admin jatuh ke kondisi default yang menampilkan angka nominal NIPL murni (`999 NIPL` atau lebih), yang membingungkan bagi admin.
  * **Solusi Perbaikan:** Memperbarui logika render di tiga tempat pada halaman bidder admin (Badge Tabel, Detail Bidder, dan Info Modal Edit) dengan percabangan yang lebih detail:
    1. Jika kedua paket aktif $\rightarrow$ Tampilkan `"Unlimited"`.
    2. Jika hanya mobil yang aktif $\rightarrow$ Tampilkan `"Unlimited Mobil"`.
    3. Jika hanya motor yang aktif $\rightarrow$ Tampilkan `"Unlimited Motor"`.
    4. Jika tidak ada yang aktif $\rightarrow$ Tampilkan jumlah NIPL biasa (misal: `1 NIPL`).

### 43. Penyempurnaan Filter dan UI Panel Admin (Daftar Aset, Sesi Lelang, Hasil Sesi, dan Ruang Kontrol)
* **Status:** Selesai, Teruji & Berhasil Dikompilasi Produksi
* **File yang Diubah:**
  * **Backend API (`apps/api/src/`):**
    * [modules/sessions/sessions.schema.ts](file:///c:/Users/han/Herd/indo-lelang/apps/api/src/modules/sessions/sessions.schema.ts) (Menambahkan parameter query `is_exclusive` dan `date` pada Zod schema validasi list sessions)
    * [modules/sessions/sessions.controller.ts](file:///c:/Users/han/Herd/indo-lelang/apps/api/src/modules/sessions/sessions.controller.ts) (Membaca dan mem-forward query params filter baru ke service getSessions)
    * [modules/sessions/sessions.service.ts](file:///c:/Users/han/Herd/indo-lelang/apps/api/src/modules/sessions/sessions.service.ts) (Mengimplementasikan filter `is_exclusive` dan filter range tanggal `scheduled_at` pada query Prisma)
  * **Admin Panel (`apps/admin-panel/src/`):**
    * [app/assets/page.tsx](file:///c:/Users/han/Herd/indo-lelang/apps/admin-panel/src/app/assets/page.tsx) (Memperbaiki dropdown filter provider agar menampilkan seluruh provider terdaftar)
    * [app/assets/approval/page.tsx](file:///c:/Users/han/Herd/indo-lelang/apps/admin-panel/src/app/assets/approval/page.tsx) (Menambahkan filter pencarian No. Polisi dan memperbaiki dropdown filter provider)
    * [app/sessions/page.tsx](file:///c:/Users/han/Herd/indo-lelang/apps/admin-panel/src/app/sessions/page.tsx) (Menambahkan kontrol filter Tanggal, Tipe Sesi, dan Cabang)
    * [app/auction/control-room/page.tsx](file:///c:/Users/han/Herd/indo-lelang/apps/admin-panel/src/app/auction/control-room/page.tsx) (Menghapus elemen tombol float Exit Fullscreen duplikat)
    * [app/auction/results/page.tsx](file:///c:/Users/han/Herd/indo-lelang/apps/admin-panel/src/app/auction/results/page.tsx) (Menambahkan kontrol filter pencarian No. Polisi)
* **Deskripsi Perubahan:**
  * **Penyebab & Solusi Perbaikan:**
    1. **Filter Provider di Aset:** Sebelumnya, opsi provider difilter hanya jika ID provider terdapat pada data aset ter-load. Ini memicu bug kosongnya dropdown jika data belum termuat. Saya mengubahnya agar menampilkan seluruh provider aktif secara penuh.
    2. **Approved Barang:** Dilengkapi filter pencarian nomor polisi (`searchPolice`) dan perbaikan dropdown provider agar sama dengan daftar aset utama.
    3. **Daftar Sesi:** Menambahkan input tanggal (`dateFilter`), select tipe sesi (`typeFilter`), dan select cabang (`branchFilter`) di sisi admin-panel yang terhubung langsung ke query parameter backend API Prisma.
    4. **Ruang Kontrol Fullscreen:** Menghapus tombol melayang *"Keluar Full Screen"* di pojok kanan atas yang duplikat dengan tombol utama di header, agar UI bersih dan lapang saat operator memantau lelang.
    5. **Hasil Sesi:** Menambahkan input filter pencarian nomor polisi (`searchPolice`) untuk mempermudah melacak hasil lelang kendaraan tertentu secara dinamis di frontend.

### 44. Penyempurnaan Efek Transisi, Overlay, dan Efek Suara Lonceng Tinju Real-time pada Ruang Lelang
* **Status:** Selesai, Teruji & Berhasil Dikompilasi Produksi
* **File yang Diubah:**
  * **Public Web App (`apps/landing-web/src/`):**
    * [app/bidder/bidding-room/page.tsx](file:///c:/Users/han/Herd/indo-lelang/apps/landing-web/src/app/bidder/bidding-room/page.tsx) (Menambahkan fungsi `playBoxingBell`, merapikan pembagian event WebSocket, dan mematikan double-timer bug)
  * **Admin Panel (`apps/admin-panel/src/`):**
    * [app/auction/control-room/page.tsx](file:///c:/Users/han/Herd/indo-lelang/apps/admin-panel/src/app/auction/control-room/page.tsx) (Mengaktifkan tombol aktivasi manual untuk lot dengan status pre-cancelled)
* **Deskripsi Perubahan:**
  * **Penyebab & Solusi Perbaikan:**
    1. **Tampilan Popup Hasil Lelang:** Logika hasil lot ditutup (`lot:closed`) telah diverifikasi. Banner popup hanya muncul bagi pemenang lelang (dengan ucapan selamat *"Selamat Anda Memenangkan Lot X!"* dan tombol pelunasan) serta peserta yang pernah menaruh bid di lot tersebut (dengan ucapan *"Maaf Anda Belum Memenangkan Lot Ini"*). Peserta pasif yang tidak meletakkan bid sama sekali tidak akan mendapatkan popup overlay apa pun (hanya lot berpindah otomatis di latar belakang).
    2. **Perpindahan Lot & Overlay Transisi:** Transisi lot berikutnya diamankan dengan overlay hitung mundur 3 detik yang menampilkan ikon lonceng (`notifications_active`).
    3. **Efek Suara Lonceng Pertandingan Tinju (Boxing Bell):** Menggunakan Web Audio API, saya menambahkan fungsi `playBoxingBell()` yang mensintesis bunyi lonceng "ding-ding-ding" secara rapat dengan menyelaraskan frekuensi dasar D5 ($587.33\text{ Hz}$) dan 7 rasio harmonik logam. Efek lonceng ini diputar otomatis saat overlay countdown 3 detik dimulai, dan kembali berbunyi "ding-ding-ding" saat timer habis (angka 0) menandakan ronde bid lot telah dibuka secara resmi.
    4. **Double-timer bug (Fix):** Menghapus overlapping interval decrement pada `handleLotStartCountdown` dan memusatkan decrement timer visual ke satu `useEffect` pusat agar countdown sinkron dan bernilai mulus.
    5. **Batal Lot:** Skenario pembatalan lot (`lot:cancelled`) terverifikasi menampilkan overlay hitungan mundur 5 detik dengan pesan *"LOT INI DIBATALKAN, Lot berikutnya dimulai setelah X detik"*.
    6. **Aktivasi Lot Dibatalkan (Pre-Cancelled):** Sesuai penuturan user, status batal bukan hanya terjadi saat lelang berlangsung tetapi lot tersebut memang sudah berstatus "dibatalkan" sejak publikasi. Agar operator di control room tetap bisa memproses alur lelang secara manual (terutama saat autotrigger mati), saya menambahkan tombol *"Lanjut (Batal)"* pada tabel antrean di control room untuk lot berstatus `'cancelled'`, serta mengecualikannya dari label status *Selesai*. Ini memungkinkan operator mengaktifkan lot batal tersebut secara manual, memicu overlay hitung mundur 5 detik di sisi peserta, dan berlanjut otomatis ke lot berikutnya dengan mulus.

### 45. Penyelarasan Pengalihan Logout/Timeout ke Halaman Login Utama (Centralized Login Redirect)
* **Status:** Selesai, Teruji & Berhasil Dikompilasi Produksi
* **File yang Diubah:**
  * **Admin Panel (`apps/admin-panel/src/`):**
    * [lib/api.ts](file:///c:/Users/han/Herd/indo-lelang/apps/admin-panel/src/lib/api.ts) (Mengubah target pengalihan `clearAuthAndRedirect` agar mengarah ke login port 3000 pada localhost, dan relative root domain `/login` di production)
    * [app/login/page.tsx](file:///c:/Users/han/Herd/indo-lelang/apps/admin-panel/src/app/login/page.tsx) (Menambahkan pengecekan pada `useEffect` login page admin panel agar langsung melempar akses langsung tanpa parameter token ke login page utama di port 3000)
* **Deskripsi Perubahan:**
  * **Penyebab & Solusi Perbaikan:** Sebelumnya, saat sesi admin kedaluwarsa atau admin melakukan logout manual, sistem mengarahkan mereka ke `/login` internal milik `admin-panel` (`http://localhost:3001/login`). Untuk menyatukan gerbang login, saya mengubah logika pengalihan di `clearAuthAndRedirect` dan `LoginPage` agar mengarah ke halaman login utama (`http://localhost:3000/login` pada local development, dan `/login` relatif di production). Alur masuk admin tetap aman karena login utama (`landing-web`) akan meneruskan user ber-role admin/operator kembali ke admin-panel beserta parameter token otentikasi.

### 46. Sinkronisasi Otomatisasi Lot & Pencegahan Freeze Halaman Bidder Saat Sesi Ditutup
* **Status:** Selesai, Teruji & Berhasil Dikompilasi Produksi
* **File yang Diubah:**
  * **Admin Panel (`apps/admin-panel/src/`):**
    * [app/auction/control-room/page.tsx](file:///c:/Users/han/Herd/indo-lelang/apps/admin-panel/src/app/auction/control-room/page.tsx) (Mengarahkan simpanan trigger ke key database `auction_lot_next_trigger` dan menyamakan value `'auto'` $\rightarrow$ `'system'`)
  * **Public Website (`apps/landing-web/src/`):**
    * [app/bidder/bidding-room/page.tsx](file:///c:/Users/han/Herd/indo-lelang/apps/landing-web/src/app/bidder/bidding-room/page.tsx) (Menambahkan state `isSessionEnded`, mengatur penutupan & redirect `thankYouModal` ke `/katalog`, menyesuaikan `handleLotClosed` agar mengalihkan bidder saat sesi berakhir, dan menaikkan z-index modal ucapan terima kasih menjadi `z-[10000]`)
* **Deskripsi Perubahan:**
  * **Penyebab & Solusi Perbaikan:**
    1. **Masalah Auto Next Lot:** Sebelumnya, saat admin memilih "Lot Berikutnya Dilanjutkan Oleh: sistem (otomatis)", lot tidak berjalan sendiri secara otomatis. Hal ini disebabkan karena panel kontrol di frontend mengupdate key database `auction_next_lot_trigger` dengan value `'auto'`. Sementara backend mengevaluasi key database `auction_lot_next_trigger` dengan value `'system'`. Saya telah mensinkronkan frontend agar menulis ke key dan value database yang benar sesuai evaluasi backend.
    2. **Masalah Freeze di Sisi Bidder Saat Sesi Ditutup:** Ketika operator lelang menutup sesi saat lelang aktif sedang berjalan, lot yang aktif otomatis dibatalkan. Bidders melihat overlay "LOT INI DIBATALKAN" selama 5 detik, namun setelah countdown habis, halaman akan membeku (freeze) dan tidak beralih. Saya menambahkan state `isSessionEnded` di sisi klien. Bagi bidder yang pernah menaruh bid, modal ucapan terima kasih (Thank You Modal) akan muncul di atas overlay pembatalan (z-index dinaikkan ke `z-[10000]`) dan otomatis mengalihkan mereka ke `/katalog` setelah 5 detik. Sedangkan bagi bidder yang tidak menaruh bid, setelah overlay hitung mundur 5 detik "LOT DIBATALKAN" habis, mereka juga langsung dialihkan secara mulus ke halaman `/katalog` daripada membeku di tempat.

### 47. Penambahan Aksi View Detail & Fitur Import Excel Massal di Panel Provider
* **Status:** Selesai, Teruji & Berhasil Dikompilasi Produksi
* **File yang Diubah:**
  * **Public Website (`apps/landing-web/src/`):**
    * [package.json](file:///c:/Users/han/Herd/indo-lelang/apps/landing-web/package.json) (Menambahkan dependensi `"xlsx": "^0.18.5"`)
    * [app/provider/daftar-barang/page.tsx](file:///c:/Users/han/Herd/indo-lelang/apps/landing-web/src/app/provider/daftar-barang/page.tsx) (Menambahkan tombol "Detail", logika fetch detail aset, dan overlay modal spesifikasi lengkap berserta foto)
    * [app/provider/ajukan-barang/page.tsx](file:///c:/Users/han/Herd/indo-lelang/apps/landing-web/src/app/provider/ajukan-barang/page.tsx) (Mengimplementasikan card upload Excel, fungsi parser SheetJS untuk pencocokan cabang otomatis dan konversi tipe data, daftar pratinjau tabel, serta pengiriman API bulk submit)
  * **File Template Baru:**
    * [public/template_import_aset.xlsx](file:///c:/Users/han/Herd/indo-lelang/apps/landing-web/public/template_import_aset.xlsx) (File Excel template import dengan baris contoh, styling header biru navy, dan 29 kolom dropdown validasi bawaan)
* **Deskripsi Perubahan:**
  * **Penyebab & Solusi Perbaikan:**
    1. **Aksi View Detail Aset:** Provider sebelumnya tidak memiliki cara visual untuk melihat kelengkapan data aset/kendaraan yang telah mereka titipkan. Saya menambahkan tombol **Detail** pada setiap baris di tabel inventori yang memicu overlay modal detail interaktif. Modal ini menampilkan Spesifikasi Teknis, Legalitas & Identitas Surat, Kelengkapan Dokumen Fisik, Deskripsi/Notes, hingga grid galeri foto kendaraan yang telah diunggah.
    2. **Import Massal Aset Excel:** Provider membutuhkan cara cepat untuk mendaftarkan banyak unit sekaligus tanpa mengisi form manual satu-persatu. Saya mengintegrasikan tombol unduh **Template Excel** yang di dalamnya sudah ditanamkan dropdown validasi data bawaan (kategori, merek, model, transmisi, bahan bakar, status pool, kelengkapan dokumen, dll.) sesuai isian form asli. Setelah diisi, provider mengunggah kembali file tersebut. Sistem client-side mengurai data, menyaring baris contoh, mencocokkan nama Cabang secara pintar (case-insensitive) dengan daftar Cabang terdaftar untuk mendapatkan UUID cabang, dan menampilkannya pada tabel pratinjau sementara. Saat tombol **Ajukan Aset** ditekan, sistem mengirimkan request pembuatan aset secara berurutan ke backend, memperlihatkan progress bar pengajuan, dan mengosongkan kembali daftar setelah proses submit selesai.
    3. **Penyelarasan Cascading Dropdown Tiga Tingkat (Merek -> Model -> Tipe):** Saya mengimplementasikan relasi dependensi dropdown tiga tingkat baik di sisi **Form Web** maupun **Template Excel**. Di sisi form web, setelah pengguna memilih model kendaraan, input pilihan Tipe/Varian secara otomatis disaring untuk menampilkan varian yang valid (seperti `1.3 G`, `1.5 G` untuk Avanza, atau `CBS`, `Deluxe` untuk Beat). Di template Excel, ini diimplementasikan menggunakan pemetaan lembar kerja tersembunyi `Data_Lists` yang mereferensikan formula `=INDIRECT(SUBSTITUTE(SUBSTITUTE(C2,"-","_")," ","_"))` di Kolom D (Tipe / Varian) agar pilihan dropdown secara dinamis menyaring varian berdasarkan model yang diinput di Kolom C.
    4. **Generasi Excel Dinamis & Real-time (Cabang Dinamis):** Agar template Excel selalu menampilkan data cabang ter-update, saya memindahkan logika pembuatan template Excel ke dalam **Next.js Route Handler** di `/api/template-import` ([app/api/template-import/route.ts](file:///c:/Users/han/Herd/indo-lelang/apps/landing-web/src/app/api/template-import/route.ts)). Ketika provider mengeklik tombol unduh, server secara real-time mengambil daftar cabang aktif dari database (`GET /branches`), memasukannya ke Named Range `BRANCH_LIST`, dan menyajikannya sebagai dropdown validasi pada Kolom H (Cabang). Dengan demikian, jika admin menambah, mengubah, atau menghapus cabang baru di Balai Lelang, daftarnya langsung terbarui di dalam template Excel yang diunduh provider secara otomatis tanpa perlu mengubah kode sumber.
    5. **Fitur Unggah Foto via Popup Modal pada List Pratinjau:** Untuk memudahkan pelengkapan dokumentasi unit tanpa membebani visual tabel, saya mengimplementasikan tombol **Kelola Foto** di setiap baris tabel pratinjau. Ketika diklik, tombol ini membuka modal popup yang menampilkan **7 slot unggah foto lengkap** (Depan, Belakang, Samping Kanan, Samping Kiri, Mesin, Interior, STNK) — persis sama dengan jumlah dan jenis foto pada form pengajuan manual. Setiap slot menampilkan pratinjau gambar mini saat terunggah dan tombol hapus cepat, serta indikator progress pengunggahan biner ke server `/upload/single` secara real-time.
    6. **Validasi & Penyeragaman Format Tanggal di Excel:** Untuk mencegah kesalahan input format tanggal oleh provider, saya mengunci format cell pada kolom **Masa Berlaku STNK (Kolom U)** dan **Masa Berlaku KEUR (Kolom AB)** dengan format standar ISO `yyyy-mm-dd` (`numFmt`). Selain itu, ditambahkan pula **Date Data Validation** bawaan Excel yang membatasi input hanya berupa tanggal valid. Ketika cell tersebut dipilih, Excel otomatis memunculkan tooltip instruksi bantuan (*Input Prompt*): *"Gunakan format YYYY-MM-DD (Tahun-Bulan-Tanggal), contoh: 2027-08-15"*. Jika pengguna memaksa menginput teks sembarang, Excel akan menolaknya dan memunculkan pop-up error peringatan format yang salah.
    7. **Ekspansi Varian & Standardisasi Huruf Kapital (N/A & LAINNYA):** Untuk menyempurnakan kegunaan form web dan template Excel, saya memperluas dan mengonstruksi database varian/tipe untuk **merek Mazda dan seluruh merek setelahnya** (seperti Mazda2/3, CX-3/5/9, merek motor Kawasaki Ninja, W175, dsb.). Lebih lanjut, saya mengintegrasikan opsi **`N/A`** di awal dan **`LAINNYA`** di akhir setiap dropdown pilihan (Kategori, Merek, Model, Tipe/Varian, Warna, Bahan Bakar, Transmisi, Bentuk Bodi, dan berkas Surat-surat). Semua tulisan pilihan dropdown juga telah distandardisasi menggunakan huruf kapital (**UPPERCASE**) secara konsisten baik di web form maupun di dalam berkas Excel yang di-generate.
    8. **Resolusi Corrupt / Pemulihan Workbook Excel (Excel Named Range Naming Rules):** Excel memiliki aturan ketat bahwa Named Range tidak boleh diawali dengan angka (seperti pada model motor/mobil `3 SERIES`, `125 CBS`, dsb.). Untuk mengatasi korupsi spreadsheet Excel yang memicu notifikasi pemulihan (*recovery warning*), saya memodifikasi generator template Excel untuk secara otomatis menambahkan prefix garis bawah (`_`) di depan nama Named Range (misal `_3_SERIES`, `_BMW`). Logika formula Excel di Kolom C dan D juga diselaraskan menggunakan `=INDIRECT("_"&SUBSTITUTE(SUBSTITUTE(cell,"-","_")," ","_"))` sehingga relasi model dan varian tetap terpetakan secara dinamis tanpa melanggar aturan sintaksis Excel.
    9. **Pencegahan Error Parser / Header Mismatch (Import Excel):** Terjadinya pesan error *"Tidak ada data aset valid yang ditemukan dalam file"* disebabkan karena library parser SheetJS sangat sensitif terhadap spasi ekstra, penulisan nama header kolom, atau perbedaan kecil pada metadata sheet. Saya mengimplementasikan helper `findVal` yang melakukan **pencocokan key secara case-insensitive & toleran terhadap spasi ekstra** (seperti `'Merek'`, `'No. Polisi'`, dsb.). Helper ini mencocokkan header kolom secara pintar sehingga jika ada spasi bawaan dari Excel atau perbedaan penulisan minor, data aset tetap terurai dengan sempurna dan lolos validasi client-side secara andal.
    10. **Penyempurnaan Filter Baris Contoh Excel (Bypass Row):** Sebelumnya, filter data aset menggunakan pengecekan plat nomor `"B 1234 ABC"` & nomor BPKB `"BPKB-998877"` untuk membuang baris contoh. Namun, jika pengguna menguji coba/mengedit baris contoh tersebut (misal mengubah merek menjadi `BMW`, model menjadi `3 SERIES`) tetapi membiarkan kolom nomor polisi & BPKB kosong atau bawaan template, filter tersebut secara keliru membuang baris tersebut. Saya memperketat kondisi skip ini agar baris baru hanya dibuang jika **Merek dan Model juga bernilai default ("TOYOTA" & "AVANZA")**, sehingga modifikasi terhadap baris contoh oleh pengguna tetap ter-import dengan benar.
    11. **Pembersihan Lot Kosong & Revert Aset Unsold Saat Selesai Lelang:** Ketika sesi lelang live diselesaikan (`endSession` di `control.controller.ts`), sistem sekarang secara otomatis menghapus lot yang tidak terjual (`CANCELLED` atau `UNSOLD`) dari tabel `lots`. Aset yang terkait dengan lot tak terjual tersebut dikembalikan statusnya menjadi `approved` di tabel `assets` sehingga bisa didaftarkan kembali. Sebaliknya, lot yang terjual (`SOLD`) tetap dipertahankan di database untuk kebutuhan pencatatan invoice pelunasan pemenang lelang.
    12. **Pembaruan Pesan Verifikasi Akun Baru (Bidder Dashboard):** Mengubah pesan sambutan/peringatan bagi pengguna yang belum terverifikasi di panel bidder agar menyajikan dua pilihan utama yang ringkas: (a) Tautan verifikasi KTP (`/ekyc/upload` atau profil) dengan bunyi *"Ingin ikut menjadi peserta lelang? verifikasi KTP terlebih dahulu di sini"*, dan (b) Tautan pendaftaran provider (`/register/provider`) dengan bunyi *"Ingin titip jual barang Anda? verifikasi menjadi provider disini"*. Banner lama digabungkan secara elegan ke dalam satu antarmuka terpadu.
    13. **Penyelarasan Kolom Katalog Beranda Bidder (4 Kolom di Desktop):** Mengubah tampilan kisi-kisi (*grid*) katalog lelang aktif pada menu Beranda Bidder (`bidder/home`) yang semula kaku 2 kolom menjadi responsif: tetap 2 kolom di layar seluler/kecil, meningkat menjadi 3 kolom di tablet, dan melebar menjadi 4 kolom (`lg:grid-cols-4`) di layar komputer/desktop untuk memaksimalkan area tampilan visual unit kendaraan lelang.
    14. **Pemindahan Pengaturan Otomatisasi Mesin Lelang (Control Room):** Memindahkan seluruh panel konfigurasi "Otomatisasi Mesin Lelang (Auction Engine)" dari menu Pengaturan Platform ke halaman Ruang Kontrol. Kini operator dapat memantau lelang real-time sekaligus menyunting 8 parameter otomatisasi countdown & trigger lot/sesi dalam satu tempat. Saya juga membereskan bug kompilasi server-side rendering (SSR) pada `api.ts` yang mengakses objek `window` secara tidak aman.
    15. **Penyempurnaan Alur & Overlay Freeze Lot Dibatalkan pada Lelang Live:** Mengatur agar lot yang dibatalkan tidak dilewati begitu saja saat lelang sedang berjalan. Pada backend (`socket.ts`), status lot yang dibatalkan secara live diubah menjadi `'cancelled'` di DB dan dijadwalkan berpindah otomatis setelah penundaan 5 detik (freeze). Pada frontend operator (`control-room/page.tsx`), ditambahkan state `lastProcessedLotNumber` agar filter antrean `nextPendingLot` melacak lot mana saja yang telah diaktifkan secara urut (baik `'pending'` maupun `'cancelled'`), mencegah perulangan tak terbatas dan memastikan overlay visual lelang batal tayang dengan benar pada layar bidder. Pada frontend bidder (`bidding-room/page.tsx`), ditambahkan statement reset state `setIsCancelledOverlay(false)` saat hitung mundur overlay lelang batal menyentuh angka `0` detik, untuk memecahkan bug tampilan yang sebelumnya membeku selamanya pada layar bidder.
    16. **Perbaikan Keterlambatan Transisi Antrean Lot Lelang (Bidder Panel):** Mendaftarkan listener WebSocket untuk event `"lot:activated"` pada layar ruang lelang bidder (`bidding-room/page.tsx`). Sebelumnya, bidder hanya mendengarkan `"lot:start"` (khusus untuk lot batal), yang menyebabkan pergantian dari satu lot aktif ke lot berikutnya mengalami jeda keterlambatan yang lama (hingga 15-20 detik) karena terpaksa mengandalkan interval polling periodik client. Kini transisi berjalan instan seketika lot berikutnya dimulai oleh sistem/operator.
    17. **Kustomisasi Modal Hasil Akhir Lot (Sold, Unsold, Cancelled) & Zero Delay:** Memperbarui logika penayangan modal pop-up hasil lot akhir pada layar bidder. Untuk lot terjual (`sold`), informasi hasil didistribusikan ke seluruh peserta lelang secara proporsional (pemenang mendapatkan ucapan selamat; penawar kalah mendapatkan maaf; penonton melihat harga terbentuk & pemenang). Ketika lot berikutnya dimulai oleh sistem/operator, modal ini langsung ditutup instan tanpa jeda tambahan. Untuk lot tidak terjual (`unsold`), popup info ditayangkan selama 5 detik countdown lalu langsung berpindah ke lot berikutnya. Untuk lot dibatalkan (`cancelled`), teks overlay disesuaikan menjadi *"Lot ini dibatalkan, lanjut ke lot berikutnya"* dengan sisa waktu countdown 5 detik.
    18. **Perbaikan Hitung Mundur Unsold & Transisi Bersih Lot Batal (Bidder Screen):** Memperbaiki timer hitung mundur unsold dengan memindahkan pembersihan `closedTimerRef` ke effect unmount terpisah agar tidak dibersihkan secara prematur saat WebSocket menyinkronkan data. Selain itu, alur lot dibatalkan disempurnakan: overlay lelang batal 5 detik tetap ditayangkan, namun setelah hitung mundur selesai, sistem langsung melompat ke lot berikutnya tanpa memicu popup modal hasil apa pun (seperti info lot tidak terjual/dimenangkan).
    19. **Penahanan Bidder di Halaman Ruang Lelang Saat Sesi Berakhir:** Menghapus pengalihan paksa ke halaman katalog (`router.push("/katalog")`) di 4 tempat utama ketika sesi lelang selesai (baik penutupan otomatis modal terima kasih, tombol "Tutup" manual, maupun akhir sesi lelang). Kini bidder tetap berada di halaman Ruang Lelang dengan tampilan jadwal lelang berikutnya.
    20. **Penyederhanaan Toolbar Ruang Kontrol Admin (Hapus Selektor Redundan):** Menghapus dropdown selektor redundan "⚙️ Lot Berikutnya Dilanjutkan Oleh" dari toolbar atas halaman Ruang Kontrol Admin. Pengaturan ini sekarang dikelola secara eksklusif dari panel "Otomatisasi Mesin Lelang (Auction Engine)" di bilah samping kanan. Toolbar atas diatur agar hanya tampil saat mode manual/admin aktif dengan hanya menyajikan tombol "Next Lot" yang diposisikan di sisi kanan.
    21. **Refactoring Keranjang Pelunasan Lintas Sesi & Aturan NIPL Unlimited:** Mengatur ulang alur pembayaran keranjang pelunasan pada panel bidder agar mendukung seleksi checkout global lintas sesi lelang. Di sisi backend (`checkout.service.ts`), pembatasan satu hari sesi (`sessionDates.size > 1`) dihapus agar bidder dapat membayar beberapa unit dari sesi lelang berbeda dalam satu nomor VA transfer. Di sisi frontend (`cart/page.tsx`), checkbox seleksi dan kartu ringkasan checkout dipindahkan ke level halaman global. Penggabungan ini juga dilengkapi dengan logika validasi kuota NIPL otomatis: jika jumlah unit terpilih dari jenis kendaraan tertentu sama atau kurang dari kuota NIPL yang dimiliki, semua tagihan unit tersebut wajib menggunakan jaminan NIPL (checkbox terkunci); jika jumlah unit terpilih lebih banyak, bidder secara bebas dapat memilih unit mana saja yang akan menggunakan jaminan NIPL (hingga kuota NIPL habis).




