"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { primaryNavItems, moreNavItems } from "./bidderNavItems";
import { clearAuthAndRedirect } from "../../lib/api";
import { useBidderSession } from "../../hooks/useBidderSession";

// Self-guarded: stays hidden unless a logged-in bidder session is detected,
// so it's safe to mount both inside BidderLayout (already login-gated) and
// on shared public pages like /katalog (not gated).
export default function BidderBottomNav() {
  const pathname = usePathname();
  const { isBidderLoggedIn } = useBidderSession();
  const [moreOpen, setMoreOpen] = useState(false);

  const isActive = (href: string) => pathname === href;
  const isMoreActive = moreNavItems.some((item) => isActive(item.href));

  const handleLogout = () => {
    setMoreOpen(false);
    clearAuthAndRedirect("Anda telah logout.");
  };

  return (
    <div className={isBidderLoggedIn ? "" : "hidden"}>
      <nav
        className="fixed bottom-0 inset-x-0 z-40 lg:hidden bg-white/95 glass-nav border-t border-outline-variant/20 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] flex items-stretch h-16"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
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
      </nav>

      {moreOpen && (
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
