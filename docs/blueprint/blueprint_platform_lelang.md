# 🏛️ BLUEPRINT TEKNIS — Platform Lelang Digital Indo-Lelang
### Dokumen Serah Terima ke Tim Developer
**Versi:** 1.0 | **Tanggal:** Juni 2026 | **Status:** FINAL — Siap Pengembangan

---

> [!IMPORTANT]
> Dokumen ini adalah **panduan teknis lengkap** yang mencakup seluruh arsitektur, fitur, alur bisnis, spesifikasi API, konfigurasi, dan rencana pengembangan Platform Lelang Digital Indo-Lelang. Baca dokumen ini secara menyeluruh sebelum memulai development.

---

## 📋 Daftar Isi

1. [Ringkasan Eksekutif](#1-ringkasan-eksekutif)
2. [Arsitektur Sistem](#2-arsitektur-sistem)
3. [Role & Hierarki Pengguna](#3-role--hierarki-pengguna)
4. [Pemetaan Halaman & Fitur](#4-pemetaan-halaman--fitur)
5. [Alur Bisnis Utama](#5-alur-bisnis-utama)
6. [Spesifikasi Fitur Advance](#6-spesifikasi-fitur-advance)
7. [Integrasi Pihak Ketiga](#7-integrasi-pihak-ketiga)
8. [Database Schema (ERD Ringkasan)](#8-database-schema-erd-ringkasan)
9. [API Endpoint Reference](#9-api-endpoint-reference)
10. [Fitur Toggle & Konfigurasi Admin](#10-fitur-toggle--konfigurasi-admin)
11. [Keamanan & Compliance](#11-keamanan--compliance)
12. [Infrastruktur & Deployment](#12-infrastruktur--deployment)
13. [Estimasi Timeline Pengembangan](#13-estimasi-timeline-pengembangan)
14. [Referensi Wireframe](#14-referensi-wireframe)

---

## 1. Ringkasan Eksekutif

### Tujuan Platform
Indo-Lelang adalah platform lelang digital terintegrasi yang memfasilitasi proses jual-beli aset (kendaraan, properti, alat berat) melalui mekanisme penawaran online yang transparan, aman, dan efisien. Platform menghubungkan tiga ekosistem utama:

- **Bidder (Peserta Lelang):** Individu/perusahaan yang mengikuti proses bidding
- **Provider (Pemilik Aset):** Perusahaan/individu yang menitipkan aset untuk dilelang
- **Admin (Balai Lelang):** Operator platform yang mengelola seluruh siklus lelang

### Scope Pengembangan (Full Enterprise)
| Layer | Teknologi | Platform |
|---|---|---|
| Mobile App (Bidder & Provider) | Flutter | iOS + Android |
| Web App (Admin Panel) | React.js / Next.js | Chrome, Safari, Firefox |
| Backend API | Node.js + Express / Laravel | REST + WebSocket |
| Database | PostgreSQL (primary) + Redis (cache/realtime) | Cloud |
| Storage | AWS S3 / Google Cloud Storage | Cloud |
| Real-time | Socket.io / Pusher | WebSocket |
| Streaming | Agora.io / Zoom SDK | WebRTC |

---

## 2. Arsitektur Sistem

```
┌─────────────────────────────────────────────────────────────────┐
│                     KLIEN (Frontend Layer)                       │
│  ┌───────────────┐  ┌──────────────┐  ┌────────────────────┐   │
│  │  Mobile App   │  │  Web Admin   │  │    Public Web      │   │
│  │  (Flutter)    │  │  (React.js)  │  │  (Next.js / SSR)   │   │
│  │  iOS/Android  │  │  Admin Panel │  │  SEO & Landing     │   │
│  └───────┬───────┘  └──────┬───────┘  └─────────┬──────────┘   │
└──────────┼─────────────────┼────────────────────┼──────────────┘
           │                 │                    │
           ▼                 ▼                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                     API GATEWAY (Kong / Nginx)                   │
│  Rate Limiting | JWT Auth | SSL/TLS | Load Balancing            │
└────────────────────────────┬────────────────────────────────────┘
                             │
           ┌─────────────────┴──────────────────┐
           ▼                                    ▼
┌─────────────────────┐             ┌──────────────────────┐
│   CORE API SERVICE  │             │  REALTIME SERVICE    │
│   (Node.js/Laravel) │             │  (Socket.io / WS)    │
│                     │             │  - Live Bidding      │
│  - Auth & Identity  │             │  - Price Updates     │
│  - Auction Engine   │             │  - Lot Transitions   │
│  - Payment Logic    │             │  - Notifications     │
│  - KYC Processing   │             └──────────┬───────────┘
│  - Document Gen     │                        │
└──────────┬──────────┘                        │
           │                                   │
     ┌─────┴──────┐                            │
     ▼            ▼                            ▼
┌─────────┐  ┌──────────┐           ┌──────────────────────┐
│PostgreSQL│  │  Redis   │           │  MESSAGE QUEUE       │
│(Primary) │  │(Cache &  │           │  (RabbitMQ / SQS)    │
│          │  │ Sessions)│           │  - Email/SMS Jobs    │
└─────────┘  └──────────┘           │  - Notif Jobs        │
                                    └──────────────────────┘
                                             │
┌────────────────────────────────────────────┼─────────────────────┐
│                   THIRD-PARTY INTEGRATIONS  │                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐  ┌┴─────────┐ ┌──────┐ │
│  │Midtrans/ │ │ Privy.ID/ │ │  Agora   │  │ Firebase  │ │ AWS  │ │
│  │  Xendit  │ │ Verihubs  │ │   SDK    │  │   FCM     │ │  S3  │ │
│  │(Payment) │ │  (eKYC)   │ │(Stream)  │  │  (Push)   │ │(Doc) │ │
│  └──────────┘ └──────────┘ └──────────┘  └──────────┘ └──────┘ │
└────────────────────────────────────────────────────────────────────┘
```

---

## 3. Role & Hierarki Pengguna

```
SUPERADMIN (Platform Owner)
  └── dapat mengelola semua tenant/klien, billing, dan konfigurasi global

ADMIN BALAI LELANG (Tenant Admin)
  ├── Manajemen Cabang (Multi-Branch)
  ├── Manajemen Staf/Operator
  ├── Konfigurasi Platform (Feature Toggle, API Keys)
  └── Akses penuh ke semua data tenant

OPERATOR LELANG (Staff)
  ├── Menjalankan Sesi Lelang (Ruang Kontrol)
  ├── Verifikasi KYC Manual
  └── Persetujuan Transaksi

PROVIDER (Mitra Penyedia Aset)
  ├── Pengajuan & Manajemen Barang
  ├── Monitoring Lelang Real-time
  └── Settlement & Pencairan Dana

BIDDER (Peserta Lelang)
  ├── Registrasi & Verifikasi eKYC
  ├── Deposit NIPL / Jaminan
  ├── Partisipasi Bidding (Online/Mobile)
  └── Pengambilan Barang & Dokumen
```

---

## 4. Pemetaan Halaman & Fitur

### 4.1 Area Publik (Public Website)

| ID | Halaman | Deskripsi | Prioritas |
|---|---|---|---|
| P1 | Homepage | Landing page, hero, statistik, kategori, featured lots | 🔴 P1 |
| P2 | Katalog Lelang | Browse semua lot dengan filter kategori, lokasi, status | 🔴 P1 |
| P3 | Detail Lot | Foto galeri, spec, history bid, countdown, tombol Bid | 🔴 P1 |
| P4 | Jadwal Sesi | Kalender sesi mendatang per cabang | 🟡 P2 |
| P5 | Tentang Kami | Profil perusahaan, tim, legalitas | 🟢 P3 |
| P6 | Syarat & Ketentuan | ToS, Kebijakan Privasi, Aturan Bidding | 🔴 P1 |
| P7 | FAQ | Pertanyaan umum terstruktur | 🟡 P2 |
| P8 | Kontak | Form kontak, alamat cabang, peta | 🟢 P3 |

### 4.2 Area Autentikasi

| ID | Halaman | Deskripsi | Prioritas |
|---|---|---|---|
| A1 | Login | Email/password + OTP | 🔴 P1 |
| A2 | Registrasi Bidder | Form data pribadi + upload dokumen awal | 🔴 P1 |
| A3 | Registrasi Provider | Form data perusahaan + NPWP | 🔴 P1 |
| A4 | Lupa Password | Reset via email/SMS | 🔴 P1 |
| A5 | Verifikasi OTP | Kode 6 digit via SMS/Email | 🔴 P1 |
| A6 | eKYC Upload | Upload KTP, Selfie, selfie dengan KTP | 🔴 P1 |
| A7 | Status Verifikasi | Tracking status pendaftaran & KYC | 🔴 P1 |

### 4.3 Panel Bidder

| ID | Halaman | Deskripsi | Fitur Kunci | Prioritas |
|---|---|---|---|---|
| B1 | Dashboard | KPI personal, saldo deposit, NIPL aktif, lot favorit | localStorage sync | 🔴 P1 |
| B2 | Profil & Pengaturan | Data pribadi, ganti password, preferensi notifikasi | — | 🔴 P1 |
| B3 | Katalog | Browse + bookmark lot yang diminati | — | 🔴 P1 |
| B5 | Watchlist | Lot yang di-bookmark, price alert | — | 🟡 P2 |
| B6 | Deposit NIPL | Pilih metode VA (BCA/Mandiri/BNI), QRIS, kalkulasi otomatis | VA Generator, QRIS | 🔴 P1 |
| B7 | Bidding Room | Live bidding interface, penawaran realtime, countdown, streaming | WebSocket, Stream | 🔴 P1 |
| B10 | Pelunasan Invoice | Detail tagihan pemenang, upload bukti bayar | PDF Invoice | 🔴 P1 |
| B11 | Pengambilan Barang | Scheduling pengambilan, download BAST & Surat Jalan PDF | PDF Generator | 🔴 P1 |
| B12 | Riwayat Lelang | Semua sesi yang diikuti, status menang/kalah | — | 🟡 P2 |
| B13 | Riwayat Transaksi | Semua transaksi keuangan (deposit, pelunasan, refund) | — | 🟡 P2 |
| B14 | Notifikasi | Pusat notifikasi, marking read, filter | FCM Push | 🟡 P2 |

### 4.4 Panel Provider

| ID | Halaman | Deskripsi | Prioritas |
|---|---|---|---|
| S1 | Dashboard | Ringkasan aset, GMV, pencairan pending | 🔴 P1 |
| S2 | Profil Perusahaan | Data perusahaan, rekening bank, dokumen legal | 🔴 P1 |
| S3 | Ajukan Barang Baru | Form multi-step: data aset, foto, dokumen, harga | 🔴 P1 |
| S5 | Daftar Barang | Semua aset yang pernah diajukan + status | 🔴 P1 |
| S7 | Monitoring Lelang | Tracking real-time lot yang sedang dilelang | 🔴 P1 |
| S8 | Settlement | Detail settlement per lot yang terjual | 🟡 P2 |
| S9 | Riwayat Penjualan | Semua lot yang telah selesai | 🟡 P2 |
| S10 | Pencairan Dana | Request pencairan ke rekening | 🔴 P1 |
| S11 | Pengembalian | Aset yang tidak laku, proses klaim kembali | 🟡 P2 |
| S12 | Notifikasi | Notifikasi perubahan status aset | 🟡 P2 |

### 4.5 Panel Admin (Balai Lelang)

| ID | Halaman | Deskripsi | Prioritas |
|---|---|---|---|
| AD1 | Dashboard Utama | KPI platform: GMV, bidder aktif, lot terjual, konversi | 🔴 P1 |
| AD2 | Manajemen Bidder | CRUD bidder, filter status KYC, lihat detail | 🔴 P1 |
| AD3 | Manajemen Provider | CRUD provider, approval, lihat aset titipan | 🔴 P1 |
| AD4 | Admin/Operator | Manajemen staf operator beserta role & permission | 🟡 P2 |
| AD6 | Verifikasi KYC | Antrian review dokumen KTP + selfie, approve/reject | 🔴 P1 |
| AD7 | Daftar Barang | Semua aset di sistem dengan status | 🔴 P1 |
| AD9 | Approval Barang | Review & approve/reject pengajuan aset dari provider | 🔴 P1 |
| AD10 | Penyusunan Lot | Drag-drop lot ke sesi lelang | 🔴 P1 |
| AD11 | Daftar Sesi | CRUD sesi lelang, jadwal, lokasi cabang | 🔴 P1 |
| AD13 | Ruang Kontrol | **Live control panel**: navigasi lot, hammer price, timer | 🔴 P1 |
| AD14 | Hasil Sesi | Ringkasan hasil lelang per sesi | 🟡 P2 |
| AD15 | Deposit Management | Monitor semua deposit bidder | 🟡 P2 |
| AD16 | Pelunasan | Verifikasi pembayaran pelunasan | 🔴 P1 |
| AD17 | Pencairan | Approve pencairan dana provider | 🔴 P1 |
| AD18 | Refund | Proses refund deposit bidder yang kalah | 🔴 P1 |
| AD21 | Dashboard Analitik | Grafik GMV, trend per kategori, performa cabang | 🟡 P2 |
| AD23 | Campaign / Notifikasi | Broadcast push notification & email ke bidder | 🟢 P3 |
| AD25 | **Pengaturan Platform** | Feature toggle, API keys, aturan bisnis, multi-branch | 🔴 P1 |
| AD26 | Audit Trail | Log semua aksi staf (immutable) | 🟡 P2 |
| AD27 | Manajemen Cabang | CRUD cabang, assign operator, setting per cabang | 🟡 P2 |

---

## 5. Alur Bisnis Utama

### 5.1 Alur Registrasi & Verifikasi Bidder

```
[Daftar] → Input Data Pribadi → Upload KTP & Selfie
    → [Jika eKYC Auto] → SDK Verihubs/Privy → Cek Liveness + Dukcapil → Approved (3 detik)
    → [Jika eKYC Manual] → Antrian Admin → Review Dokumen → Approve/Reject
    → Akun Aktif → Bisa Top-Up Deposit
```

### 5.2 Alur Deposit NIPL (Nomor Induk Peserta Lelang)

```
[Pilih Sesi Lelang] → [Beli Deposit/NIPL]
    → Pilih Metode (VA BCA | VA Mandiri | QRIS)
    → Generate VA Number Unik (Format: 7008-XXXX-XXXX)
    → Bidder Transfer ke Nomor VA
    → Webhook Payment Gateway → Update Status Deposit
    → NIPL Aktif + Saldo Bertambah
    → Notifikasi ke Bidder (Push + Email)
```

### 5.3 Alur Sesi Lelang Live

```
[Admin Buat Sesi] → Assign Lot → Set Jadwal & Cabang
    → [H-1] Sistem kirim notifikasi reminder ke peserta NIPL
    → [Hari H] Admin buka sesi → Activate Lot 1
        ┌─────────────────────────────────────────┐
        │         SIKLUS PER LOT                  │
        │  Admin aktifkan lot → Timer countdown   │
        │  Bidder submit penawaran (realtime WS)  │
        │  Harga naik sesuai kelipatan            │
        │  [Anti-Sniping] Jika bid < 30 detik     │
        │    terakhir → timer +2 menit            │
        │  Timer habis → HAMMER! Pemenang ditentukan│
        │  → Pemenang: tampil Invoice             │
        │  → Peserta lain: "Lot ini dimenangkan   │
        │    oleh Peserta #XXX dengan harga Rp X" │
        │  → Admin aktifkan Lot berikutnya        │
        └─────────────────────────────────────────┘
    → Sesi selesai → Generate Hasil Sesi
    → Trigger Refund otomatis untuk yang kalah
```

### 5.4 Alur Pembayaran & Pelunasan

```
[Pemenang Dapat Invoice] → Pelunasan dalam 3 hari kerja
    → Harga Hammer + Komisi (3%) + PPN (1.1%) + Biaya Lain
    → Pilih metode bayar → Transfer ke VA Pelunasan
    → Admin verifikasi → Status: LUNAS
    → Trigger: Surat Jalan + BAST Digital (PDF)
    → Bidder jadwalkan pengambilan
```

### 5.5 Alur Pengambilan & Dokumen

```
[Invoice LUNAS] → Halaman Pengambilan Barang
    → Pilih Tanggal & Slot Pengambilan
    → Download: Surat Jalan (PDF)
    → Admin tandai "Barang Diserahkan"
    → Generate & Download: BAST Digital (PDF dengan QR Code)
    → Data tersimpan sebagai bukti serah-terima digital
```

### 5.6 Alur Provider Settlement

```
[Lot Terjual] → Settlement Period (T+3 hari)
    → Gross Harga Terjual - Komisi Balai Lelang - Biaya Titip
    → Net Amount Tertampil di Dashboard Provider
    → Provider Request Pencairan
    → Admin Approve → Transfer ke Rekening Provider
    → Notifikasi Transfer + Bukti Rekap Settlement
```

---

## 6. Spesifikasi Fitur Advance

### 6.1 Live Bidding Engine (Core)

**Teknologi:** WebSocket (Socket.io) + Redis Pub/Sub

```
Events WebSocket:
  CLIENT → SERVER:
    - bid:submit { lot_id, session_id, user_id, amount }
    - bid:watch { lot_id }
    - bid:unwatch { lot_id }

  SERVER → CLIENT (broadcast ke semua peserta lot):
    - bid:update { lot_id, current_price, bidder_id, time_remaining }
    - bid:winner { lot_id, winner_masked_id, final_price }
    - lot:activated { lot_id, lot_data, start_time }
    - lot:closed { lot_id, result }
    - session:ended { session_id }

Anti-Sniping Logic (Backend):
  IF (time_remaining < 30s) AND (new_bid_received):
    THEN extend timer by +120s (max 3x extension per lot)
```

**Kelipatan Penawaran:**
| Range Harga | Kelipatan Min |
|---|---|
| < Rp 10 juta | Rp 500.000 |
| Rp 10-50 juta | Rp 1.000.000 |
| Rp 50-200 juta | Rp 2.500.000 |
| > Rp 200 juta | Rp 5.000.000 |

### 6.2 Live Streaming (Opsional — Feature Toggle)

**Teknologi:** Agora.io RTC SDK / Zoom SDK

```
Alur Streaming:
  Admin Operator → OBS / Kamera → Agora SDK (Host)
                                       ↓
                               CDN Agora / Zoom
                                       ↓
  Bidder Mobile App ← Agora SDK (Audience) [Max 1jt viewers]

Integrasi dengan Bidding:
  - Overlay harga terkini di atas video
  - Notifikasi perubahan lot di stream
  - Chat realtime per sesi (optional)
```

**Estimasi Biaya:** Agora.io ~$3.99/1.000 menit host, $0.99/1.000 menit audience

### 6.3 eKYC Otomatis (Opsional — Feature Toggle)

**Provider:** Verihubs atau Privy.ID

```
Alur Teknis:
  1. Bidder upload foto KTP (capture via SDK)
  2. Bidder ambil selfie live (liveness detection)
  3. SDK extract data KTP (OCR)
  4. Match KTP vs selfie (face matching > 90%)
  5. Validasi NIK ke Dukcapil (via API Verihubs)
  6. Hasil: VERIFIED / REJECTED + reason code

SDK Integration Points:
  - Mobile: Flutter SDK (Android/iOS native)
  - Web: Iframe SDK / REST API fallback

Data yang disimpan:
  - Status verifikasi
  - Waktu verifikasi
  - Provider reference ID
  - Tidak menyimpan foto biometrik di server platform
```

### 6.4 Push Notification (Opsional — Feature Toggle)

**Teknologi:** Firebase Cloud Messaging (FCM) + OneSignal (optional)

```
Kategori Notifikasi:
  - Deposit berhasil diterima
  - NIPL aktif untuk sesi X
  - Pengingat sesi H-1
  - Sesi dimulai (5 menit sebelum)
  - Update harga lot yang diikuti (price alert)
  - Pemenang lot
  - Reminder pelunasan (H-1, H-3, H-5)
  - Refund berhasil
  - Pengambilan dijadwalkan
  - BAST siap diunduh

Backend Implementation:
  - Queue-based (via BullMQ/SQS)
  - Scheduled delivery untuk reminder
  - Batch sending untuk broadcast campaign
  - Deep link ke halaman terkait
```

### 6.5 Generasi Dokumen PDF

**Teknologi:** Puppeteer (Node.js) atau wkhtmltopdf

```
Dokumen yang di-generate secara otomatis:
  1. Invoice Pelunasan (bilingual ID/EN optional)
     - Logo perusahaan, nomor invoice, detail lot
     - Rincian harga: hammer + komisi + PPN
     - Barcode/QR untuk verifikasi keaslian

  2. Surat Jalan
     - Detail lot, identitas pemenang, tanggal ambil
     - QR code verifikasi
     - Tandatangan digital operator

  3. BAST (Berita Acara Serah Terima) Digital
     - Format resmi A4
     - Data kondisi kendaraan saat serah terima
     - QR code immutable (hash dokumen)
     - Slot TTD digital (opsional dengan e-sign)
```

---

## 7. Integrasi Pihak Ketiga

### 7.1 Payment Gateway

| Provider | Tipe | Fitur | Estimasi Biaya |
|---|---|---|---|
| **Midtrans** (Utama) | Snap / Core API | VA Multi-bank, QRIS, CC | Rp 2.000-4.000/trx deposit |
| **Xendit** (Alternatif) | VA + QRIS | Disbursement (pencairan) | 1% min Rp 1.000/transfer |
| **Doku** | VA + QRIS | Alternatif Bank lokal | Custom pricing |

**Fitur yang dibutuhkan:**
- Virtual Account (BCA, Mandiri, BNI, BRI, Permata)
- QRIS real-time
- Webhook untuk konfirmasi otomatis
- Disbursement API (untuk pencairan ke provider)
- Auto-refund API

### 7.2 eKYC / Verifikasi Identitas

| Provider | Layanan | Biaya |
|---|---|---|
| **Verihubs** | OCR KTP + Liveness + Dukcapil | Rp 5.000-15.000/verifikasi |
| **Privy.ID** | eKYC + e-Signature | Custom/bulan |
| **Kredivo KYC** | Alternatif | — |

### 7.3 Komunikasi & Notifikasi

| Provider | Layanan | Biaya |
|---|---|---|
| **Firebase FCM** | Push Notification | Free (10K/hari gratis) |
| **Twilio / Vonage** | SMS OTP | $0.0075/SMS (~Rp 120) |
| **SendGrid / Mailgun** | Email Transaksional | $0.001/email |
| **OneSignal** | Push (Alternatif) | Free < 10K subscribers |

### 7.4 Live Streaming

| Provider | Layanan | Biaya |
|---|---|---|
| **Agora.io** | RTC + Live Streaming | $3.99/1K mnt host, $0.99/1K mnt audience |
| **Zoom Video SDK** | Video + Recording | $100-500/bulan |
| **Mux.com** | Stream CDN | $0.015/menit stream |

### 7.5 Cloud Storage & CDN

| Provider | Layanan | Biaya |
|---|---|---|
| **AWS S3** | Foto, dokumen, PDF | ~$0.023/GB/bulan |
| **Cloudflare R2** | Storage + CDN | $0.015/GB (lebih murah) |
| **Google Cloud Storage** | Alternatif | $0.020/GB/bulan |

### 7.6 Maps & Lokasi

| Provider | Layanan |
|---|---|
| **Google Maps API** | Lokasi cabang, alamat pengambilan |
| **Mapbox** | Alternatif lebih murah |

---

## 8. Database Schema (ERD Ringkasan)

### Tabel Utama

```sql
-- USERS (Multi-role)
users { id, email, phone, password_hash, role[bidder|provider|admin|operator], status[pending|active|suspended], created_at }

-- KYC DOCUMENTS
kyc_documents { id, user_id, ktp_url, selfie_url, ktp_selfie_url, status[pending|approved|rejected], reviewer_id, reviewed_at, rejection_reason, provider_ref_id }

-- BRANCHES (Multi-branch)
branches { id, tenant_id, name, city, address, phone, pic_name, is_active }

-- AUCTION SESSIONS
auction_sessions { id, branch_id, title, scheduled_at, status[draft|published|live|closed], operator_id }

-- ASSETS (Barang)
assets { id, provider_id, category, title, description, base_price, status[pending|approved|listed|sold|returned] }

-- LOTS
lots { id, session_id, asset_id, lot_number, starting_price, hammer_price, winner_id, status[pending|active|sold|unsold] }

-- BIDS
bids { id, lot_id, bidder_id, amount, timestamp, is_winning }

-- NIPL / DEPOSITS  
deposits { id, user_id, session_id, amount, va_number, va_bank, payment_method, status[pending|paid|expired|refunded], paid_at }

-- INVOICES (Pelunasan)
invoices { id, lot_id, bidder_id, hammer_price, commission, tax, total, due_date, status[unpaid|paid|overdue], paid_at }

-- SETTLEMENTS (Provider)
settlements { id, lot_id, provider_id, gross_amount, commission_deducted, net_amount, status[pending|processed|transferred], transferred_at }

-- DOCUMENTS (Surat Jalan, BAST)
documents { id, invoice_id, type[surat_jalan|bast], file_url, generated_at, qr_hash }

-- NOTIFICATIONS
notifications { id, user_id, type, title, body, deep_link, is_read, sent_at }

-- PLATFORM SETTINGS (Feature Toggles + API Keys)
platform_settings { id, tenant_id, key, value, is_encrypted, updated_by, updated_at }

-- AUDIT LOGS
audit_logs { id, user_id, action, resource_type, resource_id, old_value, new_value, ip_address, timestamp }
```

---

## 9. API Endpoint Reference

### 9.1 Auth

```
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/logout
POST   /api/v1/auth/refresh-token
POST   /api/v1/auth/forgot-password
POST   /api/v1/auth/reset-password
POST   /api/v1/auth/verify-otp
```

### 9.2 KYC

```
POST   /api/v1/kyc/upload-documents
GET    /api/v1/kyc/status
POST   /api/v1/kyc/auto-verify     (trigger eKYC SDK)
GET    /api/v1/admin/kyc/queue
PUT    /api/v1/admin/kyc/:id/approve
PUT    /api/v1/admin/kyc/:id/reject
```

### 9.3 Auction Sessions

```
GET    /api/v1/sessions               (public: daftar sesi)
GET    /api/v1/sessions/:id
POST   /api/v1/admin/sessions         (buat sesi baru)
PUT    /api/v1/admin/sessions/:id
POST   /api/v1/admin/sessions/:id/start
POST   /api/v1/admin/sessions/:id/end
```

### 9.4 Lots & Bidding

```
GET    /api/v1/lots/:id
POST   /api/v1/bids                   (submit penawaran)
GET    /api/v1/lots/:id/bids          (riwayat bid per lot)
POST   /api/v1/admin/lots/:id/activate
POST   /api/v1/admin/lots/:id/hammer  (ketuk palu)
```

### 9.5 Deposits & Payments

```
POST   /api/v1/deposits/create        (generate VA)
GET    /api/v1/deposits/:id/status
POST   /api/v1/payments/webhook       (dari payment gateway)
POST   /api/v1/invoices/:id/pay
GET    /api/v1/invoices/:id
```

### 9.6 Documents

```
GET    /api/v1/documents/:id/download (Surat Jalan / BAST)
POST   /api/v1/admin/documents/generate
GET    /api/v1/documents/:qr_hash/verify
```

### 9.7 Platform Settings (Admin)

```
GET    /api/v1/admin/settings
PUT    /api/v1/admin/settings/:key
POST   /api/v1/admin/settings/api-keys/test
```

---

## 10. Fitur Toggle & Konfigurasi Admin

### 10.1 Daftar Feature Toggle

Admin Balai Lelang dapat mengaktifkan/nonaktifkan fitur berikut dari halaman **Pengaturan Platform (AD25)**:

| Feature Key | Nama Fitur | Default | Dampak Nonaktif |
|---|---|---|---|
| `feat_live_streaming` | Live Streaming Sesi | `OFF` | Bidding room tanpa video |
| `feat_ekyc_auto` | eKYC Otomatis | `OFF` | Fallback ke verifikasi manual |
| `feat_push_notification` | Push Notification | `OFF` | Notif hanya via email |
| `feat_qris_payment` | Pembayaran QRIS | `OFF` | Hanya VA transfer |
| `feat_esign_bast` | e-Sign BAST Digital | `OFF` | BAST tanpa tanda tangan digital |
| `feat_auto_refund` | Auto Refund Deposit | `OFF` | Refund manual oleh admin |
| `feat_price_alert` | Price Alert Watchlist | `OFF` | Tidak ada notif harga |
| `feat_multi_branch` | Multi-Cabang | `ON` | Semua sesi satu cabang |
| `feat_analytics_dashboard` | Dashboard Analitik | `ON` | — |
| `feat_audit_trail` | Audit Trail Log | `ON` | — |

### 10.2 Konfigurasi Aturan Bisnis

```
Komisi Balai Lelang: default 3% (dapat dikonfigurasi per cabang)
PPN: default 11% (ikut regulasi berlaku)
Jaminan NIPL Kendaraan: Rp 5.000.000
Jaminan NIPL Motor: Rp 1.000.000
Jaminan NIPL Properti: Rp 10.000.000
Jaminan NIPL Alat Berat: Rp 10.000.000
Batas Waktu Pelunasan: 3 Hari Kerja
Anti-Sniping Threshold: 30 detik
Anti-Sniping Extension: 120 detik (max 3x)
```

### 10.3 API Key Management (per Tenant)

```
Payment Gateway:
  - MIDTRANS_SERVER_KEY
  - MIDTRANS_CLIENT_KEY
  - MIDTRANS_MERCHANT_ID
  - XENDIT_SECRET_KEY (opsional)

eKYC Provider:
  - EKYC_PROVIDER (verihubs|privy|manual)
  - VERIHUBS_API_KEY
  - VERIHUBS_API_URL
  - PRIVY_API_KEY (opsional)

Notifications:
  - FIREBASE_PROJECT_ID
  - FIREBASE_PRIVATE_KEY
  - FIREBASE_CLIENT_EMAIL
  - SENDGRID_API_KEY
  - SENDGRID_FROM_EMAIL
  - TWILIO_ACCOUNT_SID
  - TWILIO_AUTH_TOKEN
  - TWILIO_PHONE_NUMBER

Live Streaming:
  - AGORA_APP_ID
  - AGORA_APP_CERTIFICATE
  - ZOOM_API_KEY (opsional)
  - ZOOM_API_SECRET (opsional)

Cloud Storage:
  - AWS_ACCESS_KEY_ID
  - AWS_SECRET_ACCESS_KEY
  - AWS_S3_BUCKET_NAME
  - AWS_S3_REGION
```

> [!CAUTION]
> **Semua API Key yang tersimpan di database HARUS dienkripsi** menggunakan AES-256 atau KMS (Key Management Service). Jangan pernah menyimpan dalam plain text. Endpoint `/api/v1/admin/settings` untuk API keys harus dilindungi oleh:
> - Auth middleware (role: superadmin/tenant-admin only)
> - Rate limiting ketat
> - Audit log setiap akses

---

## 11. Keamanan & Compliance

### 11.1 Autentikasi & Otorisasi
- JWT Access Token (expiry 15 menit) + Refresh Token (expiry 30 hari)
- Refresh Token disimpan di HttpOnly Cookie (tidak accessible via JavaScript)
- Role-Based Access Control (RBAC) di setiap endpoint
- Rate Limiting per IP dan per user
- Throttle: max 10 request/detik per user

### 11.2 Keamanan Data
- HTTPS wajib di semua endpoint
- Data sensitif (API keys, password) di-hash/enkripsi
- PII (NIK, foto KTP) tidak disimpan di server platform (hanya di penyedia eKYC)
- Backup otomatis database setiap 24 jam (7 hari retensi)
- Database encryption at rest

### 11.3 Anti-Fraud Lelang
- Validasi saldo deposit sebelum bid diterima
- Cegah bid dari device/IP yang sama berulang cepat
- One NIPL per user per sesi
- Audit log immutable untuk setiap perubahan harga & pemenang

### 11.4 Compliance Indonesia
- **UU ITE** — Keamanan transaksi elektronik
- **PP PSTE** — Penyelenggaraan Sistem Transaksi Elektronik
- **PBI 23/6/2021** — Perlindungan Data Konsumen (Pembayaran)
- Dokumen BAST berkekuatan hukum dengan hash + timestamp

---

## 12. Infrastruktur & Deployment

### 12.1 Environment

| Environment | Tujuan | Infrastruktur |
|---|---|---|
| **Development** | Pengembangan harian tim | Local Docker |
| **Staging** | UAT & demo klien | Cloud VM (2 CPU, 4GB RAM) |
| **Production** | Live operation | Cloud (auto-scaling) |

### 12.2 Tech Stack Production

```
Cloud Provider: AWS / GCP / DigitalOcean (pilih satu)

Compute:
  - App Server: 2x EC2 t3.medium (auto-scaling)
  - WebSocket Server: 1x EC2 t3.small (dedicated)

Database:
  - PostgreSQL: RDS db.t3.medium (Multi-AZ)
  - Redis: ElastiCache cache.t3.micro

Storage:
  - S3: Foto lot, dokumen PDF, video recording

CDN:
  - CloudFront / Cloudflare untuk aset statis

CI/CD:
  - GitHub Actions → Docker → ECR → ECS/EKS
  - Deploy otomatis ke staging setiap push ke main
  - Manual approval untuk deploy ke production
```

### 12.3 Mobile App Distribution

```
iOS:
  - Distribusi via App Store (TestFlight untuk beta)
  - Membutuhkan Apple Developer Account ($99/tahun)

Android:
  - Distribusi via Google Play Store
  - Internal Testing Track untuk beta ($25 sekali)

Update Strategy:
  - OTA Update: Flutter CodePush (Shorebird)
  - Hard Update: version gate di app
```

---

## 13. Estimasi Timeline Pengembangan

### Asumsi Tim
- 2 Mobile Developer (Flutter)
- 2 Backend Developer (Node.js / Laravel)
- 1 Frontend Developer (React.js Admin Panel)
- 1 UI/UX Designer
- 1 QA Engineer
- 1 Project Manager / Tech Lead

### Timeline per Sprint (2 minggu per sprint)

| Sprint | Milestone | Deliverable |
|---|---|---|
| S1-S2 | Foundation | Setup repo, CI/CD, DB schema, Auth API, base UI |
| S3-S4 | Core Registration | KYC manual flow, registrasi bidder & provider |
| S5-S6 | Catalog & Asset | Public catalog, asset submission (provider), admin approval |
| S7-S8 | Auction Engine | Sesi lelang, lot management, admin ruang kontrol |
| S9-S10 | Live Bidding | WebSocket bidding engine, real-time updates, anti-sniping |
| S11-S12 | Payment Integration | Deposit VA, QRIS, webhook, invoice generation |
| S13-S14 | Document & Pickup | PDF Surat Jalan, BAST, scheduling pengambilan |
| S15-S16 | Provider Settlement | Settlement logic, pencairan, notifikasi |
| S17-S18 | Advanced Features | eKYC auto, Push Notification, Live Streaming (toggle) |
| S19-S20 | Admin & Analytics | Dashboard analitik, Audit trail, Pengaturan platform |
| S21-S22 | Multi-Branch | Manajemen cabang, setting per-cabang |
| S23-S24 | Testing & UAT | Bug fix, performance test, penetration test |
| S25-S26 | Launch Prep | App Store review, staging to production, training |

**Total Estimasi: ±13 bulan (52 minggu / 26 sprint)**

> [!NOTE]
> Timeline dapat dipercepat menjadi 8-9 bulan dengan tim yang lebih besar atau dengan mengurangi scope fitur advanced ke post-launch.

---

## 14. Referensi Wireframe

Wireframe interaktif lengkap tersedia di direktori project:

```
wireframe/
├── index.html              → Index navigasi semua halaman
├── publik/                 → P1-P8 (Halaman Publik)
├── auth/                   → A1-A7 (Autentikasi)
├── bidder/                 → B1-B14 (Panel Bidder)
├── provider/               → S1-S12 (Panel Provider)
└── admin/                  → AD1-AD27 (Panel Admin)
```

### Halaman Kunci dengan Simulasi Interaktif

| File | Fitur Simulasi |
|---|---|
| `bidder/b6-deposit.html` | Generate VA number, kalkulasi NIPL, QRIS |
| `bidder/b7-bidding-room.html` | Live bidding countdown, bid submit |
| `bidder/b11-pengambilan.html` | Download BAST PDF, preview dokumen A4 |
| `admin/ad13-ruang-kontrol.html` | Control panel sesi live, navigasi lot |
| `admin/ad25-pengaturan.html` | Feature toggle, API key management |
| `admin/ad27-manajemen-cabang.html` | CRUD multi-cabang |

---

## Lampiran: Konvensi Kode

### Penamaan Database
- Tabel: `snake_case` (plural)
- Kolom: `snake_case`
- Foreign Key: `{table_singular}_id`

### API Response Format

```json
{
  "success": true,
  "data": { ... },
  "message": "Operasi berhasil",
  "meta": {
    "page": 1,
    "per_page": 20,
    "total": 150
  }
}
```

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_DEPOSIT",
    "message": "Saldo deposit tidak mencukupi untuk mengikuti sesi ini",
    "details": { ... }
  }
}
```

---

*Dokumen ini disiapkan oleh tim Indo-Lelang Digital. Untuk pertanyaan teknis, hubungi Project Manager atau Tech Lead yang ditunjuk.*

**© 2026 Indo-Lelang — CONFIDENTIAL**
