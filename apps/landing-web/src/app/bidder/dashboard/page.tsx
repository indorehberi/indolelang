"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiUrl } from "@/lib/api";
import BidderLayout from "../../../components/layout/BidderLayout";

export default function BidderDashboard() {
  const router = useRouter();
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
      const resProfile = await fetch(apiUrl("/users/profile"), {
        headers: { Authorization: `Bearer ${token}` },
      });
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
      const resKyc = await fetch(apiUrl("/kyc/status"), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const resKycData = await resKyc.json();
      if (resKyc.ok && resKycData.success) {
        setEkycStatus(resKycData.data.status || "pending");
      } else if (resKyc.status === 404) {
        setEkycStatus("unverified");
      }

      // Fetch Bidder Application Status
      const resBidder = await fetch(apiUrl("/bidders/me"), {
        headers: { Authorization: `Bearer ${token}` },
      });
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
      const resDeposits = await fetch(apiUrl("/deposits"), {
        headers: { Authorization: `Bearer ${token}` },
      });
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
      const resSessions = await fetch(apiUrl("/sessions?status=active"), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const resSessData = await resSessions.json();
      if (resSessions.ok && resSessData.success) {
        const sessionsList = resSessData.data || [];
        setActiveSession(sessionsList.length > 0 ? sessionsList[0] : null);
      }

      // 4. Fetch Unread Notifications
      const resNotifications = await fetch(apiUrl("/notifications?is_read=false"), {
        headers: { Authorization: `Bearer ${token}` },
      });
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
    const token = localStorage.getItem("accessToken");
    const formData = new FormData();
    formData.append("file", npwpFile);

    try {
      const response = await fetch(apiUrl("/upload/single"), {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const resData = await response.json();
      if (response.ok && resData.success) {
        setNpwpUrl(resData.data.url);
      } else {
        alert(resData.error?.message || "Gagal mengunggah dokumen NPWP.");
      }
    } catch (err) {
      alert("Koneksi gagal saat mengunggah dokumen.");
    } finally {
      setUploadingNpwp(false);
    }
  };

  const handleUpgradeProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !npwp.trim() || !pksNumber.trim() || !address.trim()) {
      alert("Mohon isi semua data yang diperlukan.");
      return;
    }
    if (!npwpUrl) {
      alert("Mohon unggah dokumen NPWP terlebih dahulu.");
      return;
    }

    setUpgradeLoading(true);
    try {
      const token = localStorage.getItem("accessToken");

      // Apply for Provider
      const response = await fetch(apiUrl("/providers/apply"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
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
        alert("Pendaftaran berhasil! Pengajuan upgrade Anda telah dikirim dan sedang menunggu persetujuan Admin.");
        setIsUpgradeModalOpen(false);
        // Do not redirect to provider dashboard yet, because they are still 'menunggu approval'.
        // Refresh the page or fetch data again.
        window.location.reload();
      } else {
        alert(resData.error?.message || "Gagal melakukan upgrade akun.");
      }
    } catch (err: any) {
      alert(err.message || "Koneksi gagal. Pastikan API server aktif.");
    } finally {
      setUpgradeLoading(false);
    }
  };

  const handleCloseNotification = async (id: string) => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(apiUrl(`/notifications/${id}/read`), {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
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
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-premium mb-4"></div>
          <p className="text-body-md text-on-surface-variant font-medium">Memuat panel area bidder...</p>
        </div>
      </BidderLayout>
    );
  }

  return (
    <BidderLayout pageTitle="Dashboard">
      <p className="page-subtitle font-medium text-slate-500 mb-4">Panel Area Bidder &bull; Platform Indo-Lelang</p>

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
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        <div className="kpi-card success">
          <div className="kpi-label">NIPL Motor Aktif</div>
          <div className="kpi-value">{niplMotorCount} NIPL</div>
          <div className="kpi-trend up">Aktif &amp; Siap Digunakan</div>
        </div>
        <div className="kpi-card gold">
          <div className="kpi-label">NIPL Mobil Aktif</div>
          <div className="kpi-value">{niplMobilCount} NIPL</div>
          <div className="kpi-trend up">Siap Menawar Lot</div>
        </div>
        <div className="kpi-card danger">
          <div className="kpi-label">Lelang Menang</div>
          <div className="kpi-value">0 Lot</div>
          <div className="kpi-trend text-slate-500">Belum memenangkan lelang</div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Left Column */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* Live Session Card */}
          <div className="card">
            <div className="card-header">
              <span>Sesi Lelang Berlangsung</span>
              {activeSession && <span className="badge-ui danger animate-pulse">LIVE NOW</span>}
            </div>
            {activeSession ? (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3 className="font-bold text-slate-800 text-base">{activeSession.name}</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Sesi lelang aktif di cabang {activeSession.branch?.name || "Pusat"} &bull; Silakan bergabung ke ruang lelang
                  </p>
                </div>
                <Link href="/bidder/bidding-room" className="panel-btn panel-btn-gold text-center whitespace-nowrap shadow-sm hover:shadow">
                  Masuk Ruang Bidding
                </Link>
              </div>
            ) : (
              <div className="py-4 text-center text-body-sm text-on-surface-variant">
                Tidak ada sesi lelang yang sedang berlangsung saat ini.
              </div>
            )}
          </div>

          {/* Activity Chart SVG Placeholder */}
          <div className="card mb-0">
            <div className="card-header">Statistik Bidding Bulanan (Tawaran Dibuat)</div>
            <div className="py-8 text-center text-body-sm text-on-surface-variant flex flex-col items-center justify-center gap-2">
              <span className="material-symbols-outlined text-4xl text-slate-300">bar_chart</span>
              <span>Belum ada data aktivitas penawaran harga (bidding) Anda bulan ini.</span>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-4">
          <div className="card mb-0">
            <div className="card-header">Navigasi Panel Cepat</div>
            <div className="grid grid-cols-3 lg:grid-cols-1 gap-2">
              <Link 
                href={bidderStatus === "aktif" ? "/bidder/deposit" : "/ekyc/upload"} 
                className={`panel-btn panel-btn-outline justify-center flex-col text-center p-2 text-xs h-full ${bidderStatus !== "aktif" ? "opacity-50 cursor-not-allowed" : ""}`}
                onClick={(e) => { 
                  if (bidderStatus !== "aktif") { 
                    e.preventDefault(); 
                    alert("Verifikasi KYC Bidder Anda belum disetujui. Silakan lengkapi KYC.");
                    router.push("/ekyc/upload");
                  } 
                }}
              >
                <span className="text-xl mb-1 block">💳</span>
                <span className="leading-tight whitespace-nowrap">Beli NIPL</span>
              </Link>
              <Link href="/katalog" className="panel-btn panel-btn-outline justify-center flex-col text-center p-2 text-xs h-full">
                <span className="text-xl mb-1 block">🔍</span>
                <span className="leading-tight whitespace-nowrap">Cari Unit</span>
              </Link>
              <Link href="/bidder/profile" className="panel-btn panel-btn-outline justify-center flex-col text-center p-2 text-xs h-full">
                <span className="text-xl mb-1 block">👤</span>
                <span className="leading-tight whitespace-nowrap">Profil KYC</span>
              </Link>
            </div>
          </div>

          {/* Upgrade to Provider Card */}
          <div className="card mb-0 border-t-4 border-primary">
            <div className="card-header text-primary">Titip Jual &amp; Bermitra</div>
            <div className="space-y-3">
              <p className="text-body-sm text-on-surface-variant leading-relaxed">
                Ingin memasarkan kendaraan atau unit aset Anda secara mandiri di IndoLelang? Upgrade akun Anda menjadi Provider sekarang!
              </p>
              <button
                onClick={() => {
                  if (bidderStatus !== "aktif") {
                    alert("Hanya Bidder yang sudah Aktif yang dapat mengajukan diri sebagai Provider. Lengkapi profil dan tunggu persetujuan Admin.");
                  } else {
                    setIsUpgradeModalOpen(true);
                  }
                }}
                className={`panel-btn panel-btn-gold justify-center w-full shadow-sm hover:shadow ${bidderStatus !== "aktif" ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                🤝 Daftar Sebagai Provider
              </button>
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
      {isUpgradeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-all duration-300 p-4">
          <div className="bg-white rounded-3xl border border-outline-variant/60 shadow-2xl w-full max-w-[440px] p-6 relative transition-all transform scale-100 max-h-[95vh] overflow-y-auto custom-scrollbar">
            
            {/* Close Button */}
            <button
              onClick={() => setIsUpgradeModalOpen(false)}
              className="absolute top-4 right-4 text-on-surface-variant/70 hover:text-on-surface hover:bg-surface-variant/40 rounded-full p-1.5 transition-all bg-white z-10"
            >
              <span className="material-symbols-outlined text-2xl font-bold">close</span>
            </button>

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
                <label className="text-body-xs font-semibold text-on-surface-variant block mb-1">Nomor PKS *</label>
                <input
                  type="text"
                  required
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
          </div>
        </div>
      )}
    </BidderLayout>
  );
}
