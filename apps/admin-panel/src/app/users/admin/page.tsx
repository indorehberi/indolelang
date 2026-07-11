'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import { apiFetch } from '../../../lib/api';

interface Staff {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  role: 'superadmin' | 'admin' | 'operator' | 'inspector';
  branch_name: string;
  status: 'active' | 'suspended';
  created_at: string;
}

export default function AdminStaffPage() {
  const router = useRouter();
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('');
  const [branchFilter, setBranchFilter] = useState('');

  React.useEffect(() => {
    const fetchStaff = async () => {
      try {
        const response = await apiFetch('/admin/users?per_page=100');
        const data = await response.json();
        if (response.ok && data.success) {
          const allStaff = data.data.filter((u: any) => ['superadmin', 'admin', 'operator', 'inspector'].includes(u.role));
          setStaffList(allStaff);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStaff();
  }, []);

  const getRoleBadge = (role: Staff['role']) => {
    switch (role) {
      case 'superadmin':
        return <Badge variant="danger">Super Admin</Badge>;
      case 'admin':
        return <Badge variant="info">Admin Cabang</Badge>;
      case 'operator':
        return <Badge variant="info">Operator</Badge>;
      case 'inspector':
        return <Badge variant="warning">Inspector</Badge>;
      default:
        return <Badge variant="default">{role}</Badge>;
    }
  };

  const getStatusBadge = (status: Staff['status']) => {
    return status === 'active' ? (
      <Badge variant="success">Aktif</Badge>
    ) : (
      <Badge variant="danger">Nonaktif</Badge>
    );
  };

  const uniqueBranches = Array.from(new Set(staffList.map((s) => s.branch_name).filter(Boolean)));

  const filteredStaff = staffList.filter((staff) => {
    if (roleFilter && staff.role !== roleFilter) return false;
    if (branchFilter && staff.branch_name !== branchFilter) return false;
    return true;
  });

  return (
    <DashboardLayout breadcrumbParent="Pengguna" breadcrumbCurrent="Admin & Operator">
      <div className="toolbar">
        <div className="toolbar-left">
          <h1 className="page-title">Manajemen Staf Internal</h1>
          <p className="page-subtitle">Daftar akun administrator, admin cabang, dan operator yang memiliki akses administratif platform.</p>
        </div>
        <div className="toolbar-right" style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-outline btn-sm" onClick={() => router.push('/users/admin/roles')}>⚙️ Atur Hak Akses Role</button>
          <button className="btn btn-primary btn-sm" onClick={() => router.push('/users/admin/new')}>+ Tambah Staf Baru</button>
        </div>
      </div>

      <Card className="mb-2">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div>
            <label className="form-label" style={{ fontWeight: '600', fontSize: '0.85rem' }}>Filter Role</label>
            <select
              className="form-select"
              style={{ width: '100%', height: '36px', padding: '0 0.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--wf-border)', background: 'white' }}
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="">Semua Role</option>
              <option value="superadmin">Superadmin</option>
              <option value="admin">Admin Cabang</option>
              <option value="operator">Operator</option>
              <option value="inspector">Inspector</option>
            </select>
          </div>

          <div>
            <label className="form-label" style={{ fontWeight: '600', fontSize: '0.85rem' }}>Filter Cabang</label>
            <select
              className="form-select"
              style={{ width: '100%', height: '36px', padding: '0 0.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--wf-border)', background: 'white' }}
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
            >
              <option value="">Semua Cabang</option>
              {uniqueBranches.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      <Card>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Nama Lengkap</th>
                <th>Kontak & Email</th>
                <th>Tingkat Akses (Role)</th>
                <th>Penugasan Cabang</th>
                <th>Status Akun</th>
                <th>Tanggal Gabung</th>
                <th style={{ textAlign: 'center' }}>Tindakan</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center">Memuat data staf...</td></tr>
              ) : filteredStaff.length === 0 ? (
                <tr><td colSpan={7} className="text-center text-muted">Tidak ada akun staf ditemukan.</td></tr>
              ) : (
                filteredStaff.map((staff) => (
                  <tr key={staff.id}>
                    <td><strong>{staff.full_name}</strong></td>
                    <td>
                      <div>{staff.email}</div>
                      <div className="text-muted" style={{ fontSize: '0.8rem' }}>{staff.phone}</div>
                    </td>
                    <td>{getRoleBadge(staff.role)}</td>
                    <td>{staff.branch_name}</td>
                    <td>{getStatusBadge(staff.status)}</td>
                    <td>{new Date(staff.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                    <td style={{ textAlign: 'center' }}>
                      <div className="d-flex gap-1 justify-content-center">
                        <button className="btn btn-xs btn-outline">Ubah Hak</button>
                        <button className="btn btn-xs btn-danger">Deaktivasi</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </DashboardLayout>
  );
}
