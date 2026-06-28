"use client";

import React, { useState, useEffect } from "react";
import ProviderLayout from "../../../components/layout/ProviderLayout";

interface Asset {
  id: string;
  name: string;
  category: string;
  limitPrice: number;
  status: "draft" | "pending" | "approved" | "listed" | "sold";
  date: string;
}

const initialAssets: Asset[] = [
  { id: "AST-8821", name: "Toyota Kijang Innova Reborn 2.4 G 2019", category: "Mobil", limitPrice: 260000000, status: "approved", date: "15 Juni 2026" },
  { id: "AST-8819", name: "Mitsubishi Pajero Sport Dakar 2018", category: "Mobil", limitPrice: 380000000, status: "pending", date: "12 Juni 2026" },
  { id: "AST-8711", name: "Honda Civic Hatchback RS 2020", category: "Mobil", limitPrice: 320000000, status: "sold", date: "10 Juni 2026" },
  { id: "AST-8692", name: "Yamaha NMAX ABS 2021", category: "Motor", limitPrice: 24500000, status: "listed", date: "08 Juni 2026" },
];

export default function ProviderDaftarBarang() {
  const [assets, setAssets] = useState<Asset[]>(initialAssets);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("provider_assets");
      if (stored) {
        try {
          const list = JSON.parse(stored);
          // Combine initial static list with dynamic submissions
          setAssets([...list, ...initialAssets]);
        } catch (e) {}
      } else {
        localStorage.setItem("provider_assets", JSON.stringify([]));
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

  const getStatusBadge = (status: Asset["status"]) => {
    if (status === "sold") return <span className="badge-ui success">Terjual</span>;
    if (status === "approved") return <span className="badge-ui info">Disetujui</span>;
    if (status === "listed") return <span className="badge-ui success">Listed</span>;
    if (status === "pending") return <span className="badge-ui warning">Verifikasi</span>;
    return <span className="badge-ui default">Draft</span>;
  };

  return (
    <ProviderLayout pageTitle="Daftar Inventori Aset">
      <p className="page-subtitle">Kelola dan pantau status seluruh unit lelang Anda</p>

      <div className="card">
        <div className="card-header">
          <span>Tabel Inventori Unit Aset</span>
          <span className="text-xs text-slate-500 font-normal">Menampilkan {assets.length} Aset Terdaftar</span>
        </div>

        <div className="table-wrapper">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>ID Aset</th>
                <th>Nama Unit Aset</th>
                <th>Kategori</th>
                <th>Harga Dasar Limit</th>
                <th>Status Approval</th>
                <th>Tanggal Masuk</th>
              </tr>
            </thead>
            <tbody>
              {assets.map((asset) => (
                <tr key={asset.id}>
                  <td>#{asset.id}</td>
                  <td className="font-bold text-slate-800">{asset.name}</td>
                  <td>{asset.category}</td>
                  <td className="font-bold">{formatRupiah(asset.limitPrice)}</td>
                  <td>{getStatusBadge(asset.status)}</td>
                  <td>{asset.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </ProviderLayout>
  );
}
