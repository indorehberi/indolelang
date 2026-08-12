import ExcelJS from 'exceljs';
import { prisma } from '../../config/database';
import { AppError } from '../../lib/appError';
import { ErrorCode } from '@indo-lelang/utils';

const HEADER_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FF1E3A8A' },
};

const ONES = ['', 'SATU', 'DUA', 'TIGA', 'EMPAT', 'LIMA', 'ENAM', 'TUJUH', 'DELAPAN', 'SEMBILAN', 'SEPULUH', 'SEBELAS'];

/**
 * Angka ke teks Bahasa Indonesia (dipakai kolom "Terbilang" di kuitansi
 * pendaftaran) — mengikuti pola pengelompokan ribu/juta/milyar/triliun standar.
 */
function terbilang(n: number): string {
  n = Math.floor(Math.abs(n));
  if (n === 0) return 'NOL';
  if (n < 12) return ONES[n];
  if (n < 20) return `${terbilang(n - 10)} BELAS`;
  if (n < 100) return `${terbilang(Math.floor(n / 10))} PULUH${n % 10 ? ` ${terbilang(n % 10)}` : ''}`;
  if (n < 200) return `SERATUS${n % 100 ? ` ${terbilang(n % 100)}` : ''}`;
  if (n < 1000) return `${terbilang(Math.floor(n / 100))} RATUS${n % 100 ? ` ${terbilang(n % 100)}` : ''}`;
  if (n < 2000) return `SERIBU${n % 1000 ? ` ${terbilang(n % 1000)}` : ''}`;
  if (n < 1000000) return `${terbilang(Math.floor(n / 1000))} RIBU${n % 1000 ? ` ${terbilang(n % 1000)}` : ''}`;
  if (n < 1000000000) return `${terbilang(Math.floor(n / 1000000))} JUTA${n % 1000000 ? ` ${terbilang(n % 1000000)}` : ''}`;
  if (n < 1000000000000) return `${terbilang(Math.floor(n / 1000000000))} MILYAR${n % 1000000000 ? ` ${terbilang(n % 1000000000)}` : ''}`;
  return `${terbilang(Math.floor(n / 1000000000000))} TRILIUN${n % 1000000000000 ? ` ${terbilang(n % 1000000000000)}` : ''}`;
}

function terbilangRupiah(amount: number): string {
  return `${terbilang(amount).replace(/\s+/g, ' ').trim()} RUPIAH`;
}

function styleHeaderRow(row: ExcelJS.Row) {
  row.height = 24;
  row.eachCell((cell) => {
    cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = HEADER_FILL;
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    };
  });
}

const DEPOSIT_STATUS_LABEL: Record<string, string> = {
  pending: 'PENDING',
  paid: 'AKTIF',
  active: 'AKTIF',
  pending_refund: 'MENUNGGU REFUND',
  refunded: 'REFUNDED',
  forfeited: 'HANGUS',
  expired: 'EXPIRED',
};

const INVOICE_STATUS_LABEL: Record<string, string> = {
  paid: 'LUNAS',
  unpaid: 'BELUM LUNAS',
  overdue: 'OVERDUE',
};

