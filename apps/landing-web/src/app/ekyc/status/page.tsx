"use client";

import Link from "next/link";
import { useState, Suspense } from "react";

function EkycStatusContent() {
  const [status] = useState("pending"); // Default to pending (under review by admin)

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-tr from-primary/90 via-primary to-primary-container">
      <div className="bg-white/95 backdrop-blur-md rounded-3xl p-8 border border-white/20 shadow-2xl w-full max-w-[480px]">
        {/* Title */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2 mb-2">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-lg filled">gavel</span>
            </div>
            <span className="font-black text-on-surface text-xl tracking-tight">
              BIDKU
            </span>
          </Link>
          <p className="text-body-md text-on-surface-variant font-medium">
            Status eKYC &amp; Identitas
          </p>
        </div>

        {/* Ekyc Status Card */}
        <div className="space-y-6">
          <div className="text-center p-6 bg-warning/5 border border-warning/20 rounded-2xl">
            <div className="w-16 h-16 bg-warning/10 rounded-full flex items-center justify-center mx-auto text-warning mb-3">
              <span className="material-symbols-outlined text-3xl">
                {status === "verified" ? "verified" : "schedule"}
              </span>
            </div>
            <h3 className="font-bold text-body-lg text-on-surface">
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
              className="w-full py-4 bg-primary text-on-primary rounded-xl text-body-md font-bold hover:bg-primary/90 transition-all btn-press shadow-md flex items-center justify-center gap-1.5"
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
      <div className="min-h-screen flex items-center justify-center bg-primary text-white text-heading-md font-bold">
        Memuat status eKYC...
      </div>
    }>
      <EkycStatusContent />
    </Suspense>
  );
}
