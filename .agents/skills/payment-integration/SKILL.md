---
name: payment-integration
description: Spesifikasi integrasi pembayaran Indo-Lelang — Midtrans VA/QRIS, webhook handling, NIPL/deposit flow, kalkulasi invoice, refund, dan Xendit disbursement. Gunakan skill ini saat mengimplementasikan fitur deposit, pembayaran, pelunasan, refund, atau pencairan dana.
---

# Payment Integration — Spesifikasi Teknis

## Provider Utama

| Provider | Tujuan | Mode |
|---|---|---|
| **Midtrans** | Deposit NIPL (VA + QRIS) + Pelunasan Invoice | Sandbox → Production |
| **Xendit** | Disbursement / Pencairan Dana ke Provider | Sandbox → Production |

## Alur Deposit NIPL

```
Bidder pilih sesi → Beli NIPL → Pilih metode bayar
  → Backend generate VA/QRIS via Midtrans API
  → Return nomor VA + expiry ke client
  → Bidder transfer
  → Midtrans kirim webhook ke backend
  → Backend update status deposit → "paid"
  → NIPL aktif untuk sesi tersebut
  → Kirim notifikasi (email + push)
```

## Virtual Account (VA)

### Format VA Number
- BCA: `7008-XXXX-XXXX-XXXX` (16 digit)
- Mandiri: `7008-XXXX-XXXX-XXXX`
- BNI: `7008-XXXX-XXXX-XXXX`
- BRI: `7008-XXXX-XXXX-XXXX`
- Permata: `7008-XXXX-XXXX-XXXX`

### VA Expiry
- Default: **60 menit** (configurable via `platform_settings`)
- Setelah expired: status → `expired`, VA tidak bisa dibayar
- Bidder harus generate VA baru jika expired

### Generate VA — Midtrans API

```typescript
// POST ke Midtrans Core API
async function generateVA(params: {
  userId: string;
  sessionId: string;
  amount: number;
  bank: 'bca' | 'mandiri' | 'bni' | 'bri' | 'permata';
}): Promise<VAResponse> {
  const orderId = `NIPL-${params.sessionId}-${params.userId}-${Date.now()}`;

  const response = await midtrans.createTransaction({
    payment_type: 'bank_transfer',
    transaction_details: {
      order_id: orderId,
      gross_amount: params.amount
    },
    bank_transfer: {
      bank: params.bank
    },
    custom_expiry: {
      expiry_duration: 60,  // dari platform_settings
      unit: 'minute'
    }
  });

  // Simpan ke tabel deposits
  await db.deposits.create({
    user_id: params.userId,
    session_id: params.sessionId,
    amount: params.amount,
    va_number: response.va_numbers[0].va_number,
    va_bank: params.bank,
    payment_method: 'virtual_account',
    status: 'pending',
    midtrans_order_id: orderId,
    expired_at: addMinutes(new Date(), 60)
  });

  return {
    va_number: response.va_numbers[0].va_number,
    bank: params.bank,
    amount: params.amount,
    expired_at: addMinutes(new Date(), 60)
  };
}
```

## QRIS (Feature Toggle: `feat_qris_payment`)

```typescript
// Hanya jika toggle ON
if (await isFeatureEnabled('feat_qris_payment')) {
  const response = await midtrans.createTransaction({
    payment_type: 'gopay',  // QRIS via GoPay
    transaction_details: {
      order_id: orderId,
      gross_amount: amount
    }
  });
  // response.actions[0].url = QR code URL
}
```

## Webhook Handler — KRITIS

### Endpoint: `POST /api/v1/payments/webhook`

```typescript
// 1. Verifikasi signature dari Midtrans
// 2. Proses berdasarkan transaction_status
// 3. Update database
// 4. Trigger notifikasi

async function handleWebhook(body: MidtransNotification): Promise<void> {
  // WAJIB: Verifikasi signature
  const isValid = verifySignature(body);
  if (!isValid) throw new UnauthorizedError('INVALID_SIGNATURE');

  // WAJIB: Cek idempotency (jangan proses ulang)
  const existing = await db.deposits.findByOrderId(body.order_id);
  if (existing.status === 'paid') return; // sudah diproses

  switch (body.transaction_status) {
    case 'settlement':
    case 'capture':
      // Pembayaran berhasil
      await db.deposits.update(existing.id, {
        status: 'paid',
        paid_at: new Date()
      });
      // Aktifkan NIPL
      await niplService.activate(existing.user_id, existing.session_id);
      // Kirim notifikasi
      await notifService.send(existing.user_id, {
        type: 'DEPOSIT_SUCCESS',
        title: 'Deposit Berhasil',
        body: `NIPL Anda untuk sesi "${session.title}" sudah aktif`
      });
      break;

    case 'pending':
      // Menunggu pembayaran — tidak perlu update
      break;

    case 'deny':
    case 'cancel':
    case 'expire':
      await db.deposits.update(existing.id, { status: 'expired' });
      break;
  }

  // Catat di audit log
  await auditLog.create({
    action: 'PAYMENT_WEBHOOK',
    resource_type: 'deposit',
    resource_id: existing.id,
    new_value: body.transaction_status
  });
}
```

### Verifikasi Signature Midtrans

