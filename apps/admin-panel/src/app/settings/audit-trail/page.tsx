'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import { apiFetch } from '../../../lib/api';
import { useToast } from '../../../providers/ToastProvider';
import { exportToExcel } from '../../../lib/excelExport';
import ColumnPicker, { useColumnVisibility, ColumnOption } from '../../../components/ui/ColumnPicker';

const AUDIT_COLUMNS: ColumnOption[] = [
  { key: 'waktu', label: 'Waktu Kejadian', alwaysVisible: true },
  { key: 'pelaku', label: 'Nama Pelaku (Actor)', defaultVisible: true },
  { key: 'aksi', label: 'Aksi (Action)', alwaysVisible: true },
  { key: 'modul', label: 'Tipe Modul', defaultVisible: true },
  { key: 'resource_id', label: 'ID Resource', defaultVisible: true },
  { key: 'nilai_lama', label: 'Nilai Lama', defaultVisible: true },
  { key: 'nilai_baru', label: 'Nilai Baru', defaultVisible: true },
  { key: 'ip_address', label: 'Alamat IP', defaultVisible: true },
];

interface AuditLog {
  id: string;
  action: string;
  user_id?: string;
  resource_type: string;
  resource_id: string;
  old_value?: string;
  new_value?: string;
  ip_address: string;
  created_at: string;
  user?: {
    id: string;
    full_name: string;
    email: string;
    role: string;
  };
}

