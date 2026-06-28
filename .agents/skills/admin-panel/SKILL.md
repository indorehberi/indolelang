---
name: admin-panel
description: Spesifikasi UI Admin Panel Indo-Lelang — design system tokens, daftar komponen, layout sidebar/topbar, dan mapping wireframe ke halaman. Gunakan skill ini saat membangun atau memodifikasi halaman admin panel (React.js/Next.js).
---

# Admin Panel — UI Specification

## Design System Tokens

Diambil dari wireframe `wireframe/style.css`. SEMUA komponen HARUS menggunakan token ini.

### Colors

```css
/* Primary */
--primary:         #1B4F72;    /* Biru tua — sidebar, header, elemen utama */
--primary-dark:    #154360;    /* Hover state */
--primary-light:   #2E86C1;   /* Accent — link, icon aktif */

/* Accent */
--accent:          #2E86C1;    /* Biru cerah */
--gold:            #F39C12;    /* Emas — harga, tombol BID, highlight */

/* Semantic */
--success:         #27AE60;    /* Hijau — approved, paid, active */
--danger:          #E74C3C;    /* Merah — rejected, overdue, error */
--warning:         #F39C12;    /* Kuning — pending, warning */
--info:            #3498DB;    /* Biru — informational */

/* Neutral */
--text-primary:    #2C3E50;
--text-secondary:  #7F8C8D;
--text-muted:      #95A5A6;
--bg-page:         #F8F9FA;
--bg-card:         #FFFFFF;
--border:          #E5E8EB;
```

### Typography

```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;

/* Sizes */
--fs-xs:   0.75rem;   /* 12px — badge, caption */
--fs-sm:   0.875rem;  /* 14px — tabel, hint */
--fs-base: 1rem;      /* 16px — body text */
--fs-lg:   1.125rem;  /* 18px — card title */
--fs-xl:   1.5rem;    /* 24px — page title */
--fs-2xl:  2rem;      /* 32px — KPI value */
```

### Spacing

```css
--space-1: 0.5rem;    /* 8px */
--space-2: 1rem;      /* 16px */
--space-3: 1.5rem;    /* 24px */
--space-4: 2rem;      /* 32px */
```

### Layout

```css
--sidebar-width: 250px;
--topbar-height: 56px;
--border-radius: 6px;
--shadow: 0 1px 3px rgba(0,0,0,0.08);
--shadow-md: 0 4px 12px rgba(0,0,0,0.1);
```

## Layout Structure

```
┌──────────────────────────────────────────────────┐
│ TOPBAR (56px)                                     │
│ [Breadcrumb]              [Search] [🔔] [Avatar] │
├──────────┬───────────────────────────────────────┤
│ SIDEBAR  │                                       │
│ (250px)  │          CONTENT AREA                 │
│          │                                       │
│ [Logo]   │   Padding: 24px                       │
│ [Role]   │                                       │
│ [Nav]    │                                       │
│          │                                       │
│          │                                       │
└──────────┴───────────────────────────────────────┘
```

## Komponen UI yang Harus Dibuat

### Core Components (Phase 1)

| Komponen | Variants | Referensi Wireframe |
|---|---|---|
| `Button` | primary, accent, gold, success, danger, outline, sm/lg | Semua halaman |
| `Input` | text, email, password, number, dengan label + hint + error | Form pages |
| `Select` | single select, dengan label | Filter bars |
| `Textarea` | dengan label + hint | `ad9`, `s3` |
| `UploadZone` | drag-and-drop, file type restriction | `a6`, `s3` |
| `Card` | default, dengan header | Semua halaman |
| `KPICard` | gold, success, danger border variant | `ad1`, `b1`, `s1` |
| `Table` | sortable, hover, striped, dengan pagination | `ad2`, `ad7`, `ad11` |
| `Badge` | success, danger, warning, info, default | Semua tabel |
| `Pagination` | page buttons + active state | List pages |
| `Modal` | header + body + footer + close button | `ad13`, `b7` |
| `Toast/Alert` | info, success, warning, danger | After actions |
| `Tabs` | horizontal tab navigation | `ad25` |
| `Sidebar` | nav sections, nav items, active state, notif badge | Layout |
| `Topbar` | breadcrumb, search, notification bell, user avatar | Layout |
| `Toolbar` | filter group + action buttons | List pages |

### Advanced Components (Phase 2-3)

| Komponen | Untuk Halaman |
|---|---|
| `Timeline` | `b11` (status pengambilan), `a7` (status KYC) |
| `ChartPlaceholder` | `ad1`, `ad21`, `b1`, `s1` |
| `BiddingPanel` | `b7`, `ad13` |
| `CountdownTimer` | `b7`, `ad13` |
| `LotCard` | `p1`, `p2`, `b3` |
| `Accordion` | `p7` (FAQ) |

## Sidebar Navigation — Admin Panel

