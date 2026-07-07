'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { apiUrl } from '../../lib/api';

type BadgeTone = 'danger' | 'gold' | 'success';

interface SidebarProps {
  role?: string;
  kycPendingCount?: number;
  assetPendingCount?: number;
  hasLiveSession?: boolean;
}

interface NavItem {
  href: string;
  icon: string;
  iconColor?: string;
  label: string;
  badge?: string | number;
  badgeTone?: BadgeTone;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  role = 'Superadmin',
  kycPendingCount,
  assetPendingCount,
  hasLiveSession,
}) => {
  const pathname = usePathname();
  const router = typeof window !== 'undefined' ? require('next/navigation').useRouter() : null;

  const [kycCount, setKycCount] = useState<number>(0);
  const [assetCount, setAssetCount] = useState<number>(0);
  const [liveSession, setLiveSession] = useState<boolean>(false);
  const [showAnalytics, setShowAnalytics] = useState<boolean>(true);
  const [showAuditTrail, setShowAuditTrail] = useState<boolean>(true);

  useEffect(() => {
    if (kycPendingCount !== undefined) {
      setKycCount(kycPendingCount);
    }
    if (assetPendingCount !== undefined) {
      setAssetCount(assetPendingCount);
    }
    if (hasLiveSession !== undefined) {
      setLiveSession(hasLiveSession);
    }
  }, [kycPendingCount, assetPendingCount, hasLiveSession]);

  useEffect(() => {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
    if (!token) return;

    const fetchCounts = async () => {
      try {
        if (kycPendingCount === undefined) {
          const res = await fetch(apiUrl('/admin/kyc/queue?status=pending&per_page=1'), {
            headers: { Authorization: `Bearer ${token}` }
          });
          const data = await res.json();
          if (res.ok && data.success) {
            setKycCount(data.meta?.total ?? data.data?.length ?? 0);
          }
        }

        if (assetPendingCount === undefined) {
          const res = await fetch(apiUrl('/assets?status=pending&per_page=1'), {
            headers: { Authorization: `Bearer ${token}` }
          });
          const data = await res.json();
          if (res.ok && data.success) {
            setAssetCount(data.meta?.total ?? data.data?.length ?? 0);
          }
        }

        if (hasLiveSession === undefined) {
          const res = await fetch(apiUrl('/sessions?status=live&per_page=1'), {
            headers: { Authorization: `Bearer ${token}` }
          });
          const data = await res.json();
          if (res.ok && data.success) {
            setLiveSession((data.meta?.total ?? data.data?.length ?? 0) > 0);
          }
        }
      } catch (e) {
        console.error('Sidebar failed to fetch counts', e);
      }
    };

    const fetchSettings = async () => {
      try {
        const cookieMap: Record<string, string> = {};
        if (typeof document !== 'undefined') {
          document.cookie.split(';').forEach((c) => {
            const parts = c.trim().split('=');
            if (parts[0]) cookieMap[parts[0]] = parts[1] || '';
          });
        }
        if (cookieMap['feat_analytics_dashboard'] === 'false') {
          setShowAnalytics(false);
        }
        if (cookieMap['feat_audit_trail'] === 'false') {
          setShowAuditTrail(false);
        }

        const res = await fetch(apiUrl('/admin/settings'), {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok && data.success) {
          const toggle = data.data.find((item: any) => item.key === 'feat_analytics_dashboard');
          if (toggle) {
            const val = cookieMap['feat_analytics_dashboard'] || toggle.value;
            setShowAnalytics(val === 'true');
          }
          const auditToggle = data.data.find((item: any) => item.key === 'feat_audit_trail');
          if (auditToggle) {
            const val = cookieMap['feat_audit_trail'] || auditToggle.value;
            setShowAuditTrail(val === 'true');
          }
        }
      } catch (e) {
        console.error('Sidebar failed to fetch settings', e);
      }
    };

    fetchCounts();
    fetchSettings();
  }, [kycPendingCount, assetPendingCount, hasLiveSession]);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('refreshToken');
    window.location.href = '/login';
  };

  const isRouteActive = (route: string) => {
    if (route === '/dashboard') {
      return pathname === '/' || pathname === route;
    }
    
    if (route === '/assets' && pathname.startsWith('/assets/approval')) {
      return false;
    }

    return pathname === route || pathname.startsWith(`${route}/`);
  };

  const sections: NavSection[] = [
    {
      title: 'Main',
      items: [
        { href: '/dashboard', icon: 'dashboard', iconColor: '#3b82f6', label: 'Dashboard' }
      ],
    },
    {
      title: 'Pengguna',
      items: [
        { href: '/users/bidder', icon: 'person', iconColor: '#10b981', label: 'Bidder' },
        { href: '/users/provider', icon: 'storefront', iconColor: '#a855f7', label: 'Provider' },
        {
          href: '/kyc/verification',
          icon: 'verified_user',
          iconColor: '#14b8a6',
          label: 'Verifikasi KYC',
          badge: kycCount,
          badgeTone: 'danger',
        },
        { href: '/pesan', icon: 'mail', iconColor: '#3b82f6', label: 'Pesan Masuk' },
        { href: '/users/admin', icon: 'admin_panel_settings', iconColor: '#f59e0b', label: 'Admin & Operator' },
      ],
    },
    {
      title: 'Katalog',
      items: [
        { href: '/assets', icon: 'inventory_2', iconColor: '#6366f1', label: 'Daftar Barang' },
        {
          href: '/assets/approval',
          icon: 'task_alt',
          iconColor: '#f97316',
          label: 'Approved Barang',
          badge: assetCount,
          badgeTone: 'gold',
        },
      ],
    },
    {
      title: 'Lelang',
      items: [
        { href: '/sessions', icon: 'gavel', iconColor: '#f97316', label: 'Daftar Sesi' },
        { href: '/lots/planning', icon: 'package_2', iconColor: '#8b5cf6', label: 'Penyusunan Lot' },
        {
          href: '/auction/control-room',
          icon: 'settings_input_component',
          iconColor: '#ef4444',
          label: 'Ruang Kontrol',
          badge: liveSession ? 'LIVE' : undefined,
          badgeTone: 'success',
        },
        { href: '/auction/results', icon: 'fact_check', iconColor: '#10b981', label: 'Hasil Sesi' },
      ],
    },
    {
      title: 'Keuangan',
      items: [
        { href: '/finance/deposits', icon: 'account_balance_wallet', iconColor: '#10b981', label: 'Deposit' },
        { href: '/finance/invoices', icon: 'payments', iconColor: '#34d399', label: 'Pelunasan' },
        { href: '/finance/settlements', icon: 'paid', iconColor: '#059669', label: 'Pencairan' },
        { href: '/finance/refunds', icon: 'currency_exchange', iconColor: '#f59e0b', label: 'Refund' },
      ],
    },
    {
      title: 'Laporan',
      items: [
        showAnalytics && { href: '/analytics', icon: 'analytics', iconColor: '#3b82f6', label: 'Dashboard Analitik' },
        { href: '/reports/sessions', icon: 'assessment', iconColor: '#8b5cf6', label: 'Laporan Sesi' },
        { href: '/reports/finance', icon: 'monitoring', iconColor: '#10b981', label: 'Laporan Keuangan' },
        { href: '/reports/builder', icon: 'description', iconColor: '#f43f5e', label: 'Report Builder' },
        { href: '/campaigns', icon: 'campaign', iconColor: '#ec4899', label: 'Campaign' },
        { href: '/referral', icon: 'share', iconColor: '#06b6d4', label: 'Program Referral' },
      ].filter(Boolean) as NavItem[],
    },
    {
      title: 'Konten Publik',
      items: [
        { href: '/blog', icon: 'article', iconColor: '#6366f1', label: 'Blog & Artikel' },
        { href: '/testimoni', icon: 'reviews', iconColor: '#f59e0b', label: 'Testimoni' },
      ],
    },
    {
      title: 'Pengaturan',
      items: [
        { href: '/settings/platform', icon: 'settings', iconColor: '#6b7280', label: 'Pengaturan Platform' },
        { href: '/branches', icon: 'apartment', iconColor: '#3b82f6', label: 'Manajemen Cabang' },
        showAuditTrail && { href: '/settings/audit-trail', icon: 'history', iconColor: '#f59e0b', label: 'Audit Trail' },
      ].filter(Boolean) as NavItem[],
    },
  ];

  return (
    <aside className="sidebar" aria-label="Navigasi admin">
      <Link href="/dashboard" className="sidebar-logo" aria-label="Buka dashboard admin">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo-bidku.png?v=2"
          alt="Bidku"
          className="sidebar-logo-image"
        />
      </Link>
      <div className="sidebar-role">{role} Panel</div>

      <nav className="sidebar-nav">
        {sections.map((section) => (
          <div className="nav-group" key={section.title}>
            <div className="nav-section">{section.title}</div>
            {section.items.map((item) => {
              const active = isRouteActive(item.href);
              const badgeClass =
                item.badgeTone === 'gold'
                  ? 'badge-gold'
                  : item.badgeTone === 'success'
                    ? 'badge-success-nav'
                    : 'badge-nav';

              return (
                <Link
                  href={item.href}
                  className={`nav-item ${active ? 'active' : ''}`}
                  aria-current={active ? 'page' : undefined}
                  key={`${section.title}-${item.href}`}
                >
                  <span 
                    className="material-symbols-outlined nav-icon" 
                    style={{ color: item.iconColor }}
                    aria-hidden="true"
                  >
                    {item.icon}
                  </span>
                  <span className="nav-label">{item.label}</span>
                  {item.badge !== undefined && item.badge !== 0 && (
                    <span className={badgeClass}>{item.badge}</span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div style={{ borderTop: '1px solid #1e293b', marginTop: 'auto', paddingTop: '0.75rem', paddingBottom: '0.75rem' }}>
        <button
          onClick={handleLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            margin: '0 0.75rem',
            width: 'calc(100% - 1.5rem)',
            padding: '0.625rem 1rem',
            borderRadius: '0.75rem',
            fontSize: '0.875rem',
            fontWeight: 700,
            color: '#ffffff',
            backgroundColor: '#ef4444',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.15s',
            boxShadow: '0 4px 6px -1px rgba(239, 68, 68, 0.2), 0 2px 4px -1px rgba(239, 68, 68, 0.1)'
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#ef4444'}
        >
          <span className="material-symbols-outlined nav-icon" style={{ color: '#ffffff', fontSize: '1.25rem' }}>logout</span>
          <span className="nav-label">Keluar Akun</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
