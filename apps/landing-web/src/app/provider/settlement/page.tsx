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
        

      }
    } catch (err) {
      console.error("Failed to fetch settlements", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettlements();
  }, []);



  const formatRupiah = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Two different kinds of payout share the settlements table. A forfeiture
  // row carries no hammer price or tax breakdown (all those columns are 0) —
  // it is the provider's half of a NIPL the winning bidder let lapse — so it
  // gets its own table instead of rendering as a row of zeros in the tax one.
  const saleSettlements = items.filter((item) => !item.is_forfeiture);
  const forfeitureSettlements = items.filter((item) => item.is_forfeiture);
  const forfeitureTotal = forfeitureSettlements.reduce(
    (sum, item) => sum + Number(item.net_amount || 0),
    0
  );

  return (
    <ProviderLayout pageTitle="Settlement &amp; Pencairan Dana">


      <div className="card">
        <div className="card-header">Rincian Perhitungan Pembayaran &amp; Potongan Pajak</div>
        <div className="table-wrapper" style={{ overflowX: 'auto' }}>
          {loading ? (
            <div className="py-8 text-center text-slate-500">Memuat data settlement...</div>
          ) : saleSettlements.length === 0 ? (
            <div className="py-8 text-center text-slate-500">Belum ada riwayat settlement penjualan.</div>
          ) : (
            <table className="dashboard-table text-xs" style={{ width: '100%', minWidth: '1700px' }}>
              <thead>
                <tr>
                  <th>No. Ref</th>
                  <th>Tanggal</th>
                  <th>Sesi Lelang</th>
                  <th>Nama Unit Aset</th>
                  <th>No Polisi</th>
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
                {saleSettlements.map((item) => {
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
                      <td>{item.lot?.asset?.police_number || '-'}</td>
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

      <div className="card">
        <div className="card-header">
          <span>Pencairan NIPL Hangus (Pemenang Tidak Melunasi)</span>
          {forfeitureSettlements.length > 0 && (
            <span className="font-bold text-success">{formatRupiah(forfeitureTotal)}</span>
          )}
        </div>
        <div className="alert-box info text-xs mb-3">
          Saat pemenang lelang tidak melunasi unit sampai batas waktu, jaminan NIPL-nya hangus
          dan dibagi dua: setengah untuk Indo Lelang, setengah menjadi hak Anda sebagai provider.
        </div>
        <div className="table-wrapper" style={{ overflowX: 'auto' }}>
          {loading ? (
            <div className="py-8 text-center text-slate-500">Memuat data...</div>
          ) : forfeitureSettlements.length === 0 ? (
            <div className="py-8 text-center text-slate-500">Belum ada NIPL hangus.</div>
          ) : (
            <table className="dashboard-table text-xs" style={{ width: '100%', minWidth: '900px' }}>
              <thead>
                <tr>
                  <th>No. Ref</th>
                  <th>Tanggal</th>
                  <th>Sesi Lelang</th>
                  <th>Nama Unit Aset</th>
                  <th>No Polisi</th>
                  <th>Nilai NIPL Hangus</th>
                  <th>Bagian Anda (50%)</th>
                  <th>Rekening Tujuan</th>
                  <th>Waktu Transfer</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {forfeitureSettlements.map((item) => {
                  const bankInfo = profile ? `${profile.bank_name || '-'} - ${profile.bank_account_no || '-'}` : '-';
                  return (
                    <tr key={item.id}>
                      <td>#{item.id.substring(0, 8).toUpperCase()}</td>
                      <td>{new Date(item.created_at).toLocaleDateString('id-ID')}</td>
                      <td>{item.lot?.session?.title || '-'}</td>
                      <td className="font-bold text-slate-800">{item.lot?.asset?.title || '-'}</td>
                      <td>{item.lot?.asset?.police_number || '-'}</td>
                      <td>{formatRupiah(Number(item.nipl_forfeiture_amount || 0))}</td>
                      <td className="font-bold text-success" style={{ fontSize: '0.9rem' }}>
                        {formatRupiah(Number(item.net_amount || 0))}
                      </td>
                      <td>{bankInfo}</td>
                      <td>{item.transferred_at ? new Date(item.transferred_at).toLocaleDateString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                      <td>
                        <span className={`badge-ui ${item.status === "processed" ? "success" : "warning"}`}>
                          {item.status === "processed" ? "Selesai" : "Proses Cair"}
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
