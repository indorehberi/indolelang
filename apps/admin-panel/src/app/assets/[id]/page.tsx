'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import { apiFetch, getImageUrl } from '../../../lib/api';

interface AssetDetail {
  id: string;
  title: string;
  category: string;
  description?: string;
  base_price: number;
  status: string;
  provider_id: string;
  brand?: string;
  model?: string;
  color?: string;
  fuel_type?: string;
  transmission?: string;
  body_type?: string;
  year?: number | string;
  police_number?: string;
  bpkb_number?: string;
  frame_number?: string;
  engine_number?: string;
  cylinder?: number | string;
  odometer?: number | string;
  grade_interior?: string;
  grade_exterior?: string;
  grade_engine?: string;
  inspection_pic_name?: string;
  inspection_date?: string;
  inspection_doc_url?: string;
  notes?: string;
  rejection_reason?: string;
  pool_status?: string;
  pool_city?: string;
  doc_stnk?: boolean;
  doc_bpkb?: boolean;
  doc_faktur?: boolean;
  doc_kwitansi?: boolean;
  doc_form_a?: boolean;
  doc_copy_ktp?: boolean;
  doc_keur?: boolean;
  doc_sph?: boolean;
  stnk_date?: string;
  stnk_tax_date?: string;
  keur_date?: string;
  photo_front?: string;
  photo_back?: string;
  photo_right?: string;
  photo_left?: string;
  photo_engine?: string;
  photo_interior?: string;
  photo_stnk?: string;
  images?: Record<string, string>;
  created_at: string;
  updated_at: string;
}

const PHOTO_LABELS: { key: keyof AssetDetail; label: string }[] = [
  { key: 'photo_front', label: 'Tampak Depan' },
  { key: 'photo_back', label: 'Tampak Belakang' },
  { key: 'photo_right', label: 'Tampak Kanan' },
  { key: 'photo_left', label: 'Tampak Kiri' },
  { key: 'photo_engine', label: 'Kompartemen Mesin' },
  { key: 'photo_interior', label: 'Interior' },
  { key: 'photo_stnk', label: 'STNK' },
];

const DOC_LABELS: { key: keyof AssetDetail; label: string }[] = [
  { key: 'doc_stnk', label: 'STNK' },
  { key: 'doc_bpkb', label: 'BPKB' },
  { key: 'doc_faktur', label: 'Faktur' },
  { key: 'doc_kwitansi', label: 'Kwitansi' },
  { key: 'doc_form_a', label: 'Form A' },
  { key: 'doc_copy_ktp', label: 'Copy KTP' },
  { key: 'doc_keur', label: 'KEUR' },
  { key: 'doc_sph', label: 'SPH' },
];

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

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.45rem 0.65rem',
  border: '1px solid var(--border)',
  borderRadius: '0.375rem',
  fontSize: '0.875rem',
  background: 'var(--bg-primary)',
  color: 'var(--text-primary)',
  boxSizing: 'border-box',
};

const selectStyle: React.CSSProperties = { ...inputStyle };

