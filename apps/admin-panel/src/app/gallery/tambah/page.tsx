'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import { Button } from '../../../components/ui/Button';
import { apiUrl } from '../../../lib/api';
import { useToast } from '../../../components/ui/Toast';

export default function TambahGalleryPage() {
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const { setToast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const uploadFile = async (selectedFile: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', selectedFile);
    
    const response = await fetch(apiUrl('/upload/single'), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('accessToken') || localStorage.getItem('token')}`,
      },
      body: formData,
    });
    
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error?.message || 'Gagal mengupload gambar');
    }
    
    return data.data.url;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setToast({ message: 'Silakan pilih gambar terlebih dahulu', variant: 'danger' });
      return;
    }

    setSaving(true);
    try {
      const imageUrl = await uploadFile(file);

      const response = await fetch(apiUrl('/admin/galleries'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken') || localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ image_url: imageUrl }),
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error?.message || 'Gagal menyimpan gambar ke gallery');
      }

      setToast({ message: 'Gambar berhasil ditambahkan ke gallery', variant: 'success' });
      router.push('/gallery');
    } catch (error: any) {
      setToast({ message: error.message, variant: 'danger' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout breadcrumbParent="Gallery" breadcrumbCurrent="Tambah Gambar">
      <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div className="card-header">
          <h1 className="page-title">Tambah Gambar Gallery</h1>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Pilih Gambar <span style={{ color: '#ef4444' }}>*</span></label>
              <input
                type="file"
                accept="image/png, image/jpeg, image/jpg, image/webp"
                onChange={handleFileChange}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.25rem',
                }}
                required
              />
              {file && (
                <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#10b981' }}>
                  ✓ {file.name}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <Button type="button" variant="outline" onClick={() => router.push('/gallery')} disabled={saving}>
                Batal
              </Button>
              <Button type="submit" variant="primary" disabled={saving}>
                {saving ? 'Menyimpan...' : 'Simpan Gambar'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
