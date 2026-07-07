'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '../layout/DashboardLayout';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import { apiUrl } from '../../lib/api';

interface Deposit {
  id: string;
  user_id: string;
  session_id: string;
  amount: number;
  va_number?: string;
  va_bank?: string;
  payment_method?: string;
  status: 'pending' | 'paid' | 'expired' | 'refunded' | 'pending_refund';
  paid_at?: string;
  created_at: string;
  user?: {
    full_name: string;
    email: string;
    phone: string;
    bank_name?: string;
    bank_account_no?: string;
    bank_account_name?: string;
  };
  session?: {
    title: string;
  };
}

interface Invoice {
  id: string;
  lot_id: string;
  bidder_id: string;
  hammer_price: number;
  commission: number;
  tax: number;
  total: number;
  status: 'unpaid' | 'paid' | 'expired';
  due_date: string;
  paid_at?: string;
  created_at: string;
  bidder?: {
    full_name: string;
    email: string;
    phone: string;
  };
  lot?: {
    lot_number: number;
    asset: {
      title: string;
      category: string;
    };
    session: {
      title: string;
    };
  };
}

interface Settlement {
  id: string;
  lot_id: string;
  provider_id: string;
  gross_amount: number;
  commission_deducted: number;
  net_amount: number;
  status: 'pending' | 'processed' | 'failed';
  transferred_at?: string;
  created_at: string;
  provider?: {
    full_name: string;
    company_name?: string;
    email: string;
  };
  lot?: {
    lot_number: number;
    asset: {
      title: string;
      category: string;
    };
    session: {
      title: string;
    };
  };
}