```
📊 Main
  └── Dashboard                    → AD1

👥 Pengguna
  ├── Bidder                       → AD2
  ├── Provider                     → AD3
  ├── Verifikasi KYC               → AD6  (badge: jumlah pending)
  └── Admin & Operator             → AD4

📦 Katalog
  ├── Daftar Barang                → AD7
  ├── Approval Barang              → AD9  (badge: jumlah pending)
  └── Penyusunan Lot               → AD10

🏛️ Lelang
  ├── Daftar Sesi                  → AD11
  ├── Ruang Kontrol                → AD13 (badge: "LIVE" jika sesi aktif)
  └── Hasil Sesi                   → AD14

💰 Keuangan
  ├── Deposit                      → AD15
  ├── Pelunasan                    → AD16
  ├── Pencairan                    → AD17
  └── Refund                       → AD18

📈 Laporan
  ├── Dashboard Analitik           → AD21
  └── Campaign                     → AD23

⚙️ Pengaturan
  ├── Pengaturan Platform          → AD25
  ├── Manajemen Cabang             → AD27
  └── Audit Trail                  → AD26
```

## Halaman → Wireframe Mapping

| Halaman Admin | File Wireframe | Ukuran | Kompleksitas |
|---|---|---|---|
| AD1 Dashboard | `admin/ad1-dashboard.html` | 8.3KB | Medium |
| AD2 List Bidder | `admin/ad2-list-bidder.html` | 5.3KB | Low |
| AD3 List Provider | `admin/ad3-list-provider.html` | 4.4KB | Low |
| AD4 List Admin | `admin/ad4-list-admin.html` | 6.1KB | Low |
| AD4b Tambah Staf | `admin/ad4b-tambah-staf.html` | 7.1KB | Medium |
| AD5 Detail User | `admin/ad5-detail-user.html` | 4.9KB | Low |
| AD6 Verifikasi KYC | `admin/ad6-verifikasi-kyc.html` | 11.9KB | **High** |
| AD7 List Barang | `admin/ad7-list-barang.html` | 5.1KB | Low |
| AD8 Detail Barang | `admin/ad8-detail-barang.html` | 6.7KB | Medium |
| AD9 Approval Barang | `admin/ad9-approval-barang.html` | 4.6KB | Medium |
| AD10 Penyusunan Lot | `admin/ad10-penyusunan-lot.html` | 5.5KB | Medium |
| AD11 List Sesi | `admin/ad11-list-sesi.html` | 4.7KB | Low |
| AD12 Form Sesi | `admin/ad12-form-sesi.html` | 5.1KB | Medium |
| AD13 Ruang Kontrol | `admin/ad13-ruang-kontrol.html` | 20KB | **Very High** |
| AD14 Hasil Sesi | `admin/ad14-hasil-sesi.html` | 4.8KB | Low |
| AD15 Deposit | `admin/ad15-deposit.html` | 5.0KB | Low |
| AD16 Pelunasan | `admin/ad16-pelunasan.html` | 4.4KB | Low |
| AD17 Pencairan | `admin/ad17-pencairan.html` | 4.5KB | Low |
| AD18 Refund | `admin/ad18-refund.html` | 14.3KB | **High** |
| AD19 Laporan Sesi | `admin/ad19-laporan-sesi.html` | 4.6KB | Low |
| AD20 Laporan Keuangan | `admin/ad20-laporan-keuangan.html` | 4.6KB | Low |
| AD21 Dashboard Analitik | `admin/ad21-dashboard-analitik.html` | 10.6KB | **High** |
| AD22 Report Builder | `admin/ad22-report-builder.html` | 3.6KB | Medium |
| AD23 Campaign | `admin/ad23-campaign.html` | 4.7KB | Medium |
| AD24 Referral | `admin/ad24-referral.html` | 3.6KB | Low |
| AD25 Pengaturan | `admin/ad25-pengaturan.html` | 42.2KB | **Very High** |
| AD26 Audit Trail | `admin/ad26-audit-trail.html` | 4.6KB | Low |
| AD27 Manajemen Cabang | `admin/ad27-manajemen-cabang.html` | 14KB | **High** |

## Cara Menggunakan Wireframe

1. Buka wireframe HTML di browser: `wireframe/admin/ad{X}-{nama}.html`
2. Perhatikan layout, spacing, dan komponen yang digunakan
3. Perhatikan interaksi (hover, click, modal) — banyak wireframe punya JavaScript
4. Gunakan design token yang sudah didefinisikan, JANGAN buat warna/spacing baru
5. Responsive: sidebar collapse di layar < 768px

## State Management Pattern (Admin Panel)

```
React Query (Server State)     Zustand (Client State)
├── useUsers()                 ├── sidebarOpen
├── useSessions()              ├── activeModal
├── useLots()                  ├── currentBranch
├── useDeposits()              ├── theme (light/dark)
├── useKYCQueue()              └── filters
├── useSettings()
└── useBiddingRoom()  ← WebSocket
```
