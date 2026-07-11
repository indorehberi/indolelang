'use client';

import React, { useEffect, useState, useRef } from 'react';
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
  amount: number;
  time: string;
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
  
  // Real-time Active Lot State
  const [activeLot, setActiveLot] = useState<Lot | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [highestBidder, setHighestBidder] = useState<string>('-');
  const [bidsCount, setBidsCount] = useState<number>(0);
  const [extensionCount, setExtensionCount] = useState<number>(0);
  const [isExtended, setIsExtended] = useState<boolean>(false);
  
  const [bidLogs, setBidLogs] = useState<BidLog[]>([]);
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'danger' } | null>(null);

  const socketRef = useRef<Socket | null>(null);

  // Dummy Fallbacks


  // Fetch Session List on mount
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [resSessions, resSettings] = await Promise.all([
          apiFetch('/sessions?per_page=50'),
          apiFetch('/admin/settings/auction_session_start_trigger')
        ]);

        if (resSettings.ok) {
          const settingsData = await resSettings.json();
          if (settingsData.success && settingsData.data) {
            setSessionStartTrigger(settingsData.data.value as 'admin' | 'system');
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

  // Fetch Lots when session changes & Connect Socket
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
            setCurrentPrice(active.starting_price);
            watchLotSocket(active.id);
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

    // Setup Socket Connection — refresh the access token first so the socket
    // doesn't connect with a token that's already expired (sockets can't
    // benefit from apiFetch's automatic 401 refresh-and-retry).
    const attachSocketListeners = (socket: Socket) => {
      socket.on('connect', () => {
        loggerDebug('Connected to WebSocket server');
        // Watch session ended room
        socket.emit('bid:watch', { session_id: selectedSessionId });
      });

      socket.on('lot:activated', (data: any) => {
        setToast({ message: `Lot #${data.lot_data.lot_number} telah diaktifkan!`, variant: 'success' });
        // Update lots list status
        setLots((prevLots) =>
          prevLots.map((l) =>
            l.id === data.lot_id ? { ...l, status: 'active' } : l
          )
        );

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
        setExtensionCount(0);
        setIsExtended(false);
        setBidLogs([]);
      });

      socket.on('bid:update', (data: any) => {
        setCurrentPrice(data.current_price);
        setHighestBidder(data.bidder_id);
        setBidsCount(data.bidder_count);
        setTimeRemaining(data.time_remaining);
        setExtensionCount(data.extension_count);
        setIsExtended(data.extended || false);

        if (data.extended) {
          setToast({ message: `Waktu penawaran diperpanjang! (Anti-Sniping)`, variant: 'success' });
        }

        // Add to logs if price changed and not empty bidder
        if (data.bidder_id && data.bidder_id !== '-') {
          setBidLogs((prev) => [
            {
              id: String(Date.now()),
              bidder_id: data.bidder_id,
              amount: data.current_price,
              time: new Date().toLocaleTimeString('id-ID'),
            },
            ...prev,
          ]);
        }
      });

      socket.on('lot:closed', (data: any) => {
        setToast({
          message: `Lot ditutup! Status: ${data.result === 'sold' ? 'SOLD (Terjual)' : 'UNSOLD'}`,
          variant: data.result === 'sold' ? 'success' : 'danger',
        });

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
      }
    };
  }, [selectedSessionId, sessions, refreshTrigger]);

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

                {/* Photos */}
                {(() => {
                  const photos = getAssetImages(activeLot.asset);
                  if (photos.length === 0) return null;
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div style={{
                        width: '100%',
                        height: '300px',
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
                      {photos.length > 1 && (
                        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                          {photos.slice(1).map((imgUrl, idx) => (
                            <div key={idx} style={{
                              width: '80px',
                              height: '60px',
                              borderRadius: '4px',
                              overflow: 'hidden',
                              border: '1px solid var(--wf-border)',
                              flexShrink: 0
                            }}>
                              <img 
                                src={getImageUrl(imgUrl)} 
                                alt={`Thumbnail ${idx}`} 
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            </div>
                          ))}
                        </div>
                      )}
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
                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{highestBidder}</div>
                    <span className="text-muted" style={{ fontSize: '0.8rem' }}>Total: {bidsCount} Bid</span>
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
                  <div className="d-flex gap-1">
                    <Button variant="outline" onClick={() => handleCancelLot(activeLot.id)} disabled={processingId === activeLot.id} style={{ borderColor: 'var(--wf-danger)', color: 'var(--wf-danger)' }}>
                      ❌ Batalkan Lot
                    </Button>
                    <Button variant="danger" onClick={() => handleCloseLot(activeLot.id)} disabled={processingId === activeLot.id}>
                      🔨 Ketok Palu (Close Lot)
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ padding: '3rem 0', textAlign: 'center', color: 'var(--wf-text-light)' }}>
                <span style={{ fontSize: '3rem' }}>💤</span>
                <h3 className="mt-2">Tidak Ada Lot Aktif</h3>
                <p style={{ fontSize: '0.9rem' }}>Pilih lot pending di bawah ini dan klik "Aktifkan Lot" untuk memulai bidding.</p>
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
                    <strong>{log.bidder_id}</strong>
                    <div style={{ fontSize: '0.75rem', color: 'var(--wf-text-light)' }}>{log.time}</div>
                  </div>
                  <strong style={{ color: 'var(--wf-success)' }}>{formatRupiah(log.amount)}</strong>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
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
