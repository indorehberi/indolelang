'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import { apiFetch } from '../../../lib/api';

const GRADE_OPTIONS = [
  { value: 'N/A', label: 'N/A — Tidak Tersedia' },
  { value: 'A', label: 'Grade A (Sangat Baik)' },
  { value: 'B', label: 'Grade B (Baik)' },
  { value: 'C', label: 'Grade C (Cukup)' },
  { value: 'D', label: 'Grade D (Kurang)' },
];

const FUEL_OPTIONS = ['N/A', 'BENSIN', 'SOLAR', 'HYBRID', 'EV'];
const TRANSMISSION_OPTIONS = ['N/A', 'OTOMATIS', 'MANUAL'];
const BODY_OPTIONS = ['N/A', 'SEDAN', 'SUV', 'MPV', 'HATCHBACK', 'PICK UP', 'TRUK', 'BUS', 'MINIBUS', 'MOTOR BEBEK', 'MOTOR MATIC', 'MOTOR SPORT'];
const BRAND_OPTIONS = ['N/A', 'TOYOTA', 'HONDA', 'DAIHATSU', 'SUZUKI', 'MITSUBISHI', 'NISSAN', 'MAZDA', 'ISUZU', 'WULING', 'HYUNDAI', 'KIA', 'MERCEDES-BENZ', 'BMW', 'FORD', 'BYD', 'CHERY', 'MG', 'NETA', 'AION', 'VINFAST', 'GEELY', 'XPENG', 'DENZA', 'LAINNYA'];
const CAR_MODELS_BY_BRAND: Record<string, string[]> = {
  TOYOTA: ['AVANZA', 'INNOVA', 'FORTUNER', 'ALPHARD', 'RUSH', 'AGYA', 'CALYA', 'YARIS', 'CAMRY', 'VIOS', 'COROLLA'],
  HONDA: ['BRIO', 'JAZZ', 'HR-V', 'CR-V', 'MOBILIO', 'BR-V', 'CIVIC', 'CITY', 'ACCORD'],
  DAIHATSU: ['XENIA', 'TERIOS', 'SIGRA', 'AYLA', 'GRAN MAX', 'LUXIO', 'SIRION'],
  SUZUKI: ['ERTIGA', 'XL7', 'IGNIS', 'BALENO', 'CARRY', 'JIMNY', 'S-CROSS'],
  MITSUBISHI: ['XPANDER', 'PAJERO SPORT', 'TRITON', 'L300', 'OUTLANDER'],
  NISSAN: ['GRAND LIVINA', 'SERENA', 'X-TRAIL', 'JUKE', 'MARCH', 'KICKS'],
  MAZDA: ['MAZDA2', 'MAZDA3', 'CX-3', 'CX-5', 'CX-9'],
  FORD: ['FIESTA', 'ECOSPORT', 'EVEREST', 'RANGER', 'FOCUS'],
  HYUNDAI: ['CRETA', 'PALISADE', 'SANTA FE', 'IONIQ 5', 'KONA', 'KONA ELECTRIC (BARU)', 'STARGAZER'],
  KIA: ['SONET', 'SELTOS', 'CARNIVAL', 'PICANTO', 'RIO'],
  WULING: ['CONFERO', 'CORTEZ', 'ALMAZ', 'AIR EV', 'BINGUOEV', 'CLOUD EV'],
  BMW: ['3 SERIES', '5 SERIES', '7 SERIES', 'X1', 'X3', 'X5'],
  'MERCEDES-BENZ': ['C-CLASS', 'E-CLASS', 'S-CLASS', 'GLC', 'GLE'],
  BYD: ['DOLPHIN', 'ATTO 3', 'SEAL', 'M6', 'SEALION 7'],
  CHERY: ['OMODA E5', 'J6 (ICAR 03)'],
  MG: ['MG4 EV', 'MG ZS EV'],
  NETA: ['V-II', 'X'],
  AION: ['Y PLUS', 'V', 'UT'],
  VINFAST: ['VF 3', 'VF 5', 'VF E34'],
  GEELY: ['EX5'],
  XPENG: ['G6', 'X9'],
  DENZA: ['D9']
};
const COLOR_OPTIONS = ['N/A', 'HITAM', 'PUTIH', 'SILVER', 'ABU-ABU', 'MERAH', 'BIRU', 'COKELAT', 'KUNING', 'HIJAU', 'LAINNYA'];

