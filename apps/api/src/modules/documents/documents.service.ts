import { prisma } from '../../config/database';
import { AppError } from '../../lib/appError';
import { ErrorCode } from '@indo-lelang/utils';
import { htmlToPdf } from '../../lib/pdf';
import QRCode from 'qrcode';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export class DocumentsService {
  private getUploadsDir(): string {
    const dir = path.resolve(process.cwd(), 'uploads/documents');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    return dir;
  }

  /**
   * Helper to format rupiah currency
   */
  private formatRupiah(val: number): string {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(val);
  }

  /**
   * Generate sequential document number: {TYPE}-{CABANG}-{YYYYMMDD}-{SEQ}
   */
  async generateDocNumber(invoiceId: string, type: 'invoice' | 'surat_jalan' | 'bast'): Promise<string> {
    const invoice = await prisma.invoices.findUnique({
      where: { id: invoiceId },
      include: {
        lot: {
          include: {
            session: {
              include: {
                branch: true,
              },
            },
          },
        },
      },
    });

    if (!invoice) {
      throw new AppError(404, ErrorCode.NOT_FOUND, 'Invoice tidak ditemukan');
    }

    const branchCity = invoice.lot.session.branch.city.toLowerCase();
    const branchPrefix = branchCity.includes('jakarta')
      ? 'JKT'
      : branchCity.includes('surabaya')
      ? 'SBY'
      : branchCity.substring(0, 3).toUpperCase();

    const today = new Date();
    const yyyymmdd = today.toISOString().split('T')[0].replace(/-/g, '');

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // Count documents of this type for this branch created today to determine sequence
    const count = await prisma.documents.count({
      where: {
        type,
        created_at: {
          gte: startOfDay,
          lte: endOfDay,
        },
        invoice: {
          lot: {
            session: {
              branch_id: invoice.lot.session.branch_id,
            },
          },
        },
      },
    });

    const seq = String(count + 1).padStart(3, '0');
    const typePrefix = type === 'invoice' ? 'INV' : type === 'surat_jalan' ? 'SJ' : 'BAST';

    return `${typePrefix}-${branchPrefix}-${yyyymmdd}-${seq}`;
  }

  /**
   * Generate Invoice PDF
   */
  async generateInvoicePdf(invoiceId: string): Promise<any> {
    // Check if invoice document already exists
    const existingDoc = await prisma.documents.findFirst({
      where: { invoice_id: invoiceId, type: 'invoice' },
    });
    if (existingDoc) return existingDoc;

    const invoice = await prisma.invoices.findUnique({
      where: { id: invoiceId },
      include: {
        bidder: true,
        lot: {
          include: {
            asset: true,
            session: {
              include: {
                branch: true,
              },
            },
          },
        },
      },
    });

    if (!invoice) {
      throw new AppError(404, ErrorCode.NOT_FOUND, 'Invoice tidak ditemukan');
    }

    const docNumber = await this.generateDocNumber(invoiceId, 'invoice');
    const qrHash = crypto
      .createHash('sha256')
      .update(`invoice-${invoiceId}-${Date.now()}`)
      .digest('hex');

    // QR points to Admin Panel verify URL
    const qrDataUrl = await QRCode.toDataURL(`http://localhost:3000/verify/${qrHash}`);

    const htmlContent = `
      <html>
      <head>
        <style>
          body { font-family: 'Inter', sans-serif; color: #2d3748; padding: 20px; line-height: 1.5; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #e2e8f0; padding-bottom: 15px; margin-bottom: 25px; }
          .logo { font-size: 24px; font-weight: bold; color: #1b4f72; }
          .invoice-details { text-align: right; }
          .title { font-size: 28px; color: #1b4f72; margin: 0; }
          .section { margin-bottom: 20px; }
          .section-title { font-weight: bold; font-size: 14px; text-transform: uppercase; color: #718096; margin-bottom: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th { background-color: #1b4f72; color: white; text-align: left; padding: 10px; font-size: 13px; }
          td { padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
          .total-box { background-color: #f7fafc; padding: 15px; border-radius: 6px; margin-top: 20px; text-align: right; }
          .qr-container { text-align: center; margin-top: 40px; }
          .qr-img { width: 100px; height: 100px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="logo">🏛️ Indo-Lelang</div>
            <div style="font-size: 12px; color: #718096; margin-top: 4px;">${invoice.lot.session.branch.name}</div>
          </div>
          <div class="invoice-details">
            <h1 class="title">INVOICE PELUNASAN</h1>
            <div style="font-weight: bold; margin-top: 4px;">No: ${docNumber}</div>
            <div style="font-size: 12px; color: #718096;">Tanggal: ${new Date(invoice.created_at).toLocaleDateString('id-ID')}</div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Pemenang Lelang</div>
          <div><strong>Nama:</strong> ${invoice.bidder.full_name}</div>
          <div><strong>Email:</strong> ${invoice.bidder.email}</div>
          <div><strong>Telepon:</strong> ${invoice.bidder.phone}</div>
        </div>

        <div class="section">
          <div class="section-title">Rincian Lot Barang</div>
          <table>
            <thead>
              <tr>
                <th>Lot</th>
                <th>Kategori</th>
                <th>Nama Unit Aset</th>
                <th>Sesi Lelang</th>
                <th style="text-align: right;">Harga Terbentuk</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>#${invoice.lot.lot_number}</td>
                <td style="text-transform: capitalize;">${invoice.lot.asset.category}</td>
                <td><strong>${invoice.lot.asset.title}</strong></td>
                <td>${invoice.lot.session.title}</td>
                <td style="text-align: right;">${this.formatRupiah(Number(invoice.hammer_price))}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="total-box">
          <table style="width: auto; margin-left: auto;">
            <tr>
              <td style="border: none; text-align: right; color: #718096;">Harga Terbentuk (Hammer):</td>
              <td style="border: none; text-align: right; font-weight: bold; width: 150px;">${this.formatRupiah(Number(invoice.hammer_price))}</td>
            </tr>
            <tr>
              <td style="border: none; text-align: right; color: #718096;">Komisi Balai Lelang:</td>
              <td style="border: none; text-align: right; font-weight: bold;">${this.formatRupiah(Number(invoice.commission))}</td>
            </tr>
            <tr>
              <td style="border: none; text-align: right; color: #718096;">PPN (11%):</td>
              <td style="border: none; text-align: right; font-weight: bold;">${this.formatRupiah(Number(invoice.tax))}</td>
            </tr>
            <tr style="font-size: 16px; border-top: 2px solid #cbd5e0;">
              <td style="border: none; text-align: right; font-weight: bold; color: #1b4f72;">TOTAL BAYAR:</td>
              <td style="border: none; text-align: right; font-weight: bold; color: #e53e3e;">${this.formatRupiah(Number(invoice.total))}</td>
            </tr>
          </table>
        </div>

        <div class="section" style="margin-top: 30px;">
          <div class="section-title">Instruksi Pembayaran</div>
          <div>Silakan lakukan transfer pelunasan sebelum tanggal <strong>${new Date(invoice.due_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>.</div>
          <div style="margin-top: 8px;"><strong>Status Tagihan:</strong> <span style="color: #e53e3e; font-weight: bold;">BELUM LUNAS</span></div>
        </div>

        <div class="qr-container">
          <img class="qr-img" src="${qrDataUrl}" alt="QR Verification" />
          <div style="font-size: 10px; color: #a0aec0; margin-top: 6px;">Pindai QR Code untuk memverifikasi keaslian dokumen resmi ini</div>
          <div style="font-family: monospace; font-size: 9px; color: #cbd5e0; margin-top: 2px;">Hash: ${qrHash}</div>
        </div>
      </body>
      </html>
    `;

    const pdfBuffer = await htmlToPdf(htmlContent);
    const filename = `invoice-${qrHash}.pdf`;
    const filepath = path.join(this.getUploadsDir(), filename);
    fs.writeFileSync(filepath, pdfBuffer);

    // Save metadata to DB
    return await prisma.documents.create({
      data: {
        invoice_id: invoiceId,
        type: 'invoice',
        file_url: `/uploads/documents/${filename}`,
        qr_hash: qrHash,
      },
    });
  }

  /**
   * Generate Surat Jalan PDF (Enabled once invoice status = paid)
   */
  async generateSuratJalanPdf(invoiceId: string): Promise<any> {
    const existingDoc = await prisma.documents.findFirst({
      where: { invoice_id: invoiceId, type: 'surat_jalan' },
    });
    if (existingDoc) return existingDoc;

    const invoice = await prisma.invoices.findUnique({
      where: { id: invoiceId },
      include: {
        bidder: true,
        lot: {
          include: {
            asset: true,
            session: {
              include: {
                branch: true,
              },
            },
          },
        },
      },
    });

    if (!invoice) {
      throw new AppError(404, ErrorCode.NOT_FOUND, 'Invoice tidak ditemukan');
    }

    if (invoice.status !== 'paid') {
      throw new AppError(400, ErrorCode.BAD_REQUEST, 'Surat Jalan hanya bisa diterbitkan setelah Invoice lunas dibayar.');
    }

    const docNumber = await this.generateDocNumber(invoiceId, 'surat_jalan');
    const qrHash = crypto
      .createHash('sha256')
      .update(`surat-jalan-${invoiceId}-${Date.now()}`)
      .digest('hex');

    const qrDataUrl = await QRCode.toDataURL(`http://localhost:3000/verify/${qrHash}`);

    const htmlContent = `
      <html>
      <head>
        <style>
          body { font-family: 'Inter', sans-serif; color: #2d3748; padding: 20px; line-height: 1.5; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #e2e8f0; padding-bottom: 15px; margin-bottom: 25px; }
          .logo { font-size: 24px; font-weight: bold; color: #1b4f72; }
          .doc-details { text-align: right; }
          .title { font-size: 28px; color: #1b4f72; margin: 0; }
          .section { margin-bottom: 20px; }
          .section-title { font-weight: bold; font-size: 14px; text-transform: uppercase; color: #718096; margin-bottom: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
          .signatures { display: flex; justify-content: space-between; margin-top: 50px; }
          .sig-box { width: 200px; text-align: center; }
          .sig-line { border-bottom: 1px solid #2d3748; height: 60px; margin-bottom: 10px; }
          .qr-container { text-align: center; margin-top: 30px; }
          .qr-img { width: 100px; height: 100px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="logo">🏛️ Indo-Lelang</div>
            <div style="font-size: 12px; color: #718096; margin-top: 4px;">${invoice.lot.session.branch.name}</div>
          </div>
          <div class="doc-details">
            <h1 class="title">SURAT JALAN</h1>
            <div style="font-weight: bold; margin-top: 4px;">No: ${docNumber}</div>
            <div style="font-size: 12px; color: #718096;">Tanggal Terbit: ${new Date().toLocaleDateString('id-ID')}</div>
          </div>
        </div>

        <p>Kepada Yth. Petugas Gudang / Keamanan Cabang <strong>${invoice.lot.session.branch.name}</strong>,</p>
        <p>Mohon diberikan izin jalan untuk pengeluaran dan serah terima unit barang lelang kepada pemenang sah berikut:</p>

        <div class="section">
          <div class="section-title">Penerima Barang</div>
          <div><strong>Nama Lengkap:</strong> ${invoice.bidder.full_name}</div>
          <div><strong>Nomor Telepon:</strong> ${invoice.bidder.phone}</div>
          <div><strong>Referensi Invoice:</strong> ${invoice.id.substring(0, 8)} (LUNAS)</div>
        </div>

        <div class="section">
          <div class="section-title">Spesifikasi Unit Barang</div>
          <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: bold; width: 180px;">Nama Aset Barang:</td>
              <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${invoice.lot.asset.title}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: bold;">Kategori:</td>
              <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-transform: capitalize;">${invoice.lot.asset.category}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: bold;">Nomor Lot:</td>
              <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">Lot #${invoice.lot.lot_number}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: bold;">Sesi Lelang:</td>
              <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${invoice.lot.session.title}</td>
            </tr>
          </table>
        </div>

        <div class="signatures">
          <div class="sig-box">
            <div>Penerima Barang,</div>
            <div class="sig-line"></div>
            <div style="font-weight: bold;">(${invoice.bidder.full_name})</div>
          </div>
          <div class="sig-box">
            <div>Petugas Balai Lelang,</div>
            <div class="sig-line"></div>
            <div style="font-weight: bold;">( ${invoice.lot.session.branch.pic_name} )</div>
          </div>
        </div>

        <div class="qr-container">
          <img class="qr-img" src="${qrDataUrl}" alt="QR Verification" />
          <div style="font-size: 10px; color: #a0aec0; margin-top: 6px;">Pindai QR Code untuk memverifikasi keaslian Surat Jalan ini</div>
          <div style="font-family: monospace; font-size: 9px; color: #cbd5e0; margin-top: 2px;">Hash: ${qrHash}</div>
        </div>
      </body>
      </html>
    `;

    const pdfBuffer = await htmlToPdf(htmlContent);
    const filename = `suratjalan-${qrHash}.pdf`;
    const filepath = path.join(this.getUploadsDir(), filename);
    fs.writeFileSync(filepath, pdfBuffer);

    return await prisma.documents.create({
      data: {
        invoice_id: invoiceId,
        type: 'surat_jalan',
        file_url: `/uploads/documents/${filename}`,
        qr_hash: qrHash,
      },
    });
  }

  /**
   * Generate BAST (Berita Acara Serah Terima) PDF
   */
  async generateBastPdf(invoiceId: string): Promise<any> {
    const existingDoc = await prisma.documents.findFirst({
      where: { invoice_id: invoiceId, type: 'bast' },
    });
    if (existingDoc) return existingDoc;

    const invoice = await prisma.invoices.findUnique({
      where: { id: invoiceId },
      include: {
        bidder: true,
        lot: {
          include: {
            asset: true,
            session: {
              include: {
                branch: true,
              },
            },
          },
        },
      },
    });

    if (!invoice) {
      throw new AppError(404, ErrorCode.NOT_FOUND, 'Invoice tidak ditemukan');
    }

    if (invoice.status !== 'paid') {
      throw new AppError(400, ErrorCode.BAD_REQUEST, 'BAST hanya bisa diterbitkan setelah unit lunas dibayar.');
    }

    const docNumber = await this.generateDocNumber(invoiceId, 'bast');
    const qrHash = crypto
      .createHash('sha256')
      .update(`bast-${invoiceId}-${Date.now()}`)
      .digest('hex');

    const qrDataUrl = await QRCode.toDataURL(`http://localhost:3000/verify/${qrHash}`);

    const htmlContent = `
      <html>
      <head>
        <style>
          body { font-family: 'Inter', sans-serif; color: #2d3748; padding: 20px; line-height: 1.5; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #e2e8f0; padding-bottom: 15px; margin-bottom: 25px; }
          .logo { font-size: 24px; font-weight: bold; color: #1b4f72; }
          .doc-details { text-align: right; }
          .title { font-size: 24px; color: #1b4f72; margin: 0; }
          .section { margin-bottom: 20px; }
          .section-title { font-weight: bold; font-size: 13px; text-transform: uppercase; color: #718096; margin-bottom: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
          .signatures { display: flex; justify-content: space-between; margin-top: 40px; }
          .sig-box { width: 220px; text-align: center; }
          .sig-line { border-bottom: 1px dashed #2d3748; height: 50px; margin-bottom: 10px; }
          .qr-container { text-align: center; margin-top: 30px; }
          .qr-img { width: 90px; height: 90px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="logo">🏛️ Indo-Lelang</div>
            <div style="font-size: 11px; color: #718096; margin-top: 4px;">${invoice.lot.session.branch.name}</div>
          </div>
          <div class="doc-details">
            <h1 class="title">BERITA ACARA SERAH TERIMA</h1>
            <div style="font-weight: bold; margin-top: 4px; font-size: 12px;">No: ${docNumber}</div>
            <div style="font-size: 11px; color: #718096;">Tanggal Serah Terima: ${new Date().toLocaleDateString('id-ID')}</div>
          </div>
        </div>

        <p style="font-size: 12px;">Pada hari ini, menerangkan bahwa telah dilakukan penyerahan fisik barang lelang dari Balai Lelang kepada pemenang lelang:</p>

        <div class="section">
          <div class="section-title">Pihak Pertama (Balai Lelang)</div>
          <div style="font-size: 12px;"><strong>Nama Instansi:</strong> ${invoice.lot.session.branch.name}</div>
          <div style="font-size: 12px;"><strong>Penanggung Jawab:</strong> ${invoice.lot.session.branch.pic_name}</div>
          <div style="font-size: 12px;"><strong>Alamat Cabang:</strong> ${invoice.lot.session.branch.address}</div>
        </div>

        <div class="section">
          <div class="section-title">Pihak Kedua (Pemenang Lelang)</div>
          <div style="font-size: 12px;"><strong>Nama Lengkap:</strong> ${invoice.bidder.full_name}</div>
          <div style="font-size: 12px;"><strong>Nomor Telepon:</strong> ${invoice.bidder.phone}</div>
          <div style="font-size: 12px;"><strong>NIK KTP:</strong> ${invoice.bidder.npwp ? invoice.bidder.npwp : 'Terverifikasi e-KYC'}</div>
        </div>

        <div class="section">
          <div class="section-title">Spesifikasi Unit Aset yang Diserahkan</div>
          <div style="font-size: 12px;"><strong>Nama Barang:</strong> ${invoice.lot.asset.title}</div>
          <div style="font-size: 12px;"><strong>Nomor Lot:</strong> Lot #${invoice.lot.lot_number}</div>
          <div style="font-size: 12px;"><strong>Harga Penawaran Terbentuk:</strong> ${this.formatRupiah(Number(invoice.hammer_price))}</div>
          <div style="font-size: 12px;"><strong>Status Dokumen Kendaraan:</strong> Kelengkapan dokumen BPKB, STNK, dan Faktur diserahkan lengkap kepada Pihak Kedua.</div>
        </div>

        <div style="font-size: 11px; color: #4a5568; margin-top: 15px; border: 1px solid #cbd5e0; padding: 10px; border-radius: 4px; background-color: #f7fafc;">
          <strong>Pasal 1:</strong> Dengan ditandatanganinya berita acara ini, Pihak Kedua menyatakan telah menerima fisik unit barang di atas dalam kondisi baik dan setuju atas kelengkapan dokumen pendukung.<br/>
          <strong>Pasal 2:</strong> Segala biaya administrasi balik nama dan perawatan unit barang terhitung sejak berita acara ditandatangani menjadi tanggung jawab Pihak Kedua sepenuhnya.
        </div>

        <div class="signatures">
          <div class="sig-box">
            <div style="font-size: 12px;">PIHAK KEDUA (Penerima)</div>
            <div class="sig-line"></div>
            <div style="font-weight: bold; font-size: 12px;">(${invoice.bidder.full_name})</div>
          </div>
          <div class="sig-box">
            <div style="font-size: 12px;">PIHAK PERTAMA (Penyerah)</div>
            <div class="sig-line"></div>
            <div style="font-weight: bold; font-size: 12px;">( ${invoice.lot.session.branch.pic_name} )</div>
          </div>
        </div>

        <div class="qr-container">
          <img class="qr-img" src="${qrDataUrl}" alt="QR Verification" />
          <div style="font-size: 9px; color: #a0aec0; margin-top: 4px;">Pindai QR Code untuk memverifikasi keaslian BAST ini</div>
          <div style="font-family: monospace; font-size: 8px; color: #cbd5e0; margin-top: 2px;">Hash: ${qrHash}</div>
        </div>
      </body>
      </html>
    `;

    const pdfBuffer = await htmlToPdf(htmlContent);
    const filename = `bast-${qrHash}.pdf`;
    const filepath = path.join(this.getUploadsDir(), filename);
    fs.writeFileSync(filepath, pdfBuffer);

    return await prisma.documents.create({
      data: {
        invoice_id: invoiceId,
        type: 'bast',
        file_url: `/uploads/documents/${filename}`,
        qr_hash: qrHash,
      },
    });
  }

  /**
   * Verify QR Hash verification endpoint
   */
  async verifyDocument(qrHash: string): Promise<any> {
    const doc = await prisma.documents.findUnique({
      where: { qr_hash: qrHash },
      include: {
        invoice: {
          include: {
            bidder: {
              select: {
                full_name: true,
              },
            },
            lot: {
              include: {
                asset: {
                  select: {
                    title: true,
                  },
                },
                session: {
                  select: {
                    title: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!doc) {
      throw new AppError(404, ErrorCode.NOT_FOUND, 'Dokumen tidak ditemukan atau QR Code tidak valid.');
    }

    let docNumber = '';
    // Format doc number dynamically based on database contents
    if (doc.type === 'invoice') {
      docNumber = `INV-${doc.invoice.id.substring(0, 8).toUpperCase()}`;
    } else if (doc.type === 'surat_jalan') {
      docNumber = `SJ-${doc.invoice.id.substring(0, 8).toUpperCase()}`;
    } else {
      docNumber = `BAST-${doc.invoice.id.substring(0, 8).toUpperCase()}`;
    }

    return {
      document_type: doc.type,
      document_number: docNumber,
      generated_at: doc.generated_at.toISOString(),
      status: 'valid',
      lot_title: doc.invoice.lot.asset.title,
      session_title: doc.invoice.lot.session.title,
      bidder_name: doc.invoice.bidder.full_name,
    };
  }

  /**
   * Get list of invoices
   */
  async getInvoices(
    page: number,
    perPage: number,
    userId?: string,
    status?: string
  ): Promise<{ invoices: any[]; meta: any }> {
    const skip = (page - 1) * perPage;
    const where: any = {};

    if (userId) {
      where.bidder_id = userId;
    }
    if (status) {
      where.status = status;
    }

    const [total, items] = await Promise.all([
      prisma.invoices.count({ where }),
      prisma.invoices.findMany({
        where,
        skip,
        take: perPage,
        orderBy: { created_at: 'desc' },
        include: {
          bidder: {
            select: {
              full_name: true,
              email: true,
              phone: true,
            },
          },
          lot: {
            include: {
              asset: {
                select: {
                  title: true,
                  category: true,
                },
              },
              session: {
                select: {
                  title: true,
                },
              },
            },
          },
        },
      }),
    ]);

    return {
      invoices: items,
      meta: {
        page,
        per_page: perPage,
        total,
      },
    };
  }

  /**
   * Generate BAPL (Berita Acara Pemenang Lelang) PDF
   */
  async generateBaplPdf(invoiceId: string): Promise<any> {
    const existingDoc = await prisma.documents.findFirst({
      where: { invoice_id: invoiceId, type: 'bapl' },
    });
    if (existingDoc) return existingDoc;

    const invoice = await prisma.invoices.findUnique({
      where: { id: invoiceId },
      include: {
        bidder: true,
        lot: {
          include: {
            asset: true,
            session: {
              include: {
                branch: true,
              },
            },
          },
        },
      },
    });

    if (!invoice) {
      throw new AppError(404, ErrorCode.NOT_FOUND, 'Invoice tidak ditemukan');
    }

    if (invoice.status !== 'paid') {
      throw new AppError(400, ErrorCode.BAD_REQUEST, 'BAPL hanya bisa diterbitkan setelah invoice lunas dibayar.');
    }

    // Generate Sequence Number
    const year = new Date().getFullYear();
    const countThisYear = await prisma.documents.count({
      where: {
        type: 'bapl',
        created_at: {
          gte: new Date(`${year}-01-01T00:00:00.000Z`),
          lte: new Date(`${year}-12-31T23:59:59.999Z`),
        }
      }
    });

    const seq = countThisYear + 1;
    const baplNumber = `${seq}/BAPL/${year}`;

    // Get Platform Settings
    const settings = await prisma.platform_settings.findMany({
      where: { key: { in: ['bapl_pejabat_penjual', 'bapl_pejabat_lelang', 'pmk41_percentage'] } }
    });
    
    const settingMap: Record<string, string> = {};
    settings.forEach(s => settingMap[s.key] = s.value);

    const pejabatPenjual = settingMap['bapl_pejabat_penjual'] || '..................';
    const pejabatLelang = settingMap['bapl_pejabat_lelang'] || '..................';
    const pmk41 = settingMap['pmk41_percentage'] || '1.1';

    const qrHash = crypto
      .createHash('sha256')
      .update(`bapl-${invoiceId}-${Date.now()}`)
      .digest('hex');

    const qrDataUrl = await QRCode.toDataURL(`http://localhost:3000/verify/${qrHash}`);

    const htmlContent = `
      <html>
      <head>
        <style>
          body { font-family: 'Inter', sans-serif; color: #2d3748; padding: 20px; line-height: 1.5; font-size: 14px; }
          .header { text-align: center; margin-bottom: 30px; }
          .title { font-size: 18px; font-weight: bold; margin: 0; text-transform: uppercase; }
          .subtitle { font-size: 14px; margin-top: 5px; }
          .content { text-align: justify; }
          .signatures { display: flex; justify-content: space-between; margin-top: 50px; }
          .sig-box { width: 30%; text-align: center; }
          .sig-line { height: 60px; }
          .qr-container { text-align: center; margin-top: 30px; }
          .qr-img { width: 90px; height: 90px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="title">BERITA ACARA PEMENANG LELANG</h1>
          <div class="subtitle">Nomor : ${baplNumber}</div>
        </div>
        <div class="content">
          <p>Pada hari ini, ${new Date().toLocaleDateString('id-ID', { weekday: 'long' })} tanggal ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} bertempat di ${invoice.lot.session.branch.city}. Saya <strong>${pejabatLelang}</strong> selaku Pejabat Lelang Kelas II wilayah ${invoice.lot.session.branch.city}, Direktorat Jenderal Kekayaan Negara telah menunjuk dan menetapkan :</p>
          
          <p>NIPL : ${invoice.bidder.id.substring(0, 8).toUpperCase()}</p>
          <p>Sebagai pemenang lelang Nomor Lot : ${invoice.lot.lot_number}</p>
          
          <table style="width: 100%; margin: 10px 0;">
            <tr><td style="width: 150px;">Jenis Barang</td><td>: ${invoice.lot.asset.category.toUpperCase()}</td></tr>
            <tr><td>No Polisi</td><td>: ${invoice.lot.asset.police_number} Tahun : ${invoice.lot.asset.year}</td></tr>
            <tr><td>Merk/Type</td><td>: ${invoice.lot.asset.brand} ${invoice.lot.asset.model} Warna : ${invoice.lot.asset.color}</td></tr>
          </table>

          <p>Dengan penawaran tertinggi sebagai berikut :</p>
          <table style="width: 100%; margin: 10px 0;">
            <tr><td style="width: 200px;">Harga Terbentuk Lelang</td><td>: ${this.formatRupiah(Number(invoice.hammer_price))}</td></tr>
            <tr><td>Biaya Administrasi</td><td>: ${this.formatRupiah(Number(invoice.commission))}</td></tr>
            <tr><td>Biaya PMK</td><td>: PMK${pmk41.replace('.', '')}</td></tr>
            <tr><td><strong>Sisa Pelunasan</strong></td><td><strong>: ${this.formatRupiah(Number(invoice.total))}</strong></td></tr>
          </table>

          <p style="margin-top: 20px;">Bahwa pelunasan harga lelang harus dibayar selambat-lambatnya 3 (tiga) hari kerja setelah tanggal pelaksanaan lelang ke Rekening PT. INDO LELANG SEJAHTERA di BCA Mutiara Taman Palem Jakarta No. Rekening : 7015-886-161. Apabila batas waktu pembayaran tersebut dilampaui, maka pemenang lelang dianggap mengundurkan diri. Uang jaminan dan semua pembayaran yang telah dilakukan akan menjadi hangus dan pemenang yang bersangkutan akan dimasukkan dalam Daftar Hitam Kantor Pelayanan Kekayaan Negara dan Lelang di seluruh Indonesia.</p>

          <div style="margin-top: 30px; text-align: right;">
            <div>Ditetapkan di : ${invoice.lot.session.branch.city}</div>
            <div>Tanggal : ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
          </div>
        </div>

        <div class="signatures">
          <div class="sig-box">
            <div>Pemenang Lelang</div>
            <div class="sig-line"></div>
            <div style="font-weight: bold;">${invoice.bidder.full_name}</div>
          </div>
          <div class="sig-box">
            <div>Pejabat Penjual</div>
            <div class="sig-line"></div>
            <div style="font-weight: bold;">${pejabatPenjual}</div>
          </div>
          <div class="sig-box">
            <div>Pejabatan Lelang Kelas II</div>
            <div class="sig-line"></div>
            <div style="font-weight: bold;">${pejabatLelang}</div>
          </div>
        </div>

        <div class="qr-container">
          <img class="qr-img" src="${qrDataUrl}" alt="QR Verification" />
          <div style="font-size: 10px; color: #a0aec0; margin-top: 6px;">Pindai QR Code untuk memverifikasi keaslian dokumen ini</div>
          <div style="font-family: monospace; font-size: 9px; color: #cbd5e0; margin-top: 2px;">Hash: ${qrHash}</div>
        </div>
      </body>
      </html>
    `;

    const pdfBuffer = await htmlToPdf(htmlContent);
    const filename = `bapl-${qrHash}.pdf`;
    const filepath = path.join(this.getUploadsDir(), filename);
    fs.writeFileSync(filepath, pdfBuffer);

    return await prisma.documents.create({
      data: {
        invoice_id: invoiceId,
        type: 'bapl',
        file_url: `/uploads/documents/${filename}`,
        qr_hash: qrHash,
      },
    });
  }
}

export const documentsService = new DocumentsService();
