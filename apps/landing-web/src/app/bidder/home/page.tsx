"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch, getImageUrl, getAssetImages } from "@/lib/api";
import BidderLayout from "../../../components/layout/BidderLayout";
import PageSkeleton from "@/components/ui/PageSkeleton";
import { useToast } from "@/providers/ToastProvider";

const formatRupiah = (value: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);
};

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

  useEffect(() => {
    const fetchHomeData = async () => {
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

        // 1. Fetch nearest live session first
        let sessionRes = await apiFetch("/sessions?status=live&sort=scheduled_at:asc");
        let sessionData = await sessionRes.json();
        
        // 2. If no live session, fetch published session
        if (!sessionData.success || sessionData.data?.sessions?.length === 0) {
          sessionRes = await apiFetch("/sessions?status=published&sort=scheduled_at:asc");
          sessionData = await sessionRes.json();
        }

        let hasActiveLots = false;

        if (sessionData.success && sessionData.data?.sessions?.length > 0) {
           const nearestSession = sessionData.data.sessions[0];
           
           // Fetch lots for this session
           const lotsRes = await apiFetch(`/sessions/${nearestSession.id}/lots`);
           const lotsData = await lotsRes.json();
           if (lotsData.success && lotsData.data?.length > 0) {
             setSession(nearestSession);
             setLots(lotsData.data);
             setIsSoldLots(false);
             hasActiveLots = true;
           }
        }
        
        if (!hasActiveLots) {
           setSession(null);
           // No published session with lots, fetch sold lots instead
           const soldRes = await apiFetch("/lots?status=sold&per_page=50");
           const soldData = await soldRes.json();
           if (soldData.success) {
             setLots(soldData.data || []);
             setIsSoldLots(true);
           }
        }
      } catch (err) {
        console.error("Error fetching home data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, [router]);

  const filteredLots = useMemo(() => {
    if (activeCategoryFilter === "Semua") return lots;
    return lots.filter((lot) => lot.asset?.category?.toUpperCase() === activeCategoryFilter.toUpperCase());
  }, [lots, activeCategoryFilter]);

  if (loading) {
    return (
      <BidderLayout pageTitle="Beranda" hideHeader={true}>
        <PageSkeleton />
      </BidderLayout>
    );
  }

  return (
    <BidderLayout pageTitle="Beranda" hideHeader={true}>
      {/* Full Width Banner replacing header */}
      <div className="-mx-6 -mt-6 mb-6">
        <img src="/images/banner_bidku.png" alt="Banner Bidku" className="w-full h-auto object-cover" />
      </div>

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
              {isSoldLots ? "Katalog Lot Terjual" : "Katalog Lelang Terdekat"}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {session 
                ? new Date(session.scheduled_at).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) 
                : "Belum ada jadwal"}
            </p>
            {isSoldLots && (
              <p className="text-[10px] text-primary font-semibold mt-1">Lot terjual</p>
            )}
          </div>
          <Link href="/katalog" className="text-primary text-xs font-bold hover:underline">Lihat Semua</Link>
        </div>

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
          <div className="grid grid-cols-2 gap-3">
            {filteredLots.map((lot: any) => {
               const firstImage = lot.asset ? getAssetImages(lot.asset)[0] : null;
               return (
                 <Link href={`/katalog/${lot.id}`} key={lot.id} className="bg-surface border border-outline-variant/40 rounded-xl overflow-hidden shadow-sm flex flex-col active:scale-95 transition-transform">
                   <div className="aspect-[4/3] bg-slate-100 relative">
                     {firstImage ? (
                       <img src={getImageUrl(firstImage)} alt={lot.asset?.brand || 'Kendaraan'} className="w-full h-full object-cover" />
                     ) : (
                       <div className="w-full h-full flex items-center justify-center text-slate-300">
                         <span className="material-symbols-outlined text-4xl">directions_car</span>
                       </div>
                     )}
                     <div className="absolute top-1.5 left-1.5 bg-black/70 backdrop-blur-sm text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                       Lot {lot.lot_number || '-'}
                     </div>
                   {lot.asset?.grade && (
                     <div className="absolute top-1.5 right-1.5 bg-secondary text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                       Grade {lot.asset.grade}
                     </div>
                   )}
                 </div>
                 <div className="p-2.5 flex-1 flex flex-col justify-between">
                   <div>
                     <h4 className="font-bold text-slate-800 text-xs leading-snug line-clamp-2 mb-1">{lot.asset?.brand} {lot.asset?.model}</h4>
                     <p className="text-[10px] text-slate-500 mb-1">{lot.asset?.police_number} • {lot.asset?.year || lot.asset?.manufacturing_year} • {lot.asset?.odometer ? `${(lot.asset.odometer/1000).toFixed(0)}k KM` : '-'}</p>
                   </div>
                   <div className="mt-2">
                     <p className="text-[10px] text-slate-500">{isSoldLots ? "Harga Terbentuk" : "Harga Dasar"}</p>
                     <p className="text-sm font-black text-primary leading-none">{formatRupiah(isSoldLots ? (lot.hammer_price || lot.starting_price) : lot.starting_price)}</p>
                     <p className="text-[9px] text-slate-400 mt-1 italic">
                       +Biaya PMK41 (1,1%)
                     </p>
                     <p className="text-[9px] text-slate-500 mt-1.5 flex items-center gap-0.5 font-semibold">
                       <span className="material-symbols-outlined text-[10px]">location_on</span>
                       <span className="truncate">{session?.branch?.name || lot.session?.branch?.name || "Jakarta"}</span>
                     </p>
                   </div>
                 </div>
               </Link>
             );
            })}
          </div>
        )}
      </div>

    </BidderLayout>
  );
}
