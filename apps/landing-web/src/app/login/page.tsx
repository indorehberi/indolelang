"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
    rememberMe: false,
  });

  const handleLogin = (e: React.FormEvent, role: string) => {
    e.preventDefault();
    if (typeof window !== "undefined") {
      localStorage.setItem("accessToken", "simulated-token-12345");
      localStorage.setItem(
        "user",
        JSON.stringify({
          full_name: role === "Bidder" ? "Budi Santoso" : "PT Astra Mitra",
          email: formData.identifier || (role === "Bidder" ? "budi.santoso@gmail.com" : "astra.mitra@astra.com"),
          phone: "081234567890",
          role: role.toLowerCase(),
        })
      );
    }

    if (role === "Bidder") {
      router.push("/bidder/dashboard");
    } else if (role === "Provider") {
      router.push("/provider/dashboard");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-tr from-primary/90 via-primary to-primary-container">
      <div className="bg-white/95 backdrop-blur-md rounded-3xl p-8 border border-white/20 shadow-2xl w-full max-w-[480px]">
        {/* Title */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-2">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-lg filled">gavel</span>
            </div>
            <span className="font-black text-on-surface text-xl tracking-tight">
              BIDKU
            </span>
          </Link>
          <p className="text-body-md text-on-surface-variant font-medium">
            Masuk ke Akun Anda
          </p>
        </div>

        {/* Form */}
        <form className="space-y-4">
          <div>
            <label className="text-body-sm font-bold text-on-surface block mb-1.5">
              Email / Nomor Handphone <span className="text-error">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.identifier}
              onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
              placeholder="Masukkan email atau no HP"
              className="w-full px-4 py-3 bg-surface border border-outline-variant/60 rounded-xl text-body-md text-on-surface placeholder-outline focus:border-primary focus:outline-none transition-all shadow-inner"
            />
          </div>

          <div>
            <label className="text-body-sm font-bold text-on-surface block mb-1.5">
              Password <span className="text-error">*</span>
            </label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Masukkan password"
              className="w-full px-4 py-3 bg-surface border border-outline-variant/60 rounded-xl text-body-md text-on-surface placeholder-outline focus:border-primary focus:outline-none transition-all shadow-inner"
            />
          </div>

          <div className="flex items-center justify-between text-body-sm font-medium">
            <label className="flex items-center gap-2 cursor-pointer text-on-surface-variant">
              <input
                type="checkbox"
                checked={formData.rememberMe}
                onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
                className="w-4 h-4 accent-primary rounded border-outline-variant focus:ring-primary"
              />
              Ingat Saya
            </label>
            <Link
              href="/lupa-password"
              className="text-primary hover:underline font-semibold"
            >
              Lupa Password?
            </Link>
          </div>

          {/* Login CTAs */}
          <div className="flex flex-col gap-2.5 pt-4">
            <button
              onClick={(e) => handleLogin(e, "Bidder")}
              type="submit"
              className="w-full py-3.5 bg-primary text-on-primary rounded-xl text-body-md font-bold hover:bg-primary/90 transition-all btn-press shadow-md"
            >
              Masuk Sebagai Bidder
            </button>
            <button
              onClick={(e) => handleLogin(e, "Provider")}
              type="button"
              className="w-full py-3.5 bg-secondary text-on-secondary rounded-xl text-body-md font-bold hover:bg-secondary/90 transition-all btn-press shadow-md"
            >
              Masuk Sebagai Provider
            </button>
            <button
              onClick={() => {
                const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:3001/login';
                window.location.href = adminUrl;
              }}
              type="button"
              className="w-full py-3.5 border border-outline-variant hover:bg-surface/50 text-on-surface rounded-xl text-body-md font-bold transition-all btn-press shadow-sm"
            >
              Masuk Sebagai Admin
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="text-center mt-8 text-body-sm text-on-surface-variant">
          Belum punya akun?{" "}
          <Link
            href="/register/bidder"
            className="text-primary hover:underline font-semibold"
          >
            Daftar Bidder
          </Link>{" "}
          atau{" "}
          <Link
            href="/register/provider"
            className="text-primary hover:underline font-semibold"
          >
            Daftar Provider
          </Link>
        </div>
      </div>
    </div>
  );
}
