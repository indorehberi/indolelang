'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import Card from '../../../components/ui/Card';
import { apiFetch } from '../../../lib/api';
import { useToast } from '../../../providers/ToastProvider';
import { exportToExcel } from '../../../lib/excelExport';
import ColumnPicker, { useColumnVisibility, ColumnOption } from '../../../components/ui/ColumnPicker';

const FINANCE_COLUMNS: ColumnOption[] = [
  { key: 'lot', label: 'Lot', alwaysVisible: true },
  { key: 'sesi', label: 'Nama Sesi Lelang', defaultVisible: true },
  { key: 'tanggal_sesi', label: 'Tanggal Sesi', defaultVisible: true },
  { key: 'no_polisi', label: 'No. Polisi', defaultVisible: true },
  { key: 'unit_aset', label: 'Unit Aset', defaultVisible: true },
  { key: 'gmv', label: 'Harga Terbentuk (GMV)', defaultVisible: true },
  { key: 'pmk41', label: 'PPN Pemenang (PMK 41)', defaultVisible: true },
  { key: 'fee_admin', label: 'Pemasukan Fee Admin', defaultVisible: true },
  { key: 'fee_lelang', label: 'Pemasukan Fee Lelang', defaultVisible: true },
  { key: 'dpp', label: 'DPP', defaultVisible: true },
  { key: 'dpp_lain', label: 'DPP Nilai Lain', defaultVisible: true },
  { key: 'ppn', label: 'PPN', defaultVisible: true },
  { key: 'total_invoice_fee_lelang', label: 'Total Invoice Fee Lelang', defaultVisible: true },
  { key: 'pph23', label: 'PPH 23 (2%)', defaultVisible: true },
  { key: 'total_penerimaan', label: 'Total Penerimaan Indo Lelang', defaultVisible: true },
  { key: 'pembayaran_provider', label: 'Pembayaran ke Provider', alwaysVisible: true },
  { key: 'provider', label: 'Provider', defaultVisible: true },
  { key: 'pemenang', label: 'Pemenang', defaultVisible: true },
  { key: 'rekening', label: 'Rekening Tujuan', defaultVisible: true },
];

