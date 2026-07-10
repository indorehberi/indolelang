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
  const [fetchError, setFetchError] = useState<string | null>(null);
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
  
  // BAPL Settings
  const [pejabatPenjual, setPejabatPenjual] = useState('');
  const [pejabatLelang, setPejabatLelang] = useState('');
  const [isSavingBapl, setIsSavingBapl] = useState(false);
  
  // Auction Automation Settings
  const [auctionLotDuration, setAuctionLotDuration] = useState('30');
  const [auctionLotNextDelay, setAuctionLotNextDelay] = useState('10');
  const [auctionSessionStartTrigger, setAuctionSessionStartTrigger] = useState('admin');
  const [auctionLotEndTrigger, setAuctionLotEndTrigger] = useState('admin');
  const [auctionLotNextTrigger, setAuctionLotNextTrigger] = useState('admin');
  const [auctionSessionEndTrigger, setAuctionSessionEndTrigger] = useState('admin');
  
  const [isSavingAuction, setIsSavingAuction] = useState(false);

  // Bidding Room Settings
  const [bidIncrement1, setBidIncrement1] = useState('500000');
  const [bidIncrement2, setBidIncrement2] = useState('1000000');
  const [bidIncrement3, setBidIncrement3] = useState('2000000');
  const [isSavingBidding, setIsSavingBidding] = useState(false);

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

  // Integrations & Payment Modes
  const [apiKeys, setApiKeys] = useState({
    deposit_payment_mode: 'auto',
    manual_transfer_fee: '2500',
    manual_refund_fee: '0',
    deposit_timeout_minutes: '60',
    manual_payment_bank: 'BCA',
    manual_payment_account: '7015886161',
    manual_payment_name: 'PT Indo Lelang Sejahtera',
    midtrans_server_key: '',
    midtrans_client_key: '',
    midtrans_is_production: 'false',
    midtrans_notification_url: '',
    midtrans_iris_creator_key: '',
    midtrans_iris_approver_key: '',
    aws_secret_key: '',
    aws_access_key: '',
    aws_bucket: '',
    aws_endpoint: '',
    smtp_host: '',
    smtp_user: '',
    smtp_password: '',
    smtp_port: '',
    smtp_from: '',
    verihubs_api_key: '',
    xendit_api_key: '',
    bank_inquiry_mode: 'manual',
  });

  const toggleNames: Record<string, string> = {
    feat_live_streaming: 'Live Streaming',
    feat_ekyc_auto: 'EKYC (Otomatis via Pihak Ketiga)',
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
    feat_referral_program: 'Program Referral',
  };



  const fetchSettings = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const cookieMap: Record<string, string> = {};
      if (typeof document !== 'undefined') {
        document.cookie.split(';').forEach((c) => {
          const parts = c.trim().split('=');
          if (parts[0]) cookieMap[parts[0]] = parts[1] || '';
        });
      }

      const loadedToggles: FeatureToggleItem[] = [];
      const newApiKeys = { ...apiKeys };
      let apiFailed = false;

      try {
        const token = localStorage.getItem('accessToken');
        const response = await fetch(apiUrl('/admin/settings'), {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await response.json();
        if (response.ok && data.success) {
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
            } else if (item.key === 'auction_lot_duration_secs') {
              setAuctionLotDuration(item.value);
            } else if (item.key === 'auction_lot_next_delay_secs') {
              setAuctionLotNextDelay(item.value);
            } else if (item.key === 'auction_session_start_trigger') {
              setAuctionSessionStartTrigger(item.value);
            } else if (item.key === 'auction_lot_end_trigger') {
              setAuctionLotEndTrigger(item.value);
            } else if (item.key === 'auction_lot_next_trigger') {
              setAuctionLotNextTrigger(item.value);
            } else if (item.key === 'auction_session_end_trigger') {
              setAuctionSessionEndTrigger(item.value);
            } else if (item.key === 'admin_fee_tiers') {
              try {
                setAdminFeeTiers(JSON.parse(item.value));
              } catch(e) {}
            } else if (item.key === 'bapl_pejabat_penjual') {
              setPejabatPenjual(item.value);
            } else if (item.key === 'bapl_pejabat_lelang') {
              setPejabatLelang(item.value);
            } else if (item.key === 'bid_increment_1') {
              setBidIncrement1(item.value);
            } else if (item.key === 'bid_increment_2') {
              setBidIncrement2(item.value);
            } else if (item.key === 'bid_increment_3') {
              setBidIncrement3(item.value);
            } else if (item.key in newApiKeys) {
              (newApiKeys as any)[item.key] = item.value;
            }
          });
          setApiKeys(newApiKeys);
        } else {
          const errMsg = data.error?.message || `Server merespon dengan status ${response.status}`;
          setFetchError(errMsg);
          apiFailed = true;
        }
      } catch (networkErr: any) {
        setFetchError(`Gagal terhubung ke server: ${networkErr.message || 'Network error'}`);
        apiFailed = true;
      }

      // ensureToggle SELALU dijalankan — baik API sukses maupun gagal
      // Sehingga list toggle tidak pernah kosong
      const ensureToggle = (key: string, defaultValue: string) => {
        if (!loadedToggles.some((t) => t.key === key)) {
          loadedToggles.push({ key, value: cookieMap[key] || defaultValue });
        }
      };

      // Toggle layanan pihak ketiga (dari seed database)
      ensureToggle('feat_live_streaming', 'false');
      ensureToggle('feat_ekyc_auto', 'false');
      ensureToggle('feat_push_notification', 'false');
      ensureToggle('feat_qris_payment', 'false');
      ensureToggle('feat_esign_bast', 'false');
      ensureToggle('feat_auto_refund', 'false');
      ensureToggle('feat_price_alert', 'false');
      ensureToggle('feat_multi_branch', 'true');
      ensureToggle('feat_analytics_dashboard', 'true');
      ensureToggle('feat_audit_trail', 'true');

      // Toggle tipe lelang
      ensureToggle('feat_auction_english', 'true');
      ensureToggle('feat_auction_dutch', 'false');
      ensureToggle('feat_auction_sealed', 'false');
      ensureToggle('feat_auction_timed', 'false');
      ensureToggle('feat_auction_buynow', 'false');
      ensureToggle('feat_auction_group', 'false');

      // Toggle kategori aset
      ensureToggle('feat_category_mobil', 'true');
      ensureToggle('feat_category_motor', 'true');
      ensureToggle('feat_category_properti', 'false');
      ensureToggle('feat_category_heavy', 'false');

      // Toggle fitur lainnya
      ensureToggle('feat_referral_program', 'false');

      setToggles(loadedToggles);
    } catch (e: any) {
      setFetchError(`Terjadi kesalahan tidak terduga: ${e.message || 'Unknown error'}`);
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
    // Payment gateway is disabled platform-wide — always persist manual mode,
    // regardless of whatever value was loaded from a previous configuration.
    const payload = { ...apiKeys, deposit_payment_mode: 'manual' };
    try {
      for (const [k, v] of Object.entries(payload)) {
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

  const handleSaveAuctionSettings = async () => {
    setIsSavingAuction(true);
    const token = localStorage.getItem('accessToken');
    try {
      const updates = [
        { key: 'auction_lot_duration_secs', value: auctionLotDuration },
        { key: 'auction_lot_next_delay_secs', value: auctionLotNextDelay },
        { key: 'auction_session_start_trigger', value: auctionSessionStartTrigger },
        { key: 'auction_lot_end_trigger', value: auctionLotEndTrigger },
        { key: 'auction_lot_next_trigger', value: auctionLotNextTrigger },
        { key: 'auction_session_end_trigger', value: auctionSessionEndTrigger },
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
      alert('Otomatisasi Mesin Lelang berhasil disimpan!');
      fetchSettings();
    } catch (e) {
      alert('Gagal menyimpan otomatisasi mesin lelang.');
    } finally {
      setIsSavingAuction(false);
    }
  };

  const handleSaveBaplSettings = async () => {
    setIsSavingBapl(true);
    const token = localStorage.getItem('accessToken');
    try {
      const updates = [
        { key: 'bapl_pejabat_penjual', value: pejabatPenjual },
        { key: 'bapl_pejabat_lelang', value: pejabatLelang },
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
      alert('Pengaturan Pejabat BAPL berhasil disimpan!');
      fetchSettings();
    } catch (e) {
      alert('Gagal menyimpan pengaturan Pejabat BAPL.');
    } finally {
      setIsSavingBapl(false);
    }
  };

  const handleSaveBiddingSettings = async () => {
    setIsSavingBidding(true);
    try {
      const updates = [
        { key: 'bid_increment_1', value: bidIncrement1.toString() },
        { key: 'bid_increment_2', value: bidIncrement2.toString() },
        { key: 'bid_increment_3', value: bidIncrement3.toString() },
      ];

      const token = localStorage.getItem('accessToken');
      for (const update of updates) {
        await fetch(apiUrl('/admin/settings'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(update),
        });
      }
      alert('Pengaturan Bidding berhasil disimpan!');
    } catch (e) {
      alert('Gagal menyimpan pengaturan Bidding.');
    } finally {
      setIsSavingBidding(false);
    }
  };

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
            <h2 className="card-title">Otomatisasi Mesin Lelang (Auction Engine)</h2>
            <div className="alert alert-warning mt-3 mb-4 text-xs">
              <strong>Perhatian:</strong> Jika mengubah trigger menjadi "Oleh Sistem", backend cron job akan mengambil alih fungsi dari Control Room.
            </div>

            <div className="form-group">
              <label className="form-label">Waktu Tiap Lot (Detik) <span className="required">*</span></label>
              <input type="number" className="form-input" value={auctionLotDuration} onChange={(e) => setAuctionLotDuration(e.target.value)} required />
              <p className="text-xs text-muted mt-1">Default: 30 detik.</p>
            </div>
            
            <div className="form-group">
              <label className="form-label">Jeda Antar Lot (Detik) <span className="required">*</span></label>
              <input type="number" className="form-input" value={auctionLotNextDelay} onChange={(e) => setAuctionLotNextDelay(e.target.value)} required />
              <p className="text-xs text-muted mt-1">Jeda sebelum lot berikutnya dimulai jika menggunakan pemicu sistem.</p>
            </div>

            <div className="form-group">
              <label className="form-label">Sesi Lelang Dimulai Oleh <span className="required">*</span></label>
              <select className="form-input" value={auctionSessionStartTrigger} onChange={(e) => setAuctionSessionStartTrigger(e.target.value)}>
                <option value="admin">Oleh Admin (Manual via Control Room)</option>
                <option value="system">Oleh Sistem (Auto-run Sesuai Jadwal)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Lot Diakhiri / Ketok Palu Oleh <span className="required">*</span></label>
              <select className="form-input" value={auctionLotEndTrigger} onChange={(e) => setAuctionLotEndTrigger(e.target.value)}>
                <option value="admin">Oleh Admin (Manual via Control Room)</option>
                <option value="system">Oleh Sistem (Otomatis saat Waktu Habis)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Lot Berikutnya Dilanjutkan Oleh <span className="required">*</span></label>
              <select className="form-input" value={auctionLotNextTrigger} onChange={(e) => setAuctionLotNextTrigger(e.target.value)}>
                <option value="admin">Oleh Admin (Manual via Control Room)</option>
                <option value="system">Oleh Sistem (Otomatis Setelah Jeda)</option>
              </select>
            </div>
            
            <div className="form-group">
              <label className="form-label">Sesi Diakhiri / Ditutup Oleh <span className="required">*</span></label>
              <select className="form-input" value={auctionSessionEndTrigger} onChange={(e) => setAuctionSessionEndTrigger(e.target.value)}>
                <option value="admin">Oleh Admin (Manual via Control Room)</option>
                <option value="system">Oleh Sistem (Otomatis setelah semua Lot Selesai)</option>
              </select>
            </div>

            <button className="btn btn-warning w-100 mt-2" onClick={handleSaveAuctionSettings} disabled={isSavingAuction}>
              {isSavingAuction ? 'Menyimpan...' : 'Simpan Otomatisasi'}
            </button>
          </Card>

          <div className="mt-4" style={{ backgroundColor: '#f0fdf4', borderColor: '#bbf7d0', borderRadius: 'var(--radius)', border: '1px solid', padding: '1.5rem' }}>
            <h2 className="card-title text-green-800">Pengaturan Dokumen BAPL</h2>
            <div className="alert alert-info mt-3 mb-4 text-xs">
              Pengaturan ini akan digunakan untuk dokumen Berita Acara Pemenang Lelang.
            </div>

            <div className="form-group">
              <label className="form-label text-green-900">Pejabat Penjual <span className="required">*</span></label>
              <input type="text" className="form-input border-green-200 focus:border-green-400" value={pejabatPenjual} onChange={(e) => setPejabatPenjual(e.target.value)} required placeholder="Contoh: Budi Santoso" />
            </div>

            <div className="form-group">
              <label className="form-label text-green-900">Pejabat Lelang Kelas II <span className="required">*</span></label>
              <input type="text" className="form-input border-green-200 focus:border-green-400" value={pejabatLelang} onChange={(e) => setPejabatLelang(e.target.value)} required placeholder="Contoh: CARI AZHARI, S.H." />
            </div>

            <button className="btn btn-primary w-100 mt-2 !bg-green-600 hover:!bg-green-700" onClick={handleSaveBaplSettings} disabled={isSavingBapl}>
              {isSavingBapl ? 'Menyimpan...' : 'Simpan Pengaturan BAPL'}
            </button>
          </div>

          <div className="mt-4" style={{ backgroundColor: '#f5f3ff', borderColor: '#ddd6fe', borderRadius: 'var(--radius)', border: '1px solid', padding: '1.5rem' }}>
            <h2 className="card-title text-purple-800">Pengaturan Bidding Room</h2>
            <div className="alert alert-info mt-3 mb-4 text-xs">
              Parameter yang digunakan pada layar Bidding Bidder (opsi kelipatan bid dan countdown awal).
            </div>

            <div className="form-group">
              <label className="form-label text-purple-900">Bid Increment 1 (Rp)</label>
              <input type="number" className="form-input border-purple-200 focus:border-purple-400" value={bidIncrement1} onChange={(e) => setBidIncrement1(e.target.value)} required />
            </div>

            <div className="form-group">
              <label className="form-label text-purple-900">Bid Increment 2 (Rp)</label>
              <input type="number" className="form-input border-purple-200 focus:border-purple-400" value={bidIncrement2} onChange={(e) => setBidIncrement2(e.target.value)} required />
            </div>

            <div className="form-group">
              <label className="form-label text-purple-900">Bid Increment 3 (Rp)</label>
              <input type="number" className="form-input border-purple-200 focus:border-purple-400" value={bidIncrement3} onChange={(e) => setBidIncrement3(e.target.value)} required />
            </div>

            <p className="text-xs text-muted mt-1">
              Durasi countdown awal lot mengikuti pengaturan "Waktu Tiap Lot (Detik)" di atas (Otomatisasi Mesin Lelang) — satu sumber kebenaran untuk Ruang Kontrol maupun Bidding Room.
            </p>

            <button className="btn btn-primary w-100 mt-2 !bg-purple-600 hover:!bg-purple-700" onClick={handleSaveBiddingSettings} disabled={isSavingBidding}>
              {isSavingBidding ? 'Menyimpan...' : 'Simpan Pengaturan Bidding'}
            </button>
          </div>

          <Card className="mt-4">
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
            
            {fetchError && (
              <div className="alert alert-warning mb-3" style={{ fontSize: '0.85rem' }}>
                <strong>⚠️ Peringatan:</strong> {fetchError}. Menampilkan nilai default. Silakan <a href="/admin/login" style={{ fontWeight: 'bold' }}>login ulang</a> untuk memuat data terbaru dari server.
              </div>
            )}
            
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
            <h3 className="text-md fw-bold mb-3">Mode Pembayaran & Midtrans</h3>
            
            <div className="form-group mb-4" style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: '0.5rem', background: '#f8fafc' }}>
              <label className="form-label fw-bold">Mode Pembayaran Deposit NIPL</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', background: '#fff', border: '1px solid var(--border)', borderRadius: '0.375rem' }}>
                <span className="badge badge-warning">Transfer Manual</span>
                <span className="text-xs text-muted">Payment gateway (Midtrans) belum aktif — semua pembayaran deposit &amp; pelunasan diverifikasi manual oleh admin.</span>
              </div>
            </div>

            <div style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: '0.5rem', marginBottom: '1.5rem', background: '#fff' }}>
              <h4 className="fw-bold text-sm mb-3">Instruksi Transfer Manual (Ditampilkan ke Bidder)</h4>
              <div className="form-group mb-2">
                <label className="form-label" style={{ fontSize: '0.8rem' }}>Nama Bank</label>
                <input type="text" className="form-input" value={apiKeys.manual_payment_bank} onChange={(e) => setApiKeys({...apiKeys, manual_payment_bank: e.target.value})} placeholder="Contoh: BCA" />
              </div>
              <div className="form-group mb-2">
                <label className="form-label" style={{ fontSize: '0.8rem' }}>Nomor Rekening</label>
                <input type="text" className="form-input" value={apiKeys.manual_payment_account} onChange={(e) => setApiKeys({...apiKeys, manual_payment_account: e.target.value})} placeholder="Contoh: 7015886161" />
              </div>
              <div className="form-group mb-2">
                <label className="form-label" style={{ fontSize: '0.8rem' }}>Atas Nama Rekening</label>
                <input type="text" className="form-input" value={apiKeys.manual_payment_name} onChange={(e) => setApiKeys({...apiKeys, manual_payment_name: e.target.value})} placeholder="Contoh: PT Indo Lelang Sejahtera" />
              </div>
            </div>

            <div className="form-group mb-2 mt-3" style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: '0.5rem', background: '#fff' }}>
              <label className="form-label fw-bold" style={{ fontSize: '0.8rem', color: 'var(--danger)' }}>Biaya Transfer (Rp)</label>
              <input type="number" className="form-input" value={apiKeys.manual_transfer_fee} onChange={(e) => setApiKeys({...apiKeys, manual_transfer_fee: e.target.value})} />
              <p className="text-xs text-muted mt-1">Jika isi 0, biaya transfer ditanggung oleh Admin. Jika diisi angka (misal 2500), Bidder wajib membayar biaya ini saat deposit.</p>
              
              <label className="form-label fw-bold mt-3" style={{ fontSize: '0.8rem', color: 'var(--danger)' }}>Biaya Refund (Rp)</label>
              <input type="number" className="form-input" value={apiKeys.manual_refund_fee} onChange={(e) => setApiKeys({...apiKeys, manual_refund_fee: e.target.value})} />
              <p className="text-xs text-muted mt-1">Jika isi 0, biaya refund ditanggung oleh Admin. Jika diisi angka, Bidder akan membayar biaya ini saat beli deposit atau dipotong saat pencairan.</p>

              <label className="form-label fw-bold mt-3" style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>Batas Waktu Pembayaran NIPL (Menit)</label>
              <input type="number" className="form-input" value={apiKeys.deposit_timeout_minutes} onChange={(e) => setApiKeys({...apiKeys, deposit_timeout_minutes: e.target.value})} />
              <p className="text-xs text-muted mt-1">Waktu hitung mundur (countdown) yang diberikan kepada bidder untuk menyelesaikan pembayaran NIPL sebelum dibatalkan.</p>
            </div>

            <details className="mb-2" style={{ padding: '0.75rem 1rem', border: '1px dashed var(--border)', borderRadius: '0.5rem', background: '#f8fafc' }}>
              <summary style={{ cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Konfigurasi Midtrans (belum digunakan — payment gateway nonaktif)</summary>
              <div className="form-group mb-2 mt-3">
                <label className="form-label" style={{ fontSize: '0.8rem' }}>Mode Production?</label>
                <select className="form-input" value={apiKeys.midtrans_is_production} onChange={(e) => setApiKeys({...apiKeys, midtrans_is_production: e.target.value})}>
                  <option value="false">TIDAK (Sandbox / Test Mode)</option>
                  <option value="true">YA (Live Production)</option>
                </select>
              </div>
              <div className="form-group mb-2">
                <label className="form-label" style={{ fontSize: '0.8rem' }}>Notification URL (Webhook)</label>
                <input type="text" placeholder="https://bidku.co.id/api/v1/payments/notification" className="form-input" value={apiKeys.midtrans_notification_url} onChange={(e) => setApiKeys({...apiKeys, midtrans_notification_url: e.target.value})} />
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
            </details>

            <h3 className="text-md fw-bold mb-3 mt-4">Amazon S3 / Cloudflare R2 (Penyimpanan Foto)</h3>
            <div className="form-group mb-2">
              <label className="form-label" style={{ fontSize: '0.8rem' }}>S3 Bucket Name</label>
              <input type="text" placeholder="indo-lelang-bucket" className="form-input" value={apiKeys.aws_bucket} onChange={(e) => setApiKeys({...apiKeys, aws_bucket: e.target.value})} />
            </div>
            <div className="form-group mb-2">
              <label className="form-label" style={{ fontSize: '0.8rem' }}>S3 Access Key</label>
              <input type="password" placeholder="********" className="form-input" value={apiKeys.aws_access_key} onChange={(e) => setApiKeys({...apiKeys, aws_access_key: e.target.value})} />
            </div>
            <div className="form-group mb-2">
              <label className="form-label" style={{ fontSize: '0.8rem' }}>S3 Secret Key</label>
              <input type="password" placeholder="********" className="form-input" value={apiKeys.aws_secret_key} onChange={(e) => setApiKeys({...apiKeys, aws_secret_key: e.target.value})} />
            </div>
            <div className="form-group mb-2">
              <label className="form-label" style={{ fontSize: '0.8rem' }}>S3 Endpoint URL (Khusus Cloudflare R2 / MinIO)</label>
              <input type="text" placeholder="https://<ACCOUNT_ID>.r2.cloudflarestorage.com" className="form-input" value={apiKeys.aws_endpoint} onChange={(e) => setApiKeys({...apiKeys, aws_endpoint: e.target.value})} />
              <p className="text-xs text-muted mt-1">Biarkan kosong jika menggunakan AWS S3 biasa. Wajib diisi jika menggunakan Cloudflare R2.</p>
            </div>
            
            <h3 className="text-md fw-bold mb-3 mt-4">Verihubs & Validasi Rekening Bank</h3>
            <div className="form-group mb-2" style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: '0.5rem', background: '#f8fafc' }}>
              <label className="form-label fw-bold">Mode Validasi Rekening Bidder</label>
              <select className="form-input" value={apiKeys.bank_inquiry_mode || 'manual'} onChange={(e) => setApiKeys({...apiKeys, bank_inquiry_mode: e.target.value})}>
                <option value="auto">Otomatis (Validasi API Xendit)</option>
                <option value="manual">Manual (Isi Nama & Konfirmasi Nomor Saja)</option>
              </select>
              <p className="text-xs text-muted mt-1">Jika Manual, Bidder diminta mengetik nama rekeningnya sendiri tanpa kena biaya validasi.</p>
            </div>
            
            <div className="form-group mb-2">
              <label className="form-label" style={{ fontSize: '0.8rem' }}>Verihubs API Key (eKYC)</label>
              <input type="password" placeholder="********" className="form-input" value={apiKeys.verihubs_api_key} onChange={(e) => setApiKeys({...apiKeys, verihubs_api_key: e.target.value})} />
            </div>
            
            {apiKeys.bank_inquiry_mode === 'auto' && (
              <div className="form-group mb-2">
                <label className="form-label" style={{ fontSize: '0.8rem' }}>Xendit API Key (Disbursement & Validasi Bank)</label>
                <input type="password" placeholder="********" className="form-input" value={apiKeys.xendit_api_key} onChange={(e) => setApiKeys({...apiKeys, xendit_api_key: e.target.value})} />
              </div>
            )}
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
