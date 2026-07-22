"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
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

function buildAuctionFallbackImage(label: string, accent: string, background: string) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
      <rect width="1200" height="800" rx="36" fill="${background}" />
      <rect x="60" y="60" width="1080" height="680" rx="28" fill="white" opacity="0.92" />
      <rect x="100" y="120" width="320" height="220" rx="20" fill="${accent}" opacity="0.12" />
      <rect x="460" y="140" width="620" height="140" rx="20" fill="${accent}" opacity="0.12" />
      <rect x="460" y="320" width="620" height="220" rx="20" fill="${accent}" opacity="0.08" />
      <circle cx="920" cy="550" r="140" fill="${accent}" opacity="0.12" />
      <path d="M160 620h260" stroke="${accent}" stroke-width="22" stroke-linecap="round" />
      <path d="M460 620h340" stroke="#94a3b8" stroke-width="18" stroke-linecap="round" />
      <path d="M840 620h180" stroke="#94a3b8" stroke-width="18" stroke-linecap="round" />
      <text x="100" y="710" fill="#0f172a" font-family="Arial, sans-serif" font-size="42" font-weight="700">${label}</text>
    </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function getDisplayAssetImages(lot: any) {
  const explicitImages = getAssetImages(lot.asset);
  if (explicitImages.length > 0) return explicitImages;

  const title = lot.asset?.title || "Lot Lelang";
  const category = lot.asset?.category || "Kendaraan";

  return [
    buildAuctionFallbackImage(title, "#f67904", "#fff7ed"),
    buildAuctionFallbackImage(`${category} • Detail Unit`, "#0f172a", "#f8fafc"),
    buildAuctionFallbackImage("Foto Dokumentasi Lelang", "#178630", "#f0fdf4"),
  ];
}

