"use client";

import React, { useEffect, useState } from "react";
import BidderLayout from "../../../components/layout/BidderLayout";
import { apiFetch, getImageUrl } from "../../../lib/api";

interface BidHistory {
  lot_id: string;
  lot_number?: number;
  session_title: string;
  session_date?: string;
  asset_title: string;
  asset_photo?: string | null;
  my_highest_bid: number;
  hammer_price?: number | null;
  lot_status: string;
  result: "won" | "lost" | "ongoing";
}

export default function BidderRiwayatLelang() {
  const [history, setHistory] = useState<BidHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const formatRupiah = (value: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(value);

  const formatDate = (iso?: string) => {
    if (!iso) return "-";
    return new Date(iso).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const res = await apiFetch(`/lots/history/me?page=${page}&per_page=20`);
        if (res.ok) {
          const json = await res.json();
          if (json.success) {
            setHistory(json.data);
            setTotalPages(json.meta?.total_pages || 1);
          }
        }
      } catch (err) {
        console.error("Failed to fetch auction history:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [page]);

  const resultBadge = (result: BidHistory["result"]) => {
    if (result === "won") return <span className="badge-ui success">Menang</span>;
    if (result === "lost") return <span className="badge-ui danger">Kalah</span>;
    return <span className="badge-ui warning">Berlangsung</span>;
  };

  return (
    <BidderLayout pageTitle="Riwayat Lelang">
      <p className="page-subtitle">Sesi dan lot lelang yang pernah Anda ikuti</p>

      <div className="card">
        <div className="card-header">Riwayat Partisipasi Lelang</div>
        {loading ? (
          <div className="py-8 text-center text-slate-500 text-sm">Memuat riwayat...</div>
        ) : (
          <div className="table-wrapper">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>No Lot</th>
                  <th>Sesi Lelang</th>
                  <th>Nama Unit Aset</th>
                  <th>Bid Tertinggi Anda</th>
                  <th>Harga Hammer</th>
                  <th>Hasil</th>
                  <th>Tanggal Sesi</th>
                </tr>
              </thead>
              <tbody>
                {history.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-6 text-slate-500">
                      Belum ada riwayat keikutsertaan lelang Anda.
                    </td>
                  </tr>
                ) : (
                  history.map((item) => (
                    <tr key={item.lot_id}>
                      <td className="font-mono font-bold">
                        {item.lot_number !== undefined ? `#${item.lot_number}` : "-"}
                      </td>
                      <td>{item.session_title}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          {item.asset_photo && (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={getImageUrl(item.asset_photo)}
                              alt={item.asset_title}
                              className="w-8 h-8 rounded object-cover shrink-0"
                            />
                          )}
                          <span className="font-bold text-slate-800">{item.asset_title}</span>
                        </div>
                      </td>
                      <td className="font-semibold text-blue-700">
                        {formatRupiah(item.my_highest_bid)}
                      </td>
                      <td>
                        {item.hammer_price ? (
                          <span className="font-bold text-slate-800">{formatRupiah(item.hammer_price)}</span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td>{resultBadge(item.result)}</td>
                      <td className="text-slate-500 text-sm">{formatDate(item.session_date)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-4 pb-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1 text-sm rounded border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
            >
              ← Prev
            </button>
            <span className="px-3 py-1 text-sm text-slate-600">
              Halaman {page} / {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1 text-sm rounded border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </BidderLayout>
  );
}
