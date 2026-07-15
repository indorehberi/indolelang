'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { apiFetch } from '../../lib/api';
import { AssetCategory } from '@indo-lelang/shared-types';
import { useToast } from '../../providers/ToastProvider';

const CATEGORY_LABELS: Record<string, string> = {
  [AssetCategory.MOBIL]: '🚗 Mobil Penumpang',
  [AssetCategory.MOTOR]: '🏍️ Sepeda Motor',
  [AssetCategory.ALAT_BERAT]: '🏗️ Komersial & Alat Berat',
  [AssetCategory.PROPERTI]: '🏢 Properti',
};

interface Asset {
  id: string;
  provider_id: string;
  category: string;
  title: string;
  description?: string;
  base_price: number;
  images?: string[];
  status: 'pending' | 'inspected' | 'approved' | 'listed' | 'sold' | 'rejected' | 'returned';
  created_by_admin: boolean;
  created_at: string;
  provider?: {
    company_name?: string;
    full_name?: string;
  };
}

interface Provider {
  id: string;
  full_name: string;
  company_name?: string;
}

const parseJwt = (token: string) => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (err) {
    console.error('Failed to parse JWT', err);
    return null;
  }
};

export default function AssetsPage() {
  const router = useRouter();
  const toast = useToast();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchPolice, setSearchPolice] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [providerFilter, setProviderFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [poolFilter, setPoolFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  
  const [userRole, setUserRole] = useState<string>('');

  const [availableProviderIds, setAvailableProviderIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!providerFilter) {
      setAvailableProviderIds(new Set(assets.map(a => a.provider_id)));
    }
  }, [assets, providerFilter]);

  const displayedProviders = providers.filter(p => availableProviderIds.has(p.id) || providerFilter === p.id);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  const initialFormState = {
    provider_id: '',
    category: 'mobil',
    title: '',
    description: 'WAJIB CEK UNIT, TIDAK TERIMA KOMPLAIN, NO. RANGKA NO. MESIN TIDAK DI GESEK, BPKB 5 HK SETELAH PELUNASAN, COPY DOKUMEN T/A',
    base_price: '',
    is_recommended: 'false',
    
    // Inspeksi & Spec
    grade_interior: '',
    grade_exterior: '',
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
    engine_number: '',
    cylinder: '',
    odometer: '',
    
    // Dates
    stnk_date: '',
    stnk_tax_date: '',
    keur_date: '',
    
    // Booleans
    doc_stnk: 'false',
    doc_bpkb: 'false',
    doc_faktur: 'false',
    doc_kwitansi: 'false',
    doc_form_a: 'false',
    doc_copy_ktp: 'false',
    doc_keur: 'false',
    doc_sph: 'false',
    
    // Images
    img_depan: '',
    img_belakang: '',
    img_kanan: '',
    img_kiri: '',
    img_mesin: '',
    img_interior: '',
    img_stnk: '',
  };
  const [formData, setFormData] = useState<any>(initialFormState);

  
  
  const CAR_BRANDS = ['Toyota', 'Honda', 'Daihatsu', 'Suzuki', 'Mitsubishi', 'Nissan', 'Mazda', 'Hyundai', 'Kia', 'Wuling', 'BMW', 'Mercedes-Benz', 'Ford', 'BYD', 'Chery', 'MG', 'Neta', 'AION', 'VinFast', 'Geely', 'XPENG', 'Denza'];
  const MOTOR_BRANDS = ['Honda', 'Yamaha', 'Suzuki', 'Kawasaki', 'Vespa', 'TVS', 'KTM'];
  
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

  const MOTOR_MODELS_BY_BRAND: Record<string, string[]> = {
    Honda: ['Beat', 'Vario', 'Scoopy', 'PCX', 'ADV', 'CBR', 'Supra', 'Revo', 'CB150R', 'CRF150L'],
    Yamaha: ['NMAX', 'Aerox', 'Lexi', 'Mio', 'Fino', 'Vixion', 'R15', 'R25', 'MT-15', 'WR155R', 'Jupiter', 'Vega'],
    Suzuki: ['Satria', 'GSX-R150', 'GSX-S150', 'Nex', 'Address', 'Smash'],
    Kawasaki: ['Ninja 250', 'Ninja ZX-25R', 'KLX 150', 'W175', 'D-Tracker'],
    Vespa: ['Primavera', 'Sprint', 'GTS', 'LX', 'S 125'],
    TVS: ['Callisto', 'Ntorq', 'Apache'],
    KTM: ['Duke 200', 'Duke 250', 'Duke 390', 'RC 200', 'RC 250']
  };

  const COLORS = ['Hitam', 'Putih', 'Perak (Silver)', 'Abu-abu', 'Merah', 'Biru', 'Hijau', 'Kuning', 'Cokelat', 'Orange'];
  const BODY_TYPES = ['Sedan', 'SUV', 'MPV', 'Hatchback', 'Pick Up', 'Truk', 'Bus'];
  const YEARS = Array.from({length: new Date().getFullYear() - 1899}, (_, i) => new Date().getFullYear() - i);

  const getAvailableBrands = () => {
    if (formData.category === 'motor') return MOTOR_BRANDS;
    if (formData.category === 'mobil') return CAR_BRANDS;
    return Array.from(new Set([...CAR_BRANDS, ...MOTOR_BRANDS]));
  };

  const getAvailableModels = () => {
    if (formData.category === 'motor') {
      return formData.brand ? MOTOR_MODELS_BY_BRAND[formData.brand] || [] : [];
    }
    if (formData.category === 'mobil') {
      return formData.brand ? CAR_MODELS_BY_BRAND[formData.brand] || [] : [];
    }
    return [];
  };

  const renderFormFields = () => {
    const isMobil = formData.category === 'mobil';
    const isMotor = formData.category === 'motor';
    
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', maxHeight: '60vh', overflowY: 'auto', paddingRight: '0.5rem', marginBottom: '1rem' }}>
        {/* Kolom 1: Data Dasar */}
        <div>
          <h4 style={{ marginBottom: '1rem', color: 'var(--wf-primary)', borderBottom: '1px solid #ccc', paddingBottom: '0.5rem' }}>Data Dasar Barang</h4>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Provider (Pemilik)</label>
            <select required value={formData.provider_id} onChange={(e) => setFormData({...formData, provider_id: e.target.value})} style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}>
              <option value="" disabled>Pilih Provider...</option>
              {providers.map(p => (
                <option key={p.id} value={p.id}>{p.company_name || p.full_name}</option>
              ))}
            </select>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Kategori</label>
            <select required value={formData.category} onChange={(e) => {
              setFormData({...formData, category: e.target.value, brand: '', model: '', body_type: ''});
            }} style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}>
              <option value="" disabled>Pilih Kategori...</option>
              <option value="mobil">Mobil</option>
              <option value="motor">Motor</option>
            </select>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Nama Barang</label>
            <input required type="text" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }} />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Harga Dasar (Rp)</label>
            <input required type="number" min="1" value={formData.base_price} onChange={(e) => setFormData({...formData, base_price: e.target.value})} style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }} />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Deskripsi Tambahan</label>
            <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }} rows={3} />
          </div>

          <h4 style={{ marginBottom: '1rem', marginTop: '1.5rem', color: 'var(--wf-primary)', borderBottom: '1px solid #ccc', paddingBottom: '0.5rem' }}>Hasil Inspeksi</h4>
          <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>{isMotor ? 'Grade Body' : 'Grade Interior'}</label>
              <select value={formData.grade_interior} onChange={(e) => setFormData({...formData, grade_interior: e.target.value})} style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}>
                <option value="">--</option>
                {['N/A', 'A', 'B', 'C', 'D'].map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            {!isMotor && (
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Grade Exterior</label>
                <select value={formData.grade_exterior} onChange={(e) => setFormData({...formData, grade_exterior: e.target.value})} style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}>
                  <option value="">--</option>
                  {['N/A', 'A', 'B', 'C', 'D'].map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Kolom 2: Spesifikasi Kendaraan */}
        <div>
          <h4 style={{ marginBottom: '1rem', color: 'var(--wf-primary)', borderBottom: '1px solid #ccc', paddingBottom: '0.5rem' }}>Spesifikasi Barang</h4>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <div style={{ marginBottom: '0.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>Merek</label>
              <select value={formData.brand} onChange={(e) => {
                setFormData({...formData, brand: e.target.value, model: ''});
              }} style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}>
                <option value="">Pilih Merek...</option>
                {getAvailableBrands().map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            {formData.brand && (
              <div style={{ marginBottom: '0.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Tipe/Model</label>
                <select value={formData.model} onChange={(e) => setFormData({...formData, model: e.target.value})} style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}>
                  <option value="">Pilih Tipe...</option>
                  {getAvailableModels().map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            {isMobil && (
              <div style={{ marginBottom: '0.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Jenis Body</label>
                <select value={formData.body_type} onChange={(e) => setFormData({...formData, body_type: e.target.value})} style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}>
                  <option value="">Pilih Jenis...</option>
                  {BODY_TYPES.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
            )}
            <div style={{ marginBottom: '0.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>Warna</label>
              <select value={formData.color} onChange={(e) => setFormData({...formData, color: e.target.value})} style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}>
                <option value="">Pilih Warna...</option>
                {COLORS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <div style={{ marginBottom: '0.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>Bahan Bakar</label>
              <select value={formData.fuel_type} onChange={(e) => setFormData({...formData, fuel_type: e.target.value})} style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}>
                <option value="">--</option>
                {['Bensin', 'Solar', 'Hybrid', 'EV'].map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: '0.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>Transmisi</label>
              <select value={formData.transmission} onChange={(e) => setFormData({...formData, transmission: e.target.value})} style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}>
                <option value="">--</option>
                {['Manual', 'Otomatis'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <div style={{ marginBottom: '0.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>Tahun</label>
              <select value={formData.year} onChange={(e) => setFormData({...formData, year: e.target.value})} style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}>
                <option value="">--</option>
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: '0.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>Silinder (CC)</label>
              <input type="number" min="0" value={formData.cylinder} onChange={(e) => setFormData({...formData, cylinder: e.target.value})} style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }} placeholder="misal: 1500" />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <div style={{ marginBottom: '0.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>Odometer (KM)</label>
              <input type="number" min="0" value={formData.odometer} onChange={(e) => setFormData({...formData, odometer: e.target.value})} style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }} placeholder="misal: 50000" />
            </div>
            <div style={{ marginBottom: '0.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>No Polisi</label>
              <input type="text" value={formData.police_number} onChange={(e) => setFormData({...formData, police_number: e.target.value})} style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }} placeholder="B 1234 ABC" />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <div style={{ marginBottom: '0.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>No BPKB</label>
              <input type="text" value={formData.bpkb_number} onChange={(e) => setFormData({...formData, bpkb_number: e.target.value})} style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }} placeholder="No BPKB" />
            </div>
            <div style={{ marginBottom: '0.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>No Rangka</label>
              <input type="text" value={formData.frame_number} onChange={(e) => setFormData({...formData, frame_number: e.target.value})} style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }} placeholder="MH123..." />
            </div>
          </div>

        </div>
      </div>
    );
  };


  
  const handleReviewUlang = async (id: string) => {
    if (!confirm('Ajukan ulang barang ini untuk direview?')) return;
    try {
      const response = await apiFetch(`/assets/${id}/review`, { method: 'PUT' });
      if (response.ok) fetchAssets();
      else toast.error('Gagal mengajukan ulang');
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin menghapus barang ini secara permanen?')) return;
    try {
      const response = await apiFetch(`/assets/${id}`, { method: 'DELETE' });
      if (response.ok) fetchAssets();
      else toast.error('Gagal menghapus barang');
    } catch (err) { console.error(err); }
  };

  const fetchAssets = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      if (token) {
        const decoded = parseJwt(token);
        if (decoded) setUserRole(decoded.role);
      }

      let query = `?page=1&per_page=50`;
      if (statusFilter) query += `&status=${statusFilter}`;
      if (providerFilter) query += `&provider_id=${providerFilter}`;
      if (categoryFilter) query += `&category=${categoryFilter}`;
      if (search) query += `&search=${encodeURIComponent(search)}`;
      if (searchPolice) query += `&police_number=${encodeURIComponent(searchPolice)}`;
      if (poolFilter) query += `&pool_status=${poolFilter}`;
      if (dateFrom) query += `&date_from=${dateFrom}`;
      if (dateTo) query += `&date_to=${dateTo}`;

      const response = await apiFetch(`/assets${query}`);
      const data = await response.json();
      if (response.ok && data.success) {
        setAssets(data.data);
      } else {
        setAssets([]);
      }
    } catch (err) {
      console.error(err);
      setAssets([]);
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, search, searchPolice, statusFilter, providerFilter, poolFilter, dateFrom, dateTo]);

  const fetchProviders = async () => {
    try {
      const response = await apiFetch('/admin/users?role=provider&provider_status=approved&per_page=100');
      const data = await response.json();
      if (response.ok && data.success) {
        setProviders(data.data);
      }
    } catch (err) {
      console.error('Failed to load providers', err);
    }
  };

  useEffect(() => {
    fetchAssets();
    fetchProviders();
  }, [fetchAssets]);

  useEffect(() => {
    // Only fetch providers if user is admin or inspector
    if (['admin', 'superadmin', 'inspector'].includes(userRole)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchProviders();
    }
  }, [userRole]);

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(val);
  };

  const getStatusBadge = (status: Asset['status']) => {
    switch (status) {
      case 'listed':
        return <Badge variant="success">Listed (Active)</Badge>;
      case 'approved':
        return <Badge variant="info">Approved</Badge>;
      case 'pending':
        return <Badge variant="warning">Pending Review</Badge>;
      case 'inspected':
        return <Badge variant="warning">Sudah Diinspeksi</Badge>;
      case 'rejected':
        return <Badge variant="danger">Ditolak</Badge>;
      case 'sold':
        return <Badge variant="default">Sold</Badge>;
      case 'returned':
        return <Badge variant="danger">Dikembalikan</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAsset) return;
    try {
      const payload = { ...formData };
      payload.base_price = Number(payload.base_price);
      if (payload.year) payload.year = Number(payload.year);
      if (payload.cylinder) payload.cylinder = Number(payload.cylinder);
      if (payload.odometer) payload.odometer = Number(payload.odometer);

      Object.keys(payload).forEach(k => { if(payload[k] === '') delete payload[k] });

      const response = await apiFetch(`/assets/${selectedAsset.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setShowEditModal(false);
        fetchAssets();
      } else {
        toast.error(data.error?.message || 'Gagal mengubah unit barang');
      }
    } catch (err) {
      console.error(err);
      toast.error('Terjadi kesalahan sistem');
    }
  };

  const openEdit = (asset: Asset) => {
    setSelectedAsset(asset);
    setFormData({
      ...initialFormState,
      ...asset,
      provider_id: asset.provider_id,
      category: asset.category,
      title: asset.title,
      description: asset.description || '',
      base_price: asset.base_price?.toString() || '',
      year: (asset as any).year?.toString() || '',
      cylinder: (asset as any).cylinder?.toString() || '',
      odometer: (asset as any).odometer?.toString() || '',
    });
    setShowEditModal(true);
  };

  const canEdit = (asset: Asset) => {
    if (['admin', 'superadmin'].includes(userRole)) {
      return asset.created_by_admin;
    }
    if (userRole === 'inspector' && asset.status === 'pending') return true;
    return false;
  };

  return (
    <DashboardLayout breadcrumbParent="Katalog" breadcrumbCurrent="Daftar Barang">
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', alignItems: 'center' }}>
        <input type="text" placeholder="Cari No. Polisi..." value={searchPolice} onChange={e => setSearchPolice(e.target.value)} className="panel-form-input" style={{ width: '200px' }} />
      </div>
      <div className="toolbar">
        <div className="toolbar-left">
          <h1 className="page-title">Katalog Barang</h1>
          <p className="page-subtitle">Daftar semua unit aset barang yang didaftarkan.</p>
        </div>
        <div className="toolbar-right">
          {['admin', 'superadmin', 'inspector'].includes(userRole) && (
            <Button variant="primary" size="sm" onClick={() => router.push('/assets/new')}>
              + Tambah Barang
            </Button>
          )}
        </div>
      </div>

      {/* Filter Card */}
      <Card className="mb-2">
        <div className="grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div>
            <label className="form-label" style={{ fontWeight: '600', fontSize: '0.85rem' }}>Cari Nama Barang</label>
            <input
              type="text"
              className="search-box w-100"
              style={{ width: '100%', height: '36px', padding: '0 0.75rem', borderRadius: 'var(--radius)', border: '1px solid var(--wf-border)' }}
              placeholder="Masukkan kata kunci..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div>
            <label className="form-label" style={{ fontWeight: '600', fontSize: '0.85rem' }}>Kategori</label>
            <select
              className="form-select"
              style={{ width: '100%', height: '36px', padding: '0 0.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--wf-border)', background: 'white' }}
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="">Semua Kategori</option>
              <option value="mobil">Mobil</option>
              <option value="motor">Motor</option>
            </select>
          </div>

          <div>
            <label className="form-label" style={{ fontWeight: '600', fontSize: '0.85rem' }}>Status</label>
            <select
              className="form-select"
              style={{ width: '100%', height: '36px', padding: '0 0.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--wf-border)', background: 'white' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Semua</option>
              <option value="pending">Menunggu (Pending)</option>
              <option value="inspected">Sudah Diinspeksi</option>
              <option value="approved,listed">Disetujui/Listed</option>
              <option value="rejected">Ditolak</option>
              <option value="returned">Dikembalikan</option>
              <option value="sold">Terjual</option>
            </select>
          </div>

          {['admin', 'superadmin', 'inspector'].includes(userRole) && (
            <div>
              <label className="form-label" style={{ fontWeight: '600', fontSize: '0.85rem' }}>Provider</label>
              <select
                className="form-select"
                style={{ width: '100%', height: '36px', padding: '0 0.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--wf-border)', background: 'white' }}
                value={providerFilter}
                onChange={(e) => setProviderFilter(e.target.value)}
              >
                <option value="">Semua Provider</option>
                {displayedProviders.map((p) => (
                  <option key={p.id} value={p.id}>{p.company_name || p.full_name}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="form-label" style={{ fontWeight: '600', fontSize: '0.85rem' }}>Pool</label>
            <select
              className="form-select"
              style={{ width: '100%', height: '36px', padding: '0 0.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--wf-border)', background: 'white' }}
              value={poolFilter}
              onChange={(e) => setPoolFilter(e.target.value)}
            >
              <option value="">Semua Pool</option>
              <option value="in_pool">In Pool</option>
              <option value="out_pool">Out Pool</option>
            </select>
          </div>

          <div>
            <label className="form-label" style={{ fontWeight: '600', fontSize: '0.85rem' }}>Dari Tanggal</label>
            <input
              type="date"
              className="form-select"
              style={{ width: '100%', height: '36px', padding: '0 0.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--wf-border)' }}
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>

          <div>
            <label className="form-label" style={{ fontWeight: '600', fontSize: '0.85rem' }}>Sampai Tanggal</label>
            <input
              type="date"
              className="form-select"
              style={{ width: '100%', height: '36px', padding: '0 0.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--wf-border)' }}
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
        </div>
      </Card>

      <Card>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Nama Barang</th>
                <th>Kategori</th>
                <th>Provider</th>
                <th>No. Polisi</th>
                <th>Harga Dasar</th>
                <th>Status</th>
                <th>Tanggal Masuk</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center">Memuat daftar barang...</td>
                </tr>
              ) : assets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center text-muted">Tidak ada unit barang ditemukan.</td>
                </tr>
              ) : (
                assets.map((asset) => (
                  <tr key={asset.id}>
                    <td>
                      <div>
                        <strong>{asset.title}</strong>
                        <div className="text-muted" style={{ fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '300px' }}>
                          {asset.description || 'Tidak ada deskripsi.'}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ textTransform: 'capitalize' }}>
                        {asset.category.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>
                      {asset.provider?.company_name || asset.provider?.full_name || 'Admin'}
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>{(asset as any).police_number || '-'}</td>
                    <td>
                      <strong className="text-primary">{formatRupiah(asset.base_price)}</strong>
                    </td>
                    <td>{getStatusBadge(asset.status)}</td>
                    <td>
                      {new Date(asset.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td>
                      <div className="d-flex gap-1 flex-wrap">
                        {['admin', 'superadmin'].includes(userRole) && (
                          <Button variant="outline" size="sm" onClick={() => router.push(`/assets/${asset.id}`)}>View</Button>
                        )}
                        {['admin', 'superadmin'].includes(userRole) && (
                          <Button variant="primary" size="sm" onClick={() => router.push(`/assets/${asset.id}`)}>Edit</Button>
                        )}
                        {['admin', 'superadmin', 'inspector'].includes(userRole) && asset.status === 'pending' && (
                          <Button variant="primary" size="sm" onClick={() => router.push(`/assets/inspection?open=${asset.id}`)}>Inspeksi</Button>
                        )}
                        {userRole === 'inspector' && (
                          <Button variant="outline" size="sm" onClick={() => openEdit(asset)}>Edit</Button>
                        )}
                        {['inspector', 'provider'].includes(userRole) && ['rejected', 'returned'].includes(asset.status) && (
                          <Button variant="primary" size="sm" onClick={() => handleReviewUlang(asset.id)}>Ajukan</Button>
                        )}
                        {['admin', 'superadmin', 'inspector'].includes(userRole) && asset.created_by_admin && (
                          <Button variant="danger" size="sm" onClick={() => handleDelete(asset.id)}>Delete</Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* CREATE MODAL REMOVED */}

      {/* EDIT MODAL */}
      {showEditModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ width: '90%', maxWidth: '900px' }}>
            <Card>
              <h3 style={{ marginBottom: '1rem' }}>Edit Barang Barang (Inspeksi)</h3>
            <form onSubmit={handleEdit}>
              {renderFormFields()}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <Button variant="outline" type="button" onClick={() => setShowEditModal(false)}>Batal</Button>
                <Button variant="primary" type="submit">Simpan Perubahan</Button>
              </div>
            </form>
          </Card>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
