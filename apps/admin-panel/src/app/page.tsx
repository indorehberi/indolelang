'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token && token !== 'undefined' && token !== 'null') {
      router.replace('/dashboard');
    } else {
      localStorage.removeItem('accessToken');
      router.replace('/login');
    }
  }, [router]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyItems: 'center', minHeight: '100vh', justifyContent: 'center' }}>
      <p style={{ color: 'var(--wf-text-light)' }}>Memuat...</p>
    </div>
  );
}
