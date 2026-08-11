'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import { apiFetch } from '../../../lib/api';
import { useToast } from '../../../providers/ToastProvider';
import { exportToExcel } from '../../../lib/excelExport';
import ColumnPicker, { useColumnVisibility, ColumnOption } from '../../../components/ui/ColumnPicker';

type IncomeCategory = 'fee_admin_bidder' | 'fee_lelang_provider' | 'deposit_hangus' | 'deposit' | 'biaya_admin' | 'fee_lelang';

interface IncomeEntry {
  id?: string;
  date: string;
  category: IncomeCategory;
  description: string;
  amount: number;
  unique_code?: number;
}

const INCOME_COLUMNS: ColumnOption[] = [
  { key: 'no', label: 'No', alwaysVisible: true },
  { key: 'date', label: 'Tanggal', defaultVisible: true },
  { key: 'category', label: 'Jenis Pemasukan', defaultVisible: true },
  { key: 'description', label: 'Catatan Rincian & Kode Unik', defaultVisible: true },
  { key: 'amount', label: 'Jumlah (Rp)', alwaysVisible: true },
];

const CATEGORY_LABEL: Record<string, string> = {
  fee_admin_bidder: 'Fee Admin Bidder (Menang Lelang)',
  fee_lelang_provider: 'Fee Lelang Provider',
  deposit_hangus: 'Deposit Hangus (50% Admin + Kode Unik)',
  biaya_admin: 'Fee Admin Bidder',
  fee_lelang: 'Fee Lelang Provider',
  deposit: 'Deposit NIPL',
};

const CATEGORY_VARIANT: Record<string, 'success' | 'warning' | 'danger' | 'default'> = {
  fee_admin_bidder: 'warning',
  fee_lelang_provider: 'success',
  deposit_hangus: 'danger',
  biaya_admin: 'warning',
  fee_lelang: 'success',
  deposit: 'default',
};

const formatRupiah = (value: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value);

const MONTH_OPTIONS = [
  { value: '', label: 'Semua Bulan' },
  { value: '1', label: 'Januari' },
  { value: '2', label: 'Februari' },
  { value: '3', label: 'Maret' },
  { value: '4', label: 'April' },
  { value: '5', label: 'Mei' },
  { value: '6', label: 'Juni' },
  { value: '7', label: 'Juli' },
  { value: '8', label: 'Agustus' },
  { value: '9', label: 'September' },
  { value: '10', label: 'Oktober' },
  { value: '11', label: 'November' },
  { value: '12', label: 'Desember' },
];

