"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { primaryNavItems, moreNavItems } from "./bidderNavItems";
import { clearAuthAndRedirect } from "../../lib/api";
import { useBidderSession } from "../../hooks/useBidderSession";

// All navigation items combined for scrollable PWA bottom navigation
const pwaAllNavItems = [
  { name: "Beranda", href: "/bidder/home", icon: "home" },
  { name: "Statistik", href: "/bidder/dashboard", icon: "query_stats" },
  { name: "Beli NIPL", href: "/bidder/deposit", icon: "payments" },
  { name: "Live", href: "/bidder/bidding-room", icon: "sensors", isLive: true },
  { name: "Keranjang", href: "/bidder/cart", icon: "shopping_cart" },
  { name: "Tagihan", href: "/bidder/invoices", icon: "receipt_long" },
  { name: "Riwayat", href: "/bidder/riwayat-lelang", icon: "history" },
  { name: "Refund", href: "/bidder/deposit/history", icon: "account_balance_wallet" },
  { name: "Profil", href: "/bidder/profile", icon: "person" },
];

interface PwaTheme {
  activeIcon: string;
  activeBg: string;
  activeText: string;
  inactiveIcon: string;
  inactiveText: string;
  icon: string;
}

const pwaItemThemes: Record<string, PwaTheme> = {
  "/bidder/home": {
    activeIcon: "text-blue-600",
    activeBg: "bg-blue-500/12",
    activeText: "text-blue-700 font-bold",
    inactiveIcon: "text-slate-400",
    inactiveText: "text-slate-400",
    icon: "home"
  },
  "/bidder/dashboard": {
    activeIcon: "text-sky-600",
    activeBg: "bg-sky-500/12",
    activeText: "text-sky-700 font-bold",
    inactiveIcon: "text-slate-400",
    inactiveText: "text-slate-400",
    icon: "query_stats"
  },
  "/bidder/deposit": {
    activeIcon: "text-emerald-600",
    activeBg: "bg-emerald-500/12",
    activeText: "text-emerald-700 font-bold",
    inactiveIcon: "text-slate-400",
    inactiveText: "text-slate-400",
    icon: "payments"
  },
  "/bidder/bidding-room": {
    activeIcon: "text-rose-600",
    activeBg: "bg-rose-500/12",
    activeText: "text-rose-700 font-bold",
    inactiveIcon: "text-slate-400",
    inactiveText: "text-slate-400",
    icon: "sensors"
  },
  "/bidder/cart": {
    activeIcon: "text-amber-600",
    activeBg: "bg-amber-500/12",
    activeText: "text-amber-700 font-bold",
    inactiveIcon: "text-slate-400",
    inactiveText: "text-slate-400",
    icon: "shopping_cart"
  },

  "/bidder/invoices": {
    activeIcon: "text-teal-600",
    activeBg: "bg-teal-500/12",
    activeText: "text-teal-700 font-bold",
    inactiveIcon: "text-slate-400",
    inactiveText: "text-slate-400",
    icon: "receipt_long"
  },
  "/bidder/riwayat-lelang": {
    activeIcon: "text-cyan-600",
    activeBg: "bg-cyan-500/12",
    activeText: "text-cyan-700 font-bold",
    inactiveIcon: "text-slate-400",
    inactiveText: "text-slate-400",
    icon: "history"
  },
  "/bidder/deposit/history": {
    activeIcon: "text-indigo-600",
    activeBg: "bg-indigo-500/12",
    activeText: "text-indigo-700 font-bold",
    inactiveIcon: "text-slate-400",
    inactiveText: "text-slate-400",
    icon: "account_balance_wallet"
  },
  "/bidder/profile": {
    activeIcon: "text-violet-600",
    activeBg: "bg-violet-500/12",
    activeText: "text-violet-700 font-bold",
    inactiveIcon: "text-slate-400",
    inactiveText: "text-slate-400",
    icon: "person"
  }
};

