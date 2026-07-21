"use client";

import Link from "next/link";
import React, { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";

export default function Footer() {
  const [socmed, setSocmed] = useState({
    instagram: "",
    facebook: "",
    tiktok: "",
    youtube: "",
    twitter: ""
  });

  useEffect(() => {
    const fetchSocmed = async () => {
      try {
        const res = await apiFetch("/public/settings");
        const resData = await res.json();
        if (res.ok && resData.success && resData.data) {
          const data = resData.data;
          setSocmed({
            instagram: data.socmed_instagram || "",
            facebook: data.socmed_facebook || "",
            tiktok: data.socmed_tiktok || "",
            youtube: data.socmed_youtube || "",
            twitter: data.socmed_twitter || ""
          });
        }
      } catch (err) {
        console.error("Failed to fetch social media settings", err);
      }
    };
    fetchSocmed();
  }, []);

  return (
    <footer className="bg-surface-container-lowest border-t border-outline-variant/20 mt-20">
      <div className="max-w-container-max mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand & Kontak */}
          <div className="flex flex-col gap-6">
            <Link href="/" className="flex items-center gap-2">
              <img
                alt="BIDKU"
                className="h-14 md:h-16 w-auto"
                src="/logo-bidku.png"
              />
            </Link>
            <p className="text-body-md text-on-surface-variant leading-relaxed">
              BIDKU adalah platform lelang digital resmi dan terpercaya untuk berbagai jenis aset berharga di Indonesia.
            </p>
            <div className="text-body-md text-on-surface-variant space-y-1">
              <p className="font-bold text-primary">Hubungi Kami:</p>
              <p>✉️ cs@bidku.co.id</p>
              <p>📞 082318037002</p>
            </div>
            
            <div className="flex gap-3 mt-1">
              {socmed.instagram && (
                <a href={socmed.instagram} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-slate-100 hover:bg-pink-100 text-slate-600 hover:text-pink-600 flex items-center justify-center transition-all duration-300" title="Instagram">
                  <svg className="w-4.5 h-4.5 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                  </svg>
                </a>
              )}
              {socmed.facebook && (
                <a href={socmed.facebook} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-slate-100 hover:bg-blue-100 text-slate-600 hover:text-blue-600 flex items-center justify-center transition-all duration-300" title="Facebook">
                  <svg className="w-4.5 h-4.5 fill-current" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </a>
              )}
              {socmed.tiktok && (
                <a href={socmed.tiktok} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-black flex items-center justify-center transition-all duration-300" title="TikTok">
                  <svg className="w-4.5 h-4.5 fill-current" viewBox="0 0 24 24">
                    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.52-4.06-1.39-.77-.57-1.39-1.33-1.89-2.18v7.58c0 1.62-.35 3.32-1.35 4.63-1.35 1.77-3.64 2.58-5.83 2.22-2.19-.36-4.11-1.92-4.75-4.05-.88-2.93.38-6.31 3.06-7.55.93-.43 1.98-.6 3-.52v4.07c-.9-.15-1.88.08-2.52.76-.71.74-.78 1.95-.36 2.86.49 1.07 1.76 1.73 2.94 1.48 1.18-.25 2.01-1.33 2.01-2.53V0z" />
                  </svg>
                </a>
              )}
              {socmed.youtube && (
                <a href={socmed.youtube} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-slate-100 hover:bg-red-100 text-slate-600 hover:text-red-600 flex items-center justify-center transition-all duration-300" title="YouTube">
                  <svg className="w-4.5 h-4.5 fill-current" viewBox="0 0 24 24">
                    <path d="M23.498 6.163a3.003 3.003 0 00-2.11-2.11C19.518 3.545 12 3.545 12 3.545s-7.518 0-9.388.508a3.003 3.003 0 00-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 002.11 2.11c1.87.508 9.388.508 9.388.508s7.518 0 9.388-.508a3.003 3.003 0 002.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                </a>
              )}
              {socmed.twitter && (
                <a href={socmed.twitter} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-black flex items-center justify-center transition-all duration-300" title="Twitter / X">
                  <svg className="w-4.5 h-4.5 fill-current" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
              )}
            </div>
          </div>

          {/* Tautan Publik */}
          <div>
            <h5 className="font-bold text-body-md text-primary mb-4">Tautan Publik</h5>
            <ul className="space-y-2.5" style={{ listStyle: "none", padding: 0 }}>
              <li>
                <Link href="/katalog" className="text-body-md text-on-surface-variant hover:text-primary transition-colors">
                  Katalog Lelang
                </Link>
              </li>
              <li>
                <Link href="/jadwal" className="text-body-md text-on-surface-variant hover:text-primary transition-colors">
                  Jadwal Sesi Lelang
                </Link>
              </li>
              <li>
                <Link href="/tentang" className="text-body-md text-on-surface-variant hover:text-primary transition-colors">
                  Tentang Kami
                </Link>
              </li>
              <li>
                <Link href="/kontak" className="text-body-md text-on-surface-variant hover:text-primary transition-colors">
                  Hubungi Kami
                </Link>
              </li>
            </ul>
          </div>

          {/* Panduan Bidder */}
          <div>
            <h5 className="font-bold text-body-md text-primary mb-4">Panduan Bidder</h5>
            <ul className="space-y-2.5" style={{ listStyle: "none", padding: 0 }}>
              <li>
                <Link href="/register" className="text-body-md text-on-surface-variant hover:text-primary transition-colors">
                  Daftar Akun Baru
                </Link>
              </li>
              <li>
                <Link href="/syarat" className="text-body-md text-on-surface-variant hover:text-primary transition-colors">
                  Aturan &amp; Syarat Bidding
                </Link>
              </li>
              <li>
                <Link href="/ekyc/upload" className="text-body-md text-on-surface-variant hover:text-primary transition-colors">
                  Verifikasi Akun (eKYC)
                </Link>
              </li>
            </ul>
          </div>

          {/* Provider */}
          <div>
            <h5 className="font-bold text-body-md text-primary mb-4">Provider</h5>
            <ul className="space-y-2.5" style={{ listStyle: "none", padding: 0 }}>
              <li>
                <Link href="/login" className="text-body-md text-on-surface-variant hover:text-primary transition-colors">
                  Portal Provider
                </Link>
              </li>
              <li>
                <Link href="/register" className="text-body-md text-on-surface-variant hover:text-primary transition-colors">
                  Daftar Sebagai Provider
                </Link>
              </li>
              <li>
                <Link href="/syarat" className="text-body-md text-on-surface-variant hover:text-primary transition-colors">
                  Ketentuan Titip Jual
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 pb-6 sm:pb-0 border-t border-outline-variant/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-body-sm text-outline text-center sm:text-left">
            © 2026 PT INDO LELANG SEJAHTERA. All rights reserved.
          </p>
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 text-body-sm font-medium">
            <Link href="/syarat" className="text-primary underline hover:text-primary/80 transition-colors">
              Syarat dan Ketentuan Lelang
            </Link>
            <Link href="/kebijakan" className="text-primary underline hover:text-primary/80 transition-colors">
              Kebijakan Privasi
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
