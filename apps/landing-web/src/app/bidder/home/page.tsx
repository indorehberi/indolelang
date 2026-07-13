"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch, getImageUrl } from "@/lib/api";
import BidderLayout from "../../../components/layout/BidderLayout";
import PageSkeleton from "@/components/ui/PageSkeleton";

const formatRupiah = (value: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);
};

export default function BidderHome() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [activeNiplCount, setActiveNiplCount] = useState(0);
  const [session, setSession] = useState<any>(null);
  const [lots, setLots] = useState<any[]>([]);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          router.push("/login");
          return;
        }

        // Fetch user profile (or nipl count)
        const profileRes = await apiFetch("/auth/profile");
        const profileData = await profileRes.json();
        if (profileData.success) {
          setProfile(profileData.data);
        }

        // Fetch deposits for NIPL count
        const depRes = await apiFetch("/deposits/my-deposits");
        const depData = await depRes.json();
        if (depData.success) {
           const activeDeposits = depData.data?.deposits?.filter((d: any) => d.status === 'active') || [];
           let totalNipl = 0;
           activeDeposits.forEach((d: any) => {
             totalNipl += (d.nipl_count || 1);
           });
           setActiveNiplCount(totalNipl);
        }

        // Fetch nearest published session
        const sessionRes = await apiFetch("/sessions?status=published&sort=scheduled_at:asc");
        const sessionData = await sessionRes.json();
        if (sessionData.success && sessionData.data?.sessions?.length > 0) {
           const nearestSession = sessionData.data.sessions[0];
           setSession(nearestSession);

           // Fetch lots for this session
           const lotsRes = await apiFetch(`/sessions/${nearestSession.id}/lots`);
           const lotsData = await lotsRes.json();
           if (lotsData.success) {
             setLots(lotsData.data || []);
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

  if (loading) {
    return (
      <BidderLayout pageTitle="Beranda">
        <PageSkeleton />
      </BidderLayout>
    );
  }

  return (
    <BidderLayout pageTitle="Beranda">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-primary to-primary-dark text-white rounded-2xl p-6 mb-6 shadow-md relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-xl font-bold mb-1">Hallo {profile?.name || "Bidder"}</h2>
          <p className="text-sm text-white/90">
            Kamu memiliki <span className="font-black text-secondary">{activeNiplCount}</span> NIPL Aktif
          </p>
        </div>
        <span className="material-symbols-outlined absolute -right-4 -bottom-4 text-[100px] text-white/10 rotate-12">
          loyalty
        </span>
      </div>

      {/* Category List */}
      <div className="mb-8">
        <h3 className="text-sm font-bold text-slate-800 mb-3 px-1">Kategori Lelang</h3>
        <div className="flex gap-4 overflow-x-auto pb-2 hide-scrollbar">
          {[
            { id: 'mobil', name: 'Mobil', icon: 'directions_car' },
            { id: 'motor', name: 'Motor', icon: 'two_wheeler' },
            { id: 'properti', name: 'Properti', icon: 'home' },
            { id: 'alat-berat', name: 'Alat Berat', icon: 'local_shipping' },
          ].map((cat) => (
             <div key={cat.id} className="flex flex-col items-center gap-2 min-w-[72px]">
               <div className="w-14 h-14 bg-surface rounded-2xl border border-outline-variant/30 flex items-center justify-center shadow-sm text-primary hover:bg-primary/5 cursor-pointer">
                 <span className="material-symbols-outlined text-2xl">{cat.icon}</span>
               </div>
               <span className="text-[11px] font-medium text-slate-600">{cat.name}</span>
             </div>
          ))}
        </div>
      </div>

      {/* Katalog Terdekat */}
      <div>
        <div className="flex justify-between items-end mb-4 px-1">
          <div>
            <h3 className="text-base font-bold text-slate-800">Katalog Lelang Terdekat</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {session ? new Date(session.scheduled_at).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : 'Belum ada jadwal'}
            </p>
          </div>
          <Link href="/katalog" className="text-primary text-xs font-bold hover:underline">Lihat Semua</Link>
        </div>

        {lots.length === 0 ? (
           <div className="p-8 text-center bg-surface border border-dashed border-outline-variant/40 rounded-xl">
             <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">inbox</span>
             <p className="text-slate-500 text-sm">Belum ada lot yang tersedia</p>
           </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {lots.map((lot: any) => (
               <Link href={`/katalog/${lot.id}`} key={lot.id} className="bg-surface border border-outline-variant/40 rounded-xl overflow-hidden shadow-sm flex flex-col active:scale-95 transition-transform">
                 <div className="aspect-[4/3] bg-slate-100 relative">
                   {lot.asset?.photo_front ? (
                     <img src={getImageUrl(lot.asset.photo_front)} alt={lot.asset.title} className="w-full h-full object-cover" />
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
                     <p className="text-[10px] text-slate-500 mb-1">{lot.asset?.police_number} • {lot.asset?.manufacturing_year} • {lot.asset?.odometer ? `${(lot.asset.odometer/1000).toFixed(0)}k KM` : '-'}</p>
                   </div>
                   <div className="mt-2">
                     <p className="text-[10px] text-slate-500">Harga Dasar</p>
                     <p className="text-sm font-black text-primary leading-none">{formatRupiah(lot.starting_price)}</p>
                     <p className="text-[9px] text-slate-400 mt-1 flex items-center gap-0.5">
                       <span className="material-symbols-outlined text-[10px]">location_on</span>
                       <span className="truncate">{session?.branch?.name || "Jakarta"}</span>
                     </p>
                   </div>
                 </div>
               </Link>
            ))}
          </div>
        )}
      </div>

    </BidderLayout>
  );
}