export default function FinanceManager({
  initialTab = 'deposits',
}: {
  initialTab: 'deposits' | 'invoices' | 'refunds' | 'settlements';
}) {
  const [activeTab, setActiveTab] = useState<'deposits' | 'invoices' | 'refunds' | 'settlements'>(initialTab);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [refundQueue, setRefundQueue] = useState<Deposit[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState('');
  const [settlementStatusFilter, setSettlementStatusFilter] = useState('');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);



  const fetchDeposits = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      let query = `?page=1&per_page=50`;
      if (statusFilter) query += `&status=${statusFilter}`;

      const response = await fetch(apiUrl(`/deposits${query}`), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setDeposits(data.data);
      } else {
        setDeposits([]);
      }
    } catch (err) {
      setDeposits([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      let query = `?page=1&per_page=50`;
      if (invoiceStatusFilter) query += `&status=${invoiceStatusFilter}`;

      const response = await fetch(apiUrl(`/documents/invoices${query}`), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setInvoices(data.data);
      } else {
        setInvoices([]);
      }
    } catch (err) {
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchRefundQueue = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(apiUrl(`/payments/deposits/refund-queue?page=1&per_page=50`), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setRefundQueue(data.data);
      } else {
        setRefundQueue([]);
      }
    } catch (err) {
      setRefundQueue([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSettlements = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      let query = `?page=1&per_page=50`;
      if (settlementStatusFilter) query += `&status=${settlementStatusFilter}`;

      const response = await fetch(apiUrl(`/payments/settlements${query}`), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setSettlements(data.data);
      } else {
        setSettlements([]);
      }
    } catch (err) {
      setSettlements([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (invoiceId: string, type: 'invoice' | 'sj' | 'bast') => {
    const downloadKey = `${type}-${invoiceId}`;
    setDownloadingId(downloadKey);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(apiUrl(`/documents/${type}/${invoiceId}/download`), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error?.message || 'Gagal mengunduh dokumen');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      let prefix = 'invoice';
      if (type === 'sj') prefix = 'surat-jalan';
      if (type === 'bast') prefix = 'bast';

      a.download = `${prefix}-${invoiceId.substring(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: any) {
      alert(error.message || 'Terjadi kesalahan saat mengunduh dokumen.');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleApproveRefund = async (depositId: string) => {
    setProcessingId(depositId);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(apiUrl(`/payments/deposits/${depositId}/refund`), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || 'Gagal menyetujui refund');
      }

      alert('Refund uang jaminan deposit berhasil diproses!');
      fetchRefundQueue();
    } catch (error: any) {
      alert(error.message || 'Terjadi kesalahan saat memproses refund.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDisburseSettlement = async (settlementId: string) => {
    setProcessingId(settlementId);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(apiUrl(`/payments/settlements/${settlementId}/disburse`), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || 'Gagal mencairkan dana settlement');
      }

      alert('Pencairan dana transfer bank partner via sistem berhasil diselesaikan!');
      fetchSettlements();
    } catch (error: any) {
      alert(error.message || 'Terjadi kesalahan saat mencairkan dana.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleMarkPaid = async (depositId: string) => {
    setProcessingId(depositId);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(apiUrl(`/deposits/${depositId}/mark-paid`), {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || 'Gagal menandai lunas deposit');
      }

      alert('Deposit berhasil ditandai Paid (Lunas)!');
      fetchDeposits();
    } catch (error: any) {
      alert(error.message || 'Terjadi kesalahan saat memproses deposit.');
    } finally {
      setProcessingId(null);
    }
  };



  useEffect(() => {
    if (activeTab === 'deposits') {
      fetchDeposits();
    } else if (activeTab === 'invoices') {
      fetchInvoices();
    } else if (activeTab === 'refunds') {
      fetchRefundQueue();
    } else if (activeTab === 'settlements') {
      fetchSettlements();
    }
  }, [statusFilter, invoiceStatusFilter, settlementStatusFilter, activeTab]);

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(val);
  };

  const getStatusBadge = (status: Deposit['status']) => {
    switch (status) {
      case 'paid':
        return <Badge variant="success">Lunas (NIPL Aktif)</Badge>;
      case 'pending':
        return <Badge variant="warning">Menunggu Pembayaran</Badge>;
      case 'expired':
        return <Badge variant="default">Expired</Badge>;
      case 'refunded':
        return <Badge variant="info">Refunded</Badge>;
      case 'pending_refund':
        return <Badge variant="warning">Menunggu Refund</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const getInvoiceStatusBadge = (status: Invoice['status']) => {
    switch (status) {
      case 'paid':
        return <Badge variant="success">LUNAS</Badge>;
      case 'unpaid':
        return <Badge variant="danger">BELUM LUNAS</Badge>;
      case 'expired':
        return <Badge variant="default">EXPIRED</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const getSettlementStatusBadge = (status: Settlement['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="warning">Pending Cair</Badge>;
      case 'processed':
        return <Badge variant="success">Selesai Ditransfer</Badge>;
      case 'failed':
        return <Badge variant="danger">Gagal</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  return (
    <DashboardLayout
      breadcrumbParent="Keuangan"
      breadcrumbCurrent={
        activeTab === 'deposits'
          ? 'Deposit NIPL'
          : activeTab === 'invoices'
          ? 'Invoice Pelunasan'
          : activeTab === 'refunds'
          ? 'Antrean Refund'
          : 'Pencairan Mitra'
      }
    >
      {/* Tab Navigation */}
      <div className="tabs-container mb-3" style={{ borderBottom: '1px solid #cbd5e0', display: 'flex', gap: '0.25rem', overflowX: 'auto' }}>
        <button
          onClick={() => {
            setActiveTab('deposits');
            setLoading(true);
          }}
          className={`btn btn-sm ${activeTab === 'deposits' ? 'btn-primary' : 'btn-outline'}`}
          style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0, whiteSpace: 'nowrap' }}
        >
          💳 Deposit NIPL
        </button>
        <button
          onClick={() => {
            setActiveTab('invoices');
            setLoading(true);
          }}
          className={`btn btn-sm ${activeTab === 'invoices' ? 'btn-primary' : 'btn-outline'}`}
          style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0, whiteSpace: 'nowrap' }}
        >
          📄 Invoice Pelunasan
        </button>
        <button
          onClick={() => {
            setActiveTab('refunds');
            setLoading(true);
          }}
          className={`btn btn-sm ${activeTab === 'refunds' ? 'btn-primary' : 'btn-outline'}`}
          style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0, whiteSpace: 'nowrap' }}
        >
          💸 Antrean Refund NIPL
        </button>
        <button
          onClick={() => {
            setActiveTab('settlements');
            setLoading(true);
          }}
          className={`btn btn-sm ${activeTab === 'settlements' ? 'btn-primary' : 'btn-outline'}`}
          style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0, whiteSpace: 'nowrap' }}
        >
          🏦 Pencairan Mitra (Settlements)
        </button>
      </div>

      {activeTab === 'deposits' && (
        <>
          <div className="toolbar">
            <div className="toolbar-left">
              <h1 className="page-title">Monitoring Deposit Jaminan NIPL</h1>
              <p className="page-subtitle">Daftar transaksi Virtual Account (VA) untuk pembelian Nomor Induk Peserta Lelang (NIPL).</p>
            </div>
            <div className="toolbar-right">
              <div className="filter-group d-flex gap-1">
                <button onClick={() => setStatusFilter('')} className={`btn btn-sm ${statusFilter === '' ? 'btn-primary' : 'btn-outline'}`}>Semua</button>
                <button onClick={() => setStatusFilter('paid')} className={`btn btn-sm ${statusFilter === 'paid' ? 'btn-success' : 'btn-outline'}`}>Lunas</button>
                <button onClick={() => setStatusFilter('pending')} className={`btn btn-sm ${statusFilter === 'pending' ? 'btn-warning' : 'btn-outline'}`}>Pending</button>
                <button onClick={() => setStatusFilter('expired')} className={`btn btn-sm ${statusFilter === 'expired' ? 'btn-danger' : 'btn-outline'}`}>Expired</button>
              </div>
            </div>
          </div>

          <Card>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Waktu Transaksi</th>
                    <th>Bidder</th>
                    <th>Jumlah Jaminan</th>
                    <th>Virtual Account (VA)</th>
                    <th>Status Pembayaran</th>
                    <th>Waktu Lunas</th>
                    <th style={{ textAlign: 'center' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={7} className="text-center">Memuat data transaksi deposit...</td></tr>
                  ) : deposits.length === 0 ? (
                    <tr><td colSpan={7} className="text-center text-muted">Tidak ada transaksi deposit ditemukan.</td></tr>
                  ) : (
                    deposits.map((deposit) => (
                      <tr key={deposit.id}>
                        <td>{new Date(deposit.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                        <td>
                          {deposit.user ? (
                            <div>
                              <strong>{deposit.user.full_name}</strong>
                              <div className="text-muted" style={{ fontSize: '0.8rem' }}>{deposit.user.email}</div>
                            </div>
                          ) : (
                            <span className="text-muted">User ID: {deposit.user_id.substring(0, 8)}...</span>
                          )}
                        </td>
                        <td><strong className="text-primary">{formatRupiah(deposit.amount)}</strong></td>
                        <td>
                          {deposit.va_number ? (
                            <div>
                              <span style={{ textTransform: 'uppercase', fontWeight: 'bold', fontSize: '0.8rem' }} className="badge badge-outline">{deposit.va_bank}</span>
                              <span style={{ marginLeft: '6px', fontFamily: 'monospace', fontWeight: '600' }}>{deposit.va_number}</span>
                            </div>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </td>
                        <td>{getStatusBadge(deposit.status)}</td>
                        <td>{deposit.paid_at ? new Date(deposit.paid_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : <span className="text-muted">-</span>}</td>
                        <td style={{ textAlign: 'center' }}>
                          {deposit.status === 'pending' && deposit.payment_method === 'manual_transfer' && (
                            <button
                              onClick={() => handleMarkPaid(deposit.id)}
                              className="btn btn-xs btn-success"
                              disabled={processingId !== null}
                              style={{ padding: '4px 8px', fontSize: '0.75rem', fontWeight: '600' }}
                              title="Tandai Paid untuk deposit manual"
                            >
                              {processingId === deposit.id ? 'Memproses...' : '✓ Tandai Paid'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {activeTab === 'invoices' && (
        <>
          <div className="toolbar">
            <div className="toolbar-left">
              <h1 className="page-title">Monitoring Invoice & Dokumen Resmi</h1>
              <p className="page-subtitle">Daftar invoice pelunasan pemenang lelang beserta menu cetak/unduh PDF dokumen resmi.</p>
            </div>
            <div className="toolbar-right">
              <div className="filter-group d-flex gap-1">
                <button onClick={() => setInvoiceStatusFilter('')} className={`btn btn-sm ${invoiceStatusFilter === '' ? 'btn-primary' : 'btn-outline'}`}>Semua</button>
                <button onClick={() => setInvoiceStatusFilter('paid')} className={`btn btn-sm ${invoiceStatusFilter === 'paid' ? 'btn-success' : 'btn-outline'}`}>Lunas</button>
                <button onClick={() => setInvoiceStatusFilter('unpaid')} className={`btn btn-sm ${invoiceStatusFilter === 'unpaid' ? 'btn-danger' : 'btn-outline'}`}>Belum Lunas</button>
              </div>
            </div>
          </div>

          <Card>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Waktu Invoice</th>
                    <th>Bidder Pemenang</th>
                    <th>Aset & Lot</th>
                    <th>Total Pelunasan</th>
                    <th>Jatuh Tempo</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'center', width: '320px' }}>Cetak Dokumen Resmi (PDF)</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={7} className="text-center">Memuat data invoice pelunasan...</td></tr>
                  ) : invoices.length === 0 ? (
                    <tr><td colSpan={7} className="text-center text-muted">Tidak ada data invoice pelunasan ditemukan.</td></tr>
                  ) : (
                    invoices.map((invoice) => (
                      <tr key={invoice.id}>
                        <td>{new Date(invoice.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                        <td>
                          {invoice.bidder ? (
                            <div>
                              <strong>{invoice.bidder.full_name}</strong>
                              <div className="text-muted" style={{ fontSize: '0.8rem' }}>{invoice.bidder.email}</div>
                            </div>
                          ) : (
                            <span className="text-muted">Bidder ID: {invoice.bidder_id.substring(0, 8)}...</span>
                          )}
                        </td>
                        <td style={{ maxWidth: '240px' }}>
                          {invoice.lot ? (
                            <div>
                              <span style={{ fontSize: '0.75rem', padding: '2px 6px', borderRadius: '4px', marginRight: '6px', textTransform: 'uppercase', background: invoice.lot.asset.category === 'mobil' ? '#ebf8ff' : '#fefcbf', color: invoice.lot.asset.category === 'mobil' ? '#2b6cb0' : '#b7791f' }}>
                                {invoice.lot.asset.category}
                              </span>
                              <strong>Lot #{invoice.lot.lot_number}</strong>
                              <div style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', fontSize: '0.85rem' }} title={invoice.lot.asset.title}>{invoice.lot.asset.title}</div>
                            </div>
                          ) : (
                            <span className="text-muted">Lot ID: {invoice.lot_id.substring(0, 8)}...</span>
                          )}
                        </td>
                        <td><strong className="text-danger">{formatRupiah(Number(invoice.total))}</strong></td>
                        <td>{new Date(invoice.due_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                        <td>{getInvoiceStatusBadge(invoice.status)}</td>
                        <td style={{ textAlign: 'center' }}>
                          <div className="d-flex gap-1 justify-content-center">
                            <button onClick={() => handleDownload(invoice.id, 'invoice')} className="btn btn-xs btn-primary" disabled={downloadingId !== null} style={{ padding: '4px 8px', fontSize: '0.75rem' }}>
                              {downloadingId === `invoice-${invoice.id}` ? 'Loading...' : '📄 Invoice'}
                            </button>
                            <button onClick={() => handleDownload(invoice.id, 'sj')} className={`btn btn-xs ${invoice.status === 'paid' ? 'btn-success' : 'btn-outline'}`} disabled={invoice.status !== 'paid' || downloadingId !== null} style={{ padding: '4px 8px', fontSize: '0.75rem' }}>
                              {downloadingId === `sj-${invoice.id}` ? 'Loading...' : '🚚 Surat Jalan'}
                            </button>
                            <button onClick={() => handleDownload(invoice.id, 'bast')} className={`btn btn-xs ${invoice.status === 'paid' ? 'btn-gold' : 'btn-outline'}`} disabled={invoice.status !== 'paid' || downloadingId !== null} style={{ padding: '4px 8px', fontSize: '0.75rem' }}>
                              {downloadingId === `bast-${invoice.id}` ? 'Loading...' : '🤝 BAST'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {activeTab === 'refunds' && (
        <>
          <div className="toolbar">
            <div className="toolbar-left">
              <h1 className="page-title">Antrean Pengembalian Jaminan NIPL</h1>
              <p className="page-subtitle">Daftar deposit jaminan bidder yang kalah lelang dan harus dikembalikan (Refund) secara manual.</p>
            </div>
          </div>

          <Card>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Waktu Minta</th>
                    <th>Bidder</th>
                    <th>Sesi Lelang</th>
                    <th>Uang Jaminan</th>
                    <th>Metode VA Awal</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'center', width: '200px' }}>Tindakan</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={7} className="text-center">Memuat antrean refund...</td></tr>
                  ) : refundQueue.length === 0 ? (
                    <tr><td colSpan={7} className="text-center text-muted">Tidak ada antrean refund NIPL saat ini.</td></tr>
                  ) : (
                    refundQueue.map((refund) => (
                      <tr key={refund.id}>
                        <td>{new Date(refund.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                        <td>
                          {refund.user ? (
                            <div>
                              <strong>{refund.user.full_name}</strong>
                              <div className="text-muted" style={{ fontSize: '0.8rem' }}>{refund.user.email}</div>
                            </div>
                          ) : (
                            <span className="text-muted">User ID: {refund.user_id.substring(0, 8)}...</span>
                          )}
                        </td>
                        <td>{refund.session?.title || 'Sesi ID: ' + refund.session_id.substring(0, 8)}</td>
                        <td><strong className="text-primary">{formatRupiah(refund.amount)}</strong></td>
                        <td>
                          {refund.va_number ? (
                            <div>
                              <span style={{ textTransform: 'uppercase', fontWeight: 'bold', fontSize: '0.8rem' }} className="badge badge-outline">{refund.va_bank}</span>
                              <span style={{ marginLeft: '6px', fontFamily: 'monospace' }}>{refund.va_number}</span>
                            </div>
                          ) : refund.payment_method === 'manual_transfer' ? (
                            <div>
                              <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#d97706' }}>TRANSFER MANUAL</div>
                              {refund.user?.bank_name ? (
                                <div style={{ fontSize: '0.75rem', marginTop: '2px' }}>
                                  <strong>{refund.user.bank_name}</strong> - {refund.user.bank_account_no}
                                  <br/>a/n {refund.user.bank_account_name || refund.user.full_name}
                                </div>
                              ) : (
                                <div style={{ fontSize: '0.75rem', color: 'red' }}>Rekening Bidder Belum Diisi</div>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </td>
                        <td>{getStatusBadge(refund.status)}</td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            onClick={() => handleApproveRefund(refund.id)}
                            className="btn btn-xs btn-success"
                            disabled={processingId !== null}
                            style={{ padding: '6px 12px', fontSize: '0.75rem', fontWeight: '600' }}
                          >
                            {processingId === refund.id ? 'Memproses...' : refund.payment_method === 'manual_transfer' ? '✓ Telah Direfund' : '✓ Setujui Refund'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {activeTab === 'settlements' && (
        <>
          <div className="toolbar">
            <div className="toolbar-left">
              <h1 className="page-title">Pencairan Dana Settlement Mitra (Provider)</h1>
              <p className="page-subtitle">Daftar bagi hasil unit lelang sold ke rekening provider setelah dipotong komisi lelang.</p>
            </div>
            <div className="toolbar-right">
              <div className="filter-group d-flex gap-1">
                <button onClick={() => setSettlementStatusFilter('')} className={`btn btn-sm ${settlementStatusFilter === '' ? 'btn-primary' : 'btn-outline'}`}>Semua</button>
                <button onClick={() => setSettlementStatusFilter('pending')} className={`btn btn-sm ${settlementStatusFilter === 'pending' ? 'btn-warning' : 'btn-outline'}`}>Pending Cair</button>
                <button onClick={() => setSettlementStatusFilter('processed')} className={`btn btn-sm ${settlementStatusFilter === 'processed' ? 'btn-success' : 'btn-outline'}`}>Selesai</button>
              </div>
            </div>
          </div>

          <Card>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Waktu Terbentuk</th>
                    <th>Mitra Provider</th>
                    <th>Aset & Lot</th>
                    <th>Harga Hammer</th>
                    <th>Potongan Balai (5%)</th>
                    <th>Penerimaan Bersih (Net)</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'center', width: '200px' }}>Pencairan Dana (Sistem)</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={8} className="text-center">Memuat data settlements...</td></tr>
                  ) : settlements.length === 0 ? (
                    <tr><td colSpan={8} className="text-center text-muted">Tidak ada data settlement ditemukan.</td></tr>
                  ) : (
                    settlements.map((settle) => (
                      <tr key={settle.id}>
                        <td>{new Date(settle.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                        <td>
                          {settle.provider ? (
                            <div>
                              <strong>{settle.provider.full_name}</strong>
                              {settle.provider.company_name && <div className="text-muted" style={{ fontSize: '0.8rem' }}>{settle.provider.company_name}</div>}
                            </div>
                          ) : (
                            <span className="text-muted">Provider ID: {settle.provider_id.substring(0, 8)}...</span>
                          )}
                        </td>
                        <td style={{ maxWidth: '200px' }}>
                          {settle.lot ? (
                            <div>
                              <strong>Lot #{settle.lot.lot_number}</strong>
                              <div style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', fontSize: '0.85rem' }} title={settle.lot.asset.title}>{settle.lot.asset.title}</div>
                            </div>
                          ) : (
                            <span className="text-muted">Lot ID: {settle.lot_id.substring(0, 8)}...</span>
                          )}
                        </td>
                        <td>{formatRupiah(settle.gross_amount)}</td>
                        <td><span className="text-danger">-{formatRupiah(settle.commission_deducted)}</span></td>
                        <td><strong className="text-success">{formatRupiah(settle.net_amount)}</strong></td>
                        <td>{getSettlementStatusBadge(settle.status)}</td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            onClick={() => handleDisburseSettlement(settle.id)}
                            className="btn btn-xs btn-primary"
                            disabled={settle.status !== 'pending' || processingId !== null}
                            style={{ padding: '6px 12px', fontSize: '0.75rem', fontWeight: '600' }}
                            title={settle.status !== 'pending' ? 'Sudah dicairkan' : 'Cairkan dana via sistem'}
                          >
                            {processingId === settle.id ? 'Memproses...' : settle.status === 'processed' ? '✓ Transferred' : '🏦 Cairkan Dana'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </DashboardLayout>
  );
}
