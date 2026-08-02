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
  // Berapa peserta yang mengirim angka ini. Lebih dari satu berarti harga
  // tersebut diperebutkan dan yang lain kalah cepat — ditampilkan supaya
  // penolakan tadi terbaca sebagai persaingan, bukan kerusakan sistem.
  contenders?: number;
}

// Static preview data for `?simulate=1` — lets redesign work on this page be
// checked visually without a real live session, sockets, or bid history.
const SIMULATE_LOT = {
  id: "sim-lot-1",
  session_id: "sim-session-1",
  lot_number: "07",
  starting_price: 145000000,
  asset: {
    title: "Toyota Avanza 1.3 G M/T 2021",
    category: "mobil",
    brand: "Toyota",
    type: "Avanza 1.3 G M/T",
    year: "2021",
    cylinder: "1329",
    color: "Putih",
    odometer: "42.300",
    bpkb_number: "L-08812934",
    stnk_date: "2026-11-14",
    stnk_tax_date: "2026-11-14",
    keur_date: null,
    location: "Jakarta Timur",
    description: "Kondisi mesin sehat, service record lengkap, ban baru diganti 4 bulan lalu.",
    images: null,
  },
};

const SIMULATE_BID_LOGS: BidLog[] = [
  { id: "sim-1", bidder: "Peserta #A1B2", amount: 160210500, time: "15:20:41", isMe: true },
  { id: "sim-2", bidder: "Peserta #C3D4", amount: 158000000, time: "15:20:12" },
  { id: "sim-3", bidder: "Peserta #E5F6", amount: 155500000, time: "15:19:40" },
  { id: "sim-4", bidder: "Peserta #A1B2", amount: 152000000, time: "15:19:05" },
  { id: "sim-5", bidder: "Peserta #G7H8", amount: 149000000, time: "15:18:22" },
];

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
function ActiveLotCard({
  lot,
  token,
  bidIncrement,
  socket,
  isConnected,
  isStalled,
  onLotClosed,
  isSingleLot,
  isCancelledOverride,
  cancelCountdownOverride,
  initialTimeLeft,
  initialStartCountdown,
  initialBidLogs,
}: {
  lot: any;
  token: string;
  bidIncrement: number;
  socket: Socket | null;
  isConnected: boolean;
  // Socket is up but the per-second countdown has gone quiet — the room
  // subscription was lost and is being repaired. The screen is stale, so say so
  // rather than letting the bidder trust a frozen clock.
  isStalled?: boolean;
  onLotClosed: (data?: any, hasBidded?: boolean) => void;
  isSingleLot: boolean;
  isCancelledOverride?: boolean;
  cancelCountdownOverride?: number;
  // Static-preview overrides (see `?simulate=1`) — skip the "get ready"
  // countdown/sound and seed a non-zero timer + bid log so the page reads as
  // a live lot instead of an empty just-mounted one.
  initialTimeLeft?: number;
  initialStartCountdown?: number | null;
  initialBidLogs?: BidLog[];
}) {
  const toast = useToast();
  const [currentPrice, setCurrentPrice] = useState<number>(
    initialBidLogs?.[0]?.amount ?? Number(lot.starting_price)
  );
  const [timeLeft, setTimeLeft] = useState<number>(initialTimeLeft ?? 0);
  const [hasNipl, setHasNipl] = useState<boolean>(true);
  const [bidLogs, setBidLogs] = useState<BidLog[]>(initialBidLogs ?? []);
  const [onlineCount, setOnlineCount] = useState<number>(initialBidLogs ? 9 : 1);
  const [hasUserBidded, setHasUserBidded] = useState(false);
  const [bidCooldown, setBidCooldown] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isBidEnabled, setIsBidEnabled] = useState<boolean>(false);
  const [startCountdown, setStartCountdown] = useState<number | null>(
    initialStartCountdown !== undefined ? initialStartCountdown : 3
  );
  const [currentImageIdx, setCurrentImageIdx] = useState<number>(0);
  const [isCancelledOverlay, setIsCancelledOverlay] = useState(false);
  const [cancelCountdown, setCancelCountdown] = useState(5);
  const cancelIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const errorTimerRef = useRef<NodeJS.Timeout | null>(null);
  const bidTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Membuka kembali tombol BID begitu server menjawab — diterima maupun
  // ditolak. Dipanggil dari kedua penangan supaya tidak ada jalur yang
  // meninggalkan tombol terkunci.
  const releaseBidLock = useCallback(() => {
    if (bidTimeoutRef.current) {
      clearTimeout(bidTimeoutRef.current);
      bidTimeoutRef.current = null;
    }
    setBidCooldown(false);
  }, []);

  // Bid rejections are transient. Left on screen they read as an unresolved
  // fault ("Anda sudah memegang penawaran tertinggi" stayed up for the rest of
  // the lot), so every message clears itself and is also cleared by the next
  // price update.
  const clearBidError = useCallback(() => {
    if (errorTimerRef.current) {
      clearTimeout(errorTimerRef.current);
      errorTimerRef.current = null;
    }
    setErrorMessage("");
  }, []);

  const showBidError = useCallback((message: string) => {
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    setErrorMessage(message);
    errorTimerRef.current = setTimeout(() => {
      setErrorMessage("");
      errorTimerRef.current = null;
    }, 5000);
  }, []);

  useEffect(() => () => {
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    if (bidTimeoutRef.current) clearTimeout(bidTimeoutRef.current);
  }, []);


  const displayImages = getDisplayAssetImages(lot);

  const playBeep = () => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.1);
    } catch (e) {}
  };

  const playBoxingBell = () => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      
      const playSingleRing = (startTime: number) => {
        const fundamental = 587.33; // D5 note
        const ratios = [1, 1.2, 1.5, 2.0, 2.5, 3.0, 4.2];
        
        ratios.forEach((ratio) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          
          osc.type = "sine";
          osc.frequency.value = fundamental * ratio;
          
          gain.gain.setValueAtTime(0.15 / ratios.length, startTime);
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + 1.2);
          
          osc.connect(gain);
          gain.connect(ctx.destination);
          
          osc.start(startTime);
          osc.stop(startTime + 1.3);
        });
      };

      const now = ctx.currentTime;
      playSingleRing(now);
      playSingleRing(now + 0.25);
      playSingleRing(now + 0.5);
    } catch (e) {
      console.error("Failed to play boxing bell", e);
    }
  };

  useEffect(() => {
    if (startCountdown === null) return;
    
    // Play sound based on count
    if (startCountdown === 3) {
      playBoxingBell();
    } else if (startCountdown > 0) {
      playBeep();
    }
    
    if (startCountdown > 0) {
      const timer = setTimeout(() => {
        setStartCountdown((prev) => {
          if (prev === null) return null;
          const next = prev - 1;
          if (next === 0) {
            playBoxingBell(); // Play final bell when it hits 0!
            return null; // close the overlay
          }
          return next;
        });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [startCountdown]);

  // A static preview lot has no real backend counterpart — skip every
  // authenticated sub-fetch below instead of letting them 401.
  const isMockLot = initialBidLogs !== undefined;

  // Check NIPL
  useEffect(() => {
    if (isMockLot) return;
    const fetchNipl = async () => {
      try {
        const resDeposits = await apiFetch("/deposits");
        const resDepData = await resDeposits.json();
        if (resDeposits.ok && resDepData.success) {
          const list = resDepData.data || [];
          
          // Map category to unit type (motor/mobil)
          const lotCategory = lot.asset?.category?.toLowerCase() || "";
          const lotUnitType = lotCategory.includes("motor") ? "motor" : "mobil";

          // Harus mengikuti aturan yang sama dengan validateBid di server, yang
          // menerima deposit dengan unit_type cocok ATAU unit_type kosong
          // (deposit umum, tidak dikhususkan untuk motor/mobil).
          //
          // Sebelumnya di sini dipakai kecocokan persis. Peserta yang memegang
          // deposit umum yang sah tidak melihat tombol BID sama sekali — bukan
          // pesan penolakan, tombolnya memang tidak dirender — padahal server
          // akan menerima penawarannya. Dari sisi peserta itu terlihat seperti
          // sistem yang rusak.
          const activeNipl = list.some(
            (d: any) =>
              d.status === "paid" &&
              (d.unit_type === lotUnitType || d.unit_type == null || d.unit_type === "")
          );
          setHasNipl(activeNipl);
        }
      } catch(e) {}
    };
    fetchNipl();
  }, [lot.asset?.category, token]);

  const fetchBidLogs = useCallback(async () => {
    if (isMockLot) return;
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
  }, [lot.id, isMockLot]);

  useEffect(() => {
    fetchBidLogs();
  }, [fetchBidLogs]);

  useEffect(() => {
    if (!socket) return;

    const handleBidUpdate = (data: any) => {
      if (data.lot_id !== lot.id) return;
      setCurrentPrice(data.current_price);
      setTimeLeft(data.time_remaining);

      // A rejection message describes one attempt, not a lasting state. Once
      // the lot has moved on — someone bid, or the clock simply ticked — the
      // old complaint is stale and must not keep sitting on screen implying
      // something is still wrong.
      clearBidError();

      // Harga terbaru sudah di tangan, jadi penawaran berikutnya bisa dihitung
      // dari angka yang benar. Tidak ada alasan menahan tombol lebih lama.
      releaseBidLock();

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
      if (data.lot_id && data.lot_id !== lot.id) return;
      // Kalah cepat bukan kesalahan peserta. Buka tombolnya saat itu juga
      // supaya mereka bisa langsung menawar ulang di harga terbaru.
      releaseBidLock();
      showBidError(data.message);
      toast.error(data.message);
    };

    // Server memberi tahu berapa orang yang memperebutkan harga tertinggi saat
    // ini. Ditempelkan ke baris teratas log penawaran.
    const handleBidContested = (data: any) => {
      if (data.lot_id !== lot.id) return;
      setBidLogs((prev) => {
        if (prev.length === 0) return prev;
        if (Number(prev[0].amount) !== Number(data.price)) return prev;
        const [teratas, ...sisanya] = prev;
        return [{ ...teratas, contenders: data.contenders }, ...sisanya];
      });
    };

    const handleLotSync = (data: any) => {
      if (data.lot_id !== lot.id) return;
      setCurrentPrice(data.current_price);
      setTimeLeft(data.time_remaining);
    };

    const handleLotClosed = (data: any) => {
      if (data.lot_id === lot.id) {
        setStartCountdown(null);
        onLotClosed({
          ...data,
          lot_number: lot.lot_number,
          starting_price: lot.starting_price,
          asset_title: lot.asset?.title,
        }, hasUserBidded || bidLogs.some((b) => b.isMe));
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
            setIsCancelledOverlay(false);
            onLotClosed({ ...data, result: 'cancelled' });
          }
        }, 1000);
      }
    };

    const handleLotStartCountdown = (data: any) => {
      if (data.lot_id === lot.id && data.duration_secs) {
        setStartCountdown(data.duration_secs);
      }
    };

    // Count of bidders with this lot open right now — server tracks it as
    // the size of the `lot:{id}` socket room (see broadcastLotPresence in
    // apps/api/src/lib/socket.ts) and pushes updates on join/leave.
    const handleLotPresence = (data: any) => {
      if (data.lot_id !== lot.id) return;
      setOnlineCount(data.count);
    };

    socket.on("lot:sync", handleLotSync);
    socket.on("bid:update", handleBidUpdate);
    socket.on("bid:contested", handleBidContested);
    socket.on("bid:error", handleBidError);
    socket.on("lot:closed", handleLotClosed);
    socket.on("lot:cancelled", handleLotCancelled);
    socket.on("lot:start", handleLotStartCountdown);
    socket.on("lot:presence", handleLotPresence);

    return () => {
      if (cancelIntervalRef.current) {
        clearInterval(cancelIntervalRef.current);
      }
      socket.off("lot:sync", handleLotSync);
      socket.off("bid:update", handleBidUpdate);
      socket.off("bid:contested", handleBidContested);
      socket.off("bid:error", handleBidError);
      socket.off("lot:closed", handleLotClosed);
      socket.off("lot:cancelled", handleLotCancelled);
      socket.off("lot:start", handleLotStartCountdown);
      socket.off("lot:presence", handleLotPresence);
    };
  }, [socket, lot.id, onLotClosed, playBeep, showBidError, clearBidError, releaseBidLock]);

  const handlePlaceBid = (incrementAmount: number) => {
    // While disconnected the price on screen is whatever arrived last, so a bid
    // built on top of it would be based on a stale number.
    //
    // `isStalled` matters just as much: the socket can still believe it is
    // connected while no longer receiving anything (a dropped network takes
    // socket.io seconds to notice, and a lost room subscription it never
    // notices at all). Bidding on that screen sends a number built on a price
    // and a clock that have both stopped being true.
    if (!socket || !isConnected || isStalled || bidCooldown) return;
    setHasUserBidded(true);
    if ("vibrate" in navigator) navigator.vibrate(15);

    // Tombol dikunci hanya selama penawaran ini menunggu jawaban server, BUKAN
    // selama waktu tetap.
    //
    // Di detik-detik terakhir puluhan orang menekan BID pada harga yang sama.
    // Hanya satu yang menang; sisanya ditolak karena harga sudah bergerak
    // duluan. Dengan kunci 1,2 detik yang lama, orang yang kalah cepat ikut
    // terhukum: sudah ditolak, masih harus menunggu, lalu kalah lagi. Sekarang
    // penolakan langsung membuka tombol supaya mereka bisa menawar ulang
    // seketika di harga yang baru.
    setBidCooldown(true);
    if (bidTimeoutRef.current) clearTimeout(bidTimeoutRef.current);
    bidTimeoutRef.current = setTimeout(() => {
      // Jaring pengaman: kalau jawaban server tidak pernah datang, tombol
      // tidak boleh terkunci selamanya.
      setBidCooldown(false);
      bidTimeoutRef.current = null;
    }, 3000);

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
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-md">
          <span className="material-symbols-outlined text-white mb-4 animate-bounce" style={{ fontSize: '100px' }}>notifications_active</span>
          <div className="text-white text-8xl font-black">{startCountdown}</div>
          <div className="text-white text-lg font-bold mt-2">Persiapkan Diri Anda!</div>
        </div>
      )}

      {(isCancelledOverlay || isCancelledOverride) && (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-900/90 backdrop-blur-md text-center p-6">
          <span className="material-symbols-outlined text-red-500 mb-3" style={{ fontSize: '80px' }}>cancel</span>
          <div className="text-red-500 text-3xl font-black mb-2">Lot ini dibatalkan, lanjut ke lot berikutnya</div>
          <div className="text-white text-lg font-semibold">
            Sisa waktu:{" "}
            <span className="text-red-500 text-3xl font-extrabold animate-pulse mx-1">
              {cancelCountdownOverride ?? cancelCountdown}
            </span>{" "}
            detik
          </div>
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
              className={`switch-toggle relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                isBidEnabled ? "bg-brand-orange" : "bg-slate-300"
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
        <span className="font-bold text-lg text-[#f67904]">
          LOT #{lot.lot_number} &bull; {lot.asset?.title}
        </span>
      </div>

      {!isConnected && (
        <div className="alert-box danger mb-4 flex items-center gap-2 transition-all mx-5 mt-4">
          <span className="material-symbols-outlined animate-pulse">wifi_off</span>
          <span>
            Koneksi terputus — harga di layar mungkin sudah tidak terbaru. Penawaran dinonaktifkan sampai
            tersambung kembali. <strong>Sedang dilakukan reconnecting…</strong>
          </span>
        </div>
      )}

      {isConnected && isStalled && (
        <div className="alert-box warning mb-4 flex items-center gap-2 transition-all mx-5 mt-4">
          <span className="material-symbols-outlined animate-pulse">sync_problem</span>
          <span>
            Data lelang tertunda — sedang menyambungkan ulang. Hitung mundur di layar mungkin belum yang
            terbaru.
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
              <div className="min-w-0 text-center">
                <span className="text-xs text-slate-500 uppercase tracking-widest font-semibold block mb-1">Harga Tertinggi Saat Ini</span>
                <div className={`text-2xl sm:text-4xl font-black flex flex-wrap items-center justify-center gap-2 min-w-0 break-words ${bidLogs[0]?.isMe ? 'text-green-600' : 'text-primary-strong'}`}>
                  {formatRupiah(currentPrice)}
                  {bidLogs[0]?.isMe && <span className="material-symbols-outlined text-3xl sm:text-4xl text-amber-500 flex-shrink-0" title="Anda penawar tertinggi!">emoji_events</span>}
                </div>
                <div className="mt-1 flex items-center justify-center gap-2">
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
                  disabled={bidCooldown || timeLeft <= 0 || !isBidEnabled || !isConnected || isStalled}
                  onClick={() => handlePlaceBid(minIncrement)}
                  className={`w-full py-4 px-4 text-sm font-black text-center rounded-xl transition-all shadow-md active:scale-95 ${
                    isSingleLot ? "btn-desktop-only" : ""
                  } ${
                    bidCooldown || timeLeft <= 0 || !isBidEnabled || !isConnected || isStalled
                      ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                      : "bg-brand-orange text-white cursor-pointer hover:shadow-lg"
                  }`}
                >
                  {isStalled && isConnected
                    ? "Menunggu data terbaru…"
                    : `Ajukan Penawaran (+ ${formatRupiah(minIncrement)})`}
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
                      <div className="text-sm font-normal text-slate-800 flex items-center gap-1.5">
                        {log.bidder}
                        {log.isMe && <span className="px-1.5 py-0.5 bg-primary text-white text-[9px] rounded uppercase">Anda</span>}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                        <span>{log.time}</span>
                        {(log.contenders ?? 1) > 1 && (
                          <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded font-semibold">
                            {log.contenders} penawar
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-sm font-black text-slate-900">{formatRupiah(log.amount)}</div>
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
                  <div className="text-[10px] uppercase tracking-[0.25em] text-slate-500">Peserta Online</div>
                  <div className="text-lg font-black text-slate-900 mt-1">{onlineCount}</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <div className="text-[10px] uppercase tracking-[0.25em] text-slate-500">Status</div>
                  <div className="text-lg font-black text-primary-strong mt-1">Live</div>
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
        className={`fixed bottom-16 inset-x-0 lg:hidden px-4 py-3 flex justify-center items-center ${
          isBidEnabled ? "z-[60]" : "z-30"
        }`}
      >
        <button
          disabled={bidCooldown || timeLeft <= 0 || !isBidEnabled || !isConnected || isStalled}
          onClick={() => handlePlaceBid(minIncrement)}
          className={`bid-cta w-full rounded-2xl transition-all shadow-md active:scale-95 ${
            bidCooldown || timeLeft <= 0 || !isBidEnabled || !isConnected || isStalled
              ? "bg-slate-300 text-slate-500 cursor-not-allowed"
              : "bg-brand-orange text-white cursor-pointer"
          }`}
        >
          {!isConnected ? "TERPUTUS" : isStalled ? "MENUNGGU" : "BID"}
        </button>
      </div>
    )}
    </>
  );
}

export default function BidderBiddingRoom() {
  const router = useRouter();
  // `?simulate=1` renders SIMULATE_LOT with fake bid history and no socket —
  // a static stand-in for a live session so redesign work here can be seen
  // without needing a real lot/session running. Development only: a fake lot
  // shown to real bidders on bidku.co.id would be indistinguishable from a
  // genuine one, so the flag is compiled out of production builds.
  const [isSimulate] = useState(
    () =>
      process.env.NODE_ENV === "development" &&
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("simulate") === "1"
  );
  const [activeLots, setActiveLots] = useState<any[]>([]);
  const [liveSessionId, setLiveSessionId] = useState<string | null>(null);
  const [frozenLot, setFrozenLot] = useState<any | null>(null);
  const [frozenCountdown, setFrozenCountdown] = useState<number>(5);
  const frozenTimerRef = useRef<NodeJS.Timeout | null>(null);
  const closedTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [closedResult, setClosedResult] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [upcomingSessions, setUpcomingSessions] = useState<any[]>([]);
  const [isSessionEnded, setIsSessionEnded] = useState(false);
  
  // Settings for bidding
  const [bidIncrement, setBidIncrement] = useState<number>(500000);
  const socketRef = useRef<Socket | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Which lot rooms this socket has actually joined. Room membership is what
  // decides whether `bid:update` (the countdown) reaches us at all, so it is
  // tracked explicitly rather than inferred from render state.
  const watchedLotIdsRef = useRef<Set<string>>(new Set());
  // Read by socket handlers that outlive the render they were created in.
  const activeLotsRef = useRef<any[]>([]);
  const liveSessionIdRef = useRef<string | null>(null);
  // Timestamp of the last countdown tick received from the server; the
  // watchdog below uses it to notice a silently dropped subscription.
  const lastBidUpdateAtRef = useRef<number>(0);
  const [isStalled, setIsStalled] = useState(false);

  useEffect(() => {
    activeLotsRef.current = activeLots;
  }, [activeLots]);

  useEffect(() => {
    liveSessionIdRef.current = liveSessionId;
  }, [liveSessionId]);

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
          clearInterval(interval);
          setThankYouModal(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [thankYouModal, router]);

  const fetchActiveLots = async (isPolling = false) => {
    if (typeof window === "undefined") return;

    if (isSimulate) {
      setActiveLots([SIMULATE_LOT]);
      setLoading(false);
      return;
    }

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

      // Fetch ALL active lots.
      //
      // "The server says there is no active lot" and "I failed to ask" are NOT
      // the same thing, and conflating them is what froze the bidding room
      // mid-auction: one 401 during a token refresh, or one dropped request on
      // a weak signal, emptied activeLots — which tore the socket down and
      // rebuilt it subscribed to nothing. The countdown stopped while the app
      // still looked connected. On a failed request we now keep whatever we
      // already had and simply try again on the next poll.
      const res = await apiFetch("/lots?status=active");
      const resData = await res.json().catch(() => null);
      const lotsRequestSucceeded = res.ok && resData?.success;

      if (lotsRequestSucceeded) {
        if (resData.data?.length > 0) {
          setActiveLots(resData.data);
        } else {
          setActiveLots([]);
          // Fetch upcoming sessions if no active lots
          const resSessions = await apiFetch("/sessions?status=published");
          const sessData = await resSessions.json().catch(() => null);
          if (resSessions.ok && sessData?.success) {
            setUpcomingSessions(sessData.data);
          }
        }
      }

      // Fetch LIVE session to keep socket alive even when transitioning through
      // cancelled lots. Same rule as above — only a successful answer is
      // allowed to clear it, since dropping liveSessionId closes the socket
      // outright and takes the session-room broadcasts down with it.
      const resSession = await apiFetch("/sessions?status=live");
      const sessionData = await resSession.json().catch(() => null);
      if (resSession.ok && sessionData?.success) {
        if (sessionData.data?.length > 0) {
          setLiveSessionId(sessionData.data[0].id);
          setLiveSessionName(sessionData.data[0].title || sessionData.data[0].name || "");
        } else {
          setLiveSessionId(null);
        }
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

    if (isSessionEnded) {
      return;
    }

    if (data) {
      const storedUser = localStorage.getItem("user");
      const currentUserId = storedUser ? JSON.parse(storedUser).id : "";
      const myMaskedId = currentUserId ? `Peserta #${currentUserId.substring(0, 4).toUpperCase()}` : "";
      const isWinner = data.result === "sold" && data.winner_id === myMaskedId;

      if (closedTimerRef.current) clearInterval(closedTimerRef.current);

      if (data.result === "sold") {
        setClosedResult({
          ...data,
          isWinner,
          hasUserBidded: hasBidded,
        });
        
        closedTimerRef.current = setTimeout(() => {
          setClosedResult(null);
        }, 10000);
      } else if (data.result === "unsold") {
        setClosedResult({
          ...data,
          result: "unsold",
          countdown: 5,
        });

        let count = 5;
        closedTimerRef.current = setInterval(() => {
          count--;
          setClosedResult((prev: any) => prev ? { ...prev, countdown: count } : null);
          if (count <= 0) {
            if (closedTimerRef.current) clearInterval(closedTimerRef.current);
            setClosedResult(null);
            fetchActiveLots();
          }
        }, 1000);
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

  // Cleanup timers on component unmount
  useEffect(() => {
    return () => {
      if (frozenTimerRef.current) clearInterval(frozenTimerRef.current);
      if (closedTimerRef.current) clearInterval(closedTimerRef.current);
    };
  }, []);

  // Static preview never opens a real socket — it just looks "connected".
  useEffect(() => {
    if (isSimulate) setIsConnected(true);
  }, [isSimulate]);

  // Central Socket Connection.
  //
  // Deliberately keyed on the live session only — NOT on the set of active lot
  // ids. With lot advancement set to "admin", `/lots?status=active` is
  // legitimately empty between lots, so keying on lot ids tore the connection
  // down and rebuilt it on every transition (up to twice per lot). Each rebuild
  // was a chance to come back subscribed to nothing while `isConnected` stayed
  // true, which is exactly how the room went silent mid-countdown. The socket
  // now lives for the whole session and lot rooms are joined and left on it by
  // the membership effect below.
  useEffect(() => {
    if (isSimulate) return;
    // No live session means nothing to listen to yet.
    if (!liveSessionId) return;

    // A callback (rather than a plain object) is re-invoked before every
    // connection attempt, so a reconnect after a long background never
    // handshakes with an access token that expired in the meantime.
    const localSocket: Socket = io(wsBaseUrl(), {
      auth: (cb: (data: object) => void) => {
        const token = localStorage.getItem("accessToken") || "";
        cb({ token });
      },
      // Websocket dulu, tapi polling tetap disediakan sebagai cadangan.
      //
      // Sebelumnya hanya websocket. Peserta di jaringan yang memblokirnya —
      // sebagian proxy kantor, beberapa APN seluler — tidak akan pernah
      // tersambung sama sekali, dan penjaga otomatis tidak bisa menolong
      // karena tidak ada koneksi untuk dijaga. Polling lebih boros, tapi
      // masih bisa menawar jauh lebih baik daripada tidak bisa sama sekali.
      transports: ["websocket", "polling"],
      // Mencoba menyambung ulang tanpa henti. Sinyal lemah, baterai lemah,
      // atau berpindah antara WiFi dan seluler tidak boleh berakhir dengan
      // peserta yang menyerah sendiri.
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 4000,
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
    //
    // Reads the refs, not the render closure: this handler outlives the render
    // that created it, and rejoining the lot the bidder was on five minutes ago
    // would be worse than useless.
    const handleConnect = () => {
      setIsConnected(true);
      watchedLotIdsRef.current = new Set();
      const sessionId = liveSessionIdRef.current;
      if (sessionId) {
        localSocket.emit("bid:watch", { session_id: sessionId });
      }
      activeLotsRef.current.forEach((lot) => {
        localSocket.emit("bid:watch", {
          lot_id: lot.id,
          session_id: lot.session_id,
        });
        watchedLotIdsRef.current.add(lot.id);
      });
      lastBidUpdateAtRef.current = Date.now();
      setIsStalled(false);
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      watchedLotIdsRef.current = new Set();
    };

    // Join session room to listen for lot:start (for cancelled lot freezing)
    const handleLotStart = (data: any) => {
      setClosedResult(null);
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
      const cancelledLot = activeLotsRef.current.find((l) => l.id === data.lot_id);
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
      setIsSessionEnded(true);
      const biddedInSession = hasSessionBidded || (typeof window !== "undefined" && sessionStorage.getItem("has_bidded_in_session") === "true");
      if (biddedInSession) {
        setThankYouModal({
          session_title: data?.session_title || liveSessionName || "Sesi Lelang Live",
        });
      } else {
        // No redirect, just stay on page
      }
    };

    const handleLotActivated = (data: any) => {
      if (frozenTimerRef.current) {
        clearInterval(frozenTimerRef.current);
      }
      setFrozenLot(null);
      setClosedResult(null);
      fetchActiveLots();
    };

    // The lot card has its own bid:update listener for rendering; this one only
    // records that a tick arrived, which is what tells the watchdog the lot
    // room subscription is alive. Socket.io fans out to both listeners.
    const handleBidUpdateHeartbeat = () => {
      lastBidUpdateAtRef.current = Date.now();
      setIsStalled(false);
    };

    localSocket.on("connect", handleConnect);
    localSocket.on("disconnect", handleDisconnect);
    localSocket.on("bid:update", handleBidUpdateHeartbeat);
    if (liveSessionId) {
      localSocket.on("lot:start", handleLotStart);
      localSocket.on("lot:activated", handleLotActivated);
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
      watchedLotIdsRef.current = new Set();
      localSocket.off("connect", handleConnect);
      localSocket.off("disconnect", handleDisconnect);
      localSocket.off("bid:update", handleBidUpdateHeartbeat);
      localSocket.off("lot:start", handleLotStart);
      localSocket.off("lot:activated", handleLotActivated);
      localSocket.off("lot:cancelled", handleParentLotCancelled);
      localSocket.off("session:ended", handleSessionEnded);
      localSocket.disconnect();
      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
    };
  }, [liveSessionId, isSimulate]);

  // Lot room membership, kept in step with the active lots WITHOUT touching the
  // connection. Joins rooms that appeared, leaves rooms that went away, and
  // re-runs after every reconnect (isConnected flipping back to true) so a
  // resumed socket is never left subscribed to nothing.
  const activeLotIdsKey = activeLots.map((l) => l.id).join(",");
  useEffect(() => {
    if (isSimulate) return;
    const s = socketRef.current;
    if (!s || !isConnected) return;

    const wanted = new Set<string>(activeLots.map((l) => l.id));

    for (const lot of activeLots) {
      if (watchedLotIdsRef.current.has(lot.id)) continue;
      s.emit("bid:watch", { lot_id: lot.id, session_id: lot.session_id });
      watchedLotIdsRef.current.add(lot.id);
      lastBidUpdateAtRef.current = Date.now();
    }

    for (const id of Array.from(watchedLotIdsRef.current)) {
      if (wanted.has(id)) continue;
      s.emit("bid:unwatch", { lot_id: id });
      watchedLotIdsRef.current.delete(id);
    }
  }, [activeLotIdsKey, isConnected, isSimulate]);

  // Watchdog. The server broadcasts a countdown tick every second to everyone
  // in the lot room, so silence while a lot is active means this client has
  // fallen out of that room — the failure that leaves the screen frozen with no
  // "disconnected" warning to explain it. Rejoin on our own rather than waiting
  // for the next poll, and tell the bidder while it is happening.
  useEffect(() => {
    if (isSimulate) return;
    if (activeLots.length === 0) {
      setIsStalled(false);
      return;
    }

    const STALL_AFTER_MS = 4000;
    const interval = setInterval(() => {
      const s = socketRef.current;
      if (!s || !s.connected) return;

      const silentFor = Date.now() - lastBidUpdateAtRef.current;
      if (silentFor < STALL_AFTER_MS) {
        setIsStalled(false);
        return;
      }

      setIsStalled(true);
      // Re-subscribing is idempotent server-side (a repeated join is a no-op)
      // and is answered with the current price, so this both repairs a lost
      // subscription and resyncs whatever was missed.
      activeLotsRef.current.forEach((lot) => {
        s.emit("bid:watch", { lot_id: lot.id, session_id: lot.session_id });
        watchedLotIdsRef.current.add(lot.id);
      });
      const sessionId = liveSessionIdRef.current;
      if (sessionId) s.emit("bid:watch", { session_id: sessionId });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeLots.length, isSimulate]);

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
        <ActiveLotCard
          lot={frozenLot.lot_data}
          token={typeof window !== "undefined" ? localStorage.getItem("accessToken") || "" : ""}
          bidIncrement={bidIncrement}
          socket={socket}
          isConnected={isConnected}
          isStalled={isStalled}
          onLotClosed={handleLotClosed}
          isSingleLot={true}
          isCancelledOverride={true}
          cancelCountdownOverride={frozenCountdown}
        />
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
              isStalled={isStalled}
              onLotClosed={handleLotClosed}
              isSingleLot={activeLots.length === 1}
              {...(isSimulate
                ? { initialTimeLeft: 45, initialStartCountdown: null, initialBidLogs: SIMULATE_BID_LOGS }
                : {})}
            />
          ))}
        </div>
      ) : (
        <div className="card py-16 text-center flex flex-col items-center justify-center gap-4">
          <span className="material-symbols-outlined text-6xl text-primary-strong animate-bounce">gavel</span>
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
                    <div className="bg-primary/10 text-primary-strong p-2 rounded-lg">
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
                Silakan periksa halaman <Link href="/katalog" className="text-primary-strong font-bold underline">Katalog</Link> untuk melihat jadwal lelang yang akan datang.
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
                <div className="text-8xl mb-4">🎉</div>
                <h2 className="text-2xl font-black text-green-600 mb-2">Selamat Anda Memenangkan Lot {closedResult.lot_number}!</h2>
                <p className="text-slate-600 mb-6">Silahkan melunasi melalui halaman Keranjang Tagihan.</p>
                
                <div className="bg-slate-50 p-4 rounded-xl text-left mb-6 space-y-2 border border-slate-100">
                  <div className="flex justify-between">
                    <span className="text-slate-500 text-sm">Harga Dasar</span>
                    <span className="font-medium">{new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(closedResult.starting_price))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 text-sm">Harga Terbentuk</span>
                    <span className="font-black text-primary-strong">{new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(closedResult.final_price))}</span>
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
            ) : closedResult.result === "unsold" ? (
              <>
                <div className="text-8xl mb-4">ℹ️</div>
                <h2 className="text-2xl font-black text-slate-800 mb-2">Lot ini tidak ada pemenangnya, lanjut ke lot berikutnya</h2>
                <p className="text-slate-500 mb-6">
                  Sisa waktu: <span className="font-black text-primary-strong text-2xl animate-pulse">{closedResult.countdown ?? 5}</span> detik
                </p>
                
                <button onClick={() => { setClosedResult(null); fetchActiveLots(); }} className="w-full py-3 px-4 rounded-xl font-bold bg-slate-150 text-slate-600 hover:bg-slate-200 transition-colors border border-slate-200">
                  Tutup
                </button>
              </>
            ) : closedResult.hasUserBidded ? (
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
                    <span className="font-medium">{closedResult.winner_id || closedResult.winner_nipl || "No Bidder"}</span>
                  </div>
                </div>

                <button onClick={() => setClosedResult(null)} className="w-full py-3 px-4 rounded-xl font-bold bg-primary text-white hover:bg-primary/90 transition-colors">
                  Lanjut Lelang Berikutnya
                </button>
              </>
            ) : (
              <>
                <div className="text-8xl mb-4">ℹ️</div>
                <h2 className="text-2xl font-black text-slate-800 mb-2">Lot Selesai Terjual</h2>
                <p className="text-slate-600 mb-6 leading-relaxed">
                  Lot <span className="font-bold text-slate-800">{closedResult.asset_title || `Lot #${closedResult.lot_number}`}</span> dimenangkan dengan harga terbentuk <span className="font-bold text-primary-strong">{new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(closedResult.final_price))}</span> oleh Bidder <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-sm text-slate-700 font-bold">{closedResult.winner_id || closedResult.winner_nipl || "-"}</span>.
                </p>

                <button onClick={() => setClosedResult(null)} className="w-full py-3 px-4 rounded-xl font-bold bg-primary text-white hover:bg-primary/90 transition-colors">
                  Lanjut Lelang Berikutnya
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {thankYouModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-900/85 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full text-center shadow-2xl border-2 border-primary/20 relative overflow-hidden">
            <div className="w-16 h-16 bg-primary/10 text-primary-strong rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
              <span className="material-symbols-outlined text-4xl">celebration</span>
            </div>

            <h2 className="text-2xl font-black text-slate-800 mb-4">Lelang Telah Selesai 🎉</h2>

            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 mb-6 text-left space-y-3 shadow-inner">
              <p className="text-sm font-bold text-primary-strong">
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
                onClick={() => {
                  setThankYouModal(null);
                }}
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
