"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ProviderLayout from "../../../components/layout/ProviderLayout";
import { apiUrl, fetchWithRetry } from "@/lib/api";

interface Asset {
  id: string;
  name: string;
  category: string;
  limitPrice: number;
  status: "draft" | "pending" | "approved" | "listed" | "sold" | string;
  date: string;
}

export default function ProviderDaftarBarang() {
  const router = useRouter();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          router.push("/login");
          return;
        }

        const res = await fetchWithRetry(apiUrl("/assets?per_page=100"), {
          headers: { Authorization: `Bearer ${token}` }
        });
        const resData = await res.json();
        
        if (res.ok && resData.success) {
          const fetched = (resData.data || []).map((a: any) => ({
            id: a.id,
            name: a.title,
            category: a.category,
            limitPrice: a.base_price,
            status: a.status,
            date: new Date(a.created_at).toLocaleDateString("id-ID", {
              day: 'numeric', month: 'long', year: 'numeric'
            })
          }));
          setAssets(fetched);
        }
      } catch (err) {
        console.error("Failed to fetch assets", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAssets();
  }, [router]);

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
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-500 font-medium">Memuat data aset...</td>
                </tr>
              ) : assets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-500 font-medium">Belum ada aset terdaftar.</td>
                </tr>
              ) : assets.map((asset) => (
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
