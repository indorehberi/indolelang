kamu sekarang konsultan developer saya sekarang.

saya butuh arahan dan pembuatan coding untuk project aplikasi ini agar bisa menjadi aplikasi sesuai standar enterprise.



ini adalah aplikasi lelang.

di awal sudah ada panduan blueprint dan lain-lain.

tapi ada perubahan-perubahan yang harus dilakukan sesuai permintaan klien.

saya ingin setelah ini pekerjaan menjadi lebih terstruktur.

target awal adalah membuat aplikasi berjalan dengan fitur yang wajib ada.

karena saya terkendala masalah waktu untuk launching.

fitur yang memerlukan pihak ketiga bisa dibuat belakangan.



saat ini aplikasi sudah online

www.bidku.co.id

ada github indorehberi/indolelang

sebelum melanjutkan bersama kamu saya ingin kamu



analisa dulu keadaan projeck sekarang

sejauh mana project dibuat

apa yang sudah dibuat dan apa yang belum

apa yang sudah dibuat tapi belum sempurna

apa yang sudah dibuat tapi masih punya peluang error dan bug

sejauh mana project berubah dari rencana awal

apakah file .md untuk skill masih relevan, masih sesuai, apakah perlu direvisi sesuai kebutuhan sekarang

apakah persiapan scalable nya sudah sesuai



alur yang akan dipakai sekarang

**REGULER USER**

\- dapat register, dan login dengan credential yang dia buat

\- atau dapat login dengan google

\- di dalam panel buatkan pilihan mendaftar sebagai bidder atau provider



**BIDDER**

\- saat regular user mendaftar sebagai bidder arahkan ke form profil bidder

\- sebelumnya form profil dan form verifikasi KYC terpisah, sekarang satukan kedua form

\- setelah itu tampilkan info status verifikasi

\- pengajuan menjadi bidder terkirim ke admin

\- sebelumnya di panel admin ada menu bidder dan menu antrean verifikasi KYC

\- sekarang hilangkan menu antrean verivikasi KYC

\- sebagai gantinya user yang mengantri verivikasi KYC masuk ke list bidder di halaman bidder dengan status antri.

\- hanya user yang mengajukan sebagai bidder yang masuk list ini. user biasa tidak dimasukkan. (sebelumnya semua dimasukkan)

\- admin cek data bidder, jika sesuai admin approve pengajuan menjadi bidder

\- jika data tidak sesuai admin bisa reject pengajuan menjadi bidder, user di keluarkan dari list bidder, tambahkan keterangan alasan reject.

\- tambahkan notifikasi di panel user apakah dia di approve atau tidak. jika tidak tampilkan alasannya.

\- status bidder berubah menjadi aktif

\- urutkan list bidder pertama dari satus antri, lalu status aktif

\- tambahkan fitur search bider, tambahkan filter by status

\- tambahkan fitur tambah bidder. admin bisa menambahkan bidder, dengan mengisi form pengajuan bidder.

\- bidder aktif bisa beli NIPL dan ikut lelang

\- sebelumnya di panel bidder ada fitur pengajuan menjadi provider. biarkan tetap ada. prosesnya diarahkan ke form provider.

\- jika memungkinkan, jika ada isian data yang sama, form otomatis terisi datanya dari data yang bidder isi sewaktu mendaftar sebagai bidder.

\- jika sudah menjadi provider bidder tidak bisa ikut lelang sebagai bidder lagi.

\- tambahkan pesan tersebut saat bidder mengajukan sebagai provider.



**PROVIDER**

\- saat user regular mendaftar sebagai provider, arahkan ke form profil provider

\- sebelumnya form profil dan form verifikasi KYC terpisah, sekarang satukan kedua form

\- setelah itu tampilkan info status verifikasi

\- pengajuan menjadi provider terkirim ke admin

\- sebelumnya di panel admin ada menu provider dan menu antrean verifikasi KYC

\- sekarang hilangkan menu antrean verivikasi KYC

\- sebagai gantinya user yang mengantri verivikasi KYC masuk ke list provider di halaman provider dengan status antri.

\- hanya user yang mengajukan sebagai provider yang masuk list ini. user biasa tidak dimasukkan. 

\- admin cek data provider, jika sesuai admin approve pengajuan menjadi provider

\- jika data tidak sesuai admin bisa reject pengajuan menjadi provider, user di keluarkan dari list provider, tambahkan keterangan alasan reject.

\- tambahkan notifikasi di panel user apakah dia di approve atau tidak. jika tidak tampilkan alasannya.

\- status provider berubah menjadi aktif

\- urutkan list provider pertama dari satus antri, lalu status aktif

\- tambahkan fitur search provider, tambahkan filter by status



**PENGAJUAN BARANG TITIP JUAL**

