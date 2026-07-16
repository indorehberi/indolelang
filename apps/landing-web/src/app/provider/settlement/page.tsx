"use client";

import React, { useState, useEffect } from "react";
import ProviderLayout from "../../../components/layout/ProviderLayout";
import { apiUrl, apiFetch } from "@/lib/api";
import { useToast } from "@/providers/ToastProvider";

export default function ProviderSettlement() {
  const toast = useToast();
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
      const [resSettle, resProfile] = await Promise.all([
        apiFetch("/payments/settlements?per_page=100"),
        apiFetch("/users/profile"),
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
      toast.warning("Tidak ada dana pending yang siap dicairkan.");
      return;
    }

    setRequestPending(true);
    try {
      const failedItems: string[] = [];
      for (const item of pendingItems) {
        const response = await apiFetch(`/payments/settlements/${item.id}/disburse`, {
          method: "POST",
        });
        const data = await response.json().catch(() => null);
        if (!response.ok || !data?.success) {
          failedItems.push(item.id);
        }
      }
      await fetchSettlements();
      if (failedItems.length === 0) {
        toast.success("Permintaan pencairan dana berhasil diajukan!");
      } else {
        toast.error(`Sebagian permintaan pencairan gagal diajukan (${failedItems.length} dari ${pendingItems.length}). Silakan coba lagi.`);
      }
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan saat memproses pencairan.");
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
            <table className="dashboard-table text-xs" style={{ width: '100%', minWidth: '1700px' }}>
              <thead>
                <tr>
                  <th>No. Ref</th>
                  <th>Tanggal</th>
                  <th>Sesi Lelang</th>
                  <th>Nama Unit Aset</th>
                  <th>Harga Terbentuk</th>
                  <th>PPN Pemenang (PMK 41)</th>
                  <th>Fee Lelang (%)</th>
                  <th>DPP</th>
                  <th>DPP Nilai Lain</th>
                  <th>PPN</th>
                  <th>Total Invoice Fee Lelang</th>
                  <th>PPh 23</th>
                  <th>Total Penerimaan Indo Lelang</th>
                  <th>Pembayaran ke Provider</th>
                  <th>Rekening Tujuan</th>
                  <th>Waktu Transfer</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const bankInfo = profile ? `${profile.bank_name || '-'} - ${profile.bank_account_no || '-'}` : '-';
                  // Total Invoice Fee Lelang (H) = DPP (E) + PPN (G) — matches
                  // pembayaran_ke_provider.xlsx's H9 = E9+G9 identity; not a
                  // separately stored field since it's algebraically derived.
                  const totalInvoiceFeeLelang = item.fee_dpp + item.fee_ppn;
                  const feeLelangPct = item.gross_amount > 0 ? (totalInvoiceFeeLelang / item.gross_amount) * 100 : 0;

                  return (
                    <tr key={item.id}>
                      <td>#{item.id.substring(0, 8).toUpperCase()}</td>
                      <td>{new Date(item.created_at).toLocaleDateString('id-ID')}</td>
                      <td>{item.lot?.session?.title || '-'}</td>
                      <td className="font-bold text-slate-800">{item.lot?.asset?.title || '-'}</td>
                      <td className="font-bold">{formatRupiah(item.gross_amount)}</td>
                      <td className="text-green-600">+{formatRupiah(item.pmk41_amount)}</td>
                      <td>{feeLelangPct.toFixed(2)}%</td>
                      <td>{formatRupiah(item.fee_dpp)}</td>
                      <td>{formatRupiah(item.fee_dpp_lain)}</td>
                      <td>{formatRupiah(item.fee_ppn)}</td>
                      <td className="text-red-600">-{formatRupiah(totalInvoiceFeeLelang)}</td>
                      <td className="text-green-600">+{formatRupiah(item.fee_pph23)}</td>
                      <td className="font-semibold text-slate-700">{formatRupiah(item.commission_deducted)}</td>
                      <td className="font-bold text-success" style={{ fontSize: '0.9rem' }}>{formatRupiah(item.net_amount)}</td>
                      <td>{bankInfo}</td>
                      <td>{item.transferred_at ? new Date(item.transferred_at).toLocaleDateString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                      <td>
                        <span className={`badge-ui ${item.status === "processed" ? "success" : item.status === "unpaid" ? "danger" : "warning"}`}>
                          {item.status === "processed" ? "Selesai" : item.status === "unpaid" ? "Menunggu Pembeli" : "Proses Cair"}
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
