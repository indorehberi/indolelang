"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function EkycUploadPage() {
  const router = useRouter();
  const [nik, setNik] = useState("");
  const [ktpFile, setKtpFile] = useState<string | null>(null);
  const [selfieFile, setSelfieFile] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (nik.length === 16 && ktpFile && selfieFile) {
      router.push("/ekyc/status?status=pending");
    } else if (nik.length !== 16) {
      alert("NIK harus terdiri dari 16 digit.");
    } else {
      alert("Harap unggah kedua foto dokumen eKYC.");
    }
  };

  const handleMockUpload = (type: "ktp" | "selfie") => {
    if (type === "ktp") {
      setKtpFile("ktp_mock_uploaded.png");
    } else {
      setSelfieFile("selfie_mock_uploaded.png");
    }
  };

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
            Lengkapi eKYC &amp; Identitas
          </h2>
        </div>

        <p className="text-body-sm text-on-surface-variant leading-relaxed text-center mb-6">
          Untuk keamanan transaksi lelang, harap upload data e-KTP dan foto selfie memegang KTP Anda.
        </p>

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

          {/* Upload e-KTP */}
          <div>
            <label className="text-body-sm font-bold text-on-surface block mb-1.5">
              Foto e-KTP Depan <span className="text-error">*</span>
            </label>
            <div
              onClick={() => handleMockUpload("ktp")}
              className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all ${
                ktpFile
                  ? "border-success bg-success/5"
                  : "border-outline-variant hover:border-premium hover:bg-surface/50"
              }`}
            >
              {ktpFile ? (
                <div className="space-y-1.5 text-success">
                  <span className="material-symbols-outlined text-3xl">task_alt</span>
                  <span className="block font-bold text-body-sm">KTP Berhasil Dipilih</span>
                  <span className="block text-outline text-badge-text">{ktpFile}</span>
                </div>
              ) : (
                <div className="space-y-1.5 text-on-surface-variant">
                  <span className="material-symbols-outlined text-3xl">photo_camera</span>
                  <span className="block font-bold text-body-sm">Ambil / Seret Foto KTP di sini</span>
                  <span className="block text-outline text-badge-text">Format JPG/PNG maks. 5MB</span>
                </div>
              )}
            </div>
          </div>

          {/* Upload Selfie */}
          <div>
            <label className="text-body-sm font-bold text-on-surface block mb-1.5">
              Foto Selfie dengan KTP <span className="text-error">*</span>
            </label>
            <div
              onClick={() => handleMockUpload("selfie")}
              className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all ${
                selfieFile
                  ? "border-success bg-success/5"
                  : "border-outline-variant hover:border-premium hover:bg-surface/50"
              }`}
            >
              {selfieFile ? (
                <div className="space-y-1.5 text-success">
                  <span className="material-symbols-outlined text-3xl">task_alt</span>
                  <span className="block font-bold text-body-sm">Selfie Berhasil Dipilih</span>
                  <span className="block text-outline text-badge-text">{selfieFile}</span>
                </div>
              ) : (
                <div className="space-y-1.5 text-on-surface-variant">
                  <span className="material-symbols-outlined text-3xl">face</span>
                  <span className="block font-bold text-body-sm">Ambil Foto Selfie Pegang KTP Anda</span>
                  <span className="block text-outline text-badge-text">Wajah &amp; KTP harus terlihat jelas</span>
                </div>
              )}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full py-4 bg-premium text-on-premium rounded-xl text-body-md font-bold hover:bg-premium/85 transition-all btn-press btn-shine shadow-md pt-2"
          >
            Kirim Dokumen eKYC
          </button>
        </form>
      </div>
    </div>
  );
}