export class MasterDataService {
  /**
   * Generate 5-sheet "master data" workbook (Pendaftaran, Deposit, AR, BAL,
   * SSBP) untuk satu sesi lelang, meniru struktur file kerja manual yang
   * sebelumnya dibuat admin sendiri di Excel. Kolom yang datanya memang tidak
   * pernah tercatat di sistem (Void, Yg Ditransfer Pemenang aktual, Sisa
   * Lebih/Kurang) sengaja dikosongkan untuk diisi manual — bukan dikarang.
   */
  async generateWorkbook(sessionId: string): Promise<{ buffer: Buffer; filename: string }> {
    const session = await prisma.auction_sessions.findUnique({
      where: { id: sessionId },
      include: { branch: true },
    });
    if (!session) {
      throw new AppError(404, ErrorCode.NOT_FOUND, 'Sesi lelang tidak ditemukan');
    }

    const [ssbpSetting, lots, deposits] = await Promise.all([
      prisma.platform_settings.findFirst({ where: { key: 'ssbp_percentage' } }),
      prisma.lots.findMany({
        where: { session_id: sessionId },
        include: {
          asset: { include: { provider: true } },
          winner: true,
          invoices: { include: { nipl_codes: true } },
        },
        orderBy: { lot_number: 'asc' },
      }),
      prisma.deposits.findMany({
        where: { session_id: sessionId },
        include: { user: true, nipl_codes: true },
        orderBy: { created_at: 'asc' },
      }),
    ]);

    const ssbpPct = parseFloat(ssbpSetting?.value || '0.6') / 100;

    const workbook = new ExcelJS.Workbook();
    this.buildPendaftaranSheet(workbook, deposits, lots);
    this.buildDepositSheet(workbook, deposits);
    this.buildArSheet(workbook, lots);
    this.buildBalSheet(workbook, lots, session);
    this.buildSsbpSheet(workbook, lots, session, ssbpPct);

    const buffer = (await workbook.xlsx.writeBuffer()) as unknown as Buffer;
    const dateStr = new Date(session.scheduled_at).toISOString().split('T')[0];
    const safeTitle = session.title.replace(/[^a-z0-9]+/gi, '_').replace(/^_+|_+$/g, '');
    const filename = `Master_Data_Lelang_${safeTitle}_${dateStr}.xlsx`;

    return { buffer, filename };
  }

  private buildPendaftaranSheet(workbook: ExcelJS.Workbook, deposits: any[], lots: any[]) {
    const ws = workbook.addWorksheet('PENDAFTARAN MOBIL');
    ws.columns = [
      { header: 'NO', key: 'no', width: 6 },
      { header: 'NIPL', key: 'nipl', width: 14 },
      { header: 'Telah Terima Dari', key: 'nama', width: 28 },
      { header: 'Alamat', key: 'alamat', width: 40 },
      { header: 'Nama Kota', key: 'kota', width: 18 },
      { header: 'Jumlah Uang', key: 'jumlah', width: 16 },
      { header: 'Terbilang', key: 'terbilang', width: 45 },
      { header: 'Setor BANK / ATM / EDC', key: 'setor', width: 20 },
      { header: 'No HP', key: 'hp', width: 16 },
      { header: 'Bank', key: 'bank', width: 12 },
      { header: 'No Rekening', key: 'no_rek', width: 18 },
      { header: 'Nama Rekening', key: 'nama_rek', width: 24 },
      { header: 'Keterangan', key: 'ket', width: 18 },
      { header: 'Void', key: 'void', width: 10 },
      { header: 'Menang / Kalah', key: 'hasil', width: 14 },
    ];
    styleHeaderRow(ws.getRow(1));

    deposits.forEach((d, idx) => {
      const won = lots.some((l) => l.winner_id === d.user_id);
      ws.addRow({
        no: idx + 1,
        nipl: d.nipl_codes?.[0]?.code || '',
        nama: d.user?.full_name || '',
        alamat: d.user?.address || '',
        // Bidder tidak punya field kota terpisah (address satu blok teks) —
        // dikosongkan untuk diisi manual, sama seperti kolom Void.
        kota: '',
        jumlah: Number(d.amount || 0),
        terbilang: terbilangRupiah(Number(d.amount || 0)),
        setor: d.is_manual ? 'TRANSFER' : (d.payment_method || '-'),
        hp: d.user?.phone || '',
        bank: d.user?.bank_name || '',
        no_rek: d.user?.bank_account_no || '',
        nama_rek: d.user?.bank_account_name || '',
        ket: '',
        void: '',
        hasil: won ? 'MENANG' : 'KALAH',
      });
    });

    ws.getColumn('jumlah').numFmt = '#,##0';
  }

