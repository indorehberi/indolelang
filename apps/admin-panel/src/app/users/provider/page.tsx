'use client';

import React, { useState } from 'react';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';

interface Provider {
  id: string;
  name: string;
  company_name: string;
  email: string;
  phone: string;
  npwp: string;
  assets_count: number;
  status: 'pending' | 'active' | 'suspended';
  created_at: string;
}

export default function ProviderUsersPage() {
  const [loading] = useState(false);
  
  const dummyProviders: Provider[] = [
    {
      id: 'prov-1',
      name: 'Budi Hartono',
      company_name: 'PT Djarum Finance',
      email: 'budi.h@djarumfinance.co.id',
      phone: '+628111222333',
      npwp: '01.234.567.8-012.000',
      assets_count: 24,
      status: 'active',
      created_at: '2026-05-10T08:30:00.000Z',
    },
    {
      id: 'prov-2',
      name: 'Rian Adiputra',
      company_name: 'Adira Finance Corp',
      email: 'rian.adi@adira.co.id',
      phone: '+628123456789',
      npwp: '02.456.789.0-123.000',
      assets_count: 42,
      status: 'active',
      created_at: '2026-05-15T09:00:00.000Z',
    },
    {
      id: 'prov-3',
      name: 'Santi Wijaya',
      company_name: 'PT Wijaya Asset Mandiri',
      email: 'santi@wijayaasset.com',
      phone: '+62899888777',
      npwp: '03.789.123.4-567.000',
      assets_count: 8,
      status: 'pending',
      created_at: '2026-06-20T14:20:00.000Z',
    },
  ];

  const getStatusBadge = (status: Provider['status']) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">Aktif</Badge>;
      case 'pending':
        return <Badge variant="warning">Menunggu Review</Badge>;
      case 'suspended':
        return <Badge variant="danger">Ditangguhkan</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  return (
    <DashboardLayout breadcrumbParent="Pengguna" breadcrumbCurrent="Mitra Provider">
      <div className="toolbar">
        <div className="toolbar-left">
          <h1 className="page-title">Manajemen Mitra Provider Aset</h1>
          <p className="page-subtitle">Daftar mitra penyedia aset/barang titipan yang terdaftar di platform Indo-Lelang.</p>
        </div>
        <div className="toolbar-right">
          <button className="btn btn-primary btn-sm">+ Tambah Provider</button>
        </div>
      </div>

      <Card>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Nama Perwakilan</th>
                <th>Nama Perusahaan</th>
                <th>Kontak & Email</th>
                <th>NPWP</th>
                <th style={{ textAlign: 'center' }}>Jumlah Unit</th>
                <th>Status</th>
                <th>Terdaftar Sejak</th>
                <th style={{ textAlign: 'center' }}>Tindakan</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center">Memuat data provider...</td></tr>
              ) : dummyProviders.length === 0 ? (
                <tr><td colSpan={8} className="text-center text-muted">Tidak ada provider ditemukan.</td></tr>
              ) : (
                dummyProviders.map((prov) => (
                  <tr key={prov.id}>
                    <td><strong>{prov.name}</strong></td>
                    <td>{prov.company_name}</td>
                    <td>
                      <div>{prov.email}</div>
                      <div className="text-muted" style={{ fontSize: '0.8rem' }}>{prov.phone}</div>
                    </td>
                    <td><code style={{ fontSize: '0.85rem' }}>{prov.npwp}</code></td>
                    <td style={{ textAlign: 'center' }}><strong className="text-primary">{prov.assets_count} unit</strong></td>
                    <td>{getStatusBadge(prov.status)}</td>
                    <td>{new Date(prov.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                    <td style={{ textAlign: 'center' }}>
                      <div className="d-flex gap-1 justify-content-center">
                        <button className="btn btn-xs btn-outline">Lihat Aset</button>
                        <button className="btn btn-xs btn-danger">Suspend</button>
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
