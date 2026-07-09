'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Toast from '../../components/ui/Toast';
import { apiUrl } from '../../lib/api';

interface Branch {
  id: string;
  tenant_id: string;
  name: string;
  city: string;
  address: string;
  phone: string;
  pic_name: string;
  is_active: boolean;
}

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(false);
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'danger' } | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    city: '',
    address: '',
    phone: '',
    pic_name: '',
  });

  const [editData, setEditData] = useState({
    id: '',
    name: '',
    city: '',
    address: '',
    phone: '',
    pic_name: '',
  });

  const fetchBranches = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(apiUrl('/branches'), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setBranches(data.data);
      } else {
        setBranches([]);
      }
    } catch (e) {
      setBranches([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.city || !formData.address || !formData.phone || !formData.pic_name) {
      alert('Mohon isi semua bidang yang diwajibkan.');
      return;
    }

    setAdding(true);
    setToast(null);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(apiUrl('/admin/branches'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || 'Gagal menambahkan cabang');
      }

      setToast({ message: 'Cabang berhasil ditambahkan', variant: 'success' });
      setShowAddModal(false);
      setFormData({ name: '', city: '', address: '', phone: '', pic_name: '' });
      fetchBranches();
    } catch (err: any) {
      setToast({ message: err.message || 'Terjadi kesalahan sistem', variant: 'danger' });
    } finally {
      setAdding(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editData.name || !editData.city || !editData.address || !editData.phone || !editData.pic_name) {
      alert('Mohon isi semua bidang yang diwajibkan.');
      return;
    }

    setEditing(true);
    setToast(null);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(apiUrl(`/admin/branches/${editData.id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editData.name,
          city: editData.city,
          address: editData.address,
          phone: editData.phone,
          pic_name: editData.pic_name,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || 'Gagal mengubah cabang');
      }

      setToast({ message: 'Cabang berhasil diubah', variant: 'success' });
      setShowEditModal(false);
      fetchBranches();
    } catch (err: any) {
      setToast({ message: err.message || 'Terjadi kesalahan sistem', variant: 'danger' });
    } finally {
      setEditing(false);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    if (!confirm(`Apakah Anda yakin ingin ${currentStatus ? 'menutup (nonaktifkan)' : 'mengaktifkan'} cabang ini?`)) return;

    setToast(null);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(apiUrl(`/admin/branches/${id}/status`), {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || 'Gagal mengubah status cabang');
      }

      setToast({ message: data.message || 'Status cabang berhasil diubah', variant: 'success' });
      fetchBranches();
    } catch (err: any) {
      setToast({ message: err.message || 'Terjadi kesalahan sistem', variant: 'danger' });
    }
  };

  return (
    <DashboardLayout breadcrumbParent="Pengaturan" breadcrumbCurrent="Manajemen Cabang">
      <div className="toolbar">
        <div className="toolbar-left">
          <h1 className="page-title">Manajemen Kantor Cabang</h1>
          <p className="page-subtitle">Daftar lokasi fisik kantor operasional dan titik penyerahan/pengambilan unit lelang.</p>
        </div>
        <div className="toolbar-right">
          <Button variant="primary" size="sm" onClick={() => setShowAddModal(true)}>
            + Tambah Cabang
          </Button>
        </div>
      </div>

      <Card>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Nama Cabang</th>
                <th>Kota</th>
                <th>Alamat Lengkap</th>
                <th>Nomor Telepon</th>
                <th>Kepala Cabang (PIC)</th>
                <th>Status</th>
                <th style={{ textAlign: 'center' }}>Tindakan</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center">Memuat data cabang...</td></tr>
              ) : branches.length === 0 ? (
                <tr><td colSpan={7} className="text-center text-muted">Tidak ada cabang terdaftar.</td></tr>
              ) : (
                branches.map((br) => (
                  <tr key={br.id}>
                    <td><strong>{br.name}</strong></td>
                    <td>{br.city}</td>
                    <td style={{ maxWidth: '300px', whiteSpace: 'normal', fontSize: '0.85rem' }}>{br.address}</td>
                    <td>{br.phone}</td>
                    <td>{br.pic_name}</td>
                    <td>
                      {br.is_active ? (
                        <Badge variant="success">Aktif</Badge>
                      ) : (
                        <Badge variant="danger">Tutup</Badge>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div className="d-flex gap-1 justify-content-center">
                        <button 
                          className="btn btn-xs btn-outline"
                          onClick={() => {
                            setEditData({
                              id: br.id,
                              name: br.name,
                              city: br.city,
                              address: br.address,
                              phone: br.phone,
                              pic_name: br.pic_name,
                            });
                            setShowEditModal(true);
                          }}
                        >
                          Ubah
                        </button>
                        <button 
                          className={`btn btn-xs ${br.is_active ? 'btn-danger' : 'btn-success'}`}
                          onClick={() => handleToggleStatus(br.id, br.is_active)}
                        >
                          {br.is_active ? 'Tutup' : 'Aktifkan'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add Branch Modal */}
      {showAddModal && (
        <Modal
          isOpen={showAddModal}
          title="Tambah Cabang Baru"
          onClose={() => setShowAddModal(false)}
        >
          <form onSubmit={handleAddSubmit}>
            <div className="mb-2">
              <Input
                label="Nama Cabang"
                type="text"
                required
                placeholder="Contoh: Cabang Jakarta Pusat"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="mb-2">
              <Input
                label="Kota"
                type="text"
                required
                placeholder="Contoh: Jakarta Pusat"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
            </div>
            <div className="mb-2">
              <label className="form-label" style={{ fontWeight: 'bold' }}>
                Alamat Lengkap <span className="text-danger">*</span>
              </label>
              <textarea
                className="form-control"
                required
                style={{
                  width: '100%',
                  minHeight: '80px',
                  padding: '0.5rem',
                  border: '1px solid var(--wf-border)',
                  borderRadius: 'var(--radius)',
                  fontFamily: 'inherit',
                }}
                placeholder="Alamat lengkap cabang..."
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
            <div className="mb-2">
              <Input
                label="Nomor Telepon"
                type="text"
                required
                placeholder="Contoh: 08123456789"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="mb-3">
              <Input
                label="Nama Kepala Cabang (PIC)"
                type="text"
                required
                placeholder="Contoh: Budi Santoso"
                value={formData.pic_name}
                onChange={(e) => setFormData({ ...formData, pic_name: e.target.value })}
              />
            </div>
            <div className="d-flex justify-end gap-1">
              <Button type="button" variant="outline" onClick={() => setShowAddModal(false)} disabled={adding}>
                Batal
              </Button>
              <Button type="submit" variant="primary" disabled={adding}>
                {adding ? 'Menyimpan...' : 'Simpan Cabang'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Branch Modal */}
      {showEditModal && (
        <Modal
          isOpen={showEditModal}
          title="Ubah Cabang"
          onClose={() => setShowEditModal(false)}
        >
          <form onSubmit={handleEditSubmit}>
            <div className="mb-2">
              <Input
                label="Nama Cabang"
                type="text"
                required
                value={editData.name}
                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
              />
            </div>
            <div className="mb-2">
              <Input
                label="Kota"
                type="text"
                required
                value={editData.city}
                onChange={(e) => setEditData({ ...editData, city: e.target.value })}
              />
            </div>
            <div className="mb-2">
              <label className="form-label" style={{ fontWeight: 'bold' }}>
                Alamat Lengkap <span className="text-danger">*</span>
              </label>
              <textarea
                className="form-control"
                required
                style={{
                  width: '100%',
                  minHeight: '80px',
                  padding: '0.5rem',
                  border: '1px solid var(--wf-border)',
                  borderRadius: 'var(--radius)',
                  fontFamily: 'inherit',
                }}
                value={editData.address}
                onChange={(e) => setEditData({ ...editData, address: e.target.value })}
              />
            </div>
            <div className="mb-2">
              <Input
                label="Nomor Telepon"
                type="text"
                required
                value={editData.phone}
                onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
              />
            </div>
            <div className="mb-3">
              <Input
                label="Nama Kepala Cabang (PIC)"
                type="text"
                required
                value={editData.pic_name}
                onChange={(e) => setEditData({ ...editData, pic_name: e.target.value })}
              />
            </div>
            <div className="d-flex justify-end gap-1">
              <Button type="button" variant="outline" onClick={() => setShowEditModal(false)} disabled={editing}>
                Batal
              </Button>
              <Button type="submit" variant="primary" disabled={editing}>
                {editing ? 'Menyimpan...' : 'Simpan Perubahan'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

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
