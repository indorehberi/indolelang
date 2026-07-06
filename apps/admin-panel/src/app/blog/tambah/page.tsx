'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Toast from '../../../components/ui/Toast';
import { apiUrl } from '../../../lib/api';

export default function TambahBlogPage() {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'danger' } | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    image_url: '',
    status: 'draft',
  });

  const generateSlug = (title: string) => {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    setFormData({ ...formData, title, slug: generateSlug(title) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.slug || !formData.content) {
      setToast({ message: 'Mohon isi semua bidang yang diwajibkan', variant: 'danger' });
      return;
    }

    setAdding(true);
    setToast(null);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(apiUrl('/admin/blogs'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || 'Gagal menambahkan artikel');
      }

      setToast({ message: 'Artikel berhasil ditambahkan', variant: 'success' });
      setTimeout(() => {
        router.push('/blog');
      }, 1500);
    } catch (err: any) {
      setToast({ message: err.message || 'Terjadi kesalahan sistem', variant: 'danger' });
      setAdding(false);
    }
  };

  return (
    <DashboardLayout breadcrumbParent="Blog & Artikel" breadcrumbCurrent="Tambah Artikel">
      <div className="toolbar">
        <div className="toolbar-left">
          <h1 className="page-title">Tambah Artikel Baru</h1>
        </div>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <Input
              label="Judul Artikel"
              type="text"
              required
              placeholder="Contoh: Tips Memilih Kendaraan Lelang"
              value={formData.title}
              onChange={handleTitleChange}
            />
          </div>
          
          <div className="mb-3">
            <Input
              label="Slug (URL Friendly)"
              type="text"
              required
              placeholder="contoh: tips-memilih-kendaraan-lelang"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
            />
          </div>

          <div className="mb-3">
            <Input
              label="URL Gambar (Opsional)"
              type="text"
              placeholder="https://example.com/image.jpg"
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
            />
          </div>

          <div className="mb-3">
            <label className="form-label" style={{ fontWeight: 'bold' }}>
              Konten Artikel <span className="text-danger">*</span>
            </label>
            <textarea
              className="form-control"
              required
              style={{
                width: '100%',
                minHeight: '200px',
                padding: '0.75rem',
                border: '1px solid var(--wf-border)',
                borderRadius: 'var(--radius)',
                fontFamily: 'inherit',
              }}
              placeholder="Isi konten artikel di sini..."
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            />
          </div>

          <div className="mb-4">
            <label className="form-label" style={{ fontWeight: 'bold' }}>Status Publikasi</label>
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
              <option value="draft">Draft (Simpan sementara)</option>
              <option value="published">Published (Publikasikan sekarang)</option>
            </select>
          </div>

          <div className="d-flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => router.push('/blog')} disabled={adding}>
              Batal
            </Button>
            <Button type="submit" variant="primary" disabled={adding}>
              {adding ? 'Menyimpan...' : 'Simpan Artikel'}
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
