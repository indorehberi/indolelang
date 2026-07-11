'use client';

import React, { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { clearAuthAndRedirect } from '../../lib/api';

interface DashboardLayoutProps {
  children: React.ReactNode;
  breadcrumbParent?: string;
  breadcrumbCurrent?: string;
  userName?: string;
  userInitial?: string;
  role?: string;
  kycPendingCount?: number;
  assetPendingCount?: number;
  hasLiveSession?: boolean;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  breadcrumbParent = 'Dashboard',
  breadcrumbCurrent = 'Overview',
  userName,
  userInitial,
  role,
  kycPendingCount,
  assetPendingCount,
  hasLiveSession,
}) => {
  const handleLogout = React.useCallback(() => {
    clearAuthAndRedirect('Sesi Anda berakhir karena tidak ada aktivitas selama 15 menit.');
  }, []);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(timeoutId);
      // 15 minutes = 900000 ms
      timeoutId = setTimeout(handleLogout, 15 * 60 * 1000);
    };

    const events = ['mousemove', 'keydown', 'wheel', 'mousedown', 'touchstart', 'touchmove'];
    
    events.forEach(event => {
      window.addEventListener(event, resetTimer, false);
    });

    resetTimer();

    return () => {
      clearTimeout(timeoutId);
      events.forEach(event => {
        window.removeEventListener(event, resetTimer, false);
      });
    };
  }, [handleLogout]);

  return (
    <div className={`layout-panel ${isSidebarOpen ? 'sidebar-open' : ''}`}>
      <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)} aria-hidden="true" />
      <Sidebar
        role={role}
        kycPendingCount={kycPendingCount}
        assetPendingCount={assetPendingCount}
        hasLiveSession={hasLiveSession}
      />
      <div className="main-content">
        <Topbar
          breadcrumbParent={breadcrumbParent}
          breadcrumbCurrent={breadcrumbCurrent}
          userName={userName}
          userInitial={userInitial}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        />
        <main className="page-content">{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;
