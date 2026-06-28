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

const DUMMY_ASSET: AssetDetail = {
  id: 'asset-demo-001',
  title: 'Honda Brio Satya 1.2 E 2021',
  category: 'Kendaraan',
  condition: 'used',
  description:
    'Honda Brio Satya tahun 2021, tangan pertama, kilometer rendah 28.000 km, warna Midnight Black. Surat-surat lengkap dan asli.',
  base_price: 115_000_000,
  status: 'pending_inspection',
  provider_name: 'PT Astra Auto Financial',
  photos: [],
  created_at: '2026-06-01T10:30:00Z',
};

const DUMMY_INSPECTION: InspectionReport = {
  engine_grade: 'B',
  interior_grade: 'A',
  exterior_grade: 'B',
  recommended_base_price: 115_000_000,
  notes:
    'Mesin berfungsi prima. Oli mesin bersih. Terdapat sedikit goresan halus di dekat gagang pintu pengemudi. AC berfungsi sangat baik.',
  inspected_by: 'Rudi Appraisal (Staf Inspeksi)',
  inspected_at: '2026-06-09T11:00:00Z',
};

const DUMMY_BAST: BastInfo = {
  bast_number: 'BAST-TJ/2026/06/102',
  received_at: '2026-06-09T11:30:00Z',
  delivered_by: 'Driver PT Astra Auto (Budi)',
  received_by: 'Jaka (Staf Gudang Balai Lelang)',
  warehouse: 'Gudang Jakarta (HQ)',
  signed: true,
};

export default function AssetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const assetId = params?.id as string;

  const [asset, setAsset] = useState<AssetDetail | null>(null);
  const [inspection, setInspection] = useState<InspectionReport | null>(null);
  const [bast, setBast] = useState<BastInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(apiUrl(`/assets/${assetId}`), {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          setAsset(data.data);
        } else {
          setAsset(DUMMY_ASSET);
          setInspection(DUMMY_INSPECTION);
          setBast(DUMMY_BAST);
          setInspectionForm({
            engine_grade: DUMMY_INSPECTION.engine_grade,
            interior_grade: DUMMY_INSPECTION.interior_grade,
            exterior_grade: DUMMY_INSPECTION.exterior_grade,
            recommended_base_price: String(DUMMY_INSPECTION.recommended_base_price),
            notes: DUMMY_INSPECTION.notes,
          });
        }
      } catch {
        setAsset(DUMMY_ASSET);
        setInspection(DUMMY_INSPECTION);
        setBast(DUMMY_BAST);
        setInspectionForm({
          engine_grade: DUMMY_INSPECTION.engine_grade,
          interior_grade: DUMMY_INSPECTION.interior_grade,
          exterior_grade: DUMMY_INSPECTION.exterior_grade,
          recommended_base_price: String(DUMMY_INSPECTION.recommended_base_price),
          notes: DUMMY_INSPECTION.notes,
        });
      } finally {
        setLoading(false);
      }
    };

    if (assetId) fetchData();
  }, [assetId]);

  const handleSaveInspection = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
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
        <Button variant="outline" onClick={() => router.push('/assets')}>
          ← Kembali
        </Button>
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
