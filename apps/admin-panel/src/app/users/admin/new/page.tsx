'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../../../../components/layout/DashboardLayout';
import Card from '../../../../components/ui/Card';
import Button from '../../../../components/ui/Button';
import { apiUrl } from '../../../../lib/api';

const BRANCHES = [
  'Jakarta (HQ)',
  'Bandung',
  'Surabaya',
  'Medan',
  'Makassar',
];

const ROLES = [
  { value: 'superadmin', label: 'Superadmin' },
  { value: 'admin', label: 'Admin Keuangan' },
  { value: 'operator', label: 'Operator Lelang' },
  { value: 'inspector', label: 'Inspector' },
];

export default function NewStaffPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'operator',
    branch: 'Jakarta (HQ)',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.name.trim()) newErrors.name = 'Nama lengkap wajib diisi';
    if (!form.email.trim()) newErrors.email = 'Email wajib diisi';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = 'Format email tidak valid';
    if (!form.phone.trim()) newErrors.phone = 'Nomor HP wajib diisi';
    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    setLoading(true);

    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');

      // Build payload — omit optional empty string fields so they don't fail min-length validation
      const payload: Record<string, unknown> = {
        name: form.name,
        full_name: form.name,
        email: form.email,
        role: form.role,
        branch_name: form.branch,
        password: 'LelangStaf2026!',
      };
      if (form.phone.trim()) payload.phone = form.phone.trim();

      const res = await fetch(apiUrl('/admin/users'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        showToast('success', `Staf "${form.name}" berhasil ditambahkan!`);
        setTimeout(() => router.push('/users/admin'), 1500);
      } else {
        const data = await res.json();
        // If server returns field-level details, show them inline
        if (data?.error?.details && typeof data.error.details === 'object') {
          const serverErrors: Record<string, string> = {};
          for (const [key, msg] of Object.entries(data.error.details)) {
            serverErrors[key] = String(msg);
          }
          setErrors(serverErrors);
        }
        showToast('error', data?.error?.message || 'Gagal menambahkan staf');
      }
    } catch {
      showToast('error', 'Koneksi ke server gagal. Pastikan API berjalan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      {/* Toast */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: '1.5rem',
            right: '1.5rem',
            zIndex: 9999,
            padding: '0.875rem 1.25rem',
            borderRadius: '0.75rem',
            background: toast.type === 'success' ? '#22c55e' : '#ef4444',
            color: '#fff',
            fontWeight: 600,
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.9rem',
          }}
        >
          <span>{toast.type === 'success' ? '✅' : '❌'}</span>
          {toast.message}
        </div>
      )}

      <div className="page-header">
        <div>
          <h1 className="page-title">Tambah Staf Baru</h1>
          <p className="page-subtitle">
            <a href="/users/admin" className="breadcrumb-link">Admin/Operator</a>
            {' '}&bull; Tambah Staf Baru
          </p>
        </div>
        <Button variant="outline" onClick={() => router.push('/users/admin')}>
          ← Kembali
        </Button>
      </div>

      <div style={{ maxWidth: '640px', margin: '0 auto' }}>
        <Card title="Form Registrasi Staf Baru">
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Nama Lengkap */}
            <div className="form-group">
              <label className="form-label">
                Nama Lengkap <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                className={`form-input${errors.name ? ' form-input-error' : ''}`}
                id="staff-name"
                placeholder="Misal: Rian Kurniawan"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              {errors.name && <span className="form-error">{errors.name}</span>}
            </div>

            {/* Email */}
            <div className="form-group">
              <label className="form-label">
                Email Staf <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="email"
                className={`form-input${errors.email ? ' form-input-error' : ''}`}
                id="staff-email"
                placeholder="rian.k@indolelang.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              {errors.email && <span className="form-error">{errors.email}</span>}
            </div>

            {/* Nomor HP */}
            <div className="form-group">
              <label className="form-label">
                Nomor HP <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                className={`form-input${errors.phone ? ' form-input-error' : ''}`}
                id="staff-phone"
                placeholder="08123456789"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
              {errors.phone && <span className="form-error">{errors.phone}</span>}
            </div>

            {/* Role & Cabang */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">
                  Role Hak Akses <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  className="form-select"
                  id="staff-role"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                >
                  {ROLES.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">
                  Cabang Kantor <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  className="form-select"
                  id="staff-branch"
                  value={form.branch}
                  onChange={(e) => setForm({ ...form, branch: e.target.value })}
                >
                  {BRANCHES.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Password default */}
            <div className="form-group">
              <label className="form-label">Password Awal Staf</label>
              <input
                type="text"
                className="form-input"
                value="LelangStaf2026!"
                disabled
                style={{ opacity: 0.6, cursor: 'not-allowed' }}
              />
              <span className="form-hint">
                Kata sandi default untuk login pertama kali. Staf akan diminta menggantinya saat pertama kali masuk.
              </span>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
              <Button
                variant="outline"
                type="button"
                onClick={() => router.push('/users/admin')}
                disabled={loading}
              >
                Batal
              </Button>
              <Button variant="primary" type="submit" disabled={loading}>
                {loading ? 'Menyimpan...' : '💾 Simpan Staf Baru'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  );
}
