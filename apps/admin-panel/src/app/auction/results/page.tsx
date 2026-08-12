'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import { apiUrl, apiFetch } from '../../../lib/api';
import { useToast } from '../../../providers/ToastProvider';
import { exportToExcel } from '../../../lib/excelExport';
import ColumnPicker, { useColumnVisibility, ColumnOption } from '../../../components/ui/ColumnPicker';

const AUCTION_RESULTS_COLUMNS: ColumnOption[] = [
  { key: 'lot', label: 'Lot', alwaysVisible: true },
  { key: 'tanggal', label: 'Tgl Lelang', defaultVisible: true },
  { key: 'jam', label: 'Jam Lelang', defaultVisible: true },
  { key: 'lokasi', label: 'Lokasi', defaultVisible: true },
  { key: 'unit', label: 'Unit', defaultVisible: true },
  { key: 'no_polisi', label: 'No Polisi', defaultVisible: true },
  { key: 'nipl', label: 'No NIPL', defaultVisible: true },
  { key: 'harga_limit', label: 'Harga Limit', defaultVisible: true },
  { key: 'status', label: 'Status', defaultVisible: true },
  { key: 'pembayaran', label: 'Pembayaran', defaultVisible: true },
  { key: 'aksi', label: 'Aksi', alwaysVisible: true },
];

