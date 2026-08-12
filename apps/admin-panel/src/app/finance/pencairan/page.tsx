'use client';

import React, { useEffect, useState, useCallback } from 'react';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import Card from '../../../components/ui/Card';
import { apiFetch } from '../../../lib/api';
import { exportToExcel } from '../../../lib/excelExport';
import { useToast } from '../../../providers/ToastProvider';
import ColumnPicker, { useColumnVisibility, ColumnOption } from '../../../components/ui/ColumnPicker';

const PENCAIRAN_COLUMNS: ColumnOption[] = [
  { key: 'no', label: 'No', alwaysVisible: true },
  { key: 'sesi', label: 'Sesi Lelang', defaultVisible: true },
  { key: 'tanggal', label: 'Tanggal Lelang', defaultVisible: true },
  { key: 'unit', label: 'Nama Unit', defaultVisible: true },
  { key: 'no_polisi', label: 'No Polisi', defaultVisible: true },
  { key: 'provider', label: 'Provider', defaultVisible: true },
  { key: 'gmv', label: 'Harga Terbentuk', defaultVisible: true },
  { key: 'pembayaran', label: 'Total Pembayaran ke Provider', alwaysVisible: true },
  { key: 'status', label: 'Status', alwaysVisible: true },
  { key: 'pemenang', label: 'Pemenang', defaultVisible: true },
  { key: 'no_rek', label: 'No Rek', defaultVisible: true },
  { key: 'nama_rek', label: 'Nama Rekening', defaultVisible: true },
];

interface ProviderOption {
  id: string;
  full_name: string;
  company_name?: string;
}

interface DisbursementRow {
  id: string;
  gross_amount: number;
  commission_deducted: number;
  net_amount: number;
  pmk41_amount: number;
  status: string;
  created_at: string;
  transferred_at?: string;
  is_forfeiture?: boolean;
  provider?: {
    full_name: string;
    company_name?: string;
    bank_name?: string;
    bank_account_no?: string;
    bank_account_name?: string;
  };
  lot?: {
    lot_number?: number;
    asset?: {
      title: string;
      police_number?: string;
      year?: string;
    };
    session?: {
      title: string;
      scheduled_at?: string;
    };
  };
  winner?: {
    id: string;
    full_name: string;
    email: string;
  } | null;
}

