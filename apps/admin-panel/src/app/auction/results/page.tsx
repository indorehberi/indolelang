'use client';

import React, { useState } from 'react';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';

interface SessionResult {
  id: string;
  title: string;
  closed_at: string;
  total_lots: number;
  lots_sold: number;
  lots_unsold: number;
  total_gmv: number;
  operator_name: string;
}

export default function AuctionResultsPage() {
  const [loading] = useState(false);

  const dummyResults: SessionResult[] = [
    {
      id: 'res-1',
      title: 'Lelang Mobil Bekas Avanza & Xenia Cabang Jakarta',
      closed_at: '2026-06-23T16:00:00.000Z',
      total_lots: 15,
      lots_sold: 12,
      lots_unsold: 3,
      total_gmv: 1450000000,
      operator_name: 'Andi Operator JKT',
    },
    {
      id: 'res-2',
      title: 'Lelang Motor Matic Honda & Yamaha Cabang Surabaya',
      closed_at: '2026-06-22T17:30:00.000Z',
      total_lots: 28,
      lots_sold: 22,
      lots_unsold: 6,
      total_gmv: 480000000,
      operator_name: 'Siti Rahma PIC',
    },
  ];

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(val);
  };

  return (
    <DashboardLayout breadcrumbParent="Lelang" breadcrumbCurrent="Hasil Sesi">
      <div className="toolbar">
        <div className="toolbar-left">
          <h1 className="page-title">Rekapitulasi Hasil Sesi Lelang</h1>
          <p className="page-subtitle">Daftar laporan hasil penutupan sesi lelang, rincian unit terjual (sold), dan nilai total transaksi terbentuk (GMV).</p>
        </div>
      </div>

      <Card>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Waktu Selesai</th>
                <th>Judul Sesi Lelang</th>
                <th style={{ textAlign: 'center' }}>Total Lot</th>
                <th style={{ textAlign: 'center' }}>Terjual (Sold)</th>
                <th style={{ textAlign: 'center' }}>Tidak Laku</th>
                <th>Nilai Terbentuk (GMV)</th>
                <th>Operator Penanggung</th>
                <th style={{ textAlign: 'center' }}>Laporan</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center">Memuat data hasil sesi...</td></tr>
              ) : dummyResults.length === 0 ? (
                <tr><td colSpan={8} className="text-center text-muted">Belum ada sesi lelang yang selesai ditutup.</td></tr>
              ) : (
                dummyResults.map((res) => (
                  <tr key={res.id}>
                    <td>{new Date(res.closed_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                    <td><strong>{res.title}</strong></td>
                    <td style={{ textAlign: 'center' }}>{res.total_lots} unit</td>
                    <td style={{ textAlign: 'center' }}><span className="text-success" style={{ fontWeight: 'bold' }}>{res.lots_sold} unit</span></td>
                    <td style={{ textAlign: 'center' }}><span className="text-danger">{res.lots_unsold} unit</span></td>
                    <td><strong className="text-primary">{formatRupiah(res.total_gmv)}</strong></td>
                    <td>{res.operator_name}</td>
                    <td style={{ textAlign: 'center' }}>
                      <button className="btn btn-xs btn-primary">Cetak Rekap</button>
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
