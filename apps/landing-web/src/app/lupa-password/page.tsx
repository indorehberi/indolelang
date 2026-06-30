"use client";

import Link from "next/link";
import { useState } from "react";

export default function LupaPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubmitted(true);
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
            Reset Password Akun
          </h2>
        </div>

        {submitted ? (
          <div className="space-y-6 text-center">
            <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto text-success">
              <span className="material-symbols-outlined text-3xl">mail</span>
            </div>
            <div>
              <h3 className="text-heading-md font-bold text-on-surface font-serif">Link Reset Terkirim</h3>
              <p className="text-body-sm text-on-surface-variant leading-relaxed mt-2">
                Kami telah mengirimkan tautan pemulihan sandi ke email <strong>{email}</strong>. Harap periksa kotak masuk dan folder spam Anda.
              </p>
            </div>
            <Link
              href="/login"
              className="block w-full py-3.5 bg-premium text-on-premium rounded-xl text-body-sm font-bold hover:bg-premium/85 transition-all btn-press btn-shine shadow-md text-center"
            >
              Kembali ke Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-body-sm text-on-surface-variant leading-relaxed text-center mb-2">
              Masukkan email terdaftar Anda. Kami akan mengirimkan tautan verifikasi pemulihan password.
            </p>

            <div>
              <label className="text-body-sm font-bold text-on-surface block mb-1.5">
                Alamat Email Terdaftar <span className="text-error">*</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Masukkan email"
                className="w-full px-4 py-3 bg-surface border border-outline-variant/60 rounded-xl text-body-md text-on-surface placeholder-outline focus:border-premium focus:ring-2 focus:ring-premium/20 focus:outline-none transition-all shadow-inner"
              />
            </div>

            <button
              type="submit"
              className="w-full py-4 bg-premium text-on-premium rounded-xl text-body-md font-bold hover:bg-premium/85 transition-all btn-press btn-shine shadow-md pt-2"
            >
              Kirim Link Reset
            </button>

            <div className="text-center mt-6 text-body-sm text-on-surface-variant">
              <Link href="/login" className="text-primary hover:underline font-semibold flex items-center justify-center gap-1.5">
                <span className="material-symbols-outlined text-sm">arrow_back</span>
                Kembali ke Halaman Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
