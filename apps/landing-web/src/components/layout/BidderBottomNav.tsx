"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useBidderSession } from "../../hooks/useBidderSession";
import { useRefreshOnForeground } from "../../hooks/useRefreshOnForeground";
import { apiFetch } from "../../lib/api";

// The bottom tab bar is PWA-only chrome. In a normal browser (mobile or
// desktop) the bidder area uses the site Header + the sidebar/drawer instead,
// so this component renders nothing there.
//
// Layout: a horizontally-scrollable row of tabs with the "LELANG" action
// pinned dead-center as a raised FAB that stays put while the row scrolls
// behind it.
interface NavTheme {
  activeIcon: string;
  activeBg: string;
  activeText: string;
}

const scrollNavItems: { name: string; href: string; icon: string; theme: NavTheme }[] = [
  { name: "Beranda", href: "/bidder/home", icon: "home",
    theme: { activeIcon: "text-blue-600", activeBg: "bg-blue-500/12", activeText: "text-blue-700 font-bold" } },
  { name: "Katalog", href: "/katalog", icon: "directions_car",
    theme: { activeIcon: "text-orange-600", activeBg: "bg-orange-500/12", activeText: "text-orange-700 font-bold" } },
  { name: "Beli NIPL", href: "/bidder/deposit", icon: "payments",
    theme: { activeIcon: "text-emerald-600", activeBg: "bg-emerald-500/12", activeText: "text-emerald-700 font-bold" } },
  { name: "Aktifitas", href: "/bidder/dashboard", icon: "query_stats",
    theme: { activeIcon: "text-sky-600", activeBg: "bg-sky-500/12", activeText: "text-sky-700 font-bold" } },
  { name: "Keranjang", href: "/bidder/cart", icon: "shopping_cart",
    theme: { activeIcon: "text-amber-600", activeBg: "bg-amber-500/12", activeText: "text-amber-700 font-bold" } },
  { name: "Tagihan", href: "/bidder/invoices", icon: "receipt_long",
    theme: { activeIcon: "text-teal-600", activeBg: "bg-teal-500/12", activeText: "text-teal-700 font-bold" } },
  { name: "Riwayat", href: "/bidder/riwayat-lelang", icon: "history",
    theme: { activeIcon: "text-cyan-600", activeBg: "bg-cyan-500/12", activeText: "text-cyan-700 font-bold" } },
  { name: "Refund", href: "/bidder/deposit/history", icon: "account_balance_wallet",
    theme: { activeIcon: "text-indigo-600", activeBg: "bg-indigo-500/12", activeText: "text-indigo-700 font-bold" } },
  { name: "Profil", href: "/bidder/profile", icon: "person",
    theme: { activeIcon: "text-violet-600", activeBg: "bg-violet-500/12", activeText: "text-violet-700 font-bold" } },
];

const LELANG_HREF = "/bidder/bidding-room";

export default function BidderBottomNav() {
  const pathname = usePathname();
  const { isBidderLoggedIn } = useBidderSession();
  const [isPWA, setIsPWA] = useState(false);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    setIsPWA(
      window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone ||
        document.referrer.includes("android-app://")
    );
  }, []);

  // Light live-session check so the LELANG button can flash + show "Sedang Live".
  const checkLive = async () => {
    try {
      const res = await apiFetch("/sessions?status=live");
      const data = await res.json();
      setIsLive(Array.isArray(data.data) && data.data.length > 0);
    } catch {
      // Leave the previous state on a transient failure.
    }
  };

  useEffect(() => {
    if (isPWA && isBidderLoggedIn) checkLive();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPWA, isBidderLoggedIn]);

  useRefreshOnForeground(checkLive);

  if (!isPWA || !isBidderLoggedIn) return null;

  const isActive = (href: string) => pathname === href;
  const lelangActive = pathname === LELANG_HREF;

  return (
    <div className="lg:hidden">
      {/* Scrollable tab row */}
      <nav
        className="fixed bottom-0 inset-x-0 z-40 flex items-stretch h-16 bg-white/90 backdrop-blur-md border-t border-slate-200/50 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] overflow-x-auto whitespace-nowrap scrollbar-none px-2 gap-1"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {scrollNavItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex-none flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-all duration-150 min-w-[64px] px-1"
            >
              <span className={`flex items-center justify-center px-3.5 py-1.5 rounded-full transition-all duration-200 ${
                active ? `${item.theme.activeBg} ${item.theme.activeIcon}` : "bg-transparent text-slate-400"
              }`}>
                <span className={`material-symbols-outlined text-xl transition-all ${active ? "filled scale-105 font-bold" : ""}`}>
                  {item.icon}
                </span>
              </span>
              <span className={`text-[11px] tracking-wide transition-all ${
                active ? item.theme.activeText : "text-slate-400 font-medium"
              }`}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* LELANG FAB — pinned dead-center, half above the bar, never scrolls.
          Sits at z-50 above the scrolling row. */}
      <Link
        href={LELANG_HREF}
        aria-label="Ruang Lelang"
        className="fixed left-1/2 -translate-x-1/2 z-50 flex flex-col items-center justify-center active:scale-95 transition-transform"
        style={{ bottom: `calc(env(safe-area-inset-bottom) + 28px)` }}
      >
        <span
          className={`relative flex flex-col items-center justify-center rounded-full text-white shadow-xl shadow-rose-900/30 w-[60px] h-[60px] border-[3px] border-white ${
            lelangActive ? "bg-rose-600" : "bg-rose-500"
          } ${isLive ? "animate-pulse-soft" : ""}`}
        >
          <span className="material-symbols-outlined text-[22px] leading-none filled">gavel</span>
          <span className="text-[10px] font-black tracking-wide leading-none mt-0.5">LELANG</span>
          {isLive && (
            <span className="text-[6px] font-bold leading-none mt-0.5 uppercase tracking-wider opacity-90">
              Sedang Live
            </span>
          )}
        </span>
      </Link>
    </div>
  );
}
