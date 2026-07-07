'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import { apiUrl } from '../../../lib/api';

interface User {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  status: 'pending' | 'active' | 'suspended';
  created_at: string;
}

export default function BidderListPage() {
  const router = useRouter();
  const [bidders, setBidders] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('');
  
  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
  });

  const fetchBidders = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      let url = apiUrl('/admin/users?role=bidder');
      if (filterStatus) {
        url += `&status=${filterStatus}`;
      }
      
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setBidders(data.data);
      } else {
        setBidders([]);
      }
    } catch (err) {
      console.error(err);
      setBidders([]);
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchBidders();
  }, [fetchBidders]);

  const getStatusBadge = (status: User['status']) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">Active</Badge>;
      case 'pending':
        return <Badge variant="warning">Pending</Badge>;
      case 'suspended':
        return <Badge variant="danger">Suspended</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };



  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(apiUrl(`/admin/users/${selectedUser.id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          full_name: formData.full_name,
          email: formData.email,
          phone: formData.phone,
        }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setShowEditModal(false);
        fetchBidders();
      } else {
        alert(data.error?.message || 'Gagal mengubah bidder');
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan sistem');
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(apiUrl(`/admin/users/${selectedUser.id}`), {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setShowDeleteModal(false);
        fetchBidders();
      } else {
        alert(data.error?.message || 'Gagal menghapus bidder');
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan sistem');
    }
  };

  const openEdit = (user: User) => {
    setSelectedUser(user);
    setFormData({
      full_name: user.full_name,
      email: user.email,
      phone: user.phone || '',
      password: '',
    });
    setShowEditModal(true);
  };

  const openDelete = (user: User) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  return (
    <DashboardLayout breadcrumbParent="Pengguna" breadcrumbCurrent="Bidder">
      <div className="toolbar">
        <div className="toolbar-left">
          <h1 className="page-title">Daftar Bidder</h1>
        </div>
        <div className="toolbar-right" style={{ display: 'flex', gap: '10px' }}>
          <select 
            className="search-box" 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
          >
            <option value="">Semua Status</option>
            <option value="active">Approved (Active)</option>
            <option value="pending">Pending (Need Approval)</option>
            <option value="suspended">Other (Suspended)</option>
          </select>
          <input type="text" placeholder="Cari bidder..." className="search-box" />
          <Button variant="primary" size="sm" onClick={() => router.push('/users/bidder/new')}>
            + Tambah Bidder
          </Button>
        </div>
      </div>

      <Card>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Nama Lengkap</th>
                <th>Email</th>
                <th>Nomor Telepon</th>
                <th>NIPL Aktif</th>
                <th>Status</th>
                <th>Tanggal Daftar</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center">
                    Memuat data...
                  </td>
                </tr>
              ) : bidders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center">
                    Tidak ada bidder terdaftar.
                  </td>
                </tr>
              ) : (
                bidders.map((bidder) => (
                  <tr key={bidder.id}>
                    <td>
                      <strong>{bidder.full_name}</strong>
                    </td>
                    <td>{bidder.email}</td>
                    <td>{bidder.phone}</td>
                    <td>
                      <Badge variant={(bidder as any).active_nipl_count > 0 ? 'success' : 'default'}>
                        {(bidder as any).active_nipl_count || 0} NIPL
                      </Badge>
                    </td>
                    <td>{getStatusBadge(bidder.status)}</td>
                    <td>{bidder.created_at.split('T')[0]}</td>
                    <td>
                      <div className="d-flex gap-1">
                        <Button variant="outline" size="sm" onClick={() => router.push(`/users/${bidder.id}`)}>
                          View
                        </Button>
                        <Button variant="danger" size="sm" onClick={() => openDelete(bidder)}>
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>



      {/* EDIT MODAL */}
      {showEditModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <Card>
            <h3 style={{ marginBottom: '1rem' }}>Edit Bidder</h3>
            <form onSubmit={handleEdit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Nama Lengkap</label>
                <input required type="text" value={formData.full_name} onChange={(e) => setFormData({...formData, full_name: e.target.value})} style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }} />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Email</label>
                <input required type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }} />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Nomor Telepon</label>
                <input required type="text" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <Button variant="outline" type="button" onClick={() => setShowEditModal(false)}>Batal</Button>
                <Button variant="primary" type="submit">Simpan</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* DELETE MODAL */}
      {showDeleteModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <Card>
            <h3 style={{ marginBottom: '1rem', color: 'var(--color-danger)' }}>Hapus Bidder</h3>
            <p style={{ marginBottom: '1.5rem' }}>
              Apakah Anda yakin ingin menghapus <strong>{selectedUser?.full_name}</strong>? Tindakan ini akan menonaktifkan pengguna.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <Button variant="outline" type="button" onClick={() => setShowDeleteModal(false)}>Batal</Button>
              <Button variant="danger" type="button" onClick={handleDelete}>Hapus</Button>
            </div>
          </Card>
        </div>
      )}
    </DashboardLayout>
  );
}
