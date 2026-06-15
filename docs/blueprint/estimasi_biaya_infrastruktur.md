# 💰 Rencana & Estimasi Biaya Infrastruktur Server & Pihak Ketiga (Third-Party)
### Platform Lelang Digital Indo-Lelang

Dokumen ini disusun sebagai panduan perencanaan anggaran untuk kebutuhan infrastruktur server (hosting) dan integrasi layanan pihak ketiga (*third-party API*) yang digunakan dalam siklus operasional Platform Lelang Digital Indo-Lelang.

---

## 1. Rencana Infrastruktur Server (Hosting)

Beban server lelang dibagi menjadi dua skenario pengembangan berdasarkan fase bisnis:

### Opsi A: Fase Awal (Go-Live & Uji Pasar) — Single Server Premium
Direkomendasikan untuk peluncuran awal guna meminimalkan biaya overhead operasional. Seluruh *service* (API Backend, WebSocket, Database Postgres, dan Redis) dijalankan di dalam satu server fisik/VM menggunakan Docker Compose.

*   **Spesifikasi:** 1 Unit VPS (4 vCPU, 8GB atau 16GB RAM, SSD Storage).
*   **Estimasi Kapasitas:** Mampu melayani **100 s.d. 200 bidder aktif** dalam satu sesi lelang secara bersamaan.
*   **Estimasi Biaya Bulanan:** **Rp 600.000 s.d. Rp 1.200.000 / bulan** (contoh: AWS Lightsail, DigitalOcean Premium Droplet, atau Biznet GIO).
*   **Keamanan Data:** Tim developer wajib menyetel backup database otomatis harian ke penyimpanan luar (seperti AWS S3 atau Cloudflare R2).

### Opsi B: Fase Lanjutan (Scale-up Enterprise) — Multi-Server (High Availability)
Wajib digunakan jika volume transaksi sudah tinggi, aset lelang bernilai miliaran rupiah, dan jumlah bidder aktif melebihi 300+ orang per sesi guna mencegah kegagalan sistem (*Single Point of Failure*).

| Peran Server | Jumlah Unit | Spesifikasi Teknis (Rekomendasi AWS / GCP) | Perkiraan Biaya (DO) | Perkiraan Biaya (AWS) | Fungsi Utama |
| :--- | :---: | :--- | :--- | :--- | :--- |
| **Load Balancer** | 1 | Managed Load Balancer (ALB) | Rp 180.000 | Rp 380.000 | Membagi rata lalu lintas dan mengalihkan traffic jika salah satu server down. |
| **App Server (API)** | 2 | 2 vCPU, 4GB RAM (e.g., EC2 `t3.medium`) | Rp 740.000 | Rp 770.000 | Memproses registrasi, kelola katalog, admin panel, eKYC, dan invoice. |
| **WebSocket Server** | 1 | 2 vCPU, 2GB RAM (e.g., EC2 `t3.small`) | Rp 180.000 | Rp 230.000 | Mengelola koneksi real-time penawaran harga dan input bid secara instan. |
| **Database Server** | 1 | 2 vCPU, 4GB RAM SSD (e.g., RDS PostgreSQL) | Rp 460.000 | Rp 1.230.000 | Penyimpanan data permanen (user, transaksi keuangan, data lot, bid resmi). |
| **Redis Cache** | 1 | 1 vCPU, 0.5GB RAM (e.g., ElastiCache) | Rp 230.000 | Rp 230.000 | Menyimpan session login, harga penawaran realtime, dan antrean data bid. |
| **Total Bulanan (Server)** | **5** | | **~Rp 1.790.000** | **~Rp 2.840.000** | *Di luar biaya transfer data (egress bandwidth).* |

---

## 2. Lisensi Toko Aplikasi (Mobile App Store)

Biaya administrasi yang wajib dibayarkan langsung ke pihak Google dan Apple agar aplikasi mobile **Indo-Lelang** (untuk Bidder & Provider) dapat diunduh secara resmi:

1.  **Google Play Developer Console (Android):**
    *   **Biaya:** **$25** (Satu kali bayar seumur hidup / *One-time payment*).
    *   **Rupiah:** ~Rp 400.000.
2.  **Apple Developer Program (iOS):**
    *   **Biaya:** **$99 / tahun** (Dibayar tahunan).
    *   **Rupiah:** ~Rp 1.600.000 / tahun.
    *   *Catatan:* Pendaftaran dengan nama badan hukum (PT) memerlukan nomor D-U-N-S (gratis).

---

## 3. Estimasi Layanan Pihak Ketiga (Third-Party APIs)

Biaya di bawah ini berbasis penggunaan (*Pay-as-you-go*) dan dapat berfluktuasi tergantung dari ramainya lalu lintas transaksi lelang Anda.

### A. Live Video Streaming (Agora.io)
Digunakan untuk fitur penyiaran langsung (*live streaming*) juru lelang dari studio ke aplikasi mobile bidder.
*   **Skema Biaya:**
    *   Host (Penyiar): ~$3.99 per 1.000 menit penayangan video HD.
    *   Audience (Penonton/Bidder): ~$0.99 per 1.000 menit penerimaan video HD.
