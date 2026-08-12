'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Toast from '../../components/ui/Toast';
import { apiFetch } from '../../lib/api';
import { exportToExcel } from '../../lib/excelExport';
import ColumnPicker, { useColumnVisibility, ColumnOption } from '../../components/ui/ColumnPicker';
import Link from 'next/link';

const TESTIMONI_COLUMNS: ColumnOption[] = [
  { key: 'user', label: 'Pengguna', alwaysVisible: true },
  { key: 'rating', label: 'Rating' },
  { key: 'content', label: 'Konten' },
  { key: 'created_at', label: 'Tanggal' },
  { key: 'status', label: 'Status' },
  { key: 'actions', label: 'Tindakan', alwaysVisible: true },
];

interface Testimonial {
  id: string;
  rating: number;
  content: string;
  status: string;
  created_at: string;
  display_name?: string | null;
  user?: {
    full_name: string;
  };
}

export default function TestimoniListPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'danger' } | null>(null);
  const { visibleKeys, setVisibleKeys, isVisible } = useColumnVisibility('testimoni_list', TESTIMONI_COLUMNS);

  const fetchTestimonials = async () => {
    setLoading(true);
    try {
      const response = await apiFetch('/admin/testimonials');
      const data = await response.json();
      if (response.ok && data.success) {
        setTestimonials(data.data);
      } else {
        setTestimonials([]);
      }
    } catch (e) {
      setTestimonials([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus testimoni ini?')) return;
    
    try {
      const response = await apiFetch(`/admin/testimonials/${id}`, { method: 'DELETE' });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || 'Gagal menghapus testimoni');
      }

      setToast({ message: 'Testimoni berhasil dihapus', variant: 'success' });
      fetchTestimonials();
    } catch (err: any) {
      setToast({ message: err.message || 'Terjadi kesalahan sistem', variant: 'danger' });
    }
  };

  const handleExport = () => {
    const dataToExport = testimonials.map((t) => {
      const row: Record<string, any> = {};
      if (isVisible('user')) row['Pengguna'] = t.display_name || t.user?.full_name || 'Tidak diketahui';
      if (isVisible('rating')) row['Rating'] = `${t.rating}/5`;
      if (isVisible('content')) row['Konten'] = t.content;
      if (isVisible('created_at')) row['Tanggal'] = new Date(t.created_at).toLocaleDateString('id-ID');
      if (isVisible('status')) row['Status'] = t.status === 'approved' ? 'Disetujui' : t.status === 'rejected' ? 'Ditolak' : 'Menunggu';
      return row;
    });
    const ok = exportToExcel(dataToExport, 'Daftar_Testimoni_IndoLelang', 'Daftar Testimoni');
    if (ok) {
      setToast({ message: 'Berhasil mendownload laporan Excel Testimoni (.xlsx)', variant: 'success' });
    } else {
      setToast({ message: 'Tidak ada data testimoni untuk di-export', variant: 'danger' });
    }
  };

  return (
    <DashboardLayout breadcrumbParent="Konten Publik" breadcrumbCurrent="Testimoni">
      <div className="toolbar">
        <div className="toolbar-left">
          <h1 className="page-title">Testimoni Pengguna</h1>
          <p className="page-subtitle">Kelola ulasan dan testimoni pengguna yang tampil di website publik.</p>
        </div>
        <div className="toolbar-right" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={handleExport}
          >
            📥 Export Excel
          </button>
          <ColumnPicker
            columns={TESTIMONI_COLUMNS}
            visibleKeys={visibleKeys}
            onChange={setVisibleKeys}
            tableId="testimoni_list"
          />
          <Link href="/testimoni/tambah">
            <Button variant="primary" size="sm">
              + Tambah Testimoni
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                {isVisible('user') && <th>Pengguna</th>}
                {isVisible('rating') && <th>Rating</th>}
                {isVisible('content') && <th>Konten</th>}
                {isVisible('created_at') && <th>Tanggal</th>}
                {isVisible('status') && <th>Status</th>}
                {isVisible('actions') && <th style={{ textAlign: 'center' }}>Tindakan</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={visibleKeys.length} className="text-center">Memuat data testimoni...</td></tr>
              ) : testimonials.length === 0 ? (
                <tr><td colSpan={visibleKeys.length} className="text-center text-muted">Belum ada testimoni.</td></tr>
              ) : (
                testimonials.map((testimoni) => (
                  <tr key={testimoni.id}>
                    {isVisible('user') && <td><strong>{testimoni.display_name || testimoni.user?.full_name || 'Tidak diketahui'}</strong></td>}
                    {isVisible('rating') && (
                      <td>
                        <span className="material-symbols-outlined filled text-warning" style={{ fontSize: '1rem', color: '#f59e0b' }}>
                          star
                        </span>
                        <span className="ms-1">{testimoni.rating}/5</span>
                      </td>
                    )}
                    {isVisible('content') && (
                      <td style={{ maxWidth: '300px' }} className="truncate" title={testimoni.content}>
                        {testimoni.content}
                      </td>
                    )}
                    {isVisible('created_at') && <td>{new Date(testimoni.created_at).toLocaleDateString('id-ID')}</td>}
                    {isVisible('status') && (
                      <td>
                        {testimoni.status === 'approved' ? (
                          <Badge variant="success">Disetujui</Badge>
                        ) : testimoni.status === 'rejected' ? (
                          <Badge variant="danger">Ditolak</Badge>
                        ) : (
                          <Badge variant="warning">Menunggu</Badge>
                        )}
                      </td>
                    )}
                    {isVisible('actions') && (
                      <td style={{ textAlign: 'center' }}>
                        <div className="d-flex gap-1 justify-content-center">
                          <Link href={`/testimoni/${testimoni.id}`}>
                            <button className="btn btn-xs btn-outline">Edit / Moderasi</button>
                          </Link>
                          <button className="btn btn-xs btn-danger" onClick={() => handleDelete(testimoni.id)}>Hapus</button>
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

      {toast && (
        <Toast
          message={toast.message}
          variant={toast.variant}
          onClose={() => setToast(null)}
        />
      )}
    </DashboardLayout>
  );
}
