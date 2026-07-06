"use client";

import React, { useState, useEffect } from "react";
import ProviderLayout from "../../../components/layout/ProviderLayout";
import { apiUrl } from "@/lib/api";

export default function ProviderSettlement() {
  const [items, setItems] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [requestPending, setRequestPending] = useState(false);
  const [feeBearer, setFeeBearer] = useState<string>("admin");
  const [pendingAmount, setPendingAmount] = useState(0);

  const fetchSettings = async () => {
    try {
      const response = await fetch(apiUrl("/settings/public"));
      const resData = await response.json();
      if (response.ok && resData.success) {
        const feeSetting = resData.data.find((s: any) => s.key === "FEE_BEARER");
        if (feeSetting) {
          setFeeBearer(feeSetting.value);
        }
      }
    } catch (err) {
      console.error("Failed to fetch settings", err);
    }
  };

  const fetchSettlements = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      const [resSettle, resProfile] = await Promise.all([
        fetch(apiUrl("/payments/settlements?per_page=100"), {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(apiUrl("/users/profile"), {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (resProfile.ok) {
        const data = await resProfile.json();
        setProfile(data.data);
      }

      if (resSettle.ok) {
        const data = await resSettle.json();
        const settlements = data.data || [];
        setItems(settlements);
        
        const pending = settlements
          .filter((s: any) => s.status === "pending")
          .reduce((sum: number, s: any) => sum + s.net_amount, 0);
        setPendingAmount(pending);
      }
    } catch (err) {
      console.error("Failed to fetch settlements", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchSettlements();
  }, []);

  const handleRequestDisbursement = async () => {
    const pendingItems = items.filter((s: any) => s.status === "pending");
    if (pendingItems.length === 0) {
      alert("Tidak ada dana pending yang siap dicairkan.");
      return;
    }

    setRequestPending(true);
    try {
      const token = localStorage.getItem("accessToken");
      for (const item of pendingItems) {
        await fetch(apiUrl(`/payments/settlements/${item.id}/disburse`), {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      alert("Permintaan pencairan dana berhasil diajukan!");
      fetchSettlements();
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan saat memproses pencairan.");
    } finally {
      setRequestPending(false);
    }
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <div className="card">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold block">Total Saldo Pending Pencairan</span>
              <div className="text-heading-xl text-primary font-black mt-0.5">{formatRupiah(pendingAmount)}</div>
            </div>
            
            <div className="flex items-center gap-4 flex-wrap">
              {feeBearer === 'customer' && (
                <div className="p-3 bg-warning/10 border border-warning/20 rounded-xl text-xs text-warning-dark max-w-sm">
                  <strong>Pemberitahuan Payout:</strong> Segala biaya transfer (gateway payout fee) dibebankan ke provider. Biaya <strong>Rp 3.200</strong> per pencairan dipotong langsung dari saldo transfer.
                </div>
              )}

              <button
                onClick={handleRequestDisbursement}
                disabled={requestPending || pendingAmount === 0}
                className="py-3 px-6 bg-secondary hover:bg-secondary/95 text-white font-bold rounded-xl transition-all shadow-md shadow-secondary/20 flex items-center gap-2"
                style={{ height: '48px' }}
              >
                {requestPending ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Memproses Pencairan...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined">payments</span>
                    Cairkan Semua Saldo Ke Rekening
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">Rincian Perhitungan Pembayaran &amp; Potongan Pajak</div>
        <div className="table-wrapper" style={{ overflowX: 'auto' }}>
          {loading ? (
            <div className="py-8 text-center text-slate-500">Memuat data settlement...</div>
          ) : items.length === 0 ? (
            <div className="py-8 text-center text-slate-500">Belum ada riwayat settlement penjualan.</div>
          ) : (
            <table className="dashboard-table text-xs" style={{ width: '100%', minWidth: '1500px' }}>
              <thead>
                <tr>
                  <th>No. Ref</th>
                  <th>Tanggal</th>
                  <th>Sesi Lelang</th>
                  <th>Nama Unit Aset</th>
                  <th>Harga Terbentuk (GMV)</th>
                  <th>Fee Lelang</th>
                  <th>DPP</th>
                  <th>Fee DPP</th>
                  <th>Fee DPP Lain</th>
                  <th>PPN</th>
                  <th>PPh 23</th>
                  <th>PPN PMK 41</th>
                  <th>Nominal Bersih</th>
                  <th>Rekening Tujuan</th>
                  <th>Waktu Transfer</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const dpp = item.gross_amount - item.commission_deducted;
                  const bankInfo = profile ? `${profile.bank_name || '-'} - ${profile.bank_account_no || '-'}` : '-';

                  return (
                    <tr key={item.id}>
                      <td>#{item.id.substring(0, 8).toUpperCase()}</td>
                      <td>{new Date(item.created_at).toLocaleDateString('id-ID')}</td>
                      <td>{item.lot?.session?.title || '-'}</td>
                      <td className="font-bold text-slate-800">{item.lot?.asset?.title || '-'}</td>
                      <td className="font-bold">{formatRupiah(item.gross_amount)}</td>
                      <td className="text-red-600">-{formatRupiah(item.commission_deducted)}</td>
                      <td className="font-semibold text-slate-700">{formatRupiah(dpp)}</td>
                      <td>{formatRupiah(item.fee_dpp)}</td>
                      <td>{formatRupiah(item.fee_dpp_lain)}</td>
                      <td className="text-red-600">-{formatRupiah(item.fee_ppn)}</td>
                      <td className="text-green-600">+{formatRupiah(item.fee_pph23)}</td>
                      <td className="text-green-600">+{formatRupiah(item.pmk41_amount)}</td>
                      <td className="font-bold text-success" style={{ fontSize: '0.9rem' }}>{formatRupiah(item.net_amount)}</td>
                      <td>{bankInfo}</td>
                      <td>{item.transferred_at ? new Date(item.transferred_at).toLocaleDateString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                      <td>
                        <span className={`badge-ui ${item.status === "processed" ? "success" : "warning"}`}>
                          {item.status === "processed" ? "Selesai" : "Proses"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </ProviderLayout>
  );
}