// Sub-component to manage a single active lot
function ActiveLotCard({ lot, token, bidIncrement, socket, isConnected, onLotClosed, isSingleLot }: {
  lot: any;
  token: string;
  bidIncrement: number;
  socket: Socket | null;
  isConnected: boolean;
  onLotClosed: (data?: any, hasBidded?: boolean) => void;
  isSingleLot: boolean;
}) {
  const toast = useToast();
  const [currentPrice, setCurrentPrice] = useState<number>(Number(lot.starting_price));
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [hasNipl, setHasNipl] = useState<boolean>(true);
  const [bidLogs, setBidLogs] = useState<BidLog[]>([]);
  const [hasUserBidded, setHasUserBidded] = useState(false);
  const [bidCooldown, setBidCooldown] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isBidEnabled, setIsBidEnabled] = useState<boolean>(false);
  const [startCountdown, setStartCountdown] = useState<number | null>(3);
  const [currentImageIdx, setCurrentImageIdx] = useState<number>(0);
  const [isCancelledOverlay, setIsCancelledOverlay] = useState(false);
  const [cancelCountdown, setCancelCountdown] = useState(5);
  const cancelIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  
  const displayImages = getDisplayAssetImages(lot);

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

  const fetchBidLogs = useCallback(async () => {
    try {
      const response = await apiFetch(`/lots/${lot.id}/bids`);
      const data = await response.json();
      if (response.ok && data.success) {
        const storedUser = localStorage.getItem("user");
        const currentUserId = storedUser ? JSON.parse(storedUser).id : "";
        const myMaskedId = currentUserId ? `Peserta #${currentUserId.substring(0, 4).toUpperCase()}` : "";

        const formatted = data.data.map((bid: any) => ({
          id: bid.id,
          bidder: bid.bidder_id,
          amount: bid.amount,
          time: new Date(bid.created_at).toLocaleTimeString('id-ID'),
          isMe: !!bid.bidder_id && bid.bidder_id === myMaskedId,
        }));
        if (formatted.some((bid: any) => bid.isMe)) {
          setHasUserBidded(true);
        }
        setBidLogs(formatted);
      }
    } catch (err) {
      console.error('Failed to fetch bid logs:', err);
    }
  }, [lot.id]);

  useEffect(() => {
    fetchBidLogs();
  }, [fetchBidLogs]);

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

        if (isMe) {
          setHasUserBidded(true);
          if ("vibrate" in navigator) navigator.vibrate([20, 40, 20]);
        }

        const newLog: BidLog = {
          id: Math.random().toString(),
          bidder: data.bidder_id,
          amount: data.current_price,
          time: data.created_at
            ? new Date(data.created_at).toLocaleTimeString("id-ID")
            : new Date().toLocaleTimeString("id-ID"),
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
        onLotClosed(data, hasUserBidded || bidLogs.some((b) => b.isMe));
      }
    };

    const handleLotCancelled = (data: any) => {
      if (data.lot_id === lot.id || !data.lot_id) {
        setIsCancelledOverlay(true);
        setCancelCountdown(5);
        let count = 5;
        if (cancelIntervalRef.current) clearInterval(cancelIntervalRef.current);
        cancelIntervalRef.current = setInterval(() => {
          count--;
          setCancelCountdown(count);
          if (count <= 0) {
            if (cancelIntervalRef.current) clearInterval(cancelIntervalRef.current);
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
      if (cancelIntervalRef.current) {
        clearInterval(cancelIntervalRef.current);
      }
      socket.off("lot:sync", handleLotSync);
      socket.off("bid:update", handleBidUpdate);
      socket.off("bid:error", handleBidError);
      socket.off("lot:closed", handleLotClosed);
      socket.off("lot:cancelled", handleLotCancelled);
      socket.off("lot:start", handleLotStartCountdown);
    };
  }, [socket, lot.id, onLotClosed, playBeep]);

  const handlePlaceBid = (incrementAmount: number) => {
    // While disconnected the price on screen is whatever arrived last, so a bid
    // built on top of it would be based on a stale number.
    if (!socket || !isConnected || bidCooldown) return;
    setHasUserBidded(true);
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

  const minIncrement = bidIncrement;

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

      {!isConnected && (
        <div className="alert-box danger mb-4 flex items-center gap-2 transition-all mx-5 mt-4">
          <span className="material-symbols-outlined animate-pulse">wifi_off</span>
          <span>
            Koneksi terputus — harga di layar mungkin sudah tidak terbaru. Penawaran dinonaktifkan sampai
            tersambung kembali.
          </span>
        </div>
      )}

      {errorMessage && (
        <div className="alert-box danger mb-4 flex items-center gap-2 transition-all mx-5 mt-4">
          <span className="material-symbols-outlined">error</span>
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="p-4 flex flex-col md:flex-row gap-6">

        <div className="w-full md:w-1/2 flex flex-col gap-6 min-w-0">
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 min-w-0">
            <div className="space-y-4">
              <div className="min-w-0">
                <span className="text-xs text-slate-500 uppercase tracking-widest font-semibold block mb-1">Harga Tertinggi Saat Ini</span>
                <div className={`text-2xl sm:text-4xl font-black flex flex-wrap items-center gap-2 min-w-0 break-words ${bidLogs[0]?.isMe ? 'text-green-600' : 'text-primary'}`}>
                  {formatRupiah(currentPrice)}
                  {bidLogs[0]?.isMe && <span className="material-symbols-outlined text-3xl sm:text-4xl text-amber-500 flex-shrink-0" title="Anda penawar tertinggi!">emoji_events</span>}
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
                  disabled={bidCooldown || timeLeft <= 0 || !isBidEnabled || !isConnected}
                  onClick={() => handlePlaceBid(minIncrement)}
                  className={`w-full py-4 px-4 text-sm font-black rounded-xl transition-all shadow-md active:scale-95 ${
                    isSingleLot ? "hidden lg:block" : ""
                  } ${
                    bidCooldown || timeLeft <= 0 || !isBidEnabled || !isConnected
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
          <div className="bg-white rounded-3xl border border-slate-200 flex-1 overflow-hidden shadow-sm">
            <div className="relative h-[280px] bg-slate-900">
              <img
                src={getImageUrl(displayImages[currentImageIdx])}
                alt={`${lot.asset?.title} - foto utama`}
                className="object-cover w-full h-full"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-900/20 to-transparent" />
              <div className="absolute top-4 left-4 rounded-full bg-primary px-3 py-1 text-[10px] uppercase tracking-[0.25em] font-black text-white shadow-lg">
                Live Room
              </div>
              <div className="absolute top-4 right-4 rounded-full bg-white/90 px-3 py-1 text-[10px] uppercase tracking-[0.25em] font-black text-slate-800 shadow-lg">
                Penawaran Aktif
              </div>
              <div className="absolute bottom-4 left-4 right-4">
                <div className="text-[10px] uppercase tracking-[0.28em] text-slate-200">Unit yang dilelang</div>
                <div className="text-xl font-black text-white mt-1">{lot.asset?.title || "Lot Lelang"}</div>
              </div>
            </div>

            {displayImages.length > 1 && (
              <div className="flex gap-2 px-4 pt-4">
                {displayImages.map((img: string, idx: number) => (
                  <button
                    key={`${img}-${idx}`}
                    type="button"
                    onClick={() => setCurrentImageIdx(idx)}
                    className={`h-16 w-24 overflow-hidden rounded-xl border ${currentImageIdx === idx ? "border-primary" : "border-slate-200"}`}
                  >
                    <img src={getImageUrl(img)} alt={`Foto ${idx + 1}`} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
            
            <div className="p-4">
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <div className="text-[10px] uppercase tracking-[0.25em] text-slate-500">Penawar Aktif</div>
                  <div className="text-lg font-black text-slate-900 mt-1">{Math.max(3, Math.min(12, bidLogs.length + 4))}</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <div className="text-[10px] uppercase tracking-[0.25em] text-slate-500">Status</div>
                  <div className="text-lg font-black text-primary mt-1">Live</div>
                </div>
              </div>

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
                  <span className="block text-[10px] text-slate-500 uppercase tracking-widest mb-0.5">No BPKB</span>
                  <span className="font-medium text-slate-800">{lot.asset?.bpkb_number || "-"}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-500 uppercase tracking-widest mb-0.5">Masa Berlaku STNK</span>
                  <span className="font-medium text-slate-800">{lot.asset?.stnk_date ? new Date(lot.asset.stnk_date).toLocaleDateString("id-ID") : "-"}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-500 uppercase tracking-widest mb-0.5">Masa Berlaku Pajak</span>
                  <span className="font-medium text-slate-800">{lot.asset?.stnk_tax_date ? new Date(lot.asset.stnk_tax_date).toLocaleDateString("id-ID") : "-"}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-500 uppercase tracking-widest mb-0.5">Masa Berlaku KIR/KEUR</span>
                  <span className="font-medium text-slate-800">{lot.asset?.keur_date ? new Date(lot.asset.keur_date).toLocaleDateString("id-ID") : "-"}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-500 uppercase tracking-widest mb-0.5">Lokasi</span>
                  <span className="font-medium text-slate-800">{lot.asset?.location || "-"}</span>
                </div>
              </div>

              {lot.asset?.description && (
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <span className="block text-[10px] text-slate-500 uppercase tracking-widest mb-1">CATATAN TAMBAHAN</span>
                  <span className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">{lot.asset.description}</span>
                </div>
              )}
            
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
          disabled={bidCooldown || timeLeft <= 0 || !isBidEnabled || !isConnected}
          onClick={() => handlePlaceBid(minIncrement)}
          className={`w-full py-5 text-xl font-black rounded-2xl transition-all shadow-md active:scale-95 ${
            bidCooldown || timeLeft <= 0 || !isBidEnabled || !isConnected
              ? "bg-slate-300 text-slate-500 cursor-not-allowed"
              : "bg-primary hover:bg-primary/95 text-white cursor-pointer"
          }`}
        >
          {isConnected ? "BID" : "TERPUTUS"}
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
  const [frozenCountdown, setFrozenCountdown] = useState<number>(5);
  const frozenTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [closedResult, setClosedResult] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [upcomingSessions, setUpcomingSessions] = useState<any[]>([]);
  
  // Settings for bidding
  const [bidIncrement, setBidIncrement] = useState<number>(500000);
  const socketRef = useRef<Socket | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Thank You Modal state for Session End
  interface ThankYouModalData {
    session_title: string;
  }
  const [thankYouModal, setThankYouModal] = useState<ThankYouModalData | null>(null);
  const [thankYouSecondsLeft, setThankYouSecondsLeft] = useState<number>(5);
  const [hasSessionBidded, setHasSessionBidded] = useState<boolean>(false);
  const [liveSessionName, setLiveSessionName] = useState<string>("");

  useEffect(() => {
    if (!thankYouModal) return;
    setThankYouSecondsLeft(5);
    const interval = setInterval(() => {
      setThankYouSecondsLeft((prev) => {
        if (prev <= 1) {
          setThankYouModal(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [thankYouModal]);

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
        setLiveSessionName(sessionData.data[0].title || sessionData.data[0].name || "");
      } else {
        setLiveSessionId(null);
      }

      // Fetch settings for bid increments
      try {
        const resSettings = await fetch(apiUrl("/settings/public"));
        const setgData = await resSettings.json();
        if (resSettings.ok && setgData.success) {
          let b1 = 500000;
          setgData.data.forEach((item: any) => {
            if (item.key === 'bid_increment_1') b1 = Number(item.value);
          });
          setBidIncrement(b1);
        }
      } catch (e) {}
    } catch (err) {
      console.error("Failed to load active lots", err);
    } finally {
      if (!isPolling) setLoading(false);
    }
  };

  const handleLotClosed = (data?: any, hasBidded: boolean = false) => {
    if (hasBidded) {
      setHasSessionBidded(true);
      if (typeof window !== "undefined") {
        sessionStorage.setItem("has_bidded_in_session", "true");
      }
    }

    if (data) {
      const storedUser = localStorage.getItem("user");
      const currentUserId = storedUser ? JSON.parse(storedUser).id : "";
      const myMaskedId = currentUserId ? `Peserta #${currentUserId.substring(0, 4).toUpperCase()}` : "";
      const isWinner = data.result === "sold" && data.winner_id === myMaskedId;

      // Hanya tampilkan popup hasil jika bidder memenangkan lot ATAU pernah melakukan bid pada lot tersebut
      if (isWinner || hasBidded) {
        setClosedResult({ ...data, isWinner });
        
        // Clear the modal after 10 seconds (or when next lot starts)
        setTimeout(() => {
          setClosedResult(null);
        }, 10000);
      } else {
        setClosedResult(null);
      }

      // Tampilkan ucapan terima kasih jika ini lot terakhir dalam sesi dan bidder pernah melakukan bid
      const biddedInSession = hasBidded || hasSessionBidded || (typeof window !== "undefined" && sessionStorage.getItem("has_bidded_in_session") === "true");
      if (data.is_last_lot && biddedInSession) {
        setThankYouModal({
          session_title: data.session_title || liveSessionName || "Sesi Lelang Live",
        });
      }
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

    // A callback (rather than a plain object) is re-invoked before every
    // connection attempt, so a reconnect after a long background never
    // handshakes with an access token that expired in the meantime.
    const localSocket: Socket = io(wsBaseUrl(), {
      auth: async (cb: (data: object) => void) => {
        const token = (await refreshAccessToken()) || localStorage.getItem("accessToken") || "";
        cb({ token });
      },
      transports: ["websocket"],
    });
    socketRef.current = localSocket;
    setSocket(localSocket);

    // Room membership lives on the socket connection: the server only puts us in
    // `lot:{id}` when it receives bid:watch, and bid:update is broadcast to that
    // room. A reconnect (screen off, WiFi/cellular switch, flaky signal) creates
    // a brand-new connection, so this MUST run on every connect — otherwise the
    // client silently stops receiving price updates while the screen still looks
    // live. The server answers bid:watch with the current price, which also
    // resyncs whatever was missed while we were away.
    const handleConnect = () => {
      setIsConnected(true);
      activeLots.forEach((lot) => {
        localSocket.emit("bid:watch", {
          lot_id: lot.id,
          session_id: lot.session_id,
        });
      });
      if (liveSessionId) {
        localSocket.emit("bid:watch", { session_id: liveSessionId });
      }
    };

    const handleDisconnect = () => setIsConnected(false);

    // Join session room to listen for lot:start (for cancelled lot freezing)
    const handleLotStart = (data: any) => {
      if (data.is_canceled) {
        setFrozenLot(data);
        const duration = data.freeze_duration_secs || 5;
        setFrozenCountdown(duration);
        
        if (frozenTimerRef.current) clearInterval(frozenTimerRef.current);
        
        let counter = duration;
        frozenTimerRef.current = setInterval(() => {
          counter--;
          setFrozenCountdown(counter);
          if (counter <= 0) {
            if (frozenTimerRef.current) clearInterval(frozenTimerRef.current);
            setFrozenLot(null);
            fetchActiveLots();
          }
        }, 1000);
      } else {
        // New active lot started, immediately clear any overlays and refresh
        if (frozenTimerRef.current) {
          clearInterval(frozenTimerRef.current);
        }
        setFrozenLot(null);
        setClosedResult(null);
        fetchActiveLots();
      }
    };

    const handleParentLotCancelled = (data: any) => {
      const cancelledLot = activeLots.find((l) => l.id === data.lot_id);
      if (cancelledLot) {
        setFrozenLot({
          lot_data: cancelledLot,
        });
        setFrozenCountdown(5);
        
        if (frozenTimerRef.current) clearInterval(frozenTimerRef.current);
        
        let counter = 5;
        frozenTimerRef.current = setInterval(() => {
          counter--;
          setFrozenCountdown(counter);
          if (counter <= 0) {
            if (frozenTimerRef.current) clearInterval(frozenTimerRef.current);
            setFrozenLot(null);
            fetchActiveLots();
          }
        }, 1000);
      }
    };

    const handleSessionEnded = (data: any) => {
      const biddedInSession = hasSessionBidded || (typeof window !== "undefined" && sessionStorage.getItem("has_bidded_in_session") === "true");
      if (biddedInSession) {
        setThankYouModal({
          session_title: data?.session_title || liveSessionName || "Sesi Lelang Live",
        });
      }
    };

    localSocket.on("connect", handleConnect);
    localSocket.on("disconnect", handleDisconnect);
    if (liveSessionId) {
      localSocket.on("lot:start", handleLotStart);
      localSocket.on("lot:cancelled", handleParentLotCancelled);
      localSocket.on("session:ended", handleSessionEnded);
    }

    // Android tears down sockets aggressively once the PWA is backgrounded, and
    // the client may not notice until it is resumed. Reconnect on the spot
    // instead of waiting out the backoff.
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && !localSocket.connected) {
        localSocket.connect();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (frozenTimerRef.current) {
        clearInterval(frozenTimerRef.current);
      }
      if (localSocket.connected) {
        activeLots.forEach((lot) => {
          localSocket.emit("bid:unwatch", { lot_id: lot.id });
        });
      }
      localSocket.off("connect", handleConnect);
      localSocket.off("disconnect", handleDisconnect);
      localSocket.off("lot:start", handleLotStart);
      localSocket.off("lot:cancelled", handleParentLotCancelled);
      localSocket.off("session:ended", handleSessionEnded);
      localSocket.disconnect();
      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
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
              <div className="text-3xl font-black text-primary animate-pulse">{frozenCountdown} detik</div>
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
              bidIncrement={bidIncrement}
              socket={socket}
              isConnected={isConnected}
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

      {thankYouModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/85 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full text-center shadow-2xl border-2 border-primary/20 relative overflow-hidden">
            <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
              <span className="material-symbols-outlined text-4xl">celebration</span>
            </div>

            <h2 className="text-2xl font-black text-slate-800 mb-4">Lelang Telah Selesai 🎉</h2>

            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 mb-6 text-left space-y-3 shadow-inner">
              <p className="text-sm font-bold text-primary">
                Terimakasih atas partisipasinya dalam Lelang {thankYouModal.session_title}.
              </p>
              <p className="text-sm text-slate-700">
                Selamat kepada peserta yang berhasil memenangkan lelang.
              </p>
              <p className="text-sm text-slate-700">
                Mohon maaf kepada peserta yang belum memenangkan lelang.
              </p>
              <p className="text-sm font-medium text-slate-800 pt-2 border-t border-slate-200">
                Sampai bertemu kembali di lelang berikutnya.
              </p>
            </div>

            <div className="space-y-3">
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-1000 linear"
                  style={{ width: `${(thankYouSecondsLeft / 5) * 100}%` }}
                />
              </div>
              <p className="text-xs text-slate-400">
                Pesan tertutup otomatis dalam <strong className="text-slate-700">{thankYouSecondsLeft} detik</strong>
              </p>
              <button
                onClick={() => setThankYouModal(null)}
                className="w-full py-3 px-4 rounded-xl font-bold bg-slate-800 text-white hover:bg-slate-900 transition-colors text-sm"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

    </BidderLayout>
  );
}
