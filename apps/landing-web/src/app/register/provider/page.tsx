"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterProviderPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    companyName: "",
    npwp: "",
    picName: "",
    email: "",
    password: "",
  });

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    // Redirect to OTP verification page
    router.push(`/verifikasi-otp?email=${encodeURIComponent(formData.email)}`);
  };

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
            Daftar Akun Baru
          </p>
        </div>

        {/* Role Switcher Tabs */}
        <div className="flex bg-surface-variant/30 p-1.5 rounded-2xl mb-6">
          <Link
            href="/register/bidder"
            className="flex-1 text-center py-2.5 rounded-xl font-medium text-body-md text-on-surface-variant hover:text-on-surface transition-all"
          >
            🙋 Bidder (Pembeli)
          </Link>
          <Link
            href="/register/provider"
            className="flex-1 text-center py-2.5 rounded-xl font-bold text-body-md bg-white text-primary shadow-sm transition-all"
          >
            🏢 Provider (Seller)
          </Link>
        </div>

        {/* Form */}
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="text-body-sm font-bold text-on-surface block mb-1.5">
              Nama Perusahaan / Lembaga <span className="text-error">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              placeholder="Misal: PT Astra Auto"
              className="w-full px-4 py-3 bg-surface border border-outline-variant/60 rounded-xl text-body-md text-on-surface placeholder-outline focus:border-primary focus:outline-none transition-all shadow-inner"
            />
          </div>

          <div>
            <label className="text-body-sm font-bold text-on-surface block mb-1.5">
              Nomor NPWP Perusahaan <span className="text-error">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.npwp}
              onChange={(e) => setFormData({ ...formData, npwp: e.target.value })}
              placeholder="Masukkan 16 digit NPWP"
              className="w-full px-4 py-3 bg-surface border border-outline-variant/60 rounded-xl text-body-md text-on-surface placeholder-outline focus:border-primary focus:outline-none transition-all shadow-inner"
            />
          </div>

          <div>
            <label className="text-body-sm font-bold text-on-surface block mb-1.5">
              Nama PIC / Penanggung Jawab <span className="text-error">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.picName}
              onChange={(e) => setFormData({ ...formData, picName: e.target.value })}
              placeholder="Misal: Andi Wijaya"
              className="w-full px-4 py-3 bg-surface border border-outline-variant/60 rounded-xl text-body-md text-on-surface placeholder-outline focus:border-primary focus:outline-none transition-all shadow-inner"
            />
          </div>

          <div>
            <label className="text-body-sm font-bold text-on-surface block mb-1.5">
              Email Resmi Perusahaan <span className="text-error">*</span>
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="Masukkan email perusahaan"
              className="w-full px-4 py-3 bg-surface border border-outline-variant/60 rounded-xl text-body-md text-on-surface placeholder-outline focus:border-primary focus:outline-none transition-all shadow-inner"
            />
          </div>

          <div>
            <label className="text-body-sm font-bold text-on-surface block mb-1.5">
              Password Akun <span className="text-error">*</span>
            </label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Buat password aman"
              className="w-full px-4 py-3 bg-surface border border-outline-variant/60 rounded-xl text-body-md text-on-surface placeholder-outline focus:border-primary focus:outline-none transition-all shadow-inner"
            />
          </div>

          {/* Action */}
          <button
            type="submit"
            className="w-full py-4 bg-secondary text-on-secondary rounded-xl text-body-md font-bold hover:bg-secondary/90 transition-all btn-press shadow-md mt-6"
          >
            Daftar Sebagai Provider
          </button>
        </form>

        {/* Footer */}
        <div className="text-center mt-6 text-body-sm text-on-surface-variant">
          Sudah memiliki akun?{" "}
          <Link
            href="/login"
            className="text-primary hover:underline font-semibold"
          >
            Login di Sini
          </Link>
        </div>
      </div>
    </div>
  );
}
