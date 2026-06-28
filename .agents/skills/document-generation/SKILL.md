---
name: document-generation
description: Spesifikasi pembuatan dokumen PDF Indo-Lelang — Invoice pelunasan, Surat Jalan, dan BAST (Berita Acara Serah Terima). Gunakan skill ini saat mengimplementasikan fitur generate PDF, QR code verification, atau template dokumen.
---

# Document Generation — Spesifikasi Teknis

## Teknologi
- **Generator:** Puppeteer (Node.js) — HTML template → PDF
- **QR Code:** `qrcode` npm package
- **Hash:** SHA-256 untuk QR verification
- **Storage:** Upload ke AWS S3, simpan URL di tabel `documents`

## 3 Jenis Dokumen

| Dokumen | Trigger | Siapa yang download |
|---|---|---|
| **Invoice Pelunasan** | Lot terjual (SOLD) | Bidder pemenang |
| **Surat Jalan** | Invoice LUNAS | Bidder pemenang |
| **BAST** | Barang diserahkan | Bidder + Admin |

## 1. Invoice Pelunasan

### Data yang ditampilkan:
- Logo perusahaan (dari `platform_settings`)
- Nomor invoice (format: `INV-{BRANCH}-{YYYYMMDD}-{SEQ}`)
- Tanggal invoice
- Data bidder pemenang (nama, email, phone — BUKAN KTP)
- Detail lot: nama aset, nomor lot, sesi
- Rincian harga:
  - Harga Hammer: Rp XXX
  - Komisi Balai (3%): Rp XXX
  - Buyer Premium (1.5%): Rp XXX
  - PPN (11%): Rp XXX
  - **TOTAL: Rp XXX**
- Batas pelunasan (due date)
- Rekening pembayaran / VA number
- QR Code verifikasi (berisi hash dokumen)
- Footer: alamat cabang, kontak

### Template HTML (Puppeteer)

```html
<!-- Template: invoice.html -->
<html>
<head>
  <style>
    @page { size: A4; margin: 20mm; }
    body { font-family: 'Inter', sans-serif; font-size: 12pt; }
    .header { display: flex; justify-content: space-between; }
    .logo { height: 50px; }
    .invoice-number { font-size: 18pt; font-weight: bold; color: #1B4F72; }
    table.items { width: 100%; border-collapse: collapse; margin: 20px 0; }
    table.items th { background: #1B4F72; color: white; padding: 10px; }
    table.items td { border-bottom: 1px solid #ddd; padding: 10px; }
    .total-row { font-weight: bold; font-size: 14pt; background: #f0f0f0; }
    .qr-code { text-align: center; margin-top: 30px; }
    .footer { font-size: 9pt; color: #666; margin-top: 40px; border-top: 1px solid #ddd; }
  </style>
</head>
<body>
  <div class="header">
    <img class="logo" src="{{logoUrl}}" />
    <div>
      <div class="invoice-number">{{invoiceNumber}}</div>
      <div>Tanggal: {{invoiceDate}}</div>
      <div>Jatuh Tempo: {{dueDate}}</div>
    </div>
  </div>
  <!-- ... detail bidder, lot, rincian harga ... -->
  <div class="qr-code">
    <img src="{{qrCodeDataUrl}}" width="120" />
    <p>Scan QR untuk verifikasi keaslian dokumen</p>
  </div>
</body>
</html>
```

## 2. Surat Jalan

### Data yang ditampilkan:
- Nomor surat jalan (format: `SJ-{BRANCH}-{YYYYMMDD}-{SEQ}`)
- Detail lot: nama aset, nomor lot, nomor rangka, nomor mesin
- Identitas pemenang (nama, nomor invoice)
- Tanggal pengambilan yang dijadwalkan
- Lokasi pengambilan (alamat gudang/cabang)
- QR Code verifikasi
- Slot tanda tangan: Penerima dan Petugas

