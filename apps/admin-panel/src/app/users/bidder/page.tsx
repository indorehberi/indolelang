'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import { apiFetch } from '../../../lib/api';
import { useToast } from '../../../providers/ToastProvider';
import { exportToExcel } from '../../../lib/excelExport';

interface Bidder {
  id: string; // bidders table row id
  user_id: string;
  status: 'antri' | 'aktif' | 'ditolak' | 'nonaktif';
  rejection_reason?: string;
  active_nipl_count?: number;
  nipl_mobil?: number;
  nipl_motor?: number;
  is_unlimited_mobil?: boolean;
  is_unlimited_motor?: boolean;
  submitted_at: string;
  address?: string;
  occupation?: string;
  bank_name?: string;
  bank_account_no?: string;
  bank_account_name?: string;
  kyc?: {
    id: string;
    status: string;
    nik?: string;
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

/**
 * Downloads a file client-side regardless of origin: fetch it as a blob first
 * (KTP/selfie URLs point at S3 or the API's own /uploads static route, both
 * plain public GETs) so the `download` attribute — which browsers ignore on
 * cross-origin anchors — actually forces a save instead of just navigating to
 * the image. Falls back to opening the URL in a new tab if the fetch fails
 * (e.g. no CORS on an older upload).
 */
async function downloadFile(url: string, filename: string) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('fetch failed');
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(blobUrl);
  } catch {
    window.open(url, '_blank', 'noopener');
  }
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
  const [showViewModal, setShowViewModal] = useState(false);
  const [showNiplModal, setShowNiplModal] = useState(false);
  const [selectedBidder, setSelectedBidder] = useState<Bidder | null>(null);

  const [formData, setFormData] = useState({ full_name: '', email: '', phone: '' });
  const [niplFormData, setNiplFormData] = useState({ mobil_count: 0, motor_count: 0 });
  const [niplSaving, setNiplSaving] = useState(false);

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

