---
name: auction-engine
description: Spesifikasi lengkap mesin lelang Indo-Lelang — WebSocket events, anti-sniping logic, kelipatan bid, lifecycle lot/sesi, dan penentuan pemenang. Gunakan skill ini saat mengimplementasikan fitur bidding, ruang kontrol, atau real-time auction.
---

# Auction Engine — Spesifikasi Teknis

## Teknologi
- **Transport:** Socket.io (WebSocket) + Redis Pub/Sub
- **Server:** Dedicated WebSocket server (terpisah dari REST API)
- **State:** Redis untuk shared state antar instance
- **Persistence:** PostgreSQL untuk bid history (immutable)

## WebSocket Events

### Client → Server

```typescript
// Bidder bergabung ke room lelang
socket.emit('bid:watch', {
  lot_id: string,
  session_id: string,
  user_id: string
});

// Bidder keluar dari room
socket.emit('bid:unwatch', {
  lot_id: string
});

// Bidder submit penawaran
socket.emit('bid:submit', {
  lot_id: string,
  session_id: string,
  user_id: string,
  amount: number  // HARUS kelipatan yang valid
});
```

### Server → Client (Broadcast)

```typescript
// Harga terupdate (broadcast ke semua di room)
socket.to(room).emit('bid:update', {
  lot_id: string,
  current_price: number,
  bidder_id: string,      // masked: "Peserta #XXX"
  bidder_count: number,
  time_remaining: number, // dalam detik
  extension_count: number // 0-3
});

// Pemenang diumumkan
socket.to(room).emit('bid:winner', {
  lot_id: string,
  winner_masked_id: string,
  final_price: number,
  total_bids: number
});

// Lot baru diaktifkan oleh admin
socket.to(room).emit('lot:activated', {
  lot_id: string,
  lot_data: {
    lot_number: number,
    asset_title: string,
    starting_price: number,
    category: string,
    images: string[]
  },
  start_time: string,     // ISO timestamp
  duration: number        // detik (default sesuai config)
});

// Lot ditutup
socket.to(room).emit('lot:closed', {
  lot_id: string,
  result: 'sold' | 'unsold' | 'cancelled',
  final_price?: number,
  winner_id?: string
});

// Sesi selesai
socket.to(room).emit('session:ended', {
  session_id: string,
  total_lots: number,
  lots_sold: number,
  total_revenue: number
});
```

## Validasi Bid (Server-Side) — WAJIB

Setiap `bid:submit` HARUS melewati validasi berikut. Urutan validasi PENTING:

```typescript
async function validateBid(bid: BidSubmission): Promise<ValidationResult> {
  // 1. Lot harus aktif
  if (lot.status !== 'active') {
    return { valid: false, code: 'LOT_NOT_ACTIVE' };
  }

  // 2. Timer belum habis
  if (timeRemaining <= 0) {
    return { valid: false, code: 'BIDDING_TIME_EXPIRED' };
  }

  // 3. Bidder punya NIPL aktif untuk sesi ini
  if (!hasActiveNIPL(bid.user_id, bid.session_id)) {
    return { valid: false, code: 'NO_ACTIVE_NIPL' };
  }

  // 4. Bukan self-bid (bid terhadap diri sendiri)
  if (currentHighestBidder === bid.user_id) {
    return { valid: false, code: 'SELF_BID_NOT_ALLOWED' };
  }

  // 5. Amount >= current_price + minimum_increment
  const minIncrement = getMinIncrement(currentPrice);
  if (bid.amount < currentPrice + minIncrement) {
    return { valid: false, code: 'BID_BELOW_INCREMENT' };
  }

  // 6. Amount harus kelipatan dari minimum increment
  if ((bid.amount - currentPrice) % minIncrement !== 0) {
    return { valid: false, code: 'BID_NOT_MULTIPLE_OF_INCREMENT' };
  }

  return { valid: true };
}
```

## Kelipatan Penawaran (Bid Increment)

| Range Harga Saat Ini | Kelipatan Minimum |
|---|---|
| < Rp 10.000.000 | Rp 500.000 |
| Rp 10.000.000 – Rp 50.000.000 | Rp 1.000.000 |
| Rp 50.000.000 – Rp 200.000.000 | Rp 2.500.000 |
| > Rp 200.000.000 | Rp 5.000.000 |

