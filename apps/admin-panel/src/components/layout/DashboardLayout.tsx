'use client';

import React, { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

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
  onLogout?: () => void;
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
  onLogout,
}) => {
  const handleLogout = React.useCallback(() => {
    if (onLogout) {
      onLogout();
    } else {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
  }, [onLogout]);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(timeoutId);
      // 10 minutes = 600000 ms
      timeoutId = setTimeout(handleLogout, 10 * 60 * 1000);
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
        onLogout={handleLogout}
      />
      <div className="main-content">
        <Topbar
          breadcrumbParent={breadcrumbParent}
          breadcrumbCurrent={breadcrumbCurrent}
          userName={userName}
          userInitial={userInitial}
          onLogout={handleLogout}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        />
        <main className="page-content">{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;
