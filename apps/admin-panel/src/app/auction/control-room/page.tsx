'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import Toast from '../../../components/ui/Toast';
import { apiFetch, wsBaseUrl, refreshAccessToken, getAuthToken, getImageUrl } from '../../../lib/api';

interface Session {
  id: string;
  title: string;
  status: 'draft' | 'published' | 'live' | 'closed';
  scheduled_at: string;
  branch?: {
    name: string;
    city: string;
  };
}

interface Lot {
  id: string;
  session_id: string;
  lot_number: number;
  starting_price: number;
  hammer_price?: number;
  winner_id?: string;
  status: 'pending' | 'active' | 'sold' | 'unsold' | 'cancelled';
  // Live countdown/bidding state — only present for the currently active lot,
  // merged in server-side from the in-memory activeLots map (see lots.service.ts).
  current_price?: number;
  time_remaining?: number;
  bidder_count?: number;
  extension_count?: number;
  bidder_id?: string;
  asset: {
    title: string;
    category: string;
    base_price: number;
    images?: any;
    photo_front?: string;
    photo_left?: string;
    photo_right?: string;
    photo_back?: string;
    photo_interior?: string;
    photo_engine?: string;
  };
  session?: any;
}

const PHOTO_FIELDS = ['photo_front', 'photo_left', 'photo_right', 'photo_back', 'photo_interior', 'photo_engine'] as const;

function getAssetImages(asset: any): string[] {
  let parsed: string[] = [];
  try {
    const raw = typeof asset?.images === 'string' ? JSON.parse(asset.images) : asset?.images;
    if (Array.isArray(raw)) parsed = raw.filter((v: any) => typeof v === 'string' && v);
  } catch (e) {
    parsed = [];
  }
  if (parsed.length > 0) return parsed;
  return PHOTO_FIELDS
    .map((field) => asset?.[field])
    .filter((v): v is string => typeof v === 'string' && v.length > 0);
}

interface BidLog {
  id: string;
  bidder_id: string;
  bidder_name?: string;
  nipl_code?: string;
  amount: number;
  time: string;
}

