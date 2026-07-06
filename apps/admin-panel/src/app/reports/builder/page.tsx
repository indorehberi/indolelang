'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import Card from '../../../components/ui/Card';
import { apiUrl } from '../../../lib/api';

type ReportType = 'sessions' | 'finance' | 'users' | 'bids' | 'deposits';
type OutputFormat = 'pdf' | 'excel' | 'csv';

interface FilterConfig {
  from_date: string;
  to_date: string;
  branch: string;
  status: string;
  role?: string;
}

const REPORT_TYPES = [
  { value: 'sessions', label: 'Laporan Sesi Lelang', icon: '📋', desc: 'Data sesi, lot, dan hasil hammer price' },
  { value: 'finance', label: 'Laporan Keuangan', icon: '💰', desc: 'Komisi, PPN, dan pencairan per periode' },
  { value: 'users', label: 'Laporan Pengguna', icon: '👥', desc: 'Registrasi, KYC, dan aktivitas pengguna' },
  { value: 'bids', label: 'Laporan Bid Activity', icon: '🔨', desc: 'Rekap penawaran dan pemenang per lot' },
  { value: 'deposits', label: 'Laporan Deposit', icon: '🏦', desc: 'Deposit masuk, terpakai, dan refund' },
];

const FORMATS: { value: OutputFormat; label: string; icon: string }[] = [
  { value: 'pdf', label: 'PDF Report', icon: '📄' },
  { value: 'excel', label: 'Excel (.xlsx)', icon: '📊' },
  { value: 'csv', label: 'CSV Raw Data', icon: '📑' },
];


