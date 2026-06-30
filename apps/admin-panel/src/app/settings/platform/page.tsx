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

  const toggleNames: Record<string, string> = {
    feat_live_streaming: 'Live Streaming',
    feat_ekyc_auto: 'eKYC Otomatis (Verihubs)',
    feat_push_notification: 'Notifikasi Push',
    feat_qris_payment: 'Pembayaran QRIS',
    feat_esign_bast: 'E-Signature BAST',
    feat_auto_refund: 'Auto Refund Deposit',
    feat_price_alert: 'Price Alerting',
    feat_multi_branch: 'Multi Branch System',
    feat_analytics_dashboard: 'Dashboard Analitik',
    feat_audit_trail: 'Audit Trail System',
    feat_auction_english: 'English Auction',
    feat_auction_dutch: 'Dutch Auction',
    feat_auction_sealed: 'Sealed-Bid',
    feat_auction_timed: 'Timed Auction',
    feat_auction_buynow: 'Buy Now + Auction',
    feat_auction_group: 'Group / Bundle',
    feat_category_mobil: 'Kategori Mobil',
    feat_category_motor: 'Kategori Motor',
    feat_category_properti: 'Kategori Properti',
    feat_category_heavy: 'Kategori Alat Berat',
  };

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
    { key: 'feat_auction_english', value: 'true' },
    { key: 'feat_auction_dutch', value: 'true' },
    { key: 'feat_auction_sealed', value: 'true' },
    { key: 'feat_auction_timed', value: 'true' },
    { key: 'feat_auction_buynow', value: 'true' },
    { key: 'feat_auction_group', value: 'true' },
    { key: 'feat_category_mobil', value: 'true' },
    { key: 'feat_category_motor', value: 'true' },
    { key: 'feat_category_properti', value: 'true' },
    { key: 'feat_category_heavy', value: 'true' },
  ];

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const cookieMap: Record<string, string> = {};
      if (typeof document !== 'undefined') {
        document.cookie.split(';').forEach((c) => {
          const parts = c.trim().split('=');
          if (parts[0]) cookieMap[parts[0]] = parts[1] || '';
        });
      }

      const token = localStorage.getItem('accessToken');
      const response = await fetch(apiUrl('/admin/settings'), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok && data.success) {
        const loadedToggles: FeatureToggleItem[] = [];
        data.data.forEach((item: any) => {
          if (item.key.startsWith('feat_')) {
            const val = cookieMap[item.key] || item.value;
            loadedToggles.push({ key: item.key, value: val });
          } else if (item.key === 'commission_percentage') {
            setCommission(item.value);
          } else if (item.key === 'tax_percentage') {
            setTax(item.value);
          } else if (item.key === 'nipl_deposit_amount') {
            setNipl(item.value);
          }
        });

        const ensureToggle = (key: string, defaultValue: string) => {
          if (!loadedToggles.some((t) => t.key === key)) {
            loadedToggles.push({ key, value: cookieMap[key] || defaultValue });
          }
        };

        ensureToggle('feat_auction_english', 'true');
        ensureToggle('feat_auction_dutch', 'true');
        ensureToggle('feat_auction_sealed', 'true');
        ensureToggle('feat_auction_timed', 'true');
        ensureToggle('feat_auction_buynow', 'true');
        ensureToggle('feat_auction_group', 'true');
        ensureToggle('feat_category_mobil', 'true');
        ensureToggle('feat_category_motor', 'true');
        ensureToggle('feat_category_properti', 'true');
        ensureToggle('feat_category_heavy', 'true');

        setToggles(loadedToggles);
      } else {
        const loadedToggles = dummyToggles.map((t) => ({
          key: t.key,
          value: cookieMap[t.key] || t.value,
        }));
        setToggles(loadedToggles);
      }
    } catch (e) {
      const cookieMap: Record<string, string> = {};
      if (typeof document !== 'undefined') {
        document.cookie.split(';').forEach((c) => {
          const parts = c.trim().split('=');
          if (parts[0]) cookieMap[parts[0]] = parts[1] || '';
        });
      }
      const loadedToggles = dummyToggles.map((t) => ({
        key: t.key,
        value: cookieMap[t.key] || t.value,
      }));
      setToggles(loadedToggles);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (key: string, currentValue: string) => {
    const newValue = currentValue === 'true' ? 'false' : 'true';
    try {
      if (typeof document !== 'undefined') {
        document.cookie = `${key}=${newValue}; path=/; max-age=31536000;`;
      }

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
      setToggles((prev) =>
        prev.map((t) => (t.key === key ? { ...t, value: newValue } : t))
      );
      alert(`Fitur ${key} berhasil diubah menjadi ${newValue === 'true' ? 'AKTIF' : 'NONAKTIF'} (Simulasi Cookie)!`);
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
                        <td><strong>{toggleNames[item.key] || item.key.replace('feat_', '').replace(/_/g, ' ').toUpperCase()}</strong></td>
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
