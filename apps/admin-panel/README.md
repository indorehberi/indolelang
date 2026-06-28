# Indo-Lelang Admin Panel

Panel administrasi untuk platform lelang digital Indo-Lelang. Dibangun dengan Next.js 16, React 19, dan TypeScript.

## 🚀 Quick Start

### Prerequisites
- Node.js 20+ 
- npm atau yarn

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Aplikasi akan berjalan di `http://localhost:3000`

## 📁 Struktur Folder

```
src/
├── app/                      # Next.js App Router
│   ├── dashboard/           # Halaman dashboard utama
│   ├── users/               # Manajemen bidder, provider, admin
│   ├── kyc/                 # Verifikasi KYC
│   ├── assets/              # Manajemen barang
│   ├── lots/                # Penyusunan lot
│   ├── sessions/            # Sesi lelang
│   ├── auction/             # Ruang kontrol & hasil sesi
│   ├── finance/             # Deposit, pelunasan, pencairan, refund
│   ├── analytics/           # Dashboard analitik
│   ├── reports/             # Laporan sesi & keuangan
│   ├── campaigns/           # Broadcast notifikasi
│   ├── branches/            # Manajemen cabang
│   ├── settings/            # Pengaturan platform
│   └── notifications/       # Notifikasi admin
│
├── components/
│   ├── layout/              # Layout components (Sidebar, Topbar)
│   ├── ui/                  # Reusable UI components (Badge, Button, dll)
│   └── finance/             # Komponen khusus finance
│
└── lib/
    └── api.ts               # API utilities & configuration
```

## 🎨 Design System

Admin panel menggunakan design system berdasarkan **Material Design 3** dengan tokens yang telah didefinisikan di `globals.css` dan `tailwind.config.ts`.

### Color Palette

| Token | Hex | Penggunaan |
|-------|-----|-----------|
| `primary` | `#006c49` | Aksi utama, sidebar |
| `primary-container` | `#10b981` | Highlight, success state |
| `secondary-container` | `#fd761a` | Aksen sekunder |
| `error` | `#ba1a1a` | Error state, urgent action |
| `background` | `#f8f9ff` | Background halaman |
| `surface` | `#f8f9ff` | Background card |

### Typography

Font utama: **Hanken Grotesk** (Google Fonts)

| Class | Size | Weight | Line Height | Penggunaan |
|-------|------|--------|-------------|-----------|
| `display-lg` | 36px | 700 | 44px | Hero title |
| `headline-lg` | 28px | 600 | 36px | Page title |
| `headline-md` | 20px | 600 | 28px | Section title |
| `title-lg` | 18px | 600 | 24px | Card title |
| `body-lg` | 16px | 400 | 24px | Body text large |
| `body-md` | 14px | 400 | 20px | Body text default |
| `label-md` | 12px | 700 | 16px | Button, label |
| `label-sm` | 11px | 500 | 14px | Caption |

## 🔧 Konfigurasi

### Environment Variables

Buat file `.env.local` di root folder:

```env
# API Backend URL
NEXT_PUBLIC_API_URL=http://localhost:8000

# WebSocket URL (optional, defaults to API_URL)
NEXT_PUBLIC_WS_URL=http://localhost:8000
```

### API Configuration

Konfigurasi API terpusat di `src/lib/api.ts`:

```typescript
import { apiUrl, apiFetch } from '@/lib/api';

// Simple URL builder
const url = apiUrl('/auth/login');

// Fetch with auto auth token
const response = await apiFetch('/sessions', {
  method: 'GET',
});
```

## 📱 Fitur Utama

### ✅ Sudah Diimplementasi
- [x] Layout dengan Sidebar & Topbar
- [x] Dashboard dengan KPI cards
- [x] Live session indicator
- [x] Category chart (bar chart)
- [x] Quick actions panel
- [x] Platform health monitor
- [x] Recent transactions table
- [x] Notifikasi real-time counter
- [x] Search functionality
- [x] Authentication flow

### 🚧 Dalam Pengembangan
- [ ] Halaman manajemen user (Bidder, Provider, Admin)
- [ ] Verifikasi KYC dengan approval flow
- [ ] Manajemen barang & approval
- [ ] Penyusunan lot (drag & drop)
- [ ] Form buat sesi lelang
- [ ] Ruang kontrol live bidding
- [ ] Management keuangan (deposit, pelunasan, pencairan, refund)
- [ ] Dashboard analitik & laporan
- [ ] Campaign & broadcast notification
- [ ] Manajemen multi-cabang
- [ ] Pengaturan platform & feature toggles
- [ ] Audit trail

## 🎯 Roadmap

Lihat [Panduan Developer](../../Docs/blueprint/panduan_developer.md) untuk timeline lengkap pengembangan Phase 1-6.

### Phase 1 (Current) — Foundation & Core
- Setup project struktur ✅
- Design system implementation ✅
- Layout components ✅
- Dashboard page ✅
- Authentication integration ✅

### Phase 2 — Fitur Utama Bidder & Admin
- CRUD sesi lelang
- CRUD lot/barang
- Verifikasi KYC
- Manajemen NIPL & deposit

### Phase 3 — Live Bidding & Real-time
- WebSocket integration
- Live auction control panel
- Real-time bidding interface

## 📚 Dokumentasi Referensi

- [Blueprint Platform Lelang](../../Docs/blueprint/blueprint_platform_lelang.md) — Arsitektur & spesifikasi teknis lengkap
- [Panduan Developer](../../Docs/blueprint/panduan_developer.md) — Workflow git, coding standards, timeline
- [Wireframe Reference](../../Wireframe/) — Referensi visual untuk semua halaman

### Wireframe Admin Panel
Referensi visual lengkap ada di `../../Wireframe/admin/`:
- `ad1-dashboard.html` — Dashboard utama
- `ad2-list-bidder.html` — List bidder
- `ad6-verifikasi-kyc.html` — Verifikasi KYC
- `ad13-ruang-kontrol.html` — Live auction control room
- dan 20+ halaman lainnya

## 🧪 Testing

```bash
# Run ESLint
npm run lint

# Type checking
npx tsc --noEmit
```

## 🤝 Contributing

Lihat [Panduan Developer](../../Docs/blueprint/panduan_developer.md) untuk:
- Git workflow & branching strategy
- Commit message convention
- Code review checklist
- Pull request guidelines

## 📝 Tech Stack

- **Framework**: Next.js 16 (App Router)
- **UI Library**: React 19
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4 + Custom CSS
- **Real-time**: Socket.io Client
- **Icons**: Material Symbols (Google)
- **Fonts**: Hanken Grotesk (Google Fonts)

## 🔐 Security

- JWT authentication dengan refresh token
- Role-based access control (RBAC)
- API rate limiting
- XSS protection
- CSRF protection

## 📞 Support

Untuk pertanyaan teknis atau bug report, hubungi Tech Lead atau buat issue di repository.

---

**© 2026 Indo-Lelang Digital Platform**
