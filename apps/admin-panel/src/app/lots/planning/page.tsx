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
  status?: string;
}

interface Lot {
  id: string;
  lot_number: number;
  starting_price: number;
  status?: string;
  asset?: { title: string; police_number?: string };
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

  // Filters and pagination for sessions/lots (Part 1)
  const [searchLotsPolice, setSearchLotsPolice] = useState('');
  const [filterLotsProvider, setFilterLotsProvider] = useState('');
  const [lotsPage, setLotsPage] = useState(1);
  const [lotsTotalPages, setLotsTotalPages] = useState(1);
  const [lotsTotalCount, setLotsTotalCount] = useState(0);

  // Filters and pagination for approved assets (Part 2)
  const [filterProvider, setFilterProvider] = useState<string>('');
  const [filterPoliceNumber, setFilterPoliceNumber] = useState<string>('');
  const [providers, setProviders] = useState<{id: string, full_name?: string, company_name?: string}[]>([]);
  const [assetsPage, setAssetsPage] = useState(1);
  const [assetsTotalPages, setAssetsTotalPages] = useState(1);
  const [assetsTotalCount, setAssetsTotalCount] = useState(0);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const querySessionId = urlParams.get('session_id');

        const [resSessions, resProviders] = await Promise.all([
          fetch(apiUrl('/sessions')),
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
      const query = new URLSearchParams({
        session_id: selectedSession,
        page: String(lotsPage),
        per_page: '100',
      });
      if (searchLotsPolice) query.append('police_number', searchLotsPolice);
      if (filterLotsProvider) query.append('provider_id', filterLotsProvider);

      const resLots = await fetch(apiUrl(`/lots?${query.toString()}`));
      if (resLots.ok) {
        const data = await resLots.json();
        setLots(data.data || []);
        if (data.meta) {
          setLotsTotalCount(data.meta.total || 0);
          setLotsTotalPages(Math.ceil((data.meta.total || 0) / 100) || 1);
        } else {
          setLotsTotalCount(data.data?.length || 0);
          setLotsTotalPages(1);
        }
      }
    } catch (err) {}
  };

  useEffect(() => {
    fetchLots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSession, lotsPage, searchLotsPolice, filterLotsProvider]);

  useEffect(() => {
    setLotsPage(1);
  }, [selectedSession, searchLotsPolice, filterLotsProvider]);

  const refetchApprovedAssets = async () => {
    try {
      const query = new URLSearchParams({
        status: 'approved',
        page: String(assetsPage),
        per_page: '50',
      });
      if (filterProvider) query.append('provider_id', filterProvider);
      if (filterPoliceNumber) query.append('police_number', filterPoliceNumber);

      const resAssets = await apiFetch(`/assets?${query.toString()}`);
      if (resAssets.ok) {
        const data = await resAssets.json();
        setAssets(data.data || []);
        if (data.meta) {
          setAssetsTotalCount(data.meta.total || 0);
          setAssetsTotalPages(Math.ceil((data.meta.total || 0) / 50) || 1);
        } else {
          setAssetsTotalCount(data.data?.length || 0);
          setAssetsTotalPages(1);
        }
      }
    } catch (err) {}
  };

  useEffect(() => {
    refetchApprovedAssets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterProvider, filterPoliceNumber, assetsPage]);

  useEffect(() => {
    setAssetsPage(1);
  }, [filterProvider, filterPoliceNumber]);

  const openAddLotModal = (asset: UnassignedAsset) => {
    setAddingAsset(asset);
    setLotMode('otomatis');
    setManualLotNumber('');
  };

