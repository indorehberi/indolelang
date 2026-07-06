# Panduan Setup Cloudflare R2 untuk Indo-Lelang

Karena Anda akan mendeploy ke VPS dan khawatir dengan batasan storage (seperti 10GB), **Cloudflare R2** adalah solusi terbaik. 
- **Keuntungan:** Biaya egress (bandwidth keluar) **GRATIS** (berbeda dengan AWS S3 yang mahal saat file diakses).
- **Gratis 10GB/bulan:** Tier gratis Cloudflare R2 memberikan 10GB storage gratis setiap bulan.
- **Kapasitas 10GB:** Jika rata-rata foto terkompresi adalah 150KB - 300KB, dan 1 unit memiliki 5 foto (~1.5MB per unit), maka 10GB bisa menampung sekitar **6.500 unit kendaraan**.

## Langkah 1: Buat Bucket R2 di Cloudflare

1. Login ke [Dashboard Cloudflare](https://dash.cloudflare.com).
2. Di menu sebelah kiri, klik **R2** (atau **R2 Object Storage**).
   - *Catatan: Jika ini pertama kali, Anda mungkin diminta untuk memasukkan metode pembayaran (kartu kredit/debit) untuk mengaktifkan R2, tetapi Anda tidak akan ditagih selama pemakaian di bawah 10GB/bulan.*
3. Klik tombol **Create bucket**.
4. Masukkan nama bucket, misalnya: `indo-lelang-media`.
5. Biarkan lokasi default (Automatic) atau pilih **APAC (Asia Pacific)** agar lebih dekat dengan pengguna di Indonesia.
6. Klik **Create bucket**.

## Langkah 2: Buat API Tokens (Credentials)

1. Kembali ke halaman utama R2 (klik R2 di menu kiri).
2. Di sebelah kanan atas, cari dan klik **Manage R2 API Tokens**.
3. Klik tombol **Create API token**.
4. Isi detail berikut:
   - **Token name:** `Indo-Lelang VPS Token`
   - **Permissions:** Pilih **Object Read & Write** (Sangat Penting!).
   - **Specify bucket(s):** Pilih *Apply to specific buckets only* lalu centang `indo-lelang-media`.
   - **TTL:** Pilih *Forever* agar token tidak expired.
5. Klik **Create API Token**.
6. **SANGAT PENTING:** Anda akan melihat beberapa kredensial. **Copy semuanya dan simpan di Notepad Anda sekarang!** (Access Key ID, Secret Access Key, dan Endpoint URL). Anda tidak akan bisa melihat *Secret Access Key* lagi setelah halaman ditutup.

## Langkah 3: Setting Public URL (Custom Domain / r2.dev)

Agar foto bisa diakses publik (ditampilkan di website):
1. Masuk ke halaman bucket `indo-lelang-media` yang baru Anda buat.
2. Pindah ke tab **Settings**.
3. Scroll ke bagian **Public Access**.
4. Anda punya dua pilihan:
   - **Pilihan A (Cepat):** Klik **Allow Access** pada bagian `r2.dev subdomain`. Anda akan mendapatkan URL publik seperti `https://pub-xxxxxx.r2.dev`.
   - **Pilihan B (Profesional):** Di bagian *Custom Domains*, klik **Connect Domain**, lalu ketik misalnya `media.indo-lelang.com`. (Membutuhkan domain Anda dikelola oleh DNS Cloudflare).
5. Copy URL publik yang Anda pilih.

## Langkah 4: Update `.env` di Server Backend Anda

Setelah Anda mendapatkan kredensial di atas, buka file `.env` di aplikasi backend Anda (API), dan ubah bagian penyimpanan:

```env
# Aktifkan S3/R2
STORAGE_PROVIDER=s3

# Kredensial dari Langkah 2
AWS_REGION=auto
AWS_ACCESS_KEY_ID=masukkan_access_key_id_anda
AWS_SECRET_ACCESS_KEY=masukkan_secret_access_key_anda

# Endpoint URL (Format: https://<ACCOUNT_ID>.r2.cloudflarestorage.com)
AWS_S3_ENDPOINT=masukkan_endpoint_url_anda

# Nama Bucket (Langkah 1)
AWS_S3_BUCKET_NAME=indo-lelang-media

# Public URL (Langkah 3)
# Contoh jika pakai r2.dev: https://pub-1234567890.r2.dev
# Contoh jika pakai custom domain: https://media.indo-lelang.com
AWS_S3_PUBLIC_URL=masukkan_public_url_anda
```

---

### FAQ & Jawaban untuk Pertanyaan Anda

**1. "Bisakah unit yang terjual otomatis dihapus dari list dan data foto dihapus?"**
Ya, sangat bisa. Namun saran praktik terbaik di industri lelang (untuk keperluan audit, history transaksi, dan mencegah sengketa) adalah:
- **Jangan dihapus langsung saat terjual.**
- Ubah status menjadi "Arsip" atau "Terjual", sehingga hilang dari halaman publik, tapi admin tetap bisa melihat datanya.
- Anda bisa mengatur **Cron Job (Penjadwalan)** di server yang secara otomatis akan *hard-delete* data dan foto dari storage setelah lewat batas waktu tertentu (misal: 6 bulan atau 1 tahun setelah transaksi selesai). Ini menghemat storage tapi tetap aman secara hukum.

**2. "Satu unit beberapa foto, 10GB bisa tampung berapa?"**
Tergantung ukuran foto. Jika 1 unit ada 5 foto (1.5MB total), 10GB bisa menampung sekitar **6.500 unit kendaraan**. Ini lebih dari cukup untuk awal. Cloudflare R2 juga sangat murah ($0.015 per GB) jika Anda melewati batas gratis 10GB.

**3. "Apakah foto yang terupload otomatis terkompres?"**
**Ya, sudah di-setup.** Di sistem backend yang kita bangun (di `apps/api/src/lib/upload.ts`), kita menggunakan library `sharp`. 
Setiap foto yang diunggah akan otomatis di-resize (maksimal 1200px) dan dikompresi kualitasnya (80%) ke format JPEG/WebP sebelum disimpan ke server/Cloudflare. Foto 5MB dari HP akan otomatis menjadi sekitar 150KB - 250KB.
