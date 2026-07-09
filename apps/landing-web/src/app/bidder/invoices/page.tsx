"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { apiUrl } from "@/lib/api";
import BidderLayout from "../../../components/layout/BidderLayout";

export default function BidderInvoices() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return;

      const res = await fetch(apiUrl("/checkout/orders"), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setOrders(data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
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
      case "unpaid":
      default:
        return <span className="px-3 py-1 bg-warning/20 text-warning rounded-full text-xs font-bold">Menunggu</span>;
    }
  };

  return (
    <BidderLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-black text-slate-800">Riwayat Tagihan</h1>
            <p className="text-slate-500 text-sm mt-1">Daftar semua tagihan lelang Anda beserta statusnya.</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-48">
            <span className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></span>
          </div>
        ) : orders.length === 0 ? (
          <div className="card text-center p-12 bg-surface">
            <span className="material-symbols-outlined text-6xl text-slate-200 mb-4">receipt_long</span>
            <h3 className="text-lg font-bold text-slate-700">Belum Ada Tagihan</h3>
            <p className="text-slate-500 text-sm mt-2">Anda belum memiliki tagihan kemenangan lelang.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order: any) => (
              <div key={order.id} className="card p-6 bg-surface">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 border-b border-outline-variant/30 pb-4 mb-4">
                  <div>
                    <div className="text-xs text-slate-500 font-medium">Order ID</div>
                    <div className="font-mono text-sm font-bold text-slate-800">{order.id.split("-")[0].toUpperCase()}</div>
                    <div className="text-xs text-slate-400 mt-1">{new Date(order.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                  <div className="flex flex-col md:items-end gap-2">
                    {getStatusBadge(order.status)}
                    <div className="text-xl font-black text-primary">{formatRupiah(order.final_amount)}</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-bold text-slate-700 mb-2">Rincian Unit ({order.total_invoices} Unit)</div>
                  {order.invoices?.map((inv: any) => (
                    <div key={inv.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-outline-variant/50">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-slate-200 rounded-lg overflow-hidden flex-shrink-0">
                          {inv.lot?.asset?.foto_depan_url ? (
                            <img src={inv.lot.asset.foto_depan_url} alt="Unit" className="w-full h-full object-cover" />
                          ) : (
                            <span className="material-symbols-outlined w-full h-full flex items-center justify-center text-slate-400">directions_car</span>
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-800 line-clamp-1">{inv.lot?.asset?.merk} {inv.lot?.asset?.tipe}</div>
                          <div className="text-xs text-slate-500">Lot {inv.lot?.lot_number} • {inv.lot?.asset?.no_polisi}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-slate-700">{formatRupiah(inv.total)}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {order.status === 'unpaid' && (
                  <div className="mt-4 pt-4 border-t border-outline-variant/30 flex justify-end">
                    <Link href="/bidder/cart" className="px-4 py-2 bg-primary text-white text-sm font-bold rounded-lg hover:bg-primary/90 transition-colors">
                      Bayar Sekarang di Keranjang
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </BidderLayout>
  );
}
