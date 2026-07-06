'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import { apiUrl } from '../../../lib/api';

interface AssetDetail {
  id: string;
  title: string;
  category: string;
  condition: string;
  description: string;
  base_price: number;
  status: string;
  provider_name: string;
  photos: string[];
  created_at: string;
}

interface InspectionReport {
  engine_grade: string;
  interior_grade: string;
  exterior_grade: string;
  recommended_base_price: number;
  notes: string;
  inspected_by: string;
  inspected_at: string;
}

interface BastInfo {
  bast_number: string;
  received_at: string;
  delivered_by: string;
  received_by: string;
  warehouse: string;
  signed: boolean;
}



export default function AssetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const assetId = params?.id as string;

  const [asset, setAsset] = useState<AssetDetail | null>(null);
  const [inspection, setInspection] = useState<InspectionReport | null>(null);
  const [bast, setBast] = useState<BastInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userRole, setUserRole] = useState<string>('');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [inspectionForm, setInspectionForm] = useState({
    engine_grade: 'B',
    interior_grade: 'A',
    exterior_grade: 'B',
    recommended_base_price: '',
    notes: '',
  });

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        setUserRole(user.role);
      }
    } catch(e) {}
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
        const res = await fetch(apiUrl(`/assets/${assetId}`), {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          setAsset(data.data);
        } else {
          setAsset(null);
          setInspection(null);
          setBast(null);
        }
      } catch {
        setAsset(null);
        setInspection(null);
        setBast(null);
      } finally {
        setLoading(false);
      }
    };

    if (assetId) fetchData();
  }, [assetId]);

  
  const handleApprove = async () => {
    if (!confirm('Apakah Anda yakin menyetujui barang ini?')) return;
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(apiUrl(`/admin/assets/${assetId}/approve`), {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        showToast('success', 'Barang disetujui');
        // reload data
        router.refresh();
        setTimeout(() => window.location.reload(), 1000);
      } else alert('Gagal menyetujui barang');
    } catch (err) { console.error(err); }
  };

  const handleReject = async () => {
    if (!confirm('Apakah Anda yakin menolak barang ini?')) return;
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(apiUrl(`/admin/assets/${assetId}/reject`), {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        showToast('success', 'Barang ditolak');
        router.refresh();
        setTimeout(() => window.location.reload(), 1000);
      } else alert('Gagal menolak barang');
    } catch (err) { console.error(err); }
  };

  const handleSaveInspection = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      const res = await fetch(apiUrl(`/assets/${assetId}/inspection`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(inspectionForm),
      });
      if (res.ok) {
        showToast('success', 'Laporan inspeksi berhasil disimpan');
      } else {
        showToast('error', 'Gagal menyimpan laporan inspeksi');
      }
    } catch {
      showToast('error', 'Koneksi ke server gagal');
    } finally {
      setSaving(false);
    }
  };

  const formatPrice = (v: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const GRADES = ['A (Sangat Baik)', 'B (Baik)', 'C (Cukup)', 'D (Buruk)'];

  if (loading) {
    return (
      <DashboardLayout>
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
          Memuat data barang...
        </div>
      </DashboardLayout>
    );
  }

  if (!asset) {
    return (
      <DashboardLayout>
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
          Barang tidak ditemukan.
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
          <h1 className="page-title">Detail Barang & Inspeksi</h1>
          <p className="page-subtitle">
            <span
              style={{ cursor: 'pointer', color: 'var(--primary)' }}
              onClick={() => router.push('/assets')}
            >
              Daftar Barang
            </span>{' '}
            &bull; Detail Barang
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button variant="outline" onClick={() => router.push('/assets')}>
            ← Kembali
          </Button>
          {['admin', 'superadmin'].includes(userRole) && asset.status === 'pending' && (
            <>
              <Button variant="success" onClick={handleApprove}>Approve</Button>
              <Button variant="danger" onClick={handleReject}>Reject</Button>
            </>
          )}
        </div>
      </div>

      {/* Asset info banner */}
      <Card title="">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              borderRadius: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
              flexShrink: 0,
            }}
          >
            🚗
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: '1.15rem', color: 'var(--text-primary)' }}>
              {asset.title}
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.2rem' }}>
              Provider: <strong>{asset.provider_name}</strong> &bull; Ditambahkan:{' '}
              {formatDate(asset.created_at)}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Badge variant="info">{asset.category}</Badge>
            <Badge
              variant={
                asset.status === 'approved'
                  ? 'success'
                  : asset.status === 'rejected'
                  ? 'danger'
                  : 'warning'
              }
            >
              {asset.status}
            </Badge>
          </div>
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem', marginTop: '1.25rem' }}>
        {/* Left: Inspection form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <Card title="Form Hasil Inspeksi Teknis (Appraisal)">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Nama Barang (readonly) */}
              <div className="form-group">
                <label className="form-label">Nama Barang / Kendaraan</label>
                <input type="text" className="form-input" value={asset.title} disabled style={{ opacity: 0.6 }} />
              </div>

              {/* Grade grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                {[
                  { key: 'engine_grade', label: 'Grade Mesin' },
                  { key: 'interior_grade', label: 'Grade Interior' },
                  { key: 'exterior_grade', label: 'Grade Eksterior' },
                ].map(({ key, label }) => (
                  <div className="form-group" key={key}>
                    <label className="form-label">{label}</label>
                    <select
                      className="form-select"
                      value={inspectionForm[key as keyof typeof inspectionForm]}
                      onChange={(e) => setInspectionForm({ ...inspectionForm, [key]: e.target.value })}
                    >
                      {GRADES.map((g) => (
                        <option key={g} value={g.charAt(0)}>
                          Grade {g}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              {/* Recommended base price */}
              <div className="form-group">
                <label className="form-label">Rekomendasi Harga Dasar Minimum</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Misal: Rp 115.000.000"
                  value={
                    inspectionForm.recommended_base_price
                      ? formatPrice(Number(inspectionForm.recommended_base_price))
                      : ''
                  }
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^0-9]/g, '');
                    setInspectionForm({ ...inspectionForm, recommended_base_price: raw });
                  }}
                />
              </div>

              {/* Notes */}
              <div className="form-group">
                <label className="form-label">Catatan Hasil Pemeriksaan Fisik</label>
                <textarea
                  className="form-textarea"
                  rows={4}
                  placeholder="Deskripsikan kondisi fisik barang secara lengkap..."
                  value={inspectionForm.notes}
                  onChange={(e) => setInspectionForm({ ...inspectionForm, notes: e.target.value })}
                />
              </div>

              {inspection && (
                <div
                  style={{
                    padding: '0.75rem',
                    background: 'var(--bg-secondary)',
                    borderRadius: '0.5rem',
                    fontSize: '0.8rem',
                    color: 'var(--text-secondary)',
                  }}
                >
                  Terakhir diinspeksi oleh <strong>{inspection.inspected_by}</strong> pada{' '}
                  {formatDate(inspection.inspected_at)}
                </div>
              )}

              <Button variant="primary" onClick={handleSaveInspection} disabled={saving}>
                {saving ? 'Menyimpan...' : '💾 Simpan Laporan Inspeksi'}
              </Button>
            </div>
          </Card>
        </div>

        {/* Right: BAST & Photos */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {bast && (
            <Card title="Serah Terima & BAST Titip Jual">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem', lineHeight: 1.8 }}>
                {[
                  { label: 'Status Fisik', value: <Badge variant="success">Diterima di {bast.warehouse}</Badge> },
                  { label: 'Tanggal Masuk', value: formatDate(bast.received_at) },
                  { label: 'Diserahkan Oleh', value: bast.delivered_by },
                  { label: 'Penerima', value: bast.received_by },
                  { label: 'Nomor BAST', value: bast.bast_number },
                  {
                    label: 'Tanda Tangan BAST',
                    value: bast.signed ? (
                      <Badge variant="success">Lengkap (Dual-Sign)</Badge>
                    ) : (
                      <Badge variant="warning">Belum Ditandatangani</Badge>
                    ),
                  },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '0.35rem' }}>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>• {label}</span>
                    <span style={{ color: 'var(--text-primary)' }}>{value}</span>
                  </div>
                ))}
              </div>
              <button
                style={{
                  marginTop: '1rem',
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid var(--border)',
                  borderRadius: '0.5rem',
                  background: 'transparent',
                  cursor: 'pointer',
                  color: 'var(--text-primary)',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                }}
              >
                📥 Unduh PDF BAST Titip Jual
              </button>
            </Card>
          )}

          {/* Photos */}
          <Card title="Foto Fisik Barang">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {['Tampak Depan', 'Nomor Rangka/Mesin', 'Tampak Samping'].map((label) => (
                <div
                  key={label}
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
                  📷 {label}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
