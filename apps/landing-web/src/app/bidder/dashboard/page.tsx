"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import BidderLayout from "../../../components/layout/BidderLayout";

interface Transaction {
  id: string;
  type: string;
  lot: string;
  amount: number;
  status: "success" | "pending" | "failed";
  time: string;
}

const transactions: Transaction[] = [
  { id: "TX-90112", type: "Pembelian NIPL", lot: "Sesi JKT Batch 15", amount: 1000000, status: "success", time: "14:15 WIB" },
  { id: "TX-90105", type: "Top Up Deposit", lot: "Deposit Saldo VA", amount: 5000000, status: "success", time: "10:30 WIB" },
  { id: "TX-89982", type: "Refund Deposit", lot: "Refund Sesi SBY Batch 12", amount: 1000000, status: "success", time: "Kemarin" },
];

export default function BidderDashboard() {
  const [ekycStatus, setEkycStatus] = useState<string>("verified");
  const [depositBalance, setDepositBalance] = useState<number>(5000000);
  const [niplTickets, setNiplTickets] = useState<number>(2);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedStatus = localStorage.getItem("user_ekyc_status");
      if (storedStatus) setEkycStatus(storedStatus);
      const storedBalance = localStorage.getItem("deposit_balance");
      if (storedBalance) setDepositBalance(Number(storedBalance));
      const storedTickets = localStorage.getItem("nipl_tickets");
      if (storedTickets) setNiplTickets(Number(storedTickets));
    }
  }, []);

  const formatRupiah = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getStatusBadge = (status: Transaction["status"]) => {
    if (status === "success") return <span className="badge-ui success">Berhasil</span>;
    if (status === "failed") return <span className="badge-ui danger">Gagal</span>;
    return <span className="badge-ui warning">Pending</span>;
  };

  return (
    <BidderLayout pageTitle="Dashboard">
      <p className="page-subtitle">Panel Area Bidder &bull; Platform Indo-Lelang</p>

      {/* eKYC Alert Box */}
      {ekycStatus === "verified" ? (
        <div className="alert-box success">
          <span className="material-symbols-outlined">verified_user</span>
          <div>
            <strong>🟢 Akun Terverifikasi (eKYC Aktif):</strong> Anda memiliki akses penuh untuk ikut serta dalam live bidding dan melakukan transaksi pembelian tiket NIPL.
          </div>
        </div>
      ) : ekycStatus === "rejected" ? (
        <div className="alert-box danger">
          <span className="material-symbols-outlined">report</span>
          <div>
            <strong>❌ Verifikasi eKYC Ditolak:</strong> Dokumen yang Anda unggah ditolak oleh admin. Harap unggah kembali dokumen KTP & selfie Anda yang terbaru.
            <Link href="/bidder/profile" className="ml-2 font-bold underline hover:text-red-950">Unggah Ulang Dokumen</Link>
          </div>
        </div>
      ) : (
        <div className="alert-box warning">
          <span className="material-symbols-outlined">error</span>
          <div>
            <strong>⚠️ Akun Belum Terverifikasi (eKYC Pending):</strong> Anda belum dapat membeli tiket NIPL atau menawar lot lelang sebelum data identitas KTP Anda diverifikasi.
            <Link href="/bidder/profile" className="ml-2 font-bold underline hover:text-yellow-950">Lengkapi eKYC</Link>
          </div>
        </div>
      )}

      {/* KPI Grid */}
      <div className="kpi-grid">
        <div className="kpi-card success">
          <div className="kpi-label">Saldo Jaminan Deposit</div>
          <div className="kpi-value">{formatRupiah(depositBalance)}</div>
          <div className="kpi-trend up">Aktif &amp; Siap Digunakan</div>
        </div>
        <div className="kpi-card gold">
          <div className="kpi-label">Tiket NIPL Aktif</div>
          <div className="kpi-value">{niplTickets} Sesi</div>
          <div className="kpi-trend up">Siap Menawar Lot</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Watchlist Aset</div>
          <div className="kpi-value">3 Unit</div>
          <div className="kpi-trend text-slate-500">Lot Favorit Di-bookmark</div>
        </div>
        <div className="kpi-card danger">
          <div className="kpi-label">Lelang Menang (Pending)</div>
          <div className="kpi-value">1 Lot</div>
          <div className="kpi-trend down">Belum Dilunasi</div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid-2-1">
        {/* Left Column */}
        <div>
          {/* Live Session Card */}
          <div className="card">
            <div className="card-header">
              <span>Sesi Lelang Berlangsung</span>
              <span className="badge-ui danger animate-pulse">LIVE NOW</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="font-bold text-slate-800 text-base">Sesi Mobil Penumpang JKT - Batch 15</h3>
                <p className="text-xs text-slate-500 mt-1">
                  12 dari 45 Lot telah dilelang &bull; Tiket NIPL Anda terdaftar
                </p>
              </div>
              <Link href="/bidder/bidding-room" className="panel-btn panel-btn-gold text-center whitespace-nowrap shadow-sm hover:shadow">
                Masuk Ruang Bidding
              </Link>
            </div>
          </div>

          {/* Activity Chart SVG */}
          <div className="card">
            <div className="card-header">Statistik Bidding Bulanan (Tawaran Dibuat)</div>
            <div className="py-4">
              <svg viewBox="0 0 400 160" className="w-full h-auto block overflow-visible">
                <line x1="50" y1="20" x2="380" y2="20" stroke="#f1f2f6" strokeWidth="1" />
                <line x1="50" y1="70" x2="380" y2="70" stroke="#f1f2f6" strokeWidth="1" />
                <line x1="50" y1="120" x2="380" y2="120" stroke="#dcdde1" strokeWidth="1" />

                {/* Bars */}
                <g>
                  <rect x="90" y="50" width="30" height="70" rx="3" fill="var(--wf-primary)" />
                  <text x="105" y="42" fill="var(--wf-text)" fontSize="9" fontWeight="bold" textAnchor="middle">12</text>
                  <text x="105" y="138" fill="var(--wf-text-muted)" fontSize="9" textAnchor="middle">April</text>
                </g>
                <g>
                  <rect x="170" y="30" width="30" height="90" rx="3" fill="var(--wf-gold)" />
                  <text x="185" y="22" fill="var(--wf-text)" fontSize="9" fontWeight="bold" textAnchor="middle">24</text>
                  <text x="185" y="138" fill="var(--wf-text-muted)" fontSize="9" textAnchor="middle">Mei</text>
                </g>
                <g>
                  <rect x="250" y="80" width="30" height="40" rx="3" fill="var(--wf-primary)" />
                  <text x="265" y="72" fill="var(--wf-text)" fontSize="9" fontWeight="bold" textAnchor="middle">8</text>
                  <text x="265" y="138" fill="var(--wf-text-muted)" fontSize="9" textAnchor="middle">Juni</text>
                </g>
                <g>
                  <rect x="330" y="110" width="30" height="10" rx="3" fill="var(--wf-primary)" />
                  <text x="345" y="102" fill="var(--wf-text)" fontSize="9" fontWeight="bold" textAnchor="middle">2</text>
                  <text x="345" y="138" fill="var(--wf-text-muted)" fontSize="9" textAnchor="middle">Juli</text>
                </g>

                <text x="45" y="23" fill="var(--wf-text-muted)" fontSize="8" textAnchor="end">30</text>
                <text x="45" y="73" fill="var(--wf-text-muted)" fontSize="8" textAnchor="end">15</text>
                <text x="45" y="123" fill="var(--wf-text-muted)" fontSize="8" textAnchor="end">0</text>
              </svg>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div>
          <div className="card">
            <div className="card-header">Navigasi Panel Cepat</div>
            <div className="flex flex-col gap-2">
              <Link href="/bidder/deposit" className="panel-btn panel-btn-outline justify-center">
                💳 Setor Deposit NIPL
              </Link>
              <Link href="/katalog" className="panel-btn panel-btn-outline justify-center">
                🔍 Cari Unit Lelang
              </Link>
              <Link href="/bidder/profile" className="panel-btn panel-btn-outline justify-center">
                👤 Verifikasi KYC &amp; Data
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction History Card */}
      <div className="card">
        <div className="card-header">Riwayat Mutasi Saldo &amp; Deposit</div>
        <div className="table-wrapper">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>No. Referensi</th>
                <th>Jenis Transaksi</th>
                <th>Keterangan Sesi</th>
                <th>Nominal</th>
                <th>Status</th>
                <th>Waktu</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id}>
                  <td>#{tx.id}</td>
                  <td className="font-bold text-slate-800">{tx.type}</td>
                  <td>{tx.lot}</td>
                  <td className="font-bold">{formatRupiah(tx.amount)}</td>
                  <td>{getStatusBadge(tx.status)}</td>
                  <td>{tx.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </BidderLayout>
  );
}
