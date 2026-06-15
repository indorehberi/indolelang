# 🧪 BLUEPRINT TESTING OTOMATIS — Platform Lelang Digital Indo-Lelang
### Pre-Launch Testing Strategy & Automation Guide
**Versi:** 1.0 | **Tanggal:** Juni 2026 | **Status:** SIAP DIIMPLEMENTASIKAN

---

> [!IMPORTANT]
> Dokumen ini adalah **panduan testing wajib** sebelum go-live. Seluruh testing yang tercantum di sini HARUS lulus (pass) sebelum platform dinyatakan siap diluncurkan ke publik.

---

## ❓ Dari Dalam atau Dari Luar Sistem?

**Jawaban: KEDUANYA — dengan pembagian peran yang jelas.**

```
┌─────────────────────────────────────────────────────────────────────┐
│                        STRATEGI TESTING                              │
├─────────────────────────┬───────────────────────────────────────────┤
│  DARI LUAR (Black Box)  │  DARI DALAM (White Box / Internal)        │
├─────────────────────────┼───────────────────────────────────────────┤
│ • Simulasi user nyata   │ • Unit test fungsi bisnis kritis           │
│ • E2E testing (browser) │ • Integration test antar service           │
│ • Load & stress test    │ • Database query test                      │
│ • Payment sandbox test  │ • WebSocket reliability test               │
│ • Security penetration  │ • Queue & worker test                      │
│ • API contract test     │ • Feature flag / toggle test               │
│                         │ • Audit trail & log verification           │
├─────────────────────────┼───────────────────────────────────────────┤
│ Tools: k6, Playwright,  │ Tools: Jest, PHPUnit, Supertest,          │
│ OWASP ZAP, Postman      │ Artillery, custom Node.js scripts         │
└─────────────────────────┴───────────────────────────────────────────┘
```

**Filosofi:** Dari luar = apa yang pengguna rasakan. Dari dalam = apa yang terjadi di balik layar. Keduanya wajib lulus untuk go-live.

---

## 📋 Daftar Isi