export default function FinanceReportPage() {
  const toast = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchUnit, setSearchUnit] = useState('');
  const [feeAdminFilter, setFeeAdminFilter] = useState('');
  const [feeLelangFilter, setFeeLelangFilter] = useState('');
  const [providerFilter, setProviderFilter] = useState('');
  const [bidderFilter, setBidderFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const [providers, setProviders] = useState<any[]>([]);
  const [bidders, setBidders] = useState<any[]>([]);

  const { visibleKeys, setVisibleKeys, isVisible } = useColumnVisibility('laporan_keuangan_list', FINANCE_COLUMNS);

  // Fetch providers and bidders list on mount
  useEffect(() => {
    apiFetch('/admin/users?role=provider&per_page=200')
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setProviders(data.data || []);
      })
      .catch(() => {});

    apiFetch('/admin/users?role=bidder&per_page=200')
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setBidders(data.data || []);
      })
      .catch(() => {});
  }, []);

  const fetchFinanceData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ per_page: '500' });
      if (providerFilter) params.append('provider_id', providerFilter);
      if (bidderFilter) params.append('winner_id', bidderFilter);
      if (fromDate) params.append('from', fromDate);
      if (toDate) params.append('to', toDate);

      const response = await apiFetch(`/payments/settlements?${params.toString()}`);
      const data = await response.json();
      if (response.ok && data.success) {
        setItems(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch settlements', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinanceData();
  }, [providerFilter, bidderFilter, fromDate, toDate]);

  /**
   * Biaya administrasi yang BENAR-BENAR ditagihkan ke pemenang, dibaca dari
   * tagihannya lewat API pencairan.
   *
   * Sebelumnya halaman ini memakai tabel tarif yang dipatok mati di sini
   * (Rp 3.500.000 sampai Rp 200 juta, dan seterusnya). Tabel itu tidak pernah
   * membaca 'admin_fee_tiers' di Pengaturan Platform maupun angka yang
   * tersimpan di tagihan — jadi laporan keuangan menampilkan angka karangan
   * yang tidak ada hubungannya dengan uang yang sungguh-sungguh masuk.
   */
  const getBidderAdminFee = (item: any) => Number(item.admin_fee || 0);

  const filtered = items.filter((item) => {
    // Settlement forfeiture (setengah NIPL hangus, lihat createForfeitureSettlement
    // di payments.service.ts) tidak punya GMV/fee lelang/pajak sama sekali — kalau
    // ikut masuk sini, semua kolom itu tampil 0 walau baris punya net_amount.
    // Laporan ini soal penjualan lot, jadi baris forfeiture tidak relevan di sini.
    if (item.is_forfeiture) return false;

    const unitTitle = item.lot?.asset?.title || '';
    const policeNum = item.lot?.asset?.police_number || '';
    const sessionTitle = item.lot?.session?.title || '';
    const feeAdmin = getBidderAdminFee(item);
    const feeLelang = item.commission_deducted;

    if (searchUnit && !unitTitle.toLowerCase().includes(searchUnit.toLowerCase()) && !policeNum.toLowerCase().includes(searchUnit.toLowerCase()) && !sessionTitle.toLowerCase().includes(searchUnit.toLowerCase())) return false;
    if (feeAdminFilter && feeAdmin < Number(feeAdminFilter)) return false;
    if (feeLelangFilter && feeLelang < Number(feeLelangFilter)) return false;
    return true;
  });

  const formatPrice = (v: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(v);

  const handleExport = () => {
    if (filtered.length === 0) {
      toast.error('Tidak ada data keuangan untuk diexport');
      return;
    }

    const dataToExport = filtered.map((item) => {
      const dpp = Number(item.fee_dpp) || 0;
      const dppLain = Number(item.fee_dpp_lain) || 0;
      const ppn = item.fee_ppn || 0;
      const pph23 = item.fee_pph23 || 0;
      const feeAdmin = getBidderAdminFee(item);
      // PMK 41 hanya berupa potongan dari pencairan provider kalau PROVIDER
      // yang menanggung (lihat provider/settlement/page.tsx) — kalau pemenang
      // yang menanggung, sudah lunas lewat tagihan pemenang dan tidak
      // memotong pencairan provider, jadi tidak dihitung di sini.
      const pmk41 = Number(item.pmk41_amount) || 0;
      // H = E + G: total tagihan fee lelang sebelum dipotong PPh 23.
      const totalInvoiceFeeLelang = dpp + ppn;

      const row: Record<string, any> = {};
      if (isVisible('lot')) row['No. Lot'] = item.lot?.lot_number ? `#${item.lot.lot_number}` : '-';
      if (isVisible('sesi')) row['Nama Sesi Lelang'] = item.lot?.session?.title || '-';
      if (isVisible('tanggal_sesi')) row['Tanggal Sesi'] = item.lot?.session?.scheduled_at ? new Date(item.lot.session.scheduled_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';
      if (isVisible('no_polisi')) row['No. Polisi'] = item.lot?.asset?.police_number || '-';
      if (isVisible('unit_aset')) row['Unit Aset'] = item.lot?.asset?.title ? `${item.lot.asset.title} (${item.lot.asset.year || '-'})` : '-';
      if (isVisible('gmv')) row['Harga Terbentuk (GMV)'] = item.gross_amount || 0;
      if (isVisible('pmk41')) row['PPN Pemenang (PMK 41)'] = pmk41;
      if (isVisible('fee_admin')) row['Pemasukan Fee Admin'] = feeAdmin;
      if (isVisible('fee_lelang')) row['Pemasukan Fee Lelang'] = item.commission_deducted || 0;
      if (isVisible('dpp')) row['DPP'] = dpp;
      if (isVisible('dpp_lain')) row['DPP Nilai Lain'] = dppLain;
      if (isVisible('ppn')) row['PPN'] = ppn;
      if (isVisible('total_invoice_fee_lelang')) row['Total Invoice Fee Lelang'] = totalInvoiceFeeLelang;
      if (isVisible('pph23')) row['PPH 23 (2%)'] = pph23;
      if (isVisible('total_penerimaan')) row['Total Penerimaan Indo Lelang'] = item.commission_deducted || 0;
      if (isVisible('pembayaran_provider')) row['Pembayaran ke Provider'] = item.net_amount || 0;
      if (isVisible('provider')) row['Provider'] = item.provider?.company_name || item.provider?.full_name || '-';
      if (isVisible('pemenang')) row['Pemenang'] = item.winner?.full_name || '-';
      if (isVisible('rekening')) row['Rekening Tujuan'] = item.provider?.bank_account_no || '-';
      return row;
    });

    const success = exportToExcel(dataToExport, 'Laporan_Keuangan_IndoLelang', 'Laporan Keuangan');
    if (success) {
      toast.success('Laporan Keuangan berhasil diexport ke Excel');
    } else {
      toast.error('Gagal meng-export data');
    }
  };

  return (
    <DashboardLayout breadcrumbParent="Laporan" breadcrumbCurrent="Laporan Keuangan">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 className="page-title">Laporan Keuangan Balai Lelang</h1>
          <p className="page-subtitle">Rekapitulasi biaya administrasi, fee lelang, pajak, dan nominal pencairan hasil lelang real-time.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={handleExport}
            className="btn btn-primary btn-sm"
          >
            📥 Export Excel
          </button>
          <ColumnPicker
            columns={FINANCE_COLUMNS}
            visibleKeys={visibleKeys}
            onChange={setVisibleKeys}
            tableId="laporan_keuangan_list"
          />
        </div>
      </div>

      {/* Filter Card */}
      <Card className="mb-2">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'end' }}>
          <div>
            <label className="form-label font-semibold text-xs text-slate-500">Cari Unit / Sesi / No. Polisi</label>
            <input
              type="text"
              className="search-box"
              placeholder="Masukkan unit/sesi..."
              value={searchUnit}
              onChange={(e) => setSearchUnit(e.target.value)}
              style={{ width: '100%', height: '36px', padding: '0 0.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--wf-border)' }}
            />
          </div>

          <div>
            <label className="form-label font-semibold text-xs text-slate-500">Provider</label>
            <select
              className="form-select"
              value={providerFilter}
              onChange={(e) => setProviderFilter(e.target.value)}
              style={{ width: '100%', height: '36px', padding: '0 0.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--wf-border)', background: 'white' }}
            >
              <option value="">Semua Provider</option>
              {providers.map((p) => (
                <option key={p.id} value={p.id}>{p.company_name || p.full_name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label font-semibold text-xs text-slate-500">Pemenang (Bidder)</label>
            <select
              className="form-select"
              value={bidderFilter}
              onChange={(e) => setBidderFilter(e.target.value)}
              style={{ width: '100%', height: '36px', padding: '0 0.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--wf-border)', background: 'white' }}
            >
              <option value="">Semua Pemenang</option>
              {bidders.map((b) => (
                <option key={b.id} value={b.id}>{b.full_name} ({b.email})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label font-semibold text-xs text-slate-500">Dari Tanggal</label>
            <input
              type="date"
              className="search-box"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              style={{ width: '100%', height: '36px', padding: '0 0.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--wf-border)' }}
            />
          </div>

          <div>
            <label className="form-label font-semibold text-xs text-slate-500">Sampai Tanggal</label>
            <input
              type="date"
              className="search-box"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              style={{ width: '100%', height: '36px', padding: '0 0.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--wf-border)' }}
            />
          </div>

          <div>
            <label className="form-label font-semibold text-xs text-slate-500">Minimal Fee Admin (Rp)</label>
            <input
              type="number"
              className="search-box"
              placeholder="Contoh: 3600000"
              value={feeAdminFilter}
              onChange={(e) => setFeeAdminFilter(e.target.value)}
              style={{ width: '100%', height: '36px', padding: '0 0.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--wf-border)' }}
            />
          </div>

          <div>
            <label className="form-label font-semibold text-xs text-slate-500">Minimal Fee Lelang (Rp)</label>
            <input
              type="number"
              className="search-box"
              placeholder="Contoh: 1000000"
              value={feeLelangFilter}
              onChange={(e) => setFeeLelangFilter(e.target.value)}
              style={{ width: '100%', height: '36px', padding: '0 0.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--wf-border)' }}
            />
          </div>

          {(searchUnit || providerFilter || bidderFilter || fromDate || toDate || feeAdminFilter || feeLelangFilter) && (
            <div>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => {
                  setSearchUnit('');
                  setProviderFilter('');
                  setBidderFilter('');
                  setFromDate('');
                  setToDate('');
                  setFeeAdminFilter('');
                  setFeeLelangFilter('');
                }}
                style={{ width: '100%', height: '36px' }}
              >
                Reset Filter
              </button>
            </div>
          )}
        </div>
      </Card>

      <Card>
        <div className="table-wrapper" style={{ overflowX: 'auto' }}>
          <table className="text-xs" style={{ width: '100%', minWidth: '1200px' }}>
            <thead>
              <tr>
                {isVisible('lot') && <th>Lot</th>}
                {isVisible('sesi') && <th>Nama Sesi Lelang</th>}
                {isVisible('tanggal_sesi') && <th>Tanggal Sesi</th>}
                {isVisible('no_polisi') && <th>No. Polisi</th>}
                {isVisible('unit_aset') && <th>Unit Aset</th>}
                {isVisible('gmv') && <th>Harga Terbentuk (GMV)</th>}
                {isVisible('pmk41') && <th>PPN Pemenang (PMK 41)</th>}
                {isVisible('fee_admin') && <th>Pemasukan Fee Admin</th>}
                {isVisible('fee_lelang') && <th>Pemasukan Fee Lelang</th>}
                {isVisible('dpp') && <th>DPP</th>}
                {isVisible('dpp_lain') && <th>DPP Nilai Lain</th>}
                {isVisible('ppn') && <th>PPN</th>}
                {isVisible('total_invoice_fee_lelang') && <th>Total Invoice Fee Lelang</th>}
                {isVisible('pph23') && <th>PPH 23 (2%)</th>}
                {isVisible('total_penerimaan') && <th>Total Penerimaan Indo Lelang</th>}
                {isVisible('pembayaran_provider') && <th>Pembayaran ke Provider</th>}
                {isVisible('provider') && <th>Provider</th>}
                {isVisible('pemenang') && <th>Pemenang</th>}
                {isVisible('rekening') && <th>Rekening Tujuan</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={visibleKeys.length} className="text-center py-8">Memuat laporan keuangan...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={visibleKeys.length} className="text-center text-muted py-8">Tidak ada data keuangan ditemukan.</td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const dpp = Number(item.fee_dpp) || 0;
                  const dppLain = Number(item.fee_dpp_lain) || 0;
                  const ppn = item.fee_ppn || 0;
                  const pph23 = item.fee_pph23 || 0;
                  const feeAdmin = getBidderAdminFee(item);
                  // PMK 41 hanya berupa potongan dari pencairan provider kalau
                  // PROVIDER yang menanggung (lihat provider/settlement/page.tsx)
                  // — kalau pemenang yang menanggung, sudah lunas lewat tagihan
                  // pemenang dan tidak memotong pencairan provider.
                  const pmk41 = Number(item.pmk41_amount) || 0;
                  // H = E + G: total tagihan fee lelang sebelum dipotong PPh 23.
                  const totalInvoiceFeeLelang = dpp + ppn;

                  return (
                    <tr key={item.id}>
                      {isVisible('lot') && <td><strong>#{item.lot?.lot_number || '-'}</strong></td>}
                      {isVisible('sesi') && <td><strong>{item.lot?.session?.title || '-'}</strong></td>}
                      {isVisible('tanggal_sesi') && <td>{item.lot?.session?.scheduled_at ? new Date(item.lot.session.scheduled_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}</td>}
                      {isVisible('no_polisi') && <td><span className="badge-ui secondary" style={{ fontWeight: 600 }}>{item.lot?.asset?.police_number || '-'}</span></td>}
                      {isVisible('unit_aset') && <td><strong>{item.lot?.asset?.title || '-'}</strong> ({item.lot?.asset?.year || '-'})</td>}
                      {isVisible('gmv') && <td style={{ fontWeight: '600' }}>{formatPrice(item.gross_amount)}</td>}
                      {isVisible('pmk41') && <td className={pmk41 > 0 ? 'text-danger' : ''}>{pmk41 > 0 ? `-${formatPrice(pmk41)}` : formatPrice(0)}</td>}
                      {isVisible('fee_admin') && <td className="text-success" style={{ fontWeight: '600' }}>{formatPrice(feeAdmin)}</td>}
                      {isVisible('fee_lelang') && <td className="text-success" style={{ fontWeight: '600' }}>{formatPrice(item.commission_deducted)}</td>}
                      {isVisible('dpp') && <td>{formatPrice(dpp)}</td>}
                      {isVisible('dpp_lain') && <td>{formatPrice(dppLain)}</td>}
                      {isVisible('ppn') && <td>{formatPrice(ppn)}</td>}
                      {isVisible('total_invoice_fee_lelang') && <td>{formatPrice(totalInvoiceFeeLelang)}</td>}
                      {isVisible('pph23') && <td>{formatPrice(pph23)}</td>}
                      {isVisible('total_penerimaan') && <td>{formatPrice(item.commission_deducted)}</td>}
                      {isVisible('pembayaran_provider') && <td className="font-bold text-slate-800" style={{ fontSize: '0.85rem' }}>{formatPrice(item.net_amount)}</td>}
                      {isVisible('provider') && <td><strong>{item.provider?.company_name || item.provider?.full_name || '-'}</strong></td>}
                      {isVisible('pemenang') && (
                        <td>
                          {item.winner ? (
                            <>
                              <strong>{item.winner.full_name}</strong>
                              <div className="text-muted" style={{ fontSize: '0.7rem' }}>{item.winner.email}</div>
                            </>
                          ) : '-'}
                        </td>
                      )}
                      {isVisible('rekening') && <td>{item.provider?.bank_account_no || '-'}</td>}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </DashboardLayout>
  );
}
