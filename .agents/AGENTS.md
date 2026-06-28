# 🏛️ Indo-Lelang — Global Development Rules

> Aturan ini WAJIB dipatuhi di setiap sesi coding, tanpa terkecuali.

## Tech Stack (Final)

- **Backend API:** Node.js + Express + TypeScript
- **ORM:** Prisma (PostgreSQL)
- **Cache/Realtime:** Redis
- **Admin Panel:** React.js / Next.js + TypeScript
- **Public Website:** Next.js (SSR for SEO)
- **Mobile App:** Flutter (iOS + Android)
- **Real-time:** Socket.io (WebSocket)
- **Storage:** AWS S3
- **CI/CD:** GitHub Actions + Docker

## API Response Format

SEMUA endpoint HARUS menggunakan format berikut. Tidak ada pengecualian.

### Success Response
```json
{
  "success": true,
  "data": { },
  "message": "Operasi berhasil",
  "meta": {
    "page": 1,
    "per_page": 20,
    "total": 150
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE_IN_UPPER_SNAKE_CASE",
    "message": "Pesan error yang jelas dalam Bahasa Indonesia",
    "details": { }
  }
}
```

### Error Code Naming
- `INSUFFICIENT_DEPOSIT` — bukan `insufficientDeposit` atau `insufficient-deposit`
- `LOT_NOT_ACTIVE` — bukan `lotNotActive`
- `BID_BELOW_INCREMENT` — bukan `bidBelowIncrement`

## Database Conventions

- **Tabel:** `snake_case`, plural (`users`, `auction_sessions`, `kyc_documents`)
- **Kolom:** `snake_case` (`created_at`, `hammer_price`, `is_active`)
- **Foreign Key:** `{table_singular}_id` (`user_id`, `session_id`, `lot_id`)
- **Enum values:** lowercase (`pending`, `approved`, `rejected`, bukan `PENDING`)
- **Timestamp:** Selalu gunakan `created_at` dan `updated_at`
- **Soft delete:** Gunakan `deleted_at` (nullable) jika diperlukan
- **Migrasi:** Setiap perubahan schema = 1 migration file. JANGAN edit migration yang sudah dijalankan.

## 14 Tabel Utama (Referensi Cepat)

```
users, kyc_documents, branches, auction_sessions, assets, lots, bids,
deposits, invoices, settlements, documents, notifications,
platform_settings, audit_logs
```

## Coding Standards

### Backend (Node.js/TypeScript)
- SELALU gunakan `async/await`, JANGAN callback
- SELALU validasi input server-side menggunakan Joi atau Zod
- SELALU sanitasi input untuk mencegah SQL Injection dan XSS
- JANGAN gunakan `console.log` untuk production — gunakan logger (Winston/Pino)
- JANGAN hardcode credential atau API key — gunakan environment variables
- Setiap endpoint HARUS punya error handling dengan try/catch
- Setiap business logic function HARUS punya unit test

### Frontend (React.js/Next.js)
- Gunakan TypeScript strict mode
- Komponen reusable di `packages/ui-components/`
- State management dengan React Query (server state) + Zustand (client state)
- SEMUA form harus punya validasi client-side DAN server-side

### Mobile (Flutter)
- State management: Riverpod ATAU Bloc (satu saja, jangan campur)
- Clean Architecture: `presentation/`, `domain/`, `data/`
- Semua string user-facing di file lokalisasi (`l10n`)
- Handle semua state: loading, empty, error, success

## Git Workflow

### Branch Naming
```
feature/IND-{ticket}-{nama-fitur}
bugfix/IND-{ticket}-{nama-bug}
hotfix/IND-{ticket}-{nama-hotfix}
chore/IND-{ticket}-{nama-task}
```

### Commit Convention (Conventional Commits)
```
feat(auction): implement anti-sniping extension logic
fix(payment): resolve VA expiry not resetting
security(auth): add rate limiting on login endpoint
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`, `security`

### PR Rules
- 1 task = 1 branch = 1 PR
- HARUS ada deskripsi yang jelas (apa yang berubah dan mengapa)
- HARUS di-review minimal 1 orang sebelum merge
- HARUS pass CI (lint + test) sebelum merge

## Security Rules (NON-NEGOTIABLE)

1. **JWT:** Access token expiry 15 menit, refresh token 30 hari (HttpOnly cookie)
2. **Password:** Hash dengan bcrypt (salt rounds ≥ 10)
3. **Rate limiting:** Login max 5x gagal → block 15 menit. API max 10 req/detik/user
4. **RBAC:** Setiap endpoint HARUS cek role. Bidder TIDAK BOLEH akses endpoint admin
5. **API Keys:** HARUS dienkripsi AES-256 di database. JANGAN plain text
6. **PII:** Foto KTP/selfie TIDAK disimpan di server platform (hanya di provider eKYC)
7. **HTTPS:** Wajib di semua environment kecuali local development
8. **Audit Log:** Setiap aksi admin/operator HARUS dicatat di `audit_logs` (immutable)

## Feature Toggle Principle

Setiap fitur advance HARUS dibungkus dengan feature toggle:

```typescript
// ✅ BENAR
if (await isFeatureEnabled('feat_ekyc_auto')) {
  return await verihubsService.autoVerify(data);
} else {
  return await kycService.manualQueue(data);
}

// ❌ SALAH — langsung panggil tanpa toggle
return await verihubsService.autoVerify(data);
```

Feature toggle keys yang valid:
- `feat_live_streaming` (default: OFF)
- `feat_ekyc_auto` (default: OFF)
- `feat_push_notification` (default: OFF)
- `feat_qris_payment` (default: OFF)
- `feat_esign_bast` (default: OFF)
- `feat_auto_refund` (default: OFF)
- `feat_price_alert` (default: OFF)
- `feat_multi_branch` (default: ON)
- `feat_analytics_dashboard` (default: ON)
- `feat_audit_trail` (default: ON)

## Monorepo Structure

```
indo-lelang/
├── apps/
│   ├── api/                  # Backend API
│   ├── admin-panel/          # Web Admin (React.js/Next.js)
│   ├── mobile/               # Flutter App
│   └── landing-web/          # Public website (Next.js SSR)
├── packages/
│   ├── shared-types/         # TypeScript types
│   ├── ui-components/        # Shared web UI components
│   └── utils/                # Shared utilities
├── infrastructure/
│   ├── docker/
│   ├── k8s/
│   └── terraform/
└── docs/
```

## Referensi Penting

- Blueprint teknis: `docs/blueprint/blueprint_platform_lelang.md`
- Panduan developer: `docs/blueprint/panduan_developer.md`
- Blueprint testing: `docs/blueprint/blueprint_testing.md`
- Wireframe HTML: `wireframe/` (buka di browser untuk referensi visual)