1. [Kategori Testing & Tools](#1-kategori-testing--tools)
2. [Layer Testing Architecture](#2-layer-testing-architecture)
3. [Testing Environment](#3-testing-environment)
4. [Phase A — Unit & Integration Test](#4-phase-a--unit--integration-test)
5. [Phase B — API Contract & Functional Test](#5-phase-b--api-contract--functional-test)
6. [Phase C — End-to-End (E2E) Test](#6-phase-c--end-to-end-e2e-test)
7. [Phase D — Payment Testing](#7-phase-d--payment-testing)
8. [Phase E — Load & Stress Test](#8-phase-e--load--stress-test)
9. [Phase F — WebSocket & Queue Testing](#9-phase-f--websocket--queue-testing)
10. [Phase G — Security Testing](#10-phase-g--security-testing)
11. [Phase H — Mobile Testing](#11-phase-h--mobile-testing)
12. [Go-Live Readiness Checklist](#12-go-live-readiness-checklist)
13. [Cara Menjalankan Semua Test](#13-cara-menjalankan-semua-test)
14. [Reporting & Dashboard](#14-reporting--dashboard)

---

## 1. Kategori Testing & Tools

| Kategori | Tujuan | Tool Utama | Dari Luar/Dalam |
|---|---|---|---|
| **Unit Test** | Validasi fungsi kritis per unit | Jest / PHPUnit | Dalam |
| **Integration Test** | Validasi antar service/modul | Supertest / Jest | Dalam |
| **API Contract Test** | Validasi response API sesuai spec | Postman / Newman | Luar |
| **E2E Test** | Simulasi alur pengguna lengkap | Playwright | Luar |
| **Payment Test** | Validasi alur pembayaran sandbox | Midtrans Sandbox | Luar |
| **Load Test** | Uji ketahanan beban normal | k6 | Luar |
| **Stress Test** | Uji batas maksimum sistem | k6 + Artillery | Luar |
| **WebSocket Test** | Uji stabilitas live bidding | Artillery + ws | Luar/Dalam |
| **Queue Test** | Uji antrian notifikasi & email | Custom script | Dalam |
| **Security Test** | Uji keamanan (OWASP Top 10) | OWASP ZAP | Luar |
| **Mobile Test** | Uji aplikasi Flutter iOS & Android | Flutter Test | Dalam |
| **Smoke Test** | Cek cepat sistem masih hidup | Custom script | Luar |

---

## 2. Layer Testing Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     TEST PYRAMID                                  │
│                                                                   │
│                        ▲  E2E Test          ← Sedikit, lambat   │
│                       ▲ ▲  Integration Test                      │
│                      ▲ ▲ ▲  API Contract Test                    │
│                     ▲ ▲ ▲ ▲  Unit Test      ← Banyak, cepat     │
│                                                                   │
│  Load Test ◄────────────────────────────────► Security Test      │
│  (Horizontal — berjalan paralel, bukan di atas pyramid)          │
└─────────────────────────────────────────────────────────────────┘
```

### Prinsip Test Pyramid
- **Unit Test (60%):** Paling banyak, paling cepat, paling murah. Jalankan setiap commit.
- **Integration Test (25%):** Validasi antar komponen. Jalankan setiap PR.
- **E2E Test (15%):** Paling sedikit karena lambat. Jalankan sebelum deploy ke Staging dan Production.
- **Load & Security (Terpisah):** Dijalankan terjadwal (harian/mingguan) atau sebelum go-live.

---

## 3. Testing Environment

### Environment yang Digunakan untuk Testing

| Environment | Digunakan Untuk | Data |
|---|---|---|
| **Local** | Unit test, Integration test developer | Seeded / mock data |
| **Staging** | E2E test, Load test, UAT | Mirroring production (anonim) |
| **Sandbox** | Payment test (Midtrans/Xendit) | Kartu uji coba resmi provider |

> [!WARNING]
> **JANGAN PERNAH** menjalankan load test atau security test di environment Production. Selalu gunakan Staging.

### Setup Database Testing

```sql
-- Jalankan sebelum testing: seed data uji coba
INSERT INTO users (name, email, role) VALUES
  ('Test Bidder 01', 'bidder01@test.com', 'bidder'),
  ('Test Bidder 02', 'bidder02@test.com', 'bidder'),
  ('Test Admin',     'admin@test.com',    'admin'),
  ('Test Operator',  'operator@test.com', 'operator');

-- Buat sesi lelang demo
INSERT INTO auction_sessions (title, status, start_at) VALUES
  ('Sesi Test Pre-Launch', 'scheduled', NOW() + INTERVAL '1 hour');
```

---

## 4. Phase A — Unit & Integration Test

### A.1 Setup Jest (Backend Node.js)

```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/config/**',
    '!src/migrations/**',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  setupFilesAfterFramework: ['./tests/setup.js'],
};
```

### A.2 Unit Test — Auction Engine (KRITIS)

```javascript
// tests/unit/auctionEngine.test.js
const { validateBid, calculateAntiSnipe, determineWinner } = require('../../src/services/auctionEngine');

describe('Auction Engine — Core Logic', () => {

  describe('validateBid()', () => {
    const mockLot = {
      currentPrice: 10_000_000,
      minIncrement: 500_000,
      reservePrice: 8_000_000,
      status: 'active',
    };

    test('✅ Bid valid — harga di atas minimum increment', () => {
      const result = validateBid({ amount: 10_500_000, lot: mockLot, userId: 'user-1' });
      expect(result.valid).toBe(true);
    });

    test('❌ Bid ditolak — harga di bawah minimum increment', () => {
      const result = validateBid({ amount: 10_200_000, lot: mockLot, userId: 'user-1' });
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('BID_BELOW_INCREMENT');
    });

    test('❌ Bid ditolak — lot sudah closed', () => {
      const closedLot = { ...mockLot, status: 'closed' };
      const result = validateBid({ amount: 11_000_000, lot: closedLot, userId: 'user-1' });
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('LOT_NOT_ACTIVE');
    });

    test('❌ Bid ditolak — user bid terhadap dirinya sendiri', () => {
      const lotWithSameBidder = { ...mockLot, currentHighestBidderId: 'user-1' };
      const result = validateBid({ amount: 11_000_000, lot: lotWithSameBidder, userId: 'user-1' });
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('SELF_BID_NOT_ALLOWED');
    });
  });

  describe('calculateAntiSnipe()', () => {
    test('✅ Waktu DIPERPANJANG jika bid masuk dalam 2 menit terakhir', () => {
      const timeRemainingMs = 90_000; // 90 detik
      const config = { antiSnipeThresholdMs: 120_000, extensionMs: 120_000 };
      const result = calculateAntiSnipe(timeRemainingMs, config);
      expect(result.extended).toBe(true);
      expect(result.newTimeRemainingMs).toBe(120_000);
    });

    test('✅ Waktu TIDAK diperpanjang jika bid masuk lebih dari 2 menit sebelum habis', () => {
      const timeRemainingMs = 300_000; // 5 menit
      const config = { antiSnipeThresholdMs: 120_000, extensionMs: 120_000 };
      const result = calculateAntiSnipe(timeRemainingMs, config);
      expect(result.extended).toBe(false);
    });
  });

  describe('determineWinner()', () => {
    test('✅ Pemenang adalah bidder dengan harga tertinggi', () => {
      const bids = [
        { userId: 'user-1', amount: 10_000_000, timestamp: new Date('2026-06-15T10:00:00Z') },
        { userId: 'user-2', amount: 12_000_000, timestamp: new Date('2026-06-15T10:01:00Z') },
        { userId: 'user-3', amount: 11_500_000, timestamp: new Date('2026-06-15T10:02:00Z') },
      ];
      const winner = determineWinner(bids);
      expect(winner.userId).toBe('user-2');
      expect(winner.amount).toBe(12_000_000);
    });

    test('✅ Jika harga sama, pemenang adalah yang lebih dulu bid (timestamp lebih awal)', () => {
      const bids = [
        { userId: 'user-1', amount: 10_000_000, timestamp: new Date('2026-06-15T10:01:00Z') },
        { userId: 'user-2', amount: 10_000_000, timestamp: new Date('2026-06-15T10:00:00Z') },
      ];
      const winner = determineWinner(bids);
      expect(winner.userId).toBe('user-2'); // lebih dulu
    });
  });
});
```

### A.3 Unit Test — Payment & VA

```javascript
// tests/unit/paymentService.test.js
const { generateVA, calculateDeposit, validateVAExpiry } = require('../../src/services/paymentService');

describe('Payment Service', () => {

  describe('generateVA()', () => {
    test('✅ VA generated dengan format yang benar (BCA)', async () => {
      const va = await generateVA({ bank: 'BCA', userId: 'user-1', amount: 5_000_000 });
      expect(va).toMatchObject({
        vaNumber: expect.stringMatching(/^\d{16}$/),
        bank: 'BCA',
        amount: 5_000_000,
        expiresAt: expect.any(Date),
      });
    });

    test('✅ VA expired setelah durasi yang dikonfigurasi (default: 24 jam)', () => {
      const va = { expiresAt: new Date(Date.now() - 1000) }; // 1 detik lalu
      expect(validateVAExpiry(va)).toBe(false);
    });

    test('✅ VA masih valid jika belum expired', () => {
      const va = { expiresAt: new Date(Date.now() + 3_600_000) }; // 1 jam lagi
      expect(validateVAExpiry(va)).toBe(true);
    });
  });

  describe('calculateDeposit()', () => {
    test('✅ Deposit kendaraan = 10% dari harga limit', () => {
      const deposit = calculateDeposit({ category: 'vehicle', limitPrice: 50_000_000 });
      expect(deposit).toBe(5_000_000);
    });

    test('✅ Deposit properti = 20% dari harga limit', () => {
      const deposit = calculateDeposit({ category: 'property', limitPrice: 100_000_000 });
      expect(deposit).toBe(20_000_000);
    });

    test('✅ Deposit tidak boleh kurang dari minimum (Rp 1.000.000)', () => {
      const deposit = calculateDeposit({ category: 'vehicle', limitPrice: 5_000_000 });
      expect(deposit).toBeGreaterThanOrEqual(1_000_000);
    });
  });
});
```

### A.4 Integration Test — Auth Flow

```javascript
// tests/integration/auth.test.js
const request = require('supertest');
const app = require('../../src/app');
const db = require('../../src/database');

describe('Auth API — Integration', () => {
  let testUser;

  beforeAll(async () => {
    await db.migrate.latest();
    await db.seed.run();
  });

  afterAll(async () => {
    await db.destroy();
  });

  test('✅ POST /api/auth/register — Registrasi bidder baru berhasil', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Andi Test',
        email: 'andi.test@example.com',
        password: 'Password123!',
        phone: '081234567890',
        role: 'bidder',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('userId');
    testUser = res.body.data;
  });

  test('❌ POST /api/auth/register — Email duplikat ditolak', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Duplikat User',
        email: 'andi.test@example.com',
        password: 'Password123!',
        phone: '089876543210',
        role: 'bidder',
      });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('EMAIL_ALREADY_EXISTS');
  });

  test('✅ POST /api/auth/login — Login berhasil, mendapat JWT', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'andi.test@example.com', password: 'Password123!' });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('accessToken');
    expect(res.body.data).toHaveProperty('refreshToken');
  });

  test('❌ POST /api/auth/login — Password salah ditolak', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'andi.test@example.com', password: 'WrongPassword!' });

    expect(res.status).toBe(401);
    expect(res.body.code).toBe('INVALID_CREDENTIALS');
  });

  test('❌ POST /api/auth/login — Rate limit setelah 5x gagal', async () => {
    for (let i = 0; i < 5; i++) {
      await request(app).post('/api/auth/login')
        .send({ email: 'andi.test@example.com', password: 'Wrong!' });
    }
    const res = await request(app).post('/api/auth/login')
      .send({ email: 'andi.test@example.com', password: 'Wrong!' });

    expect(res.status).toBe(429);
    expect(res.body.code).toBe('RATE_LIMIT_EXCEEDED');
  });
});
```

---

## 5. Phase B — API Contract & Functional Test

### B.1 Postman / Newman Collection

Jalankan seluruh Postman Collection via CLI (Newman):

```bash
# Install Newman
npm install -g newman newman-reporter-htmlextra

# Jalankan collection dengan environment staging
newman run tests/postman/IndoLelang_API.postman_collection.json \
  --environment tests/postman/staging.postman_environment.json \
  --reporters cli,htmlextra \
  --reporter-htmlextra-export reports/api-test-report.html \
  --delay-request 200
```

### B.2 Daftar Endpoint Wajib Ditest

```javascript
// tests/postman/scenarios.js — referensi test case manual Postman

const REQUIRED_API_TESTS = [
  // AUTH
  { method: 'POST', path: '/api/auth/register',    expect: 201, desc: 'Register bidder baru' },
  { method: 'POST', path: '/api/auth/login',        expect: 200, desc: 'Login berhasil' },
  { method: 'POST', path: '/api/auth/refresh',      expect: 200, desc: 'Refresh token' },
  { method: 'POST', path: '/api/auth/logout',       expect: 200, desc: 'Logout' },

  // AUCTION SESSION
  { method: 'GET',  path: '/api/sessions',          expect: 200, desc: 'List sesi lelang publik' },
  { method: 'GET',  path: '/api/sessions/:id',      expect: 200, desc: 'Detail sesi lelang' },
  { method: 'POST', path: '/api/sessions',          expect: 201, desc: 'Buat sesi (admin only)' },

  // LOTS
  { method: 'GET',  path: '/api/sessions/:id/lots', expect: 200, desc: 'List lot dalam sesi' },
  { method: 'GET',  path: '/api/lots/:id',          expect: 200, desc: 'Detail lot' },

  // NIPL & DEPOSIT
  { method: 'POST', path: '/api/nipl/register',     expect: 201, desc: 'Daftar NIPL' },
  { method: 'POST', path: '/api/payment/va',        expect: 201, desc: 'Generate VA' },
  { method: 'GET',  path: '/api/payment/va/:id',    expect: 200, desc: 'Cek status VA' },

  // BIDDING
  { method: 'POST', path: '/api/bids',              expect: 201, desc: 'Pasang bid' },
  { method: 'GET',  path: '/api/lots/:id/bids',     expect: 200, desc: 'Riwayat bid lot' },

  // INVOICE & DOKUMEN
  { method: 'GET',  path: '/api/invoices/:id',      expect: 200, desc: 'Detail invoice pemenang' },
  { method: 'GET',  path: '/api/invoices/:id/pdf',  expect: 200, desc: 'Download invoice PDF' },
  { method: 'GET',  path: '/api/bast/:id/pdf',      expect: 200, desc: 'Download BAST PDF' },

  // ADMIN
  { method: 'GET',  path: '/api/admin/users',       expect: 200, desc: 'List user (admin only)' },
  { method: 'GET',  path: '/api/admin/dashboard',   expect: 200, desc: 'Dashboard KPI admin' },
  { method: 'PATCH',path: '/api/admin/settings',    expect: 200, desc: 'Update feature toggle' },
];
```

### B.3 Validasi Response Format

```javascript
// tests/helpers/responseValidator.js
function validateApiResponse(res, expectedStatus) {
  // Cek HTTP status code
  expect(res.status).toBe(expectedStatus);

  // Cek Content-Type
  expect(res.headers['content-type']).toMatch(/application\/json/);

  // Cek struktur response
  if (expectedStatus >= 200 && expectedStatus < 300) {
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('data');
  } else {
    expect(res.body).toHaveProperty('success', false);
    expect(res.body).toHaveProperty('code');
    expect(res.body).toHaveProperty('message');
  }

  // Cek tidak ada field sensitif yang bocor
  const bodyStr = JSON.stringify(res.body);
  expect(bodyStr).not.toMatch(/password/i);
  expect(bodyStr).not.toMatch(/secret/i);
  expect(bodyStr).not.toMatch(/private_key/i);
}
```

---

## 6. Phase C — End-to-End (E2E) Test

### C.1 Setup Playwright

```javascript
// playwright.config.js
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  retries: 1,
  reporter: [['html', { outputFolder: 'reports/e2e' }]],
  use: {
    baseURL: process.env.STAGING_URL || 'https://staging.indolelang.com',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
  },
  projects: [
    { name: 'Desktop Chrome', use: { ...devices['Desktop Chrome'] } },
    { name: 'Mobile Safari', use: { ...devices['iPhone 14'] } },
    { name: 'Mobile Android', use: { ...devices['Pixel 7'] } },
  ],
});
```

### C.2 E2E Test — Alur Pendaftaran Peserta (Happy Path)

```javascript
// tests/e2e/bidder-registration.spec.js
const { test, expect } = require('@playwright/test');

test.describe('Alur Pendaftaran Bidder', () => {

  test('✅ Bidder dapat mendaftar, isi data, upload KTP, dan mendapat NIPL', async ({ page }) => {
    // Step 1: Buka halaman registrasi
    await page.goto('/daftar');
    await expect(page).toHaveTitle(/Daftar Peserta/);

    // Step 2: Isi form data pribadi
    await page.fill('#input-name', 'Budi Santoso Test');
    await page.fill('#input-email', `bidder-${Date.now()}@test.com`);
    await page.fill('#input-phone', '081234567890');
    await page.fill('#input-password', 'Password123!');
    await page.fill('#input-confirm-password', 'Password123!');
    await page.click('#btn-next-step');

    // Step 3: Upload KTP
    await page.setInputFiles('#upload-ktp', 'tests/fixtures/sample-ktp.jpg');
    await page.setInputFiles('#upload-selfie', 'tests/fixtures/sample-selfie.jpg');
    await page.click('#btn-submit-kyc');

    // Step 4: Verifikasi halaman konfirmasi muncul
    await expect(page.locator('#status-verification')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('#status-verification')).toContainText('Menunggu Verifikasi');

    // Screenshot bukti
    await page.screenshot({ path: 'reports/e2e/screenshots/bidder-registration-success.png' });
  });

});
```

### C.3 E2E Test — Alur Pemesanan VA & Pembayaran

```javascript
// tests/e2e/va-payment-flow.spec.js
const { test, expect } = require('@playwright/test');

test.describe('Alur VA & Pembayaran', () => {

  test.beforeEach(async ({ page }) => {
    // Login sebagai bidder yang sudah terverifikasi
    await page.goto('/login');
    await page.fill('#input-email', 'verified-bidder@test.com');
    await page.fill('#input-password', 'Password123!');
    await page.click('#btn-login');
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('✅ Bidder dapat memesan NIPL, mendapat VA, dan sistem mendeteksi pembayaran', async ({ page }) => {
    // Step 1: Buka halaman sesi lelang
    await page.goto('/sesi/test-session-001');
    await page.click('#btn-daftar-nipl');

    // Step 2: Pilih bank VA
    await page.click('#option-bank-bca');
    await page.click('#btn-pesan-va');

    // Step 3: Verifikasi VA number muncul
    await expect(page.locator('#va-number')).toBeVisible({ timeout: 10_000 });
    const vaNumber = await page.locator('#va-number').textContent();
    expect(vaNumber).toMatch(/^\d{16}$/);

    // Step 4: Verifikasi countdown timer aktif
    await expect(page.locator('#va-countdown')).toBeVisible();
    await expect(page.locator('#va-countdown')).toContainText(/jam|menit/);

    // Step 5: Simulasi webhook pembayaran berhasil (via API internal)
    // (Dalam test nyata, Midtrans sandbox akan mengirim webhook)
    await page.evaluate(async () => {
      await fetch('/api/test/simulate-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vaNumber: window._testVaNumber }),
      });
    });

    // Step 6: Verifikasi status berubah menjadi "Lunas"
    await expect(page.locator('#payment-status')).toContainText('Lunas', { timeout: 15_000 });
    await expect(page.locator('#nipl-number')).toBeVisible();
  });

});
```

### C.4 E2E Test — Alur Live Bidding (Admin + Bidder)

```javascript
// tests/e2e/live-bidding.spec.js
const { test, expect, chromium } = require('@playwright/test');

test.describe('Live Bidding — Multi User', () => {

  test('✅ Operator mulai lot, 2 bidder ber-kompetisi, pemenang mendapat invoice', async () => {
    const browser = await chromium.launch();

    // Context terpisah untuk setiap user
    const adminContext = await browser.newContext({ storageState: 'tests/fixtures/admin-auth.json' });
    const bidder1Context = await browser.newContext({ storageState: 'tests/fixtures/bidder1-auth.json' });
    const bidder2Context = await browser.newContext({ storageState: 'tests/fixtures/bidder2-auth.json' });

    const adminPage = await adminContext.newPage();
    const bidder1Page = await bidder1Context.newPage();
    const bidder2Page = await bidder2Context.newPage();

    // Admin: Buka kontrol lelang
    await adminPage.goto('/admin/live/test-session-001');
    await expect(adminPage.locator('#lot-status')).toContainText('Siap');

    // Bidder 1 & 2: Buka bidding room
    await bidder1Page.goto('/bidding-room/test-session-001');
    await bidder2Page.goto('/bidding-room/test-session-001');

    // Admin: Mulai Lot 1
    await adminPage.click('#btn-start-lot');
    await expect(adminPage.locator('#lot-status')).toContainText('Berjalan');

    // Bidder 1 pasang bid
    await bidder1Page.click('#btn-bid');
    await bidder1Page.fill('#bid-amount', '11000000');
    await bidder1Page.click('#btn-confirm-bid');
    await expect(bidder1Page.locator('#current-price')).toContainText('11.000.000');

    // Verifikasi Bidder 2 juga melihat update harga (real-time)
    await expect(bidder2Page.locator('#current-price')).toContainText('11.000.000', { timeout: 5_000 });

    // Bidder 2 pasang bid lebih tinggi
    await bidder2Page.click('#btn-bid');
    await bidder2Page.fill('#bid-amount', '12000000');
    await bidder2Page.click('#btn-confirm-bid');

    // Admin: Ketok palu
    await adminPage.click('#btn-hammer');
    await adminPage.click('#btn-confirm-hammer');

    // Verifikasi: Bidder 2 mendapat invoice
    await expect(bidder2Page.locator('#invoice-modal')).toBeVisible({ timeout: 10_000 });
    await expect(bidder2Page.locator('#invoice-modal')).toContainText('Selamat! Anda Memenangkan');

    // Verifikasi: Bidder 1 mendapat notifikasi kalah
    await expect(bidder1Page.locator('#lose-notification')).toBeVisible({ timeout: 10_000 });
    await expect(bidder1Page.locator('#lose-notification')).toContainText('Dimenangkan oleh');

    await browser.close();
  });

});
```

---

## 7. Phase D — Payment Testing

### D.1 Skenario Payment Sandbox (Midtrans)

```javascript
// tests/payment/midtrans-scenarios.test.js
const request = require('supertest');
const app = require('../../src/app');

describe('Payment Scenarios — Midtrans Sandbox', () => {
  const headers = { Authorization: 'Bearer <BIDDER_TEST_TOKEN>' };

  const MIDTRANS_TEST_CARDS = {
    success:         { number: '4811 1111 1111 1114', exp: '01/25', cvv: '123' },
    denied:          { number: '4911 1111 1111 1113', exp: '01/25', cvv: '123' },
    challengeOTP:    { number: '4811 1111 1111 1114', exp: '01/25', cvv: '123', otp: '112233' },
    insufficient:    { number: '4711 1111 1111 1110', exp: '01/25', cvv: '123' },
  };

  test('✅ SC-PAY-01: VA BCA berhasil dibuat dan amount benar', async () => {
    const res = await request(app)
      .post('/api/payment/va')
      .set(headers)
      .send({ bank: 'BCA', niplId: 'nipl-test-001' });

    expect(res.status).toBe(201);
    expect(res.body.data.vaNumber).toMatch(/^\d+$/);
    expect(res.body.data.amount).toBeGreaterThan(0);
    expect(res.body.data.bank).toBe('BCA');
  });

  test('✅ SC-PAY-02: VA Mandiri berhasil dibuat', async () => {
    const res = await request(app)
      .post('/api/payment/va')
      .set(headers)
      .send({ bank: 'MANDIRI', niplId: 'nipl-test-002' });

    expect(res.status).toBe(201);
    expect(res.body.data.bank).toBe('MANDIRI');
  });

  test('✅ SC-PAY-03: Webhook Midtrans "settlement" diproses dengan benar', async () => {
    // Simulasi webhook dari Midtrans
    const webhookPayload = {
      transaction_status: 'settlement',
      order_id: 'VA-TEST-001',
      gross_amount: '5000000.00',
      payment_type: 'bank_transfer',
      signature_key: '<CALCULATED_SIGNATURE>',
    };

    const res = await request(app)
      .post('/api/webhooks/midtrans')
      .send(webhookPayload);

    expect(res.status).toBe(200);

    // Verifikasi status NIPL di database berubah menjadi PAID
    const niplRes = await request(app)
      .get('/api/nipl/nipl-test-001')
      .set(headers);
    expect(niplRes.body.data.status).toBe('PAID');
  });

  test('✅ SC-PAY-04: Refund NIPL untuk peserta yang kalah semua lot', async () => {
    const res = await request(app)
      .post('/api/payment/refund')
      .set({ Authorization: 'Bearer <ADMIN_TEST_TOKEN>' })
      .send({ niplId: 'nipl-test-loser' });

    expect(res.status).toBe(200);
    expect(res.body.data.refundStatus).toBe('PENDING');
  });

  test('✅ SC-PAY-05: VA expired setelah 24 jam tidak dibayar', async () => {
    // Buat VA dengan expiry yang sudah lewat (manipulasi di test env)
    const res = await request(app)
      .get('/api/payment/va/expired-va-test')
      .set(headers);

    expect(res.status).toBe(410); // Gone
    expect(res.body.code).toBe('VA_EXPIRED');
  });

  test('❌ SC-PAY-06: Double payment untuk VA yang sama ditolak', async () => {
    // Kirim webhook settlement kedua untuk order yang sama
    const webhookPayload = {
      transaction_status: 'settlement',
      order_id: 'VA-TEST-001', // sudah di-settle sebelumnya
      gross_amount: '5000000.00',
    };

    const res = await request(app)
      .post('/api/webhooks/midtrans')
      .send(webhookPayload);

    // Harus diabaikan, bukan error 500
    expect([200, 409]).toContain(res.status);
  });
});
```

### D.2 Payment Test Matrix

| Skenario | Metode | Hasil yang Diharapkan | Status |
|---|---|---|---|
| VA BCA sukses | Virtual Account | Status PAID, NIPL aktif | ☐ |
| VA Mandiri sukses | Virtual Account | Status PAID, NIPL aktif | ☐ |
| VA BNI sukses | Virtual Account | Status PAID, NIPL aktif | ☐ |
| VA expired (>24 jam) | Virtual Account | Status EXPIRED, user diberi notif | ☐ |
| Webhook settlement | Midtrans Callback | DB diupdate dalam < 5 detik | ☐ |
| Webhook pending | Midtrans Callback | Status tetap PENDING | ☐ |
| Refund NIPL kalah | Xendit Disbursement | Dana kembali dalam 1x24 jam | ☐ |
| Pelunasan invoice | Transfer / VA baru | Invoice lunas, dokumen tersedia | ☐ |
| Double payment | VA sama | Ditolak/diabaikan, tidak dobel kredit | ☐ |
| Partial payment | Jumlah kurang | Status tetap UNPAID | ☐ |

---

## 8. Phase E — Load & Stress Test

### E.1 Setup k6

```bash
# Install k6
# Windows: winget install k6
# Mac: brew install k6
# Linux: sudo apt install k6

# Jalankan test beban
k6 run tests/load/auction-load-test.js \
  --env BASE_URL=https://staging.indolelang.com \
  --out json=reports/load/result.json
```

### E.2 Load Test — API Katalog & Browse

```javascript
// tests/load/catalog-load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '2m', target: 50 },   // Ramp up ke 50 user dalam 2 menit
    { duration: '5m', target: 50 },   // Tahan 50 user selama 5 menit
    { duration: '2m', target: 200 },  // Spike ke 200 user
    { duration: '2m', target: 200 },  // Tahan 200 user (puncak)
    { duration: '2m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95% request harus < 500ms
    http_req_failed: ['rate<0.01'],    // Error rate < 1%
    errors: ['rate<0.01'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'https://staging.indolelang.com';

export default function () {
  // Simulasi user browse katalog
  const responses = http.batch([
    ['GET', `${BASE_URL}/api/sessions?page=1&limit=20`],
    ['GET', `${BASE_URL}/api/sessions/test-session-001`],
    ['GET', `${BASE_URL}/api/sessions/test-session-001/lots`],
  ]);

  responses.forEach((res) => {
    const success = check(res, {
      'status 200': (r) => r.status === 200,
      'response time < 500ms': (r) => r.timings.duration < 500,
      'body not empty': (r) => r.body.length > 0,
    });
    errorRate.add(!success);
  });

  sleep(1); // User berhenti 1 detik sebelum request berikutnya
}
```

### E.3 Load Test — Live Bidding (Skenario Puncak)

```javascript
// tests/load/bidding-load-test.js
import http from 'k6/http';
import ws from 'k6/ws';
import { check, sleep } from 'k6';

export const options = {
  scenarios: {
    // Skenario 1: User browsing (banyak)
    browsers: {
      executor: 'ramping-vus',
      stages: [
        { duration: '1m', target: 300 },
        { duration: '5m', target: 300 },
        { duration: '1m', target: 0 },
      ],
      exec: 'browseCatalog',
    },
    // Skenario 2: Active bidders di WebSocket (sedikit tapi kritis)
    bidders: {
      executor: 'constant-vus',
      vus: 50,
      duration: '7m',
      exec: 'activeBidding',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<800'],
    ws_connecting: ['p(95)<1000'], // WebSocket connect < 1 detik
    'ws_msgs_received': ['count>100'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'https://staging.indolelang.com';
const WS_URL = __ENV.WS_URL || 'wss://staging.indolelang.com';

// Skenario browsing
export function browseCatalog() {
  http.get(`${BASE_URL}/api/sessions`);
  sleep(Math.random() * 3 + 1); // Random pause 1-4 detik
}

// Skenario bidding aktif via WebSocket
export function activeBidding() {
  const token = getTestToken(__VU); // Setiap VU punya token berbeda

  const res = ws.connect(`${WS_URL}/auction/test-session-001`, { headers: { Authorization: `Bearer ${token}` } }, (socket) => {
    socket.on('open', () => {
      // Join room
      socket.send(JSON.stringify({ event: 'join_room', roomId: 'test-session-001' }));
    });

    socket.on('message', (data) => {
      const msg = JSON.parse(data);

      // Simulasi bid saat menerima update harga
      if (msg.event === 'price_update' && Math.random() < 0.3) { // 30% chance bid
        socket.send(JSON.stringify({
          event: 'place_bid',
          lotId: 'lot-001',
          amount: msg.data.currentPrice + 500_000,
        }));
      }
    });

    socket.on('error', (e) => console.error('WS Error:', e));

    socket.setTimeout(() => {
      socket.close();
    }, 60_000); // Koneksi selama 60 detik
  });

  check(res, { 'WebSocket connected': (r) => r && r.status === 101 });
}

function getTestToken(vu) {
  // Return token test berdasarkan nomor VU
  const tokens = JSON.parse(open('./fixtures/test-tokens.json'));
  return tokens[vu % tokens.length];
}
```

### E.4 Target Performa (SLA Testing)

| Metrik | Target | Kritis (Gagal jika) |
|---|---|---|
| Response time API (P95) | < 500ms | > 1000ms |
| Response time WebSocket connect | < 1 detik | > 3 detik |
| WebSocket latency (bid → broadcast) | < 200ms | > 500ms |
| Error rate API | < 1% | > 5% |
| Throughput minimum | 500 req/detik | < 100 req/detik |
| Max concurrent WebSocket | 500 koneksi stabil | Crash < 100 |
| Database query time (P95) | < 100ms | > 500ms |
| PDF generation time | < 5 detik | > 30 detik |

---

## 9. Phase F — WebSocket & Queue Testing

### F.1 WebSocket Reliability Test

```javascript
// tests/websocket/reliability.test.js
const { io } = require('socket.io-client');

const WS_URL = process.env.WS_URL || 'ws://localhost:8000';
const TIMEOUT = 10_000;

describe('WebSocket — Live Bidding Reliability', () => {

  test('✅ Koneksi WebSocket terbentuk dalam < 2 detik', (done) => {
    const start = Date.now();
    const socket = io(WS_URL, { auth: { token: process.env.TEST_BIDDER_TOKEN } });

    socket.on('connect', () => {
      const latency = Date.now() - start;
      expect(latency).toBeLessThan(2000);
      socket.disconnect();
      done();
    });

    socket.on('connect_error', (err) => done(err));
  }, TIMEOUT);

  test('✅ Bid broadcast ke semua client dalam < 500ms', (done) => {
    const socket1 = io(WS_URL, { auth: { token: process.env.TEST_BIDDER1_TOKEN } });
    const socket2 = io(WS_URL, { auth: { token: process.env.TEST_BIDDER2_TOKEN } });

    let socket1Connected = false;
    let socket2Connected = false;

    socket1.on('connect', () => {
      socket1Connected = true;
      socket1.emit('join_room', { roomId: 'test-room' });
      if (socket1Connected && socket2Connected) triggerBid();
    });

    socket2.on('connect', () => {
      socket2Connected = true;
      socket2.emit('join_room', { roomId: 'test-room' });
      if (socket1Connected && socket2Connected) triggerBid();
    });

    const bidTime = { sent: 0 };

    function triggerBid() {
      bidTime.sent = Date.now();
      socket1.emit('place_bid', { lotId: 'lot-001', amount: 11_000_000 });
    }

    socket2.on('price_update', (data) => {
      const latency = Date.now() - bidTime.sent;
      expect(latency).toBeLessThan(500);
      socket1.disconnect();
      socket2.disconnect();
      done();
    });
  }, TIMEOUT);

  test('✅ Sistem pulih otomatis setelah koneksi terputus (reconnect)', (done) => {
    const socket = io(WS_URL, {
      auth: { token: process.env.TEST_BIDDER_TOKEN },
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 1000,
    });

    let disconnected = false;

    socket.on('connect', () => {
      if (!disconnected) {
        disconnected = true;
        // Simulasi putus koneksi
        socket.io.engine.close();
      } else {
        // Berhasil reconnect
        expect(socket.connected).toBe(true);
        socket.disconnect();
        done();
      }
    });
  }, TIMEOUT * 3);

});
```

### F.2 Queue (Antrian) Test

```javascript
// tests/queue/notification-queue.test.js
const { addToQueue, getQueueLength, processQueue } = require('../../src/services/queueService');

describe('Message Queue — Notification & Email', () => {

  test('✅ Job email ditambahkan ke queue dengan benar', async () => {
    const job = await addToQueue('send_email', {
      to: 'bidder@test.com',
      subject: 'Test Notifikasi',
      template: 'bid_won',
      data: { lotTitle: 'Mobil Test', winAmount: 10_000_000 },
    });

    expect(job.id).toBeDefined();
    expect(job.status).toBe('queued');
  });

  test('✅ Job diproses dan tidak ada yang "stuck" lebih dari 5 menit', async () => {
    const queueLength = await getQueueLength('send_email');
    const stuckJobs = await getQueueLength('send_email', { olderThan: 300 }); // 5 menit

    expect(stuckJobs).toBe(0); // Tidak ada job stuck
  });

  test('✅ Push notification job berhasil dikirim via FCM', async () => {
    const job = await addToQueue('send_push_notification', {
      userId: 'test-user-001',
      title: 'Sesi Lelang Dimulai!',
      body: 'Sesi Jakarta Batch 3 baru saja dimulai.',
      data: { sessionId: 'test-session-001' },
    });

    // Tunggu sampai diproses
    await new Promise(resolve => setTimeout(resolve, 2000));
    const processed = await getJobById(job.id);
    expect(processed.status).toBe('completed');
  });

  test('✅ Job gagal di-retry otomatis (max 3x percobaan)', async () => {
    // Simulasi job yang selalu gagal
    const job = await addToQueue('send_email', {
      to: 'invalid-email', // akan gagal
      forceError: true,
    });

    await new Promise(resolve => setTimeout(resolve, 10_000));
    const failedJob = await getJobById(job.id);
    expect(failedJob.attempts).toBe(3);
    expect(failedJob.status).toBe('failed');
  });

});
```

---

## 10. Phase G — Security Testing

### G.1 OWASP Top 10 Checklist

```bash
# Install OWASP ZAP (GUI atau CLI)
# https://www.zaproxy.org/download/

# Jalankan baseline scan via Docker
docker run --rm -v $(pwd)/reports:/zap/wrk/:rw \
  ghcr.io/zaproxy/zaproxy:stable zap-baseline.py \
  -t https://staging.indolelang.com \
  -r zap-baseline-report.html
```

### G.2 Manual Security Test — Checklist

```javascript
// tests/security/security-checklist.test.js
const request = require('supertest');
const app = require('../../src/app');

describe('Security Tests — OWASP Top 10', () => {

  // A01: Broken Access Control
  test('❌ Bidder TIDAK bisa mengakses endpoint admin', async () => {
    const res = await request(app)
      .get('/api/admin/users')
      .set({ Authorization: 'Bearer <BIDDER_TOKEN>' });
    expect(res.status).toBe(403);
  });

  test('❌ User TIDAK bisa melihat data user lain', async () => {
    const res = await request(app)
      .get('/api/users/other-user-id/private')
      .set({ Authorization: 'Bearer <BIDDER_TOKEN>' });
    expect(res.status).toBe(403);
  });

  // A02: Cryptographic Failures
  test('✅ Password tidak tersimpan dalam plaintext', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'bidder@test.com', password: 'Password123!' });
    expect(JSON.stringify(res.body)).not.toContain('Password123!');
  });

  // A03: Injection
  test('❌ SQL Injection pada input search ditolak', async () => {
    const res = await request(app)
      .get("/api/sessions?search='; DROP TABLE sessions; --");
    expect(res.status).not.toBe(500);
    expect(res.body.success).not.toBe(false); // Harus diperlakukan sebagai search biasa
  });

  // A07: Authentication Failures
  test('❌ Token kadaluarsa ditolak', async () => {
    const expiredToken = 'eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjF9.invalid';
    const res = await request(app)
      .get('/api/profile')
      .set({ Authorization: `Bearer ${expiredToken}` });
    expect(res.status).toBe(401);
  });

  test('❌ JWT dengan signature palsu ditolak', async () => {
    const fakeToken = 'eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiYWRtaW4ifQ.FAKE_SIGNATURE';
    const res = await request(app)
      .get('/api/admin/users')
      .set({ Authorization: `Bearer ${fakeToken}` });
    expect(res.status).toBe(401);
  });

  // A09: Security Logging
  test('✅ Semua login gagal tercatat di audit log', async () => {
    await request(app).post('/api/auth/login')
      .send({ email: 'bidder@test.com', password: 'WrongPass!' });

    const auditRes = await request(app)
      .get('/api/admin/audit-log?action=LOGIN_FAILED')
      .set({ Authorization: 'Bearer <ADMIN_TOKEN>' });

    expect(auditRes.body.data.length).toBeGreaterThan(0);
    const lastLog = auditRes.body.data[0];
    expect(lastLog.action).toBe('LOGIN_FAILED');
    expect(lastLog.ip).toBeDefined();
  });

});
```

### G.3 Pengujian Headers Keamanan

```javascript
// tests/security/security-headers.test.js
const request = require('supertest');
const app = require('../../src/app');

describe('Security Headers', () => {
  let res;

  beforeAll(async () => {
    res = await request(app).get('/api/sessions');
  });

  test('✅ X-Content-Type-Options header ada', () => {
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });

  test('✅ X-Frame-Options header ada', () => {
    expect(res.headers['x-frame-options']).toMatch(/DENY|SAMEORIGIN/);
  });

  test('✅ Strict-Transport-Security (HSTS) header ada', () => {
    expect(res.headers['strict-transport-security']).toBeDefined();
  });

  test('✅ Server header tidak mengekspos versi server', () => {
    expect(res.headers['server']).toBeUndefined();
    // Atau versi disembunyikan
  });
});
```

---

## 11. Phase H — Mobile Testing

### H.1 Flutter Unit & Widget Test

```dart
// test/unit/auction_engine_test.dart
import 'package:flutter_test/flutter_test.dart';
import 'package:indolelang/domain/services/auction_service.dart';

void main() {
  group('Auction Engine — Flutter', () {

    test('✅ Format harga tampil dengan benar (Rupiah)', () {
      final formatted = AuctionService.formatCurrency(12500000);
      expect(formatted, equals('Rp 12.500.000'));
    });

    test('✅ Countdown timer dihitung dengan benar', () {
      final endTime = DateTime.now().add(const Duration(minutes: 5));
      final remaining = AuctionService.getTimeRemaining(endTime);
      expect(remaining.inMinutes, equals(4)); // Sedikit kurang karena eksekusi
    });

    test('✅ Bid amount minimum dihitung dengan benar', () {
      final minBid = AuctionService.getMinimumBid(
        currentPrice: 10000000,
        increment: 500000,
      );
      expect(minBid, equals(10500000));
    });

  });
}
```

```dart
// test/widget/bidding_room_test.dart
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:indolelang/presentation/pages/bidding_room_page.dart';

void main() {
  testWidgets('✅ Bidding Room menampilkan harga terkini', (WidgetTester tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: BiddingRoomPage(sessionId: 'test-session-001'),
      ),
    );

    await tester.pumpAndSettle();

    // Verifikasi komponen penting ada
    expect(find.byKey(const Key('current-price-display')), findsOneWidget);
    expect(find.byKey(const Key('bid-button')), findsOneWidget);
    expect(find.byKey(const Key('countdown-timer')), findsOneWidget);
  });

  testWidgets('✅ Tombol BID menampilkan dialog konfirmasi', (WidgetTester tester) async {
    await tester.pumpWidget(
      MaterialApp(home: BiddingRoomPage(sessionId: 'test-session-001')),
    );

    await tester.pumpAndSettle();
    await tester.tap(find.byKey(const Key('bid-button')));
    await tester.pumpAndSettle();

    expect(find.byKey(const Key('bid-confirmation-dialog')), findsOneWidget);
    expect(find.text('Konfirmasi Penawaran'), findsOneWidget);
  });
}
```

### H.2 Device Test Matrix

| Device | OS Version | Prioritas | Status |
|---|---|---|---|
| iPhone 15 Pro | iOS 17 | 🔴 Wajib | ☐ |
| iPhone 14 | iOS 16 | 🔴 Wajib | ☐ |
| iPhone 12 | iOS 15 | 🟡 Penting | ☐ |
| Samsung Galaxy A54 | Android 13 | 🔴 Wajib | ☐ |
| Samsung Galaxy A34 | Android 12 | 🔴 Wajib | ☐ |
| Xiaomi Redmi Note 12 | Android 13 | 🟡 Penting | ☐ |
| Google Pixel 7 | Android 14 | 🟡 Penting | ☐ |
| Oppo Reno 8 | Android 12 | 🟡 Penting | ☐ |

---

## 12. Go-Live Readiness Checklist

> [!CAUTION]
> Semua item dengan status 🔴 HARUS lulus sebelum go-live. Tidak ada pengecualian.

### ✅ Functional Testing
- [ ] 🔴 Alur registrasi bidder end-to-end berhasil
- [ ] 🔴 Alur pembayaran VA (BCA, Mandiri, BNI) berhasil di sandbox
- [ ] 🔴 Webhook Midtrans diproses dengan benar (status update < 5 detik)
- [ ] 🔴 Live bidding: bid masuk dan ter-broadcast ke semua peserta
- [ ] 🔴 Anti-sniping bekerja: waktu diperpanjang jika bid mepet
- [ ] 🔴 Pemenang ditentukan dengan benar dan invoice otomatis muncul
- [ ] 🔴 Peserta kalah mendapat notifikasi "Dimenangkan oleh..."
- [ ] 🔴 Admin dapat kontrol sesi: start lot, hammer, next lot, jeda
- [ ] 🔴 PDF Invoice, BAST, Surat Jalan dapat diunduh
- [ ] 🟡 Refund NIPL untuk peserta yang tidak menang berhasil
- [ ] 🟡 eKYC verifikasi KTP via Verihubs berhasil (jika fitur aktif)

### ✅ Performance Testing
- [ ] 🔴 Load test: 200 user bersamaan, error rate < 1%, response < 500ms
- [ ] 🔴 WebSocket: 100 koneksi bidding bersamaan stabil selama 30 menit
- [ ] 🔴 Bid broadcast latency < 500ms di bawah beban 100 bidder
- [ ] 🟡 Stress test: sistem tidak crash hingga 500 user bersamaan

### ✅ Security Testing
- [ ] 🔴 Tidak ada endpoint admin yang bisa diakses oleh bidder/provider
- [ ] 🔴 JWT expired dan signature palsu ditolak
- [ ] 🔴 Rate limiting aktif di endpoint login dan bid
- [ ] 🔴 Tidak ada API key / secret yang hardcoded di kode (cek dengan git grep)
- [ ] 🔴 Security headers aktif (HSTS, X-Frame-Options, CSP)
- [ ] 🟡 OWASP ZAP baseline scan tanpa temuan High/Critical

### ✅ Infrastructure
- [ ] 🔴 SSL certificate aktif dan tidak akan expire dalam 90 hari
- [ ] 🔴 Database backup berjalan otomatis dan pernah berhasil di-restore
- [ ] 🔴 Monitoring dan alerting aktif (notif Slack/email jika error rate > 1%)
- [ ] 🔴 Rollback plan didokumentasikan dan pernah ditest
- [ ] 🟡 CDN dikonfigurasi untuk aset statis

### ✅ Mobile
- [ ] 🔴 Aplikasi berhasil build untuk iOS (TestFlight) dan Android (Play Console Internal)
- [ ] 🔴 Ditest di minimal 4 device fisik (2 iOS, 2 Android)
- [ ] 🔴 Push notification diterima dalam < 5 detik setelah dikirim
- [ ] 🟡 Aplikasi berjalan dengan baik di koneksi 3G lambat

---

## 13. Cara Menjalankan Semua Test

### Script Utama — Jalankan Semua Test

```bash
# scripts/run-all-tests.sh

#!/bin/bash
set -e  # Stop jika ada yang gagal

echo "======================================"
echo "🧪 INDO-LELANG — PRE-LAUNCH TEST SUITE"
echo "======================================"
echo ""

# 1. Unit & Integration Test
echo "▶ [1/6] Unit & Integration Test..."
npm run test:unit -- --coverage
echo "✅ Unit Test selesai"
echo ""

# 2. API Contract Test (Newman/Postman)
echo "▶ [2/6] API Contract Test (Postman/Newman)..."
newman run tests/postman/IndoLelang_API.postman_collection.json \
  --environment tests/postman/staging.env.json \
  --reporters cli,htmlextra \
  --reporter-htmlextra-export reports/api-contract-report.html
echo "✅ API Contract Test selesai"
echo ""

# 3. E2E Test (Playwright)
echo "▶ [3/6] E2E Test (Playwright)..."
npx playwright test --reporter=html
echo "✅ E2E Test selesai"
echo ""

# 4. WebSocket & Queue Test
echo "▶ [4/6] WebSocket & Queue Test..."
npm run test:websocket
npm run test:queue
echo "✅ WebSocket & Queue Test selesai"
echo ""

# 5. Load Test (k6)
echo "▶ [5/6] Load Test (k6)..."
k6 run tests/load/catalog-load-test.js \
  --env BASE_URL=$STAGING_URL \
  --out json=reports/load/catalog-result.json

k6 run tests/load/bidding-load-test.js \
  --env BASE_URL=$STAGING_URL \
  --env WS_URL=$STAGING_WS_URL \
  --out json=reports/load/bidding-result.json
echo "✅ Load Test selesai"
echo ""

# 6. Security Headers Check
echo "▶ [6/6] Security Headers Check..."
npm run test:security
echo "✅ Security Test selesai"
echo ""

echo "======================================"
echo "🎉 SEMUA TEST SELESAI!"
echo "📊 Laporan tersedia di folder: reports/"
echo "======================================"
```

### Tambahkan ke package.json

```json
{
  "scripts": {
    "test": "jest",
    "test:unit": "jest tests/unit tests/integration",
    "test:e2e": "playwright test",
    "test:websocket": "jest tests/websocket --testTimeout=30000",
    "test:queue": "jest tests/queue --testTimeout=15000",
    "test:security": "jest tests/security",
    "test:payment": "jest tests/payment",
    "test:load": "k6 run tests/load/catalog-load-test.js",
    "test:all": "bash scripts/run-all-tests.sh",
    "test:smoke": "node scripts/smoke-test.js"
  }
}
```

### Smoke Test — Cek Cepat Sistem Hidup (Setelah Deploy)

```javascript
// scripts/smoke-test.js
const https = require('https');

const CHECKS = [
  { name: 'API Health',       url: `${process.env.API_URL}/health` },
  { name: 'API Sessions',     url: `${process.env.API_URL}/api/sessions` },
  { name: 'Admin Panel',      url: `${process.env.ADMIN_URL}` },
  { name: 'WebSocket Server', url: `${process.env.API_URL}/ws-health` },
];

async function smokeCheck(check) {
  return new Promise((resolve) => {
    const start = Date.now();
    https.get(check.url, (res) => {
      const duration = Date.now() - start;
      resolve({ ...check, status: res.statusCode, duration, ok: res.statusCode < 400 });
    }).on('error', (e) => {
      resolve({ ...check, status: 0, ok: false, error: e.message });
    });
  });
}

(async () => {
  console.log('\n🔍 Running Smoke Tests...\n');
  const results = await Promise.all(CHECKS.map(smokeCheck));

  let allPass = true;
  results.forEach((r) => {
    const icon = r.ok ? '✅' : '❌';
    const timing = r.ok ? `(${r.duration}ms)` : `(${r.error || r.status})`;
    console.log(`${icon} ${r.name}: ${r.status} ${timing}`);
    if (!r.ok) allPass = false;
  });

  console.log('');
  if (allPass) {
    console.log('🎉 Semua smoke test LULUS — sistem berjalan normal!');
    process.exit(0);
  } else {
    console.error('🚨 Ada smoke test yang GAGAL — periksa segera!');
    process.exit(1);
  }
})();
```

---

## 14. Reporting & Dashboard

### Struktur Folder Laporan

```
reports/
├── unit/
│   ├── coverage/           ← HTML coverage report
│   └── junit.xml           ← untuk CI/CD
├── api-contract-report.html
├── e2e/
│   ├── index.html          ← Playwright HTML report
│   └── screenshots/        ← Screenshot saat gagal
├── load/
│   ├── catalog-result.json
│   └── bidding-result.json
└── security/
    └── zap-baseline-report.html
```

### CI/CD Integration (GitHub Actions)

```yaml
# .github/workflows/pre-launch-tests.yml
name: Pre-Launch Testing Suite

on:
  push:
    branches: [develop, main]
  schedule:
    - cron: '0 2 * * *'  # Jalankan otomatis setiap hari jam 02:00

jobs:
  unit-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npm run test:unit -- --coverage
      - uses: actions/upload-artifact@v4
        with:
          name: coverage-report
          path: coverage/

  e2e-test:
    needs: unit-test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci && npx playwright install --with-deps
      - run: npm run test:e2e
        env:
          STAGING_URL: ${{ secrets.STAGING_URL }}
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/

  load-test:
    needs: e2e-test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Install k6
        run: |
          sudo gpg -k
          sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg \
            --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
          echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] \
            https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
          sudo apt-get update && sudo apt-get install k6
      - run: k6 run tests/load/catalog-load-test.js
        env:
          BASE_URL: ${{ secrets.STAGING_URL }}

  smoke-test-post-deploy:
    needs: [unit-test, e2e-test]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: node scripts/smoke-test.js
        env:
          API_URL: ${{ secrets.PRODUCTION_API_URL }}
          ADMIN_URL: ${{ secrets.PRODUCTION_ADMIN_URL }}
```

---

*Dokumen ini adalah panduan testing wajib sebelum go-live Indo-Lelang.*
**Terakhir diperbarui:** Juni 2026 | **Owner:** QA Lead + Tech Lead
