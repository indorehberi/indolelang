"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useBidderSession } from "../../hooks/useBidderSession";

// The bottom tab bar is PWA-only chrome. In a normal browser (mobile or
// desktop) the bidder area uses the site Header + the sidebar/drawer instead,
// so this component renders nothing there.
const pwaAllNavItems = [
  { name: "Beranda", href: "/bidder/home", icon: "home" },
  { name: "Katalog", href: "/katalog", icon: "directions_car" },
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
  "/katalog": {
    activeIcon: "text-orange-600",
    activeBg: "bg-orange-500/12",
    activeText: "text-orange-700 font-bold",
    inactiveIcon: "text-slate-400",
    inactiveText: "text-slate-400",
    icon: "directions_car"
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
  const [isPWA, setIsPWA] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone ||
      document.referrer.includes("android-app://");
    setIsPWA(isStandalone);
  }, []);

  if (!isPWA || !isBidderLoggedIn) return null;

  const isActive = (href: string) => pathname === href;

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 lg:hidden flex items-stretch h-16 transition-all duration-300 bg-white/90 backdrop-blur-md border-t border-slate-200/50 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] overflow-x-auto whitespace-nowrap scrollbar-none px-2 gap-1"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {pwaAllNavItems.map((item) => {
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
      })}
    </nav>
  );
}
