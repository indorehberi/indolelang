'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import { apiFetch } from '../../../lib/api';
import { exportToExcel } from '../../../lib/excelExport';
import ColumnPicker, { useColumnVisibility, ColumnOption } from '../../../components/ui/ColumnPicker';

const PROVIDER_COLUMNS: ColumnOption[] = [
  { key: 'full_name', label: 'Nama Perwakilan', alwaysVisible: true },
  { key: 'company_name', label: 'Nama Perusahaan' },
  { key: 'contact', label: 'Kontak & Email' },
  { key: 'npwp', label: 'NPWP' },
  { key: 'status', label: 'Status' },
  { key: 'submitted_at', label: 'Tanggal Ajukan' },
  { key: 'actions', label: 'Aksi', alwaysVisible: true },
];

interface Provider {
  id: string; // providers table row id
  user_id: string;
  status: 'antri' | 'aktif' | 'ditolak' | 'nonaktif';
  company_name?: string;
  npwp?: string;
  npwp_url?: string;
  provider_fee_type?: string;
  provider_fee_amount?: number;
  pmk41_paid_by_provider?: boolean;
  rejection_reason?: string;
  submitted_at: string;
  address?: string;
  bank_name?: string;
  bank_account_no?: string;
  bank_account_name?: string;
  kyc?: {
    id: string;
    status: string;
    ktp_url?: string;
    selfie_url?: string;
  };
  user?: {
    id: string;
    full_name: string;
    email: string;
    phone: string | null;
  };
}

async function downloadFile(url: string, filename: string) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('fetch failed');
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(blobUrl);
  } catch {
    window.open(url, '_blank', 'noopener');
  }
}

