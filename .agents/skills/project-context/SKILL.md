---
name: project-context
description: Konteks lengkap platform Indo-Lelang — arsitektur, user roles, database schema, alur bisnis, dan peta wireframe. Gunakan skill ini saat perlu memahami gambaran besar proyek atau saat membuat keputusan arsitektur.
---

# Platform Indo-Lelang — Project Context

## Apa Ini?
Platform lelang digital terintegrasi untuk jual-beli aset (kendaraan, properti, alat berat) melalui penawaran online yang transparan dan real-time.

## Arsitektur Sistem

```
┌─ KLIEN ─────────────────────────────────────────────────┐
│  Mobile App (Flutter) │ Web Admin (React) │ Public (Next)│
└────────────┬──────────────────┬──────────────┬──────────┘
             │                  │              │
             ▼                  ▼              ▼
┌─ API GATEWAY (Nginx) ──────────────────────────────────┐
│  Rate Limiting │ JWT Auth │ SSL/TLS │ Load Balancing    │
└────────────────────────┬───────────────────────────────┘
                         │
          ┌──────────────┴──────────────┐
          ▼                             ▼
┌─ CORE API ──────────┐    ┌─ REALTIME SERVICE ─────┐
│  Node.js + Express   │    │  Socket.io (WebSocket) │
│  - Auth & Identity   │    │  - Live Bidding        │
│  - Auction Engine    │    │  - Price Updates       │
│  - Payment Logic     │    │  - Lot Transitions     │
│  - KYC Processing    │    │  - Notifications       │
└──────┬───────────────┘    └──────┬─────────────────┘
       │                          │
  ┌────┴────┐                     │
  ▼         ▼                     ▼
PostgreSQL  Redis           Message Queue (BullMQ)
(primary)   (cache+pubsub)  (email/SMS/notif jobs)
```

## 5 User Roles

```
SUPERADMIN (Platform Owner)
  └── kelola semua tenant, billing, konfigurasi global

ADMIN BALAI LELANG (Tenant Admin)
  ├── Manajemen Cabang (Multi-Branch)
  ├── Manajemen Staf/Operator
  ├── Konfigurasi Platform (Feature Toggle, API Keys)
  └── Akses penuh ke semua data tenant

OPERATOR LELANG (Staff)
  ├── Jalankan Sesi Lelang (Ruang Kontrol)
  ├── Verifikasi KYC Manual
  └── Persetujuan Transaksi

PROVIDER (Mitra Penyedia Aset)
  ├── Pengajuan & Manajemen Barang
  ├── Monitoring Lelang Real-time
  └── Settlement & Pencairan Dana

BIDDER (Peserta Lelang)
  ├── Registrasi & Verifikasi eKYC
  ├── Deposit NIPL / Jaminan
  ├── Partisipasi Bidding
  └── Pengambilan Barang & Dokumen
```

## Database Schema (14 Tabel)

```sql
-- PENGGUNA
users { id, email, phone, password_hash, role[bidder|provider|admin|operator],
        status[pending|active|suspended], created_at, updated_at }

kyc_documents { id, user_id(FK), ktp_url, selfie_url, ktp_selfie_url,
                status[pending|approved|rejected], reviewer_id(FK),
                reviewed_at, rejection_reason, provider_ref_id }

-- ORGANISASI
branches { id, tenant_id, name, city, address, phone, pic_name, is_active }

-- LELANG
auction_sessions { id, branch_id(FK), title, scheduled_at,
                   status[draft|published|live|closed], operator_id(FK) }

assets { id, provider_id(FK), category, title, description, base_price,
         status[pending|approved|listed|sold|returned] }

lots { id, session_id(FK), asset_id(FK), lot_number, starting_price,
       hammer_price, winner_id(FK), status[pending|active|sold|unsold] }

bids { id, lot_id(FK), bidder_id(FK), amount, timestamp, is_winning }

-- KEUANGAN
deposits { id, user_id(FK), session_id(FK), amount, va_number, va_bank,
           payment_method, status[pending|paid|expired|refunded], paid_at }

invoices { id, lot_id(FK), bidder_id(FK), hammer_price, commission, tax,
           total, due_date, status[unpaid|paid|overdue], paid_at }

settlements { id, lot_id(FK), provider_id(FK), gross_amount,
              commission_deducted, net_amount,
              status[pending|processed|transferred], transferred_at }

-- DOKUMEN & SISTEM
documents { id, invoice_id(FK), type[surat_jalan|bast],
            file_url, generated_at, qr_hash }

notifications { id, user_id(FK), type, title, body,
                deep_link, is_read, sent_at }

platform_settings { id, tenant_id, key, value, is_encrypted,
                    updated_by(FK), updated_at }

audit_logs { id, user_id(FK), action, resource_type, resource_id,
             old_value, new_value, ip_address, timestamp }
```

