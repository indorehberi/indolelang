# 🚀 Indo-Lelang Development Roadmap

**Status:** Backend Foundation ✅ | Frontend In Progress 🟡 | Integration ⏳  
**Target:** Production-Ready Platform  
**Strategy:** Bottom-Up (Backend → Admin → Public → Mobile → Deploy)

---

## 📊 Current State Analysis

### ✅ What's Done
- [x] Backend API structure (Express + TypeScript)
- [x] Database schema (Prisma + PostgreSQL) - 14 tables
- [x] Admin Panel layout & sidebar with Material Icons
- [x] Landing page (confirmed by user)
- [x] Wireframes (69 files) untuk semua halaman
- [x] Core libraries (JWT, Redis, Socket.io, PDF, Email)

### 🟡 What's Partial
- [ ] Backend routes & controllers (structure ada, implementation belum)
- [ ] Admin dashboard pages (hanya layout, belum ada data flow)
- [ ] Authentication flow (JWT ready, tapi endpoint belum lengkap)

### ❌ What's Missing
- [ ] Backend API endpoints implementation (CRUD + business logic)
- [ ] Admin panel semua halaman (28 pages)
- [ ] Frontend-Backend integration
- [ ] Third-party integrations (Midtrans, Verihubs, FCM)
- [ ] WebSocket real-time bidding
- [ ] Docker orchestration & deployment config

---

## 🎯 PHASE 1: Backend API Foundation (PRIORITAS #1)
**Timeline:** 3-5 hari  
**Goal:** Backend API lengkap, tested, documented

### 1.1 Database & Migrations ✅ (Already Done)
```bash
# Schema sudah ada di prisma/schema.prisma
# 14 tables: users, kyc_documents, branches, auction_sessions, 
#            assets, lots, bids, deposits, invoices, settlements,
#            documents, notifications, platform_settings, audit_logs
```

### 1.2 Core Auth Module 🔴 (CRITICAL)
**Files to Complete:**
```
Apps/api/src/modules/auth/
  ├── auth.controller.ts      # POST /register, /login, /refresh, /logout
  ├── auth.service.ts         # Business logic: hash password, generate JWT
  ├── auth.routes.ts          # Route definitions
  └── auth.validation.ts      # Zod schemas
```

**Endpoints:**
- `POST /api/auth/register` - Register bidder/provider
- `POST /api/auth/login` - Login (email/phone + password) → JWT
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Invalidate token
- `POST /api/auth/forgot-password` - Send reset link
- `POST /api/auth/reset-password` - Reset dengan token
- `GET /api/auth/me` - Get current user profile

### 1.3 Users & KYC Module 🔴
**Files:**
```
Apps/api/src/modules/users/
  ├── users.controller.ts     # CRUD users
  ├── users.service.ts
  └── users.routes.ts

Apps/api/src/modules/kyc/
  ├── kyc.controller.ts       # Upload KTP, Submit KYC, Approve/Reject
  ├── kyc.service.ts          # Integration dengan Verihubs (optional)
  └── kyc.routes.ts
```

**Endpoints:**
- `GET /api/users` - List users (admin only)
- `GET /api/users/:id` - User detail
- `PATCH /api/users/:id` - Update profile
- `POST /api/kyc/submit` - Upload dokumen KYC
- `POST /api/kyc/:id/approve` - Admin approve KYC
- `POST /api/kyc/:id/reject` - Admin reject KYC

### 1.4 Assets & Lots Module 🔴
**Files:**
```
Apps/api/src/modules/assets/
  ├── assets.controller.ts    # Provider submit asset, Admin approve
  ├── assets.service.ts
  └── assets.routes.ts

Apps/api/src/modules/lots/
  ├── lots.controller.ts      # Assign asset ke session, manage lot
  ├── lots.service.ts
  └── lots.routes.ts
```

**Endpoints:**
- `POST /api/assets` - Provider submit asset
- `GET /api/assets` - List assets (filter by status)
- `PATCH /api/assets/:id/approve` - Admin approve
- `GET /api/lots` - List lots in session
- `POST /api/lots` - Create lot (admin)
- `PATCH /api/lots/:id` - Update lot

