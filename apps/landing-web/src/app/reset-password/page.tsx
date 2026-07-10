"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiUrl, fetchWithRetry } from "@/lib/api";
import { Suspense } from "react";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!token) {
      setErrorMsg("Token tidak ditemukan. Pastikan Anda membuka link dari email Anda.");
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (password !== confirmPassword) {
      setErrorMsg("Konfirmasi password tidak cocok.");
      return;
    }

    if (password.length < 8) {
      setErrorMsg("Password minimal 8 karakter.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const response = await fetchWithRetry(apiUrl("/auth/reset-password"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await response.json();
      
      if (response.ok && data.success) {
        setSuccess(true);
      } else {
        setErrorMsg(data.error?.message || "Gagal mengubah password. Token mungkin sudah kedaluwarsa.");
      }
    } catch (error) {
      setErrorMsg("Terjadi kesalahan koneksi");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#F9F8F3] hero-gradient">
      <div className="bg-white/80 backdrop-blur-md rounded-3xl p-8 border border-white/60 shadow-2xl w-full max-w-[480px]">
        <div className="text-center mb-6">
          <Link href="/" className="inline-block mb-2">
            <img alt="BIDKU" className="h-10 w-auto mx-auto" src="/logo-bidku.png" />
          </Link>
          <h2 className="text-heading-md font-bold text-on-surface font-serif mt-2">
            Buat Password Baru
          </h2>
        </div>

        {success ? (
          <div className="space-y-6 text-center">
            <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto text-success">
              <span className="material-symbols-outlined text-3xl">check_circle</span>
            </div>
            <div>
              <h3 className="text-heading-md font-bold text-on-surface font-serif">Berhasil!</h3>
              <p className="text-body-sm text-on-surface-variant leading-relaxed mt-2">
                Password Anda telah berhasil diperbarui. Silakan login menggunakan password baru Anda.
              </p>
            </div>
            <Link
              href="/login"
              className="block w-full py-3.5 bg-premium text-on-premium rounded-xl text-body-sm font-bold hover:bg-premium/85 transition-all btn-press btn-shine shadow-md text-center"
            >
              Ke Halaman Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-body-sm text-on-surface-variant leading-relaxed text-center mb-4">
              Silakan masukkan password baru Anda.
            </p>

            {errorMsg && (
              <div className="p-3 bg-error/10 text-error rounded-lg text-sm font-medium text-center">
                {errorMsg}
              </div>
            )}

            <div>
              <label className="text-body-sm font-bold text-on-surface block mb-1.5">
                Password Baru <span className="text-error">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  disabled={!token}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 8 karakter"
                  className="w-full px-4 py-3 pr-12 bg-surface border border-outline-variant/60 rounded-xl text-body-md text-on-surface placeholder-outline focus:border-premium focus:ring-2 focus:ring-premium/20 focus:outline-none transition-all shadow-inner"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            <div>
              <label className="text-body-sm font-bold text-on-surface block mb-1.5">
                Konfirmasi Password <span className="text-error">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  disabled={!token}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi password baru"
                  className="w-full px-4 py-3 pr-12 bg-surface border border-outline-variant/60 rounded-xl text-body-md text-on-surface placeholder-outline focus:border-premium focus:ring-2 focus:ring-premium/20 focus:outline-none transition-all shadow-inner"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !token}
              className="w-full mt-4 py-4 bg-premium text-on-premium rounded-xl text-body-md font-bold hover:bg-premium/85 transition-all btn-press btn-shine shadow-md pt-2 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                "Ubah Password"
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-premium"></div></div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