### Generate Surat Jalan:
```typescript
async function generateSuratJalan(invoiceId: string): Promise<Document> {
  const invoice = await db.invoices.findById(invoiceId, {
    include: ['lot', 'lot.asset', 'bidder', 'lot.session.branch']
  });

  // Generate QR hash
  const qrHash = crypto
    .createHash('sha256')
    .update(`SJ-${invoice.id}-${invoice.lot_id}-${Date.now()}`)
    .digest('hex');

  // Generate QR code data URL
  const qrDataUrl = await QRCode.toDataURL(
    `https://app.indolelang.com/verify/${qrHash}`
  );

  // Render HTML template
  const html = renderTemplate('surat-jalan.html', {
    suratJalanNumber: generateSJNumber(invoice),
    asset: invoice.lot.asset,
    bidder: invoice.bidder,
    pickupDate: invoice.pickup_date,
    branch: invoice.lot.session.branch,
    qrCodeDataUrl: qrDataUrl
  });

  // Convert to PDF via Puppeteer
  const pdfBuffer = await htmlToPdf(html, { format: 'A4' });

  // Upload to S3
  const fileUrl = await s3.upload(pdfBuffer, `documents/surat-jalan/${qrHash}.pdf`);

  // Save to database
  return await db.documents.create({
    invoice_id: invoiceId,
    type: 'surat_jalan',
    file_url: fileUrl,
    generated_at: new Date(),
    qr_hash: qrHash
  });
}
```

## 3. BAST (Berita Acara Serah Terima)

### Data yang ditampilkan:
- Format resmi A4
- Nomor BAST (format: `BAST-{BRANCH}-{YYYYMMDD}-{SEQ}`)
- Data pihak pertama (Balai Lelang): nama, alamat, penanggung jawab
- Data pihak kedua (Pemenang): nama, alamat, NIK (masked: `3201****0001`)
- Detail aset yang diserahkan:
  - Nama aset
  - Kategori
  - Nomor lot & sesi
  - Kondisi saat serah terima
  - Kelengkapan dokumen (STNK, BPKB, dll)
- Pasal-pasal serah terima (template)
- QR Code immutable (hash dokumen)
- Slot TTD digital:
  - Pihak Pertama (petugas balai lelang)
  - Pihak Kedua (pemenang)
  - Saksi (opsional)
- Timestamp generate

### QR Hash (Immutable)
```typescript
function generateBASTHash(bast: BASTData): string {
  const content = JSON.stringify({
    bast_number: bast.number,
    invoice_id: bast.invoiceId,
    lot_id: bast.lotId,
    bidder_id: bast.bidderId,
    asset_title: bast.assetTitle,
    hammer_price: bast.hammerPrice,
    generated_at: bast.generatedAt
  });

  return crypto.createHash('sha256').update(content).digest('hex');
}
```

## QR Code Verification Endpoint

```
GET /api/v1/documents/{qr_hash}/verify

Response 200 (QR valid):
{
  "success": true,
  "data": {
    "document_type": "bast",
    "document_number": "BAST-JKT-20260615-001",
    "generated_at": "2026-06-15T10:00:00+07:00",
    "status": "valid",
    "lot_title": "Toyota Avanza 2022",
    "session_title": "Sesi Mobil Penumpang JKT - Batch 15"
  }
}

Response 404 (QR tidak ditemukan):
{
  "success": false,
  "error": { "code": "DOCUMENT_NOT_FOUND", "message": "Dokumen tidak ditemukan" }
}
```

## Puppeteer PDF Config

```typescript
async function htmlToPdf(html: string, options?: PDFOptions): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });

  const pdf = await page.pdf({
    format: 'A4',
    margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
    printBackground: true,
    displayHeaderFooter: false
  });

  await browser.close();
  return pdf;
}
```

## Nomor Dokumen Format

| Dokumen | Format | Contoh |
|---|---|---|
| Invoice | `INV-{CABANG}-{YYYYMMDD}-{SEQ}` | `INV-JKT-20260615-042` |
| Surat Jalan | `SJ-{CABANG}-{YYYYMMDD}-{SEQ}` | `SJ-JKT-20260615-042` |
| BAST | `BAST-{CABANG}-{YYYYMMDD}-{SEQ}` | `BAST-JKT-20260615-042` |

`{SEQ}` = auto-increment per cabang per hari, reset setiap hari.

## e-Signature (Feature Toggle: `feat_esign_bast`)

- **OFF (default):** BAST tanpa tanda tangan digital, hanya slot TTD kosong
- **ON:** Integrasi Privy.ID untuk e-Signature
  - BAST dikirim ke Privy.ID
  - Pihak 1 & 2 tanda tangan via link/OTP
  - Dokumen tersertifikasi secara hukum
