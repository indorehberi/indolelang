"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, refreshAccessToken } from "@/lib/api";

export default function ProviderStatusPage() {
  const router = useRouter();
  const [status, setStatus] = useState<string>("loading");
  const [rejectionReason, setRejectionReason] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const res = await apiFetch("/providers/me");
        const resData = await res.json();
        if (res.ok && resData.success && resData.data) {
          setStatus(resData.data.status);
          setRejectionReason(resData.data.rejection_reason || "");
          if (resData.data.status === "aktif") {
            // The access token in localStorage may still carry the
            // pre-approval role (bidder/user) if it was issued before the
            // admin approved this upgrade — refresh it now so the provider
            // dashboard and "ajukan barang" don't get rejected with 403.
            refreshAccessToken();
          }
        } else {
          router.push("/register/provider");
        }
      } catch (err) {
        console.error("Gagal memuat status provider", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, [router]);

  if (loading || status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9F8F3] hero-gradient">
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-premium mb-4"></div>
          <p className="text-body-md text-on-surface-variant font-medium">Memuat status pengajuan...</p>
        </div>
      </div>
    );
  }

  const isActive = status === "aktif";
  const isRejected = status === "ditolak";

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#F9F8F3] hero-gradient">
      <div className="bg-white/80 backdrop-blur-md rounded-3xl p-8 border border-white/60 shadow-2xl w-full max-w-[480px]">
        <div className="text-center mb-6">
          <Link href="/" className="inline-block mb-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt="BIDKU" className="h-10 w-auto mx-auto" src="/logo-bidku.png" />
          </Link>
          <h2 className="text-heading-md font-bold text-on-surface font-serif mt-2">
            Status Pengajuan Provider
          </h2>
        </div>

        <div className={`text-center p-6 border rounded-2xl ${
          isActive ? "bg-success/5 border-success/20" : isRejected ? "bg-error/5 border-error/20" : "bg-warning/5 border-warning/20"
        }`}>
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 ${
            isActive ? "bg-success/10 text-success" : isRejected ? "bg-error/10 text-error" : "bg-warning/10 text-warning"
          }`}>
            <span className="material-symbols-outlined text-3xl">
              {isActive ? "verified" : isRejected ? "report" : "schedule"}
            </span>
          </div>
          <h3 className="font-bold text-body-lg text-on-surface font-serif">
            {isActive ? "Pengajuan Disetujui" : isRejected ? "Pengajuan Ditolak" : "Menunggu Verifikasi Admin"}
          </h3>
          <p className="text-body-sm text-on-surface-variant mt-1.5 leading-relaxed">
            {isActive
              ? "Selamat! Akun Provider Anda sudah aktif. Anda kini dapat mengajukan barang titip jual."
              : isRejected
              ? `Pengajuan Anda ditolak. Alasan: ${rejectionReason || "Dokumen tidak lengkap"}. Silakan ajukan kembali dengan data yang benar.`
              : "Tim Admin BIDKU sedang meninjau data perusahaan dan dokumen identitas Anda."}
          </p>
        </div>

        <div className="pt-6 space-y-3">
          {isActive ? (
            <Link
              href="/provider/dashboard"
              className="w-full py-4 bg-premium text-on-premium rounded-xl text-body-md font-bold hover:bg-premium/85 transition-all shadow-md flex items-center justify-center gap-1.5"
            >
              Lanjut ke Dashboard Provider 🚀
            </Link>
          ) : isRejected ? (
            <Link
              href="/register/provider"
              className="w-full py-4 bg-error text-white rounded-xl text-body-md font-bold hover:bg-error/90 transition-all text-center block"
            >
              Ajukan Kembali
            </Link>
          ) : (
            <button
              disabled
              className="w-full py-4 bg-surface border border-outline-variant/40 text-outline rounded-xl text-body-md font-bold cursor-not-allowed text-center"
            >
              Menunggu Verifikasi Admin...
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
