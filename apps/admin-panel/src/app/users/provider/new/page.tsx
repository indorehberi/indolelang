'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '../../../../components/layout/DashboardLayout';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { apiFetch } from '../../../../lib/api';

export default function NewProviderPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    address: '',
    occupation: 'Mitra Provider',
    bank_name: '',
    bank_account_no: '',
    bank_account_name: '',
    company_name: '',
    npwp: '',
    provider_fee_type: 'percentage',
    provider_fee_amount: '0',
    pmk41_paid_by_provider: false
  });
  
  const [ktpFile, setKtpFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [npwpFile, setNpwpFile] = useState<File | null>(null);
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'ktp' | 'selfie' | 'npwp') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const maxBytes = 10 * 1024 * 1024;
      if (file.size > maxBytes) {
        showToast('error', `Ukuran file ${type.toUpperCase()} (${(file.size / 1024 / 1024).toFixed(1)} MB) melebihi batas maksimal 10 MB.`);
        e.target.value = ''; // Clear selection
        return;
      }
      if (type === 'ktp') setKtpFile(file);
      if (type === 'selfie') setSelfieFile(file);
      if (type === 'npwp') setNpwpFile(file);
    }
  };

  const uploadFile = async (file: File): Promise<string | null> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await apiFetch('/upload/single', {
        method: 'POST',
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
    if (!form.company_name.trim()) newErrors.company_name = 'Nama perusahaan wajib diisi';
    if (!form.npwp.trim()) newErrors.npwp = 'NPWP perusahaan wajib diisi';
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

    let ktp_url: string | undefined = undefined;
    let selfie_url: string | undefined = undefined;
    let npwp_url: string | undefined = undefined;

    if (ktpFile) ktp_url = (await uploadFile(ktpFile)) ?? undefined;
    if (selfieFile) selfie_url = (await uploadFile(selfieFile)) ?? undefined;
    if (npwpFile) npwp_url = (await uploadFile(npwpFile)) ?? undefined;

    // Build payload — omit optional empty string fields so they don't fail min-length validation
    const payload: Record<string, unknown> = {
      full_name: form.full_name,
      email: form.email,
      password: form.password,
      role: 'provider',
      company_name: form.company_name,
      npwp: form.npwp,
      provider_fee_type: form.provider_fee_type,
      provider_fee_amount: Number(form.provider_fee_amount),
      pmk41_paid_by_provider: form.pmk41_paid_by_provider,
      occupation: form.occupation,
    };
    if (form.phone.trim()) payload.phone = form.phone.trim();
    if (form.address.trim()) payload.address = form.address.trim();
    if (form.bank_name.trim()) payload.bank_name = form.bank_name.trim();
    if (form.bank_account_no.trim()) payload.bank_account_no = form.bank_account_no.trim();
    if (form.bank_account_name.trim()) payload.bank_account_name = form.bank_account_name.trim();
    if (ktp_url) payload.ktp_url = ktp_url;
    if (selfie_url) payload.selfie_url = selfie_url;
    if (npwp_url) payload.npwp_url = npwp_url;

    try {
      const res = await apiFetch('/admin/users', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        showToast('success', `Provider berhasil ditambahkan!`);
        setTimeout(() => router.push('/users/provider'), 1500);
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
        showToast('error', data?.error?.message || 'Gagal menambahkan provider');
      }
    } catch {
      showToast('error', 'Koneksi ke server gagal.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout breadcrumbParent="Pengguna" breadcrumbCurrent="Tambah Provider">
      {toast && (
        <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 9999, padding: '1rem', borderRadius: '8px', color: '#fff', background: toast.type === 'success' ? '#10b981' : '#ef4444', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          {toast.message}
        </div>
      )}

      <div className="toolbar" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Tambah Provider Baru</h1>
          <p className="page-subtitle">Isi profil lengkap, info perusahaan, dan pengaturan fee provider.</p>
        </div>
        <Button variant="outline" onClick={() => router.push('/users/provider')}>
          Kembali
        </Button>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          
          <Card>
            <h3 className="card-header">1. Data Akun Perwakilan</h3>
            <div className="form-group">
              <label className="form-label">Nama Perwakilan <span className="required">*</span></label>
              <input
                type="text"
                className={`form-input${errors.full_name ? ' form-input-error' : ''}`}
                value={form.full_name}
                onChange={(e) => setForm({...form, full_name: e.target.value})}
              />
              {errors.full_name && <span className="form-error">{errors.full_name}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Email <span className="required">*</span></label>
              <input
                type="email"
                className={`form-input${errors.email ? ' form-input-error' : ''}`}
                value={form.email}
                onChange={(e) => setForm({...form, email: e.target.value})}
              />
              {errors.email && <span className="form-error">{errors.email}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Nomor Telepon</label>
              <input
                type="text"
                className="form-input"
                value={form.phone}
                onChange={(e) => setForm({...form, phone: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password <span className="required">*</span></label>
              <input
                type="password"
                className={`form-input${errors.password ? ' form-input-error' : ''}`}
                value={form.password}
                onChange={(e) => setForm({...form, password: e.target.value})}
              />
              {errors.password && <span className="form-error">{errors.password}</span>}
            </div>
          </Card>

          <Card>
            <h3 className="card-header">2. Data Perusahaan</h3>
            <div className="form-group">
              <label className="form-label">Nama Perusahaan (PT/CV) <span className="required">*</span></label>
              <input
                type="text"
                className={`form-input${errors.company_name ? ' form-input-error' : ''}`}
                value={form.company_name}
                onChange={(e) => setForm({...form, company_name: e.target.value})}
              />
              {errors.company_name && <span className="form-error">{errors.company_name}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">NPWP Perusahaan <span className="required">*</span></label>
              <input
                type="text"
                className={`form-input${errors.npwp ? ' form-input-error' : ''}`}
                value={form.npwp}
                onChange={(e) => setForm({...form, npwp: e.target.value})}
              />
              {errors.npwp && <span className="form-error">{errors.npwp}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Alamat Perusahaan</label>
              <textarea
                rows={4}
                className="form-textarea"
                value={form.address}
                onChange={(e) => setForm({...form, address: e.target.value})}
              />
            </div>
          </Card>

          <Card>
            <h3 className="card-header">3. Pengaturan Biaya &amp; Rekening</h3>
            <div className="form-group">
              <label className="form-label">Tipe Biaya (Fee)</label>
              <select
                className="form-select"
                value={form.provider_fee_type}
                onChange={(e) => setForm({...form, provider_fee_type: e.target.value})}
              >
                <option value="percentage">Persentase (%)</option>
                <option value="flat">Nominal Tetap (Rp)</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Nominal Biaya (Fee Amount)</label>
              <input
                type="number"
                className="form-input"
                value={form.provider_fee_amount}
                onChange={(e) => setForm({...form, provider_fee_amount: e.target.value})}
              />
            </div>
            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="checkbox"
                id="pmk41"
                checked={form.pmk41_paid_by_provider}
                onChange={(e) => setForm({...form, pmk41_paid_by_provider: e.target.checked})}
                style={{ width: 'auto', minHeight: 'auto' }}
              />
              <label htmlFor="pmk41" className="form-label" style={{ marginBottom: 0 }}>Provider menanggung PMK41</label>
            </div>
            <hr style={{margin: '1.5rem 0', borderColor: '#eee'}} />
            <div className="form-group">
              <label className="form-label">Nama Bank</label>
              <input
                type="text"
                list="banks"
                className="form-input"
                value={form.bank_name}
                onChange={(e) => setForm({...form, bank_name: e.target.value})}
                placeholder="Ketik atau pilih nama bank..."
              />
              <datalist id="banks">
                <option value="BCA">BCA (Bank Central Asia)</option>
                <option value="Mandiri">Bank Mandiri</option>
                <option value="BNI">BNI (Bank Negara Indonesia)</option>
                <option value="BRI">BRI (Bank Rakyat Indonesia)</option>
                <option value="BSI">BSI (Bank Syariah Indonesia)</option>
                <option value="CIMB Niaga">CIMB Niaga</option>
                <option value="Permata">Bank Permata</option>
                <option value="Danamon">Bank Danamon</option>
                <option value="BTN">BTN (Bank Tabungan Negara)</option>
                <option value="Maybank">Maybank Indonesia</option>
                <option value="Mega">Bank Mega</option>
                <option value="BTPN">BTPN</option>
                <option value="OCBC NISP">OCBC NISP</option>
                <option value="Panin">Panin Bank</option>
                <option value="Muamalat">Bank Muamalat</option>
                <option value="Sinarmas">Bank Sinarmas</option>
                <option value="Bukopin">KB Bukopin</option>
                <option value="DKI">Bank DKI</option>
                <option value="BJB">Bank BJB</option>
                <option value="Jago">Bank Jago</option>
                <option value="SeaBank">SeaBank</option>
                <option value="Neo Commerce">Bank Neo Commerce (BNC)</option>
                <option value="Blu">Blu by BCA Digital</option>
                <option value="Jenius">Jenius (BTPN)</option>
                <option value="BPD Bali">BPD Bali</option>
                <option value="BPD DIY">BPD DIY</option>
                <option value="BPD Jateng">Bank Jateng</option>
                <option value="BPD Jatim">Bank Jatim</option>
              </datalist>
            </div>
            <div className="form-group">
              <label className="form-label">Nomor Rekening</label>
              <input
                type="text"
                className="form-input"
                value={form.bank_account_no}
                onChange={(e) => setForm({...form, bank_account_no: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Atas Nama Rekening</label>
              <input
                type="text"
                className="form-input"
                value={form.bank_account_name}
                onChange={(e) => setForm({...form, bank_account_name: e.target.value})}
              />
            </div>
          </Card>

          <Card>
            <h3 className="card-header">4. Dokumen Legal (Opsional)</h3>
            <div className="form-group">
              <label className="form-label">Foto NPWP Perusahaan</label>
              <input
                type="file"
                accept="image/png, image/jpeg, image/jpg, application/pdf"
                className="form-input"
                style={{ paddingTop: '0.45rem', cursor: 'pointer' }}
                onChange={(e) => handleFileChange(e, 'npwp')}
              />
              <small className="text-muted" style={{ display: 'block', marginTop: '0.25rem' }}>Format JPG/PNG/PDF, ukuran maksimal 10MB.</small>
              {npwpFile && <small style={{ color: '#10b981', display: 'block', marginTop: '0.25rem' }}>✓ File terpilih: {npwpFile.name}</small>}
            </div>
            <div className="form-group">
              <label className="form-label">Foto KTP Perwakilan</label>
              <input
                type="file"
                accept="image/png, image/jpeg, image/jpg"
                className="form-input"
                style={{ paddingTop: '0.45rem', cursor: 'pointer' }}
                onChange={(e) => handleFileChange(e, 'ktp')}
              />
              <small className="text-muted" style={{ display: 'block', marginTop: '0.25rem' }}>Format JPG/PNG, ukuran maksimal 10MB.</small>
              {ktpFile && <small style={{ color: '#10b981', display: 'block', marginTop: '0.25rem' }}>✓ File terpilih: {ktpFile.name}</small>}
            </div>
            <div className="form-group">
              <label className="form-label">Foto Selfie KTP Perwakilan</label>
              <input
                type="file"
                accept="image/png, image/jpeg, image/jpg"
                className="form-input"
                style={{ paddingTop: '0.45rem', cursor: 'pointer' }}
                onChange={(e) => handleFileChange(e, 'selfie')}
              />
              <small className="text-muted" style={{ display: 'block', marginTop: '0.25rem' }}>Format JPG/PNG, ukuran maksimal 10MB.</small>
              {selfieFile && <small style={{ color: '#10b981', display: 'block', marginTop: '0.25rem' }}>✓ File terpilih: {selfieFile.name}</small>}
            </div>
          </Card>

        </div>

        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <Button variant="outline" type="button" onClick={() => router.push('/users/provider')}>Batal</Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? 'Menyimpan...' : 'Simpan Provider'}
          </Button>
        </div>
      </form>
    </DashboardLayout>
  );
}
