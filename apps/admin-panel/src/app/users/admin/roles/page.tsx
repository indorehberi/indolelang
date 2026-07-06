'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../../../components/layout/DashboardLayout';
import Card from '../../../../components/ui/Card';
import { apiUrl } from '../../../../lib/api';

// ======================================================
// Tipe & Konstanta
// ======================================================

export interface ModulePermissions {
  katalog: boolean;
  bidding: boolean;
  pengajuanAset: boolean;
  inspeksiAset: boolean;
  verifikasiKyc: boolean;
  laporanKeuangan: boolean;
  fullAccess: boolean;
}

export interface RolePermission {
  id: string;
  name: string;
  description: string;
  modules: ModulePermissions;
}

const MODULE_LABELS: Record<keyof ModulePermissions, string> = {
  katalog: 'Katalog & View Lelang',
  bidding: 'Beli NIPL & Bidding',
  pengajuanAset: 'Pengajuan Aset (Lot)',
  inspeksiAset: 'Inspeksi & Edit Aset',
  verifikasiKyc: 'Verifikasi KYC & CS',
  laporanKeuangan: 'Laporan Keuangan',
  fullAccess: 'Full Access (Admin)',
};

const DEFAULT_ROLES: RolePermission[] = [
  {
    id: 'superadmin',
    name: 'Super Admin',
    description: 'Akses penuh ke semua modul dan seluruh cabang platform.',
    modules: { katalog: true, bidding: false, pengajuanAset: false, inspeksiAset: true, verifikasiKyc: true, laporanKeuangan: true, fullAccess: true },
  },
  {
    id: 'admin',
    name: 'Admin Cabang',
    description: 'Akses penuh namun terbatas hanya untuk data di cabangnya sendiri.',
    modules: { katalog: true, bidding: false, pengajuanAset: false, inspeksiAset: true, verifikasiKyc: true, laporanKeuangan: true, fullAccess: true },
  },
  {
    id: 'finance',
    name: 'Keuangan (Finance)',
    description: 'Fokus pada pencetakan laporan, settlement, invoice, dan data transaksi.',
    modules: { katalog: true, bidding: false, pengajuanAset: false, inspeksiAset: false, verifikasiKyc: false, laporanKeuangan: true, fullAccess: false },
  },
  {
    id: 'operator',
    name: 'Operator (CS)',
    description: 'Menangani antrian KYC, pesan masuk, verifikasi deposit manual, dan approval awal aset.',
    modules: { katalog: true, bidding: false, pengajuanAset: false, inspeksiAset: false, verifikasiKyc: true, laporanKeuangan: false, fullAccess: false },
  },
  {
    id: 'inspector',
    name: 'Inspector',
    description: 'Memeriksa fisik unit yang diajukan provider; berhak edit dan hapus lot/aset.',
    modules: { katalog: true, bidding: false, pengajuanAset: false, inspeksiAset: true, verifikasiKyc: false, laporanKeuangan: false, fullAccess: false },
  },
  {
    id: 'provider',
    name: 'Provider',
    description: 'Bidder terverifikasi yang juga berhak menitipkan/mengajukan aset untuk dilelang.',
    modules: { katalog: true, bidding: true, pengajuanAset: true, inspeksiAset: false, verifikasiKyc: false, laporanKeuangan: false, fullAccess: false },
  },
  {
    id: 'bidder',
    name: 'Bidder',
    description: 'Member yang lolos verifikasi KYC. Berhak membeli NIPL dan mengikuti bidding.',
    modules: { katalog: true, bidding: true, pengajuanAset: false, inspeksiAset: false, verifikasiKyc: false, laporanKeuangan: false, fullAccess: false },
  },
  {
    id: 'user',
    name: 'User (Member)',
    description: 'Akun dasar — baru register. Hanya bisa melihat katalog lelang.',
    modules: { katalog: true, bidding: false, pengajuanAset: false, inspeksiAset: false, verifikasiKyc: false, laporanKeuangan: false, fullAccess: false },
  },
];

const SETTING_KEY = 'role_permissions';

// ======================================================
// Page Component
// ======================================================