export default function ProviderUsersPage() {
  const router = useRouter();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const { visibleKeys, setVisibleKeys, isVisible } = useColumnVisibility('provider_list', PROVIDER_COLUMNS);

  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    company_name: '',
    npwp: '',
    provider_fee_type: 'percentage',
    provider_fee_amount: '0',
    pmk41_paid_by_provider: false,
  });
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchProviders = useCallback(async () => {
    setLoading(true);
    try {
      let query = `/admin/providers?per_page=200`;
      if (filterStatus) query += `&status=${filterStatus}`;
      if (search) query += `&search=${encodeURIComponent(search)}`;
      if (startDate) query += `&start_date=${startDate}`;
      if (endDate) query += `&end_date=${endDate}`;

      const response = await apiFetch(query);
      const data = await response.json();
      if (response.ok && data.success) {
        setProviders(data.data);
      } else {
        setProviders([]);
      }
    } catch (err) {
      console.error('Failed to load providers', err);
      setProviders([]);
    } finally {
      setLoading(false);
    }
  }, [filterStatus, search, startDate, endDate]);

  useEffect(() => {
    const t = setTimeout(() => {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchProviders();
    }, 300);
    return () => clearTimeout(t);
  }, [fetchProviders]);

  const getStatusBadge = (status: Provider['status']) => {
    switch (status) {
      case 'aktif':
        return <Badge variant="success">Aktif</Badge>;
      case 'antri':
        return <Badge variant="warning">Menunggu Approval</Badge>;
      default:
        return <Badge variant="danger">Non Aktif</Badge>;
    }
  };

  const handleApprove = async (id: string) => {
    if (!window.confirm('Apakah Anda yakin ingin menyetujui pengajuan provider ini?')) return;
    try {
      const response = await apiFetch(`/admin/providers/${id}/approve`, { method: 'PUT' });
      if (response.ok) {
        setShowViewModal(false);
        fetchProviders();
      } else {
        const data = await response.json();
        showToast('error', data.error?.message || 'Gagal menyetujui provider');
      }
    } catch (err) {
      console.error(err);
      showToast('error', 'Terjadi kesalahan sistem');
    }
  };

  const handleReject = async (id: string) => {
    const reason = window.prompt('Masukkan alasan penolakan pengajuan provider:');
    if (reason === null) return;
    if (!reason.trim()) {
      showToast('error', 'Alasan penolakan tidak boleh kosong.');
      return;
    }
    try {
      const response = await apiFetch(`/admin/providers/${id}/reject`, {
        method: 'PUT',
        body: JSON.stringify({ reason: reason.trim() }),
      });
      if (response.ok) {
        setShowViewModal(false);
        fetchProviders();
      } else {
        const data = await response.json();
        showToast('error', data.error?.message || 'Gagal menolak provider');
      }
    } catch (err) {
      console.error(err);
      showToast('error', 'Terjadi kesalahan sistem');
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Gunakan user.id jika ada, fallback ke user_id dari providers table
    const userId = selectedProvider?.user?.id ?? selectedProvider?.user_id;
    if (!userId) {
      showToast('error', 'ID pengguna tidak ditemukan');
      return;
    }
    try {
      // Hanya kirim field yang terisi untuk menghindari error validasi min-length
      const payload: Record<string, unknown> = {
        full_name: formData.full_name,
        email: formData.email,
        company_name: formData.company_name,
        npwp: formData.npwp,
        provider_fee_type: formData.provider_fee_type,
        provider_fee_amount: Number(formData.provider_fee_amount),
        pmk41_paid_by_provider: formData.pmk41_paid_by_provider,
      };
      if (formData.phone.trim()) payload.phone = formData.phone.trim();

      const response = await apiFetch(`/admin/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        showToast('success', `Data provider "${formData.company_name || formData.full_name}" berhasil diperbarui`);
        setShowEditModal(false);
        fetchProviders();
      } else {
        showToast('error', data.error?.message || 'Gagal mengubah provider');
      }
    } catch (err) {
      console.error(err);
      showToast('error', 'Terjadi kesalahan sistem');
    }
  };

  const handleDelete = async () => {
    if (!selectedProvider?.user) return;
    try {
      const response = await apiFetch(`/admin/users/${selectedProvider.user.id}`, { method: 'DELETE' });
      if (response.ok) {
        setShowDeleteModal(false);
        fetchProviders();
      } else {
        const data = await response.json();
        showToast('error', data.error?.message || 'Gagal menghapus provider');
      }
    } catch (err) {
      console.error(err);
      showToast('error', 'Terjadi kesalahan sistem');
    }
  };

  const handleReVerify = async (id: string, fullName: string) => {
    if (
      !window.confirm(
        `Apakah Anda yakin ingin melakukan verifikasi ulang untuk ${fullName}? Tindakan ini akan mengembalikan status akun ke antrean verifikasi.`
      )
    ) {
      return;
    }
    try {
      const response = await apiFetch(`/admin/providers/${id}/re-verify`, {
        method: 'PUT',
      });
      if (response.ok) {
        showToast('success', 'Status provider berhasil dikembalikan ke antrean verifikasi');
        fetchProviders();
      } else {
        const data = await response.json();
        showToast('error', data.error?.message || 'Gagal melakukan verifikasi ulang');
      }
    } catch (err) {
      console.error(err);
      showToast('error', 'Terjadi kesalahan sistem');
    }
  };

  return (
    <DashboardLayout breadcrumbParent="Pengguna" breadcrumbCurrent="Mitra Provider">
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 9999,
          padding: '0.875rem 1.25rem', borderRadius: '0.75rem',
          background: toast.type === 'success' ? '#22c55e' : '#ef4444',
          color: '#fff', fontWeight: 600, boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', maxWidth: '400px',
        }}>
          <span>{toast.type === 'success' ? '✅' : '❌'}</span>
          {toast.message}
        </div>
      )}
      <div className="toolbar">
        <div className="toolbar-left">
          <h1 className="page-title">Manajemen Mitra Provider Aset</h1>
          <p className="page-subtitle">Hanya menampilkan pengguna yang mengajukan diri sebagai provider.</p>
        </div>
        <div className="toolbar-right" style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#64748b' }}>Dari:</span>
            <input
              type="date"
              className="search-box"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{ padding: '0.45rem', borderRadius: 'var(--radius)', border: '1px solid var(--wf-border)', fontSize: '0.85rem' }}
            />
            <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#64748b', marginLeft: '4px' }}>s.d.:</span>
            <input
              type="date"
              className="search-box"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{ padding: '0.45rem', borderRadius: 'var(--radius)', border: '1px solid var(--wf-border)', fontSize: '0.85rem' }}
            />
          </div>
          <select
            className="search-box"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ padding: '0.45rem 0.75rem', borderRadius: 'var(--radius)', border: '1px solid var(--wf-border)', background: 'white' }}
          >
            <option value="">Semua Status</option>
            <option value="antri">Menunggu Verifikasi (Antri)</option>
            <option value="aktif">Aktif</option>
            <option value="ditolak">Ditolak</option>
            <option value="nonaktif">Nonaktif</option>
          </select>
          <input
            type="text"
            placeholder="Cari nama perusahaan/email..."
            className="search-box"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const dataToExport = providers.map((p, index) => {
                const row: Record<string, any> = {};
                if (isVisible('no')) row['No'] = index + 1;
                if (isVisible('company')) row['Nama Perusahaan'] = p.company_name || p.user?.full_name || '-';
                if (isVisible('name')) row['Nama Kontak'] = p.user?.full_name || '-';
                if (isVisible('email')) row['Email'] = p.user?.email || '-';
                if (isVisible('phone')) row['No. Telepon'] = p.user?.phone || '-';
                if (isVisible('npwp')) row['NPWP'] = p.npwp || '-';
                if (isVisible('commission')) row['Tipe Komisi'] = p.provider_fee_type === 'percentage' ? 'Persentase (%)' : 'Fixed Nominal (Rp)';
                if (isVisible('commission')) row['Besar Komisi'] = p.provider_fee_amount ? Number(p.provider_fee_amount).toLocaleString('id-ID') : '0';
                if (isVisible('pmk41')) row['PMK 41 Dibayarkan Provider'] = p.pmk41_paid_by_provider ? 'Ya' : 'Tidak';
                if (isVisible('status')) row['Status Provider'] = p.status === 'aktif' ? 'Aktif' : p.status === 'antri' ? 'Menunggu Verifikasi' : p.status === 'ditolak' ? 'Ditolak' : 'Nonaktif';
                if (isVisible('kyc')) row['Status KYC'] = p.kyc?.status || 'Belum Verifikasi';
                if (isVisible('created_at')) row['Tanggal Terdaftar'] = p.submitted_at ? new Date(p.submitted_at).toLocaleDateString('id-ID') : '-';
                return row;
              });
              const ok = exportToExcel(dataToExport, 'Daftar_Provider_IndoLelang', 'Daftar Provider');
              if (ok) {
                showToast('success', 'Berhasil mendownload Excel Daftar Provider (.xlsx)');
              } else {
                showToast('error', 'Tidak ada data provider untuk di-export');
              }
            }}
            style={{ backgroundColor: '#107c41', color: '#fff', borderColor: '#107c41', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>file_download</span>
            Export XLSX
          </Button>
          <ColumnPicker
            columns={PROVIDER_COLUMNS}
            visibleKeys={visibleKeys}
            onChange={setVisibleKeys}
            tableId="provider_list"
          />
          <Button variant="primary" size="sm" onClick={() => router.push('/users/provider/new')}>
            + Tambah Provider
          </Button>
        </div>
      </div>

      <Card>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                {isVisible('full_name') && <th>Nama Perwakilan</th>}
                {isVisible('company_name') && <th>Nama Perusahaan</th>}
                {isVisible('contact') && <th>Kontak &amp; Email</th>}
                {isVisible('npwp') && <th>NPWP</th>}
                {isVisible('status') && <th>Status</th>}
                {isVisible('submitted_at') && <th>Tanggal Ajukan</th>}
                {isVisible('actions') && <th>Aksi</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={visibleKeys.length} className="text-center py-6">Memuat data provider...</td></tr>
              ) : providers.length === 0 ? (
                <tr><td colSpan={visibleKeys.length} className="text-center py-6 text-muted">Tidak ada provider ditemukan.</td></tr>
              ) : (
                providers.map((prov) => (
                  <tr key={prov.id}>
                    {isVisible('full_name') && <td><strong>{prov.user?.full_name}</strong></td>}
                    {isVisible('company_name') && <td>{prov.company_name || '-'}</td>}
                    {isVisible('contact') && (
                      <td>
                        <div>{prov.user?.email}</div>
                        <div className="text-muted" style={{ fontSize: '0.8rem' }}>{prov.user?.phone || '-'}</div>
                      </td>
                    )}
                    {isVisible('npwp') && <td><code style={{ fontSize: '0.85rem' }}>{prov.npwp || '-'}</code></td>}
                    {isVisible('status') && <td>{getStatusBadge(prov.status)}</td>}
                    {isVisible('submitted_at') && <td>{new Date(prov.submitted_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</td>}
                    {isVisible('actions') && (
                      <td>
                        <div className="d-flex gap-1">
                        <Button variant="outline" size="sm" onClick={() => {
                          setSelectedProvider(prov);
                          setShowViewModal(true);
                        }}>
                          View
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => {
                          setSelectedProvider(prov);
                          setFormData({
                            full_name: prov.user?.full_name || '',
                            email: prov.user?.email || '',
                            phone: prov.user?.phone || '',
                            company_name: prov.company_name || '',
                            npwp: prov.npwp || '',
                            provider_fee_type: prov.provider_fee_type || 'percentage',
                            provider_fee_amount: String(prov.provider_fee_amount || '0'),
                            pmk41_paid_by_provider: prov.pmk41_paid_by_provider || false,
                          });
                          setShowEditModal(true);
                        }}>
                          Edit
                        </Button>
                        <Button variant="danger" size="sm" onClick={() => {
                          setSelectedProvider(prov);
                          setShowDeleteModal(true);
                        }}>
                          Delete
                        </Button>
                        <Button
                          variant="gold"
                          size="sm"
                          onClick={() => handleReVerify(prov.id, prov.user?.full_name || '')}
                        >
                          Verifikasi Ulang
                        </Button>
                      </div>
                    </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* VIEW MODAL */}
      {showViewModal && selectedProvider && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '2rem' }}>
          <div style={{ maxWidth: '800px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <Card>
              <h3 style={{ marginBottom: '1rem' }}>Detail Provider</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem 1.5rem', marginBottom: '1.5rem' }}>
                <div><strong>Nama Perwakilan:</strong> {selectedProvider.user?.full_name || '-'}</div>
                <div><strong>Email:</strong> {selectedProvider.user?.email || '-'}</div>
                <div><strong>Telepon:</strong> {selectedProvider.user?.phone || '-'}</div>
                <div><strong>Nama Perusahaan:</strong> {selectedProvider.company_name || '-'}</div>
                <div><strong>NPWP:</strong> {selectedProvider.npwp || '-'}</div>
                <div><strong>Tipe Fee:</strong> {selectedProvider.provider_fee_type === 'percentage' ? 'Persentase (%)' : 'Nominal Tetap (Rp)'}</div>
                <div><strong>Nilai Fee:</strong> {selectedProvider.provider_fee_amount ?? '-'}</div>
                <div><strong>Pajak PMK-41 Ditanggung:</strong> {selectedProvider.pmk41_paid_by_provider ? 'Ya (Provider)' : 'Tidak (Platform)'}</div>
                <div><strong>Status:</strong> {getStatusBadge(selectedProvider.status)}</div>
                <div style={{ gridColumn: '1 / -1' }}><strong>Alamat:</strong> {selectedProvider.address || '-'}</div>
                <div><strong>Bank:</strong> {selectedProvider.bank_name || '-'}</div>
                <div><strong>No. Rekening:</strong> {selectedProvider.bank_account_no || '-'}</div>
                <div><strong>Atas Nama Rekening:</strong> {selectedProvider.bank_account_name || '-'}</div>
                <div><strong>Tanggal Ajukan:</strong> {selectedProvider.submitted_at ? new Date(selectedProvider.submitted_at).toLocaleDateString('id-ID') : '-'}</div>
                {selectedProvider.rejection_reason && (
                  <div style={{ gridColumn: '1 / -1' }}><strong>Alasan Ditolak:</strong> {selectedProvider.rejection_reason}</div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ border: '1px solid #eee', padding: '0.5rem', borderRadius: '4px' }}>
                  <h4 style={{ marginBottom: '0.5rem', textAlign: 'center' }}>Foto KTP</h4>
                  {selectedProvider.kyc?.ktp_url ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={selectedProvider.kyc.ktp_url} alt="KTP" style={{ width: '100%', height: '150px', objectFit: 'contain', marginBottom: '0.5rem' }} />
                      <Button
                        variant="outline"
                        size="sm"
                        style={{ width: '100%' }}
                        onClick={() => downloadFile(selectedProvider.kyc!.ktp_url!, `ktp-${selectedProvider.user?.full_name || selectedProvider.id}.jpg`)}
                      >
                        Unduh KTP
                      </Button>
                    </>
                  ) : (
                    <div style={{ padding: '2rem', textAlign: 'center', background: '#f9fafb' }}>Tidak ada KTP</div>
                  )}
                </div>
                <div style={{ border: '1px solid #eee', padding: '0.5rem', borderRadius: '4px' }}>
                  <h4 style={{ marginBottom: '0.5rem', textAlign: 'center' }}>Foto Selfie</h4>
                  {selectedProvider.kyc?.selfie_url ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={selectedProvider.kyc.selfie_url} alt="Selfie" style={{ width: '100%', height: '150px', objectFit: 'contain', marginBottom: '0.5rem' }} />
                      <Button
                        variant="outline"
                        size="sm"
                        style={{ width: '100%' }}
                        onClick={() => downloadFile(selectedProvider.kyc!.selfie_url!, `selfie-${selectedProvider.user?.full_name || selectedProvider.id}.jpg`)}
                      >
                        Unduh Selfie
                      </Button>
                    </>
                  ) : (
                    <div style={{ padding: '2rem', textAlign: 'center', background: '#f9fafb' }}>Tidak ada Selfie</div>
                  )}
                </div>
                <div style={{ border: '1px solid #eee', padding: '0.5rem', borderRadius: '4px' }}>
                  <h4 style={{ marginBottom: '0.5rem', textAlign: 'center' }}>Foto/Dokumen NPWP</h4>
                  {selectedProvider.npwp_url ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={selectedProvider.npwp_url} alt="NPWP" style={{ width: '100%', height: '150px', objectFit: 'contain', marginBottom: '0.5rem' }} />
                      <Button
                        variant="outline"
                        size="sm"
                        style={{ width: '100%' }}
                        onClick={() => downloadFile(selectedProvider.npwp_url!, `npwp-${selectedProvider.company_name || selectedProvider.id}.jpg`)}
                      >
                        Unduh NPWP
                      </Button>
                    </>
                  ) : (
                    <div style={{ padding: '2rem', textAlign: 'center', background: '#f9fafb' }}>Tidak ada NPWP</div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <Button variant="outline" type="button" onClick={() => setShowViewModal(false)}>Tutup</Button>
                {selectedProvider.status === 'antri' && (
                  <>
                    <Button variant="danger" type="button" onClick={() => handleReject(selectedProvider.id)}>
                      Tolak (Reject)
                    </Button>
                    <Button variant="primary" type="button" onClick={() => handleApprove(selectedProvider.id)}>
                      Setujui (Approve)
                    </Button>
                  </>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {showEditModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <Card>
            <h3 style={{ marginBottom: '1rem' }}>Edit Provider</h3>
            <form onSubmit={handleEdit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Nama Perwakilan</label>
                <input required type="text" value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }} />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Email</label>
                <input required type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }} />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Nomor Telepon</label>
                <input required type="text" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }} />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Nama Perusahaan</label>
                <input required type="text" value={formData.company_name} onChange={(e) => setFormData({ ...formData, company_name: e.target.value })} style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }} />
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>NPWP</label>
                <input required type="text" value={formData.npwp} onChange={(e) => setFormData({ ...formData, npwp: e.target.value })} style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }} />
              </div>

              <hr style={{ margin: '1rem 0', borderColor: '#eee' }} />
              <h4 style={{ marginBottom: '0.5rem' }}>Pengaturan Biaya &amp; Pajak</h4>
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem' }}>Tipe Biaya (Fee)</label>
                  <select value={formData.provider_fee_type} onChange={(e) => setFormData({ ...formData, provider_fee_type: e.target.value })} style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}>
                    <option value="percentage">Persentase (%)</option>
                    <option value="flat">Nominal Tetap (Rp)</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem' }}>Nilai Biaya</label>
                  <input type="number" value={formData.provider_fee_amount} onChange={(e) => setFormData({ ...formData, provider_fee_amount: e.target.value })} style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }} />
                </div>
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={formData.pmk41_paid_by_provider} onChange={(e) => setFormData({ ...formData, pmk41_paid_by_provider: e.target.checked })} />
                  <span>Pajak PMK-41 Ditanggung oleh Provider</span>
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <Button variant="outline" type="button" onClick={() => setShowEditModal(false)}>Batal</Button>
                <Button variant="primary" type="submit">Simpan</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* DELETE MODAL */}
      {showDeleteModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <Card>
            <h3 style={{ marginBottom: '1rem', color: 'var(--color-danger)' }}>Hapus Provider</h3>
            <p style={{ marginBottom: '1.5rem' }}>
              Apakah Anda yakin ingin menghapus <strong>{selectedProvider?.company_name || selectedProvider?.user?.full_name}</strong>? Tindakan ini akan menonaktifkan pengguna.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <Button variant="outline" type="button" onClick={() => setShowDeleteModal(false)}>Batal</Button>
              <Button variant="danger" type="button" onClick={handleDelete}>Hapus</Button>
            </div>
          </Card>
        </div>
      )}
    </DashboardLayout>
  );
}
