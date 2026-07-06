'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Toast from '../../../components/ui/Toast';
import { apiUrl } from '../../../lib/api';

export default function EditBlogPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'danger' } | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    image_url: '',
    status: 'draft',
  });

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const response = await fetch(apiUrl(`/admin/blogs/${id}`), {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        const data = await response.json();
        if (response.ok && data.success) {
          const blog = data.data;
          setFormData({
            title: blog.title,
            slug: blog.slug,
            content: blog.content,
            image_url: blog.image_url || '',
            status: blog.status,
          });
        } else {
          setToast({ message: data.error?.message || 'Gagal memuat artikel', variant: 'danger' });
        }
      } catch (err: any) {
        setToast({ message: 'Terjadi kesalahan sistem saat memuat', variant: 'danger' });
      } finally {
        setLoading(false);
      }
    };
    
    if (id) fetchBlog();
  }, [id]);

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

    setSaving(true);
    setToast(null);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(apiUrl(`/admin/blogs/${id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || 'Gagal memperbarui artikel');
      }

      setToast({ message: 'Artikel berhasil diperbarui', variant: 'success' });
      setTimeout(() => {
        router.push('/blog');
      }, 1500);
    } catch (err: any) {
      setToast({ message: err.message || 'Terjadi kesalahan sistem', variant: 'danger' });
      setSaving(false);
    }
  };

  return (
    <DashboardLayout breadcrumbParent="Blog & Artikel" breadcrumbCurrent="Edit Artikel">
      <div className="toolbar">
        <div className="toolbar-left">
          <h1 className="page-title">Edit Artikel</h1>
        </div>
      </div>

      <Card>
        {loading ? (
          <div className="p-4 text-center">Memuat data artikel...</div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <Input
                label="Judul Artikel"
                type="text"
                required
                value={formData.title}
                onChange={handleTitleChange}
              />
            </div>
            
            <div className="mb-3">
              <Input
                label="Slug (URL Friendly)"
                type="text"
                required
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              />
            </div>

            <div className="mb-3">
              <Input
                label="URL Gambar (Opsional)"
                type="text"
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
              <Button type="button" variant="outline" onClick={() => router.push('/blog')} disabled={saving}>
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
