"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiUrl } from "@/lib/api";
import BidderLayout from "../../../components/layout/BidderLayout";

export default function BidderDeposit() {
  const router = useRouter();
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");
  
  const [unitType, setUnitType] = useState<"mobil" | "motor">("mobil");
  const [packageType, setPackageType] = useState<string>("1");
  
  const [paymentMethod, setPaymentMethod] = useState<string>("bca"); // bca, mandiri, bni, bri, qris
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderId, setOrderId] = useState<string>("");
  const [feeBearer, setFeeBearer] = useState<string>("admin");
  const [showKycPopup, setShowKycPopup] = useState(false);
  const [depositPaymentMode, setDepositPaymentMode] = useState<string>("auto");
  const [manualTransferFee, setManualTransferFee] = useState<number>(2500);
  const [manualAccountName, setManualAccountName] = useState<string>("PT Indo Lelang Sejahtera");

  // Manual Transfer & Proof states
  const [depositStatus, setDepositStatus] = useState<string>("");
  const [expiresAt, setExpiresAt] = useState<string>("");
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [proofUrl, setProofUrl] = useState<string | null>(null);
  const [isUploadingProof, setIsUploadingProof] = useState(false);
  const proofInputRef = useRef<HTMLInputElement>(null);
  // Response payment details
  const [vaNumber, setVaNumber] = useState<string>("");
  const [vaBank, setVaBank] = useState<string>("");
  const [paymentType, setPaymentType] = useState<string>("");
  const [totalPaid, setTotalPaid] = useState<number>(0);

  const fetchSessions = async () => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("accessToken");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(apiUrl("/sessions?per_page=50"), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const resData = await response.json();
      if (response.ok && resData.success) {
        const list = resData.data || [];
        const activeSessions = list.filter((s: any) => s.status !== "draft");
        setSessions(activeSessions);
        if (activeSessions.length > 0) {
          setSelectedSessionId(activeSessions[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to fetch sessions", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveDeposit = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;
    try {
      const response = await fetch(apiUrl("/deposits?status=pending"), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const resData = await response.json();
      if (response.ok && resData.success && resData.data.length > 0) {
        const deposit = resData.data[0];
        setOrderId(deposit.id);
        setVaNumber(deposit.va_number || "");
        setVaBank(deposit.va_bank || deposit.payment_method);
        setPaymentType(deposit.payment_method || "virtual_account");
        setTotalPaid(deposit.amount);
        setDepositStatus(deposit.status);
        setExpiresAt(deposit.expires_at || "");
        setProofUrl(deposit.payment_proof_url || null);
      } else {
        const verifyingRes = await fetch(apiUrl("/deposits?status=verifying"), {
          headers: { Authorization: `Bearer ${token}` },
        });
        const verData = await verifyingRes.json();
        if (verifyingRes.ok && verData.success && verData.data.length > 0) {
          const deposit = verData.data[0];
          setOrderId(deposit.id);
          setVaNumber(deposit.va_number || "");
          setVaBank(deposit.va_bank || deposit.payment_method);
          setPaymentType(deposit.payment_method || "virtual_account");
          setTotalPaid(deposit.amount);
          setDepositStatus(deposit.status);
          setExpiresAt(deposit.expires_at || "");
          setProofUrl(deposit.payment_proof_url || null);
        }
      }
    } catch (error) {
      console.error("Failed to fetch active deposit", error);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await fetch(apiUrl("/settings/public"));
      const resData = await response.json();
      if (response.ok && resData.success) {
        const feeSetting = resData.data.find((s: any) => s.key === "FEE_BEARER");
        if (feeSetting) {
          setFeeBearer(feeSetting.value);
        }
        
        const pm = resData.data.find((s: any) => s.key === "deposit_payment_mode");
        if (pm) setDepositPaymentMode(pm.value);

        const mFee = resData.data.find((s: any) => s.key === "manual_transfer_fee");
        if (mFee) setManualTransferFee(Number(mFee.value) || 0);

        const mName = resData.data.find((s: any) => s.key === "manual_payment_name");
        if (mName) setManualAccountName(mName.value);
      }
    } catch (err) {
      console.error("Failed to fetch settings", err);
    }
  };

  useEffect(() => {
    fetchSessions();
    fetchSettings();
    fetchActiveDeposit();
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (expiresAt && depositStatus === "pending") {
      timer = setInterval(() => {
        const diff = new Date(expiresAt).getTime() - new Date().getTime();
        if (diff <= 0) {
          setTimeLeft(0);
          setDepositStatus("expired");
        } else {
          setTimeLeft(Math.floor(diff / 1000));
        }
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [expiresAt, depositStatus]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const calculateTotalAmount = () => {
    const basePrice = unitType === "mobil" ? 5000000 : 1000000;
    if (packageType === "unlimited") {
      return unitType === "mobil" ? 25000000 : 5000000;
    }
    return basePrice * parseInt(packageType, 10);
  };

  const handleCreateDeposit = async (e: React.FormEvent) => {
    e.preventDefault();

    const token = localStorage.getItem("accessToken");
    setIsSubmitting(true);

    try {
      // 1. Check KYC Status first
      const kycResponse = await fetch(apiUrl("/kyc/status"), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const kycData = await kycResponse.json();
      
      const kycStatus = kycData?.data?.status;
      if (kycResponse.status === 404 || (kycStatus !== "approved" && kycStatus !== "verified")) {
        setShowKycPopup(true);
        setIsSubmitting(false);
        return;
      }

      const amount = calculateTotalAmount();

      const response = await fetch(apiUrl("/deposits/create"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          unit_type: unitType,
          package_type: packageType,
          bank: paymentMethod,
        }),
      });

      const resData = await response.json();
      if (response.ok && resData.success) {
        const deposit = resData.data;
        setOrderId(deposit.id);
        setVaNumber(deposit.va_number || "");
        setVaBank(deposit.va_bank || paymentMethod);
        setPaymentType(deposit.payment_method || "virtual_account");
        setTotalPaid(amount);
        setDepositStatus(deposit.status);
        setExpiresAt(deposit.expires_at || "");
      } else {
        alert(resData.error?.message || "Gagal memproses deposit.");
      }
    } catch (err) {
      alert("Koneksi gagal. Pastikan API server aktif.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProofUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const token = localStorage.getItem("accessToken");
      
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "deposits");

      setIsUploadingProof(true);
      try {
        const response = await fetch(apiUrl("/upload/single"), {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        const resData = await response.json();
        if (response.ok && resData.success) {
          setProofUrl(resData.data.url);
        } else {
          alert(resData.error?.message || "Gagal mengunggah gambar.");
        }
      } catch (err) {
        alert("Koneksi gagal saat mengunggah bukti.");
      } finally {
        setIsUploadingProof(false);
      }
    }
  };

  const handleSubmitProof = async () => {
    if (!proofUrl) {
      alert("Harap unggah bukti transfer terlebih dahulu.");
      return;
    }
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(apiUrl(`/deposits/${orderId}/proof`), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ payment_proof_url: proofUrl }),
      });
      const resData = await response.json();
      if (response.ok && resData.success) {
        alert("Bukti pembayaran berhasil disubmit! Menunggu verifikasi admin.");
        setDepositStatus("verifying");
      } else {
        alert(resData.error?.message || "Gagal memproses bukti.");
      }
    } catch (err) {
      alert("Koneksi gagal saat submit bukti.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatRupiah = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (loading) {
    return (
      <BidderLayout pageTitle="Setor Deposit NIPL">
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-premium mb-4"></div>
          <p className="text-body-md text-on-surface-variant font-medium">Memuat form deposit...</p>
        </div>
      </BidderLayout>
    );
  }

  return (
    <BidderLayout pageTitle="Setor Deposit NIPL">
      <p className="page-subtitle">Beli tiket penawaran NIPL untuk berpartisipasi lelang</p>

      {/* Page Title & Tabs */}
      <div className="flex border-b border-outline-variant/60 mb-6 gap-6">
        <Link
          href="/bidder/deposit"
          className="py-3 font-bold text-body-md text-primary border-b-2 border-primary relative transition-all"
        >
          💳 Setor Deposit NIPL (Saldo Bebas)
        </Link>
      </div>

      <div className="grid-2-1">
        {/* Left Column Form */}
        <div>
          <div className="card">
            <div className="card-header">Form Pengajuan Jaminan NIPL</div>
            <form onSubmit={handleCreateDeposit} className="space-y-4">
              
              {/* Keterangan Sistem NIPL */}
              <div className="panel-form-group">
                <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl text-primary text-xs font-medium">
                  <strong>Penting:</strong> Semua NIPL yang Anda beli kini bersifat <strong>Global (Saldo Bebas)</strong> dan dapat digunakan untuk mengikuti sesi lelang mana saja tanpa perlu dialokasikan.
                </div>
              </div>

              {/* Tipe Unit */}
              <div className="panel-form-group">
                <label className="panel-form-label">Jenis Unit Kendaraan</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => { setUnitType("mobil"); setPackageType("1"); }}
                    className={`p-3 border rounded-xl font-bold flex flex-col items-center justify-center gap-1 transition-all ${
                      unitType === "mobil"
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-outline-variant/30 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span className="material-symbols-outlined text-3xl mb-1">directions_car</span>
                    <span>Unit Mobil</span>
                    <span className="text-[10px] font-normal text-slate-500">Rp 5 Juta / Unit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setUnitType("motor"); setPackageType("1"); }}
                    className={`p-3 border rounded-xl font-bold flex flex-col items-center justify-center gap-1 transition-all ${
                      unitType === "motor"
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-outline-variant/30 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span className="material-symbols-outlined text-3xl mb-1">two_wheeler</span>
                    <span>Unit Motor</span>
                    <span className="text-[10px] font-normal text-slate-500">Rp 1 Juta / Unit</span>
                  </button>
                </div>
              </div>

              {/* Quantity Selection */}
              <div className="panel-form-group">
                <label className="panel-form-label">Paket Pembelian NIPL</label>
                <select
                  value={packageType}
                  onChange={(e) => setPackageType(e.target.value)}
                  className="panel-form-select"
                >
                  <option value="1">1 Tiket NIPL (Hak menang 1 unit)</option>
                  <option value="2">2 Tiket NIPL (Hak menang 2 unit)</option>
                  <option value="3">3 Tiket NIPL (Hak menang 3 unit)</option>
                  <option value="4">4 Tiket NIPL (Hak menang 4 unit)</option>
                  <option value="unlimited">
                    Unlimited NIPL (Hak menang tak terbatas - {formatRupiah(unitType === 'mobil' ? 25000000 : 5000000)})
                  </option>
                </select>
              </div>

              {/* Total Payment Info */}
              <div className="panel-form-group">
                <label className="panel-form-label">Total Deposit</label>
                <div className="text-heading-xl text-primary font-black">
                  {formatRupiah(calculateTotalAmount())}
                </div>
              </div>

              {/* Fee Notice */}
              {feeBearer === 'customer' && (
                <div className="p-3 bg-warning/10 border border-warning/20 rounded-xl text-xs text-warning-dark">
                  <strong>Untuk Bidder:</strong> Segala biaya transfer dibebankan ke bidder.
                  <ul className="list-disc pl-4 mt-1 space-y-0.5">
                    <li>Transfer bank: Rp 4.000 flat</li>
                    <li>GoPay / ShopeePay: 2%</li>
                    <li>QRIS: 0.7%</li>
                    <li>DANA / OVO: 1.5%</li>
                  </ul>
                  <p className="mt-1 italic text-[10px]">Biaya ini akan otomatis ditambahkan pada saat pembayaran Midtrans.</p>
                </div>
              )}

              {/* Payment Methods */}
              <div className="panel-form-group">
                <label className="panel-form-label">Metode Pembayaran</label>
                
                {/* Virtual Account Group */}
                <div className="text-xs font-bold text-slate-500 mb-2">Virtual Account Bank</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  {["bca", "mandiri", "bni", "bri"].map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setPaymentMethod(b)}
                      className={`p-3 border rounded-xl font-bold text-center transition-all uppercase text-xs ${
                        paymentMethod === b
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-outline-variant/30 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {b} VA
                    </button>
                  ))}
                </div>

                {/* Instant QRIS Group */}
                <div className="text-xs font-bold text-slate-500 mb-2">Instant E-Wallet / QRIS</div>
                <div className="grid grid-cols-1 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("qris")}
                    className={`p-3 border rounded-xl font-bold flex items-center justify-center gap-2 transition-all text-xs ${
                      paymentMethod === "qris"
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-outline-variant/30 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span className="material-symbols-outlined text-base">qr_code_2</span>
                    QRIS (Gopay, OVO, ShopeePay, LinkAja)
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || depositStatus === 'pending' || depositStatus === 'verifying'}
                className={`w-full py-4 font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 ${
                  isSubmitting || depositStatus === 'pending' || depositStatus === 'verifying'
                    ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                    : "bg-primary hover:bg-primary/95 text-white shadow-primary/20"
                }`}
              >
                {isSubmitting ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Memproses Transaksi...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined">payments</span>
                    Bayar Sekarang
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column Payment Instruction */}
        <div>
          {vaNumber ? (
            <div className="card border-primary/30 bg-primary/[0.02]">
              <div className="card-header text-primary">
                {paymentType === "qris" ? "Bayar via QRIS Code" : "Instruksi Pembayaran VA"}
              </div>
              <div className="space-y-4">
                
                {paymentType === "qris" ? (
                  <div className="flex flex-col items-center gap-3">
                    <p className="text-xs text-slate-500 text-center">Scan QR Code di bawah untuk menyelesaikan pembayaran:</p>
                    {/* Publicly available QR code generator URL using vaNumber link */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(vaNumber || "https://midtrans.com")}`}
                      alt="QRIS Code"
                      className="w-48 h-48 border-2 border-outline-variant/60 rounded-xl p-2 bg-white"
                    />
                    <div className="text-xs text-slate-400 font-bold uppercase tracking-wide">Scan Menggunakan Aplikasi E-Wallet Anda</div>
                  </div>
                ) : paymentType === "manual_transfer" ? (
                  <div className="text-center p-4 bg-slate-900 text-white rounded-xl">
                    <div className="text-xs text-slate-400 font-medium">Rekening Tujuan ({vaBank.replace('manual_', '').toUpperCase()})</div>
                    <div className="text-lg font-black tracking-widest mt-1 text-primary-fixed">{vaNumber}</div>
                    <div className="text-xs text-slate-300 mt-2 font-medium">a.n. {manualAccountName}</div>
                  </div>
                ) : (
                  <div className="text-center p-4 bg-slate-900 text-white rounded-xl">
                    <div className="text-xs text-slate-400 font-medium">Nomor Virtual Account {vaBank.toUpperCase()}</div>
                    <div className="text-lg font-black tracking-widest mt-1 text-primary-fixed">{vaNumber}</div>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Jumlah Harus Ditransfer</span>
                    <span className="font-bold text-slate-800">{formatRupiah(totalPaid)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Status Pembayaran</span>
                    <span className={`font-bold ${depositStatus === 'pending' ? 'text-warning' : depositStatus === 'verifying' ? 'text-primary' : depositStatus === 'paid' ? 'text-success' : 'text-error'}`}>
                      {depositStatus === 'pending' ? 'Menunggu Pembayaran' : depositStatus === 'verifying' ? 'Sedang Diverifikasi' : depositStatus === 'paid' ? 'Lunas' : 'Kedaluwarsa'}
                    </span>
                  </div>
                  {depositStatus === 'pending' && (
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Batas Waktu</span>
                      <span className="font-bold text-error">{formatTime(timeLeft)}</span>
                    </div>
                  )}
                </div>

                {paymentType === "manual_transfer" && (
                  <div className="p-3 bg-warning/10 border border-warning/20 rounded-xl text-xs text-warning-dark mt-3">
                    <strong>Catatan Potongan Refund:</strong> Saat pengembalian dana deposit, uang Anda akan dikurangi biaya administrasi transfer bank sebesar <strong>{manualTransferFee > 0 ? formatRupiah(manualTransferFee) : 'Rp0 (Ditanggung Admin)'}</strong>.
                  </div>
                )}

                {(depositStatus === 'pending' || depositStatus === 'verifying') && (
                  <>
                    <div className="border-t border-outline-variant/20 pt-3 space-y-2 text-[11px] text-slate-600">
                      <p className="font-bold text-slate-800">Petunjuk Pembayaran:</p>
                      {paymentType === "manual_transfer" ? (
                        <ol className="list-decimal pl-4 space-y-1">
                          <li>Gunakan ATM, M-Banking, atau Internet Banking Anda.</li>
                          <li>Pilih menu Transfer antar bank / ke rekening tujuan.</li>
                          <li>Masukkan rekening tujuan: {vaNumber} ({vaBank.replace('manual_', '').toUpperCase()}).</li>
                          <li>Masukkan nominal pas sebesar {formatRupiah(totalPaid)} (sangat penting agar sistem memproses).</li>
                          <li>Selesaikan pembayaran, simpan bukti transfer.</li>
                        </ol>
                      ) : (
                        <ol className="list-decimal pl-4 space-y-1">
                          <li>Pilih menu Transfer ke Rekening Virtual Account {vaBank.toUpperCase()}.</li>
                          <li>Masukkan nomor VA di atas.</li>
                          <li>Konfirmasi nama akun Anda &amp; total pembayaran {formatRupiah(totalPaid)}.</li>
                          <li>Selesaikan pembayaran dan upload bukti bayar.</li>
                        </ol>
                      )}
                    </div>

                    <div className="border-t border-outline-variant/20 pt-4">
                      {depositStatus === 'pending' ? (
                        <div className="space-y-3">
                          <input
                            type="file"
                            accept="image/*"
                            ref={proofInputRef}
                            onChange={handleProofUpload}
                            className="hidden"
                          />
                          <button
                            type="button"
                            onClick={() => proofInputRef.current?.click()}
                            className="w-full py-2.5 border-2 border-dashed border-primary/50 text-primary font-bold rounded-xl hover:bg-primary/5 transition-all flex items-center justify-center gap-2 text-xs"
                          >
                            <span className="material-symbols-outlined text-sm">upload_file</span>
                            {isUploadingProof ? "Mengunggah..." : proofUrl ? "Bukti Terunggah (Klik untuk Ganti)" : "Upload Bukti Transfer"}
                          </button>

                          <button
                            type="button"
                            onClick={handleSubmitProof}
                            disabled={!proofUrl || isSubmitting}
                            className={`w-full py-2.5 font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 text-xs ${
                              !proofUrl || isSubmitting ? "bg-slate-300 text-slate-500 cursor-not-allowed" : "bg-primary hover:bg-primary/95 text-white shadow-primary/20"
                            }`}
                          >
                            {isSubmitting ? "Memproses..." : "Saya Sudah Transfer"}
                          </button>
                        </div>
                      ) : (
                        <div className="w-full py-3 bg-primary/10 border border-primary/20 text-primary font-bold rounded-xl flex items-center justify-center gap-2 text-sm">
                          <span className="material-symbols-outlined animate-spin text-sm">hourglass_empty</span>
                          Status: Verifikasi
                        </div>
                      )}
                    </div>
                  </>
                )}
                {depositStatus === 'paid' && (
                  <div className="p-4 bg-success/10 border border-success/30 rounded-xl flex flex-col items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-success text-4xl">check_circle</span>
                    <div className="text-success-dark font-bold text-center">NIPL Aktif</div>
                    <p className="text-xs text-success-dark/80 text-center">Anda sudah dapat menawar di sesi lelang.</p>
                  </div>
                )}
                {depositStatus === 'expired' && (
                  <div className="p-4 bg-error/10 border border-error/30 rounded-xl flex flex-col items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-error text-4xl">cancel</span>
                    <div className="text-error font-bold text-center">Tagihan Kedaluwarsa</div>
                    <p className="text-xs text-error/80 text-center">Silakan buat pengajuan deposit baru.</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="card">
              <div className="card-header">Ketentuan Deposit Jaminan</div>
              <div className="text-xs text-slate-600 space-y-3 leading-relaxed">
                <p>
                  Setiap peserta lelang (Bidder) diwajibkan menyetor deposit jaminan NIPL (*Nomor Induk Peserta Lelang*) sebagai tiket sah menawar unit lot yang diinginkan.
                </p>
                <div className="p-3 bg-slate-50 rounded-lg border">
                  <p className="font-bold text-slate-800 mb-1">Daftar Harga NIPL:</p>
                  <ul className="list-disc pl-4 space-y-1 text-slate-700">
                    <li>1 NIPL Mobil = Rp 5.000.000</li>
                    <li>Unlimited Mobil = Rp 25.000.000</li>
                    <li>1 NIPL Motor = Rp 1.000.000</li>
                    <li>Unlimited Motor = Rp 5.000.000</li>
                  </ul>
                </div>
                <p>
                  Sistem NIPL kini bersifat <strong>Global (Lintas Sesi)</strong>. NIPL Anda akan dipotong (dihanguskan) saat Anda melakukan Checkout / pelunasan untuk unit yang Anda menangkan. 
                </p>
                <p>
                  Uang deposit jaminan yang tidak terpakai (NIPL utuh) bersifat *refundable* penuh 100% tanpa potongan apapun dalam 1-3 hari kerja.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* KYC Alert Popup Modal */}
      {showKycPopup && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 shadow-2xl border border-outline-variant/30 max-w-sm w-full animate-fade-in-up">
            <div className="w-16 h-16 rounded-full bg-error/10 text-error flex items-center justify-center mx-auto mb-4 border border-error/25">
              <span className="material-symbols-outlined text-3xl font-bold">assignment_late</span>
            </div>
            <h3 className="text-body-lg font-bold text-center text-on-surface mb-2">Verifikasi eKYC Dibutuhkan</h3>
            <p className="text-body-sm text-center text-on-surface-variant mb-6 leading-relaxed">
              Anda belum verifikasi KTP, silakan ikuti prosedur verifikasi KYC untuk dapat membeli NIPL dan mengikuti lelang.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowKycPopup(false)}
                className="flex-1 py-2.5 border border-outline-variant text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-all text-xs"
              >
                Tutup
              </button>
              <Link
                href="/ekyc/upload"
                className="flex-1 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary/95 transition-all text-center text-xs flex items-center justify-center"
              >
                Verifikasi Sekarang
              </Link>
            </div>
          </div>
        </div>
      )}
    </BidderLayout>
  );
}
