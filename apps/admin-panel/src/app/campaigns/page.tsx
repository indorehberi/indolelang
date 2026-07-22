'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { apiFetch } from '../../lib/api';

interface Campaign {
  id: string;
  title: string;
  message: string;
  target_role: string;
  sent_count: number;
  status: 'sent' | 'draft';
  sent_at?: string;
  created_at: string;
}

export default function CampaignsPage() {
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form State
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetRole, setTargetRole] = useState('all');
  const [sendEmail, setSendEmail] = useState(true);
  const [sendWa, setSendWa] = useState(true);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/admin/campaigns');
      const data = await res.json();
      if (res.ok && data.success) {
        setCampaigns(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch campaigns', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const res = await apiFetch('/admin/campaigns', {
        method: 'POST',
        body: JSON.stringify({
          title,
          message,
          target_role: targetRole,
          send_email: sendEmail,
          send_wa: sendWa,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsModalOpen(false);
        setTitle('');
        setMessage('');
        setTargetRole('all');
        setSendEmail(true);
        setSendWa(true);
        fetchCampaigns();
      } else {
        setErrorMsg(data.error?.message || 'Terjadi kesalahan');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Koneksi gagal');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: Campaign['status']) => {
    return status === 'sent' ? (
      <Badge variant="success">Terkirim</Badge>
    ) : (
      <Badge variant="default">Draft</Badge>
    );
  };

  const getTargetBadge = (role: string) => {
    if (role === 'all') return <Badge variant="info">Semua Pengguna</Badge>;
    if (role === 'bidder') return <Badge variant="success">Bidder Saja</Badge>;
    if (role === 'provider') return <Badge variant="warning">Provider Saja</Badge>;
    return <Badge variant="default">{role}</Badge>;
  };

  return (
    <DashboardLayout breadcrumbParent="Komunikasi" breadcrumbCurrent="Broadcast">
      <div className="toolbar">
        <div className="toolbar-left">
          <h1 className="page-title">Broadcast Informasi</h1>
          <p className="page-subtitle">Kirim informasi massal ke dashboard kelompok pengguna secara riil.</p>
        </div>
        <div className="toolbar-right">
          <button className="btn btn-primary btn-sm" onClick={() => setIsModalOpen(true)}>+ Buat Broadcast Baru</button>
        </div>
      </div>

      <Card>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Tanggal Kirim</th>
                <th>Judul Informasi</th>
                <th>Isi Informasi</th>
                <th>Target Penerima</th>
                <th style={{ textAlign: 'center' }}>Total Penerima</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center">Memuat data broadcast...</td></tr>
              ) : campaigns.length === 0 ? (
                <tr><td colSpan={6} className="text-center text-muted">Belum ada broadcast informasi dikirim.</td></tr>
              ) : (
                campaigns.map(c => (
                  <tr key={c.id}>
                    <td>{c.sent_at ? new Date(c.sent_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                    <td className="font-medium text-slate-800">{c.title}</td>
                    <td><div className="truncate w-64 text-sm text-slate-500">{c.message.length > 50 ? c.message.substring(0, 50) + '...' : c.message}</div></td>
                    <td>{getTargetBadge(c.target_role)}</td>
                    <td className="text-center font-bold text-slate-700">{c.sent_count}</td>
                    <td>{getStatusBadge(c.status)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Buat Broadcast Informasi Baru">
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMsg && <div className="p-3 bg-error/10 text-error text-sm rounded-lg border border-error/20">{errorMsg}</div>}
          
          <div className="form-group">
            <label className="form-label">Judul Informasi</label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="Contoh: Pengumuman Sesi Lelang Baru" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Isi Informasi</label>
            <textarea 
              className="form-control" 
              rows={5} 
              placeholder="Tulis informasi lengkap di sini..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            ></textarea>
            <p className="text-xs text-slate-500 mt-1">Gunakan enter untuk membuat paragraf baru. Informasi akan dikirim langsung ke dashboard target penerima.</p>
          </div>

          <div className="form-group">
            <label className="form-label">Target Penerima</label>
            <select className="form-select" value={targetRole} onChange={(e) => setTargetRole(e.target.value)}>
              <option value="all">Semua Pengguna Aktif</option>
              <option value="bidder">Hanya Bidder</option>
              <option value="provider">Hanya Provider (Penjual)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" style={{ display: 'block', marginBottom: '0.5rem' }}>Metode Pengiriman</label>
            <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.25rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                <input
                  type="checkbox"
                  checked={sendEmail}
                  onChange={(e) => setSendEmail(e.target.checked)}
                />
                Email
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                <input
                  type="checkbox"
                  checked={sendWa}
                  onChange={(e) => setSendWa(e.target.checked)}
                />
                WhatsApp (WA)
              </label>
            </div>
            {!sendEmail && !sendWa && (
              <p style={{ color: 'red', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                Pilih minimal satu metode pengiriman (Email atau WA).
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
            <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>
              Batal
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting || (!sendEmail && !sendWa)}>
              {isSubmitting ? 'Mengirim...' : 'Kirim Sekarang'}
            </button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
