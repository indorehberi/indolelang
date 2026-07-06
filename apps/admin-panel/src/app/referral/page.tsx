'use client';

import React, { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';

interface ReferralUser {
  id: string;
  name: string;
  email: string;
  referral_code: string;
  referrals_count: number;
  total_reward: number;
  status: 'active' | 'inactive';
  joined_at: string;
}

const DUMMY_REFERRALS: ReferralUser[] = [];

export default function ReferralPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [rewardPerReferral, setRewardPerReferral] = useState('100000');
  const [savingConfig, setSavingConfig] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const filtered = DUMMY_REFERRALS.filter((r) => {
    const matchSearch =
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.email.toLowerCase().includes(search.toLowerCase()) ||
      r.referral_code.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const formatPrice = (v: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v);

  const handleSaveConfig = () => {
    setSavingConfig(true);
    setTimeout(() => {
      setSavingConfig(false);
      showToast('success', 'Konfigurasi program referral berhasil disimpan');
    }, 1000);
  };

  const totalRewardsGiven = filtered.reduce((acc, r) => acc + r.total_reward, 0);
  const totalReferrals = filtered.reduce((acc, r) => acc + r.referrals_count, 0);
  const activeReferrers = filtered.filter((r) => r.status === 'active').length;

  return (
    <DashboardLayout>
      {/* Toast */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: '1.5rem',
            right: '1.5rem',
            zIndex: 9999,
            padding: '0.875rem 1.25rem',
            borderRadius: '0.75rem',
            background: toast.type === 'success' ? '#22c55e' : '#ef4444',
            color: '#fff',
            fontWeight: 600,
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <span>{toast.type === 'success' ? '✅' : '❌'}</span>
          {toast.message}
        </div>
      )}

      <div className="page-header">
        <div>
          <h1 className="page-title">Program Referral</h1>
          <p className="page-subtitle">Kelola program referral dan reward pengguna yang mengajak teman</p>
        </div>
      </div>

      {/* KPI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Total Referral Berhasil', value: totalReferrals.toString(), icon: '🔗', color: '#6366f1' },
          { label: 'Total Reward Diberikan', value: formatPrice(totalRewardsGiven), icon: '🎁', color: '#22c55e' },
          { label: 'Referrer Aktif', value: activeReferrers.toString(), icon: '👥', color: '#f59e0b' },
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
              }}
            >
              {icon}
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color, marginTop: '0.1rem' }}>{value}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
        {/* Config panel */}
        <Card title="Konfigurasi Program Referral">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Reward per Referral (Rp)</label>
              <input
                type="text"
                className="form-input"
                value={formatPrice(Number(rewardPerReferral))}
                onChange={(e) => {
                  const raw = e.target.value.replace(/[^0-9]/g, '');
                  setRewardPerReferral(raw);
                }}
              />
              <span className="form-hint">Reward yang diberikan ke referrer ketika referral berhasil daftar & KYC.</span>
            </div>

            <div className="form-group">
              <label className="form-label">Minimum Referral untuk Klaim</label>
              <select className="form-select">
                <option>1 Referral</option>
                <option>3 Referral</option>
                <option>5 Referral</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Masa Berlaku Kode Referral</label>
              <select className="form-select">
                <option>Tidak Terbatas</option>
                <option>30 Hari</option>
                <option>90 Hari</option>
                <option>1 Tahun</option>
              </select>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem',
                background: 'var(--bg-secondary)',
                borderRadius: '0.5rem',
              }}
            >
              <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                Status Program
              </span>
              <label style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input type="checkbox" defaultChecked />
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Aktif</span>
              </label>
            </div>

            <button
              onClick={handleSaveConfig}
              disabled={savingConfig}
              style={{
                padding: '0.625rem 1rem',
                borderRadius: '0.5rem',
                background: 'var(--primary)',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.875rem',
              }}
            >
              {savingConfig ? 'Menyimpan...' : '💾 Simpan Konfigurasi'}
            </button>
          </div>
        </Card>

        {/* Referral table */}
        <Card title="Daftar Pengguna Referral">
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Cari nama, email, atau kode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '240px' }}
            />
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ width: '140px' }}
            >
              <option value="">Semua Status</option>
              <option value="active">Aktif</option>
              <option value="inactive">Tidak Aktif</option>
            </select>
          </div>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Pengguna</th>
                  <th>Kode Referral</th>
                  <th>Referral Berhasil</th>
                  <th>Total Reward</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{r.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{r.email}</div>
                    </td>
                    <td>
                      <code
                        style={{
                          background: 'var(--bg-secondary)',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '0.375rem',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          color: 'var(--primary)',
                          letterSpacing: '0.05em',
                        }}
                      >
                        {r.referral_code}
                      </code>
                    </td>
                    <td>
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: '1rem',
                          color: r.referrals_count > 0 ? 'var(--primary)' : 'var(--text-secondary)',
                        }}
                      >
                        {r.referrals_count}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700, color: r.total_reward > 0 ? '#22c55e' : 'var(--text-secondary)' }}>
                      {formatPrice(r.total_reward)}
                    </td>
                    <td>
                      <Badge variant={r.status === 'active' ? 'success' : 'warning'}>
                        {r.status === 'active' ? 'Aktif' : 'Tidak Aktif'}
                      </Badge>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                      Tidak ada data ditemukan
                    </td>
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
