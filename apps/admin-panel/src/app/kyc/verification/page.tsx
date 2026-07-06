'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';
import Toast from '../../../components/ui/Toast';
import { apiUrl } from '../../../lib/api';

interface KycDocument {
  id: string;
  user_id: string;
  ktp_url?: string;
  selfie_url?: string;
  ktp_selfie_url?: string;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string;
  created_at: string;
  user?: {
    full_name: string;
    email: string;
    phone: string;
    role: string;
  };
}

export default function KycVerificationPage() {
  const [queue, setQueue] = useState<KycDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [selectedKyc, setSelectedKyc] = useState<KycDocument | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'danger' } | null>(null);



  const fetchKycQueue = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(
        apiUrl(`/admin/kyc/queue?status=${statusFilter}&per_page=50&_t=${Date.now()}`),
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: 'no-store',
        }
      );
      
      if (response.status === 401) {
        alert('Sesi login telah kedaluwarsa. Silakan login kembali.');
        window.location.href = '/login';
        return;
      }
      
      const data = await response.json();
      if (response.ok && data.success) {
        setQueue(data.data);
      } else {
        setQueue([]);
        if (data.error?.message) {
          setToast({ message: data.error.message, variant: 'danger' });
        }
      }
    } catch (err: any) {
      setQueue([]);
      setToast({ message: 'Gagal terhubung ke server', variant: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKycQueue();
  }, [statusFilter]);

  const handleApprove = async (id: string) => {
    if (!confirm('Apakah Anda yakin menyetujui dokumen KYC ini?')) return;
    setProcessingId(id);
    setToast(null);

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(apiUrl(`/admin/kyc/${id}/approve`), {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || 'Gagal menyetujui KYC');
      }

      setToast({ message: 'KYC berhasil disetujui', variant: 'success' });
      fetchKycQueue();
    } catch (err: any) {
      setToast({ message: err.message || 'Terjadi kesalahan sistem', variant: 'danger' });
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectClick = (kyc: KycDocument) => {
    setSelectedKyc(kyc);
    setRejectionReason('');
    setShowRejectModal(true);
  };

  const handleRejectSubmit = async () => {
    if (!selectedKyc) return;
    if (!rejectionReason.trim()) {
      alert('Alasan penolakan wajib diisi');
      return;
    }

    setProcessingId(selectedKyc.id);
    setShowRejectModal(false);
    setToast(null);

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(apiUrl(`/admin/kyc/${selectedKyc.id}/reject`), {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rejection_reason: rejectionReason }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || 'Gagal menolak KYC');
      }

      setToast({ message: 'KYC berhasil ditolak', variant: 'success' });
      fetchKycQueue();
    } catch (err: any) {
      setToast({ message: err.message || 'Terjadi kesalahan sistem', variant: 'danger' });
    } finally {
      setProcessingId(null);
      setSelectedKyc(null);
    }
  };

  const getStatusBadge = (status: KycDocument['status']) => {
    switch (status) {
      case 'approved':
        return <Badge variant="success">Disetujui</Badge>;
      case 'rejected':
        return <Badge variant="danger">Ditolak</Badge>;
      case 'pending':
        return <Badge variant="warning">Menunggu Review</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  return (
    <DashboardLayout breadcrumbParent="Pengguna" breadcrumbCurrent="Verifikasi KYC">
      {toast && (
        <Toast
          message={toast.message}
          variant={toast.variant}
          onClose={() => setToast(null)}
        />
      )}

      <div className="toolbar">
        <div className="toolbar-left">
          <h1 className="page-title">Verifikasi Dokumen KYC (AD6)</h1>
          <p className="page-subtitle">Periksa KTP dan foto selfie untuk mengaktifkan akun peserta lelang.</p>
        </div>
        <div className="toolbar-right">
          <select
            className="search-box"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: '0.45rem 0.75rem', borderRadius: 'var(--radius)', border: '1px solid var(--wf-border)', background: 'white' }}
          >
            <option value="all">Semua</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      <Card>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Tanggal Pengajuan</th>
                <th>Nama Lengkap</th>
                <th>Tipe Akun</th>
                <th>Kontak</th>
                <th>KTP &amp; Selfie Preview</th>
                <th>Status</th>
                {(statusFilter === 'rejected' || statusFilter === 'all') && <th>Alasan Penolakan</th>}
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={(statusFilter === 'rejected' || statusFilter === 'all') ? 8 : 7} className="text-center">
                    Memuat antrean KYC...
                  </td>
                </tr>
              ) : queue.length === 0 ? (
                <tr>
                  <td colSpan={(statusFilter === 'rejected' || statusFilter === 'all') ? 8 : 7} className="text-center text-muted">
                    Tidak ada pengajuan KYC dengan status ini.
                  </td>
                </tr>
              ) : (
                queue.map((kyc) => (
                  <tr key={kyc.id}>
                    <td>
                      {new Date(kyc.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td>
                      <strong>{kyc.user?.full_name || 'N/A'}</strong>
                    </td>
                    <td>
                      <span style={{ textTransform: 'capitalize' }}>
                        {kyc.user?.role === 'provider' ? '🏢 Provider' : '👤 Bidder'}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.85rem' }}>
                        <div>{kyc.user?.email}</div>
                        <div className="text-muted">{kyc.user?.phone}</div>
                      </div>
                    </td>
                    <td>
                      <div className="d-flex gap-1" style={{ overflow: 'hidden' }}>
                        {kyc.ktp_url ? (
                          <a href={kyc.ktp_url} target="_blank" rel="noreferrer" title="Lihat KTP Asli">
                            <img
                              src={kyc.ktp_url}
                              alt="KTP"
                              style={{
                                width: '60px',
                                height: '40px',
                                objectFit: 'cover',
                                borderRadius: '4px',
                                border: '1px solid var(--wf-border)',
                                cursor: 'zoom-in',
                              }}
                            />
                          </a>
                        ) : (
                          <span className="text-muted" style={{ fontSize: '0.8rem' }}>No KTP</span>
                        )}
                        {kyc.selfie_url ? (
                          <a href={kyc.selfie_url} target="_blank" rel="noreferrer" title="Lihat Selfie Asli">
                            <img
                              src={kyc.selfie_url}
                              alt="Selfie"
                              style={{
                                width: '40px',
                                height: '40px',
                                objectFit: 'cover',
                                borderRadius: '4px',
                                border: '1px solid var(--wf-border)',
                                cursor: 'zoom-in',
                              }}
                            />
                          </a>
                        ) : (
                          <span className="text-muted" style={{ fontSize: '0.8rem' }}>No Selfie</span>
                        )}
                      </div>
                    </td>
                    <td>{getStatusBadge(kyc.status)}</td>
                    {(statusFilter === 'rejected' || statusFilter === 'all') && (
                      <td className="text-danger" style={{ maxWidth: '200px', fontSize: '0.85rem' }}>
                        {kyc.rejection_reason || '-'}
                      </td>
                    )}
                    <td>
                      {kyc.status === 'pending' ? (
                        <div className="d-flex gap-1">
                          <Button
                            variant="success"
                            size="sm"
                            disabled={processingId === kyc.id}
                            onClick={() => handleApprove(kyc.id)}
                          >
                            {processingId === kyc.id ? 'Loading...' : 'Approve'}
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            disabled={processingId === kyc.id}
                            onClick={() => handleRejectClick(kyc)}
                          >
                            Reject
                          </Button>
                        </div>
                      ) : (
                        <span className="text-muted" style={{ fontSize: '0.85rem' }}>-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Rejection Modal */}
      {showRejectModal && selectedKyc && (
        <Modal
          isOpen={showRejectModal}
          title="Tolak Verifikasi KYC"
          onClose={() => setShowRejectModal(false)}
        >
          <div className="mb-2">
            <p style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>
              Berikan alasan penolakan dokumen KYC untuk <strong>{selectedKyc.user?.full_name}</strong>. Alasan ini akan dikirimkan ke email user.
            </p>
            <label className="form-label" style={{ fontWeight: 'bold' }}>
              Alasan Penolakan <span className="text-danger">*</span>
            </label>
            <textarea
              className="form-control"
              style={{
                width: '100%',
                minHeight: '100px',
                padding: '0.5rem',
                border: '1px solid var(--wf-border)',
                borderRadius: 'var(--radius)',
                fontFamily: 'inherit',
              }}
              placeholder="Contoh: Foto KTP buram dan tidak terbaca."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
          </div>
          <div className="d-flex justify-end gap-1 mt-3">
            <Button variant="outline" size="sm" onClick={() => setShowRejectModal(false)}>
              Batal
            </Button>
            <Button variant="danger" size="sm" onClick={handleRejectSubmit}>
              Tolak Pengajuan
            </Button>
          </div>
        </Modal>
      )}
    </DashboardLayout>
  );
}
