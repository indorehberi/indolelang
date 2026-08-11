"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, cekUkuranBerkas } from "@/lib/api";
import { useToast } from "@/providers/ToastProvider";

export default function RegisterProviderPage() {
  const router = useRouter();
  const toast = useToast();
  
  // Provider-specific fields
  const [providerType, setProviderType] = useState("perorangan"); // perorangan, perusahaan swasta, perusahaan negara
  const [companyName, setCompanyName] = useState("");
  const [npwp, setNpwp] = useState("");

  // Common profile/verification fields (same as bidder)
  const [nik, setNik] = useState("");
  const [address, setAddress] = useState("");
  const [occupation, setOccupation] = useState("Pegawai Swasta");
  const [bankName, setBankName] = useState("");
  const [bankAccountNo, setBankAccountNo] = useState("");
  const [confirmBankAccountNo, setConfirmBankAccountNo] = useState("");
  const [bankAccountName, setBankAccountName] = useState("");

  // File states (native files)
  const [ktpFile, setKtpFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);

  // Uploaded URL states from backend API
  const [ktpUrl, setKtpUrl] = useState<string | null>(null);
  const [selfieUrl, setSelfieUrl] = useState<string | null>(null);

  const [uploadingKtp, setUploadingKtp] = useState(false);
  const [uploadingSelfie, setUploadingSelfie] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingProfile, setIsCheckingProfile] = useState(true);
  const [agree, setAgree] = useState(false);

  // Camera Modal States
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null); // base64 preview

  // Refs for elements
  const ktpInputRef = useRef<HTMLInputElement>(null);
  const selfieInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const checkProfile = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        router.push("/login");
        return;
      }

      try {
        // If they've already applied as provider, redirect
        const resProvider = await apiFetch("/providers/me");
        if (resProvider.ok) {
          const providerData = (await resProvider.json()).data;
          if (providerData) {
            router.push(providerData.status === "aktif" ? "/provider/dashboard" : "/provider/status");
            return;
          }
        }

        // Prefill from existing profile/user data, if any
        const response = await apiFetch("/users/profile");
        const resData = await response.json();
        if (response.ok && resData.success) {
          const user = resData.data;
          setAddress(user.address || "");
          setOccupation(user.occupation || "Pegawai Swasta");
          setBankName(user.bank_name || "");
          setBankAccountNo(user.bank_account_no || "");
          setConfirmBankAccountNo(user.bank_account_no || "");
          setBankAccountName(user.bank_account_name || "");
          setNik(user.kyc_document?.nik || "");
          setKtpUrl(user.kyc_document?.ktp_url || null);
          setSelfieUrl(user.kyc_document?.selfie_url || null);
        }
      } catch (error) {
        console.error("Gagal memeriksa data user", error);
      } finally {
        setIsCheckingProfile(false);
      }
    };

    checkProfile();
  }, [router]);

  const startCamera = async () => {
    try {
      setCapturedImage(null);
      setIsCameraOpen(true);
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false
      });
      
      setCameraStream(stream);
      
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (err: any) {
      console.error("Gagal membuka kamera:", err);
      toast.warning(`Tidak dapat mengakses kamera (${err.name}: ${err.message}). Silakan unggah file dari galeri.`);
      setIsCameraOpen(false);
      if (selfieInputRef.current) {
        selfieInputRef.current.click();
      }
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setIsCameraOpen(false);
    setCapturedImage(null);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");
      
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Mirror horizontally
        context.translate(canvas.width, 0);
        context.scale(-1, 1);
        
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const dataUrl = canvas.toDataURL("image/jpeg");
        setCapturedImage(dataUrl);
      }
    }
  };

  const saveCapturedPhoto = async () => {
    if (!capturedImage) return;
    
    try {
      setUploadingSelfie(true);
      stopCamera();
      
      // Convert base64 to Blob
      const response = await fetch(capturedImage);
      const blob = await response.blob();
      const file = new File([blob], "selfie_captured.jpg", { type: "image/jpeg" });
      
      const terlaluBesar = cekUkuranBerkas(file);
      if (terlaluBesar) {
        toast.error(terlaluBesar);
        setUploadingSelfie(false);
        return;
      }

      setSelfieFile(file);
      
      // Upload blob
      const uploadData = new FormData();
      uploadData.append("file", file);
      
      const uploadRes = await apiFetch("/upload/single", {
        method: "POST",
        body: uploadData,
      });
      const uploadResData = await uploadRes.json();
      
      if (uploadRes.ok && uploadResData.success) {
        setSelfieUrl(uploadResData.data.url);
        toast.success("Foto Selfie berhasil diunggah.");
      } else {
        toast.error("Gagal mengunggah foto selfie.");
      }
    } catch (err) {
      toast.error("Koneksi bermasalah saat menyimpan foto.");
    } finally {
      setUploadingSelfie(false);
    }
  };

  const handleFileUpload = async (file: File, type: "ktp" | "selfie") => {
    const terlaluBesar = cekUkuranBerkas(file);
    if (terlaluBesar) {
      toast.error(terlaluBesar);
      return;
    }

    const isKtp = type === "ktp";
    if (isKtp) {
      setUploadingKtp(true);
      setKtpFile(file);
    } else {
      setUploadingSelfie(true);
      setSelfieFile(file);
    }

    const uploadData = new FormData();
    uploadData.append("file", file);

    try {
      const response = await apiFetch("/upload/single", {
        method: "POST",
        body: uploadData,
      });
      const resData = await response.json();
      if (response.ok && resData.success) {
        if (isKtp) {
          setKtpUrl(resData.data.url);
          toast.success("Foto KTP berhasil diunggah.");
        } else {
          setSelfieUrl(resData.data.url);
          toast.success("Foto Selfie berhasil diunggah.");
        }
      } else {
        toast.error(resData.error?.message || "Gagal mengunggah berkas.");
      }
    } catch (err) {
      toast.error("Koneksi gagal saat mengunggah berkas.");
    } finally {
      if (isKtp) setUploadingKtp(false);
      else setUploadingSelfie(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: "ktp" | "selfie") => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0], type);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (nik.length !== 16) {
      toast.warning("NIK harus terdiri dari 16 digit.");
      return;
    }

    if (!ktpUrl || !selfieUrl) {
      toast.warning("Harap unggah berkas KTP dan Foto Selfie Anda.");
      return;
    }

    if (!address.trim() || !bankName.trim() || !bankAccountNo.trim() || !bankAccountName.trim()) {
      toast.warning("Harap lengkapi Alamat dan Data Rekening Bank Anda.");
      return;
    }

    if (bankAccountNo !== confirmBankAccountNo) {
      toast.warning("Nomor rekening dan konfirmasi nomor rekening tidak cocok.");
      return;
    }

    if (providerType !== "perorangan" && !companyName.trim()) {
      toast.warning("Nama perusahaan wajib diisi.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await apiFetch("/providers/apply", {
        method: "POST",
        body: JSON.stringify({
          provider_type: providerType,
          company_name: providerType === "perorangan" ? bankAccountName : companyName,
          npwp: npwp || undefined,
          nik,
          address,
          occupation,
          bank_name: bankName,
          bank_account_no: bankAccountNo,
          bank_account_name: bankAccountName,
          ktp_url: ktpUrl,
          selfie_url: selfieUrl,
        }),
      });

      const resData = await response.json();
      if (response.ok && resData.success) {
        router.push("/provider/status");
      } else {
        toast.error(resData.error?.message || "Gagal mengirim pengajuan verifikasi provider.");
      }
    } catch (err) {
      toast.error("Koneksi gagal. Pastikan server aktif.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isCheckingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9F8F3] hero-gradient">
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-premium mb-4"></div>
          <p className="text-body-md text-on-surface-variant font-medium">Memeriksa kelengkapan data Anda...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#F9F8F3] hero-gradient">
      <div className="bg-white/80 backdrop-blur-md rounded-3xl p-8 border border-white/60 shadow-2xl w-full max-w-[480px] md:max-w-[720px]">
        {/* Title */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-block mb-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt="BIDKU" className="h-10 w-auto mx-auto" src="/logo-bidku.png" />
          </Link>
          <h2 className="text-heading-md font-bold text-on-surface font-serif mt-2">
            Verifikasi Provider
          </h2>
        </div>

        <p className="text-body-sm text-on-surface-variant leading-relaxed text-center mb-6">
          Lengkapi data profil dan verifikasi identitas Anda untuk mengaktifkan akun Provider Anda.
        </p>

        {/* Hidden inputs */}
        <input
          type="file"
          ref={ktpInputRef}
          onChange={(e) => handleFileChange(e, "ktp")}
          accept="image/*"
          className="hidden"
        />
        <input
          type="file"
          ref={selfieInputRef}
          onChange={(e) => handleFileChange(e, "selfie")}
          accept="image/*"
          className="hidden"
        />

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Tipe Provider */}
          <div>
            <label className="text-body-sm font-bold text-on-surface block mb-1.5">
              Tipe Provider <span className="text-error">*</span>
            </label>
            <select
              value={providerType}
              onChange={(e) => setProviderType(e.target.value)}
              className="w-full px-4 py-3 bg-surface border border-outline-variant/60 rounded-xl text-body-sm focus:border-premium focus:ring-2 focus:ring-premium/20 focus:outline-none transition-all shadow-inner"
            >
              <option value="perorangan">Perorangan</option>
              <option value="perusahaan swasta">Perusahaan Swasta</option>
              <option value="perusahaan negara">Perusahaan Negara</option>
            </select>
          </div>

          {/* Conditional Company Name */}
          {providerType !== "perorangan" && (
            <div>
              <label className="text-body-sm font-bold text-on-surface block mb-1.5">
                Nama Perusahaan <span className="text-error">*</span>
              </label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Masukkan nama perusahaan swasta/negara"
                className="w-full px-4 py-3 bg-surface border border-outline-variant/60 rounded-xl text-body-sm focus:border-premium focus:ring-2 focus:ring-premium/20 focus:outline-none transition-all shadow-inner"
              />
            </div>
          )}

          {/* NIK */}
          <div>
            <label className="text-body-sm font-bold text-on-surface block mb-1.5">
              Nomor Induk Kependudukan (NIK) <span className="text-error">*</span>
            </label>
            <input
              type="text"
              required
              maxLength={16}
              value={nik}
              onChange={(e) => setNik(e.target.value.replace(/\D/g, ""))}
              placeholder="Masukkan 16 digit NIK KTP"
              className="w-full px-4 py-3 bg-surface border border-outline-variant/60 rounded-xl text-body-md text-on-surface placeholder-outline focus:border-premium focus:ring-2 focus:ring-premium/20 focus:outline-none transition-all shadow-inner"
            />
          </div>

          {/* Alamat Lengkap */}
          <div>
            <label className="text-body-sm font-bold text-on-surface block mb-1.5">
              Alamat Lengkap <span className="text-error">*</span>
            </label>
            <textarea
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Alamat domisili saat ini"
              className="w-full px-4 py-3 bg-surface border border-outline-variant/60 rounded-xl text-body-sm min-h-[70px] resize-y focus:border-premium focus:ring-2 focus:ring-premium/20 focus:outline-none transition-all shadow-inner"
            />
          </div>

          {/* Pekerjaan */}
          <div>
            <label className="text-body-sm font-bold text-on-surface block mb-1.5">Pekerjaan</label>
            <select
              value={occupation}
              onChange={(e) => setOccupation(e.target.value)}
              className="w-full px-4 py-3 bg-surface border border-outline-variant/60 rounded-xl text-body-sm focus:border-premium focus:ring-2 focus:ring-premium/20 focus:outline-none transition-all shadow-inner"
            >
              <option value="ASN">ASN</option>
              <option value="Pegawai Swasta">Pegawai Swasta</option>
              <option value="Wiraswasta">Wiraswasta</option>
              <option value="Lainnya">Lainnya</option>
            </select>
          </div>

          {/* Bank */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="md:col-span-2">
              <label className="text-body-sm font-bold text-on-surface block mb-1.5">
                Bank <span className="text-error">*</span>
              </label>
              <select
                required
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full px-4 py-3 bg-surface border border-outline-variant/60 rounded-xl text-body-sm focus:border-premium focus:ring-2 focus:ring-premium/20 focus:outline-none transition-all shadow-inner"
              >
                <option value="" disabled>Pilih Bank</option>
                <option value="BCA">BCA (Bank Central Asia)</option>
                <option value="Mandiri">Mandiri</option>
                <option value="BNI">BNI (Bank Negara Indonesia)</option>
                <option value="BRI">BRI (Bank Rakyat Indonesia)</option>
                <option value="BSI">BSI (Bank Syariah Indonesia)</option>
                <option value="CIMB Niaga">CIMB Niaga</option>
                <option value="Permata">Permata Bank</option>
                <option value="Danamon">Bank Danamon</option>
                <option value="Lainnya">Lainnya...</option>
              </select>
            </div>
            <div>
              <label className="text-body-sm font-bold text-on-surface block mb-1.5">
                No Rekening <span className="text-error">*</span>
              </label>
              <input
                type="text"
                required
                value={bankAccountNo}
                onChange={(e) => setBankAccountNo(e.target.value)}
                className="w-full px-4 py-3 bg-surface border border-outline-variant/60 rounded-xl text-body-sm focus:border-premium focus:ring-2 focus:ring-premium/20 focus:outline-none transition-all shadow-inner"
              />
            </div>
            <div>
              <label className="text-body-sm font-bold text-on-surface block mb-1.5">
                Konfirmasi No Rekening <span className="text-error">*</span>
              </label>
              <input
                type="text"
                required
                value={confirmBankAccountNo}
                onChange={(e) => setConfirmBankAccountNo(e.target.value)}
                className="w-full px-4 py-3 bg-surface border border-outline-variant/60 rounded-xl text-body-sm focus:border-premium focus:ring-2 focus:ring-premium/20 focus:outline-none transition-all shadow-inner"
              />
            </div>
          </div>

          {/* A/N Rekening */}
          <div>
            <label className="text-body-sm font-bold text-on-surface block mb-1.5">
              A/N Rekening <span className="text-error">*</span>
            </label>
            <input
              type="text"
              required
              value={bankAccountName}
              onChange={(e) => setBankAccountName(e.target.value)}
              className="w-full px-4 py-3 bg-surface border border-outline-variant/60 rounded-xl text-body-sm focus:border-premium focus:ring-2 focus:ring-premium/20 focus:outline-none transition-all shadow-inner"
            />
          </div>

          {/* NPWP (Opsional) */}
          <div>
            <label className="text-body-sm font-bold text-on-surface block mb-1.5">
              Nomor NPWP <span className="text-on-surface-variant font-normal">(Opsional)</span>
            </label>
            <input
              type="text"
              value={npwp}
              onChange={(e) => setNpwp(e.target.value)}
              placeholder="Masukkan nomor NPWP jika ada"
              className="w-full px-4 py-3 bg-surface border border-outline-variant/60 rounded-xl text-body-sm focus:border-premium focus:ring-2 focus:ring-premium/20 focus:outline-none transition-all shadow-inner"
            />
          </div>

          {/* Upload e-KTP & Selfie side-by-side on desktop */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Upload e-KTP */}
            <div>
              <label className="text-body-sm font-bold text-on-surface block mb-1.5">
                Foto e-KTP Depan <span className="text-error">*</span>
              </label>
              <div
                onClick={() => !uploadingKtp && ktpInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all ${
                  ktpUrl
                    ? "border-success bg-success/5"
                    : "border-outline-variant hover:border-premium hover:bg-surface/50"
                }`}
              >
                {uploadingKtp ? (
                  <div className="space-y-2 py-2 flex flex-col items-center justify-center">
                    <span className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <span className="block text-body-sm font-medium text-slate-500">Mengunggah file...</span>
                  </div>
                ) : ktpUrl ? (
                  <div className="space-y-1.5 text-success">
                    <span className="material-symbols-outlined text-3xl">task_alt</span>
                    <span className="block font-bold text-body-sm">KTP Berhasil Dipilih</span>
                    <span className="block text-outline text-[10px] text-badge-text truncate max-w-xs mx-auto">
                      {ktpFile?.name || "KTP Uploaded"}
                    </span>
                  </div>
                ) : (
                  <div className="space-y-1.5 text-on-surface-variant">
                    <span className="material-symbols-outlined text-3xl">photo_camera</span>
                    <span className="block font-bold text-body-sm">Ambil / Seret Foto KTP di sini</span>
                    <span className="block text-outline text-[10px] text-badge-text">Format JPG/PNG maks. 10MB</span>
                  </div>
                )}
              </div>
            </div>

            {/* Capture Selfie with Webcam */}
            <div>
              <label className="text-body-sm font-bold text-on-surface block mb-1.5">
                Ambil Foto Selfie <span className="text-error">*</span>
              </label>
              <div
                className={`border-2 border-dashed rounded-2xl p-5 text-center transition-all ${
                  selfieUrl
                    ? "border-success bg-success/5"
                    : "border-outline-variant hover:bg-surface/50"
                }`}
              >
                {uploadingSelfie ? (
                  <div className="space-y-2 py-2 flex flex-col items-center justify-center">
                    <span className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <span className="block text-body-sm font-medium text-slate-500">Mengunggah file...</span>
                  </div>
                ) : selfieUrl ? (
                  <div className="space-y-2 text-success">
                    <span className="material-symbols-outlined text-3xl">task_alt</span>
                    <span className="block font-bold text-body-sm">Selfie Berhasil Disimpan</span>
                    <span className="block text-outline text-[10px] text-badge-text truncate max-w-xs mx-auto">
                      {selfieFile?.name || "selfie_captured.jpg"}
                    </span>
                    <div className="flex gap-2 justify-center pt-2">
                      <button
                        type="button"
                        onClick={startCamera}
                        className="px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 text-[10px] font-bold rounded-lg transition-all"
                      >
                        Ambil Ulang (Kamera)
                      </button>
                      <button
                        type="button"
                        onClick={() => selfieInputRef.current?.click()}
                        className="px-3 py-1.5 border border-outline-variant text-slate-600 hover:bg-slate-50 text-[10px] font-bold rounded-lg transition-all"
                      >
                        Ganti Berkas (File)
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="space-y-1 text-on-surface-variant">
                      <span className="material-symbols-outlined text-3xl">face</span>
                      <span className="block font-bold text-body-sm">Pilih Metode Pengambilan Foto Selfie</span>
                      <span className="block text-outline text-[10px] text-badge-text">Wajah harus terlihat jelas</span>
                    </div>
                    <div className="flex gap-3 justify-center">
                      <button
                        type="button"
                        onClick={startCamera}
                        className="px-4 py-2.5 bg-primary text-white hover:bg-primary/95 text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-sm">photo_camera</span>
                        Buka Kamera
                      </button>
                      <button
                        type="button"
                        onClick={() => selfieInputRef.current?.click()}
                        className="px-4 py-2.5 border border-outline-variant/60 text-slate-700 hover:bg-slate-50 text-xs font-bold rounded-xl transition-all flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-sm">upload_file</span>
                        Unggah File
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Checkbox Persetujuan */}
          <label className="flex items-start gap-2.5 cursor-pointer text-body-sm text-on-surface-variant mb-6 bg-surface-container-low p-4 rounded-xl border border-outline-variant/30">
            <input
              type="checkbox"
              required
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
              className="w-4.5 h-4.5 accent-premium rounded border-outline-variant focus:ring-premium mt-0.5"
            />
            <span className="leading-tight select-none">
              Saya menyatakan bahwa data yang saya berikan adalah benar dan menyetujui pemrosesan identitas (KTP) sesuai dengan <Link href="https://bidku.co.id/syarat" target="_blank" rel="noreferrer noopener" className="text-primary hover:underline font-semibold">Syarat & Ketentuan</Link> serta <Link href="https://bidku.co.id/kebijakan" target="_blank" rel="noreferrer noopener" className="text-primary hover:underline font-semibold">Kebijakan Privasi</Link> BIDKU.
            </span>
          </label>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting || uploadingKtp || uploadingSelfie || !agree}
            className="w-full py-4 bg-premium text-on-premium rounded-xl text-body-md font-bold hover:bg-premium/85 transition-all btn-press btn-shine shadow-md pt-2 flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Mengirim Verifikasi...
              </>
            ) : (
              "Kirim Verifikasi Provider"
            )}
          </button>
        </form>
      </div>

      {/* Webcam Overlay Modal */}
      {isCameraOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 shadow-2xl border border-outline-variant/30 w-full max-w-[480px] overflow-hidden relative">
            <h3 className="text-body-lg font-bold text-on-surface font-serif text-center mb-4">
              Ambil Foto Selfie
            </h3>

            {/* Video preview / Image Preview */}
            <div className="relative rounded-2xl overflow-hidden bg-slate-900 aspect-video mb-6 border-2 border-primary/20 shadow-inner flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className={`w-full h-full object-cover scale-x-[-1] ${capturedImage ? 'hidden' : 'block'}`}
              />
              {capturedImage && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={capturedImage}
                  alt="Captured Selfie"
                  className="w-full h-full object-cover scale-x-[-1]"
                />
              )}
            </div>

            {/* Canvas hidden container */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Controls */}
            <div className="flex gap-4">
              {!capturedImage ? (
                <>
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="flex-1 py-3 border border-outline-variant text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-all text-xs"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={capturePhoto}
                    className="flex-1 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/95 transition-all text-xs"
                  >
                    Ambil Foto
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setCapturedImage(null)}
                    className="flex-1 py-3 border border-outline-variant text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-all text-xs"
                  >
                    Ulangi
                  </button>
                  <button
                    type="button"
                    onClick={saveCapturedPhoto}
                    disabled={uploadingSelfie}
                    className="flex-1 py-3 bg-success text-white font-bold rounded-xl hover:bg-success/95 transition-all text-xs flex items-center justify-center gap-1.5"
                  >
                    {uploadingSelfie ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Menyimpan...
                      </>
                    ) : (
                      "Gunakan Foto"
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
