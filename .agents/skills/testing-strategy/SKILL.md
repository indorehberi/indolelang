---
name: testing-strategy
description: Strategi testing lengkap Indo-Lelang — SLA Performa, skenario k6 load testing, Playwright E2E, Test Users, dan kriteria Security/Performance. Gunakan skill ini saat menulis test atau menyiapkan QA pipeline.
---

# Testing Strategy & QA Blueprint

## 1. Test Pyramid & Coverage

- **Unit Test (60%):** Jest (Backend) & Flutter Test (Mobile). Fokus pada business logic (validateBid, calculateAntiSnipe, determineWinner, calculateInvoice). Coverage target > 80%.
- **Integration Test (25%):** Supertest. Test interaksi antar modul (contoh: Auth flow, Payment VA → Webhook).
- **E2E Test (15%):** Playwright. User journey lengkap di web admin dan public.
- **Load & Security Test:** k6 dan OWASP ZAP (ZED Attack Proxy).

## 2. Test Users & Mock Data

Selalu sediakan seed data ini untuk testing (jangan hardcode data asli):
- **Superadmin:** `admin@indolelang.com`
- **Operator Cabang:** `operator.jkt@indolelang.com`
- **Bidder 1 (Active NIPL):** `bidder1@example.com`
- **Bidder 2 (Active NIPL):** `bidder2@example.com`
- **Provider:** `provider@company.com`

**Midtrans Sandbox Test Cards:**
- Success: `4811 1111 1111 1114`
- Denied: `4911 1111 1111 1113`
- Insufficient: `4711 1111 1111 1110`

## 3. SLA Performa (Service Level Agreement) — KRITIS

Jika hasil load test tidak memenuhi target ini, deployment **ditolak** (Go-Live diblokir):

| Metrik | Target SLA | Kondisi Gagal |
|---|---|---|
| API Response Time (P95) | < 500ms | > 1000ms |
| WebSocket Connect | < 1 detik | > 3 detik |
| WS Latency (Bid → Broadcast) | < 200ms | > 500ms |
| API Error Rate | < 1% | > 5% |
| Throughput Maksimal | > 500 req/s | < 100 req/s |
| Max Concurrent WS (Bidding) | 500 koneksi stabil | Crash < 100 |
| DB Query Time (P95) | < 100ms | > 500ms |
| PDF Generation (Invoice) | < 5 detik | > 30 detik |

## 4. End-to-End (E2E) Scenarios (Playwright)

| Skenario | Langkah Pengujian | Verifikasi Akhir |
|---|---|---|
| **Registrasi Bidder** | Form → OTP → Upload KTP → Submit | Status "Menunggu Verifikasi", data KTP ada di DB admin. |
| **Deposit VA Flow** | Login → Pilih Sesi → Order VA BCA → Hit Webhook Midtrans Sandbox | Status "Lunas", NIPL muncul di dashboard bidder. |
| **Live Bidding (Multi-User)** | Admin mulai lot → Bidder1 bid → Bidder2 outbid → Admin Ketok Palu | Bidder2 dapat Invoice, Bidder1 dapat notifikasi kalah. History bid di admin log sesuai. |
| **Provider Submit Barang** | Provider isi form → Upload Foto → Submit → Admin Approve | Barang masuk ke "Daftar Aset" dengan status "Approved". |

## 5. K6 Load Testing Scenarios

### A. Catalog Load Test (Browsing)
- Ramping VUs: 50 → 200 → 50 (dalam 15 menit).
- Endpoint yang dites: `GET /api/v1/sessions`, `GET /api/v1/sessions/:id/lots`.
- Memastikan public API tahan ddos/lonjakan trafik organik.

### B. Live Bidding Load Test (WebSocket)
- 50-100 VUs terhubung ke satu WebSocket room.
- Setiap VU memancarkan event `bid:submit` secara acak (30% probability) setiap kali ada `bid:update`.
- Verifikasi koneksi tidak terputus dan broadcast delay < 200ms saat ada banyak bid simultan.

## 6. Security Testing Checklist

- **No Broken Access Control:** Endpoint admin (`/api/v1/admin/*`) mereturn `403 Forbidden` jika diakses oleh Bidder.
- **Data Isolation:** User hanya bisa mengakses NIPL, Invoice, Profil milik sendiri.
- **Rate Limiting Aktif:** 5 failed logins = block 15 menit. API bids max 1/sec.
- **Token Security:** JWT Refresh Token diletakkan di `HttpOnly` cookie (XSS protection). Access Token pendek (15m).
- **Security Headers:** HSTS, X-Content-Type-Options: nosniff, X-Frame-Options: DENY ada di semua response API.

## 7. QA Pipeline CI/CD

```
Push ke PR → Lint & Formatting
           → Jest Unit Tests
           → Jest Integration Tests
           → (Jika lolos) Merge ke develop
           → Deploy ke Staging
           → Run Playwright E2E di Staging
           → Run k6 Load Test di Staging (Scheduled Nightly)
```

## 8. Mobile App Testing

- **Widget Tests:** Pastikan formatting uang (Rp) benar. Pastikan format timer (MM:SS) benar.
- **Offline Behavior:** Putuskan koneksi, tes apakah app menampilkan halaman "Tidak Ada Koneksi" dengan baik, tidak force close.
- **Device Fragmentation:** Wajib dites manual di layar berukuran kecil (misal iPhone SE / Android jadul) untuk memastikan UI tidak overflow (overflow pixels error di Flutter).