### 1.5 Auction Sessions Module 🔴
**Files:**
```
Apps/api/src/modules/sessions/
  ├── sessions.controller.ts  # CRUD sessions
  ├── sessions.service.ts
  └── sessions.routes.ts
```

**Endpoints:**
- `POST /api/sessions` - Create session
- `GET /api/sessions` - List sessions
- `GET /api/sessions/:id` - Session detail + lots
- `PATCH /api/sessions/:id/start` - Start session (go live)
- `PATCH /api/sessions/:id/close` - Close session

### 1.6 Bidding & WebSocket 🔴 (COMPLEX)
**Files:**
```
Apps/api/src/modules/bids/
  ├── bids.controller.ts      # HTTP endpoints
  ├── bids.service.ts         # Business logic: validate bid, anti-sniping
  ├── bids.socket.ts          # Socket.io handlers
  └── bids.routes.ts

Apps/api/src/lib/socket.ts    # Socket.io setup (already exists)
```

**WebSocket Events:**
```typescript
// Client → Server
socket.emit('bid:place', { lotId, amount })
socket.emit('lot:join', { lotId })
socket.emit('lot:leave', { lotId })

// Server → Client
socket.on('bid:new', { bidId, lotId, bidderId, amount, timestamp })
socket.on('bid:winning', { lotId, winnerId, winningBid })
socket.on('lot:status', { lotId, status, timeLeft })
socket.on('lot:hammer', { lotId, winnerId, hammerPrice })
```

### 1.7 Payments Module (Midtrans Integration) 🔴
**Files:**
```
Apps/api/src/modules/deposits/
  ├── deposits.controller.ts  # Create VA deposit, webhook
  ├── deposits.service.ts     # Midtrans API calls
  └── deposits.routes.ts

Apps/api/src/modules/payments/
  ├── payments.controller.ts  # Invoice payment webhook
  ├── payments.service.ts
  └── payments.routes.ts

Apps/api/src/lib/midtrans.ts  # Midtrans SDK wrapper (exists)
```

**Endpoints:**
- `POST /api/deposits` - Create deposit (generate VA)
- `POST /api/deposits/webhook` - Midtrans webhook
- `GET /api/deposits/:id/status` - Check payment status
- `POST /api/invoices/:id/pay` - Generate payment link
- `POST /api/payments/webhook` - Payment webhook

### 1.8 Documents & Settlements Module 🟡
**Files:**
```
Apps/api/src/modules/documents/
  ├── documents.controller.ts # Generate PDF (Surat Jalan, BAST)
  ├── documents.service.ts    # Puppeteer PDF generation
  └── documents.routes.ts

Apps/api/src/modules/settlements/
  ├── settlements.controller.ts # Provider pencairan dana
  ├── settlements.service.ts    # Xendit disbursement
  └── settlements.routes.ts
```

### 1.9 Notifications Module 🟡
**Files:**
```
Apps/api/src/modules/notifications/
  ├── notifications.controller.ts
  ├── notifications.service.ts    # FCM push, email, SMS
  └── notifications.routes.ts
```

### 1.10 Testing & Documentation 🟡
```bash
# Unit tests untuk setiap module
npm run test

# API Documentation (Swagger/OpenAPI)
# Generate dari Zod schemas
```

---

## 🎯 PHASE 2: Admin Panel Complete (PRIORITAS #2)
**Timeline:** 4-6 hari  
**Goal:** 28 halaman admin lengkap dengan data flow

### 2.1 Authentication Pages ✅ (Layout Done)
- [x] Login page dengan demo button
- [ ] Connect ke backend `/api/auth/login`
- [ ] JWT storage (localStorage/cookie)
- [ ] Protected routes middleware

### 2.2 Dashboard & KPI Cards 🟡 (Partial)
**File:** `Apps/admin-panel/src/app/dashboard/page.tsx`
- [x] Layout & KPI cards UI
- [ ] Fetch data dari `/api/dashboard/stats`
- [ ] Live session card (real-time data)
- [ ] Chart integration (Recharts)

### 2.3 User Management (5 pages)
```
Apps/admin-panel/src/app/users/
  ├── bidder/page.tsx         # List bidder + filters
  ├── provider/page.tsx       # List provider
  ├── admin/page.tsx          # List admin/operator
  └── [id]/page.tsx           # User detail + edit
```

