'use client';

import React, { useState } from 'react';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';

interface UnassignedAsset {
  id: string;
  title: string;
  category: string;
  base_price: number;
  provider_name: string;
}

export default function LotPlanningPage() {
  const [selectedSession, setSelectedSession] = useState('session-1');

  const dummyUnassigned: UnassignedAsset[] = [
    {
      id: 'ast-101',
      title: 'Honda HRV 1.5 E CVT 2018',
      category: 'mobil',
      base_price: 210000000,
      provider_name: 'PT Adira Finance',
    },
    {
      id: 'ast-102',
      title: 'Toyota Avanza 1.3 Veloz A/T 2019',
      category: 'mobil',
      base_price: 155000000,
      provider_name: 'PT Adira Finance',
    },
    {
      id: 'ast-103',
      title: 'Honda Beat Street 2021',
      category: 'motor',
      base_price: 12500000,
      provider_name: 'PT Djarum Finance',
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
    <DashboardLayout breadcrumbParent="Katalog" breadcrumbCurrent="Penyusunan Lot">
      <div className="toolbar">
        <div className="toolbar-left">
          <h1 className="page-title">Penyusunan Lot & Antrean Lelang</h1>
          <p className="page-subtitle">Pilih sesi lelang dan masukkan unit aset titipan provider yang berstatus approved ke dalam nomor urut lot.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Left column: Choose session and show assigned lots */}
        <div>
          <Card>
            <h2 className="card-title">1. Pilih Sesi Lelang</h2>
            <div className="form-group mb-3">
              <label>Sesi Lelang Aktif / Terjadwal</label>
              <select className="form-select" value={selectedSession} onChange={(e) => setSelectedSession(e.target.value)}>
                <option value="session-1">Lelang Mobil Bekas Avanza & Xenia Cabang Jakarta (Jumat, 26 Juni)</option>
                <option value="session-2">Lelang Motor Matic Honda & Yamaha Cabang Surabaya (Sabtu, 27 Juni)</option>
              </select>
            </div>

            <hr />

            <h3 className="card-title" style={{ fontSize: '1rem', marginTop: '1rem' }}>Daftar Lot Terdaftar (Sesi Terpilih)</h3>
            <div className="table-wrapper" style={{ maxHeight: '350px', overflowY: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th style={{ width: '60px' }}>Lot #</th>
                    <th>Nama Unit Aset</th>
                    <th>Harga Limit</th>
                    <th style={{ textAlign: 'center' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedSession === 'session-1' ? (
                    <>
                      <tr>
                        <td><strong>01</strong></td>
                        <td>Toyota Avanza 1.3 G M/T 2019</td>
                        <td>{formatRupiah(135000000)}</td>
                        <td style={{ textAlign: 'center' }}><button className="btn btn-xs btn-danger">Hapus</button></td>
                      </tr>
                      <tr>
                        <td><strong>02</strong></td>
                        <td>Daihatsu Xenia 1.3 R M/T 2018</td>
                        <td>{formatRupiah(115000000)}</td>
                        <td style={{ textAlign: 'center' }}><button className="btn btn-xs btn-danger">Hapus</button></td>
                      </tr>
                    </>
                  ) : (
                    <tr>
                      <td><strong>01</strong></td>
                      <td>Yamaha NMAX 155 ABS 2021</td>
                      <td>{formatRupiah(18000000)}</td>
                      <td style={{ textAlign: 'center' }}><button className="btn btn-xs btn-danger">Hapus</button></td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Right column: List of approved assets that can be assigned */}
        <div>
          <Card>
            <h2 className="card-title">2. Aset Siap Dilelang (Approved)</h2>
            <p className="text-muted" style={{ fontSize: '0.85rem' }}>Klik tombol tambahkan untuk memasukkan aset ke lot terbawah pada sesi lelang aktif.</p>
            
            <div className="table-wrapper" style={{ marginTop: '1.25rem' }}>
              <table>
                <thead>
                  <tr>
                    <th>Nama Barang</th>
                    <th>Kategori</th>
                    <th>Harga Limit</th>
                    <th>Provider</th>
                    <th style={{ textAlign: 'center' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {dummyUnassigned.map((ast) => (
                    <tr key={ast.id}>
                      <td>
                        <strong>{ast.title}</strong>
                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>ID: {ast.id}</div>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.75rem', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase', background: ast.category === 'mobil' ? '#ebf8ff' : '#fefcbf', color: ast.category === 'mobil' ? '#2b6cb0' : '#b7791f' }}>
                          {ast.category}
                        </span>
                      </td>
                      <td><strong>{formatRupiah(ast.base_price)}</strong></td>
                      <td style={{ fontSize: '0.85rem' }}>{ast.provider_name}</td>
                      <td style={{ textAlign: 'center' }}>
                        <button className="btn btn-xs btn-success">+ Lot</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
