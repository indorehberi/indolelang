'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import Toast from '../../../components/ui/Toast';
import { apiUrl } from '../../../lib/api';

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
}

export default function AssetsInspectionPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'danger' } | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [processing, setProcessing] = useState(false);

  // Form State
  const [formData, setFormData] = useState<any>({
    inspection_date: new Date().toISOString().split('T')[0],
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

  const fetchPendingAssets = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(apiUrl('/assets?status=pending&per_page=100'), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setAssets(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingAssets();
  }, []);

  const openInspection = (asset: Asset) => {
    setSelectedAsset(asset);
    setFormData({
      inspection_date: new Date().toISOString().split('T')[0] + 'T00:00:00Z',
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
      year: asset.year || '',
      police_number: asset.police_number || '',
      bpkb_number: asset.bpkb_number || '',
      frame_number: asset.frame_number || '',
      cylinder: asset.cylinder || '',
      odometer: asset.odometer || '',
    });
    setShowModal(true);
  };

  const handleInspect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAsset) return;
    setProcessing(true);
    setToast(null);

    const payload = {
      ...formData,
      year: parseInt(formData.year),
      cylinder: parseInt(formData.cylinder),
      odometer: parseInt(formData.odometer),
    };

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(apiUrl(`/admin/assets/${selectedAsset.id}/inspect`), {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        let msg = data.error?.message || 'Gagal melakukan inspeksi';
        if (data.error?.details && Array.isArray(data.error.details)) {
            msg = data.error.details.map((d: any) => d.message).join(', ');
        }
        throw new Error(msg);
      }

      setToast({ message: 'Barang berhasil diinspeksi!', variant: 'success' });
      setShowModal(false);
      fetchPendingAssets();
    } catch (err: any) {
      setToast({ message: err.message, variant: 'danger' });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Inspeksi Barang</h1>
          <p className="text-sm text-slate-500 mt-1">Lakukan inspeksi dan verifikasi kelayakan barang.</p>
        </div>
      </div>

      {toast && (
        <div className="mb-4">
          <Toast
            message={toast.message}
            variant={toast.variant}
            onClose={() => setToast(null)}
          />
        </div>
      )}

      <Card>
        {loading ? (
          <div className="p-8 text-center text-slate-500">Memuat data...</div>
        ) : assets.length === 0 ? (
          <div className="p-8 text-center text-slate-500">Tidak ada barang yang menunggu inspeksi.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Barang</th>
                  <th className="px-4 py-3">Kategori</th>
                  <th className="px-4 py-3">Harga Dasar</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {assets.map((asset) => (
                  <tr key={asset.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{asset.title}</div>
                      <div className="text-xs text-slate-500 mt-0.5">ID: {asset.id.split('-')[0]}...</div>
                    </td>
                    <td className="px-4 py-3 capitalize">{asset.category.replace('_', ' ')}</td>
                    <td className="px-4 py-3">Rp {asset.base_price.toLocaleString('id-ID')}</td>
                    <td className="px-4 py-3 text-right">
                      <Button size="sm" onClick={() => openInspection(asset)}>
                        Inspeksi
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* MODAL INSPEKSI */}
      {showModal && selectedAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Formulir Inspeksi</h3>
                <p className="text-xs text-slate-500">{selectedAsset.title}</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <span className="material-icons">close</span>
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1">
              <form id="inspectForm" onSubmit={handleInspect} className="space-y-6">
                
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                  <h4 className="font-semibold text-slate-700 mb-4 border-b pb-2">Detail Inspeksi</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Tanggal Inspeksi *</label>
                      <input type="datetime-local" className="w-full px-3 py-2 border rounded-lg text-sm" value={formData.inspection_date.substring(0,16)} onChange={(e) => setFormData({...formData, inspection_date: e.target.value + ':00Z'})} required />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Grade Interior *</label>
                      <select className="w-full px-3 py-2 border rounded-lg text-sm" value={formData.grade_interior} onChange={(e) => setFormData({...formData, grade_interior: e.target.value})}>
                        <option value="A">A - Sangat Baik</option>
                        <option value="B">B - Baik</option>
                        <option value="C">C - Cukup</option>
                        <option value="D">D - Kurang</option>
                        <option value="E">E - Buruk</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Grade Exterior *</label>
                      <select className="w-full px-3 py-2 border rounded-lg text-sm" value={formData.grade_exterior} onChange={(e) => setFormData({...formData, grade_exterior: e.target.value})}>
                        <option value="A">A - Sangat Baik</option>
                        <option value="B">B - Baik</option>
                        <option value="C">C - Cukup</option>
                        <option value="D">D - Kurang</option>
                        <option value="E">E - Buruk</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Grade Mesin *</label>
                      <select className="w-full px-3 py-2 border rounded-lg text-sm" value={formData.grade_engine} onChange={(e) => setFormData({...formData, grade_engine: e.target.value})}>
                        <option value="A">A - Sangat Baik</option>
                        <option value="B">B - Baik</option>
                        <option value="C">C - Cukup</option>
                        <option value="D">D - Kurang</option>
                        <option value="E">E - Buruk</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                  <h4 className="font-semibold text-slate-700 mb-4 border-b pb-2">Data Kendaraan & Verifikasi</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Kategori *</label>
                      <select className="w-full px-3 py-2 border rounded-lg text-sm" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} required>
                        <option value="">Pilih Kategori</option>
                        <option value="mobil">Mobil</option>
                        <option value="motor">Motor</option>
                        <option value="alat_berat">Alat Berat</option>
                        <option value="properti">Properti</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Merek *</label>
                      <input type="text" className="w-full px-3 py-2 border rounded-lg text-sm" value={formData.brand} onChange={(e) => setFormData({...formData, brand: e.target.value})} required />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Tipe (Model) *</label>
                      <input type="text" className="w-full px-3 py-2 border rounded-lg text-sm" value={formData.model} onChange={(e) => setFormData({...formData, model: e.target.value})} required />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Warna *</label>
                      <input type="text" className="w-full px-3 py-2 border rounded-lg text-sm" value={formData.color} onChange={(e) => setFormData({...formData, color: e.target.value})} required />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Bahan Bakar *</label>
                      <input type="text" className="w-full px-3 py-2 border rounded-lg text-sm" value={formData.fuel_type} onChange={(e) => setFormData({...formData, fuel_type: e.target.value})} required />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Transmisi *</label>
                      <input type="text" className="w-full px-3 py-2 border rounded-lg text-sm" value={formData.transmission} onChange={(e) => setFormData({...formData, transmission: e.target.value})} required />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Jenis (Body Type) *</label>
                      <input type="text" className="w-full px-3 py-2 border rounded-lg text-sm" value={formData.body_type} onChange={(e) => setFormData({...formData, body_type: e.target.value})} required />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Tahun Buat *</label>
                      <input type="number" className="w-full px-3 py-2 border rounded-lg text-sm" value={formData.year} onChange={(e) => setFormData({...formData, year: e.target.value})} required />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">No Polisi *</label>
                      <input type="text" className="w-full px-3 py-2 border rounded-lg text-sm" value={formData.police_number} onChange={(e) => setFormData({...formData, police_number: e.target.value})} required />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">No BPKB *</label>
                      <input type="text" className="w-full px-3 py-2 border rounded-lg text-sm" value={formData.bpkb_number} onChange={(e) => setFormData({...formData, bpkb_number: e.target.value})} required />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">No Rangka *</label>
                      <input type="text" className="w-full px-3 py-2 border rounded-lg text-sm" value={formData.frame_number} onChange={(e) => setFormData({...formData, frame_number: e.target.value})} required />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Cylinder (CC) *</label>
                      <input type="number" className="w-full px-3 py-2 border rounded-lg text-sm" value={formData.cylinder} onChange={(e) => setFormData({...formData, cylinder: e.target.value})} required />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Odometer (KM) *</label>
                      <input type="number" className="w-full px-3 py-2 border rounded-lg text-sm" value={formData.odometer} onChange={(e) => setFormData({...formData, odometer: e.target.value})} required />
                    </div>
                  </div>
                </div>

              </form>
            </div>
            
            <div className="p-5 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
              <Button variant="outline" onClick={() => setShowModal(false)}>Batal</Button>
              <Button type="submit" form="inspectForm" disabled={processing}>{processing ? 'Memproses...' : 'Simpan Hasil Inspeksi'}</Button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
