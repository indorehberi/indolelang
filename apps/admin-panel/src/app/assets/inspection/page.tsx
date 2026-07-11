'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import { apiFetch } from '../../../lib/api';

interface Asset {
  id: string;
  provider_id: string;
  category: string;
  title: string;
  description?: string;
  base_price: number;
  images?: string[];
  status: 'pending' | 'inspected' | 'approved' | 'listed' | 'sold' | 'returned';
  created_at: string;
  brand?: string;
  model?: string;
  color?: string;
  fuel_type?: string;
  transmission?: string;
  body_type?: string;
  year?: number;
  police_number?: string;
  bpkb_number?: string;
  frame_number?: string;
  engine_number?: string;
  cylinder?: number;
  odometer?: number;
  photo_front?: string;
  photo_back?: string;
  photo_right?: string;
  photo_left?: string;
  photo_engine?: string;
  photo_interior?: string;
  photo_stnk?: string;
}

const GRADE_OPTIONS = [
  { value: 'A', label: 'A — Sangat Baik' },
  { value: 'B', label: 'B — Baik' },
  { value: 'C', label: 'C — Cukup' },
  { value: 'D', label: 'D — Kurang' },
  { value: 'E', label: 'E — Buruk' },
];

const FUEL_OPTIONS = ['Bensin', 'Solar', 'Hybrid', 'EV', 'Gas'];
const TRANSMISSION_OPTIONS = ['Manual', 'Otomatis', 'CVT', 'DCT'];
const BODY_OPTIONS = ['Sedan', 'SUV', 'MPV', 'Hatchback', 'Pick Up', 'Truk', 'Bus', 'Sport', 'Lainnya'];

const Field = ({ label, required, error, children }: {
  label: string; required?: boolean; error?: string; children: React.ReactNode;
}) => (
  <div className="form-group">
    <label className="form-label">
      {label}{required && <span style={{ color: '#ef4444', marginLeft: '2px' }}>*</span>}
    </label>
    {children}
    {error && <span className="form-error">{error}</span>}
  </div>
);

