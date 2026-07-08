"use client";

import React, { useEffect, useState } from "react";
import BidderLayout from "../../../../components/layout/BidderLayout";
import Link from "next/link";
import { apiUrl } from "../../../../lib/api";
import { useRouter } from "next/navigation";

interface Deposit {
  id: string;
  amount: number;
  payment_method?: string;
  status: string;
  created_at: string;
}

export default function DepositHistoryPage() {
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const router = useRouter();

  const fetchDeposits = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        router.push("/login");
        return;
      }
      const response = await fetch(apiUrl("/deposits?page=1&per_page=50"), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setDeposits(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch deposit history", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeposits();
  }, []);

  const handleRequestRefund = async (depositId: string) => {
    if (!confirm("Apakah Anda yakin ingin mengajukan refund (pengembalian uang) untuk NIPL ini? Uang akan dikembalikan ke rekening yang terdaftar di profil Anda dalam 1-3 hari kerja.")) {
      return;
    }

    setProcessingId(depositId);
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(apiUrl(`/deposits/${depositId}/request-refund`), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok && data.success) {
        alert("Pengajuan refund berhasil. Uang jaminan sedang diproses.");
        fetchDeposits();
      } else {
        alert(data.error?.message || "Gagal mengajukan refund.");
      }
    } catch (err: any) {
      alert("Koneksi gagal saat mengajukan refund.");
    } finally {
      setProcessingId(null);
    }
  };

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <span className="badge-ui success">NIPL Aktif</span>;
      case "pending":
      case "pending_approval":
        return <span className="badge-ui warning">Pending</span>;
      case "pending_refund":
        return <span className="badge-ui warning">Menunggu Refund</span>;
      case "refunded":
        return <span className="badge-ui info">Refunded</span>;
      case "consumed":
        return <span className="badge-ui default">Terpakai (Checkout)</span>;
      case "expired":
        return <span className="badge-ui danger">Expired</span>;
      default:
        return <span className="badge-ui default">{status}</span>;
    }
  };

  return (
    <BidderLayout pageTitle="Riwayat Deposit & Refund">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
        <p className="page-subtitle mb-0">Daftar transaksi pembelian NIPL dan status refund Anda</p>
        <Link href="/bidder/deposit" className="panel-btn panel-btn-gold">
          + Beli NIPL Baru
        </Link>
      </div>

      <div className="card">
        <div className="card-header">Riwayat Deposit NIPL</div>
        <div className="table-wrapper">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>ID Transaksi</th>
                <th>Tanggal</th>
                <th>Jumlah Jaminan</th>
                <th>Status</th>
                <th className="text-center">Aksi / Refund</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-6 text-slate-500">
                    Memuat riwayat deposit...
                  </td>
                </tr>
              ) : deposits.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-6 text-slate-500">
                    Belum ada riwayat deposit NIPL.
                  </td>
                </tr>
              ) : (
                deposits.map((deposit) => (
                  <tr key={deposit.id}>
                    <td>
                      <span className="font-mono text-xs text-slate-600">
                        {deposit.id.split("-")[0].toUpperCase()}
                      </span>
                    </td>
                    <td>
                      {new Date(deposit.created_at).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </td>
                    <td>
                      <strong className="text-slate-800">{formatRupiah(deposit.amount)}</strong>
                    </td>
                    <td>{getStatusBadge(deposit.status)}</td>
                    <td className="text-center">
                      {deposit.status === "paid" ? (
                        <button
                          onClick={() => handleRequestRefund(deposit.id)}
                          disabled={processingId === deposit.id}
                          className="btn btn-xs btn-outline hover:bg-slate-100 disabled:opacity-50"
                        >
                          {processingId === deposit.id ? "Memproses..." : "💸 Ajukan Refund"}
                        </button>
                      ) : (
                        <span className="text-slate-400 text-xs">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </BidderLayout>
  );
}
