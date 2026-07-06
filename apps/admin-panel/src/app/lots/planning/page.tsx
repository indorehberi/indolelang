'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import Card from '../../../components/ui/Card';
import { apiUrl } from '../../../lib/api';

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
  const [sessions, setSessions] = useState<Session[]>([]);
  const [assets, setAssets] = useState<UnassignedAsset[]>([]);
  const [lots, setLots] = useState<Lot[]>([]);
  const [selectedSession, setSelectedSession] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const querySessionId = urlParams.get('session_id');

        const [resSessions, resAssets] = await Promise.all([
          fetch(apiUrl('/sessions')),
          fetch(apiUrl('/assets?status=approved'))
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
      } catch (err) {}
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (!selectedSession) return;
    const fetchLots = async () => {
      try {
        const resLots = await fetch(apiUrl(`/lots?session_id=${selectedSession}`));
        if (resLots.ok) {
          const data = await resLots.json();
          setLots(data.data || []);
        }
      } catch (err) {}
    };
    fetchLots();
  }, [selectedSession]);

  const handleAddLot = async (asset: UnassignedAsset) => {
    if (!selectedSession) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const lotNumber = lots.length > 0 ? Math.max(...lots.map(l => l.lot_number)) + 1 : 1;
      
      const res = await fetch(apiUrl('/admin/lots'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          session_id: selectedSession,
          asset_id: asset.id,
          lot_number: lotNumber,
          starting_price: asset.base_price
        })
      });
      
      if (res.ok) {
        // Refresh lots
        const resLots = await fetch(apiUrl(`/lots?session_id=${selectedSession}`));
        if (resLots.ok) {
          const data = await resLots.json();
          setLots(data.data || []);
        }
      } else {
        alert('Gagal menambahkan lot');
      }
    } catch (err) {
      alert('Terjadi kesalahan sistem');
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
                        <td style={{ textAlign: 'center' }}><button className="btn btn-xs btn-danger">Hapus</button></td>
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
            <h2 className="card-title">2. Aset Siap Dilelang (Approved)</h2>
            <p className="text-muted" style={{ fontSize: '0.85rem' }}>Klik tombol tambahkan untuk memasukkan aset ke lot terbawah pada sesi lelang aktif.</p>
            
            <div className="table-wrapper" style={{ marginTop: '1.25rem' }}>
              <table>
                <thead>
                  <tr>
                    <th>Nama Barang</th>
                    <th>Kategori</th>
                    <th>Harga Limit</th>
                    <th>Provider</th>
                    <th style={{ textAlign: 'center' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {assets.map((ast) => (
                    <tr key={ast.id}>
                      <td>
                        <strong>{ast.title}</strong>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.75rem', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase', background: ast.category === 'mobil' ? '#ebf8ff' : '#fefcbf', color: ast.category === 'mobil' ? '#2b6cb0' : '#b7791f' }}>
                          {ast.category}
                        </span>
                      </td>
                      <td><strong>{formatRupiah(ast.base_price)}</strong></td>
                      <td style={{ fontSize: '0.85rem' }}>{ast.provider?.company_name || ast.provider?.full_name || 'Provider'}</td>
                      <td style={{ textAlign: 'center' }}>
                        <button className="btn btn-xs btn-success" onClick={() => handleAddLot(ast)} disabled={loading}>+ Lot</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
