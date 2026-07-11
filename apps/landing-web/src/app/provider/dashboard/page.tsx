"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import ProviderLayout from "../../../components/layout/ProviderLayout";

import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

interface Settlement {
  id: string;
  assetName: string;
  hammerPrice: number;
  commission: number;
  netAmount: number;
  status: "settled" | "pending";
  date: string;
}

interface Asset {
  id: string;
  title: string;
  status: string;
  base_price: number;
}

export default function ProviderDashboard() {
  const router = useRouter();
  const [providerName, setProviderName] = useState<string>("Loading...");
  const [assets, setAssets] = useState<Asset[]>([]);
  const [settlementsData, setSettlementsData] = useState<Settlement[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [pendingAmount, setPendingAmount] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      router.push("/login");
      return;
    }

    const fetchData = async () => {
      try {
        const [resProfile, resAssets, resSettlements, resNotifications] = await Promise.all([
          apiFetch("/users/profile"),
          apiFetch("/assets?per_page=100"),
          apiFetch("/payments/settlements?per_page=100"),
          apiFetch("/notifications?is_read=false"),
        ]);

        if (resProfile.ok) {
          const data = await resProfile.json();
          setProviderName(data.data?.company_name || data.data?.full_name || "Provider");
        }

        if (resAssets.ok) {
          const data = await resAssets.json();
          setAssets(data.data || []);
        }

        if (resSettlements.ok) {
          const data = await resSettlements.json();
          const items = data.data || [];
          const formatted = items.map((s: any) => ({
            id: s.id,
            assetName: s.invoice?.lot?.asset?.title || "Asset",
            hammerPrice: s.invoice?.amount || 0,
            commission: s.platform_fee || 0,
            netAmount: s.net_amount || 0,
            status: s.status === "processed" ? "settled" : "pending",
            date: new Date(s.created_at).toLocaleDateString("id-ID")
          }));
          setSettlementsData(formatted);
          
          const pending = formatted.filter((s: any) => s.status === "pending").reduce((acc: number, s: any) => acc + s.netAmount, 0);
          setPendingAmount(pending);
        }

        if (resNotifications.ok) {
          const data = await resNotifications.json();
          setNotifications(data.data || []);
        }
      } catch (e) {
        console.error("Failed to load dashboard data");
      }
    };
    
    fetchData();
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

  const handleCloseNotification = async (id: string) => {
    try {
      const response = await apiFetch(`/notifications/${id}/read`, {
        method: "PUT",
      });
      if (response.ok) {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }
    } catch (err) {
      console.error("Failed to dismiss notification", err);
    }
  };

  const rejectedCount = assets.filter(a => a.status === 'returned').length;

  return (
    <ProviderLayout pageTitle="Dashboard Mitra">
      <p className="page-subtitle font-medium text-slate-500 mb-4">Panel Area Provider &bull; PT Indo-Lelang Sejahtera</p>

      {/* Notifications Section */}
      {notifications.length > 0 && (
        <div className="space-y-2 mb-4 text-left">
          {notifications.map((notif) => (
            <div key={notif.id} className="alert-box info flex items-center justify-between" style={{ padding: '1rem', borderRadius: '1rem', background: '#e0f2fe', border: '1px solid #bae6fd', color: '#0369a1' }}>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-sky-600">notifications</span>
                <div>
                  <strong className="block text-sm font-semibold">{notif.title}</strong>
                  <p className="text-xs text-sky-800 mt-0.5">{notif.message}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleCloseNotification(notif.id)}
                className="text-sky-600 hover:text-sky-800 p-1 hover:bg-sky-200/50 rounded-full transition-all"
                title="Tutup Notifikasi"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* KPI Grid */}
      <div className="kpi-grid">
        <div className="kpi-card success">
          <div className="kpi-label">Nilai Penjualan (GMV)</div>
          <div className="kpi-value">{formatRupiah(settlementsData.reduce((acc, s) => acc + s.hammerPrice, 0))}</div>
          <div className="kpi-trend up">Total Unit Terjual</div>
        </div>
        <div className="kpi-card gold">
          <div className="kpi-label">Aset Aktif / Listed</div>
          <div className="kpi-value">{assets.filter(a => a.status === 'listed' || a.status === 'approved').length} Unit</div>
          <div className="kpi-trend up">Siap Lelang Batch Depan</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Menunggu Pencairan</div>
          <div className="kpi-value">{formatRupiah(pendingAmount)}</div>
          <div className="kpi-trend text-slate-500">Pencairan Dana Proses VA</div>
        </div>
        <div className="kpi-card danger">
          <div className="kpi-label">Pengajuan Aset Ditolak</div>
          <div className="kpi-value">{rejectedCount} Unit</div>
          <div className="kpi-trend text-slate-500">{rejectedCount > 0 ? "Silakan ajukan kembali" : "Semua Dokumen Valid"}</div>
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
              {assets.length === 0 ? (
                <div className="p-4 text-center text-slate-500">Belum ada aset didaftarkan</div>
              ) : (
                assets.slice(0, 5).map(asset => (
                  <div key={asset.id} className="flex justify-between items-center p-3 bg-slate-50 border border-outline-variant/20 rounded-xl">
                    <div>
                      <div className="font-bold text-slate-800">{asset.title}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Status: {asset.status.toUpperCase()}</div>
                    </div>
                    <div className="font-bold text-slate-900">Limit: {formatRupiah(asset.base_price)}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Monthly Sales Performance */}
          <div className="card">
            <div className="card-header">Grafik Penjualan Bulanan (Net Pendapatan)</div>
            <div className="py-12 text-center text-slate-500 text-sm">
              Belum ada data penjualan yang cukup untuk menampilkan grafik.
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
              {settlementsData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-6 text-slate-500">Belum ada data pencairan</td>
                </tr>
              ) : (
                settlementsData.map((item) => (
                  <tr key={item.id}>
                    <td>#{item.id.substring(0,8).toUpperCase()}</td>
                    <td className="font-bold text-slate-800">{item.assetName}</td>
                    <td>{formatRupiah(item.hammerPrice)}</td>
                    <td className="text-error">{formatRupiah(item.commission)}</td>
                    <td className="font-bold text-success">{formatRupiah(item.netAmount)}</td>
                    <td>{getStatusBadge(item.status)}</td>
                    <td>{item.date}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </ProviderLayout>
  );
}
