"use client";

import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

function EkycStatusContent() {
  const router = useRouter();
  const [status, setStatus] = useState("loading"); // loading, unverified, pending, approved (verified), rejected
  const [userName, setUserName] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchKycStatus = async () => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("accessToken");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      setLoading(true);

      // 1. Fetch user profile for name
      const resUser = await apiFetch("/users/profile");
      const resUserData = await resUser.json();
      if (resUser.ok && resUserData.success) {
        setUserName(resUserData.data.full_name || "Peserta Lelang");
      }

      // 2. Fetch bidder application status
      const resBidder = await apiFetch("/bidders/me");
      const resBidderData = await resBidder.json();

      if (resBidder.ok && resBidderData.success && resBidderData.data) {
        const bidder = resBidderData.data;
        const statusMap: Record<string, string> = {
          antri: "pending",
          aktif: "approved",
          ditolak: "rejected",
          nonaktif: "rejected",
        };
        setStatus(statusMap[bidder.status] || "pending");
        setRejectionReason(bidder.rejection_reason || "");
      } else {
        // Application not submitted yet, redirect to the unified application page
        setStatus("unverified");
        router.push("/ekyc/upload");
      }
    } catch (err) {
      console.error("Failed to load ekyc status", err);
      setStatus("unverified");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKycStatus();
  }, []);

  if (loading || status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9F8F3] hero-gradient">
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-premium mb-4"></div>
          <p className="text-body-md text-on-surface-variant font-medium">Memuat status verifikasi...</p>
        </div>
      </div>
    );
  }

  if (status === "unverified") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9F8F3] hero-gradient">
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-premium mb-4"></div>
          <p className="text-body-md text-on-surface-variant font-medium">Mengarahkan ke halaman unggah dokumen...</p>
        </div>
      </div>
    );
  }

  const isVerified = status === "verified" || status === "approved";
  const isRejected = status === "rejected";

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
            Status Verifikasi KTP
          </h2>
        </div>

        {/* Ekyc Status Card */}
        <div className="space-y-6">
          <div className={`text-center p-6 border rounded-2xl ${
            isVerified 
              ? "bg-success/5 border-success/20" 
              : isRejected 
              ? "bg-error/5 border-error/20" 
              : "bg-warning/5 border-warning/20"
          }`}>
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 ${
              isVerified 
                ? "bg-success/10 text-success" 
                : isRejected 
                ? "bg-error/10 text-error" 
                : "bg-warning/10 text-warning"
            }`}>
              <span className="material-symbols-outlined text-3xl">
                {isVerified ? "verified" : isRejected ? "report" : "schedule"}
              </span>
            </div>
            <h3 className="font-bold text-body-lg text-on-surface font-serif">
              {isVerified 
                ? "Akun Terverifikasi" 
                : isRejected 
                ? "Verifikasi Dokumen Ditolak" 
                : "Dokumen Sedang Diverifikasi"}
            </h3>
            <p className="text-body-sm text-on-surface-variant mt-1.5 leading-relaxed">
              {isVerified
                ? "Selamat! Tim Admin BIDKU telah memverifikasi dokumen KTP Anda. Akun Anda kini aktif."
                : isRejected
                ? `Pengajuan Anda ditolak. Alasan: ${rejectionReason || "Dokumen tidak sesuai"}. Silakan ajukan kembali dengan data yang benar.`
                : "Dokumen identitas Anda sedang diverifikasi secara manual oleh Tim Admin BIDKU. Estimasi verifikasi selesai dalam 5-10 menit."}
            </p>
          </div>

          <div className="bg-surface rounded-2xl p-4 border border-outline-variant/15 text-body-sm space-y-2 text-on-surface-variant">
            <p className="font-bold text-on-surface">Detail Dokumen Terkirim:</p>
            <p>• Nama: {userName}</p>
            <p>• Metode: Verifikasi Manual Admin</p>
            <p>• Status Saat Ini: <span className={`font-bold capitalize ${
              isVerified ? "text-success" : isRejected ? "text-error" : "text-warning"
            }`}>{status}</span></p>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-6 space-y-3">
          {isVerified ? (
            <Link
              href="/bidder/home"
              className="w-full py-4 bg-premium text-on-premium rounded-xl text-body-md font-bold hover:bg-premium/85 transition-all btn-press btn-shine shadow-md flex items-center justify-center gap-1.5"
            >
              Lanjut ke Dashboard (Akun Aktif) 🚀
            </Link>
          ) : isRejected ? (
            <Link
              href="/ekyc/upload"
              className="w-full py-4 bg-error text-white rounded-xl text-body-md font-bold hover:bg-error/90 transition-all text-center block"
            >
              Unggah Ulang Dokumen KTP
            </Link>
          ) : (
            <button
              disabled
              className="w-full py-4 bg-surface border border-outline-variant/40 text-outline rounded-xl text-body-md font-bold cursor-not-allowed text-center"
            >
              Menunggu Verifikasi Admin...
            </button>
          )}

          <div className="text-center pt-2">
            <Link
              href="/bidder/home"
              className="text-xs font-bold text-primary hover:text-primary/80 transition-all hover:underline"
            >
              ← Kembali ke Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EkycStatusPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#F9F8F3] hero-gradient text-premium text-heading-md font-bold font-serif">
        Memuat status verifikasi...
      </div>
    }>
      <EkycStatusContent />
    </Suspense>
  );
}
