"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiUrl } from "@/lib/api";

export default function PilihPeranPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkExistingApplication = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const [resBidder, resProvider] = await Promise.all([
          fetch(apiUrl("/bidders/me"), { headers: { Authorization: `Bearer ${token}` } }),
          fetch(apiUrl("/providers/me"), { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        const bidderData = resBidder.ok ? (await resBidder.json()).data : null;
        const providerData = resProvider.ok ? (await resProvider.json()).data : null;

        if (providerData) {
          if (providerData.status === "aktif") {
            router.push("/provider/dashboard");
          } else {
            router.push("/provider/status");
          }
          return;
        }

        if (bidderData) {
          if (bidderData.status === "aktif") {
            router.push("/bidder/dashboard");
          } else {
            router.push("/ekyc/status");
          }
          return;
        }
      } catch (err) {
        console.error("Gagal memeriksa status pengajuan", err);
      } finally {
        setChecking(false);
      }
    };

    checkExistingApplication();
  }, [router]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9F8F3] hero-gradient">
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-premium mb-4"></div>
          <p className="text-body-md text-on-surface-variant font-medium">Memeriksa status akun Anda...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#F9F8F3] hero-gradient">
      <div className="bg-white/80 backdrop-blur-md rounded-3xl p-8 border border-white/60 shadow-2xl w-full max-w-[560px]">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt="BIDKU" className="h-10 w-auto mx-auto" src="/logo-bidku.png" />
          </Link>
          <h2 className="text-heading-md font-bold text-on-surface font-serif mt-2">
            Ingin Bergabung Sebagai Apa?
          </h2>
          <p className="text-body-sm text-on-surface-variant mt-1.5 leading-relaxed">
            Pilih peran Anda di platform IndoLelang. Anda perlu melengkapi profil &amp; verifikasi identitas sebelum bisa lanjut.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/register/bidder"
            className="group flex flex-col items-center text-center gap-3 p-6 rounded-2xl border-2 border-outline-variant/50 hover:border-premium hover:bg-premium/5 transition-all"
          >
            <div className="w-14 h-14 rounded-full bg-premium/10 text-premium flex items-center justify-center group-hover:bg-premium group-hover:text-on-premium transition-all">
              <span className="material-symbols-outlined text-3xl">gavel</span>
            </div>
            <div>
              <div className="font-bold text-body-md text-on-surface">Bidder</div>
              <div className="text-body-xs text-on-surface-variant mt-1">
                Ikut lelang &amp; beli kendaraan dengan harga terbaik
              </div>
            </div>
          </Link>

          <Link
            href="/register/provider"
            className="group flex flex-col items-center text-center gap-3 p-6 rounded-2xl border-2 border-outline-variant/50 hover:border-secondary hover:bg-secondary/5 transition-all"
          >
            <div className="w-14 h-14 rounded-full bg-secondary/10 text-secondary flex items-center justify-center group-hover:bg-secondary group-hover:text-white transition-all">
              <span className="material-symbols-outlined text-3xl">inventory_2</span>
            </div>
            <div>
              <div className="font-bold text-body-md text-on-surface">Provider</div>
              <div className="text-body-xs text-on-surface-variant mt-1">
                Titip jual unit kendaraan Anda untuk dilelang
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
