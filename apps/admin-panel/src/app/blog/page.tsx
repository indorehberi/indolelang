'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Toast from '../../components/ui/Toast';
import { apiUrl } from '../../lib/api';
import Link from 'next/link';

interface Blog {
  id: string;
  title: string;
  slug: string;
  status: string;
  created_at: string;
}

export default function BlogListPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'danger' } | null>(null);

  const fetchBlogs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(apiUrl('/admin/blogs'), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setBlogs(data.data);
      } else {
        setBlogs([]);
      }
    } catch (e) {
      setBlogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus artikel ini?')) return;
    
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(apiUrl(`/admin/blogs/${id}`), {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || 'Gagal menghapus artikel');
      }

      setToast({ message: 'Artikel berhasil dihapus', variant: 'success' });
      fetchBlogs();
    } catch (err: any) {
      setToast({ message: err.message || 'Terjadi kesalahan sistem', variant: 'danger' });
    }
  };

  return (
    <DashboardLayout breadcrumbParent="Konten Publik" breadcrumbCurrent="Blog & Artikel">
      <div className="toolbar">
        <div className="toolbar-left">
          <h1 className="page-title">Blog & Artikel</h1>
          <p className="page-subtitle">Kelola daftar artikel blog yang tampil di website publik.</p>
        </div>
        <div className="toolbar-right">
          <Link href="/blog/tambah">
            <Button variant="primary" size="sm">
              + Tambah Artikel
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Judul Artikel</th>
                <th>Slug</th>
                <th>Tanggal Dibuat</th>
                <th>Status</th>
                <th style={{ textAlign: 'center' }}>Tindakan</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="text-center">Memuat data artikel...</td></tr>
              ) : blogs.length === 0 ? (
                <tr><td colSpan={5} className="text-center text-muted">Belum ada artikel blog.</td></tr>
              ) : (
                blogs.map((blog) => (
                  <tr key={blog.id}>
                    <td><strong>{blog.title}</strong></td>
                    <td>{blog.slug}</td>
                    <td>{new Date(blog.created_at).toLocaleDateString('id-ID')}</td>
                    <td>
                      {blog.status === 'published' ? (
                        <Badge variant="success">Dipublikasi</Badge>
                      ) : (
                        <Badge variant="default">Draft</Badge>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div className="d-flex gap-1 justify-content-center">
                        <Link href={`/blog/${blog.id}`}>
                          <button className="btn btn-xs btn-outline">Edit</button>
                        </Link>
                        <button className="btn btn-xs btn-danger" onClick={() => handleDelete(blog.id)}>Hapus</button>
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
