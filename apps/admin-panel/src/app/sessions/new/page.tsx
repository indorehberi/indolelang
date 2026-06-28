'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Toast from '../../../components/ui/Toast';
import { apiUrl } from '../../../lib/api';

interface Branch {
  id: string;
  name: string;
  city: string;
}

export default function NewSessionPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [branches, setBranches] = useState<Branch[]>([]);
  
  // Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [branchId, setBranchId] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'danger' } | null>(null);

  const dummyBranches: Branch[] = [
    { id: 'Jakarta-Branch-ID-Fallback', name: 'Indo-Lelang Jakarta', city: 'Jakarta' },
    { id: 'Surabaya-Branch-ID-Fallback', name: 'Indo-Lelang Surabaya', city: 'Surabaya' },
  ];

  // Fetch branches
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const response = await fetch(apiUrl('/branches'));
        const data = await response.json();
        if (response.ok && data.success) {
          setBranches(data.data);
          if (data.data.length > 0) setBranchId(data.data[0].id);
        } else {
          setBranches(dummyBranches);
          setBranchId(dummyBranches[0].id);
        }
      } catch (err) {
        setBranches(dummyBranches);
        setBranchId(dummyBranches[0].id);
      }
    };
    fetchBranches();
  }, []);

  const handleNext = () => {
    if (step === 1) {
      if (!title.trim() || title.length < 5) {
        alert('Judul sesi minimal 5 karakter');
        return;
      }
      if (!branchId) {
        alert('Cabang wajib dipilih');
        return;
      }
    } else if (step === 2) {
      if (!scheduledDate || !scheduledTime) {
        alert('Tanggal dan waktu jadwal wajib diisi');
        return;
      }
      const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
      if (scheduledDateTime.getTime() < Date.now()) {
        alert('Jadwal lelang tidak boleh di masa lalu');
        return;
      }
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setToast(null);

    // Build ISO timestamp
    const scheduled_at = new Date(`${scheduledDate}T${scheduledTime}`).toISOString();

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(apiUrl('/admin/sessions'), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          branch_id: branchId,
          title,
          description: description || undefined,
          scheduled_at,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || 'Gagal membuat sesi lelang');
      }

      setToast({ message: 'Sesi lelang berhasil dibuat!', variant: 'success' });
      setTimeout(() => {
        router.push('/sessions');
      }, 1500);
    } catch (err: any) {
      setToast({ message: err.message || 'Terjadi kesalahan sistem', variant: 'danger' });
      setLoading(false);
    }
  };

  const selectedBranchName = branches.find((b) => b.id === branchId)?.name || '';

  return (
    <DashboardLayout breadcrumbParent="Lelang" breadcrumbCurrent="Buat Sesi">
      {toast && (
        <Toast
          message={toast.message}
          variant={toast.variant}
          onClose={() => setToast(null)}
        />
      )}

      <div className="mb-3">
        <h1 className="page-title">Buat Sesi Lelang Baru</h1>
        <p className="page-subtitle">Jadwalkan pelaksaan lelang digital baru melalui wizard langkah-demi-langkah.</p>
      </div>

      {/* Progress Wizard Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          maxWidth: '600px',
          margin: '0 auto 2rem auto',
          position: 'relative',
        }}
      >
        {/* Line Connector */}
        <div
          style={{
            position: 'absolute',
            top: '20px',
            left: '10%',
            right: '10%',
            height: '2px',
            background: 'var(--wf-border)',
            zIndex: '1',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '20px',
            left: '10%',
            width: step === 1 ? '0%' : step === 2 ? '50%' : '100%',
            height: '2px',
            background: 'var(--wf-primary)',
            zIndex: '2',
            transition: 'width 0.3s ease-in-out',
          }}
        />

        {/* Step Items */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: '3' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: step >= 1 ? 'var(--wf-primary)' : 'var(--wf-white)',
              color: step >= 1 ? '#fff' : 'var(--wf-text-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              border: '2px solid var(--wf-primary)',
            }}
          >
            1
          </div>
          <span style={{ fontSize: '0.8rem', marginTop: '0.5rem', fontWeight: step === 1 ? 'bold' : 'normal' }}>Informasi</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: '3' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: step >= 2 ? 'var(--wf-primary)' : 'var(--wf-white)',
              color: step >= 2 ? '#fff' : 'var(--wf-text-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              border: step >= 2 ? '2px solid var(--wf-primary)' : '2px solid var(--wf-border)',
            }}
          >
            2
          </div>
          <span style={{ fontSize: '0.8rem', marginTop: '0.5rem', fontWeight: step === 2 ? 'bold' : 'normal' }}>Jadwal</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: '3' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: step >= 3 ? 'var(--wf-primary)' : 'var(--wf-white)',
              color: step >= 3 ? '#fff' : 'var(--wf-text-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              border: step >= 3 ? '2px solid var(--wf-primary)' : '2px solid var(--wf-border)',
            }}
          >
            3
          </div>
          <span style={{ fontSize: '0.8rem', marginTop: '0.5rem', fontWeight: step === 3 ? 'bold' : 'normal' }}>Konfirmasi</span>
        </div>
      </div>

      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <Card>
          <form onSubmit={handleSubmit}>
            {/* STEP 1: Informasi Sesi */}
            {step === 1 && (
              <div>
                <h3 className="mb-2" style={{ borderBottom: '1px solid var(--wf-border)', paddingBottom: '0.5rem' }}>
                  Langkah 1: Informasi Sesi
                </h3>
                
                <div className="mb-2">
                  <label className="form-label" style={{ fontWeight: 'bold' }}>
                    Cabang Penyelenggara <span className="text-danger">*</span>
                  </label>
                  <select
                    className="form-select"
                    style={{
                      width: '100%',
                      height: '40px',
                      padding: '0 0.5rem',
                      borderRadius: 'var(--radius)',
                      border: '1px solid var(--wf-border)',
                      background: 'white',
                    }}
                    value={branchId}
                    onChange={(e) => setBranchId(e.target.value)}
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.city})
                      </option>
                    ))}
                  </select>
                </div>

                <Input
                  label="Judul Sesi Lelang"
                  type="text"
                  required
                  placeholder="Contoh: Lelang Kendaraan Mobil SUV Jakarta Barat"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />

                <div className="mb-2">
                  <label className="form-label" style={{ fontWeight: 'bold' }}>Deskripsi Sesi (Opsional)</label>
                  <textarea
                    className="form-control"
                    style={{
                      width: '100%',
                      minHeight: '100px',
                      padding: '0.5rem',
                      border: '1px solid var(--wf-border)',
                      borderRadius: 'var(--radius)',
                      fontFamily: 'inherit',
                    }}
                    placeholder="Contoh: Lelang menampilkan unit sitaan bank berstatus siap jalan..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div className="d-flex justify-end mt-3">
                  <Button type="button" variant="primary" onClick={handleNext}>
                    Lanjut &raquo;
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 2: Jadwal Lelang */}
            {step === 2 && (
              <div>
                <h3 className="mb-2" style={{ borderBottom: '1px solid var(--wf-border)', paddingBottom: '0.5rem' }}>
                  Langkah 2: Atur Jadwal Pelaksanaan
                </h3>

                <Input
                  label="Tanggal Pelaksanaan"
                  type="date"
                  required
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                />

                <Input
                  label="Jam Mulai (WIB)"
                  type="time"
                  required
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                />

                <div className="d-flex justify-between mt-3">
                  <Button type="button" variant="outline" onClick={handleBack}>
                    &laquo; Kembali
                  </Button>
                  <Button type="button" variant="primary" onClick={handleNext}>
                    Lanjut &raquo;
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 3: Review & Submit */}
            {step === 3 && (
              <div>
                <h3 className="mb-2" style={{ borderBottom: '1px solid var(--wf-border)', paddingBottom: '0.5rem' }}>
                  Langkah 3: Konfirmasi & Simpan
                </h3>

                <div
                  style={{
                    background: 'var(--wf-bg)',
                    padding: '1.5rem',
                    borderRadius: 'var(--radius)',
                    marginBottom: '1.5rem',
                  }}
                >
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid var(--wf-border)' }}>
                        <td style={{ padding: '0.75rem 0', fontWeight: '600', color: 'var(--wf-text-light)' }}>Cabang</td>
                        <td style={{ padding: '0.75rem 0', fontWeight: 'bold' }}>{selectedBranchName}</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid var(--wf-border)' }}>
                        <td style={{ padding: '0.75rem 0', fontWeight: '600', color: 'var(--wf-text-light)' }}>Judul Sesi</td>
                        <td style={{ padding: '0.75rem 0', fontWeight: 'bold' }}>{title}</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid var(--wf-border)' }}>
                        <td style={{ padding: '0.75rem 0', fontWeight: '600', color: 'var(--wf-text-light)' }}>Deskripsi</td>
                        <td style={{ padding: '0.75rem 0' }}>{description || '-'}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '0.75rem 0', fontWeight: '600', color: 'var(--wf-text-light)' }}>Jadwal Sesi</td>
                        <td style={{ padding: '0.75rem 0', fontWeight: 'bold', color: 'var(--wf-primary)' }}>
                          {scheduledDate ? new Date(`${scheduledDate}T${scheduledTime}`).toLocaleString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          }) : '-'} WIB
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="d-flex justify-between mt-3">
                  <Button type="button" variant="outline" onClick={handleBack} disabled={loading}>
                    &laquo; Kembali
                  </Button>
                  <Button type="submit" variant="primary" disabled={loading}>
                    {loading ? 'Menyimpan Sesi...' : 'Simpan & Jadwalkan Sesi'}
                  </Button>
                </div>
              </div>
            )}
          </form>
        </Card>
      </div>
    </DashboardLayout>
  );
}
