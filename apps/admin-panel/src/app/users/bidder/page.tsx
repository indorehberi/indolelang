'use client';

import React, { useEffect, useState } from 'react';
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

  // Initialize with seed-matching dummy data for preview
  const dummyBidders: User[] = [
    {
      id: '1',
      full_name: 'Budi Raharjo',
      email: 'budi.raharjo@gmail.com',
      phone: '+628123456789',
      status: 'active',
      created_at: '2026-06-20',
    },
    {
      id: '2',
      full_name: 'Dewi Lestari',
      email: 'dewi.lestari@yahoo.co.id',
      phone: '+628789012345',
      status: 'pending',
      created_at: '2026-06-22',
    },
    {
      id: '3',
      full_name: 'Andi Wijaya',
      email: 'andi.wijaya@outlook.com',
      phone: '+628567890123',
      status: 'suspended',
      created_at: '2026-06-15',
    },
  ];

  useEffect(() => {
    // Fetch from backend
    const fetchBidders = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const response = await fetch(apiUrl('/admin/users?role=bidder'), {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await response.json();
        if (response.ok && data.success) {
          setBidders(data.data);
        } else {
          setBidders(dummyBidders);
        }
      } catch (err) {
        setBidders(dummyBidders);
      } finally {
        setLoading(false);
      }
    };

    fetchBidders();
  }, []);

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

  return (
    <DashboardLayout breadcrumbParent="Pengguna" breadcrumbCurrent="Bidder">
      <div className="toolbar">
        <div className="toolbar-left">
          <h1 className="page-title">Daftar Bidder</h1>
        </div>
        <div className="toolbar-right">
          <input type="text" placeholder="Cari bidder..." className="search-box" />
          <Button variant="primary" size="sm">
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
                <th>Status</th>
                <th>Tanggal Daftar</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center">
                    Memuat data...
                  </td>
                </tr>
              ) : bidders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center">
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
                    <td>{getStatusBadge(bidder.status)}</td>
                    <td>{bidder.created_at.split('T')[0]}</td>
                    <td>
                      <div className="d-flex gap-1">
                        <Button variant="outline" size="sm" onClick={() => router.push(`/users/${bidder.id}`)}
                        >
                          Detail
                        </Button>
                        <Button variant="danger" size="sm">
                          Suspend
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
    </DashboardLayout>
  );
}
