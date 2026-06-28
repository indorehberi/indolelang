---
name: mobile-app
description: Spesifikasi pengembangan Mobile App Indo-Lelang (Flutter) — Arsitektur, State Management, Integrasi FCM, WebSocket viewer, Payment WebView, dan panduan layout responsif. Gunakan skill ini saat mengerjakan aplikasi mobile Bidder & Provider.
---

# Mobile App (Flutter) — Spesifikasi Teknis

## Arsitektur & Core Tech
- **Framework:** Flutter (iOS & Android)
- **State Management:** Riverpod atau Bloc (disepakati tim)
- **Routing:** GoRouter (untuk deep linking & push notification)
- **Networking:** Dio + Interceptors (untuk JWT & Error Handling)
- **Real-time:** Socket.io-client (Bidding Room)
- **Video Stream:** Agora RTC Engine (opsional / Feature Toggle)

## Folder Structure (Clean Architecture)

```
lib/
├── core/                   # Tema, konstan, utilitas, routing
│   ├── theme/              # Warna, tipografi (merujuk wireframe CSS)
│   ├── network/            # Dio config, API endpoints
│   ├── errors/             # Custom exceptions
│   └── router/             # GoRouter config
├── l10n/                   # Lokalisasi (semua string HARUS di sini)
├── features/               # Modul fitur
│   ├── auth/
│   │   ├── presentation/   # UI, Widgets, Controllers
│   │   ├── domain/         # Entities, Repositories interface
│   │   └── data/           # Repositories impl, Data sources
│   ├── auction/            # Bidding room, websocket
│   ├── payment/            # NIPL, VA, Midtrans
│   ├── kyc/                # Upload KTP, selfie
│   └── profile/
└── main.dart
```

## State Management Rules
- Handle SEMUA state: `Initial`, `Loading`, `Success`, `Error`.
- Jangan pernah membiarkan layar freeze atau blank tanpa indikator loading/error.
- Tampilkan error message yang ramah pengguna (terjemahan dari error code API).

## Bidding Room (WebSocket) Implementation

- Koneksi Socket.io HARUS dibuat saat masuk ke `BiddingRoomPage` dan dihancurkan saat keluar (`dispose`).
- **Cooldown Tombol Bid:** Implementasikan delay 1.2 detik setelah tombol "BID" ditekan untuk mencegah spamming. Gunakan `Timer` atau rxdart `throttleTime`.
- **Anti-Sniping Visual:** Saat `time_remaining < 10` detik, ubah warna teks timer menjadi merah. Jika ada perpanjangan (extension), tampilkan snackbar/banner "Waktu diperpanjang!".
- **Live Stream Overlay:** Video stream (Agora) ditampilkan sebagai background atau floating window, sedangkan UI bidding overlay di atasnya.

## Payment Flow (Deposit & Pelunasan)

1. User pilih bank untuk VA.
2. Hit API `/api/v1/deposits/create`.
3. Tampilkan Nomor VA (copyable) dan Countdown Expiry (misal 60 menit).
4. Sediakan tombol "Cek Status" (pull-to-refresh) atau andalkan Webhook + FCM push notif untuk update otomatis.
5. QRIS: Gunakan `WebView` atau luncurkan intent URL ke e-wallet (GoJek, OVO, dll).

## Push Notification (FCM) & Deep Linking

1. **Setup FCM:** Tangani notifikasi di `onMessage` (foreground) dan `onBackgroundMessage`.
2. **Foreground Notif:** Tampilkan in-app banner/snackbar kustom (jangan sistem default).
3. **Deep Link:** Saat notifikasi di-tap, parsing data payload (contoh: `/auction-room/:sessionId`) dan gunakan `context.go()` untuk navigasi langsung ke halaman terkait.
4. **Notif Wajib:** Deposit Sukses, Sesi Mulai (H-5m), Outbid Alert, Pemenang Lot.

## Panduan UI & Layout Responsif

- **Mobile First:** Mulai dari resolusi terkecil (320px width). Gunakan `LayoutBuilder` atau `MediaQuery` untuk scaling padding dan font size jika perlu.
- **Warna & Tema:** Gunakan konstanta dari Design System Admin Panel (Primary `#1B4F72`, Gold `#F39C12`, dll).
- **Komponen Spesifik:**
  - `CountdownTimerWidget`: Harus presisi tanpa memory leak.
  - `CurrencyFormatter`: Format semua harga menggunakan `NumberFormat.currency(locale: 'id', symbol: 'Rp ')`.
  - `LoadingOverlay`: Digunakan saat proses kritis (bayar, submit bid).
- **Offline/No Connectivity:** Tampilkan screen "Tidak ada koneksi internet" dan retry button.

## Camera & Upload (eKYC)
- Gunakan `image_picker` untuk akses galeri/kamera.
- Kompres gambar sebelum upload (max 5MB) menggunakan `flutter_image_compress`.
- Tampilkan preview gambar sebelum disubmit ke endpoint `/kyc/upload-documents`.
