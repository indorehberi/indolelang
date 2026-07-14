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
  onLotClosed: (data?: any) => void;
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
  const [isCancelledOverlay, setIsCancelledOverlay] = useState(false);
  const [cancelCountdown, setCancelCountdown] = useState(5);
  const audioCtxRef = useRef<AudioContext | null>(null);
  
  const assetImages = getAssetImages(lot.asset);

  const playBeep = () => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContext();
      }
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {}
  };

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
      if (data.lot_id === lot.id) {
        setErrorMessage(data.message);
        toast.error(data.message);
      }
    };

    const handleLotSync = (data: any) => {
      if (data.lot_id !== lot.id) return;
      setCurrentPrice(data.current_price);
      setTimeLeft(data.time_remaining);
    };

    const handleLotClosed = (data: any) => {
      if (data.lot_id === lot.id) {
        setStartCountdown(null);
        onLotClosed(data);
      }
    };

    const handleLotCancelled = (data: any) => {
      if (data.lot_id === lot.id || !data.lot_id) {
        setIsCancelledOverlay(true);
        setCancelCountdown(5);
        let count = 5;
        const iv = setInterval(() => {
          count--;
          setCancelCountdown(count);
          if (count <= 0) {
            clearInterval(iv);
            onLotClosed(data);
          }
        }, 1000);
      }
    };

    const handleLotStartCountdown = (data: any) => {
      if (data.lot_id === lot.id && data.duration_secs) {
        setStartCountdown(data.duration_secs);
        playBeep();
        
        let counter = data.duration_secs;
        const iv = setInterval(() => {
          counter--;
          if (counter > 0) {
            setStartCountdown(counter);
            playBeep();
          } else {
            clearInterval(iv);
            setStartCountdown(null);
          }
        }, 1000);
      }
    };

    socket.on("lot:sync", handleLotSync);
    socket.on("bid:update", handleBidUpdate);
    socket.on("bid:error", handleBidError);
    socket.on("lot:closed", handleLotClosed);
    socket.on("lot:cancelled", handleLotCancelled);
    socket.on("lot:start", handleLotStartCountdown);

    return () => {
      socket.off("lot:sync", handleLotSync);
      socket.off("bid:update", handleBidUpdate);
      socket.off("bid:error", handleBidError);
      socket.off("lot:closed", handleLotClosed);
      socket.off("lot:cancelled", handleLotCancelled);
      socket.off("lot:start", handleLotStartCountdown);
    };
  }, [socket, lot.id, onLotClosed, playBeep]);

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
      {startCountdown !== null && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-900/60 backdrop-blur-sm rounded-xl">
          <span className="material-symbols-outlined text-white mb-4 animate-bounce" style={{ fontSize: '100px' }}>notifications_active</span>
          <div className="text-white text-8xl font-black">{startCountdown}</div>
          <div className="text-white text-lg font-bold mt-2">Persiapkan Diri Anda!</div>
        </div>
      )}

      {isCancelledOverlay && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-red-900/80 backdrop-blur-sm rounded-xl">
          <span className="material-symbols-outlined text-white mb-3" style={{ fontSize: '80px' }}>cancel</span>
          <div className="text-white text-3xl font-black tracking-widest mb-1">DIBATALKAN</div>
          <div className="text-white/80 text-base">Lanjut ke lot berikutnya dalam</div>
          <div className="text-white text-7xl font-black mt-2 animate-pulse">{cancelCountdown}</div>
          <div className="text-white/80 text-sm mt-1">detik</div>
        </div>
      )}

      <div className="card-header flex flex-col gap-2">
        <div className="flex justify-between items-center w-full">
          <span className="badge-ui danger animate-pulse">LIVE ACTIVE</span>
          <div className="flex items-center gap-2">
            <div className="flex flex-col text-right">
              <span className="text-[10px] font-bold text-slate-800">Aktifkan Bidding</span>
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
        </div>
        <span className="font-bold text-lg">
          LOT #{lot.lot_number} &bull; {lot.asset?.title}
        </span>
      </div>

      {errorMessage && (
        <div className="alert-box danger mb-4 flex items-center gap-2 transition-all mx-5 mt-4">
          <span className="material-symbols-outlined">error</span>
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="p-5 flex flex-col md:flex-row gap-6">
        
        <div className="w-full md:w-1/2 flex flex-col gap-6">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div className="space-y-4">
              <div>
                <span className="text-xs text-slate-500 uppercase tracking-widest font-semibold block mb-1">Harga Tertinggi Saat Ini</span>
                <div className={`text-3xl sm:text-4xl font-black flex items-center gap-2 truncate overflow-hidden ${bidLogs[0]?.isMe ? 'text-green-600' : 'text-primary'}`}>
                  {formatRupiah(currentPrice)}
                  {bidLogs[0]?.isMe && <span className="material-symbols-outlined text-4xl text-amber-500 flex-shrink-0" title="Anda penawar tertinggi!">emoji_events</span>}
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Harga Dasar:</span>
                  <span className="text-sm font-bold text-slate-700">{formatRupiah(Number(lot.starting_price))}</span>
                </div>
              </div>
              
              <div className="pt-2 border-t border-slate-200 flex flex-col items-center justify-center">
                <div
                  className={`text-4xl font-black flex items-center gap-2 justify-center ${
                    timeLeft <= 15 ? "text-error animate-pulse" : "text-slate-800"
                  }`}
                >
                  <span className="material-symbols-outlined text-5xl">notifications_active</span>
                  {timeLeft > 0 ? `${timeLeft} detik` : "Menunggu..."}
                </div>
              </div>
            </div>

            {hasNipl ? (
              <div className="mt-6 space-y-4">
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
              </div>
            ) : (
              <div className="mt-6 alert-box warning text-xs text-center">
                Anda tidak memiliki NIPL aktif untuk jenis unit ini. Silakan melakukan deposit terlebih dahulu.
              </div>
            )}
          </div>

          <div className="flex-1 flex flex-col">
            <span className="text-xs text-slate-500 uppercase tracking-widest font-semibold block mb-2 px-1">Log Penawaran</span>
            <div className="space-y-2 flex-1 max-h-[300px] overflow-y-auto overscroll-contain pr-1 custom-scrollbar">
              {bidLogs.length === 0 ? (
                <div className="bg-slate-50 border border-dashed border-slate-300 p-6 rounded-xl flex flex-col items-center justify-center text-slate-400">
                  <span className="material-symbols-outlined text-3xl mb-1">history</span>
                  <p className="text-xs">Belum ada penawaran.</p>
                </div>
              ) : (
                bidLogs.map((log) => (
                  <div
                    key={log.id}
                    className={`flex justify-between items-center p-3 rounded-lg border shadow-sm ${
                      log.isMe ? "border-primary/30 bg-primary/5" : "border-slate-200 bg-white"
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

        <div className="w-full md:w-1/2 flex flex-col gap-4">
          <div className="bg-white rounded-xl border border-slate-200 flex-1 overflow-hidden">
            <div className="flex overflow-x-auto snap-x snap-mandatory w-full h-[220px] bg-slate-100 no-scrollbar">
              {assetImages.map((img: string, idx: number) => (
                <img
                  key={idx}
                  src={getImageUrl(img)}
                  alt={`${lot.asset?.title} - photo ${idx + 1}`}
                  className="object-cover w-full h-full flex-shrink-0 snap-center"
                />
              ))}
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
                  <span className="block text-[10px] text-slate-500 uppercase tracking-widest mb-0.5">Mesin (CC)</span>
                  <span className="font-medium text-slate-800">{lot.asset?.cylinder || "-"} CC</span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-500 uppercase tracking-widest mb-0.5">Warna</span>
                  <span className="font-medium text-slate-800">{lot.asset?.color || "-"}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-500 uppercase tracking-widest mb-0.5">Odometer (KM)</span>
                  <span className="font-medium text-slate-800">{lot.asset?.odometer || "-"}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-500 uppercase tracking-widest mb-0.5">BPKB</span>
                  <span className="font-medium text-slate-800">{lot.asset?.bpkb_status || "-"}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-500 uppercase tracking-widest mb-0.5">STNK</span>
                  <span className="font-medium text-slate-800">{lot.asset?.stnk_status || "-"}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-500 uppercase tracking-widest mb-0.5">Tanggal Pajak</span>
                  <span className="font-medium text-slate-800">{lot.asset?.stnk_tax_date ? new Date(lot.asset.stnk_tax_date).toLocaleDateString("id-ID") : "-"}</span>
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
    </div>

    {isSingleLot && hasNipl && (
      <div
        className="fixed bottom-16 inset-x-0 z-30 lg:hidden bg-white/95 glass-nav border-t border-outline-variant/20 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] px-4 py-3 flex justify-center items-center"
      >
        <button
          disabled={bidCooldown || timeLeft <= 0 || !isBidEnabled}
          onClick={() => handlePlaceBid(minIncrement)}
          className={`w-full py-5 text-xl font-black rounded-2xl transition-all shadow-md active:scale-95 ${
            bidCooldown || timeLeft <= 0 || !isBidEnabled
              ? "bg-slate-300 text-slate-500 cursor-not-allowed"
              : "bg-primary hover:bg-primary/95 text-white cursor-pointer"
          }`}
        >
          BID
        </button>
      </div>
    )}
    </>
  );
}

export default function BidderBiddingRoom() {
  const router = useRouter();
  const [activeLots, setActiveLots] = useState<any[]>([]);
  const [liveSessionId, setLiveSessionId] = useState<string | null>(null);
  const [frozenLot, setFrozenLot] = useState<any | null>(null);
  const [closedResult, setClosedResult] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [upcomingSessions, setUpcomingSessions] = useState<any[]>([]);
  
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
        // Fetch upcoming sessions if no active lots
        const resSessions = await apiFetch("/sessions?status=published");
        const sessData = await resSessions.json();
        if (resSessions.ok && sessData.success) {
          setUpcomingSessions(sessData.data);
        }
      }

      // Fetch LIVE session to keep socket alive even when transitioning through cancelled lots
      const resSession = await apiFetch("/sessions?status=live");
      const sessionData = await resSession.json();
      if (resSession.ok && sessionData.success && sessionData.data?.length > 0) {
        setLiveSessionId(sessionData.data[0].id);
      } else {
        setLiveSessionId(null);
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

  const handleLotClosed = (data?: any) => {
    if (data) {
      const storedUser = localStorage.getItem("user");
      const currentUserId = storedUser ? JSON.parse(storedUser).id : "";
      const myMaskedId = currentUserId ? `Peserta #${currentUserId.substring(0, 4).toUpperCase()}` : "";
      const isWinner = data.result === "sold" && data.winner_id === myMaskedId;
      setClosedResult({ ...data, isWinner });
      
      // Clear the modal after 10 seconds (or when next lot starts)
      setTimeout(() => {
        setClosedResult(null);
      }, 10000);
    }
    fetchActiveLots();
  };

  useEffect(() => {
    fetchActiveLots();

    const interval = setInterval(() => fetchActiveLots(true), 15000);
    return () => clearInterval(interval);
  }, []);

  // Central Socket Connection
  useEffect(() => {
    // If there's no active lot AND no live session, we don't need a socket yet
    if (activeLots.length === 0 && !liveSessionId) return;

    let cancelled = false;
    let localSocket: Socket | null = null;

    const connect = async () => {
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

      // Join session room to listen for lot:start (for cancelled lot freezing)
      if (liveSessionId) {
        localSocket.on("lot:start", (data: any) => {
          if (data.is_canceled) {
            setFrozenLot(data);
            setTimeout(() => {
              setFrozenLot(null);
              fetchActiveLots();
            }, (data.freeze_duration_secs || 5) * 1000);
          } else {
            // New active lot started, refresh
            fetchActiveLots();
          }
        });
      }
    };

    connect();

    return () => {
      cancelled = true;
      if (localSocket) {
        activeLots.forEach((lot) => {
          localSocket!.emit("bid:unwatch", { lot_id: lot.id });
        });
        localSocket.off("lot:start");
        localSocket.disconnect();
      }
      socketRef.current = null;
      setSocket(null);
    };
  }, [activeLots.map(l => l.id).join(","), liveSessionId]);

  if (loading) {
    return (
      <BidderLayout pageTitle="Ruang Lelang Live">
        <PageSkeleton />
      </BidderLayout>
    );
  }

  return (
    <BidderLayout pageTitle="Ruang Lelang Live">

      {frozenLot ? (
        <div className="card py-16 text-center flex flex-col items-center justify-center gap-4 relative overflow-hidden bg-slate-50 border-danger">
          <div className="absolute inset-0 z-0 flex items-center justify-center opacity-10">
            <span className="material-symbols-outlined text-[200px] text-danger">block</span>
          </div>
          <div className="z-10 relative">
            <span className="material-symbols-outlined text-6xl text-danger mb-2">cancel</span>
            <h2 className="text-3xl font-black text-slate-800 mb-2">LOT DIBATALKAN</h2>
            <p className="text-lg font-bold text-slate-700 mb-1">Lot #{frozenLot.lot_data?.lot_number} - {frozenLot.lot_data?.asset?.title}</p>
            <p className="text-sm text-slate-500 mb-6">Lot ini telah dibatalkan dan dilewati.</p>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 inline-block">
              <span className="block text-xs uppercase font-bold text-slate-400 mb-1">Lanjut otomatis dalam</span>
              <div className="text-3xl font-black text-primary animate-pulse">{frozenLot.freeze_duration_secs} detik</div>
            </div>
          </div>
        </div>
      ) : activeLots.length > 0 ? (
        <div className="space-y-8">
          {activeLots.map((lot) => (
            <ActiveLotCard
              key={lot.id}
              lot={lot}
              token={localStorage.getItem("accessToken") || ""}
              bidIncrements={bidIncrements}
              socket={socket}
              onLotClosed={handleLotClosed}
              isSingleLot={activeLots.length === 1}
            />
          ))}
        </div>
      ) : (
        <div className="card py-16 text-center flex flex-col items-center justify-center gap-4">
          <span className="material-symbols-outlined text-6xl text-primary animate-bounce">gavel</span>
          <span className="text-xl font-bold text-slate-700">Belum ada lot lelang aktif saat ini</span>
          <p className="text-sm text-slate-500 max-w-md">
            Ikuti jadwal sesi berikutnya.
          </p>
          
          {upcomingSessions.length > 0 && (
            <div className="mt-8 w-full max-w-md text-left">
              <h4 className="font-bold text-slate-800 mb-3 border-b pb-2">Jadwal Lelang Berikutnya</h4>
              <div className="space-y-3">
                {upcomingSessions.map(session => (
                  <div key={session.id} className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex items-center gap-3">
                    <div className="bg-primary/10 text-primary p-2 rounded-lg">
                      <span className="material-symbols-outlined">event</span>
                    </div>
                    <div>
                      <h5 className="font-bold text-sm text-slate-800">{session.name}</h5>
                      <p className="text-xs text-slate-500">{new Date(session.scheduled_at || session.start_time).toLocaleString("id-ID")}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {upcomingSessions.length === 0 && (
            <div className="mt-8 w-full max-w-md text-left">
              <h4 className="font-bold text-slate-800 mb-3 border-b pb-2">Jadwal Lelang Berikutnya</h4>
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-center text-sm text-slate-500">
                Silakan periksa halaman <Link href="/katalog" className="text-primary font-bold underline">Katalog</Link> untuk melihat jadwal lelang yang akan datang.
              </div>
            </div>
          )}
        </div>
      )}
      
      {closedResult && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-2xl animate-in zoom-in duration-300">
            {closedResult.isWinner ? (
              <>
                <div className="text-8xl mb-4">🙏🏻</div>
                <h2 className="text-2xl font-black text-green-600 mb-2">Selamat Anda Memenangkan Lot {closedResult.lot_number}!</h2>
                <p className="text-slate-600 mb-6">Silahkan melunasi melalui halaman Keranjang Tagihan.</p>
                
                <div className="bg-slate-50 p-4 rounded-xl text-left mb-6 space-y-2 border border-slate-100">
                  <div className="flex justify-between">
                    <span className="text-slate-500 text-sm">Harga Dasar</span>
                    <span className="font-medium">{new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(closedResult.starting_price))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 text-sm">Harga Terbentuk</span>
                    <span className="font-black text-primary">{new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(closedResult.final_price))}</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setClosedResult(null)} className="flex-1 py-3 px-4 rounded-xl font-bold border-2 border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">
                    Lanjut Lelang
                  </button>
                  <Link href="/bidder/cart" className="flex-1 py-3 px-4 rounded-xl font-bold bg-primary text-white hover:bg-primary/90 transition-colors">
                    Lunasi
                  </Link>
                </div>
              </>
            ) : (
              <>
                <div className="text-8xl mb-4">👑</div>
                <h2 className="text-2xl font-black text-slate-800 mb-2">Maaf Anda Belum Memenangkan Lot Ini</h2>
                <p className="text-slate-600 mb-6">Jangan menyerah, masih banyak kesempatan di lot berikutnya!</p>
                
                <div className="bg-slate-50 p-4 rounded-xl text-left mb-6 space-y-2 border border-slate-100">
                  <div className="flex justify-between">
                    <span className="text-slate-500 text-sm">No Lot</span>
                    <span className="font-medium">Lot {closedResult.lot_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 text-sm">Harga Dasar</span>
                    <span className="font-medium">{new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(closedResult.starting_price))}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-2 mt-2">
                    <span className="text-slate-500 text-sm">Harga Terbentuk</span>
                    <span className="font-black">{new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(closedResult.final_price))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 text-sm">Pemenang</span>
                    <span className="font-medium">{closedResult.result === "sold" ? closedResult.winner_id : "No Bidder"}</span>
                  </div>
                </div>

                <button onClick={() => setClosedResult(null)} className="w-full py-3 px-4 rounded-xl font-bold bg-primary text-white hover:bg-primary/90 transition-colors">
                  Lanjut Lelang Berikutnya
                </button>
              </>
            )}
          </div>
        </div>
      )}

    </BidderLayout>
  );
}
