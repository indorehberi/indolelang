'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Badge from '../../components/ui/Badge';

interface AdminUser {
  full_name?: string;
  name?: string;
  email?: string;
  role?: string;
}

interface KpiItem {
  label: string;
  value: string;
  trend: string;
  tone?: 'gold' | 'success' | 'danger';
  href?: string;
}

interface CategoryStat {
  label: string;
  value: number;
  y: number;
  height: number;
  color: string;
}

interface RecentTransaction {
  id: string;
  bidder: string;
  lot: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  time: string;
}

const categoryStats: CategoryStat[] = [
  { label: 'Mobil', value: 245, y: 69, height: 51, color: 'var(--wf-primary)' },
  { label: 'Motor', value: 480, y: 20, height: 100, color: 'var(--wf-gold)' },
  { label: 'Alat Berat', value: 32, y: 113, height: 7, color: 'var(--wf-primary)' },
  { label: 'Properti', value: 12, y: 117, height: 3, color: 'var(--wf-primary)' },
];

const recentTransactions: RecentTransaction[] = [
  {
    id: 'AL-99231',
    bidder: 'Budi Santoso',
    lot: 'Toyota Avanza 2021',
    amount: 145000000,
    status: 'paid',
    time: '10:45 WIB',
  },
  {
    id: 'AL-99230',
    bidder: 'Siska Wijaya',
    lot: 'Honda Vario 150',
    amount: 18500000,
    status: 'pending',
    time: '10:42 WIB',
  },
  {
    id: 'AL-99229',
    bidder: 'Ahmad Pratama',
    lot: 'Komatsu Excavator PC200',
    amount: 650000000,
    status: 'paid',
    time: '10:30 WIB',
  },
];

const quickActions = [
  {
    title: 'Antrian Verifikasi KYC',
    subtitle: '14 akun menunggu review manual',
    href: '/kyc/verification',
    icon: '🔍',
  },
  {
    title: 'Approval Pengajuan Barang',
    subtitle: '15 item baru dari provider',
    href: '/assets/approval',
    icon: '✔️',
  },
  {
    title: 'Penyusunan Lot Baru',
    subtitle: 'Siapkan batch lelang berikutnya',
    href: '/lots/planning',
    icon: '📦',
  },
];

const formatRupiah = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value);
};

