"use client";

import React, { useState } from "react";
import BidderLayout from "../../../components/layout/BidderLayout";

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
  const [lots, setLots] = useState<Lot[]>([
    { id: "12", name: "Toyota Avanza Veloz 1.5 AT 2021", limitPrice: 120000000, currentBid: 142000000, status: "live", timeLeft: "45 detik", image: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=200" },
    { id: "15", name: "Honda Civic Hatchback RS 2020", limitPrice: 280000000, currentBid: 320000000, status: "upcoming", timeLeft: "Besok, 10:00", image: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=200" },
  ]);

  const handleRemove = (id: string) => {
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
          {lots.length > 0 ? (
            lots.map((lot) => (
              <div key={lot.id} className="flex flex-col sm:flex-row items-center justify-between p-4 border border-outline-variant/20 rounded-xl gap-4 bg-slate-50">
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <img src={lot.image} alt={lot.name} className="w-16 h-16 rounded-lg object-cover" />
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">#{lot.id} - {lot.name}</h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Limit: {formatRupiah(lot.limitPrice)} &bull; Bid Tertinggi: <span className="font-bold text-primary">{formatRupiah(lot.currentBid)}</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                  <span className={`badge-ui ${lot.status === "live" ? "danger" : "info"}`}>{lot.status}</span>
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
