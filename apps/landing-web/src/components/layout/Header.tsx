"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import PWAInstallButton from "../pwa/PWAInstallButton";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [mounted, setMounted] = useState(false);

  // Parse search query and check auth on load
  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const q = params.get("search");
      if (q) setSearchQuery(q);
      
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (e) {
          console.error("Invalid user data in localStorage");
        }
      }
    }
  }, [pathname]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/katalog?search=${encodeURIComponent(searchQuery)}`);
    } else {
      router.push(`/katalog`);
    }
  };

  const navLinks = [
    { name: "Katalog", href: "/katalog" },
    { name: "Jadwal Lelang", href: "/jadwal" },
    { name: "Tentang Kami", href: "/tentang" },
    { name: "Kontak", href: "/kontak" },
  ];

  const isActive = (href: string) => {
    if (href === "/" && pathname !== "/") return false;
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 glass-nav border-b border-outline-variant/20 shadow-sm">
      <div className="max-w-container-max mx-auto px-margin-page py-3 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex-shrink-0 flex items-center gap-2">
          <img
            alt="BIDKU"
            className="h-14 md:h-16 w-auto"
            src="/logo-bidku.png"
          />
        </Link>

        {/* Search - hidden on mobile */}
        <div className="hidden lg:flex flex-1 max-w-md relative">
          <form onSubmit={handleSearchSubmit} className="w-full relative">
            <input
              className="w-full border border-outline-variant/30 rounded-xl px-4 py-2 text-body-md focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none bg-white/60 backdrop-blur-md transition-all"
              placeholder="Cari merk, model, atau lokasi..."
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline text-xl">
              search
            </span>
          </form>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-body-md transition-colors ${
                isActive(link.href)
                  ? "text-primary font-bold"
                  : "text-on-surface hover:text-primary"
              }`}
            >
              {link.name}
            </Link>
          ))}
        </nav>

        {/* Auth Buttons */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:block">
            <PWAInstallButton />
          </div>
          {mounted && user ? (
            <Link
              href={user.role === "provider" ? "/provider/dashboard" : "/bidder/dashboard"}
              className="px-5 py-2 text-body-md font-bold text-on-premium bg-premium rounded-full shadow-sm hover:bg-premium/85 btn-press transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-xl">dashboard</span>
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="px-5 py-2 text-body-md font-bold text-on-premium bg-premium rounded-full shadow-sm hover:bg-premium/85 btn-press btn-shine transition-all text-center"
              >
                Masuk
              </Link>
            </>
          )}
          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden w-9 h-9 rounded-full flex items-center justify-center hover:bg-surface-container-low transition-colors"
            aria-label="Menu"
            style={{ border: "1px solid var(--outline-variant)" }}
          >
            <span className="material-symbols-outlined">
              {mobileMenuOpen ? "close" : "menu"}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="w-full bg-white border-b border-outline-variant/20 py-4 px-margin-page lg:hidden">
          <nav className="flex flex-col gap-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`text-body-md font-semibold py-2 border-b border-outline-variant/10 transition-colors ${
                  isActive(link.href) ? "text-primary font-bold" : "text-on-surface"
                }`}
              >
                {link.name}
              </Link>
            ))}
            {mounted && user ? (
              <div className="flex gap-3 mt-2">
                <Link
                  href={user.role === "provider" ? "/provider/dashboard" : "/bidder/dashboard"}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-5 py-2.5 bg-primary text-on-primary rounded-xl font-bold text-body-md btn-press transition-all hover:bg-primary/90 w-full text-center flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-xl">dashboard</span>
                  Dashboard
                </Link>
              </div>
            ) : (
              <div className="flex gap-3 mt-2">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-5 py-2.5 bg-primary text-on-primary rounded-xl font-bold text-body-md btn-press transition-all hover:bg-primary/90 w-full text-center"
                >
                  Masuk
                </Link>
              </div>
            )}

            {/* Install Button on Mobile Drawer */}
            <div className="pt-2 border-t border-outline-variant/10">
              <PWAInstallButton className="w-full py-2.5 text-primary border border-primary rounded-xl font-bold text-body-md btn-press transition-all hover:bg-primary/5 flex items-center justify-center gap-2" />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
