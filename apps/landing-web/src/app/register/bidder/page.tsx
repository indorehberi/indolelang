"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiUrl } from "@/lib/api";

export default function RegisterBidderPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    nama: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
    agree: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (formData.password !== formData.confirmPassword) {
      setErrors({ confirmPassword: "Konfirmasi password tidak cocok dengan password baru." });
      alert("Password dan Konfirmasi Password tidak cocok.");
      return;
    }
    if (!formData.agree) {
      alert("Anda harus menyetujui Syarat & Ketentuan.");
      return;
    }

    const sanitizedPhone = formData.phone.replace(/[^0-9+]/g, "");

    try {
      const response = await fetch(apiUrl("/auth/register"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          phone: sanitizedPhone,
          password: formData.password,
          full_name: formData.nama,
          role: "bidder",
        }),
      });

      const resData = await response.json();
      if (response.ok && resData.success) {
        setErrors({});
        router.push(`/verifikasi-otp?phone=${encodeURIComponent(sanitizedPhone)}`);
      } else {
        if (resData.error?.details) {
          const newErrors: Record<string, string> = {};
          Object.entries(resData.error.details).forEach(([field, err]) => {
            const cleanField = field.replace("body.", "");
            newErrors[cleanField] = err as string;
          });
          setErrors(newErrors);
        }
        
        let msg = resData.error?.message || "Registrasi gagal.";
        if (resData.error?.details) {
          const detailMsgs = Object.entries(resData.error.details)
            .map(([field, err]) => `${field.replace("body.", "")}: ${err}`)
            .join("\n");
          if (detailMsgs) {
            msg += `:\n${detailMsgs}`;
          }
        }
        alert(msg);
      }
    } catch (err) {
      alert("Terjadi kesalahan koneksi. Pastikan API Server sedang aktif.");
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
          <h2 className="text-heading-md font-bold text-on-surface mt-2">
            Daftar Akun Baru
          </h2>
        </div>

        {/* Role Switcher Tabs */}
        <div className="flex bg-surface-variant/30 p-1.5 rounded-2xl mb-6">
          <Link
            href="/register/bidder"
            className="flex-1 text-center py-2.5 rounded-xl font-bold text-body-md bg-premium text-on-premium shadow-sm transition-all"
          >
            Bidder (Pembeli)
          </Link>
          <Link
            href="/register/provider"
            className="flex-1 text-center py-2.5 rounded-xl font-medium text-body-md text-premium/70 hover:text-premium transition-all"
          >
            Provider (Seller)
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
              className={`w-full px-4 py-3 bg-surface border rounded-xl text-body-sm text-on-surface placeholder-outline focus:ring-2 focus:ring-premium/20 focus:outline-none transition-all shadow-inner ${
                errors.nama || errors.full_name ? "border-error focus:border-error" : "border-outline-variant/60 focus:border-premium"
              }`}
            />
            {(errors.nama || errors.full_name) && (
              <p className="text-error text-xs mt-1 font-semibold">{errors.nama || errors.full_name}</p>
            )}
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
              className={`w-full px-4 py-3 bg-surface border rounded-xl text-body-sm text-on-surface placeholder-outline focus:ring-2 focus:ring-premium/20 focus:outline-none transition-all shadow-inner ${
                errors.phone ? "border-error focus:border-error" : "border-outline-variant/60 focus:border-premium"
              }`}
            />
            {errors.phone && (
              <p className="text-error text-xs mt-1 font-semibold">{errors.phone}</p>
            )}
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
              className={`w-full px-4 py-3 bg-surface border rounded-xl text-body-sm text-on-surface placeholder-outline focus:ring-2 focus:ring-premium/20 focus:outline-none transition-all shadow-inner ${
                errors.email ? "border-error focus:border-error" : "border-outline-variant/60 focus:border-premium"
              }`}
            />
            {errors.email && (
              <p className="text-error text-xs mt-1 font-semibold">{errors.email}</p>
            )}
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
              className={`w-full px-4 py-3 bg-surface border rounded-xl text-body-sm text-on-surface placeholder-outline focus:ring-2 focus:ring-premium/20 focus:outline-none transition-all shadow-inner ${
                errors.password ? "border-error focus:border-error" : "border-outline-variant/60 focus:border-premium"
              }`}
            />
            {errors.password && (
              <p className="text-error text-xs mt-1 font-semibold">{errors.password}</p>
            )}
          </div>

          <div>
            <label className="text-body-sm font-bold text-on-surface block mb-1.5">
              Konfirmasi Password <span className="text-error">*</span>
            </label>
            <input
              type="password"
              required
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              placeholder="Ulangi password baru Anda"
              className={`w-full px-4 py-3 bg-surface border rounded-xl text-body-sm text-on-surface placeholder-outline focus:ring-2 focus:ring-premium/20 focus:outline-none transition-all shadow-inner ${
                errors.confirmPassword ? "border-error focus:border-error" : "border-outline-variant/60 focus:border-premium"
              }`}
            />
            {errors.confirmPassword && (
              <p className="text-error text-xs mt-1 font-semibold">{errors.confirmPassword}</p>
            )}
          </div>

          <label className="flex items-start gap-2.5 cursor-pointer text-body-sm text-on-surface-variant pt-2">
            <input
              type="checkbox"
              required
              checked={formData.agree}
              onChange={(e) => setFormData({ ...formData, agree: e.target.checked })}
              className="w-4.5 h-4.5 accent-premium rounded border-outline-variant focus:ring-premium mt-0.5"
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
            className="w-full py-4 bg-premium text-on-premium rounded-xl text-body-md font-bold hover:bg-premium/85 transition-all btn-press btn-shine shadow-md mt-6"
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
