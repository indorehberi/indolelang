'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import { apiUrl } from '../../../lib/api';

interface UserDetail {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  nik?: string;
  bank_name?: string;
  bank_account?: string;
  bank_holder?: string;
  created_at: string;
  kyc_status?: string;
}

interface KycDoc {
  id: string;
  type: string;
  file_url: string;
  status: string;
}

const DUMMY_USER: UserDetail = {
  id: 'user-demo-001',
  name: 'Budi Santoso',
  email: 'budi.santoso@gmail.com',
  phone: '08123456789',
  role: 'bidder',
  status: 'active',
  nik: '327310******9003',
  bank_name: 'BCA',
  bank_account: '8098765432',
  bank_holder: 'Budi Santoso',
  created_at: '2026-05-14T10:00:00Z',
  kyc_status: 'approved',
};

const DUMMY_KYC_DOCS: KycDoc[] = [
  { id: 'doc-1', type: 'ktp', file_url: '', status: 'approved' },
  { id: 'doc-2', type: 'selfie', file_url: '', status: 'approved' },
];

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params?.id as string;

  const [user, setUser] = useState<UserDetail | null>(null);
  const [kycDocs, setKycDocs] = useState<KycDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(apiUrl(`/admin/users/${userId}`), {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data.data?.user || data.data);
          setKycDocs(data.data?.kyc_docs || []);
        } else {
          // Fallback to dummy
          setUser(DUMMY_USER);
          setKycDocs(DUMMY_KYC_DOCS);
        }
      } catch {
        setUser(DUMMY_USER);
        setKycDocs(DUMMY_KYC_DOCS);
      } finally {
        setLoading(false);
      }
    };

    if (userId) fetchUser();
  }, [userId]);

  const handleSuspend = async () => {
    if (!confirm(`Anda yakin ingin ${user?.status === 'suspended' ? 'mengaktifkan' : 'mensuspend'} akun ini?`)) return;
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(apiUrl(`/admin/users/${userId}/status`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          status: user?.status === 'suspended' ? 'active' : 'suspended',
        }),
      });
      if (res.ok) {
        setUser((prev) =>
          prev ? { ...prev, status: prev.status === 'suspended' ? 'active' : 'suspended' } : prev
        );
        showToast('success', 'Status akun berhasil diperbarui');
      } else {
        showToast('error', 'Gagal memperbarui status akun');
      }
    } catch {
      showToast('error', 'Koneksi ke server gagal');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!confirm('Kirim ulang email reset password ke pengguna ini?')) return;
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(apiUrl(`/admin/users/${userId}/reset-password`), {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        showToast('success', 'Email reset password telah dikirim');
      } else {
        showToast('error', 'Gagal mengirim email reset password');
      }
    } catch {
      showToast('error', 'Koneksi ke server gagal');
    } finally {
      setActionLoading(false);
    }
  };

  const getRoleBadge = (role: string): 'success' | 'info' | 'warning' | 'danger' => {
    const map: Record<string, 'success' | 'info' | 'warning' | 'danger'> = {
      bidder: 'info',
      provider: 'success',
      operator: 'warning',
      admin: 'warning',
      super_admin: 'danger',
    };
    return map[role] || 'info';
  };

  const getStatusBadge = (status: string) => {
    return status === 'active' ? 'success' : status === 'suspended' ? 'danger' : 'warning';
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
          Memuat data pengguna...
        </div>
      </DashboardLayout>
    );
  }

  if (!user) {
    return (
      <DashboardLayout>
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
          Pengguna tidak ditemukan.
        </div>
      </DashboardLayout>
    );
  }

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
          }}
        >
          <span>{toast.type === 'success' ? '✅' : '❌'}</span>
          {toast.message}
        </div>
      )}

      <div className="page-header">
        <div>
          <h1 className="page-title">Detail Pengguna</h1>
          <p className="page-subtitle">
            <span
              style={{ cursor: 'pointer', color: 'var(--primary)' }}
              onClick={() => router.back()}
            >
              Manajemen Pengguna
            </span>{' '}
            &bull; Detail Pengguna
          </p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          ← Kembali
        </Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem' }}>
        {/* Left: Profile Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <Card title="Informasi Profil Pengguna">
            {/* Avatar & Status */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                marginBottom: '1.5rem',
                padding: '1rem',
                background: 'var(--bg-secondary)',
                borderRadius: '0.75rem',
              }}
            >
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--primary), #f57c00)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  color: '#fff',
                  flexShrink: 0,
                }}
              >
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                  {user.name}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                  <Badge variant={getRoleBadge(user.role)}>
                    {user.role.replace('_', ' ').toUpperCase()}
                  </Badge>
                  <Badge variant={getStatusBadge(user.status) as 'success' | 'danger' | 'warning'}>
                    {user.status === 'active' ? 'Aktif' : user.status === 'suspended' ? 'Disuspend' : user.status}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Info table */}
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                {[
                  { label: 'ID Pengguna', value: user.id },
                  { label: 'Nama Lengkap', value: user.name },
                  { label: 'NIK / KTP', value: user.nik || '—' },
                  { label: 'Email', value: user.email },
                  { label: 'Nomor HP', value: user.phone || '—' },
                  {
                    label: 'Rekening Bank',
                    value: user.bank_name
                      ? `${user.bank_name} - ${user.bank_account} (a/n ${user.bank_holder})`
                      : '—',
                  },
                  { label: 'Status KYC', value: user.kyc_status || '—' },
                  { label: 'Bergabung', value: formatDate(user.created_at) },
                ].map(({ label, value }) => (
                  <tr key={label} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td
                      style={{
                        padding: '0.65rem 0.5rem',
                        fontWeight: 600,
                        color: 'var(--text-secondary)',
                        width: '35%',
                        fontSize: '0.875rem',
                      }}
                    >
                      {label}
                    </td>
                    <td
                      style={{
                        padding: '0.65rem 0.5rem',
                        color: 'var(--text-primary)',
                        fontSize: '0.875rem',
                      }}
                    >
                      {value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
              <button
                className="btn btn-danger"
                onClick={handleSuspend}
                disabled={actionLoading}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '0.5rem',
                  background: user.status === 'suspended' ? '#22c55e' : '#ef4444',
                  color: '#fff',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                }}
              >
                {user.status === 'suspended' ? '✅ Aktifkan Akun' : '🚫 Suspend Akun'}
              </button>
              <button
                onClick={handleResetPassword}
                disabled={actionLoading}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '0.5rem',
                  background: 'transparent',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                }}
              >
                📧 Kirim Ulang Email Reset Sandi
              </button>
            </div>
          </Card>
        </div>

        {/* Right: KYC docs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <Card title="Dokumen eKYC Upload">
            {kycDocs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                Belum ada dokumen KYC yang diunggah
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {kycDocs.map((doc) => (
                  <div key={doc.id}>
                    <div
                      style={{
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        color: 'var(--text-secondary)',
                        marginBottom: '0.35rem',
                        textTransform: 'uppercase',
                      }}
                    >
                      {doc.type === 'ktp' ? 'Foto KTP Depan' : 'Foto Selfie dengan KTP'}
                    </div>
                    {doc.file_url ? (
                      <img
                        src={doc.file_url}
                        alt={doc.type}
                        style={{
                          width: '100%',
                          height: '150px',
                          objectFit: 'cover',
                          borderRadius: '0.5rem',
                          border: '1px solid var(--border)',
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          height: '150px',
                          border: '2px dashed var(--border)',
                          borderRadius: '0.5rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--text-secondary)',
                          fontSize: '0.875rem',
                          background: 'var(--bg-secondary)',
                        }}
                      >
                        {doc.type === 'ktp' ? '📄 Foto KTP Depan' : '🤳 Foto Selfie dengan KTP'}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Quick stats placeholder */}
          <Card title="Aktivitas Lelang">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {[
                { label: 'Total Bid Ditempatkan', value: '32' },
                { label: 'Lot Dimenangkan', value: '5' },
                { label: 'Total Deposit Masuk', value: 'Rp 35.000.000' },
                { label: 'Status Deposit Aktif', value: 'Rp 5.000.000' },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.5rem 0',
                    borderBottom: '1px solid var(--border)',
                    fontSize: '0.875rem',
                  }}
                >
                  <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{value}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
