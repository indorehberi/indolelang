"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiUrl, fetchWithRetry } from "@/lib/api";
import GoogleAuthModal from "@/components/GoogleAuthModal";

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
    rememberMe: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
  const [googleDefaultRole, setGoogleDefaultRole] = useState<"bidder" | "provider">("bidder");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      const response = await fetchWithRetry(apiUrl("/auth/login"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.identifier,
          password: formData.password,
        }),
      });

      const resData = await response.json();
      if (response.ok && resData.success) {
        const user = resData.data.user;
        const accessToken = resData.data.accessToken || resData.data.tokens?.accessToken;

        if (typeof window !== "undefined") {
          localStorage.setItem("accessToken", accessToken);
          localStorage.setItem("user", JSON.stringify(user));
        }

        if (user.role === "bidder") {
          router.push("/bidder/dashboard");
        } else if (user.role === "provider") {
          router.push("/provider/dashboard");
        } else if (["admin", "operator", "superadmin"].includes(user.role)) {
          let adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:3001';
          if (typeof window !== "undefined" && window.location.hostname !== 'localhost') {
            adminUrl = '/admin'; // Force relative path in production
          }
          window.location.href = `${adminUrl}/login?token=${accessToken}&user=${encodeURIComponent(JSON.stringify(user))}`;
        } else {
          alert("Role akun Anda tidak didukung pada halaman ini.");
        }
      } else {
        if (resData.error?.details) {
          const newErrors: Record<string, string> = {};
          Object.entries(resData.error.details).forEach(([field, err]) => {
            const cleanField = field.replace("body.", "");
            newErrors[cleanField] = err as string;
          });
          setErrors(newErrors);
        }
        alert(resData.error?.message || "Login gagal, silakan coba lagi.");
      }
    } catch (err) {
      alert("Terjadi kesalahan koneksi. Pastikan API Server sedang aktif.");
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
        <form onSubmit={handleLogin} className="space-y-4">
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
              className={`w-full px-4 py-3 bg-surface border rounded-xl text-body-md text-on-surface placeholder-outline focus:ring-2 focus:ring-premium/20 focus:outline-none transition-all shadow-inner ${
                errors.identifier || errors.email || errors.phone ? "border-error focus:border-error" : "border-outline-variant/60 focus:border-premium"
              }`}
            />
            {(errors.identifier || errors.email || errors.phone) && (
              <p className="text-error text-xs mt-1 font-semibold">
                {errors.identifier || errors.email || errors.phone}
              </p>
            )}
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
              className={`w-full px-4 py-3 bg-surface border rounded-xl text-body-md text-on-surface placeholder-outline focus:ring-2 focus:ring-premium/20 focus:outline-none transition-all shadow-inner ${
                errors.password ? "border-error focus:border-error" : "border-outline-variant/60 focus:border-premium"
              }`}
            />
            {errors.password && (
              <p className="text-error text-xs mt-1 font-semibold">{errors.password}</p>
            )}
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
              type="submit"
              className="w-full py-3.5 bg-premium text-on-premium rounded-xl text-body-md font-bold hover:bg-premium/85 transition-all btn-press btn-shine shadow-lg shadow-premium/15"
            >
              Masuk
            </button>

            {/* Divider */}
            <div className="relative my-2.5 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-outline-variant/60"></div>
              </div>
              <span className="relative px-3 bg-white text-body-xs text-on-surface-variant font-medium">atau masuk menggunakan</span>
            </div>

            {/* Google Login Button */}
            <button
              onClick={() => {
                setGoogleDefaultRole("bidder");
                setIsGoogleModalOpen(true);
              }}
              type="button"
              className="w-full py-3.5 flex items-center justify-center gap-3 bg-white border border-outline-variant/80 hover:bg-surface-variant/10 text-on-surface rounded-xl text-body-md font-bold transition-all btn-press shadow-sm"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.68 1.54 14.98 1 12 1 7.35 1 3.37 3.67 1.39 7.56l3.85 2.99c.9-2.7 3.42-4.51 6.76-4.51z"
                />
                <path
                  fill="#4285F4"
                  d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.46c-.29 1.48-1.14 2.73-2.4 3.58l3.73 2.89c2.18-2.01 3.7-4.97 3.7-8.62z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.24 14.55c-.24-.72-.38-1.5-.38-2.3s.14-1.58.38-2.3L1.39 7.56C.5 9.36 0 11.38 0 13.5s.5 4.14 1.39 5.94l3.85-2.99z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c3.24 0 5.97-1.07 7.96-2.92l-3.73-2.89c-1.04.7-2.38 1.11-4.23 1.11-3.34 0-5.86-1.81-6.76-4.51L1.39 16.8C3.37 20.33 7.35 23 12 23z"
                />
              </svg>
              Masuk dengan Google
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="text-center mt-8 text-body-sm text-on-surface-variant">
          Belum punya akun?{" "}
          <Link
            href="/register"
            className="text-primary hover:underline font-semibold"
          >
            Daftar Sekarang
          </Link>
        </div>
      </div>

      <GoogleAuthModal
        isOpen={isGoogleModalOpen}
        onClose={() => setIsGoogleModalOpen(false)}
        defaultRole={googleDefaultRole}
        action="login"
      />
    </div>
  );
}
