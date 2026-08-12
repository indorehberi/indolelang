'use client';

import React, { useEffect, useState, useCallback } from 'react';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import { apiFetch } from '../../../lib/api';
import { exportToExcel } from '../../../lib/excelExport';
import { useToast } from '../../../providers/ToastProvider';

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

  const handleExport = () => {
    if (rows.length === 0) {
      toast.error('Tidak ada data untuk diexport');
      return;
    }
    const dataToExport = rows.map((item, idx) => ({
      'No': idx + 1,
      'Sesi Lelang': item.lot?.session?.title || '-',
      'Tanggal Lelang': formatDate(item.lot?.session?.scheduled_at),
      'Nama Unit': item.lot?.asset?.title || '-',
      'No Polisi': item.lot?.asset?.police_number || '-',
      'Provider': item.provider?.company_name || item.provider?.full_name || '-',
      'Harga Terbentuk': item.gross_amount,
      'Potongan Fee Lelang': item.commission_deducted,
      'Potongan PMK 41': item.pmk41_amount || 0,
      'Total Pembayaran ke Provider': item.net_amount,
      'Status': item.status === 'processed' ? 'Sudah Ditransfer' : 'Siap Transfer',
      'Pemenang': item.winner?.full_name || '-',
      'No Rek': item.provider?.bank_account_no || '-',
      'Nama Rekening': item.provider?.bank_account_name || '-',
    }));
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
        <div className="toolbar-right">
          <button className="btn btn-primary btn-sm" onClick={handleExport}>
            📥 Export Excel
          </button>
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
                <th style={{ width: '40px' }}>No</th>
                <th>Sesi Lelang</th>
                <th>Tanggal Lelang</th>
                <th>Nama Unit</th>
                <th>No Polisi</th>
                <th>Provider</th>
                <th>Harga Terbentuk</th>
                <th>Total Pembayaran ke Provider</th>
                <th>Status</th>
                <th>Pemenang</th>
                <th>No Rek</th>
                <th>Nama Rekening</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={12} className="text-center" style={{ padding: '2rem' }}>Memuat data pencairan...</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={12} className="text-center text-muted" style={{ padding: '2rem' }}>
                  Tidak ada data pencairan ditemukan{providerFilter || fromDate || toDate ? ' untuk filter yang dipilih.' : '.'}
                </td></tr>
              ) : (
                rows.map((row, idx) => (
                  <tr key={row.id}>
                    <td style={{ textAlign: 'center', color: '#94a3b8', fontWeight: 600 }}>{idx + 1}</td>
                    <td>
                      <strong>{row.lot?.session?.title || '-'}</strong>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {formatDate(row.lot?.session?.scheduled_at)}
                    </td>
                    <td>
                      <strong>{row.lot?.asset?.title || '-'}</strong>
                      {row.lot?.asset?.year && (
                        <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>{row.lot.asset.year}</div>
                      )}
                    </td>
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
                    <td>
                      <strong>{row.provider?.company_name || row.provider?.full_name || '-'}</strong>
                    </td>
                    <td style={{ fontWeight: 600, color: '#1e40af' }}>
                      {formatRupiah(row.gross_amount)}
                    </td>
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
                    <td>
                      {row.status === 'processed' ? (
                        <Badge variant="success">Sudah Ditransfer</Badge>
                      ) : (
                        <Badge variant="warning">Siap Transfer</Badge>
                      )}
                    </td>
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
                    <td style={{ fontFamily: 'monospace' }}>
                      {row.provider?.bank_account_no || '-'}
                    </td>
                    <td>
                      {row.provider?.bank_account_name || '-'}
                      {row.provider?.bank_name && (
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{row.provider.bank_name}</div>
                      )}
                    </td>
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
