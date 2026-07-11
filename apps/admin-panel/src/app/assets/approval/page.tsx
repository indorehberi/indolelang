'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import Toast from '../../../components/ui/Toast';
import { apiFetch } from '../../../lib/api';

interface Asset {
  id: string;
  provider_id: string;
  category: string;
  title: string;
  description?: string;
  base_price: number;
  images?: string[];
  status: 'pending' | 'approved' | 'listed' | 'sold' | 'returned';
  created_at: string;
}

export default function AssetsApprovalPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'danger' | 'warning' } | null>(null);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState('');
  const [providerFilter, setProviderFilter] = useState('');
  const [poolFilter, setPoolFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [search, setSearch] = useState('');
  const [providers, setProviders] = useState<any[]>([]);

  const [availableProviderIds, setAvailableProviderIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!providerFilter) {
      setAvailableProviderIds(new Set(assets.map(a => a.provider_id)));
    }
  }, [assets, providerFilter]);

  const displayedProviders = providers.filter(p => availableProviderIds.has(p.id) || providerFilter === p.id);

  const fetchProviders = async () => {
    try {
      const response = await apiFetch('/admin/users?role=provider&provider_status=approved&per_page=100');
      const data = await response.json();
      if (response.ok && data.success) {
        setProviders(data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchApprovedAssets = async () => {
    setLoading(true);
    try {
      let query = `?status=approved&per_page=100`;
      if (categoryFilter) query += `&category=${categoryFilter}`;
      if (providerFilter) query += `&provider_id=${providerFilter}`;
      if (poolFilter) query += `&pool_status=${poolFilter}`;
      if (dateFrom) query += `&date_from=${dateFrom}`;
      if (dateTo) query += `&date_to=${dateTo}`;
      if (search) query += `&search=${encodeURIComponent(search)}`;

      const response = await apiFetch(`/assets${query}`);
      const data = await response.json();
      if (response.ok && data.success) {
        setAssets(data.data);
      } else {
        setAssets([]);
      }
    } catch (err) {
      setAssets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => fetchApprovedAssets(), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryFilter, providerFilter, poolFilter, dateFrom, dateTo, search]);

  useEffect(() => {
    fetchProviders();
  }, []);

  
  const handleCancel = async (id: string) => {
    if (!confirm('Apakah Anda yakin membatalkan persetujuan barang ini? Barang akan kembali ke status pending.')) return;
    setProcessingId(id);
    setToast(null);

    try {
      const response = await apiFetch(`/admin/assets/${id}/cancel`, { method: 'PUT' });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || 'Gagal membatalkan persetujuan');
      }

      setToast({ message: 'Persetujuan dibatalkan. Barang kembali ke Daftar Barang.', variant: 'success' });
      fetchApprovedAssets();
    } catch (err: any) {
      setToast({ message: err.message || 'Terjadi kesalahan sistem', variant: 'danger' });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string) => {
    const reason = window.prompt('Masukkan alasan penolakan barang ini:');
    if (reason === null) return;
    if (!reason.trim()) {
      setToast({ message: 'Alasan penolakan wajib diisi.', variant: 'warning' });
      return;
    }
    setProcessingId(id);
    setToast(null);

    try {
      const response = await apiFetch(`/admin/assets/${id}/reject`, {
        method: 'PUT',
        body: JSON.stringify({ reason: reason.trim() }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || 'Gagal menolak barang');
      }

      setToast({ message: 'Barang ditolak dan dikeluarkan dari daftar approved. Provider telah diberi notifikasi.', variant: 'success' });
      fetchApprovedAssets();
    } catch (err: any) {
      setToast({ message: err.message || 'Terjadi kesalahan sistem', variant: 'danger' });
    } finally {
      setProcessingId(null);
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
    <DashboardLayout breadcrumbParent="Katalog" breadcrumbCurrent="Approved Barang">
      {toast && (
        <Toast
          message={toast.message}
          variant={toast.variant}
          onClose={() => setToast(null)}
        />
      )}

      <div className="toolbar">
        <div className="toolbar-left">
          <h1 className="page-title">Daftar Approved Barang</h1>
          <p className="page-subtitle">Daftar aset barang yang telah disetujui oleh Admin dan siap dimasukkan ke dalam Lot lelang.</p>
        </div>
      </div>

      <Card className="mb-2">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div>
            <label className="form-label" style={{ fontWeight: '600', fontSize: '0.85rem' }}>Cari Nama Barang</label>
            <input
              type="text"
              className="search-box"
              style={{ width: '100%', height: '36px', padding: '0 0.75rem', borderRadius: 'var(--radius)', border: '1px solid var(--wf-border)' }}
              placeholder="Masukkan kata kunci..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div>
            <label className="form-label" style={{ fontWeight: '600', fontSize: '0.85rem' }}>Kategori</label>
            <select
              className="form-select"
              style={{ width: '100%', height: '36px', padding: '0 0.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--wf-border)', background: 'white' }}
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="">Semua Kategori</option>
              <option value="mobil">Mobil</option>
              <option value="motor">Motor</option>
            </select>
          </div>

          <div className="filter-item">
            <label className="form-label" style={{ fontWeight: '600', fontSize: '0.85rem' }}>Provider</label>
            <select
              className="form-select"
              style={{ width: '100%', height: '36px', padding: '0 0.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--wf-border)', background: 'white' }}
              value={providerFilter}
              onChange={(e) => setProviderFilter(e.target.value)}
            >
              <option value="">Semua Provider</option>
              {displayedProviders.map((p) => (
                <option key={p.id} value={p.id}>{p.company_name || p.full_name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label" style={{ fontWeight: '600', fontSize: '0.85rem' }}>Pool</label>
            <select
              className="form-select"
              style={{ width: '100%', height: '36px', padding: '0 0.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--wf-border)', background: 'white' }}
              value={poolFilter}
              onChange={(e) => setPoolFilter(e.target.value)}
            >
              <option value="">Semua Pool</option>
              <option value="in_pool">In Pool</option>
              <option value="out_pool">Out Pool</option>
            </select>
          </div>

          <div>
            <label className="form-label" style={{ fontWeight: '600', fontSize: '0.85rem' }}>Dari Tanggal</label>
            <input
              type="date"
              className="form-select"
              style={{ width: '100%', height: '36px', padding: '0 0.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--wf-border)' }}
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>

          <div>
            <label className="form-label" style={{ fontWeight: '600', fontSize: '0.85rem' }}>Sampai Tanggal</label>
            <input
              type="date"
              className="form-select"
              style={{ width: '100%', height: '36px', padding: '0 0.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--wf-border)' }}
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
        </div>
      </Card>

      <Card>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Tanggal Masuk</th>
                <th>Nama Barang / Deskripsi</th>
                <th>Kategori</th>
                <th>Taksiran Harga Dasar</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center">Memuat antrean barang...</td>
                </tr>
              ) : assets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-muted">Tidak ada barang yang berstatus approved.</td>
                </tr>
              ) : (
                assets.map((asset) => (
                  <tr key={asset.id}>
                    <td>
                      {new Date(asset.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td style={{ maxWidth: '350px' }}>
                      <div>
                        <strong>{asset.title}</strong>
                        <div className="text-muted" style={{ fontSize: '0.85rem', marginTop: '4px' }}>
                          {asset.description || 'Tidak ada deskripsi.'}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ textTransform: 'capitalize' }}>
                        {asset.category.replace('_', ' ')}
                      </span>
                    </td>
                    <td>
                      <strong className="text-primary">{formatRupiah(asset.base_price)}</strong>
                    </td>
                    <td>
                      <Badge variant="success">Approved</Badge>
                    </td>
                    <td>
                      <div className="d-flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={processingId === asset.id}
                          onClick={() => handleCancel(asset.id)}
                        >
                          {processingId === asset.id ? 'Memproses...' : 'Batal Approve'}
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          disabled={processingId === asset.id}
                          onClick={() => handleReject(asset.id)}
                        >
                          {processingId === asset.id ? 'Memproses...' : 'Tolak'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </DashboardLayout>
  );
}
