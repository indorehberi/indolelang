'use client';

import React from 'react';
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
  return (
    <div className="layout-panel">
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
          onLogout={onLogout}
        />
        <main className="page-content">{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;
