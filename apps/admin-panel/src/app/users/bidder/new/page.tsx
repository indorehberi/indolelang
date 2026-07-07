'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '../../../../components/layout/DashboardLayout';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { apiUrl } from '../../../../lib/api';

export default function NewBidderPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    address: '',
    occupation: '',
    bank_name: '',
    bank_account_no: '',
    bank_account_name: '',
  });
  const [ktpFile, setKtpFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'ktp' | 'selfie') => {
    if (e.target.files && e.target.files[0]) {
      if (type === 'ktp') setKtpFile(e.target.files[0]);
      if (type === 'selfie') setSelfieFile(e.target.files[0]);
    }
  };

  const uploadFile = async (file: File): Promise<string | null> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(apiUrl('/upload'), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: formData
      });
      const data = await res.json();
      if (data.success) return data.data.url;
      return null;
    } catch (e) {
      console.error(e);
      return null;
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.full_name.trim()) newErrors.full_name = 'Nama lengkap wajib diisi';
    if (!form.email.trim()) newErrors.email = 'Email wajib diisi';
    if (!form.password.trim()) newErrors.password = 'Password wajib diisi';
    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setLoading(true);

    let ktp_url = null;
    let selfie_url = null;

    if (ktpFile) ktp_url = await uploadFile(ktpFile);
    if (selfieFile) selfie_url = await uploadFile(selfieFile);

    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(apiUrl('/admin/users'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...form,
          role: 'bidder',
          ktp_url,
          selfie_url
        }),
      });

      if (res.ok) {
        showToast('success', `Bidder berhasil ditambahkan!`);
        setTimeout(() => router.push('/users/bidder'), 1500);
      } else {
        const data = await res.json();
        showToast('error', data?.error?.message || 'Gagal menambahkan bidder');
      }
    } catch {
      showToast('error', 'Koneksi ke server gagal.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout breadcrumbParent="Pengguna" breadcrumbCurrent="Tambah Bidder">
      {toast && (
        <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 9999, padding: '1rem', borderRadius: '8px', color: '#fff', background: toast.type === 'success' ? '#10b981' : '#ef4444', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          {toast.message}
        </div>
      )}

      <div className="toolbar" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Tambah Bidder Baru</h1>
          <p className="page-subtitle">Isi profil lengkap agar bidder langsung berstatus aktif.</p>
        </div>
        <Button variant="outline" onClick={() => router.push('/users/bidder')}>
          Kembali
        </Button>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          
          <Card>
            <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>1. Data Akun</h3>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500 }}>Nama Lengkap *</label>
              <input type="text" value={form.full_name} onChange={(e) => setForm({...form, full_name: e.target.value})} style={{ width: '100%', padding: '0.6rem', border: '1px solid #d1d5db', borderRadius: '4px' }} />
              {errors.full_name && <span style={{ color: '#ef4444', fontSize: '0.8rem' }}>{errors.full_name}</span>}
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500 }}>Email *</label>
              <input type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} style={{ width: '100%', padding: '0.6rem', border: '1px solid #d1d5db', borderRadius: '4px' }} />
              {errors.email && <span style={{ color: '#ef4444', fontSize: '0.8rem' }}>{errors.email}</span>}
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500 }}>Nomor Telepon</label>
              <input type="text" value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} style={{ width: '100%', padding: '0.6rem', border: '1px solid #d1d5db', borderRadius: '4px' }} />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500 }}>Password *</label>
              <input type="password" value={form.password} onChange={(e) => setForm({...form, password: e.target.value})} style={{ width: '100%', padding: '0.6rem', border: '1px solid #d1d5db', borderRadius: '4px' }} />
              {errors.password && <span style={{ color: '#ef4444', fontSize: '0.8rem' }}>{errors.password}</span>}
            </div>
          </Card>

          <Card>
            <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>2. Data Profil & Alamat</h3>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500 }}>Pekerjaan</label>
              <input type="text" value={form.occupation} onChange={(e) => setForm({...form, occupation: e.target.value})} style={{ width: '100%', padding: '0.6rem', border: '1px solid #d1d5db', borderRadius: '4px' }} />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500 }}>Alamat Lengkap</label>
              <textarea rows={4} value={form.address} onChange={(e) => setForm({...form, address: e.target.value})} style={{ width: '100%', padding: '0.6rem', border: '1px solid #d1d5db', borderRadius: '4px' }} />
            </div>
          </Card>

          <Card>
            <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>3. Data Rekening Bank</h3>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500 }}>Nama Bank</label>
              <input type="text" value={form.bank_name} onChange={(e) => setForm({...form, bank_name: e.target.value})} placeholder="BCA / Mandiri / BNI" style={{ width: '100%', padding: '0.6rem', border: '1px solid #d1d5db', borderRadius: '4px' }} />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500 }}>Nomor Rekening</label>
              <input type="text" value={form.bank_account_no} onChange={(e) => setForm({...form, bank_account_no: e.target.value})} style={{ width: '100%', padding: '0.6rem', border: '1px solid #d1d5db', borderRadius: '4px' }} />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500 }}>Nama Pemilik Rekening</label>
              <input type="text" value={form.bank_account_name} onChange={(e) => setForm({...form, bank_account_name: e.target.value})} style={{ width: '100%', padding: '0.6rem', border: '1px solid #d1d5db', borderRadius: '4px' }} />
            </div>
          </Card>

          <Card>
            <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>4. Dokumen KYC (Opsional)</h3>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500 }}>Foto KTP</label>
              <input type="file" accept="image/png, image/jpeg, image/jpg" onChange={(e) => handleFileChange(e, 'ktp')} style={{ width: '100%', padding: '0.4rem', border: '1px solid #d1d5db', borderRadius: '4px', background: '#f9fafb' }} />
              {ktpFile && <small style={{ color: '#10b981', display: 'block', marginTop: '0.25rem' }}>✓ File terpilih: {ktpFile.name}</small>}
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500 }}>Foto Selfie dengan KTP</label>
              <input type="file" accept="image/png, image/jpeg, image/jpg" onChange={(e) => handleFileChange(e, 'selfie')} style={{ width: '100%', padding: '0.4rem', border: '1px solid #d1d5db', borderRadius: '4px', background: '#f9fafb' }} />
              {selfieFile && <small style={{ color: '#10b981', display: 'block', marginTop: '0.25rem' }}>✓ File terpilih: {selfieFile.name}</small>}
            </div>
          </Card>

        </div>

        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <Button variant="outline" type="button" onClick={() => router.push('/users/bidder')}>Batal</Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? 'Menyimpan...' : 'Simpan Bidder'}
          </Button>
        </div>
      </form>
    </DashboardLayout>
  );
}