\- hanya provider dan admin yang bisa mengajukan titip jual

\- provider mengajukan tiap unit yang mau dilelang dengan form

\- buatkan list pengajuan titip jual di panel provider, tambahkan status : menunggu, disetujui, ditolak, terjual, dikembalikan. Tambahkan aksi hapus, edit, ajukan Kembali, dikembalikan

\- hanya list dengan status ditolak yang bisa diedit, hanya list dengan status ditolak yang bisa dihapus.

\- tambahkan search dan filter by status, by date, by pool 

**DI PANEL ADMIN**

\- buatkan list daftar barang. berisi pengajuan unit dari provider. tambahkan status menunggu, di setujui, di tolak, tambahkan aksi inspeksi, 
- saat klik proses inspeksi ditampilkan form inspeksi dengan tombol setujui dan tolak. form berisi form isian pengajuan titip jual. data otomatis sudah terisi. tambahkan isian berikut

* Tanggal Inspeksi \*
* PIC Inspeksi \*
* Grade Interior \* 
* Grade Exterior \* 
* Grade Mesin \* 
* Dokumen Inspeksi (upload file) tidak wajib isi

\- tambahkan search dan filter by status, by by date, by pool
- jika ditolak keluarkan dari list. kirim notifikasi kenapa ditolak, tambahkan isian alasan ditolak di form inspeksi
- jika disetujui keluarkan dari list, limpahkan data ke list 2. Aset Siap Dilelang (Approved) di halaman admin/lots/planning



**PEMBUATAN SESI (sudah ada)**

\- pastikan ada aksi tambah ke lot dari list 2. Aset Siap Dilelang (Approved) ke list Daftar Lot Terdaftar (Sesi Terpilih)
- saat tambah ke lot,   buatkan isian no lot. tambahkan opsi manual atau otomatis, jika manual admin isi not lot, jika otomatis no lot terisi berurutan, tidak termasuk no yang sudah diisi manual oleh admin
- setelah tambah ke lot limpahkan ke list Daftar Lot Terdaftar (Sesi Terpilih), keluarkan dari list Daftar Lot Terdaftar (Sesi Terpilih)



**PROSES LELANG/Ruang Kontrol (Sudah ada)**

\- tambahkan tombol mulai lelang, untuk memulai sesi lelang manual
- tambahkan stop lelang, untuk mengakiri sesi lelang manual
- tambahkan tombol lot berikutnya untuk memulai lelang lot berikutnya secara manual
- buat list arsip lelang untuk list sesi lelang yang sudah lewat berisi semua lot yang dilelang disesi terbut dengan status menang atau tidak
- semua unit yang dimenangkan datanya masuk keranjang checkout masing-masing pemenang, pastikan tidak salah masuk ke bidder yang lain



**HASIL LELANG**

\- limpahkan semua data unit yang sudah melalui lelang ke list rekapitulasi hasil lelang, dengan status terjual, tidak terjual, terbayar, tidak terbayar, tambahkan aksi sudah dibayar

\- tambahkan search, filter by status
- saat klik sudah dibayar, tampilkan Form BAPL dengan isian di PDF



**Form BAPL

BERITA ACARA PEMENANG LELANG**

Nomor :\[terisi otomatis mulai dari angka 1] /BAPL//2026
Pada hari ini, \[day] tanggal \[date, Bahasa indonesia] bertempat

di \[kota cabang]. Saya \[CARI AZHARI, S.H.] selaku Pejabat Lelang Kelas \[II] wilayah DKI

Jakarta], Direktorat Jenderal Kekayaan Negara telah menunjuk dan menetapkan :

NIPL : \[no nipl pemilik pemenang lelang]

Sebagai pemenang lelang Nomor Lot : \[no lot]

Jenis Barang : \[kategori lelang]

No Polisi : \[No. Polisi] Tahun : \[tahun]

Merk/Type : \[merk] \[tipe] SE Warna : \[warna]

Dengan penawaran tertinggi sebagai berikut :

Harga Terbentuk Lelang : \[Harga terbentuk]

Biaya Administrasi : \[biaya admin]

Biaya PMK : PMK41

Sisa Pelunasan : \[total tagihan checkout]



Bahwa pelunasan harga lelang harus dibayar selambat-lambatnya 3 (tiga) hari kerja setelah tanggal

pelaksanaan lelang ke Rekening PT. INDO LELANG SEJAHTERA di BCA Mutiara Taman Palem

Jakarta No. Rekening : 7015-886-161. Apabila batas waktu pembayaran tersebut dilampaui, maka

pemenang lelang dianggap mengundurkan diri. Uang jaminan dan semua pembayaran yang telah

dilakukan akan menjadi hangus dan pemenang yang bersangkutan akan dimasukkan dalam Daftar

