saat login, pastikan ada fitur lupa password. 
OTP
- WA
- Email
link social media
- IG
- FB
- TikTok
- Youtube
- Twitter



tampilan saat tidak menang, saat terjual, saat tidak terjual, default angkanya
saat live tapi lot belum berjalan, tampilkan lot berikutnya segera tayang
saat jeda, timer countdown overlflow ke Bawah
suara lonceng masih belum ada
jika ada yang menang di panel bidder NIPL, sebelum pelunasan, tombol refund dibuat tidak aktif, setelah pelunasan, dihitung berapa NIPL yang sisa yang bisa direfund


PERUBAHAN APLIKASI
- samakan tampilan mobile bidder dan provider dengan tampilan PWA
- selain bidder, provider juga dibuatkan tampilan PWA
- field untuk form registrasi : Nama/No WA/email, Password, konfirmasi password. hanya dua fields
- di form verifikasi bidder, cukup tampilkan field upload ktp dan foto selfie. ganti "Pengajuan Menjadi Bidder" menjadi "Berifikasi KTP"
- semua kata KYC di ganti KTP
- di app, saat buka camera, allow while visiting the site,  ada pesan : This site can't ask for your permission, close any bubbles or overlay from other app, the try again.
- tambahkan menu dipanel bidder, list unit yang dimenangkan, kolom : tgl sesi, Lot, No Polisi, Harga terbentuk, Biaya Admin, PMK41, NIPL, Total Tagihan
aksi untuk list unit yang dimenangkan : bayar (keluarkan popup, instruksi pembayaran, total yang harus dibayar, upload bukti ttransfer, tombol kirim
status untuk list unit yang dimenangkan : tunggu pembayaran, proses BAPL, Download BAPL, Ambil Unit, Unit sudah diambil
- panel admin, keuangan/invoice pelunasan ganti dengan Pelunasan.
panel admin, menu audit trail, ganti dengan log, tambahkan aktivitas semua role, tambahkan filter by admin, bidder, no NIPL, tanggal, provider, 
- panel bidder, menu beranda, jika ada NIPL aktif, tampilkan tombol refund, jika diklik tombol refund, tombol refund berubah menjadi proses refund, dan warna berubah grey. dan tambahkan tombol batalkan refund. saat admin sudah proses refund, Nilai NIPL menjadi 0 (nol) tombol refund disembunyikan.
- beberapa user di list bidder masih terlihat, tapi saat didelete, : Pengguna tidak ditemukan
- di halaman registrasi, tambahkan keterangan di bawah field No WA : Email dan No WA di gunakan untuk reset Lupa Password.
- di halaman register ganti teks berikut : Daftar akun dan dapatkan unit kendaraan terbaik dengan harga termurah di IndoLelang
menjadi : Daftar akun dan dapatkan fitur lelang modern dari BIDKU

- panel provider, menu beranda, hapus card Tindakan Mitra
- samakan semua istilah kendaraan, unit aset, barang menjadi : Unit
- admin panel, ada menu pencairan dan tab pencairan mitra di menu deposit. hapus tab pencairan mitra. cukup pakai menu pencairan. ganti nama menu pencairan menjadi pencairan provider
- ganti istilah mitra menjadi provider
- perhitungan batas makimal pelunasan unit yang terjual adalah 3 hari, pastikan tidak termasuk hari sabtu dan minggu. juga hari libur nasional. tambahkan input field tanggal libur national di pengaturan platform. 1 field untuk 1 tanggal, buatkan fitur tambah field dan hapus field. 
- di panel admin, menu bidder, saat cari nama bidder, terlempar ke menu daftar barang.
- untuk keperluan simulasi, pernah ada banyak akun, deposit, kendaraan, penjualan, pelunasan. perlu di bersihkan semuanya. real lelang ada tanggal 16 Juli 2026, semua data sebelum tanggal 2026 bisa di hapus, kecuali data user. karena ada user daftar akun sebelum 16 juli 2026, sebelum lelang pertama


- Panel Admin menu hasil sesi, hilangkan kolom pembayaran dan aksi
- panel admin menu hasil sesi, tambahkan "jumlah unit" di bawah filter align right, jumlah list sesuai filter.
- panel admin, menu deposit, hapus tab Invoice penjualan.
- list verifikasi pelunasan ganti dengan pelunasan
- list verifikasi pelunasan, tambahkan kolom 
 
PANEL BIDDER
- 

- ingatkan cache apa saja yang akan disimpan diaplikasi
- saat jaringan terputus keluarkan pesan popup, ini sudah
- tambahkan fitur push notification firebase. apa saja yang mau dipush ditentukan ILS
- tambahkan fitur perubahan data realtime seperti data di lelang live untuk 
Deposit diverifikasi
Refund selesai
Pembayaran diterima
Persetujuan NIPL
Status dokumen

Beranda Landing web
- Lelang aktif, hapus link lihat semua
- katalog, hapus urutkan by no lot
halaman katalog
- sesi terdekat, pastikan datanya real, ambil data jadwal sesi lelang terdekat, jika ada live, tampilkan Live Lelang Sekarang.
halaman jadwal lelang
- tambahkan filter by date, by kategory
- 
FOOTER
- aktifkan link menu email
- aktifkan link menu telp (arahkan ke WA)
- menu aturan dan syarat bidding

- di mode mobile, tombol masuk/dashboard di header di perkecil
- di mode mobile, halaman katalog, di bagian Bawah ada tombol daftar sekarang dan tombol lihat lelang aktif, jadikan hanya 1 tombol : Ikut Lelang
- saat klik tombol lelang, arahkan ke halaman login
- di panel bidder, toggle untuk menu sidebar di pindah menggantikan toggle menu landing web
- di panel bidder, tombol dashbor di perkecil
- di panel bidder, hapus menu riwayat deposit dan refund dari sidebar