export default function AuditTrailPage() {
  const toast = useToast();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [actionInput, setActionInput] = useState('');
  const [resourceType, setResourceType] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  
  // Active query parameters (to prevent fetching on typing without clicking Filter)
  const [actionFilter, setActionFilter] = useState('');
  
  // Pagination states
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const perPage = 20;

  const { visibleKeys, setVisibleKeys, isVisible } = useColumnVisibility('audit_trail_list', AUDIT_COLUMNS);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      let query = `?page=${page}&per_page=${perPage}`;
      
      if (actionFilter) query += `&action=${encodeURIComponent(actionFilter)}`;
      if (resourceType) query += `&resource_type=${encodeURIComponent(resourceType)}`;
      if (fromDate) query += `&from_date=${encodeURIComponent(fromDate)}`;
      if (toDate) query += `&to_date=${encodeURIComponent(toDate)}`;

      const res = await apiFetch(`/audit-logs${query}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setLogs(json.data);
          if (json.meta) {
            setTotalPages(json.meta.total_pages || 1);
            setTotalLogs(json.meta.total || 0);
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, actionFilter, resourceType, fromDate, toDate]);

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setActionFilter(actionInput);
  };

  const handleResetFilters = () => {
    setActionInput('');
    setActionFilter('');
    setResourceType('');
    setFromDate('');
    setToDate('');
    setPage(1);
  };

  const handleExport = async (format: 'csv' | 'json') => {
    try {
      let query = `?`;
      if (actionFilter) query += `&action=${encodeURIComponent(actionFilter)}`;
      if (resourceType) query += `&resource_type=${encodeURIComponent(resourceType)}`;
      if (fromDate) query += `&from_date=${encodeURIComponent(fromDate)}`;
      if (toDate) query += `&to_date=${encodeURIComponent(toDate)}`;

      const res = await apiFetch(`/audit-logs/export${query}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          const exportData = json.data;
          if (format === 'csv') {
            downloadCSV(exportData);
          } else {
            downloadJSON(exportData);
          }
        }
      } else {
        toast.error('Gagal mengekspor data dari server');
      }
    } catch (err) {
      console.error('Export failed:', err);
      toast.error('Terjadi kesalahan saat mengekspor data');
    }
  };

  const downloadCSV = (data: AuditLog[]) => {
    const headers = ['Waktu Kejadian', 'Nama Pelaku (Actor)', 'Peran', 'Aksi (Action)', 'Tipe Modul', 'ID Resource', 'Nilai Lama', 'Nilai Baru', 'Alamat IP'];
    const rows = data.map(log => [
      new Date(log.created_at).toLocaleString('id-ID'),
      log.user ? log.user.full_name : (log.user_id || 'System'),
      log.user ? log.user.role : 'system',
      log.action,
      log.resource_type,
      log.resource_id,
      log.old_value || '',
      log.new_value || '',
      log.ip_address || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadJSON = (data: AuditLog[]) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `audit_logs_${new Date().toISOString().split('T')[0]}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportExcel = () => {
    const dataToExport = logs.map((log) => {
      const row: Record<string, any> = {};
      if (isVisible('waktu')) {
        row['Waktu Kejadian'] = new Date(log.created_at).toLocaleString('id-ID', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        });
      }
      if (isVisible('pelaku')) row['Nama Pelaku (Actor)'] = log.user ? log.user.full_name : 'System';
      if (isVisible('aksi')) row['Aksi (Action)'] = log.action;
      if (isVisible('modul')) row['Tipe Modul'] = log.resource_type;
      if (isVisible('resource_id')) row['ID Resource'] = log.resource_id;
      if (isVisible('nilai_lama')) row['Nilai Lama'] = log.old_value || '';
      if (isVisible('nilai_baru')) row['Nilai Baru'] = log.new_value || '';
      if (isVisible('ip_address')) row['Alamat IP'] = log.ip_address || '';
      return row;
    });
    const ok = exportToExcel(dataToExport, 'Audit_Trail_IndoLelang', 'Audit Trail');
    if (ok) {
      toast.success('Berhasil mendownload laporan Excel Audit Trail (.xlsx)');
    } else {
      toast.error('Tidak ada data audit trail untuk di-export');
    }
  };

  const getActionBadge = (action: string) => {
    if (action.includes('APPROVE') || action.includes('SUCCESS') || action.includes('PAID') || action.includes('CREATE')) {
      return <Badge variant="success">{action}</Badge>;
    }
    if (action.includes('REJECT') || action.includes('DELETE') || action.includes('EXPIRE') || action.includes('CANCEL')) {
      return <Badge variant="danger">{action}</Badge>;
    }
    return <Badge variant="info">{action}</Badge>;
  };

  return (
    <DashboardLayout breadcrumbParent="Pengaturan" breadcrumbCurrent="Audit Trail">
      <div className="toolbar">
        <div className="toolbar-left">
          <h1 className="page-title">Audit Trail Log Aktivitas Sistem</h1>
          <p className="page-subtitle">Daftar rekam jejak aktivitas staf administratif yang immutable untuk menjamin kepatuhan audit dan keamanan.</p>
        </div>
        <div className="toolbar-right d-flex gap-1" style={{ alignItems: 'center' }}>
          <button className="btn btn-sm btn-outline" onClick={() => handleExport('json')} disabled={logs.length === 0}>
            💾 Ekspor JSON
          </button>
          <button className="btn btn-sm btn-primary" onClick={() => handleExport('csv')} disabled={logs.length === 0}>
            📊 Ekspor CSV
          </button>
          <button
            className="btn btn-sm btn-outline"
            onClick={handleExportExcel}
            disabled={logs.length === 0}
            style={{ backgroundColor: '#107c41', color: '#fff', borderColor: '#107c41' }}
          >
            📥 Export Excel
          </button>
          <ColumnPicker
            columns={AUDIT_COLUMNS}
            visibleKeys={visibleKeys}
            onChange={setVisibleKeys}
            tableId="audit_trail_list"
          />
        </div>
      </div>

      {/* Filter Card */}
      <Card className="mb-2">
        <form onSubmit={handleFilterSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'end' }}>
            <div>
              <label className="form-label" style={{ fontWeight: '600', fontSize: '0.85rem' }}>Aksi (Action)</label>
              <input
                type="text"
                className="form-control"
                placeholder="Contoh: APPROVE_KYC"
                value={actionInput}
                onChange={(e) => setActionInput(e.target.value)}
              />
            </div>

            <div>
              <label className="form-label" style={{ fontWeight: '600', fontSize: '0.85rem' }}>Tipe Modul / Resource</label>
              <select
                className="form-select"
                style={{ width: '100%', height: '38px', padding: '0 0.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--wf-border)', background: 'white' }}
                value={resourceType}
                onChange={(e) => setResourceType(e.target.value)}
              >
                <option value="">Semua Modul</option>
                <option value="users">users (Pengguna)</option>
                <option value="kyc_documents">kyc_documents (KYC)</option>
                <option value="branches">branches (Cabang)</option>
                <option value="auction_sessions">auction_sessions (Sesi Lelang)</option>
                <option value="assets">assets (Aset)</option>
                <option value="lots">lots (Lot Lelang)</option>
                <option value="deposits">deposits (Deposit/NIPL)</option>
                <option value="invoices">invoices (Tagihan/Invoice)</option>
                <option value="settlements">settlements (Pencairan Dana)</option>
                <option value="documents">documents (Surat Jalan/BAST)</option>
                <option value="platform_settings">platform_settings (Konfigurasi)</option>
              </select>
            </div>

            <div>
              <label className="form-label" style={{ fontWeight: '600', fontSize: '0.85rem' }}>Dari Tanggal</label>
              <input
                type="date"
                className="form-control"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>

            <div>
              <label className="form-label" style={{ fontWeight: '600', fontSize: '0.85rem' }}>Sampai Tanggal</label>
              <input
                type="date"
                className="form-control"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>

            <div className="d-flex gap-1" style={{ height: '38px' }}>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Cari</button>
              <button type="button" className="btn btn-outline" onClick={handleResetFilters}>Reset</button>
            </div>
          </div>
        </form>
      </Card>

      <Card>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                {isVisible('waktu') && <th>Waktu Kejadian</th>}
                {isVisible('pelaku') && <th>Nama Pelaku (Actor)</th>}
                {isVisible('aksi') && <th>Aksi (Action)</th>}
                {isVisible('modul') && <th>Tipe Modul</th>}
                {isVisible('resource_id') && <th>ID Resource</th>}
                {isVisible('nilai_lama') && <th>Nilai Lama</th>}
                {isVisible('nilai_baru') && <th>Nilai Baru</th>}
                {isVisible('ip_address') && <th>Alamat IP</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={visibleKeys.length} className="text-center">Memuat log audit trail...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={visibleKeys.length} className="text-center text-muted">Belum ada rekaman log audit trail.</td></tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id}>
                    {isVisible('waktu') && (
                      <td style={{ fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                        {new Date(log.created_at).toLocaleString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })}
                      </td>
                    )}
                    {isVisible('pelaku') && (
                      <td>
                        <div>
                          <strong>{log.user ? log.user.full_name : 'System'}</strong>
                          {log.user && (
                            <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                              {log.user.email} | <span style={{ textTransform: 'capitalize' }}>{log.user.role}</span>
                            </div>
                          )}
                        </div>
                      </td>
                    )}
                    {isVisible('aksi') && <td>{getActionBadge(log.action)}</td>}
                    {isVisible('modul') && <td><span className="badge badge-outline" style={{ fontSize: '0.75rem' }}>{log.resource_type}</span></td>}
                    {isVisible('resource_id') && <td><code style={{ fontSize: '0.8rem' }} title={log.resource_id}>{log.resource_id.substring(0, 8)}...</code></td>}
                    {isVisible('nilai_lama') && <td style={{ maxWidth: '180px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', fontSize: '0.8rem', fontFamily: 'monospace' }} title={log.old_value}>{log.old_value || '-'}</td>}
                    {isVisible('nilai_baru') && <td style={{ maxWidth: '180px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', fontSize: '0.8rem', fontFamily: 'monospace', color: '#2b6cb0' }} title={log.new_value}>{log.new_value || '-'}</td>}
                    {isVisible('ip_address') && <td><code style={{ fontSize: '0.85rem' }}>{log.ip_address}</code></td>}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination bar */}
        {!loading && logs.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', padding: '0 0.5rem' }}>
            <div className="text-muted" style={{ fontSize: '0.85rem' }}>
              Menampilkan Halaman <strong>{page}</strong> dari <strong>{totalPages}</strong> (Total <strong>{totalLogs}</strong> log)
            </div>
            <div className="d-flex gap-1">
              <button
                className="btn btn-sm btn-outline"
                disabled={page === 1}
                onClick={() => setPage(prev => Math.max(prev - 1, 1))}
              >
                ◀ Sebelumnya
              </button>
              <button
                className="btn btn-sm btn-outline"
                disabled={page === totalPages}
                onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
              >
                Selanjutnya ▶
              </button>
            </div>
          </div>
        )}
      </Card>
    </DashboardLayout>
  );
}
