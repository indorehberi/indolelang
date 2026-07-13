"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import BidderLayout from "../../../components/layout/BidderLayout";

export default function BidderInvoices() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInvoices = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return;

      const res = await apiFetch("/checkout/invoices");
      const data = await res.json();
      if (data.success) {
        setInvoices(data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const formatRupiah = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <span className="px-3 py-1 bg-success/20 text-success rounded-full text-xs font-bold">Sudah Dibayar</span>;
      case "expired":
        return <span className="px-3 py-1 bg-error/20 text-error rounded-full text-xs font-bold">Expired</span>;
      case "pending_checkout":
        return <span className="px-3 py-1 bg-info/20 text-info rounded-full text-xs font-bold">Menunggu Verifikasi</span>;
      case "unpaid":
      default:
        return <span className="px-3 py-1 bg-warning/20 text-warning rounded-full text-xs font-bold">Menunggu</span>;
    }
  };

  return (
    <BidderLayout pageTitle="Riwayat Pelunasan">
      <div className="space-y-6">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-black text-slate-800">Riwayat Pelunasan</h1>
          </div>
        </div>

        <div className="card">
          <div className="card-header">Riwayat Tagihan & Pelunasan</div>
          {loading ? (
            <div className="py-8 text-center text-slate-500 text-sm">Memuat riwayat...</div>
          ) : invoices.length === 0 ? (
            <div className="py-12 text-center">
              <span className="material-symbols-outlined text-6xl text-slate-200 mb-4 block">receipt_long</span>
              <h3 className="text-lg font-bold text-slate-700">Belum Ada Tagihan</h3>
              <p className="text-slate-500 text-sm mt-2">Anda belum memiliki riwayat pelunasan.</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Unit Aset</th>
                    <th>No Lot / Sesi</th>
                    <th>Tanggal Tagihan</th>
                    <th>Total Pembayaran</th>
                    <th>Status</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv: any) => (
                    <tr key={inv.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-200 rounded overflow-hidden flex-shrink-0">
                            {inv.lot?.asset?.photo_front ? (
                              <img src={inv.lot.asset.photo_front} alt="Unit" className="w-full h-full object-cover" />
                            ) : (
                              <span className="material-symbols-outlined w-full h-full flex items-center justify-center text-slate-400">directions_car</span>
                            )}
                          </div>
                          <div className="font-bold text-slate-800 line-clamp-1">{inv.lot?.asset?.brand} {inv.lot?.asset?.model}</div>
                        </div>
                      </td>
                      <td>
                        <div className="font-medium text-slate-700">Lot {inv.lot?.lot_number || "-"}</div>
                        <div className="text-xs text-slate-500">{inv.lot?.asset?.police_number || "-"}</div>
                      </td>
                      <td className="text-sm text-slate-600">
                        {new Date(inv.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </td>
                      <td className="font-bold text-primary">
                        {formatRupiah(Number(inv.total))}
                      </td>
                      <td>{getStatusBadge(inv.status)}</td>
                      <td>
                        {inv.status === 'unpaid' && (
                          <Link href="/bidder/cart" className="inline-block px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary/90 transition-colors whitespace-nowrap">
                            Bayar Sekarang
                          </Link>
                        )}
                        {(inv.status === 'paid' || inv.status === 'pending_checkout') && (
                          <button onClick={() => window.alert("Fitur download resi segera hadir")} className="inline-block px-3 py-1.5 border border-outline-variant text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap">
                            Lihat Detail
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </BidderLayout>
  );
}
