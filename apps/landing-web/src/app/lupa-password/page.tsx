"use client";

import Link from "next/link";
import { useState } from "react";
import { apiUrl, fetchWithRetry } from "@/lib/api";
import { useToast } from "@/providers/ToastProvider";

export default function LupaPasswordPage() {
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [sendTo, setSendTo] = useState<"email" | "whatsapp">("email");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate only the active field
    if (sendTo === "email" && !email) {
      toast.error("Masukkan alamat email terdaftar Anda");
      return;
    }
    if (sendTo === "whatsapp" && !phone) {
      toast.error("Masukkan nomor WhatsApp terdaftar Anda");
      return;
    }

    try {
      const payload = {
        email: sendTo === "email" ? email : "",
        phone: sendTo === "whatsapp" ? phone : "",
        send_to: sendTo,
      };

      const response = await fetchWithRetry(apiUrl("/auth/forgot-password"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        setSubmitted(true);
      } else {
        const data = await response.json();
        toast.error(data.error?.message || "Gagal mengirim link reset");
      }
    } catch {
      toast.error("Terjadi kesalahan koneksi");
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
          /* ── Success State ── */
          <div className="space-y-6 text-center">
            <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto text-success">
              <span className="material-symbols-outlined text-3xl">
                {sendTo === "email" ? "mail" : "forum"}
              </span>
            </div>
            <div>
              <h3 className="text-heading-md font-bold text-on-surface font-serif">
                Link Reset Terkirim
              </h3>
              <p className="text-body-sm text-on-surface-variant leading-relaxed mt-2">
                {sendTo === "email" ? (
                  <>
                    Kami telah mengirimkan tautan pemulihan sandi ke email{" "}
                    <strong>{email}</strong>. Harap periksa kotak masuk email
                    Anda.
                  </>
                ) : (
                  <>
                    Kami telah mengirimkan tautan pemulihan sandi ke nomor
                    WhatsApp <strong>{phone}</strong>. Harap periksa pesan
                    WhatsApp Anda.
                  </>
                )}
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
          /* ── Form State ── */
          <form onSubmit={handleSubmit} className="space-y-5">
            <p className="text-body-sm text-on-surface-variant leading-relaxed text-center">
              Pilih metode pengiriman link reset password Anda.
            </p>

            {/* ── Method Toggle ── */}
            <div className="flex gap-3">
              <label
                className={`flex-1 flex items-center gap-2 cursor-pointer border px-4 py-3 rounded-xl transition-all justify-center ${
                  sendTo === "email"
                    ? "bg-premium/10 border-premium text-premium"
                    : "bg-surface border-outline-variant/60 text-on-surface-variant hover:border-premium/40"
                }`}
              >
                <input
                  type="radio"
                  name="sendTo"
                  checked={sendTo === "email"}
                  onChange={() => {
                    setSendTo("email");
                    setPhone("");
                  }}
                  className="accent-premium w-4 h-4"
                />
                <span className="material-symbols-outlined text-base">mail</span>
                <span className="text-body-sm font-bold">Email</span>
              </label>

              {/* WhatsApp delivery is disabled for now — the option stays
                  visible (greyed out) so the flow is self-explanatory, and
                  re-enabling it later is just a matter of dropping `disabled`. */}
              <label
                aria-disabled="true"
                title="Pengiriman via WhatsApp belum tersedia"
                className="flex-1 flex items-center gap-2 border px-4 py-3 rounded-xl justify-center bg-surface border-outline-variant/40 text-on-surface-variant/50 cursor-not-allowed"
              >
                <input
                  type="radio"
                  name="sendTo"
                  disabled
                  checked={false}
                  readOnly
                  className="accent-premium w-4 h-4 cursor-not-allowed"
                />
                <span className="material-symbols-outlined text-base">forum</span>
                <span className="text-body-sm font-bold">No. WA</span>
              </label>
            </div>

            {/* ── Conditional Field ── */}
            {sendTo === "email" ? (
              <div>
                <label className="text-body-sm font-bold text-on-surface block mb-1.5">
                  Alamat Email Terdaftar{" "}
                  <span className="text-error">*</span>
                </label>
                <input
                  key="email-field"
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Masukkan email terdaftar"
                  className="w-full px-4 py-3 bg-surface border border-outline-variant/60 rounded-xl text-body-md text-on-surface placeholder-outline focus:border-premium focus:ring-2 focus:ring-premium/20 focus:outline-none transition-all shadow-inner"
                />
                <p className="text-[11px] text-on-surface-variant mt-1.5">
                  Link reset akan dikirim ke alamat email ini.
                </p>
              </div>
            ) : (
              <div>
                <label className="text-body-sm font-bold text-on-surface block mb-1.5">
                  No. WhatsApp Terdaftar{" "}
                  <span className="text-error">*</span>
                </label>
                <input
                  key="phone-field"
                  type="tel"
                  required
                  autoFocus
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Contoh: 08123456789"
                  className="w-full px-4 py-3 bg-surface border border-outline-variant/60 rounded-xl text-body-md text-on-surface placeholder-outline focus:border-premium focus:ring-2 focus:ring-premium/20 focus:outline-none transition-all shadow-inner"
                />
                <p className="text-[11px] text-on-surface-variant mt-1.5">
                  Link reset akan dikirim via pesan WhatsApp ke nomor ini.
                </p>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-4 bg-premium text-on-premium rounded-xl text-body-md font-bold hover:bg-premium/85 transition-all btn-press btn-shine shadow-md"
            >
              {sendTo === "email" ? "Kirim Link ke Email" : "Kirim Link ke WhatsApp"}
            </button>

            <div className="text-center text-body-sm text-on-surface-variant">
              <Link
                href="/login"
                className="text-primary hover:underline font-semibold flex items-center justify-center gap-1.5"
              >
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
