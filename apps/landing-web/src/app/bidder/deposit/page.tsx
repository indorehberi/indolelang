"use client";

import React, { useState } from "react";
import BidderLayout from "../../../components/layout/BidderLayout";

export default function BidderDeposit() {
  const [bank, setBank] = useState<string>("BCA");
  const [amount, setAmount] = useState<number>(1000000);
  const [generatedVa, setGeneratedVa] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  const handleGenerateVa = (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setTimeout(() => {
      // Simulate VA generation matching our format
      const prefix = bank === "BCA" ? "7008" : bank === "Mandiri" ? "8923" : "9012";
      const randomPart = Math.floor(10000000 + Math.random() * 90000000).toString();
      setGeneratedVa(`${prefix}-${randomPart.substring(0, 4)}-${randomPart.substring(4, 8)}`);
      setIsGenerating(false);

      if (typeof window !== "undefined") {
        const currentTickets = Number(localStorage.getItem("nipl_tickets") || "2");
        localStorage.setItem("nipl_tickets", (currentTickets + 1).toString());
        const currentBalance = Number(localStorage.getItem("deposit_balance") || "5000000");
        localStorage.setItem("deposit_balance", (currentBalance + amount).toString());
      }
    }, 1500);
  };

  const formatRupiah = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <BidderLayout pageTitle="Setor Deposit NIPL">
      <p className="page-subtitle">Beli tiket penawaran NIPL untuk berpartisipasi lelang</p>

      <div className="grid-2-1">
        <div>
          <div className="card">
            <div className="card-header">Form Pengajuan Deposit Jaminan</div>
            <form onSubmit={handleGenerateVa} className="space-y-4">
              <div className="panel-form-group">
                <label className="panel-form-label">Nominal Deposit Jaminan</label>
                <select
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="panel-form-select"
                >
                  <option value={1000000}>Rp 1.000.000 (1x NIPL Mobil / Motor)</option>
                  <option value={5000000}>Rp 5.000.000 (5x NIPL Reguler)</option>
                  <option value={10000000}>Rp 10.000.000 (NIPL Unlimited - VIP)</option>
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  *Setoran jaminan bersifat *refundable* penuh jika Anda kalah menawar lot lelang.
                </p>
              </div>

              <div className="panel-form-group">
                <label className="panel-form-label">Metode Pembayaran Virtual Account</label>
                <div className="grid grid-cols-3 gap-3">
                  {["BCA", "Mandiri", "BNI"].map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setBank(b)}
                      className={`p-3 border rounded-xl font-bold text-center transition-all ${
                        bank === b
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-outline-variant/30 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {b} VA
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={isGenerating}
                className="w-full py-3 bg-primary hover:bg-primary/95 text-white font-bold rounded-xl transition-all shadow-md shadow-primary/20 flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Menghasilkan VA...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined">qr_code</span>
                    Dapatkan Virtual Account
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Info panel */}
        <div>
          {generatedVa ? (
            <div className="card border-primary/30 bg-primary/[0.02]">
              <div className="card-header text-primary">Instruksi Pembayaran VA</div>
              <div className="space-y-4">
                <div className="text-center p-4 bg-slate-900 text-white rounded-xl">
                  <div className="text-xs text-slate-400 font-medium">Nomor Virtual Account {bank}</div>
                  <div className="text-lg font-black tracking-widest mt-1 text-primary-fixed">{generatedVa}</div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Jumlah Transfer</span>
                    <span className="font-bold text-slate-800">{formatRupiah(amount)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Batas Waktu</span>
                    <span className="font-bold text-error">23 Jam 59 Menit</span>
                  </div>
                </div>

                <div className="border-t border-outline-variant/20 pt-3 space-y-2 text-[11px] text-slate-600">
                  <p className="font-bold text-slate-800">Petunjuk Transfer:</p>
                  <ol className="list-decimal pl-4 space-y-1">
                    <li>Pilih menu Transfer ke Rekening Virtual Account.</li>
                    <li>Masukkan nomor VA di atas.</li>
                    <li>Konfirmasi nama akun Anda &amp; total pembayaran.</li>
                    <li>Selesaikan pembayaran dan deposit Anda otomatis aktif.</li>
                  </ol>
                </div>
              </div>
            </div>
          ) : (
            <div className="card">
              <div className="card-header">Ketentuan Deposit Jaminan</div>
              <div className="text-xs text-slate-600 space-y-3 leading-relaxed">
                <p>
                  Setiap peserta lelang (Bidder) diwajibkan membeli NIPL (*Nomor Induk Peserta Lelang*) sebagai tiket sah menawar unit lot yang diinginkan.
                </p>
                <p className="font-bold text-slate-800">
                  1 NIPL = 1 Hak Menang Lot Aset.
                </p>
                <p>
                  Jika Anda tidak memenangkan lot mana pun di akhir sesi, uang deposit jaminan ini akan di-*refund* secara penuh 100% ke rekening terdaftar Anda tanpa potongan apapun dalam 1-3 hari kerja.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </BidderLayout>
  );
}