## 6 Alur Bisnis Utama

### 1. Registrasi & KYC
```
Daftar → Input Data → Upload KTP+Selfie
  → [eKYC Auto ON] SDK Verihubs → Liveness + Dukcapil → Approved (3 detik)
  → [eKYC Auto OFF] Antrian Admin → Review → Approve/Reject
  → Akun Aktif → Bisa Top-Up Deposit
```

### 2. Deposit NIPL
```
Pilih Sesi → Beli NIPL → Pilih Metode (VA/QRIS)
  → Generate VA Unik → Bidder Transfer → Webhook Gateway
  → Status Paid → NIPL Aktif → Notifikasi
```

### 3. Sesi Lelang Live
```
Admin Buat Sesi → Assign Lot → Set Jadwal
  → H-1 Reminder → Hari H: Buka Sesi → Aktifkan Lot 1
  → [Per Lot: Timer → Bid Realtime → Anti-Sniping → HAMMER!]
  → Pemenang → Invoice → Lot Berikutnya
  → Sesi Selesai → Auto-Refund yang kalah
```

### 4. Pelunasan
```
Invoice → 3 Hari Kerja → Hammer + Komisi(3%) + PPN(11%)
  → Bayar VA → Admin Verifikasi → LUNAS
  → Generate Surat Jalan + BAST (PDF)
```

### 5. Pengambilan Barang
```
LUNAS → Pilih Tanggal Ambil → Download Surat Jalan
  → Admin Serahkan → BAST Digital (PDF + QR Code)
```

### 6. Provider Settlement
```
Lot Terjual → T+3 Hari → Gross - Komisi - Biaya Titip = Net
  → Provider Request Pencairan → Admin Approve → Transfer
```

## Peta Wireframe (69 File)

| Area | Prefix | Contoh File | Jumlah |
|---|---|---|---|
| Public | `p` | `publik/p1-homepage.html` | 8 |
| Auth | `a` | `auth/a1-login.html` | 7 |
| Bidder | `b` | `bidder/b7-bidding-room.html` | 14 |
| Provider | `s` | `provider/s3-ajukan-barang.html` | 12 |
| Admin | `ad` | `admin/ad13-ruang-kontrol.html` | 28 |

Wireframe ada di folder `wireframe/`. Buka `wireframe/index.html` di browser untuk navigasi lengkap.

## Konfigurasi Bisnis (Default)

| Parameter | Nilai Default |
|---|---|
| Komisi Balai Lelang | 3% |
| PPN | 11% |
| Buyer's Premium | 1.5% |
| Biaya Titip Provider | 2% |
| NIPL Kendaraan | Rp 5.000.000 |
| NIPL Motor | Rp 1.000.000 |
| NIPL Properti | Rp 10.000.000 |
| Batas Pelunasan | 3 Hari Kerja |
| Batas Pengambilan | 14 Hari Kalender |
| Anti-Sniping Threshold | 30 Detik |
| Anti-Sniping Extension | 120 Detik (max 3x) |

## Integrasi Pihak Ketiga

| Layanan | Provider | Status |
|---|---|---|
| Payment Gateway | Midtrans (utama), Xendit (disbursement) | 🔴 Core |
| eKYC | Verihubs, Privy.ID | 🟡 Feature Toggle |
| Push Notification | Firebase FCM | 🟡 Feature Toggle |
| Email | SendGrid | 🔴 Core |
| SMS OTP | Twilio | 🟡 Feature Toggle |
| Live Streaming | Agora.io | 🟡 Feature Toggle |
| Storage | AWS S3 | 🔴 Core |
| PDF Generation | Puppeteer | 🔴 Core |
