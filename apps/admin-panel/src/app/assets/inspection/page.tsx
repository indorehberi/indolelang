"use client";

import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import { apiFetch } from '../../../lib/api';

interface Asset {
  id: string;
  title: string;
  category: string;
  provider_id?: string;
  base_price: number;
  created_at: string;
  police_number?: string;
  brand?: string;
  model?: string;
  color?: string;
  fuel_type?: string;
  transmission?: string;
  body_type?: string;
  year?: number;
  bpkb_number?: string;
  frame_number?: string;
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
  { value: 'N/A', label: 'N/A — Tidak Tersedia' },
  { value: 'A', label: 'A — Sangat Baik' },
  { value: 'B', label: 'B — Baik' },
  { value: 'C', label: 'C — Cukup' },
  { value: 'D', label: 'D — Kurang' },
  { value: 'E', label: 'E — Buruk' },
];

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="form-group">
    <label className="form-label">{label}</label>
    {children}
  </div>
);

export default function AssetsInspectionPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [processing, setProcessing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const [formData, setFormData] = useState({
    inspection_pic_name: '',
    grade_interior: 'A',
    grade_exterior: 'A',
    grade_engine: 'A',
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

  const fetchPendingAssets = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/assets?status=pending&per_page=100');
      const data = await res.json();
      if (res.ok && data.success) setAssets(data.data || []);
      else setAssets([]);
    } catch (err) {
      console.error(err);
      setAssets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPendingAssets(); }, []);

  const openInspection = (asset: Asset) => {
    setSelectedAsset(asset);
    setRejectionReason('');
    let picName = '';
    try {
      const stored = localStorage.getItem('user');
      if (stored) picName = JSON.parse(stored).full_name || '';
    } catch (e) {}
    setFormData({
      inspection_pic_name: picName,
      grade_interior: 'A',
      grade_exterior: 'A',
      grade_engine: 'A',
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

  const buildInspectPayload = () => ({
    inspection_date: new Date().toISOString(),
    inspection_pic_name: formData.inspection_pic_name || undefined,
    grade_interior: formData.grade_interior || undefined,
    grade_exterior: formData.grade_exterior || undefined,
    grade_engine: formData.grade_engine || undefined,
    category: formData.category || undefined,
    brand: formData.brand || undefined,
    model: formData.model || undefined,
    color: formData.color || undefined,
    fuel_type: formData.fuel_type || undefined,
    transmission: formData.transmission || undefined,
    body_type: formData.body_type || undefined,
    year: formData.year ? parseInt(formData.year, 10) : undefined,
    police_number: formData.police_number || undefined,
    bpkb_number: formData.bpkb_number || undefined,
    frame_number: formData.frame_number || undefined,
    cylinder: formData.cylinder ? parseInt(formData.cylinder, 10) : undefined,
    odometer: formData.odometer ? parseInt(formData.odometer, 10) : undefined,
  });

  const handleApprove = async () => {
    if (!selectedAsset) return;
    setProcessing(true);
    try {
      const inspectRes = await apiFetch(`/admin/assets/${selectedAsset.id}/inspect`, {
        method: 'PUT',
        body: JSON.stringify(buildInspectPayload()),
      });
      const inspectData = await inspectRes.json();
      if (!inspectRes.ok) throw new Error(inspectData.error?.message || 'Gagal melakukan inspeksi');

      const res = await apiFetch(`/admin/assets/${selectedAsset.id}/approve`, { method: 'PUT' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Gagal menyetujui unit');
      showToast('success', `Unit "${selectedAsset.title}" diinspeksi dan disetujui`);
      setShowModal(false);
      setSelectedAsset(null);
      fetchPendingAssets();
    } catch (err: any) {
      showToast('error', err?.message || 'Terjadi kesalahan');
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
    setProcessing(true);
    try {
      const res = await apiFetch(`/admin/assets/${selectedAsset.id}/reject`, {
        method: 'PUT',
        body: JSON.stringify({ reason: rejectionReason.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Gagal menolak unit');
      showToast('success', 'Unit ditolak. Provider telah diberitahu.');
      setShowModal(false);
      setSelectedAsset(null);
      fetchPendingAssets();
    } catch (err: any) {
      showToast('error', err?.message || 'Terjadi kesalahan');
    } finally {
      setProcessing(false);
    }
  };

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);
  };

  return (
    <DashboardLayout>
      {toast && (
        <div style={{
          position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 9999,
          padding: '0.875rem 1.25rem', borderRadius: '0.75rem',
          background: toast.type === 'success' ? '#22c55e' : '#ef4444',
          color: '#fff', fontWeight: 600, boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          maxWidth: '420px',
        }}>
          {toast.message}
        </div>
      )}

      <div className="page-header">
        <div>
          <h1 className="page-title">Inspeksi Unit</h1>
          <p className="page-subtitle">Lakukan inspeksi dan verifikasi kelayakan unit dari provider.</p>
        </div>
        <Button variant="outline" onClick={fetchPendingAssets} disabled={loading}>🔄 Refresh</Button>
      </div>

      <Card title={`Daftar Menunggu Inspeksi${!loading ? ` (${assets.length})` : ''}`}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--wf-text-muted)' }}>⏳ Memuat data...</div>
        ) : assets.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--wf-text-muted)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>✅</div>
            <div style={{ fontWeight: 600 }}>Tidak ada unit yang menunggu inspeksi</div>
            <div style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>Semua pengajuan unit sudah diproses.</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Unit</th>
                  <th>No. Polisi</th>
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
                      <div style={{ fontWeight: 600 }}>{asset.title}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--wf-text-muted)', marginTop: '2px' }}>ID: {asset.id.split('-')[0]}...</div>
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>{asset.police_number || '-'}</td>
                    <td><Badge variant="info">{asset.category.replace('_', ' ')}</Badge></td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--wf-text-muted)' }}>{asset.provider_id?.split('-')[0]}...</td>
                    <td style={{ fontWeight: 600 }}>{formatRupiah(asset.base_price)}</td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--wf-text-muted)' }}>{new Date(asset.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                    <td style={{ textAlign: 'right' }}>
                      <Button size="sm" variant="primary" onClick={() => openInspection(asset)}>🔍 Inspeksi</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {showModal && selectedAsset && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.55)', padding: '1rem' }}>
          <div style={{ background: 'var(--wf-bg-primary, #fff)', borderRadius: '1rem', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', width: '100%', maxWidth: '860px', maxHeight: '92vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--wf-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>📋 Formulir Inspeksi Unit</h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--wf-text-muted)', margin: '0.2rem 0 0' }}>{selectedAsset.title}</p>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.4rem', color: 'var(--wf-text-muted)', padding: '0 0.25rem', lineHeight: 1 }}>×</button>
            </div>

            <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <Card title="1. Detail Inspeksi">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                  <Field label="PIC Inspeksi (Nama Petugas)">
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Nama petugas yang melakukan inspeksi"
                      value={formData.inspection_pic_name}
                      onChange={(e) => setFormData({ ...formData, inspection_pic_name: e.target.value })}
                    />
                  </Field>
                  <Field label="Grade Interior">
                    <select
                      className="form-select"
                      value={formData.grade_interior}
                      onChange={(e) => setFormData({ ...formData, grade_interior: e.target.value })}
                    >
                      {GRADE_OPTIONS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
                    </select>
                  </Field>
                  <Field label="Grade Eksterior">
                    <select
                      className="form-select"
                      value={formData.grade_exterior}
                      onChange={(e) => setFormData({ ...formData, grade_exterior: e.target.value })}
                    >
                      {GRADE_OPTIONS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
                    </select>
                  </Field>
                  <Field label="Grade Mesin">
                    <select
                      className="form-select"
                      value={formData.grade_engine}
                      onChange={(e) => setFormData({ ...formData, grade_engine: e.target.value })}
                    >
                      {GRADE_OPTIONS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
                    </select>
                  </Field>
                </div>
              </Card>

              <Card title="2. Data Unit (dari pengajuan)">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                  <Field label="Kategori">
                    <input type="text" className="form-input" value={formData.category} disabled />
                  </Field>
                  <Field label="Merek">
                    <input type="text" className="form-input" value={formData.brand} disabled />
                  </Field>
                  <Field label="Tipe / Model">
                    <input type="text" className="form-input" value={formData.model} disabled />
                  </Field>
                  <Field label="Warna">
                    <input type="text" className="form-input" value={formData.color} disabled />
                  </Field>
                  <Field label="Bahan Bakar">
                    <input type="text" className="form-input" value={formData.fuel_type} disabled />
                  </Field>
                  <Field label="Transmisi">
                    <input type="text" className="form-input" value={formData.transmission} disabled />
                  </Field>
                  <Field label="Jenis Body">
                    <input type="text" className="form-input" value={formData.body_type} disabled />
                  </Field>
                  <Field label="Tahun Buat">
                    <input type="text" className="form-input" value={formData.year} disabled />
                  </Field>
                  <Field label="Odometer (KM)">
                    <input type="text" className="form-input" value={formData.odometer} disabled />
                  </Field>
                </div>
              </Card>

              <Card title="3. Nomor Identifikasi (dari pengajuan)">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                  <Field label="No Polisi">
                    <input type="text" className="form-input" value={formData.police_number} disabled />
                  </Field>
                  <Field label="No BPKB">
                    <input type="text" className="form-input" value={formData.bpkb_number} disabled />
                  </Field>
                  <Field label="No Rangka">
                    <input type="text" className="form-input" value={formData.frame_number} disabled />
                  </Field>
                  <Field label="Kapasitas Mesin (CC)">
                    <input type="text" className="form-input" value={formData.cylinder} disabled />
                  </Field>
                </div>
              </Card>

              <Card title="4. Foto Fisik Unit">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem' }}>
                  {[
                    { key: 'photo_front', label: 'Depan' },
                    { key: 'photo_back', label: 'Belakang' },
                    { key: 'photo_right', label: 'Kanan' },
                    { key: 'photo_left', label: 'Kiri' },
                    { key: 'photo_engine', label: 'Mesin' },
                    { key: 'photo_interior', label: 'Interior' },
                    { key: 'photo_stnk', label: 'STNK' },
                  ].map((photo) => {
                    const url = selectedAsset?.[photo.key as keyof Asset] as string | undefined;
                    return (
                      <div key={photo.key} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--wf-text-secondary)' }}>{photo.label}</span>
                        {url ? (
                          <a href={url} target="_blank" rel="noopener noreferrer" style={{ width: '100%', aspectRatio: '4/3', backgroundColor: '#f1f5f9', borderRadius: '0.5rem', overflow: 'hidden', border: '1px solid var(--wf-border)', display: 'block' }}>
                            <img src={url} alt={photo.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </a>
                        ) : (
                          <div style={{ width: '100%', aspectRatio: '4/3', backgroundColor: '#f1f5f9', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed var(--wf-border)', color: 'var(--wf-text-muted)', fontSize: '0.8rem' }}>
                            Tidak ada foto
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Card>

              <Card title="5. Alasan Penolakan (isi jika akan menolak)">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <textarea
                    className="form-textarea"
                    rows={3}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Contoh: Foto mesin buram, nomor rangka tidak terbaca, kondisi tidak sesuai deskripsi..."
                  />
                  <span className="form-hint">Kosongkan jika unit akan disetujui. Wajib diisi jika menekan tombol &ldquo;Tolak&rdquo;.</span>
                </div>
              </Card>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', padding: '1rem', borderTop: '1px solid var(--wf-border)' }}>
              <Button variant="outline" onClick={() => setShowModal(false)} disabled={processing}>Batal</Button>
              <Button variant="danger" onClick={handleReject} disabled={processing}>{processing ? 'Memproses...' : '❌ Tolak Unit'}</Button>
              <Button variant="primary" onClick={handleApprove} disabled={processing}>{processing ? 'Memproses...' : '✅ Setujui Unit'}</Button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
