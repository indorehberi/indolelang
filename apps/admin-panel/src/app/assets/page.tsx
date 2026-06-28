'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { apiUrl } from '../../lib/api';

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

export default function AssetsPage() {
  const router = useRouter();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const dummyAssets: Asset[] = [
    {
      id: 'asset-1',
      provider_id: 'provider-1',
      category: 'mobil',
      title: 'Toyota Avanza 1.3 G M/T 2021',
      description: 'Kondisi mulus, KM rendah 30.000, surat-surat lengkap pajak hidup.',
      base_price: 155000000,
      status: 'listed',
      created_at: '2026-06-20T08:00:00.000Z',
    },
    {
      id: 'asset-2',
      provider_id: 'provider-1',
      category: 'motor',
      title: 'Honda Vario 150 Keyless 2020',
      description: 'Warna hitam doff, ban tebal baru diganti, servis rutin Astra.',
      base_price: 18500000,
      status: 'approved',
      created_at: '2026-06-21T09:00:00.000Z',
    },
    {
      id: 'asset-3',
      provider_id: 'provider-2',
      category: 'alat_berat',
      title: 'Excavator Caterpillar 320 GC',
      description: 'Hour meter 4500 jam, siap kerja keras, lokasi Jakarta Utara.',
      base_price: 850000000,
      status: 'pending',
      created_at: '2026-06-23T11:00:00.000Z',
    },
    {
      id: 'asset-4',
      provider_id: 'provider-2',
      category: 'properti',
      title: 'Ruko Margonda Raya Depok 3 Lantai',
      description: 'Luas bangunan 150m2, lokasi sangat strategis dekat kampus UI.',
      base_price: 2400000000,
      status: 'sold',
      created_at: '2026-06-10T04:00:00.000Z',
    },
  ];

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      let query = `?page=1&per_page=50`;
      if (statusFilter) query += `&status=${statusFilter}`;
      if (categoryFilter) query += `&category=${categoryFilter}`;
      if (search) query += `&search=${encodeURIComponent(search)}`;

      const response = await fetch(apiUrl(`/assets${query}`), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setAssets(data.data);
      } else {
        applyDummyFilters();
      }
    } catch (err) {
      applyDummyFilters();
    } finally {
      setLoading(false);
    }
  };

  const applyDummyFilters = () => {
    let filtered = [...dummyAssets];
    if (statusFilter) filtered = filtered.filter((a) => a.status === statusFilter);
    if (categoryFilter) filtered = filtered.filter((a) => a.category === categoryFilter);
    if (search) {
      filtered = filtered.filter((a) =>
        a.title.toLowerCase().includes(search.toLowerCase())
      );
    }
    setAssets(filtered);
  };

  useEffect(() => {
    fetchAssets();
  }, [categoryFilter, statusFilter, search]);

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(val);
  };

  const getStatusBadge = (status: Asset['status']) => {
    switch (status) {
      case 'listed':
        return <Badge variant="success">Listed (Active)</Badge>;
      case 'approved':
        return <Badge variant="info">Approved</Badge>;
      case 'pending':
        return <Badge variant="warning">Pending Review</Badge>;
      case 'sold':
        return <Badge variant="default">Sold</Badge>;
      case 'returned':
        return <Badge variant="danger">Returned</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  return (
    <DashboardLayout breadcrumbParent="Katalog" breadcrumbCurrent="Daftar Barang">
      <div className="toolbar">
        <div className="toolbar-left">
          <h1 className="page-title">Katalog Barang Titip Lelang</h1>
          <p className="page-subtitle">Daftar semua unit aset barang yang didaftarkan oleh provider.</p>
        </div>
      </div>

      {/* Filter Card */}
      <Card className="mb-2">
        <div className="grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div>
            <label className="form-label" style={{ fontWeight: '600', fontSize: '0.85rem' }}>Cari Nama Barang</label>
            <input
              type="text"
              className="search-box w-100"
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
              <option value="mobil">🚗 Mobil Penumpang</option>
              <option value="motor">🏍️ Sepeda Motor</option>
              <option value="alat_berat">🏗️ Komersial & Alat Berat</option>
              <option value="properti">🏢 Properti</option>
            </select>
          </div>

          <div>
            <label className="form-label" style={{ fontWeight: '600', fontSize: '0.85rem' }}>Status</label>
            <select
              className="form-select"
              style={{ width: '100%', height: '36px', padding: '0 0.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--wf-border)', background: 'white' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Semua Status</option>
              <option value="pending">Pending Review</option>
              <option value="approved">Approved</option>
              <option value="listed">Listed (Active)</option>
              <option value="sold">Sold</option>
              <option value="returned">Returned</option>
            </select>
          </div>
        </div>
      </Card>

      <Card>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Nama Barang</th>
                <th>Kategori</th>
                <th>Harga Dasar</th>
                <th>Status</th>
                <th>Tanggal Masuk</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center">Memuat daftar barang...</td>
                </tr>
              ) : assets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-muted">Tidak ada unit barang ditemukan.</td>
                </tr>
              ) : (
                assets.map((asset) => (
                  <tr key={asset.id}>
                    <td>
                      <div>
                        <strong>{asset.title}</strong>
                        <div className="text-muted" style={{ fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '300px' }}>
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
                    <td>{getStatusBadge(asset.status)}</td>
                    <td>
                      {new Date(asset.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td>
                      <div className="d-flex gap-1">
                        <Button variant="outline" size="sm" onClick={() => router.push(`/assets/${asset.id}`)}>Detail</Button>
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
