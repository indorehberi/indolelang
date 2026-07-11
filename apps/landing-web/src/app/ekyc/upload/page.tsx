"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/providers/ToastProvider";

export default function EkycUploadPage() {
  const router = useRouter();
  const toast = useToast();
  const [nik, setNik] = useState("");

  // Unified profile fields (previously a separate "Profil Bidder" form/page)
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
        // Prefill from existing profile data, if any (e.g. re-submission after rejection).
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
        }

        // Check if an application already exists and where it's at.
        const bidderRes = await apiFetch("/bidders/me");
        if (bidderRes.ok) {
          const bidderData = await bidderRes.json();
          const bidder = bidderData.success ? bidderData.data : null;
          if (bidder) {
            if (bidder.status === "antri") {
              toast.info("Pengajuan Anda sedang dalam antrean verifikasi. Anda tidak perlu mengajukan ulang saat ini.");
              router.push("/ekyc/status");
              return;
            } else if (bidder.status === "aktif") {
              toast.info("Akun Anda sudah terverifikasi. Tidak perlu mengajukan ulang.");
              router.push("/ekyc/status");
              return;
            }
            // If ditolak/nonaktif, fall through and allow re-submission.
            setAddress(bidder.address || address);
            setOccupation(bidder.occupation || occupation);
            setBankName(bidder.bank_name || bankName);
            setBankAccountNo(bidder.bank_account_no || bankAccountNo);
            setConfirmBankAccountNo(bidder.bank_account_no || bankAccountNo);
            setBankAccountName(bidder.bank_account_name || bankAccountName);
          }
        }
      } catch (error) {
        console.error("Gagal memeriksa data user", error);
      } finally {
        setIsCheckingProfile(false);
      }
    };

    checkProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const startCamera = async () => {
    try {
      setCapturedImage(null);
      setIsCameraOpen(true);
      
      // Request webcam with front facing mode
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false
      });
      
      setCameraStream(stream);
      
      // Assign stream to video tag
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (err: any) {
      console.error("Gagal membuka kamera:", err);
      toast.warning(`Tidak dapat mengakses kamera (${err.name}: ${err.message}). Kami akan membuka Galeri Foto sebagai alternatif.`);
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
    try {
      if (!videoRef.current) {
        toast.error("Video tidak ditemukan!");
        return;
      }
      if (!canvasRef.current) {
        toast.error("Canvas tidak ditemukan!");
        return;
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      if (!context) {
        toast.error("Gagal memuat canvas 2D context");
        return;
      }

      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      
      // Draw current video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert to dataUrl for preview
      const dataUrl = canvas.toDataURL("image/jpeg");
      setCapturedImage(dataUrl);
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan saat mengambil foto: " + (err as Error).message);
    }
  };

  const base64ToBlob = (base64Data: string, contentType: string = "image/jpeg") => {
    const byteCharacters = atob(base64Data.split(",")[1]);
    const byteArrays = [];
    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512);
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }
    return new Blob(byteArrays, { type: contentType });
  };

  const saveCapturedPhoto = async () => {
    if (capturedImage) {
      try {
        const blob = base64ToBlob(capturedImage, "image/jpeg");
        const file = new File([blob], `selfie_${Date.now()}.jpg`, { type: "image/jpeg" });
        
        // Close camera
        stopCamera();
        
        // Upload to backend
        await handleFileUpload(file, "selfie");
      } catch (err) {
        console.error("Gagal memproses gambar:", err);
        toast.error("Gagal memproses jepretan kamera.");
      }
    }
  };

  const handleFileUpload = async (file: File, type: "ktp" | "selfie") => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      router.push("/login");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "kyc");

    if (type === "ktp") setUploadingKtp(true);
    else setUploadingSelfie(true);

    try {
      const response = await apiFetch("/upload/single", {
        method: "POST",
        body: formData,
      });

      const resData = await response.json();
      if (response.ok && resData.success) {
        if (type === "ktp") {
          setKtpUrl(resData.data.url);
          setKtpFile(file);
        } else {
          setSelfieUrl(resData.data.url);
          setSelfieFile(file);
        }
      } else {
        toast.error(resData.error?.message || `Gagal mengunggah foto ${type.toUpperCase()}.`);
      }
    } catch (err) {
      toast.error("Koneksi gagal saat mengunggah berkas. Pastikan server aktif.");
    } finally {
      if (type === "ktp") setUploadingKtp(false);
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
      toast.warning("Harap unggah kedua foto dokumen eKYC.");
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

    setIsSubmitting(true);

    try {
      // Submit unified profile + KYC application in a single call
      const response = await apiFetch("/bidders/apply", {
        method: "POST",
        body: JSON.stringify({
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
        router.push("/ekyc/status");
      } else {
        toast.error(resData.error?.message || "Gagal mengirim pengajuan bidder.");
      }
    } catch (err) {
      toast.error("Koneksi gagal saat mengirim dokumen. Pastikan server aktif.");
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
      <div className="bg-white/80 backdrop-blur-md rounded-3xl p-8 border border-white/60 shadow-2xl w-full max-w-[480px]">
        {/* Title */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-block mb-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt="BIDKU"
              className="h-10 w-auto mx-auto"
              src="/logo-bidku.png"
            />
          </Link>
          <h2 className="text-heading-md font-bold text-on-surface font-serif mt-2">
            Pengajuan Menjadi Bidder
          </h2>
        </div>

        <p className="text-body-sm text-on-surface-variant leading-relaxed text-center mb-6">
          Lengkapi data profil dan verifikasi identitas Anda dalam satu pengajuan. Tim Admin akan meninjau data Anda.
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
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
                  <span className="block text-outline text-[10px] text-badge-text">Format JPG/PNG maks. 5MB</span>
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
              Saya menyatakan bahwa data yang saya berikan adalah benar dan menyetujui pemrosesan identitas (e-KYC) sesuai dengan <Link href="/syarat" target="_blank" className="text-primary hover:underline font-semibold">Syarat & Ketentuan</Link> serta <Link href="/kebijakan" target="_blank" className="text-primary hover:underline font-semibold">Kebijakan Privasi</Link> IndoLelang.
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
                Mengirim Pengajuan...
              </>
            ) : (
              "Kirim Pengajuan Bidder"
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
                    className="flex-1 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/95 transition-all shadow-md flex items-center justify-center gap-1.5 text-xs"
                  >
                    <span className="material-symbols-outlined text-base">photo_camera</span>
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
                    Ambil Ulang
                  </button>
                  <button
                    type="button"
                    onClick={saveCapturedPhoto}
                    className="flex-1 py-3 bg-success text-white font-bold rounded-xl hover:bg-success/90 transition-all shadow-md flex items-center justify-center gap-1.5 text-xs"
                  >
                    <span className="material-symbols-outlined text-base">check_circle</span>
                    Gunakan Foto
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