const EditField = ({
  label, value, onChange, type = 'text', options: initialOptions,
}: {
  label: string;
  value: unknown;
  onChange: (value: unknown) => void;
  type?: 'text' | 'number' | 'textarea' | 'select' | 'checkbox' | 'date';
  options?: string[];
}) => {
  const [localOptions, setLocalOptions] = React.useState<string[]>(initialOptions || []);
  const [showPopup, setShowPopup] = React.useState(false);
  const [newOption, setNewOption] = React.useState('');

  React.useEffect(() => {
    if (initialOptions) {
      setLocalOptions(initialOptions);
    }
  }, [initialOptions]);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === '__ADD_NEW_OPTION__') {
      setShowPopup(true);
    } else {
      onChange(val);
    }
  };

  const handlePopupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newOption.trim();
    if (trimmed) {
      if (!localOptions.includes(trimmed)) {
        setLocalOptions((prev) => [...prev, trimmed]);
      }
      onChange(trimmed);
      setNewOption('');
      setShowPopup(false);
    }
  };

  return (
    <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '0.5rem', fontSize: '0.875rem', alignItems: type === 'textarea' ? 'flex-start' : 'center' }}>
      <span style={{ color: 'var(--text-secondary)', minWidth: '160px', fontWeight: 600 }}>{label}</span>
      <div style={{ flex: 1, position: 'relative' }}>
        {type === 'date' ? (
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <input
              type="date"
              style={{ ...inputStyle, flex: 1, opacity: String(value) === 'N/A' ? 0.4 : 1 }}
              value={String(value) === 'N/A' ? '' : (value ? String(value).slice(0, 10) : '')}
              disabled={String(value) === 'N/A'}
              onChange={(e) => onChange(e.target.value)}
            />
            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap', fontSize: '0.8rem', color: '#64748b', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={String(value) === 'N/A'}
                onChange={(e) => onChange(e.target.checked ? 'N/A' : '')}
                style={{ width: '14px', height: '14px' }}
              />
              N/A
            </label>
          </div>
        ) : type === 'textarea' ? (
          <textarea
            rows={3}
            style={{ ...inputStyle, resize: 'vertical' }}
            value={(value as string) ?? ''}
            onChange={(e) => onChange(e.target.value)}
          />
        ) : type === 'select' ? (
          <select
            style={selectStyle}
            value={(value as string) ?? ''}
            onChange={handleSelectChange}
          >
            <option value="">— Pilih —</option>
            {localOptions.map((o) => <option key={o} value={o}>{o}</option>)}
            <option value="__ADD_NEW_OPTION__" style={{ fontWeight: 'bold', color: 'var(--primary, #3b82f6)' }}>
              + Tambah Pilihan...
            </option>
          </select>
        ) : type === 'checkbox' ? (
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={!!value}
              onChange={(e) => onChange(e.target.checked)}
              style={{ width: '16px', height: '16px' }}
            />
            <span style={{ color: 'var(--text-primary)' }}>{value ? 'Ada' : 'Tidak Ada'}</span>
          </label>
        ) : (
          <input
            type={type}
            style={inputStyle}
            value={(value as string | number) ?? ''}
            onChange={(e) => onChange(type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value)}
          />
        )}

        {/* POPUP FOR ADDING NEW OPTION */}
        {showPopup && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
            justifyContent: 'center', alignItems: 'center', zIndex: 9999
          }}>
            <div style={{
              background: '#fff', padding: '1.5rem',
              borderRadius: '8px', width: '320px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
              border: '1px solid #ddd'
            }}>
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 600, color: '#333' }}>Tambahkan Pilihan Baru</h3>
              <form onSubmit={handlePopupSubmit}>
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: '#666', fontWeight: 500 }}>Pilihan Baru</label>
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder="Contoh: Honda Brio"
                    style={{ ...inputStyle, border: '1px solid #ccc' }}
                    value={newOption}
                    onChange={(e) => setNewOption(e.target.value)}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => { setShowPopup(false); setNewOption(''); }}
                    style={{
                      padding: '0.45rem 0.85rem', borderRadius: '4px',
                      border: '1px solid #ccc', background: '#fff',
                      cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500, color: '#333'
                    }}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    style={{
                      padding: '0.45rem 0.85rem', borderRadius: '4px',
                      border: 'none', background: 'var(--primary, #3b82f6)',
                      color: '#fff', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500
                    }}
                  >
                    Tambah
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};


