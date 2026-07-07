'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Badge from '../../components/ui/Badge';
import { apiUrl } from '../../lib/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';

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



const getQuickActions = (kycCount: number, assetCount: number) => [
  {
    title: 'Antrian Verifikasi KYC',
    subtitle: `${kycCount} akun menunggu review`,
    href: '/kyc/verification',
    icon: '🔍',
  },
  {
    title: 'Approval Pengajuan Barang',
    subtitle: `${assetCount} item baru dari provider`,
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
  const [statsData, setStatsData] = useState<any>(null);
  const [kycPendingCount, setKycPendingCount] = useState<number>(0);
  const [assetPendingCount, setAssetPendingCount] = useState<number>(0);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);

  // Dynamic Chart States
  const [chartCategory, setChartCategory] = useState<string>('');
  const [chartMetric, setChartMetric] = useState<string>('lots');
  const [chartRange, setChartRange] = useState<string>('week');
  const [chartData, setChartData] = useState<any[]>([]);
  const [chartLoading, setChartLoading] = useState(false);
  const [chartError, setChartError] = useState<string>('');

  const fetchChart = async () => {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
    if (!token || !user) return;
    setChartLoading(true);
    setChartError('');
    try {
      const query = new URLSearchParams({ category: chartCategory, metric: chartMetric, range: chartRange });
      const res = await fetch(apiUrl(`/admin/dashboard/chart?${query.toString()}`), {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setChartData(data.data);
      } else {
        setChartError(data.error?.message || 'Gagal mengambil data chart');
      }
    } catch (err: any) {
      console.error(err);
      setChartError(err.message || 'Terjadi kesalahan jaringan');
    } finally {
      setChartLoading(false);
    }
  };

  useEffect(() => {
    fetchChart();
  }, [chartCategory, chartMetric, chartRange, user]);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');

    if (!token || token === 'undefined' || token === 'null' || !storedUser) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('token');
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

  useEffect(() => {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
    if (!token || !user) return;

    const fetchDashboardStats = async () => {
      try {
        const resStats = await fetch(apiUrl('/admin/dashboard/stats'), {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        const dataStats = await resStats.json();
        if (resStats.ok && dataStats.success) {
          setStatsData(dataStats.data);
        }

        const resKyc = await fetch(apiUrl('/admin/kyc/queue?status=pending&per_page=1'), {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        const dataKyc = await resKyc.json();
        if (resKyc.ok && dataKyc.success) {
          const total = dataKyc.meta?.total ?? dataKyc.data?.length ?? 0;
          setKycPendingCount(total);
        }

        const resAssets = await fetch(apiUrl('/assets?status=pending&per_page=1'), {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        const dataAssets = await resAssets.json();
        if (resAssets.ok && dataAssets.success) {
          const total = dataAssets.meta?.total ?? dataAssets.data?.length ?? 0;
          setAssetPendingCount(total);
        }

        const resInvoices = await fetch(apiUrl('/documents/invoices?per_page=5'), {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        const dataInvoices = await resInvoices.json();
        if (resInvoices.ok && dataInvoices.success) {
          setRecentTransactions(dataInvoices.data);
        }


      } catch (err) {
        console.error('Failed to fetch dashboard stats', err);
      }
    };

    fetchDashboardStats();
  }, [user]);

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

  const kpis: KpiItem[] = useMemo(() => {
    const soldToday = statsData?.lotsSold?.today || 0;
    const soldWeek = statsData?.lotsSold?.week || 0;
    const soldMonth = statsData?.lotsSold?.month || 0;
    const soldTotal = statsData?.lotsSold?.total || 0;

    const incomeToday = statsData?.netIncome?.today || 0;
    const incomeWeek = statsData?.netIncome?.week || 0;
    const incomeMonth = statsData?.netIncome?.month || 0;
    const incomeTotal = statsData?.netIncome?.total || 0;

    return [
      { label: 'Lot Terjual Hari Ini', value: `${soldToday} Unit`, trend: 'Hari ini' },
      { label: 'Lot Terjual Pekan Ini', value: `${soldWeek} Unit`, trend: 'Pekan ini' },
      { label: 'Lot Terjual Bulan Ini', value: `${soldMonth} Unit`, trend: 'Bulan ini', tone: 'gold' },
      { label: 'Terjual Total', value: `${soldTotal} Unit`, trend: 'Keseluruhan', tone: 'gold' },
      
      { label: 'Pendapatan Bersih Hari Ini', value: formatRupiah(incomeToday), trend: 'Hari ini', tone: 'success' },
      { label: 'Pendapatan Bersih Minggu Ini', value: formatRupiah(incomeWeek), trend: 'Pekan ini', tone: 'success' },
      { label: 'Pendapatan Bersih Bulan Ini', value: formatRupiah(incomeMonth), trend: 'Bulan ini', tone: 'success' },
      { label: 'Pendapatan Bersih Total', value: formatRupiah(incomeTotal), trend: 'Keseluruhan', tone: 'success' },
    ];
  }, [statsData]);



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
      kycPendingCount={kycPendingCount}
      assetPendingCount={assetPendingCount}
      hasLiveSession
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
                <h3 className="fw-bold">Belum Ada Sesi Live</h3>
                <p className="text-muted fs-sm">
                  Tidak ada sesi lelang yang sedang berjalan saat ini
                </p>
              </div>
              <Link href="/sessions" className="btn btn-outline">
                Lihat Daftar Sesi
              </Link>
            </div>
          </div>

          {/* Category Chart */}
          <div className="card">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
              <div>Analitik Grafik</div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <select 
                  className="wf-input" 
                  style={{ minWidth: '150px' }}
                  value={chartCategory}
                  onChange={(e) => setChartCategory(e.target.value)}
                >
                  <option value="">Semua Kategori</option>
                  <option value="mobil">Mobil</option>
                  <option value="motor">Motor</option>
                </select>
                <select 
                  className="wf-input" 
                  style={{ minWidth: '150px' }}
                  value={chartMetric}
                  onChange={(e) => setChartMetric(e.target.value)}
                >
                  <option value="lots">Jumlah Lot Terjual</option>
                  <option value="income">Pendapatan Bersih</option>
                </select>
                <select 
                  className="wf-input" 
                  style={{ minWidth: '150px' }}
                  value={chartRange}
                  onChange={(e) => setChartRange(e.target.value)}
                >
                  <option value="week">Minggu Ini (Per Hari)</option>
                  <option value="month">Bulan Ini (Per Tanggal)</option>
                  <option value="year">Tahun Ini (Per Bulan)</option>
                  <option value="all">Semua Tahun</option>
                </select>
                <button onClick={fetchChart} className="wf-btn wf-btn-outline" style={{ padding: '0.5rem 1rem' }} disabled={chartLoading}>
                  {chartLoading ? 'Memuat...' : 'Refresh'}
                </button>
              </div>
            </div>
            <div style={{ padding: '1rem', height: '300px', width: '100%' }}>
              {chartError && <div style={{ color: 'red', marginBottom: '1rem', fontSize: '12px' }}>{chartError}</div>}
              {chartData.length === 0 && !chartLoading && !chartError && <div style={{ color: '#888', textAlign: 'center', marginTop: '2rem' }}>Belum ada data untuk periode ini</div>}
              {chartData.length > 0 && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 40, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f2f6" />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} stroke="#81737f" fontSize={12} dy={10} height={40} />
                  <YAxis 
                    width={70}
                    axisLine={false} 
                    tickLine={false} 
                    stroke="#81737f"
                    fontSize={12}
                    domain={[0, 'auto']}
                    allowDecimals={false}
                    tickFormatter={val => chartMetric === 'income' ? `Rp ${val >= 1000000 ? (val / 1000000) + 'M' : val}` : val} 
                  />
                  <Tooltip 
                    cursor={{ fill: 'transparent' }} 
                    contentStyle={{ borderRadius: '6px', border: '1px solid #E9E6DF' }}
                    formatter={(val: any) => chartMetric === 'income' ? `Rp ${Number(val || 0).toLocaleString('id-ID')}` : val}
                  />
                  <Bar dataKey="value" fill="#f67904" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Quick Actions */}
        <div>
          <div className="card">
            <div className="card-header">Aksi Administratif Cepat</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {getQuickActions(kycPendingCount, assetPendingCount).map((action) => (
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
                  <td>#{transaction.id.substring(0, 8)}</td>
                  <td>{transaction.bidder?.full_name || 'Unknown'}</td>
                  <td>{transaction.lot?.asset?.title || 'Unknown'}</td>
                  <td className="fw-bold">{formatRupiah(transaction.total)}</td>
                  <td>{getStatusBadge(transaction.status === 'paid' ? 'paid' : (transaction.status === 'overdue' ? 'overdue' : 'pending'))}</td>
                  <td>{new Date(transaction.created_at).toLocaleString('id-ID')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
