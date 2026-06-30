"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiUrl } from "@/lib/api";

export default function RegisterProviderPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    companyName: "",
    npwp: "",
    picName: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (formData.password !== formData.confirmPassword) {
      setErrors({ confirmPassword: "Konfirmasi password tidak cocok dengan password akun." });
      alert("Password dan Konfirmasi Password tidak cocok.");
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
          full_name: formData.picName,
          role: "provider",
          company_name: formData.companyName,
          npwp: formData.npwp,
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
            className="flex-1 text-center py-2.5 rounded-xl font-medium text-body-md text-premium/70 hover:text-premium transition-all"
          >
            Bidder (Pembeli)
          </Link>
          <Link
            href="/register/provider"
            className="flex-1 text-center py-2.5 rounded-xl font-bold text-body-md bg-premium text-on-premium shadow-sm transition-all"
          >
            Provider (Seller)
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
              className={`w-full px-4 py-3 bg-surface border rounded-xl text-body-sm text-on-surface placeholder-outline focus:ring-2 focus:ring-premium/20 focus:outline-none transition-all shadow-inner ${
                errors.companyName || errors.company_name ? "border-error focus:border-error" : "border-outline-variant/60 focus:border-premium"
              }`}
            />
            {(errors.companyName || errors.company_name) && (
              <p className="text-error text-xs mt-1 font-semibold">{errors.companyName || errors.company_name}</p>
            )}
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
              className={`w-full px-4 py-3 bg-surface border rounded-xl text-body-sm text-on-surface placeholder-outline focus:ring-2 focus:ring-premium/20 focus:outline-none transition-all shadow-inner ${
                errors.npwp ? "border-error focus:border-error" : "border-outline-variant/60 focus:border-premium"
              }`}
            />
            {errors.npwp && (
              <p className="text-error text-xs mt-1 font-semibold">{errors.npwp}</p>
            )}
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
              className={`w-full px-4 py-3 bg-surface border rounded-xl text-body-sm text-on-surface placeholder-outline focus:ring-2 focus:ring-premium/20 focus:outline-none transition-all shadow-inner ${
                errors.picName || errors.full_name ? "border-error focus:border-error" : "border-outline-variant/60 focus:border-premium"
              }`}
            />
            {(errors.picName || errors.full_name) && (
              <p className="text-error text-xs mt-1 font-semibold">{errors.picName || errors.full_name}</p>
            )}
          </div>

          <div>
            <label className="text-body-sm font-bold text-on-surface block mb-1.5">
              Nomor Telepon PIC (WhatsApp) <span className="text-error">*</span>
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
              Email Resmi Perusahaan <span className="text-error">*</span>
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="Masukkan email perusahaan"
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
              Password Akun <span className="text-error">*</span>
            </label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Buat password aman"
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
              placeholder="Ulangi password Anda"
              className={`w-full px-4 py-3 bg-surface border rounded-xl text-body-sm text-on-surface placeholder-outline focus:ring-2 focus:ring-premium/20 focus:outline-none transition-all shadow-inner ${
                errors.confirmPassword ? "border-error focus:border-error" : "border-outline-variant/60 focus:border-premium"
              }`}
            />
            {errors.confirmPassword && (
              <p className="text-error text-xs mt-1 font-semibold">{errors.confirmPassword}</p>
            )}
          </div>

          {/* Action */}
          <button
            type="submit"
            className="w-full py-4 bg-premium text-on-premium rounded-xl text-body-md font-bold hover:bg-premium/85 transition-all btn-press btn-shine shadow-md mt-6"
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
