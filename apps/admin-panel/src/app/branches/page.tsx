'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
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

  const dummyBranches: Branch[] = [
    {
      id: 'br-1',
      tenant_id: 'default',
      name: 'Indo-Lelang Jakarta',
      city: 'Jakarta',
      address: 'Jl. Jendral Sudirman No. 21, Jakarta Selatan',
      phone: '+622155551234',
      pic_name: 'Budi Santoso',
      is_active: true,
    },
    {
      id: 'br-2',
      tenant_id: 'default',
      name: 'Indo-Lelang Surabaya',
      city: 'Surabaya',
      address: 'Jl. Basuki Rahmat No. 45, Genteng, Surabaya',
      phone: '+623155556789',
      pic_name: 'Siti Rahma',
      is_active: true,
    },
  ];

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
        setBranches(dummyBranches);
      }
    } catch (e) {
      setBranches(dummyBranches);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  return (
    <DashboardLayout breadcrumbParent="Pengaturan" breadcrumbCurrent="Manajemen Cabang">
      <div className="toolbar">
        <div className="toolbar-left">
          <h1 className="page-title">Manajemen Kantor Cabang</h1>
          <p className="page-subtitle">Daftar lokasi fisik kantor operasional dan titik penyerahan/pengambilan unit lelang.</p>
        </div>
        <div className="toolbar-right">
          <button className="btn btn-primary btn-sm">+ Tambah Cabang</button>
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
                        <button className="btn btn-xs btn-outline">Ubah</button>
                        <button className="btn btn-xs btn-danger">Tutup</button>
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
