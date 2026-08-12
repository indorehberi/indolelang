'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Toast from '../../components/ui/Toast';
import { apiFetch } from '../../lib/api';
import Link from 'next/link';
import { useToast } from '../../providers/ToastProvider';
import { exportToExcel } from '../../lib/excelExport';
import ColumnPicker, { useColumnVisibility, ColumnOption } from '../../components/ui/ColumnPicker';

interface Blog {
  id: string;
  title: string;
  slug: string;
  status: string;
  created_at: string;
}

const BLOG_COLUMNS: ColumnOption[] = [
  { key: 'title', label: 'Judul Artikel', alwaysVisible: true },
  { key: 'slug', label: 'Slug', defaultVisible: true },
  { key: 'created_at', label: 'Tanggal Dibuat', defaultVisible: true },
  { key: 'status', label: 'Status', defaultVisible: true },
  { key: 'action', label: 'Tindakan', alwaysVisible: true },
];

export default function BlogListPage() {
  const toast = useToast();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState<{ message: string; variant: 'success' | 'danger' } | null>(null);

  const { visibleKeys, setVisibleKeys, isVisible } = useColumnVisibility('blog_list', BLOG_COLUMNS);

  const fetchBlogs = async () => {
    setLoading(true);
    try {
      const response = await apiFetch('/admin/blogs');
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
      const response = await apiFetch(`/admin/blogs/${id}`, { method: 'DELETE' });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || 'Gagal menghapus artikel');
      }

      setToastMsg({ message: 'Artikel berhasil dihapus', variant: 'success' });
      fetchBlogs();
    } catch (err: any) {
      setToastMsg({ message: err.message || 'Terjadi kesalahan sistem', variant: 'danger' });
    }
  };

  const handleExport = () => {
    if (blogs.length === 0) {
      toast.error('Tidak ada data artikel untuk di-export');
      return;
    }
    const dataToExport = blogs.map((blog) => {
      const row: Record<string, any> = {};
      if (isVisible('title')) row['Judul Artikel'] = blog.title;
      if (isVisible('slug')) row['Slug'] = blog.slug;
      if (isVisible('created_at')) row['Tanggal Dibuat'] = new Date(blog.created_at).toLocaleDateString('id-ID');
      if (isVisible('status')) row['Status'] = blog.status === 'published' ? 'Dipublikasi' : 'Draft';
      return row;
    });
    const ok = exportToExcel(dataToExport, 'Blog_Artikel', 'Daftar Artikel');
    if (ok) {
      toast.success('Berhasil mendownload laporan Excel Artikel (.xlsx)');
    } else {
      toast.error('Tidak ada data artikel untuk di-export');
    }
  };

  return (
    <DashboardLayout breadcrumbParent="Konten Publik" breadcrumbCurrent="Blog & Artikel">
      <div className="toolbar">
        <div className="toolbar-left">
          <h1 className="page-title">Blog & Artikel</h1>
          <p className="page-subtitle">Kelola daftar artikel blog yang tampil di website publik.</p>
        </div>
        <div className="toolbar-right" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            style={{ backgroundColor: '#107c41', color: '#fff', borderColor: '#107c41', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            📥 Export Excel
          </Button>
          <ColumnPicker
            columns={BLOG_COLUMNS}
            visibleKeys={visibleKeys}
            onChange={setVisibleKeys}
            tableId="blog_list"
          />
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
                {isVisible('title') && <th>Judul Artikel</th>}
                {isVisible('slug') && <th>Slug</th>}
                {isVisible('created_at') && <th>Tanggal Dibuat</th>}
                {isVisible('status') && <th>Status</th>}
                {isVisible('action') && <th style={{ textAlign: 'center' }}>Tindakan</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={visibleKeys.length} className="text-center">Memuat data artikel...</td></tr>
              ) : blogs.length === 0 ? (
                <tr><td colSpan={visibleKeys.length} className="text-center text-muted">Belum ada artikel blog.</td></tr>
              ) : (
                blogs.map((blog) => (
                  <tr key={blog.id}>
                    {isVisible('title') && <td><strong>{blog.title}</strong></td>}
                    {isVisible('slug') && <td>{blog.slug}</td>}
                    {isVisible('created_at') && <td>{new Date(blog.created_at).toLocaleDateString('id-ID')}</td>}
                    {isVisible('status') && (
                      <td>
                        {blog.status === 'published' ? (
                          <Badge variant="success">Dipublikasi</Badge>
                        ) : (
                          <Badge variant="default">Draft</Badge>
                        )}
                      </td>
                    )}
                    {isVisible('action') && (
                      <td style={{ textAlign: 'center' }}>
                        <div className="d-flex gap-1 justify-content-center">
                          <Link href={`/blog/${blog.id}`}>
                            <button className="btn btn-xs btn-outline">Edit</button>
                          </Link>
                          <button className="btn btn-xs btn-danger" onClick={() => handleDelete(blog.id)}>Hapus</button>
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

      {toastMsg && (
        <Toast
          message={toastMsg.message}
          variant={toastMsg.variant}
          onClose={() => setToastMsg(null)}
        />
      )}
    </DashboardLayout>
  );
}
