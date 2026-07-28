'use client';

import React, { useEffect, useState, useCallback } from 'react';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import { apiFetch } from '../../../lib/api';
import { useToast } from '../../../providers/ToastProvider';

interface SettlementItem {
  id: string;
  provider_id: string;
  gross_amount: number;
  commission_deducted: number;
  net_amount: number;
  nipl_forfeiture_amount?: number;
  is_forfeiture?: boolean;
  status: string;
  created_at: string;
  transferred_at?: string;
  provider?: {
    full_name: string;
    company_name?: string;
    bank_name?: string;
    bank_account_no?: string;
    bank_account_name?: string;
  };
  lot?: {
    asset: {
      title: string;
    };
    session?: {
      title: string;
      scheduled_at?: string;
    };
  };
}

const parseJwt = (token: string) => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (err) {
    return null;
  }
};

/** Settlement dianggap "baru" jika dibuat dalam 24 jam terakhir */
const isNew = (createdAt: string) => {
  const diffHours = (Date.now() - new Date(createdAt).getTime()) / 1000 / 60 / 60;
  return diffHours <= 24;
};

export default function SettlementsPage() {
  const toast = useToast();
  const [settlements, setSettlements] = useState<SettlementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'unit' | 'provider'>('unit');
  const [isDisbursingBulk, setIsDisbursingBulk] = useState(false);
  // Default ke 'pending' agar admin langsung melihat yang perlu ditransfer
  const [statusFilter, setStatusFilter] = useState('pending');
  const [typeFilter, setTypeFilter] = useState('');
  const [userRole, setUserRole] = useState<string>('');

  const fetchSettlements = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      if (token) {
        const decoded = parseJwt(token);
        if (decoded) setUserRole(decoded.role);
      }

      const response = await apiFetch(`/payments/settlements?page=1&per_page=200`);
      const data = await response.json();
      if (response.ok && data.success) {
        setSettlements(Array.isArray(data.data) ? data.data : []);
      } else {
        setSettlements([]);
      }
    } catch (err) {
      console.error(err);
      setSettlements([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettlements();
  }, [fetchSettlements]);

  const handleTransfer = async (id: string, isForfeiture?: boolean) => {
    const msg = isForfeiture
      ? 'Apakah Anda yakin ingin mentransfer dana forteit NIPL (\u00bd jaminan) ke rekening Provider?'
      : 'Apakah Anda yakin ingin mentransfer dana hasil penjualan ini ke rekening Provider?';
    if (!confirm(msg)) return;
    try {
      const response = await apiFetch(`/payments/settlements/${id}/disburse`, { method: 'POST' });
      const data = await response.json();
      if (response.ok && data.success) {
        toast.success('Transfer berhasil diproses!');
        fetchSettlements();
      } else {
        toast.error(data.error?.message || 'Gagal memproses transfer');
      }
    } catch (err) {
      console.error(err);
      toast.error('Terjadi kesalahan koneksi');
    }
  };

  const formatRupiah = (val: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);

  const formatDateTime = (iso: string) =>
    new Date(iso).toLocaleString('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'processed':
        return <Badge variant="success">Sudah Ditransfer</Badge>;
      case 'pending':
        return <Badge variant="warning">Siap Transfer</Badge>;
      case 'failed':
        return <Badge variant="danger">Gagal</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const filteredSettlements = settlements
    .filter((s) => {
      const statusMatch =
        statusFilter === 'pending' ? s.status === 'pending' :
        statusFilter === 'processed' ? s.status === 'processed' :
        true;
      const typeMatch =
        typeFilter === 'normal' ? !s.is_forfeiture :
        typeFilter === 'forfeiture' ? !!s.is_forfeiture :
        true;
      return statusMatch && typeMatch;
    })
    // Urutkan: yang "baru" (24 jam) dan pending paling atas, lalu sisanya by newest
    .sort((a, b) => {
      const aNew = isNew(a.created_at) && a.status === 'pending';
      const bNew = isNew(b.created_at) && b.status === 'pending';
      if (aNew && !bNew) return -1;
      if (!aNew && bNew) return 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const pendingCount = settlements.filter((s) => s.status === 'pending').length;
  const newPendingCount = settlements.filter((s) => s.status === 'pending' && isNew(s.created_at)).length;
  const forfeitureCount = settlements.filter((s) => s.is_forfeiture && s.status === 'pending').length;
  const processedCount = settlements.filter((s) => s.status === 'processed').length;

  const providerSummaries = React.useMemo(() => {
    const summary: Record<string, any> = {};
    filteredSettlements.forEach((s) => {
      if (s.status !== 'pending') return;
      
      const pid = s.provider_id;
      if (!summary[pid]) {
        summary[pid] = {
          provider_id: pid,
          provider_name: s.provider?.company_name || s.provider?.full_name || 'Tidak Diketahui',
          bank_name: s.provider?.bank_name || '-',
          bank_account_no: s.provider?.bank_account_no || '-',
          bank_account_name: s.provider?.bank_account_name || '-',
          total_net: 0,
          items_count: 0,
          settlement_ids: [] as string[],
        };
      }
      summary[pid].total_net += s.net_amount;
      summary[pid].items_count += 1;
      summary[pid].settlement_ids.push(s.id);
    });
    return Object.values(summary).sort((a: any, b: any) => b.total_net - a.total_net);
  }, [filteredSettlements]);

  const handleBulkTransfer = async (providerName: string, settlementIds: string[], totalAmount: number) => {
    if (!confirm(`Apakah Anda yakin ingin mentransfer total ${formatRupiah(totalAmount)} (${settlementIds.length} unit) ke provider ${providerName}?`)) return;
    
    setIsDisbursingBulk(true);
    let successCount = 0;
    let failCount = 0;
    
    for (const id of settlementIds) {
      try {
        const response = await apiFetch(`/payments/settlements/${id}/disburse`, { method: 'POST' });
        const data = await response.json();
        if (response.ok && data.success) {
          successCount++;
        } else {
          failCount++;
        }
      } catch (err) {
        console.error(err);
        failCount++;
      }
    }
    
    setIsDisbursingBulk(false);
    
    if (failCount > 0) {
      toast.error(`Transfer selesai dengan ${failCount} kegagalan. ${successCount} berhasil diproses.`);
    } else {
      toast.success(`Berhasil mentransfer ${successCount} pembayaran ke ${providerName}!`);
    }
    
    fetchSettlements();
  };

  return (
    <DashboardLayout breadcrumbParent="Keuangan" breadcrumbCurrent="Transfer Provider">
      <div className="toolbar">
        <div className="toolbar-left">
          <h1 className="page-title">Pembayaran Unit (Transfer Provider)</h1>
          <p className="page-subtitle">
            Daftar pencairan hasil penjualan dan forteit NIPL untuk provider.
          </p>
        </div>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
        <div style={{
          background: 'white', border: '1px solid var(--wf-border)', borderRadius: '10px',
          padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '4px',
        }}>
          <div style={{ fontSize: '0.78rem', color: '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Menunggu Transfer
          </div>
          <div style={{ fontSize: '1.7rem', fontWeight: 800, color: pendingCount > 0 ? '#e65100' : '#333' }}>
            {pendingCount}
          </div>
          {newPendingCount > 0 && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '5px',
              background: '#fff3e0', color: '#e65100', border: '1px solid #ffcc02',
              borderRadius: '20px', padding: '2px 10px', fontSize: '0.75rem', fontWeight: 700, width: 'fit-content',
            }}>
              &#10022; {newPendingCount} baru hari ini
            </div>
          )}
        </div>
        <div style={{
          background: 'white', border: '1px solid var(--wf-border)', borderRadius: '10px',
          padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '4px',
        }}>
          <div style={{ fontSize: '0.78rem', color: '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Forteit Menunggu
          </div>
          <div style={{ fontSize: '1.7rem', fontWeight: 800, color: forfeitureCount > 0 ? '#c62828' : '#333' }}>
            {forfeitureCount}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#888' }}>kasus forteit NIPL</div>
        </div>
        <div style={{
          background: 'white', border: '1px solid var(--wf-border)', borderRadius: '10px',
          padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '4px',
        }}>
          <div style={{ fontSize: '0.78rem', color: '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Sudah Ditransfer
          </div>
          <div style={{ fontSize: '1.7rem', fontWeight: 800, color: '#2e7d32' }}>
            {processedCount}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#888' }}>settlement selesai</div>
        </div>
      </div>

      {forfeitureCount > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #fff3cd, #fff8e1)',
          border: '1px solid #ffc107', borderLeft: '4px solid #ff9800',
          borderRadius: '8px', padding: '0.9rem 1.2rem', marginBottom: '1rem',
          display: 'flex', alignItems: 'center', gap: '0.7rem',
        }}>
          <span style={{ fontSize: '1.4rem' }}>&#9888;&#65039;</span>
          <div>
            <strong style={{ color: '#856404' }}>
              {forfeitureCount} settlement forteit NIPL menunggu transfer
            </strong>
            <div style={{ fontSize: '0.82rem', color: '#856404', marginTop: '2px' }}>
              Pembayaran &frac12; jaminan NIPL kepada provider karena pemenang lelang tidak melunasi unit.
            </div>
          </div>
        </div>
      )}

      <Card className="mb-2">
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div>
            <label className="form-label" style={{ fontWeight: '600', fontSize: '0.85rem' }}>Mode Tampilan</label>
            <select
              className="form-select"
              style={{ width: '200px', height: '36px', padding: '0 0.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--wf-border)', background: 'white' }}
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value as any)}
            >
              <option value="unit">Berdasarkan Unit</option>
              <option value="provider">Berdasarkan Provider</option>
            </select>
          </div>
          <div>
            <label className="form-label" style={{ fontWeight: '600', fontSize: '0.85rem' }}>Filter Status</label>
            <select
              className="form-select"
              style={{ width: '200px', height: '36px', padding: '0 0.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--wf-border)', background: 'white' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Semua Status</option>
              <option value="pending">Siap Transfer</option>
              <option value="processed">Sudah Ditransfer</option>
            </select>
          </div>
          <div>
            <label className="form-label" style={{ fontWeight: '600', fontSize: '0.85rem' }}>Tipe Settlement</label>
            <select
              className="form-select"
              style={{ width: '220px', height: '36px', padding: '0 0.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--wf-border)', background: 'white' }}
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="">Semua Tipe</option>
              <option value="normal">Normal (Pelunasan)</option>
              <option value="forfeiture">Forteit NIPL</option>
            </select>
          </div>
          {statusFilter === 'pending' && newPendingCount > 0 && (
            <div style={{
              marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px',
              background: '#fff8e1', border: '1px solid #ffc107', borderRadius: '8px',
              padding: '6px 14px', fontSize: '0.82rem', color: '#856404', fontWeight: 600,
            }}>
              <span>&#10022;</span>
              <span>{newPendingCount} dari {pendingCount} settlement baru masuk hari ini — tampil paling atas</span>
            </div>
          )}
        </div>
      </Card>

      <Card>
        {viewMode === 'provider' ? (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Provider</th>
                  <th>Info Rekening</th>
                  <th>Jumlah Unit</th>
                  <th>Total Transfer (Net)</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="text-center">Memuat rekap provider...</td></tr>
                ) : providerSummaries.length === 0 ? (
                  <tr><td colSpan={5} className="text-center text-muted">Tidak ada data pembayaran yang siap ditransfer (pending).</td></tr>
                ) : (
                  providerSummaries.map((summary: any) => (
                    <tr key={summary.provider_id}>
                      <td>
                        <strong>{summary.provider_name}</strong>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.85rem' }}>
                          <div><strong>Bank:</strong> {summary.bank_name}</div>
                          <div><strong>No. Rekening:</strong> {summary.bank_account_no}</div>
                          <div><strong>Atas Nama:</strong> {summary.bank_account_name}</div>
                        </div>
                      </td>
                      <td>
                        <Badge variant="warning">{summary.items_count} Siap Transfer</Badge>
                      </td>
                      <td>
                        <strong className="text-primary" style={{ fontSize: '1.1rem' }}>
                          {formatRupiah(summary.total_net)}
                        </strong>
                      </td>
                      <td>
                        {['admin', 'superadmin'].includes(userRole) && (
                          <Button
                            variant="success"
                            size="sm"
                            disabled={isDisbursingBulk}
                            onClick={() => handleBulkTransfer(summary.provider_name, summary.settlement_ids, summary.total_net)}
                          >
                            {isDisbursingBulk ? 'Memproses...' : 'Transfer Semua'}
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Provider</th>
                  <th>Unit / Sesi</th>
                <th>Tipe</th>
                <th>Dasar Pembayaran</th>
                <th>Nilai Transfer (Net)</th>
                <th>Status</th>
                <th style={{ whiteSpace: 'nowrap' }}>Waktu Verifikasi Lunas</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center">Memuat daftar settlement...</td></tr>
              ) : filteredSettlements.length === 0 ? (
                <tr><td colSpan={8} className="text-center text-muted">Tidak ada data settlement.</td></tr>
              ) : (
                filteredSettlements.map((settlement) => {
                  const itemIsNew = isNew(settlement.created_at) && settlement.status === 'pending';
                  return (
                    <tr
                      key={settlement.id}
                      style={itemIsNew ? {
                        background: 'linear-gradient(to right, #fffde7 0%, white 60%)',
                        borderLeft: '3px solid #ffc107',
                      } : {}}
                    >
                      <td>
                        <strong>{settlement.provider?.company_name || settlement.provider?.full_name}</strong>
                      </td>
                      <td>
                        <strong>{settlement.lot?.asset?.title}</strong>
                        <div className="text-muted" style={{ fontSize: '0.8rem' }}>
                          Sesi: {settlement.lot?.session?.title || '-'}
                        </div>
                      </td>
                      <td>
                        {settlement.is_forfeiture ? (
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: '4px',
                            background: '#fff3e0', color: '#e65100', border: '1px solid #ff9800',
                            borderRadius: '12px', padding: '2px 10px', fontSize: '0.78rem', fontWeight: 600,
                          }}>
                            Forteit NIPL
                          </span>
                        ) : (
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: '4px',
                            background: '#e8f5e9', color: '#2e7d32', border: '1px solid #66bb6a',
                            borderRadius: '12px', padding: '2px 10px', fontSize: '0.78rem', fontWeight: 600,
                          }}>
                            Pelunasan
                          </span>
                        )}
                      </td>
                      <td>
                        {settlement.is_forfeiture ? (
                          <div>
                            <div style={{ fontSize: '0.78rem', color: '#888' }}>Jaminan NIPL</div>
                            <div>{formatRupiah(settlement.nipl_forfeiture_amount || 0)}</div>
                            <div style={{ fontSize: '0.78rem', color: '#e65100' }}>
                              &frac12; = {formatRupiah(settlement.net_amount)}
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div style={{ fontSize: '0.78rem', color: '#888' }}>Harga Palu</div>
                            <div>{formatRupiah(settlement.gross_amount)}</div>
                          </div>
                        )}
                      </td>
                      <td>
                        <strong className="text-primary">{formatRupiah(settlement.net_amount)}</strong>
                        {!settlement.is_forfeiture && (
                          <div className="text-muted" style={{ fontSize: '0.8rem' }}>
                            Potongan: {formatRupiah(settlement.commission_deducted)}
                          </div>
                        )}
                      </td>
                      <td>{getStatusBadge(settlement.status)}</td>
                      <td>
                        <div style={{ fontSize: '0.82rem', color: '#555', whiteSpace: 'nowrap' }}>
                          {formatDateTime(settlement.created_at)}
                        </div>
                        {itemIsNew && (
                          <div style={{
                            display: 'inline-flex', alignItems: 'center', gap: '4px',
                            background: '#fff3e0', color: '#e65100', border: '1px solid #ffc107',
                            borderRadius: '20px', padding: '1px 8px', fontSize: '0.72rem', fontWeight: 700,
                            marginTop: '3px',
                          }}>
                            &#10022; BARU
                          </div>
                        )}
                        {settlement.transferred_at && (
                          <div style={{ fontSize: '0.75rem', color: '#2e7d32', marginTop: '2px' }}>
                            Ditransfer: {formatDateTime(settlement.transferred_at)}
                          </div>
                        )}
                      </td>
                      <td>
                        {['admin', 'superadmin'].includes(userRole) && settlement.status === 'pending' && (
                          <Button
                            variant={settlement.is_forfeiture ? 'gold' : 'success'}
                            size="sm"
                            onClick={() => handleTransfer(settlement.id, settlement.is_forfeiture)}
                          >
                            {settlement.is_forfeiture ? 'Transfer Forteit' : 'Transfer Sekarang'}
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        )}
      </Card>
    </DashboardLayout>
  );
}
