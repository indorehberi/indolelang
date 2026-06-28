'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

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
  kycPendingCount = 14,
  assetPendingCount = 15,
  hasLiveSession = true,
}) => {
  const pathname = usePathname();

  const isRouteActive = (route: string) => {
    if (route === '/dashboard') {
      return pathname === '/' || pathname === route;
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
          badge: kycPendingCount,
          badgeTone: 'danger',
        },
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
          label: 'Approval Barang',
          badge: assetPendingCount,
          badgeTone: 'gold',
        },
        { href: '/lots/planning', icon: 'package_2', iconColor: '#8b5cf6', label: 'Penyusunan Lot' },
      ],
    },
    {
      title: 'Lelang',
      items: [
        { href: '/sessions', icon: 'gavel', iconColor: '#f97316', label: 'Daftar Sesi' },
        {
          href: '/auction/control-room',
          icon: 'settings_input_component',
          iconColor: '#ef4444',
          label: 'Ruang Kontrol',
          badge: hasLiveSession ? 'LIVE' : undefined,
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
        { href: '/analytics', icon: 'analytics', iconColor: '#3b82f6', label: 'Dashboard Analitik' },
        { href: '/reports/sessions', icon: 'assessment', iconColor: '#8b5cf6', label: 'Laporan Sesi' },
        { href: '/reports/finance', icon: 'monitoring', iconColor: '#10b981', label: 'Laporan Keuangan' },
        { href: '/reports/builder', icon: 'description', iconColor: '#f43f5e', label: 'Report Builder' },
        { href: '/campaigns', icon: 'campaign', iconColor: '#ec4899', label: 'Campaign' },
        { href: '/referral', icon: 'share', iconColor: '#06b6d4', label: 'Program Referral' },
      ],
    },
    {
      title: 'Pengaturan',
      items: [
        { href: '/settings/platform', icon: 'settings', iconColor: '#6b7280', label: 'Pengaturan Platform' },
        { href: '/branches', icon: 'apartment', iconColor: '#3b82f6', label: 'Manajemen Cabang' },
        { href: '/settings/audit-trail', icon: 'history', iconColor: '#f59e0b', label: 'Audit Trail' },
      ],
    },
  ];

  return (
    <aside className="sidebar" aria-label="Navigasi admin">
      <Link href="/dashboard" className="sidebar-logo" aria-label="Buka dashboard admin">
        <Image
          src="/logo-bidku.png"
          alt="Bidku"
          width={998}
          height={296}
          className="sidebar-logo-image"
          priority
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
    </aside>
  );
};

export default Sidebar;