export default function AssetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const assetId = params?.id as string;

  const [asset, setAsset] = useState<AssetDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState<Partial<AssetDetail>>({});
  const [userRole, setUserRole] = useState<string>('');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Photo order state
  const [photoOrder, setPhotoOrder] = useState<string[]>([]);
  const [photoOrderDirty, setPhotoOrderDirty] = useState(false);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchData = useCallback(async () => {
    try {
      const res = await apiFetch(`/assets/${assetId}`);
      if (res.ok) {
        const data = await res.json();
        const a: AssetDetail = data.data;
        setAsset(a);
        setForm(a);
        const initial = PHOTO_LABELS.filter((p) => !!a[p.key]).map((p) => p.key);
        setPhotoOrder(initial);
      } else {
        setAsset(null);
      }
    } catch {
      setAsset(null);
    } finally {
      setLoading(false);
    }
  }, [assetId]);

  useEffect(() => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        setUserRole(user.role);
      }
    } catch (e) {}
    if (assetId) fetchData();
  }, [assetId, fetchData]);

  const handleApprove = async () => {
    if (!confirm('Apakah Anda yakin menyetujui unit ini?')) return;
    try {
      const response = await apiFetch(`/admin/assets/${assetId}/approve`, { method: 'PUT' });
      if (response.ok) {
        showToast('success', 'Unit disetujui');
        setTimeout(() => fetchData(), 800);
      } else showToast('error', 'Gagal menyetujui unit');
    } catch (err) { console.error(err); }
  };

  const handleReject = async () => {
    if (!confirm('Apakah Anda yakin menolak unit ini?')) return;
    try {
      const response = await apiFetch(`/admin/assets/${assetId}/reject`, { method: 'PUT' });
      if (response.ok) {
        showToast('success', 'Unit ditolak');
        setTimeout(() => fetchData(), 800);
      } else showToast('error', 'Gagal menolak unit');
    } catch (err) { console.error(err); }
  };

  const handleFormChange = (field: keyof AssetDetail, value: unknown) => {
    let finalValue = value;
    if (
      typeof value === 'string' &&
      [
        'brand',
        'model',
        'type',
        'body_type',
        'color',
        'transmission',
        'fuel_type',
        'police_number',
        'bpkb_number',
        'frame_number',
        'engine_number'
      ].includes(field)
    ) {
      finalValue = value.toUpperCase();
    }
    setForm((prev) => ({ ...prev, [field]: finalValue }));
  };

  const handleSaveEdit = async () => {
    if (!asset) return;
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        title: form.title,
        category: form.category,
        description: form.description,
        base_price: form.base_price ? Number(form.base_price) : undefined,
        brand: form.brand,
        model: form.model,
        color: form.color,
        fuel_type: form.fuel_type,
        transmission: form.transmission,
        body_type: form.body_type,
        year: form.year && form.year !== 'N/A' && form.year !== 'n/a' ? Number(form.year) : (form.year === 'N/A' || form.year === 'n/a' ? 'N/A' : undefined),
        police_number: form.police_number,
        bpkb_number: form.bpkb_number,
        frame_number: form.frame_number,
        engine_number: form.engine_number,
        cylinder: form.cylinder && form.cylinder !== 'N/A' && form.cylinder !== 'n/a' ? Number(form.cylinder) : (form.cylinder === 'N/A' || form.cylinder === 'n/a' ? 'N/A' : undefined),
        odometer: form.odometer && form.odometer !== 'N/A' && form.odometer !== 'n/a' ? Number(form.odometer) : (form.odometer === 'N/A' || form.odometer === 'n/a' ? 'N/A' : undefined),
        notes: form.notes,
        pool_status: form.pool_status,
        pool_city: form.pool_status === 'out_pool' ? form.pool_city : undefined,
        doc_stnk: form.doc_stnk,
        doc_bpkb: form.doc_bpkb,
        doc_faktur: form.doc_faktur,
        doc_kwitansi: form.doc_kwitansi,
        doc_form_a: form.doc_form_a,
        doc_copy_ktp: form.doc_copy_ktp,
        doc_keur: form.doc_keur,
        doc_sph: form.doc_sph,
        inspection_pic_name: form.inspection_pic_name,
        inspection_date: form.inspection_date ? new Date(form.inspection_date).toISOString() : undefined,
        grade_interior: form.grade_interior,
        grade_exterior: form.grade_exterior,
        grade_engine: form.grade_engine,
        stnk_date: form.stnk_date === 'N/A' ? 'N/A' : (form.stnk_date ? new Date(form.stnk_date).toISOString() : undefined),
        stnk_tax_date: form.stnk_tax_date === 'N/A' ? 'N/A' : (form.stnk_tax_date ? new Date(form.stnk_tax_date).toISOString() : undefined),
        keur_date: form.keur_date === 'N/A' ? 'N/A' : (form.keur_date ? new Date(form.keur_date).toISOString() : undefined),
      };

      // Remove undefined/null keys — fields the DB stored as null (never
      // filled in) flow into `form` as-is via setForm(a) in fetchData(),
      // and updateAssetSchema's `.optional()` fields reject `null` with
      // "Expected string, received null" since optional only allows
      // undefined/missing, not null.
      Object.keys(payload).forEach((k) => (payload[k] === undefined || payload[k] === null) && delete payload[k]);

      const res = await apiFetch(`/assets/${assetId}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        showToast('success', 'Data unit berhasil disimpan');
        setEditMode(false);
        setTimeout(() => fetchData(), 500);
      } else {
        const errData = await res.json();
        showToast('error', errData.error?.message || 'Gagal menyimpan data unit');
      }
    } catch {
      showToast('error', 'Koneksi ke server gagal');
    } finally {
      setSaving(false);
    }
  };

  const movePhoto = (index: number, direction: 'up' | 'down') => {
    setPhotoOrder((prev) => {
      const arr = [...prev];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= arr.length) return prev;
      [arr[index], arr[targetIndex]] = [arr[targetIndex], arr[index]];
      return arr;
    });
    setPhotoOrderDirty(true);
  };

  const handleSavePhotoOrder = async () => {
    if (!asset) return;
    setSaving(true);
    try {
      const updateBody: Record<string, string | null> = {};
      PHOTO_LABELS.forEach((p) => { updateBody[p.key] = null; });
      photoOrder.forEach((origKey, idx) => {
        const targetKey = PHOTO_LABELS[idx]?.key;
        if (targetKey) {
          updateBody[targetKey as string] = asset[origKey as keyof AssetDetail] as string;
        }
      });
      const res = await apiFetch(`/assets/${assetId}`, {
        method: 'PUT',
        body: JSON.stringify(updateBody),
      });
      if (res.ok) {
        showToast('success', 'Urutan foto berhasil disimpan');
        setPhotoOrderDirty(false);
        setTimeout(() => fetchData(), 500);
      } else {
        const errData = await res.json();
        showToast('error', errData.error?.message || 'Gagal menyimpan urutan foto');
      }
    } catch {
      showToast('error', 'Koneksi ke server gagal');
    } finally {
      setSaving(false);
    }
  };

  const formatPrice = (v: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v);

  const formatDate = (iso: string | undefined) => {
    if (!iso) return '-';
    return new Date(iso).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  const InfoRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '0.5rem', fontSize: '0.875rem', alignItems: 'flex-start' }}>
      <span style={{ color: 'var(--text-secondary)', minWidth: '160px', fontWeight: 600 }}>{label}</span>
      <span style={{ color: 'var(--text-primary)', flex: 1 }}>{value || '-'}</span>
    </div>
  );

  if (loading) {
    return (
      <DashboardLayout>
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
          Memuat data unit...
        </div>
      </DashboardLayout>
    );
  }

  if (!asset) {
    return (
      <DashboardLayout>
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
          Unit tidak ditemukan.
        </div>
      </DashboardLayout>
    );
  }

  const statusVariant = asset.status === 'approved' ? 'success' : asset.status === 'rejected' ? 'danger' : 'warning';
  const canEdit = ['admin', 'superadmin'].includes(userRole);

  return (
    <DashboardLayout>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 9999,
          padding: '0.875rem 1.25rem', borderRadius: '0.75rem',
          background: toast.type === 'success' ? '#22c55e' : '#ef4444',
          color: '#fff', fontWeight: 600, boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          display: 'flex', alignItems: 'center', gap: '0.5rem',
        }}>
          <span>{toast.type === 'success' ? '✅' : '❌'}</span>
          {toast.message}
        </div>
      )}

      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{editMode ? '✏️ Edit Unit' : 'Detail Unit'}</h1>
          <p className="page-subtitle">
            <span style={{ cursor: 'pointer', color: 'var(--primary)' }} onClick={() => router.push('/assets')}>
              Daftar Unit
            </span>{' '}
            &bull; {editMode ? 'Edit' : 'Detail'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {editMode ? (
            <>
              <Button variant="outline" onClick={() => { setEditMode(false); setForm(asset); }}>✕ Batal</Button>
              <Button variant="primary" onClick={handleSaveEdit} disabled={saving}>
                {saving ? 'Menyimpan...' : '💾 Simpan Perubahan'}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => router.push('/assets')}>← Kembali</Button>
              {canEdit && (
                <Button variant="primary" onClick={() => setEditMode(true)}>✏️ Edit Data</Button>
              )}
              {canEdit && asset.status === 'pending' && (
                <>
                  <Button variant="success" onClick={handleApprove}>✓ Approve</Button>
                  <Button variant="danger" onClick={handleReject}>✕ Reject</Button>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Edit mode notice */}
      {editMode && (
        <div style={{
          background: '#eff6ff', border: '1px solid #93c5fd', borderRadius: '0.5rem',
          padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.875rem', color: '#1d4ed8',
          display: 'flex', alignItems: 'center', gap: '0.5rem',
        }}>
          <span>ℹ️</span>
          <span>Mode edit aktif. Ubah data yang diperlukan lalu klik <strong>Simpan Perubahan</strong>.</span>
        </div>
      )}

      {/* Asset Banner */}
      <Card title="">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
          <div style={{ width: '64px', height: '64px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', flexShrink: 0 }}>
            🚗
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: '1.15rem' }}>{editMode ? (form.title || asset.title) : asset.title}</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.2rem' }}>
              Ditambahkan: {formatDate(asset.created_at)} &bull; Diperbarui: {formatDate(asset.updated_at)}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <Badge variant="info">{editMode ? (form.category || asset.category) : asset.category}</Badge>
            <Badge variant={statusVariant}>{asset.status}</Badge>
            {asset.pool_status && (
              <Badge variant="default">
                {asset.pool_status === 'in_pool' ? 'Di Pool' : `Keluar Pool${asset.pool_city ? ` (${asset.pool_city})` : ''}`}
              </Badge>
            )}
          </div>
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '1.25rem' }}>

        {/* Left Column: Detail Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Informasi Umum */}
          <Card title="Informasi Umum">
            {editMode ? (
              <>
                <EditField label="Nama / Judul" value={form.title} onChange={(v) => handleFormChange('title', v)} />
                <EditField label="Kategori" value={form.category} onChange={(v) => handleFormChange('category', v)} type="select" options={['mobil', 'motor', 'alat_berat', 'properti']} />
                <EditField label="Harga Dasar (Rp)" value={form.base_price} onChange={(v) => handleFormChange('base_price', v)} type="number" />
                <EditField label="Status Pool" value={form.pool_status} onChange={(v) => handleFormChange('pool_status', v)} type="select" options={['in_pool', 'out_pool']} />
                {form.pool_status === 'out_pool' && (
                  <EditField label="Nama Kota" value={form.pool_city} onChange={(v) => handleFormChange('pool_city', v)} />
                )}
                <EditField label="Deskripsi" value={form.description} onChange={(v) => handleFormChange('description', v)} type="textarea" />
                <EditField label="Lokasi Unit" value={form.notes} onChange={(v) => handleFormChange('notes', v)} type="textarea" />
              </>
            ) : (
              <>
                <InfoRow label="Harga Dasar" value={<strong style={{ color: 'var(--primary)' }}>{formatPrice(asset.base_price)}</strong>} />
                <InfoRow label="Deskripsi" value={asset.description} />
                <InfoRow label="Lokasi Unit" value={asset.notes} />
                {asset.rejection_reason && <InfoRow label="Alasan Ditolak" value={<span style={{ color: 'var(--danger)' }}>{asset.rejection_reason}</span>} />}
              </>
            )}
          </Card>

          {/* Spesifikasi Unit */}
          <Card title="Spesifikasi Unit">
            {editMode ? (
              <>
                <EditField label="Merek" value={form.brand} onChange={(v) => { handleFormChange('brand', v); handleFormChange('model', ''); }} type="select" options={BRAND_OPTIONS} />
                <EditField label="Model" value={form.model} onChange={(v) => handleFormChange('model', v)} type="select" options={form.brand && CAR_MODELS_BY_BRAND[form.brand as string] ? [...CAR_MODELS_BY_BRAND[form.brand as string], 'Lainnya'] : ['Lainnya']} />
                <EditField label="Tipe" value={form.body_type} onChange={(v) => handleFormChange('body_type', v)} />
                <EditField label="Warna" value={form.color} onChange={(v) => handleFormChange('color', v)} type="select" options={COLOR_OPTIONS} />
                <EditField label="Jenis Bahan Bakar" value={form.fuel_type} onChange={(v) => handleFormChange('fuel_type', v)} type="select" options={['N/A', 'BENSIN', 'SOLAR', 'HYBRID', 'EV']} />
                <EditField label="Transmisi" value={form.transmission} onChange={(v) => handleFormChange('transmission', v)} type="select" options={['N/A', 'MANUAL', 'OTOMATIS']} />
                <EditField label="Tahun" value={form.year} onChange={(v) => handleFormChange('year', v)} />
                <EditField label="No Polisi" value={form.police_number} onChange={(v) => handleFormChange('police_number', v)} />
                <EditField label="No BPKB" value={form.bpkb_number} onChange={(v) => handleFormChange('bpkb_number', v)} />
                <EditField label="No Rangka" value={form.frame_number} onChange={(v) => handleFormChange('frame_number', v)} />
                <EditField label="No Mesin" value={form.engine_number} onChange={(v) => handleFormChange('engine_number', v)} />
                <EditField label="Kapasitas Mesin (CC)" value={form.cylinder} onChange={(v) => handleFormChange('cylinder', v)} />
                <EditField label="Odometer (km)" value={form.odometer} onChange={(v) => handleFormChange('odometer', v)} />
              </>
            ) : (
              <>
                <InfoRow label="Merek" value={asset.brand} />
                <InfoRow label="Model" value={asset.model} />
                <InfoRow label="Tipe" value={asset.body_type} />
                <InfoRow label="Warna" value={asset.color} />
                <InfoRow label="Jenis Bahan Bakar" value={asset.fuel_type} />
                <InfoRow label="Transmisi" value={asset.transmission} />
                <InfoRow label="Tipe Bodi" value={asset.body_type} />
                <InfoRow label="Tahun" value={asset.year} />
                <InfoRow label="No Polisi" value={asset.police_number} />
                <InfoRow label="No BPKB" value={asset.bpkb_number} />
                <InfoRow label="No Rangka" value={asset.frame_number} />
                <InfoRow label="No Mesin" value={asset.engine_number} />
                <InfoRow label="Kapasitas Mesin (CC)" value={asset.cylinder} />
                <InfoRow label="Odometer (km)" value={asset.odometer?.toLocaleString('id-ID')} />
              </>
            )}
          </Card>

          {/* Hasil Inspeksi — always shown in edit mode so grades/inspection
              data can be filled in for the first time, not just corrected. */}
          {(editMode || asset.grade_interior || asset.grade_exterior || asset.grade_engine) && (
            <Card title="Hasil Inspeksi">
              {editMode ? (
                <>
                  <EditField label="Inspektor (PIC)" value={form.inspection_pic_name} onChange={(v) => handleFormChange('inspection_pic_name', v)} />
                  <EditField label="Tanggal Inspeksi" value={form.inspection_date} onChange={(v) => handleFormChange('inspection_date', v)} type="date" />
                  <EditField label="Grade Interior" value={form.grade_interior} onChange={(v) => handleFormChange('grade_interior', v)} type="select" options={['N/A', 'A', 'B', 'C', 'D']} />
                  <EditField label="Grade Eksterior" value={form.grade_exterior} onChange={(v) => handleFormChange('grade_exterior', v)} type="select" options={['N/A', 'A', 'B', 'C', 'D']} />
                  <EditField label="Grade Mesin" value={form.grade_engine} onChange={(v) => handleFormChange('grade_engine', v)} type="select" options={['N/A', 'A', 'B', 'C', 'D']} />
                </>
              ) : (
                <>
                  <InfoRow label="Inspektor" value={asset.inspection_pic_name} />
                  <InfoRow label="Tanggal Inspeksi" value={formatDate(asset.inspection_date)} />
                  <InfoRow label="Grade Interior" value={asset.grade_interior} />
                  <InfoRow label="Grade Eksterior" value={asset.grade_exterior} />
                  <InfoRow label="Grade Mesin" value={asset.grade_engine} />
                  {asset.inspection_doc_url && (
                    <InfoRow label="Dokumen Inspeksi" value={
                      <a href={getImageUrl(asset.inspection_doc_url)} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)' }}>Lihat Dokumen ↗</a>
                    } />
                  )}
                </>
              )}
            </Card>
          )}

          {/* Kelengkapan Dokumen */}
          <Card title="Kelengkapan Dokumen">
            {editMode ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                {DOC_LABELS.map(({ key, label }) => (
                  <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 0.5rem', borderRadius: '0.375rem', background: form[key as keyof AssetDetail] ? '#dcfce7' : '#fee2e2', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={!!(form[key as keyof AssetDetail])}
                      onChange={(e) => handleFormChange(key as keyof AssetDetail, e.target.checked)}
                      style={{ width: '14px', height: '14px' }}
                    />
                    <span style={{ color: form[key as keyof AssetDetail] ? '#166534' : '#991b1b' }}>{label}</span>
                  </label>
                ))}
              </div>
            ) : null}
            {editMode && (
              <div style={{ marginTop: '0.75rem' }}>
                <EditField label="Masa Berlaku STNK" value={form.stnk_date} onChange={(v) => handleFormChange('stnk_date', v)} type="date" />
                <EditField label="Masa Berlaku Pajak" value={form.stnk_tax_date} onChange={(v) => handleFormChange('stnk_tax_date', v)} type="date" />
                <EditField label="Masa Berlaku KEUR" value={form.keur_date} onChange={(v) => handleFormChange('keur_date', v)} type="date" />
              </div>
            )}
            {!editMode && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  {DOC_LABELS.map(({ key, label }) => {
                    const present = !!asset[key as keyof AssetDetail];
                    return (
                      <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 0.5rem', borderRadius: '0.375rem', background: present ? '#dcfce7' : '#fee2e2', fontSize: '0.8rem', fontWeight: 600 }}>
                        <span>{present ? '✅' : '❌'}</span>
                        <span style={{ color: present ? '#166534' : '#991b1b' }}>{label}</span>
                      </div>
                    );
                  })}
                </div>
                <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  {asset.stnk_date && <span>STNK: {asset.stnk_date === 'N/A' ? 'N/A' : formatDate(asset.stnk_date)}</span>}
                  {asset.stnk_tax_date && <span>Pajak STNK: {asset.stnk_tax_date === 'N/A' ? 'N/A' : formatDate(asset.stnk_tax_date)}</span>}
                  {asset.keur_date && <span>KEUR: {asset.keur_date === 'N/A' ? 'N/A' : formatDate(asset.keur_date)}</span>}
                </div>
              </>
            )}
          </Card>
        </div>

        {/* Right Column: Photo Management */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <Card title="Foto Unit">
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Gunakan tombol ▲ / ▼ untuk mengatur urutan tampil foto. Klik <strong>Simpan Urutan</strong> untuk menyimpan perubahan.
            </p>

            {photoOrder.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)', border: '2px dashed var(--border)', borderRadius: '0.5rem' }}>
                📷 Belum ada foto yang diupload untuk kendaraan ini.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {photoOrder.map((key, index) => {
                  const photoUrl = asset[key as keyof AssetDetail] as string | undefined;
                  const label = PHOTO_LABELS.find((p) => p.key === key)?.label || key;
                  return (
                    <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem', border: '1px solid var(--border)', borderRadius: '0.5rem', background: 'var(--bg-secondary)' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <button
                          disabled={index === 0}
                          onClick={() => movePhoto(index, 'up')}
                          style={{ width: '28px', height: '24px', border: '1px solid var(--border)', borderRadius: '4px', background: index === 0 ? 'var(--bg-secondary)' : 'white', cursor: index === 0 ? 'not-allowed' : 'pointer', fontSize: '0.75rem', opacity: index === 0 ? 0.4 : 1 }}
                          title="Pindah ke atas"
                        >▲</button>
                        <button
                          disabled={index === photoOrder.length - 1}
                          onClick={() => movePhoto(index, 'down')}
                          style={{ width: '28px', height: '24px', border: '1px solid var(--border)', borderRadius: '4px', background: index === photoOrder.length - 1 ? 'var(--bg-secondary)' : 'white', cursor: index === photoOrder.length - 1 ? 'not-allowed' : 'pointer', fontSize: '0.75rem', opacity: index === photoOrder.length - 1 ? 0.4 : 1 }}
                          title="Pindah ke bawah"
                        >▼</button>
                      </div>

                      {photoUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={getImageUrl(photoUrl)}
                          alt={label}
                          style={{ width: '80px', height: '60px', objectFit: 'cover', borderRadius: '0.375rem', flexShrink: 0, border: '1px solid var(--border)' }}
                        />
                      ) : (
                        <div style={{ width: '80px', height: '60px', background: 'var(--border)', borderRadius: '0.375rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>📷</div>
                      )}

                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                          #{index + 1} — {label}
                        </div>
                        {photoUrl && (
                          <a href={getImageUrl(photoUrl)} target="_blank" rel="noreferrer" style={{ fontSize: '0.75rem', color: 'var(--primary)' }}>
                            Lihat Full ↗
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {photoOrderDirty && (
              <div style={{ marginTop: '1rem' }}>
                <Button variant="primary" onClick={handleSavePhotoOrder} disabled={saving}>
                  {saving ? 'Menyimpan...' : '💾 Simpan Urutan Foto'}
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