  private buildDepositSheet(workbook: ExcelJS.Workbook, deposits: any[]) {
    const ws = workbook.addWorksheet('Deposit (Jaminan)');
    ws.columns = [
      { header: 'NO.', key: 'no', width: 6 },
      { header: 'NIPL', key: 'nipl', width: 14 },
      { header: 'NAMA', key: 'nama', width: 28 },
      { header: 'JAMINAN', key: 'jaminan', width: 16 },
      { header: 'TOTAL JAMINAN', key: 'total_jaminan', width: 16 },
      { header: 'BANK', key: 'bank', width: 12 },
      { header: 'NO REKENING', key: 'no_rek', width: 18 },
      { header: 'NAMA REKENING', key: 'nama_rek', width: 24 },
      { header: 'STATUS', key: 'status', width: 16 },
      { header: 'KET', key: 'ket', width: 18 },
      { header: 'RETUR JAMINAN', key: 'retur', width: 20 },
    ];
    styleHeaderRow(ws.getRow(1));

    deposits.forEach((d, idx) => {
      const amount = Number(d.amount || 0);
      // Retur = nominal yang benar-benar ditransfer balik ke bidder (amount
      // dikurangi refund_fee, yang sudah dipatok saat deposit dibuat dari
      // setelan manual_refund_fee) — bukan field baru, dihitung dari yang
      // sudah ada. Forfeited bukan "retur", jadi ditandai terpisah.
      let retur = '';
      if (d.status === 'refunded') {
        const fee = Number(d.refund_fee || 0);
        retur = `${(amount - fee).toLocaleString('id-ID')} (${new Date(d.updated_at).toLocaleDateString('id-ID')})`;
      } else if (d.status === 'forfeited') {
        retur = 'HANGUS (dibagi 2 dgn provider)';
      }

      ws.addRow({
        no: idx + 1,
        nipl: d.nipl_codes?.[0]?.code || '',
        nama: d.user?.full_name || '',
        jaminan: amount,
        total_jaminan: amount,
        bank: d.user?.bank_name || '',
        no_rek: d.user?.bank_account_no || '',
        nama_rek: d.user?.bank_account_name || '',
        status: DEPOSIT_STATUS_LABEL[d.status] || String(d.status).toUpperCase(),
        ket: '',
        retur,
      });
    });

    ws.getColumn('jaminan').numFmt = '#,##0';
    ws.getColumn('total_jaminan').numFmt = '#,##0';
  }

