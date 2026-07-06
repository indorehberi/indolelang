'use client';

import React, { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import Toast from '../../../components/ui/Toast';
import { apiUrl, wsBaseUrl } from '../../../lib/api';

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
  };
  session?: any;
}

interface BidLog {
  id: string;
  bidder_id: string;
  amount: number;
  time: string;
}

export default function ControlRoomPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [sessionDetails, setSessionDetails] = useState<Session | null>(null);
  const [lots, setLots] = useState<Lot[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  
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
    const fetchSessions = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const response = await fetch(apiUrl('/sessions?per_page=50'), {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (response.ok && data.success) {
          const allSessions = data.data || [];
          setSessions(allSessions);
          if (allSessions.length > 0) {
            setSelectedSessionId(allSessions[0].id);
          }
        } else {
          setSessions([]);
        }
      } catch (err) {
        setSessions([]);
      }
    };
    fetchSessions();
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
        const token = localStorage.getItem('accessToken');
        const response = await fetch(apiUrl(`/lots?session_id=${selectedSessionId}&per_page=100`), {
          headers: { Authorization: `Bearer ${token}` },
        });
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

    // Setup Socket Connection
    const token = localStorage.getItem('accessToken');
    const socket = io(wsBaseUrl(), {
      auth: { token },
      transports: ['websocket'],
    });
    socketRef.current = socket;

    // Socket listeners
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

      // Set active lot state
      const targetLot = lots.find((l) => l.id === data.lot_id);
      if (targetLot) {
        setActiveLot({ ...targetLot, status: 'active' });
        setCurrentPrice(data.lot_data.starting_price);
        setTimeRemaining(data.duration);
        setBidsCount(0);
        setHighestBidder('-');
        setExtensionCount(0);
        setIsExtended(false);
        setBidLogs([]);
      }
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

    socket.on('session:ended', (data: any) => {
      setToast({ message: 'Sesi lelang resmi ditutup oleh operator!', variant: 'success' });
      if (sessionDetails) {
        setSessionDetails({ ...sessionDetails, status: 'closed' });
      }
    });

    socket.on('bid:error', (data: any) => {
      setToast({ message: data.message, variant: 'danger' });
    });

    return () => {
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
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(apiUrl(`/admin/lots/${lotId}/activate`), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || 'Gagal mengaktifkan lot');
      }
      
      // Update local state in case socket is delayed
      watchLotSocket(lotId);
      
      // Trigger simulation in fallback mode if socket is not connected
      if (socketRef.current?.disconnected) {
        simulateLotActive(lotId);
      }
    } catch (err: any) {
      setToast({ message: err.message, variant: 'danger' });
      // Offline fallback simulation
      simulateLotActive(lotId);
    } finally {
      setProcessingId(null);
    }
  };

  const handleCloseLot = async (lotId: string) => {
    setProcessingId(lotId);
    setToast(null);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(apiUrl(`/admin/lots/${lotId}/close`), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || 'Gagal menutup lot');
      }
    } catch (err: any) {
      setToast({ message: err.message, variant: 'danger' });
      simulateLotClose(lotId, 'sold');
    } finally {
      setProcessingId(null);
    }
  };

  const handleCancelLot = async (lotId: string) => {
    if (!confirm('Apakah Anda yakin ingin membatalkan lot yang sedang aktif ini? Status lot akan dikembalikan ke pending.')) return;
    setProcessingId(lotId);
    setToast(null);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(apiUrl(`/admin/lots/${lotId}/cancel`), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
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
    if (!confirm('Apakah Anda yakin ingin menutup sesi lelang ini? Semua lot pending akan dibatalkan.')) return;
    setProcessingId(selectedSessionId);
    setToast(null);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(apiUrl(`/admin/sessions/${selectedSessionId}/end`), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || 'Gagal menutup sesi');
      }
      setToast({ message: 'Sesi lelang berhasil ditutup.', variant: 'success' });
    } catch (err: any) {
      setToast({ message: err.message, variant: 'danger' });
      if (sessionDetails) {
        setSessionDetails({ ...sessionDetails, status: 'closed' });
      }
    } finally {
      setProcessingId(null);
    }
  };

  // --- Offline Simulation Handlers for Premium Demo Feel ---
  let simInterval: NodeJS.Timeout;
  const simulateLotActive = (lotId: string) => {
    const targetLot = lots.find((l) => l.id === lotId);
    if (!targetLot) return;

    setActiveLot({ ...targetLot, status: 'active' });
    setCurrentPrice(targetLot.starting_price);
    setTimeRemaining(120);
    setBidsCount(0);
    setHighestBidder('-');
    setExtensionCount(0);
    setIsExtended(false);
    setBidLogs([]);

    setLots((prev) => prev.map((l) => (l.id === lotId ? { ...l, status: 'active' } : l)));
    setToast({ message: `[Simulasi] Lot #${targetLot.lot_number} aktif!`, variant: 'success' });
  };

  const simulateLotClose = (lotId: string, result: 'sold' | 'unsold') => {
    setLots((prev) =>
      prev.map((l) =>
        l.id === lotId
          ? {
              ...l,
              status: result,
              hammer_price: result === 'sold' ? currentPrice : undefined,
              winner_id: result === 'sold' ? 'Peserta #3CD1' : undefined,
            }
          : l
      )
    );
    setActiveLot(null);
    setToast({
      message: `[Simulasi] Lot ditutup! Status: ${result === 'sold' ? 'SOLD (Terjual)' : 'UNSOLD'}`,
      variant: result === 'sold' ? 'success' : 'danger',
    });
  };

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
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title} ({s.scheduled_at ? new Date(s.scheduled_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}) [{s.status.toUpperCase()}]
                </option>
              ))}
            </select>
            {sessionDetails && sessionDetails.status !== 'closed' && (
              <Button
                variant="danger"
                size="sm"
                onClick={handleEndSession}
                disabled={processingId === selectedSessionId}
              >
                Tutup Sesi
              </Button>
            )}
          </div>
        </div>
      </div>

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
                    <span className="text-muted" style={{ fontSize: '0.8rem', textTransform: 'uppercase' }}>Lot #${activeLot.lot_number}</span>
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
                            disabled={!!activeLot || processingId === lot.id}
                            onClick={() => handleActivateLot(lot.id)}
                          >
                            Aktifkan Lot
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
