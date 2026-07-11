'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import Card from '../../../components/ui/Card';
import { apiUrl, apiFetch } from '../../../lib/api';
import { useToast } from '../../../providers/ToastProvider';

interface UnassignedAsset {
  id: string;
  title: string;
  category: string;
  base_price: number;
  provider?: { company_name?: string; full_name?: string };
}

interface Session {
  id: string;
  title: string;
  scheduled_at: string;
}

interface Lot {
  id: string;
  lot_number: number;
  starting_price: number;
  asset?: { title: string };
}

export default function LotPlanningPage() {
  const toast = useToast();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [assets, setAssets] = useState<UnassignedAsset[]>([]);
  const [lots, setLots] = useState<Lot[]>([]);
  const [selectedSession, setSelectedSession] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // Add-to-lot modal state
  const [addingAsset, setAddingAsset] = useState<UnassignedAsset | null>(null);
  const [lotMode, setLotMode] = useState<'otomatis' | 'manual'>('otomatis');
  const [manualLotNumber, setManualLotNumber] = useState('');

  // Filters for assets
  const [filterProvider, setFilterProvider] = useState<string>('');
  const [filterPoliceNumber, setFilterPoliceNumber] = useState<string>('');
  const [providers, setProviders] = useState<{id: string, full_name?: string, company_name?: string}[]>([]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const querySessionId = urlParams.get('session_id');

        const [resSessions, resAssets, resProviders] = await Promise.all([
          fetch(apiUrl('/sessions')),
          apiFetch(`/assets?status=approved&per_page=100${filterProvider ? `&provider_id=${filterProvider}` : ''}${filterPoliceNumber ? `&police_number=${filterPoliceNumber}` : ''}`),
          apiFetch('/admin/users?role=provider&per_page=100')
        ]);

        if (resSessions.ok) {
          const data = await resSessions.json();
          setSessions(data.data || []);
          if (querySessionId) {
            setSelectedSession(querySessionId);
          } else if (data.data?.length > 0) {
            setSelectedSession(data.data[0].id);
          }
        }

        if (resAssets.ok) {
          const data = await resAssets.json();
          setAssets(data.data || []);
        }

        if (resProviders.ok) {
          const data = await resProviders.json();
          setProviders(data.data || []);
        }
      } catch (err) {}
    };
    fetchInitialData();
  }, []);

  const fetchLots = async () => {
    if (!selectedSession) return;
    try {
      const resLots = await fetch(apiUrl(`/lots?session_id=${selectedSession}`));
      if (resLots.ok) {
        const data = await resLots.json();
        setLots(data.data || []);
      }
    } catch (err) {}
  };

  useEffect(() => {
    fetchLots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSession]);

  const refetchApprovedAssets = async () => {
    try {
      const resAssets = await apiFetch(`/assets?status=approved&per_page=100${filterProvider ? `&provider_id=${filterProvider}` : ''}${filterPoliceNumber ? `&police_number=${filterPoliceNumber}` : ''}`);
      if (resAssets.ok) {
        const data = await resAssets.json();
        setAssets(data.data || []);
      }
    } catch (err) {}
  };

  useEffect(() => {
    refetchApprovedAssets();
  }, [filterProvider, filterPoliceNumber]);

  const openAddLotModal = (asset: UnassignedAsset) => {
    setAddingAsset(asset);
    setLotMode('otomatis');
    setManualLotNumber('');
  };

  const handleConfirmAddLot = async () => {
    if (!addingAsset || !selectedSession) return;
    if (lotMode === 'manual' && !manualLotNumber.trim()) {
      toast.warning('Masukkan nomor lot terlebih dahulu.');
      return;
    }

    setLoading(true);
    try {
      const body: any = {
        session_id: selectedSession,
        asset_id: addingAsset.id,
        starting_price: addingAsset.base_price,
      };
      if (lotMode === 'manual') {
        body.lot_number = parseInt(manualLotNumber, 10);
      }

      const res = await apiFetch('/admin/lots', {
        method: 'POST',
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setAddingAsset(null);
        await Promise.all([fetchLots(), refetchApprovedAssets()]);
      } else {
        toast.error(data.error?.message || 'Gagal menambahkan lot');
      }
    } catch (err) {
      toast.error('Terjadi kesalahan sistem');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLot = async (lot: Lot) => {
    if (!confirm(`Hapus Lot #${lot.lot_number} (${lot.asset?.title || 'unit ini'}) dari sesi? Aset akan kembali ke daftar Approved.`)) return;
    setLoading(true);
    try {
      const res = await apiFetch(`/admin/lots/${lot.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.success) {
        await Promise.all([fetchLots(), refetchApprovedAssets()]);
      } else {
        toast.error(data.error?.message || 'Gagal menghapus lot');
      }
    } catch (err) {
      toast.error('Terjadi kesalahan sistem');
    } finally {
      setLoading(false);
    }
  };

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(val);
  };

  return (
    <DashboardLayout breadcrumbParent="Katalog" breadcrumbCurrent="Penyusunan Lot">
      <div className="toolbar">
        <div className="toolbar-left">
          <h1 className="page-title">Penyusunan Lot & Antrean Lelang</h1>
          <p className="page-subtitle">Pilih sesi lelang dan masukkan unit aset titipan provider yang berstatus approved ke dalam nomor urut lot.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Left column: Choose session and show assigned lots */}
        <div>
          <Card>
            <h2 className="card-title">1. Pilih Sesi Lelang</h2>
            <div className="form-group mb-3">
              <label>Sesi Lelang Aktif / Terjadwal</label>
              <select className="form-select" value={selectedSession} onChange={(e) => setSelectedSession(e.target.value)}>
                {sessions.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.title} ({new Date(s.scheduled_at).toLocaleDateString('id-ID')})
                  </option>
                ))}
              </select>
            </div>

            <hr />

            <h3 className="card-title" style={{ fontSize: '1rem', marginTop: '1rem' }}>Daftar Lot Terdaftar (Sesi Terpilih)</h3>
            <div className="table-wrapper" style={{ maxHeight: '350px', overflowY: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th style={{ width: '60px' }}>Lot #</th>
                    <th>Nama Unit Aset</th>
                    <th>Harga Limit</th>
                    <th style={{ textAlign: 'center' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {lots.length === 0 ? (
                    <tr><td colSpan={4} className="text-center text-muted">Belum ada lot</td></tr>
                  ) : (
                    lots.map(lot => (
                      <tr key={lot.id}>
                        <td><strong>{String(lot.lot_number).padStart(2, '0')}</strong></td>
                        <td>{lot.asset?.title || 'Unknown Asset'}</td>
                        <td>{formatRupiah(lot.starting_price)}</td>
                        <td style={{ textAlign: 'center' }}>
                          <button className="btn btn-xs btn-danger" disabled={loading} onClick={() => handleDeleteLot(lot)}>Hapus</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Right column: List of approved assets that can be assigned */}
        <div>
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h2 className="card-title mb-1">2. Aset Siap Dilelang (Approved)</h2>
                <p className="text-muted" style={{ fontSize: '0.85rem' }}>Klik tombol tambahkan untuk memasukkan aset ke sesi lelang aktif.</p>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <select 
                  className="form-select form-select-sm" 
                  value={filterProvider} 
                  onChange={(e) => setFilterProvider(e.target.value)}
                  style={{ minWidth: '150px' }}
                >
                  <option value="">Semua Provider</option>
                  {providers.map(p => (
                    <option key={p.id} value={p.id}>{p.company_name || p.full_name || 'Tanpa Nama'}</option>
                  ))}
                </select>
                <input 
                  type="text" 
                  className="form-input form-input-sm" 
                  placeholder="Cari No Polisi..." 
                  value={filterPoliceNumber}
                  onChange={(e) => setFilterPoliceNumber(e.target.value)}
                  style={{ width: '130px' }}
                />
              </div>
            </div>

            <div className="table-wrapper" style={{ marginTop: '1.25rem' }}>
              <table>
                <thead>
                  <tr>
                    <th>Nama Barang</th>
                    <th>Kategori</th>
                    <th>No Polisi</th>
                    <th>Harga Limit</th>
                    <th>Provider</th>
                    <th style={{ textAlign: 'center' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {assets.map((ast: any) => (
                    <tr key={ast.id}>
                      <td>
                        <strong>{ast.title}</strong>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.75rem', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase', background: ast.category === 'mobil' ? '#ebf8ff' : '#fefcbf', color: ast.category === 'mobil' ? '#2b6cb0' : '#b7791f' }}>
                          {ast.category}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.85rem' }}>{ast.police_number || '-'}</td>
                      <td><strong>{formatRupiah(ast.base_price)}</strong></td>
                      <td style={{ fontSize: '0.85rem' }}>{ast.provider?.company_name || ast.provider?.full_name || 'Provider'}</td>
                      <td style={{ textAlign: 'center' }}>
                        <button className="btn btn-xs btn-success" onClick={() => openAddLotModal(ast)} disabled={loading}>+ Lot</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>

      {/* ADD TO LOT MODAL */}
      {addingAsset && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <Card>
            <h3 style={{ marginBottom: '0.5rem' }}>Tambahkan ke Lot</h3>
            <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>{addingAsset.title}</p>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', cursor: 'pointer' }}>
                <input type="radio" checked={lotMode === 'otomatis'} onChange={() => setLotMode('otomatis')} />
                <span>Otomatis (nomor lot berikutnya yang tersedia)</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input type="radio" checked={lotMode === 'manual'} onChange={() => setLotMode('manual')} />
                <span>Manual</span>
              </label>
              {lotMode === 'manual' && (
                <input
                  type="number"
                  min={1}
                  value={manualLotNumber}
                  onChange={(e) => setManualLotNumber(e.target.value)}
                  placeholder="Masukkan nomor lot"
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px', marginTop: '0.5rem' }}
                />
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button className="btn btn-outline" onClick={() => setAddingAsset(null)}>Batal</button>
              <button className="btn btn-primary" disabled={loading} onClick={handleConfirmAddLot}>
                {loading ? 'Memproses...' : 'Tambahkan'}
              </button>
            </div>
          </Card>
        </div>
      )}
    </DashboardLayout>
  );
}