  private buildArSheet(workbook: ExcelJS.Workbook, lots: any[]) {
    const ws = workbook.addWorksheet('AR');
    ws.columns = [
      { header: 'NO.', key: 'no', width: 6 },
      { header: 'NIPL', key: 'nipl', width: 14 },
      { header: 'NAMA PESERTA', key: 'nama', width: 28 },
      { header: 'NO LOT', key: 'lot', width: 8 },
      { header: 'NO POLISI', key: 'nopol', width: 14 },
      { header: 'MEREK / TYPE', key: 'merek', width: 32 },
      { header: 'THN', key: 'thn', width: 8 },
      { header: 'WARNA', key: 'warna', width: 14 },
      { header: 'NO RANGKA', key: 'nokan', width: 20 },
      { header: 'NO MESIN', key: 'nosin', width: 18 },
      { header: 'CONSIGNEE', key: 'consignee', width: 16 },
      { header: 'HARGA DASAR', key: 'harga_dasar', width: 16 },
      { header: 'HARGA TERBENTUK', key: 'harga_terbentuk', width: 18 },
      { header: 'BIAYA ADM/UNIT', key: 'biaya_adm', width: 16 },
      { header: 'PMK (1,1%)', key: 'pmk', width: 14 },
      { header: 'TOTAL A/R', key: 'total_ar', width: 16 },
      { header: 'JAMINAN', key: 'jaminan', width: 14 },
      { header: 'SISA A/R', key: 'sisa_ar', width: 16 },
      { header: 'TOTAL SISA A/R', key: 'total_sisa_ar', width: 16 },
      { header: 'YG HARUS DITRANSFER PEMENANG', key: 'harus_transfer', width: 22 },
      { header: 'YG DITRANSFER PEMENANG', key: 'ditransfer', width: 20 },
      { header: 'SISA LEBIH / (KURANG)', key: 'selisih', width: 18 },
      { header: 'REMARK', key: 'remark', width: 14 },
    ];
    styleHeaderRow(ws.getRow(1));

    let no = 1;
    for (const lot of lots) {
      const invoice = lot.invoices?.[0];
      if (!invoice) continue; // Lot belum terjual/belum ada tagihan — tidak masuk piutang.

      const asset = lot.asset;
      const total = Number(invoice.total || 0);
      const niplDeduction = Number(invoice.nipl_deduction || 0);
      const sisaAr = total - niplDeduction;

      ws.addRow({
        no: no++,
        nipl: invoice.nipl_codes?.[0]?.code || '',
        nama: lot.winner?.full_name || '',
        lot: lot.lot_number,
        nopol: asset?.police_number || '',
        merek: [asset?.brand, asset?.model, asset?.type].filter(Boolean).join(' ') || asset?.title || '',
        thn: asset?.year || '',
        warna: asset?.color || '',
        nokan: asset?.frame_number || '',
        nosin: asset?.engine_number || '',
        consignee: asset?.provider?.company_name || asset?.provider?.full_name || '',
        harga_dasar: Number(lot.starting_price || 0),
        harga_terbentuk: Number(invoice.hammer_price || lot.hammer_price || 0),
        biaya_adm: Number(invoice.admin_fee || 0),
        pmk: Number(invoice.pmk41_amount || 0),
        total_ar: total,
        jaminan: niplDeduction,
        sisa_ar: sisaAr,
        total_sisa_ar: sisaAr,
        // Sisa A/R = yang harus ditransfer pemenang setelah dikurangi jaminan
        // NIPL yang sudah dipotong sistem. "Yg Ditransfer" & "Sisa
        // Lebih/(Kurang)" aktual dikosongkan — sistem tidak mencatat mutasi
        // bank pemenang secara terpisah dari status lunas/belum, jadi ini
        // memang harus dicocokkan manual oleh admin.
        harus_transfer: sisaAr,
        ditransfer: '',
        selisih: '',
        remark: INVOICE_STATUS_LABEL[invoice.status] || String(invoice.status).toUpperCase(),
      });
    }

    ['harga_dasar', 'harga_terbentuk', 'biaya_adm', 'pmk', 'total_ar', 'jaminan', 'sisa_ar', 'total_sisa_ar', 'harus_transfer'].forEach((key) => {
      ws.getColumn(key).numFmt = '#,##0';
    });
  }

  private poolLabel(asset: any, session: any): string {
    if (asset?.pool_status === 'out_pool') {
      return asset?.pool_city || '';
    }
    return session?.branch?.city || '';
  }

