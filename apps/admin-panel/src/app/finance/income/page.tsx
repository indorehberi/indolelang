'use client';

import React, { useEffect, useState, useCallback } from 'react';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import { apiFetch } from '../../../lib/api';
import { useToast } from '../../../providers/ToastProvider';

type IncomeCategory = 'deposit' | 'biaya_admin' | 'fee_lelang';

interface IncomeEntry {
  date: string;
  category: IncomeCategory;
  description: string;
  amount: number;
}

const CATEGORY_LABEL: Record<IncomeCategory, string> = {
  deposit: 'Deposit',
  biaya_admin: 'Biaya Admin',
  fee_lelang: 'Fee Lelang',
};

const CATEGORY_VARIANT: Record<IncomeCategory, 'success' | 'warning' | 'default'> = {
  deposit: 'default',
  biaya_admin: 'warning',
  fee_lelang: 'success',
};

const formatRupiah = (value: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value);

export default function IncomePage() {
  const toast = useToast();
  const [entries, setEntries] = useState<IncomeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<'' | IncomeCategory>('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const fetchIncome = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (from) params.set('from', from);
      // `to` is a bare date, so widen it to the end of that day — otherwise
      // everything recorded after 00:00 on the closing date drops out.
      if (to) params.set('to', `${to}T23:59:59`);

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
    // `toast` is deliberately not a dependency: ToastProvider builds its
    // context value inline, so it is a new object on every render — including
    // it here would make this callback unstable and put the effect below into
    // an endless refetch loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to]);

  useEffect(() => {
    fetchIncome();
  }, [fetchIncome]);

  const filtered = categoryFilter
    ? entries.filter((e) => e.category === categoryFilter)
    : entries;

  const total = filtered.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const totalBy = (category: IncomeCategory) =>
    entries
      .filter((e) => e.category === category)
      .reduce((sum, e) => sum + Number(e.amount || 0), 0);

  return (
    <DashboardLayout breadcrumbParent="Keuangan" breadcrumbCurrent="Pemasukan">
      <div className="toolbar">
        <div className="toolbar-left">
          <h1 className="page-title">Daftar Pemasukan</h1>
          <p className="page-subtitle">
            Seluruh pemasukan platform: deposit NIPL, biaya admin, dan fee lelang.
          </p>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-label">Deposit</div>
          <div className="kpi-value">{formatRupiah(totalBy('deposit'))}</div>
        </div>
        <div className="kpi-card gold">
          <div className="kpi-label">Biaya Admin</div>
          <div className="kpi-value">{formatRupiah(totalBy('biaya_admin'))}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Fee Lelang</div>
          <div className="kpi-value">{formatRupiah(totalBy('fee_lelang'))}</div>
        </div>
      </div>

      <Card>
        <div className="card-header">
          <span>Rincian Pemasukan</span>
          <span className="fw-bold">{formatRupiah(total)}</span>
        </div>

        <div
          style={{
            display: 'flex',
            gap: '0.75rem',
            flexWrap: 'wrap',
            alignItems: 'flex-end',
            marginBottom: '1rem',
          }}
        >
          <div className="form-group mb-0">
            <label className="form-label">Keterangan</label>
            <select
              className="form-input"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as '' | IncomeCategory)}
            >
              <option value="">Semua</option>
              <option value="deposit">Deposit</option>
              <option value="biaya_admin">Biaya Admin</option>
              <option value="fee_lelang">Fee Lelang</option>
            </select>
          </div>
          <div className="form-group mb-0">
            <label className="form-label">Dari Tanggal</label>
            <input
              type="date"
              className="form-input"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>
          <div className="form-group mb-0">
            <label className="form-label">Sampai Tanggal</label>
            <input
              type="date"
              className="form-input"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
          {(from || to || categoryFilter) && (
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => {
                setFrom('');
                setTo('');
                setCategoryFilter('');
              }}
            >
              Reset Filter
            </button>
          )}
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th style={{ width: '60px' }}>No</th>
                <th>Tanggal</th>
                <th>Keterangan</th>
                <th style={{ textAlign: 'right' }}>Jumlah</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="text-center">
                    Memuat data pemasukan...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center text-muted">
                    Belum ada pemasukan pada periode ini.
                  </td>
                </tr>
              ) : (
                filtered.map((entry, index) => (
                  <tr key={`${entry.category}-${entry.date}-${index}`}>
                    <td>{index + 1}</td>
                    <td>
                      {new Date(entry.date).toLocaleDateString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td>
                      <Badge variant={CATEGORY_VARIANT[entry.category]}>
                        {CATEGORY_LABEL[entry.category]}
                      </Badge>
                      <span style={{ marginLeft: '0.5rem' }}>{entry.description}</span>
                    </td>
                    <td style={{ textAlign: 'right' }} className="fw-bold">
                      {formatRupiah(Number(entry.amount))}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {filtered.length > 0 && (
              <tfoot>
                <tr>
                  <td colSpan={3} className="fw-bold" style={{ textAlign: 'right' }}>
                    Total
                  </td>
                  <td className="fw-bold" style={{ textAlign: 'right' }}>
                    {formatRupiah(total)}
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