### 2.4 KYC Verification (1 page)
```
Apps/admin-panel/src/app/kyc/
  └── verification/page.tsx   # Queue KYC pending → approve/reject
```

### 2.5 Assets & Lots (3 pages)
```
Apps/admin-panel/src/app/assets/
  ├── page.tsx                # List assets
  ├── approval/page.tsx       # Assets pending approval
  └── [id]/page.tsx           # Asset detail

Apps/admin-panel/src/app/lots/
  └── planning/page.tsx       # Assign assets ke session
```

### 2.6 Auction Sessions (3 pages)
```
Apps/admin-panel/src/app/sessions/
  ├── page.tsx                # List sessions
  ├── create/page.tsx         # Create new session
  └── [id]/page.tsx           # Session detail + lots
```

### 2.7 Ruang Kontrol (1 page - COMPLEX) 🔴
```
Apps/admin-panel/src/app/auction/
  └── control-room/page.tsx   # Real-time auction control
      - WebSocket connection
      - Live bid updates
      - Lot control (start, pause, hammer)
      - Timer countdown
      - Bid history
```

### 2.8 Finance Pages (4 pages)
```
Apps/admin-panel/src/app/finance/
  ├── deposits/page.tsx       # Monitor deposits
  ├── invoices/page.tsx       # Invoice management
  ├── settlements/page.tsx    # Provider settlements
  └── refunds/page.tsx        # Refund management
```

### 2.9 Reports & Analytics (4 pages)
```
Apps/admin-panel/src/app/
  ├── analytics/page.tsx      # Dashboard analytics
  └── reports/
      ├── sessions/page.tsx   # Session reports
      ├── finance/page.tsx    # Finance reports
      └── builder/page.tsx    # Custom report builder
```

### 2.10 Settings & Platform (3 pages)
```
Apps/admin-panel/src/app/
  ├── settings/
  │   ├── platform/page.tsx   # Platform settings
  │   └── audit-trail/page.tsx # Audit logs
  ├── branches/page.tsx       # Branch management
  ├── campaigns/page.tsx      # Marketing campaigns
  └── referral/page.tsx       # Referral program
```

---

## 🎯 PHASE 3: Frontend-Backend Integration (PRIORITAS #3)
**Timeline:** 2-3 hari  
**Goal:** Seamless data flow, error handling, loading states

### 3.1 API Client Setup
```typescript
// Apps/admin-panel/src/lib/api-client.ts
import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: { 'Content-Type': 'application/json' }
});

// Interceptor untuk JWT
apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```

### 3.2 React Query Setup
```bash
npm install @tanstack/react-query
```

```typescript
// Apps/admin-panel/src/providers/query-provider.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
```

### 3.3 WebSocket Client
```typescript
// Apps/admin-panel/src/lib/socket-client.ts
import { io } from 'socket.io-client';

const socket = io(process.env.NEXT_PUBLIC_WS_URL, {
  auth: { token: localStorage.getItem('access_token') }
});
```

---

## 🎯 PHASE 4: Third-Party Integrations (PRIORITAS #4)
**Timeline:** 2-3 hari

### 4.1 Midtrans Payment Gateway 🔴
```env
MIDTRANS_SERVER_KEY=SB-Mid-server-xxx
MIDTRANS_CLIENT_KEY=SB-Mid-client-xxx
MIDTRANS_IS_PRODUCTION=false
```

**Implementation:**
- Virtual Account generation
- QRIS generation
- Webhook verification
- Payment status check

### 4.2 Verihubs eKYC (Optional) 🟡
```env
VERIHUBS_APP_ID=xxx
VERIHUBS_API_KEY=xxx
VERIHUBS_ENABLED=false
```

### 4.3 Firebase FCM Push Notification 🟡
```env
FCM_PROJECT_ID=indo-lelang
FCM_PRIVATE_KEY=xxx
FCM_CLIENT_EMAIL=xxx
```

### 4.4 SendGrid Email 🔴
```env
SENDGRID_API_KEY=SG.xxx
SENDGRID_FROM_EMAIL=noreply@indolelang.com
```