```typescript
function getMinIncrement(currentPrice: number): number {
  if (currentPrice < 10_000_000) return 500_000;
  if (currentPrice < 50_000_000) return 1_000_000;
  if (currentPrice < 200_000_000) return 2_500_000;
  return 5_000_000;
}
```

## Anti-Sniping Logic — KRITIS

**Aturan:**
- Jika bid masuk saat `time_remaining < THRESHOLD` → timer diperpanjang
- Default `THRESHOLD` = 30 detik (configurable via `platform_settings`)
- Default `EXTENSION` = 120 detik (configurable)
- **Maksimum 3x perpanjangan per lot**

```typescript
function calculateAntiSnipe(
  timeRemaining: number,
  extensionCount: number,
  config: AntiSnipeConfig
): AntiSnipeResult {
  const { threshold, extension, maxExtensions } = config;
  // Default: threshold=30, extension=120, maxExtensions=3

  if (timeRemaining < threshold && extensionCount < maxExtensions) {
    return {
      extended: true,
      newTimeRemaining: extension,  // reset ke 120 detik
      extensionCount: extensionCount + 1
    };
  }

  return {
    extended: false,
    newTimeRemaining: timeRemaining,
    extensionCount: extensionCount
  };
}
```

**Visual Feedback untuk Client:**
- Timer berubah **MERAH** saat < 10 detik
- Banner "⏳ Waktu diperpanjang!" saat anti-sniping aktif
- Info "Perpanjangan ke-X dari 3" ditampilkan

## Lifecycle Lot

```
pending → active → sold / unsold / cancelled
```

| Status | Deskripsi | Trigger |
|---|---|---|
| `pending` | Lot belum dimulai, menunggu giliran | Default saat di-assign ke sesi |
| `active` | Lot sedang dibidding, timer berjalan | Admin klik "Aktifkan Lot" |
| `sold` | Lot terjual, ada pemenang | Admin klik "Ketok Palu" ATAU timer habis + ada bidder |
| `unsold` | Lot tidak laku, tidak ada bidder | Timer habis + tidak ada bid |
| `cancelled` | Lot dibatalkan oleh admin | Admin klik "Batal Lot" |

## Lifecycle Sesi

```
draft → published → live → closed
```

| Status | Deskripsi |
|---|---|
| `draft` | Sesi baru dibuat, belum dipublikasikan |
| `published` | Sesi sudah dipublikasikan, peserta bisa lihat jadwal |
| `live` | Sesi sedang berjalan, bidding aktif |
| `closed` | Sesi selesai, semua lot sudah diproses |

## Penentuan Pemenang

```typescript
function determineWinner(bids: Bid[]): Bid | null {
  if (bids.length === 0) return null;

  // Pemenang = bid tertinggi
  // Jika ada 2 bid dengan amount sama → yang PERTAMA (earliest timestamp) menang
  return bids.sort((a, b) => {
    if (b.amount !== a.amount) return b.amount - a.amount;
    return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
  })[0];
}
```

## Setelah Lot Terjual (SOLD)

Urutan aksi otomatis:
1. Status lot → `sold`, simpan `hammer_price` dan `winner_id`
2. Generate `invoice` untuk pemenang (hammer + komisi 3% + PPN 11%)
3. Broadcast `bid:winner` ke semua peserta
4. Kirim notifikasi ke pemenang: "Selamat! Anda memenangkan lot #X"
5. Kirim notifikasi ke peserta lain: "Lot dimenangkan oleh Peserta #XXX"
6. Catat di `audit_logs`

## Setelah Sesi Selesai (CLOSED)

1. Status sesi → `closed`
2. Generate laporan hasil sesi
3. Trigger refund deposit untuk bidder yang **tidak menang satupun lot**
4. Kirim notifikasi ringkasan ke semua peserta
5. Catat di `audit_logs`

## Bid Cooldown

- Setelah submit bid, tombol BID **disabled selama 1.2 detik**
- Ini mencegah spam bid dan memberi waktu server memproses
- Implementasi di client-side, BUKAN server-side

## Keamanan Bidding

1. VALIDASI saldo deposit/NIPL sebelum bid diterima
2. CEGAH bid dari IP yang sama berulang kali (rate limit per user: 1 bid/detik)
3. ONE NIPL per user per sesi (tidak bisa beli 2 NIPL sesi yang sama)
4. AUDIT LOG setiap bid (immutable, tidak bisa diedit/dihapus)
5. Mask identitas bidder: tampilkan "Peserta #001" bukan nama asli
