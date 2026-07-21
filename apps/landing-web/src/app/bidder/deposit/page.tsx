"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiUrl, apiFetch } from "@/lib/api";
import BidderLayout from "../../../components/layout/BidderLayout";
import ResponsiveModal from "@/components/ui/ResponsiveModal";
import PageSkeleton from "@/components/ui/PageSkeleton";
import { useToast } from "@/providers/ToastProvider";

export default function BidderDeposit() {
  const router = useRouter();
  const toast = useToast();
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");
  
  const [unitType, setUnitType] = useState<"mobil" | "motor">("mobil");
  const [packageType, setPackageType] = useState<string>("1");
  
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderId, setOrderId] = useState<string>("");
  const [showKycPopup, setShowKycPopup] = useState(false);
  const [manualTransferFee, setManualTransferFee] = useState<number>(0);
  const [manualAccountName, setManualAccountName] = useState<string>("PT Indo Lelang Sejahtera");

  // Response payment details
  const [vaNumber, setVaNumber] = useState<string>("");
  const [vaBank, setVaBank] = useState<string>("");
  const [paymentType, setPaymentType] = useState<string>("");
  const [totalPaid, setTotalPaid] = useState<number>(0);
  const [manualRefundFee, setManualRefundFee] = useState<number>(0);
  const [depositTimeoutMinutes, setDepositTimeoutMinutes] = useState<number>(60);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (timeLeft > 0) {
      const timerId = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timerId);
    }
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const fetchSessions = async () => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("accessToken");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      setLoading(true);
      const response = await apiFetch("/sessions?per_page=50");
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

  const fetchSettings = async () => {
    try {
      const response = await fetch(apiUrl("/settings/public"));
      const resData = await response.json();
      if (response.ok && resData.success) {
        const mFee = resData.data.find((s: any) => s.key === "manual_transfer_fee");
        if (mFee) setManualTransferFee(Number(mFee.value) || 0);

        const mRefund = resData.data.find((s: any) => s.key === "manual_refund_fee");
        if (mRefund) setManualRefundFee(Number(mRefund.value) || 0);

        const mTimeout = resData.data.find((s: any) => s.key === "deposit_timeout_minutes");
        if (mTimeout) setDepositTimeoutMinutes(Number(mTimeout.value) || 60);

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
  }, []);

  const calculateTotalAmount = () => {
    const basePrice = unitType === "mobil" ? 5000000 : 1000000;
    if (packageType === "unlimited") {
      return unitType === "mobil" ? 25000000 : 5000000;
    }
    return basePrice * parseInt(packageType, 10);
  };

  const handleCreateDeposit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSubmitting(true);

    try {
      // 1. Check KYC Status first
      const kycResponse = await apiFetch("/kyc/status");
      const kycData = await kycResponse.json();
      
      const kycStatus = kycData?.data?.status;
      if (kycResponse.status === 404 || (kycStatus !== "approved" && kycStatus !== "verified")) {
        setShowKycPopup(true);
        setIsSubmitting(false);
        return;
      }

      const amount = calculateTotalAmount();

      const response = await apiFetch("/deposits/create", {
        method: "POST",
        body: JSON.stringify({
          unit_type: unitType,
          package_type: packageType,
        }),
      });

      const resData = await response.json();
      if (response.ok && resData.success) {
        const deposit = resData.data;
        setOrderId(deposit.id);
        setVaNumber(deposit.va_number || "");
        setVaBank(deposit.va_bank || "manual");
        setPaymentType(deposit.payment_method || "manual_transfer");
        setTotalPaid(Number(deposit.amount) + Number(deposit.transfer_fee || 0) + Number(deposit.refund_fee || 0));
        setTimeLeft(depositTimeoutMinutes * 60);
      } else {
        toast.error(resData.error?.message || "Gagal memproses deposit.");
      }
    } catch (err) {
      toast.error("Koneksi gagal. Pastikan API server aktif.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUploadProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proofFile) {
      toast.warning("Pilih file bukti transfer terlebih dahulu.");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", proofFile);

    try {
      // 1. Upload File
      const uploadRes = await apiFetch("/upload/single", {
        method: "POST",
        body: formData,
      });
      const uploadData = await uploadRes.json();

      if (!uploadRes.ok || !uploadData.success) {
        throw new Error(uploadData.error?.message || "Gagal mengunggah bukti transfer.");
      }

      // 2. Submit Proof to Deposit
      const proofUrl = uploadData.data.url;
      const submitRes = await apiFetch(`/deposits/${orderId}/proof`, {
        method: "POST",
        body: JSON.stringify({ transfer_proof_url: proofUrl }),
      });

      const submitData = await submitRes.json();
      if (submitRes.ok && submitData.success) {
        toast.success("Bukti transfer berhasil diunggah! Mohon tunggu persetujuan Admin.");
        router.push("/bidder/home");
      } else {
        throw new Error(submitData.error?.message || "Gagal menyimpan bukti transfer.");
      }
    } catch (err: any) {
      toast.error(err.message || "Koneksi gagal saat mengunggah bukti transfer.");
    } finally {
      setIsUploading(false);
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
      <BidderLayout pageTitle="DEPOSIT">
        <PageSkeleton />
      </BidderLayout>
    );
  }

  return (
    <BidderLayout pageTitle="DEPOSIT">
      
      {/* Page Title & Tabs */}
      <div className="flex border-b border-outline-variant/60 mb-6 gap-6">
        <Link
          href="/bidder/deposit"
          className="py-3 font-bold text-body-md text-primary border-b-2 border-primary relative transition-all"
        >
          💳 Setor Deposit NIPL (Saldo Bebas)
        </Link>
        <Link
          href="/bidder/deposit/history"
          className="py-3 font-bold text-body-md text-slate-500 hover:text-slate-800 transition-all"
        >
          🕒 Riwayat Deposit & Refund
        </Link>
      </div>

      <div className="grid-2-1">
        {/* Left Column Form */}
        <div>
          <div className="card">
            <div className="card-header">Form Pengajuan Jaminan NIPL</div>
            <form onSubmit={handleCreateDeposit} className="space-y-4">
              


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

              {/* Quantity Selection via Radio Buttons */}
              <div className="panel-form-group">
                <label className="panel-form-label mb-2 block">Paket Pembelian NIPL</label>
                <div className="flex flex-col gap-2.5 mt-2">
                  {[
                    { value: "1", label: "1 Tiket NIPL", desc: "Hak menang 1 unit lelang" },
                    { value: "2", label: "2 Tiket NIPL", desc: "Hak menang 2 unit lelang" },
                    { value: "3", label: "3 Tiket NIPL", desc: "Hak menang 3 unit lelang" },
                    { value: "4", label: "4 Tiket NIPL", desc: "Hak menang 4 unit lelang" },
                    { value: "unlimited", label: "Unlimited NIPL", desc: `Hak menang tak terbatas (${formatRupiah(unitType === 'mobil' ? 25000000 : 5000000)})` }
                  ].map((option) => (
                    <label 
                      key={option.value}
                      className={`flex items-center gap-3 p-3.5 border rounded-xl cursor-pointer transition-all ${
                        packageType === option.value
                          ? "border-primary bg-primary/5 text-on-surface"
                          : "border-outline-variant/30 hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      <input
                        type="radio"
                        name="packageType"
                        value={option.value}
                        checked={packageType === option.value}
                        onChange={() => setPackageType(option.value)}
                        className="w-4 h-4 text-primary focus:ring-primary border-slate-300"
                      />
                      <div className="flex flex-col">
                        <span className="font-bold text-sm leading-none mb-1">{option.label}</span>
                        <span className="text-[11px] text-slate-500">{option.desc}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Total Payment Info */}
              <div className="panel-form-group">
                <label className="panel-form-label">Total Deposit</label>
                <div className="text-heading-xl text-primary font-black">
                  {formatRupiah(calculateTotalAmount())}
                </div>
              </div>



              <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl text-xs text-slate-600">
                Pembayaran dilakukan lewat <strong>transfer bank manual</strong>. Setelah mengajukan, Anda akan melihat nomor rekening tujuan dan bisa langsung mengunggah bukti transfer di halaman ini.
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-primary hover:bg-primary/95 text-white font-bold rounded-xl transition-all shadow-md shadow-primary/20 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined">payments</span>
                    Ajukan Deposit
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
                    <span className="text-slate-500">Batas Waktu Pembayaran</span>
                    <span className="font-bold text-error">{formatTime(timeLeft)} Menit</span>
                  </div>
                </div>



                <div className="border-t border-outline-variant/20 pt-3 space-y-2 text-[11px] text-slate-600">
                  <p className="font-bold text-slate-800">Petunjuk Pembayaran:</p>
                  {paymentType === "qris" ? (
                    <ol className="list-decimal pl-4 space-y-1">
                      <li>Buka aplikasi Gopay, ShopeePay, OVO, atau M-Banking Anda.</li>
                      <li>Pilih menu scan QR/Bayar.</li>
                      <li>Scan gambar QR Code di atas.</li>
                      <li>Periksa nama akun IndoLelang dan jumlah tagihan.</li>
                      <li>Klik bayar &amp; masukkan PIN Anda. Selesai!</li>
                    </ol>
                  ) : paymentType === "manual_transfer" ? (
                    <ol className="list-decimal pl-4 space-y-1">
                      <li>Gunakan ATM, M-Banking, atau Internet Banking Anda.</li>
                      <li>Pilih menu Transfer antar bank / ke rekening tujuan.</li>
                      <li>Masukkan rekening tujuan: {vaNumber} ({vaBank.replace('manual_', '').toUpperCase()}).</li>
                      <li>Masukkan nominal pas sebesar {formatRupiah(totalPaid)} (sangat penting agar sistem memproses).</li>
                      <li>Simpan bukti transfer dan unggah pada form di bawah.</li>
                      <li>Tunggu persetujuan Admin (1-2 Jam Kerja) sebelum NIPL aktif.</li>
                    </ol>
                  ) : (
                    <ol className="list-decimal pl-4 space-y-1">
                      <li>Pilih menu Transfer ke Rekening Virtual Account {vaBank.toUpperCase()}.</li>
                      <li>Masukkan nomor VA di atas.</li>
                      <li>Konfirmasi nama akun Anda &amp; total pembayaran {formatRupiah(totalPaid)}.</li>
                      <li>Selesaikan pembayaran dan deposit Anda otomatis aktif.</li>
                    </ol>
                  )}
                </div>

                {paymentType === "manual_transfer" && (
                  <div className="border-t border-outline-variant/20 pt-3">
                    <form onSubmit={handleUploadProof} className="space-y-3">
                      <div className="form-group">
                        <label className="form-label text-xs font-bold text-slate-700">Upload Bukti Transfer</label>
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="form-input p-2 text-xs w-full border border-slate-300 rounded bg-white"
                          onChange={(e) => setProofFile(e.target.files ? e.target.files[0] : null)}
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={isUploading || !proofFile}
                        className="w-full py-2.5 bg-primary hover:bg-primary/95 text-white font-bold rounded-xl transition-all shadow-md shadow-primary/20 flex items-center justify-center gap-1.5 text-xs disabled:opacity-50"
                      >
                        {isUploading ? (
                          <>
                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Mengunggah...
                          </>
                        ) : (
                          <>
                            <span className="material-symbols-outlined text-sm">cloud_upload</span>
                            Saya Sudah Membayar
                          </>
                        )}
                      </button>
                    </form>
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
                  Uang deposit jaminan yang tidak terpakai (NIPL utuh) bersifat *refundable* penuh 100% tanpa potongan apapun dalam 1-3 hari kerja.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* KYC Alert Popup Modal */}
      <ResponsiveModal open={showKycPopup} onClose={() => setShowKycPopup(false)} maxWidthClassName="sm:max-w-sm">
        <div className="w-16 h-16 rounded-full bg-error/10 text-error flex items-center justify-center mx-auto mb-4 border border-error/25">
          <span className="material-symbols-outlined text-3xl font-bold">assignment_late</span>
        </div>
        <h3 className="text-body-lg font-bold text-center text-on-surface mb-2">Verifikasi KTP Dibutuhkan</h3>
        <p className="text-body-sm text-center text-on-surface-variant mb-6 leading-relaxed">
          Anda belum verifikasi KTP, silakan ikuti prosedur verifikasi KTP untuk dapat membeli NIPL dan mengikuti lelang.
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
      </ResponsiveModal>
    </BidderLayout>
  );
}