export default function RoleSettingsPage() {
  const [roles, setRoles] = useState<RolePermission[]>(DEFAULT_ROLES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  // ---- Fetch from API ----
  useEffect(() => {
    const fetchRoleMatrix = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
        const res = await fetch(apiUrl(`/admin/settings/${SETTING_KEY}`), {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok && data.success && data.data?.value) {
          const parsed: RolePermission[] = JSON.parse(data.data.value);
          // Merge with defaults to handle new roles or modules added later
          const merged = DEFAULT_ROLES.map((defaultRole) => {
            const saved = parsed.find((r) => r.id === defaultRole.id);
            return saved ? { ...defaultRole, modules: { ...defaultRole.modules, ...saved.modules } } : defaultRole;
          });
          setRoles(merged);
        }
        // If setting not found (404), just use DEFAULT_ROLES — no error
      } catch (err) {
        console.error('Gagal memuat role matrix dari server', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRoleMatrix();
  }, []);

  // ---- Toggle permission ----
  const togglePermission = (roleId: string, moduleKey: keyof ModulePermissions) => {
    setRoles((prev) =>
      prev.map((r) =>
        r.id === roleId ? { ...r, modules: { ...r.modules, [moduleKey]: !r.modules[moduleKey] } } : r
      )
    );
    setIsDirty(true);
  };

  // ---- Save to API ----
  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      const res = await fetch(apiUrl(`/admin/settings/${SETTING_KEY}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ value: JSON.stringify(roles) }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('success', 'Hak akses berhasil disimpan ke database.');
        setIsDirty(false);
      } else {
        showToast('error', data.error?.message || 'Gagal menyimpan pengaturan.');
      }
    } catch (err) {
      showToast('error', 'Terjadi kesalahan koneksi ke server.');
    } finally {
      setSaving(false);
    }
  };

  // ---- Reset to defaults ----
  const handleReset = () => {
    if (!confirm('Reset semua hak akses ke nilai default? Perubahan yang belum disimpan akan hilang.')) return;
    setRoles(DEFAULT_ROLES);
    setIsDirty(true);
  };

  return (
    <DashboardLayout breadcrumbParent="Pengguna / Admin & Operator" breadcrumbCurrent="Pengaturan Hak Akses Role">
      {/* Toast Notification */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: '1.5rem',
            right: '1.5rem',
            zIndex: 9999,
            padding: '0.875rem 1.25rem',
            borderRadius: '0.5rem',
            backgroundColor: toast.type === 'success' ? '#10b981' : '#ef4444',
            color: '#fff',
            fontWeight: 600,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            minWidth: '280px',
          }}
        >
          {toast.type === 'success' ? '✅' : '❌'} {toast.message}
        </div>
      )}

      <div className="toolbar">
        <div className="toolbar-left">
          <h1 className="page-title">Matriks Hak Akses (Role Matrix)</h1>
          <p className="page-subtitle">
            Atur izin akses modul untuk setiap tingkat peran pengguna platform.
            {isDirty && <span style={{ color: '#f59e0b', marginLeft: '0.5rem', fontWeight: 600 }}>● Ada perubahan yang belum disimpan</span>}
          </p>
        </div>
        <div className="toolbar-right" style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-outline" onClick={handleReset} disabled={saving}>
            Reset ke Default
          </button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving || !isDirty}>
            {saving ? 'Menyimpan...' : 'Simpan ke Database'}
          </button>
        </div>
      </div>

      <Card>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--on-surface-variant)' }}>
            Memuat pengaturan hak akses...
          </div>
        ) : (
          <div className="table-wrapper">
            <table style={{ minWidth: '1000px' }}>
              <thead>
                <tr>
                  <th style={{ width: '28%', textAlign: 'left' }}>Profil Role</th>
                  {(Object.keys(MODULE_LABELS) as (keyof ModulePermissions)[]).map((mod) => (
                    <th key={mod} style={{ textAlign: 'center', fontSize: '0.78rem', lineHeight: '1.3' }}>
                      {MODULE_LABELS[mod]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {roles.map((role) => (
                  <tr key={role.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--on-surface)', marginBottom: '0.2rem' }}>
                        {role.name}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--on-surface-variant)', lineHeight: '1.4' }}>
                        {role.description}
                      </div>
                    </td>
                    {(Object.keys(MODULE_LABELS) as (keyof ModulePermissions)[]).map((mod) => (
                      <td key={mod} style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                        <label style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                          <input
                            type="checkbox"
                            checked={role.modules[mod]}
                            onChange={() => togglePermission(role.id, mod)}
                            style={{ width: '1.1rem', height: '1.1rem', cursor: 'pointer', accentColor: 'var(--primary)' }}
                          />
                        </label>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Info box */}
        <div
          style={{
            marginTop: '1.5rem',
            padding: '0.875rem 1.25rem',
            backgroundColor: 'var(--surface-container)',
            borderRadius: '0.5rem',
            fontSize: '0.82rem',
            color: 'var(--on-surface-variant)',
            lineHeight: '1.6',
          }}
        >
          <strong>⚠️ Catatan:</strong> Pengaturan ini dikontrol melalui panel admin dan disimpan sebagai konfigurasi sistem (
          <code>role_permissions</code>) di tabel <code>platform_settings</code>. RBAC backend akan membaca konfigurasi ini
          untuk memverifikasi akses setiap request API secara real-time.
        </div>
      </Card>
    </DashboardLayout>
  );
}
