'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Toast from '../../../components/ui/Toast';
import { apiFetch, getImageUrl } from '../../../lib/api';

export default function EditTestimoniPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'danger' } | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [formData, setFormData] = useState({
    rating: '5',
    content: '',
    image_url: '',
    status: 'pending',
    display_name: '',
  });

  const handleImageUpload = async (file: File) => {
    if (!file) return;

    // Check size limit: 10MB
    const limit = 10 * 1024 * 1024;
    if (file.size > limit) {
      setToast({
        message: `Ukuran file foto (${(file.size / 1024 / 1024).toFixed(1)} MB) melebihi batas maksimal 10 MB.`,
        variant: 'danger'
      });
      return;
    }

    setUploadingImage(true);
    setToast(null);

    try {
      const uploadData = new FormData();
      uploadData.append('file', file);
      
      const res = await apiFetch('/upload/single', {
        method: 'POST',
        body: uploadData,
      });

      const resData = await res.json();
      if (res.ok && resData.success) {
        setFormData(prev => ({ ...prev, image_url: resData.data.url }));
        setToast({ message: 'Foto berhasil diunggah.', variant: 'success' });
      } else {
        setToast({ message: resData.error?.message || 'Gagal mengunggah foto.', variant: 'danger' });
      }
    } catch (err) {
      setToast({ message: 'Koneksi gagal saat mengunggah foto.', variant: 'danger' });
    } finally {
      setUploadingImage(false);
    }
  };

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
            display_name: testimoni.display_name || testimoni.user?.full_name || ''
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
    if (!formData.display_name.trim()) {
      setToast({ message: 'Nama pengguna wajib diisi', variant: 'danger' });
      return;
    }
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
          display_name: formData.display_name.trim(),
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
                label="Nama Pengguna *"
                type="text"
                required
                placeholder="Masukkan nama pengguna"
                value={formData.display_name}
                onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
              />
              <small className="text-muted">Nama yang akan ditampilkan di website publik.</small>
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
              <label className="form-label" style={{ fontWeight: 'bold' }}>Foto Pengguna (Opsional)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                {formData.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img 
                    src={getImageUrl(formData.image_url)} 
                    alt="Preview" 
                    style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--wf-border)' }} 
                  />
                )}
                <div style={{ flex: 1 }}>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={uploadingImage}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file);
                    }}
                    className="form-control"
                    style={{ padding: '0.375rem 0.75rem', width: '100%' }}
                  />
                  <small className="text-muted" style={{ display: 'block', marginTop: '0.25rem' }}>
                    Format JPG/PNG/WEBP, ukuran maksimal 10MB.
                  </small>
                </div>
              </div>
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
