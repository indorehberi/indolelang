'use client';

import React, { useEffect, useState, useCallback } from 'react';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import { apiUrl } from '../../../lib/api';

interface RefundItem {
  id: string;
  user_id: string;
  session_id: string;
  amount: number;
  va_number?: string;
  va_bank?: string;
  payment_method?: string;
  status: string;
  created_at: string;
  user?: {
    full_name: string;
    email: string;
    phone: string;
  };
  session?: {
    title: string;
  };
}

const parseJwt = (token: string) => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (err) {
    return null;
  }
};

export default function RefundsPage() {
  const [refunds, setRefunds] = useState<RefundItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [userRole, setUserRole] = useState<string>('');

  const fetchRefunds = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      if (token) {
        const decoded = parseJwt(token);
        if (decoded) setUserRole(decoded.role);
      }

      // We might need to adjust the API to accept status filter, or we fetch all and filter in frontend for simplicity
      const response = await fetch(apiUrl(`/payments/deposits/refund-queue?page=1&per_page=100`), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setRefunds(Array.isArray(data.data) ? data.data : []);
      } else {
        setRefunds([]);
      }
    } catch (err) {
      console.error(err);
      setRefunds([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRefunds();
  }, [fetchRefunds]);

  const handleProcessRefund = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin mencairkan refund deposit ini via sistem?')) return;
    try {
      const response = await fetch(apiUrl(`/payments/deposits/${id}/refund`), {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        alert('Refund berhasil diproses!');
        fetchRefunds();
      } else {
        alert(data.error?.message || 'Gagal memproses refund');
      }
    } catch (err) { 
      console.error(err); 
      alert('Terjadi kesalahan koneksi');
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
      case 'refunded':
        return <Badge variant="success">Refunded</Badge>;
      case 'pending_refund':
        return <Badge variant="warning">Pending Approval</Badge>;
      case 'forfeited':
        return <Badge variant="danger">Forfeited (Hangus)</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const filteredRefunds = refunds.filter(r => {
    if (statusFilter === 'approved') return r.status === 'pending_refund';
    if (statusFilter === 'refunded') return r.status === 'refunded';
    return true; // semua
  });

  return (
    <DashboardLayout breadcrumbParent="Keuangan" breadcrumbCurrent="Daftar Refund NIPL">
      <div className="toolbar">
        <div className="toolbar-left">
          <h1 className="page-title">Antrean Refund Jaminan NIPL</h1>
          <p className="page-subtitle">Kelola pengembalian dana deposit Bidder yang tidak memenangkan lelang.</p>
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
              <option value="approved">Approved (Menunggu Refund)</option>
              <option value="refunded">Refunded (Selesai)</option>
            </select>
          </div>
        </div>
      </Card>

      <Card>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Bidder</th>
                <th>Nominal</th>
                <th>Status</th>
                <th>Waktu Pengajuan</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center">Memuat daftar refund...</td>
                </tr>
              ) : filteredRefunds.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center text-muted">Tidak ada antrean refund.</td>
                </tr>
              ) : (
                filteredRefunds.map((refund) => (
                  <tr key={refund.id}>
                    <td>
                      <div>
                        <strong>{refund.user?.full_name}</strong>
                        <div className="text-muted" style={{ fontSize: '0.8rem' }}>
                          {refund.user?.phone} | {refund.user?.email}
                        </div>
                      </div>
                    </td>
                    <td>
                      <strong className="text-primary">{formatRupiah(refund.amount)}</strong>
                    </td>
                    <td>{getStatusBadge(refund.status)}</td>
                    <td>
                      {new Date(refund.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td>
                      <div className="d-flex gap-1 flex-wrap">
                        {['admin', 'superadmin'].includes(userRole) && refund.status === 'pending_refund' && (
                          <Button variant="success" size="sm" onClick={() => handleProcessRefund(refund.id)}>Proses Refund</Button>
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
