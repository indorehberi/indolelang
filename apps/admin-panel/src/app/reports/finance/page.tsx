'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import Card from '../../../components/ui/Card';
import { apiFetch } from '../../../lib/api';
import { useToast } from '../../../providers/ToastProvider';
import { exportToExcel } from '../../../lib/excelExport';

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

      return {
        'No. Lot': item.lot?.lot_number ? `#${item.lot.lot_number}` : '-',
        'Nama Sesi Lelang': item.lot?.session?.title || '-',
        'Tanggal Sesi': item.lot?.session?.scheduled_at ? new Date(item.lot.session.scheduled_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-',
        'No. Polisi': item.lot?.asset?.police_number || '-',
        'Unit Aset': item.lot?.asset?.title ? `${item.lot.asset.title} (${item.lot.asset.year || '-'})` : '-',
        'Harga Terbentuk (GMV)': item.gross_amount || 0,
        'PPN Pemenang (PMK 41)': pmk41,
        'Pemasukan Fee Admin': feeAdmin,
        'Pemasukan Fee Lelang': item.commission_deducted || 0,
        'DPP': dpp,
        'DPP Nilai Lain': dppLain,
        'PPN': ppn,
        'Total Invoice Fee Lelang': totalInvoiceFeeLelang,
        'PPH 23 (2%)': pph23,
        'Total Penerimaan Indo Lelang': item.commission_deducted || 0,
        'Pembayaran ke Provider': item.net_amount || 0,
        'Provider': item.provider?.company_name || item.provider?.full_name || '-',
        'Pemenang': item.winner?.full_name || '-',
        'Rekening Tujuan': item.provider?.bank_account_no || '-',
      };
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
        <button
          onClick={handleExport}
          className="btn btn-primary btn-sm"
        >
          📥 Export Excel
        </button>
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
                <th>Lot</th>
                <th>Nama Sesi Lelang</th>
                <th>Tanggal Sesi</th>
                <th>No. Polisi</th>
                <th>Unit Aset</th>
                <th>Harga Terbentuk (GMV)</th>
                <th>PPN Pemenang (PMK 41)</th>
                <th>Pemasukan Fee Admin</th>
                <th>Pemasukan Fee Lelang</th>
                <th>DPP</th>
                <th>DPP Nilai Lain</th>
                <th>PPN</th>
                <th>Total Invoice Fee Lelang</th>
                <th>PPH 23 (2%)</th>
                <th>Total Penerimaan Indo Lelang</th>
                <th>Pembayaran ke Provider</th>
                <th>Provider</th>
                <th>Pemenang</th>
                <th>Rekening Tujuan</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={19} className="text-center py-8">Memuat laporan keuangan...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={19} className="text-center text-muted py-8">Tidak ada data keuangan ditemukan.</td>
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
                      <td><strong>#{item.lot?.lot_number || '-'}</strong></td>
                      <td><strong>{item.lot?.session?.title || '-'}</strong></td>
                      <td>{item.lot?.session?.scheduled_at ? new Date(item.lot.session.scheduled_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}</td>
                      <td><span className="badge-ui secondary" style={{ fontWeight: 600 }}>{item.lot?.asset?.police_number || '-'}</span></td>
                      <td><strong>{item.lot?.asset?.title || '-'}</strong> ({item.lot?.asset?.year || '-'})</td>
                      <td style={{ fontWeight: '600' }}>{formatPrice(item.gross_amount)}</td>
                      <td className={pmk41 > 0 ? 'text-danger' : ''}>{pmk41 > 0 ? `-${formatPrice(pmk41)}` : formatPrice(0)}</td>
                      <td className="text-success" style={{ fontWeight: '600' }}>{formatPrice(feeAdmin)}</td>
                      <td className="text-success" style={{ fontWeight: '600' }}>{formatPrice(item.commission_deducted)}</td>
                      <td>{formatPrice(dpp)}</td>
                      <td>{formatPrice(dppLain)}</td>
                      <td>{formatPrice(ppn)}</td>
                      <td>{formatPrice(totalInvoiceFeeLelang)}</td>
                      <td>{formatPrice(pph23)}</td>
                      <td>{formatPrice(item.commission_deducted)}</td>
                      <td className="font-bold text-slate-800" style={{ fontSize: '0.85rem' }}>{formatPrice(item.net_amount)}</td>
                      <td><strong>{item.provider?.company_name || item.provider?.full_name || '-'}</strong></td>
                      <td>
                        {item.winner ? (
                          <>
                            <strong>{item.winner.full_name}</strong>
                            <div className="text-muted" style={{ fontSize: '0.7rem' }}>{item.winner.email}</div>
                          </>
                        ) : '-'}
                      </td>
                      <td>{item.provider?.bank_account_no || '-'}</td>
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
