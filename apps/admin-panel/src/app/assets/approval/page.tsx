'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import Toast from '../../../components/ui/Toast';
import { apiUrl } from '../../../lib/api';

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
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'danger' } | null>(null);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState('');
  const [providerFilter, setProviderFilter] = useState('');
  const [providers, setProviders] = useState<any[]>([]);

  const fetchProviders = async () => {
    try {
      const response = await fetch(apiUrl('/admin/users?role=provider&provider_status=approved&per_page=100'), {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
      });
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
      const token = localStorage.getItem('accessToken');
      let query = `?status=approved&per_page=100`;
      if (categoryFilter) query += `&category=${categoryFilter}`;
      if (providerFilter) query += `&provider_id=${providerFilter}`;

      const response = await fetch(apiUrl(`/assets${query}`), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
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
    fetchApprovedAssets();
  }, [categoryFilter, providerFilter]);

  useEffect(() => {
    fetchProviders();
  }, []);

  
  const handleCancel = async (id: string) => {
    if (!confirm('Apakah Anda yakin membatalkan persetujuan barang ini? Barang akan kembali ke status pending.')) return;
    setProcessingId(id);
    setToast(null);

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(apiUrl(`/admin/assets/${id}/cancel`), {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

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
    if (!confirm('Apakah Anda yakin menolak barang ini? Barang akan dikembalikan ke daftar barang dengan status dikembalikan.')) return;
    setProcessingId(id);
    setToast(null);

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(apiUrl(`/admin/assets/${id}/reject`), {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || 'Gagal menolak barang');
      }

      setToast({ message: 'Barang ditolak dan dikembalikan ke Daftar Barang dengan status dikembalikan.', variant: 'success' });
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

          <div>
            <label className="form-label" style={{ fontWeight: '600', fontSize: '0.85rem' }}>Provider</label>
            <select
              className="form-select"
              style={{ width: '100%', height: '36px', padding: '0 0.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--wf-border)', background: 'white' }}
              value={providerFilter}
              onChange={(e) => setProviderFilter(e.target.value)}
            >
              <option value="">Semua Provider</option>
              {providers.map((p) => (
                <option key={p.id} value={p.id}>{p.company_name || p.full_name}</option>
              ))}
            </select>
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
