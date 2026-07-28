'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Emergency session reset page.
 * Visit /reset-session to fully clear all localStorage keys and redirect to /login.
 * Use this if you're stuck in a login loop.
 */
export default function ResetSessionPage() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Clear all known session keys
      localStorage.removeItem('accessToken');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('refreshToken');
      // Also clear sessionStorage just in case
      sessionStorage.clear();
      
      console.log('[reset-session] All session data cleared.');
      
      // Redirect to login after 500ms
      setTimeout(() => {
        router.replace('/login');
      }, 500);
    }
  }, [router]);

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh',
      gap: '1rem',
      background: 'var(--wf-bg, #f8fafc)'
    }}>
      <div style={{ 
        border: '3px solid rgba(0,0,0,0.1)', 
        borderTop: '3px solid #2e86c1', 
        borderRadius: '50%', 
        width: '32px', 
        height: '32px', 
        animation: 'spin 1s linear infinite' 
      }} />
      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Membersihkan sesi... Mengalihkan ke halaman login.</p>
    </div>
  );
}
