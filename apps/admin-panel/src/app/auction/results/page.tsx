'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import { apiUrl, apiFetch } from '../../../lib/api';
import { useToast } from '../../../providers/ToastProvider';
import { exportToExcel } from '../../../lib/excelExport';

export default function AuctionResultsPage() {
  const toast = useToast();
  const [lots, setLots] = useState<any[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState('');
  const [providerFilter, setProviderFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchBidder, setSearchBidder] = useState('');

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

  const fetchLots = async () => {
    setLoading(true);
    try {
      const response = await apiFetch('/lots?per_page=200&status=sold,unsold');
      const data = await response.json();
      if (response.ok && data.success) {
        setLots(data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLots();
    fetchProviders();
  }, []);

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(val);
  };

  const filteredLots = lots.filter((lot) => {
    if (categoryFilter && lot.asset?.category !== categoryFilter) return false;
    if (providerFilter && lot.asset?.provider_id !== providerFilter) return false;
    if (dateFilter) {
      const scheduledDate = lot.session?.scheduled_at?.split('T')[0];
      if (scheduledDate !== dateFilter) return false;
    }
    if (statusFilter === 'sold' || statusFilter === 'unsold') {
      if (lot.status !== statusFilter) return false;
    } else if (statusFilter === 'paid') {
      if (lot.payment_status !== 'paid') return false;
    } else if (statusFilter === 'unpaid') {
      if (lot.status !== 'sold' || lot.payment_status === 'paid') return false;
    }
    if (searchBidder) {
      const query = searchBidder.toLowerCase();
      const matchesName = lot.winner?.full_name?.toLowerCase().includes(query);
      const matchesEmail = lot.winner?.email?.toLowerCase().includes(query);
      if (!matchesName && !matchesEmail) return false;
    }
    return true;
  });

  const handleDownloadBapl = async (invoiceId: string) => {
    try {
      const response = await apiFetch(`/documents/bapl/${invoiceId}/download`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `BAPL-${invoiceId}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } else {
        const errData = await response.json().catch(() => null);
        toast.error(errData?.error?.message || 'Gagal mengunduh BAPL');
      }
    } catch (err) {
      toast.error('Gagal mengunduh BAPL. Periksa koneksi Anda.');
    }
  };

  const handleMarkAsPaid = async (lotId: string) => {
    if (!confirm('Tandai lot ini sebagai sudah dibayar dan generate BAPL?')) return;
    
    try {
      const response = await apiFetch(`/admin/lots/${lotId}/paid`, { method: 'POST' });
      const data = await response.json();
      
      if (response.ok && data.success) {
        toast.success('Berhasil! BAPL akan diunduh secara otomatis.');
        // Automatically download BAPL
        if (data.data?.invoice_id) {
          handleDownloadBapl(data.data.invoice_id);
        }
        fetchLots(); // Refresh
      } else {
        toast.error(data.error?.message || 'Gagal menandai sebagai dibayar');
      }
    } catch (err) {
      toast.error('Terjadi kesalahan jaringan.');
    }
  };

  return (
    <DashboardLayout breadcrumbParent="Lelang" breadcrumbCurrent="Hasil Sesi">
      <div className="toolbar">
        <div className="toolbar-left">
          <h1 className="page-title">Rekapitulasi Hasil Lelang</h1>
          <p className="page-subtitle">Daftar laporan hasil penutupan lot lelang, rincian unit terjual (sold) dan tidak laku (unsold).</p>
        </div>
        <div className="toolbar-right">
          <button
            onClick={() => {
              const dataToExport = filteredLots.map((l, index) => ({
                'No': index + 1,
                'No. Lot': l.lot_number || '-',
                'Nama Unit': l.asset?.title || '-',
                'Kategori': l.asset?.category || '-',
                'Mitra Provider': l.asset?.provider?.company_name || l.asset?.provider?.full_name || '-',
                'Harga Dasar (Rp)': l.starting_price ? Number(l.starting_price) : 0,
                'Harga Terbentuk (Hammer Price Rp)': l.status === 'sold' ? Number(l.hammer_price || l.current_price || 0) : 0,
                'Status Hasil': l.status === 'sold' ? 'TERJUAL (Sold)' : 'TIDAK LAKU (Unsold)',
                'Pemenang': l.winner?.full_name || '-',
                'Email Pemenang': l.winner?.email || '-',
                'No. HP Pemenang': l.winner?.phone || '-',
                'Status Pelunasan': l.invoices && l.invoices.length > 0 ? (l.invoices[0].status === 'paid' ? 'Lunas' : 'Belum Lunas') : 'Belum Invoice'
              }));
              const ok = exportToExcel(dataToExport, 'Hasil_Sesi_Lelang_IndoLelang', 'Hasil Sesi');
              if (ok) {
                toast.success('Berhasil mendownload Excel Hasil Sesi (.xlsx)');
              } else {
                toast.error('Tidak ada data hasil sesi untuk di-export');
              }
            }}
            className="btn btn-outline btn-sm"
            style={{ backgroundColor: '#107c41', color: '#fff', borderColor: '#107c41', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>file_download</span>
            Export XLSX
          </button>
        </div>
      </div>

      {/* Filter Card */}
      <Card className="mb-2">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
          <div>
            <label className="form-label" style={{ fontWeight: '600', fontSize: '0.85rem' }}>Cari Bidder Pemenang</label>
            <input
              type="text"
              className="search-box"
              placeholder="Nama atau Email..."
              value={searchBidder}
              onChange={(e) => setSearchBidder(e.target.value)}
              style={{ width: '100%', height: '36px', padding: '0 0.75rem', borderRadius: 'var(--radius)', border: '1px solid var(--wf-border)' }}
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

          <div>
            <label className="form-label" style={{ fontWeight: '600', fontSize: '0.85rem' }}>Tanggal</label>
            <input
              type="date"
              className="search-box"
              style={{ width: '100%', height: '36px', padding: '0 0.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--wf-border)' }}
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />
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
              <option value="sold">Terjual (Sold)</option>
              <option value="unsold">Tidak Laku (Unsold)</option>
              <option value="paid">Sudah Terbayar</option>
              <option value="unpaid">Belum Terbayar</option>
            </select>
          </div>
        </div>
      </Card>

      <Card>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Lot</th>
                <th>Tgl Lelang</th>
                <th>Jam Lelang</th>
                <th>Lokasi</th>
                <th>Kendaraan</th>
                <th>No Polisi</th>
                <th>No NIPL</th>
                <th>Harga Limit</th>
                <th>Status</th>
                <th>Pembayaran</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={11} className="text-center">Memuat data hasil lelang...</td></tr>
              ) : filteredLots.length === 0 ? (
                <tr><td colSpan={11} className="text-center text-muted">Tidak ada data hasil lelang ditemukan.</td></tr>
              ) : (
                filteredLots.map((lot) => {
                  const assetInfo = lot.asset ? `${lot.asset.brand || ''} ${lot.asset.model || ''} (${lot.asset.year || '-'})` : '-';

                  return (
                    <tr key={lot.id}>
                      <td><strong>#{lot.lot_number}</strong></td>
                      <td>
                        {lot.session ? new Date(lot.session.scheduled_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        }) : '-'}
                      </td>
                      <td>
                        {lot.session ? new Date(lot.session.scheduled_at).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : '-'}
                      </td>
                      <td>
                        {lot.session?.branch ? `${lot.session.branch.name}, ${lot.session.branch.city}` : '-'}
                      </td>
                      <td>
                        <div><strong>{lot.asset?.title || '-'}</strong></div>
                        <div className="text-muted" style={{ fontSize: '0.8rem' }}>{assetInfo}</div>
                      </td>
                      <td>
                        <strong>{lot.asset?.police_number || '-'}</strong>
                      </td>
                      <td>
                        {lot.winner_id ? (
                          <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold', fontSize: '0.85rem' }}>
                            NIPL-{lot.winner_id.substring(0, 8).toUpperCase()}
                          </code>
                        ) : '-'}
                      </td>
                      <td>{formatRupiah(lot.starting_price)}</td>
                      <td>
                        <Badge variant={lot.status === 'sold' ? 'success' : 'default'}>
                          {lot.status === 'sold' ? 'Sold' : 'Unsold'}
                        </Badge>
                      </td>
                      <td>
                        {lot.status === 'sold' && (
                          <Badge variant={lot.payment_status === 'paid' ? 'success' : 'warning'}>
                            {lot.payment_status === 'paid' ? 'Terbayar' : 'Belum Terbayar'}
                          </Badge>
                        )}
                      </td>
                      <td>
                        {lot.status === 'sold' && lot.payment_status !== 'paid' && (
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => handleMarkAsPaid(lot.id)}
                            style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                          >
                            Sudah Dibayar & BAPL
                          </button>
                        )}
                        {lot.status === 'sold' && lot.payment_status === 'paid' && lot.invoice_id && (
                          <button
                            className="btn btn-sm btn-outline"
                            onClick={() => handleDownloadBapl(lot.invoice_id)}
                            style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                          >
                            Unduh BAPL
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </DashboardLayout>
  );
}
