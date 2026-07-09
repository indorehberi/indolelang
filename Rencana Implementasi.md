Rencana Perbaikan & Penambahan Fitur — Indo-Lelang
Context
Aplikasi lelang ini sudah live di production (www.bidku.co.id). Berdasarkan diskusi lanjutan dengan klien, alur bisnis berubah dari blueprint awal — didokumentasikan di penambahan-perbaikan fitur.md. Riset menyeluruh (3 agent Explore paralel atas apps/api, apps/admin-panel, apps/landing-web) menemukan bahwa sebagian fitur sudah ada tapi menyimpang dari alur baru, sebagian punya bug nyata, dan beberapa fitur benar-benar belum ada. Wireframe di wireframe/ (khususnya wireframe/provider/* dan wireframe/index.html) dipakai sebagai referensi tampilan/struktur menu saja — bila alur di wireframe berbeda dari penambahan-perbaikan fitur.md, file .md yang menang.

Keputusan user: (1) lakukan refactor relasional penuh untuk model Bidder/Provider (bukan tambal-sulam flag di tabel users), demi standar enterprise jangka panjang; (2) lakukan migrasi schema untuk memisahkan status ditolak vs dikembalikan pada aset titip jual, plus kolom pendukung baru. Kedua migrasi bersifat additive terhadap DB production (tidak menghapus kolom/data lama), dijalankan lewat prisma migrate dev seperti migrasi-migrasi sebelumnya di apps/api/prisma/migrations/.

Kerangka kerja: dikerjakan per modul, sekuensial. Tiap modul selesai → verifikasi (build/typecheck + smoke test lewat preview browser atau API call) → lapor ke user → lanjut modul berikutnya. Tidak mengerjakan integrasi pihak ketiga baru (di luar yang sudah ada: Midtrans, Google OAuth, Cloudflare R2) kecuali diminta eksplisit — ini konsisten dengan target launch cepat.

Temuan Kunci dari Riset (ringkas)
Auth/Users: Google login & register sudah jalan, tapi role cuma string flat di tabel users, tidak ada model Bidder/Provider terpisah → list Bidder admin ikut menampilkan semua role=user biasa (apps/api/src/modules/users/users.service.ts:12-98, apps/admin-panel/src/app/users/bidder/page.tsx:51-53).
KYC: profil & KYC masih 2 form terpisah (landing-web/src/app/bidder/profile vs .../ekyc/upload) — spec minta disatukan. Ada 3 tempat approve/reject berbeda (KYC queue page, bidder-list modal, provider-list modal) — spec minta jadi 1 lewat status "antri" di list Bidder/Provider, hapus menu KYC queue.
Reject inconsistent: satu jalur reject provider (updateProviderStatus) mengirim notifikasi+alasan, jalur lain (PATCH /admin/users/:id langsung dari provider-list) tidak — bug.
Tidak ada guard provider aktif tetap bisa ikut bidding (role tidak dicek sama sekali di bidding.service.ts).
Aset titip jual: status ditolak & dikembalikan digabung jadi RETURNED saja, tanpa alasan; tidak ada field foto per-sudut (cuma 1 field images JSON generik), tidak ada branch_id/pool, tidak ada notes. deleteAsset()/updateAsset() tidak ada guard status sama sekali (harusnya hanya ditolak yang boleh edit/hapus). Provider malah tidak diberi izin DELETE di route sama sekali.
Provider "Daftar Barang" (landing-web/src/app/provider/daftar-barang/page.tsx) read-only total — tidak ada search/filter/edit/hapus/ajukan-kembali/dikembalikan.
Admin lot planning: tombol "Hapus" tidak punya onClick (mati total); lot number manual tanpa cek duplikat; auto-increment cuma max+1 naive, tidak skip nomor yang dipakai manual.
Control room: tidak ada tombol "Mulai Lelang" & "Lot Berikutnya" eksplisit; tidak ada arsip sesi per-sesi dengan status menang/kalah per lot; default durasi lot tidak konsisten (120 hardcode vs setting '30').
Checkout: tidak bocor ke bidder lain (aman), tapi tidak per-hari (semua invoice unpaid tercampur jadi 1 keranjang), due date 5 hari (harusnya 3), tidak ada cron auto-expire, tidak ada tombol upload-bukti-transfer+kirim di cart (ada di halaman deposit tapi tidak di cart).
BAPL: sama sekali belum ada (yang ada BAST, dokumen berbeda). Field "Pejabat Penjual" & "Pejabatan Lelang Kelas II" belum ada di settings. Nomor surat existing (generateDocNumber) reset harian per cabang, bukan sekuensial per tahun mulai dari 1.
Deposit/NIPL/Refund: sudah cukup lengkap & benar (manual transfer + gateway, refund flow, auto-refund NIPL saat sesi berakhir) — hanya perlu koneksi ke referral & minor polish.
Referral: toggle ada di settings tapi backend & UI-nya full dummy (DUMMY_REFERRALS: [] , setTimeout fake save) — belum ada logic nyata.
Bid increment (+1jt/+2jt/+3jt) & countdown awal: hardcoded di UI (bidder/bidding-room/page.tsx), cuma 2 tombol quick-bid bukan 3, belum ada di settings.
Ruang Lelang Live (bidder) belum sesuai wireframe b8-bidding-stream.html: cuma nampilkan 1 lot, kolom kiri/kanan tercampur (harusnya kiri = harga+bidder tertinggi+countdown+quick-bid, kanan = data kendaraan).
Watchlist: harus dihapus total — semua di apps/landing-web (localStorage only, tidak ada di backend), file-file sudah teridentifikasi.
Urutan Modul Eksekusi
Modul 1 — Refactor Data Model Bidder/Provider (fondasi)
Prisma: tambah model Bidder dan Provider terpisah, relasi 1:1 opsional ke User (user bisa punya salah satu/tidak ada dulu keduanya sebelum apply). Field masing-masing: status (antri|aktif|ditolak|nonaktif), rejection_reason, approved_at/by, serta field spesifik (Provider: company_name, npwp, fee, pks_number; Bidder+Provider: address, bank_name/account, occupation untuk bidder). Data existing di users (company_name, npwp, provider_status, dst) dimigrasikan ke tabel baru lewat migration script, kolom lama di users di-deprecate (dibiarkan nullable, tidak dihapus dulu demi safety).
Update apps/api/src/modules/auth, users, kyc untuk baca/tulis ke model baru.
Tambah business rule: bidding blocked jika Provider.status = aktif untuk user tsb (cek di bidding.service.ts/socket.ts bid handler).
Migration file baru di apps/api/prisma/migrations/, jalankan prisma migrate dev di lokal lalu siapkan untuk deploy production terpisah (tidak auto-deploy tanpa konfirmasi user).
Modul 2 — Form Registrasi & Profil+KYC Tersatukan
Landing-web: satukan bidder/profile + ekyc/upload jadi 1 form/1 alur (submit sekali → status "menunggu verifikasi" ditampilkan). Sama untuk provider (provider/profil + ekyc).
Aktifkan pilihan daftar sebagai Bidder atau Provider di panel user (bukan hardcode role: "bidder" di register page).
Tampilkan halaman status verifikasi pasca-submit (pending/antri, approved, rejected+alasan).
Modul 3 — Admin: List Bidder & Provider (gabung KYC queue)
Hapus menu "Verifikasi KYC" terpisah dari sidebar admin; approve/reject dilakukan langsung dari list Bidder/Provider dengan status "antri".
Filter backend: hanya tampilkan user yang benar-benar mengajukan (punya row Bidder/Provider), bukan semua role=user.
Sorting: antri dulu, baru aktif. Tambah search + filter by status (konsisten di kedua list).
Reject: satu jalur saja (perbaiki inkonsistensi notifikasi), wajib isi alasan, user dikeluarkan dari list aktif tapi tetap tercatat riwayatnya.
Notifikasi ke user (approve/reject+alasan) — reuse notifications module yang sudah ada.
Tambah fitur admin "Tambah Bidder" (isi form pengajuan atas nama user).
Modul 4 — Upgrade Bidder→Provider & Guard Lintas Peran
Form pengajuan provider dari panel bidder: autofill dari data Bidder yang sudah ada (field yang sama).
Pesan peringatan saat bidder mengajukan jadi provider ("jika disetujui, tidak bisa ikut lelang sebagai bidder lagi").
Saat Provider disetujui aktif → nonaktifkan status Bidder otomatis; blok bid attempt (dari Modul 1 rule, wire ke UI: sembunyikan tombol bid/redirect).
Modul 5 — Skema Aset Titip Jual (migrasi + field baru)
Tambah AssetStatus.REJECTED terpisah dari RETURNED; kolom rejection_reason, notes, branch_id (relasi ke branches), pool_status (in_pool/out_pool), dan 7 kolom foto per-sudut (depan/belakang/kanan/kiri/mesin/interior/stnk) menggantikan images generik (atau mendampingi, tanpa menghapus data lama).
Update assets.service.ts reject/return jadi 2 endpoint/status berbeda.
Modul 6 — Provider: Halaman Daftar Barang (fungsional penuh)
landing-web/src/app/provider/daftar-barang: tambah search, filter (status/tanggal/pool), aksi Edit & Hapus (hanya utk status ditolak), Ajukan Kembali (resubmit → menunggu), Dikembalikan action.
ajukan-barang/page.tsx: sambungkan upload foto sungguhan ke upload module (R2) — ganti mock images: "[]".
Modul 7 — Admin: Daftar Barang, Inspeksi, Lot Planning
Form inspeksi: tambah upload dokumen inspeksi (opsional) dan field alasan ditolak; hasil reject keluar dari list, kirim notifikasi ke provider.
Approve → pindah ke list "Aset Siap Dilelang (Approved)" (lots/planning).
Tambah search+filter (status/tanggal/pool) di semua list terkait.
Lot number: tambah cek keunikan server-side (constraint + validasi), perbaiki auto-increment agar skip nomor yang sudah dipakai manual, perbaiki tombol Hapus lot yang tidak berfungsi.
Setelah tambah ke lot: keluar dari list Approved, masuk ke "Daftar Lot Terdaftar (Sesi Terpilih)".
Modul 8 — Ruang Kontrol Lelang
Tambah tombol eksplisit "Mulai Lelang" (start session) dan "Lot Berikutnya" (manual advance) di admin-panel/src/app/auction/control-room.
Rapikan "Stop Lelang" (pastikan konsisten dengan endpoint end session yang sudah ada).
Tambah halaman/tab "Arsip Lelang": daftar sesi lampau dengan semua lot & status menang/tidak per lot.
Selaraskan default durasi lot (satu sumber kebenaran dari settings, hapus hardcode 120 vs 30 yang bentrok).
Modul 9 — Checkout, Tagihan, Deposit Payment UX
Checkout cart: kelompokkan per hari sesi menang (bukan gabung semua unpaid invoice); due date jadi 3 hari; tambah cron auto-expire (apps/api/src/lib/cron.ts) mengubah status→expired setelah lewat batas.
Tambah instruksi pembayaran + tombol upload bukti transfer + tombol kirim di halaman cart (reuse pola dari bidder/deposit/page.tsx:177-221).
Tambah tab/list riwayat tagihan (menunggu/expired/sudah dibayar) di panel bidder.
Modul 10 — BAPL & Settings Pejabat
Tambah field "Pejabat Penjual" & "Pejabatan Lelang Kelas II" di admin-panel/src/app/settings/platform.
Tambah generator nomor BAPL sekuensial per tahun mulai dari 1 (terpisah dari generateDocNumber yang ada, yang tetap dipakai BAST).
Tambah tombol "Sudah Dibayar" di auction/results yang membuka form BAPL (field sesuai template di .md), generate PDF (reuse apps/api/src/lib/pdf.ts).
Modul 11 — Deposit/Refund Polish, Referral Nyata, Pengaturan Bid
Referral: buat model Prisma + endpoint dasar (list peserta, generate kode, tracking sederhana) menggantikan dummy data di admin-panel/src/app/referral/page.tsx.
Bid increment (3 opsi nominal) & countdown awal: pindahkan ke platform_settings, baca dari sana di bidder/bidding-room (ganti hardcode, tambah tombol quick-bid ke-3).
Pengaturan Platform: kelompokkan section dengan warna latar soft berbeda per grup, selaraskan style dengan form lain (checklist styling, bukan fitur baru).
Verifikasi ulang alur Deposit (list) menampilkan data real & konsisten (sudah OK dari riset, hanya spot-check).
Modul 12 — Bidder Misc: Watchlist, Ruang Lelang Live, Profil
Hapus total fitur watchlist: BidderLayout.tsx, bidder/dashboard/page.tsx, bidder/watchlist/page.tsx (hapus file), katalog/page.tsx, katalog/[id]/page.tsx.
Ruang Lelang Live: refactor bidder/bidding-room/page.tsx jadi 2 kolom sesuai wireframe/bidder/b8-bidding-stream.html (kiri: harga tertinggi+bidder+countdown+3 tombol bid; kanan: data kendaraan), dan tampilkan semua lelang yang sedang berlangsung, bukan cuma 1.
Tambah/lengkapi halaman Profil bidder: KTP, NIK, foto selfie read-only (tidak bisa diedit setelah KYC), field lain tetap bisa diedit.
Verifikasi per Modul
Backend: cd apps/api && npm run build / typecheck, jalankan test relevan jika ada di apps/api/tests atau root tests/.
Frontend: jalankan dev server admin-panel/landing-web via preview tool, cek alur end-to-end di browser (bukan cuma baca kode) — login sbg admin/bidder/provider dummy, jalankan aksi kunci modul tsb, screenshot/inspect hasil.
Migration: jalankan prisma migrate dev di lokal dengan DB dev/staging dulu, tidak langsung ke production tanpa konfirmasi eksplisit user.
Setiap modul selesai → laporkan ringkas ke user (apa yang berubah, cara ngetest manual) sebelum lanjut modul berikutnya.
Catatan Eksekusi
Mengingat besarnya cakupan (12 modul, refactor data model), ini dikerjakan lintas beberapa sesi kerja. Mulai dari Modul 1 segera setelah plan disetujui.