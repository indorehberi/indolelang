'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import { apiFetch, apiUrl } from '../../../lib/api';

interface User {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  role: string;
  status: string;
  company_name?: string;
  npwp?: string;
  provider_status?: string;
  provider_fee_type?: string;
  provider_fee_amount?: number | string;
  pmk41_paid_by_provider?: boolean;
  created_at: string;
}

export default function ProviderUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [providerStatusFilter, setProviderStatusFilter] = useState<string>('all');

  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    company_name: '',
    npwp: '',
    provider_fee_type: 'percentage',
    provider_fee_amount: '0',
    pmk41_paid_by_provider: false,
  });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      let url = '/admin/users?per_page=200';
      if (providerStatusFilter === 'approved') {
        url += '&role=provider';
      } else if (providerStatusFilter === 'pending') {
        url += '&provider_status=pending';
      }

      const response = await apiFetch(url);
      const resData = await response.json();
      if (response.ok && resData.success) {
        let list = resData.data || [];
        if (providerStatusFilter === 'all') {
          list = list.filter((u: any) => u.role === 'provider' || u.provider_status === 'pending' || u.provider_status === 'rejected');
        }
        setUsers(list);
      } else {
        setUsers([]);
      }
    } catch (err) {
      console.error('Failed to load users', err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [providerStatusFilter]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchUsers();
  }, [fetchUsers]);

  const handleProcessUpgrade = async (userId: string, action: 'approved' | 'rejected') => {
    let rejection_reason = '';
    if (action === 'rejected') {
      const reason = window.prompt('Masukkan alasan penolakan upgrade provider:');
      if (reason === null) return; // User cancelled
      if (!reason.trim()) {
        alert('Alasan penolakan tidak boleh kosong.');
        return;
      }
      rejection_reason = reason;
    } else {
      const confirmation = window.confirm(
        `Apakah Anda yakin ingin menyetujui pengajuan upgrade provider ini?`
      );
      if (!confirmation) return;
    }

    try {
      const response = await apiFetch(`/admin/users/${userId}/provider-status`, {
        method: 'PUT',
        body: JSON.stringify({ status: action, rejection_reason }),
      });

      const resData = await response.json();
      if (response.ok && resData.success) {
        alert(`Pengajuan upgrade provider berhasil ${action === 'approved' ? 'disetujui' : 'ditolak'}.`);
        fetchUsers();
      } else {
        alert(resData.error?.message || 'Gagal memproses tindakan.');
      }
    } catch (err) {
      console.error(err);
      alert('Koneksi gagal. Pastikan API server aktif.');
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
          company_name: formData.company_name,
          npwp: formData.npwp,
          provider_fee_type: formData.provider_fee_type,
          provider_fee_amount: Number(formData.provider_fee_amount),
          pmk41_paid_by_provider: formData.pmk41_paid_by_provider,
        }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setShowEditModal(false);
        fetchUsers();
      } else {
        alert(data.error?.message || 'Gagal mengubah provider');
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
      if (response.ok) {
        setShowDeleteModal(false);
        fetchUsers();
      } else {
        const data = await response.json();
        alert(data.error?.message || 'Gagal menghapus provider');
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan sistem');
    }
  };

  const handleApproveProvider = async () => {
    if (!selectedUser) return;
    if (!window.confirm('Apakah Anda yakin ingin menyetujui provider ini?')) return;
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(apiUrl(`/admin/users/${selectedUser.id}`), {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ provider_status: 'approved', status: 'active' })
      });
      if (response.ok) {
        setShowViewModal(false);
        fetchUsers();
      } else {
        const data = await response.json();
        alert(data.error?.message || 'Gagal menyetujui provider');
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan sistem');
    }
  };

  const handleRejectProvider = async () => {
    if (!selectedUser) return;
    if (!window.confirm('Apakah Anda yakin ingin menolak provider ini?')) return;
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(apiUrl(`/admin/users/${selectedUser.id}`), {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ provider_status: 'rejected' })
      });
      if (response.ok) {
        setShowViewModal(false);
        fetchUsers();
      } else {
        const data = await response.json();
        alert(data.error?.message || 'Gagal menolak provider');
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan sistem');
    }
  };

  return (
    <DashboardLayout breadcrumbParent="Pengguna" breadcrumbCurrent="Mitra Provider">
      <div className="toolbar">
        <div className="toolbar-left">
          <h1 className="page-title">Manajemen Mitra Provider Aset</h1>
          <p className="page-subtitle">Daftar mitra penyedia aset/barang titipan yang terdaftar di platform Indo-Lelang.</p>
        </div>
        <div className="toolbar-right" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <select
            className="search-box"
            value={providerStatusFilter}
            onChange={(e) => setProviderStatusFilter(e.target.value)}
            style={{ padding: '0.45rem 0.75rem', borderRadius: 'var(--radius)', border: '1px solid var(--wf-border)', background: 'white' }}
          >
            <option value="all">Semua Status</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
          </select>

          <Button variant="primary" size="sm" onClick={() => router.push('/users/provider/new')}>
            + Tambah Provider
          </Button>
        </div>
      </div>

      <Card>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Nama Perwakilan</th>
                <th>Nama Perusahaan</th>
                <th>Kontak &amp; Email</th>
                <th>NPWP</th>
                <th>Status</th>
                <th>Tanggal Daftar</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-6">Memuat data provider...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-6 text-muted">Tidak ada provider ditemukan.</td></tr>
              ) : (
                users.map((prov) => {
                  const isPending = prov.provider_status === 'pending';
                  const isRejected = prov.provider_status === 'rejected';

                  return (
                    <tr key={prov.id}>
                      <td><strong>{prov.full_name}</strong></td>
                      <td>{prov.company_name || '-'}</td>
                      <td>
                        <div>{prov.email}</div>
                        <div className="text-muted" style={{ fontSize: '0.8rem' }}>{prov.phone || '-'}</div>
                      </td>
                      <td><code style={{ fontSize: '0.85rem' }}>{prov.npwp || '-'}</code></td>
                      <td>
                        {isPending ? (
                          <Badge variant="warning">Pending Upgrade</Badge>
                        ) : isRejected ? (
                          <Badge variant="danger">Upgrade Ditolak</Badge>
                        ) : (
                          <Badge variant={prov.status === 'suspended' ? 'danger' : 'success'}>
                            {prov.status === 'suspended' ? 'Suspended' : 'Aktif'}
                          </Badge>
                        )}
                      </td>
                      <td>{new Date(prov.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                      <td>
                        <div className="d-flex gap-1">
                          <Button variant="outline" size="sm" onClick={() => {
                            setSelectedUser(prov);
                            setShowViewModal(true);
                          }}>
                            View
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => {
                            setSelectedUser(prov);
                            setFormData({
                              full_name: prov.full_name,
                              email: prov.email,
                              phone: prov.phone || '',
                              password: '',
                              company_name: prov.company_name || '',
                              npwp: prov.npwp || '',
                              provider_fee_type: prov.provider_fee_type || 'percentage',
                              provider_fee_amount: String(prov.provider_fee_amount || '0'),
                              pmk41_paid_by_provider: prov.pmk41_paid_by_provider || false,
                            });
                            setShowEditModal(true);
                          }}>
                            Edit
                          </Button>
                          <Button variant="danger" size="sm" onClick={() => {
                            setSelectedUser(prov);
                            setShowDeleteModal(true);
                          }}>
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* VIEW MODAL */}
      {showViewModal && selectedUser && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '2rem' }}>
          <div style={{ maxWidth: '600px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <Card>
              <h3 style={{ marginBottom: '1rem' }}>Peninjauan Provider</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <strong>Nama Perwakilan:</strong><br/>{selectedUser.full_name}
                </div>
                <div>
                  <strong>Email:</strong><br/>{selectedUser.email}
                </div>
                <div>
                  <strong>Nama Perusahaan:</strong><br/>{selectedUser.company_name}
                </div>
                <div>
                  <strong>NPWP:</strong><br/>{selectedUser.npwp}
                </div>
                <div>
                  <strong>Fee Type:</strong><br/>{selectedUser.provider_fee_type === 'percentage' ? 'Persentase (%)' : 'Nominal Tetap (Rp)'}
                </div>
                <div>
                  <strong>Fee Amount:</strong><br/>{selectedUser.provider_fee_amount}
                </div>
                <div>
                  <strong>Status:</strong><br/>{selectedUser.provider_status}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <Button variant="outline" type="button" onClick={() => setShowViewModal(false)}>Tutup</Button>
                {selectedUser.provider_status === 'pending' && (
                  <>
                    <Button variant="danger" type="button" onClick={handleRejectProvider}>
                      Tolak (Reject)
                    </Button>
                    <Button variant="primary" type="button" onClick={handleApproveProvider}>
                      Setujui (Approve Provider)
                    </Button>
                  </>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {showEditModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <Card>
            <h3 style={{ marginBottom: '1rem' }}>Edit Provider</h3>
            <form onSubmit={handleEdit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Nama Perwakilan</label>
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
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Nama Perusahaan</label>
                <input required type="text" value={formData.company_name} onChange={(e) => setFormData({...formData, company_name: e.target.value})} style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }} />
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>NPWP</label>
                <input required type="text" value={formData.npwp} onChange={(e) => setFormData({...formData, npwp: e.target.value})} style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }} />
              </div>

              <hr style={{margin: '1rem 0', borderColor: '#eee'}} />
              <h4 style={{marginBottom: '0.5rem'}}>Pengaturan Biaya & Pajak</h4>
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem' }}>Tipe Biaya (Fee)</label>
                  <select value={formData.provider_fee_type} onChange={(e) => setFormData({...formData, provider_fee_type: e.target.value})} style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}>
                    <option value="percentage">Persentase (%)</option>
                    <option value="flat">Nominal Tetap (Rp)</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem' }}>Nilai Biaya</label>
                  <input type="number" value={formData.provider_fee_amount} onChange={(e) => setFormData({...formData, provider_fee_amount: e.target.value})} style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }} />
                </div>
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={formData.pmk41_paid_by_provider} onChange={(e) => setFormData({...formData, pmk41_paid_by_provider: e.target.checked})} />
                  <span>Pajak PMK-41 Ditanggung oleh Provider</span>
                </label>
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
            <h3 style={{ marginBottom: '1rem', color: 'var(--color-danger)' }}>Hapus Provider</h3>
            <p style={{ marginBottom: '1.5rem' }}>
              Apakah Anda yakin ingin menghapus <strong>{selectedUser?.company_name || selectedUser?.full_name}</strong>? Tindakan ini akan menonaktifkan pengguna.
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
