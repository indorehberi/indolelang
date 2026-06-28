"use client";

import React, { useState, useEffect } from "react";
import BidderLayout from "../../../components/layout/BidderLayout";

interface BidLog {
  id: string;
  bidder: string;
  amount: number;
  time: string;
  isMe?: boolean;
}

export default function BidderBiddingRoom() {
  const [currentPrice, setCurrentPrice] = useState<number>(142000000);
  const [timeLeft, setTimeLeft] = useState<number>(45);
  const [hasNipl, setHasNipl] = useState<boolean>(true);
  const [bidLogs, setBidLogs] = useState<BidLog[]>([
    { id: "1", bidder: "Budi Santoso (Anda)", amount: 142000000, time: "14:15:32", isMe: true },
    { id: "2", bidder: "Hendra Wijaya", amount: 141500000, time: "14:15:20" },
    { id: "3", bidder: "Ahmad Pratama", amount: 141000000, time: "14:15:05" },
  ]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          return 60; // reset simulation countdown
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handlePlaceBid = (increment: number) => {
    const nextPrice = currentPrice + increment;
    setCurrentPrice(nextPrice);
    setTimeLeft(60); // Anti-sniping extend timer

    const newLog: BidLog = {
      id: Math.random().toString(),
      bidder: "Budi Santoso (Anda)",
      amount: nextPrice,
      time: new Date().toLocaleTimeString("id-ID"),
      isMe: true,
    };

    setBidLogs((prev) => [newLog, ...prev.slice(0, 4)]);
  };

  const formatRupiah = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <BidderLayout pageTitle="Ruang Lelang Live">
      <p className="page-subtitle">Ikuti penawaran unit lot aktif secara real-time</p>

      <div className="grid-2-1">
        <div>
          {/* Active Lot Info */}
          <div className="card">
            <div className="card-header">
              <span>LOT #12 &bull; Toyota Avanza Veloz 1.5 AT 2021</span>
              <span className="badge-ui danger">ACTIVE</span>
            </div>

            <div className="flex flex-col md:flex-row gap-6">
              {/* Asset Image */}
              <div className="w-full md:w-1/2">
                <img
                  src="https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=600"
                  alt="Toyota Avanza"
                  className="rounded-xl object-cover w-full h-48 shadow-inner"
                />
              </div>

              {/* Bidding Control Panel */}
              <div className="w-full md:w-1/2 flex flex-col justify-between">
                <div className="space-y-3">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Harga Tertinggi Saat Ini</span>
                    <div className="text-heading-2xl text-primary font-black mt-0.5">{formatRupiah(currentPrice)}</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Sisa Waktu Penawaran</span>
                    <div className={`text-xl font-bold flex items-center gap-1.5 mt-0.5 ${timeLeft <= 10 ? "text-error" : "text-slate-800"}`}>
                      <span className="material-symbols-outlined animate-pulse">timer</span>
                      {timeLeft} detik
                    </div>
                  </div>
                </div>

                {hasNipl ? (
                  <div className="mt-6 space-y-3">
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold block">Ajukan Penawaran Cepat</span>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => handlePlaceBid(500000)}
                        className="py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all"
                      >
                        + Rp 500.000
                      </button>
                      <button
                        onClick={() => handlePlaceBid(1000000)}
                        className="py-2.5 bg-primary hover:bg-primary/95 text-white text-xs font-bold rounded-xl transition-all"
                      >
                        + Rp 1.000.000
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-500 text-center italic mt-1">
                      *Setiap bid baru memperpanjang timer otomatis ke 60 detik (anti-sniping).
                    </p>
                  </div>
                ) : (
                  <div className="mt-6 alert-box warning text-xs">
                    Anda tidak terdaftar dalam sesi NIPL ini. Silakan melakukan deposit terlebih dahulu.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Live Bid logs */}
        <div>
          <div className="card">
            <div className="card-header">Log Penawaran Realtime</div>
            <div className="space-y-3">
              {bidLogs.map((log) => (
                <div
                  key={log.id}
                  className={`flex justify-between items-center p-2.5 rounded-xl border ${
                    log.isMe
                      ? "border-primary/20 bg-primary/[0.02]"
                      : "border-outline-variant/20 bg-slate-50"
                  }`}
                >
                  <div className="text-xs">
                    <div className="font-bold text-slate-800">{log.bidder}</div>
                    <div className="text-[9px] text-slate-500 mt-0.5">{log.time}</div>
                  </div>
                  <div className="text-sm font-black text-slate-950">{formatRupiah(log.amount)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </BidderLayout>
  );
}
