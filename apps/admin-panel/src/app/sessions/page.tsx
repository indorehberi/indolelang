'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Link from 'next/link';
import { apiUrl, apiFetch } from '../../lib/api';
import ColumnPicker, { useColumnVisibility, ColumnOption } from '../../components/ui/ColumnPicker';
import { exportToExcel } from '../../lib/excelExport';

const SESSION_COLUMNS: ColumnOption[] = [
  { key: 'title', label: 'Judul Sesi', alwaysVisible: true },
  { key: 'scheduled_at', label: 'Jadwal Pelaksanaan' },
  { key: 'branch', label: 'Cabang Penyelenggara' },
  { key: 'status', label: 'Status Sesi' },
  { key: 'actions', label: 'Aksi', alwaysVisible: true },
];

interface Branch {
  id: string;
  name: string;
  city: string;
}

interface Session {
  id: string;
  branch_id: string;
  title: string;
  description?: string;
  scheduled_at: string;
  status: 'draft' | 'published' | 'live' | 'closed';
  branch?: {
    name: string;
    city: string;
  };
  created_at: string;
  is_exclusive?: boolean;
  exclusive_provider_id?: string | null;
  registration_lead_hours?: number | null;
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const { visibleKeys, setVisibleKeys, isVisible } = useColumnVisibility('session_list', SESSION_COLUMNS);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  
  // Edit & Delete states
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    branch_id: '',
    scheduledDate: '',
    scheduledTime: '',
    status: 'draft',
    is_exclusive: false,
    exclusive_provider_id: '',
    registration_lead_hours: '',
  });
  const [branches, setBranches] = useState<Branch[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Exclusive sessions registrant states
  const [showRegistrantsModal, setShowRegistrantsModal] = useState(false);
  const [registrants, setRegistrants] = useState<any[]>([]);
  const [loadingRegistrants, setLoadingRegistrants] = useState(false);
  const [selectedExclusiveSession, setSelectedExclusiveSession] = useState<Session | null>(null);
  const [rejectingRegId, setRejectingRegId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    // Fetch branches for edit form
    const fetchBranches = async () => {
      try {
        const response = await fetch(apiUrl('/branches?is_active=true'));
        const data = await response.json();
        if (response.ok && data.success) {
          setBranches(data.data);
        }
      } catch (err) {
        console.error(err);
      }
    };
    const fetchProviders = async () => {
      try {
        const response = await apiFetch('/admin/providers?status=aktif&per_page=100');
        const data = await response.json();
        if (response.ok && data.success) {
          setProviders(data.data);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchBranches();
    fetchProviders();
  }, []);

  const fetchRegistrants = async (sessionId: string) => {
    setLoadingRegistrants(true);
    try {
      const res = await apiFetch(`/admin/sessions/${sessionId}/exclusive/registrants`);
      const data = await res.json();
      if (res.ok && data.success) {
        setRegistrants(data.data);
      } else {
        setRegistrants([]);
      }
    } catch (err) {
      setRegistrants([]);
    } finally {
      setLoadingRegistrants(false);
    }
  };

  const handleApproveRegistrant = async (regId: string) => {
    if (!selectedExclusiveSession) return;
    try {
      const res = await apiFetch(`/admin/sessions/${selectedExclusiveSession.id}/exclusive/registrants/${regId}/approve`, {
        method: 'POST'
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('success', 'Pendaftar berhasil disetujui');
        fetchRegistrants(selectedExclusiveSession.id);
      } else {
        showToast('error', data.error?.message || 'Gagal menyetujui pendaftar');
      }
    } catch (err) {
      showToast('error', 'Terjadi kesalahan sistem');
    }
  };

  const handleRejectRegistrant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExclusiveSession || !rejectingRegId || !rejectionReason.trim()) return;
    try {
      const res = await apiFetch(`/admin/sessions/${selectedExclusiveSession.id}/exclusive/registrants/${rejectingRegId}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason: rejectionReason })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('success', 'Pendaftar berhasil ditolak');
        setRejectingRegId(null);
        setRejectionReason('');
        fetchRegistrants(selectedExclusiveSession.id);
      } else {
        showToast('error', data.error?.message || 'Gagal menolak pendaftar');
      }
    } catch (err) {
      showToast('error', 'Terjadi kesalahan sistem');
    }
  };

  const fetchSessions = async () => {
    setLoading(true);
    try {
      let query = `?page=1&per_page=50`;
      if (statusFilter) query += `&status=${statusFilter}`;
      if (search) query += `&search=${encodeURIComponent(search)}`;
      if (branchFilter) query += `&branch_id=${branchFilter}`;
      if (typeFilter) query += `&is_exclusive=${typeFilter === 'exclusive'}`;
      if (dateFilter) query += `&date=${dateFilter}`;
      if (dateFrom) query += `&start_date=${dateFrom}`;
      if (dateTo) query += `&end_date=${dateTo}`;

      const response = await apiFetch(`/sessions${query}`);
      const data = await response.json();
      if (response.ok && data.success) {
        setSessions(data.data);
      } else {
        setSessions([]);
      }
    } catch (err) {
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [statusFilter, search, branchFilter, typeFilter, dateFilter, dateFrom, dateTo]);

  const handleOpenEdit = (session: Session) => {
    setSelectedSession(session);
    const dateObj = new Date(session.scheduled_at);
    setEditFormData({
      title: session.title,
      description: session.description || '',
      branch_id: session.branch_id,
      scheduledDate: dateObj.toISOString().split('T')[0],
      scheduledTime: dateObj.toTimeString().split(' ')[0].substring(0, 5), // HH:mm
      status: session.status,
      is_exclusive: session.is_exclusive ?? false,
      exclusive_provider_id: session.exclusive_provider_id || '',
      registration_lead_hours: session.registration_lead_hours !== null && session.registration_lead_hours !== undefined ? String(session.registration_lead_hours) : '',
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSession) return;
    try {
      const scheduled_at = new Date(`${editFormData.scheduledDate}T${editFormData.scheduledTime}`).toISOString();
      const response = await apiFetch(`/admin/sessions/${selectedSession.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          title: editFormData.title,
          description: editFormData.description || undefined,
          branch_id: editFormData.branch_id,
          scheduled_at,
          status: editFormData.status,
          is_exclusive: editFormData.is_exclusive,
          exclusive_provider_id: editFormData.is_exclusive ? (editFormData.exclusive_provider_id || null) : null,
          registration_lead_hours: editFormData.is_exclusive && editFormData.registration_lead_hours ? Number(editFormData.registration_lead_hours) : null,
        }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        showToast('success', 'Sesi berhasil diperbarui');
        setShowEditModal(false);
        fetchSessions();
      } else {
        showToast('error', data.error?.message || 'Gagal memperbarui sesi');
      }
    } catch (err) {
      showToast('error', 'Terjadi kesalahan sistem');
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Yakin ingin menghapus sesi "${title}"? Tindakan ini tidak dapat dibatalkan.`)) {
      return;
    }
    try {
      const response = await apiFetch(`/admin/sessions/${id}`, { method: 'DELETE' });
      const data = await response.json();
      if (response.ok && data.success) {
        showToast('success', 'Sesi berhasil dihapus');
        fetchSessions();
      } else {
        showToast('error', data.error?.message || 'Gagal menghapus sesi');
      }
    } catch (err) {
      showToast('error', 'Terjadi kesalahan sistem');
    }
  };

  const getStatusBadge = (status: Session['status']) => {
    switch (status) {
      case 'live':
        return <Badge variant="danger">🔴 Live</Badge>;
      case 'published':
        return <Badge variant="success">Published</Badge>;
      case 'draft':
        return <Badge variant="warning">Draft</Badge>;
      case 'closed':
        return <Badge variant="default">Closed</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  return (
    <DashboardLayout breadcrumbParent="Lelang" breadcrumbCurrent="Daftar Sesi">
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 9999,
          padding: '0.875rem 1.25rem', borderRadius: '0.75rem',
          background: toast.type === 'success' ? '#22c55e' : '#ef4444',
          color: '#fff', fontWeight: 600, boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', maxWidth: '400px',
        }}>
          <span>{toast.type === 'success' ? '✅' : '❌'}</span>
          {toast.message}
        </div>
      )}
      <div className="toolbar">
        <div className="toolbar-left">
          <h1 className="page-title">Manajemen Sesi Lelang</h1>
          <p className="page-subtitle">Buat, jadwalkan, dan pantau status sesi lelang aktif di setiap cabang.</p>
        </div>
        <div className="toolbar-right">
          <Link href="/sessions/new">
            <Button variant="primary" size="sm">
              + Buat Sesi Baru
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters Card */}
      <Card className="mb-2">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'flex-end' }}>
          <div>
            <label className="form-label" style={{ fontWeight: '600', fontSize: '0.85rem' }}>Cari Sesi Lelang</label>
            <input
              type="text"
              className="search-box w-100"
              style={{ width: '100%', height: '36px', padding: '0 0.75rem', borderRadius: 'var(--radius)', border: '1px solid var(--wf-border)' }}
              placeholder="Masukkan judul sesi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div>
            <label className="form-label" style={{ fontWeight: '600', fontSize: '0.85rem' }}>Status Sesi</label>
            <select
              className="form-select"
              style={{ width: '100%', height: '36px', padding: '0 0.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--wf-border)', background: 'white' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Semua Status</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="live">🔴 Live</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          <div>
            <label className="form-label" style={{ fontWeight: '600', fontSize: '0.85rem' }}>Tipe Sesi</label>
            <select
              className="form-select"
              style={{ width: '100%', height: '36px', padding: '0 0.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--wf-border)', background: 'white' }}
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="">Semua Tipe</option>
              <option value="reguler">Reguler</option>
              <option value="exclusive">Exclusive</option>
            </select>
          </div>

          <div>
            <label className="form-label" style={{ fontWeight: '600', fontSize: '0.85rem' }}>Cabang</label>
            <select
              className="form-select"
              style={{ width: '100%', height: '36px', padding: '0 0.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--wf-border)', background: 'white' }}
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
            >
              <option value="">Semua Cabang</option>
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label" style={{ fontWeight: '600', fontSize: '0.85rem' }}>Dari Tanggal</label>
            <input
              type="date"
              className="form-select"
              style={{ width: '100%', height: '36px', padding: '0 0.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--wf-border)' }}
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>

          <div>
            <label className="form-label" style={{ fontWeight: '600', fontSize: '0.85rem' }}>Sampai Tanggal</label>
            <input
              type="date"
              className="form-select"
              style={{ width: '100%', height: '36px', padding: '0 0.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--wf-border)' }}
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginLeft: 'auto' }}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const dataToExport = sessions.map((s, index) => {
                  const row: Record<string, any> = {};
                  if (isVisible('title')) row['No'] = index + 1;
                  if (isVisible('title')) row['Judul Sesi Lelang'] = s.title;
                  if (isVisible('branch')) row['Cabang'] = s.branch?.name || 'Pusat';
                  if (isVisible('scheduled_at')) row['Tanggal & Jam Sesi'] = new Date(s.scheduled_at).toLocaleString('id-ID');
                  if (isVisible('status')) row['Status Sesi'] = s.status;
                  return row;
                });
                const ok = exportToExcel(dataToExport, 'Daftar_Sesi_Lelang_IndoLelang', 'Sesi Lelang');
                if (ok) {
                  showToast('success', 'Berhasil mendownload Excel Daftar Sesi Lelang (.xlsx)');
                } else {
                  showToast('error', 'Tidak ada data sesi untuk di-export');
                }
              }}
              style={{ backgroundColor: '#107c41', color: '#fff', borderColor: '#107c41', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>file_download</span>
              Export XLSX
            </Button>
            <ColumnPicker
              columns={SESSION_COLUMNS}
              visibleKeys={visibleKeys}
              onChange={setVisibleKeys}
              tableId="session_list"
            />
          </div>
        </div>
      </Card>

      <Card>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                {isVisible('title') && <th>Judul Sesi</th>}
                {isVisible('scheduled_at') && <th>Jadwal Pelaksanaan</th>}
                {isVisible('branch') && <th>Cabang Penyelenggara</th>}
                {isVisible('status') && <th>Status Sesi</th>}
                {isVisible('actions') && <th>Aksi</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={visibleKeys.length} className="text-center">Memuat daftar sesi...</td>
                </tr>
              ) : sessions.length === 0 ? (
                <tr>
                  <td colSpan={visibleKeys.length} className="text-center text-muted">Tidak ada sesi lelang ditemukan.</td>
                </tr>
              ) : (
                sessions.map((session) => (
                  <tr key={session.id}>
                    {isVisible('title') && (
                      <td>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <strong>{session.title}</strong>
                            {(session as any).is_exclusive && (
                              <Badge variant="danger">Exclusive</Badge>
                            )}
                          </div>
                          {session.description && (
                            <div className="text-muted" style={{ fontSize: '0.8rem', marginTop: '2px' }}>
                              {session.description}
                            </div>
                          )}
                        </div>
                      </td>
                    )}
                    {isVisible('scheduled_at') && (
                      <td>
                        <div>
                          <strong>
                            {new Date(session.scheduled_at).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </strong>
                          <div className="text-muted" style={{ fontSize: '0.8rem' }}>
                            Pukul{' '}
                            {new Date(session.scheduled_at).toLocaleTimeString('id-ID', {
                              hour: '2-digit',
                              minute: '2-digit',
                              timeZoneName: 'short',
                            })}
                          </div>
                        </div>
                      </td>
                    )}
                    {isVisible('branch') && (
                      <td>
                        {session.branch ? (
                          <div>
                            <strong>{session.branch.name}</strong>
                            <div className="text-muted" style={{ fontSize: '0.8rem' }}>
                              📍 {session.branch.city}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted">Cabang Utama</span>
                        )}
                      </td>
                    )}
                    {isVisible('status') && <td>{getStatusBadge(session.status)}</td>}
                    {isVisible('actions') && (
                      <td>
                        <div className="d-flex gap-1">
                          {session.status === 'live' ? (
                            <Link href={`/auction/control-room?id=${session.id}`}>
                              <Button variant="danger" size="sm">Enter Room</Button>
                            </Link>
                          ) : (
                            <Link href={`/lots/planning?session_id=${session.id}`}>
                              <Button variant="outline" size="sm">Manage Lots</Button>
                            </Link>
                          )}
                          {(session as any).is_exclusive && (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => {
                                setSelectedExclusiveSession(session);
                                setShowRegistrantsModal(true);
                                fetchRegistrants(session.id);
                              }}
                            >
                              Pendaftar
                            </Button>
                          )}
                          <Button variant="outline" size="sm" onClick={() => handleOpenEdit(session)}>
                            Edit
                          </Button>
                          {session.status === 'draft' && (
                            <Button variant="danger" size="sm" onClick={() => handleDelete(session.id, session.title)}>
                              Hapus
                            </Button>
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

      {/* Exclusive Session Registrants Modal */}
      {showRegistrantsModal && selectedExclusiveSession && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '850px', width: '90%' }}>
            <div className="modal-header">
              <h3 className="modal-title">Pendaftar Lelang Eksklusif: {selectedExclusiveSession.title}</h3>
              <button className="modal-close" onClick={() => {
                setShowRegistrantsModal(false);
                setRejectingRegId(null);
                setRejectionReason('');
              }}>
                &times;
              </button>
            </div>
            <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              {loadingRegistrants ? (
                <div className="text-center py-4">Memuat data pendaftar...</div>
              ) : registrants.length === 0 ? (
                <div className="text-center py-4 text-muted">Belum ada bidder yang mendaftar untuk sesi ini.</div>
              ) : (
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Bidder</th>
                        <th>NIK</th>
                        <th>Dokumen Pernyataan</th>
                        <th>Status</th>
                        <th>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {registrants.map((reg) => (
                        <tr key={reg.id}>
                          <td>
                            <div>
                              <strong>{reg.bidder?.full_name}</strong>
                              <div className="text-muted" style={{ fontSize: '0.8rem' }}>
                                ✉️ {reg.bidder?.email} | 📞 {reg.bidder?.phone || '-'}
                              </div>
                            </div>
                          </td>
                          <td>{reg.bidder?.kyc_document?.id_card_number || '-'}</td>
                          <td>
                            <a
                              href={reg.document_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: 'var(--wf-primary)', textDecoration: 'underline', fontWeight: 600 }}
                            >
                              Buka Dokumen
                            </a>
                          </td>
                          <td>
                            {reg.status === 'approved' && <Badge variant="success">Approved</Badge>}
                            {reg.status === 'rejected' && (
                              <div>
                                <Badge variant="danger">Rejected</Badge>
                                {reg.rejection_reason && (
                                  <div className="text-muted" style={{ fontSize: '0.75rem', marginTop: '2px' }}>
                                    Alasan: {reg.rejection_reason}
                                  </div>
                                )}
                              </div>
                            )}
                            {reg.status === 'pending' && <Badge variant="warning">Pending Review</Badge>}
                          </td>
                          <td>
                            {reg.status === 'pending' && (
                              <div className="d-flex gap-1">
                                <Button
                                  variant="primary"
                                  size="sm"
                                  onClick={() => handleApproveRegistrant(reg.id)}
                                  style={{ background: '#22c55e', borderColor: '#22c55e' }}
                                >
                                  Setujui
                                </Button>
                                <Button
                                  variant="danger"
                                  size="sm"
                                  onClick={() => {
                                    setRejectingRegId(reg.id);
                                    setRejectionReason('');
                                  }}
                                >
                                  Tolak
                                </Button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {rejectingRegId && (
                <div style={{ marginTop: '1.5rem', background: '#fff5f5', padding: '1rem', borderRadius: 'var(--radius)', border: '1px solid #feb2b2' }}>
                  <form onSubmit={handleRejectRegistrant}>
                    <h5 style={{ fontWeight: 'bold', color: '#c53030', marginBottom: '0.5rem' }}>Alasan Penolakan Pendaftaran</h5>
                    <div className="form-group mb-2" style={{ display: 'flex', gap: '0.5rem' }}>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Contoh: Dokumen tidak bertanda tangan atau NIK tidak sesuai"
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        required
                        style={{ width: '100%', height: '36px', padding: '0 0.75rem', borderRadius: 'var(--radius)', border: '1px solid var(--wf-border)' }}
                      />
                    </div>
                    <div className="d-flex gap-2">
                      <Button type="submit" variant="danger" size="sm">Konfirmasi Tolak</Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => setRejectingRegId(null)}>Batal</Button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Edit Sesi Lelang</h3>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>
                &times;
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleEditSubmit}>
                <div className="form-group mb-3">
                  <label className="form-label">Judul Sesi</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    value={editFormData.title}
                    onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                  />
                </div>
                <div className="form-group mb-3">
                  <label className="form-label">Deskripsi</label>
                  <textarea
                    className="form-textarea"
                    value={editFormData.description}
                    onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  />
                </div>
                <div className="form-group mb-3">
                  <label className="form-label">Cabang</label>
                  <select
                    className="form-select"
                    required
                    value={editFormData.branch_id}
                    onChange={(e) => setEditFormData({ ...editFormData, branch_id: e.target.value })}
                  >
                    <option value="">-- Pilih Cabang --</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name} ({b.city})</option>
                    ))}
                  </select>
                </div>
                <div className="row mb-3" style={{ display: 'flex', gap: '1rem' }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Tanggal Pelaksanaan</label>
                    <input
                      type="date"
                      className="form-input"
                      required
                      value={editFormData.scheduledDate}
                      onChange={(e) => setEditFormData({ ...editFormData, scheduledDate: e.target.value })}
                    />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Jam (WIB)</label>
                    <input
                      type="time"
                      className="form-input"
                      required
                      value={editFormData.scheduledTime}
                      onChange={(e) => setEditFormData({ ...editFormData, scheduledTime: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group mb-3">
                  <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 'bold' }}>
                    <input
                      type="checkbox"
                      checked={editFormData.is_exclusive}
                      onChange={(e) => setEditFormData({ ...editFormData, is_exclusive: e.target.checked })}
                    />
                    Lelang Eksklusif?
                  </label>
                </div>

                {editFormData.is_exclusive && (
                  <>
                    <div className="form-group mb-3">
                      <label className="form-label">Provider Eksklusif</label>
                      <select
                        className="form-select"
                        required={editFormData.is_exclusive}
                        value={editFormData.exclusive_provider_id}
                        onChange={(e) => setEditFormData({ ...editFormData, exclusive_provider_id: e.target.value })}
                      >
                        <option value="">-- Pilih Provider --</option>
                        {providers.map(p => (
                          <option key={p.id} value={p.id}>{p.company_name || p.user?.full_name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group mb-3">
                      <label className="form-label">Batas Pendaftaran Sebelum Lelang (Jam)</label>
                      <input
                        type="number"
                        min="0"
                        className="form-input"
                        required={editFormData.is_exclusive}
                        placeholder="Contoh: 24 (artinya tutup 24 jam sebelum lelang)"
                        value={editFormData.registration_lead_hours}
                        onChange={(e) => setEditFormData({ ...editFormData, registration_lead_hours: e.target.value })}
                      />
                    </div>
                  </>
                )}

                <div className="form-group mb-4">
                  <label className="form-label">Status Sesi</label>
                  <select
                    className="form-select"
                    value={editFormData.status}
                    onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="live">Live</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
                <div className="d-flex justify-end gap-2 mt-4">
                  <Button type="button" variant="outline" onClick={() => setShowEditModal(false)}>
                    Batal
                  </Button>
                  <Button type="submit" variant="primary">
                    Simpan Perubahan
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