export default function AssetsInspectionPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [processing, setProcessing] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    inspection_date: new Date().toISOString().split('T')[0] + 'T00:00:00Z',
    inspection_pic_name: '',
    grade_interior: 'A',
    grade_exterior: 'A',
    grade_engine: 'A',
    inspection_doc_url: '',
    category: '',
    brand: '',
    model: '',
    color: '',
    fuel_type: '',
    transmission: '',
    body_type: '',
    year: '',
    police_number: '',
    bpkb_number: '',
    frame_number: '',
    cylinder: '',
    odometer: '',
  });

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        const u = JSON.parse(stored);
        setFormData((prev) => ({ ...prev, inspection_pic_name: u.full_name || '' }));
      }
    } catch (e) {}
  }, []);

  const fetchPendingAssets = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/assets?status=pending&per_page=100');
      const data = await res.json();
      if (res.ok && data.success) setAssets(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPendingAssets(); }, []);

  const openInspection = (asset: Asset) => {
    setSelectedAsset(asset);
    setRejectionReason('');
    setErrors({});
    let picName = '';
    try {
      const stored = localStorage.getItem('user');
      if (stored) picName = JSON.parse(stored).full_name || '';
    } catch (e) {}
    setFormData({
      inspection_date: new Date().toISOString().split('T')[0] + 'T00:00:00Z',
      inspection_pic_name: picName,
      grade_interior: 'A',
      grade_exterior: 'A',
      grade_engine: 'A',
      inspection_doc_url: '',
      category: asset.category || '',
      brand: asset.brand || '',
      model: asset.model || '',
      color: asset.color || '',
      fuel_type: asset.fuel_type || '',
      transmission: asset.transmission || '',
      body_type: asset.body_type || '',
      year: asset.year ? String(asset.year) : '',
      police_number: asset.police_number || '',
      bpkb_number: asset.bpkb_number || '',
      frame_number: asset.frame_number || '',
      cylinder: asset.cylinder ? String(asset.cylinder) : '',
      odometer: asset.odometer ? String(asset.odometer) : '',
    });
    setShowModal(true);
  };

  const validateForm = () => {
    const e: Record<string, string> = {};
    if (!formData.inspection_pic_name.trim()) e.inspection_pic_name = 'PIC Inspeksi wajib diisi';
    if (!formData.category) e.category = 'Kategori wajib dipilih';
    if (!formData.brand.trim()) e.brand = 'Merek wajib diisi';
    if (!formData.model.trim()) e.model = 'Tipe/Model wajib diisi';
    if (!formData.color.trim()) e.color = 'Warna wajib diisi';
    if (!formData.fuel_type) e.fuel_type = 'Bahan bakar wajib dipilih';
    if (!formData.transmission) e.transmission = 'Transmisi wajib dipilih';
    if (!formData.body_type) e.body_type = 'Jenis body wajib dipilih';
    if (!formData.year) e.year = 'Tahun wajib diisi';
    if (!formData.police_number.trim()) e.police_number = 'No Polisi wajib diisi';
    if (!formData.bpkb_number.trim()) e.bpkb_number = 'No BPKB wajib diisi';
    if (!formData.frame_number.trim()) e.frame_number = 'No Rangka wajib diisi';
    if (!formData.cylinder) e.cylinder = 'CC wajib diisi';
    if (!formData.odometer && formData.odometer !== '0') e.odometer = 'Odometer wajib diisi';
    return e;
  };

  const handleUploadDoc = async (file: File | null) => {
    if (!file) return;
    setUploadingDoc(true);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await apiFetch('/upload/single', {
        method: 'POST',
        body: fd,
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setFormData((prev) => ({ ...prev, inspection_doc_url: data.data.url }));
        showToast('success', 'Dokumen inspeksi berhasil diunggah');
      } else {
        showToast('error', data.error?.message || 'Gagal mengunggah dokumen');
      }
    } catch {
      showToast('error', 'Koneksi gagal saat mengunggah dokumen');
    } finally {
      setUploadingDoc(false);
    }
  };

  const submitInspection = async () => {
    if (!selectedAsset) return;
    const payload = {
      ...formData,
      year: parseInt(formData.year),
      cylinder: parseInt(formData.cylinder),
      odometer: parseInt(formData.odometer),
    };
    const res = await apiFetch(`/admin/assets/${selectedAsset.id}/inspect`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      // Show server field errors inline
      if (data.error?.details && typeof data.error.details === 'object') {
        setErrors(data.error.details);
      }
      throw new Error(data.error?.message || 'Gagal melakukan inspeksi');
    }
  };

  const handleApprove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAsset) return;
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    setProcessing(true);
    try {
      await submitInspection();
      const res = await apiFetch(`/admin/assets/${selectedAsset.id}/approve`, { method: 'PUT' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Gagal menyetujui barang');
      showToast('success', `✅ Barang "${selectedAsset.title}" diinspeksi dan disetujui!`);
      setShowModal(false);
      fetchPendingAssets();
    } catch (err: any) {
      showToast('error', err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedAsset) return;
    if (!rejectionReason.trim()) {
      showToast('error', 'Alasan penolakan wajib diisi');
      return;
    }
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      showToast('error', 'Lengkapi form inspeksi sebelum menolak');
      return;
    }
    setErrors({});
    setProcessing(true);
    try {
      await submitInspection();
      const res = await apiFetch(`/admin/assets/${selectedAsset.id}/reject`, {
        method: 'PUT',
        body: JSON.stringify({ reason: rejectionReason.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Gagal menolak barang');
      showToast('success', '❌ Barang ditolak. Provider telah diberitahu.');
      setShowModal(false);
      fetchPendingAssets();
    } catch (err: any) {
      showToast('error', err.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <DashboardLayout>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 9999,
          padding: '0.875rem 1.25rem', borderRadius: '0.75rem',
          background: toast.type === 'success' ? '#22c55e' : '#ef4444',
          color: '#fff', fontWeight: 600, boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem',
          maxWidth: '420px',
        }}>
          {toast.message}
        </div>
      )}

      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Inspeksi Barang</h1>
          <p className="page-subtitle">Lakukan inspeksi dan verifikasi kelayakan barang dari provider.</p>
        </div>
        <Button variant="outline" onClick={fetchPendingAssets} disabled={loading}>
          🔄 Refresh
        </Button>
      </div>

      {/* Asset List */}
      <Card title={`Daftar Menunggu Inspeksi${!loading ? ` (${assets.length})` : ''}`}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--wf-text-muted)' }}>
            ⏳ Memuat data...
          </div>
        ) : assets.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--wf-text-muted)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>✅</div>
            <div style={{ fontWeight: 600 }}>Tidak ada barang yang menunggu inspeksi</div>
            <div style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>Semua pengajuan barang sudah diproses.</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Barang</th>
                  <th>Kategori</th>
                  <th>Provider</th>
                  <th>Harga Dasar</th>
                  <th>Tanggal Masuk</th>
                  <th style={{ textAlign: 'right' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {assets.map((asset) => (
                  <tr key={asset.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--wf-text-primary)' }}>{asset.title}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--wf-text-muted)', marginTop: '2px' }}>
                        ID: {asset.id.split('-')[0]}...
                      </div>
                    </td>
                    <td>
                      <Badge variant="info">{asset.category.replace('_', ' ')}</Badge>
                    </td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--wf-text-muted)' }}>
                      {asset.provider_id?.split('-')[0]}...
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      Rp {asset.base_price.toLocaleString('id-ID')}
                    </td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--wf-text-muted)' }}>
                      {new Date(asset.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Button size="sm" variant="primary" onClick={() => openInspection(asset)}>
                        🔍 Inspeksi
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ═══════════════════════════════════════════
          MODAL FORM INSPEKSI
      ═══════════════════════════════════════════ */}
      {showModal && selectedAsset && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.55)', padding: '1rem',
        }}>
          <div style={{
            background: 'var(--wf-bg-primary, #fff)',
            borderRadius: '1rem',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            width: '100%',
            maxWidth: '860px',
            maxHeight: '92vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid var(--wf-border)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
            }}>
              <div>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>📋 Formulir Inspeksi Barang</h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--wf-text-muted)', margin: '0.2rem 0 0' }}>
                  {selectedAsset.title}
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: '1.4rem', color: 'var(--wf-text-muted)',
                  padding: '0 0.25rem', lineHeight: 1,
                }}
              >×</button>
            </div>

            {/* Modal Body — scrollable */}
            <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
              <form id="inspectForm" onSubmit={handleApprove} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                {/* ── Section 1: Detail Inspeksi ── */}
                <Card title="1. Detail Inspeksi">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <Field label="Tanggal Inspeksi" required>
                      <input
                        type="datetime-local"
                        className="form-input"
                        value={formData.inspection_date.substring(0, 16)}
                        onChange={(e) => setFormData({ ...formData, inspection_date: e.target.value + ':00Z' })}
                      />
                    </Field>
                    <Field label="PIC Inspeksi (Nama Petugas)" required error={errors.inspection_pic_name}>
                      <input
                        type="text"
                        className={`form-input${errors.inspection_pic_name ? ' form-input-error' : ''}`}
                        placeholder="Nama petugas yang melakukan inspeksi"
                        value={formData.inspection_pic_name}
                        onChange={(e) => setFormData({ ...formData, inspection_pic_name: e.target.value })}
                      />
                    </Field>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                    <Field label="Grade Interior" required>
                      <select
                        className="form-select"
                        value={formData.grade_interior}
                        onChange={(e) => setFormData({ ...formData, grade_interior: e.target.value })}
                      >
                        {GRADE_OPTIONS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
                      </select>
                    </Field>
                    <Field label="Grade Eksterior" required>
                      <select
                        className="form-select"
                        value={formData.grade_exterior}
                        onChange={(e) => setFormData({ ...formData, grade_exterior: e.target.value })}
                      >
                        {GRADE_OPTIONS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
                      </select>
                    </Field>
                    <Field label="Grade Mesin" required>
                      <select
                        className="form-select"
                        value={formData.grade_engine}
                        onChange={(e) => setFormData({ ...formData, grade_engine: e.target.value })}
                      >
                        {GRADE_OPTIONS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
                      </select>
                    </Field>
                  </div>

                  <Field label="Dokumen Inspeksi (Opsional)">
                    <input
                      type="file"
                      className="form-input"
                      accept="image/*,.pdf"
                      disabled={uploadingDoc}
                      style={{ paddingTop: '0.45rem', cursor: uploadingDoc ? 'not-allowed' : 'pointer' }}
                      onChange={(e) => handleUploadDoc(e.target.files?.[0] || null)}
                    />
                    {uploadingDoc && (
                      <span className="form-hint">⏳ Mengunggah dokumen...</span>
                    )}
                    {formData.inspection_doc_url && !uploadingDoc && (
                      <span className="form-hint" style={{ color: '#22c55e' }}>✅ Dokumen tersimpan</span>
                    )}
                  </Field>
                </Card>

                {/* ── Section 2: Data Kendaraan ── */}
                <Card title="2. Data & Verifikasi Kendaraan">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                    <Field label="Kategori" required error={errors.category}>
                      <select
                        className={`form-select${errors.category ? ' form-input-error' : ''}`}
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      >
                        <option value="">Pilih Kategori</option>
                        <option value="mobil">Mobil</option>
                        <option value="motor">Motor</option>
                        <option value="alat_berat">Alat Berat</option>
                        <option value="properti">Properti</option>
                      </select>
                    </Field>
                    <Field label="Merek" required error={errors.brand}>
                      <input
                        type="text"
                        className={`form-input${errors.brand ? ' form-input-error' : ''}`}
                        placeholder="Toyota, Honda, dll."
                        value={formData.brand}
                        onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                      />
                    </Field>
                    <Field label="Tipe / Model" required error={errors.model}>
                      <input
                        type="text"
                        className={`form-input${errors.model ? ' form-input-error' : ''}`}
                        placeholder="Avanza, Civic, dll."
                        value={formData.model}
                        onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                      />
                    </Field>
                    <Field label="Warna" required error={errors.color}>
                      <input
                        type="text"
                        className={`form-input${errors.color ? ' form-input-error' : ''}`}
                        placeholder="Putih, Hitam, dll."
                        value={formData.color}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      />
                    </Field>
                    <Field label="Bahan Bakar" required error={errors.fuel_type}>
                      <select
                        className={`form-select${errors.fuel_type ? ' form-input-error' : ''}`}
                        value={formData.fuel_type}
                        onChange={(e) => setFormData({ ...formData, fuel_type: e.target.value })}
                      >
                        <option value="">Pilih Bahan Bakar</option>
                        {FUEL_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
                      </select>
                    </Field>
                    <Field label="Transmisi" required error={errors.transmission}>
                      <select
                        className={`form-select${errors.transmission ? ' form-input-error' : ''}`}
                        value={formData.transmission}
                        onChange={(e) => setFormData({ ...formData, transmission: e.target.value })}
                      >
                        <option value="">Pilih Transmisi</option>
                        {TRANSMISSION_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </Field>
                    <Field label="Jenis Body" required error={errors.body_type}>
                      <select
                        className={`form-select${errors.body_type ? ' form-input-error' : ''}`}
                        value={formData.body_type}
                        onChange={(e) => setFormData({ ...formData, body_type: e.target.value })}
                      >
                        <option value="">Pilih Body Type</option>
                        {BODY_OPTIONS.map((b) => <option key={b} value={b}>{b}</option>)}
                      </select>
                    </Field>
                    <Field label="Tahun Buat" required error={errors.year}>
                      <input
                        type="number"
                        className={`form-input${errors.year ? ' form-input-error' : ''}`}
                        placeholder="2020"
                        min={1900}
                        max={new Date().getFullYear()}
                        value={formData.year}
                        onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                      />
                    </Field>
                    <Field label="Odometer (KM)" required error={errors.odometer}>
                      <input
                        type="number"
                        className={`form-input${errors.odometer ? ' form-input-error' : ''}`}
                        placeholder="50000"
                        min={0}
                        value={formData.odometer}
                        onChange={(e) => setFormData({ ...formData, odometer: e.target.value })}
                      />
                    </Field>
                  </div>
                </Card>

                {/* ── Section 3: Nomor Identifikasi ── */}
                <Card title="3. Nomor Identifikasi">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                    <Field label="No Polisi" required error={errors.police_number}>
                      <input
                        type="text"
                        className={`form-input${errors.police_number ? ' form-input-error' : ''}`}
                        placeholder="B 1234 ABC"
                        value={formData.police_number}
                        onChange={(e) => setFormData({ ...formData, police_number: e.target.value })}
                      />
                    </Field>
                    <Field label="No BPKB" required error={errors.bpkb_number}>
                      <input
                        type="text"
                        className={`form-input${errors.bpkb_number ? ' form-input-error' : ''}`}
                        placeholder="Nomor BPKB"
                        value={formData.bpkb_number}
                        onChange={(e) => setFormData({ ...formData, bpkb_number: e.target.value })}
                      />
                    </Field>
                    <Field label="No Rangka" required error={errors.frame_number}>
                      <input
                        type="text"
                        className={`form-input${errors.frame_number ? ' form-input-error' : ''}`}
                        placeholder="Nomor Rangka"
                        value={formData.frame_number}
                        onChange={(e) => setFormData({ ...formData, frame_number: e.target.value })}
                      />
                    </Field>
                    <Field label="Kapasitas Mesin (CC)" required error={errors.cylinder}>
                      <input
                        type="number"
                        className={`form-input${errors.cylinder ? ' form-input-error' : ''}`}
                        placeholder="1500"
                        min={1}
                        value={formData.cylinder}
                        onChange={(e) => setFormData({ ...formData, cylinder: e.target.value })}
                      />
                    </Field>
                  </div>
                </Card>

                {/* ── Section 4: Foto Fisik Barang ── */}
                <Card title="4. Foto Fisik Barang">
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem' }}>
                    {[
                      { key: 'photo_front', label: 'Depan' },
                      { key: 'photo_back', label: 'Belakang' },
                      { key: 'photo_right', label: 'Kanan' },
                      { key: 'photo_left', label: 'Kiri' },
                      { key: 'photo_engine', label: 'Mesin' },
                      { key: 'photo_interior', label: 'Interior' },
                      { key: 'photo_stnk', label: 'STNK' }
                    ].map(photo => {
                      const url = selectedAsset?.[photo.key as keyof Asset] as string | undefined;
                      return (
                        <div key={photo.key} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--wf-text-secondary)' }}>{photo.label}</span>
                          {url ? (
                            <a href={url} target="_blank" rel="noopener noreferrer" style={{ 
                              width: '100%', 
                              aspectRatio: '4/3', 
                              backgroundColor: '#f1f5f9', 
                              borderRadius: '0.5rem', 
                              overflow: 'hidden',
                              border: '1px solid var(--wf-border)',
                              display: 'block'
                            }}>
                              <img src={url} alt={photo.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </a>
                          ) : (
                            <div style={{ 
                              width: '100%', 
                              aspectRatio: '4/3', 
                              backgroundColor: '#f1f5f9', 
                              borderRadius: '0.5rem', 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              border: '1px dashed var(--wf-border)',
                              color: 'var(--wf-text-muted)',
                              fontSize: '0.8rem'
                            }}>
                              Tidak ada foto
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </Card>

                {/* ── Section 5: Keputusan Tolak ── */}
                <Card title="5. Alasan Penolakan (isi jika akan menolak)">
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <textarea
                      className="form-textarea"
                      rows={3}
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Contoh: Foto mesin buram, nomor rangka tidak terbaca, kondisi tidak sesuai deskripsi..."
                    />
                    <span className="form-hint">
                      Kosongkan jika barang akan disetujui. Wajib diisi jika menekan tombol &ldquo;Tolak&rdquo;.
                    </span>
                  </div>
                </Card>

              </form>
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '1rem 1.5rem',
              borderTop: '1px solid var(--wf-border)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '0.75rem',
              background: 'var(--wf-bg-secondary, #f8fafc)',
            }}>
              <Button variant="outline" type="button" onClick={() => setShowModal(false)} disabled={processing}>
                Batal
              </Button>
              <Button
                variant="danger"
                type="button"
                disabled={processing}
                onClick={handleReject}
              >
                {processing ? 'Memproses...' : '❌ Tolak Barang'}
              </Button>
              <Button
                variant="primary"
                type="submit"
                form="inspectForm"
                disabled={processing}
              >
                {processing ? 'Memproses...' : '✅ Setujui Barang'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
