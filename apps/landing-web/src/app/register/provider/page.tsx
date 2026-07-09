"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { apiUrl } from "@/lib/api";

export default function RegisterProviderPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [companyName, setCompanyName] = useState("");
  const [npwp, setNpwp] = useState("");
  const [npwpUrl, setNpwpUrl] = useState("");
  const [pksNumber, setPksNumber] = useState("");
  const [providerType, setProviderType] = useState("Perusahaan Swasta");
  const [address, setAddress] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankAccountNo, setBankAccountNo] = useState("");
  const [bankAccountName, setBankAccountName] = useState("");
  const [ktpUrl, setKtpUrl] = useState("");
  const [selfieUrl, setSelfieUrl] = useState("");
  const [uploadingNpwp, setUploadingNpwp] = useState(false);
  const [uploadingKtp, setUploadingKtp] = useState(false);
  const [uploadingSelfie, setUploadingSelfie] = useState(false);
  const [hasExistingKyc, setHasExistingKyc] = useState(false);

  const npwpInputRef = useRef<HTMLInputElement>(null);
  const ktpInputRef = useRef<HTMLInputElement>(null);
  const selfieInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        router.push("/login");
        return;
      }

      try {
        // If they've already applied, don't show the form again.
        const resProvider = await fetch(apiUrl("/providers/me"), {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (resProvider.ok) {
          const data = (await resProvider.json()).data;
          if (data) {
            router.push(data.status === "aktif" ? "/provider/dashboard" : "/provider/status");
            return;
          }
        }

        // If they already have bidder profile/KYC data, prefill overlapping fields.
        const resBidder = await fetch(apiUrl("/bidders/me"), {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (resBidder.ok) {
          const bidder = (await resBidder.json()).data;
          if (bidder) {
            setAddress(bidder.address || "");
            setBankName(bidder.bank_name || "");
            setBankAccountNo(bidder.bank_account_no || "");
            setBankAccountName(bidder.bank_account_name || "");
          }
        }

        const resKyc = await fetch(apiUrl("/kyc/status"), {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (resKyc.ok) {
          const kyc = (await resKyc.json()).data;
          if (kyc?.ktp_url && kyc?.selfie_url) {
            setHasExistingKyc(true);
            setKtpUrl(kyc.ktp_url);
            setSelfieUrl(kyc.selfie_url);
          }
        }
      } catch (err) {
        console.error("Gagal memeriksa data awal", err);
      } finally {
        setChecking(false);
      }
    };

    init();
  }, [router]);

  const uploadFile = async (
    file: File,
    setUrl: (url: string) => void,
    setUploading: (v: boolean) => void
  ) => {
    setUploading(true);
    const token = localStorage.getItem("accessToken");
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(apiUrl("/upload/single"), {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const resData = await response.json();
      if (response.ok && resData.success) {
        setUrl(resData.data.url);
      } else {
        alert(resData.error?.message || "Gagal mengunggah berkas.");
      }
    } catch (err) {
      alert("Koneksi gagal saat mengunggah berkas.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!ktpUrl || !selfieUrl) {
      alert("Harap unggah dokumen KTP dan foto selfie Anda.");
      return;
    }

    setIsSubmitting(true);
    const token = localStorage.getItem("accessToken");

    try {
      const response = await fetch(apiUrl("/providers/apply"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          company_name: companyName,
          npwp,
          npwp_url: npwpUrl,
          pks_number: pksNumber,
          provider_type: providerType,
          address,
          bank_name: bankName,
          bank_account_no: bankAccountNo,
          bank_account_name: bankAccountName,
          ...(hasExistingKyc ? {} : { ktp_url: ktpUrl, selfie_url: selfieUrl }),
        }),
      });

      const resData = await response.json();
      if (response.ok && resData.success) {
        router.push("/provider/status");
      } else {
        alert(resData.error?.message || "Gagal mengirim pengajuan provider.");
      }
    } catch (err) {
      alert("Koneksi gagal. Pastikan API server aktif.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9F8F3] hero-gradient">
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-premium mb-4"></div>
          <p className="text-body-md text-on-surface-variant font-medium">Memeriksa data akun Anda...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#F9F8F3] hero-gradient">
      <div className="bg-white/80 backdrop-blur-md rounded-3xl p-8 border border-white/60 shadow-2xl w-full max-w-[560px]">
        <div className="text-center mb-6">
          <Link href="/" className="inline-block mb-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt="BIDKU" className="h-10 w-auto mx-auto" src="/logo-bidku.png" />
          </Link>
          <h2 className="text-heading-md font-bold text-on-surface font-serif mt-2">
            Pengajuan Menjadi Provider
          </h2>
          <p className="text-body-sm text-on-surface-variant mt-1.5 leading-relaxed">
            Lengkapi profil perusahaan dan verifikasi identitas dalam satu pengajuan. Tim kami akan meninjau data Anda.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-body-sm font-bold text-on-surface block mb-1.5">
              Nama Perusahaan <span className="text-error">*</span>
            </label>
            <input
              type="text"
              required
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full px-4 py-3 bg-surface border border-outline-variant/60 rounded-xl text-body-sm focus:border-premium focus:ring-2 focus:ring-premium/20 focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="text-body-sm font-bold text-on-surface block mb-1.5">
              Jenis Provider <span className="text-error">*</span>
            </label>
            <select
              value={providerType}
              onChange={(e) => setProviderType(e.target.value)}
              className="w-full px-4 py-3 bg-surface border border-outline-variant/60 rounded-xl text-body-sm focus:border-premium focus:ring-2 focus:ring-premium/20 focus:outline-none transition-all"
            >
              <option value="Perusahaan Swasta">Perusahaan Swasta</option>
              <option value="BUMN">BUMN</option>
              <option value="Perorangan">Perorangan</option>
            </select>
          </div>

          <div>
            <label className="text-body-sm font-bold text-on-surface block mb-1.5">
              Nomor NPWP <span className="text-error">*</span>
            </label>
            <input
              type="text"
              required
              value={npwp}
              onChange={(e) => setNpwp(e.target.value)}
              className="w-full px-4 py-3 bg-surface border border-outline-variant/60 rounded-xl text-body-sm focus:border-premium focus:ring-2 focus:ring-premium/20 focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="text-body-sm font-bold text-on-surface block mb-1.5">
              Upload Dokumen NPWP <span className="text-error">*</span>
            </label>
            <input type="file" ref={npwpInputRef} accept="image/*,.pdf" className="hidden"
              onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0], setNpwpUrl, setUploadingNpwp)} />
            <button
              type="button"
              onClick={() => npwpInputRef.current?.click()}
              disabled={uploadingNpwp}
              className={`w-full px-4 py-3 border-2 border-dashed rounded-xl text-body-sm font-bold transition-all ${
                npwpUrl ? "border-success bg-success/5 text-success" : "border-outline-variant hover:border-premium"
              }`}
            >
              {uploadingNpwp ? "Mengunggah..." : npwpUrl ? "✓ Dokumen NPWP Tersimpan" : "Pilih Berkas NPWP"}
            </button>
          </div>

          <div>
            <label className="text-body-sm font-bold text-on-surface block mb-1.5">
              Nomor PKS <span className="text-error">*</span>
            </label>
            <input
              type="text"
              required
              value={pksNumber}
              onChange={(e) => setPksNumber(e.target.value)}
              placeholder="Nomor Perjanjian Kerja Sama"
              className="w-full px-4 py-3 bg-surface border border-outline-variant/60 rounded-xl text-body-sm focus:border-premium focus:ring-2 focus:ring-premium/20 focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="text-body-sm font-bold text-on-surface block mb-1.5">
              Alamat Perusahaan <span className="text-error">*</span>
            </label>
            <textarea
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-4 py-3 bg-surface border border-outline-variant/60 rounded-xl text-body-sm min-h-[80px] resize-y focus:border-premium focus:ring-2 focus:ring-premium/20 focus:outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-body-sm font-bold text-on-surface block mb-1.5">Bank</label>
              <input
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full px-4 py-3 bg-surface border border-outline-variant/60 rounded-xl text-body-sm focus:border-premium focus:ring-2 focus:ring-premium/20 focus:outline-none transition-all"
              />
            </div>
            <div>
              <label className="text-body-sm font-bold text-on-surface block mb-1.5">No Rekening</label>
              <input
                type="text"
                value={bankAccountNo}
                onChange={(e) => setBankAccountNo(e.target.value)}
                className="w-full px-4 py-3 bg-surface border border-outline-variant/60 rounded-xl text-body-sm focus:border-premium focus:ring-2 focus:ring-premium/20 focus:outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="text-body-sm font-bold text-on-surface block mb-1.5">A/N Rekening</label>
            <input
              type="text"
              value={bankAccountName}
              onChange={(e) => setBankAccountName(e.target.value)}
              className="w-full px-4 py-3 bg-surface border border-outline-variant/60 rounded-xl text-body-sm focus:border-premium focus:ring-2 focus:ring-premium/20 focus:outline-none transition-all"
            />
          </div>

          {hasExistingKyc ? (
            <div className="p-3 bg-success/5 border border-success/20 rounded-xl text-body-xs text-success font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">verified_user</span>
              KTP &amp; Selfie Anda sudah terverifikasi sebelumnya, tidak perlu diunggah ulang.
            </div>
          ) : (
            <>
              <div>
                <label className="text-body-sm font-bold text-on-surface block mb-1.5">
                  Upload KTP <span className="text-error">*</span>
                </label>
                <input type="file" ref={ktpInputRef} accept="image/*" className="hidden"
                  onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0], setKtpUrl, setUploadingKtp)} />
                <button
                  type="button"
                  onClick={() => ktpInputRef.current?.click()}
                  disabled={uploadingKtp}
                  className={`w-full px-4 py-3 border-2 border-dashed rounded-xl text-body-sm font-bold transition-all ${
                    ktpUrl ? "border-success bg-success/5 text-success" : "border-outline-variant hover:border-premium"
                  }`}
                >
                  {uploadingKtp ? "Mengunggah..." : ktpUrl ? "✓ KTP Tersimpan" : "Pilih Foto KTP"}
                </button>
              </div>

              <div>
                <label className="text-body-sm font-bold text-on-surface block mb-1.5">
                  Upload Foto Selfie <span className="text-error">*</span>
                </label>
                <input type="file" ref={selfieInputRef} accept="image/*" className="hidden"
                  onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0], setSelfieUrl, setUploadingSelfie)} />
                <button
                  type="button"
                  onClick={() => selfieInputRef.current?.click()}
                  disabled={uploadingSelfie}
                  className={`w-full px-4 py-3 border-2 border-dashed rounded-xl text-body-sm font-bold transition-all ${
                    selfieUrl ? "border-success bg-success/5 text-success" : "border-outline-variant hover:border-premium"
                  }`}
                >
                  {uploadingSelfie ? "Mengunggah..." : selfieUrl ? "✓ Selfie Tersimpan" : "Pilih Foto Selfie"}
                </button>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={isSubmitting || uploadingNpwp || uploadingKtp || uploadingSelfie}
            className="w-full py-4 bg-premium text-on-premium rounded-xl text-body-md font-bold hover:bg-premium/85 transition-all shadow-md disabled:opacity-50 mt-2"
          >
            {isSubmitting ? "Mengirim Pengajuan..." : "Kirim Pengajuan Provider"}
          </button>
        </form>
      </div>
    </div>
  );
}
