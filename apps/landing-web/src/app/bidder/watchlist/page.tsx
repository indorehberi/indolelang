"use client";

import React, { useState, useEffect } from "react";
import BidderLayout from "../../../components/layout/BidderLayout";
import { apiUrl } from "@/lib/api";

interface Lot {
  id: string;
  name: string;
  limitPrice: number;
  currentBid: number;
  status: "live" | "upcoming" | "ended";
  timeLeft: string;
  image: string;
}

export default function BidderWatchlist() {
  const [lots, setLots] = useState<Lot[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchWatchlistData = async () => {
    if (typeof window === "undefined") return;
    try {
      setLoading(true);
      const stored = localStorage.getItem("watchlist");
      if (!stored) {
        setLots([]);
        setLoading(false);
        return;
      }
      
      const ids: string[] = JSON.parse(stored);
      if (!Array.isArray(ids) || ids.length === 0) {
        setLots([]);
        setLoading(false);
        return;
      }

      // Fetch each lot by ID in parallel
      const fetchPromises = ids.map(async (id) => {
        try {
          const res = await fetch(apiUrl(`/lots/${id}`));
          if (!res.ok) return null;
          const result = await res.json();
          if (result.success && result.data) {
            const lot = result.data;
            const images = lot.asset.images || [];
            const image = images[0] || "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&q=80&w=600";
            
            let status: "live" | "upcoming" | "ended" = "upcoming";
            if (lot.status === "active") {
              status = "live";
            } else if (lot.status === "sold" || lot.status === "unsold" || lot.status === "closed") {
              status = "ended";
            }

            return {
              id: lot.id,
              name: lot.asset.title,
              limitPrice: lot.starting_price,
              currentBid: lot.hammer_price || lot.starting_price,
              status,
              timeLeft: lot.status === "active" ? "Live" : "Akan Datang",
              image,
            } as Lot;
          }
        } catch (e) {
          console.error(`Failed to fetch lot ${id}`, e);
        }
        return null;
      });

      const results = await Promise.all(fetchPromises);
      setLots(results.filter((l): l is Lot => l !== null));
    } catch (e) {
      console.error("Failed to load watchlist", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWatchlistData();
  }, []);

  const handleRemove = (id: string) => {
    if (typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem("watchlist");
      if (stored) {
        const ids: string[] = JSON.parse(stored);
        const filtered = ids.filter((x) => x !== id);
        localStorage.setItem("watchlist", JSON.stringify(filtered));
        window.dispatchEvent(new Event("watchlist-updated"));
      }
    } catch (e) {
      // ignore
    }
    setLots(lots.filter(l => l.id !== id));
  };

  const formatRupiah = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <BidderLayout pageTitle="Watchlist Aset">
      <p className="page-subtitle">Aset favorit yang Anda pantau untuk penawaran</p>

      <div className="card">
        <div className="card-header">Daftar Watchlist Anda</div>
        <div className="space-y-4">
          {loading ? (
            <p className="text-xs text-slate-500 text-center py-6">Memuat watchlist...</p>
          ) : lots.length > 0 ? (
            lots.map((lot) => (
              <div key={lot.id} className="flex flex-col sm:flex-row items-center justify-between p-4 border border-outline-variant/20 rounded-xl gap-4 bg-slate-50">
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <img src={lot.image} alt={lot.name} className="w-16 h-16 rounded-lg object-cover" />
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">#{lot.id.substring(0, 8)} - {lot.name}</h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Limit: {formatRupiah(lot.limitPrice)} &bull; Bid Tertinggi: <span className="font-bold text-primary">{formatRupiah(lot.currentBid)}</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                  <span className={`badge-ui ${lot.status === "live" ? "danger" : (lot.status === "upcoming" ? "info" : "secondary")}`}>{lot.status}</span>
                  {lot.status === "live" && (
                    <span className="text-xs text-slate-500 font-medium">Sisa: {lot.timeLeft}</span>
                  )}
                  <button
                    onClick={() => handleRemove(lot.id)}
                    className="p-2 text-error hover:bg-error/10 rounded-xl transition-all"
                  >
                    <span className="material-symbols-outlined text-base">delete</span>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-500 text-center py-6">Tidak ada aset dalam watchlist Anda.</p>
          )}
        </div>
      </div>
    </BidderLayout>
  );
}
