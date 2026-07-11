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
  status: string;
  created_at: string;
  transferred_at?: string;
  provider?: {
    full_name: string;
    company_name?: string;
  };
  lot?: {
    asset: {
      title: string;
    };
    session?: {
      title: string;
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

export default function SettlementsPage() {
  const toast = useToast();
  const [settlements, setSettlements] = useState<SettlementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [userRole, setUserRole] = useState<string>('');

  const fetchSettlements = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      if (token) {
        const decoded = parseJwt(token);
        if (decoded) setUserRole(decoded.role);
      }

      // Default fetch all. Filter on client side for simplicity.
      const response = await apiFetch(`/payments/settlements?page=1&per_page=100`);
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

  const handleTransfer = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin mentransfer dana hasil penjualan ini ke rekening Provider?')) return;
    try {
      const response = await apiFetch(`/payments/settlements/${id}/disburse`, { method: 'POST' });
      const data = await response.json();
      if (response.ok && data.success) {
        toast.success('Transfer berhasil diproses melalui sistem!');
        fetchSettlements();
      } else {
        toast.error(data.error?.message || 'Gagal memproses transfer');
      }
    } catch (err) {
      console.error(err);
      toast.error('Terjadi kesalahan koneksi');
    }
  };

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(val);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'processed':
        return <Badge variant="success">Paid / Transferred</Badge>;
      case 'pending':
        return <Badge variant="warning">Approved (Pending Transfer)</Badge>;
      case 'failed':
        return <Badge variant="danger">Transfer Failed</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const filteredSettlements = settlements.filter(s => {
    if (statusFilter === 'approved') return s.status === 'pending';
    if (statusFilter === 'paid') return s.status === 'processed';
    return true; // semua
  });

  return (
    <DashboardLayout breadcrumbParent="Keuangan" breadcrumbCurrent="Transfer Provider">
      <div className="toolbar">
        <div className="toolbar-left">
          <h1 className="page-title">Pembayaran Unit (Transfer Provider)</h1>
          <p className="page-subtitle">Daftar nilai unit terjual yang siap ditransfer ke pemilik barang (Provider) setelah dipotong komisi.</p>
        </div>
      </div>

      <Card className="mb-2">
        <div className="grid-4" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ flex: 1, maxWidth: '300px' }}>
            <label className="form-label" style={{ fontWeight: '600', fontSize: '0.85rem' }}>Filter Status</label>
            <select
              className="form-select"
              style={{ width: '100%', height: '36px', padding: '0 0.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--wf-border)', background: 'white' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Semua (All)</option>
              <option value="approved">Approved (Siap Transfer)</option>
              <option value="paid">Paid (Sudah Ditransfer)</option>
            </select>
          </div>
        </div>
      </Card>

      <Card>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Provider</th>
                <th>Unit Terjual</th>
                <th>Harga Palu</th>
                <th>Nilai Ditransfer (Net)</th>
                <th>Status</th>
                <th>Tgl Dibuat</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center">Memuat daftar settlement...</td>
                </tr>
              ) : filteredSettlements.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-muted">Tidak ada unit yang siap ditransfer.</td>
                </tr>
              ) : (
                filteredSettlements.map((settlement) => (
                  <tr key={settlement.id}>
                    <td>
                      <div>
                        <strong>{settlement.provider?.company_name || settlement.provider?.full_name}</strong>
                      </div>
                    </td>
                    <td>
                      <div>
                        <strong>{settlement.lot?.asset?.title}</strong>
                        <div className="text-muted" style={{ fontSize: '0.8rem' }}>
                          Sesi: {settlement.lot?.session?.title || '-'}
                        </div>
                      </div>
                    </td>
                    <td>{formatRupiah(settlement.gross_amount)}</td>
                    <td>
                      <strong className="text-primary">{formatRupiah(settlement.net_amount)}</strong>
                      <div className="text-muted" style={{ fontSize: '0.8rem' }}>
                        Potongan: {formatRupiah(settlement.commission_deducted)}
                      </div>
                    </td>
                    <td>{getStatusBadge(settlement.status)}</td>
                    <td>
                      {new Date(settlement.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td>
                      <div className="d-flex gap-1 flex-wrap">
                        {['admin', 'superadmin'].includes(userRole) && settlement.status === 'pending' && (
                          <Button variant="success" size="sm" onClick={() => handleTransfer(settlement.id)}>Transfer Sekarang</Button>
                        )}
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
