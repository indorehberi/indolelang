"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import ProviderLayout from "../../../components/layout/ProviderLayout";

interface Settlement {
  id: string;
  assetName: string;
  hammerPrice: number;
  commission: number;
  netAmount: number;
  status: "settled" | "pending";
  date: string;
}

const settlements: Settlement[] = [
  { id: "STL-203", assetName: "Honda Civic Hatchback RS 2020", hammerPrice: 320000000, commission: 8000000, netAmount: 312000000, status: "settled", date: "24 Juni 2026" },
  { id: "STL-202", assetName: "Yamaha NMAX ABS 2021", hammerPrice: 24500000, commission: 735000, netAmount: 23765000, status: "pending", date: "22 Juni 2026" },
  { id: "STL-201", assetName: "Toyota Avanza Veloz 1.5 AT 2021", hammerPrice: 142000000, commission: 4260000, netAmount: 137740000, status: "settled", date: "18 Juni 2026" },
];

export default function ProviderDashboard() {
  const [providerName, setProviderName] = useState<string>("PT Astra Mitra");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          if (user.full_name || user.name) {
            setProviderName(user.full_name || user.name);
          }
        } catch (e) {}
      }
    }
  }, []);

  const formatRupiah = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getStatusBadge = (status: Settlement["status"]) => {
    if (status === "settled") return <span className="badge-ui success">Selesai</span>;
    return <span className="badge-ui warning">Proses</span>;
  };

  return (
    <ProviderLayout pageTitle="Dashboard Mitra">
      <p className="page-subtitle">Panel Area Provider &bull; PT Indo-Lelang Sejahtera</p>

      {/* KPI Grid */}
      <div className="kpi-grid">
        <div className="kpi-card success">
          <div className="kpi-label">Nilai Penjualan (GMV)</div>
          <div className="kpi-value">{formatRupiah(486500000)}</div>
          <div className="kpi-trend up">Total Unit Terjual</div>
        </div>
        <div className="kpi-card gold">
          <div className="kpi-label">Aset Aktif / Listed</div>
          <div className="kpi-value">3 Unit</div>
          <div className="kpi-trend up">Siap Lelang Batch Depan</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Menunggu Pencairan</div>
          <div className="kpi-value">{formatRupiah(23765000)}</div>
          <div className="kpi-trend text-slate-500">Pencairan Dana Proses VA</div>
        </div>
        <div className="kpi-card danger">
          <div className="kpi-label">Pengajuan Aset Ditolak</div>
          <div className="kpi-value">0 Unit</div>
          <div className="kpi-trend text-slate-500">Semua Dokumen Valid</div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid-2-1">
        {/* Left Column */}
        <div>
          {/* Active Inventory Summary */}
          <div className="card">
            <div className="card-header">Inventori Aset Terdaftar</div>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center p-3 bg-slate-50 border border-outline-variant/20 rounded-xl">
                <div>
                  <div className="font-bold text-slate-800">Toyota Kijang Innova Reborn 2.4 G 2019</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Status: Approved - Siap Jadwal</div>
                </div>
                <div className="font-bold text-slate-900">Limit: Rp 260jt</div>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-50 border border-outline-variant/20 rounded-xl">
                <div>
                  <div className="font-bold text-slate-800">Mitsubishi Pajero Sport Dakar 2018</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Status: Pending Verification</div>
                </div>
                <div className="font-bold text-slate-900">Limit: Rp 380jt</div>
              </div>
            </div>
          </div>

          {/* SVG Monthly Sales Performance */}
          <div className="card">
            <div className="card-header">Grafik Penjualan Bulanan (Net Pendapatan)</div>
            <div className="py-4">
              <svg viewBox="0 0 400 160" className="w-full h-auto block overflow-visible">
                <line x1="50" y1="20" x2="380" y2="20" stroke="#f1f2f6" strokeWidth="1" />
                <line x1="50" y1="70" x2="380" y2="70" stroke="#f1f2f6" strokeWidth="1" />
                <line x1="50" y1="120" x2="380" y2="120" stroke="#dcdde1" strokeWidth="1" />

                {/* Bars */}
                <g>
                  <rect x="90" y="70" width="30" height="50" rx="3" fill="var(--wf-accent)" />
                  <text x="105" y="62" fill="var(--wf-text)" fontSize="9" fontWeight="bold" textAnchor="middle">137jt</text>
                  <text x="105" y="138" fill="var(--wf-text-muted)" fontSize="9" textAnchor="middle">April</text>
                </g>
                <g>
                  <rect x="170" y="30" width="30" height="90" rx="3" fill="var(--wf-success)" />
                  <text x="185" y="22" fill="var(--wf-text)" fontSize="9" fontWeight="bold" textAnchor="middle">312jt</text>
                  <text x="185" y="138" fill="var(--wf-text-muted)" fontSize="9" textAnchor="middle">Mei</text>
                </g>
                <g>
                  <rect x="250" y="100" width="30" height="20" rx="3" fill="var(--wf-accent)" />
                  <text x="265" y="92" fill="var(--wf-text)" fontSize="9" fontWeight="bold" textAnchor="middle">24jt</text>
                  <text x="265" y="138" fill="var(--wf-text-muted)" fontSize="9" textAnchor="middle">Juni</text>
                </g>
                <g>
                  <rect x="330" y="120" width="30" height="0" rx="3" fill="var(--wf-accent)" />
                  <text x="345" y="112" fill="var(--wf-text)" fontSize="9" fontWeight="bold" textAnchor="middle">0</text>
                  <text x="345" y="138" fill="var(--wf-text-muted)" fontSize="9" textAnchor="middle">Juli</text>
                </g>

                <text x="45" y="23" fill="var(--wf-text-muted)" fontSize="8" textAnchor="end">400jt</text>
                <text x="45" y="73" fill="var(--wf-text-muted)" fontSize="8" textAnchor="end">200jt</text>
                <text x="45" y="123" fill="var(--wf-text-muted)" fontSize="8" textAnchor="end">0</text>
              </svg>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div>
          <div className="card">
            <div className="card-header">Tindakan Mitra</div>
            <div className="flex flex-col gap-2">
              <Link href="/provider/ajukan-barang" className="panel-btn panel-btn-primary justify-center">
                ➕ Titip Jual Aset Baru
              </Link>
              <Link href="/provider/daftar-barang" className="panel-btn panel-btn-outline justify-center">
                📦 Monitor Inventori
              </Link>
              <Link href="/provider/settlement" className="panel-btn panel-btn-outline justify-center">
                💰 Minta Pencairan Dana
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Settlements Table */}
      <div className="card">
        <div className="card-header">Laporan Pencairan Dana Hasil Lelang</div>
        <div className="table-wrapper">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>No. Referensi</th>
                <th>Nama Unit Aset</th>
                <th>Harga Terbentuk</th>
                <th>Komisi Balai</th>
                <th>Net Terima</th>
                <th>Status</th>
                <th>Tanggal</th>
              </tr>
            </thead>
            <tbody>
              {settlements.map((item) => (
                <tr key={item.id}>
                  <td>#{item.id}</td>
                  <td className="font-bold text-slate-800">{item.assetName}</td>
                  <td>{formatRupiah(item.hammerPrice)}</td>
                  <td className="text-error">{formatRupiah(item.commission)}</td>
                  <td className="font-bold text-success">{formatRupiah(item.netAmount)}</td>
                  <td>{getStatusBadge(item.status)}</td>
                  <td>{item.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </ProviderLayout>
  );
}
