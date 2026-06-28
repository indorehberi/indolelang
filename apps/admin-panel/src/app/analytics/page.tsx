'use client';

import React from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/ui/Card';

export default function AnalyticsDashboardPage() {
  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(val);
  };

  return (
    <DashboardLayout breadcrumbParent="Laporan" breadcrumbCurrent="Dashboard Analitik">
      <div className="toolbar">
        <div className="toolbar-left">
          <h1 className="page-title">Dashboard Analitik Keuangan & Kinerja</h1>
          <p className="page-subtitle">Metrik performa bisnis utama, volume transaksi lelang (GMV), serta pertumbuhan pengguna.</p>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="kpi-grid mb-3">
        <Card className="kpi-card">
          <div className="kpi-label">Gross Merchandise Value (GMV)</div>
          <div className="kpi-value text-primary">{formatRupiah(1930000000)}</div>
          <div className="kpi-trend text-success">↑ 14.5% dibanding bulan lalu</div>
        </Card>
        
        <Card className="kpi-card">
          <div className="kpi-label">Pendapatan Komisi Balai (3%)</div>
          <div className="kpi-value text-gold">{formatRupiah(57900000)}</div>
          <div className="kpi-trend text-success">↑ 12.3% dibanding bulan lalu</div>
        </Card>

        <Card className="kpi-card">
          <div className="kpi-label">Tingkat Konversi Penjualan</div>
          <div className="kpi-value text-success">79%</div>
          <div className="kpi-trend text-muted">Dari total 43 lot yang diajukan</div>
        </Card>

        <Card className="kpi-card">
          <div className="kpi-label">Bidder Aktif Sesi Ini</div>
          <div className="kpi-value" style={{ color: '#2b6cb0' }}>148 Peserta</div>
          <div className="kpi-trend text-success">↑ 8.2% registrasi baru</div>
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginTop: '1.5rem' }}>
        {/* Sales by Category chart mockup */}
        <Card>
          <h2 className="card-title">Tren GMV & Transaksi Mingguan</h2>
          <div style={{ height: '240px', background: '#f7fafc', border: '1px dashed #e2e8f0', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#718096' }}>
            [ Visualisasi Grafik Tren GMV Mingguan - Staging Mode ]
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '1rem', fontSize: '0.85rem' }}>
            <div>🔵 Mobil: <strong>{formatRupiah(1450000000)}</strong></div>
            <div>🟡 Motor: <strong>{formatRupiah(480000000)}</strong></div>
          </div>
        </Card>

        {/* Top Providers list */}
        <Card>
          <h2 className="card-title">Top 3 Provider Teraktif</h2>
          <div className="table-wrapper" style={{ marginTop: '1rem' }}>
            <table>
              <thead>
                <tr>
                  <th>Mitra Perusahaan</th>
                  <th style={{ textAlign: 'center' }}>Lot Laku</th>
                  <th>Total Bersih</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>PT Adira Finance</strong></td>
                  <td style={{ textAlign: 'center' }}>24 unit</td>
                  <td>{formatRupiah(840000000)}</td>
                </tr>
                <tr>
                  <td><strong>PT Djarum Finance</strong></td>
                  <td style={{ textAlign: 'center' }}>8 unit</td>
                  <td>{formatRupiah(310000000)}</td>
                </tr>
                <tr>
                  <td><strong>PT Adira Dinamika</strong></td>
                  <td style={{ textAlign: 'center' }}>2 unit</td>
                  <td>{formatRupiah(142500000)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