```typescript
function verifySignature(notification: MidtransNotification): boolean {
  const { order_id, status_code, gross_amount, signature_key } = notification;
  const serverKey = process.env.MIDTRANS_SERVER_KEY;

  const hash = crypto
    .createHash('sha512')
    .update(order_id + status_code + gross_amount + serverKey)
    .digest('hex');

  return hash === signature_key;
}
```

## Biaya NIPL Per Kategori

| Kategori | Jaminan NIPL |
|---|---|
| Mobil Penumpang | Rp 5.000.000 |
| Sepeda Motor | Rp 1.000.000 |
| Komersial & Alat Berat | Rp 5.000.000 |
| Properti | Rp 10.000.000 |

Nilai ini configurable via `platform_settings` (key: `nipl_kendaraan`, `nipl_motor`, `nipl_properti`).

## Aturan NIPL

1. **1 NIPL = 1 user per sesi** — Bidder tidak bisa beli 2 NIPL untuk sesi yang sama
2. **1 NIPL = bisa menang 1 lot** — Jika menang, NIPL "terpakai". Untuk menang lot lain, butuh NIPL tambahan (jika diizinkan per config)
3. **NIPL hanya valid untuk sesi yang dipilih** — Tidak bisa digunakan di sesi lain
4. **Status NIPL:** `pending` → `active` → `used` / `refunded`

## Kalkulasi Invoice Pelunasan

Setelah bidder memenangkan lot:

```typescript
function calculateInvoice(hammerPrice: number, config: BusinessConfig): Invoice {
  const commission = hammerPrice * (config.commissionRate / 100);   // default 3%
  const buyerPremium = hammerPrice * (config.buyerPremium / 100);   // default 1.5%
  const subtotal = hammerPrice + commission + buyerPremium;
  const tax = subtotal * (config.taxRate / 100);                    // PPN 11%
  const total = subtotal + tax;

  return {
    hammer_price: hammerPrice,
    commission: commission,
    buyer_premium: buyerPremium,
    tax: tax,
    total: Math.ceil(total),  // pembulatan ke atas
    due_date: addBusinessDays(new Date(), config.settlementDays)  // default 5 hari kerja
  };
}
```

### Contoh Kalkulasi

```
Hammer Price:  Rp 150.000.000
Komisi (3%):   Rp   4.500.000
Buyer Prem:    Rp   2.250.000
Subtotal:      Rp 156.750.000
PPN (11%):     Rp  17.242.500
─────────────────────────────
TOTAL:         Rp 173.992.500
Due Date:      5 hari kerja dari SOLD
```

## Refund Deposit

### Siapa yang dapat refund?
- Bidder yang **TIDAK menang satupun lot** dalam sesi
- Refund dilakukan setelah sesi `closed`

### Alur Refund
```
Sesi closed → Cek bidder yang tidak menang
  → [Auto-Refund ON] → Otomatis trigger refund via Midtrans/Xendit
  → [Auto-Refund OFF] → Admin manual approve refund
  → Status deposit → "refunded"
  → Notifikasi ke bidder
```

### Feature Toggle: `feat_auto_refund`
- **OFF (default):** Admin harus manual approve setiap refund
- **ON:** Sistem otomatis refund setelah sesi selesai

## Disbursement ke Provider (Xendit)

### Alur Pencairan
```
Lot terjual → Settlement period (T+3 hari)
  → Gross - Komisi Balai - Biaya Titip Provider = Net Amount
  → Provider request pencairan dari dashboard
  → Admin approve
  → Backend trigger Xendit Disbursement API
  → Dana ditransfer ke rekening provider
  → Status: "transferred"
```

### Kalkulasi Settlement Provider

```typescript
function calculateSettlement(hammerPrice: number, config: BusinessConfig): Settlement {
  const auctionCommission = hammerPrice * (config.commissionRate / 100);  // 3%
  const providerFee = hammerPrice * (config.providerFee / 100);          // 2%
  const netAmount = hammerPrice - auctionCommission - providerFee;

  return {
    gross_amount: hammerPrice,
    commission_deducted: auctionCommission + providerFee,
    net_amount: netAmount
  };
}
```

## Test Cards (Midtrans Sandbox)

| Tujuan | Nomor Kartu |
|---|---|
| Success | `4811 1111 1111 1114` |
| Denied | `4911 1111 1111 1113` |
| Challenge OTP | `4811 1111 1111 1114` + OTP `112233` |
| Insufficient | `4711 1111 1111 1110` |

## Error Codes Payment

| Code | Deskripsi |
|---|---|
| `INSUFFICIENT_DEPOSIT` | Saldo deposit tidak cukup |
| `VA_EXPIRED` | VA sudah expired |
| `VA_ALREADY_PAID` | VA sudah dibayar (double payment) |
| `NIPL_ALREADY_EXISTS` | User sudah punya NIPL untuk sesi ini |
| `SESSION_NOT_FOUND` | Sesi lelang tidak ditemukan |
| `INVALID_PAYMENT_METHOD` | Metode pembayaran tidak valid |
| `WEBHOOK_INVALID_SIGNATURE` | Signature webhook tidak valid |
| `REFUND_NOT_ELIGIBLE` | Bidder tidak eligible untuk refund |
| `DISBURSEMENT_FAILED` | Pencairan gagal |
