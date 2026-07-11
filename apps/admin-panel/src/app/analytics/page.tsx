'use client';

import React from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/ui/Card';
import { apiUrl, apiFetch } from '../../lib/api';

export default function AnalyticsDashboardPage() {
  const [statsData, setStatsData] = React.useState<any>(null);
  const [topProviders, setTopProviders] = React.useState<any[]>([]);

  React.useEffect(() => {
    // Fetch global stats
    fetch(apiUrl('/public/stats'))
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setStatsData(data.data);
        }
      })
      .catch(() => {});

    // Since we don't have a specific top providers endpoint yet,
    // fetch regular providers and show they have 0 sales as fallback real data
    apiFetch('/users?role=provider&per_page=3')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          setTopProviders(data.data);
        }
      })
      .catch(() => {});
  }, []);

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(val || 0);
  };
  
  const gmv = statsData?.total_sales ? Number(statsData.total_sales) : 0;
  const commission = gmv * 0.03;
  const lotsSold = statsData?.total_lots_sold ? Number(statsData.total_lots_sold) : 0;

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
          <div className="kpi-value text-primary">{formatRupiah(gmv)}</div>
          <div className="kpi-trend text-success">Update Data Real-time</div>
        </Card>
        
        <Card className="kpi-card">
          <div className="kpi-label">Pendapatan Komisi Balai (3%)</div>
          <div className="kpi-value text-gold">{formatRupiah(commission)}</div>
          <div className="kpi-trend text-success">Estimasi berdasar GMV</div>
        </Card>

        <Card className="kpi-card">
          <div className="kpi-label">Lot Lelang Laku Terjual</div>
          <div className="kpi-value text-success">{lotsSold} Unit</div>
          <div className="kpi-trend text-muted">Dari total transaksi selesai</div>
        </Card>

        <Card className="kpi-card">
          <div className="kpi-label">Bidder Aktif Registrasi</div>
          <div className="kpi-value" style={{ color: '#2b6cb0' }}>{statsData?.total_bidders || 0} Peserta</div>
          <div className="kpi-trend text-success">Total pengguna terverifikasi</div>
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
            <div>🔵 Mobil: <strong>{formatRupiah(0)}</strong></div>
            <div>🟡 Motor: <strong>{formatRupiah(0)}</strong></div>
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
                {topProviders.length > 0 ? topProviders.map((provider) => (
                  <tr key={provider.id}>
                    <td><strong>{provider.company_name || provider.full_name || 'Provider Name'}</strong></td>
                    <td style={{ textAlign: 'center' }}>0 unit</td>
                    <td>{formatRupiah(0)}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={3} style={{ textAlign: 'center', padding: '1rem' }}>Belum ada data provider</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