export default function AuctionResultsPage() {
  const toast = useToast();
  const [lots, setLots] = useState<any[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { visibleKeys, setVisibleKeys, isVisible } = useColumnVisibility('auction_results_list', AUCTION_RESULTS_COLUMNS);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState('');
  const [providerFilter, setProviderFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchBidder, setSearchBidder] = useState('');
  const [searchPolice, setSearchPolice] = useState('');

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
    if (dateFrom && lot.session?.scheduled_at) {
      if (new Date(lot.session.scheduled_at) < new Date(`${dateFrom}T00:00:00`)) return false;
    }
    if (dateTo && lot.session?.scheduled_at) {
      if (new Date(lot.session.scheduled_at) > new Date(`${dateTo}T23:59:59`)) return false;
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
    if (searchPolice) {
      const query = searchPolice.toLowerCase().replace(/\s+/g, '');
      const police = lot.asset?.police_number?.toLowerCase().replace(/\s+/g, '') || '';
      if (!police.includes(query)) return false;
    }
    return true;
  }).sort((a, b) => {
    const dateA = a.session?.scheduled_at ? new Date(a.session.scheduled_at).getTime() : 0;
    const dateB = b.session?.scheduled_at ? new Date(b.session.scheduled_at).getTime() : 0;
    return dateB - dateA;
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
      </div>

      {/* Filter Card */}
      <Card className="mb-2">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', alignItems: 'flex-end' }}>
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
            <label className="form-label" style={{ fontWeight: '600', fontSize: '0.85rem' }}>Cari No. Polisi</label>
            <input
              type="text"
              className="search-box"
              placeholder="Misal: B 1234 ABC"
              value={searchPolice}
              onChange={(e) => setSearchPolice(e.target.value)}
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

          <div>
            <label className="form-label" style={{ fontWeight: '600', fontSize: '0.85rem' }}>Dari Tanggal</label>
            <input
              type="date"
              className="search-box"
              style={{ width: '100%', height: '36px', padding: '0 0.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--wf-border)' }}
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>

          <div>
            <label className="form-label" style={{ fontWeight: '600', fontSize: '0.85rem' }}>Sampai Tanggal</label>
            <input
              type="date"
              className="search-box"
              style={{ width: '100%', height: '36px', padding: '0 0.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--wf-border)' }}
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>

          <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
            <button
              onClick={() => {
                const dataToExport = filteredLots.map((l, index) => {
                  const row: Record<string, any> = {};
                  if (isVisible('lot')) {
                    row['No'] = index + 1;
                    row['No. Lot'] = l.lot_number || '-';
                  }
                  if (isVisible('unit')) {
                    row['Nama Unit'] = l.asset?.title || '-';
                    row['Kategori'] = l.asset?.category || '-';
                    row['Mitra Provider'] = l.asset?.provider?.company_name || l.asset?.provider?.full_name || '-';
                  }
                  if (isVisible('harga_limit')) {
                    row['Harga Dasar (Rp)'] = l.starting_price ? Number(l.starting_price) : 0;
                    row['Harga Terbentuk (Hammer Price Rp)'] = l.status === 'sold' ? Number(l.hammer_price || l.current_price || 0) : 0;
                  }
                  if (isVisible('status')) row['Status Hasil'] = l.status === 'sold' ? 'TERJUAL (Sold)' : 'TIDAK LAKU (Unsold)';
                  if (isVisible('nipl')) {
                    row['Pemenang'] = l.winner?.full_name || '-';
                    row['Email Pemenang'] = l.winner?.email || '-';
                    row['No. HP Pemenang'] = l.winner?.phone || '-';
                  }
                  if (isVisible('pembayaran')) row['Status Pelunasan'] = l.invoices && l.invoices.length > 0 ? (l.invoices[0].status === 'paid' ? 'Lunas' : 'Belum Lunas') : 'Belum Invoice';
                  return row;
                });
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
            <ColumnPicker
              columns={AUCTION_RESULTS_COLUMNS}
              visibleKeys={visibleKeys}
              onChange={setVisibleKeys}
              tableId="auction_results_list"
            />
          </div>
        </div>
      </Card>

      <Card>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                {isVisible('lot') && <th>Lot</th>}
                {isVisible('tanggal') && <th>Tgl Lelang</th>}
                {isVisible('jam') && <th>Jam Lelang</th>}
                {isVisible('lokasi') && <th>Lokasi</th>}
                {isVisible('unit') && <th>Unit</th>}
                {isVisible('no_polisi') && <th>No Polisi</th>}
                {isVisible('nipl') && <th>No NIPL</th>}
                {isVisible('harga_limit') && <th>Harga Limit</th>}
                {isVisible('status') && <th>Status</th>}
                {isVisible('pembayaran') && <th>Pembayaran</th>}
                {isVisible('aksi') && <th>Aksi</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={visibleKeys.length} className="text-center">Memuat data hasil lelang...</td></tr>
              ) : filteredLots.length === 0 ? (
                <tr><td colSpan={visibleKeys.length} className="text-center text-muted">Tidak ada data hasil lelang ditemukan.</td></tr>
              ) : (
                filteredLots.map((lot) => {
                  const assetInfo = lot.asset ? `${lot.asset.brand || ''} ${lot.asset.model || ''} (${lot.asset.year || '-'})` : '-';

                  return (
                    <tr key={lot.id}>
                      {isVisible('lot') && <td><strong>#{lot.lot_number}</strong></td>}
                      {isVisible('tanggal') && (
                        <td>
                          {lot.session ? new Date(lot.session.scheduled_at).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          }) : '-'}
                        </td>
                      )}
                      {isVisible('jam') && (
                        <td>
                          {lot.session ? new Date(lot.session.scheduled_at).toLocaleTimeString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit'
                          }) : '-'}
                        </td>
                      )}
                      {isVisible('lokasi') && (
                        <td>
                          {lot.session?.branch ? `${lot.session.branch.name}, ${lot.session.branch.city}` : '-'}
                        </td>
                      )}
                      {isVisible('unit') && (
                        <td>
                          <div><strong>{lot.asset?.title || '-'}</strong></div>
                          <div className="text-muted" style={{ fontSize: '0.8rem' }}>{assetInfo}</div>
                        </td>
                      )}
                      {isVisible('no_polisi') && (
                        <td>
                          <strong>{lot.asset?.police_number || '-'}</strong>
                        </td>
                      )}
                      {isVisible('nipl') && (
                        <td>
                          {lot.winner_id ? (
                            <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold', fontSize: '0.85rem' }}>
                              NIPL-{lot.winner_id.substring(0, 8).toUpperCase()}
                            </code>
                          ) : '-'}
                        </td>
                      )}
                      {isVisible('harga_limit') && <td>{formatRupiah(lot.starting_price)}</td>}
                      {isVisible('status') && (
                        <td>
                          <Badge variant={lot.status === 'sold' ? 'success' : 'default'}>
                            {lot.status === 'sold' ? 'Sold' : 'Unsold'}
                          </Badge>
                        </td>
                      )}
                      {isVisible('pembayaran') && (
                        <td>
                          {lot.status === 'sold' && (
                            <Badge variant={lot.payment_status === 'paid' ? 'success' : 'warning'}>
                              {lot.payment_status === 'paid' ? 'Terbayar' : 'Belum Terbayar'}
                            </Badge>
                          )}
                        </td>
                      )}
                      {isVisible('aksi') && (
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
                      )}
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