const getStatusBadge = (status: RecentTransaction['status']) => {
  if (status === 'paid') return <Badge variant="success">Lunas</Badge>;
  if (status === 'overdue') return <Badge variant="danger">Overdue</Badge>;
  return <Badge variant="warning">Pending</Badge>;
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');

    if (!token || !storedUser) {
      router.replace('/login');
      return;
    }

    try {
      setUser(JSON.parse(storedUser) as AdminUser);
    } catch {
      localStorage.removeItem('user');
      router.replace('/login');
      return;
    }

    setIsCheckingSession(false);
  }, [router]);

  const displayName = useMemo(() => {
    return user?.full_name || user?.name || user?.email || 'Admin';
  }, [user]);

  const userInitial = useMemo(() => {
    return displayName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('');
  }, [displayName]);

  const kpis: KpiItem[] = [
    {
      label: 'Transaksi Hari Ini',
      value: formatRupiah(847500000),
      trend: '↑ 12.3% dari kemarin',
    },
    {
      label: 'Lot Terjual',
      value: '127 Unit',
      trend: '↑ 8.5% dari bulan lalu',
      tone: 'gold',
    },
    {
      label: 'Pendapatan Komisi',
      value: formatRupiah(34200000),
      trend: '↑ 15.2%',
      tone: 'success',
    },
    {
      label: 'Verifikasi KYC Tertunda',
      value: '14 Akun',
      trend: 'Butuh Approval',
      tone: 'danger',
    },
  ];

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.replace('/login');
  };

  if (isCheckingSession || !user) {
    return (
      <div className="dashboard-loading" role="status">
        <span className="loading-mark" aria-hidden="true" />
        <span>Memuat dashboard admin...</span>
      </div>
    );
  }

  return (
    <DashboardLayout
      breadcrumbParent="Menu"
      breadcrumbCurrent="Dashboard"
      userName={displayName}
      userInitial={userInitial}
      role={user.role || 'Superadmin'}
      kycPendingCount={14}
      assetPendingCount={15}
      hasLiveSession
      onLogout={handleLogout}
    >
      <h1 className="page-title">Dashboard</h1>
      <p className="page-subtitle">Panel Area admin &bull; Platform Indo-Lelang</p>

      {/* KPI Cards Grid */}
      <div className="kpi-grid">
        {kpis.map((item) => (
          <div className={`kpi-card ${item.tone || ''}`} key={item.label}>
            <div className="kpi-label">{item.label}</div>
            <div className="kpi-value">{item.value}</div>
            <div className={`kpi-trend ${item.tone === 'danger' ? 'down' : 'up'}`}>
              {item.trend}
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid: Chart Section (2fr) + Quick Actions (1fr) */}
      <div className="grid-2-1">
        {/* Left Column: Live Session + Chart */}
        <div>
          {/* Live Session Card */}
          <div className="card">
            <div className="card-header">
              Sesi Lelang Aktif <Badge variant="danger">LIVE</Badge>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 className="fw-bold">Sesi Mobil Penumpang JKT - Batch 15</h3>
                <p className="text-muted fs-sm">
                  45 peserta online &bull; Lot berjalan: 12 dari 45
                </p>
              </div>
              <Link href="/auction/control-room" className="btn btn-gold">
                Buka Ruang Kontrol
              </Link>
            </div>
          </div>

          {/* Category Chart */}
          <div className="card">
            <div className="card-header">Lelang Berdasarkan Kategori (Unit Terjual)</div>
            <div style={{ padding: '1rem 0' }}>
              <svg
                viewBox="0 0 400 160"
                style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}
              >
                {/* Grid Lines */}
                <line x1="50" y1="20" x2="380" y2="20" stroke="#f1f2f6" strokeWidth="1" />
                <line x1="50" y1="70" x2="380" y2="70" stroke="#f1f2f6" strokeWidth="1" />
                <line x1="50" y1="120" x2="380" y2="120" stroke="#dcdde1" strokeWidth="1" />

                {/* Bars */}
                {categoryStats.map((item, index) => {
                  const xPositions = [90, 170, 250, 330];
                  const x = xPositions[index];
                  const textY = item.y < 60 ? item.y - 8 : item.y + 15;

                  return (
                    <g key={item.label}>
                      <rect
                        x={x}
                        y={item.y}
                        width="30"
                        height={item.height}
                        rx="3"
                        fill={item.color}
                      />
                      <text
                        x={x + 15}
                        y={textY}
                        fill="var(--wf-text)"
                        fontSize="9"
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        {item.value}
                      </text>
                      <text
                        x={x + 15}
                        y="138"
                        fill="var(--wf-text-muted)"
                        fontSize="9"
                        textAnchor="middle"
                      >
                        {item.label}
                      </text>
                    </g>
                  );
                })}

                {/* Y-axis Labels */}
                <text x="45" y="23" fill="var(--wf-text-muted)" fontSize="8" textAnchor="end">
                  500
                </text>
                <text x="45" y="73" fill="var(--wf-text-muted)" fontSize="8" textAnchor="end">
                  250
                </text>
                <text x="45" y="123" fill="var(--wf-text-muted)" fontSize="8" textAnchor="end">
                  0
                </text>
              </svg>
            </div>
          </div>
        </div>

        {/* Right Column: Quick Actions */}
        <div>
          <div className="card">
            <div className="card-header">Aksi Administratif Cepat</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {quickActions.map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="btn btn-outline"
                  style={{ justifyContent: 'center' }}
                >
                  {action.icon} {action.title}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div className="card">
        <div className="card-header">History Transaksi Terbaru</div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Bidder</th>
                <th>Lot</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Waktu</th>
              </tr>
            </thead>
            <tbody>
              {recentTransactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td>#{transaction.id}</td>
                  <td>{transaction.bidder}</td>
                  <td>{transaction.lot}</td>
                  <td className="fw-bold">{formatRupiah(transaction.amount)}</td>
                  <td>{getStatusBadge(transaction.status)}</td>
                  <td>{transaction.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