const PHOTO_FIELDS = [
  { key: "photo_front", label: "Foto Depan" },
  { key: "photo_back", label: "Foto Belakang" },
  { key: "photo_right", label: "Foto Samping Kanan" },
  { key: "photo_left", label: "Foto Samping Kiri" },
  { key: "photo_engine", label: "Foto Mesin" },
  { key: "photo_interior", label: "Foto Interior" },
  { key: "photo_stnk", label: "Foto STNK" },
] as const;

const Field = ({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode; }) => (
  <div className="form-group" style={{ marginBottom: '1rem' }}>
    <label className="form-label" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
      {label}{required && <span style={{ color: '#ef4444', marginLeft: '2px' }}>*</span>}
    </label>
    {children}
    {error && <span className="form-error" style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>{error}</span>}
  </div>
);

export default function NewAssetPage() {
  const router = useRouter();
  
  const [customBrands, setCustomBrands] = useState<string[]>(BRAND_OPTIONS);
  const [customModels, setCustomModels] = useState<string[]>([]);
  const [customTypesVariant, setCustomTypesVariant] = useState<string[]>([]);
  const [customTypes, setCustomTypes] = useState<string[]>(BODY_OPTIONS);
  const [customColors, setCustomColors] = useState<string[]>(COLOR_OPTIONS);

  const handleAddBrand = (presetVal?: string) => {
    const val = presetVal || window.prompt("Masukkan Merek Baru:");
    if (val && val.trim()) {
      const trimmed = val.trim().toUpperCase();
      if (!customBrands.includes(trimmed)) {
        setCustomBrands(prev => [...prev, trimmed]);
      }
      setFormData(prev => ({ ...prev, brand: trimmed, model: '' }));
    }
  };

  const handleAddModel = (presetVal?: string) => {
    const val = presetVal || window.prompt("Masukkan Model Baru:");
    if (val && val.trim()) {
      const trimmed = val.trim().toUpperCase();
      if (!customModels.includes(trimmed)) {
        setCustomModels(prev => [...prev, trimmed]);
      }
      setFormData(prev => ({ ...prev, model: trimmed }));
    }
  };

  const handleAddTypeVariant = (presetVal?: string) => {
    const val = presetVal || window.prompt("Masukkan Tipe Baru:");
    if (val && val.trim()) {
      const trimmed = val.trim().toUpperCase();
      if (!customTypesVariant.includes(trimmed)) {
        setCustomTypesVariant(prev => [...prev, trimmed]);
      }
      setFormData(prev => ({ ...prev, type: trimmed }));
    }
  };

  const handleAddType = (presetVal?: string) => {
    const val = presetVal || window.prompt("Masukkan Bentuk Bodi Baru:");
    if (val && val.trim()) {
      const trimmed = val.trim().toUpperCase();
      if (!customTypes.includes(trimmed)) {
        setCustomTypes(prev => [...prev, trimmed]);
      }
      setFormData(prev => ({ ...prev, body_type: trimmed }));
    }
  };

  const handleAddColor = (presetVal?: string) => {
    const val = presetVal || window.prompt("Masukkan Warna Baru:");
    if (val && val.trim()) {
      const trimmed = val.trim().toUpperCase();
      if (!customColors.includes(trimmed)) {
        setCustomColors(prev => [...prev, trimmed]);
      }
      setFormData(prev => ({ ...prev, color: trimmed }));
    }
  };
  
  const [formData, setFormData] = useState({
    // Basic Info
    provider_id: '',
    category: 'mobil',
    title: '',
    base_price: '',
    description: '',
    
    // Inspection
    inspection_date: new Date().toISOString().split('T')[0] + 'T00:00:00Z',
    inspection_pic_name: '',
    grade_interior: 'N/A',
    grade_exterior: 'N/A',
    grade_engine: 'N/A',
    inspection_doc_url: '',
    
    // Specs
    brand: '',
    model: '',
    type: '',
    color: '',
    fuel_type: 'Bensin',
    transmission: 'Otomatis',
    body_type: '',
    year: new Date().getFullYear().toString(),
    odometer: '',
    cylinder: '',
    
    // ID Numbers
    police_number: '',
    bpkb_number: '',
    frame_number: '',
    engine_number: '',
    branch_id: '',

    // Masa Berlaku Dokumen
    stnk_date: '',
    stnk_tax_date: '',
    keur_date: '',
    
    // Document Boolean
    doc_stnk: false,
    doc_bpkb: false,
    doc_faktur: false,
    doc_kwitansi: false,
    doc_form_a: false,
    doc_copy_ktp: false,
    doc_keur: false,
    doc_sph: false,

    photo_front: '',
    photo_back: '',
    photo_right: '',
    photo_left: '',
    photo_engine: '',
    photo_interior: '',
    photo_stnk: '',
    notes: '',
    pool_status: 'in_pool',
    pool_city: '',
  });

  const [providers, setProviders] = useState<{ id: string; company_name: string; full_name: string }[]>([]);
  const [branches, setBranches] = useState<{ id: string; name: string; city: string }[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const fetchProviders = async () => {
      setLoadingProviders(true);
      try {
        const res = await apiFetch('/admin/providers');
        const data = await res.json();
        if (res.ok && data.success) {
          setProviders(data.data);
        }
      } catch (err) {
        console.error('Failed to fetch providers', err);
      } finally {
        setLoadingProviders(false);
      }
    };
    const fetchBranches = async () => {
      try {
        const res = await apiFetch('/branches?is_active=true');
        const data = await res.json();
        if (res.ok && data.success) setBranches(data.data || []);
      } catch (err) {
        console.error('Failed to fetch branches', err);
      }
    };
    
    let picName = '';
    try {
      const stored = localStorage.getItem('user');
      if (stored) picName = JSON.parse(stored).full_name || '';
    } catch (e) {}
    
    setFormData(prev => ({ ...prev, inspection_pic_name: picName }));
    fetchProviders();
    fetchBranches();
  }, []);

  // provider_id is the only hard requirement left: it's a foreign key with no
  // sensible default, and createAsset() silently falls back to the admin's
  // own account as "provider" if it's left blank — worth blocking rather than
  // letting an asset get misattributed. Every other field is optional per
  // spec; assets.service.ts fills in defaults for title/category/base_price
  // when they're left blank.
  const validateForm = () => {
    const e: Record<string, string> = {};
    if (!formData.provider_id) e.provider_id = 'Pilih Provider pemilik barang';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleUploadDoc = async (file: File | null) => {
    if (!file) return;
    setUploadingDoc(true);
    const uploadData = new FormData();
    uploadData.append('file', file);

    try {
      const res = await apiFetch('/upload/single', {
        method: 'POST',
        body: uploadData,
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setFormData({ ...formData, inspection_doc_url: data.data.url });
      } else {
        setToast({ message: data.error?.message || 'Gagal mengunggah dokumen', type: 'error' });
      }
    } catch (err) {
      setToast({ message: 'Terjadi kesalahan saat mengunggah dokumen', type: 'error' });
    } finally {
      setUploadingDoc(false);
    }
  };

  const handlePhotoUpload = async (field: string, file: File | null) => {
    if (!file) return;
    setUploadingPhoto(field);
    const uploadData = new FormData();
    uploadData.append('file', file);

    try {
      const response = await apiFetch('/upload/single', {
        method: 'POST',
        body: uploadData,
      });
      const resData = await response.json();
      if (response.ok && resData.success) {
        setFormData({ ...formData, [field]: resData.data.url });
      } else {
        setToast({ message: resData.error?.message || 'Gagal mengunggah foto.', type: 'error' });
      }
    } catch (err) {
      setToast({ message: 'Koneksi gagal saat mengunggah foto.', type: 'error' });
    } finally {
      setUploadingPhoto(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      setToast({ message: 'Mohon lengkapi semua isian yang wajib', type: 'error' });
      // scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    
    setProcessing(true);
    try {
      // Normalize payload to match Provider Ajukan Titip Jual
      const payload: any = {
        category: formData.category,
        title: formData.title || `${formData.brand} ${formData.model} ${formData.year}`,
        description: formData.description,
        base_price: Number(formData.base_price) || undefined,
        provider_id: formData.provider_id || undefined,
        branch_id: formData.branch_id || undefined,
        pool_status: formData.pool_status || 'in_pool',
        pool_city: formData.pool_status === 'out_pool' ? (formData.pool_city || undefined) : undefined,

        // Specs
        brand: formData.brand,
        model: formData.model,
        type: formData.type,
        color: formData.color,
        fuel_type: formData.fuel_type,
        transmission: formData.transmission,
        body_type: formData.body_type,
        year: formData.year ? (isNaN(Number(formData.year)) ? formData.year : Number(formData.year)) : undefined,
        cylinder: formData.cylinder ? (isNaN(Number(formData.cylinder)) ? undefined : Number(formData.cylinder)) : undefined,
        odometer: formData.odometer ? (isNaN(Number(formData.odometer)) ? undefined : Number(formData.odometer)) : undefined,

        // IDs
        police_number: formData.police_number,
        bpkb_number: formData.bpkb_number,
        frame_number: formData.frame_number,
        engine_number: formData.engine_number,

        // Masa Berlaku Dokumen
        stnk_date: formData.stnk_date === 'N/A' ? 'N/A' : (formData.stnk_date ? new Date(formData.stnk_date).toISOString() : undefined),
        stnk_tax_date: formData.stnk_tax_date === 'N/A' ? 'N/A' : (formData.stnk_tax_date ? new Date(formData.stnk_tax_date).toISOString() : undefined),
        keur_date: formData.keur_date === 'N/A' ? 'N/A' : (formData.keur_date ? new Date(formData.keur_date).toISOString() : undefined),

        // Docs
        doc_stnk: formData.doc_stnk,
        doc_bpkb: formData.doc_bpkb,
        doc_faktur: formData.doc_faktur,
        doc_kwitansi: formData.doc_kwitansi,
        doc_form_a: formData.doc_form_a,
        doc_copy_ktp: formData.doc_copy_ktp,
        doc_keur: formData.doc_keur,
        doc_sph: formData.doc_sph,

        // Photos
        photo_front: formData.photo_front,
        photo_back: formData.photo_back,
        photo_right: formData.photo_right,
        photo_left: formData.photo_left,
        photo_engine: formData.photo_engine,
        photo_interior: formData.photo_interior,
        photo_stnk: formData.photo_stnk,

        notes: formData.notes,
      };

      const res = await apiFetch('/assets', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'Gagal menambah barang');
      }

      const newAssetId = data.data.id;

      // Now inspect it to add grades and inspection data
      const inspectRes = await apiFetch(`/admin/assets/${newAssetId}/inspect`, {
        method: 'PUT',
        body: JSON.stringify(formData),
      });
      
      if (!inspectRes.ok) {
        throw new Error('Berhasil menambah unit, namun gagal menyimpan detail inspeksi');
      }

      setToast({ message: 'Unit berhasil ditambahkan dan diinspeksi!', type: 'success' });
      setTimeout(() => {
        router.push('/assets');
      }, 1500);

    } catch (error: any) {
      setToast({ message: error.message || 'Terjadi kesalahan sistem', type: 'error' });
      setProcessing(false);
    }
  };

  return (
    <DashboardLayout breadcrumbParent="Katalog Unit" breadcrumbCurrent="Tambah Unit Baru">
      {toast && (
        <div style={{
          position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 9999,
          background: toast.type === 'success' ? '#10b981' : '#ef4444', color: '#fff',
          padding: '1rem 2rem', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem',
          maxWidth: '420px',
        }}>
          {toast.message}
        </div>
      )}

      <div className="page-header" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Tambah Unit Baru</h1>
          <p className="page-subtitle">Form gabungan pendaftaran dan inspeksi unit oleh Admin.</p>
        </div>
        <Button variant="outline" onClick={() => router.push('/assets')}>
          Batal & Kembali
        </Button>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* Section 1: Data Dasar */}
        <Card title="1. Data Dasar Unit">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Field label="Provider Pemilik" required error={errors.provider_id}>
              <select className={`form-select ${errors.provider_id ? 'border-red-500' : ''}`} value={formData.provider_id} onChange={e => setFormData({ ...formData, provider_id: e.target.value })} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc' }}>
                <option value="">-- Pilih Provider --</option>
                {providers.map((p: any) => (
                  <option key={p.id} value={p.user_id}>{p.company_name || p.user?.full_name || p.id}</option>
                ))}
              </select>
            </Field>
            
            <Field label="Nama Unit (Judul)">
              <input type="text" className="form-input" style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc' }} value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="Contoh: Toyota Avanza 1.5 G MT 2020" />
            </Field>
            
            <Field label="Harga Dasar (Rp)">
              <input type="number" min="0" className="form-input" style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc' }} value={formData.base_price} onChange={e => setFormData({ ...formData, base_price: e.target.value })} placeholder="Contoh: 150000000" />
            </Field>

            <Field label="Kategori">
              <select className="form-select" style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc' }} value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                <option value="mobil">Mobil</option>
                <option value="motor">Motor</option>
                <option value="alat_berat">Alat Berat</option>
                <option value="properti">Properti</option>
              </select>
            </Field>
          </div>
          
          <Field label="Lokasi Unit saat ini">
            <input type="text" className="form-input" style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc' }} value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} placeholder="Contoh: Pool Cilandak, Jakarta Selatan" />
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
            <Field label="Cabang">
              <select className={`form-select ${errors.branch_id ? 'border-red-500' : ''}`} value={(formData as any).branch_id || ''} onChange={e => setFormData({ ...formData, branch_id: e.target.value })} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc' }}>
                <option value="">-- Pilih Cabang --</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name} ({b.city})</option>
                ))}
              </select>
            </Field>

            <Field label="Status Pool">
              <select value={(formData as any).pool_status || 'in_pool'} onChange={e => setFormData({ ...formData, pool_status: e.target.value })} className="form-select" style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc' }}>
                <option value="in_pool">In Pool</option>
                <option value="out_pool">Out Pool</option>
              </select>
            </Field>

            {(formData as any).pool_status === 'out_pool' && (
              <Field label="Nama Kota">
                <input
                  type="text"
                  className="form-input"
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc' }}
                  value={(formData as any).pool_city || ''}
                  onChange={e => setFormData({ ...formData, pool_city: e.target.value })}
                  placeholder="Misal: Sumbawa Barat"
                />
              </Field>
            )}
          </div>

          <Field label="Deskripsi Tambahan">
            <textarea rows={4} className="form-textarea" style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc' }} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Deskripsi kondisi atau catatan khusus..." />
          </Field>
        </Card>

        {/* Section 2: Hasil Inspeksi Admin */}
        <Card title="2. Hasil Inspeksi">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Field label="Tanggal Inspeksi">
              <input type="datetime-local" className="form-input" style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc' }} value={formData.inspection_date.substring(0, 16)} onChange={e => setFormData({ ...formData, inspection_date: e.target.value + ':00Z' })} />
            </Field>
            <Field label="PIC Inspeksi">
              <input type="text" className="form-input" style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc' }} value={formData.inspection_pic_name} onChange={e => setFormData({ ...formData, inspection_pic_name: e.target.value })} />
            </Field>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
            <Field label="Grade Interior">
              <select className="form-select" style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc' }} value={formData.grade_interior} onChange={e => setFormData({ ...formData, grade_interior: e.target.value })}>
                {GRADE_OPTIONS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
              </select>
            </Field>
            <Field label="Grade Eksterior">
              <select className="form-select" style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc' }} value={formData.grade_exterior} onChange={e => setFormData({ ...formData, grade_exterior: e.target.value })}>
                {GRADE_OPTIONS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
              </select>
            </Field>
            <Field label="Grade Mesin">
              <select className="form-select" style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc' }} value={formData.grade_engine} onChange={e => setFormData({ ...formData, grade_engine: e.target.value })}>
                {GRADE_OPTIONS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
              </select>
            </Field>
          </div>

          <div style={{ marginTop: '1rem' }}>
            <Field label="Dokumen Laporan Inspeksi (Opsional)">
              <input type="file" className="form-input" accept="image/*,.pdf" disabled={uploadingDoc} style={{ paddingTop: '0.45rem', cursor: uploadingDoc ? 'not-allowed' : 'pointer', width: '100%' }} onChange={(e) => handleUploadDoc(e.target.files?.[0] || null)} />
              {uploadingDoc && <span style={{ color: '#6b7280', fontSize: '0.85rem' }}>⏳ Mengunggah dokumen...</span>}
              {formData.inspection_doc_url && !uploadingDoc && <span style={{ color: '#22c55e', fontSize: '0.85rem' }}>✅ Dokumen tersimpan</span>}
            </Field>
          </div>
        </Card>

        {/* Section 3: Data & Verifikasi Unit */}
        <Card title="3. Spesifikasi Unit">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.9rem' }}>Merek</label>
                <button
                  type="button"
                  onClick={() => handleAddBrand()}
                  style={{ background: 'none', border: 'none', color: 'var(--wf-primary)', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  + Tambahkan
                </button>
              </div>
              <select
                className="form-select"
                style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc' }}
                value={formData.brand}
                onChange={e => {
                  if (e.target.value === '__ADD_NEW__') {
                    handleAddBrand();
                  } else {
                    setFormData({ ...formData, brand: e.target.value.toUpperCase(), model: '' });
                  }
                }}
              >
                <option value="">Pilih Merek...</option>
                {customBrands.map((b) => <option key={b} value={b}>{b.toUpperCase()}</option>)}
                <option value="__ADD_NEW__">+ Tambahkan Merek Baru...</option>
              </select>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.9rem' }}>Model</label>
                <button
                  type="button"
                  onClick={() => handleAddModel()}
                  style={{ background: 'none', border: 'none', color: 'var(--wf-primary)', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  + Tambahkan
                </button>
              </div>
              <select
                className="form-select"
                style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc' }}
                value={formData.model}
                onChange={e => {
                  if (e.target.value === '__ADD_NEW__') {
                    handleAddModel();
                  } else {
                    setFormData({ ...formData, model: e.target.value.toUpperCase() });
                  }
                }}
              >
                <option value="">Pilih Model...</option>
                {Array.from(new Set([
                  ...(formData.brand && CAR_MODELS_BY_BRAND[formData.brand] ? CAR_MODELS_BY_BRAND[formData.brand] : []),
                  ...customModels
                ])).map((m) => <option key={m} value={m}>{m.toUpperCase()}</option>)}
                <option value="LAINNYA">LAINNYA</option>
                <option value="__ADD_NEW__">+ Tambahkan Model Baru...</option>
              </select>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.9rem' }}>Tipe</label>
                <button
                  type="button"
                  onClick={() => handleAddTypeVariant()}
                  style={{ background: 'none', border: 'none', color: 'var(--wf-primary)', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  + Tambahkan
                </button>
              </div>
              <select
                className="form-select"
                style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc' }}
                value={(formData as any).type}
                onChange={e => {
                  if (e.target.value === '__ADD_NEW__') {
                    handleAddTypeVariant();
                  } else {
                    setFormData({ ...formData, type: e.target.value.toUpperCase() } as any);
                  }
                }}
              >
                <option value="">Pilih Tipe...</option>
                {customTypesVariant.map((t) => <option key={t} value={t}>{t.toUpperCase()}</option>)}
                <option value="__ADD_NEW__">+ Tambahkan Tipe Baru...</option>
              </select>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.9rem' }}>Bentuk Bodi</label>
                <button
                  type="button"
                  onClick={() => handleAddType()}
                  style={{ background: 'none', border: 'none', color: 'var(--wf-primary)', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  + Tambahkan
                </button>
              </div>
              <select
                className="form-select"
                style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc' }}
                value={formData.body_type}
                onChange={e => {
                  if (e.target.value === '__ADD_NEW__') {
                    handleAddType();
                  } else {
                    setFormData({ ...formData, body_type: e.target.value.toUpperCase() });
                  }
                }}
              >
                <option value="">Pilih Tipe...</option>
                {customTypes.map((b) => <option key={b} value={b}>{b.toUpperCase()}</option>)}
                <option value="__ADD_NEW__">+ Tambahkan Tipe Baru...</option>
              </select>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.9rem' }}>Warna</label>
                <button
                  type="button"
                  onClick={() => handleAddColor()}
                  style={{ background: 'none', border: 'none', color: 'var(--wf-primary)', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  + Tambahkan
                </button>
              </div>
              <select
                className="form-select"
                style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc' }}
                value={formData.color}
                onChange={e => {
                  if (e.target.value === '__ADD_NEW__') {
                    handleAddColor();
                  } else {
                    setFormData({ ...formData, color: e.target.value });
                  }
                }}
              >
                <option value="">Pilih Warna...</option>
                {customColors.map((c) => <option key={c} value={c}>{c}</option>)}
                <option value="__ADD_NEW__">+ Tambahkan Warna Baru...</option>
              </select>
            </div>
            
            <Field label="Bahan Bakar">
              <select className="form-select" style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc' }} value={formData.fuel_type} onChange={e => setFormData({ ...formData, fuel_type: e.target.value.toUpperCase() })}>
                <option value="">Pilih...</option>
                {FUEL_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </Field>
            <Field label="Transmisi">
              <select className="form-select" style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc' }} value={formData.transmission} onChange={e => setFormData({ ...formData, transmission: e.target.value.toUpperCase() })}>
                <option value="">Pilih...</option>
                {TRANSMISSION_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>

            <Field label="Tahun Buat">
              <input type="text" className="form-input" style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc' }} value={formData.year} onChange={e => setFormData({ ...formData, year: e.target.value })} />
            </Field>
            <Field label="Kapasitas Mesin (CC)">
              <input type="text" className="form-input" style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc' }} value={formData.cylinder} onChange={e => setFormData({ ...formData, cylinder: e.target.value })} />
            </Field>
            <Field label="Odometer (KM)">
              <input type="text" className="form-input" style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc' }} value={formData.odometer} onChange={e => setFormData({ ...formData, odometer: e.target.value })} />
            </Field>
          </div>
        </Card>

        {/* Section 4: Identifikasi */}
        <Card title="4. Nomor Identifikasi">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Field label="No Polisi">
              <input type="text" className="form-input" style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc' }} value={formData.police_number} onChange={e => setFormData({ ...formData, police_number: e.target.value.toUpperCase() })} />
            </Field>
            <Field label="No BPKB">
              <input type="text" className="form-input" style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc' }} value={formData.bpkb_number} onChange={e => setFormData({ ...formData, bpkb_number: e.target.value.toUpperCase() })} />
            </Field>
            <Field label="No Rangka">
              <input type="text" className="form-input" style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc' }} value={formData.frame_number} onChange={e => setFormData({ ...formData, frame_number: e.target.value.toUpperCase() })} />
            </Field>
            <Field label="No Mesin">
              <input type="text" className="form-input" style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc' }} value={formData.engine_number} onChange={e => setFormData({ ...formData, engine_number: e.target.value.toUpperCase() })} />
            </Field>
          </div>
        </Card>

        {/* Section 5: Masa Berlaku Dokumen */}
        <Card title="5. Masa Berlaku Dokumen">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <Field label="Masa Berlaku STNK">
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input
                  type="date"
                  className="form-input"
                  style={{ flex: 1, padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc', opacity: formData.stnk_date === 'N/A' ? 0.4 : 1 }}
                  value={formData.stnk_date === 'N/A' ? '' : formData.stnk_date}
                  disabled={formData.stnk_date === 'N/A'}
                  onChange={e => setFormData({ ...formData, stnk_date: e.target.value })}
                />
                <label style={{ display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap', fontSize: '0.85rem', color: '#64748b', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.stnk_date === 'N/A'}
                    onChange={e => setFormData({ ...formData, stnk_date: e.target.checked ? 'N/A' : '' })}
                    style={{ width: '14px', height: '14px' }}
                  />
                  N/A
                </label>
              </div>
            </Field>
            <Field label="Masa Berlaku Pajak">
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input
                  type="date"
                  className="form-input"
                  style={{ flex: 1, padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc', opacity: formData.stnk_tax_date === 'N/A' ? 0.4 : 1 }}
                  value={formData.stnk_tax_date === 'N/A' ? '' : formData.stnk_tax_date}
                  disabled={formData.stnk_tax_date === 'N/A'}
                  onChange={e => setFormData({ ...formData, stnk_tax_date: e.target.value })}
                />
                <label style={{ display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap', fontSize: '0.85rem', color: '#64748b', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.stnk_tax_date === 'N/A'}
                    onChange={e => setFormData({ ...formData, stnk_tax_date: e.target.checked ? 'N/A' : '' })}
                    style={{ width: '14px', height: '14px' }}
                  />
                  N/A
                </label>
              </div>
            </Field>
            <Field label="Masa Berlaku KEUR">
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input
                  type="date"
                  className="form-input"
                  style={{ flex: 1, padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc', opacity: formData.keur_date === 'N/A' ? 0.4 : 1 }}
                  value={formData.keur_date === 'N/A' ? '' : formData.keur_date}
                  disabled={formData.keur_date === 'N/A'}
                  onChange={e => setFormData({ ...formData, keur_date: e.target.value })}
                />
                <label style={{ display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap', fontSize: '0.85rem', color: '#64748b', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.keur_date === 'N/A'}
                    onChange={e => setFormData({ ...formData, keur_date: e.target.checked ? 'N/A' : '' })}
                    style={{ width: '14px', height: '14px' }}
                  />
                  N/A
                </label>
              </div>
            </Field>
          </div>
        </Card>

        {/* Section 6: Kelengkapan Dokumen Fisik */}
        <Card title="6. Kelengkapan Dokumen Fisik">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1rem' }}>
            {Object.entries({
              doc_stnk: 'STNK',
              doc_bpkb: 'BPKB',
              doc_faktur: 'Faktur',
              doc_kwitansi: 'Kwitansi Blangko',
              doc_form_a: 'Form A / C',
              doc_copy_ktp: 'Fotokopi KTP',
              doc_keur: 'Buku Keur',
              doc_sph: 'SPH',
            }).map(([key, label]) => (
              <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={(formData as any)[key]}
                  onChange={(e) => setFormData({ ...formData, [key]: e.target.checked })}
                  style={{ width: '1.2rem', height: '1.2rem' }}
                />
                <span style={{ fontSize: '0.9rem' }}>{label}</span>
              </label>
            ))}
          </div>
        </Card>

        {/* Section 7: Foto Unit */}
        <Card title="7. Foto Unit (Opsional)">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
            {PHOTO_FIELDS.map((pf) => (
              <div key={pf.key} style={{ border: '1px dashed #cbd5e1', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>{pf.label}</label>
                {(formData as any)[pf.key] ? (
                  <div style={{ position: 'relative' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={(formData as any)[pf.key]} alt={pf.label} style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '4px' }} />
                    <button type="button" onClick={() => setFormData({ ...formData, [pf.key]: '' })} style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(239,68,68,0.9)', color: 'white', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer' }}>×</button>
                  </div>
                ) : (
                  <div>
                    <input type="file" id={`upload-${pf.key}`} accept="image/*" style={{ display: 'none' }} disabled={uploadingPhoto === pf.key} onChange={(e) => handlePhotoUpload(pf.key, e.target.files?.[0] || null)} />
                    <label htmlFor={`upload-${pf.key}`} style={{ display: 'inline-block', padding: '0.5rem 1rem', background: '#f1f5f9', color: '#475569', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}>
                      {uploadingPhoto === pf.key ? '⏳ Mengunggah...' : 'Pilih Foto'}
                    </label>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Submit */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', padding: '1rem 0' }}>
          <Button variant="outline" type="button" onClick={() => router.push('/assets')} disabled={processing}>
            Batal
          </Button>
          <Button variant="primary" type="submit" disabled={processing || uploadingDoc || uploadingPhoto !== null}>
            {processing ? 'Menyimpan...' : '💾 Simpan Unit Baru'}
          </Button>
        </div>

      </form>
    </DashboardLayout>
  );
}
