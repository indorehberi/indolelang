"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiUrl, fetchWithRetry } from "@/lib/api";
import GoogleAuthModal from "@/components/GoogleAuthModal";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    nama: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    agree: false,
    marketing: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (formData.password !== formData.confirmPassword) {
      setErrors({ confirmPassword: "Konfirmasi password tidak cocok" });
      alert("Konfirmasi password tidak cocok.");
      return;
    }

    if (!formData.agree) {
      alert("Anda harus menyetujui Ketentuan Umum dan Pemberitahuan Privasi.");
      return;
    }

    try {
      const response = await fetchWithRetry(apiUrl("/auth/register"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          confirm_password: formData.confirmPassword,
          full_name: formData.nama,
          role: "bidder",
        }),
      });

      const resData = await response.json();
      if (response.ok && resData.success) {
        setErrors({});
        alert("Pendaftaran berhasil! Silakan login untuk menyelesaikan verifikasi eKYC Anda.");
        router.push(`/login`);
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
        alert(msg);
      }
    } catch (err) {
      alert("Terjadi kesalahan koneksi. Pastikan API Server sedang aktif.");
    }
  };

  const isAgreedAll = formData.agree && formData.marketing;

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
          <h2 className="text-heading-md font-bold text-on-surface font-sans mt-2">
            Buat Akun Baru
          </h2>
          <p className="text-body-sm text-on-surface-variant mt-1.5 leading-relaxed">
            Daftar akun dan dapatkan unit kendaraan terbaik dengan harga termurah di IndoLelang
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleRegister} className="space-y-4">


          <div>
            <label className="text-body-sm font-bold text-on-surface block mb-1.5">
              Nama Lengkap <span className="text-error">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.nama}
              onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
              placeholder="Masukkan nama lengkap Anda"
              className={`w-full px-4 py-3 bg-surface border rounded-xl text-body-sm text-on-surface placeholder-outline focus:ring-2 focus:ring-premium/20 focus:outline-none transition-all shadow-inner ${
                errors.nama ? "border-error focus:border-error" : "border-outline-variant/60 focus:border-premium"
              }`}
            />
            {errors.nama && <p className="text-error text-xs mt-1 font-semibold">{errors.nama}</p>}
          </div>

          <div>
            <label className="text-body-sm font-bold text-on-surface block mb-1.5">
              Alamat Email <span className="text-error">*</span>
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="Contoh: nama@domain.com"
              className={`w-full px-4 py-3 bg-surface border rounded-xl text-body-sm text-on-surface placeholder-outline focus:ring-2 focus:ring-premium/20 focus:outline-none transition-all shadow-inner ${
                errors.email ? "border-error focus:border-error" : "border-outline-variant/60 focus:border-premium"
              }`}
            />
            {errors.email && <p className="text-error text-xs mt-1 font-semibold">{errors.email}</p>}
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
              placeholder="Contoh: 08123456789"
              className={`w-full px-4 py-3 bg-surface border rounded-xl text-body-sm text-on-surface placeholder-outline focus:ring-2 focus:ring-premium/20 focus:outline-none transition-all shadow-inner ${
                errors.phone ? "border-error focus:border-error" : "border-outline-variant/60 focus:border-premium"
              }`}
            />
            {errors.phone && <p className="text-error text-xs mt-1 font-semibold">{errors.phone}</p>}
          </div>



          <div>
            <label className="text-body-sm font-bold text-on-surface block mb-1.5">
              Kata Sandi <span className="text-error">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Buat kata sandi minimal 6 karakter"
                className={`w-full px-4 py-3 bg-surface border rounded-xl text-body-sm text-on-surface placeholder-outline focus:ring-2 focus:ring-premium/20 focus:outline-none transition-all shadow-inner ${
                  errors.password ? "border-error focus:border-error" : "border-outline-variant/60 focus:border-premium"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/70 hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-xl select-none">
                  {showPassword ? "visibility_off" : "visibility"}
                </span>
              </button>
            </div>
            {errors.password && <p className="text-error text-xs mt-1 font-semibold">{errors.password}</p>}
          </div>

          <div>
            <label className="text-body-sm font-bold text-on-surface block mb-1.5">
              Konfirmasi Kata Sandi <span className="text-error">*</span>
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                required
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="Ketik ulang kata sandi Anda"
                className={`w-full px-4 py-3 bg-surface border rounded-xl text-body-sm text-on-surface placeholder-outline focus:ring-2 focus:ring-premium/20 focus:outline-none transition-all shadow-inner ${
                  errors.confirmPassword || errors.confirm_password
                    ? "border-error focus:border-error"
                    : "border-outline-variant/60 focus:border-premium"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/70 hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-xl select-none">
                  {showConfirmPassword ? "visibility_off" : "visibility"}
                </span>
              </button>
            </div>
            {(errors.confirmPassword || errors.confirm_password) && (
              <p className="text-error text-xs mt-1 font-semibold">{errors.confirmPassword || errors.confirm_password}</p>
            )}
          </div>

          <div className="space-y-3 pt-2">
            {/* Checkbox 1 */}
            <label className="flex items-start gap-2.5 cursor-pointer text-body-sm text-on-surface-variant">
              <input
                type="checkbox"
                required
                checked={formData.agree}
                onChange={(e) => setFormData({ ...formData, agree: e.target.checked })}
                className="w-4.5 h-4.5 accent-premium rounded border-outline-variant focus:ring-premium mt-0.5"
              />
              <span className="leading-tight select-none">
                Saya telah membaca dan menyetujui <Link href="/syarat" target="_blank" className="text-primary hover:underline font-semibold">Ketentuan Umum</Link> serta <Link href="/kebijakan" target="_blank" className="text-primary hover:underline font-semibold">Pemberitahuan Privasi</Link> dari IndoLelang.
              </span>
            </label>

            {/* Checkbox 2 */}
            <label className="flex items-start gap-2.5 cursor-pointer text-body-sm text-on-surface-variant">
              <input
                type="checkbox"
                required
                checked={formData.marketing}
                onChange={(e) => setFormData({ ...formData, marketing: e.target.checked })}
                className="w-4.5 h-4.5 accent-premium rounded border-outline-variant focus:ring-premium mt-0.5"
              />
              <span className="leading-tight select-none">
                Saya menyetujui untuk menerima informasi, promosi dan penawaran produk dengan tujuan marketing dari IndoLelang.
              </span>
            </label>
          </div>

          {/* Action */}
          <button
            type="submit"
            disabled={!isAgreedAll}
            className={`w-full py-4 rounded-xl text-body-md font-bold transition-all shadow-md mt-6 ${
              isAgreedAll
                ? "bg-premium text-on-premium hover:bg-premium/85 active:scale-95 btn-shine btn-press cursor-pointer"
                : "bg-premium/30 text-on-premium/40 border border-premium/10 cursor-not-allowed shadow-none"
            }`}
          >
            Buat Akun
          </button>

          {/* Divider */}
          <div className="relative my-4 flex items-center justify-center pt-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-outline-variant/60"></div>
            </div>
            <span className="relative px-3 bg-[#F9F8F3] text-body-xs text-on-surface-variant font-medium">Atau daftar dan masuk menggunakan</span>
          </div>

          {/* Google Login Button */}
          <button
            onClick={() => isAgreedAll && setIsGoogleModalOpen(true)}
            type="button"
            disabled={!isAgreedAll}
            className={`w-full py-3 flex items-center justify-center gap-3 border rounded-xl text-body-md font-bold transition-all shadow-sm ${
              isAgreedAll
                ? "bg-white border-outline-variant/80 hover:bg-surface-variant/10 text-on-surface cursor-pointer btn-press"
                : "bg-white/40 border border-outline-variant/30 text-on-surface/30 cursor-not-allowed"
            }`}
          >
            <svg className={`w-5 h-5 ${isAgreedAll ? "" : "opacity-30"}`} viewBox="0 0 24 24">
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
            Register dan masuk dengan Google
          </button>
        </form>

        {/* Login Link */}
        <p className="text-body-sm text-on-surface-variant text-center mt-6">
          Sudah memiliki akun?{" "}
          <Link href="/login" className="text-primary font-bold hover:underline">
            Masuk
          </Link>
        </p>
      </div>

      {/* Google Auth Modal */}
      <GoogleAuthModal
        isOpen={isGoogleModalOpen}
        onClose={() => setIsGoogleModalOpen(false)}
        defaultRole="bidder"
        action="register"
      />
    </div>
  );
}
