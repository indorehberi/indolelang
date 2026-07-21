"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import BidderLayout from "../../../components/layout/BidderLayout";
import PageSkeleton from "@/components/ui/PageSkeleton";
import { useToast } from "@/providers/ToastProvider";

export default function BidderProfile() {
  const toast = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  
  // New Profile Fields
  const [address, setAddress] = useState("");
  const [occupation, setOccupation] = useState("Pegawai Swasta");
  const [bankName, setBankName] = useState("");
  const [bankAccountNo, setBankAccountNo] = useState("");
  const [bankAccountName, setBankAccountName] = useState("");
  const [confirmBankAccountNo, setConfirmBankAccountNo] = useState("");
  const [bankInquiryMode, setBankInquiryMode] = useState("manual");
  const [npwp, setNpwp] = useState("");
  const [npwpUrl, setNpwpUrl] = useState("");
  const [npwpFile, setNpwpFile] = useState<File | null>(null);
  const [isUploadingNpwp, setIsUploadingNpwp] = useState(false);
  const [isCheckingBank, setIsCheckingBank] = useState(false);

  const [ekycStatus, setEkycStatus] = useState("unverified"); // unverified, pending, approved, rejected
  const [ktpUploaded, setKtpUploaded] = useState(false);
  const [selfieUploaded, setSelfieUploaded] = useState(false);
  const [nik, setNik] = useState("");
  const [ktpUrl, setKtpUrl] = useState("");
  const [selfieUrl, setSelfieUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const [isEditingEnabled, setIsEditingEnabled] = useState(false);
  const [consentAgree, setConsentAgree] = useState(false);
  const isVerified = ekycStatus === "approved" || ekycStatus === "verified";

  const handleCancelEdit = () => {
    setIsEditingEnabled(false);
    setConsentAgree(false);
    loadProfileData();
  };

  const loadProfileData = async () => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    try {
      setLoading(true);
      // 1. Fetch Profile Info
      const resProfile = await apiFetch("/users/profile");
      const resProfileData = await resProfile.json();
      if (resProfile.ok && resProfileData.success) {
        const user = resProfileData.data;
        setName(user.full_name || "");
        setEmail(user.email || "");
        setPhone(user.phone || "");
        setAddress(user.address || "");
        setOccupation(user.occupation || "Pegawai Swasta");
        setBankName(user.bank_name || "");
        setBankAccountNo(user.bank_account_no || "");
        setConfirmBankAccountNo(user.bank_account_no || "");
        setBankAccountName(user.bank_account_name || "");
        setNpwp(user.npwp || "");
        setNpwpUrl(user.npwp_url || "");
        if (user.bank_inquiry_mode) {
          setBankInquiryMode(user.bank_inquiry_mode);
        }
      }

      setConsentAgree(false);

      // 2. Fetch KYC Document Status
      const resKyc = await apiFetch("/kyc/status");
      const resKycData = await resKyc.json();
      if (resKyc.ok && resKycData.success) {
        const kyc = resKycData.data;
        setEkycStatus(kyc.status || "pending");
        setKtpUploaded(!!kyc.ktp_url);
        setSelfieUploaded(!!kyc.selfie_url);
        setNik(kyc.nik || "");
        setKtpUrl(kyc.ktp_url || "");
        setSelfieUrl(kyc.selfie_url || "");
      } else if (resKyc.status === 404) {
        // KYC documents not uploaded yet
        setEkycStatus("unverified");
        setKtpUploaded(false);
        setSelfieUploaded(false);
        setNik("");
        setKtpUrl("");
        setSelfieUrl("");
      }
    } catch (err) {
      console.error("Failed to load profile/kyc data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfileData();
  }, []);

  const handleNpwpUpload = async () => {
    if (!npwpFile) return;
    
    setIsUploadingNpwp(true);

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
        toast.success("NPWP berhasil diunggah! Jangan lupa klik Simpan Perubahan.");
      } else {
        toast.error(resData.error?.message || "Gagal mengunggah dokumen.");
      }
    } catch (err) {
      toast.error("Koneksi gagal saat mengunggah dokumen.");
    } finally {
      setIsUploadingNpwp(false);
    }
  };

  const handleCheckBank = async () => {
    if (!bankName || !bankAccountNo) {
      toast.warning("Pilih bank dan isi nomor rekening terlebih dahulu.");
      return;
    }
    
    setIsCheckingBank(true);

    try {
      const response = await apiFetch("/bank/validate", {
        method: "POST",
        body: JSON.stringify({
          bank_code: bankName,
          account_no: bankAccountNo,
        }),
      });
      
      const resData = await response.json();
      if (response.ok && resData.success) {
        setBankAccountName(resData.data.account_name);
        toast.success("Rekening berhasil divalidasi atas nama: " + resData.data.account_name);
      } else {
        toast.error(resData.error?.message || "Rekening tidak ditemukan atau tidak valid.");
        setBankAccountName("");
      }
    } catch (err) {
      toast.error("Koneksi gagal saat mengecek rekening.");
    } finally {
      setIsCheckingBank(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (bankInquiryMode === "manual") {
      if (bankAccountNo !== confirmBankAccountNo) {
        toast.warning("Nomor Rekening dan Konfirmasi Nomor Rekening tidak cocok!");
        return;
      }
      if (!bankAccountName.trim()) {
        toast.warning("Atas Nama Rekening wajib diisi!");
        return;
      }
    }
    
    if (typeof window === "undefined") return;

    setIsSaving(true);
    try {
      const response = await apiFetch("/users/profile", {
        method: "PUT",
        body: JSON.stringify({
          full_name: name,
          phone: phone,
          address: address,
          occupation: occupation,
          bank_name: bankName,
          bank_account_no: bankAccountNo,
          bank_account_name: bankAccountName,
          npwp: npwp,
          npwp_url: npwpUrl,
        }),
      });

      const resData = await response.json();
      if (response.ok && resData.success) {
        // Sync local storage user
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const userObj = JSON.parse(storedUser);
          userObj.full_name = name;
          userObj.phone = phone;
          userObj.address = address;
          userObj.occupation = occupation;
          userObj.bank_name = bankName;
          userObj.bank_account_no = bankAccountNo;
          userObj.bank_account_name = bankAccountName;
          userObj.npwp = npwp;
          userObj.npwp_url = npwpUrl;
          localStorage.setItem("user", JSON.stringify(userObj));
        }
        toast.success("Profil Anda berhasil diperbarui!");
        setIsEditingEnabled(false);
        loadProfileData();
      } else {
        toast.error(resData.error?.message || "Gagal memperbarui profil.");
      }
    } catch (err) {
      toast.error("Koneksi gagal saat memperbarui profil.");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <BidderLayout pageTitle="Profil & Verifikasi KTP">
        <PageSkeleton />
      </BidderLayout>
    );
  }

  return (
    <BidderLayout pageTitle="PROFIL SAYA">
      <div className="grid-2-1">
        {/* Left Column Form */}
        <div>
          <div className="card">
            <div className="card-header flex justify-between items-center">
              <span>Informasi Personal</span>
              {isVerified && !isEditingEnabled && (
                <span className="badge-ui success flex items-center gap-1 text-[10px]">
                  <span className="material-symbols-outlined text-xs">verified</span> VERIFIED
                </span>
              )}
            </div>
            
            <form onSubmit={handleSave} className="space-y-4">
              <div className="panel-form-group">
                <label className="panel-form-label">Nama Lengkap Sesuai KTP</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isVerified && !isEditingEnabled}
                  className={`panel-form-input ${isVerified && !isEditingEnabled ? 'bg-slate-50 text-slate-500 cursor-not-allowed' : ''}`}
                />
              </div>
              <div className="panel-form-group">
                <label className="panel-form-label">Nomor NIK KTP</label>
                <input
                  type="text"
                  value={nik || (ekycStatus !== "unverified" ? "Belum diisi" : "")}
                  onChange={(e) => setNik(e.target.value)}
                  disabled={isVerified && !isEditingEnabled}
                  className={`panel-form-input ${isVerified && !isEditingEnabled ? 'bg-slate-50 text-slate-500 cursor-not-allowed' : ''}`}
                  placeholder="Disubmit melalui halaman verifikasi KTP"
                />
              </div>
              <div className="panel-form-group">
                <label className="panel-form-label">Alamat Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isVerified && !isEditingEnabled}
                  className={`panel-form-input ${isVerified && !isEditingEnabled ? 'bg-slate-50 text-slate-500 cursor-not-allowed' : ''}`}
                />
              </div>
              <div className="panel-form-group">
                <label className="panel-form-label">Nomor WhatsApp / Telepon</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={isVerified && !isEditingEnabled}
                  className={`panel-form-input ${isVerified && !isEditingEnabled ? 'bg-slate-50 text-slate-500 cursor-not-allowed' : ''}`}
                  required
                />
              </div>
              <div className="panel-form-group">
                <label className="panel-form-label">Alamat Lengkap</label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  disabled={isVerified && !isEditingEnabled}
                  className={`panel-form-input min-h-[80px] resize-y ${isVerified && !isEditingEnabled ? 'bg-slate-50 text-slate-500 cursor-not-allowed' : ''}`}
                  placeholder="Alamat domisili saat ini"
                />
              </div>
              <div className="panel-form-group">
                <label className="panel-form-label">Pekerjaan</label>
                <select
                  value={occupation}
                  onChange={(e) => setOccupation(e.target.value)}
                  disabled={isVerified && !isEditingEnabled}
                  className={`panel-form-input ${isVerified && !isEditingEnabled ? 'bg-slate-50 text-slate-500 cursor-not-allowed' : ''}`}
                >
                  <option value="ASN">ASN</option>
                  <option value="Pegawai Swasta">Pegawai Swasta</option>
                  <option value="Wiraswasta">Wiraswasta</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>
              <div className="panel-form-group">
                <label className="panel-form-label">Bank <span className="text-error">*</span></label>
                <input
                  list="banks"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  disabled={isVerified && !isEditingEnabled}
                  className={`panel-form-input ${isVerified && !isEditingEnabled ? 'bg-slate-50 text-slate-500 cursor-not-allowed' : ''}`}
                  required
                  placeholder="Ketik atau pilih nama bank"
                />
                <datalist id="banks">
                  <option value="BCA">BCA (Bank Central Asia)</option>
                  <option value="Mandiri">Bank Mandiri</option>
                  <option value="BNI">BNI (Bank Negara Indonesia)</option>
                  <option value="BRI">BRI (Bank Rakyat Indonesia)</option>
                  <option value="BSI">BSI (Bank Syariah Indonesia)</option>
                  <option value="CIMB Niaga">CIMB Niaga</option>
                  <option value="Permata">Bank Permata</option>
                  <option value="Danamon">Bank Danamon</option>
                  <option value="BTN">BTN (Bank Tabungan Negara)</option>
                  <option value="Maybank">Maybank Indonesia</option>
                  <option value="Mega">Bank Mega</option>
                  <option value="BTPN">BTPN</option>
                  <option value="OCBC NISP">OCBC NISP</option>
                  <option value="Panin">Panin Bank</option>
                  <option value="Muamalat">Bank Muamalat</option>
                  <option value="Sinarmas">Bank Sinarmas</option>
                  <option value="Bukopin">KB Bukopin</option>
                  <option value="DKI">Bank DKI</option>
                  <option value="BJB">Bank BJB</option>
                  <option value="Jago">Bank Jago</option>
                  <option value="SeaBank">SeaBank</option>
                  <option value="Neo Commerce">Bank Neo Commerce (BNC)</option>
                  <option value="Blu">Blu by BCA Digital</option>
                  <option value="Jenius">Jenius (BTPN)</option>
                  <option value="BPD Bali">BPD Bali</option>
                  <option value="BPD DIY">BPD DIY</option>
                  <option value="BPD Jateng">Bank Jateng</option>
                  <option value="BPD Jatim">Bank Jatim</option>
                </datalist>
              </div>
              <div className="panel-form-group">
                <label className="panel-form-label">No Rekening <span className="text-error">*</span></label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={bankAccountNo}
                    onChange={(e) => setBankAccountNo(e.target.value)}
                    disabled={isVerified && !isEditingEnabled}
                    className={`panel-form-input flex-1 ${isVerified && !isEditingEnabled ? 'bg-slate-50 text-slate-500 cursor-not-allowed' : ''}`}
                    required
                    placeholder="Contoh: 1234567890"
                  />
                  {bankInquiryMode === "auto" && (
                    <button
                      type="button"
                      onClick={handleCheckBank}
                      disabled={isCheckingBank || !bankName || !bankAccountNo || (isVerified && !isEditingEnabled)}
                      className="px-4 py-2 bg-secondary hover:bg-secondary/90 text-white font-bold rounded-xl transition-all shadow-sm text-sm flex items-center justify-center disabled:opacity-50 min-w-[120px]"
                    >
                      {isCheckingBank ? (
                        <span className="material-symbols-outlined animate-spin">sync</span>
                      ) : (
                        "Cek Rekening"
                      )}
                    </button>
                  )}
                </div>
              </div>

              {bankInquiryMode === "manual" && (
                <div className="panel-form-group">
                  <label className="panel-form-label">Konfirmasi No Rekening <span className="text-error">*</span></label>
                  <input
                    type="text"
                    value={confirmBankAccountNo}
                    onChange={(e) => setConfirmBankAccountNo(e.target.value)}
                    disabled={isVerified && !isEditingEnabled}
                    className={`panel-form-input ${isVerified && !isEditingEnabled ? 'bg-slate-50 text-slate-500 cursor-not-allowed' : ''}`}
                    required
                    placeholder="Ketik ulang nomor rekening"
                  />
                </div>
              )}

              <div className="panel-form-group">
                <label className="panel-form-label">A/N Rekening <span className="text-error">*</span></label>
                <input
                  type="text"
                  value={bankAccountName}
                  onChange={(e) => setBankAccountName(e.target.value)}
                  disabled={(bankInquiryMode === "auto" && !isEditingEnabled) || (isVerified && !isEditingEnabled)}
                  className={`panel-form-input ${((bankInquiryMode === 'auto' && !isEditingEnabled) || (isVerified && !isEditingEnabled)) ? 'bg-slate-50 text-slate-500 cursor-not-allowed' : ''}`}
                  required
                  readOnly={bankInquiryMode === "auto" && !isEditingEnabled}
                  placeholder={bankInquiryMode === "auto" && !isEditingEnabled ? "Nama akan muncul otomatis setelah Anda menekan Cek Rekening" : "Ketik nama lengkap pemilik rekening"}
                />
              </div>
              <div className="panel-form-group">
                <label className="panel-form-label">Nomor NPWP</label>
                <input
                  type="text"
                  value={npwp}
                  onChange={(e) => setNpwp(e.target.value)}
                  disabled={isVerified && !isEditingEnabled}
                  className={`panel-form-input ${isVerified && !isEditingEnabled ? 'bg-slate-50 text-slate-500 cursor-not-allowed' : ''}`}
                  placeholder="Opsional, disarankan"
                />
              </div>
              <div className="panel-form-group">
                <label className="panel-form-label">Upload Dokumen NPWP</label>
                <div className="flex gap-3 items-center">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        setNpwpFile(e.target.files[0]);
                      }
                    }}
                    disabled={isVerified && !isEditingEnabled}
                    className="w-full px-4 py-1.5 rounded-xl border border-outline-variant/60 text-xs text-slate-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer focus:border-premium outline-none flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <button
                    type="button"
                    onClick={handleNpwpUpload}
                    disabled={!npwpFile || isUploadingNpwp || (isVerified && !isEditingEnabled)}
                    className="px-4 py-2 bg-secondary text-white font-bold rounded-xl disabled:opacity-50"
                  >
                    {isUploadingNpwp ? "Upload..." : "Upload"}
                  </button>
                </div>
                {npwpUrl && (
                  <div className="text-xs text-success mt-2 font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">check_circle</span>
                    Dokumen NPWP tersimpan
                  </div>
                )}
              </div>

              <div className="pt-2">
                {(!isVerified || isEditingEnabled) && (
                  <label className="flex items-start gap-2.5 cursor-pointer text-body-sm text-on-surface-variant my-4 bg-surface-container-low p-4 rounded-xl border border-outline-variant/30">
                    <input
                      type="checkbox"
                      required
                      checked={consentAgree}
                      onChange={(e) => setConsentAgree(e.target.checked)}
                      className="w-4.5 h-4.5 accent-premium rounded border-outline-variant focus:ring-premium mt-0.5"
                    />
                    <span className="leading-tight select-none text-xs text-slate-600">
                      Perubahan data profil berlaku untuk transaksi berikutnya. Transaksi yang telah terjadi sebelumnya tidak akan berubah.
                    </span>
                  </label>
                )}

                {isVerified ? (
                  !isEditingEnabled ? (
                    <button
                      type="button"
                      onClick={() => setIsEditingEnabled(true)}
                      className="w-full sm:w-auto px-6 py-3 bg-secondary hover:bg-secondary/95 text-white font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined text-lg">edit</span>
                      Ajukan Edit Data
                    </button>
                  ) : (
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        type="submit"
                        disabled={isSaving || !consentAgree}
                        className="flex-1 px-6 py-3 bg-primary hover:bg-primary/95 text-white font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                      >
                        {isSaving ? (
                          <>
                            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Mengajukan...
                          </>
                        ) : (
                          <>
                            <span className="material-symbols-outlined text-lg">done</span>
                            Ajukan
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        disabled={isSaving}
                        className="px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                      >
                        <span className="material-symbols-outlined text-lg">close</span>
                        Batal
                      </button>
                    </div>
                  )
                ) : (
                  <button
                    type="submit"
                    disabled={isSaving || !consentAgree}
                    className="w-full sm:w-auto px-6 py-3 bg-primary hover:bg-primary/95 text-white font-bold rounded-xl transition-all shadow-md"
                  >
                    {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* KYC Status Card */}
        <div className="card">
          <div className="card-header">Status Verifikasi KTP</div>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              {ekycStatus === "approved" || ekycStatus === "verified" ? (
                <>
                  <div className="w-12 h-12 rounded-full bg-success/10 text-success flex items-center justify-center border border-success/25">
                    <span className="material-symbols-outlined text-2xl font-bold">verified_user</span>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-800">Verifikasi Berhasil</div>
                    <div className="text-[10px] text-success font-bold uppercase tracking-wider">Aktif</div>
                  </div>
                </>
              ) : ekycStatus === "pending" ? (
                <>
                  <div className="w-12 h-12 rounded-full bg-warning/10 text-warning flex items-center justify-center border border-warning/25">
                    <span className="material-symbols-outlined text-2xl font-bold animate-spin">sync</span>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-800">Sedang Diverifikasi</div>
                    <div className="text-[10px] text-warning font-bold uppercase tracking-wider">Pending Review</div>
                  </div>
                </>
              ) : ekycStatus === "rejected" ? (
                <>
                  <div className="w-12 h-12 rounded-full bg-error/10 text-error flex items-center justify-center border border-error/25">
                    <span className="material-symbols-outlined text-2xl font-bold">report</span>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-800">Verifikasi Ditolak</div>
                    <div className="text-[10px] text-error font-bold uppercase tracking-wider">Ditolak</div>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center border border-slate-200">
                    <span className="material-symbols-outlined text-2xl font-bold">gpp_maybe</span>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-800">Belum Verifikasi</div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Belum Aktif</div>
                  </div>
                </>
              )}
            </div>

            <div className="border-t border-outline-variant/20 pt-4 space-y-3">
              <p className="text-xs text-slate-600 leading-relaxed">
                {ekycStatus === "approved" || ekycStatus === "verified"
                  ? "Akun Anda telah terverifikasi. Anda berhak mengikuti seluruh sesi lelang aktif di IndoLelang."
                  : ekycStatus === "pending"
                  ? "Tim kami sedang memvalidasi kesesuaian data KTP Anda dengan instansi kependudukan."
                  : ekycStatus === "rejected"
                  ? "Dokumen Anda tidak sesuai. Harap ajukan ulang dokumen identitas baru Anda."
                  : "Anda wajib mengunggah KTP dan Swafoto untuk dapat mengikuti transaksi lelang di platform IndoLelang."}
              </p>

              <div className="p-3 bg-slate-50 border border-outline-variant/30 rounded-xl space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Dokumen KTP:</span>
                  <span className={`font-bold ${ktpUploaded ? "text-success" : "text-error"}`}>
                    {ktpUploaded ? "Telah Diunggah" : "Belum Diunggah"}
                  </span>
                </div>
                {ktpUrl && (
                  <img src={ktpUrl} alt="KTP" className="w-full max-h-32 object-cover rounded mt-2 mb-2 border border-slate-200" />
                )}
                <div className="flex justify-between mt-3">
                  <span className="text-slate-500">Foto Selfie:</span>
                  <span className={`font-bold ${selfieUploaded ? "text-success" : "text-error"}`}>
                    {selfieUploaded ? "Telah Diunggah" : "Belum Diunggah"}
                  </span>
                </div>
                {selfieUrl && (
                  <img src={selfieUrl} alt="Selfie" className="w-full max-h-48 object-cover rounded mt-2 border border-slate-200" />
                )}
              </div>

              {ekycStatus === "unverified" && (
                <Link
                  href="/ekyc/upload"
                  className="mt-3 w-full py-2.5 bg-premium text-on-premium font-bold text-body-sm rounded-xl text-center block shadow hover:bg-premium/95 active:scale-98 transition-all"
                >
                  🚀 Mulai Verifikasi KTP
                </Link>
              )}

              {ekycStatus === "rejected" && (
                <Link
                  href="/ekyc/upload"
                  className="mt-3 w-full py-2.5 bg-error text-white font-bold text-body-sm rounded-xl text-center block shadow hover:bg-error/95 active:scale-98 transition-all"
                >
                  🔄 Ajukan Ulang Verifikasi KTP
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </BidderLayout>
  );
}
