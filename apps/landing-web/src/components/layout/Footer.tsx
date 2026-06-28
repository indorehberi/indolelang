"use client";

import Link from "next/link";
import React from "react";

export default function Footer() {
  return (
    <footer className="bg-surface-container-lowest border-t border-outline-variant/20 mt-20">
      <div className="max-w-container-max mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand & Kontak */}
          <div className="flex flex-col gap-6">
            <Link href="/" className="flex items-center gap-2">
              <img
                alt="BIDKU"
                className="h-9 md:h-10 w-auto"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuB0kX0b4x1hdXkkqGpcBK7k-VnMmbQ2p1bkWBtILPPPJfUDTrrzXV41suiELbl45C5eJa-92rW3ocXp6GEZfuPOem7Cho3kMufwZ7_xWyysCIcFE83KLlI1VlF8kxqtxMUDolFpfozQOH32Fymj2pDOAUlgE1rw2M7G27XYXnRy0KL_9-LC41QcJkmlAk-OwbVaeQMEzhhNLaVZhZj1X3h0FpSJKc4gbVES42m-Yw8iDAlmusXoVmEoi8wQrRUqC9qEfnxkg2yTFzTX"
              />
            </Link>
            <p className="text-body-md text-on-surface-variant leading-relaxed">
              BIDKU adalah platform lelang digital resmi dan terpercaya untuk berbagai jenis aset berharga di Indonesia.
            </p>
            <div className="text-body-md text-on-surface-variant space-y-1">
              <p className="font-bold text-primary">Hubungi Kami:</p>
              <p>✉️ support@indolelang.com</p>
              <p>📞 (021) 5098-8888</p>
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
                <Link href="/faq" className="text-body-md text-on-surface-variant hover:text-primary transition-colors">
                  FAQ &amp; Pusat Bantuan
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
                <Link href="/register/bidder" className="text-body-md text-on-surface-variant hover:text-primary transition-colors">
                  Registrasi Bidder
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
              <li>
                <Link href="/faq" className="text-body-md text-on-surface-variant hover:text-primary transition-colors">
                  Kebijakan Deposit &amp; Refund
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
                <Link href="/register/provider" className="text-body-md text-on-surface-variant hover:text-primary transition-colors">
                  Daftar Sebagai Provider
                </Link>
              </li>
              <li>
                <Link href="/register/provider" className="text-body-md text-on-surface-variant hover:text-primary transition-colors">
                  Ketentuan Titip Jual
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-body-md text-on-surface-variant hover:text-primary transition-colors">
                  Skema Settlement Dana
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-outline-variant/10 text-center">
          <p className="text-body-sm text-outline">
            © 2026 PT INDO LELANG SEJAHTERA. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
