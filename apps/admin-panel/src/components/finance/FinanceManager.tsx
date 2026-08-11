'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '../layout/DashboardLayout';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import { apiFetch } from '../../lib/api';
import { useToast } from '../../providers/ToastProvider';
import { exportToExcel } from '../../lib/excelExport';
import ColumnPicker, { useColumnVisibility, ColumnOption } from '../ui/ColumnPicker';

const DEPOSIT_COLUMNS: ColumnOption[] = [
  { key: 'created_at', label: 'Waktu Transaksi' },
  { key: 'bidder', label: 'Bidder', alwaysVisible: true },
  { key: 'nipl_code', label: 'No NIPL' },
  { key: 'amount', label: 'Jumlah Jaminan' },
  { key: 'va_number', label: 'Virtual Account (VA)' },
  { key: 'status', label: 'Status Pembayaran' },
  { key: 'paid_at', label: 'Waktu Lunas' },
  { key: 'actions', label: 'Aksi', alwaysVisible: true },
];

interface Deposit {
  id: string;
  user_id: string;
  session_id: string;
  amount: number;
  va_number?: string;
  va_bank?: string;
  payment_method?: string;
  status: 'pending' | 'pending_approval' | 'paid' | 'expired' | 'refunded' | 'pending_refund';
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
  status: 'pending' | 'processed' | 'failed' | 'unpaid';
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
    initialTab: 'deposits' | 'invoices' | 'checkout_orders' | 'refunds' | 'settlements';
}) {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'deposits' | 'invoices' | 'checkout_orders' | 'refunds' | 'settlements'>(initialTab);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [checkoutOrders, setCheckoutOrders] = useState<any[]>([]);
  const [refundQueue, setRefundQueue] = useState<Deposit[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const { visibleKeys, setVisibleKeys, isVisible } = useColumnVisibility('finance_deposit_list', DEPOSIT_COLUMNS);
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState('');
  const [settlementStatusFilter, setSettlementStatusFilter] = useState('');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Partial Verification Modal State
  const [verificationModalOpen, setVerificationModalOpen] = useState(false);
  const [selectedOrderToVerify, setSelectedOrderToVerify] = useState<any>(null);
  const [approvedInvoiceIds, setApprovedInvoiceIds] = useState<string[]>([]);

  const fetchDeposits = async () => {
    setLoading(true);
    try {
      let query = `?page=1&per_page=50`;
      if (statusFilter) query += `&status=${statusFilter}`;

      const response = await apiFetch(`/deposits${query}`);
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
      let query = `?page=1&per_page=50`;
      if (invoiceStatusFilter) query += `&status=${invoiceStatusFilter}`;

      const response = await apiFetch(`/documents/invoices${query}`);
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

  const fetchCheckoutOrders = async () => {
    setLoading(true);
    try {
      const response = await apiFetch(`/checkout/admin/orders`);
      const data = await response.json();
      if (response.ok && data.success) {
        setCheckoutOrders(data.data);
      } else {
        setCheckoutOrders([]);
      }
    } catch (err) {
      setCheckoutOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchRefundQueue = async () => {
    setLoading(true);
    try {
      const response = await apiFetch(`/payments/deposits/refund-queue?page=1&per_page=50`);
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
      let query = `?page=1&per_page=50`;
      if (settlementStatusFilter) query += `&status=${settlementStatusFilter}`;

      const response = await apiFetch(`/payments/settlements${query}`);
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
      const response = await apiFetch(`/documents/${type}/${invoiceId}/download`);

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
      toast.error(error.message || 'Terjadi kesalahan saat mengunduh dokumen.');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleApproveRefund = async (depositId: string) => {
    if (!confirm('Pastikan Anda sudah mentransfer dana refund ke rekening bidder secara manual sebelum menandai ini selesai. Lanjutkan?')) return;
    setProcessingId(depositId);
    try {
      const response = await apiFetch(`/payments/deposits/${depositId}/refund`, { method: 'POST' });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || 'Gagal menyetujui refund');
      }

      toast.success('Refund ditandai selesai. Bidder telah menerima notifikasi.');
      fetchRefundQueue();
    } catch (error: any) {
      toast.error(error.message || 'Terjadi kesalahan saat memproses refund.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDisburseSettlement = async (settlementId: string) => {
    if (!confirm('Pastikan Anda sudah mentransfer dana pencairan ke rekening provider secara manual sebelum menandai ini selesai. Lanjutkan?')) return;
    setProcessingId(settlementId);
    try {
      const response = await apiFetch(`/payments/settlements/${settlementId}/disburse`, { method: 'POST' });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || 'Gagal mencairkan dana settlement');
      }

      toast.success('Pencairan ditandai selesai. Provider telah menerima notifikasi.');
      fetchSettlements();
    } catch (error: any) {
      toast.error(error.message || 'Terjadi kesalahan saat mencairkan dana.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleMarkPaid = async (depositId: string) => {
    setProcessingId(depositId);
    try {
      const response = await apiFetch(`/deposits/${depositId}/mark-paid`, { method: 'PUT' });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || 'Gagal menandai lunas deposit');
      }

      toast.success('Deposit berhasil ditandai Paid (Lunas)!');
      fetchDeposits();
    } catch (error: any) {
      toast.error(error.message || 'Terjadi kesalahan saat memproses deposit.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleMarkRefunded = async (depositId: string) => {
    if (!confirm('Tandai deposit ini sebagai Refunded?')) return;
    
    setProcessingId(depositId);
    try {
      const response = await apiFetch(`/deposits/${depositId}/mark-refunded`, { method: 'PUT' });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || 'Gagal mengubah status deposit');
      }

      toast.success('Deposit berhasil ditandai telah dikembalikan (Refunded)');
      fetchDeposits();
    } catch (error: any) {
      toast.error(error.message || 'Terjadi kesalahan saat memproses refund.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleVerifyCheckout = async (orderId: string, status: 'paid' | 'rejected') => {
    if (!window.confirm(`Apakah Anda yakin ingin ${status === 'paid' ? 'menyetujui' : 'menolak'} pelunasan ini?`)) {
      return;
    }
    setProcessingId(orderId);
    try {
      const res = await apiFetch(`/checkout/admin/orders/${orderId}/verify`, {
        method: 'POST',
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      
      if (json.success) {
        toast.success('Status pelunasan berhasil diperbarui');
        fetchCheckoutOrders();
      } else {
        toast.error(json.error?.message || 'Gagal verifikasi pelunasan');
      }
    } catch (err) {
      toast.error('Terjadi kesalahan sistem');
    } finally {
      setProcessingId(null);
    }
  };

  const openVerificationModal = (order: any) => {
    setSelectedOrderToVerify(order);
    // By default, select all invoices in the order
    setApprovedInvoiceIds(order.invoices.map((inv: any) => inv.id));
    setVerificationModalOpen(true);
  };

  const closeVerificationModal = () => {
    setVerificationModalOpen(false);
    setSelectedOrderToVerify(null);
    setApprovedInvoiceIds([]);
  };

  const submitPartialVerification = async (status: 'paid' | 'rejected') => {
    if (!selectedOrderToVerify) return;
    
    if (status === 'paid' && approvedInvoiceIds.length === 0) {
      toast.error('Pilih setidaknya satu tagihan untuk disetujui, atau tolak pesanan.');
      return;
    }

    if (!window.confirm(`Apakah Anda yakin ingin ${status === 'paid' ? 'menyetujui' : 'menolak'} pelunasan ini?`)) {
      return;
    }
    setProcessingId(selectedOrderToVerify.id);
    try {
      const payload: any = { status };
      if (status === 'paid') {
        payload.approved_invoice_ids = approvedInvoiceIds;
      }
      const res = await apiFetch(`/checkout/admin/orders/${selectedOrderToVerify.id}/verify`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      
      if (json.success) {
        toast.success('Status pelunasan berhasil diperbarui');
        fetchCheckoutOrders();
        closeVerificationModal();
      } else {
        toast.error(json.error?.message || 'Gagal verifikasi pelunasan');
      }
    } catch (err) {
      toast.error('Terjadi kesalahan sistem');
    } finally {
      setProcessingId(null);
    }
  };

  useEffect(() => {
    if (activeTab === 'deposits') fetchDeposits();
    if (activeTab === 'invoices') fetchInvoices();
    if (activeTab === 'checkout_orders') fetchCheckoutOrders();
    if (activeTab === 'refunds') fetchRefundQueue();
    if (activeTab === 'settlements') fetchSettlements();
  }, [activeTab, statusFilter, invoiceStatusFilter, settlementStatusFilter]);

  const handleExport = () => {
    const dataToExport = deposits.map((d, index) => ({
      'No': index + 1,
      'Waktu Transaksi': d.created_at ? new Date(d.created_at).toLocaleString('id-ID') : '-',
      'Nama Bidder': d.user?.full_name || '-',
      'Email': d.user?.email || '-',
      'No. HP': d.user?.phone || '-',
      'Bank VA': d.va_bank || d.user?.bank_name || '-',
      'No. NIPL / VA': d.va_number || '-',
      'Jumlah Jaminan (Rp)': d.amount ? Number(d.amount) : 0,
      'Metode Pembayaran': d.payment_method || 'Virtual Account',
      'Status Deposit': d.status === 'paid' ? 'Lunas' : d.status === 'pending' ? 'Pending' : d.status === 'pending_approval' ? 'Menunggu Approval' : d.status === 'pending_refund' ? 'Menunggu Refund' : d.status === 'refunded' ? 'Refunded' : d.status === 'expired' ? 'Expired' : d.status,
      'Waktu Dibayar': d.paid_at ? new Date(d.paid_at).toLocaleString('id-ID') : '-'
    }));
    const ok = exportToExcel(dataToExport, 'Monitoring_Deposit_NIPL_IndoLelang', 'Deposit NIPL');
    if (ok) {
      toast.success('Berhasil mendownload Excel Monitoring Deposit NIPL (.xlsx)');
    } else {
      toast.error('Tidak ada data deposit NIPL untuk di-export');
    }
  };

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
      case 'pending_approval':
        return <Badge variant="warning">Menunggu Persetujuan Admin</Badge>;
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
      case 'unpaid':
        return <Badge variant="danger">Menunggu Pembeli</Badge>;
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
            setActiveTab('checkout_orders');
            setLoading(true);
          }}
          className={`btn btn-sm ${activeTab === 'checkout_orders' ? 'btn-primary' : 'btn-outline'}`}
          style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0, whiteSpace: 'nowrap' }}
        >
          🧾 Verifikasi Pelunasan
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
            <div className="toolbar-right" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button onClick={handleExport} className="btn btn-outline btn-sm d-flex align-items-center gap-1">
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>file_download</span>
                Export XLSX
              </button>
              <ColumnPicker
                columns={DEPOSIT_COLUMNS}
                visibleKeys={visibleKeys}
                onChange={setVisibleKeys}
                tableId="finance_deposit_list"
              />
              <div className="filter-group d-flex gap-1" style={{ flexWrap: 'wrap' }}>
                <button onClick={() => setStatusFilter('')} className={`btn btn-sm ${statusFilter === '' ? 'btn-primary' : 'btn-outline'}`}>Semua</button>
                <button onClick={() => setStatusFilter('paid')} className={`btn btn-sm ${statusFilter === 'paid' ? 'btn-success' : 'btn-outline'}`}>Lunas</button>
                <button onClick={() => setStatusFilter('pending')} className={`btn btn-sm ${statusFilter === 'pending' ? 'btn-warning' : 'btn-outline'}`}>Pending</button>
                <button onClick={() => setStatusFilter('pending_approval')} className={`btn btn-sm ${statusFilter === 'pending_approval' ? 'btn-warning' : 'btn-outline'}`}>Menunggu Approval</button>
                <button onClick={() => setStatusFilter('pending_refund')} className={`btn btn-sm ${statusFilter === 'pending_refund' ? 'btn-warning' : 'btn-outline'}`}>Menunggu Refund</button>
                <button onClick={() => setStatusFilter('refunded')} className={`btn btn-sm ${statusFilter === 'refunded' ? 'btn-info' : 'btn-outline'}`}>Refunded</button>
                <button onClick={() => setStatusFilter('expired')} className={`btn btn-sm ${statusFilter === 'expired' ? 'btn-danger' : 'btn-outline'}`}>Expired</button>
              </div>
            </div>
          </div>

          <Card>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    {isVisible('created_at') && <th>Waktu Transaksi</th>}
                    {isVisible('bidder') && <th>Bidder</th>}
                    {isVisible('nipl_code') && <th>No NIPL</th>}
                    {isVisible('amount') && <th>Jumlah Jaminan</th>}
                    {isVisible('va_number') && <th>Virtual Account (VA)</th>}
                    {isVisible('status') && <th>Status Pembayaran</th>}
                    {isVisible('paid_at') && <th>Waktu Lunas</th>}
                    {isVisible('actions') && <th style={{ textAlign: 'center' }}>Aksi</th>}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={visibleKeys.length} className="text-center">Memuat data transaksi deposit...</td></tr>
                  ) : deposits.length === 0 ? (
                    <tr><td colSpan={visibleKeys.length} className="text-center text-muted">Tidak ada transaksi deposit ditemukan.</td></tr>
                  ) : (
                    deposits.map((deposit) => (
                      <tr key={deposit.id}>
                        {isVisible('created_at') && <td>{new Date(deposit.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>}
                        {isVisible('bidder') && (
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
                        )}
                        {isVisible('nipl_code') && (
                          <td>
                            {deposit.user_id ? (
                              <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold', fontSize: '0.85rem' }}>
                                NIPL-{deposit.user_id.substring(0, 8).toUpperCase()}
                              </code>
                            ) : '-'}
                          </td>
                        )}
                        {isVisible('amount') && <td><strong className="text-primary">{formatRupiah(deposit.amount)}</strong></td>}
                        {isVisible('va_number') && (
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
                        )}
                        {isVisible('status') && <td>{getStatusBadge(deposit.status)}</td>}
                        {isVisible('paid_at') && <td>{deposit.paid_at ? new Date(deposit.paid_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : <span className="text-muted">-</span>}</td>}
                        {isVisible('actions') && (
                          <td style={{ textAlign: 'center' }}>
                            <div className="d-flex flex-column gap-1">
                              {(deposit as any).transfer_proof_url && (
                                <a 
                                  href={(deposit as any).transfer_proof_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="btn btn-xs btn-outline"
                                  style={{ color: '#2563eb', borderColor: '#bfdbfe', backgroundColor: '#eff6ff' }}
                                >
                                  📄 Bukti TF
                                </a>
                              )}
                              {(deposit.status === 'pending' || deposit.status === 'pending_approval') && (
                                <button onClick={() => handleMarkPaid(deposit.id)} className="btn btn-xs btn-success">
                                  Setujui (Paid)
                                </button>
                              )}
                              {deposit.status === 'pending_refund' && (
                                <button onClick={() => handleMarkRefunded(deposit.id)} className="btn btn-xs btn-warning">
                                  Tandai Refunded
                                </button>
                              )}
                            </div>
                          </td>
                        )}
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

      {activeTab === 'checkout_orders' && (
        <>
          <div className="toolbar">
            <div className="toolbar-left">
              <h1 className="page-title">Monitoring Pelunasan (Checkout)</h1>
              <p className="page-subtitle">Daftar checkout pelunasan pemenang lelang dan verifikasi bukti pembayaran.</p>
            </div>
          </div>

          <Card>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Waktu / ID Order</th>
                    <th>Bidder Pemenang</th>
                    <th>Total Lot</th>
                    <th>Total Bayar</th>
                    <th style={{ textAlign: 'center' }}>Bukti Transfer</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'center' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={7} className="text-center">Memuat data pelunasan...</td></tr>
                  ) : checkoutOrders.length === 0 ? (
                    <tr><td colSpan={7} className="text-center text-muted">Tidak ada data pelunasan ditemukan.</td></tr>
                  ) : (
                    checkoutOrders.map((order) => (
                      <tr key={order.id}>
                        <td>
                          {new Date(order.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          <div className="text-muted" style={{ fontSize: '0.75rem', fontFamily: 'monospace' }}>{order.id.substring(0,8)}...</div>
                        </td>
                        <td>
                          {order.bidder ? (
                            <div>
                              <strong>{order.bidder.full_name}</strong>
                              <div className="text-muted" style={{ fontSize: '0.8rem' }}>{order.bidder.email}</div>
                            </div>
                          ) : (
                            <span className="text-muted">Bidder ID: {order.bidder_id.substring(0, 8)}...</span>
                          )}
                        </td>
                        <td>{order.total_invoices} Lot</td>
                        <td><strong className="text-primary">{formatRupiah(Number(order.final_amount))}</strong></td>
                        <td style={{ textAlign: 'center' }}>
                          {order.transfer_proof_url ? (
                            <a 
                              href={order.transfer_proof_url} 
                              target="_blank" 
                              rel="noreferrer"
                              className="btn btn-xs btn-outline-primary"
                              style={{ padding: '4px 8px', fontSize: '0.75rem', fontWeight: '600' }}
                            >
                              📄 Lihat
                            </a>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </td>
                        <td>
                          {order.status === 'pending_approval' ? (
                            <Badge variant="warning">Menunggu Verifikasi</Badge>
                          ) : order.status === 'paid' ? (
                            <Badge variant="success">Lunas</Badge>
                          ) : order.status === 'rejected' ? (
                            <Badge variant="danger">Ditolak</Badge>
                          ) : (
                            <Badge variant="default">{order.status}</Badge>
                          )}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {(order.status?.toLowerCase() === 'pending_approval' || order.status?.toLowerCase() === 'unpaid') && (
                            <div className="d-flex flex-column gap-1">
                              <button
                                onClick={() => openVerificationModal(order)}
                                disabled={processingId === order.id}
                                className="btn btn-xs btn-primary"
                                style={{ padding: '4px 8px', fontSize: '0.75rem', fontWeight: '600' }}
                              >
                                {order.status?.toLowerCase() === 'unpaid' ? 'Verifikasi (Sudah Bayar)' : 'Verifikasi Pembayaran'}
                              </button>
                            </div>
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
                        <td>{refund.session?.title || (refund.session_id ? 'Sesi ID: ' + refund.session_id.substring(0, 8) : 'Lintas Sesi')}</td>
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
                <button onClick={() => setSettlementStatusFilter('unpaid')} className={`btn btn-sm ${settlementStatusFilter === 'unpaid' ? 'btn-danger' : 'btn-outline'}`}>Menunggu Pembeli</button>
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
                    <th style={{ textAlign: 'center', width: '200px' }}>Pencairan Dana (Transfer Manual)</th>
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
                            title={settle.status !== 'pending' ? 'Sudah dicairkan' : 'Tandai sudah ditransfer manual ke provider'}
                          >
                            {processingId === settle.id ? 'Memproses...' : settle.status === 'processed' ? '✓ Sudah Ditransfer' : '🏦 Tandai Sudah Ditransfer'}
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
      {verificationModalOpen && selectedOrderToVerify && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-content" style={{ backgroundColor: '#fff', borderRadius: '8px', width: '90%', maxWidth: '750px', maxHeight: '90vh', overflowY: 'auto', padding: '24px' }}>
            <h3 style={{ marginTop: 0, marginBottom: '16px', borderBottom: '1px solid #eee', paddingBottom: '12px' }}>
              Verifikasi Pelunasan (Checkout Order)
            </h3>
            
            <div style={{ marginBottom: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '0.9rem' }}>
              <div>
                <strong>ID Pesanan:</strong> {selectedOrderToVerify.id.substring(0,8)}...<br/>
                <strong>Bidder:</strong> {selectedOrderToVerify.bidder?.full_name}
              </div>
              <div>
                <strong>Total Transfer Masuk:</strong> <span className="text-primary" style={{ fontWeight: 'bold' }}>{formatRupiah(Number(selectedOrderToVerify.final_amount))}</span><br/>
                <strong>Total Potongan NIPL:</strong> <span className="text-danger">{formatRupiah(Number(selectedOrderToVerify.deposit_deduction))}</span>
              </div>
            </div>

            <div style={{ backgroundColor: '#f8f9fa', padding: '12px', borderRadius: '4px', marginBottom: '20px', fontSize: '0.85rem' }}>
              <strong>Instruksi Verifikasi Parsial:</strong> Centang unit kendaraan yang pembayarannya telah Anda validasi masuk. Hapus centang pada unit yang uangnya tidak dibayarkan (wanprestasi). Unit dengan label NIPL menandakan unit tersebut mengonsumsi deposit NIPL (NIPL akan hangus jika wanprestasi).
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f1f3f5', borderBottom: '2px solid #dee2e6' }}>
                  <th style={{ padding: '8px', textAlign: 'center', width: '50px' }}>Lunas</th>
                  <th style={{ padding: '8px', textAlign: 'left' }}>Kendaraan / Lot</th>
                  <th style={{ padding: '8px', textAlign: 'right' }}>Harga Terbentuk</th>
                  <th style={{ padding: '8px', textAlign: 'center' }}>Alokasi NIPL</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                   const niplMobil = 5000000;
                   const niplMotor = 1000000;
                   let remainingDeduction = Number(selectedOrderToVerify.deposit_deduction);

                   return selectedOrderToVerify.invoices.map((inv: any) => {
                     const isMotor = inv.lot?.asset?.category?.toLowerCase().includes('motor');
                     const requiredNIPL = isMotor ? niplMotor : niplMobil;
                     
                     let hasNIPL = false;
                     if (remainingDeduction >= requiredNIPL) {
                       hasNIPL = true;
                       remainingDeduction -= requiredNIPL;
                     }

                     const isApproved = approvedInvoiceIds.includes(inv.id);

                     return (
                       <tr key={inv.id} style={{ borderBottom: '1px solid #eee', backgroundColor: isApproved ? 'transparent' : '#fff5f5' }}>
                         <td style={{ padding: '8px', textAlign: 'center' }}>
                           <input 
                             type="checkbox" 
                             checked={isApproved}
                             onChange={(e) => {
                               if (e.target.checked) {
                                 setApprovedInvoiceIds([...approvedInvoiceIds, inv.id]);
                               } else {
                                 setApprovedInvoiceIds(approvedInvoiceIds.filter(id => id !== inv.id));
                               }
                             }}
                             style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                           />
                         </td>
                         <td style={{ padding: '8px' }}>
                           <div style={{ fontWeight: '500' }}>{inv.lot?.asset?.title || 'Unknown Asset'}</div>
                           <div style={{ fontSize: '0.8rem', color: '#6c757d' }}>Lot #{inv.lot?.lot_number}</div>
                         </td>
                         <td style={{ padding: '8px', textAlign: 'right', fontWeight: '500' }}>
                           {formatRupiah(Number(inv.total))}
                         </td>
                         <td style={{ padding: '8px', textAlign: 'center' }}>
                           {hasNIPL ? (
                             <Badge variant="success">Pakai NIPL ({isMotor ? '1 Jt' : '5 Jt'})</Badge>
                           ) : (
                             <Badge variant="default">Tanpa NIPL</Badge>
                           )}
                         </td>
                       </tr>
                     );
                   });
                })()}
              </tbody>
            </table>

            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #eee', paddingTop: '16px' }}>
              <button 
                className="btn btn-outline-danger" 
                onClick={() => submitPartialVerification('rejected')}
                disabled={processingId === selectedOrderToVerify.id}
              >
                ✕ Tolak Pesanan
              </button>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  className="btn btn-default" 
                  onClick={closeVerificationModal}
                  disabled={processingId === selectedOrderToVerify.id}
                >
                  Batal
                </button>
                <button 
                  className="btn btn-success" 
                  onClick={() => submitPartialVerification('paid')}
                  disabled={processingId === selectedOrderToVerify.id}
                >
                  ✓ Konfirmasi Pembayaran
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
