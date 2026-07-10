'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Link from 'next/link';
import { apiUrl } from '../../lib/api';

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
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
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
  });
  const [branches, setBranches] = useState<Branch[]>([]);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    // Fetch branches for edit form
    const fetchBranches = async () => {
      try {
        const response = await fetch(apiUrl('/branches'));
        const data = await response.json();
        if (response.ok && data.success) {
          setBranches(data.data);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchBranches();
  }, []);



  const fetchSessions = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      let query = `?page=1&per_page=50`;
      if (statusFilter) query += `&status=${statusFilter}`;
      if (search) query += `&search=${encodeURIComponent(search)}`;

      const response = await fetch(apiUrl(`/sessions${query}`), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
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
  }, [statusFilter, search]);

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
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSession) return;
    try {
      const token = localStorage.getItem('accessToken');
      const scheduled_at = new Date(`${editFormData.scheduledDate}T${editFormData.scheduledTime}`).toISOString();
      const response = await fetch(apiUrl(`/admin/sessions/${selectedSession.id}`), {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: editFormData.title,
          description: editFormData.description || undefined,
          branch_id: editFormData.branch_id,
          scheduled_at,
          status: editFormData.status,
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
      const token = localStorage.getItem('accessToken');
      const response = await fetch(apiUrl(`/admin/sessions/${id}`), {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
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
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ flex: '1', minWidth: '250px' }}>
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

          <div style={{ width: '200px' }}>
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
        </div>
      </Card>

      <Card>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Judul Sesi</th>
                <th>Jadwal Pelaksanaan</th>
                <th>Cabang Penyelenggara</th>
                <th>Status Sesi</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center">Memuat daftar sesi...</td>
                </tr>
              ) : sessions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center text-muted">Tidak ada sesi lelang ditemukan.</td>
                </tr>
              ) : (
                sessions.map((session) => (
                  <tr key={session.id}>
                    <td>
                      <div>
                        <strong>{session.title}</strong>
                        {session.description && (
                          <div className="text-muted" style={{ fontSize: '0.8rem', marginTop: '2px' }}>
                            {session.description}
                          </div>
                        )}
                      </div>
                    </td>
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
                    <td>{getStatusBadge(session.status)}</td>
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
                        <Button variant="outline" size="sm" onClick={() => handleOpenEdit(session)}>
                          Edit
                        </Button>
                        <Button variant="danger" size="sm" onClick={() => handleDelete(session.id, session.title)}>
                          Hapus
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