export default function IncomePage() {
  const router = useRouter();
  const toast = useToast();
  const [entries, setEntries] = useState<IncomeEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [monthFilter, setMonthFilter] = useState<string>('');
  const [yearFilter, setYearFilter] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('');

  const { visibleKeys, setVisibleKeys, isVisible } = useColumnVisibility('income_ledger_list', INCOME_COLUMNS);

  const fetchIncome = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (categoryFilter) params.set('category', categoryFilter);
      if (monthFilter) params.set('month', monthFilter);
      if (yearFilter) params.set('year', yearFilter);
      if (dateFilter) {
        params.set('from', `${dateFilter}T00:00:00`);
        params.set('to', `${dateFilter}T23:59:59`);
      }

      const query = params.toString();
      const response = await apiFetch(`/payments/income${query ? `?${query}` : ''}`);
      const data = await response.json();
      if (response.ok && data.success) {
        setEntries(Array.isArray(data.data) ? data.data : []);
      } else {
        toast.error(data.error?.message || 'Gagal memuat data pemasukan.');
      }
    } catch (err) {
      toast.error('Gagal terhubung ke server.');
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, monthFilter, yearFilter, dateFilter, toast]);

  useEffect(() => {
    fetchIncome();
  }, [fetchIncome]);

  const totalAll = entries.reduce((sum, e) => sum + Number(e.amount || 0), 0);

  const totalBy = (cat: string) =>
    entries
      .filter((e) => {
        if (cat === 'fee_admin_bidder') return e.category === 'fee_admin_bidder' || e.category === 'biaya_admin';
        if (cat === 'fee_lelang_provider') return e.category === 'fee_lelang_provider' || e.category === 'fee_lelang';
        if (cat === 'deposit_hangus') return e.category === 'deposit_hangus';
        return e.category === cat;
      })
      .reduce((sum, e) => sum + Number(e.amount || 0), 0);

  const handleExport = () => {
    const dataToExport = entries.map((entry, index) => ({
      No: index + 1,
      Tanggal: new Date(entry.date).toLocaleString('id-ID'),
      'Jenis Pemasukan': CATEGORY_LABEL[entry.category] || entry.category,
      'Rincian Catatan': entry.description,
      'Kode Unik': entry.unique_code ? `Rp ${entry.unique_code.toLocaleString('id-ID')}` : '-',
      'Jumlah (Rp)': entry.amount,
    }));
    const ok = exportToExcel(dataToExport, 'Pemasukan_Platform_IndoLelang', 'Daftar Pemasukan');
    if (ok) {
      toast.success('Berhasil mendownload laporan Excel Pemasukan (.xlsx)');
    } else {
      toast.error('Tidak ada data pemasukan untuk di-export');
    }
  };

  const currentYear = new Date().getFullYear();
  const yearOptions = [
    { value: '', label: 'Semua Tahun' },
    ...Array.from({ length: 5 }, (_, i) => ({
      value: String(currentYear - i),
      label: String(currentYear - i),
    })),
  ];

  return (
    <DashboardLayout breadcrumbParent="Keuangan" breadcrumbCurrent="Pemasukan">
      {/* Sub-nav Tabs Keuangan */}
      <div className="d-flex border-bottom mb-3" style={{ gap: '0.25rem', overflowX: 'auto' }}>
        <button
          onClick={() => router.push('/finance/deposits')}
          className="btn btn-sm btn-outline"
          style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0, whiteSpace: 'nowrap' }}
        >
          💳 Deposit Jaminan NIPL
        </button>
        <button
          onClick={() => router.push('/finance/invoices')}
          className="btn btn-sm btn-outline"
          style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0, whiteSpace: 'nowrap' }}
        >
          📄 Tagihan Pelunasan (Invoices)
        </button>
        <button
          onClick={() => router.push('/finance/settlements')}
          className="btn btn-sm btn-outline"
          style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0, whiteSpace: 'nowrap' }}
        >
          🏦 Pencairan Mitra (Settlements)
        </button>
        <button
          onClick={() => router.push('/finance/refunds')}
          className="btn btn-sm btn-outline"
          style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0, whiteSpace: 'nowrap' }}
        >
          💸 Antrean Refund NIPL
        </button>
        <button
          onClick={() => router.push('/finance/income')}
          className="btn btn-sm btn-primary"
          style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0, whiteSpace: 'nowrap' }}
        >
          💰 Pemasukan Platform
        </button>
      </div>

      <div className="toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div className="toolbar-left">
          <h1 className="page-title">Pemasukan Platform</h1>
          <p className="page-subtitle">
            Ringkasan pendapatan resmi platform dari Fee Admin Bidder, Fee Lelang Provider, dan Deposit Hangus (50% Admin + Kode Unik).
          </p>
        </div>
        <div className="toolbar-right" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            style={{ backgroundColor: '#107c41', color: '#fff', borderColor: '#107c41', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>file_download</span>
            Export XLSX
          </Button>
          <ColumnPicker
            columns={INCOME_COLUMNS}
            visibleKeys={visibleKeys}
            onChange={setVisibleKeys}
            tableId="income_ledger_list"
          />
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
        <div className="kpi-card" style={{ borderLeft: '4px solid #10b981' }}>
          <div className="kpi-label" style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600 }}>Total Pemasukan Platform</div>
          <div className="kpi-value" style={{ fontSize: '1.4rem', fontWeight: 700, color: '#10b981' }}>{formatRupiah(totalAll)}</div>
        </div>
        <div className="kpi-card gold" style={{ borderLeft: '4px solid #f59e0b' }}>
          <div className="kpi-label" style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600 }}>Fee Admin (Bidder Pemenang)</div>
          <div className="kpi-value" style={{ fontSize: '1.3rem', fontWeight: 700, color: '#d97706' }}>{formatRupiah(totalBy('fee_admin_bidder'))}</div>
        </div>
        <div className="kpi-card" style={{ borderLeft: '4px solid #3b82f6' }}>
          <div className="kpi-label" style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600 }}>Fee Lelang (Provider)</div>
          <div className="kpi-value" style={{ fontSize: '1.3rem', fontWeight: 700, color: '#2563eb' }}>{formatRupiah(totalBy('fee_lelang_provider'))}</div>
        </div>
        <div className="kpi-card" style={{ borderLeft: '4px solid #ef4444' }}>
          <div className="kpi-label" style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600 }}>Deposit Hangus (50% + Kode Unik)</div>
          <div className="kpi-value" style={{ fontSize: '1.3rem', fontWeight: 700, color: '#dc2626' }}>{formatRupiah(totalBy('deposit_hangus'))}</div>
        </div>
      </div>

      <Card>
        {/* Filters */}
        <div
          style={{
            display: 'flex',
            gap: '0.85rem',
            flexWrap: 'wrap',
            alignItems: 'center',
            marginBottom: '1.25rem',
            paddingBottom: '1rem',
            borderBottom: '1px solid #f1f5f9',
          }}
        >
          <div className="form-group mb-0" style={{ minWidth: '180px' }}>
            <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Jenis Pemasukan</label>
            <select
              className="form-input"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{ width: '100%', padding: '0.45rem 0.65rem', fontSize: '0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
            >
              <option value="">Semua Jenis Pemasukan</option>
              <option value="fee_admin_bidder">Fee Admin Bidder (Menang Lelang)</option>
              <option value="fee_lelang_provider">Fee Lelang Provider</option>
              <option value="deposit_hangus">Deposit Hangus (50% Admin + Kode Unik)</option>
            </select>
          </div>

          <div className="form-group mb-0" style={{ minWidth: '140px' }}>
            <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Spesifik Tanggal</label>
            <input
              type="date"
              className="form-input"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              style={{ width: '100%', padding: '0.45rem 0.65rem', fontSize: '0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
            />
          </div>

          <div className="form-group mb-0" style={{ minWidth: '140px' }}>
            <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Bulan</label>
            <select
              className="form-input"
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              style={{ width: '100%', padding: '0.45rem 0.65rem', fontSize: '0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
            >
              {MONTH_OPTIONS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          <div className="form-group mb-0" style={{ minWidth: '130px' }}>
            <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Tahun</label>
            <select
              className="form-input"
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              style={{ width: '100%', padding: '0.45rem 0.65rem', fontSize: '0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
            >
              {yearOptions.map((y) => (
                <option key={y.value} value={y.value}>{y.label}</option>
              ))}
            </select>
          </div>

          {(dateFilter || monthFilter || yearFilter || categoryFilter) && (
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => {
                setDateFilter('');
                setMonthFilter('');
                setYearFilter('');
                setCategoryFilter('');
              }}
              style={{ marginTop: '1.25rem', padding: '0.45rem 0.85rem', fontSize: '0.8rem' }}
            >
              Reset Filter
            </button>
          )}
        </div>

        {/* Income Table */}
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                {isVisible('no') && <th style={{ width: '50px' }}>No</th>}
                {isVisible('date') && <th>Tanggal</th>}
                {isVisible('category') && <th>Jenis Pemasukan</th>}
                {isVisible('description') && <th>Rincian & Kode Unik</th>}
                {isVisible('amount') && <th style={{ textAlign: 'right' }}>Jumlah (Rp)</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={visibleKeys.length} className="text-center" style={{ padding: '2rem' }}>
                    Memuat data pemasukan...
                  </td>
                </tr>
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={visibleKeys.length} className="text-center text-muted" style={{ padding: '2rem' }}>
                    Tidak ada transaksi pemasukan yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                entries.map((entry, index) => (
                  <tr key={entry.id || `${entry.category}-${entry.date}-${index}`}>
                    {isVisible('no') && <td>{index + 1}</td>}
                    {isVisible('date') && (
                      <td style={{ fontSize: '0.85rem' }}>
                        {new Date(entry.date).toLocaleString('id-ID', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                    )}
                    {isVisible('category') && (
                      <td>
                        <Badge variant={CATEGORY_VARIANT[entry.category] || 'default'}>
                          {CATEGORY_LABEL[entry.category] || entry.category}
                        </Badge>
                      </td>
                    )}
                    {isVisible('description') && (
                      <td style={{ fontSize: '0.85rem' }}>
                        {entry.description}
                      </td>
                    )}
                    {isVisible('amount') && (
                      <td style={{ textAlign: 'right', color: '#059669' }} className="fw-bold">
                        +{formatRupiah(Number(entry.amount))}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
            {entries.length > 0 && (
              <tfoot>
                <tr style={{ backgroundColor: '#F8FAFC', fontWeight: 'bold' }}>
                  <td colSpan={visibleKeys.length - 1} style={{ textAlign: 'right', padding: '10px 14px' }}>
                    Total Pemasukan (Sesuai Filter):
                  </td>
                  <td style={{ textAlign: 'right', color: '#059669', fontSize: '1rem', padding: '10px 14px' }}>
                    {formatRupiah(totalAll)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </Card>
    </DashboardLayout>
  );
}
