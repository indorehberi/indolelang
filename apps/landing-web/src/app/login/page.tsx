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
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#F9F8F3] hero-gradient">
      <div className="bg-white/80 backdrop-blur-md rounded-3xl p-8 border border-white/60 shadow-2xl w-full max-w-[480px]">
        {/* Title */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt="BIDKU"
              className="h-10 w-auto mx-auto"
              src="/logo-bidku.png"
            />
          </Link>
          <h2 className="text-heading-md font-bold text-on-surface font-serif mt-2">
            Masuk ke Akun Anda
          </h2>
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
              className="w-full px-4 py-3 bg-surface border border-outline-variant/60 rounded-xl text-body-md text-on-surface placeholder-outline focus:border-premium focus:ring-2 focus:ring-premium/20 focus:outline-none transition-all shadow-inner"
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
              className="w-full px-4 py-3 bg-surface border border-outline-variant/60 rounded-xl text-body-md text-on-surface placeholder-outline focus:border-premium focus:ring-2 focus:ring-premium/20 focus:outline-none transition-all shadow-inner"
            />
          </div>

          <div className="flex items-center justify-between text-body-sm font-medium">
            <label className="flex items-center gap-2 cursor-pointer text-on-surface-variant">
              <input
                type="checkbox"
                checked={formData.rememberMe}
                onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
                className="w-4 h-4 accent-premium rounded border-outline-variant focus:ring-premium"
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
              className="w-full py-3.5 bg-premium text-on-premium rounded-xl text-body-md font-bold hover:bg-premium/85 transition-all btn-press btn-shine shadow-lg shadow-premium/15"
            >
              Masuk Sebagai Bidder
            </button>
            <button
              onClick={(e) => handleLogin(e, "Provider")}
              type="button"
              className="w-full py-3.5 border-2 border-premium/20 text-premium rounded-xl text-body-md font-bold hover:bg-premium hover:text-on-premium transition-all btn-press"
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
