"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import SessionTimeout from "./SessionTimeout";
import { clearAuthAndRedirect } from "../../lib/api";

interface ProviderLayoutProps {
  children: React.ReactNode;
  pageTitle: string;
}

export default function ProviderLayout({ children, pageTitle }: ProviderLayoutProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [companyName, setCompanyName] = useState("PT Astra Mitra");
  const [userInitial, setUserInitial] = useState("AM");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          if (user.full_name || user.name) {
            const name = user.full_name || user.name;
            setCompanyName(name);
            const initials = name
              .split(" ")
              .map((n: string) => n[0])
              .join("")
              .substring(0, 2)
              .toUpperCase();
            setUserInitial(initials || "P");
          }
        } catch (e) {
          // fallback
        }
      }
    }
  }, []);

  const handleLogout = () => {
    clearAuthAndRedirect('Anda telah logout.');
  };



  const menuItems = [
    { name: "Dashboard", href: "/provider/dashboard", icon: "dashboard" },
    { name: "Ajukan Aset Baru", href: "/provider/ajukan-barang", icon: "add_box" },
    { name: "Daftar Inventori Aset", href: "/provider/daftar-barang", icon: "inventory_2" },
    { name: "Settlement Keuangan", href: "/provider/settlement", icon: "payments" },
    { name: "Profil Perusahaan", href: "/provider/profile", icon: "domain" },
  ];

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
          Portal Mitra Provider
        </div>

        {/* Menu Navigation */}
        <nav className="flex-1 px-4 py-4 space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                isActive(item.href)
                  ? "bg-secondary text-on-secondary shadow-md shadow-secondary/20"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <span className="material-symbols-outlined text-lg">{item.icon}</span>
              <span className="flex-1">{item.name}</span>
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
        <header className="h-16 border-b border-outline-variant/20 bg-white/95 sticky top-0 z-20 flex items-center justify-between px-6 shadow-sm">
          <div className="flex items-center gap-3">
            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden w-10 h-10 rounded-full flex items-center justify-center hover:bg-surface-container-low transition-colors"
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
            <h1 className="text-heading-lg text-on-surface font-extrabold">{pageTitle}</h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col text-right">
              <span className="text-sm font-bold text-on-surface">{companyName}</span>
              <span className="text-[10px] text-on-surface-variant font-medium uppercase tracking-wider">
                Mitra Aset (Provider)
              </span>
            </div>
            <div className="w-10 h-10 rounded-full bg-secondary/10 text-secondary flex items-center justify-center font-bold text-sm border border-secondary/25">
              {userInitial}
            </div>
          </div>
        </header>

        {/* ====== PAGE BODY ====== */}
        <main className="flex-1 p-6 max-w-container-max w-full mx-auto pb-24">
          {children}
        </main>
      </div>

      {/* ====== MOBILE NAV DRAWER ====== */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer menu */}
          <div className="relative w-64 bg-slate-900 text-white flex flex-col h-full shadow-2xl z-10 animate-fade-in-up">
            <div className="h-16 px-6 border-b border-slate-800 flex items-center justify-between">
          {/* Mobile Logo */}
          <Link href="/" className="flex items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt="BIDKU"
              className="h-10 w-auto"
              src="/logo-bidku.png"
            />
          </Link>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div className="px-6 py-2 bg-slate-950 border-b border-slate-800 text-[10px] tracking-wider text-secondary uppercase font-bold">
              Portal Mitra Provider
            </div>

            <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
              {menuItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    isActive(item.href)
                      ? "bg-secondary text-on-secondary"
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
