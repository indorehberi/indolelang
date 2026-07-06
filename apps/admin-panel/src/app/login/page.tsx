'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { apiUrl } from '../../lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const urlToken = searchParams.get('token');
      const urlUser = searchParams.get('user');

      if (urlToken && urlToken !== 'undefined' && urlToken !== 'null') {
        localStorage.setItem('accessToken', urlToken);
        if (urlUser) {
          localStorage.setItem('user', decodeURIComponent(urlUser));
        }
        router.replace('/dashboard');
        return;
      }

      const token = localStorage.getItem('accessToken');
      if (token && token !== 'undefined' && token !== 'null') {
        router.replace('/dashboard');
        return;
      } else {
        localStorage.removeItem('accessToken');
      }
      setCheckingAuth(false);
    }
  }, [router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch(apiUrl('/auth/login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Store token and user data
        const token = data.data.accessToken || data.data.access_token;
        localStorage.setItem('accessToken', token);
        if (data.data.refreshToken || data.data.refresh_token) {
          localStorage.setItem('refreshToken', data.data.refreshToken || data.data.refresh_token);
        }
        localStorage.setItem('user', JSON.stringify(data.data.user));

        // Redirect to dashboard
        router.replace('/dashboard');
      } else {
        setError(data.message || 'Login gagal. Periksa email dan password Anda.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Terjadi kesalahan koneksi. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  // Demo login handler
  const handleDemoLogin = () => {
    // Set demo user data
    const demoUser = {
      id: 1,
      email: 'admin@indo-lelang.com',
      full_name: 'Demo Admin',
      role: 'superadmin',
    };
    
    localStorage.setItem('accessToken', 'demo-token-' + Date.now());
    localStorage.setItem('user', JSON.stringify(demoUser));
    router.replace('/dashboard');
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: 'var(--wf-bg)' }}>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <img src="/logo-bidku.png?v=2" alt="BIDKU" style={{ height: '48px', marginBottom: '1.5rem', opacity: 0.8 }} />
          <div style={{ border: '3px solid rgba(0,0,0,0.1)', borderTop: '3px solid var(--wf-accent, #2e86c1)', borderRadius: '50%', width: '24px', height: '24px', animation: 'spin 1s linear infinite', marginBottom: '1rem' }} />
          <p className="page-subtitle" style={{ margin: 0, fontSize: '0.9rem' }}>Menghubungkan ke dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--wf-bg)' }}>
      <div className="card" style={{ maxWidth: '420px', width: '100%', margin: '1rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <img src="/logo-bidku.png?v=2" alt="BIDKU" style={{ height: '48px', marginBottom: '0.5rem' }} />
          <p className="page-subtitle" style={{ marginBottom: 0 }}>Admin Panel</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email
            </label>
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder="admin@indo-lelang.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary w-100"
            disabled={isLoading}
            style={{ marginBottom: '0.75rem' }}
          >
            {isLoading ? 'Memproses...' : 'Login'}
          </button>

          <button
            type="button"
            className="btn btn-outline w-100"
            onClick={handleDemoLogin}
            disabled={isLoading}
          >
            Demo Login (Tanpa Backend)
          </button>
        </form>

        <div className="separator" style={{ margin: '1.5rem 0' }} />

        <div style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--wf-text-muted)' }}>
          <p style={{ margin: 0 }}>
            Untuk testing, gunakan <strong>Demo Login</strong>
          </p>
          <p style={{ margin: '0.5rem 0 0' }}>
            Atau login dengan kredensial backend API
          </p>
        </div>
      </div>
    </div>
  );
}
