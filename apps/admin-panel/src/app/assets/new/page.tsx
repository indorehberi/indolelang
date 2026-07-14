'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import { apiFetch } from '../../../lib/api';

const GRADE_OPTIONS = [
  { value: 'A', label: 'Grade A (Sangat Baik)' },
  { value: 'B', label: 'Grade B (Baik)' },
  { value: 'C', label: 'Grade C (Cukup)' },
  { value: 'D', label: 'Grade D (Kurang)' },
];

const FUEL_OPTIONS = ['Bensin', 'Solar', 'Hybrid', 'EV'];
const TRANSMISSION_OPTIONS = ['Otomatis', 'Manual'];
const BODY_OPTIONS = ['Sedan', 'SUV', 'MPV', 'Hatchback', 'Pick Up', 'Truk', 'Bus', 'Minibus', 'Motor Bebek', 'Motor Matic', 'Motor Sport'];
const BRAND_OPTIONS = ['Toyota', 'Honda', 'Daihatsu', 'Suzuki', 'Mitsubishi', 'Nissan', 'Mazda', 'Isuzu', 'Wuling', 'Hyundai', 'KIA', 'Mercedes-Benz', 'BMW', 'Ford', 'BYD', 'Chery', 'MG', 'Neta', 'AION', 'VinFast', 'Geely', 'XPENG', 'Denza', 'Lainnya'];
const CAR_MODELS_BY_BRAND: Record<string, string[]> = {
  Toyota: ['Avanza', 'Innova', 'Fortuner', 'Alphard', 'Rush', 'Agya', 'Calya', 'Yaris', 'Camry', 'Vios', 'Corolla'],
  Honda: ['Brio', 'Jazz', 'HR-V', 'CR-V', 'Mobilio', 'BR-V', 'Civic', 'City', 'Accord'],
  Daihatsu: ['Xenia', 'Terios', 'Sigra', 'Ayla', 'Gran Max', 'Luxio', 'Sirion'],
  Suzuki: ['Ertiga', 'XL7', 'Ignis', 'Baleno', 'Carry', 'Jimny', 'S-Cross'],
  Mitsubishi: ['Xpander', 'Pajero Sport', 'Triton', 'L300', 'Outlander'],
  Nissan: ['Grand Livina', 'Serena', 'X-Trail', 'Juke', 'March', 'Kicks'],
  Mazda: ['Mazda2', 'Mazda3', 'CX-3', 'CX-5', 'CX-9'],
  Ford: ['Fiesta', 'EcoSport', 'Everest', 'Ranger', 'Focus'],
  Hyundai: ['Creta', 'Palisade', 'Santa Fe', 'Ioniq 5', 'Kona', 'Kona Electric (baru)', 'Stargazer'],
  Kia: ['Sonet', 'Seltos', 'Carnival', 'Picanto', 'Rio'],
  Wuling: ['Confero', 'Cortez', 'Almaz', 'Air EV', 'BinguoEV', 'Cloud EV'],
  BMW: ['3 Series', '5 Series', '7 Series', 'X1', 'X3', 'X5'],
  'Mercedes-Benz': ['C-Class', 'E-Class', 'S-Class', 'GLC', 'GLE'],
  BYD: ['Dolphin', 'Atto 3', 'Seal', 'M6', 'Sealion 7'],
  Chery: ['Omoda E5', 'J6 (iCar 03)'],
  MG: ['MG4 EV', 'MG ZS EV'],
  Neta: ['V-II', 'X'],
  AION: ['Y Plus', 'V', 'UT'],
  VinFast: ['VF 3', 'VF 5', 'VF e34'],
  Geely: ['EX5'],
  XPENG: ['G6', 'X9'],
  Denza: ['D9']
};
const COLOR_OPTIONS = ['Hitam', 'Putih', 'Silver', 'Abu-abu', 'Merah', 'Biru', 'Cokelat', 'Kuning', 'Hijau', 'Lainnya'];

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
    grade_interior: 'A',
    grade_exterior: 'A',
    grade_engine: 'A',
    inspection_doc_url: '',
    
    // Specs
    brand: '',
    model: '',
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
  });

  const [providers, setProviders] = useState<{ id: string; company_name: string; full_name: string }[]>([]);
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
    
    let picName = '';
    try {
      const stored = localStorage.getItem('user');
      if (stored) picName = JSON.parse(stored).full_name || '';
    } catch (e) {}
    
    setFormData(prev => ({ ...prev, inspection_pic_name: picName }));
    fetchProviders();
  }, []);

  const validateForm = () => {
    const e: Record<string, string> = {};
    if (!formData.provider_id) e.provider_id = 'Pilih Provider pemilik barang';
    if (!formData.title) e.title = 'Nama Barang wajib diisi';
    if (!formData.base_price) e.base_price = 'Harga Dasar wajib diisi';
    if (!formData.inspection_pic_name.trim()) e.inspection_pic_name = 'PIC Inspeksi wajib diisi';
    if (!formData.category) e.category = 'Kategori wajib dipilih';
    if (!formData.brand.trim()) e.brand = 'Merek wajib diisi';
    if (!formData.model.trim()) e.model = 'Tipe/Model wajib diisi';
    if (!formData.year) e.year = 'Tahun wajib diisi';
    if (!formData.police_number.trim()) e.police_number = 'No Polisi wajib diisi';
    if (!formData.notes.trim()) e.notes = 'Lokasi Kendaraan wajib diisi';
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
      const res = await apiFetch('/assets', {
        method: 'POST',
        body: JSON.stringify(formData),
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
        throw new Error('Berhasil menambah barang, namun gagal menyimpan detail inspeksi');
      }

      setToast({ message: 'Barang berhasil ditambahkan dan diinspeksi!', type: 'success' });
      setTimeout(() => {
        router.push('/assets');
      }, 1500);

    } catch (error: any) {
      setToast({ message: error.message || 'Terjadi kesalahan sistem', type: 'error' });
      setProcessing(false);
    }
  };

  return (
    <DashboardLayout breadcrumbParent="Katalog Barang" breadcrumbCurrent="Tambah Barang Baru">
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
          <h1 className="page-title">Tambah Barang Baru</h1>
          <p className="page-subtitle">Form gabungan pendaftaran dan inspeksi barang oleh Admin.</p>
        </div>
        <Button variant="outline" onClick={() => router.push('/assets')}>
          Batal & Kembali
        </Button>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* Section 1: Data Dasar */}
        <Card title="1. Data Dasar Barang">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Field label="Provider Pemilik" required error={errors.provider_id}>
              <select className={`form-select ${errors.provider_id ? 'border-red-500' : ''}`} value={formData.provider_id} onChange={e => setFormData({ ...formData, provider_id: e.target.value })} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc' }}>
                <option value="">-- Pilih Provider --</option>
                {providers.map((p: any) => (
                  <option key={p.id} value={p.user_id}>{p.company_name || p.user?.full_name || p.id}</option>
                ))}
              </select>
            </Field>
            
            <Field label="Nama Barang (Judul)" required error={errors.title}>
              <input type="text" className="form-input" style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc' }} value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="Contoh: Toyota Avanza 1.5 G MT 2020" />
            </Field>
            
            <Field label="Harga Dasar (Rp)" required error={errors.base_price}>
              <input type="number" min="0" className="form-input" style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc' }} value={formData.base_price} onChange={e => setFormData({ ...formData, base_price: e.target.value })} placeholder="Contoh: 150000000" />
            </Field>

            <Field label="Kategori" required error={errors.category}>
              <select className="form-select" style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc' }} value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                <option value="mobil">Mobil</option>
                <option value="motor">Motor</option>
                <option value="alat_berat">Alat Berat</option>
                <option value="properti">Properti</option>
              </select>
            </Field>
          </div>
          
          <Field label="Lokasi Kendaraan saat ini" required error={errors.notes}>
            <input type="text" className="form-input" style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc' }} value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} placeholder="Contoh: Pool Cilandak, Jakarta Selatan" />
          </Field>

          <Field label="Deskripsi Tambahan">
            <textarea rows={4} className="form-textarea" style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc' }} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Deskripsi kondisi atau catatan khusus..." />
          </Field>
        </Card>

        {/* Section 2: Hasil Inspeksi Admin */}
        <Card title="2. Hasil Inspeksi">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Field label="Tanggal Inspeksi" required>
              <input type="datetime-local" className="form-input" style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc' }} value={formData.inspection_date.substring(0, 16)} onChange={e => setFormData({ ...formData, inspection_date: e.target.value + ':00Z' })} />
            </Field>
            <Field label="PIC Inspeksi" required error={errors.inspection_pic_name}>
              <input type="text" className="form-input" style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc' }} value={formData.inspection_pic_name} onChange={e => setFormData({ ...formData, inspection_pic_name: e.target.value })} />
            </Field>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
            <Field label="Grade Interior" required>
              <select className="form-select" style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc' }} value={formData.grade_interior} onChange={e => setFormData({ ...formData, grade_interior: e.target.value })}>
                {GRADE_OPTIONS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
              </select>
            </Field>
            <Field label="Grade Eksterior" required>
              <select className="form-select" style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc' }} value={formData.grade_exterior} onChange={e => setFormData({ ...formData, grade_exterior: e.target.value })}>
                {GRADE_OPTIONS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
              </select>
            </Field>
            <Field label="Grade Mesin" required>
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

        {/* Section 3: Data & Verifikasi Kendaraan */}
        <Card title="3. Spesifikasi Kendaraan">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <Field label="Merek" required error={errors.brand}>
              <select className="form-select" style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc' }} value={formData.brand} onChange={e => setFormData({ ...formData, brand: e.target.value })}>
                <option value="">Pilih...</option>
                {BRAND_OPTIONS.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </Field>
            <Field label="Tipe / Model" required error={errors.model}>
              <select className="form-select" style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc' }} value={formData.model} onChange={e => setFormData({ ...formData, model: e.target.value })}>
                <option value="">Pilih...</option>
                {(formData.brand && CAR_MODELS_BY_BRAND[formData.brand] ? CAR_MODELS_BY_BRAND[formData.brand] : []).map((m) => <option key={m} value={m}>{m}</option>)}
                <option value="Lainnya">Lainnya</option>
              </select>
            </Field>
            <Field label="Warna">
              <select className="form-select" style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc' }} value={formData.color} onChange={e => setFormData({ ...formData, color: e.target.value })}>
                <option value="">Pilih...</option>
                {COLOR_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            
            <Field label="Bahan Bakar">
              <select className="form-select" style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc' }} value={formData.fuel_type} onChange={e => setFormData({ ...formData, fuel_type: e.target.value })}>
                <option value="">Pilih...</option>
                {FUEL_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </Field>
            <Field label="Transmisi">
              <select className="form-select" style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc' }} value={formData.transmission} onChange={e => setFormData({ ...formData, transmission: e.target.value })}>
                <option value="">Pilih...</option>
                {TRANSMISSION_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Jenis Body">
              <select className="form-select" style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc' }} value={formData.body_type} onChange={e => setFormData({ ...formData, body_type: e.target.value })}>
                <option value="">Pilih...</option>
                {BODY_OPTIONS.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </Field>

            <Field label="Tahun Buat" required error={errors.year}>
              <input type="number" className="form-input" style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc' }} value={formData.year} onChange={e => setFormData({ ...formData, year: e.target.value })} min="1900" max={new Date().getFullYear()} />
            </Field>
            <Field label="Kapasitas Mesin (CC)">
              <input type="number" className="form-input" style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc' }} value={formData.cylinder} onChange={e => setFormData({ ...formData, cylinder: e.target.value })} />
            </Field>
            <Field label="Odometer (KM)">
              <input type="number" className="form-input" style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc' }} value={formData.odometer} onChange={e => setFormData({ ...formData, odometer: e.target.value })} />
            </Field>
          </div>
        </Card>

        {/* Section 4: Identifikasi */}
        <Card title="4. Nomor Identifikasi">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Field label="No Polisi" required error={errors.police_number}>
              <input type="text" className="form-input" style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc' }} value={formData.police_number} onChange={e => setFormData({ ...formData, police_number: e.target.value })} />
            </Field>
            <Field label="No BPKB">
              <input type="text" className="form-input" style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc' }} value={formData.bpkb_number} onChange={e => setFormData({ ...formData, bpkb_number: e.target.value })} />
            </Field>
            <Field label="No Rangka">
              <input type="text" className="form-input" style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc' }} value={formData.frame_number} onChange={e => setFormData({ ...formData, frame_number: e.target.value })} />
            </Field>
            <Field label="No Mesin">
              <input type="text" className="form-input" style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc' }} value={formData.engine_number} onChange={e => setFormData({ ...formData, engine_number: e.target.value })} />
            </Field>
          </div>
        </Card>

        {/* Section 5: Kelengkapan Dokumen Fisik */}
        <Card title="5. Kelengkapan Dokumen Fisik">
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

        {/* Section 6: Foto Barang */}
        <Card title="6. Foto Barang (Wajib Minimal Depan)">
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
            {processing ? 'Menyimpan...' : '💾 Simpan Barang Baru'}
          </Button>
        </div>

      </form>
    </DashboardLayout>
  );
}
