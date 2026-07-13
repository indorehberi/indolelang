"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function PWASplashScreen() {
  const router = useRouter();
  const [showSplash, setShowSplash] = useState(false);
  const [fadeClass, setFadeClass] = useState("opacity-100");

  useEffect(() => {
    // 1. Detect if running in standalone mode (installed PWA)
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone ||
      document.referrer.includes("android-app://");

    if (!isStandalone) {
      return;
    }

    // 2. Check if splash screen has already been shown in this session
    const splashShown = sessionStorage.getItem("pwa-splash-shown");
    if (splashShown) {
      // If already shown, check if we need to auto-redirect from "/"
      // so the user doesn't get stuck on the landing page if they launch PWA.
      if (window.location.pathname === "/") {
        const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
        if (token) {
          router.replace("/bidder/dashboard");
        } else {
          router.replace("/login");
        }
      }
      return;
    }

    // Show splash screen
    setShowSplash(true);
    sessionStorage.setItem("pwa-splash-shown", "true");

    // Start fade out animation slightly before redirect
    const fadeTimer = setTimeout(() => {
      setFadeClass("opacity-0 transition-opacity duration-700 ease-out");
    }, 2300);

    // After 3 seconds, redirect based on login status
    const redirectTimer = setTimeout(() => {
      const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
      let isBidder = false;
      
      try {
        const stored = localStorage.getItem("user");
        const role = stored ? JSON.parse(stored).role : undefined;
        isBidder = role !== "provider";
      } catch (e) {
        // ignore
      }

      if (token && isBidder) {
        router.replace("/bidder/dashboard");
      } else {
        router.replace("/login");
      }
    }, 3000);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(redirectTimer);
    };
  }, [router]);

  if (!showSplash) return null;

  return (
    <div className={`fixed inset-0 z-50 bg-[#F9F8F3] flex flex-col items-center justify-center ${fadeClass}`}>
      <div className="w-full max-w-md px-6 text-center animate-pulse">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/banner-bidku.png"
          alt="BIDKU Splash Banner"
          className="w-full h-auto object-contain rounded-2xl shadow-xl border border-slate-200/50"
        />
        <div className="mt-8 flex flex-col items-center gap-3">
          <div className="flex gap-1.5 justify-center items-center">
            <span className="w-3 h-3 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]"></span>
            <span className="w-3 h-3 rounded-full bg-primary/70 animate-bounce [animation-delay:-0.15s]"></span>
            <span className="w-3 h-3 rounded-full bg-primary/40 animate-bounce"></span>
          </div>
          <p className="text-body-sm font-semibold text-on-surface-variant tracking-wider uppercase mt-2">
            Memuat Aplikasi...
          </p>
        </div>
      </div>
    </div>
  );
}