*   **Simulasi Biaya (1 Sesi Lelang 2 Jam dengan 200 Penonton):**
    *   Host: 1 orang $\times$ 120 menit $\times$ $3.99/1K = $0.48 (~Rp 7.700).
    *   Audience: 200 orang $\times$ 120 menit $\times$ $0.99/1K = $23.76 (~Rp 380.000).
    *   *Total per sesi lelang:* **~Rp 387.700 / sesi**.
    *   Jika diadakan **10 sesi lelang per bulan**, total biaya Agora: **~Rp 3.877.000 / bulan**.
    *   *Catatan:* Agora memberikan kuota gratis 10.000 menit pertama setiap bulannya.

### B. eKYC / Verifikasi Identitas (Verihubs / Privy.id)
Berfungsi memeriksa kecocokan NIK, Foto KTP, dan biometrik wajah (selfie) pendaftar baru dengan database Dukcapil pusat demi menghindari penipuan.
*   **Skema Biaya:** Flat **Rp 5.000 s.d. Rp 15.000** per verifikasi sukses.
*   **Simulasi Biaya (200 Pendaftar Baru per Bulan):**
    *   200 verifikasi $\times$ Rp 10.000 (harga rata-rata) = **Rp 2.000.000 / bulan**.

### C. Payment Gateway (Midtrans / Xendit)
Digunakan untuk memproses pembayaran jaminan NIPL lelang dan pelunasan transaksi secara otomatis. Biaya dipotong langsung dari dana yang masuk.

*   **Virtual Account (VA BCA, Mandiri, BRI, BNI, Permata):** Flat **Rp 2.000 - Rp 4.000** per transaksi sukses.
*   **QRIS (Gopay, OVO, ShopeePay):** **0.7%** dari nominal transaksi.
*   **Pencairan Dana (Disbursement API):** Transfer komisi lelang ke mitra/provider aset dikenakan biaya flat **Rp 5.000** per transfer sukses.

### D. API Komunikasi & Transaksional (SMS, WhatsApp, Email, Maps)

1.  **SMS OTP (Twilio / Vonage):**
    *   **Biaya:** **~Rp 120 / SMS**.
    *   **Penggunaan:** Hanya dikirimkan saat user baru melakukan registrasi nomor HP dan verifikasi krusial lainnya.
2.  **WhatsApp Notification (Fonnte / Qontak):**
    *   **Biaya:** **Rp 150.000 - Rp 350.000 / bulan** (biaya berlangganan server/API).
    *   **Penggunaan:** Mengirim pesan otomatis berupa konfirmasi NIPL aktif, pemberitahuan pemenang lot lelang, link invoice, dsb.
3.  **Email Transaksional (SendGrid / Mailgun):**
    *   **Biaya:** **~$15 - $35 / bulan** (Rp 240.000 - Rp 560.000).
    *   **Penggunaan:** Mengirimkan invoice resmi, dokumen Surat Jalan, dan BAST Digital berformat PDF secara instan ke email pemenang.
4.  **Google Maps API:**
    *   **Biaya:** **Gratis** (Google memberikan kredit gratis senilai **$200 / bulan** yang mencukupi untuk lelang skala menengah).
    *   **Penggunaan:** Menampilkan peta lokasi fisik lot barang dan lokasi kantor cabang balai lelang.
5.  **Push Notification (Firebase FCM):**
    *   **Biaya:** **Gratis (100% Free)**.
    *   **Penggunaan:** Mengirim notifikasi instan langsung ke HP bidder secara real-time.

---

## 4. Rangkuman Proyeksi Anggaran Bulanan (Operasional Sedang)

*Asumsi operasional sedang: 10 sesi lelang/bulan, 200 penonton live, dan 200 pendaftar baru per bulan.*

| Kategori Pengeluaran | Opsi Fase Awal (Single Server) | Opsi Fase Lanjutan (Multi-Server - AWS) | Sifat Biaya |
| :--- | :--- | :--- | :--- |
| **Infrastruktur Server** | Rp 1.000.000 | Rp 2.840.000 | Bulanan |
| **Agora Video Streaming** | Rp 3.877.000 | Rp 3.877.000 | Berbasis Pemakaian |
| **Verifikasi eKYC Pendaftar** | Rp 2.000.000 | Rp 2.000.000 | Berbasis Pemakaian |
| **API WA, SMS, & Email** | Rp 500.000 | Rp 500.000 | Bulanan |
| **Lisensi Apple & Google Play Store** | Rp 135.000 | Rp 135.000 | Tahunan (Rata-rata/bulan) |
| **Domain & SSL** | Rp 25.000 | Rp 25.000 | Tahunan (Rata-rata/bulan) |
| **ESTIMASI TOTAL BULANAN** | **~Rp 7.537.000 / bulan** | **~Rp 9.377.000 / bulan** | *Di luar potongan transaksi Payment Gateway.* |

> [!TIP]
> Biaya **Agora Video Streaming** dan **eKYC** bersifat sangat elastis. Jika jumlah lelang lebih sedikit atau pendaftar baru berkurang pada bulan tertentu, maka biaya tersebut akan menurun secara otomatis.
