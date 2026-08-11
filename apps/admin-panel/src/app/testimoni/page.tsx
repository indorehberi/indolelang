'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Toast from '../../components/ui/Toast';
import { apiFetch } from '../../lib/api';
import Link from 'next/link';

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

  return (
    <DashboardLayout breadcrumbParent="Konten Publik" breadcrumbCurrent="Testimoni">
      <div className="toolbar">
        <div className="toolbar-left">
          <h1 className="page-title">Testimoni Pengguna</h1>
          <p className="page-subtitle">Kelola ulasan dan testimoni pengguna yang tampil di website publik.</p>
        </div>
        <div className="toolbar-right">
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
                <th>Pengguna</th>
                <th>Rating</th>
                <th>Konten</th>
                <th>Tanggal</th>
                <th>Status</th>
                <th style={{ textAlign: 'center' }}>Tindakan</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center">Memuat data testimoni...</td></tr>
              ) : testimonials.length === 0 ? (
                <tr><td colSpan={6} className="text-center text-muted">Belum ada testimoni.</td></tr>
              ) : (
                testimonials.map((testimoni) => (
                  <tr key={testimoni.id}>
                    <td><strong>{testimoni.display_name || testimoni.user?.full_name || 'Tidak diketahui'}</strong></td>
                    <td>
                      <span className="material-symbols-outlined filled text-warning" style={{ fontSize: '1rem', color: '#f59e0b' }}>
                        star
                      </span>
                      <span className="ms-1">{testimoni.rating}/5</span>
                    </td>
                    <td style={{ maxWidth: '300px' }} className="truncate" title={testimoni.content}>
                      {testimoni.content}
                    </td>
                    <td>{new Date(testimoni.created_at).toLocaleDateString('id-ID')}</td>
                    <td>
                      {testimoni.status === 'approved' ? (
                        <Badge variant="success">Disetujui</Badge>
                      ) : testimoni.status === 'rejected' ? (
                        <Badge variant="danger">Ditolak</Badge>
                      ) : (
                        <Badge variant="warning">Menunggu</Badge>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div className="d-flex gap-1 justify-content-center">
                        <Link href={`/testimoni/${testimoni.id}`}>
                          <button className="btn btn-xs btn-outline">Edit / Moderasi</button>
                        </Link>
                        <button className="btn btn-xs btn-danger" onClick={() => handleDelete(testimoni.id)}>Hapus</button>
                      </div>
                    </td>
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
