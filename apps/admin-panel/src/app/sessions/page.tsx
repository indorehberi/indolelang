'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Link from 'next/link';
import { apiUrl } from '../../lib/api';

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