export default function ReportBuilderPage() {
  const [reportType, setReportType] = useState<ReportType>('sessions');
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('excel');
  const [filters, setFilters] = useState<FilterConfig>({
    from_date: '2026-01-01',
    to_date: '2026-06-30',
    branch: 'Semua Cabang',
    status: '',
    role: '',
  });
  const [generating, setGenerating] = useState(false);
  const [lastGenerated, setLastGenerated] = useState<string | null>(null);
  const [branchesList, setBranchesList] = useState<{ id: string; name: string; }[]>([]);

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const response = await fetch(apiUrl('/branches'));
        const data = await response.json();
        if (response.ok && data.success) {
          setBranchesList(data.data);
        }
      } catch (err) {}
    };
    fetchBranches();
  }, []);

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      const now = new Date().toLocaleString('id-ID');
      setLastGenerated(now);
      alert(
        `✅ Laporan berhasil dibuat!\n\nTipe: ${REPORT_TYPES.find((r) => r.value === reportType)?.label}\nFormat: ${outputFormat.toUpperCase()}\nPeriode: ${filters.from_date} s/d ${filters.to_date}\n\n(Simulasi — file akan diunduh)`
      );
    }, 2000);
  };

  const selectedType = REPORT_TYPES.find((r) => r.value === reportType)!;

  return (
    <DashboardLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Report Builder</h1>
          <p className="page-subtitle">Buat laporan kustom sesuai kebutuhan dengan filter dan format pilihan</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '1.5rem' }}>
        {/* Left: Configuration */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Pilih Tipe Laporan */}
          <Card title="1. Pilih Tipe Laporan">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {REPORT_TYPES.map((type) => (
                <label
                  key={type.value}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.875rem',
                    padding: '0.75rem 1rem',
                    borderRadius: '0.625rem',
                    border: `2px solid ${reportType === type.value ? 'var(--primary)' : 'var(--border)'}`,
                    background:
                      reportType === type.value ? 'color-mix(in srgb, var(--primary) 10%, transparent)' : 'transparent',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  <input
                    type="radio"
                    name="reportType"
                    value={type.value}
                    checked={reportType === type.value}
                    onChange={() => setReportType(type.value as ReportType)}
                    style={{ display: 'none' }}
                  />
                  <span style={{ fontSize: '1.5rem' }}>{type.icon}</span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                      {type.label}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{type.desc}</div>
                  </div>
                  {reportType === type.value && (
                    <span style={{ marginLeft: 'auto', color: 'var(--primary)', fontWeight: 700 }}>✓</span>
                  )}
                </label>
              ))}
            </div>
          </Card>

          {/* Format Output */}
          <Card title="2. Format Output">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.625rem' }}>
              {FORMATS.map((f) => (
                <label
                  key={f.value}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.875rem',
                    borderRadius: '0.625rem',
                    border: `2px solid ${outputFormat === f.value ? 'var(--primary)' : 'var(--border)'}`,
                    background:
                      outputFormat === f.value ? 'color-mix(in srgb, var(--primary) 10%, transparent)' : 'transparent',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    textAlign: 'center',
                  }}
                >
                  <input
                    type="radio"
                    name="format"
                    value={f.value}
                    checked={outputFormat === f.value}
                    onChange={() => setOutputFormat(f.value)}
                    style={{ display: 'none' }}
                  />
                  <span style={{ fontSize: '1.75rem' }}>{f.icon}</span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {f.label}
                  </span>
                </label>
              ))}
            </div>
          </Card>
        </div>

        {/* Right: Filters + Preview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Filters */}
          <Card title="3. Filter & Parameter">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Dari Tanggal</label>
                  <input
                    type="date"
                    className="form-input"
                    value={filters.from_date}
                    onChange={(e) => setFilters({ ...filters, from_date: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Sampai Tanggal</label>
                  <input
                    type="date"
                    className="form-input"
                    value={filters.to_date}
                    onChange={(e) => setFilters({ ...filters, to_date: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Cabang</label>
                <select
                  className="form-select"
                  value={filters.branch}
                  onChange={(e) => setFilters({ ...filters, branch: e.target.value })}
                >
                  <option value="Semua Cabang">Semua Cabang</option>
                  {branchesList.map((b) => (
                    <option key={b.id} value={b.name}>{b.name}</option>
                  ))}
                </select>
              </div>
              {(reportType === 'sessions' || reportType === 'users') && (
                <div className="form-group">
                  <label className="form-label">Filter Status</label>
                  <select
                    className="form-select"
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  >
                    <option value="">Semua Status</option>
                    {reportType === 'sessions' ? (
                      <>
                        <option value="completed">Selesai</option>
                        <option value="active">Aktif</option>
                        <option value="cancelled">Dibatalkan</option>
                      </>
                    ) : (
                      <>
                        <option value="active">Aktif</option>
                        <option value="suspended">Disuspend</option>
                        <option value="pending_kyc">KYC Pending</option>
                      </>
                    )}
                  </select>
                </div>
              )}
              {reportType === 'users' && (
                <div className="form-group">
                  <label className="form-label">Role Pengguna</label>
                  <select
                    className="form-select"
                    value={filters.role || ''}
                    onChange={(e) => setFilters({ ...filters, role: e.target.value })}
                  >
                    <option value="">Semua Role</option>
                    <option value="bidder">Bidder</option>
                    <option value="provider">Provider</option>
                  </select>
                </div>
              )}
            </div>
          </Card>

          {/* Preview card */}
          <Card title="4. Preview Konfigurasi">
            <div
              style={{
                background: 'var(--bg-secondary)',
                borderRadius: '0.75rem',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                fontSize: '0.875rem',
              }}
            >
              {[
                { label: 'Tipe Laporan', value: `${selectedType.icon} ${selectedType.label}` },
                { label: 'Format Output', value: outputFormat.toUpperCase() },
                { label: 'Periode', value: `${filters.from_date} s/d ${filters.to_date}` },
                { label: 'Cabang', value: filters.branch },
                ...(filters.status ? [{ label: 'Status', value: filters.status }] : []),
                ...(filters.role && reportType === 'users' ? [{ label: 'Role Pengguna', value: filters.role.charAt(0).toUpperCase() + filters.role.slice(1) }] : []),
              ].map(({ label, value }) => (
                <div
                  key={label}
                  style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '0.35rem' }}
                >
                  <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{label}</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{value}</span>
                </div>
              ))}
            </div>

            {lastGenerated && (
              <div
                style={{
                  marginTop: '0.75rem',
                  padding: '0.625rem 0.875rem',
                  background: '#22c55e22',
                  borderRadius: '0.5rem',
                  fontSize: '0.8rem',
                  color: '#22c55e',
                  fontWeight: 600,
                }}
              >
                ✅ Terakhir dibuat: {lastGenerated}
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={generating}
              style={{
                marginTop: '1rem',
                width: '100%',
                padding: '0.75rem',
                borderRadius: '0.625rem',
                background: generating ? 'var(--border)' : 'var(--primary)',
                color: generating ? 'var(--text-secondary)' : '#fff',
                border: 'none',
                cursor: generating ? 'not-allowed' : 'pointer',
                fontWeight: 700,
                fontSize: '0.95rem',
                transition: 'all 0.2s',
              }}
            >
              {generating ? '⏳ Membuat Laporan...' : '🚀 Generate & Download Laporan'}
            </button>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
