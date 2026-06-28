---
name: auth-module
description: Spesifikasi modul autentikasi dan otorisasi Indo-Lelang — JWT config, RBAC, rate limiting, OTP, registrasi bidder/provider, dan endpoint auth lengkap. Gunakan skill ini saat mengimplementasikan login, register, password reset, OTP, atau middleware auth.
---

# Auth Module — Spesifikasi Teknis

## JWT Configuration

| Parameter | Nilai |
|---|---|
| Access Token Expiry | **15 menit** |
| Refresh Token Expiry | **30 hari** |
| Algorithm | HS256 atau RS256 |
| Refresh Token Storage | **HttpOnly Cookie** (tidak accessible via JavaScript) |
| Access Token Delivery | Response body JSON |

```typescript
// Generate tokens
function generateTokens(user: User): TokenPair {
  const accessToken = jwt.sign(
    { userId: user.id, role: user.role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    { userId: user.id, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '30d' }
  );

  return { accessToken, refreshToken };
}
```

## RBAC (Role-Based Access Control)

### Roles & Permissions

```typescript
enum Role {
  SUPERADMIN = 'superadmin',    // akses SEMUA
  ADMIN = 'admin',              // akses tenant sendiri
  OPERATOR = 'operator',        // akses terbatas: sesi, KYC, transaksi
  PROVIDER = 'provider',        // akses: barang sendiri, monitoring, settlement
  BIDDER = 'bidder'             // akses: profil, deposit, bidding, invoice
}
```

### Middleware Pattern

```typescript
// Middleware: auth required
function authRequired(req, res, next) {
  const token = extractBearerToken(req.headers.authorization);
  if (!token) return res.status(401).json({ success: false, error: { code: 'TOKEN_REQUIRED' }});

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, error: { code: 'TOKEN_EXPIRED' }});
    }
    return res.status(401).json({ success: false, error: { code: 'INVALID_TOKEN' }});
  }
}

// Middleware: role check
function requireRole(...roles: Role[]) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Anda tidak memiliki akses ke resource ini' }
      });
    }
    next();
  };
}

// Usage
router.get('/admin/kyc/queue', authRequired, requireRole('admin', 'operator'), kycController.getQueue);
router.post('/bids', authRequired, requireRole('bidder'), bidController.submit);
```

### Akses Per Endpoint

| Endpoint Pattern | Roles yang boleh akses |
|---|---|
| `POST /auth/*` | Public (tanpa auth) |
| `GET /sessions`, `GET /lots/:id` | Public |
| `POST /bids` | `bidder` |
| `POST /deposits/create` | `bidder` |
| `GET /kyc/status` | `bidder`, `provider` |
| `POST /kyc/upload-documents` | `bidder`, `provider` |
| `/admin/kyc/*` | `admin`, `operator` |
| `/admin/sessions/*` | `admin`, `operator` |
| `/admin/settings/*` | `admin`, `superadmin` |
| `/admin/users/*` | `admin` |

## Rate Limiting

| Endpoint | Limit | Window | Aksi saat limit |
|---|---|---|---|
| `POST /auth/login` | 5 request | 15 menit | 429 + block IP 15 menit |
| `POST /auth/register` | 3 request | 1 jam | 429 |
| `POST /auth/forgot-password` | 3 request | 1 jam | 429 |
| `POST /auth/verify-otp` | 5 request | 15 menit | 429 + invalidate OTP |
| `POST /bids` | 1 request | 1 detik (per user) | 429 |
| Semua endpoint lain | 10 request | 1 detik (per user) | 429 |

## Auth Endpoints

### 1. Register Bidder
```
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "bidder@example.com",
  "phone": "08123456789",
  "password": "MinimalDelapanKarakter1!",
  "full_name": "John Doe",
  "role": "bidder"    // atau "provider"
}

Response 201:
{
  "success": true,
  "data": { "user_id": "uuid", "email": "...", "role": "bidder", "status": "pending" },
  "message": "Registrasi berhasil. Silakan verifikasi email Anda."
}
```

**Validasi Register:**
- Email: format valid, unique di database
- Phone: format Indonesia (08xx / +628xx), unique
- Password: minimal 8 karakter, harus ada huruf besar, huruf kecil, angka
- Full name: tidak boleh kosong, max 100 karakter

### 2. Register Provider
```
POST /api/v1/auth/register
{
  "email": "provider@company.com",
  "phone": "08198765432",
  "password": "...",
  "full_name": "PT Example",
  "role": "provider",
  "company_name": "PT Example Tbk",
  "npwp": "01.234.567.8-901.000"
}
```

### 3. Login
```
POST /api/v1/auth/login
{
  "email": "bidder@example.com",    // atau nomor telepon
  "password": "..."
}

Response 200:
{
  "success": true,
  "data": {
    "accessToken": "eyJ...",
    "user": { "id": "uuid", "email": "...", "role": "bidder", "kyc_status": "approved" }
  }
}
+ Set-Cookie: refreshToken=...; HttpOnly; Secure; SameSite=Strict; Path=/api/v1/auth
```

### 4. Refresh Token
```
POST /api/v1/auth/refresh-token
Cookie: refreshToken=...

Response 200:
{
  "success": true,
  "data": { "accessToken": "eyJ..." }
}
```

### 5. Logout
```
POST /api/v1/auth/logout
Authorization: Bearer <accessToken>

Response 200:
+ Clear-Cookie: refreshToken
```

### 6. Forgot Password
```
POST /api/v1/auth/forgot-password
{ "email": "bidder@example.com" }

Response 200:
{ "success": true, "message": "Link reset password telah dikirim ke email Anda" }
```

### 7. Reset Password
```
POST /api/v1/auth/reset-password
{ "token": "reset-token-from-email", "password": "NewPassword123!" }
```

### 8. Verify OTP
```
POST /api/v1/auth/verify-otp
{ "phone": "08123456789", "otp": "123456" }
```

## OTP Rules

- Format: **6 digit angka** (contoh: `483291`)
- Expiry: **5 menit**
- Maksimum percobaan: **5 kali** (setelah itu OTP baru harus di-request)
- Kirim via: SMS (Twilio) atau Email (SendGrid)
- Saat development: OTP selalu `123456` (untuk testing)

## Password Rules

- Minimal **8 karakter**
- Harus ada **huruf besar** (A-Z)
- Harus ada **huruf kecil** (a-z)
- Harus ada **angka** (0-9)
- Hash: **bcrypt** dengan salt rounds **≥ 10**
- JANGAN PERNAH return password (bahkan hashed) dalam API response

## Error Codes Auth

| Code | HTTP | Deskripsi |
|---|---|---|
| `TOKEN_REQUIRED` | 401 | Header Authorization tidak ada |
| `TOKEN_EXPIRED` | 401 | Access token sudah expired |
| `INVALID_TOKEN` | 401 | Token tidak valid atau tampered |
| `INVALID_CREDENTIALS` | 401 | Email/password salah |
| `FORBIDDEN` | 403 | Role tidak punya akses |
| `EMAIL_ALREADY_EXISTS` | 409 | Email sudah terdaftar |
| `PHONE_ALREADY_EXISTS` | 409 | Nomor telepon sudah terdaftar |
| `RATE_LIMIT_EXCEEDED` | 429 | Terlalu banyak percobaan |
| `OTP_EXPIRED` | 400 | OTP sudah expired |
| `OTP_INVALID` | 400 | Kode OTP salah |
| `ACCOUNT_SUSPENDED` | 403 | Akun ditangguhkan |
| `KYC_NOT_VERIFIED` | 403 | eKYC belum diverifikasi (untuk akses fitur tertentu) |
