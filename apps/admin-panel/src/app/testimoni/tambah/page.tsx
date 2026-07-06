'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Toast from '../../../components/ui/Toast';
import { apiUrl } from '../../../lib/api';

export default function TambahTestimoniPage() {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'danger' } | null>(null);

  const [formData, setFormData] = useState({
    user_id: '',
    rating: '5',
    content: '',
    image_url: '',
    status: 'approved',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.user_id || !formData.rating || !formData.content) {
      setToast({ message: 'Mohon isi semua bidang yang diwajibkan', variant: 'danger' });
      return;
    }

    setAdding(true);
    setToast(null);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(apiUrl('/admin/testimonials'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          rating: parseInt(formData.rating, 10)
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || 'Gagal menambahkan testimoni');
      }

      setToast({ message: 'Testimoni berhasil ditambahkan', variant: 'success' });
      setTimeout(() => {
        router.push('/testimoni');
      }, 1500);
    } catch (err: any) {
      setToast({ message: err.message || 'Terjadi kesalahan sistem', variant: 'danger' });
      setAdding(false);
    }
  };

  return (
    <DashboardLayout breadcrumbParent="Testimoni" breadcrumbCurrent="Tambah Testimoni">
      <div className="toolbar">
        <div className="toolbar-left">
          <h1 className="page-title">Tambah Testimoni</h1>
        </div>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <Input
              label="User ID (UUID)"
              type="text"
              required
              placeholder="Masukkan UUID pengguna"
              value={formData.user_id}
              onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
            />
            <small className="text-muted">Testimoni harus dikaitkan dengan akun pengguna yang ada.</small>
          </div>
          
          <div className="mb-3">
            <label className="form-label" style={{ fontWeight: 'bold' }}>Rating</label>
            <select
              className="form-control"
              required
              value={formData.rating}
              onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                border: '1px solid var(--wf-border)',
                borderRadius: 'var(--radius)',
                background: '#fff'
              }}
            >
              <option value="5">5 Bintang (Sangat Baik)</option>
              <option value="4">4 Bintang (Baik)</option>
              <option value="3">3 Bintang (Cukup)</option>
              <option value="2">2 Bintang (Buruk)</option>
              <option value="1">1 Bintang (Sangat Buruk)</option>
            </select>
          </div>

          <div className="mb-3">
            <label className="form-label" style={{ fontWeight: 'bold' }}>
              Konten Testimoni <span className="text-danger">*</span>
            </label>
            <textarea
              className="form-control"
              required
              style={{
                width: '100%',
                minHeight: '120px',
                padding: '0.75rem',
                border: '1px solid var(--wf-border)',
                borderRadius: 'var(--radius)',
                fontFamily: 'inherit',
              }}
              placeholder="Isi testimoni pengguna di sini..."
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            />
          </div>

          <div className="mb-3">
            <Input
              label="URL Foto (Opsional)"
              type="text"
              placeholder="https://example.com/photo.jpg"
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
            />
            <small className="text-muted">Masukkan URL foto pengguna jika ada.</small>
          </div>

          <div className="mb-4">
            <label className="form-label" style={{ fontWeight: 'bold' }}>Status</label>
            <select
              className="form-control"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                border: '1px solid var(--wf-border)',
                borderRadius: 'var(--radius)',
                background: '#fff'
              }}
            >
              <option value="pending">Menunggu Moderasi</option>
              <option value="approved">Disetujui (Tampil di Web)</option>
              <option value="rejected">Ditolak</option>
            </select>
          </div>

          <div className="d-flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => router.push('/testimoni')} disabled={adding}>
              Batal
            </Button>
            <Button type="submit" variant="primary" disabled={adding}>
              {adding ? 'Menyimpan...' : 'Simpan Testimoni'}
            </Button>
          </div>
        </form>
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
