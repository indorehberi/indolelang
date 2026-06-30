"use client";

import Link from "next/link";
import { useState, Suspense } from "react";

function EkycStatusContent() {
  const [status] = useState("pending"); // Default to pending (under review by admin)

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
            Status eKYC &amp; Identitas
          </h2>
        </div>

        {/* Ekyc Status Card */}
        <div className="space-y-6">
          <div className="text-center p-6 bg-warning/5 border border-warning/20 rounded-2xl">
            <div className="w-16 h-16 bg-warning/10 rounded-full flex items-center justify-center mx-auto text-warning mb-3">
              <span className="material-symbols-outlined text-3xl">
                {status === "verified" ? "verified" : "schedule"}
              </span>
            </div>
            <h3 className="font-bold text-body-lg text-on-surface font-serif">
              {status === "verified" ? "Akun Terverifikasi" : "Dokumen Sedang Diverifikasi"}
            </h3>
            <p className="text-body-sm text-on-surface-variant mt-1.5 leading-relaxed">
              {status === "verified"
                ? "Selamat! Tim Admin Indo-Lelang telah memverifikasi dokumen eKYC Anda. Akun Anda kini aktif."
                : "Dokumen identitas Anda sedang diverifikasi secara manual oleh Tim Admin Indo-Lelang. Estimasi verifikasi selesai dalam 5-10 menit."}
            </p>
          </div>

          <div className="bg-surface rounded-2xl p-4 border border-outline-variant/15 text-body-sm space-y-2 text-on-surface-variant">
            <p className="font-bold text-on-surface">Detail Dokumen Terkirim:</p>
            <p>• NIK: 327310******9003</p>
            <p>• Nama: Budi Santoso</p>
            <p>• Metode: Verifikasi Manual Admin</p>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-6">
          {status === "verified" ? (
            <Link
              href="/"
              className="w-full py-4 bg-premium text-on-premium rounded-xl text-body-md font-bold hover:bg-premium/85 transition-all btn-press btn-shine shadow-md flex items-center justify-center gap-1.5"
            >
              Lanjut ke Dashboard (Akun Aktif) 🚀
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

export default function EkycStatusPage() {
  return (
    <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#F9F8F3] hero-gradient text-premium text-heading-md font-bold font-serif">
        Memuat status eKYC...
      </div>
    }>
      <EkycStatusContent />
    </Suspense>
  );
}
