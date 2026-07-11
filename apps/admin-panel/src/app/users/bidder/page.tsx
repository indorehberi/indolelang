'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import { apiFetch } from '../../../lib/api';
import { useToast } from '../../../providers/ToastProvider';

interface Bidder {
  id: string; // bidders table row id
  user_id: string;
  status: 'antri' | 'aktif' | 'ditolak' | 'nonaktif';
  rejection_reason?: string;
  active_nipl_count?: number;
  submitted_at: string;
  kyc?: {
    id: string;
    status: string;
    ktp_url?: string;
    selfie_url?: string;
  };
  user?: {
    id: string;
    full_name: string;
    email: string;
    phone: string | null;
  };
}

export default function BidderListPage() {
  const router = useRouter();
  const toast = useToast();
  const [bidders, setBidders] = useState<Bidder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [search, setSearch] = useState('');

  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedBidder, setSelectedBidder] = useState<Bidder | null>(null);

  const [formData, setFormData] = useState({ full_name: '', email: '', phone: '' });

  const fetchBidders = useCallback(async () => {
    setLoading(true);
    try {
      let query = `/admin/bidders?per_page=200`;
      if (filterStatus) query += `&status=${filterStatus}`;
      if (search) query += `&search=${encodeURIComponent(search)}`;

      const response = await apiFetch(query);
      const data = await response.json();
      if (response.ok && data.success) {
        setBidders(data.data);
      } else {
        setBidders([]);
      }
    } catch (err) {
      console.error(err);
      setBidders([]);
    } finally {
      setLoading(false);
    }
  }, [filterStatus, search]);

  useEffect(() => {
    const t = setTimeout(() => {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchBidders();
    }, 300);
    return () => clearTimeout(t);
  }, [fetchBidders]);

  const getStatusBadge = (status: Bidder['status']) => {
    switch (status) {
      case 'aktif':
        return <Badge variant="success">Aktif</Badge>;
      case 'antri':
        return <Badge variant="warning">Menunggu Approval</Badge>;
      default:
        return <Badge variant="danger">Non Aktif</Badge>;
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBidder?.user) return;
    try {
      const response = await apiFetch(`/admin/users/${selectedBidder.user.id}`, {
        method: 'PUT',
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setShowEditModal(false);
        fetchBidders();
      } else {
        toast.error(data.error?.message || 'Gagal mengubah bidder');
      }
    } catch (err) {
      console.error(err);
      toast.error('Terjadi kesalahan sistem');
    }
  };

  const handleDelete = async () => {
    if (!selectedBidder?.user) return;
    try {
      const response = await apiFetch(`/admin/users/${selectedBidder.user.id}`, { method: 'DELETE' });
      const data = await response.json();
      if (response.ok && data.success) {
        setShowDeleteModal(false);
        fetchBidders();
      } else {
        toast.error(data.error?.message || 'Gagal menghapus bidder');
      }
    } catch (err) {
      console.error(err);
      toast.error('Terjadi kesalahan sistem');
    }
  };

  const handleApprove = async (id: string) => {
    if (!window.confirm('Apakah Anda yakin ingin menyetujui pengajuan bidder ini?')) return;
    try {
      const response = await apiFetch(`/admin/bidders/${id}/approve`, { method: 'PUT' });
      if (response.ok) {
        setShowReviewModal(false);
        fetchBidders();
      } else {
        const data = await response.json();
        toast.error(data.error?.message || 'Gagal menyetujui bidder');
      }
    } catch (err) {
      console.error(err);
      toast.error('Terjadi kesalahan sistem');
    }
  };

  const handleReject = async (id: string) => {
    const reason = window.prompt('Masukkan alasan penolakan pengajuan bidder:');
    if (reason === null) return;
    if (!reason.trim()) {
      toast.warning('Alasan penolakan wajib diisi!');
      return;
    }
    try {
      const response = await apiFetch(`/admin/bidders/${id}/reject`, {
        method: 'PUT',
        body: JSON.stringify({ reason: reason.trim() }),
      });
      if (response.ok) {
        setShowReviewModal(false);
        fetchBidders();
      } else {
        const data = await response.json();
        toast.error(data.error?.message || 'Gagal menolak bidder');
      }
    } catch (err) {
      console.error(err);
      toast.error('Terjadi kesalahan sistem');
    }
  };

  return (
    <DashboardLayout breadcrumbParent="Pengguna" breadcrumbCurrent="Bidder">
      <div className="toolbar">
        <div className="toolbar-left">
          <h1 className="page-title">Daftar Bidder</h1>
          <p className="page-subtitle">Hanya menampilkan pengguna yang mengajukan diri sebagai bidder.</p>
        </div>
        <div className="toolbar-right" style={{ display: 'flex', gap: '10px' }}>
          <select
            className="search-box"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
          >
            <option value="">Semua Status</option>
            <option value="antri">Menunggu Verifikasi (Antri)</option>
            <option value="aktif">Aktif</option>
            <option value="ditolak">Ditolak</option>
            <option value="nonaktif">Nonaktif</option>
          </select>
          <input
            type="text"
            placeholder="Cari nama/email/telepon..."
            className="search-box"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button variant="primary" size="sm" onClick={() => router.push('/users/bidder/new')}>
            + Tambah Bidder
          </Button>
        </div>
      </div>

      <Card>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Nama Lengkap</th>
                <th>Email</th>
                <th>Nomor Telepon</th>
                <th>NIPL Aktif</th>
                <th>Status</th>
                <th>Tanggal Ajukan</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center">Memuat data...</td>
                </tr>
              ) : bidders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center">Tidak ada bidder ditemukan.</td>
                </tr>
              ) : (
                bidders.map((bidder) => (
                  <tr key={bidder.id}>
                    <td><strong>{bidder.user?.full_name}</strong></td>
                    <td>{bidder.user?.email}</td>
                    <td>{bidder.user?.phone || '-'}</td>
                    <td>
                      <Badge variant={(bidder.active_nipl_count || 0) > 0 ? 'success' : 'default'}>
                        {bidder.active_nipl_count || 0} NIPL
                      </Badge>
                    </td>
                    <td>{getStatusBadge(bidder.status)}</td>
                    <td>{bidder.submitted_at.split('T')[0]}</td>
                    <td>
                      <div className="d-flex gap-1" style={{ display: 'flex', gap: '0.5rem' }}>
                        {bidder.status === 'antri' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedBidder(bidder);
                              setShowReviewModal(true);
                            }}
                          >
                            Tinjau
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedBidder(bidder);
                            setFormData({
                              full_name: bidder.user?.full_name || '',
                              email: bidder.user?.email || '',
                              phone: bidder.user?.phone || '',
                            });
                            setShowEditModal(true);
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => {
                            setSelectedBidder(bidder);
                            setShowDeleteModal(true);
                          }}
                        >
                          Delete
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

      {/* EDIT MODAL */}
      {showEditModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <Card>
            <h3 style={{ marginBottom: '1rem' }}>Edit Bidder</h3>
            <form onSubmit={handleEdit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Nama Lengkap</label>
                <input required type="text" value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }} />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Email</label>
                <input required type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }} />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Nomor Telepon</label>
                <input required type="text" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <Button variant="outline" type="button" onClick={() => setShowEditModal(false)}>Batal</Button>
                <Button variant="primary" type="submit">Simpan</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* REVIEW MODAL (KYC + profil) */}
      {showReviewModal && selectedBidder && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '2rem' }}>
          <div style={{ maxWidth: '800px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <Card>
              <h3 style={{ marginBottom: '1rem' }}>Peninjauan Pengajuan Bidder</h3>
              <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexDirection: 'column' }}>
                <div><strong>Nama:</strong> {selectedBidder.user?.full_name}</div>
                <div><strong>Email:</strong> {selectedBidder.user?.email}</div>
                <div><strong>Telepon:</strong> {selectedBidder.user?.phone || '-'}</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ border: '1px solid #eee', padding: '0.5rem', borderRadius: '4px' }}>
                  <h4 style={{ marginBottom: '0.5rem', textAlign: 'center' }}>Foto KTP</h4>
                  {selectedBidder.kyc?.ktp_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={selectedBidder.kyc.ktp_url} alt="KTP" style={{ width: '100%', height: 'auto', objectFit: 'contain' }} />
                  ) : (
                    <div style={{ padding: '2rem', textAlign: 'center', background: '#f9fafb' }}>Tidak ada KTP</div>
                  )}
                </div>
                <div style={{ border: '1px solid #eee', padding: '0.5rem', borderRadius: '4px' }}>
                  <h4 style={{ marginBottom: '0.5rem', textAlign: 'center' }}>Foto Selfie</h4>
                  {selectedBidder.kyc?.selfie_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={selectedBidder.kyc.selfie_url} alt="Selfie" style={{ width: '100%', height: 'auto', objectFit: 'contain' }} />
                  ) : (
                    <div style={{ padding: '2rem', textAlign: 'center', background: '#f9fafb' }}>Tidak ada Selfie</div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <Button variant="outline" type="button" onClick={() => setShowReviewModal(false)}>Tutup</Button>
                <Button variant="danger" type="button" onClick={() => handleReject(selectedBidder.id)}>
                  Tolak (Reject)
                </Button>
                <Button variant="primary" type="button" onClick={() => handleApprove(selectedBidder.id)}>
                  Setujui (Approve)
                </Button>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {showDeleteModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <Card>
            <h3 style={{ marginBottom: '1rem', color: 'var(--color-danger)' }}>Hapus Bidder</h3>
            <p style={{ marginBottom: '1.5rem' }}>
              Apakah Anda yakin ingin menghapus <strong>{selectedBidder?.user?.full_name}</strong>? Tindakan ini akan menonaktifkan pengguna.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <Button variant="outline" type="button" onClick={() => setShowDeleteModal(false)}>Batal</Button>
              <Button variant="danger" type="button" onClick={handleDelete}>Hapus</Button>
            </div>
          </Card>
        </div>
      )}
    </DashboardLayout>
  );
}
