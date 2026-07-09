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

// Sub-component to manage a single active lot
function ActiveLotCard({ lot, token, bidIncrements, socket, onLotClosed }: { 
  lot: any; 
  token: string; 
  bidIncrements: number[];
  socket: Socket | null;
  onLotClosed: () => void;
}) {
  const [currentPrice, setCurrentPrice] = useState<number>(Number(lot.starting_price));
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [hasNipl, setHasNipl] = useState<boolean>(true);
  const [bidLogs, setBidLogs] = useState<BidLog[]>([]);
  const [bidCooldown, setBidCooldown] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Check NIPL
  useEffect(() => {
    const fetchNipl = async () => {
      try {
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
      } catch(e) {}
    };
    fetchNipl();
  }, [lot.session_id, token]);

  useEffect(() => {
    if (!socket) return;

    const handleBidUpdate = (data: any) => {
      if (data.lot_id !== lot.id) return;
      setCurrentPrice(data.current_price);
      setTimeLeft(data.time_remaining);

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
        if (prev.length > 0 && prev[0].amount === data.current_price) return prev;
        return [newLog, ...prev.slice(0, 9)];
      });
    };

    const handleBidError = (data: any) => {
      // Note: bid:error is broadcasted to the specific socket that sent it?
      // Or if broadcasted room-wide, we might need a way to filter, but let's assume it has lot_id
      if (data.lot_id && data.lot_id !== lot.id) return; 
      setErrorMessage(data.message || "Gagal mengajukan penawaran.");
      setTimeout(() => setErrorMessage(""), 4000);
    };

    const handleLotClosed = (data: any) => {
      if (data.lot_id !== lot.id) return;
      alert(`Bidding lot ${lot.lot_number} selesai. Hasil: ${data.result === "sold" ? "TERJUAL" : "TIDAK LAKU"}`);
      onLotClosed();
    };

    socket.on("bid:update", handleBidUpdate);
    socket.on("bid:error", handleBidError);
    socket.on("lot:closed", handleLotClosed);

    return () => {
      socket.off("bid:update", handleBidUpdate);
      socket.off("bid:error", handleBidError);
      socket.off("lot:closed", handleLotClosed);
    };
  }, [socket, lot.id, onLotClosed]);

  const handlePlaceBid = (incrementAmount: number) => {
    if (!socket || bidCooldown) return;
    setBidCooldown(true);
    setTimeout(() => setBidCooldown(false), 1200);

    const nextBidAmount = currentPrice + incrementAmount;
    socket.emit("bid:submit", {
      lot_id: lot.id,
      session_id: lot.session_id,
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

  return (
    <div className="card mb-6 shadow-sm border-l-4 border-l-danger">
      <div className="card-header flex justify-between items-center">
        <span>
          LOT #{lot.lot_number} &bull; {lot.asset?.title}
        </span>
        <span className="badge-ui danger animate-pulse">LIVE ACTIVE</span>
      </div>

      {errorMessage && (
        <div className="alert-box danger mb-4 flex items-center gap-2 transition-all mx-5 mt-4">
          <span className="material-symbols-outlined">error</span>
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Refactored Layout: Left (Bidding + Logs) - Right (Asset Image + Data) */}
      <div className="p-5 flex flex-col md:flex-row gap-6">
        
        {/* LEFT COLUMN: Bidding Control Panel */}
        <div className="w-full md:w-1/2 flex flex-col gap-6">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div className="space-y-4">
              <div>
                <span className="text-xs text-slate-500 uppercase tracking-widest font-semibold block mb-1">Harga Tertinggi Saat Ini</span>
                <div className="text-4xl text-primary font-black">{formatRupiah(currentPrice)}</div>
              </div>
              
              <div className="pt-2 border-t border-slate-200">
                <span className="text-xs text-slate-500 uppercase tracking-widest font-semibold block mb-1">Sisa Waktu Penawaran</span>
                <div
                  className={`text-2xl font-bold flex items-center gap-2 ${
                    timeLeft <= 15 ? "text-error" : "text-slate-800"
                  }`}
                >
                  <span className="material-symbols-outlined text-3xl">timer</span>
                  {timeLeft > 0 ? `${timeLeft} detik` : "Sesi Ditutup / Menunggu Ketok Palu"}
                </div>
              </div>
            </div>

            {hasNipl ? (
              <div className="mt-6 space-y-3">
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold block text-center bg-slate-200 py-1 rounded">Quick Bid Options</span>
                <div className="grid grid-cols-3 gap-2">
                  {bidIncrements.map((inc, i) => (
                    <button
                      key={i}
                      disabled={bidCooldown || timeLeft <= 0}
                      onClick={() => handlePlaceBid(inc)}
                      className={`py-3 px-1 text-xs font-bold rounded-lg transition-all shadow ${
                        bidCooldown || timeLeft <= 0
                          ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                          : i === 0 
                            ? "bg-slate-900 hover:bg-slate-800 text-white active:scale-95 cursor-pointer"
                            : i === 1
                              ? "bg-primary hover:bg-primary/95 text-white active:scale-95 cursor-pointer"
                              : "bg-orange-500 hover:bg-orange-600 text-white active:scale-95 cursor-pointer"
                      }`}
                    >
                      + {formatRupiah(inc)}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-slate-500 text-center italic mt-2">
                  Setiap bid di bawah 30 detik memperpanjang timer otomatis.
                </p>
              </div>
            ) : (
              <div className="mt-6 alert-box warning text-xs text-center">
                Anda tidak terdaftar dalam sesi NIPL ini. Silakan melakukan deposit terlebih dahulu.
              </div>
            )}
          </div>

          {/* Live Bid logs */}
          <div className="flex-1 flex flex-col">
            <span className="text-xs text-slate-500 uppercase tracking-widest font-semibold block mb-2 px-1">Log Penawaran Terakhir</span>
            <div className="space-y-2 flex-1 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
              {bidLogs.length === 0 ? (
                <div className="bg-slate-50 border border-dashed border-slate-300 p-6 rounded-xl flex flex-col items-center justify-center text-slate-400">
                  <span className="material-symbols-outlined text-3xl mb-1">history</span>
                  <p className="text-xs">Belum ada penawaran diajukan.</p>
                </div>
              ) : (
                bidLogs.map((log) => (
                  <div
                    key={log.id}
                    className={`flex justify-between items-center p-3 rounded-lg border shadow-sm ${
                      log.isMe
                        ? "border-primary/30 bg-primary/5"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    <div>
                      <div className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                        {log.bidder} 
                        {log.isMe && <span className="px-1.5 py-0.5 bg-primary text-white text-[9px] rounded uppercase">Anda</span>}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{log.time}</div>
                    </div>
                    <div className="text-base font-black text-slate-900">{formatRupiah(log.amount)}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Asset Data */}
        <div className="w-full md:w-1/2 flex flex-col gap-4">
          <img
            src={
              lot.asset?.images
                ? JSON.parse(lot.asset.images as string)[0]
                : "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=600"
            }
            alt={lot.asset?.title}
            className="rounded-xl object-cover w-full h-[240px] shadow-sm border border-slate-200"
          />
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex-1">
            <h4 className="font-bold text-lg text-slate-900 mb-4 pb-2 border-b border-slate-100">Spesifikasi Kendaraan</h4>
            <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
              <div>
                <span className="block text-[10px] text-slate-500 uppercase tracking-widest mb-0.5">Merk / Tipe</span>
                <span className="font-medium text-slate-800">{lot.asset?.brand || "-"} / {lot.asset?.type || "-"}</span>
              </div>
              <div>
                <span className="block text-[10px] text-slate-500 uppercase tracking-widest mb-0.5">Tahun</span>
                <span className="font-medium text-slate-800">{lot.asset?.year || "-"}</span>
              </div>
              <div>
                <span className="block text-[10px] text-slate-500 uppercase tracking-widest mb-0.5">No. Polisi</span>
                <span className="font-medium text-slate-800">{lot.asset?.license_plate || "-"}</span>
              </div>
              <div>
                <span className="block text-[10px] text-slate-500 uppercase tracking-widest mb-0.5">Warna</span>
                <span className="font-medium text-slate-800">{lot.asset?.color || "-"}</span>
              </div>
              <div>
                <span className="block text-[10px] text-slate-500 uppercase tracking-widest mb-0.5">Transmisi</span>
                <span className="font-medium text-slate-800">{lot.asset?.transmission || "-"}</span>
              </div>
              <div>
                <span className="block text-[10px] text-slate-500 uppercase tracking-widest mb-0.5">Lokasi</span>
                <span className="font-medium text-slate-800">{lot.asset?.location || "-"}</span>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-slate-100">
              <span className="block text-[10px] text-slate-500 uppercase tracking-widest mb-1.5">Harga Dasar (Limit)</span>
              <span className="font-black text-xl text-slate-900">{formatRupiah(Number(lot.starting_price))}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


export default function BidderBiddingRoom() {
  const router = useRouter();
  const [activeLots, setActiveLots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Settings for bidding
  const [bidIncrements, setBidIncrements] = useState<number[]>([500000, 1000000, 2000000]);

  const socketRef = useRef<Socket | null>(null);

  const fetchActiveLots = async () => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("accessToken");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      setLoading(true);

      // Providers cannot bid — bounce them
      const resProfile = await fetch(apiUrl("/users/profile"), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const profileData = await resProfile.json();
      if (resProfile.ok && profileData.success && profileData.data.role === "provider") {
        router.push("/provider/dashboard");
        return;
      }

      // Fetch ALL active lots
      const res = await fetch(apiUrl("/lots?status=active"), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const resData = await res.json();

      if (res.ok && resData.success && resData.data?.length > 0) {
        setActiveLots(resData.data);
      } else {
        setActiveLots([]);
      }

      // Fetch settings for bid increments
      try {
        const resSettings = await fetch(apiUrl("/settings/public"));
        const setgData = await resSettings.json();
        if (resSettings.ok && setgData.success) {
          let b1 = 500000, b2 = 1000000, b3 = 2000000;
          setgData.data.forEach((item: any) => {
            if (item.key === 'bid_increment_1') b1 = Number(item.value);
            if (item.key === 'bid_increment_2') b2 = Number(item.value);
            if (item.key === 'bid_increment_3') b3 = Number(item.value);
          });
          setBidIncrements([b1, b2, b3]);
        }
      } catch (e) {}
    } catch (err) {
      console.error("Failed to load active lots", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveLots();
  }, []);

  // Central Socket Connection
  useEffect(() => {
    if (activeLots.length === 0) return;

    const token = localStorage.getItem("accessToken");
    const socket = io(API_BASE_URL, {
      auth: { token },
      transports: ["websocket"],
    });
    socketRef.current = socket;

    // Join room for each active lot
    activeLots.forEach((lot) => {
      socket.emit("bid:watch", {
        lot_id: lot.id,
        session_id: lot.session_id,
      });
    });

    return () => {
      activeLots.forEach((lot) => {
        socket.emit("bid:unwatch", { lot_id: lot.id });
      });
      socket.disconnect();
      socketRef.current = null;
    };
  }, [activeLots.map(l => l.id).join(",")]); // Re-connect only if the active lot IDs change

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

  return (
    <BidderLayout pageTitle="Ruang Lelang Live">
      <p className="page-subtitle mb-6">Ikuti penawaran unit lot aktif secara real-time</p>

      {activeLots.length > 0 ? (
        <div className="space-y-8">
          {activeLots.map((lot) => (
            <ActiveLotCard 
              key={lot.id} 
              lot={lot} 
              token={localStorage.getItem("accessToken") || ""}
              bidIncrements={bidIncrements}
              socket={socketRef.current}
              onLotClosed={fetchActiveLots}
            />
          ))}
        </div>
      ) : (
        <div className="card py-16 text-center flex flex-col items-center justify-center gap-4">
          <span className="material-symbols-outlined text-6xl text-slate-300">gavel</span>
          <span className="text-xl font-bold text-slate-700">Belum ada lot lelang aktif saat ini</span>
          <p className="text-sm text-slate-500 max-w-md">
            Harap menunggu operator admin mengaktifkan lot lelang berikutnya dari Control Room.
          </p>
        </div>
      )}
    </BidderLayout>
  );
}