  private buildBalSheet(workbook: ExcelJS.Workbook, lots: any[], session: any) {
    const ws = workbook.addWorksheet('BAL MOBIL');
    ws.columns = [
      { header: 'No Lot', key: 'lot', width: 8 },
      { header: 'NOPOL', key: 'nopol', width: 14 },
      { header: 'Merk / Type', key: 'merek', width: 32 },
      { header: 'Tahun', key: 'thn', width: 8 },
      { header: 'Warna', key: 'warna', width: 14 },
      { header: 'NOKAN', key: 'nokan', width: 20 },
      { header: 'NOSIN', key: 'nosin', width: 18 },
      { header: 'Consignee', key: 'consignee', width: 16 },
      { header: 'POOL', key: 'pool', width: 16 },
      { header: 'Harga Limit', key: 'harga_limit', width: 16 },
      { header: 'Harga Terbentuk', key: 'harga_terbentuk', width: 16 },
      { header: 'NIPL', key: 'nipl', width: 14 },
      { header: 'Nama Pemenang', key: 'pemenang', width: 26 },
    ];
    styleHeaderRow(ws.getRow(1));

    lots.forEach((lot) => {
      const asset = lot.asset;
      const invoice = lot.invoices?.[0];
      const isSold = lot.status === 'sold';
      ws.addRow({
        lot: lot.lot_number,
        nopol: asset?.police_number || '',
        merek: [asset?.brand, asset?.model, asset?.type].filter(Boolean).join(' ') || asset?.title || '',
        thn: asset?.year || '',
        warna: asset?.color || '',
        nokan: asset?.frame_number || '',
        nosin: asset?.engine_number || '',
        consignee: asset?.provider?.company_name || asset?.provider?.full_name || '',
        pool: this.poolLabel(asset, session),
        harga_limit: Number(lot.starting_price || 0),
        harga_terbentuk: isSold ? Number(lot.hammer_price || 0) : (lot.status === 'cancelled' ? 'CANCEL' : ''),
        nipl: invoice?.nipl_codes?.[0]?.code || '',
        pemenang: lot.winner?.full_name || '',
      });
    });

    ws.getColumn('harga_limit').numFmt = '#,##0';
  }

  private buildSsbpSheet(workbook: ExcelJS.Workbook, lots: any[], session: any, ssbpPct: number) {
    const ws = workbook.addWorksheet('SSBP MOBIL');
    ws.columns = [
      { header: 'No Lot', key: 'lot', width: 8 },
      { header: 'NOPOL', key: 'nopol', width: 14 },
      { header: 'Merk / Type', key: 'merek', width: 32 },
      { header: 'Tahun', key: 'thn', width: 8 },
      { header: 'Warna', key: 'warna', width: 14 },
      { header: 'NOKAN', key: 'nokan', width: 20 },
      { header: 'NOSIN', key: 'nosin', width: 18 },
      { header: 'Consignee', key: 'consignee', width: 16 },
      { header: 'POOL', key: 'pool', width: 16 },
      { header: 'Harga Limit', key: 'harga_limit', width: 16 },
      { header: 'Harga Terbentuk', key: 'harga_terbentuk', width: 16 },
      { header: 'NIPL', key: 'nipl', width: 14 },
      { header: `SSBP (${(ssbpPct * 100).toFixed(2).replace(/\.00$/, '')}%)`, key: 'ssbp', width: 16 },
    ];
    styleHeaderRow(ws.getRow(1));

    lots.forEach((lot) => {
      const asset = lot.asset;
      const invoice = lot.invoices?.[0];
      const isSold = lot.status === 'sold';
      const hammerPrice = isSold ? Number(lot.hammer_price || 0) : 0;
      ws.addRow({
        lot: lot.lot_number,
        nopol: asset?.police_number || '',
        merek: [asset?.brand, asset?.model, asset?.type].filter(Boolean).join(' ') || asset?.title || '',
        thn: asset?.year || '',
        warna: asset?.color || '',
        nokan: asset?.frame_number || '',
        nosin: asset?.engine_number || '',
        consignee: asset?.provider?.company_name || asset?.provider?.full_name || '',
        pool: this.poolLabel(asset, session),
        harga_limit: Number(lot.starting_price || 0),
        harga_terbentuk: isSold ? hammerPrice : (lot.status === 'cancelled' ? 'CANCEL' : ''),
        nipl: invoice?.nipl_codes?.[0]?.code || '',
        ssbp: isSold ? Math.round(hammerPrice * ssbpPct) : 0,
      });
    });

    ws.getColumn('harga_limit').numFmt = '#,##0';
    ws.getColumn('ssbp').numFmt = '#,##0';
  }
}

export const masterDataService = new MasterDataService();
