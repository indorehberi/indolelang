'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';

interface Staff {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'superadmin' | 'admin' | 'operator';
  branch_name: string;
  status: 'active' | 'suspended';
  created_at: string;
}

export default function AdminStaffPage() {
  const router = useRouter();
  const [loading] = useState(false);

  const dummyStaff: Staff[] = [
    {
      id: 'staff-1',
      name: 'Super Admin Indo-Lelang',
      email: 'superadmin@indo-lelang.com',
      phone: '+628111111111',
      role: 'superadmin',
      branch_name: 'Pusat (Headquarters)',
      status: 'active',
      created_at: '2026-06-01T00:00:00.000Z',
    },
    {
      id: 'staff-2',
      name: 'Admin Cabang Jakarta',
      email: 'admin@indo-lelang.com',
      phone: '+628222222222',
      role: 'admin',
      branch_name: 'Indo-Lelang Jakarta',
      status: 'active',
      created_at: '2026-06-15T00:00:00.000Z',
    },
    {
      id: 'staff-3',
      name: 'Andi Operator JKT',
      email: 'operator.jkt@indolelang.com',
      phone: '+628333333333',
      role: 'operator',
      branch_name: 'Indo-Lelang Jakarta',
      status: 'active',
      created_at: '2026-06-20T10:00:00.000Z',
    },
  ];

  const getRoleBadge = (role: Staff['role']) => {
    switch (role) {
      case 'superadmin':
        return <Badge variant="danger">Super Admin</Badge>;
      case 'admin':
        return <Badge variant="info">Admin Cabang</Badge>;
      case 'operator':
        return <Badge variant="info">Operator</Badge>;
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

  return (
    <DashboardLayout breadcrumbParent="Pengguna" breadcrumbCurrent="Admin & Operator">
      <div className="toolbar">
        <div className="toolbar-left">
          <h1 className="page-title">Manajemen Staf Internal</h1>
          <p className="page-subtitle">Daftar akun administrator, admin cabang, dan operator yang memiliki akses administratif platform.</p>
        </div>
        <div className="toolbar-right">
          <button className="btn btn-primary btn-sm" onClick={() => router.push('/users/admin/new')}>+ Tambah Staf Baru</button>
        </div>
      </div>

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
              ) : dummyStaff.length === 0 ? (
                <tr><td colSpan={7} className="text-center text-muted">Tidak ada akun staf ditemukan.</td></tr>
              ) : (
                dummyStaff.map((staff) => (
                  <tr key={staff.id}>
                    <td><strong>{staff.name}</strong></td>
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