  const handleAdjustNipl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBidder) return;
    setNiplSaving(true);
    try {
      const response = await apiFetch(`/admin/bidders/${selectedBidder.id}/nipl`, {
        method: 'PUT',
        body: JSON.stringify(niplFormData),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        toast.success('Jumlah NIPL berhasil diperbarui');
        setShowNiplModal(false);
        fetchBidders();
      } else {
        toast.error(data.error?.message || 'Gagal mengubah jumlah NIPL');
      }
    } catch (err) {
      console.error(err);
      toast.error('Terjadi kesalahan sistem');
    } finally {
      setNiplSaving(false);
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
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const dataToExport = bidders.map((b, index) => ({
                'No': index + 1,
                'Nama Lengkap': b.user?.full_name || '-',
                'Email': b.user?.email || '-',
                'No. Telepon': b.user?.phone || '-',
                'NIK / KTP': b.kyc?.nik || '-',
                'Status Bidder': b.status === 'aktif' ? 'Aktif' : b.status === 'antri' ? 'Menunggu Verifikasi' : b.status === 'ditolak' ? 'Ditolak' : 'Nonaktif',
                'Status KYC': b.kyc?.status || 'Belum Verifikasi',
                'NIPL Mobil': b.is_unlimited_mobil ? 'Unlimited' : (b.nipl_mobil || 0),
                'NIPL Motor': b.is_unlimited_motor ? 'Unlimited' : (b.nipl_motor || 0),
                'Pekerjaan': b.occupation || '-',
                'Alamat': b.address || '-',
                'Bank': b.bank_name || '-',
                'No. Rekening': b.bank_account_no || '-',
                'Atas Nama Rekening': b.bank_account_name || '-',
                'Tanggal Terdaftar': b.submitted_at ? new Date(b.submitted_at).toLocaleDateString('id-ID') : '-'
              }));
              const ok = exportToExcel(dataToExport, 'Daftar_Bidder_IndoLelang', 'Daftar Bidder');
              if (ok) {
                toast.success('Berhasil mendownload Excel Daftar Bidder (.xlsx)');
              } else {
                toast.error('Tidak ada data bidder untuk di-export');
              }
            }}
            style={{ backgroundColor: '#107c41', color: '#fff', borderColor: '#107c41', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>file_download</span>
            Export XLSX
          </Button>
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
                        {(bidder.is_unlimited_mobil && bidder.is_unlimited_motor) ? 'Unlimited' : `${bidder.active_nipl_count || 0} NIPL`}
                      </Badge>
                      {((bidder.nipl_mobil || 0) > 0 || (bidder.nipl_motor || 0) > 0) && (
                        <div style={{ fontSize: '0.75rem', color: '#888', marginTop: '2px' }}>
                          {(bidder.nipl_mobil || 0) > 0 && <span>Mobil: {bidder.is_unlimited_mobil ? 'Unlimited' : bidder.nipl_mobil}</span>}
                          {(bidder.nipl_mobil || 0) > 0 && (bidder.nipl_motor || 0) > 0 && <span> · </span>}
                          {(bidder.nipl_motor || 0) > 0 && <span>Motor: {bidder.is_unlimited_motor ? 'Unlimited' : bidder.nipl_motor}</span>}
                        </div>
                      )}
                    </td>
                    <td>{getStatusBadge(bidder.status)}</td>
                    <td>{bidder.submitted_at.split('T')[0]}</td>
                    <td>
                      <div className="d-flex gap-1" style={{ display: 'flex', gap: '0.5rem' }}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedBidder(bidder);
                            setShowViewModal(true);
                          }}
                        >
                          Lihat
                        </Button>
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
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedBidder(bidder);
                            setNiplFormData({
                              mobil_count: bidder.nipl_mobil || 0,
                              motor_count: bidder.nipl_motor || 0,
                            });
                            setShowNiplModal(true);
                          }}
                        >
                          Edit NIPL
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

      {/* VIEW MODAL — full bidder profile + downloadable KYC documents */}
      {showViewModal && selectedBidder && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '2rem' }}>
          <div style={{ maxWidth: '800px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <Card>
              <h3 style={{ marginBottom: '1rem' }}>Detail Bidder</h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem 1.5rem', marginBottom: '1.5rem' }}>
                <div><strong>Nama:</strong> {selectedBidder.user?.full_name || '-'}</div>
                <div><strong>Email:</strong> {selectedBidder.user?.email || '-'}</div>
                <div><strong>Telepon:</strong> {selectedBidder.user?.phone || '-'}</div>
                <div><strong>NIK:</strong> {selectedBidder.kyc?.nik || '-'}</div>
                <div><strong>Pekerjaan:</strong> {selectedBidder.occupation || '-'}</div>
                <div><strong>Status:</strong> {getStatusBadge(selectedBidder.status)}</div>
                <div style={{ gridColumn: '1 / -1' }}><strong>Alamat:</strong> {selectedBidder.address || '-'}</div>
                <div><strong>Bank:</strong> {selectedBidder.bank_name || '-'}</div>
                <div><strong>No. Rekening:</strong> {selectedBidder.bank_account_no || '-'}</div>
                <div><strong>Nama Pemilik Rekening:</strong> {selectedBidder.bank_account_name || '-'}</div>
                <div><strong>NIPL Aktif:</strong> {(selectedBidder.is_unlimited_mobil && selectedBidder.is_unlimited_motor) ? 'Unlimited' : (selectedBidder.active_nipl_count || 0)}</div>
                <div><strong>Tanggal Ajukan:</strong> {selectedBidder.submitted_at.split('T')[0]}</div>
                {selectedBidder.rejection_reason && (
                  <div style={{ gridColumn: '1 / -1' }}><strong>Alasan Ditolak:</strong> {selectedBidder.rejection_reason}</div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ border: '1px solid #eee', padding: '0.5rem', borderRadius: '4px' }}>
                  <h4 style={{ marginBottom: '0.5rem', textAlign: 'center' }}>Foto KTP</h4>
                  {selectedBidder.kyc?.ktp_url ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={selectedBidder.kyc.ktp_url} alt="KTP" style={{ width: '100%', height: 'auto', objectFit: 'contain', marginBottom: '0.5rem' }} />
                      <Button
                        variant="outline"
                        size="sm"
                        style={{ width: '100%' }}
                        onClick={() => downloadFile(selectedBidder.kyc!.ktp_url!, `ktp-${selectedBidder.user?.full_name || selectedBidder.id}.jpg`)}
                      >
                        Unduh KTP
                      </Button>
                    </>
                  ) : (
                    <div style={{ padding: '2rem', textAlign: 'center', background: '#f9fafb' }}>Tidak ada KTP</div>
                  )}
                </div>
                <div style={{ border: '1px solid #eee', padding: '0.5rem', borderRadius: '4px' }}>
                  <h4 style={{ marginBottom: '0.5rem', textAlign: 'center' }}>Foto Selfie</h4>
                  {selectedBidder.kyc?.selfie_url ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={selectedBidder.kyc.selfie_url} alt="Selfie" style={{ width: '100%', height: 'auto', objectFit: 'contain', marginBottom: '0.5rem' }} />
                      <Button
                        variant="outline"
                        size="sm"
                        style={{ width: '100%' }}
                        onClick={() => downloadFile(selectedBidder.kyc!.selfie_url!, `selfie-${selectedBidder.user?.full_name || selectedBidder.id}.jpg`)}
                      >
                        Unduh Selfie
                      </Button>
                    </>
                  ) : (
                    <div style={{ padding: '2rem', textAlign: 'center', background: '#f9fafb' }}>Tidak ada Selfie</div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button variant="outline" type="button" onClick={() => setShowViewModal(false)}>Tutup</Button>
              </div>
            </Card>
          </div>
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

      {/* NIPL EDIT MODAL */}
      {showNiplModal && selectedBidder && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <Card>
            <h3 style={{ marginBottom: '0.5rem' }}>Edit Jumlah NIPL</h3>
            <p style={{ marginBottom: '1rem', color: '#666', fontSize: '0.9rem' }}>
              Bidder: <strong>{selectedBidder.user?.full_name}</strong><br />
              NIPL saat ini: <strong>{(selectedBidder.is_unlimited_mobil && selectedBidder.is_unlimited_motor) ? 'Unlimited' : (selectedBidder.active_nipl_count || 0)}</strong>
            </p>
            <form onSubmit={handleAdjustNipl}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>NIPL Mobil</label>
                <input
                  type="number"
                  min={0}
                  value={niplFormData.mobil_count}
                  onChange={(e) => setNiplFormData({ ...niplFormData, mobil_count: parseInt(e.target.value) || 0 })}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
                />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>NIPL Motor</label>
                <input
                  type="number"
                  min={0}
                  value={niplFormData.motor_count}
                  onChange={(e) => setNiplFormData({ ...niplFormData, motor_count: parseInt(e.target.value) || 0 })}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
                />
              </div>
              <div style={{ padding: '0.75rem', background: '#f7fafc', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.85rem' }}>
                <strong>Total NIPL setelah perubahan:</strong> {niplFormData.mobil_count + niplFormData.motor_count}
                <br />
                <span style={{ color: '#e53e3e', fontSize: '0.8rem' }}>
                  ⚠ Semua deposit paid akan di-expired dan diganti deposit adjustment baru.
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <Button variant="outline" type="button" onClick={() => setShowNiplModal(false)}>Batal</Button>
                <Button variant="primary" type="submit" disabled={niplSaving}>
                  {niplSaving ? 'Menyimpan...' : 'Simpan NIPL'}
                </Button>
              </div>
            </form>
          </Card>
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
