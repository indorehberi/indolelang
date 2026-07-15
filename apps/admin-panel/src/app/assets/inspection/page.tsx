"use client";

import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import { apiFetch } from '../../../lib/api';

interface Asset {
  id: string;
  title: string;
  category: string;
  provider_id?: string;
  base_price: number;
  created_at: string;
  police_number?: string;
}

export default function AssetsInspectionPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [processing, setProcessing] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const fetchPendingAssets = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/assets?status=pending&per_page=100');
      const data = await res.json();
      if (res.ok && data.success) setAssets(data.data || []);
      else setAssets([]);
    } catch (err) {
      console.error(err);
      setAssets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPendingAssets(); }, []);

  const openInspection = (asset: Asset) => {
    setSelectedAsset(asset);
    setShowModal(true);
  };

  const handleApprove = async () => {
    if (!selectedAsset) return;
    setProcessing(true);
    try {
      const res = await apiFetch(`/admin/assets/${selectedAsset.id}/approve`, { method: 'PUT' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Gagal menyetujui barang');
      setShowModal(false);
      setSelectedAsset(null);
      fetchPendingAssets();
    } catch (err: any) {
      console.error(err);
      alert(err?.message || 'Terjadi kesalahan');
    } finally {
      setProcessing(false);
    }
  };

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);
  };

  return (
    <DashboardLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Inspeksi Barang</h1>
          <p className="page-subtitle">Lakukan inspeksi dan verifikasi kelayakan barang dari provider.</p>
        </div>
        <Button variant="outline" onClick={fetchPendingAssets} disabled={loading}>🔄 Refresh</Button>
      </div>

      <Card title={`Daftar Menunggu Inspeksi${!loading ? ` (${assets.length})` : ''}`}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--wf-text-muted)' }}>⏳ Memuat data...</div>
        ) : assets.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--wf-text-muted)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>✅</div>
            <div style={{ fontWeight: 600 }}>Tidak ada barang yang menunggu inspeksi</div>
            <div style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>Semua pengajuan barang sudah diproses.</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Barang</th>
                  <th>No. Polisi</th>
                  <th>Kategori</th>
                  <th>Provider</th>
                  <th>Harga Dasar</th>
                  <th>Tanggal Masuk</th>
                  <th style={{ textAlign: 'right' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {assets.map((asset) => (
                  <tr key={asset.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{asset.title}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--wf-text-muted)', marginTop: '2px' }}>ID: {asset.id.split('-')[0]}...</div>
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>{asset.police_number || '-'}</td>
                    <td><Badge variant="info">{asset.category.replace('_', ' ')}</Badge></td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--wf-text-muted)' }}>{asset.provider_id?.split('-')[0]}...</td>
                    <td style={{ fontWeight: 600 }}>{formatRupiah(asset.base_price)}</td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--wf-text-muted)' }}>{new Date(asset.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                    <td style={{ textAlign: 'right' }}>
                      <Button size="sm" variant="primary" onClick={() => openInspection(asset)}>🔍 Inspeksi</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {showModal && selectedAsset && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.55)', padding: '1rem' }}>
          <div style={{ background: 'var(--wf-bg-primary, #fff)', borderRadius: '1rem', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', width: '100%', maxWidth: '860px', maxHeight: '92vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--wf-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>📋 Formulir Inspeksi Barang</h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--wf-text-muted)', margin: '0.2rem 0 0' }}>{selectedAsset.title}</p>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.4rem', color: 'var(--wf-text-muted)', padding: '0 0.25rem', lineHeight: 1 }}>×</button>
            </div>

            <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="form-label">No. Polisi</label>
                  <input type="text" className="form-input" defaultValue={selectedAsset.police_number || ''} disabled />
                </div>
                <div>
                  <label className="form-label">Kategori</label>
                  <input type="text" className="form-input" defaultValue={selectedAsset.category} disabled />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', padding: '1rem', borderTop: '1px solid var(--wf-border)' }}>
              <Button variant="outline" onClick={() => setShowModal(false)}>Batal</Button>
              <Button variant="primary" onClick={handleApprove} disabled={processing}>{processing ? 'Memproses...' : 'Setujui'}</Button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
