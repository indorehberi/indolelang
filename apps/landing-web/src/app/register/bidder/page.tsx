"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterBidderPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    nama: "",
    phone: "",
    email: "",
    password: "",
    agree: false,
  });

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.agree) {
      // Redirect to OTP verification page
      router.push(`/verifikasi-otp?phone=${encodeURIComponent(formData.phone)}`);
    } else {
      alert("Anda harus menyetujui Syarat & Ketentuan.");
    }
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
            className="flex-1 text-center py-2.5 rounded-xl font-bold text-body-md bg-white text-primary shadow-sm transition-all"
          >
            🙋 Bidder (Pembeli)
          </Link>
          <Link
            href="/register/provider"
            className="flex-1 text-center py-2.5 rounded-xl font-medium text-body-md text-on-surface-variant hover:text-on-surface transition-all"
          >
            🏢 Provider (Seller)
          </Link>
        </div>

        {/* Form */}
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="text-body-sm font-bold text-on-surface block mb-1.5">
              Nama Lengkap Sesuai KTP <span className="text-error">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.nama}
              onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
              placeholder="Misal: Budi Santoso"
              className="w-full px-4 py-3 bg-surface border border-outline-variant/60 rounded-xl text-body-md text-on-surface placeholder-outline focus:border-primary focus:outline-none transition-all shadow-inner"
            />
          </div>

          <div>
            <label className="text-body-sm font-bold text-on-surface block mb-1.5">
              Nomor Handphone (WhatsApp) <span className="text-error">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="Misal: 08123456789"
              className="w-full px-4 py-3 bg-surface border border-outline-variant/60 rounded-xl text-body-md text-on-surface placeholder-outline focus:border-primary focus:outline-none transition-all shadow-inner"
            />
          </div>

          <div>
            <label className="text-body-sm font-bold text-on-surface block mb-1.5">
              Email Aktif <span className="text-error">*</span>
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="Masukkan alamat email"
              className="w-full px-4 py-3 bg-surface border border-outline-variant/60 rounded-xl text-body-md text-on-surface placeholder-outline focus:border-primary focus:outline-none transition-all shadow-inner"
            />
          </div>

          <div>
            <label className="text-body-sm font-bold text-on-surface block mb-1.5">
              Password Baru <span className="text-error">*</span>
            </label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Minimal 8 karakter"
              className="w-full px-4 py-3 bg-surface border border-outline-variant/60 rounded-xl text-body-md text-on-surface placeholder-outline focus:border-primary focus:outline-none transition-all shadow-inner"
            />
          </div>

          <label className="flex items-start gap-2.5 cursor-pointer text-body-sm text-on-surface-variant pt-2">
            <input
              type="checkbox"
              required
              checked={formData.agree}
              onChange={(e) => setFormData({ ...formData, agree: e.target.checked })}
              className="w-4.5 h-4.5 accent-primary rounded border-outline-variant focus:ring-primary mt-0.5"
            />
            <span>
              Saya menyetujui{" "}
              <Link href="/syarat" className="text-primary hover:underline font-semibold">
                Syarat &amp; Ketentuan
              </Link>{" "}
              IndoLelang.
            </span>
          </label>

          {/* Action */}
          <button
            type="submit"
            className="w-full py-4 bg-primary text-on-primary rounded-xl text-body-md font-bold hover:bg-primary/90 transition-all btn-press shadow-md mt-6"
          >
            Daftar Akun
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
