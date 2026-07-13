"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import SessionTimeout from "./SessionTimeout";
import BidderBottomNav from "./BidderBottomNav";
import { allBidderNavItems } from "./bidderNavItems";
import InstallPrompt from "../pwa/InstallPrompt";
import { clearAuthAndRedirect } from "../../lib/api";

interface BidderLayoutProps {
  children: React.ReactNode;
  pageTitle: string;
  hideHeader?: boolean;
}

export default function BidderLayout({ children, pageTitle, hideHeader = false }: BidderLayoutProps) {
  const pathname = usePathname();
  const [userName, setUserName] = useState("Budi Santoso");
  const [userInitial, setUserInitial] = useState("BS");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const user = localStorage.getItem("user");
      if (user) {
        try {
          const parsed = JSON.parse(user);
          setUserName(parsed.full_name);
          setUserInitial(
            parsed.full_name
              .split(" ")
              .map((n: string) => n[0])
              .join("")
              .substring(0, 2)
              .toUpperCase()
          );
        } catch (e) {
          console.error("Error parsing user data");
        }
      }
    }
  }, []);

  const handleLogout = () => {
    clearAuthAndRedirect('Anda telah logout.');
  };

  const isActive = (href: string) => pathname === href;

  return (
    <div className="min-h-screen bg-surface flex flex-col font-sans">
      <SessionTimeout />
      
      {/* ====== DESKTOP SIDEBAR ====== */}
      <aside className="hidden lg:flex flex-col w-64 bg-slate-900 text-white fixed top-0 bottom-0 left-0 z-30 shadow-xl">
        {/* Brand Logo */}
        <div className="h-16 px-6 border-b border-slate-800 flex items-center justify-start">
          <Link href="/">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt="BIDKU"
              className="h-12 w-auto"
              src="/logo-bidku.png"
            />
          </Link>
        </div>

        {/* User Role Tag */}
        <div className="px-6 py-2 bg-slate-950 border-b border-slate-800 text-[10px] tracking-wider text-secondary uppercase font-bold">
          Panel Area Bidder
        </div>

        {/* Menu Navigation */}
        <nav className="flex-1 px-4 py-4 space-y-1">
          {allBidderNavItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                isActive(item.href)
                  ? "bg-primary text-on-primary shadow-md shadow-primary/20"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <span className="material-symbols-outlined text-lg">{item.icon}</span>
              <span className="flex-1">{item.name}</span>
              {item.badge && (
                <span className="bg-error text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                  {item.badge}
                </span>
              )}
              {item.isLive && (
                <span className="w-2.5 h-2.5 rounded-full bg-error animate-pulse" />
              )}
            </Link>
          ))}
        </nav>

        {/* Footer Sidebar */}
        <div className="p-4 border-t border-slate-800 flex flex-col gap-2">
          <Link
            href="/"
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
      </aside>

      {/* ====== MAIN CONTENT CONTAINER ====== */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        {/* ====== TOPBAR ====== */}
        {!hideHeader && (
          <header className="h-16 border-b border-outline-variant/20 bg-white/95 sticky top-0 z-20 flex items-center justify-between px-6 shadow-sm">
            <div className="flex flex-col justify-center">
              <h1 className="text-heading-lg text-on-surface font-extrabold leading-tight">{pageTitle}</h1>
              <span className="text-[10px] text-primary font-bold uppercase tracking-wider mt-0.5">Bidder</span>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden md:flex flex-col text-right">
                <span className="text-sm font-bold text-on-surface">{userName}</span>
                <span className="text-[10px] text-on-surface-variant font-medium uppercase tracking-wider">
                  Peserta Lelang
                </span>
              </div>
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm border border-primary/25">
                {userInitial}
              </div>
            </div>
          </header>
        )}

        <InstallPrompt />

        {/* ====== PAGE BODY ====== */}
        <main className="flex-1 p-6 max-w-container-max w-full mx-auto pb-24">
          {children}
        </main>
      </div>

      <BidderBottomNav />
    </div>
  );
}
