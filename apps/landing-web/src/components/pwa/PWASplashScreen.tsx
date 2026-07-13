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
      setFadeClass("opacity-0 transition-opacity duration-500 ease-out");
    }, 2500);

    // After 3 seconds, redirect based on login status and clean up
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

      // Remove the blocking CSS class from HTML element so page is fully interactive and visible
      document.documentElement.classList.remove("pwa-splash-active");
      
      if (token && isBidder) {
        router.replace("/bidder/dashboard");
      } else {
        router.replace("/login");
      }

      // Unmount the splash component from DOM so it doesn't block click events
      setShowSplash(false);
    }, 3000);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(redirectTimer);
    };
  }, [router]);

  // Clean up class if component unmounts unexpectedly
  useEffect(() => {
    return () => {
      document.documentElement.classList.remove("pwa-splash-active");
    };
  }, []);

  if (!showSplash) return null;

  return (
    <div
      id="pwa-splash-overlay"
      className={`fixed inset-0 z-[99999] bg-[#F9F8F3] w-screen h-screen flex items-center justify-center ${fadeClass}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/banner-bidku.png"
        alt="BIDKU Splash Banner"
        className="w-full h-full object-cover"
      />
    </div>
  );
}