  const handleAddLot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addingAsset || !selectedSession) return;
    
    setLoading(true);
    try {
      const payload: any = {
        session_id: selectedSession,
        asset_id: addingAsset.id,
        starting_price: addingAsset.base_price,
      };

      if (lotMode === 'manual') {
        if (!manualLotNumber) throw new Error('Nomor lot wajib diisi jika mode manual');
        payload.lot_number = parseInt(manualLotNumber, 10);
      }

      const res = await apiFetch('/admin/lots', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error?.message || 'Gagal menambahkan lot');
      
      toast.success('Berhasil menambahkan aset ke sesi lelang');
      setAddingAsset(null);
      fetchLots();
      refetchApprovedAssets();
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLot = async (lot: Lot) => {
    if (!confirm('Hapus lot ini? Aset akan kembali ke daftar approved.')) return;
    setLoading(true);
    try {
      const res = await apiFetch(`/admin/lots/${lot.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Gagal menghapus lot');
      
      toast.success('Lot berhasil dihapus');
      fetchLots();
      refetchApprovedAssets();
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelLot = async (lot: Lot) => {
    if (!confirm('Batalkan lot ini? Lot akan ditandai sebagai batal dan tidak akan dilelang.')) return;
    setLoading(true);
    try {
      const res = await apiFetch(`/admin/lots/${lot.id}/cancel`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Gagal membatalkan lot');

      toast.success('Lot berhasil dibatalkan');
      fetchLots();
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  const handleUncancelLot = async (lot: Lot) => {
    if (!confirm('Aktifkan kembali lot ini? Lot akan kembali ke kondisi normal dan bisa dilelang lagi.')) return;
    setLoading(true);
    try {
      const res = await apiFetch(`/admin/lots/${lot.id}/uncancel`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Gagal mengaktifkan kembali lot');

      toast.success('Lot berhasil diaktifkan kembali');
      fetchLots();
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan');
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

  const activeSessionObj = sessions.find(s => s.id === selectedSession);

  return (
    <DashboardLayout breadcrumbParent="Lelang" breadcrumbCurrent="Penyusunan Lot">
      <div className="toolbar">
        <div className="toolbar-left">
          <h1 className="page-title">Penyusunan Lot Lelang</h1>
          <p className="page-subtitle">Pilih aset dari daftar persetujuan dan masukkan ke sesi lelang aktif.</p>
        </div>
      </div>

      <div className="grid-2">
        {/* Left column: Select session and view current lots */}
        <div>
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <h2 className="card-title mb-1">1. Pilih Sesi Lelang</h2>
                <div className="form-group mb-1" style={{ minWidth: '220px' }}>
                  <select className="form-select form-select-sm" value={selectedSession} onChange={(e) => setSelectedSession(e.target.value)}>
                    {sessions.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.title} ({new Date(s.scheduled_at).toLocaleDateString('id-ID')})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <select 
                  className="form-select form-select-sm" 
                  value={filterLotsProvider} 
                  onChange={(e) => setFilterLotsProvider(e.target.value)}
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
                  value={searchLotsPolice}
                  onChange={(e) => setSearchLotsPolice(e.target.value)}
                  style={{ width: '130px' }}
                />
              </div>
            </div>

            <hr />

            <h3 className="card-title" style={{ fontSize: '1rem', marginTop: '1rem' }}>Daftar Lot Terdaftar (Sesi Terpilih)</h3>
            <div className="table-wrapper" style={{ maxHeight: '350px', overflowY: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th style={{ width: '60px' }}>Lot #</th>
                    <th>Nama Unit Aset</th>
                    <th>No Polisi</th>
                    <th>Harga Limit</th>
                    <th style={{ textAlign: 'center' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {lots.length === 0 ? (
                    <tr><td colSpan={5} className="text-center text-muted">Belum ada lot</td></tr>
                  ) : (
                    lots.map(lot => (
                      <tr key={lot.id}>
                        <td><strong>{String(lot.lot_number).padStart(2, '0')}</strong></td>
                        <td>{lot.asset?.title || 'Unknown Asset'}</td>
                        <td style={{ fontSize: '0.85rem' }}>{lot.asset?.police_number || '-'}</td>
                        <td>{formatRupiah(lot.starting_price)}</td>
                        <td style={{ textAlign: 'center' }}>
                          {lot.status === 'cancelled' ? (
                            <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
                              <span className="badge" style={{ backgroundColor: '#f87171', color: 'white', padding: '0.2rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.75rem' }}>Dibatalkan</span>
                              <button className="btn btn-xs btn-success" disabled={loading} onClick={() => handleUncancelLot(lot)}>Aktifkan Kembali</button>
                              <button className="btn btn-xs btn-danger" disabled={loading} onClick={() => handleDeleteLot(lot)}>Hapus</button>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
                              <button className="btn btn-xs btn-warning" disabled={loading} onClick={() => handleCancelLot(lot)}>Batalkan</button>
                              <button className="btn btn-xs btn-danger" disabled={loading} onClick={() => handleDeleteLot(lot)}>Hapus</button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Part 1 Pagination */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', fontSize: '0.85rem' }}>
              <span className="text-muted">Total: {lotsTotalCount} lot</span>
              {lotsTotalPages > 1 && (
                <div style={{ display: 'flex', gap: '0.25rem' }}>
                  <button 
                    className="btn btn-xs btn-outline" 
                    disabled={lotsPage <= 1} 
                    onClick={() => setLotsPage(lotsPage - 1)}
                  >
                    Prev
                  </button>
                  <span style={{ padding: '0 0.5rem', display: 'flex', alignItems: 'center' }}>
                    Halaman {lotsPage} dari {lotsTotalPages}
                  </span>
                  <button 
                    className="btn btn-xs btn-outline" 
                    disabled={lotsPage >= lotsTotalPages} 
                    onClick={() => setLotsPage(lotsPage + 1)}
                  >
                    Next
                  </button>
                </div>
              )}
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
                    <th>Nama Unit</th>
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

            {/* Part 2 Pagination */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', fontSize: '0.85rem' }}>
              <span className="text-muted">Total: {assetsTotalCount} aset</span>
              {assetsTotalPages > 1 && (
                <div style={{ display: 'flex', gap: '0.25rem' }}>
                  <button 
                    className="btn btn-xs btn-outline" 
                    disabled={assetsPage <= 1} 
                    onClick={() => setAssetsPage(assetsPage - 1)}
                  >
                    Prev
                  </button>
                  <span style={{ padding: '0 0.5rem', display: 'flex', alignItems: 'center' }}>
                    Halaman {assetsPage} dari {assetsTotalPages}
                  </span>
                  <button 
                    className="btn btn-xs btn-outline" 
                    disabled={assetsPage >= assetsTotalPages} 
                    onClick={() => setAssetsPage(assetsPage + 1)}
                  >
                    Next
                  </button>
                </div>
              )}
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
              <button className="btn btn-primary" disabled={loading} onClick={handleAddLot}>
                {loading ? 'Memproses...' : 'Tambahkan'}
              </button>
            </div>
          </Card>
        </div>
      )}
    </DashboardLayout>
  );
}
