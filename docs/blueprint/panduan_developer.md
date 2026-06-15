# 🚀 PANDUAN DEVELOPER — Platform Lelang Digital Indo-Lelang
### Developer Handbook & Phase Guide — Tim Pengembangan
**Versi:** 1.0 | **Tanggal:** Juni 2026 | **Status:** AKTIF

---

> [!IMPORTANT]
> Dokumen ini adalah **panduan wajib baca** sebelum memulai pekerjaan. Seluruh anggota tim developer HARUS memahami dokumen ini dari awal hingga akhir. Setiap keputusan teknis yang tidak tercakup di dokumen ini HARUS dikonsultasikan terlebih dahulu ke Tech Lead sebelum diimplementasikan.

---

## 📋 Daftar Isi

1. [Prinsip Dasar Tim](#1-prinsip-dasar-tim)
2. [Struktur Tim & Tanggung Jawab](#2-struktur-tim--tanggung-jawab)
3. [Standar Komunikasi & Kolaborasi](#3-standar-komunikasi--kolaborasi)
4. [Setup Environment & Repository](#4-setup-environment--repository)
5. [Workflow Git & Code Review](#5-workflow-git--code-review)
6. [Standar Penulisan Kode](#6-standar-penulisan-kode)
7. [Phase 0 — Persiapan & Kickoff](#7-phase-0--persiapan--kickoff)
8. [Phase 1 — Foundation & Core (Minggu 1–4)](#8-phase-1--foundation--core-minggu-14)
9. [Phase 2 — Fitur Utama Bidder & Admin (Minggu 5–10)](#9-phase-2--fitur-utama-bidder--admin-minggu-510)
10. [Phase 3 — Live Bidding & Real-time (Minggu 11–14)](#10-phase-3--live-bidding--real-time-minggu-1114)
11. [Phase 4 — Integrasi Pihak Ketiga & Advance Features (Minggu 15–18)](#11-phase-4--integrasi-pihak-ketiga--advance-features-minggu-1518)
12. [Phase 5 — Testing, QA & Hardening (Minggu 19–22)](#12-phase-5--testing-qa--hardening-minggu-1922)
13. [Phase 6 — Deployment & Go-Live (Minggu 23–24)](#13-phase-6--deployment--go-live-minggu-2324)
14. [Pasca Go-Live — Maintenance & Iterasi](#14-pasca-go-live--maintenance--iterasi)
15. [Referensi Dokumen & Wireframe](#15-referensi-dokumen--wireframe)

---

## 1. Prinsip Dasar Tim

Seluruh proses pengembangan mengikuti **5 prinsip utama** yang tidak boleh dikompromikan:

| # | Prinsip | Penjelasan |
|---|---|---|
| 1 | **Security First** | Setiap fitur yang menyentuh data sensitif (KYC, payment, API key) HARUS mengikuti standar keamanan yang telah ditetapkan. Tidak ada pengecualian. |
| 2 | **Mobile First** | Semua tampilan UI dirancang mulai dari mobile (320px) terlebih dahulu, baru di-scale up ke tablet dan desktop. |
| 3 | **API-Driven** | Frontend dan Mobile tidak pernah mengakses database secara langsung. Semua melalui REST API + WebSocket yang terdokumentasi. |
| 4 | **Feature Toggle Ready** | Setiap fitur "advance" (live stream, push notif, eKYC) HARUS dibungkus dengan feature flag sehingga bisa diaktifkan/nonaktifkan dari panel admin tanpa deployment ulang. |
| 5 | **Zero Downtime** | Setiap update ke production menggunakan rolling deployment atau blue-green strategy. Lelang yang sedang berjalan tidak boleh terganggu. |

---

## 2. Struktur Tim & Tanggung Jawab

```
┌──────────────────────────────────────────────────────────┐
│                    PROJECT MANAGER (PM)                   │
│  Timeline, Client Communication, Risk Management          │
└──────────────────────────┬───────────────────────────────┘
                           │
              ┌────────────┴────────────┐
              ▼                         ▼
┌─────────────────────┐    ┌───────────────────────┐
│      TECH LEAD      │    │     QA LEAD            │
│  Arsitektur, Review │    │  Test Strategy, UAT     │
│  Keputusan Teknis   │    │  Bug Tracking           │
└──────────┬──────────┘    └───────────┬────────────┘
           │                           │
    ┌──────┴──────┐             ┌──────┴───────┐
    │             │             │              │
    ▼             ▼             ▼              ▼
┌───────┐   ┌──────────┐  ┌────────┐   ┌──────────┐
│Backend│   │ Frontend │  │ Mobile │   │  QA      │
│ Dev   │   │  Dev     │  │  Dev   │   │  Engineer│
│(2-3x) │   │ (1-2x)   │  │ (1-2x) │   │  (1-2x)  │
└───────┘   └──────────┘  └────────┘   └──────────┘
    │             │             │
    ▼             ▼             ▼
┌────────────────────────────────────┐
│         DevOps / Infra (1x)        │
│   CI/CD, Cloud, Monitoring, DB     │
└────────────────────────────────────┘
```

### Tanggung Jawab Per Peran

#### 🔧 Backend Developer
- Membangun dan mendokumentasikan seluruh REST API endpoint
- Mengelola database schema, migrasi, dan indexing
- Implementasi business logic (auction engine, payment flow, KYC)
- Membangun WebSocket service untuk live bidding
- Integrasi dengan layanan pihak ketiga (Midtrans, Firebase, dll)

#### 🖥️ Frontend Developer (Admin Panel)
- Membangun Web Admin Panel dengan React.js / Next.js
- Mengonsumsi REST API dan WebSocket dari Backend
- Implementasi live bidding control panel untuk operator lelang
- Dashboard analitik dan laporan

#### 📱 Mobile Developer (Flutter)
- Membangun aplikasi Flutter untuk iOS dan Android
- Implementasi UI sesuai wireframe yang disediakan
- Mengelola state management (Riverpod / Bloc)
- Integrasi push notification (FCM), live stream viewer, dan payment flow

#### 🛡️ QA Engineer
- Menyusun test plan dan test case berdasarkan alur bisnis
- Melakukan functional testing, regression testing, dan UAT
- Menulis automated test (unit test, integration test, E2E test)
- Mengelola bug tracker dan memverifikasi bug fix

#### ⚙️ DevOps / Infra
- Menyiapkan CI/CD pipeline (GitHub Actions / GitLab CI)
- Mengelola lingkungan cloud (staging dan production)
- Monitoring dan alerting (Datadog / Grafana)
- Database backup dan disaster recovery

---

## 3. Standar Komunikasi & Kolaborasi

### Alat Kolaborasi Wajib

| Alat | Tujuan | Catatan |
|---|---|---|
| **GitHub** | Source control, code review, project board | Satu repository per service |
| **Figma** | Desain UI/UX (wireframe referensi tersedia) | Lihat section Referensi Wireframe |
| **Jira / Linear** | Manajemen task, sprint, bug tracking | Sinkron dengan GitHub |
| **Slack / Teams** | Komunikasi harian, notifikasi CI/CD | Buat channel per tim |
| **Notion / Confluence** | Dokumentasi internal, API docs, catatan rapat | |
| **Postman** | Koleksi API bersama, dokumentasi endpoint | Wajib export collection |

### Aturan Komunikasi

1. **Daily Standup** (maks. 15 menit): Apa yang dikerjakan kemarin? Apa yang dikerjakan hari ini? Ada blocker?
2. **Weekly Sprint Review**: Demo fitur yang selesai ke PM/Client.
3. **Biweekly Retrospective**: Evaluasi proses, bukan orang.
4. **Semua keputusan teknis besar** harus didokumentasikan di Notion/Confluence (bukan hanya di Slack).
5. **Jika ada blocker lebih dari 4 jam** → wajib eskalasi ke Tech Lead, jangan stuck sendiri.

---

## 4. Setup Environment & Repository

### Struktur Repository (Monorepo Approach)

```
indo-lelang/
│
├── apps/
│   ├── api/                  # Backend API (Node.js / Laravel)
│   ├── admin-panel/          # Web Admin (React.js / Next.js)
│   ├── mobile/               # Flutter App (iOS + Android)
│   └── landing-web/          # Public landing page (Next.js/SSR)
│
├── packages/
│   ├── shared-types/         # TypeScript types yang dibagi (jika pakai TS)
│   ├── ui-components/        # Shared UI components (untuk web)
│   └── utils/                # Fungsi utility bersama
│
├── infrastructure/
│   ├── docker/               # Docker Compose untuk local dev
│   ├── k8s/                  # Kubernetes manifests (production)
│   └── terraform/            # Infrastructure as code
│
├── docs/
│   ├── blueprint/            # Blueprint teknis (dokumen ini + blueprint utama)
│   ├── api/                  # OpenAPI / Swagger docs
│   └── wireframes/           # Referensi wireframe HTML
│
└── wireframe/                # Wireframe HTML (referensi visual)
```

### Environment yang Harus Disiapkan

| Environment | Tujuan | Domain Contoh |
|---|---|---|
| **Local (Dev)** | Development dan debugging sehari-hari | `localhost:3000` |
| **Staging** | Testing oleh QA dan UAT oleh klien | `staging.indolelang.com` |
| **Production** | Live — digunakan oleh pengguna nyata | `app.indolelang.com` |

### Setup Local Environment

```bash
# 1. Clone repository
git clone https://github.com/indorehberi/indolelang.git
cd indolelang

# 2. Copy environment variables
cp apps/api/.env.example apps/api/.env
cp apps/admin-panel/.env.example apps/admin-panel/.env.local

# 3. Jalankan database & services dengan Docker
docker-compose up -d postgres redis

# 4. Install dependencies dan jalankan API
cd apps/api && npm install && npm run dev

# 5. Install dependencies dan jalankan Admin Panel
cd apps/admin-panel && npm install && npm run dev

# 6. Setup Flutter (Mobile)
cd apps/mobile && flutter pub get && flutter run
```

> [!WARNING]
> **JANGAN PERNAH** commit file `.env` ke repository. Selalu gunakan `.env.example` sebagai template. File `.env` sudah ada di `.gitignore`.

### File Environment yang Wajib

```env
# apps/api/.env.example
NODE_ENV=development
PORT=8000
DATABASE_URL=postgresql://user:password@localhost:5432/indolelang
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRES_IN=7d

# Payment Gateway (isi dengan sandbox key saat development)
MIDTRANS_SERVER_KEY=
MIDTRANS_CLIENT_KEY=
MIDTRANS_ENV=sandbox

# Firebase FCM (push notification)
FIREBASE_PROJECT_ID=
FIREBASE_PRIVATE_KEY=
FIREBASE_CLIENT_EMAIL=

# eKYC
VERIHUBS_API_KEY=
PRIVY_API_KEY=

# Storage
AWS_BUCKET_NAME=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=ap-southeast-1

# Real-time Streaming (Agora)
AGORA_APP_ID=
AGORA_APP_CERTIFICATE=
```

---

## 5. Workflow Git & Code Review

### Branching Strategy (Git Flow)

```
main ─────────────────────────────────────► production
  │
  └── develop ──────────────────────────► staging (CI/CD auto-deploy)
        │
        ├── feature/[ticket-id]-nama-fitur   ← semua fitur baru
        ├── bugfix/[ticket-id]-nama-bug      ← perbaikan bug
        ├── hotfix/[ticket-id]-nama-hotfix   ← perbaikan kritis di production
        └── chore/[ticket-id]-nama-task      ← refactor, update deps, docs
```

### Naming Convention Branch

```bash
# Fitur baru
git checkout -b feature/IND-101-live-bidding-websocket

# Bug fix
git checkout -b bugfix/IND-205-fix-payment-timeout

# Hotfix production
git checkout -b hotfix/IND-310-fix-va-expiry-calculation

# Pekerjaan teknis
git checkout -b chore/IND-050-upgrade-laravel-11
```

### Alur Pull Request (PR / Merge Request)

```
Developer buat branch
        ↓
Coding + commit lokal
        ↓
Push branch ke GitHub
        ↓
Buat Pull Request ke `develop`
        ↓
CI/CD berjalan otomatis (lint, unit test, build)
        ↓
Minimal 1 reviewer (Tech Lead / Senior Dev) approve
        ↓
Squash & Merge ke `develop`
        ↓
Auto-deploy ke Staging
        ↓
QA Testing di Staging
        ↓
(Jika siap release) Merge `develop` → `main`
        ↓
Auto-deploy ke Production
```

### Aturan Commit Message

Gunakan format **Conventional Commits**:

```
<type>(<scope>): <short description>

[optional body]

[optional footer: refs #TICKET-ID]
```

**Tipe yang valid:**

| Type | Digunakan untuk |
|---|---|
| `feat` | Fitur baru |
| `fix` | Bug fix |
| `docs` | Perubahan dokumentasi |
| `style` | Perubahan formatting (bukan logika) |
| `refactor` | Refactor kode tanpa perubahan fungsional |
| `test` | Menambah/mengubah test |
| `chore` | Update dependency, konfigurasi build, dll |
| `perf` | Peningkatan performa |
| `security` | Perbaikan keamanan |

**Contoh commit yang baik:**
```bash
git commit -m "feat(auction): implement anti-sniping extension logic"
git commit -m "fix(payment): resolve VA expiry not resetting on payment failure"
git commit -m "security(auth): add rate limiting on login endpoint"
```

### Checklist Sebelum Membuat PR

- [ ] Kode sudah di-test secara manual di local
- [ ] Unit test sudah ditulis (jika ada logika bisnis baru)
- [ ] Tidak ada `console.log` debug yang tertinggal
- [ ] Tidak ada hardcoded credential atau API key
- [ ] Sudah update dokumentasi jika ada perubahan API
- [ ] Branch sudah di-rebase / merge dari `develop` terbaru
- [ ] PR description menjelaskan apa yang berubah dan mengapa

---

## 6. Standar Penulisan Kode

### Backend (Node.js/Laravel)

```javascript
// ✅ BAIK: Gunakan async/await, bukan callback
async function getAuctionById(id) {
  try {
    const auction = await Auction.findById(id);
    if (!auction) throw new NotFoundError('Sesi lelang tidak ditemukan');
    return auction;
  } catch (error) {
    logger.error('getAuctionById failed', { id, error: error.message });
    throw error;
  }
}

// ❌ BURUK: Callback hell, tidak ada error handling
function getAuctionById(id, callback) {
  Auction.find({ _id: id }, function(err, data) {
    callback(data);
  });
}
```

### Aturan Validasi Input

- **SELALU** validasi semua input dari client di sisi server. Jangan percaya data dari frontend.
- Gunakan library validasi: `Joi` (Node.js) atau `Form Request Validation` (Laravel).
- Sanitasi input untuk mencegah SQL Injection dan XSS.

### Aturan Error Response API

Semua error API HARUS menggunakan format standar ini:

```json
{
  "success": false,
  "code": "AUCTION_NOT_FOUND",
  "message": "Sesi lelang tidak ditemukan atau sudah berakhir.",
  "timestamp": "2026-06-15T10:00:00+07:00"
}
```

### Aturan Success Response API

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150
  }
}
```

### Mobile (Flutter)

- Gunakan **Riverpod** atau **Bloc** untuk state management (diskusikan dan sepakati satu pendekatan sebelum mulai).
- Pisahkan layer: `presentation/`, `domain/`, `data/` (Clean Architecture).
- Semua string yang tampil ke user disimpan di file lokalisasi (`l10n`), tidak hardcoded.
- Handle semua error state: loading, empty, error — tampilkan pesan yang ramah pengguna.

---

## 7. Phase 0 — Persiapan & Kickoff

**Durasi:** 1 Minggu (sebelum Phase 1 dimulai)

### Tujuan Phase 0
Memastikan seluruh tim siap, lingkungan disiapkan, dan tidak ada ambiguitas sebelum coding dimulai.

### Checklist Phase 0

#### 📋 Manajemen Proyek
- [ ] Kontrak dan SOW (Statement of Work) ditandatangani
- [ ] Kickoff meeting dengan klien dilakukan
- [ ] Timeline dan milestone disetujui bersama
- [ ] Project board (Jira/Linear) disiapkan
- [ ] Channel Slack/Teams dibuat dan semua tim bergabung

#### 🏗️ Infrastruktur Awal
- [ ] Repository GitHub dibuat dengan struktur yang benar
- [ ] Branch protection rules diaktifkan di GitHub (`main` dan `develop`)
- [ ] CI/CD pipeline dasar disiapkan (minimal: lint + test on PR)
- [ ] Environment Staging disiapkan (cloud server, database, Redis)
- [ ] Domain staging dikonfigurasi

#### 👥 Tim
- [ ] Semua developer sudah onboard dan akses repository diberikan
- [ ] Tech stack final disepakati bersama (framework, library utama)
- [ ] Coding standards didiskusikan dan disetujui
- [ ] Blueprint teknis ([blueprint_platform_lelang.md]) sudah dibaca semua tim

#### 🎨 Desain
- [ ] File Figma (referensi wireframe) sudah di-share ke semua tim
- [ ] Design system / komponen dasar disepakati (warna, typography, spacing)
- [ ] Wireframe HTML yang tersedia sudah direview oleh tim Frontend & Mobile

#### 📝 Dokumentasi Awal
- [ ] OpenAPI spec (Swagger) awal disiapkan oleh Backend Dev
- [ ] Postman collection kosong dibuat dan di-share
- [ ] ERD database awal direview dan disetujui Tech Lead

---

## 8. Phase 1 — Foundation & Core (Minggu 1–4)

**Prioritas:** 🔴 KRITIS — Semua pekerjaan Phase berikutnya bergantung pada fase ini.

### Tujuan Phase 1
Membangun fondasi sistem: autentikasi, database, komponen UI dasar, dan proyek Flutter.

### Deliverable & Ticket Per Tim

---

#### 🔧 Backend — Phase 1

| No | Task | Estimasi | Dependensi |
|---|---|---|---|
| B1.1 | Setup project API (Node.js/Laravel) + struktur folder | 2 hari | — |
| B1.2 | Desain & migrasi database schema (ERD final) | 3 hari | — |
| B1.3 | Sistem Autentikasi: Register, Login, Logout, Refresh Token (JWT) | 3 hari | B1.2 |
| B1.4 | Role & Permission system (Superadmin, Admin Cabang, Staf, Bidder, Provider) | 2 hari | B1.3 |
| B1.5 | CRUD Master Data: Kategori barang, Jenis lelang, Lokasi/Cabang | 2 hari | B1.2 |
| B1.6 | Upload file ke cloud storage (S3/GCS) | 2 hari | B1.1 |
| B1.7 | Logging, error handler global, dan monitoring setup | 1 hari | B1.1 |
| B1.8 | Setup CI/CD: auto-test & auto-deploy ke staging | 2 hari | B1.1 |

> [!NOTE]
> **Database Schema** harus di-review oleh Tech Lead sebelum migrasi dijalankan. Perubahan schema di tengah development sangat mahal biayanya.

---

#### 🖥️ Frontend (Admin Panel) — Phase 1

| No | Task | Estimasi | Dependensi |
|---|---|---|---|
| F1.1 | Setup project React.js / Next.js + struktur folder | 1 hari | — |
| F1.2 | Implementasi Design System (warna, typography, spacing tokens) | 2 hari | — |
| F1.3 | Komponen UI dasar: Button, Input, Card, Table, Modal, Toast | 3 hari | F1.2 |
| F1.4 | Layout & Sidebar Admin Panel + routing | 2 hari | F1.3 |
| F1.5 | Halaman Login Admin + integrasi API autentikasi | 2 hari | B1.3, F1.4 |
| F1.6 | Dashboard Admin (struktur & data placeholder) | 2 hari | F1.4 |
| F1.7 | Halaman Manajemen User (daftar, filter, search) | 2 hari | B1.4, F1.3 |

---

#### 📱 Mobile (Flutter) — Phase 1

| No | Task | Estimasi | Dependensi |
|---|---|---|---|
| M1.1 | Setup project Flutter (folder structure, env, flavor dev/staging/prod) | 2 hari | — |
| M1.2 | Design System Flutter (tema, warna, typography, padding constants) | 2 hari | — |
| M1.3 | Komponen UI dasar: AppBar, Button, TextField, Card, BottomSheet | 3 hari | M1.2 |
| M1.4 | Navigasi & routing (GoRouter) | 1 hari | M1.3 |
| M1.5 | Halaman Onboarding / Splash Screen | 2 hari | M1.4 |
| M1.6 | Halaman Login & Registrasi Bidder + integrasi API | 3 hari | B1.3, M1.4 |
| M1.7 | Setup state management (Riverpod/Bloc) + struktur repository layer | 2 hari | M1.1 |
| M1.8 | Setup push notification (Firebase FCM) — channel & permission | 2 hari | M1.7 |

---

### Definition of Done — Phase 1
- [ ] Database dapat dimigrasi ulang dari nol dengan perintah satu baris
- [ ] Endpoint autentikasi melewati semua unit test
- [ ] Admin Panel dapat login dan menampilkan dashboard
- [ ] Aplikasi Flutter dapat login dan menampilkan halaman beranda peserta
- [ ] CI/CD berjalan: setiap PR ditest otomatis, merge ke `develop` auto-deploy ke Staging

---

## 9. Phase 2 — Fitur Utama Bidder & Admin (Minggu 5–10)

**Prioritas:** 🔴 KRITIS

### Tujuan Phase 2
Membangun fitur inti: manajemen lelang, katalog barang, registrasi NIPL/peserta, dan flow lengkap pendaftaran.

---

#### 🔧 Backend — Phase 2

| No | Task | Estimasi | Dependensi |
|---|---|---|---|
| B2.1 | CRUD Sesi Lelang (buat, edit, jadwal, status) | 3 hari | B1.2 |
| B2.2 | CRUD Lot/Barang (daftar, detail, foto, inspeksi) | 3 hari | B1.2, B1.6 |
| B2.3 | API Registrasi Peserta (NIPL) + validasi dokumen | 3 hari | B1.4 |
| B2.4 | Integrasi Payment Gateway (Midtrans) — Sandbox mode | 4 hari | B2.3 |
| B2.5 | Sistem Virtual Account (VA): generate, monitoring, expiry | 3 hari | B2.4 |
| B2.6 | API Katalog Publik (search, filter, paginasi) | 2 hari | B2.2 |
| B2.7 | Notifikasi Email (SendGrid/Nodemailer) — konfirmasi registrasi, VA | 2 hari | B2.3 |
| B2.8 | Sistem Deposit & Refund NIPL | 3 hari | B2.4 |

---

#### 🖥️ Frontend (Admin Panel) — Phase 2

| No | Task | Estimasi | Dependensi |
|---|---|---|---|
| F2.1 | Halaman Manajemen Sesi Lelang (CRUD) | 3 hari | B2.1 |
| F2.2 | Halaman Manajemen Lot/Barang (CRUD + upload foto) | 3 hari | B2.2 |
| F2.3 | Halaman Verifikasi KYC & Dokumen Peserta | 3 hari | B2.3 |
| F2.4 | Halaman Manajemen NIPL & Deposit | 2 hari | B2.8 |
| F2.5 | Halaman Monitoring Pembayaran VA | 2 hari | B2.5 |
| F2.6 | Form Buat Sesi Lelang (multi-step wizard) | 3 hari | B2.1 |

---

#### 📱 Mobile (Flutter) — Phase 2

| No | Task | Estimasi | Dependensi |
|---|---|---|---|
| M2.1 | Halaman Beranda: Katalog sesi lelang aktif & mendatang | 3 hari | B2.6 |
| M2.2 | Halaman Detail Sesi Lelang & list lot | 2 hari | B2.6 |
| M2.3 | Halaman Detail Lot/Barang (foto, spesifikasi, harga) | 2 hari | B2.6 |
| M2.4 | Alur Registrasi Peserta (NIPL) + upload KTP | 4 hari | B2.3 |
| M2.5 | Halaman Pesan VA + countdown timer expiry | 3 hari | B2.5 |
| M2.6 | Halaman Status Pendaftaran & Konfirmasi | 2 hari | B2.3 |
| M2.7 | Profil Pengguna + manajemen dokumen KYC | 2 hari | B1.4 |
| M2.8 | Pencarian & Filter katalog lelang | 2 hari | B2.6 |

---

### Definition of Done — Phase 2
- [ ] Alur pendaftaran peserta end-to-end berhasil (Registrasi → VA → Konfirmasi Deposit)
- [ ] Admin dapat membuat sesi lelang dan menambahkan lot
- [ ] Pembayaran VA di sandbox Midtrans berhasil diproses dan status diperbarui
- [ ] Semua halaman mobile Phase 2 telah direview dan disetujui PM/klien

---

## 10. Phase 3 — Live Bidding & Real-time (Minggu 11–14)

**Prioritas:** 🔴 SANGAT KRITIS — Ini adalah inti dari platform lelang

### Tujuan Phase 3
Membangun engine live bidding real-time, kontrol operator, dan tampilan peserta saat lelang berlangsung.

---

#### 🔧 Backend — Phase 3

| No | Task | Estimasi | Dependensi |
|---|---|---|---|
| B3.1 | WebSocket server setup (Socket.io) untuk live bidding | 3 hari | B1.1 |
| B3.2 | Auction Engine: validasi bid, anti-sniping, harga minimum | 5 hari | B2.1, B3.1 |
| B3.3 | Event system: bid masuk → broadcast ke semua peserta dalam room | 2 hari | B3.1, B3.2 |
| B3.4 | Transisi lot (next lot, hammer price, lot gugur) | 3 hari | B3.2 |
| B3.5 | Penentuan pemenang + generate invoice otomatis | 3 hari | B3.4 |
| B3.6 | Push notification real-time: "Anda kalah bid", "Anda menang!" | 2 hari | B3.2 |
| B3.7 | API Log riwayat bid per lot (audit trail bidding) | 1 hari | B3.2 |

> [!IMPORTANT]
> **Anti-Sniping Logic:** Jika terdapat bid masuk dalam X menit terakhir sebelum waktu habis, waktu akan diperpanjang otomatis sesuai konfigurasi admin. Logika ini WAJIB ditest secara menyeluruh dengan load test (simulasi ratusan bid bersamaan).

---

#### 🖥️ Frontend (Admin Panel) — Phase 3

| No | Task | Estimasi | Dependensi |
|---|---|---|---|
| F3.1 | Halaman Live Auction Control (operator view) — real-time | 5 hari | B3.3 |
| F3.2 | Panel bid masuk real-time (stream log bid) | 2 hari | B3.3 |
| F3.3 | Kontrol Ketok Palu (hammer) + konfirmasi pemenang | 2 hari | B3.5 |
| F3.4 | Kontrol next lot, gugur lot, jeda sesi | 2 hari | B3.4 |
| F3.5 | Papan skor / leaderboard bidder aktif | 1 hari | B3.3 |

---

#### 📱 Mobile (Flutter) — Phase 3

| No | Task | Estimasi | Dependensi |
|---|---|---|---|
| M3.1 | Halaman Bidding Room — live auction participant view | 5 hari | B3.3 |
| M3.2 | Real-time harga update tanpa refresh halaman | 2 hari | B3.3 |
| M3.3 | Tombol BID + konfirmasi dialog + feedback animasi | 2 hari | B3.2 |
| M3.4 | Timer countdown lot + anti-sniping extension visual | 2 hari | B3.2 |
| M3.5 | Notifikasi in-app: "Anda kalah", "Anda menang!", "Lot berikutnya" | 2 hari | B3.6 |
| M3.6 | Halaman Invoice pemenang (muncul otomatis saat menang) | 2 hari | B3.5 |
| M3.7 | Halaman hasil sesi (riwayat lot, siapa pemenang) | 1 hari | B3.5 |

---

### Definition of Done — Phase 3
- [ ] Bid dari multiple peserta (minimal 10 simultan) masuk dan tersinkron tanpa konflik
- [ ] Anti-sniping logic berjalan sesuai konfigurasi
- [ ] Pemenang ditentukan dengan benar dan invoice ditampilkan otomatis
- [ ] Operator dapat mengontrol seluruh sesi dari admin panel
- [ ] Load test: sistem stabil dengan 100 koneksi WebSocket bersamaan

---

## 11. Phase 4 — Integrasi Pihak Ketiga & Advance Features (Minggu 15–18)

**Prioritas:** 🟡 TINGGI — Fitur advance, dapat diaktifkan via toggle

### Tujuan Phase 4
Integrasi semua layanan pihak ketiga dan fitur advance yang dikontrol via feature toggle di admin panel.

---

#### Fitur Advance & Status Toggle

| Fitur | Layanan | Dapat Dinonaktifkan? |
|---|---|---|
| eKYC (Verifikasi KTP otomatis) | Verihubs | ✅ Ya |
| Tanda Tangan Digital | Privy.ID | ✅ Ya |
| Live Streaming Lelang | Agora.io / Zoom SDK | ✅ Ya |
| Push Notification | Firebase FCM | ✅ Ya |
| SMS Notifikasi | Twilio | ✅ Ya |
| Disbursement Otomatis | Xendit | ✅ Ya |
| Unduh Surat Jalan & BAST (PDF) | Layanan PDF internal | ✅ Ya |
| Multi-Cabang | Modul internal | ✅ Ya |
| Laporan Ekspor Excel/PDF | Layanan PDF internal | ✅ Ya |

---

#### 🔧 Backend — Phase 4

| No | Task | Estimasi |
|---|---|---|
| B4.1 | Integrasi eKYC (Verihubs): validasi KTP & selfie otomatis | 4 hari |
| B4.2 | Integrasi Tanda Tangan Digital (Privy.ID): BAST & Surat Jalan | 4 hari |
| B4.3 | Live Streaming token generation (Agora.io): host & audience token | 2 hari |
| B4.4 | Integrasi Disbursement Xendit: refund NIPL, transfer ke provider | 3 hari |
| B4.5 | PDF Generator: Invoice, BAST, Surat Jalan, Laporan | 3 hari |
| B4.6 | Feature Toggle API: baca/tulis status fitur dari database | 2 hari |
| B4.7 | API Multi-Cabang: isolasi data per cabang, laporan per cabang | 4 hari |
| B4.8 | Ekspor laporan ke Excel (xlsx) | 2 hari |

---

#### 🖥️ Frontend & 📱 Mobile — Phase 4

| No | Task | Platform | Estimasi |
|---|---|---|---|
| FM4.1 | Integrasi Live Stream viewer (Agora SDK) | Mobile | 3 hari |
| FM4.2 | Halaman Unduh Invoice & BAST PDF | Mobile | 2 hari |
| FM4.3 | Alur eKYC in-app (kamera → verifikasi) | Mobile | 3 hari |
| FM4.4 | Halaman Live Stream host (untuk operator/admin) | Admin Panel | 3 hari |
| FM4.5 | Manajemen Multi-Cabang di Admin Panel | Admin Panel | 4 hari |
| FM4.6 | Ekspor laporan Excel/PDF dari Admin Panel | Admin Panel | 2 hari |
| FM4.7 | Halaman Pengaturan Admin (Feature Toggle UI) | Admin Panel | 3 hari |

---

### Definition of Done — Phase 4
- [ ] eKYC berhasil memverifikasi KTP dan selfie (sandbox Verihubs)
- [ ] Live streaming berjalan di iOS dan Android dengan delay < 3 detik
- [ ] PDF Invoice, BAST, dan Surat Jalan dapat diunduh
- [ ] Feature toggle berfungsi: menonaktifkan fitur langsung dari admin panel tanpa deployment ulang
- [ ] Multi-cabang: data ter-isolasi per cabang dengan benar

---

## 12. Phase 5 — Testing, QA & Hardening (Minggu 19–22)

**Prioritas:** 🔴 KRITIS — Tidak ada kompromi pada kualitas

### Tujuan Phase 5
Memastikan seluruh sistem berjalan dengan benar, aman, dan performan sebelum go-live.

### Jenis Testing

#### ✅ Functional Testing (QA Engineer)
- Menjalankan seluruh test case berdasarkan alur bisnis di dokumen Blueprint
- Fokus: alur pendaftaran, alur bidding, alur pembayaran, alur pengiriman

#### 🔒 Security Testing
- **Penetration test** pada endpoint autentikasi dan pembayaran
- **SQL Injection & XSS** testing pada semua form input
- **API rate limiting** testing: verifikasi tidak bisa di-bruteforce
- Review semua API key: tidak ada yang hardcoded di kode

#### ⚡ Performance Testing
- **Load test** WebSocket bidding: 100–500 koneksi bersamaan
- **Stress test** API: respons time < 500ms di bawah beban normal
- **Database query optimization**: semua query penting menggunakan index

#### 📱 Device Testing (Mobile)
- iOS: iPhone 12, 14, 15 (minimal)
- Android: Samsung Galaxy A series, Pixel (minimal 3 device berbeda)
- Test pada koneksi lambat (3G simulation)
- Test pada mode offline: tampilkan pesan ramah, jangan crash

#### 🧪 User Acceptance Testing (UAT)
- Klien melakukan UAT di environment Staging
- Semua bug yang ditemukan UAT dikategorikan: Critical / Major / Minor
- **Critical bug**: blokir go-live, harus fix dalam 24 jam
- **Major bug**: harus fix sebelum go-live
- **Minor bug**: dapat difix di sprint berikutnya

### Bug Tracking Workflow

```
QA temukan bug
       ↓
Buat ticket di Jira dengan:
- Judul yang jelas
- Langkah reproduksi (step-by-step)
- Screenshot / video recording
- Severity (Critical/Major/Minor)
- Environment (Staging/Production)
       ↓
Tech Lead assign ke Developer
       ↓
Developer fix & update ticket
       ↓
QA verifikasi fix di Staging
       ↓
Ticket ditutup
```

### Checklist Sebelum Go-Live

- [ ] Semua Critical dan Major bug sudah ditutup
- [ ] UAT disetujui dan ditandatangani oleh klien
- [ ] Security audit selesai tanpa temuan Critical
- [ ] Load test: sistem stabil dengan 200 koneksi bersamaan
- [ ] Semua API key production sudah dikonfigurasi di server (bukan di kode)
- [ ] Backup database otomatis sudah diverifikasi berjalan
- [ ] Rollback plan sudah disiapkan dan didokumentasikan
- [ ] Monitoring dan alerting aktif (alert ke Slack/email jika ada error)

---

## 13. Phase 6 — Deployment & Go-Live (Minggu 23–24)

**Prioritas:** 🔴 KRITIS

### Tujuan Phase 6
Deployment ke production dengan aman, tanpa downtime, dan dengan rollback plan yang jelas.

### Checklist Deployment

#### 1 Minggu Sebelum Go-Live
- [ ] Semua secret/API key production disimpan di Vault (bukan di .env file langsung)
- [ ] Database production selesai di-setup dan ditest
- [ ] CDN (Cloudflare / AWS CloudFront) dikonfigurasi
- [ ] SSL/TLS certificate aktif untuk semua domain
- [ ] DNS record benar dan sudah propagasi

#### Hari H — Deployment

```bash
# 1. Merge develop → main (sudah ditest di Staging)
git checkout main && git merge develop

# 2. Tag versi release
git tag -a v1.0.0 -m "Release: Go-Live Indo-Lelang Platform"
git push origin main --tags

# 3. CI/CD Pipeline otomatis berjalan:
#    - Build Docker image
#    - Push ke Container Registry
#    - Deploy ke Production (rolling update / blue-green)
#    - Run database migration
#    - Run smoke test

# 4. Monitor log real-time selama 2 jam pertama
```

#### Setelah Go-Live (Jam Pertama)
- [ ] Smoke test manual: login, lihat katalog, registrasi peserta (test mode)
- [ ] Pantau error rate di monitoring (target: < 1%)
- [ ] Pantau latency API (target: < 500ms)
- [ ] Konfirmasi dengan klien bahwa semua berjalan normal

### Rollback Plan

> [!CAUTION]
> Jika ditemukan bug Critical pasca-deployment, JANGAN mencoba fix langsung di production. Segera rollback, fix di Staging, lalu deploy ulang.

```bash
# Rollback ke versi sebelumnya
kubectl rollout undo deployment/api-service  # jika menggunakan Kubernetes
# atau
git revert HEAD && git push origin main       # jika menggunakan simple deployment
```

---

## 14. Pasca Go-Live — Maintenance & Iterasi

### Sprint Maintenance (Bulanan)
Setelah go-live, tim masuk ke mode **maintenance sprint** dengan siklus 2 minggu:

| Minggu | Fokus |
|---|---|
| Minggu 1 | Bug fix dari laporan pengguna production |
| Minggu 2 | Peningkatan kecil (minor improvement, optimasi, fitur toggle baru) |

### SLA (Service Level Agreement) Target

| Metrik | Target |
|---|---|
| Uptime | ≥ 99.5% per bulan |
| Response time API | < 500ms (P95) |
| Waktu respons bug Critical | < 4 jam |
| Waktu fix bug Critical | < 24 jam |
| Waktu fix bug Major | < 3 hari kerja |

### Monitoring Harian

Pastikan setiap hari (atau via alert otomatis) memantau:
- Error rate API (target < 1%)
- CPU dan memory server
- Antrian pembayaran (pastikan tidak ada transaksi stuck)
- Log error aplikasi (cari pattern error berulang)
- Jumlah WebSocket connection aktif (saat ada sesi lelang)

---

## 15. Referensi Dokumen & Wireframe

### Dokumen Teknis

| Dokumen | Deskripsi | Lokasi |
|---|---|---|
| **Blueprint Teknis** | Arsitektur, database, API reference, fitur lengkap | `docs/blueprint/blueprint_platform_lelang.md` |
| **Panduan Developer** | Dokumen ini — fase kerja dan standar tim | `docs/blueprint/panduan_developer.md` |
| **Proposal Enterprise** | Fitur lengkap dan estimasi biaya pihak ketiga | `docs/Proposal_Platform_Lelang_Digital_Enterprise.md` |

### Wireframe Referensi (HTML)

Seluruh wireframe tersedia di folder `wireframe/`. Dibagi per area:

```
wireframe/
├── index.html              ← Halaman indeks semua wireframe
├── admin/                  ← Admin panel (66 halaman)
│   ├── ad1-login.html      ← Login admin
│   ├── ad2-dashboard.html  ← Dashboard
│   ├── ad25-pengaturan.html← Pengaturan & Feature Toggle
│   ├── ad27-manajemen-cabang.html ← Multi-cabang
│   └── ...
├── bidder/                 ← Aplikasi bidder (mobile-first)
│   ├── b1-home.html        ← Beranda peserta
│   ├── b6-deposit.html     ← Deposit / NIPL (VA)
│   ├── b7-bidding-room.html← Live bidding room
│   ├── b11-pickup.html     ← Pickup & BAST
│   └── ...
└── provider/               ← Portal provider/pemilik aset
```

> [!TIP]
> Buka `wireframe/index.html` di browser untuk navigasi interaktif ke semua halaman wireframe. Wireframe ini adalah referensi visual yang **sudah disetujui klien** dan harus menjadi acuan UI.

---

## Appendix — Daftar Singkatan

| Singkatan | Kepanjangan |
|---|---|
| NIPL | Nomor Induk Peserta Lelang |
| VA | Virtual Account |
| BAST | Berita Acara Serah Terima |
| KYC | Know Your Customer |
| eKYC | Electronic Know Your Customer |
| FCM | Firebase Cloud Messaging |
| PM | Project Manager |
| PRD | Product Requirements Document |
| UAT | User Acceptance Testing |
| SLA | Service Level Agreement |
| CI/CD | Continuous Integration / Continuous Deployment |
| ERD | Entity-Relationship Diagram |
| OTP | One-Time Password |
| JWT | JSON Web Token |

---

*Dokumen ini bersifat hidup (living document). Perubahan signifikan harus disetujui oleh Tech Lead dan PM, kemudian dikomunikasikan ke seluruh tim.*

**Terakhir diperbarui:** Juni 2026 | **Dibuat oleh:** Tim Indo-Lelang
