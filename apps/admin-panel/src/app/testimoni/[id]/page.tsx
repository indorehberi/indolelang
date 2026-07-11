'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Toast from '../../../components/ui/Toast';
import { apiFetch } from '../../../lib/api';

export default function EditTestimoniPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'danger' } | null>(null);

  const [formData, setFormData] = useState({
    rating: '5',
    content: '',
    image_url: '',
    status: 'pending',
    userName: '',
  });

  useEffect(() => {
    const fetchTestimoni = async () => {
      try {
        const response = await apiFetch(`/admin/testimonials/${id}`);

        const data = await response.json();
        if (response.ok && data.success) {
          const testimoni = data.data;
          setFormData({
            rating: testimoni.rating.toString(),
            content: testimoni.content,
            image_url: testimoni.image_url || '',
            status: testimoni.status,
            userName: testimoni.user?.full_name || 'User tidak diketahui'
          });
        } else {
          setToast({ message: data.error?.message || 'Gagal memuat testimoni', variant: 'danger' });
        }
      } catch (err: any) {
        setToast({ message: 'Terjadi kesalahan sistem saat memuat', variant: 'danger' });
      } finally {
        setLoading(false);
      }
    };
    
    if (id) fetchTestimoni();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.rating || !formData.content) {
      setToast({ message: 'Mohon isi semua bidang yang diwajibkan', variant: 'danger' });
      return;
    }

    setSaving(true);
    setToast(null);
    try {
      const response = await apiFetch(`/admin/testimonials/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          rating: parseInt(formData.rating, 10),
          content: formData.content,
          image_url: formData.image_url,
          status: formData.status
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || 'Gagal memperbarui testimoni');
      }

      setToast({ message: 'Testimoni berhasil diperbarui', variant: 'success' });
      setTimeout(() => {
        router.push('/testimoni');
      }, 1500);
    } catch (err: any) {
      setToast({ message: err.message || 'Terjadi kesalahan sistem', variant: 'danger' });
      setSaving(false);
    }
  };

  return (
    <DashboardLayout breadcrumbParent="Testimoni" breadcrumbCurrent="Edit & Moderasi">
      <div className="toolbar">
        <div className="toolbar-left">
          <h1 className="page-title">Edit & Moderasi Testimoni</h1>
        </div>
      </div>

      <Card>
        {loading ? (
          <div className="p-4 text-center">Memuat data testimoni...</div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <Input
                label="Pengguna"
                type="text"
                value={formData.userName}
                disabled
              />
              <small className="text-muted">Nama pengguna tidak dapat diubah.</small>
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
              <small className="text-muted">Ganti URL foto pengguna jika perlu.</small>
            </div>

            <div className="mb-4">
              <label className="form-label" style={{ fontWeight: 'bold' }}>Status Moderasi</label>
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
              <Button type="button" variant="outline" onClick={() => router.push('/testimoni')} disabled={saving}>
                Batal
              </Button>
              <Button type="submit" variant="primary" disabled={saving}>
                {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
              </Button>
            </div>
          </form>
        )}
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
