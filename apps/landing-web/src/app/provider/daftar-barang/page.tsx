"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ProviderLayout from "../../../components/layout/ProviderLayout";
import { apiUrl, fetchWithRetry, apiFetch } from "@/lib/api";
import { useToast } from "@/providers/ToastProvider";

interface Asset {
  id: string;
  name: string;
  category: string;
  limitPrice: number;
  status: string;
  branch_id?: string;
  pool_status?: string;
  rejection_reason?: string;
  police_number?: string;
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
  const toast = useToast();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [searchPolice, setSearchPolice] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [poolFilter, setPoolFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Detail view modal states
  const [selectedAssetDetail, setSelectedAssetDetail] = useState<any | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const handleViewAsset = async (id: string) => {
    setLoadingDetail(true);
    setViewModalOpen(true);
    setSelectedAssetDetail(null);
    try {
      const res = await apiFetch(`/assets/${id}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setSelectedAssetDetail(data.data);
      } else {
        toast.error(data.error?.message || "Gagal memuat detail aset");
        setViewModalOpen(false);
      }
    } catch (err) {
      toast.error("Gagal menghubungi server");
      setViewModalOpen(false);
    } finally {
      setLoadingDetail(false);
    }
  };

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
      if (searchPolice) params.set("police_number", searchPolice);
      if (statusFilter) params.set("status", statusFilter);
      if (poolFilter) params.set("pool_status", poolFilter);
      if (dateFrom) params.set("date_from", dateFrom);
      if (dateTo) params.set("date_to", dateTo);

      const res = await apiFetch(`/assets?${params.toString()}`);
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
          police_number: a.police_number,
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
  }, [router, search, searchPolice, statusFilter, poolFilter, dateFrom, dateTo]);

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
      const res = await apiFetch(`/assets/${id}`, {
        method: "DELETE",
      });
      const resData = await res.json();
      if (res.ok && resData.success) {
        fetchAssets();
      } else {
        toast.error(resData.error?.message || "Gagal menghapus barang.");
      }
    } catch (err) {
      toast.error("Koneksi gagal saat menghapus barang.");
    }
  };

  const handleResubmit = async (id: string) => {
    if (!window.confirm("Ajukan kembali barang ini untuk direview ulang?")) return;
    try {
      const res = await apiFetch(`/assets/${id}/review`, {
        method: "PUT",
      });
      const resData = await res.json();
      if (res.ok && resData.success) {
        fetchAssets();
      } else {
        toast.error(resData.error?.message || "Gagal mengajukan kembali barang.");
      }
    } catch (err) {
      toast.error("Koneksi gagal.");
    }
  };

  const handleReturn = async (id: string) => {
    if (!window.confirm("Tarik kembali barang ini dari proses lelang?")) return;
    try {
      const res = await apiFetch(`/assets/${id}/return`, {
        method: "PUT",
      });
      const resData = await res.json();
      if (res.ok && resData.success) {
        fetchAssets();
      } else {
        toast.error(resData.error?.message || "Gagal mengembalikan barang.");
      }
    } catch (err) {
      toast.error("Koneksi gagal.");
    }
  };

  return (
    <ProviderLayout pageTitle="Daftar Inventori Unit">
      <p className="page-subtitle">Kelola dan pantau status seluruh unit lelang Anda</p>

      <div className="card">
        <div className="card-header" style={{ flexWrap: "wrap", gap: "0.75rem" }}>
          <span>Tabel Inventori Unit</span>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
            <input
              type="text"
              placeholder="Cari nama unit..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="panel-form-input"
              style={{ width: "180px", padding: "0.4rem 0.6rem", fontSize: "0.85rem" }}
            />
            <input
              type="text"
              placeholder="Cari No. Polisi..."
              value={searchPolice}
              onChange={(e) => setSearchPolice(e.target.value)}
              className="panel-form-input"
              style={{ width: "160px", padding: "0.4rem 0.6rem", fontSize: "0.85rem" }}
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="panel-form-select"
              style={{ padding: "0.4rem 0.6rem", fontSize: "0.85rem" }}
            >
              <option value="">Semua Status</option>
              <option value="pending">Menunggu Kurasi</option>
              <option value="inspected">Sudah Diinspeksi</option>
              <option value="approved">Disetujui (Approved)</option>
              <option value="listed">Sedang Dilelang (Listed)</option>
              <option value="sold">Terjual (Sold)</option>
              <option value="rejected">Ditolak</option>
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
                <th>ID Unit</th>
                <th>Nama Unit</th>
                <th>Kategori</th>
                <th>No. Polisi</th>
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
                  <td colSpan={9} className="text-center py-8 text-slate-500 font-medium">Memuat data Unit...</td>
                </tr>
              ) : assets.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-slate-500 font-medium">Belum ada Unit terdaftar.</td>
                </tr>
              ) : assets.map((asset) => (
                <tr key={asset.id}>
                  <td>#{asset.id.slice(0, 8)}</td>
                  <td className="font-bold text-slate-800">{asset.name}</td>
                  <td>{asset.category}</td>
                  <td style={{ fontSize: '0.85rem' }}>{asset.police_number || '-'}</td>
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
                      <button
                        onClick={() => handleViewAsset(asset.id)}
                        className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 flex items-center gap-1"
                        title="Lihat Detail Aset"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: "15px" }}>visibility</span>
                        Detail
                      </button>

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
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {viewModalOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Detail Aset Inventori</span>
                <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2 mt-1">
                  {loadingDetail ? "Memuat..." : selectedAssetDetail?.title || "Detail Aset"}
                  {selectedAssetDetail && (
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase ${
                      selectedAssetDetail.status === 'sold' ? 'bg-success/10 text-success' :
                      selectedAssetDetail.status === 'approved' || selectedAssetDetail.status === 'listed' ? 'bg-info/10 text-info' :
                      selectedAssetDetail.status === 'rejected' ? 'bg-error/10 text-error' : 'bg-warning/10 text-warning'
                    }`}>
                      {selectedAssetDetail.status}
                    </span>
                  )}
                </h2>
              </div>
              <button
                onClick={() => setViewModalOpen(false)}
                className="w-10 h-10 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto flex-1">
              {loadingDetail ? (
                <div className="py-20 text-center flex flex-col items-center gap-3">
                  <span className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                  <span className="text-slate-500 font-semibold">Mengambil data detail...</span>
                </div>
              ) : selectedAssetDetail ? (
                <div className="space-y-6">
                  {/* Row 1: Spesifikasi Utama */}
                  <div>
                    <h4 className="font-bold text-sm text-primary uppercase tracking-wider mb-3">1. Spesifikasi Teknis</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <div>
                        <span className="text-slate-400 text-xs block">Kategori</span>
                        <span className="font-bold text-slate-800 capitalize">{selectedAssetDetail.category}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-xs block">Merek</span>
                        <span className="font-bold text-slate-800">{selectedAssetDetail.brand || "-"}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-xs block">Model</span>
                        <span className="font-bold text-slate-800">{selectedAssetDetail.model || "-"}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-xs block">Tipe / Varian</span>
                        <span className="font-bold text-slate-800">{selectedAssetDetail.type || "-"}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-xs block">Tahun Pembuatan</span>
                        <span className="font-bold text-slate-800">{selectedAssetDetail.year || "-"}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-xs block">Warna</span>
                        <span className="font-bold text-slate-800">{selectedAssetDetail.color || "-"}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-xs block">Transmisi</span>
                        <span className="font-bold text-slate-800">{selectedAssetDetail.transmission || "-"}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-xs block">Bahan Bakar</span>
                        <span className="font-bold text-slate-800">{selectedAssetDetail.fuel_type || "-"}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-xs block">Isi Silinder</span>
                        <span className="font-bold text-slate-800">{selectedAssetDetail.cylinder ? `${selectedAssetDetail.cylinder} cc` : "-"}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-xs block">Odometer</span>
                        <span className="font-bold text-slate-800">{selectedAssetDetail.odometer ? `${selectedAssetDetail.odometer.toLocaleString('id-ID')} km` : "-"}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-xs block">Status Pool</span>
                        <span className="font-bold text-slate-800 capitalize">{selectedAssetDetail.pool_status?.replace('_', ' ') || "-"}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-xs block">Cabang Balai</span>
                        <span className="font-bold text-slate-800">{branchName(selectedAssetDetail.branch_id)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Row 2: Surat & Legalitas */}
                  <div>
                    <h4 className="font-bold text-sm text-primary uppercase tracking-wider mb-3">2. Surat-Surat &amp; Identitas</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <div>
                        <span className="text-slate-400 text-xs block">Nomor Polisi</span>
                        <span className="font-bold text-slate-800">{selectedAssetDetail.police_number || "-"}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-xs block">Nomor BPKB</span>
                        <span className="font-bold text-slate-800">{selectedAssetDetail.bpkb_number || "-"}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-xs block">Nomor Rangka</span>
                        <span className="font-bold text-slate-800">{selectedAssetDetail.frame_number || "-"}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-xs block">Nomor Mesin</span>
                        <span className="font-bold text-slate-800">{selectedAssetDetail.engine_number || "-"}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-xs block">Masa Berlaku STNK</span>
                        <span className="font-bold text-slate-800">
                          {selectedAssetDetail.stnk_date ? new Date(selectedAssetDetail.stnk_date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "-"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-xs block">Masa Pajak STNK</span>
                        <span className="font-bold text-slate-800">
                          {selectedAssetDetail.stnk_tax_date ? new Date(selectedAssetDetail.stnk_tax_date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "-"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-xs block">Masa Berlaku KEUR</span>
                        <span className="font-bold text-slate-800">
                          {selectedAssetDetail.keur_date ? new Date(selectedAssetDetail.keur_date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "-"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-xs block">Harga Dasar Limit</span>
                        <span className="font-bold text-slate-800 text-lg text-secondary">{formatRupiah(selectedAssetDetail.base_price)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Row 3: Dokumen Fisik */}
                  <div>
                    <h4 className="font-bold text-sm text-primary uppercase tracking-wider mb-3">3. Kelengkapan Dokumen Fisik</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                      {[
                        { key: 'doc_stnk', label: 'STNK' },
                        { key: 'doc_bpkb', label: 'BPKB' },
                        { key: 'doc_faktur', label: 'Faktur' },
                        { key: 'doc_kwitansi', label: 'Kwitansi Blangko' },
                        { key: 'doc_form_a', label: 'Form A' },
                        { key: 'doc_copy_ktp', label: 'Fotokopi KTP' },
                        { key: 'doc_keur', label: 'Buku KEUR' },
                        { key: 'doc_sph', label: 'SPH' },
                      ].map((doc) => {
                        const hasDoc = selectedAssetDetail[doc.key];
                        return (
                          <div key={doc.key} className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200">
                            <span className={`material-symbols-outlined text-lg ${hasDoc ? 'text-success' : 'text-slate-300'}`}>
                              {hasDoc ? 'check_circle' : 'cancel'}
                            </span>
                            <span className="text-xs font-semibold text-slate-700">{doc.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Row 4: Catatan & Deskripsi */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-bold text-sm text-primary uppercase tracking-wider mb-2">Deskripsi Aset</h4>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm text-slate-600 min-h-[80px]">
                        {selectedAssetDetail.description || "Tidak ada deskripsi."}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-primary uppercase tracking-wider mb-2">Catatan Internal / Kondisi</h4>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm text-slate-600 min-h-[80px]">
                        {selectedAssetDetail.notes || "Tidak ada catatan."}
                      </div>
                    </div>
                  </div>

                  {/* Row 5: Foto Kendaraan */}
                  <div>
                    <h4 className="font-bold text-sm text-primary uppercase tracking-wider mb-3">4. Dokumentasi Foto</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        { key: 'photo_front', label: 'Foto Depan' },
                        { key: 'photo_back', label: 'Foto Belakang' },
                        { key: 'photo_right', label: 'Foto Samping Kanan' },
                        { key: 'photo_left', label: 'Foto Samping Kiri' },
                        { key: 'photo_engine', label: 'Foto Mesin' },
                        { key: 'photo_interior', label: 'Foto Interior' },
                        { key: 'photo_stnk', label: 'Foto STNK' },
                      ].map((photo) => {
                        const url = selectedAssetDetail[photo.key];
                        return (
                          <div key={photo.key} className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50 flex flex-col h-[180px]">
                            <div className="flex-1 flex items-center justify-center relative overflow-hidden bg-slate-100">
                              {url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={url}
                                  alt={photo.label}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="material-symbols-outlined text-slate-300 text-4xl">image</span>
                              )}
                            </div>
                            <div className="p-2 bg-white border-t border-slate-100 text-center">
                              <span className="text-xs font-bold text-slate-600">{photo.label}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-20 text-center text-slate-500">
                  Aset tidak ditemukan.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl flex justify-end">
              <button
                onClick={() => setViewModalOpen(false)}
                className="px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-sm transition-colors"
              >
                Tutup Detail Aset
              </button>
            </div>
          </div>
        </div>
      )}
    </ProviderLayout>
  );
}
