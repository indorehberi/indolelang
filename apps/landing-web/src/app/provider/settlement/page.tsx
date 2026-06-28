"use client";

import React, { useState } from "react";
import ProviderLayout from "../../../components/layout/ProviderLayout";

interface SettlementItem {
  id: string;
  assetName: string;
  amount: number;
  bank: string;
  status: "success" | "pending";
  date: string;
}

const initialSettlements: SettlementItem[] = [
  { id: "STL-203", assetName: "Honda Civic Hatchback RS 2020", amount: 312000000, bank: "BCA - 8923-9012-92", status: "success", date: "24 Juni 2026" },
  { id: "STL-201", assetName: "Toyota Avanza Veloz 1.5 AT 2021", amount: 137740000, bank: "BCA - 8923-9012-92", status: "success", date: "18 Juni 2026" },
];

export default function ProviderSettlement() {
  const [items, setItems] = useState<SettlementItem[]>(initialSettlements);
  const [requestPending, setRequestPending] = useState(false);

  const handleRequestDisbursement = () => {
    setRequestPending(true);
    setTimeout(() => {
      setRequestPending(false);
      const newItem: SettlementItem = {
        id: `STL-${Math.floor(204 + Math.random() * 100)}`,
        assetName: "Yamaha NMAX ABS 2021",
        amount: 23765000,
        bank: "BCA - 8923-9012-92",
        status: "pending",
        date: "Baru saja",
      };
      setItems([newItem, ...items]);
      alert("Permintaan pencairan dana berhasil diajukan!");
    }, 1500);
  };

  const formatRupiah = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <ProviderLayout pageTitle="Settlement &amp; Pencairan Dana">
      <p className="page-subtitle">Pencairan dana hasil penjualan aset lelang terintegrasi Xendit</p>

      <div className="grid-2-1">
        <div>
          <div className="card">
            <div className="card-header">Daftar Pengiriman Dana Hasil Penjualan</div>
            <div className="table-wrapper">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>No. Ref</th>
                    <th>Nama Unit Aset</th>
                    <th>Nominal Bersih</th>
                    <th>Rekening Tujuan</th>
                    <th>Status</th>
                    <th>Tanggal</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td>#{item.id}</td>
                      <td className="font-bold text-slate-800">{item.assetName}</td>
                      <td className="font-bold text-success">{formatRupiah(item.amount)}</td>
                      <td>{item.bank}</td>
                      <td>
                        <span className={`badge-ui ${item.status === "success" ? "success" : "warning"}`}>
                          {item.status === "success" ? "Selesai" : "Proses"}
                        </span>
                      </td>
                      <td>{item.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Action Panel */}
        <div>
          <div className="card">
            <div className="card-header">Dana Siap Dicairkan</div>
            <div className="space-y-4">
              <div>
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold block">Total Saldo Tertahan</span>
                <div className="text-heading-xl text-primary font-black mt-0.5">{formatRupiah(23765000)}</div>
              </div>
              <button
                onClick={handleRequestDisbursement}
                disabled={requestPending}
                className="w-full py-3 bg-secondary hover:bg-secondary/95 text-white font-bold rounded-xl transition-all shadow-md shadow-secondary/20 flex items-center justify-center gap-2"
              >
                {requestPending ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Memproses Pencairan...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined">payments</span>
                    Cairkan Ke Rekening
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </ProviderLayout>
  );
}