Hitam Kantor Pelayanan Kekayaan Negara dan Lelang di seluruh Indonesia.



Ditetapkan di : JAKARTA

Tanggal : 29 Mei 2024



Pemenang Lelang \[bidder pemenang lelang]

Pejabat Penjual \[operator lelang]

Pejabatan Lelang Kelas II \[pejabat lelang]



tambahkan isian untuk 
- Pejabat Penjual 

\- Pejabatan Lelang Kelas II 

di halaman pengaturan platform



**DEPOSIT**

pastikan list menampilkan data real, sambungkan dengan data lain sesuai dengan logicnya



**REFERRAL**

tambahkan toggle menu referral di halaman pengaturan platform



PENGATURAN PLATFORM

kelompokkan sesuai bagiannya, bedakan warna latar, pakai warna soft
atur agar stylenya seperti form lainnya



**FORM TITIP JUAL**



Penitip \* 

status \* (dropdown in pool dan out pool)

cabang \* (dropdown tampilkan cabang yang ada)

Harga Dasar \*

Catatan \*

**DATA KENDARAAN**

Kategori \* (dropdown KATEGORI LELANG YANG DIAKTIFKAN ADMIN)

Merek \* (dropdown)

Tipe \* (dropdown)

Warna \* (dropdown)

Bahan Bakar \* (dropdown)

Transmisi \* (dropdown)

Jenis \* (dropdown)

Tahun Buat \* 

No Polisi \*

No Bpkb \*

No Rangka \*

No Mesin \*

CC \*

Odometer \*

Foto Depan \* (upload file)

Foto Belakang \* (upload file)

Foto Samping Kanan \* (upload file)

Foto Samping Kiri \* (upload file)

Foto Mesin \* (upload file)

Foto Interior \* (upload file)

**DATA DOKUMEN**

Tgl STNK \*

Tgl Pajak STNK \*

Tgl Keur \*

Status Stnk \* 

Status Bpkb \* 

Status Faktur \* 

Status Kwitansi \* 

Status Form A \* 

Status Copy Ktp \* 

Status Keur \* 

Status Sph \* 

Foto STNK \* (upload file)



DATA PILIHAN DROPDOWN

* merk mobil dan tipe : file tipe.csv
* transmisi : manual dan matic
* jenis kendaraan : komersial dan passenger
* Bahan bakar : Bensin, solar, listrik, hybrid
* cara bayar : cash, transfer, CC, EDC
* pekerjaan : ASN, Pegawai swasta, wiraswasta
* warna kendaraan : SILVER, BIRU, HIJAU, KUNING EMAS, ABU-ABU, HITAM, MERAH, PUTIH











**BIDDER**

Hilangkan Menu Watch list

hilangkan fitur watch list jika masih ada dibagian lain



PROFIL

Buatkan menu profil



**RUANG LELANG LIVE**

Tampilkan kargiatan lelang yang sedang berlangsung disini

lihat halaman C:/Users/han/Herd/indo-lelang/wireframe/bidder/b8-bidding-stream.html sebagai acuan

buat dua kolom

**kolom kiri** bersi

Harga Penawaran Tertinggi

\[Harga terkini]

\[bidder panawar tertinggi saat ini]

countdown : \[angka mulai] (tambahkan isiannya di halaman pengaturan platform)

BID \[+ Rp1.000.000] BID \[+ Rp2.000.000] BID \[+ Rp3.000.000] (tambahkan isian nya di halaman pengaturan platform)

**kolom kanan** berisi data unit kendaraan



**KERANJANG CHECKOUT (sudah ada)**

\- pastingan perhitungannya sudah berjalan

\- tambahkan instruksi pembayaran, sama dengan instruksi pembayaran di pembelian NIPL, pastikan ada tombol upload bukti transfer, dan tombol kirim

* satu keranjang checkout adalah untuk lelang satu hari
* jika besoknya menang lagi, dibuatkan tagihannya lagi
* buatkan list tagihan, dengan status, menunggu, expired, sudah dibayar
* batas pelunasan adalah 3 hari, jika lebih dari tiga hari belum dibayar, otomatis status menjadi expired,





**BELI DEPOSIT NIPL**

\- Saat ini sudah ada metode pembayaran untuk pembayaran otomatis menggunakan payment gateway

\- jika pembayaran dengan metode manual, ganti metode pembayaran dengan transfer ke bank yang di setting di halaman pengaturan platform



**DEPOSIT DAN REFUND**

berisi list NIPL yang pernah dibeli dengan statusnya, actif, terpakai, proses refund, berhasil refund. tambahkan aksi, ajukan refund



**PROFIL**

Berisi halaman profil yang bisa di untuk khusus untuk ktp, NIK dan foto selfi tidak bisa diedit























