'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import { apiUrl } from '../../../lib/api';

interface FeatureToggleItem {
  key: string;
  value: string;
}

export default function PlatformSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [toggles, setToggles] = useState<FeatureToggleItem[]>([]);
  const [commission, setCommission] = useState('1.5');
  const [tax, setTax] = useState('11.0');
  const [nipl, setNipl] = useState('5000000');

  const dummyToggles: FeatureToggleItem[] = [
    { key: 'feat_live_streaming', value: 'false' },
    { key: 'feat_ekyc_auto', value: 'false' },
    { key: 'feat_push_notification', value: 'false' },
    { key: 'feat_qris_payment', value: 'false' },
    { key: 'feat_esign_bast', value: 'false' },
    { key: 'feat_auto_refund', value: 'false' },
    { key: 'feat_price_alert', value: 'false' },
    { key: 'feat_multi_branch', value: 'true' },
    { key: 'feat_analytics_dashboard', value: 'true' },
    { key: 'feat_audit_trail', value: 'true' },
  ];

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(apiUrl('/admin/settings'), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok && data.success) {
        // Map feature flags and general settings
        const loadedToggles: FeatureToggleItem[] = [];
        data.data.forEach((item: any) => {
          if (item.key.startsWith('feat_')) {
            loadedToggles.push({ key: item.key, value: item.value });
          } else if (item.key === 'commission_percentage') {
            setCommission(item.value);
          } else if (item.key === 'tax_percentage') {
            setTax(item.value);
          } else if (item.key === 'nipl_deposit_amount') {
            setNipl(item.value);
          }
        });
        setToggles(loadedToggles);
      } else {
        setToggles(dummyToggles);
      }
    } catch (e) {
      setToggles(dummyToggles);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (key: string, currentValue: string) => {
    const newValue = currentValue === 'true' ? 'false' : 'true';
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(apiUrl(`/admin/settings/${key}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ value: newValue }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        alert(`Fitur ${key} berhasil diubah menjadi ${newValue === 'true' ? 'AKTIF' : 'NONAKTIF'}!`);
        fetchSettings();
      } else {
        throw new Error(data.error?.message || 'Gagal mengubah fitur');
      }
    } catch (e: any) {
      alert(e.message || 'Terjadi kesalahan saat mengubah status fitur.');
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return (
    <DashboardLayout breadcrumbParent="Pengaturan" breadcrumbCurrent="Pengaturan Platform">
      <div className="toolbar">
        <div className="toolbar-left">
          <h1 className="page-title">Konfigurasi Aturan Bisnis & Fitur Platform</h1>
          <p className="page-subtitle">Aktifkan/nonaktifkan modul layanan pihak ketiga secara real-time dan kelola parameter bagi hasil keuangan.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '1.5rem' }}>
        {/* Left Column: Platform rules (fees, tax) */}
        <div>
          <Card>
            <h2 className="card-title">Aturan Keuangan Balai Lelang</h2>
            <div className="form-group mb-3" style={{ marginTop: '1.25rem' }}>
              <label>Komisi Balai Lelang (%)</label>
              <input type="text" className="form-control" value={commission} onChange={(e) => setCommission(e.target.value)} />
            </div>
            <div className="form-group mb-3">
              <label>Pajak Pertambahan Nilai / PPN (%)</label>
              <input type="text" className="form-control" value={tax} onChange={(e) => setTax(e.target.value)} />
            </div>
            <div className="form-group mb-3">
              <label>Deposit Jaminan NIPL Kendaraan (Rp)</label>
              <input type="text" className="form-control" value={nipl} onChange={(e) => setNipl(e.target.value)} />
            </div>
            <button className="btn btn-primary w-100" onClick={() => alert('Aturan keuangan berhasil disimpan!')}>Simpan Parameter</button>
          </Card>
        </div>

        {/* Right Column: Feature Toggles */}
        <div>
          <Card>
            <h2 className="card-title">Feature Toggles (Modul Layanan Pihak Ketiga)</h2>
            <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '1.5rem' }}>Perubahan status di bawah ini langsung berdampak pada alur registrasi, pembayaran, dan bidding room.</p>
            
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Nama Modul / Fitur</th>
                    <th>Feature Key</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'center' }}>Tindakan Toggle</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={4} className="text-center">Memuat status fitur...</td></tr>
                  ) : toggles.length === 0 ? (
                    <tr><td colSpan={4} className="text-center text-muted">Tidak ada feature toggle ditemukan.</td></tr>
                  ) : (
                    toggles.map((item) => (
                      <tr key={item.key}>
                        <td><strong>{item.key.replace('feat_', '').replace(/_/g, ' ').toUpperCase()}</strong></td>
                        <td><code style={{ fontSize: '0.85rem' }}>{item.key}</code></td>
                        <td>
                          {item.value === 'true' ? (
                            <Badge variant="success">ON</Badge>
                          ) : (
                            <Badge variant="default">OFF</Badge>
                          )}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            onClick={() => handleToggle(item.key, item.value)}
                            className={`btn btn-xs ${item.value === 'true' ? 'btn-danger' : 'btn-success'}`}
                            style={{ width: '80px' }}
                          >
                            {item.value === 'true' ? 'Nonaktifkan' : 'Aktifkan'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
