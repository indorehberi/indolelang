'use client';

import React, { useState } from 'react';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import { useToast } from '../../../providers/ToastProvider';
import { apiFetch } from '../../../lib/api';

interface SessionReport {
  id: string;
  name: string;
  date: string;
  total_lots: number;
  sold_lots: number;
  total_value: number;
  sell_rate: number;
  status: string;
}

export default function SessionReportsPage() {
  const toast = useToast();
  const [reports, setReports] = useState<SessionReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [downloading, setDownloading] = useState<string | null>(null);

  React.useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      try {
        const res = await apiFetch(`/admin/reports/sessions?per_page=100${search ? `&search=${encodeURIComponent(search)}` : ''}`);
        const data = await res.json();
        if (res.ok && data.success) {
          setReports(data.data || []);
        } else {
          toast.error(data.error?.message || 'Gagal memuat laporan sesi');
        }
      } catch (err) {
        toast.error('Terjadi kesalahan jaringan');
      } finally {
        setLoading(false);
      }
    };
    
    // Simple debounce
    const t = setTimeout(fetchReports, 500);
    return () => clearTimeout(t);
  }, [search]);

  const filtered = reports; // since we filter in backend or could filter here

  const formatPrice = (v: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(v);

  const handleDownload = (id: string, format: 'pdf' | 'excel') => {
    setDownloading(`${id}-${format}`);
    setTimeout(() => {
      setDownloading(null);
      toast.success(`Download ${format.toUpperCase()} laporan sesi berhasil (simulasi)`);
    }, 1200);
  };

  const totalValue = filtered.reduce((acc, r) => acc + r.total_value, 0);
  const avgSellRate =
    filtered.length > 0
      ? (filtered.reduce((acc, r) => acc + r.sell_rate, 0) / filtered.length).toFixed(1)
      : '0';

  return (
    <DashboardLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Laporan Sesi Lelang</h1>
          <p className="page-subtitle">Rekap hasil dan statistik setiap sesi lelang yang telah selesai</p>
        </div>
        <button
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
          onClick={() => toast.info('Export semua laporan (simulasi)')}
        >
          📥 Export Semua
        </button>
      </div>

      {/* Summary KPIs */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        {[
          { label: 'Total Sesi Selesai', value: filtered.length.toString(), icon: '📋', color: '#6366f1' },
          { label: 'Total Nilai Terjual', value: formatPrice(totalValue), icon: '💰', color: '#22c55e' },
          { label: 'Rata-Rata Terjual', value: `${avgSellRate}%`, icon: '📊', color: '#f59e0b' },
        ].map(({ label, value, icon, color }) => (
          <div
            key={label}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '0.875rem',
              padding: '1.25rem 1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '0.75rem',
                background: `${color}22`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                flexShrink: 0,
              }}
            >
              {icon}
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.15rem' }}>
                {value}
              </div>
            </div>
          </div>
        ))}
      </div>

      <Card title="Daftar Laporan Sesi">
        {/* Toolbar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem',
            gap: '0.75rem',
            flexWrap: 'wrap',
          }}
        >
          <input
            type="text"
            className="form-input"
            placeholder="Cari nama sesi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '280px' }}
          />
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Menampilkan {filtered.length} sesi
          </span>
        </div>

        {/* Table */}
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Nama Sesi</th>
                <th>Tanggal Sesi</th>
                <th>Lot Terjual</th>
                <th>Total Transaksi</th>
                <th>% Terjual</th>
                <th>Unduh</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                    Memuat data...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                    Tidak ada laporan ditemukan
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 600, maxWidth: '280px' }}>{r.name}</td>
                  <td>{new Date(r.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</td>
                  <td>
                    <span style={{ fontWeight: 600 }}>{r.sold_lots}</span>
                    <span style={{ color: 'var(--text-secondary)' }}>/{r.total_lots} lot</span>
                  </td>
                  <td style={{ fontWeight: 700, color: 'var(--primary)' }}>
                    {formatPrice(r.total_value)}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div
                        style={{
                          flex: 1,
                          height: '6px',
                          background: 'var(--border)',
                          borderRadius: '99px',
                          overflow: 'hidden',
                          minWidth: '60px',
                        }}
                      >
                        <div
                          style={{
                            height: '100%',
                            width: `${r.sell_rate}%`,
                            background: r.sell_rate >= 90 ? '#22c55e' : r.sell_rate >= 75 ? '#f59e0b' : '#ef4444',
                            borderRadius: '99px',
                          }}
                        />
                      </div>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, minWidth: '36px' }}>
                        {r.sell_rate}%
                      </span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.375rem' }}>
                      <button
                        onClick={() => handleDownload(r.id, 'pdf')}
                        disabled={downloading === `${r.id}-pdf`}
                        style={{
                          padding: '0.35rem 0.65rem',
                          fontSize: '0.75rem',
                          border: '1px solid var(--border)',
                          borderRadius: '0.375rem',
                          color: 'var(--text-primary)',
                          fontWeight: 600,
                          cursor: 'pointer',
                          background: 'transparent',
                        }}
                      >
                        {downloading === `${r.id}-pdf` ? '...' : '📄 PDF'}
                      </button>
                      <button
                        onClick={() => handleDownload(r.id, 'excel')}
                        disabled={downloading === `${r.id}-excel`}
                        style={{
                          padding: '0.35rem 0.65rem',
                          fontSize: '0.75rem',
                          border: '1px solid var(--border)',
                          borderRadius: '0.375rem',
                          color: 'var(--text-primary)',
                          fontWeight: 600,
                          cursor: 'pointer',
                          background: 'transparent',
                        }}
                      >
                        {downloading === `${r.id}-excel` ? '...' : '📊 Excel'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </DashboardLayout>
  );
}
