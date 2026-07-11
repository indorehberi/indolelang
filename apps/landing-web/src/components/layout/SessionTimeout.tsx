'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { clearAuthAndRedirect } from '../../lib/api';

export default function SessionTimeout({ timeoutMinutes = 15 }: { timeoutMinutes?: number }) {
  const pathname = usePathname();

  useEffect(() => {
    // Only run if logged in (token exists)
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    // Don't auto-logout on public pages if somehow they have a token but are browsing public
    if (pathname === '/login' || pathname === '/register') return;

    let timeoutId: NodeJS.Timeout;

    const logout = () => {
      clearAuthAndRedirect(`Sesi Anda berakhir karena tidak ada aktivitas selama ${timeoutMinutes} menit.`);
    };

    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(logout, timeoutMinutes * 60 * 1000);
    };

    const events = ['mousemove', 'keydown', 'scroll', 'click', 'touchstart'];
    events.forEach(event => window.addEventListener(event, resetTimer));

    // Initialize timer
    resetTimer();

    return () => {
      events.forEach(event => window.removeEventListener(event, resetTimer));
      clearTimeout(timeoutId);
    };
  }, [timeoutMinutes, pathname]);

  return null;
}
