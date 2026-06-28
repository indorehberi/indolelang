"use client";

import React from "react";
import BidderLayout from "../../../components/layout/BidderLayout";

interface AuctionHistory {
  id: string;
  sessionName: string;
  lotName: string;
  myBid: number;
  finalPrice: number;
  status: "won" | "lost";
  date: string;
}

const history: AuctionHistory[] = [
  { id: "LOT-9821", sessionName: "Sesi JKT Batch 15", lotName: "Toyota Avanza Veloz 1.5 AT 2021", myBid: 142000000, finalPrice: 142000000, status: "won", date: "15 Juni 2026" },
  { id: "LOT-9812", sessionName: "Sesi SBY Batch 12", lotName: "Honda Vario 150 2019", myBid: 14500000, finalPrice: 15500000, status: "lost", date: "10 Juni 2026" },
];

export default function BidderRiwayatLelang() {
  const formatRupiah = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <BidderLayout pageTitle="Riwayat Lelang">
      <p className="page-subtitle">Sesi dan lot lelang yang pernah Anda ikuti</p>

      <div className="card">
        <div className="card-header">Riwayat Partisipasi Lelang</div>
        <div className="table-wrapper">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>ID Lot</th>
                <th>Sesi Lelang</th>
                <th>Nama Unit Aset</th>
                <th>Bid Terakhir Anda</th>
                <th>Harga Akhir Lot</th>
                <th>Hasil</th>
                <th>Tanggal</th>
              </tr>
            </thead>
            <tbody>
              {history.map((item) => (
                <tr key={item.id}>
                  <td>#{item.id}</td>
                  <td>{item.sessionName}</td>
                  <td className="font-bold text-slate-800">{item.lotName}</td>
                  <td>{formatRupiah(item.myBid)}</td>
                  <td>{formatRupiah(item.finalPrice)}</td>
                  <td>
                    <span className={`badge-ui ${item.status === "won" ? "success" : "danger"}`}>
                      {item.status === "won" ? "Menang" : "Kalah"}
                    </span>
                  </td>
                  <td>{item.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </BidderLayout>
  );
}
