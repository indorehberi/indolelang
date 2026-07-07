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
  kyc?: {
    id: string;
    status: string;
    ktp_url: string;
    selfie_url: string;
  };
  created_at: string;
}

export default function BidderListPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  
  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showKycModal, setShowKycModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
  });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      let url = apiUrl('/admin/users?');
      const roleQuery = filterRole ? filterRole : 'user,bidder';
      url += `role=${roleQuery}`;
      
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
        setUsers(data.data);
      } else {
        setUsers([]);
      }
    } catch (err) {
      console.error(err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [filterRole, filterStatus]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchUsers();
  }, [fetchUsers]);

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
        fetchUsers();
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
        fetchUsers();
      } else {
        alert(data.error?.message || 'Gagal menghapus bidder');
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan sistem');
    }
  };

  const handleApproveKyc = async (kycId: string) => {
    if (!window.confirm('Apakah Anda yakin ingin menyetujui verifikasi KYC bidder ini?')) return;
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(apiUrl(`/admin/kyc/${kycId}/approve`), {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        setShowKycModal(false);
        fetchUsers();
      } else {
        const data = await response.json();
        alert(data.error?.message || 'Gagal menyetujui KYC');
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan sistem');
    }
  };

  const handleRejectKyc = async (kycId: string) => {
    const reason = window.prompt('Masukkan alasan penolakan verifikasi KYC:');
    if (reason === null) return; // User cancelled
    if (!reason.trim()) {
      alert('Alasan penolakan wajib diisi!');
      return;
    }
    
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(apiUrl(`/admin/kyc/${kycId}/reject`), {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ rejection_reason: reason.trim() })
      });
      if (response.ok) {
        setShowKycModal(false);
        fetchUsers();
      } else {
        const data = await response.json();
        alert(data.error?.message || 'Gagal menolak KYC');
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan sistem');
    }
  };

  return (
    <DashboardLayout breadcrumbParent="Pengguna" breadcrumbCurrent="Bidder">
      <div className="toolbar">
        <div className="toolbar-left">
          <h1 className="page-title">Daftar Pengguna / Bidder</h1>
        </div>
        <div className="toolbar-right" style={{ display: 'flex', gap: '10px' }}>
          <select 
            className="search-box" 
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
          >
            <option value="">Semua (User & Bidder)</option>
            <option value="user">Hanya User Baru</option>
            <option value="bidder">Hanya Bidder</option>
          </select>
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
                <th>Tipe Akun</th>
                <th>NIPL Aktif</th>
                <th>Status</th>
                <th>Tanggal Daftar</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center">
                    Memuat data...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center">
                    Tidak ada pengguna terdaftar.
                  </td>
                </tr>
              ) : (
                users.map((bidder) => (
                  <tr key={bidder.id}>
                    <td>
                      <strong>{bidder.full_name}</strong>
                    </td>
                    <td>{bidder.email}</td>
                    <td>{bidder.phone}</td>
                    <td>
                      <Badge variant={(bidder as any).role === 'bidder' ? 'info' : 'default'}>
                        {((bidder as any).role || '').toUpperCase()}
                      </Badge>
                    </td>
                    <td>
                      <Badge variant={(bidder as any).active_nipl_count > 0 ? 'success' : 'default'}>
                        {(bidder as any).active_nipl_count || 0} NIPL
                      </Badge>
                    </td>
                    <td>{getStatusBadge(bidder.status)}</td>
                    <td>{bidder.created_at.split('T')[0]}</td>
                    <td>
                      <div className="d-flex gap-1" style={{ display: 'flex', gap: '0.5rem' }}>
                        {bidder.status === 'pending' && bidder.kyc && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => {
                              setSelectedUser(bidder);
                              setShowKycModal(true);
                            }}
                          >
                            View KYC
                          </Button>
                        )}
                        <Button variant="outline" size="sm" onClick={() => {
                          setSelectedUser(bidder);
                          setFormData({ 
                            full_name: bidder.full_name, 
                            email: bidder.email, 
                            phone: bidder.phone || '', 
                            password: '' 
                          });
                          setShowEditModal(true);
                        }}>
                          Edit
                        </Button>
                        <Button variant="danger" size="sm" onClick={() => {
                          setSelectedUser(bidder);
                          setShowDeleteModal(true);
                        }}>
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

      {/* KYC VIEW MODAL */}
      {showKycModal && selectedUser && selectedUser.kyc && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '2rem' }}>
          <div style={{ maxWidth: '800px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <Card>
              <h3 style={{ marginBottom: '1rem' }}>Peninjauan KYC Bidder</h3>
              <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexDirection: 'column' }}>
                <div>
                  <strong>Nama:</strong> {selectedUser.full_name}
                </div>
                <div>
                  <strong>Email:</strong> {selectedUser.email}
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ border: '1px solid #eee', padding: '0.5rem', borderRadius: '4px' }}>
                  <h4 style={{ marginBottom: '0.5rem', textAlign: 'center' }}>Foto KTP</h4>
                  {selectedUser.kyc.ktp_url ? (
                    <img src={selectedUser.kyc.ktp_url} alt="KTP" style={{ width: '100%', height: 'auto', objectFit: 'contain' }} />
                  ) : (
                    <div style={{ padding: '2rem', textAlign: 'center', background: '#f9fafb' }}>Tidak ada KTP</div>
                  )}
                </div>
                <div style={{ border: '1px solid #eee', padding: '0.5rem', borderRadius: '4px' }}>
                  <h4 style={{ marginBottom: '0.5rem', textAlign: 'center' }}>Foto Selfie</h4>
                  {selectedUser.kyc.selfie_url ? (
                    <img src={selectedUser.kyc.selfie_url} alt="Selfie" style={{ width: '100%', height: 'auto', objectFit: 'contain' }} />
                  ) : (
                    <div style={{ padding: '2rem', textAlign: 'center', background: '#f9fafb' }}>Tidak ada Selfie</div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <Button variant="outline" type="button" onClick={() => setShowKycModal(false)}>Tutup</Button>
                <Button variant="danger" type="button" onClick={() => handleRejectKyc(selectedUser.kyc!.id)}>
                  Tolak (Reject)
                </Button>
                <Button variant="primary" type="button" onClick={() => handleApproveKyc(selectedUser.kyc!.id)}>
                  Setujui (Approve KYC)
                </Button>
              </div>
            </Card>
          </div>
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
