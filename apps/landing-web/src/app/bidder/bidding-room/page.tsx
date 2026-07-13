"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import { apiFetch, apiUrl, API_BASE_URL, refreshAccessToken, getAssetImages, getImageUrl, wsBaseUrl } from "@/lib/api";
import BidderLayout from "../../../components/layout/BidderLayout";
import PageSkeleton from "@/components/ui/PageSkeleton";
import { useToast } from "@/providers/ToastProvider";

interface BidLog {
  id: string;
  bidder: string;
  amount: number;
  time: string;
  isMe?: boolean;
}

// Sub-component to manage a single active lot
function ActiveLotCard({ lot, token, bidIncrements, socket, onLotClosed, isSingleLot }: {
  lot: any;
  token: string;
  bidIncrements: number[];
  socket: Socket | null;
  onLotClosed: () => void;
  isSingleLot: boolean;
}) {
  const toast = useToast();
  const [currentPrice, setCurrentPrice] = useState<number>(Number(lot.starting_price));
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [hasNipl, setHasNipl] = useState<boolean>(true);
  const [bidLogs, setBidLogs] = useState<BidLog[]>([]);
  const [bidCooldown, setBidCooldown] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isBidEnabled, setIsBidEnabled] = useState<boolean>(false);
  const [startCountdown, setStartCountdown] = useState<number | null>(3);
  const [currentImageIdx, setCurrentImageIdx] = useState<number>(0);
  
  const assetImages = getAssetImages(lot.asset);

  useEffect(() => {
    if (startCountdown === null) return;
    if (startCountdown > 0) {
      const timer = setTimeout(() => setStartCountdown(prev => (prev as number) - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setStartCountdown(null);
    }
  }, [startCountdown]);

  // Check NIPL
  useEffect(() => {
    const fetchNipl = async () => {
      try {
        const resDeposits = await apiFetch("/deposits");
        const resDepData = await resDeposits.json();
        if (resDeposits.ok && resDepData.success) {
          const list = resDepData.data || [];
          
          // Map category to unit type (motor/mobil)
          const lotCategory = lot.asset?.category?.toLowerCase() || "";
          const lotUnitType = lotCategory.includes("motor") ? "motor" : "mobil";

          const activeNipl = list.some(
            (d: any) => d.status === "paid" && d.unit_type === lotUnitType
          );
          setHasNipl(activeNipl);
        }
      } catch(e) {}
    };
    fetchNipl();
  }, [lot.asset?.category, token]);

  useEffect(() => {
    if (!socket) return;

    const handleBidUpdate = (data: any) => {
      if (data.lot_id !== lot.id) return;
      setCurrentPrice(data.current_price);
      setTimeLeft(data.time_remaining);

      // Only log if there is an active bidder (not '-' or empty)
      if (data.bidder_id && data.bidder_id !== "-") {
        // `bidder_id` in the broadcast is the server's masked id ("Peserta #XXXX",
        // see maskUserId() in lib/socket.ts) — never the bidder's name — so compare
        // against the same mask computed from our own user id, not full_name.
        const storedUser = localStorage.getItem("user");
        const currentUserId = storedUser ? JSON.parse(storedUser).id : "";
        const myMaskedId = currentUserId ? `Peserta #${currentUserId.substring(0, 4).toUpperCase()}` : "";
        const isMe = !!data.bidder_id && data.bidder_id === myMaskedId;

        if (isMe && "vibrate" in navigator) navigator.vibrate([20, 40, 20]);

        const newLog: BidLog = {
          id: Math.random().toString(),
          bidder: data.bidder_id,
          amount: data.current_price,
          time: new Date().toLocaleTimeString("id-ID"),
          isMe: isMe,
        };

        setBidLogs((prev) => {
          if (prev.length > 0 && Number(prev[0].amount) === Number(data.current_price)) return prev;
          return [newLog, ...prev.slice(0, 9)];
        });
      }
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
      toast.info(`Bidding lot ${lot.lot_number} selesai. Hasil: ${data.result === "sold" ? "TERJUAL" : "TIDAK LAKU"}`);
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
    if ("vibrate" in navigator) navigator.vibrate(15);
    setBidCooldown(true);
    setTimeout(() => setBidCooldown(false), 1200);

    const nextBidAmount = currentPrice + incrementAmount;
    socket.emit("bid:submit", {
      lot_id: lot.id,
      session_id: lot.session_id,
      amount: nextBidAmount,
    });
  };

  const minIncrement = 500000;

  const dynamicIncrements = [minIncrement, minIncrement * 2, minIncrement * 3];

  const formatRupiah = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <>
    <div className="card mb-6 shadow-sm border-l-4 border-l-danger relative overflow-hidden">
      {/* 3-Second Countdown Overlay */}
      {startCountdown !== null && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-900/60 backdrop-blur-sm rounded-xl">
          <span className="material-symbols-outlined text-white text-6xl mb-4 animate-bounce">notifications_active</span>
          <div className="text-white text-8xl font-black">{startCountdown}</div>
          <div className="text-white text-lg font-bold mt-2">Persiapkan Diri Anda!</div>
        </div>
      )}

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
                <div className={`text-4xl font-black flex items-center gap-2 ${bidLogs[0]?.isMe ? 'text-green-600' : 'text-primary'}`}>
                  {formatRupiah(currentPrice)}
                  {bidLogs[0]?.isMe && <span className="material-symbols-outlined text-4xl text-amber-500" title="Anda penawar tertinggi!">emoji_events</span>}
                </div>
              </div>
              
              <div className="pt-2 border-t border-slate-200">
                <span className="text-xs text-slate-500 uppercase tracking-widest font-semibold block mb-1">Sisa Waktu Penawaran</span>
                <div
                  className={`text-2xl font-bold flex items-center gap-2 ${
                    timeLeft <= 15 ? "text-error" : "text-slate-800"
                  }`}
                >
                  <span className="material-symbols-outlined text-3xl">timer</span>
                  {timeLeft > 0 ? `${timeLeft} detik` : "Waktu Habis, Menunggu Ketok Palu"}
                </div>
              </div>
            </div>

            {hasNipl ? (
              <div className="mt-6 space-y-4">
                {/* On/Off Switch Toggle */}
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200 shadow-sm">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-800">Partisipasi Bidding</span>
                    <span className="text-[10px] text-slate-500">Aktifkan untuk menawar</span>
                  </div>
                  <button
                    onClick={() => setIsBidEnabled(!isBidEnabled)}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      isBidEnabled ? "bg-primary" : "bg-slate-300"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        isBidEnabled ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {/* Dynamic Bid Button — hidden on mobile when the fixed bottom bid bar covers it */}
                <button
                  disabled={bidCooldown || timeLeft <= 0 || !isBidEnabled}
                  onClick={() => handlePlaceBid(minIncrement)}
                  className={`w-full py-4 px-4 text-sm font-black rounded-xl transition-all shadow-md active:scale-95 ${
                    isSingleLot ? "hidden lg:block" : ""
                  } ${
                    bidCooldown || timeLeft <= 0 || !isBidEnabled
                      ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                      : "bg-primary hover:bg-primary/95 text-white cursor-pointer hover:shadow-lg"
                  }`}
                >
                  Ajukan Penawaran (+ {formatRupiah(minIncrement)})
                </button>
                <p className="text-[10px] text-slate-500 text-center italic mt-2">
                  Timer 120 detik. Bid di 1 menit pertama me-reset timer ke 120 detik, bid di 1 menit kedua me-reset ke 60 detik.
                </p>
              </div>
            ) : (
              <div className="mt-6 alert-box warning text-xs text-center">
                Anda tidak memiliki NIPL aktif untuk jenis unit ini. Silakan melakukan deposit terlebih dahulu.
              </div>
            )}
          </div>

          {/* Live Bid logs */}
          <div className="flex-1 flex flex-col">
            <span className="text-xs text-slate-500 uppercase tracking-widest font-semibold block mb-2 px-1">Log Penawaran Terakhir</span>
            <div className="space-y-2 flex-1 max-h-[300px] overflow-y-auto overscroll-contain pr-1 custom-scrollbar">
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
          <div className="bg-white rounded-xl border border-slate-200 flex-1 overflow-hidden">
            {/* Primary Photo inside the card with Carousel */}
            <div className="relative w-full h-[220px] bg-slate-100 group">
              <img
                src={getImageUrl(assetImages[currentImageIdx])}
                alt={lot.asset?.title}
                className="object-cover w-full h-full transition-all duration-300"
              />
              {assetImages.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentImageIdx((prev) => (prev > 0 ? prev - 1 : assetImages.length - 1))}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                  >
                    <span className="material-symbols-outlined text-lg">chevron_left</span>
                  </button>
                  <button
                    onClick={() => setCurrentImageIdx((prev) => (prev < assetImages.length - 1 ? prev + 1 : 0))}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                  >
                    <span className="material-symbols-outlined text-lg">chevron_right</span>
                  </button>
                  <div className="absolute bottom-2 inset-x-0 flex justify-center gap-1.5">
                    {assetImages.map((_, i) => (
                      <div key={i} className={`h-1.5 rounded-full transition-all ${i === currentImageIdx ? 'w-4 bg-white' : 'w-1.5 bg-white/50'}`} />
                    ))}
                  </div>
                </>
              )}
            </div>
            
            <div className="p-4">
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
                  <span className="block text-[10px] text-slate-500 uppercase tracking-widest mb-0.5">Bahan Bakar</span>
                  <span className="font-medium text-slate-800">{lot.asset?.fuel_type || "-"}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-500 uppercase tracking-widest mb-0.5">Transmisi</span>
                  <span className="font-medium text-slate-800">{lot.asset?.transmission || "-"}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-500 uppercase tracking-widest mb-0.5">Mesin (CC)</span>
                  <span className="font-medium text-slate-800">{lot.asset?.cylinder || "-"} CC</span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-500 uppercase tracking-widest mb-0.5">Odometer (KM)</span>
                  <span className="font-medium text-slate-800">{lot.asset?.odometer || "-"}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-500 uppercase tracking-widest mb-0.5">Tanggal Pajak</span>
                  <span className="font-medium text-slate-800">{lot.asset?.stnk_tax_date ? new Date(lot.asset.stnk_tax_date).toLocaleDateString("id-ID") : "-"}</span>
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
    </div>

    {/* Fixed bottom bid bar (mobile, single-active-lot only): keeps the bid
        action reachable while scrolling past the log to view asset photos. */}
    {isSingleLot && hasNipl && (
      <div
        className="fixed bottom-16 inset-x-0 z-30 lg:hidden bg-white/95 glass-nav border-t border-outline-variant/20 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] px-4 py-2.5 flex items-center gap-3"
      >
        <div className="flex-1 min-w-0">
          <div className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Harga Saat Ini</div>
          <div className="text-lg font-black text-primary truncate">{formatRupiah(currentPrice)}</div>
        </div>
        <div className={`text-sm font-bold flex items-center gap-1 flex-shrink-0 ${timeLeft <= 15 ? "text-error" : "text-slate-700"}`}>
          <span className="material-symbols-outlined text-base">timer</span>
          {timeLeft > 0 ? `${timeLeft} detik` : "Habis"}
        </div>
        <button
          disabled={bidCooldown || timeLeft <= 0 || !isBidEnabled}
          onClick={() => handlePlaceBid(minIncrement)}
          className={`flex-shrink-0 px-5 py-3 text-sm font-black rounded-xl transition-all shadow-md active:scale-95 ${
            bidCooldown || timeLeft <= 0 || !isBidEnabled
              ? "bg-slate-300 text-slate-500 cursor-not-allowed"
              : "bg-primary hover:bg-primary/95 text-white cursor-pointer"
          }`}
        >
          Bid +{formatRupiah(minIncrement)}
        </button>
      </div>
    )}
    </>
  );
}


