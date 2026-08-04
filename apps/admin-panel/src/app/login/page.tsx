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
      const storedUser = localStorage.getItem('user');
      // Only redirect if BOTH token AND user data are present
      if (token && token !== 'undefined' && token !== 'null' && storedUser && storedUser !== 'null') {
        router.replace('/dashboard');
        return;
      } else {
        // Clean up any partial/stale session data
        localStorage.removeItem('accessToken');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('refreshToken');
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
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Store token and user data (refresh token lives in an httpOnly cookie, not the body)
        const token = data.data.accessToken || data.data.access_token;
        localStorage.setItem('accessToken', token);
        localStorage.setItem('user', JSON.stringify(data.data.user));

        // Redirect to dashboard
        router.replace('/dashboard');
      } else {
        // API error response format: { success: false, error: { code, message } }
        const errMsg = data.error?.message || data.message || 'Login gagal. Periksa email dan password Anda.';
        setError(errMsg);
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Terjadi kesalahan koneksi. Pastikan server API berjalan dan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  // Tombol "Demo Login (Tanpa Backend)" sengaja DIHAPUS dan jangan
  // dihidupkan lagi di halaman yang bisa diakses publik.
  //
  // Ia menulis token karangan beserta pengguna ber-role 'superadmin' ke
  // localStorage, lalu masuk ke /dashboard. Penjaga dasbor hanya memeriksa
  // KEBERADAAN kedua nilai itu dan tidak pernah memvalidasinya ke backend,
  // sehingga siapa pun yang membuka /admin/login bisa masuk ke antarmuka
  // admin sebagai superadmin tanpa kredensial apa pun. Permintaan data
  // memang tetap ditolak 401 oleh API, tetapi kerangka dasbor, navigasi,
  // dan apa pun yang dirender dari localStorage sudah telanjur terlihat.
  //
  // Kalau suatu saat butuh masuk cepat untuk pengembangan, gunakan akun
  // sungguhan di basis data lokal — bukan jalan pintas yang ikut terbawa
  // ke produksi.

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
          >
            {isLoading ? 'Memproses...' : 'Masuk'}
          </button>
        </form>
      </div>
    </div>
  );
}
