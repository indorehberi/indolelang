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
}

export const Topbar: React.FC<TopbarProps> = ({
  breadcrumbParent = 'Dashboard',
  breadcrumbCurrent = 'Overview',
  userName = 'Superadmin User',
  userInitial = 'S',
  onLogout,
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
      <div className="breadcrumb" aria-label="Breadcrumb">
        {breadcrumbParent} <span aria-hidden="true">/</span> <strong>{breadcrumbCurrent}</strong>
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

        <button className="user-menu" type="button" onClick={handleLogout} title="Keluar">
          <span className="user-copy">
            <span className="user-name">{userName}</span>
            <span className="user-role">Super Admin</span>
          </span>
          <span className="user-avatar" aria-hidden="true">{displayInitial}</span>
        </button>
      </div>
    </header>
  );
};

export default Topbar;
