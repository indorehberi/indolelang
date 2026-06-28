'use client';

import React, { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';

interface Campaign {
  id: string;
  title: string;
  message_preview: string;
  type: 'email' | 'push_notif' | 'sms';
  target_role: string;
  sent_count: number;
  status: 'sent' | 'draft';
  sent_at?: string;
}

export default function CampaignsPage() {
  const [loading] = useState(false);

  const dummyCampaigns: Campaign[] = [
    {
      id: 'cmp-1',
      title: 'Reminder Sesi Lelang Mobil Jakarta',
      message_preview: 'Halo Bidder, jangan lewatkan lelang mobil besok jam 10:00 WIB!',
      type: 'push_notif',
      target_role: 'bidder',
      sent_count: 148,
      status: 'sent',
      sent_at: '2026-06-23T08:00:00.000Z',
    },
    {
      id: 'cmp-2',
      title: 'Pemberitahuan Akun Aktif KYC Approved',
      message_preview: 'Akun Anda berhasil diverifikasi oleh tim peninjau KYC Indo-Lelang.',
      type: 'email',
      target_role: 'bidder',
      sent_count: 45,
      status: 'sent',
      sent_at: '2026-06-22T10:00:00.000Z',
    },
    {
      id: 'cmp-3',
      title: 'Broadcast Promosi Komisi Baru Provider',
      message_preview: 'Dapatkan diskon biaya admin lelang sebesar 1.5% untuk unit motor.',
      type: 'email',
      target_role: 'provider',
      sent_count: 12,
      status: 'draft',
    },
  ];

  const getTypeBadge = (type: Campaign['type']) => {
    switch (type) {
      case 'push_notif':
        return <Badge variant="info">📱 Push Notification</Badge>;
      case 'email':
        return <Badge variant="success">✉️ Email Broadcast</Badge>;
      case 'sms':
        return <Badge variant="warning">💬 SMS Broadcast</Badge>;
      default:
        return <Badge variant="default">{type}</Badge>;
    }
  };

  const getStatusBadge = (status: Campaign['status']) => {
    return status === 'sent' ? (
      <Badge variant="success">Terkirim</Badge>
    ) : (
      <Badge variant="default">Draft</Badge>
    );
  };

  return (
    <DashboardLayout breadcrumbParent="Laporan" breadcrumbCurrent="Campaign">
      <div className="toolbar">
        <div className="toolbar-left">
          <h1 className="page-title">Broadcast Campaign & Notifikasi</h1>
          <p className="page-subtitle">Kirim email massal, notifikasi push FCM, atau SMS blast ke seluruh kelompok pengguna bidder / provider.</p>
        </div>
        <div className="toolbar-right">
          <button className="btn btn-primary btn-sm">+ Buat Campaign Baru</button>
        </div>
      </div>

      <Card>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Tanggal Kirim</th>
                <th>Judul Pengumuman</th>
                <th>Isi Pesan Singkat</th>
                <th>Metode Pengiriman</th>
                <th>Target Penerima</th>
                <th style={{ textAlign: 'center' }}>Total Penerima</th>
                <th>Status</th>
                <th style={{ textAlign: 'center' }}>Tindakan</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center">Memuat data campaign...</td></tr>
              ) : dummyCampaigns.length === 0 ? (
                <tr><td colSpan={8} className="text-center text-muted">Belum ada campaign broadcast dikirim.</td></tr>
              ) : (
                dummyCampaigns.map((cmp) => (
                  <tr key={cmp.id}>
                    <td>{cmp.sent_at ? new Date(cmp.sent_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : <span className="text-muted">-</span>}</td>
                    <td><strong>{cmp.title}</strong></td>
                    <td style={{ maxWidth: '240px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={cmp.message_preview}>{cmp.message_preview}</td>
                    <td>{getTypeBadge(cmp.type)}</td>
                    <td style={{ textTransform: 'capitalize' }}>{cmp.target_role}</td>
                    <td style={{ textAlign: 'center' }}><strong className="text-primary">{cmp.sent_count} user</strong></td>
                    <td>{getStatusBadge(cmp.status)}</td>
                    <td style={{ textAlign: 'center' }}>
                      <div className="d-flex gap-1 justify-content-center">
                        <button className="btn btn-xs btn-outline">Lihat Detail</button>
                        {cmp.status === 'draft' && <button className="btn btn-xs btn-success">Kirim Sekarang</button>}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </DashboardLayout>
  );
}