export default function BidderBiddingRoom() {
  const router = useRouter();
  const [activeLots, setActiveLots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Settings for bidding
  const [bidIncrements, setBidIncrements] = useState<number[]>([500000, 1000000, 2000000]);
  const socketRef = useRef<Socket | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  const fetchActiveLots = async (isPolling = false) => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("accessToken");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      if (!isPolling) setLoading(true);

      // Providers cannot bid — bounce them
      const resProfile = await apiFetch("/users/profile");
      const profileData = await resProfile.json();
      if (resProfile.ok && profileData.success && profileData.data.role === "provider") {
        router.push("/provider/dashboard");
        return;
      }

      // Fetch ALL active lots
      const res = await apiFetch("/lots?status=active");
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
      if (!isPolling) setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveLots();

    // Poll periodically so a bidder who opens this page while no lot is active
    // still finds out once the operator activates one — the socket connection
    // below only exists once we already know about at least one active lot, so
    // without this poll there'd be no way to discover the first one going live.
    const interval = setInterval(() => fetchActiveLots(true), 15000);
    return () => clearInterval(interval);
  }, []);

  // Central Socket Connection
  useEffect(() => {
    if (activeLots.length === 0) return;

    let cancelled = false;
    let localSocket: Socket | null = null;

    const connect = async () => {
      // Always connect with a fresh access token — a page can sit open past
      // the access-token lifetime, and unlike apiFetch() the socket has no
      // built-in retry-on-401, so refresh proactively before opening it.
      const freshToken = (await refreshAccessToken()) || localStorage.getItem("accessToken");
      if (cancelled) return;

      localSocket = io(wsBaseUrl(), {
        auth: { token: freshToken },
        transports: ["websocket"],
      });
      socketRef.current = localSocket;
      setSocket(localSocket);

      // Join room for each active lot
      activeLots.forEach((lot) => {
        localSocket!.emit("bid:watch", {
          lot_id: lot.id,
          session_id: lot.session_id,
        });
      });
    };

    connect();

    return () => {
      cancelled = true;
      if (localSocket) {
        activeLots.forEach((lot) => {
          localSocket!.emit("bid:unwatch", { lot_id: lot.id });
        });
        localSocket.disconnect();
      }
      socketRef.current = null;
      setSocket(null);
    };
  }, [activeLots.map(l => l.id).join(",")]); // Re-connect only if the active lot IDs change

  if (loading) {
    return (
      <BidderLayout pageTitle="Ruang Lelang Live">
        <PageSkeleton />
      </BidderLayout>
    );
  }

  return (
    <BidderLayout pageTitle="Ruang Lelang Live">

      {activeLots.length > 0 ? (
        <div className="space-y-8">
          {activeLots.map((lot) => (
            <ActiveLotCard
              key={lot.id}
              lot={lot}
              token={localStorage.getItem("accessToken") || ""}
              bidIncrements={bidIncrements}
              socket={socket}
              onLotClosed={fetchActiveLots}
              isSingleLot={activeLots.length === 1}
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