### 4.5 AWS S3 Storage 🔴
```env
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
AWS_S3_BUCKET=indo-lelang-uploads
AWS_REGION=ap-southeast-1
```

---

## 🎯 PHASE 5: Public Web & Mobile (PRIORITAS #5)
**Timeline:** 3-4 hari

### 5.1 Public Web (Landing + Catalog)
```
Apps/landing-web/src/app/
  ├── (home)/page.tsx         ✅ Done (confirmed)
  ├── katalog/page.tsx        # Browse assets
  ├── jadwal/page.tsx         # Session schedule
  ├── tentang/page.tsx        # About us
  ├── syarat/page.tsx         # Terms & conditions
  ├── faq/page.tsx            # FAQ
  └── kontak/page.tsx         # Contact
```

### 5.2 Mobile App (Flutter) - Separate Phase
**Noted:** Mobile app development is a separate major phase

---

## 🎯 PHASE 6: DevOps & Deployment (PRIORITAS #6)
**Timeline:** 2-3 hari

### 6.1 Docker Compose Setup
```yaml
# docker-compose.yml
services:
  postgres:
    image: postgres:16
  redis:
    image: redis:7-alpine
  api:
    build: ./Apps/api
    depends_on: [postgres, redis]
  admin:
    build: ./Apps/admin-panel
  landing:
    build: ./Apps/landing-web
  nginx:
    image: nginx:alpine
    volumes:
      - ./Infrastructure/nginx/nginx.conf:/etc/nginx/nginx.conf
```

### 6.2 Environment Variables
```bash
# .env.example
DATABASE_URL=postgresql://user:pass@postgres:5432/indolelang
REDIS_URL=redis://redis:6379
JWT_SECRET=your-secret-key
API_URL=http://localhost:3001
```

### 6.3 CI/CD Pipeline (GitHub Actions)
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: docker compose build
      - run: docker compose push
```

### 6.4 Production Checklist
- [ ] SSL certificates (Let's Encrypt)
- [ ] Database backups (automated)
- [ ] Monitoring (Sentry, Datadog)
- [ ] Load testing (k6)
- [ ] Security audit
- [ ] Documentation

---

## 📋 EXECUTION PRIORITY ORDER

### 🔥 IMMEDIATE (This Week)
1. **Backend Auth Module** - Login/Register endpoints
2. **Backend Users & KYC** - CRUD + approval flow
3. **Admin Dashboard Data Integration** - Connect KPI cards
4. **Admin User Management Pages** - 3 pages (bidder, provider, admin)

### 🟡 SHORT TERM (Week 2-3)
5. **Backend Assets & Lots Module** - Submit & approval
6. **Backend Auction Sessions** - CRUD sessions
7. **Admin Assets & Sessions Pages** - 6 pages
8. **Midtrans Integration** - Payment gateway

### 🟢 MEDIUM TERM (Week 3-4)
9. **Backend Bidding & WebSocket** - Real-time auction
10. **Admin Ruang Kontrol** - Auction control room
11. **Backend Payments & Settlements** - Invoice & disbursement
12. **Admin Finance Pages** - 4 pages

### 🔵 LONG TERM (Week 4+)
13. **Public Web Pages** - 6 pages
14. **Third-party Integrations** - FCM, Verihubs, Email
15. **Docker & Deployment** - Production ready
16. **Testing & QA** - Full platform test

---

## 🎯 SUCCESS METRICS

- [ ] Backend: 50+ API endpoints working
- [ ] Admin: 28 pages functional with real data
- [ ] Public: 8 pages live
- [ ] Real-time: WebSocket bidding working
- [ ] Payment: Midtrans integration tested
- [ ] Deploy: Docker compose up → platform running
- [ ] Performance: < 2s page load, < 100ms API response

---

## 📞 Decision Points

**Before Phase 2:**
- Confirm backend modules are tested & working
- API documentation ready

**Before Phase 4:**
- Get third-party API credentials
- Test integrations in sandbox

**Before Phase 6:**
- Choose cloud provider (AWS, GCP, Azure, DigitalOcean)
- Setup CI/CD pipeline

---

**Last Updated:** 2026-06-28  
**Status:** Roadmap Created - Ready for Execution Phase 1
