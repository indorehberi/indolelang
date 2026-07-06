'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useEffect, useMemo, useState } from 'react';
import { apiUrl } from '../../lib/api';

interface TopbarProps {
  breadcrumbParent?: string;
  breadcrumbCurrent?: string;
  userName?: string;
  userInitial?: string;
  onLogout?: () => void;
  onToggleSidebar?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  breadcrumbParent = 'Dashboard',
  breadcrumbCurrent = 'Overview',
  userName = 'Superadmin User',
  userInitial = 'S',
  onLogout,
  onToggleSidebar,
}) => {
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState('');

  const displayInitial = useMemo(() => {
    const cleanInitial = userInitial.trim();
    if (cleanInitial) return cleanInitial.slice(0, 2).toUpperCase();

    return userName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase() || 'AD';
  }, [userInitial, userName]);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
        if (!token) return;

        const res = await fetch(apiUrl('/notifications/unread-count'), {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const json = await res.json();
          if (json.success && typeof json.data.unread_count === 'number') {
            setUnreadCount(json.data.unread_count);
          }
        }
      } catch (err) {
        console.error('Failed to fetch unread notifications count:', err);
      }
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 60000);

    return () => clearInterval(interval);
  }, []);

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    router.push(`/assets?search=${encodeURIComponent(query)}`);
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
      return;
    }

    localStorage.removeItem('accessToken');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.replace('/login');
  };

  return (
    <header className="topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button 
          className="mobile-menu-toggle" 
          onClick={onToggleSidebar}
          aria-label="Toggle Sidebar"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>
        <div className="breadcrumb" aria-label="Breadcrumb">
          {breadcrumbParent} <span aria-hidden="true">/</span> <strong>{breadcrumbCurrent}</strong>
        </div>
      </div>

      <div className="topbar-right">
        <form className="topbar-search" onSubmit={handleSearch}>
          <label className="sr-only" htmlFor="admin-search">Cari data admin</label>
          <input
            id="admin-search"
            type="search"
            placeholder="Cari lot, bidder, atau sesi..."
            className="search-box"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </form>

        <Link href="/notifications" className="notif-bell" aria-label="Buka notifikasi">
          <span className="notif-icon" aria-hidden="true" />
          {unreadCount > 0 && (
            <span className="dot">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Link>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem' }}>
          <div className="user-menu" style={{ cursor: 'default', background: 'transparent' }}>
            <span className="user-copy">
              <span className="user-name">{userName}</span>
              <span className="user-role">Super Admin</span>
            </span>
            <span className="user-avatar" aria-hidden="true">{displayInitial}</span>
          </div>
          <button 
            onClick={handleLogout}
            type="button" 
            title="Keluar"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '0.5rem 0.875rem',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: 700,
              color: '#ffffff',
              backgroundColor: '#ef4444',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.15s',
              boxShadow: '0 2px 4px rgba(239, 68, 68, 0.15)'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#ef4444'}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>logout</span>
            <span>Keluar</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
