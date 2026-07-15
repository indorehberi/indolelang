"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch, apiUrl } from "@/lib/api";
import BidderLayout from "../../../components/layout/BidderLayout";
import PageSkeleton from "@/components/ui/PageSkeleton";
import { useToast } from "@/providers/ToastProvider";
import { useRefreshOnForeground } from "@/hooks/useRefreshOnForeground";
import LotCard, { mapLotToCard } from "@/components/lots/LotCard";

const PER_PAGE = 20;

export default function BidderHome() {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [niplCounts, setNiplCounts] = useState({ motor: 0, mobil: 0 });
  const [session, setSession] = useState<any>(null);
  const [lots, setLots] = useState<any[]>([]);
  const [isSoldLots, setIsSoldLots] = useState(false);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>("Semua");
  const [currentPage, setCurrentPage] = useState(1);
  const [isPWA, setIsPWA] = useState(false);

  useEffect(() => {
    setIsPWA(
      window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone ||
        document.referrer.includes("android-app://")
    );
  }, []);

  const fetchHomeData = useCallback(async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          router.push("/login");
          return;
        }

        // Fetch user profile
        const profileRes = await apiFetch("/users/profile");
        const profileData = await profileRes.json();
        if (profileData.success) {
          setProfile(profileData.data);
        }

        // Fetch deposits for NIPL count breakdown
        const depRes = await apiFetch("/deposits/my-deposits");
        const depData = await depRes.json();
        if (depData.success) {
           const activeDeposits = depData.data?.deposits?.filter((d: any) => d.status === 'active' || d.status === 'paid') || [];
           let motorCount = 0;
           let mobilCount = 0;
           activeDeposits.forEach((d: any) => {
             if (d.unit_type === 'motor') motorCount += (d.nipl_count || 1);
             else if (d.unit_type === 'mobil') mobilCount += (d.nipl_count || 1);
           });
           setNiplCounts({ motor: motorCount, mobil: mobilCount });
        }

        // Fetch nearest session for header display (live first, then published)
        let sessionRes = await apiFetch("/sessions?status=live");
        let sessionData = await sessionRes.json();
        let sessions: any[] = Array.isArray(sessionData.data) ? sessionData.data : [];

        if (!sessionData.success || sessions.length === 0) {
          sessionRes = await apiFetch("/sessions?status=published");
          sessionData = await sessionRes.json();
          sessions = Array.isArray(sessionData.data) ? sessionData.data : [];
        }

        if (sessionData.success && sessions.length > 0) {
          setSession(sessions[0]);
        } else {
          setSession(null);
        }

        // Fetch all featured lots from all active sessions — same endpoint
        // as the Katalog page so both views always show consistent data.
        const featuredRes = await fetch(apiUrl('/public/lots/featured'));
        const featuredData = await featuredRes.json();

        if (featuredRes.ok && featuredData.data?.length > 0) {
          setLots(featuredData.data);
          setIsSoldLots(false);
        } else {
          // No active lots — only show sold lot history if the feature toggle
          // is ON. While it's OFF (default) dummy/test data stays hidden.
          let showSoldHistory = false;
          try {
            const settingsRes = await fetch(apiUrl('/public/settings'));
            const settingsData = await settingsRes.json();
            if (settingsRes.ok && settingsData.success) {
              showSoldHistory = settingsData.data?.feat_show_sold_history === 'true';
            }
          } catch { /* keep showSoldHistory = false */ }

          if (showSoldHistory) {
            const soldRes = await apiFetch("/lots?status=sold&per_page=50");
            const soldData = await soldRes.json();
            if (soldData.success) {
              setLots(soldData.data || []);
              setIsSoldLots(true);
            }
          } else {
            setLots([]);
            setIsSoldLots(false);
          }
        }
      } catch (err) {
        console.error("Error fetching home data:", err);
      } finally {
        setLoading(false);
      }
  }, [router]);

  useEffect(() => {
    fetchHomeData();
  }, [fetchHomeData]);

  // The PWA is resumed, not reloaded — without this the NIPL counts and lot
  // prices below stay frozen at whatever they were when the app was first opened.
  useRefreshOnForeground(fetchHomeData);

  const filteredLots = useMemo(() => {
    if (activeCategoryFilter === "Semua") return lots;
    return lots.filter((lot) => lot.asset?.category?.toUpperCase() === activeCategoryFilter.toUpperCase());
  }, [lots, activeCategoryFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredLots.length / PER_PAGE));
  const validPage = Math.min(currentPage, totalPages);
  const paginatedLots = filteredLots.slice((validPage - 1) * PER_PAGE, validPage * PER_PAGE);

  // Reset to page 1 whenever the visible set changes underneath us.
  useEffect(() => {
    setCurrentPage(1);
  }, [activeCategoryFilter, isSoldLots]);

  if (loading) {
    return (
      <BidderLayout pageTitle="Beranda" hidePwaTopbar={isPWA}>
        <PageSkeleton />
      </BidderLayout>
    );
  }

  return (
    <BidderLayout pageTitle="Beranda" hidePwaTopbar={isPWA}>

      {/* PWA: banner replaces the topbar (mobile only). */}
      {isPWA && (
        <div className="lg:hidden -mx-6 -mt-6 mb-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/banner_bidku.png" alt="Banner Bidku" className="w-full h-auto object-cover" />
        </div>
      )}

      {/* Welcome Text (No Card) */}
      <div className="mb-6 px-1">
        <h2 className="text-xl font-bold text-slate-800 mb-1">Hallo {profile?.full_name || profile?.name || "Bidder"}</h2>
        <p className="text-sm text-slate-600">
          Kamu memiliki <span className="font-black text-primary">{niplCounts.motor}</span> NIPL Motor dan <span className="font-black text-primary">{niplCounts.mobil}</span> NIPL Mobil
        </p>
      </div>

      {/* Category List (Actual Images from Landing Page in 1 Row) */}
      <div className="mb-8">
        <h3 className="text-sm font-bold text-slate-800 mb-3 px-1">Kategori Lelang</h3>
        <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar">
          {/* Mobil */}
          <Link
            href="/katalog?category=MOBIL"
            className="group relative shrink-0 w-32 aspect-[4/3] rounded-xl overflow-hidden shadow-sm"
          >
            <img
              className="w-full h-full object-cover"
              alt="Mobil"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAfO6fRTBCfJVz6MUYCEQuH3UDV81F-F4DY_MQbOx18fvPHR0qu3z6dqm-XIHHrYpEsl-LUvyzzVw_rp9xw2ghrTUmUTz3239DZ7OUAAVjaIOedVl6K5emlIYjlz81T1VKKI8PugGBlfIwam3VPYHuUMUCCxIEBfN-bJXqFfvP6GPBQ8SRQT-HbBIgrbsbbvxtc6acdLRGMX5q5ScguyKNiTVPgNQdpCLmt1lOjJz8couih2BWAfseY00DK7axG4bWw30rAHVe6njfB"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
            <div className="absolute bottom-2 left-2 text-white">
              <h4 className="font-bold text-[11px] truncate">Mobil</h4>
            </div>
          </Link>
          {/* Motor */}
          <Link
            href="/katalog?category=MOTOR"
            className="group relative shrink-0 w-32 aspect-[4/3] rounded-xl overflow-hidden shadow-sm"
          >
            <img
              className="w-full h-full object-cover"
              alt="Motor"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuC31zy45WQwhdCOMrDzZCm2is66KzQ3Ef-59eRlRHkxzGC5DpJj5VKLOvc3lGiQG68JH60S9yYbjI2JAl1ms-Imx6t9eaDfxqxFmaBKRys70HjrcZ5YnCiwuv-yCKaSrD7A28rXssA0Ak7J2_CZ73L4rSL6BEMP3BALcG7uqjaShWLmgCP7TdrYqffviwAtHoJO4H8Nbu1F3fC2iQnLgvWmXu_oGP3B1DIug9vTfVnGi75xhMNL1Ybhm-iHUPaTCbQVBDSpOveGl1u6"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
            <div className="absolute bottom-2 left-2 text-white">
              <h4 className="font-bold text-[11px] truncate">Motor</h4>
            </div>
          </Link>
          {/* Alat Berat */}
          <div
            onClick={() => toast.info("Kategori lelang Alat Berat akan segera hadir!")}
            className="group relative shrink-0 w-32 aspect-[4/3] rounded-xl overflow-hidden shadow-sm opacity-75 cursor-pointer"
          >
            <img
              className="w-full h-full object-cover grayscale"
              alt="Alat Berat"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAs9bK1pYSqW-cfuVQ0j_xaNa18g0-LSKMlqXs886QplfdQJMpEpP1QMActoH4cjgCfElrjUmVeKBxZVQVERgNfc2zSLCVv2UcnDiN6IO_QCfIakOyYLKtnmAgPKmKsWBa1ORjMrEM06UyeALxwJt3IrYZgbWJlt-xUYGT82U7KK4daYCRCfpOkvmNGrixxaYWSqkLiku5XuFG82BcpZl5LPtaAHB0dIz4IU5kzkOoMJYeEbJFBusmFinqTtPOlivVZ31ihUEJH1e64"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
            <div className="absolute bottom-2 left-2 text-white">
              <h4 className="font-bold text-[11px] truncate">Alat Berat</h4>
            </div>
          </div>
          {/* Properti */}
          <div
            onClick={() => toast.info("Kategori lelang Properti akan segera hadir!")}
            className="group relative shrink-0 w-32 aspect-[4/3] rounded-xl overflow-hidden shadow-sm opacity-75 cursor-pointer"
          >
            <img
              className="w-full h-full object-cover grayscale"
              alt="Properti"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDAKe_8vmxw29JLRtQYJu9kIj9SSxejc7c-x8FZ9yvwAcraOjYJQWtAun90V_9mWhx5Fc0yj7qi226wff8XoO-B8zS94kC8jRdGIB8O9bsH7Nhr0u4sJZGBdX9R6-JALgUiUFbI_NW_vN-QiNbVb_WGRUuassF6O_AjU9RuREtTqPZI9hvaWxO6IxqUzevGmKDWDbe9XRHS-qXcH0eH4c1lTgfR2ZHLmTZvUQbPf2dM8WY2ksd1kXL4JpiipvA98Fs_rPDJFniNHLto"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
            <div className="absolute bottom-2 left-2 text-white">
              <h4 className="font-bold text-[11px] truncate">Properti</h4>
            </div>
          </div>
        </div>
      </div>

      {/* Katalog Terdekat */}
      <div>
        <div className="flex justify-between items-end mb-3 px-1">
          <div>
            <h3 className="text-base font-bold text-slate-800">
              {isSoldLots ? "Riwayat Lot Terjual" : "Katalog Lelang"}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {session
                ? new Date(session.scheduled_at).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
                : "Belum ada jadwal"}
            </p>
          </div>
          <Link href="/katalog" className="text-primary text-xs font-bold hover:underline">Lihat Semua</Link>
        </div>

        {/* No published session at all — tell the user, then fall back to the
            history of already-sold lots below. */}
        {isSoldLots && (
          <div className="mb-4 p-4 rounded-xl bg-amber-50 border border-amber-200 text-center">
            <span className="material-symbols-outlined text-3xl text-amber-500 mb-1">event_busy</span>
            <p className="text-sm font-bold text-amber-800">Belum ada jadwal sesi lelang baru</p>
            <p className="text-xs text-amber-700 mt-0.5">Sementara itu, berikut riwayat lot yang sudah terjual.</p>
          </div>
        )}

        {/* Category Filters for Local Lots */}
        {lots.length > 0 && (
          <div className="flex gap-2 mb-4 overflow-x-auto pb-1 hide-scrollbar">
            {["Semua", "MOBIL", "MOTOR"].map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategoryFilter(cat)}
                className={`px-4 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-colors border ${
                  activeCategoryFilter === cat
                    ? "bg-primary text-on-primary border-primary"
                    : "bg-surface text-slate-500 border-outline-variant/50 hover:bg-slate-100"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {filteredLots.length === 0 ? (
           <div className="p-8 text-center bg-surface border border-dashed border-outline-variant/40 rounded-xl">
             <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">inbox</span>
             <p className="text-slate-500 text-sm">Belum ada lot yang tersedia</p>
           </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              {paginatedLots.map((lot: any) => (
                <LotCard key={lot.id} lot={mapLotToCard(lot)} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-6">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={validPage <= 1}
                  className="w-9 h-9 rounded-full flex items-center justify-center border border-outline-variant/50 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
                  aria-label="Halaman sebelumnya"
                >
                  <span className="material-symbols-outlined text-lg">chevron_left</span>
                </button>
                <span className="text-xs font-semibold text-slate-600">
                  Halaman {validPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={validPage >= totalPages}
                  className="w-9 h-9 rounded-full flex items-center justify-center border border-outline-variant/50 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
                  aria-label="Halaman berikutnya"
                >
                  <span className="material-symbols-outlined text-lg">chevron_right</span>
                </button>
              </div>
            )}
          </>
        )}
      </div>

    </BidderLayout>
  );
}