function AuctionRoomSimulation() {
  const recentActivity = [
    { bidder: 'B-1048', amount: 485000000, time: '08:42:11' },
    { bidder: 'B-2201', amount: 490000000, time: '08:42:08' },
    { bidder: 'B-3905', amount: 495000000, time: '08:42:03' },
  ];

  const participants = ['B-1048', 'B-2201', 'B-3905', 'B-7710', 'B-9023'];

  return (
    <Card title="Simulasi Ruang Lelang (Desktop Preview)" className="mb-4">
      <div
        style={{
          border: '1px solid var(--wf-border)',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #fffaf3 0%, #fff 100%)',
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--wf-primary)', fontWeight: 700 }}>
              Lelang Sedang Berlangsung
            </div>
            <h3 style={{ fontSize: '1.2rem', margin: '0.2rem 0 0', color: 'var(--wf-text)' }}>Toyota Hilux 2.4 G Double Cabin</h3>
          </div>
          <div
            style={{
              padding: '0.45rem 0.8rem',
              borderRadius: '999px',
              background: '#ffe6d0',
              color: 'var(--wf-primary)',
              fontSize: '0.8rem',
              fontWeight: 700,
              whiteSpace: 'nowrap',
            }}
          >
            ● Live Now
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.65fr 1fr', gap: '1rem' }}>
          <div
            style={{
              background: 'var(--wf-white)',
              border: '1px solid var(--wf-border)',
              borderRadius: '10px',
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--wf-text-light)', textTransform: 'uppercase', fontWeight: 700 }}>Lot 014</div>
                <div style={{ fontSize: '0.95rem', color: 'var(--wf-text-light)' }}>Kendaraan · 2020 · Putih</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--wf-text-light)', textTransform: 'uppercase', fontWeight: 700 }}>Sisa Waktu</div>
                <div style={{ fontSize: '2.3rem', fontWeight: 800, color: 'var(--wf-primary)' }}>01:18</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '0.75rem' }}>
              <div style={{ background: '#f8f9fa', borderRadius: '8px', padding: '0.8rem' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--wf-text-light)', textTransform: 'uppercase' }}>Harga Awal</div>
                <div style={{ fontSize: '1rem', fontWeight: 700 }}>Rp 450.000.000</div>
              </div>
              <div style={{ background: '#f8f9fa', borderRadius: '8px', padding: '0.8rem' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--wf-text-light)', textTransform: 'uppercase' }}>Harga Sekarang</div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--wf-success)' }}>Rp 495.000.000</div>
              </div>
              <div style={{ background: '#f8f9fa', borderRadius: '8px', padding: '0.8rem' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--wf-text-light)', textTransform: 'uppercase' }}>Penawar</div>
                <div style={{ fontSize: '1rem', fontWeight: 700 }}>B-3905</div>
              </div>
            </div>

            <div style={{ background: '#fff7ed', borderRadius: '8px', padding: '0.8rem', border: '1px dashed #f2c087' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--wf-primary)', marginBottom: '0.35rem' }}>Tahap penawaran aktif</div>
              <div style={{ fontSize: '0.9rem', color: 'var(--wf-text-light)' }}>Penawaran bertambah Rp 5.000.000 per langkah. Anti-sniping aktif sejak 30 detik terakhir.</div>
            </div>
          </div>

          <div
            style={{
              background: 'var(--wf-white)',
              border: '1px solid var(--wf-border)',
              borderRadius: '10px',
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
            }}
          >
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--wf-primary)', textTransform: 'uppercase' }}>Aktivitas Terakhir</div>
            {recentActivity.map((item) => (
              <div key={item.bidder} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.75rem', background: 'var(--wf-bg)', borderRadius: '6px' }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{item.bidder}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--wf-text-light)' }}>{item.time}</div>
                </div>
                <div style={{ fontWeight: 700, color: 'var(--wf-success)' }}>{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(item.amount)}</div>
              </div>
            ))}

            <div style={{ borderTop: '1px solid var(--wf-border)', paddingTop: '0.75rem' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--wf-primary)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>Peserta Aktif</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                {participants.map((participant) => (
                  <span key={participant} style={{ padding: '0.3rem 0.55rem', borderRadius: '999px', background: '#f1f5f9', color: 'var(--wf-text-light)', fontSize: '0.8rem' }}>
                    {participant}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function ControlRoomPage() {
  const [activeTab, setActiveTab] = useState<'live' | 'arsip'>('live');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [sessionDetails, setSessionDetails] = useState<Session | null>(null);
  const [lots, setLots] = useState<Lot[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [sessionStartTrigger, setSessionStartTrigger] = useState<'admin' | 'system'>('admin');
  const [nextLotAdvanceMode, setNextLotAdvanceMode] = useState<'admin' | 'auto'>('admin');

  const nextPendingLot = React.useMemo(() => {
    return lots
      .filter((l) => l.status === 'pending')
      .sort((a, b) => (a.lot_number || 0) - (b.lot_number || 0))[0] || null;
  }, [lots]);
  
  // Real-time Active Lot State
  const [activeLot, setActiveLot] = useState<Lot | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [highestBidder, setHighestBidder] = useState<string>('-');
  const [highestBidderName, setHighestBidderName] = useState<string>('-');
  const [highestBidderNipl, setHighestBidderNipl] = useState<string>('-');
  const [bidsCount, setBidsCount] = useState<number>(0);
  const [extensionCount, setExtensionCount] = useState<number>(0);
  const [isExtended, setIsExtended] = useState<boolean>(false);
  
  const [bidLogs, setBidLogs] = useState<BidLog[]>([]);
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'danger' } | null>(null);

  interface WinnerModalData {
    lot_number: number | string;
    asset_title: string;
    winner_name: string;
    winner_nipl: string;
    base_price: number;
    final_price: number;
  }

  const [winnerModalData, setWinnerModalData] = useState<WinnerModalData | null>(null);
  const [popupSecondsLeft, setPopupSecondsLeft] = useState<number>(5);

  useEffect(() => {
    if (!winnerModalData) return;
    setPopupSecondsLeft(5);
    const interval = setInterval(() => {
      setPopupSecondsLeft((prev) => {
        if (prev <= 1) {
          setWinnerModalData(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [winnerModalData]);

  const socketRef = useRef<Socket | null>(null);
  // Mirrors `lots` for use inside socket callbacks registered by the effect below.
  // Those callbacks close over `lots` from whatever render was active when the
  // effect last (re-)ran — since `lots` isn't in that effect's dependency array,
  // reading `lots` directly inside them would see a stale value if fetchLots()
  // updates state afterwards. A ref's `.current` is always up to date.
  const lotsRef = useRef<Lot[]>([]);
  
  const fetchBidLogs = useCallback(async (lotId: string) => {
    try {
      const response = await apiFetch(`/lots/${lotId}/bids`);
      const data = await response.json();
      if (response.ok && data.success) {
        const formatted = data.data.map((bid: any) => ({
          id: bid.id,
          bidder_id: bid.bidder_id,
          bidder_name: bid.bidder_name,
          nipl_code: bid.nipl_code,
          amount: bid.amount,
          time: new Date(bid.created_at).toLocaleTimeString('id-ID'),
        }));
        setBidLogs(formatted);
      } else {
        setBidLogs([]);
      }
    } catch (err) {
      console.error('Failed to fetch bid logs:', err);
      setBidLogs([]);
    }
  }, []);

  useEffect(() => {
    lotsRef.current = lots;
  }, [lots]);

  // Dummy Fallbacks


  // Fetch Session List on mount
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [resSessions, resSettings, resNextLotTrigger] = await Promise.all([
          apiFetch('/sessions?per_page=50'),
          apiFetch('/admin/settings/auction_session_start_trigger'),
          apiFetch('/admin/settings/auction_next_lot_trigger')
        ]);

        if (resSettings.ok) {
          const settingsData = await resSettings.json();
          if (settingsData.success && settingsData.data) {
            setSessionStartTrigger(settingsData.data.value as 'admin' | 'system');
          }
        }

        if (resNextLotTrigger.ok) {
          const nextLotData = await resNextLotTrigger.json();
          if (nextLotData.success && nextLotData.data) {
            setNextLotAdvanceMode(nextLotData.data.value as 'admin' | 'auto');
          }
        }

        if (resSessions.ok) {
          const data = await resSessions.json();
          if (data.success) {
            const allSessions = data.data || [];
            setSessions(allSessions);
            
            // Auto-select the live session if any exists
            const liveSession = allSessions.find((s: Session) => s.status === 'live');
            if (liveSession) {
              setSelectedSessionId(liveSession.id);
            } else if (allSessions.length > 0) {
              setSelectedSessionId(allSessions[0].id);
            }
          }
        } else {
          setSessions([]);
        }
      } catch (err) {
        setSessions([]);
      }
    };
    fetchInitialData();
  }, []);

  // Fetch lot list/details whenever the session changes or a refetch is requested.
  // Deliberately does NOT touch the socket connection (see the effect below) — it
  // used to live in the same effect as the socket setup, keyed on `refreshTrigger`,
  // which meant every refreshTrigger bump (e.g. after "Mulai Lelang") tore down and
  // recreated the *entire* socket connection. If the operator then activated a lot
  // moments later, that reconnect could still be in flight and the client would
  // never (re)join the lot's socket room — it'd show the correct starting duration
  // once (via the session-room broadcast) but then never receive another tick,
  // leaving the countdown frozen. Splitting this out lets refreshTrigger just
  // re-fetch lots over REST without disturbing an already-connected socket.
  useEffect(() => {
    if (!selectedSessionId) return;

    // Set details
    const selected = sessions.find((s) => s.id === selectedSessionId) || null;
    setSessionDetails(selected);

    const fetchLots = async () => {
      setLoading(true);
      try {
        const response = await apiFetch(`/lots?session_id=${selectedSessionId}&per_page=100`);
        const data = await response.json();
        if (response.ok && data.success) {
          setLots(data.data);
          
          // Check if any lot is active and watch it
          const active = data.data.find((l: Lot) => l.status === 'active');
          if (active) {
            setActiveLot(active);
            // Seed from the server's live in-memory state (merged into the REST
            // response) so the countdown shows the real remaining time right away
            // instead of sitting at its default 0 until a socket tick arrives.
            setCurrentPrice(active.current_price ?? active.starting_price);
            setTimeRemaining(active.time_remaining ?? 0);
            setBidsCount(active.bidder_count ?? 0);
            setExtensionCount(active.extension_count ?? 0);
            setHighestBidder(active.bidder_id ?? '-');
            setHighestBidderName((active as any).bidder_name ?? '-');
            setHighestBidderNipl((active as any).nipl_code ?? '-');
            setIsExtended((active.extension_count ?? 0) > 0);
            watchLotSocket(active.id);
            fetchBidLogs(active.id);
          } else {
            setActiveLot(null);
          }
        } else {
          setLots([]);
          setActiveLot(null);
        }
      } catch (err) {
        setLots([]);
        setActiveLot(null);
      } finally {
        setLoading(false);
      }
    };

    fetchLots();
  }, [selectedSessionId, sessions, refreshTrigger]);

  // Connect the socket — scoped to selectedSessionId ONLY, so it survives
  // refreshTrigger bumps from the effect above instead of being torn down and
  // reconnected on every one (see comment there for why that mattered).
  useEffect(() => {
    if (!selectedSessionId) return;

    // Setup Socket Connection — refresh the access token first so the socket
    // doesn't connect with a token that's already expired (sockets can't
    // benefit from apiFetch's automatic 401 refresh-and-retry).
    const attachSocketListeners = (socket: Socket) => {
      socket.on('connect', () => {
        loggerDebug('Connected to WebSocket server');
        // Watch session room for session-wide broadcasts (lot:activated, lot:closed, session:ended)
        socket.emit('bid:watch', { session_id: selectedSessionId });
        // If a lot is already active (discovered via REST before socket connected),
        // join its room now so we receive bid:update ticks immediately. Read from
        // the ref, not the `lots` state closed over by this effect — that closure
        // is fixed at whatever `lots` was when the effect last ran, and never sees
        // the setLots() call from this same effect's fetchLots() resolving later.
        const currentLots = lotsRef.current;
        const active = currentLots.find((l: Lot) => l.status === 'active');
        if (active) {
          socket.emit('bid:watch', { lot_id: active.id, session_id: selectedSessionId });
        }
      });

      socket.on('lot:activated', (data: any) => {
        setToast({ message: `Lot #${data.lot_data.lot_number} telah diaktifkan!`, variant: 'success' });
        // Update lots list status
        setLots((prevLots) =>
          prevLots.map((l) =>
            l.id === data.lot_id ? { ...l, status: 'active' } : l
          )
        );

        // Join the lot's socket room to receive bid:update countdown ticks
        socket.emit('bid:watch', { lot_id: data.lot_id, session_id: selectedSessionId });

        // Build active lot state directly from the broadcast payload instead of
        // looking it up in the `lots` closure, which can be stale (this listener
        // is registered once per effect run and doesn't see later setLots calls).
        setActiveLot({
          id: data.lot_id,
          session_id: selectedSessionId,
          lot_number: data.lot_data.lot_number,
          starting_price: data.lot_data.starting_price,
          status: 'active',
          asset: {
            title: data.lot_data.asset_title,
            category: data.lot_data.category,
            base_price: data.lot_data.starting_price,
            images: data.lot_data.images || [],
            photo_front: data.lot_data.photo_front,
            photo_left: data.lot_data.photo_left,
            photo_right: data.lot_data.photo_right,
            photo_back: data.lot_data.photo_back,
            photo_interior: data.lot_data.photo_interior,
            photo_engine: data.lot_data.photo_engine,
          },
        });
        setCurrentPrice(data.lot_data.starting_price);
        setTimeRemaining(data.duration || 30);
        setBidsCount(0);
        setHighestBidder('-');
        setHighestBidderName('-');
        setHighestBidderNipl('-');
        setExtensionCount(0);
        setIsExtended(false);
        setBidLogs([]);
      });

      socket.on('bid:update', (data: any) => {
        setCurrentPrice(data.current_price);
        setHighestBidder(data.bidder_id);
        setHighestBidderName(data.bidder_name || '-');
        setHighestBidderNipl(data.nipl_code || '-');
        setBidsCount(data.bidder_count);
        setTimeRemaining(data.time_remaining);
        setExtensionCount(data.extension_count);
        setIsExtended(data.extended || false);

        if (data.extended) {
          setToast({ message: `Waktu penawaran diperpanjang! (Anti-Sniping)`, variant: 'success' });
        }

        // Add to logs only if it's a new bid (amount is higher or log is empty)
        if (data.bidder_id && data.bidder_id !== '-') {
          setBidLogs((prev) => {
            if (prev.length > 0 && prev[0].amount === data.current_price) {
              return prev; // Do not add duplicate tick log entries
            }
            return [
              {
                id: String(Date.now()),
                bidder_id: data.bidder_id,
                bidder_name: data.bidder_name,
                nipl_code: data.nipl_code,
                amount: data.current_price,
                time: data.created_at
                  ? new Date(data.created_at).toLocaleTimeString('id-ID')
                  : new Date().toLocaleTimeString('id-ID'),
              },
              ...prev,
            ];
          });
        }
      });

      socket.on('lot:closed', (data: any) => {
        setToast({
          message: `Lot ditutup! Status: ${data.result === 'sold' ? 'SOLD (Terjual)' : 'UNSOLD'}`,
          variant: data.result === 'sold' ? 'success' : 'danger',
        });

        if (data.result === 'sold') {
          const currentActive = lotsRef.current.find((l) => l.id === data.lot_id);
          setWinnerModalData({
            lot_number: data.lot_number || currentActive?.lot_number || '-',
            asset_title: data.asset_title || currentActive?.asset?.title || 'Unit Lelang',
            winner_name: data.winner_name || highestBidderName || 'Bidder',
            winner_nipl: data.winner_nipl || highestBidderNipl || 'NIPL-',
            base_price: data.start_price || Number(currentActive?.starting_price || currentActive?.asset?.base_price || 0),
            final_price: data.final_price || currentPrice || 0,
          });
        }

        // Update in lots list
        setLots((prevLots) =>
          prevLots.map((l) =>
            l.id === data.lot_id
              ? {
                  ...l,
                  status: data.result,
                  hammer_price: data.final_price,
                  winner_id: data.winner_id,
                }
              : l
          )
        );

        setActiveLot(null);
        setBidLogs([]);
      });

      socket.on('lot:cancelled', (data: any) => {
        setLots((prevLots) =>
          prevLots.map((l) => (l.id === data.lot_id ? { ...l, status: 'pending' } : l))
        );
        setActiveLot((prev) => (prev?.id === data.lot_id ? null : prev));
        setBidLogs([]);
      });

      socket.on('session:ended', (data: any) => {
        setToast({ message: 'Sesi lelang resmi ditutup oleh operator!', variant: 'success' });
        setSessions((prev) => prev.map((s) => (s.id === selectedSessionId ? { ...s, status: 'closed' } : s)));
      });

      socket.on('bid:error', (data: any) => {
        setToast({ message: data.message, variant: 'danger' });
      });
    };

    let cancelled = false;
    (async () => {
      const freshToken = (await refreshAccessToken()) || getAuthToken();
      if (cancelled) return;
      const socket = io(wsBaseUrl(), {
        auth: { token: freshToken },
        transports: ['websocket'],
      });
      socketRef.current = socket;
      attachSocketListeners(socket);
    })();

    return () => {
      cancelled = true;
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [selectedSessionId]);

  const watchLotSocket = (lotId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('bid:watch', { lot_id: lotId, session_id: selectedSessionId });
    }
  };

  const loggerDebug = (msg: string) => {
    console.log(`[Socket] ${msg}`);
  };

  const handleActivateLot = async (lotId: string) => {
    setProcessingId(lotId);
    setToast(null);
    // Join the lot's socket room *before* calling activate — the server broadcasts
    // `lot:activated` synchronously while handling that request, i.e. before this
    // fetch's response comes back, so joining afterwards would miss it.
    watchLotSocket(lotId);
    try {
      const response = await apiFetch(`/admin/lots/${lotId}/activate`, { method: 'POST' });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || 'Gagal mengaktifkan lot');
      }

      // If the socket isn't connected we won't receive the real-time
      // `lot:activated` broadcast — force a refetch so the UI reflects the
      // real backend state instead of fabricating one.
      if (socketRef.current?.disconnected) {
        setRefreshTrigger((prev) => prev + 1);
      }
    } catch (err: any) {
      setToast({ message: err.message, variant: 'danger' });
    } finally {
      setProcessingId(null);
    }
  };

  const handleCloseLot = async (lotId: string) => {
    setProcessingId(lotId);
    setToast(null);
    try {
      const response = await apiFetch(`/admin/lots/${lotId}/close`, { method: 'POST' });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || 'Gagal menutup lot');
      }
      if (data.success && data.data && data.data.status === 'sold') {
        const d = data.data;
        const currentActive = lotsRef.current.find((l) => l.id === lotId);
        setWinnerModalData({
          lot_number: d.lot_number || currentActive?.lot_number || '-',
          asset_title: d.asset?.title || currentActive?.asset?.title || 'Unit Lelang',
          winner_name: d.winner_name || highestBidderName || 'Bidder',
          winner_nipl: d.winner_nipl || highestBidderNipl || 'NIPL-',
          base_price: d.start_price || Number(currentActive?.starting_price || currentActive?.asset?.base_price || 0),
          final_price: Number(d.hammer_price || currentPrice || 0),
        });
      }
      if (socketRef.current?.disconnected) {
        setRefreshTrigger((prev) => prev + 1);
      }
    } catch (err: any) {
      setToast({ message: err.message, variant: 'danger' });
    } finally {
      setProcessingId(null);
    }
  };

  const handleCancelLot = async (lotId: string) => {
    if (!confirm('Apakah Anda yakin ingin membatalkan lot yang sedang aktif ini? Status lot akan dikembalikan ke pending.')) return;
    setProcessingId(lotId);
    setToast(null);
    try {
      const response = await apiFetch(`/admin/lots/${lotId}/cancel`, { method: 'POST' });
      const data = await response.json();
      if (response.ok && data.success) {
        setToast({ message: 'Lot berhasil dibatalkan dan dikembalikan ke pending.', variant: 'success' });
        setRefreshTrigger((prev) => prev + 1);
        setActiveLot(null);
      } else {
        throw new Error(data.error?.message || 'Gagal membatalkan lot');
      }
    } catch (err: any) {
      setToast({ message: err.message, variant: 'danger' });
    } finally {
      setProcessingId(null);
    }
  };

  const handleNextLotInSequence = async () => {
    if (!nextPendingLot) {
      setToast({ message: 'Tidak ada lot pending berikutnya dalam antrean sesi ini.', variant: 'danger' });
      return;
    }

    if (activeLot) {
      if (!confirm(`Ketok Palu lot #${activeLot.lot_number} dan langsung lanjutkan ke Lot #${nextPendingLot.lot_number}?`)) {
        return;
      }
      setProcessingId(activeLot.id);
      try {
        await handleCloseLot(activeLot.id);
        await new Promise((resolve) => setTimeout(resolve, 600));
        await handleActivateLot(nextPendingLot.id);
      } catch (err: any) {
        setToast({ message: err.message || 'Gagal beralih ke lot berikutnya', variant: 'danger' });
      }
    } else {
      await handleActivateLot(nextPendingLot.id);
    }
  };

  const handleModeChange = async (mode: 'admin' | 'auto') => {
    setNextLotAdvanceMode(mode);
    try {
      await apiFetch('/admin/settings/auction_next_lot_trigger', {
        method: 'PUT',
        body: JSON.stringify({ value: mode }),
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleEndSession = async () => {
    if (!confirm('Apakah Anda yakin ingin menghentikan sesi lelang ini? Semua lot pending akan dibatalkan.')) return;
    setProcessingId(selectedSessionId);
    setToast(null);
    try {
      const response = await apiFetch(`/admin/sessions/${selectedSessionId}/end`, { method: 'POST' });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || 'Gagal menghentikan sesi');
      }
      setToast({ message: 'Sesi lelang berhasil dihentikan.', variant: 'success' });
      // Patch the `sessions` list (not just sessionDetails) — the lots/socket effect
      // re-derives sessionDetails from `sessions` on every refreshTrigger bump, so if
      // only sessionDetails were patched here it would get clobbered back to the old
      // status as soon as the refetch below runs.
      setSessions((prev) => prev.map((s) => (s.id === selectedSessionId ? { ...s, status: 'closed' } : s)));
      setRefreshTrigger((prev) => prev + 1);
    } catch (err: any) {
      setToast({ message: err.message, variant: 'danger' });
    } finally {
      setProcessingId(null);
    }
  };

  const handleStartSession = async () => {
    if (!confirm('Apakah Anda yakin ingin memulai sesi lelang ini?')) return;
    setProcessingId(selectedSessionId);
    setToast(null);
    try {
      const response = await apiFetch(`/admin/sessions/${selectedSessionId}/start`, { method: 'POST' });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || 'Gagal memulai sesi');
      }
      setToast({ message: 'Sesi lelang berhasil dimulai.', variant: 'success' });
      setSessions((prev) => prev.map((s) => (s.id === selectedSessionId ? { ...s, status: 'live' } : s)));
      setRefreshTrigger((prev) => prev + 1);
    } catch (err: any) {
      setToast({ message: err.message, variant: 'danger' });
    } finally {
      setProcessingId(null);
    }
  };

  // --- Offline Simulation Handler (manual, opt-in only — never triggered automatically) ---
  const simulateIncomingBid = () => {
    if (!activeLot) return;
    const increment = currentPrice < 50000000 ? 1000000 : 2500000;
    const newPrice = currentPrice + increment;
    setCurrentPrice(newPrice);
    setBidsCount((prev) => prev + 1);
    const mockBidder = `Peserta #${Math.floor(1000 + Math.random() * 9000).toString(16).toUpperCase()}`;
    setHighestBidder(mockBidder);
    
    // Check anti-sniping simulation
    if (timeRemaining < 30 && extensionCount < 3) {
      setTimeRemaining(120);
      setExtensionCount((prev) => prev + 1);
      setIsExtended(true);
      setToast({ message: '[Simulasi] Anti-sniping aktif! Waktu diperpanjang 120s.', variant: 'success' });
    }

    setBidLogs((prev) => [
      {
        id: String(Date.now()),
        bidder_id: mockBidder,
        amount: newPrice,
        time: new Date().toLocaleTimeString('id-ID'),
      },
      ...prev,
    ]);
  };

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(val);
  };

  const getLotStatusBadge = (status: Lot['status']) => {
    switch (status) {
      case 'sold':
        return <Badge variant="success">SOLD</Badge>;
      case 'unsold':
        return <Badge variant="default">UNSOLD</Badge>;
      case 'active':
        return <Badge variant="danger">🔴 ACTIVE</Badge>;
      case 'pending':
        return <Badge variant="warning">PENDING</Badge>;
      case 'cancelled':
        return <Badge variant="default">CANCELLED</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  return (
    <DashboardLayout breadcrumbParent="Lelang" breadcrumbCurrent="Ruang Kontrol">
      {toast && (
        <Toast
          message={toast.message}
          variant={toast.variant}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header Toolbar */}
      <div className="toolbar">
        <div className="toolbar-left">
          <h1 className="page-title">Ruang Kontrol Operator Lelang (AD5)</h1>
          <p className="page-subtitle">Kontrol antrean lot, saksikan bidding real-time, dan lakukan ketok palu.</p>
        </div>
        <div className="toolbar-right">
          <div className="d-flex align-center gap-1">
            <span style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Pilih Sesi:</span>
            <select
              className="form-select"
              style={{ height: '36px', width: '250px', background: 'white', border: '1px solid var(--wf-border)', borderRadius: 'var(--radius)' }}
              value={selectedSessionId}
              onChange={(e) => setSelectedSessionId(e.target.value)}
            >
              {sessions.map((s) => {
                const isAnyLive = sessions.some(session => session.status === 'live');
                const isDisabled = isAnyLive && s.status !== 'live';
                return (
                  <option key={s.id} value={s.id} disabled={isDisabled}>
                    {s.title} ({s.scheduled_at ? new Date(s.scheduled_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}) [{s.status.toUpperCase()}]
                  </option>
                );
              })}
            </select>
            {activeTab === 'live' && sessionDetails && (sessionDetails.status.toLowerCase() === 'published' || sessionDetails.status.toLowerCase() === 'pending') && sessionStartTrigger === 'admin' && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleStartSession}
                disabled={processingId === selectedSessionId}
              >
                Mulai Lelang
              </Button>
            )}
            {activeTab === 'live' && sessionDetails && (sessionDetails.status.toLowerCase() === 'published' || sessionDetails.status.toLowerCase() === 'pending' || sessionDetails.status.toLowerCase() === 'live') && (
              <Button
                variant="danger"
                size="sm"
                onClick={handleEndSession}
                disabled={processingId === selectedSessionId}
              >
                Stop Lelang
              </Button>
            )}
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--wf-border)', display: 'flex', gap: '1rem' }}>
        <button
          onClick={() => setActiveTab('live')}
          style={{
            padding: '0.75rem 1.5rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'live' ? '2px solid var(--wf-primary)' : '2px solid transparent',
            color: activeTab === 'live' ? 'var(--wf-primary)' : 'var(--wf-text-light)',
            fontWeight: activeTab === 'live' ? 'bold' : 'normal',
            cursor: 'pointer',
            fontSize: '1rem'
          }}
        >
          🔴 Live Control
        </button>
        <button
          onClick={() => setActiveTab('arsip')}
          style={{
            padding: '0.75rem 1.5rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'arsip' ? '2px solid var(--wf-primary)' : '2px solid transparent',
            color: activeTab === 'arsip' ? 'var(--wf-primary)' : 'var(--wf-text-light)',
            fontWeight: activeTab === 'arsip' ? 'bold' : 'normal',
            cursor: 'pointer',
            fontSize: '1rem'
          }}
        >
          📂 Arsip Lelang
        </button>
      </div>

      {activeTab === 'live' ? (
        <>
          {/* BAR KONTROL MODE LOT BERIKUTNYA & TOMBOL NEXT LOT */}
          <div style={{
            padding: '1rem 1.25rem',
            background: '#f8fafc',
            border: '1px solid var(--wf-border)',
            borderRadius: 'var(--radius)',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem',
            marginBottom: '1.25rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--wf-text)' }}>
                ⚙️ Lot Berikutnya Dilanjutkan Oleh:
              </span>
              <select
                value={nextLotAdvanceMode}
                onChange={(e) => handleModeChange(e.target.value as 'admin' | 'auto')}
                style={{
                  padding: '0.45rem 0.85rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  background: '#ffffff',
                  cursor: 'pointer'
                }}
              >
                <option value="admin">👤 Admin (Manual)</option>
                <option value="auto">🤖 Otomatis (System)</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {nextLotAdvanceMode === 'admin' && (
                <Button
                  variant="primary"
                  size="sm"
                  disabled={!nextPendingLot || processingId === (nextPendingLot?.id || '') || sessionDetails?.status !== 'live'}
                  onClick={handleNextLotInSequence}
                  style={{
                    backgroundColor: '#2563eb',
                    borderColor: '#2563eb',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontWeight: 700,
                    padding: '0.5rem 1.1rem'
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>skip_next</span>
                  {nextPendingLot ? `Next Lot (Mulai Lot #${nextPendingLot.lot_number})` : 'Next Lot (Tidak Ada Lot Pending)'}
                </Button>
              )}
            </div>
          </div>

          <AuctionRoomSimulation />
          <div className="grid-2-1" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        {/* LEFT COLUMN: ACTIVE BIDDING & QUEUE */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* ACTIVE LOT WORKSPACE */}
          <Card title="Lot Aktif (Bidding Workspace)">
            {activeLot ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Timer and Main Stats */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '1.5rem',
                    background: 'var(--wf-bg)',
                    borderRadius: 'var(--radius)',
                    borderLeft: '4px solid var(--wf-primary)',
                  }}
                >
                  <div>
                    <span className="text-muted" style={{ fontSize: '0.8rem', textTransform: 'uppercase' }}>Lot #{activeLot.lot_number}</span>
                    <h2 style={{ fontSize: '1.3rem', margin: '0.2rem 0' }}>{activeLot.asset.title}</h2>
                    <span style={{ fontSize: '0.85rem' }} className="badge badge-outline">{activeLot.asset.category.toUpperCase()}</span>
                  </div>

                  {/* Countdown Timer */}
                  <div style={{ textAlign: 'center' }}>
                    <div className="text-muted" style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>SISA WAKTU</div>
                    <div
                      style={{
                        fontSize: '3.5rem',
                        fontWeight: '800',
                        fontFamily: 'monospace',
                        lineHeight: '1',
                        color: timeRemaining < 10 ? 'var(--wf-danger)' : 'var(--wf-text)',
                        animation: timeRemaining < 10 ? 'pulse 1s infinite' : 'none',
                      }}
                    >
                      {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
                    </div>
                    {isExtended && (
                      <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>
                        ⏳ Ext. {extensionCount}/3 (Anti-Snipe)
                      </span>
                    )}
                  </div>
                </div>

                {/* Primary Photo */}
                {(() => {
                  const photos = getAssetImages(activeLot.asset);
                  if (photos.length === 0) return null;
                  return (
                    <div style={{
                      width: '100%',
                      height: '220px',
                      borderRadius: 'var(--radius)',
                      overflow: 'hidden',
                      border: '1px solid var(--wf-border)',
                      background: '#f8f9fa'
                    }}>
                      <img 
                        src={getImageUrl(photos[0])} 
                        alt={activeLot.asset.title} 
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      />
                    </div>
                  );
                })()}

                {/* Pricing and Highest Bidder Info */}
                <div className="grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                  <div className="kpi-card" style={{ padding: '1rem', border: '1px solid var(--wf-border)' }}>
                    <div className="kpi-label">Harga Awal</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{formatRupiah(activeLot.starting_price)}</div>
                  </div>
                  <div className="kpi-card success" style={{ padding: '1rem' }}>
                    <div className="kpi-label">Harga Tertinggi</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--wf-success)' }}>{formatRupiah(currentPrice)}</div>
                  </div>
                  <div className="kpi-card" style={{ padding: '1rem', border: '1px solid var(--wf-border)' }}>
                    <div className="kpi-label">Penawar Tertinggi</div>
                    {highestBidder === '-' ? (
                      <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>-</div>
                    ) : (
                      <div>
                        <div style={{ fontSize: '1rem', fontWeight: 'bold' }}>{highestBidderName}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--wf-text-light)', marginTop: '2px', wordBreak: 'break-all' }}>
                          {highestBidder} · <code style={{ background: '#f1f5f9', padding: '1px 4px', borderRadius: '4px', fontWeight: 'bold' }}>{highestBidderNipl}</code>
                        </div>
                      </div>
                    )}
                    <span className="text-muted" style={{ fontSize: '0.8rem', display: 'block', marginTop: '4px' }}>Total: {bidsCount} Bid</span>
                  </div>
                </div>

                {/* Operator Actions for Lot */}
                <div className="d-flex justify-between align-center" style={{ borderTop: '1px solid var(--wf-border)', paddingTop: '1rem' }}>
                  <div>
                    {socketRef.current?.disconnected && (
                      <Button variant="outline" size="sm" onClick={simulateIncomingBid} className="mr-1">
                        ⚡ Simulasikan Bid Masuk
                      </Button>
                    )}
                  </div>
                  <div className="d-flex gap-1" style={{ alignItems: 'center' }}>
                    <Button variant="outline" onClick={() => handleCancelLot(activeLot.id)} disabled={processingId === activeLot.id} style={{ borderColor: 'var(--wf-danger)', color: 'var(--wf-danger)' }}>
                      ❌ Batalkan Lot
                    </Button>
                    <Button variant="danger" onClick={() => handleCloseLot(activeLot.id)} disabled={processingId === activeLot.id}>
                      🔨 Ketok Palu (Close Lot)
                    </Button>
                    {nextPendingLot && (
                      <Button
                        variant="primary"
                        onClick={handleNextLotInSequence}
                        disabled={processingId === activeLot.id || processingId === nextPendingLot.id}
                        style={{ backgroundColor: '#2563eb', borderColor: '#2563eb', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>skip_next</span>
                        Ketok Palu & Next Lot (#{nextPendingLot.lot_number})
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ padding: '3rem 0', textAlign: 'center', color: 'var(--wf-text-light)' }}>
                <span style={{ fontSize: '3rem' }}>💤</span>
                <h3 className="mt-2">Tidak Ada Lot Aktif</h3>
                <p style={{ fontSize: '0.9rem' }} className="mb-2">
                  {nextPendingLot
                    ? `Lot berikutnya dalam urutan antrean adalah Lot #${nextPendingLot.lot_number} (${nextPendingLot.asset.title})`
                    : 'Semua lot dalam sesi ini telah selesai.'}
                </p>
                {nextPendingLot && sessionDetails?.status === 'live' && (
                  <Button
                    variant="primary"
                    size="md"
                    onClick={handleNextLotInSequence}
                    disabled={processingId === nextPendingLot.id}
                    style={{ backgroundColor: '#2563eb', borderColor: '#2563eb', display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '0.5rem' }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>play_arrow</span>
                    Mulai Next Lot (#{nextPendingLot.lot_number})
                  </Button>
                )}
              </div>
            )}
          </Card>

          {/* LOT LIST QUEUE */}
          <Card title="Antrean Lot Lelang Sesi Ini">
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Lot</th>
                    <th>Tgl Lelang</th>
                    <th>Jam Lelang</th>
                    <th>Lokasi</th>
                    <th>Kendaraan</th>
                    <th>Harga Limit</th>
                    <th>Status</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {lots.map((lot) => (
                    <tr key={lot.id} className={lot.status === 'active' ? 'bg-light-red' : ''}>
                      <td>
                        <strong>#{lot.lot_number}</strong>
                      </td>
                      <td>
                        {lot.session ? new Date((lot as any).session.scheduled_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        }) : '-'}
                      </td>
                      <td>
                        {lot.session ? new Date((lot as any).session.scheduled_at).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : '-'}
                      </td>
                      <td>
                        {(lot as any).session?.branch ? `${(lot as any).session.branch.name}, ${(lot as any).session.branch.city}` : '-'}
                      </td>
                      <td>
                        <strong>{lot.asset.title}</strong>
                      </td>
                      <td>{formatRupiah(lot.starting_price)}</td>
                      <td>{getLotStatusBadge(lot.status)}</td>
                      <td>
                        {lot.status === 'pending' && (
                          <Button
                            variant="primary"
                            size="sm"
                            disabled={!!activeLot || processingId === lot.id || sessionDetails?.status !== 'live'}
                            onClick={() => handleActivateLot(lot.id)}
                          >
                            Lot Berikutnya
                          </Button>
                        )}
                        {lot.status === 'active' && (
                          <div className="d-flex gap-1">
                            <Button
                              variant="danger"
                              size="sm"
                              disabled={processingId === lot.id}
                              onClick={() => handleCloseLot(lot.id)}
                            >
                              Ketok Palu
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={processingId === lot.id}
                              onClick={() => handleCancelLot(lot.id)}
                              style={{ borderColor: 'var(--wf-danger)', color: 'var(--wf-danger)' }}
                            >
                              Batal
                            </Button>
                          </div>
                        )}
                        {lot.status !== 'pending' && lot.status !== 'active' && (
                          <span className="text-muted" style={{ fontSize: '0.85rem' }}>Selesai</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* RIGHT COLUMN: REAL-TIME BID LOG */}
        <Card title="Live Penawaran (Bids Log)" className="h-100">
          <div
            style={{
              maxHeight: '400px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
            }}
          >
            {bidLogs.length === 0 ? (
              <div style={{ padding: '2rem 0', color: 'var(--wf-text-light)' }} className="text-center">
                Belum ada bid masuk untuk lot aktif ini.
              </div>
            ) : (
              bidLogs.map((log) => (
                <div
                  key={log.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.6rem 0.75rem',
                    background: 'var(--wf-bg)',
                    borderRadius: '4px',
                    fontSize: '0.9rem',
                    borderLeft: '3px solid var(--wf-success)',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexWrap: 'wrap' }}>
                      <strong style={{ fontSize: '0.9rem' }}>{log.bidder_name || 'Anonymous'}</strong>
                      <span className="text-muted" style={{ fontSize: '0.75rem' }}>({log.bidder_id})</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--wf-text-light)', marginTop: '2px', flexWrap: 'wrap' }}>
                      <code style={{ background: '#e2e8f0', padding: '1px 4px', borderRadius: '3px', fontWeight: '600' }}>{log.nipl_code || '-'}</code>
                      <span>·</span>
                      <span>{log.time}</span>
                    </div>
                  </div>
                  <strong style={{ color: 'var(--wf-success)' }}>{formatRupiah(log.amount)}</strong>
                </div>
              ))
            )}
          </div>
        </Card>
          </div>
        </>
      ) : (
        <Card title={`Arsip Sesi: ${sessionDetails?.title || '-'}`}>
          {sessionDetails?.status !== 'closed' ? (
            <div style={{ padding: '3rem 0', textAlign: 'center', color: 'var(--wf-text-light)' }}>
              <span style={{ fontSize: '3rem' }}>📂</span>
              <h3 className="mt-2">Sesi Belum Selesai</h3>
              <p style={{ fontSize: '0.9rem' }}>Silakan pilih sesi dengan status [CLOSED] untuk melihat arsip lelang.</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Lot</th>
                    <th>Kendaraan</th>
                    <th>Harga Limit</th>
                    <th>Harga Terakhir (Hammer)</th>
                    <th>Pemenang</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {lots.map((lot) => (
                    <tr key={lot.id}>
                      <td><strong>#{lot.lot_number}</strong></td>
                      <td>{lot.asset.title}</td>
                      <td>{formatRupiah(lot.starting_price)}</td>
                      <td>{lot.hammer_price ? formatRupiah(lot.hammer_price) : '-'}</td>
                      <td>{lot.winner_id ? 'Pemenang ID: ' + lot.winner_id : '-'}</td>
                      <td>{getLotStatusBadge(lot.status)}</td>
                    </tr>
                  ))}
                  {lots.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '1rem' }}>Tidak ada lot dalam sesi ini.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {winnerModalData && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(4px)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div
            style={{
              backgroundColor: '#1e293b',
              color: '#ffffff',
              borderRadius: '16px',
              padding: '2rem',
              maxWidth: '500px',
              width: '100%',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5), 0 0 30px rgba(34, 197, 94, 0.25)',
              border: '2px solid #22c55e',
              position: 'relative',
              animation: 'fadeIn 0.2s ease-out',
            }}
          >
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '3rem', lineHeight: '1', marginBottom: '0.5rem' }}>🏆</div>
              <h2 style={{ color: '#4ade80', fontSize: '1.35rem', fontWeight: 800, margin: 0, letterSpacing: '0.5px' }}>
                LOT #{winnerModalData.lot_number} DIMENANGKAN!
              </h2>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '0.35rem' }}>
                Lot #{winnerModalData.lot_number} ini dimenangkan oleh:
              </p>
            </div>

            {/* Details List */}
            <div
              style={{
                backgroundColor: '#0f172a',
                borderRadius: '12px',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                border: '1px solid #334155',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>🚗 Nama Mobil / Unit:</span>
                <span style={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.95rem', textAlign: 'right' }}>
                  {winnerModalData.asset_title}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>👤 Nama Bidder:</span>
                <span style={{ fontWeight: 700, color: '#60a5fa', fontSize: '0.95rem', textAlign: 'right' }}>
                  {winnerModalData.winner_name}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>🎟️ No NIPL:</span>
                <span
                  style={{
                    fontWeight: 700,
                    color: '#f59e0b',
                    backgroundColor: 'rgba(245, 158, 11, 0.15)',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                  }}
                >
                  {winnerModalData.winner_nipl}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>💰 Harga Dasar:</span>
                <span style={{ fontWeight: 600, color: '#cbd5e1', fontSize: '0.9rem' }}>
                  {formatRupiah(winnerModalData.base_price)}
                </span>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: '0.6rem',
                  borderTop: '1px dashed #334155',
                }}
              >
                <span style={{ color: '#4ade80', fontWeight: 700, fontSize: '0.95rem' }}>🔨 Harga Terbentuk:</span>
                <span style={{ fontSize: '1.3rem', fontWeight: 800, color: '#4ade80' }}>
                  {formatRupiah(winnerModalData.final_price)}
                </span>
              </div>
            </div>

            {/* Countdown timer & Close button */}
            <div style={{ marginTop: '1.25rem', textAlign: 'center' }}>
              <div style={{ height: '6px', backgroundColor: '#334155', borderRadius: '3px', overflow: 'hidden', marginBottom: '0.75rem' }}>
                <div
                  style={{
                    height: '100%',
                    backgroundColor: '#22c55e',
                    width: `${(popupSecondsLeft / 5) * 100}%`,
                    transition: 'width 1s linear',
                  }}
                />
              </div>
              <p style={{ color: '#94a3b8', fontSize: '0.8rem', marginBottom: '0.75rem' }}>
                Popup tertutup otomatis dalam <strong style={{ color: '#ffffff' }}>{popupSecondsLeft} detik</strong>
              </p>
              <button
                type="button"
                onClick={() => setWinnerModalData(null)}
                style={{
                  backgroundColor: '#334155',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.5rem 1.5rem',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                }}
              >
                Tutup (Esc)
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
        .bg-light-red {
          background-color: #fff5f5 !important;
        }
      `}</style>
    </DashboardLayout>
  );
}