export default function PencairanPage() {
  const toast = useToast();
  const [rows, setRows] = useState<DisbursementRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [providers, setProviders] = useState<ProviderOption[]>([]);
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());
  const { visibleKeys, setVisibleKeys, isVisible } = useColumnVisibility('pencairan_list', PENCAIRAN_COLUMNS);

  // Filters
  const [providerFilter, setProviderFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const formatRupiah = (v: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v);

  const formatDate = (iso?: string) => {
    if (!iso) return '-';
    return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ per_page: '500' });
      if (providerFilter) params.set('provider_id', providerFilter);
      if (fromDate) params.set('from', fromDate);
      if (toDate) params.set('to', toDate);

      const res = await apiFetch(`/payments/settlements?${params.toString()}`);
      const data = await res.json();
      if (res.ok && data.success) {
        // Tampilkan settlement normal (bukan forfeiture) yang berstatus pending atau processed
        const settled: DisbursementRow[] = (data.data || []).filter(
          (r: DisbursementRow) => !r.is_forfeiture && (r.status === 'pending' || r.status === 'processed')
        );
        setRows(settled);
      } else {
        setRows([]);
      }
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [providerFilter, fromDate, toDate]);

  // Fetch providers list for filter dropdown
  useEffect(() => {
    apiFetch('/admin/users?role=provider&per_page=200')
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setProviders(data.data.map((u: any) => ({
            id: u.id,
            full_name: u.full_name,
            company_name: u.company_name,
          })));
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  const handleToggleStatus = async (row: DisbursementRow) => {
    const isProcessed = row.status === 'processed';
    const confirmMsg = isProcessed
      ? `Kembalikan status ke "Siap Ditransfer"?\nIni akan membatalkan tanda sudah transfer untuk unit ${row.lot?.asset?.title || ''}.`
      : `Tandai sebagai "Sudah Ditransfer"?\nIni akan memproses pencairan ke provider ${row.provider?.company_name || row.provider?.full_name || ''}.`;

    if (!confirm(confirmMsg)) return;

    setTogglingIds((prev) => new Set(prev).add(row.id));
    try {
      const endpoint = isProcessed
        ? `/payments/settlements/${row.id}/revert`
        : `/payments/settlements/${row.id}/disburse`;
      const res = await apiFetch(endpoint, { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(isProcessed ? 'Status dikembalikan ke Siap Ditransfer' : 'Berhasil ditandai Sudah Ditransfer');
        // Update row status locally (optimistic)
        setRows((prev) =>
          prev.map((r) =>
            r.id === row.id
              ? { ...r, status: isProcessed ? 'pending' : 'processed' }
              : r
          )
        );
      } else {
        toast.error(data.error?.message || 'Gagal mengubah status');
      }
    } catch {
      toast.error('Terjadi kesalahan koneksi');
    } finally {
      setTogglingIds((prev) => {
        const next = new Set(prev);
        next.delete(row.id);
        return next;
      });
    }
  };

  const handleExport = () => {
    if (rows.length === 0) {
      toast.error('Tidak ada data untuk diexport');
      return;
    }
    const dataToExport = rows.map((item, idx) => {
      const row: Record<string, any> = {};
      if (isVisible('no')) row['No'] = idx + 1;
      if (isVisible('sesi')) row['Sesi Lelang'] = item.lot?.session?.title || '-';
      if (isVisible('tanggal')) row['Tanggal Lelang'] = formatDate(item.lot?.session?.scheduled_at);
      if (isVisible('unit')) row['Nama Unit'] = item.lot?.asset?.title || '-';
      if (isVisible('no_polisi')) row['No Polisi'] = item.lot?.asset?.police_number || '-';
      if (isVisible('provider')) row['Provider'] = item.provider?.company_name || item.provider?.full_name || '-';
      if (isVisible('gmv')) row['Harga Terbentuk'] = item.gross_amount;
      if (isVisible('pembayaran')) {
        row['Potongan Fee Lelang'] = item.commission_deducted;
        row['Potongan PMK 41'] = item.pmk41_amount || 0;
        row['Total Pembayaran ke Provider'] = item.net_amount;
      }
      if (isVisible('status')) row['Status'] = item.status === 'processed' ? 'Sudah Ditransfer' : 'Siap Transfer';
      if (isVisible('pemenang')) row['Pemenang'] = item.winner?.full_name || '-';
      if (isVisible('no_rek')) row['No Rek'] = item.provider?.bank_account_no || '-';
      if (isVisible('nama_rek')) row['Nama Rekening'] = item.provider?.bank_account_name || '-';
      return row;
    });
    const ok = exportToExcel(dataToExport, 'Pencairan_IndoLelang', 'Pencairan');
    if (ok) toast.success('Data pencairan berhasil diexport');
    else toast.error('Gagal export data');
  };

  // Summary stats
  const totalPencairan = rows.reduce((s, r) => s + r.net_amount, 0);
  const totalUnit = rows.length;
  const totalHargaTerbentuk = rows.reduce((s, r) => s + r.gross_amount, 0);

  return (
    <DashboardLayout breadcrumbParent="Keuangan" breadcrumbCurrent="Pencairan">
      <div className="toolbar">
        <div className="toolbar-left">
          <h1 className="page-title">Pencairan Provider</h1>
          <p className="page-subtitle">
            Daftar unit yang telah dilunasi oleh pemenang lelang dan siap/sudah dicairkan ke provider.
          </p>
        </div>
        <div className="toolbar-right" style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-primary btn-sm" onClick={handleExport}>
            📥 Export Excel
          </button>
          <ColumnPicker
            columns={PENCAIRAN_COLUMNS}
            visibleKeys={visibleKeys}
            onChange={setVisibleKeys}
            tableId="pencairan_list"
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
        <div style={{ background: 'white', border: '1px solid var(--wf-border)', borderRadius: '10px', padding: '1rem 1.25rem' }}>
          <div style={{ fontSize: '0.78rem', color: '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Unit Lunas</div>
          <div style={{ fontSize: '1.7rem', fontWeight: 800, color: '#059669' }}>{totalUnit}</div>
          <div style={{ fontSize: '0.78rem', color: '#888' }}>unit sudah dicairkan</div>
        </div>
        <div style={{ background: 'white', border: '1px solid var(--wf-border)', borderRadius: '10px', padding: '1rem 1.25rem' }}>
          <div style={{ fontSize: '0.78rem', color: '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Harga Terbentuk</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e40af' }}>{formatRupiah(totalHargaTerbentuk)}</div>
          <div style={{ fontSize: '0.78rem', color: '#888' }}>nilai transaksi</div>
        </div>
        <div style={{ background: 'white', border: '1px solid var(--wf-border)', borderRadius: '10px', padding: '1rem 1.25rem' }}>
          <div style={{ fontSize: '0.78rem', color: '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Pembayaran ke Provider</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#059669' }}>{formatRupiah(totalPencairan)}</div>
          <div style={{ fontSize: '0.78rem', color: '#888' }}>net ke provider</div>
        </div>
      </div>

      {/* Filter */}
      <Card className="mb-2">
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div>
            <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Provider</label>
            <select
              className="form-select"
              value={providerFilter}
              onChange={e => setProviderFilter(e.target.value)}
              style={{ width: '220px', height: '36px', padding: '0 0.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--wf-border)', background: 'white' }}
            >
              <option value="">Semua Provider</option>
              {providers.map(p => (
                <option key={p.id} value={p.id}>{p.company_name || p.full_name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Dari Tanggal</label>
            <input
              type="date"
              className="form-input"
              value={fromDate}
              onChange={e => setFromDate(e.target.value)}
              style={{ height: '36px', padding: '0 0.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--wf-border)' }}
            />
          </div>

          <div>
            <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Sampai Tanggal</label>
            <input
              type="date"
              className="form-input"
              value={toDate}
              onChange={e => setToDate(e.target.value)}
              style={{ height: '36px', padding: '0 0.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--wf-border)' }}
            />
          </div>

          {(providerFilter || fromDate || toDate) && (
            <button
              className="btn btn-outline btn-sm"
              onClick={() => { setProviderFilter(''); setFromDate(''); setToDate(''); }}
              style={{ height: '36px', alignSelf: 'flex-end' }}
            >
              Reset Filter
            </button>
          )}
        </div>
      </Card>

      {/* Table */}
      <Card>
        <div className="table-wrapper" style={{ overflowX: 'auto' }}>
          <table className="text-xs" style={{ width: '100%', minWidth: '1100px' }}>
            <thead>
              <tr>
                {isVisible('no') && <th style={{ width: '40px' }}>No</th>}
                {isVisible('sesi') && <th>Sesi Lelang</th>}
                {isVisible('tanggal') && <th>Tanggal Lelang</th>}
                {isVisible('unit') && <th>Nama Unit</th>}
                {isVisible('no_polisi') && <th>No Polisi</th>}
                {isVisible('provider') && <th>Provider</th>}
                {isVisible('gmv') && <th>Harga Terbentuk</th>}
                {isVisible('pembayaran') && <th>Total Pembayaran ke Provider</th>}
                {isVisible('status') && <th>Status</th>}
                {isVisible('pemenang') && <th>Pemenang</th>}
                {isVisible('no_rek') && <th>No Rek</th>}
                {isVisible('nama_rek') && <th>Nama Rekening</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={visibleKeys.length} className="text-center" style={{ padding: '2rem' }}>Memuat data pencairan...</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={visibleKeys.length} className="text-center text-muted" style={{ padding: '2rem' }}>
                  Tidak ada data pencairan ditemukan{providerFilter || fromDate || toDate ? ' untuk filter yang dipilih.' : '.'}
                </td></tr>
              ) : (
                rows.map((row, idx) => (
                  <tr key={row.id}>
                    {isVisible('no') && <td style={{ textAlign: 'center', color: '#94a3b8', fontWeight: 600 }}>{idx + 1}</td>}
                    {isVisible('sesi') && (
                      <td>
                        <strong>{row.lot?.session?.title || '-'}</strong>
                      </td>
                    )}
                    {isVisible('tanggal') && (
                      <td style={{ whiteSpace: 'nowrap' }}>
                        {formatDate(row.lot?.session?.scheduled_at)}
                      </td>
                    )}
                    {isVisible('unit') && (
                      <td>
                        <strong>{row.lot?.asset?.title || '-'}</strong>
                        {row.lot?.asset?.year && (
                          <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>{row.lot.asset.year}</div>
                        )}
                      </td>
                    )}
                    {isVisible('no_polisi') && (
                      <td>
                        {row.lot?.asset?.police_number ? (
                          <span style={{
                            display: 'inline-block', background: '#f1f5f9', border: '1px solid #cbd5e1',
                            borderRadius: '4px', padding: '1px 6px', fontFamily: 'monospace', fontWeight: 700, fontSize: '0.8rem'
                          }}>
                            {row.lot.asset.police_number}
                          </span>
                        ) : '-'}
                      </td>
                    )}
                    {isVisible('provider') && (
                      <td>
                        <strong>{row.provider?.company_name || row.provider?.full_name || '-'}</strong>
                      </td>
                    )}
                    {isVisible('gmv') && (
                      <td style={{ fontWeight: 600, color: '#1e40af' }}>
                        {formatRupiah(row.gross_amount)}
                      </td>
                    )}
                    {isVisible('pembayaran') && (
                      <td style={{ fontWeight: 700, color: '#059669' }}>
                        {formatRupiah(row.net_amount)}
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 400 }}>
                          Potongan Fee Lelang: {formatRupiah(row.commission_deducted)}
                        </div>
                        {/* PMK 41 hanya memotong pencairan kalau PROVIDER yang
                            menanggung — lihat provider/settlement/page.tsx */}
                        {Number(row.pmk41_amount) > 0 && (
                          <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 400 }}>
                            Potongan PMK 41: {formatRupiah(row.pmk41_amount)}
                          </div>
                        )}
                      </td>
                    )}
                    {isVisible('status') && (
                      <td>
                        <button
                          onClick={() => handleToggleStatus(row)}
                          disabled={togglingIds.has(row.id)}
                          title={row.status === 'processed' ? 'Klik untuk kembalikan ke Siap Ditransfer' : 'Klik untuk tandai Sudah Ditransfer'}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '4px 10px',
                            borderRadius: '20px',
                            border: 'none',
                            cursor: togglingIds.has(row.id) ? 'wait' : 'pointer',
                            fontWeight: 700,
                            fontSize: '0.75rem',
                            letterSpacing: '0.02em',
                            transition: 'all 0.18s ease',
                            opacity: togglingIds.has(row.id) ? 0.65 : 1,
                            ...(row.status === 'processed'
                              ? { background: '#d1fae5', color: '#065f46' }
                              : { background: '#fef3c7', color: '#92400e' }),
                          }}
                        >
                          {togglingIds.has(row.id) ? (
                            <span>⏳</span>
                          ) : row.status === 'processed' ? (
                            <span>✅</span>
                          ) : (
                            <span>🔄</span>
                          )}
                          {togglingIds.has(row.id)
                            ? 'Memproses...'
                            : row.status === 'processed'
                            ? 'Sudah Ditransfer'
                            : 'Siap Ditransfer'}
                        </button>
                      </td>
                    )}
                    {isVisible('pemenang') && (
                      <td>
                        {row.winner ? (
                          <>
                            <strong>{row.winner.full_name}</strong>
                            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{row.winner.email}</div>
                          </>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                    )}
                    {isVisible('no_rek') && (
                      <td style={{ fontFamily: 'monospace' }}>
                        {row.provider?.bank_account_no || '-'}
                      </td>
                    )}
                    {isVisible('nama_rek') && (
                      <td>
                        {row.provider?.bank_account_name || '-'}
                        {row.provider?.bank_name && (
                          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{row.provider.bank_name}</div>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && rows.length > 0 && (
          <div style={{
            borderTop: '1px solid var(--wf-border)', padding: '0.75rem 1rem',
            display: 'flex', justifyContent: 'flex-end', gap: '2rem',
            fontSize: '0.85rem', color: '#555'
          }}>
            <span><strong>{totalUnit}</strong> unit</span>
            <span>Total Harga Terbentuk: <strong style={{ color: '#1e40af' }}>{formatRupiah(totalHargaTerbentuk)}</strong></span>
            <span>Total Pembayaran ke Provider: <strong style={{ color: '#059669' }}>{formatRupiah(totalPencairan)}</strong></span>
          </div>
        )}
      </Card>
    </DashboardLayout>
  );
}
