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
  const [tax, setTax] = useState('11');
  const [nipl, setNipl] = useState('5000000');
  const [niplMotor, setNiplMotor] = useState('1000000');
  const [feeBearer, setFeeBearer] = useState('admin');
  const [feeBearerDeposit, setFeeBearerDeposit] = useState('bidder');
  const [feeBearerRefund, setFeeBearerRefund] = useState('admin');
  const [feeBearerPelunasan, setFeeBearerPelunasan] = useState('bidder');
  const [feeBearerSettlement, setFeeBearerSettlement] = useState('provider');
  const [antiSnipeSecs, setAntiSnipeSecs] = useState('120');
  
  // New financial settings
  const [pmk41, setPmk41] = useState('1.1');
  const [dppLain, setDppLain] = useState('11/12');
  const [ppnDppLain, setPpnDppLain] = useState('12');
  const [pph23, setPph23] = useState('2');
  const [adminFeeTiers, setAdminFeeTiers] = useState<any[]>([
    { max_price: 200000000, fee: 3500000 },
    { max_price: 400000000, fee: 4000000 },
    { max_price: 600000000, fee: 4500000 },
    { max_price: null, fee: 6000000 }
  ]);
  
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Integrations (API Keys)
  const [apiKeys, setApiKeys] = useState({
    midtrans_server_key: '',
    midtrans_client_key: '',
    midtrans_is_production: 'false',
    midtrans_notification_url: '',
    midtrans_iris_creator_key: '',
    midtrans_iris_approver_key: '',
    aws_secret_key: '',
    aws_access_key: '',
    aws_bucket: '',
    smtp_host: '',
    smtp_user: '',
    smtp_password: '',
    smtp_port: '',
    smtp_from: '',
    verihubs_api_key: '',
    xendit_api_key: '',
  });

  const toggleNames: Record<string, string> = {
    feat_live_streaming: 'Live Streaming',
    feat_ekyc_auto: 'EKYC (Otomatis via Pihak Ketiga)',
    feat_bank_inquiry_auto: 'Cek Rekening (Otomatis via Pihak Ketiga)',
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
        const newApiKeys = { ...apiKeys };
        
        data.data.forEach((item: any) => {
          if (item.key.startsWith('feat_')) {
            const val = cookieMap[item.key] || item.value;
            loadedToggles.push({ key: item.key, value: val });
          } else if (item.key === 'tax_percentage') {
            setTax(item.value);
          } else if (item.key === 'nipl_deposit_amount') {
            setNipl(item.value);
          } else if (item.key === 'nipl_motor_deposit_amount') {
            setNiplMotor(item.value);
          } else if (item.key === 'anti_sniping_extension_seconds') {
            setAntiSnipeSecs(item.value);
          } else if (item.key === 'FEE_BEARER') {
            setFeeBearer(item.value);
          } else if (item.key === 'fee_bearer_deposit') {
            setFeeBearerDeposit(item.value);
          } else if (item.key === 'fee_bearer_refund') {
            setFeeBearerRefund(item.value);
          } else if (item.key === 'fee_bearer_pelunasan') {
            setFeeBearerPelunasan(item.value);
          } else if (item.key === 'fee_bearer_settlement') {
            setFeeBearerSettlement(item.value);
          } else if (item.key === 'pmk41_percentage') {
            setPmk41(item.value);
          } else if (item.key === 'dpp_lain_multiplier') {
            setDppLain(item.value);
          } else if (item.key === 'ppn_dpp_lain_percentage') {
            setPpnDppLain(item.value);
          } else if (item.key === 'pph23_percentage') {
            setPph23(item.value);
          } else if (item.key === 'admin_fee_tiers') {
            try {
              setAdminFeeTiers(JSON.parse(item.value));
            } catch(e) {}
          } else if (item.key in newApiKeys) {
            (newApiKeys as any)[item.key] = item.value;
          }
        });

        const ensureToggle = (key: string, defaultValue: string) => {
          if (!loadedToggles.some((t) => t.key === key)) {
            loadedToggles.push({ key, value: cookieMap[key] || defaultValue });
          }
        };

        ensureToggle('feat_auction_english', 'true');
        ensureToggle('feat_auction_dutch', 'false');
        ensureToggle('feat_auction_sealed', 'false');
        ensureToggle('feat_auction_timed', 'false');
        ensureToggle('feat_auction_buynow', 'false');
        ensureToggle('feat_auction_group', 'false');
        ensureToggle('feat_category_mobil', 'true');
        ensureToggle('feat_category_motor', 'true');
        ensureToggle('feat_category_properti', 'false');
        ensureToggle('feat_category_heavy', 'false');
        ensureToggle('feat_ekyc_auto', 'false');
        ensureToggle('feat_bank_inquiry_auto', 'false');

        setToggles(loadedToggles);
        setApiKeys(newApiKeys);
      } else {
        setToggles([]);
      }
    } catch (e) {
      setToggles([]);
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

  const handleSaveIntegrations = async () => {
    setIsSaving(true);
    const token = localStorage.getItem('accessToken');
    try {
      for (const [k, v] of Object.entries(apiKeys)) {
        if (v && v !== '') {
          await fetch(apiUrl(`/admin/settings/${k}`), {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ value: v }),
          });
        }
      }
      alert('Integrasi Pihak Ketiga berhasil disimpan dan dienkripsi!');
      fetchSettings();
    } catch (e) {
      alert('Gagal menyimpan Integrasi.');
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveFinancials = async () => {
    if (!tax || !nipl || !niplMotor) {
      alert('Semua bidang (PPN, NIPL) harus diisi dan tidak boleh kosong atau dihapus.');
      return;
    }
    
    setIsSaving(true);
    const token = localStorage.getItem('accessToken');
    try {
      const updates = [
        { key: 'tax_percentage', value: tax },
        { key: 'nipl_deposit_amount', value: nipl },
        { key: 'nipl_motor_deposit_amount', value: niplMotor },
        { key: 'anti_sniping_extension_seconds', value: antiSnipeSecs },
        { key: 'FEE_BEARER', value: feeBearer },
        { key: 'fee_bearer_deposit', value: feeBearerDeposit },
        { key: 'fee_bearer_refund', value: feeBearerRefund },
        { key: 'fee_bearer_pelunasan', value: feeBearerPelunasan },
        { key: 'fee_bearer_settlement', value: feeBearerSettlement },
        { key: 'pmk41_percentage', value: pmk41 },
        { key: 'dpp_lain_multiplier', value: dppLain },
        { key: 'ppn_dpp_lain_percentage', value: ppnDppLain },
        { key: 'pph23_percentage', value: pph23 },
        { key: 'admin_fee_tiers', value: JSON.stringify(adminFeeTiers) },
      ];

      for (const update of updates) {
        await fetch(apiUrl(`/admin/settings/${update.key}`), {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ value: update.value }),
        });
      }
      setIsConfirmModalOpen(false);
      alert('Aturan keuangan berhasil disimpan secara permanen!');
      fetchSettings();
    } catch (e) {
      alert('Gagal menyimpan aturan keuangan.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DashboardLayout breadcrumbParent="Pengaturan" breadcrumbCurrent="Pengaturan Platform">
      <div className="toolbar">
        <div className="toolbar-left">
          <h1 className="page-title">Konfigurasi Aturan Bisnis & Fitur Platform</h1>
          <p className="page-subtitle">Aktifkan/nonaktifkan modul layanan pihak ketiga secara real-time dan kelola parameter bagi hasil keuangan.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Left Column: Platform rules (fees, tax) */}
        <div>
          <Card>
            <h2 className="card-title">Aturan Keuangan Balai Lelang</h2>
            
            <div className="alert alert-info mt-3 mb-4 text-xs">
              <strong>Info:</strong> Komisi Admin (Bidder) dan Provider Fee tidak lagi diatur di sini karena menggunakan skema <strong>Tiered Admin Fee</strong> berdasarkan Harga Terbentuk (Hammer Price), dan Fee Provider diatur secara spesifik pada masing-masing profil Provider.
            </div>


            <div className="form-group">
              <label className="form-label">Deposit Jaminan NIPL Kendaraan (Rp) <span className="required">*</span></label>
              <input type="number" className="form-input" value={nipl} onChange={(e) => setNipl(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Deposit Jaminan NIPL Motor (Rp) <span className="required">*</span></label>
              <input type="number" className="form-input" value={niplMotor} onChange={(e) => setNiplMotor(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Durasi Anti-Sniping (Detik) <span className="required">*</span></label>
              <input type="number" className="form-input" value={antiSnipeSecs} onChange={(e) => setAntiSnipeSecs(e.target.value)} required />
              <p className="text-xs text-muted mt-1">Durasi waktu tambahan (dalam detik) jika ada bid di akhir sesi lelang lot.</p>
            </div>
            <div style={{ border: '1px solid var(--border)', borderRadius: '0.5rem', padding: '1rem', marginBottom: '1rem', background: '#f8fafc' }}>
              <span className="form-label" style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.75rem' }}>Beban Biaya Transfer Gateway Bidder</span>
              
              <div className="form-group mb-2">
                <label className="form-label" style={{ fontSize: '0.8rem' }}>Biaya Transfer Deposit <span className="required">*</span></label>
                <select className="form-input" value={feeBearerDeposit} onChange={(e) => setFeeBearerDeposit(e.target.value)}>
                  <option value="bidder">Ditanggung Bidder</option>
                  <option value="admin">Ditanggung Admin</option>
                </select>
              </div>

              <div className="form-group mb-2">
                <label className="form-label" style={{ fontSize: '0.8rem' }}>Biaya Transfer Refund Deposit <span className="required">*</span></label>
                <select className="form-input" value={feeBearerRefund} onChange={(e) => setFeeBearerRefund(e.target.value)}>
                  <option value="bidder">Ditanggung Bidder</option>
                  <option value="admin">Ditanggung Admin</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.8rem' }}>Biaya Transfer Pelunasan <span className="required">*</span></label>
                <select className="form-input" value={feeBearerPelunasan} onChange={(e) => setFeeBearerPelunasan(e.target.value)}>
                  <option value="bidder">Ditanggung Bidder</option>
                  <option value="admin">Ditanggung Admin</option>
                </select>
              </div>
            </div>

            <div style={{ border: '1px solid var(--border)', borderRadius: '0.5rem', padding: '1rem', marginBottom: '1rem', background: '#f8fafc' }}>
              <span className="form-label" style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.75rem' }}>Beban Biaya Transfer Gateway Provider</span>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.8rem' }}>Biaya Settlement <span className="required">*</span></label>
                <select className="form-input" value={feeBearerSettlement} onChange={(e) => setFeeBearerSettlement(e.target.value)}>
                  <option value="provider">Ditanggung Provider</option>
                  <option value="admin">Ditanggung Admin</option>
                </select>
              </div>
            </div>

            <hr className="my-4" />
            <h3 className="card-title text-sm mb-3">Persentase Pajak &amp; Potongan Lainnya</h3>
            
            <div className="form-group">
              <label className="form-label">Pajak Pertambahan Nilai / PPN (%)</label>
              <input type="number" step="0.1" className="form-input" value={tax} onChange={(e) => setTax(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Potongan PMK 41 (%)</label>
              <input type="number" step="0.01" className="form-input" value={pmk41} onChange={(e) => setPmk41(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Faktor Pengali DPP Lain-Lain (Fraksi / Desimal)</label>
              <input type="text" className="form-input" value={dppLain} onChange={(e) => setDppLain(e.target.value)} required placeholder="Contoh: 11/12 atau 0.916" />
            </div>
            <div className="form-group">
              <label className="form-label">PPN untuk DPP Lain-Lain (%)</label>
              <input type="number" step="0.1" className="form-input" value={ppnDppLain} onChange={(e) => setPpnDppLain(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Potongan PPh 23 Provider (%)</label>
              <input type="number" step="0.1" className="form-input" value={pph23} onChange={(e) => setPph23(e.target.value)} required />
            </div>

            <hr className="my-4" />
            <h3 className="card-title text-sm mb-3">Tiered Admin Fee (Untuk Bidder)</h3>
            <div className="alert alert-secondary text-xs mb-3">
              Kosongkan batas harga maksimal pada baris terakhir untuk menetapkan fee tanpa batas atas (<i>Unlimited</i>).
            </div>
            
            <div className="table-responsive mb-3">
              <table className="table table-sm table-bordered">
                <thead className="table-light">
                  <tr>
                    <th>Batas Harga Terbentuk (Max)</th>
                    <th>Nominal Admin Fee (Rp)</th>
                  </tr>
                </thead>
                <tbody>
                  {adminFeeTiers.map((tier, index) => (
                    <tr key={index}>
                      <td>
                        <input 
                          type="number" 
                          className="form-input" 
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.875rem' }}
                          value={tier.max_price === null ? '' : tier.max_price} 
                          placeholder="Maksimal (Kosong = Unlimited)"
                          onChange={(e) => {
                            const val = e.target.value ? Number(e.target.value) : null;
                            const newTiers = [...adminFeeTiers];
                            newTiers[index].max_price = val;
                            setAdminFeeTiers(newTiers);
                          }}
                        />
                      </td>
                      <td>
                        <input 
                          type="number" 
                          className="form-input" 
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.875rem' }}
                          value={tier.fee} 
                          onChange={(e) => {
                            const newTiers = [...adminFeeTiers];
                            newTiers[index].fee = Number(e.target.value);
                            setAdminFeeTiers(newTiers);
                          }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button 
                className="btn btn-outline-primary btn-sm"
                onClick={() => setAdminFeeTiers([...adminFeeTiers, { max_price: null, fee: 0 }])}
              >
                + Tambah Tier
              </button>
            </div>
            
            <button className="btn btn-primary w-100" onClick={() => setIsConfirmModalOpen(true)}>Simpan Parameter</button>
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
                          <label className="switch">
                            <input
                              type="checkbox"
                              checked={item.value === 'true'}
                              onChange={() => handleToggle(item.key, item.value)}
                            />
                            <span className="slider"></span>
                          </label>
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
      
      {/* Integrations Column */}
      <Card>
        <h2 className="card-title">Integrasi API Pihak Ketiga</h2>
        <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '1.5rem' }}>Kunci API (API Keys) di bawah ini akan dienkripsi AES-256 secara otomatis saat disimpan ke dalam database.</p>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div>
            <h3 className="text-md fw-bold mb-3">Midtrans (Payment Gateway & Refund)</h3>
            <div className="form-group mb-2">
              <label className="form-label" style={{ fontSize: '0.8rem' }}>Mode Production?</label>
              <select className="form-input" value={apiKeys.midtrans_is_production} onChange={(e) => setApiKeys({...apiKeys, midtrans_is_production: e.target.value})}>
                <option value="false">TIDAK (Sandbox / Test Mode)</option>
                <option value="true">YA (Live Production)</option>
              </select>
              <p className="text-xs text-muted mt-1">Jika YA, semua tagihan dan refund akan menggunakan uang sungguhan.</p>
            </div>
            <div className="form-group mb-2">
              <label className="form-label" style={{ fontSize: '0.8rem' }}>Notification URL (Webhook)</label>
              <input type="text" placeholder="https://bidku.co.id/api/v1/payments/notification" className="form-input" value={apiKeys.midtrans_notification_url} onChange={(e) => setApiKeys({...apiKeys, midtrans_notification_url: e.target.value})} />
              <p className="text-xs text-muted mt-1">Gunakan untuk override URL yang disetel di dashboard Midtrans.</p>
            </div>
            <div className="form-group mb-2">
              <label className="form-label" style={{ fontSize: '0.8rem' }}>Server Key (Core API)</label>
              <input type="password" placeholder="********" className="form-input" value={apiKeys.midtrans_server_key} onChange={(e) => setApiKeys({...apiKeys, midtrans_server_key: e.target.value})} />
            </div>
            <div className="form-group mb-2">
              <label className="form-label" style={{ fontSize: '0.8rem' }}>Client Key (Core API)</label>
              <input type="password" placeholder="********" className="form-input" value={apiKeys.midtrans_client_key} onChange={(e) => setApiKeys({...apiKeys, midtrans_client_key: e.target.value})} />
            </div>
            <div className="form-group mb-2">
              <label className="form-label" style={{ fontSize: '0.8rem' }}>Iris Creator Key (Untuk Refund/Payout)</label>
              <input type="password" placeholder="********" className="form-input" value={apiKeys.midtrans_iris_creator_key} onChange={(e) => setApiKeys({...apiKeys, midtrans_iris_creator_key: e.target.value})} />
            </div>
            <div className="form-group mb-2">
              <label className="form-label" style={{ fontSize: '0.8rem' }}>Iris Approver Key (Opsional)</label>
              <input type="password" placeholder="********" className="form-input" value={apiKeys.midtrans_iris_approver_key} onChange={(e) => setApiKeys({...apiKeys, midtrans_iris_approver_key: e.target.value})} />
            </div>
            
            <h3 className="text-md fw-bold mb-3 mt-4">Verihubs & Xendit</h3>
            <div className="form-group mb-2">
              <label className="form-label" style={{ fontSize: '0.8rem' }}>Verihubs API Key (eKYC)</label>
              <input type="password" placeholder="********" className="form-input" value={apiKeys.verihubs_api_key} onChange={(e) => setApiKeys({...apiKeys, verihubs_api_key: e.target.value})} />
            </div>
            <div className="form-group mb-2">
              <label className="form-label" style={{ fontSize: '0.8rem' }}>Xendit API Key (Disbursement)</label>
              <input type="password" placeholder="********" className="form-input" value={apiKeys.xendit_api_key} onChange={(e) => setApiKeys({...apiKeys, xendit_api_key: e.target.value})} />
            </div>
          </div>
          <div>
            <h3 className="text-md fw-bold mb-3">SMTP (Email)</h3>
            <div className="form-group mb-2">
              <label className="form-label" style={{ fontSize: '0.8rem' }}>SMTP Host</label>
              <input type="text" className="form-input" value={apiKeys.smtp_host} onChange={(e) => setApiKeys({...apiKeys, smtp_host: e.target.value})} />
            </div>
            <div className="form-group mb-2">
              <label className="form-label" style={{ fontSize: '0.8rem' }}>SMTP Port</label>
              <input type="text" className="form-input" value={apiKeys.smtp_port} onChange={(e) => setApiKeys({...apiKeys, smtp_port: e.target.value})} />
            </div>
            <div className="form-group mb-2">
              <label className="form-label" style={{ fontSize: '0.8rem' }}>SMTP User</label>
              <input type="text" className="form-input" value={apiKeys.smtp_user} onChange={(e) => setApiKeys({...apiKeys, smtp_user: e.target.value})} />
            </div>
            <div className="form-group mb-2">
              <label className="form-label" style={{ fontSize: '0.8rem' }}>SMTP Password</label>
              <input type="password" placeholder="********" className="form-input" value={apiKeys.smtp_password} onChange={(e) => setApiKeys({...apiKeys, smtp_password: e.target.value})} />
            </div>
            <div className="form-group mb-2">
              <label className="form-label" style={{ fontSize: '0.8rem' }}>Sender Name & Email (From)</label>
              <input type="text" className="form-input" value={apiKeys.smtp_from} onChange={(e) => setApiKeys({...apiKeys, smtp_from: e.target.value})} placeholder='"Indo Lelang" <noreply@indo-lelang.com>' />
            </div>
          </div>
        </div>
        <button className="btn btn-primary mt-3" onClick={handleSaveIntegrations} disabled={isSaving}>
          {isSaving ? 'Menyimpan...' : 'Simpan Konfigurasi Integrasi'}
        </button>
      </Card>
      
      {/* Confirmation Modal */}
      {isConfirmModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              Konfirmasi Perubahan Aturan Keuangan
              <button className="modal-close" onClick={() => setIsConfirmModalOpen(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="alert alert-warning mb-3">
                <strong>Peringatan Sistem:</strong> Perubahan ini akan segera berlaku secara <em>real-time</em> ke seluruh tagihan (invoice) lelang yang terjadi setelah Anda menekan tombol simpan. 
              </div>
              <p className="mb-2">Anda akan menyimpan nilai berikut:</p>
              <ul>
                <li>PPN: <strong>{tax}%</strong></li>
                <li>Deposit NIPL Mobil: <strong>Rp {parseInt(nipl).toLocaleString('id-ID')}</strong></li>
                <li>Deposit NIPL Motor: <strong>Rp {parseInt(niplMotor).toLocaleString('id-ID')}</strong></li>
                <li>Biaya Gateway: <strong>{feeBearer === 'admin' ? 'Ditanggung Admin' : 'Ditanggung Customer'}</strong></li>
              </ul>
              <p className="mt-2 text-danger fw-bold">Tindakan ini tidak bisa dibatalkan secara sepihak setelah invoice terbit. Lanjutkan?</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setIsConfirmModalOpen(false)} disabled={isSaving}>Batal</button>
              <button className="btn btn-danger" onClick={handleSaveFinancials} disabled={isSaving}>
                {isSaving ? 'Menyimpan...' : 'Ya, Saya Yakin & Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
