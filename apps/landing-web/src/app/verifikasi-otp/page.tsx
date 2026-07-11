"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { apiUrl, fetchWithRetry } from "@/lib/api";
import { useToast } from "@/providers/ToastProvider";
import { Suspense } from "react";

function VerifikasiOtpContent() {
  const router = useRouter();
  const toast = useToast();
  const searchParams = useSearchParams();
  const phone = searchParams ? searchParams.get("phone") || "08123456789" : "08123456789";

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(105); // 1:45
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const handleChange = (value: string, index: number) => {
    const val = value.replace(/\D/g, "");
    const newOtp = [...otp];
    newOtp[index] = val;
    setOtp(newOtp);

    // Auto-focus next input
    if (val && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = otp.join("");
    if (otpCode.length === 6) {
      try {
        const response = await fetchWithRetry(apiUrl("/auth/verify-otp"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone, otp: otpCode }),
        });
        const resData = await response.json();
        if (response.ok && resData.success) {
          toast.success("Verifikasi berhasil! Akun Anda sudah aktif. Silakan login.");
          router.push("/login");
        } else {
          toast.error(resData.error?.message || "Kode OTP salah atau kedaluwarsa.");
        }
      } catch (err) {
        toast.error("Terjadi kesalahan koneksi.");
      }
    } else {
      toast.warning("Masukkan 6 digit kode OTP lengkap.");
    }
  };

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
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
            Verifikasi Kode OTP
          </h2>
        </div>

        <p className="text-body-sm text-on-surface-variant leading-relaxed text-center mb-6">
          Kode OTP 6 digit telah dikirimkan ke nomor WhatsApp Anda (<strong>{phone}</strong>). Masukkan kode tersebut di bawah ini.
        </p>

        {/* Inputs */}
        <form onSubmit={handleVerify} className="space-y-6">
          <div className="flex justify-center gap-2">
            {otp.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => {
                  inputsRef.current[idx] = el;
                }}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(e.target.value, idx)}
                onKeyDown={(e) => handleKeyDown(e, idx)}
                className="w-12 h-14 text-center bg-surface border border-outline-variant/60 rounded-xl text-heading-md font-bold text-on-surface focus:border-premium focus:ring-2 focus:ring-premium/20 focus:outline-none transition-all shadow-inner"
              />
            ))}
          </div>

          <button
            type="submit"
            className="w-full py-4 bg-premium text-on-premium rounded-xl text-body-md font-bold hover:bg-premium/85 transition-all btn-press btn-shine shadow-md"
          >
            Verifikasi OTP
          </button>
        </form>

        {/* Resend Countdown */}
        <div className="text-center mt-6 text-body-sm text-on-surface-variant">
          Tidak menerima kode?{" "}
          {timer > 0 ? (
            <span className="text-outline font-semibold">
              Kirim Ulang ({formatTimer(timer)})
            </span>
          ) : (
            <button
              onClick={() => setTimer(105)}
              className="text-primary hover:underline font-bold"
            >
              Kirim Ulang
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerifikasiOtpPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#F9F8F3] hero-gradient text-premium text-heading-md font-bold font-serif">
        Memuat verifikasi...
      </div>
    }>
      <VerifikasiOtpContent />
    </Suspense>
  );
}
