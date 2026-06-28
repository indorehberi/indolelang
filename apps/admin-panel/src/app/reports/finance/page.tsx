'use client';

import React, { useState } from 'react';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import Card from '../../../components/ui/Card';

interface FinanceRow {
  month: string;
  gross_revenue: number;
  commission: number;
  ppn: number;
  disbursement: number;
}

const DUMMY_DATA: FinanceRow[] = [
  {
    month: 'Juni 2026',
    gross_revenue: 985_000_000,
    commission: 14_775_000,
    ppn: 10_835_000,
    disbursement: 820_000_000,
  },
  {
    month: 'Mei 2026',
    gross_revenue: 1_230_000_000,
    commission: 18_450_000,
    ppn: 13_530_000,
    disbursement: 1_050_000_000,
  },
  {
    month: 'April 2026',
    gross_revenue: 756_000_000,
    commission: 11_340_000,
    ppn: 8_316_000,
    disbursement: 620_000_000,
  },
  {
    month: 'Maret 2026',
    gross_revenue: 890_000_000,
    commission: 13_350_000,
    ppn: 9_790_000,
    disbursement: 740_000_000,
  },
  {
    month: 'Februari 2026',
    gross_revenue: 620_000_000,
    commission: 9_300_000,
    ppn: 6_820_000,
    disbursement: 510_000_000,
  },
  {
    month: 'Januari 2026',
    gross_revenue: 1_100_000_000,
    commission: 16_500_000,
    ppn: 12_100_000,
    disbursement: 930_000_000,
  },
];

export default function FinanceReportPage() {
  const [search, setSearch] = useState('');

  const filtered = DUMMY_DATA.filter((r) =>
    r.month.toLowerCase().includes(search.toLowerCase())
  );

  const formatPrice = (v: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(v);

  const totalCommission = filtered.reduce((acc, r) => acc + r.commission, 0);
  const totalAR = filtered.reduce((acc, r) => acc + (r.gross_revenue - r.disbursement - r.ppn), 0);
  const totalGross = filtered.reduce((acc, r) => acc + r.gross_revenue, 0);

  return (
    <DashboardLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Laporan Keuangan</h1>
          <p className="page-subtitle">Rekap pendapatan komisi, PPN, dan pencairan per bulan</p>
        </div>
        <button
          onClick={() => alert('Export laporan keuangan (simulasi)')}
          style={{
            padding: '0.625rem 1.25rem',
            borderRadius: '0.625rem',
            background: 'var(--primary)',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '0.875rem',
          }}
        >
          📥 Export Excel
        </button>
      </div>

      {/* KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        {[
          {
            label: 'Pendapatan Komisi Bersih',
            value: formatPrice(totalCommission),
            icon: '💵',
            color: '#22c55e',
            sub: 'Akumulasi komisi balai lelang',
          },
          {
            label: 'Total Pendapatan Kotor',
            value: formatPrice(totalGross),
            icon: '💰',
            color: '#6366f1',
            sub: 'Total hammer price semua sesi',
          },
          {
            label: 'Piutang Pelunasan',
            value: formatPrice(Math.max(0, totalAR)),
            icon: '📋',
            color: '#f59e0b',
            sub: 'Belum dicairkan ke provider',
          },
        ].map(({ label, value, icon, color, sub }) => (
          <div
            key={label}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '0.875rem',
              padding: '1.25rem 1.5rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '0.625rem',
                  background: `${color}22`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.35rem',
                }}
              >
                {icon}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                {label}
              </div>
            </div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>{sub}</div>
          </div>
        ))}
      </div>

      <Card title="Rekap Keuangan Bulanan">
        {/* Toolbar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', gap: '0.75rem' }}>
          <input
            type="text"
            className="form-input"
            placeholder="Cari bulan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '220px' }}
          />
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <select className="form-select" style={{ width: '160px' }}>
              <option>2026</option>
              <option>2025</option>
            </select>
          </div>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Bulan</th>
                <th>Pendapatan Kotor</th>
                <th>Komisi Balai Lelang</th>
                <th>PPN Disetor</th>
                <th>Pencairan Provider</th>
                <th>Net Margin</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const margin = ((r.commission / r.gross_revenue) * 100).toFixed(2);
                return (
                  <tr key={r.month}>
                    <td style={{ fontWeight: 700 }}>{r.month}</td>
                    <td style={{ fontWeight: 600 }}>{formatPrice(r.gross_revenue)}</td>
                    <td>
                      <span style={{ color: '#22c55e', fontWeight: 700 }}>
                        {formatPrice(r.commission)}
                      </span>
                    </td>
                    <td>{formatPrice(r.ppn)}</td>
                    <td>{formatPrice(r.disbursement)}</td>
                    <td>
                      <span
                        style={{
                          background: '#22c55e22',
                          color: '#22c55e',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '0.375rem',
                          fontWeight: 700,
                          fontSize: '0.8rem',
                        }}
                      >
                        {margin}%
                      </span>
                    </td>
                  </tr>
                );
              })}
              {/* Totals row */}
              {filtered.length > 0 && (
                <tr
                  style={{
                    background: 'var(--bg-secondary)',
                    fontWeight: 700,
                    borderTop: '2px solid var(--border)',
                  }}
                >
                  <td>TOTAL</td>
                  <td>{formatPrice(filtered.reduce((acc, r) => acc + r.gross_revenue, 0))}</td>
                  <td style={{ color: '#22c55e' }}>
                    {formatPrice(filtered.reduce((acc, r) => acc + r.commission, 0))}
                  </td>
                  <td>{formatPrice(filtered.reduce((acc, r) => acc + r.ppn, 0))}</td>
                  <td>{formatPrice(filtered.reduce((acc, r) => acc + r.disbursement, 0))}</td>
                  <td>—</td>
                </tr>
              )}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                    Tidak ada data ditemukan
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Chart placeholder */}
      <Card title="Grafik Tren Pendapatan">
        <div
          style={{
            height: '220px',
            background: 'var(--bg-secondary)',
            borderRadius: '0.75rem',
            border: '2px dashed var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-secondary)',
            fontSize: '0.9rem',
          }}
        >
          📈 Grafik Tren Pendapatan Kotor vs Komisi (6 bulan terakhir)
          <br />
          <small style={{ opacity: 0.6 }}>Akan dirender dengan Chart.js / Recharts</small>
        </div>
      </Card>
    </DashboardLayout>
  );
}
