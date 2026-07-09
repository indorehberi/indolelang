"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ProviderLayout from "../../../components/layout/ProviderLayout";
import { apiUrl, fetchWithRetry } from "@/lib/api";

interface Asset {
  id: string;
  name: string;
  category: string;
  limitPrice: number;
  status: string;
  branch_id?: string;
  pool_status?: string;
  rejection_reason?: string;
  date: string;
}

interface Branch {
  id: string;
  name: string;
  city: string;
}

const STATUS_OPTIONS = [
  { value: "", label: "Semua Status" },
  { value: "pending,inspected", label: "Menunggu" },
  { value: "approved,listed", label: "Disetujui" },
  { value: "rejected", label: "Ditolak" },
  { value: "sold", label: "Terjual" },
  { value: "returned", label: "Dikembalikan" },
];

export default function ProviderDaftarBarang() {
  const router = useRouter();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [poolFilter, setPoolFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const res = await fetchWithRetry(apiUrl("/branches"));
        const resData = await res.json();
        if (res.ok && resData.success) setBranches(resData.data || []);
      } catch (err) {
        console.error("Gagal memuat cabang", err);
      }
    };
    fetchBranches();
  }, []);

  const fetchAssets = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        router.push("/login");
        return;
      }

      const params = new URLSearchParams({ per_page: "200" });
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      if (poolFilter) params.set("pool_status", poolFilter);
      if (dateFrom) params.set("date_from", dateFrom);
      if (dateTo) params.set("date_to", dateTo);

      const res = await fetchWithRetry(apiUrl(`/assets?${params.toString()}`), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const resData = await res.json();

      if (res.ok && resData.success) {
        const fetched = (resData.data || []).map((a: any) => ({
          id: a.id,
          name: a.title,
          category: a.category,
          limitPrice: a.base_price,
          status: a.status,
          branch_id: a.branch_id,
          pool_status: a.pool_status,
          rejection_reason: a.rejection_reason,
          date: new Date(a.created_at).toLocaleDateString("id-ID", {
            day: "numeric", month: "long", year: "numeric",
          }),
        }));
        setAssets(fetched);
      }
    } catch (err) {
      console.error("Failed to fetch assets", err);
    } finally {
      setLoading(false);
    }
  }, [router, search, statusFilter, poolFilter, dateFrom, dateTo]);

  useEffect(() => {
    const t = setTimeout(() => {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchAssets();
    }, 300);
    return () => clearTimeout(t);
  }, [fetchAssets]);

  const formatRupiah = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const branchName = (branchId?: string) => {
    if (!branchId) return "-";
    const b = branches.find((x) => x.id === branchId);
    return b ? `${b.name}` : "-";
  };

  const getStatusBadge = (status: string) => {
    if (status === "sold") return <span className="badge-ui success">Terjual</span>;
    if (status === "approved" || status === "listed") return <span className="badge-ui info">Disetujui</span>;
    if (status === "pending" || status === "inspected") return <span className="badge-ui warning">Menunggu</span>;
    if (status === "rejected") return <span className="badge-ui danger">Ditolak</span>;
    if (status === "returned") return <span className="badge-ui default">Dikembalikan</span>;
    return <span className="badge-ui default">{status}</span>;
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Hapus pengajuan ini secara permanen?")) return;
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetchWithRetry(apiUrl(`/assets/${id}`), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const resData = await res.json();
      if (res.ok && resData.success) {
        fetchAssets();
      } else {
        alert(resData.error?.message || "Gagal menghapus barang.");
      }
    } catch (err) {
      alert("Koneksi gagal saat menghapus barang.");
    }
  };

  const handleResubmit = async (id: string) => {
    if (!window.confirm("Ajukan kembali barang ini untuk direview ulang?")) return;
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetchWithRetry(apiUrl(`/assets/${id}/review`), {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      const resData = await res.json();
      if (res.ok && resData.success) {
        fetchAssets();
      } else {
        alert(resData.error?.message || "Gagal mengajukan kembali barang.");
      }
    } catch (err) {
      alert("Koneksi gagal.");
    }
  };

  const handleReturn = async (id: string) => {
    if (!window.confirm("Tarik kembali barang ini dari proses lelang?")) return;
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetchWithRetry(apiUrl(`/assets/${id}/return`), {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      const resData = await res.json();
      if (res.ok && resData.success) {
        fetchAssets();
      } else {
        alert(resData.error?.message || "Gagal mengembalikan barang.");
      }
    } catch (err) {
      alert("Koneksi gagal.");
    }
  };

  return (
    <ProviderLayout pageTitle="Daftar Inventori Aset">
      <p className="page-subtitle">Kelola dan pantau status seluruh unit lelang Anda</p>

      <div className="card">
        <div className="card-header" style={{ flexWrap: "wrap", gap: "0.75rem" }}>
          <span>Tabel Inventori Unit Aset</span>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
            <input
              type="text"
              placeholder="Cari nama unit..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="panel-form-input"
              style={{ width: "180px", padding: "0.4rem 0.6rem", fontSize: "0.85rem" }}
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="panel-form-select"
              style={{ padding: "0.4rem 0.6rem", fontSize: "0.85rem" }}
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <select
              value={poolFilter}
              onChange={(e) => setPoolFilter(e.target.value)}
              className="panel-form-select"
              style={{ padding: "0.4rem 0.6rem", fontSize: "0.85rem" }}
            >
              <option value="">Semua Pool</option>
              <option value="in_pool">In Pool</option>
              <option value="out_pool">Out Pool</option>
            </select>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="panel-form-input"
              style={{ padding: "0.4rem 0.6rem", fontSize: "0.85rem" }}
              title="Dari tanggal"
            />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="panel-form-input"
              style={{ padding: "0.4rem 0.6rem", fontSize: "0.85rem" }}
              title="Sampai tanggal"
            />
          </div>
        </div>

        <div className="table-wrapper">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>ID Aset</th>
                <th>Nama Unit Aset</th>
                <th>Kategori</th>
                <th>Cabang</th>
                <th>Harga Dasar Limit</th>
                <th>Status</th>
                <th>Tanggal Masuk</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-500 font-medium">Memuat data aset...</td>
                </tr>
              ) : assets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-500 font-medium">Belum ada aset terdaftar.</td>
                </tr>
              ) : assets.map((asset) => (
                <tr key={asset.id}>
                  <td>#{asset.id.slice(0, 8)}</td>
                  <td className="font-bold text-slate-800">{asset.name}</td>
                  <td>{asset.category}</td>
                  <td>{branchName(asset.branch_id)}</td>
                  <td className="font-bold">{formatRupiah(asset.limitPrice)}</td>
                  <td>
                    {getStatusBadge(asset.status)}
                    {asset.status === "rejected" && asset.rejection_reason && (
                      <div className="text-xs text-slate-500 mt-1 max-w-[200px]">{asset.rejection_reason}</div>
                    )}
                  </td>
                  <td>{asset.date}</td>
                  <td>
                    <div className="flex flex-wrap gap-1.5">
                      {asset.status === "rejected" && (
                        <>
                          <Link
                            href={`/provider/ajukan-barang?edit=${asset.id}`}
                            className="px-2.5 py-1 text-xs font-bold rounded-lg border border-primary/40 text-primary hover:bg-primary/5"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => handleResubmit(asset.id)}
                            className="px-2.5 py-1 text-xs font-bold rounded-lg border border-success/40 text-success hover:bg-success/5"
                          >
                            Ajukan Kembali
                          </button>
                          <button
                            onClick={() => handleDelete(asset.id)}
                            className="px-2.5 py-1 text-xs font-bold rounded-lg border border-error/40 text-error hover:bg-error/5"
                          >
                            Hapus
                          </button>
                        </>
                      )}
                      {(asset.status === "approved" || asset.status === "listed") && (
                        <button
                          onClick={() => handleReturn(asset.id)}
                          className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50"
                        >
                          Dikembalikan
                        </button>
                      )}
                      {!["rejected", "approved", "listed"].includes(asset.status) && (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </ProviderLayout>
  );
}
