"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import { apiUrl, API_BASE_URL } from "@/lib/api";
import BidderLayout from "../../../components/layout/BidderLayout";

interface BidLog {
  id: string;
  bidder: string;
  amount: number;
  time: string;
  isMe?: boolean;
}

export default function BidderBiddingRoom() {
  const router = useRouter();
  const [activeLot, setActiveLot] = useState<any>(null);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [hasNipl, setHasNipl] = useState<boolean>(true);
  const [bidLogs, setBidLogs] = useState<BidLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [bidCooldown, setBidCooldown] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const socketRef = useRef<Socket | null>(null);

  // Fetch current active lot
  const fetchActiveLot = async () => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("accessToken");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      setLoading(true);
      // Fetch active lots
      const res = await fetch(apiUrl("/lots?status=active&per_page=1"), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const resData = await res.json();

      if (res.ok && resData.success && resData.data?.length > 0) {
        const lot = resData.data[0];
        setActiveLot(lot);
        setCurrentPrice(Number(lot.starting_price));

        // Check if user has NIPL for this session
        const resDeposits = await fetch(apiUrl("/deposits"), {
          headers: { Authorization: `Bearer ${token}` },
        });
        const resDepData = await resDeposits.json();
        if (resDeposits.ok && resDepData.success) {
          const list = resDepData.data || [];
          const activeNipl = list.some(
            (d: any) => d.session_id === lot.session_id && d.status === "success"
          );
          setHasNipl(activeNipl);
        }
      } else {
        setActiveLot(null);
      }
    } catch (err) {
      console.error("Failed to load active lot", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveLot();
  }, []);

  // Connect to WebSocket once activeLot is fetched
  useEffect(() => {
    if (!activeLot) return;

    const token = localStorage.getItem("accessToken");
    const socket: Socket = io(API_BASE_URL, {
      auth: { token },
      transports: ["websocket"],
    });

    socketRef.current = socket;

    // Join room for this lot
    socket.emit("bid:watch", {
      lot_id: activeLot.id,
      session_id: activeLot.session_id,
    });

    // Listen for events
    socket.on("bid:update", (data: any) => {
      if (data.lot_id !== activeLot.id) return;
      setCurrentPrice(data.current_price);
      setTimeLeft(data.time_remaining);

      // Add to bid logs
      const user = localStorage.getItem("user");
      const currentUserName = user ? JSON.parse(user).full_name : "";
      const isMe = data.bidder_id && data.bidder_id.includes(currentUserName);

      const newLog: BidLog = {
        id: Math.random().toString(),
        bidder: data.bidder_id || "Peserta",
        amount: data.current_price,
        time: new Date().toLocaleTimeString("id-ID"),
        isMe: isMe,
      };

      setBidLogs((prev) => {
        // Prevent duplicate bid log at same amount
        if (prev.length > 0 && prev[0].amount === data.current_price) return prev;
        return [newLog, ...prev.slice(0, 9)];
      });
    });

    socket.on("bid:error", (data: any) => {
      setErrorMessage(data.message || "Gagal mengajukan penawaran.");
      setTimeout(() => setErrorMessage(""), 4000);
    });

    socket.on("lot:closed", (data: any) => {
      if (data.lot_id !== activeLot.id) return;
      alert(`Bidding lot selesai. Hasil: ${data.result === "sold" ? "TERJUAL" : "TIDAK LAKU"}`);
      fetchActiveLot(); // reload lot state
    });

    return () => {
      socket.emit("bid:unwatch", { lot_id: activeLot.id });
      socket.disconnect();
    };
  }, [activeLot]);

  // Kelipatan Bid minimum based on pricing rules
  const getMinIncrement = (price: number) => {
    if (price < 10000000) return 500000;
    if (price < 50000000) return 1000000;
    if (price < 200000000) return 2500000;
    return 5000000;
  };

  const handlePlaceBid = (incrementAmount: number) => {
    if (!socketRef.current || !activeLot || bidCooldown) return;

    // Enable cooldown (prevent click spam for 1.2 seconds)
    setBidCooldown(true);
    setTimeout(() => setBidCooldown(false), 1200);

    const nextBidAmount = currentPrice + incrementAmount;
    socketRef.current.emit("bid:submit", {
      lot_id: activeLot.id,
      session_id: activeLot.session_id,
      amount: nextBidAmount,
    });
  };

  const formatRupiah = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (loading) {
    return (
      <BidderLayout pageTitle="Ruang Lelang Live">
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-premium mb-4"></div>
          <p className="text-body-md text-on-surface-variant font-medium">Menghubungkan ke ruang lelang...</p>
        </div>
      </BidderLayout>
    );
  }

  const minInc = activeLot ? getMinIncrement(currentPrice) : 500000;

  return (
    <BidderLayout pageTitle="Ruang Lelang Live">
      <p className="page-subtitle">Ikuti penawaran unit lot aktif secara real-time</p>

      {errorMessage && (
        <div className="alert-box danger mb-4 flex items-center gap-2 transition-all">
          <span className="material-symbols-outlined">error</span>
          <span>{errorMessage}</span>
        </div>
      )}

      {activeLot ? (
        <div className="grid-2-1">
          <div>
            {/* Active Lot Info */}
            <div className="card">
              <div className="card-header">
                <span>
                  LOT #{activeLot.lot_number} &bull; {activeLot.asset?.title}
                </span>
                <span className="badge-ui danger">LIVE ACTIVE</span>
              </div>

              <div className="flex flex-col md:flex-row gap-6">
                {/* Asset Image */}
                <div className="w-full md:w-1/2">
                  <img
                    src={
                      activeLot.asset?.images
                        ? JSON.parse(activeLot.asset.images as string)[0]
                        : "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=600"
                    }
                    alt={activeLot.asset?.title}
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
                      <div
                        className={`text-xl font-bold flex items-center gap-1.5 mt-0.5 ${
                          timeLeft <= 15 ? "text-error" : "text-slate-800"
                        }`}
                      >
                        <span className="material-symbols-outlined animate-pulse">timer</span>
                        {timeLeft > 0 ? `${timeLeft} detik` : "Sesi Ditutup / Menunggu Ketok Palu"}
                      </div>
                    </div>
                  </div>

                  {hasNipl ? (
                    <div className="mt-6 space-y-3">
                      <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold block">Ajukan Penawaran Harga</span>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          disabled={bidCooldown || timeLeft <= 0}
                          onClick={() => handlePlaceBid(minInc)}
                          className={`py-3 text-xs font-bold rounded-xl transition-all shadow ${
                            bidCooldown || timeLeft <= 0
                              ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                              : "bg-slate-900 hover:bg-slate-800 text-white active:scale-95 cursor-pointer"
                          }`}
                        >
                          + {formatRupiah(minInc)}
                        </button>
                        <button
                          disabled={bidCooldown || timeLeft <= 0}
                          onClick={() => handlePlaceBid(minInc * 2)}
                          className={`py-3 text-xs font-bold rounded-xl transition-all shadow ${
                            bidCooldown || timeLeft <= 0
                              ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                              : "bg-primary hover:bg-primary/95 text-white active:scale-95 cursor-pointer"
                          }`}
                        >
                          + {formatRupiah(minInc * 2)}
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-500 text-center italic mt-1 leading-normal">
                        *Kelipatan bid minimal {formatRupiah(minInc)}.<br />
                        Setiap bid di bawah 30 detik memperpanjang timer otomatis (anti-sniping).
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
                {bidLogs.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-6">Belum ada penawaran diajukan.</p>
                ) : (
                  bidLogs.map((log) => (
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
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="card py-12 text-center text-body-md text-on-surface-variant flex flex-col items-center justify-center gap-3">
          <span className="material-symbols-outlined text-5xl text-slate-300">gavel</span>
          <span>Belum ada lot lelang aktif yang dibuka untuk penawaran saat ini.</span>
          <p className="text-body-sm text-on-surface-variant/70 max-w-md">
            Harap menunggu operator admin mengaktifkan lot lelang berikutnya dari Control Room.
          </p>
        </div>
      )}
    </BidderLayout>
  );
}
