'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Button } from '../../components/ui/Button';
import { apiUrl } from '../../lib/api';
import Image from 'next/image';

interface Gallery {
  id: string;
  image_url: string;
  created_at: string;
}

export default function GalleryListPage() {
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [loading, setLoading] = useState(true);
  const fetchGalleries = async () => {
    setLoading(true);
    try {
      const response = await fetch(apiUrl('/admin/galleries'), {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken') || localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setGalleries(data.data);
      } else {
        setGalleries([]);
      }
    } catch (error) {
      console.error('Error fetching galleries:', error);
      setGalleries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGalleries();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus gambar ini?')) return;
    try {
      const response = await fetch(apiUrl(`/admin/galleries/${id}`), {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken') || localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error?.message || 'Gagal menghapus gallery');
      }
      alert('Gambar berhasil dihapus');
      fetchGalleries();
    } catch (error: any) {
      alert(error.message);
    }
  };

  return (
    <DashboardLayout breadcrumbParent="Konten Publik" breadcrumbCurrent="Gallery">
      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 className="page-title">Gallery</h1>
            <p className="page-subtitle">Kelola gambar yang tampil di halaman gallery publik.</p>
          </div>
          <Link href="/gallery/tambah">
            <Button>
              + Tambah Gambar
            </Button>
          </Link>
        </div>
        <div className="card-body">
          {loading ? (
            <div className="p-4 text-center">Memuat data gallery...</div>
          ) : galleries.length === 0 ? (
            <div className="p-4 text-center text-muted">Belum ada gambar gallery.</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
              {galleries.map((gallery) => (
                <div key={gallery.id} style={{ border: '1px solid #e2e8f0', borderRadius: '0.5rem', overflow: 'hidden' }}>
                  <div style={{ position: 'relative', width: '100%', height: '150px' }}>
                    <Image
                      src={gallery.image_url}
                      alt="Gallery"
                      fill
                      style={{ objectFit: 'cover' }}
                      unoptimized
                    />
                  </div>
                  <div style={{ padding: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      {new Date(gallery.created_at).toLocaleDateString('id-ID')}
                    </span>
                    <button
                      onClick={() => handleDelete(gallery.id)}
                      style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                      title="Hapus Gambar"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
