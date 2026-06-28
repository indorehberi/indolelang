"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Suspense } from "react";

function VerifikasiOtpContent() {
  const router = useRouter();
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

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = otp.join("");
    if (otpCode.length === 6) {
      // Direct redirect to eKYC page
      router.push("/ekyc/upload");
    } else {
      alert("Masukkan 6 digit kode OTP lengkap.");
    }
  };

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-tr from-primary/90 via-primary to-primary-container">
      <div className="bg-white/95 backdrop-blur-md rounded-3xl p-8 border border-white/20 shadow-2xl w-full max-w-[480px]">
        {/* Title */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2 mb-2">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-lg filled">gavel</span>
            </div>
            <span className="font-black text-on-surface text-xl tracking-tight">
              BIDKU
            </span>
          </Link>
          <p className="text-body-md text-on-surface-variant font-medium">
            Verifikasi Kode OTP
          </p>
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
                className="w-12 h-14 text-center bg-surface border border-outline-variant/60 rounded-xl text-heading-md font-bold text-on-surface focus:border-primary focus:outline-none transition-all shadow-inner"
              />
            ))}
          </div>

          <button
            type="submit"
            className="w-full py-4 bg-primary text-on-primary rounded-xl text-body-md font-bold hover:bg-primary/90 transition-all btn-press shadow-md"
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
      <div className="min-h-screen flex items-center justify-center bg-primary text-white text-heading-md font-bold">
        Memuat verifikasi...
      </div>
    }>
      <VerifikasiOtpContent />
    </Suspense>
  );
}
