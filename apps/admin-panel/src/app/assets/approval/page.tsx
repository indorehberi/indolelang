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

  const dummyPendingAssets: Asset[] = [
    {
      id: 'asset-3',
      provider_id: 'provider-2',
      category: 'alat_berat',
      title: 'Excavator Caterpillar 320 GC',
      description: 'Hour meter 4500 jam, siap kerja keras, lokasi Jakarta Utara. Pompa hidrolik baru.',
      base_price: 850000000,
      status: 'pending',
      created_at: '2026-06-23T11:00:00.000Z',
    },
    {
      id: 'asset-5',
      provider_id: 'provider-1',
      category: 'mobil',
      title: 'Honda Civic Turbo 1.5 Hatchback 2019',
      description: 'Kondisi full orisinil, tangan pertama, cat asli mulus, velg racing bawaan.',
      base_price: 380000000,
      status: 'pending',
      created_at: '2026-06-23T06:15:00.000Z',
    },
    {
      id: 'asset-6',
      provider_id: 'provider-3',
      category: 'properti',
      title: 'Tanah Kavling BSD City Cluster Foresta',
      description: 'Luas tanah 240m2, lokasi hook, dekat club house, sertifikat PPJB siap SHM.',
      base_price: 3600000000,
      status: 'pending',
      created_at: '2026-06-22T08:30:00.000Z',
    },
  ];

  const fetchPendingAssets = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      // Fetch only pending assets
      const response = await fetch(apiUrl(`/assets?status=pending`), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setAssets(data.data);
      } else {
        setAssets(dummyPendingAssets);
      }
    } catch (err) {
      setAssets(dummyPendingAssets);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingAssets();
  }, []);

  const handleApprove = async (id: string) => {
    if (!confirm('Apakah Anda yakin menyetujui barang ini untuk masuk lelang?')) return;
    setProcessingId(id);
    setToast(null);

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(apiUrl(`/admin/assets/${id}/approve`), {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || 'Gagal menyetujui barang');
      }

      setToast({ message: 'Barang berhasil disetujui untuk dilelang', variant: 'success' });
      fetchPendingAssets();
    } catch (err: any) {
      setToast({ message: err.message || 'Terjadi kesalahan sistem', variant: 'danger' });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string) => {
    if (!confirm('Apakah Anda yakin menolak dan mengembalikan barang ini ke provider?')) return;
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

      setToast({ message: 'Barang berhasil ditolak dan dikembalikan', variant: 'success' });
      fetchPendingAssets();
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
    <DashboardLayout breadcrumbParent="Katalog" breadcrumbCurrent="Approval Barang">
      {toast && (
        <Toast
          message={toast.message}
          variant={toast.variant}
          onClose={() => setToast(null)}
        />
      )}

      <div className="toolbar">
        <div className="toolbar-left">
          <h1 className="page-title">Approval Pendaftaran Barang Titip Lelang</h1>
          <p className="page-subtitle">Review pengajuan aset barang baru yang didaftarkan oleh Provider sebelum masuk ke penyusunan Lot.</p>
        </div>
      </div>

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
                  <td colSpan={6} className="text-center text-muted">Tidak ada pengajuan barang baru yang menunggu persetujuan.</td>
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
                      <Badge variant="warning">Pending Review</Badge>
                    </td>
                    <td>
                      <div className="d-flex gap-1">
                        <Button
                          variant="success"
                          size="sm"
                          disabled={processingId === asset.id}
                          onClick={() => handleApprove(asset.id)}
                        >
                          {processingId === asset.id ? 'Memproses...' : 'Setujui'}
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          disabled={processingId === asset.id}
                          onClick={() => handleReject(asset.id)}
                        >
                          Tolak
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
