'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import { apiFetch } from '../../../lib/api';
import { useToast } from '../../../providers/ToastProvider';

interface SettingUpdate {
  key: string;
  value: string;
}

interface FeatureToggleItem {
  key: string;
  value: string;
}

export default function PlatformSettingsPage() {
  const toast = useToast();
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

  // BAPL Settings
  const [pejabatPenjual, setPejabatPenjual] = useState('');
  const [pejabatLelang, setPejabatLelang] = useState('');
  const [isSavingBapl, setIsSavingBapl] = useState(false);
  
  // Auction Automation Settings
  // "Waktu pertama": initial countdown for a lot, and the value the clock
  // resets to on a bid while more than "waktu kedua" seconds remain.
  const [auctionLotDuration, setAuctionLotDuration] = useState('120');
  // "Waktu kedua": once the clock has counted down to this many seconds or
  // less, a bid only resets it back to this value (not the full first-phase
  // duration) — so late bidding can't keep dragging the timer back up.
  const [auctionLotSecondDuration, setAuctionLotSecondDuration] = useState('60');
  const [auctionLotNextDelay, setAuctionLotNextDelay] = useState('10');
  const [auctionLotCanceledDuration, setAuctionLotCanceledDuration] = useState('5');
  const [auctionSessionStartTrigger, setAuctionSessionStartTrigger] = useState('admin');
  const [auctionLotEndTrigger, setAuctionLotEndTrigger] = useState('admin');
  const [auctionLotNextTrigger, setAuctionLotNextTrigger] = useState('admin');
  const [auctionSessionEndTrigger, setAuctionSessionEndTrigger] = useState('admin');
  
  const [isSavingAuction, setIsSavingAuction] = useState(false);

  // Bidding Room Settings
  const [bidIncrement1, setBidIncrement1] = useState('500000');
  const [isSavingBidding, setIsSavingBidding] = useState(false);

  // New financial settings
  const [pmk41, setPmk41] = useState('1.1');
  const [dppLain, setDppLain] = useState('11/12');
  const [ppnDppLain, setPpnDppLain] = useState('12');
  const [pph23, setPph23] = useState('2');
  const [adminFeeTiers, setAdminFeeTiers] = useState<any[]>([
    { max_price: null, fee_type: 'flat', fee: 5000000 }
  ]);
  
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testEmailTo, setTestEmailTo] = useState('');

  // Saving states for financial rules sections
  const [isSavingDeposit, setIsSavingDeposit] = useState(false);
  const [isSavingTax, setIsSavingTax] = useState(false);
  const [isSavingAdminFee, setIsSavingAdminFee] = useState(false);

  // Saving states for integrations sections
  const [isSavingPaymentMode, setIsSavingPaymentMode] = useState(false);
  const [isSavingManualTransfer, setIsSavingManualTransfer] = useState(false);
  const [isSavingFeeTimeout, setIsSavingFeeTimeout] = useState(false);
  const [isSavingS3, setIsSavingS3] = useState(false);
  const [isSavingVerihubs, setIsSavingVerihubs] = useState(false);
  const [isSavingSMTP, setIsSavingSMTP] = useState(false);

  // Sold Lots Visibility configuration popup states
  const [isSoldLotsModalOpen, setIsSoldLotsModalOpen] = useState(false);
  const [soldLots, setSoldLots] = useState<any[]>([]);
  const [selectedVisibleLotIds, setSelectedVisibleLotIds] = useState<string[]>([]);
  const [filterTitle, setFilterTitle] = useState('');
  const [filterNoPolisi, setFilterNoPolisi] = useState('');

  const fetchSoldLots = async () => {
    try {
      const res = await apiFetch('/admin/lots?status=sold&per_page=100');
      const data = await res.json();
      if (res.ok && data.success) {
        setSoldLots(data.data || []);
      }
    } catch (e) {
      toast.error("Gagal memuat daftar lot terjual");
    }
  };

  const loadVisibleSoldLotIds = async () => {
    try {
      const res = await apiFetch('/admin/settings/feat_visible_sold_lot_ids');
      const data = await res.json();
      if (res.ok && data.success && data.data?.value) {
        setSelectedVisibleLotIds(JSON.parse(data.data.value));
      } else {
        setSelectedVisibleLotIds([]);
      }
    } catch (e) {
      setSelectedVisibleLotIds([]);
    }
  };

  const filteredSoldLots = soldLots.filter((lot) => {
    const title = (lot.asset?.title || "").toLowerCase();
    const brand = (lot.asset?.brand || "").toLowerCase();
    const model = (lot.asset?.model || "").toLowerCase();
    const police = (lot.asset?.police_number || "").toLowerCase();
    
    const matchTitle = !filterTitle || title.includes(filterTitle.toLowerCase()) || brand.includes(filterTitle.toLowerCase()) || model.includes(filterTitle.toLowerCase());
    const matchPolice = !filterNoPolisi || police.includes(filterNoPolisi.toLowerCase());
    
    return matchTitle && matchPolice;
  });

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
    feat_payment_gateway_auto: 'Payment Gateway (Otomatis)',
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
    feat_show_sold_history: 'Tampilkan Riwayat Lot Terjual (PWA)',
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

      const loadedToggles: FeatureToggleItem[] = [];
      const newApiKeys = { ...apiKeys };

      try {
        const response = await apiFetch('/admin/settings');
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
            } else if (item.key === 'auction_lot_second_duration_secs') {
              setAuctionLotSecondDuration(item.value);
            } else if (item.key === 'auction_lot_next_delay_secs') {
              setAuctionLotNextDelay(item.value);
            } else if (item.key === 'auction_lot_canceled_duration_secs') {
              setAuctionLotCanceledDuration(item.value);
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
                const parsed = JSON.parse(item.value);
                if (Array.isArray(parsed)) {
                  setAdminFeeTiers(parsed.map((t: any) => ({
                    max_price: t.max_price !== undefined ? t.max_price : null,
                    fee_type: t.fee_type || 'flat',
                    fee: t.fee !== undefined ? t.fee : 0
                  })));
                }
              } catch(e) {}
            } else if (item.key === 'bapl_pejabat_penjual') {
              setPejabatPenjual(item.value);
            } else if (item.key === 'bapl_pejabat_lelang') {
              setPejabatLelang(item.value);
            } else if (item.key === 'bid_increment_1') {
              setBidIncrement1(item.value);
            } else if (item.key in newApiKeys) {
              (newApiKeys as any)[item.key] = item.value;
            }
          });
          setApiKeys(newApiKeys);
        } else {
          const errMsg = data.error?.message || `Server merespon dengan status ${response.status}`;
          toast.warning(`Gagal memuat pengaturan: ${errMsg}. Menampilkan nilai default.`);
        }
      } catch (networkErr: any) {
        toast.warning(`Gagal terhubung ke server: ${networkErr.message || 'Network error'}. Menampilkan nilai default.`);
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
      ensureToggle('feat_show_sold_history', 'false');

      setToggles(loadedToggles);
    } catch (e: any) {
      toast.warning(`Terjadi kesalahan tidak terduga: ${e.message || 'Unknown error'}. Menampilkan nilai default.`);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Save a batch of settings, checking each response individually so a
   * silent 401/500 can never masquerade as a successful save.
   */
  const saveSettings = async (updates: SettingUpdate[]): Promise<{ ok: boolean; failedKeys: string[] }> => {
    const failedKeys: string[] = [];
    for (const update of updates) {
      const response = await apiFetch(`/admin/settings/${update.key}`, {
        method: 'PUT',
        body: JSON.stringify({ value: update.value }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.success) {
        failedKeys.push(update.key);
      }
    }
    return { ok: failedKeys.length === 0, failedKeys };
  };

  const handleToggle = async (key: string, currentValue: string) => {
    const newValue = currentValue === 'true' ? 'false' : 'true';
    try {
      const response = await apiFetch(`/admin/settings/${key}`, {
        method: 'PUT',
        body: JSON.stringify({ value: newValue }),
      });
      const data = await response.json().catch(() => null);
      if (response.ok && data?.success) {
        // Only mirror the change into the cookie once the server confirms it,
        // so a failed save can never masquerade as a successful toggle.
        if (typeof document !== 'undefined') {
          document.cookie = `${key}=${newValue}; path=/; max-age=31536000;`;
        }
        toast.success(`Fitur ${key} berhasil diubah menjadi ${newValue === 'true' ? 'AKTIF' : 'NONAKTIF'}!`);
        fetchSettings();

        // Open Sold Lots visibility configuration modal if turned ON
        if (key === 'feat_show_sold_history' && newValue === 'true') {
          await fetchSoldLots();
          await loadVisibleSoldLotIds();
          setIsSoldLotsModalOpen(true);
        }
      } else {
        toast.error(data?.error?.message || `Gagal mengubah fitur ${key}. Perubahan tidak tersimpan di server.`);
      }
    } catch (e: any) {
      toast.error(`Gagal mengubah fitur ${key}. Periksa koneksi Anda.`);
    }
  };

  const handleSaveIntegrations = async () => {
    setIsSaving(true);
    // Payment gateway is disabled platform-wide — always persist manual mode,
    // regardless of whatever value was loaded from a previous configuration.
    const payload = { ...apiKeys, deposit_payment_mode: 'manual' };
    const updates = Object.entries(payload)
      .filter(([, v]) => v !== undefined && v !== '')
      .map(([key, value]) => ({ key, value: String(value) }));
    try {
      const { ok, failedKeys } = await saveSettings(updates);
      await fetchSettings();
      if (ok) {
        toast.success('Integrasi Pihak Ketiga berhasil disimpan dan dienkripsi!');
      } else {
        toast.error(`Sebagian pengaturan gagal disimpan: ${failedKeys.join(', ')}`);
      }
    } catch (e) {
      toast.error('Gagal menyimpan Integrasi. Periksa koneksi Anda.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestEmail = async () => {
    const target = testEmailTo.trim();
    if (!target) {
      toast.error('Masukkan alamat email tujuan pengujian.');
      return;
    }
    setIsSendingTest(true);
    try {
      const res = await apiFetch('/admin/settings/test-email', {
        method: 'POST',
        body: JSON.stringify({ to: target }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.success) {
        toast.success(`✅ Email uji berhasil dikirim ke ${target}. Periksa kotak masuk Anda.`);
      } else {
        toast.error(data?.error?.message || 'Gagal mengirim email uji. Periksa konfigurasi SMTP.');
      }
    } catch (e: any) {
      toast.error(`Koneksi gagal: ${e.message}`);
    } finally {
      setIsSendingTest(false);
    }
  };


  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveAuctionSettings = async () => {
    if (Number(auctionLotSecondDuration) >= Number(auctionLotDuration)) {
      toast.error('Waktu Kedua harus lebih kecil dari Waktu Pertama.');
      return;
    }

    setIsSavingAuction(true);
    try {
      const updates = [
        { key: 'auction_lot_duration_secs', value: auctionLotDuration },
        { key: 'auction_lot_second_duration_secs', value: auctionLotSecondDuration },
        { key: 'auction_lot_next_delay_secs', value: auctionLotNextDelay },
        { key: 'auction_lot_canceled_duration_secs', value: auctionLotCanceledDuration },
        { key: 'auction_session_start_trigger', value: auctionSessionStartTrigger },
        { key: 'auction_lot_end_trigger', value: auctionLotEndTrigger },
        { key: 'auction_lot_next_trigger', value: auctionLotNextTrigger },
        { key: 'auction_session_end_trigger', value: auctionSessionEndTrigger },
      ];

      const { ok, failedKeys } = await saveSettings(updates);
      await fetchSettings();
      if (ok) {
        toast.success('Otomatisasi Mesin Lelang berhasil disimpan!');
      } else {
        toast.error(`Sebagian pengaturan gagal disimpan: ${failedKeys.join(', ')}`);
      }
    } catch (e) {
      toast.error('Gagal menyimpan otomatisasi mesin lelang. Periksa koneksi Anda.');
    } finally {
      setIsSavingAuction(false);
    }
  };

  const handleSaveBaplSettings = async () => {
    setIsSavingBapl(true);
    try {
      const updates = [
        { key: 'bapl_pejabat_penjual', value: pejabatPenjual },
        { key: 'bapl_pejabat_lelang', value: pejabatLelang },
      ];

      const { ok, failedKeys } = await saveSettings(updates);
      await fetchSettings();
      if (ok) {
        toast.success('Pengaturan Pejabat BAPL berhasil disimpan!');
      } else {
        toast.error(`Sebagian pengaturan gagal disimpan: ${failedKeys.join(', ')}`);
      }
    } catch (e) {
      toast.error('Gagal menyimpan pengaturan Pejabat BAPL. Periksa koneksi Anda.');
    } finally {
      setIsSavingBapl(false);
    }
  };

  const handleSaveBiddingSettings = async () => {
    setIsSavingBidding(true);
    try {
      const updates = [
        { key: 'bid_increment_1', value: bidIncrement1.toString() },
      ];

      const { ok, failedKeys } = await saveSettings(updates);
      await fetchSettings();
      if (ok) {
        toast.success('Pengaturan Bidding berhasil disimpan!');
      } else {
        toast.error(`Sebagian pengaturan gagal disimpan: ${failedKeys.join(', ')}`);
      }
    } catch (e) {
      toast.error('Gagal menyimpan pengaturan Bidding. Periksa koneksi Anda.');
    } finally {
      setIsSavingBidding(false);
    }
  };

  const handleSaveDepositSettings = async () => {
    if (!nipl || !niplMotor) {
      toast.error('Deposit NIPL tidak boleh kosong.');
      return;
    }
    setIsSavingDeposit(true);
    try {
      const updates = [
        { key: 'nipl_deposit_amount', value: nipl },
        { key: 'nipl_motor_deposit_amount', value: niplMotor },
        { key: 'fee_bearer_deposit', value: feeBearerDeposit },
        { key: 'fee_bearer_refund', value: feeBearerRefund },
        { key: 'fee_bearer_pelunasan', value: feeBearerPelunasan },
        { key: 'fee_bearer_settlement', value: feeBearerSettlement },
      ];
      const { ok, failedKeys } = await saveSettings(updates);
      await fetchSettings();
      if (ok) {
        toast.success('Pengaturan Deposit berhasil disimpan!');
      } else {
        toast.error(`Sebagian pengaturan gagal disimpan: ${failedKeys.join(', ')}`);
      }
    } catch (e) {
      toast.error('Gagal menyimpan pengaturan deposit.');
    } finally {
      setIsSavingDeposit(false);
    }
  };

  const handleSaveTaxSettings = async () => {
    if (!tax || !pmk41 || !dppLain || !ppnDppLain || !pph23) {
      toast.error('Semua bidang pajak dan potongan harus diisi.');
      return;
    }
    setIsSavingTax(true);
    try {
      const updates = [
        { key: 'tax_percentage', value: tax },
        { key: 'pmk41_percentage', value: pmk41 },
        { key: 'dpp_lain_multiplier', value: dppLain },
        { key: 'ppn_dpp_lain_percentage', value: ppnDppLain },
        { key: 'pph23_percentage', value: pph23 },
      ];
      const { ok, failedKeys } = await saveSettings(updates);
      setIsConfirmModalOpen(false);
      await fetchSettings();
      if (ok) {
        toast.success('Persentase pajak & potongan berhasil disimpan!');
      } else {
        toast.error(`Sebagian pengaturan gagal disimpan: ${failedKeys.join(', ')}`);
      }
    } catch (e) {
      toast.error('Gagal menyimpan pajak & potongan.');
    } finally {
      setIsSavingTax(false);
    }
  };

  const handleSaveAdminFeeSettings = async () => {
    setIsSavingAdminFee(true);
    try {
      const updates = [
        { key: 'admin_fee_tiers', value: JSON.stringify(adminFeeTiers) },
      ];
      const { ok, failedKeys } = await saveSettings(updates);
      await fetchSettings();
      if (ok) {
        toast.success('Tiered Admin Fee berhasil disimpan!');
      } else {
        toast.error(`Sebagian pengaturan gagal disimpan: ${failedKeys.join(', ')}`);
      }
    } catch (e) {
      toast.error('Gagal menyimpan Tiered Admin Fee.');
    } finally {
      setIsSavingAdminFee(false);
    }
  };

  const handleSavePaymentMode = async () => {
    setIsSavingPaymentMode(true);
    try {
      const updates = [
        { key: 'deposit_payment_mode', value: apiKeys.deposit_payment_mode },
        { key: 'midtrans_is_production', value: apiKeys.midtrans_is_production },
        { key: 'midtrans_notification_url', value: apiKeys.midtrans_notification_url },
        { key: 'midtrans_server_key', value: apiKeys.midtrans_server_key },
        { key: 'midtrans_client_key', value: apiKeys.midtrans_client_key },
        { key: 'midtrans_iris_creator_key', value: apiKeys.midtrans_iris_creator_key },
        { key: 'midtrans_iris_approver_key', value: apiKeys.midtrans_iris_approver_key },
      ];
      const { ok, failedKeys } = await saveSettings(updates);
      await fetchSettings();
      if (ok) {
        toast.success('Mode Pembayaran & Midtrans berhasil disimpan!');
      } else {
        toast.error(`Gagal menyimpan: ${failedKeys.join(', ')}`);
      }
    } catch (e) {
      toast.error('Gagal menyimpan konfigurasi pembayaran.');
    } finally {
      setIsSavingPaymentMode(false);
    }
  };

  const handleSaveManualTransfer = async () => {
    setIsSavingManualTransfer(true);
    try {
      const updates = [
        { key: 'manual_payment_bank', value: apiKeys.manual_payment_bank },
        { key: 'manual_payment_account', value: apiKeys.manual_payment_account },
        { key: 'manual_payment_name', value: apiKeys.manual_payment_name },
      ];
      const { ok, failedKeys } = await saveSettings(updates);
      await fetchSettings();
      if (ok) {
        toast.success('Instruksi Transfer Manual berhasil disimpan!');
      } else {
        toast.error(`Gagal menyimpan: ${failedKeys.join(', ')}`);
      }
    } catch (e) {
      toast.error('Gagal menyimpan instruksi manual.');
    } finally {
      setIsSavingManualTransfer(false);
    }
  };

  const handleSaveFeeTimeout = async () => {
    setIsSavingFeeTimeout(true);
    try {
      const updates = [
        { key: 'manual_transfer_fee', value: apiKeys.manual_transfer_fee },
        { key: 'manual_refund_fee', value: apiKeys.manual_refund_fee },
        { key: 'deposit_timeout_minutes', value: apiKeys.deposit_timeout_minutes },
      ];
      const { ok, failedKeys } = await saveSettings(updates);
      await fetchSettings();
      if (ok) {
        toast.success('Biaya Transfer, Refund & Timeout berhasil disimpan!');
      } else {
        toast.error(`Gagal menyimpan: ${failedKeys.join(', ')}`);
      }
    } catch (e) {
      toast.error('Gagal menyimpan biaya & timeout.');
    } finally {
      setIsSavingFeeTimeout(false);
    }
  };

  const handleSaveS3 = async () => {
    setIsSavingS3(true);
    try {
      const updates = [
        { key: 'aws_bucket', value: apiKeys.aws_bucket },
        { key: 'aws_access_key', value: apiKeys.aws_access_key },
        { key: 'aws_secret_key', value: apiKeys.aws_secret_key },
        { key: 'aws_endpoint', value: apiKeys.aws_endpoint },
      ];
      const { ok, failedKeys } = await saveSettings(updates);
      await fetchSettings();
      if (ok) {
        toast.success('Konfigurasi S3 / R2 berhasil disimpan!');
      } else {
        toast.error(`Gagal menyimpan: ${failedKeys.join(', ')}`);
      }
    } catch (e) {
      toast.error('Gagal menyimpan konfigurasi S3.');
    } finally {
      setIsSavingS3(false);
    }
  };

  const handleSaveVerihubs = async () => {
    setIsSavingVerihubs(true);
    try {
      const updates = [
        { key: 'verihubs_api_key', value: apiKeys.verihubs_api_key },
        { key: 'bank_inquiry_mode', value: apiKeys.bank_inquiry_mode },
        { key: 'xendit_api_key', value: apiKeys.xendit_api_key },
      ];
      const { ok, failedKeys } = await saveSettings(updates);
      await fetchSettings();
      if (ok) {
        toast.success('Verihubs & Validasi Rekening berhasil disimpan!');
      } else {
        toast.error(`Gagal menyimpan: ${failedKeys.join(', ')}`);
      }
    } catch (e) {
      toast.error('Gagal menyimpan konfigurasi Verihubs.');
    } finally {
      setIsSavingVerihubs(false);
    }
  };

  const handleSaveSmtp = async () => {
    setIsSavingSMTP(true);
    try {
      const updates = [
        { key: 'smtp_host', value: apiKeys.smtp_host },
        { key: 'smtp_port', value: apiKeys.smtp_port },
        { key: 'smtp_user', value: apiKeys.smtp_user },
        { key: 'smtp_password', value: apiKeys.smtp_password },
        { key: 'smtp_from', value: apiKeys.smtp_from },
      ];
      const { ok, failedKeys } = await saveSettings(updates);
      await fetchSettings();
      if (ok) {
        toast.success('Konfigurasi SMTP berhasil disimpan!');
      } else {
        toast.error(`Gagal menyimpan: ${failedKeys.join(', ')}`);
      }
    } catch (e) {
      toast.error('Gagal menyimpan konfigurasi SMTP.');
    } finally {
      setIsSavingSMTP(false);
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
              <label className="form-label">Waktu Pertama (Detik) <span className="required">*</span></label>
              <input type="number" className="form-input" value={auctionLotDuration} onChange={(e) => setAuctionLotDuration(e.target.value)} required />
              <p className="text-xs text-muted mt-1">
                Durasi awal countdown tiap lot. Selama sisa waktu masih di atas "Waktu Kedua", bid baru akan mengembalikan countdown ke durasi ini. Default: 120 detik.
              </p>
            </div>

            <div className="form-group">
              <label className="form-label">Waktu Kedua (Detik) <span className="required">*</span></label>
              <input type="number" className="form-input" value={auctionLotSecondDuration} onChange={(e) => setAuctionLotSecondDuration(e.target.value)} required />
              <p className="text-xs text-muted mt-1">
                Begitu sisa waktu sudah turun ke angka ini atau kurang, bid baru hanya mengembalikan countdown ke durasi ini (tidak lagi ke Waktu Pertama). Harus lebih kecil dari Waktu Pertama. Default: 60 detik.
              </p>
            </div>

            <div className="form-group mb-3">
              <label>Jeda Transisi Lot (detik)</label>
              <input type="number" className="form-input" value={auctionLotNextDelay} onChange={(e) => setAuctionLotNextDelay(e.target.value)} required />
              <small className="text-muted">Lama waktu tunggu setelah ketok palu sebelum lot berikutnya dimulai.</small>
            </div>
            <div className="form-group mb-3">
              <label>Durasi Tampil Lot Dibatalkan (detik)</label>
              <input type="number" className="form-input" value={auctionLotCanceledDuration} onChange={(e) => setAuctionLotCanceledDuration(e.target.value)} required />
              <small className="text-muted">Lama waktu tayang (freeze) untuk lot yang dibatalkan sebelum otomatis lanjut ke lot berikutnya.</small>
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
              Parameter yang digunakan pada layar Bidding Bidder (kelipatan bid dan countdown awal).
            </div>

            <div className="form-group">
              <label className="form-label text-purple-900">Bid Increment (Rp)</label>
              <input type="number" className="form-input border-purple-200 focus:border-purple-400" value={bidIncrement1} onChange={(e) => setBidIncrement1(e.target.value)} required />
            </div>

            <p className="text-xs text-muted mt-1">
              Durasi countdown awal lot serta perilaku reset saat ada bid mengikuti pengaturan "Waktu Pertama" dan "Waktu Kedua" di atas (Otomatisasi Mesin Lelang) — satu sumber kebenaran untuk Ruang Kontrol maupun Bidding Room.
            </p>

            <button className="btn btn-primary w-100 mt-2 !bg-purple-600 hover:!bg-purple-700" onClick={handleSaveBiddingSettings} disabled={isSavingBidding}>
              {isSavingBidding ? 'Menyimpan...' : 'Simpan Pengaturan Bidding'}
            </button>
          </div>

          <Card className="mt-4">
            <h2 className="card-title">Aturan Keuangan: Deposit Jaminan</h2>
            <div className="form-group mt-3">
              <label className="form-label">Deposit Jaminan NIPL Kendaraan (Rp) <span className="required">*</span></label>
              <input type="number" className="form-input" value={nipl} onChange={(e) => setNipl(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Deposit Jaminan NIPL Motor (Rp) <span className="required">*</span></label>
              <input type="number" className="form-input" value={niplMotor} onChange={(e) => setNiplMotor(e.target.value)} required />
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

            <button className="btn btn-primary w-100" onClick={handleSaveDepositSettings} disabled={isSavingDeposit}>
              {isSavingDeposit ? 'Menyimpan...' : 'Simpan Pengaturan Deposit'}
            </button>
          </Card>

          <Card className="mt-4">
            <h2 className="card-title">Aturan Keuangan: Pajak &amp; Potongan</h2>
            
            <div className="form-group mt-3">
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

            <button className="btn btn-primary w-100" onClick={() => setIsConfirmModalOpen(true)}>
              Simpan Pajak &amp; Potongan
            </button>
          </Card>

          <Card className="mt-4">
            <h2 className="card-title">Aturan Keuangan: Tiered Admin Fee (Untuk Bidder)</h2>
            <div className="alert alert-secondary text-xs mt-3 mb-3">
              Kosongkan batas harga maksimal pada baris terakhir untuk menetapkan fee tanpa batas atas (<i>Unlimited</i>).
            </div>
            
            <div className="table-responsive mb-3">
              <table className="table table-sm table-bordered">
                <thead className="table-light">
                  <tr>
                    <th>Batas Harga Terbentuk (Max)</th>
                    <th>Tipe Admin Fee</th>
                    <th>Nominal / Persentase Fee</th>
                    <th style={{ width: '80px', textAlign: 'center' }}>Aksi</th>
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
                        <select
                          className="form-input"
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.875rem' }}
                          value={tier.fee_type || 'flat'}
                          onChange={(e) => {
                            const newTiers = [...adminFeeTiers];
                            newTiers[index].fee_type = e.target.value;
                            setAdminFeeTiers(newTiers);
                          }}
                        >
                          <option value="flat">Flat (Rp)</option>
                          <option value="percentage">Persentase (%)</option>
                        </select>
                      </td>
                      <td>
                        <input 
                          type="number" 
                          step="0.01"
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
                      <td style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className="btn btn-sm btn-danger"
                          style={{ padding: '0.25rem 0.5rem' }}
                          onClick={() => {
                            if (window.confirm("Yakin ingin menghapus Tier ini?")) {
                              const newTiers = adminFeeTiers.filter((_, idx) => idx !== index);
                              setAdminFeeTiers(newTiers);
                            }
                          }}
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button 
                className="btn btn-outline-primary btn-sm"
                onClick={() => setAdminFeeTiers([...adminFeeTiers, { max_price: null, fee_type: 'flat', fee: 0 }])}
              >
                + Tambah Tier
              </button>
            </div>
            
            <button className="btn btn-primary w-100" onClick={handleSaveAdminFeeSettings} disabled={isSavingAdminFee}>
              {isSavingAdminFee ? 'Menyimpan...' : 'Simpan Tiered Admin Fee'}
            </button>
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
                        <td>
                          <strong>{toggleNames[item.key] || item.key.replace('feat_', '').replace(/_/g, ' ').toUpperCase()}</strong>
                          {item.key === 'feat_show_sold_history' && item.value === 'true' && (
                            <button
                              type="button"
                              className="btn btn-link btn-xs"
                              style={{ padding: 0, marginLeft: '8px', fontSize: '0.75rem', color: 'var(--primary)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '2px' }}
                              onClick={async () => {
                                await fetchSoldLots();
                                await loadVisibleSoldLotIds();
                                setIsSoldLotsModalOpen(true);
                              }}
                            >
                              ⚙️ Atur Lot Terpilih
                            </button>
                          )}
                        </td>
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
      
      {/* Integrations Column - Split into 6 separate Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '1.5rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Card 1: Mode Pembayaran Deposit NIPL */}
          <Card>
            <h3 className="text-md fw-bold mb-3">Mode Pembayaran Deposit NIPL</h3>
            <div className="form-group mb-4" style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: '0.5rem', background: '#f8fafc' }}>
              <label className="form-label fw-bold">Mode Pembayaran</label>
              <select 
                className="form-input"
                value={apiKeys.deposit_payment_mode} 
                onChange={(e) => setApiKeys({...apiKeys, deposit_payment_mode: e.target.value})}
              >
                <option value="manual">Transfer Manual</option>
                <option value="auto">Otomatis (Midtrans)</option>
              </select>
            </div>

            <details className="mb-3" style={{ padding: '0.75rem 1rem', border: '1px dashed var(--border)', borderRadius: '0.5rem', background: '#f8fafc' }}>
              <summary style={{ cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Konfigurasi Midtrans</summary>
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

            <button className="btn btn-primary w-100" onClick={handleSavePaymentMode} disabled={isSavingPaymentMode}>
              {isSavingPaymentMode ? 'Menyimpan...' : 'Simpan Mode Pembayaran'}
            </button>
          </Card>

          {/* Card 2: Instruksi Transfer Manual */}
          <Card>
            <h3 className="fw-bold text-sm mb-3">Instruksi Transfer Manual (Ditampilkan ke Bidder)</h3>
            <div className="form-group mb-2">
              <label className="form-label" style={{ fontSize: '0.8rem' }}>Nama Bank</label>
              <input type="text" className="form-input" value={apiKeys.manual_payment_bank} onChange={(e) => setApiKeys({...apiKeys, manual_payment_bank: e.target.value})} placeholder="Contoh: BCA" />
            </div>
            <div className="form-group mb-2">
              <label className="form-label" style={{ fontSize: '0.8rem' }}>Nomor Rekening</label>
              <input type="text" className="form-input" value={apiKeys.manual_payment_account} onChange={(e) => setApiKeys({...apiKeys, manual_payment_account: e.target.value})} placeholder="Contoh: 7015886161" />
            </div>
            <div className="form-group mb-3">
              <label className="form-label" style={{ fontSize: '0.8rem' }}>Atas Nama Rekening</label>
              <input type="text" className="form-input" value={apiKeys.manual_payment_name} onChange={(e) => setApiKeys({...apiKeys, manual_payment_name: e.target.value})} placeholder="Contoh: PT Indo Lelang Sejahtera" />
            </div>

            <button className="btn btn-primary w-100" onClick={handleSaveManualTransfer} disabled={isSavingManualTransfer}>
              {isSavingManualTransfer ? 'Menyimpan...' : 'Simpan Instruksi Transfer'}
            </button>
          </Card>

          {/* Card 3: Biaya & Batas Waktu */}
          <Card>
            <h3 className="text-md fw-bold mb-3">Biaya Transfer, Refund &amp; Timeout NIPL</h3>
            <div className="form-group mb-2">
              <label className="form-label fw-bold" style={{ fontSize: '0.8rem', color: 'var(--danger)' }}>Biaya Transfer (Rp)</label>
              <input type="number" className="form-input" value={apiKeys.manual_transfer_fee} onChange={(e) => setApiKeys({...apiKeys, manual_transfer_fee: e.target.value})} />
              <p className="text-xs text-muted mt-1">Jika isi 0, biaya transfer ditanggung oleh Admin. Jika diisi angka, Bidder wajib membayar biaya ini saat deposit.</p>
            </div>
            <div className="form-group mb-2">
              <label className="form-label fw-bold" style={{ fontSize: '0.8rem', color: 'var(--danger)' }}>Biaya Refund (Rp)</label>
              <input type="number" className="form-input" value={apiKeys.manual_refund_fee} onChange={(e) => setApiKeys({...apiKeys, manual_refund_fee: e.target.value})} />
              <p className="text-xs text-muted mt-1">Jika isi 0, biaya refund ditanggung oleh Admin. Jika diisi angka, Bidder akan membayar biaya ini saat beli deposit atau dipotong saat pencairan.</p>
            </div>
            <div className="form-group mb-3">
              <label className="form-label fw-bold" style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>Batas Waktu Pembayaran NIPL (Menit)</label>
              <input type="number" className="form-input" value={apiKeys.deposit_timeout_minutes} onChange={(e) => setApiKeys({...apiKeys, deposit_timeout_minutes: e.target.value})} />
              <p className="text-xs text-muted mt-1">Waktu hitung mundur (countdown) yang diberikan kepada bidder untuk menyelesaikan pembayaran NIPL sebelum dibatalkan.</p>
            </div>

            <button className="btn btn-primary w-100" onClick={handleSaveFeeTimeout} disabled={isSavingFeeTimeout}>
              {isSavingFeeTimeout ? 'Menyimpan...' : 'Simpan Biaya &amp; Batas Waktu'}
            </button>
          </Card>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Card 4: Amazon S3 / Cloudflare R2 */}
          <Card>
            <h3 className="text-md fw-bold mb-3">Amazon S3 / Cloudflare R2 (Penyimpanan Foto)</h3>
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
            <div className="form-group mb-3">
              <label className="form-label" style={{ fontSize: '0.8rem' }}>S3 Endpoint URL (Khusus Cloudflare R2 / MinIO)</label>
              <input type="text" placeholder="https://<ACCOUNT_ID>.r2.cloudflarestorage.com" className="form-input" value={apiKeys.aws_endpoint} onChange={(e) => setApiKeys({...apiKeys, aws_endpoint: e.target.value})} />
              <p className="text-xs text-muted mt-1">Biarkan kosong jika menggunakan AWS S3 biasa. Wajib diisi jika menggunakan Cloudflare R2.</p>
            </div>

            <button className="btn btn-primary w-100" onClick={handleSaveS3} disabled={isSavingS3}>
              {isSavingS3 ? 'Menyimpan...' : 'Simpan Penyimpanan'}
            </button>
          </Card>

          {/* Card 5: Verihubs & Validasi Rekening Bank */}
          <Card>
            <h3 className="text-md fw-bold mb-3">Verihubs &amp; Validasi Rekening Bank</h3>
            <div className="form-group mb-2" style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: '0.5rem', background: '#f8fafc' }}>
              <label className="form-label fw-bold">Mode Validasi Rekening Bidder</label>
              <select className="form-input" value={apiKeys.bank_inquiry_mode || 'manual'} onChange={(e) => setApiKeys({...apiKeys, bank_inquiry_mode: e.target.value})}>
                <option value="auto">Otomatis (Validasi API Xendit)</option>
                <option value="manual">Manual (Isi Nama &amp; Konfirmasi Nomor Saja)</option>
              </select>
              <p className="text-xs text-muted mt-1">Jika Manual, Bidder diminta mengetik nama rekeningnya sendiri tanpa kena biaya validasi.</p>
            </div>
            
            <div className="form-group mb-2">
              <label className="form-label" style={{ fontSize: '0.8rem' }}>Verihubs API Key (eKYC)</label>
              <input type="password" placeholder="********" className="form-input" value={apiKeys.verihubs_api_key} onChange={(e) => setApiKeys({...apiKeys, verihubs_api_key: e.target.value})} />
            </div>
            
            {apiKeys.bank_inquiry_mode === 'auto' && (
              <div className="form-group mb-3">
                <label className="form-label" style={{ fontSize: '0.8rem' }}>Xendit API Key (Disbursement &amp; Validasi Bank)</label>
                <input type="password" placeholder="********" className="form-input" value={apiKeys.xendit_api_key} onChange={(e) => setApiKeys({...apiKeys, xendit_api_key: e.target.value})} />
              </div>
            )}

            <button className="btn btn-primary w-100" onClick={handleSaveVerihubs} disabled={isSavingVerihubs}>
              {isSavingVerihubs ? 'Menyimpan...' : 'Simpan Verihubs &amp; Validasi'}
            </button>
          </Card>

          {/* Card 6: SMTP (Email) */}
          <Card>
            <h3 className="text-md fw-bold mb-3">SMTP (Email)</h3>
            <div className="alert alert-info mb-3" style={{ fontSize: '0.8rem' }}>
              Pengaturan SMTP disimpan terenkripsi. Uji email setelah menyimpan.
            </div>
            <div className="form-group mb-2">
              <label className="form-label" style={{ fontSize: '0.8rem' }}>SMTP Host</label>
              <input type="text" className="form-input" placeholder="smtp.gmail.com" value={apiKeys.smtp_host} onChange={(e) => setApiKeys({...apiKeys, smtp_host: e.target.value})} />
            </div>
            <div className="form-group mb-2">
              <label className="form-label" style={{ fontSize: '0.8rem' }}>SMTP Port</label>
              <input type="text" className="form-input" placeholder="587" value={apiKeys.smtp_port} onChange={(e) => setApiKeys({...apiKeys, smtp_port: e.target.value})} />
            </div>
            <div className="form-group mb-2">
              <label className="form-label" style={{ fontSize: '0.8rem' }}>SMTP User</label>
              <input type="text" className="form-input" placeholder="emailanda@gmail.com" value={apiKeys.smtp_user} onChange={(e) => setApiKeys({...apiKeys, smtp_user: e.target.value})} />
            </div>
            <div className="form-group mb-2">
              <label className="form-label" style={{ fontSize: '0.8rem' }}>SMTP Password</label>
              <input type="password" placeholder="********" className="form-input" value={apiKeys.smtp_password} onChange={(e) => setApiKeys({...apiKeys, smtp_password: e.target.value})} />
            </div>
            <div className="form-group mb-3">
              <label className="form-label" style={{ fontSize: '0.8rem' }}>Sender Name &amp; Email (From)</label>
              <input type="text" className="form-input" value={apiKeys.smtp_from} onChange={(e) => setApiKeys({...apiKeys, smtp_from: e.target.value})} placeholder='"Indo Lelang" <noreply@indo-lelang.com>' />
            </div>

            <button className="btn btn-primary w-100 mb-3" onClick={handleSaveSmtp} disabled={isSavingSMTP}>
              {isSavingSMTP ? 'Menyimpan...' : 'Simpan SMTP'}
            </button>

            {/* Test Email */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
              <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700 }}>🧪 Test Kirim Email</label>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input
                  type="email"
                  className="form-input"
                  placeholder="email-tujuan-test@example.com"
                  value={testEmailTo}
                  onChange={(e) => setTestEmailTo(e.target.value)}
                  style={{ flex: 1 }}
                />
                <button
                  className="btn btn-outline"
                  onClick={handleTestEmail}
                  disabled={isSendingTest}
                  style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
                >
                  {isSendingTest ? 'Mengirim...' : '📨 Kirim Test'}
                </button>
              </div>
            </div>
          </Card>
        </div>
      </div>
      
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
                <li>Potongan PMK 41: <strong>{pmk41}%</strong></li>
                <li>Potongan PPh 23: <strong>{pph23}%</strong></li>
              </ul>
              <p className="mt-2 text-danger fw-bold">Tindakan ini tidak bisa dibatalkan secara sepihak setelah invoice terbit. Lanjutkan?</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setIsConfirmModalOpen(false)} disabled={isSavingTax}>Batal</button>
              <button className="btn btn-danger" onClick={handleSaveTaxSettings} disabled={isSavingTax}>
                {isSavingTax ? 'Menyimpan...' : 'Ya, Saya Yakin & Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sold Lots Visibility Configuration Modal */}
      {isSoldLotsModalOpen && (
        <div className="modal-overlay" style={{ zIndex: 1000 }}>
          <div className="modal" style={{ maxWidth: '750px', width: '90%' }}>
            <div className="modal-header">
              Atur Visibilitas Lot Terjual di PWA
              <button className="modal-close" onClick={() => setIsSoldLotsModalOpen(false)}>&times;</button>
            </div>
            <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              <div className="alert alert-info mb-3 text-xs">
                Pilih lot terjual mana saja yang ingin ditampilkan di halaman Beranda PWA ketika belum ada lelang aktif (membantu menyembunyikan lot dummy).
              </div>

              {/* Filters */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group mb-0">
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>Merek / Model / Judul</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Cari..."
                    value={filterTitle}
                    onChange={(e) => setFilterTitle(e.target.value)}
                  />
                </div>
                <div className="form-group mb-0">
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>Nomor Polisi</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Cari No. Polisi..."
                    value={filterNoPolisi}
                    onChange={(e) => setFilterNoPolisi(e.target.value)}
                  />
                </div>
              </div>

              {/* Bulk Actions */}
              <div className="flex gap-2 mb-3 items-center" style={{ justifyContent: 'space-between' }}>
                <div className="text-xs text-muted">
                  Terpilih: <strong>{selectedVisibleLotIds.length}</strong> lot
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                    onClick={() => {
                      const filteredIds = filteredSoldLots.map((l: any) => l.id);
                      setSelectedVisibleLotIds((prev) => {
                        const prevArray = Array.isArray(prev) ? prev : [];
                        return Array.from(new Set([...prevArray, ...filteredIds]));
                      });
                    }}
                  >
                    Pilih Semua yang Tampil
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                    onClick={() => {
                      const filteredIds = filteredSoldLots.map((l: any) => l.id);
                      setSelectedVisibleLotIds((prev) => {
                        const prevArray = Array.isArray(prev) ? prev : [];
                        return prevArray.filter(id => !filteredIds.includes(id));
                      });
                    }}
                  >
                    Batal Pilih Semua yang Tampil
                  </button>
                </div>
              </div>

              {/* Lots List */}
              <div style={{ border: '1px solid var(--border)', borderRadius: '0.5rem', maxHeight: '300px', overflowY: 'auto', background: '#fff' }}>
                {filteredSoldLots.length === 0 ? (
                  <div className="p-4 text-center text-muted text-sm">Tidak ada lot terjual yang sesuai filter.</div>
                ) : (
                  <table className="table table-sm mb-0">
                    <thead className="table-light" style={{ position: 'sticky', top: 0 }}>
                      <tr>
                        <th style={{ width: '40px', textAlign: 'center' }}>Tampil</th>
                        <th>No. Lot</th>
                        <th>Aset / Unit</th>
                        <th>No. Polisi</th>
                        <th>Harga Terbentuk (Hammer Price)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSoldLots.map((lot: any) => {
                        const isChecked = Array.isArray(selectedVisibleLotIds) && selectedVisibleLotIds.includes(lot.id);
                        return (
                          <tr key={lot.id}>
                            <td style={{ textAlign: 'center' }}>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedVisibleLotIds((prev) => {
                                      const prevArray = Array.isArray(prev) ? prev : [];
                                      return Array.from(new Set([...prevArray, lot.id]));
                                    });
                                  } else {
                                    setSelectedVisibleLotIds((prev) => {
                                      const prevArray = Array.isArray(prev) ? prev : [];
                                      return prevArray.filter(id => id !== lot.id);
                                    });
                                  }
                                }}
                              />
                            </td>
                            <td>{lot.lot_number}</td>
                            <td><strong>{lot.asset?.title || `${lot.asset?.brand || ""} ${lot.asset?.model || ""}`}</strong></td>
                            <td><code>{lot.asset?.police_number || "-"}</code></td>
                            <td>Rp {Number(lot.hammer_price || lot.starting_price).toLocaleString('id-ID')}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setIsSoldLotsModalOpen(false)}>Batal</button>
              <button
                className="btn btn-primary"
                onClick={async () => {
                  try {
                    const response = await apiFetch('/admin/settings/feat_visible_sold_lot_ids', {
                      method: 'PUT',
                      body: JSON.stringify({ value: JSON.stringify(selectedVisibleLotIds) }),
                    });
                    const data = await response.json();
                    if (response.ok && data.success) {
                      toast.success("Daftar lot terjual yang ditampilkan berhasil disimpan!");
                      setIsSoldLotsModalOpen(false);
                    } else {
                      toast.error("Gagal menyimpan daftar lot terjual");
                    }
                  } catch (e) {
                    toast.error("Gagal menyimpan daftar lot terjual");
                  }
                }}
              >
                Submit / Simpan Pilihan
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
