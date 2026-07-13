"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import BidderLayout from "../../../components/layout/BidderLayout";
import ResponsiveModal from "@/components/ui/ResponsiveModal";
import PageSkeleton from "@/components/ui/PageSkeleton";
import { useToast } from "@/providers/ToastProvider";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function BidderDashboard() {
  const router = useRouter();
  const toast = useToast();
  const [ekycStatus, setEkycStatus] = useState<string>("pending");
  const [bidderStatus, setBidderStatus] = useState<string>("nonaktif");
  const [rejectionReason, setRejectionReason] = useState<string>("");
  const [niplMotorCount, setNiplMotorCount] = useState<number>(0);
  const [niplMobilCount, setNiplMobilCount] = useState<number>(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [activeSession, setActiveSession] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProfileComplete, setIsProfileComplete] = useState<boolean>(true);
  const [chartFilter, setChartFilter] = useState("month"); // 'month' or 'year'

  // Upgrade Provider Modal State
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [npwp, setNpwp] = useState("");
  const [pksNumber, setPksNumber] = useState("");
  const [providerType, setProviderType] = useState("Perusahaan Swasta");
  const [address, setAddress] = useState("");
  const [npwpFile, setNpwpFile] = useState<File | null>(null);
  const [npwpUrl, setNpwpUrl] = useState("");
  const [uploadingNpwp, setUploadingNpwp] = useState(false);
  const [upgradeLoading, setUpgradeLoading] = useState(false);

  const loadDashboardData = async () => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("accessToken");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      setLoading(true);

      // 1. Fetch Profile Data
      const resProfile = await apiFetch("/users/profile");
      const resProfileData = await resProfile.json();
      if (resProfile.ok && resProfileData.success) {
        const user = resProfileData.data;
        localStorage.setItem("user", JSON.stringify(user));
        
        if (user.role === "provider") {
          router.push("/provider/dashboard");
          return;
        }

        // Autofill shared fields for the "upgrade to provider" form from the
        // bidder's own profile data (per spec: don't ask twice for the same data).
        if (user.address) setAddress(user.address);

        const isComplete = !!(user.phone && user.address && user.bank_account_no && user.bank_name);
        setIsProfileComplete(isComplete);
      }

      // Fetch KYC Status dynamically
      const resKyc = await apiFetch("/kyc/status");
      const resKycData = await resKyc.json();
      if (resKyc.ok && resKycData.success) {
        setEkycStatus(resKycData.data.status || "pending");
      } else if (resKyc.status === 404) {
        setEkycStatus("unverified");
      }

      // Fetch Bidder Application Status
      const resBidder = await apiFetch("/bidders/me");
      const resBidderData = await resBidder.json();
      if (resBidder.ok && resBidderData.success && resBidderData.data) {
        setBidderStatus(resBidderData.data.status);
        if (resBidderData.data.rejection_reason) {
          setRejectionReason(resBidderData.data.rejection_reason);
        }
      } else {
        setBidderStatus("nonaktif");
      }

      // 2. Fetch Deposits & Transactions Data
      const resDeposits = await apiFetch("/deposits");
      const resDepData = await resDeposits.json();
      if (resDeposits.ok && resDepData.success) {
        const list = resDepData.data || [];
        setTransactions(list);

        // Sum success deposits balance
        const successDeposits = list.filter((d: any) => d.status === "paid" || d.status === "success"); // accommodate older logic if any
        let motorCount = 0;
        let mobilCount = 0;
        
        successDeposits.forEach((d: any) => {
          if (d.unit_type === "motor") motorCount++;
          else if (d.unit_type === "mobil") mobilCount++;
        });

        setNiplMotorCount(motorCount);
        setNiplMobilCount(mobilCount);
      }

      // 3. Fetch Active Auction Sessions
      const resSessions = await apiFetch("/sessions?status=active");
      const resSessData = await resSessions.json();
      if (resSessions.ok && resSessData.success) {
        const sessionsList = resSessData.data || [];
        setActiveSession(sessionsList.length > 0 ? sessionsList[0] : null);
      }

      // 4. Fetch Unread Notifications
      const resNotifications = await apiFetch("/notifications?is_read=false");
      const resNotifData = await resNotifications.json();
      if (resNotifications.ok && resNotifData.success) {
        setNotifications(resNotifData.data || []);
      }
    } catch (err) {
      console.error("Failed to load dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const formatRupiah = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getStatusBadge = (status: string) => {
    if (status === "success") return <span className="badge-ui success">Berhasil</span>;
    if (status === "expired" || status === "failed") return <span className="badge-ui danger">Gagal</span>;
    return <span className="badge-ui warning">Pending</span>;
  };

  const handleUploadNpwp = async () => {
    if (!npwpFile) return;
    setUploadingNpwp(true);
    const formData = new FormData();
    formData.append("file", npwpFile);

    try {
      const response = await apiFetch("/upload/single", {
        method: "POST",
        body: formData,
      });
      const resData = await response.json();
      if (response.ok && resData.success) {
        setNpwpUrl(resData.data.url);
      } else {
        toast.error(resData.error?.message || "Gagal mengunggah dokumen NPWP.");
      }
    } catch (err) {
      toast.error("Koneksi gagal saat mengunggah dokumen.");
    } finally {
      setUploadingNpwp(false);
    }
  };

  const handleUpgradeProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !npwp.trim() || !address.trim()) {
      toast.warning("Mohon isi semua data yang diperlukan.");
      return;
    }
    if (!npwpUrl) {
      toast.warning("Mohon unggah dokumen NPWP terlebih dahulu.");
      return;
    }

    setUpgradeLoading(true);
    try {
      // Apply for Provider
      const response = await apiFetch("/providers/apply", {
        method: "POST",
        body: JSON.stringify({
          company_name: companyName,
          npwp: npwp,
          npwp_url: npwpUrl,
          pks_number: pksNumber,
          provider_type: providerType,
          address: address
        }),
      });

      const resData = await response.json();
      if (response.ok && resData.success) {
        toast.success("Pendaftaran berhasil! Pengajuan upgrade Anda telah dikirim dan sedang menunggu persetujuan Admin.");
        setIsUpgradeModalOpen(false);
        // Do not redirect to provider dashboard yet, because they are still 'menunggu approval'.
        // Refresh the page or fetch data again.
        window.location.reload();
      } else {
        toast.error(resData.error?.message || "Gagal melakukan upgrade akun.");
      }
    } catch (err: any) {
      toast.error(err.message || "Koneksi gagal. Pastikan API server aktif.");
    } finally {
      setUpgradeLoading(false);
    }
  };

  const handleCloseNotification = async (id: string) => {
    try {
      const response = await apiFetch(`/notifications/${id}/read`, {
        method: "PUT",
      });
      if (response.ok) {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }
    } catch (err) {
      console.error("Failed to dismiss notification", err);
    }
  };

  if (loading) {
    return (
      <BidderLayout pageTitle="Dashboard">
        <PageSkeleton />
      </BidderLayout>
    );
  }

  const mockChartDataMonth = [
    { name: '1', bids: 2 }, { name: '5', bids: 5 }, { name: '10', bids: 8 },
    { name: '15', bids: 12 }, { name: '20', bids: 3 }, { name: '25', bids: 7 },
    { name: '30', bids: 10 }
  ];
  
  const mockChartDataYear = [
    { name: 'Jan', bids: 20 }, { name: 'Feb', bids: 15 }, { name: 'Mar', bids: 30 },
    { name: 'Apr', bids: 45 }, { name: 'Mei', bids: 25 }, { name: 'Jun', bids: 50 },
    { name: 'Jul', bids: 35 }
  ];

  return (
    <BidderLayout pageTitle="Statistik">

      {/* Notifications Section */}
      {notifications.length > 0 && (
        <div className="space-y-2 mb-4">
          {notifications.map((notif) => (
            <div key={notif.id} className="alert-box info flex items-center justify-between" style={{ padding: '1rem', borderRadius: '1rem', background: '#e0f2fe', border: '1px solid #bae6fd', color: '#0369a1' }}>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-sky-600">notifications</span>
                <div>
                  <strong className="block text-sm font-semibold">{notif.title}</strong>
                  <p className="text-xs text-sky-800 mt-0.5">{notif.message}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleCloseNotification(notif.id)}
                className="text-sky-600 hover:text-sky-800 p-1 hover:bg-sky-200/50 rounded-full transition-all"
                title="Tutup Notifikasi"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* eKYC Alert Box */}
      {!isProfileComplete ? (
        <div className="alert-box danger">
          <span className="material-symbols-outlined">error</span>
          <div>
            <strong>⚠️ Profil Belum Lengkap:</strong> Anda harus melengkapi data profil (No. HP, Alamat, dan Rekening Bank) sebelum dapat melakukan verifikasi KYC.
            <Link href="/bidder/profile" className="ml-2 font-bold underline hover:text-red-950">Lengkapi Profil</Link>
          </div>
        </div>
      ) : bidderStatus === "nonaktif" || bidderStatus === "ditolak" ? (
        <div className="alert-box danger">
          <span className="material-symbols-outlined">report</span>
          <div>
            <strong>❌ Akun Bidder Belum Aktif:</strong> {rejectionReason ? `Pengajuan Anda ditolak admin: ${rejectionReason}. Harap lengkapi ulang profil & KYC Anda.` : 'Anda belum melengkapi pendaftaran Bidder atau KYC. Anda belum bisa ikut lelang.'}
            <Link href="/ekyc/upload" className="ml-2 font-bold underline hover:text-red-950">Verifikasi KYC</Link>
          </div>
        </div>
      ) : bidderStatus === "antri" ? (
        <div className="alert-box warning">
          <span className="material-symbols-outlined">schedule</span>
          <div>
            <strong>⏳ Menunggu Approval Admin:</strong> Data Anda telah kami terima dan sedang diverifikasi secara manual oleh Tim Admin. Silakan tunggu beberapa saat.
          </div>
        </div>
      ) : null}

      {/* KPI Grid */}
      <div className="grid grid-cols-3 gap-3 mb-6 text-center">
        <div className="kpi-card success flex flex-col items-center justify-center p-4">
          <div className="text-3xl mb-1"><span className="material-symbols-outlined text-4xl">two_wheeler</span></div>
          <div className="kpi-value text-ellipsis overflow-hidden whitespace-nowrap">{niplMotorCount}</div>
          <div className="text-[10px] text-slate-500 font-bold uppercase mt-1 text-ellipsis overflow-hidden whitespace-nowrap">NIPL Aktif</div>
        </div>
        <div className="kpi-card gold flex flex-col items-center justify-center p-4">
          <div className="text-3xl mb-1"><span className="material-symbols-outlined text-4xl">directions_car</span></div>
          <div className="kpi-value text-ellipsis overflow-hidden whitespace-nowrap">{niplMobilCount}</div>
          <div className="text-[10px] text-slate-500 font-bold uppercase mt-1 text-ellipsis overflow-hidden whitespace-nowrap">NIPL Aktif</div>
        </div>
        <div className="kpi-card danger flex flex-col items-center justify-center p-4">
          <div className="text-3xl mb-1">👑</div>
          <div className="kpi-value text-ellipsis overflow-hidden whitespace-nowrap">0</div>
          <div className="text-[10px] text-slate-500 font-bold uppercase mt-1 text-ellipsis overflow-hidden whitespace-nowrap">Lot Menang</div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Full Width for Chart */}
        <div className="col-span-1 lg:col-span-3">
          {/* Activity Chart SVG Placeholder */}
          <div className="card mb-0">
            <div className="card-header flex justify-between items-center">
              <span>Statistik Bidding</span>
              <select 
                value={chartFilter} 
                onChange={(e) => setChartFilter(e.target.value)}
                className="text-xs border border-outline-variant/60 rounded px-2 py-1 bg-white"
              >
                <option value="month">Bulan Ini (Harian)</option>
                <option value="year">Tahun Ini (Bulanan)</option>
              </select>
            </div>
            <div className="py-4 w-full h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartFilter === 'month' ? mockChartDataMonth : mockChartDataYear}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <Tooltip 
                    cursor={{ fill: '#f1f5f9' }} 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                  />
                  <Bar dataKey="bids" fill="#0369a1" radius={[4, 4, 0, 0]} name="Total Bids" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction History Card */}
      <div className="card">
        <div className="card-header">Riwayat Mutasi Saldo &amp; Deposit</div>
        <div className="table-wrapper">
          {transactions.length === 0 ? (
            <div className="py-8 text-center text-body-sm text-on-surface-variant">
              Belum ada riwayat transaksi mutasi saldo jaminan lelang.
            </div>
          ) : (
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>No. Referensi</th>
                  <th>Jenis Transaksi</th>
                  <th>Keterangan Sesi</th>
                  <th>Nominal</th>
                  <th>Status</th>
                  <th>Waktu</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id}>
                    <td>#{tx.id.substring(0, 8).toUpperCase()}</td>
                    <td className="font-bold text-slate-800">Pembelian NIPL (Jaminan)</td>
                    <td>{tx.session?.name || "Sesi Lelang"}</td>
                    <td className="font-bold">{formatRupiah(tx.amount)}</td>
                    <td>{getStatusBadge(tx.status)}</td>
                    <td>{new Date(tx.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Upgrade Provider Modal */}
      <ResponsiveModal open={isUpgradeModalOpen} onClose={() => setIsUpgradeModalOpen(false)}>
            <form onSubmit={handleUpgradeProvider} className="space-y-4 pt-2">
              <h3 className="text-heading-sm font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">storefront</span>
                Daftar Sebagai Provider
              </h3>
              <p className="text-body-sm text-on-surface-variant">
                Lengkapi data badan usaha atau bisnis Anda untuk dapat mulai titip jual aset di platform IndoLelang.
              </p>

              <div>
                <label className="text-body-xs font-semibold text-on-surface-variant block mb-1">Nama Perusahaan / Provider</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: PT Maju Jaya Motor"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-outline-variant/60 text-body-md focus:border-premium focus:ring-1 focus:ring-premium outline-none"
                />
              </div>

              <div>
                <label className="text-body-xs font-semibold text-on-surface-variant block mb-1">Nomor NPWP *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 01.234.567.8-901.000"
                  value={npwp}
                  onChange={(e) => setNpwp(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-outline-variant/60 text-body-md focus:border-premium focus:ring-1 focus:ring-premium outline-none"
                />
              </div>

              <div>
                <label className="text-body-xs font-semibold text-on-surface-variant block mb-1">Upload Dokumen NPWP *</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        setNpwpFile(e.target.files[0]);
                      }
                    }}
                    className="w-full px-3 py-1.5 rounded-xl border border-outline-variant/60 text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer outline-none flex-1"
                  />
                  <button
                    type="button"
                    onClick={handleUploadNpwp}
                    disabled={!npwpFile || uploadingNpwp}
                    className="px-3 py-2 bg-secondary text-white font-bold rounded-xl disabled:opacity-50 text-xs whitespace-nowrap"
                  >
                    {uploadingNpwp ? "Upload..." : "Upload"}
                  </button>
                </div>
                {npwpUrl && (
                  <div className="text-xs text-success mt-1.5 font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">check_circle</span>
                    Dokumen NPWP tersimpan
                  </div>
                )}
              </div>

              <div>
                <label className="text-body-xs font-semibold text-on-surface-variant block mb-1">Nomor PKS (Opsional)</label>
                <input
                  type="text"
                  placeholder="Nomor Perjanjian Kerja Sama (PKS)"
                  value={pksNumber}
                  onChange={(e) => setPksNumber(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-outline-variant/60 text-body-md focus:border-premium focus:ring-1 focus:ring-premium outline-none"
                />
              </div>

              <div>
                <label className="text-body-xs font-semibold text-on-surface-variant block mb-1">Jenis Provider *</label>
                <select
                  required
                  value={providerType}
                  onChange={(e) => setProviderType(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-outline-variant/60 text-body-md focus:border-premium focus:ring-1 focus:ring-premium outline-none bg-white"
                >
                  <option value="Perusahaan Swasta">Perusahaan Swasta</option>
                  <option value="BUMN">BUMN</option>
                  <option value="Perorangan">Perorangan</option>
                </select>
              </div>

              <div>
                <label className="text-body-xs font-semibold text-on-surface-variant block mb-1">Alamat Lengkap *</label>
                <textarea
                  required
                  placeholder="Alamat domisili / operasional perusahaan"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-outline-variant/60 text-body-md focus:border-premium focus:ring-1 focus:ring-premium outline-none min-h-[80px]"
                />
              </div>

              <div className="flex items-start gap-2 p-3 bg-warning/10 border border-warning/30 rounded-xl">
                <span className="material-symbols-outlined text-warning text-lg mt-0.5">warning</span>
                <p className="text-body-xs text-on-surface-variant leading-relaxed">
                  <strong>Perhatian:</strong> Jika pengajuan ini disetujui, akun bidder Anda akan otomatis dinonaktifkan dan Anda <strong>tidak dapat lagi mengikuti lelang sebagai bidder</strong> selama akun Provider Anda aktif.
                </p>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsUpgradeModalOpen(false)}
                  className="flex-1 py-3 border border-outline-variant/80 hover:bg-surface-variant/10 text-on-surface rounded-xl font-bold text-body-md transition-all active:scale-98"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={upgradeLoading}
                  className="flex-1 py-3 bg-premium text-on-premium hover:bg-premium/85 rounded-xl font-bold text-body-md transition-all active:scale-98 flex items-center justify-center gap-2"
                >
                  {upgradeLoading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-on-premium"></div>
                  ) : (
                    "Kirim Pengajuan"
                  )}
                </button>
              </div>
            </form>
      </ResponsiveModal>
    </BidderLayout>
  );
}
