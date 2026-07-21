'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useEffect, useMemo, useState } from 'react';
import { apiFetch, clearAuthAndRedirect } from '../../lib/api';

interface TopbarProps {
  breadcrumbParent?: string;
  breadcrumbCurrent?: string;
  userName?: string;
  userInitial?: string;
  onToggleSidebar?: () => void;
}

const SEEN_KEY = 'admin_notifications_seen_at';

export const Topbar: React.FC<TopbarProps> = ({
  breadcrumbParent = 'Dashboard',
  breadcrumbCurrent = 'Overview',
  userName = 'Superadmin User',
  userInitial = 'S',
  onToggleSidebar,
}) => {
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [latestNotifTime, setLatestNotifTime] = useState<string | null>(null);
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

        const [countRes, listRes] = await Promise.all([
          apiFetch('/notifications/unread-count'),
          apiFetch('/notifications?per_page=1'),
        ]);

        if (countRes.ok) {
          const json = await countRes.json();
          if (json.success && typeof json.data.unread_count === 'number') {
            setUnreadCount(json.data.unread_count);
          }
        }

        if (listRes.ok) {
          const json = await listRes.json();
          if (json.success && json.data?.length > 0) {
            setLatestNotifTime(json.data[0].created_at || json.data[0].sent_at || null);
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

  // Determine if there's an unseen (not-yet-visited) notification
  const hasUnseen = useMemo(() => {
    if (!latestNotifTime) return false;
    const seenAt = typeof window !== 'undefined' ? localStorage.getItem(SEEN_KEY) : null;
    if (!seenAt) return true;
    return new Date(latestNotifTime) > new Date(seenAt);
  }, [latestNotifTime]);

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    router.push(`/search?q=${encodeURIComponent(query)}`);
  };

  const handleLogout = () => {
    clearAuthAndRedirect('Anda telah logout.');
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

        <Link
          href="/notifications"
          className={`notif-bell${hasUnseen ? ' shake-bell' : ''}`}
          aria-label="Buka notifikasi"
        >
          <span className="material-symbols-outlined notif-icon-bell" aria-hidden="true">notifications</span>
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