export default function BidderBottomNav() {
  const pathname = usePathname();
  const { isBidderLoggedIn } = useBidderSession();
  const [moreOpen, setMoreOpen] = useState(false);
  const [isPWA, setIsPWA] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone ||
      document.referrer.includes("android-app://");
    setIsPWA(isStandalone);
  }, []);

  const isActive = (href: string) => pathname === href;
  const isMoreActive = moreNavItems.some((item) => isActive(item.href));

  const handleLogout = () => {
    setMoreOpen(false);
    clearAuthAndRedirect("Anda telah logout.");
  };

  return (
    <div className={isBidderLoggedIn ? "" : "hidden"}>
      <nav
        className={`fixed bottom-0 inset-x-0 z-40 lg:hidden flex items-stretch h-16 transition-all duration-300 ${
          isPWA
            ? "bg-white/90 backdrop-blur-md border-t border-slate-200/50 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] overflow-x-auto whitespace-nowrap scrollbar-none px-2 gap-1"
            : "bg-white/95 glass-nav border-t border-outline-variant/20 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]"
        }`}
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {isPWA ? (
          pwaAllNavItems.map((item) => {
            const active = isActive(item.href);
            const theme = pwaItemThemes[item.href] || pwaItemThemes["/bidder/dashboard"];
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex-none flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-all duration-150 relative min-w-[72px] px-1"
              >
                <span className={`flex items-center justify-center px-4 py-1.5 rounded-full transition-all duration-200 ${
                  active ? `${theme.activeBg} ${theme.activeIcon}` : "bg-transparent text-slate-400"
                }`}>
                  <span className={`material-symbols-outlined text-xl transition-all ${active ? "filled scale-105 font-bold" : ""}`}>
                    {theme.icon}
                  </span>
                  {item.isLive && (
                    <span className="absolute top-2 w-2.5 h-2.5 rounded-full bg-error border border-white animate-pulse" style={{ right: "22px" }} />
                  )}
                </span>
                <span className={`text-[9px] tracking-wide transition-all ${
                  active ? `${theme.activeText}` : "text-slate-400 font-medium"
                }`}>
                  {item.name}
                </span>
              </Link>
            );
          })
        ) : (
          <>
            {primaryNavItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex-1 flex flex-col items-center justify-center gap-0.5 btn-press ${
                    active ? "text-primary" : "text-on-surface-variant"
                  }`}
                >
                  <span className="relative">
                    <span className={`material-symbols-outlined text-2xl ${active ? "filled" : ""}`}>
                      {item.icon}
                    </span>
                    {item.isLive && (
                      <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-error animate-pulse" />
                    )}
                  </span>
                  <span className="text-[10px] font-semibold leading-none">
                    {item.shortLabel ?? item.name}
                  </span>
                </Link>
              );
            })}
            <button
              onClick={() => setMoreOpen(true)}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 btn-press ${
                isMoreActive ? "text-primary" : "text-on-surface-variant"
              }`}
            >
              <span className="material-symbols-outlined text-2xl">more_horiz</span>
              <span className="text-[10px] font-semibold leading-none">Lainnya</span>
            </button>
          </>
        )}
      </nav>

      {moreOpen && !isPWA && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMoreOpen(false)}
          />
          <div
            className="fixed inset-x-0 bottom-0 bg-slate-900 text-white rounded-t-3xl shadow-2xl animate-slide-up-sheet max-h-[80vh] overflow-y-auto overscroll-contain"
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
          >
            <div className="flex justify-center pt-3 pb-1">
              <span className="w-10 h-1 rounded-full bg-slate-600" />
            </div>
            <div className="px-6 py-2 text-[10px] tracking-wider text-secondary uppercase font-bold">
              Lainnya
            </div>
            <nav className="px-4 pb-2 space-y-1">
              {moreNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMoreOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                    isActive(item.href)
                      ? "bg-primary text-on-primary"
                      : "text-slate-400 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">{item.icon}</span>
                  <span className="flex-1">{item.name}</span>
                </Link>
              ))}
            </nav>
            <div className="p-4 border-t border-slate-800 flex flex-col gap-2">
              <Link
                href="/"
                onClick={() => setMoreOpen(false)}
                className="flex items-center gap-2 px-4 py-2 text-xs text-slate-400 hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined text-base">home</span>
                Kembali ke Beranda
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-red-600 hover:bg-red-700 transition-all w-full shadow-md shadow-red-900/20"
              >
                <span className="material-symbols-outlined text-lg">logout</span>
                Keluar Akun
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
