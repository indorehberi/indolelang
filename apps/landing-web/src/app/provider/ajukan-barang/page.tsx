"use client";

import React, { useState } from "react";
import ProviderLayout from "../../../components/layout/ProviderLayout";

export default function ProviderAjukanBarang() {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("mobil");
  const [brand, setBrand] = useState("");
  const [year, setYear] = useState(2021);
  const [limitPrice, setLimitPrice] = useState(100000000);
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [auctionType, setAuctionType] = useState("English Auction");
  const [enabledTypes, setEnabledTypes] = useState<string[]>(["English Auction", "Dutch Auction", "Sealed-Bid", "Timed Auction", "Buy Now + Auction", "Group/Bundle"]);

  React.useEffect(() => {
    if (typeof document !== "undefined") {
      const cookieMap: Record<string, string> = {};
      document.cookie.split(";").forEach((c) => {
        const parts = c.trim().split("=");
        if (parts[0]) cookieMap[parts[0]] = parts[1] || "";
      });

      const list = [];
      if (cookieMap["feat_auction_english"] !== "false") list.push("English Auction");
      if (cookieMap["feat_auction_dutch"] !== "false") list.push("Dutch Auction");
      if (cookieMap["feat_auction_sealed"] !== "false") list.push("Sealed-Bid");
      if (cookieMap["feat_auction_timed"] !== "false") list.push("Timed Auction");
      if (cookieMap["feat_auction_buynow"] !== "false") list.push("Buy Now + Auction");
      if (cookieMap["feat_auction_group"] !== "false") list.push("Group/Bundle");

      if (list.length > 0) {
        setEnabledTypes(list);
        setAuctionType(list[0]);
      }
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      setName("");
      setBrand("");
      setDescription("");

      // Simulate appending to mock inventory
      if (typeof window !== "undefined") {
        const listStr = localStorage.getItem("provider_assets") || "[]";
        try {
          const list = JSON.parse(listStr);
          list.push({
            id: `AST-${Math.floor(1000 + Math.random() * 9000)}`,
            name: `${brand} ${name} ${year}`,
            category,
            limitPrice,
            status: "pending",
            date: "Baru saja",
            jenisLelang: auctionType,
          });
          localStorage.setItem("provider_assets", JSON.stringify(list));
        } catch (e) {}
      }
    }, 1500);
  };

  return (
    <ProviderLayout pageTitle="Ajukan Titip Jual Aset">
      <p className="page-subtitle">Ajukan barang atau kendaraan baru untuk masuk antrean kurasi lelang</p>

      <div className="grid-2-1">
        <div>
          {isSuccess && (
            <div className="alert-box success mb-4">
              <span className="material-symbols-outlined">check_circle</span>
              <div>
                <strong>Pengajuan Berhasil Diajukan!</strong> Aset Anda telah terdaftar dan menunggu proses verifikasi dokumen &amp; fisik oleh tim kurator kami. Status approval dapat dipantau di halaman Inventori.
              </div>
            </div>
          )}

          <div className="card">
            <div className="card-header">Form Pengisian Detail Aset</div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="panel-form-group">
                  <label className="panel-form-label">Kategori Aset</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="panel-form-select"
                  >
                    <option value="mobil">Mobil</option>
                    <option value="motor">Motor</option>
                    <option value="alat-berat">Alat Berat</option>
                    <option value="properti">Properti</option>
                  </select>
                </div>
                <div className="panel-form-group">
                  <label className="panel-form-label">Tahun Pembuatan</label>
                  <input
                    type="number"
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="panel-form-input"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="panel-form-group">
                  <label className="panel-form-label">Merk / Brand</label>
                  <input
                    type="text"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="Contoh: Toyota, Honda, Komatsu"
                    className="panel-form-input"
                    required
                  />
                </div>
                <div className="panel-form-group">
                  <label className="panel-form-label">Model / Tipe Aset</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Avanza G 1.3 MT"
                    className="panel-form-input"
                    required
                  />
                </div>
              </div>

              <div className="panel-form-group">
                <label className="panel-form-label">Harga Dasar Limit (Min. Penawaran)</label>
                <input
                  type="number"
                  value={limitPrice}
                  onChange={(e) => setLimitPrice(Number(e.target.value))}
                  className="panel-form-input"
                  required
                />
              </div>

              <div className="panel-form-group">
                <label className="panel-form-label">Jenis Lelang</label>
                <select
                  value={auctionType}
                  onChange={(e) => setAuctionType(e.target.value)}
                  className="panel-form-select"
                >
                  {enabledTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div className="panel-form-group">
                <label className="panel-form-label">Deskripsi &amp; Kondisi Fisik Singkat</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Keterangan kondisi mesin, body, kelengkapan surat STNK/BPKB, dll."
                  className="panel-form-textarea"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-secondary hover:bg-secondary/95 text-white font-bold rounded-xl transition-all shadow-md shadow-secondary/20 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Mengirim Pengajuan...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined">publish</span>
                    Ajukan Titip Jual
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Info panel */}
        <div>
          <div className="card">
            <div className="card-header">Panduan &amp; Syarat Dokumen</div>
            <div className="text-xs text-slate-600 space-y-3 leading-relaxed">
              <p>
                Untuk mempercepat persetujuan lelang, pastikan Anda melengkapi dokumen berikut saat tim surveyor mengunjungi lokasi penyimpanan unit Anda:
              </p>
              <ul className="list-disc pl-4 space-y-1.5 font-medium text-slate-800">
                <li>BPKB Asli &amp; Fotokopi</li>
                <li>STNK Asli (Pajak Hidup / Mati)</li>
                <li>Faktur Pembelian &amp; Kwitansi Kosong</li>
                <li>KTP Pemilik Sesuai BPKB / Surat Kuasa</li>
              </ul>
              <p>
                Unit yang lolos inspeksi fisik minimal grade **C** akan langsung didaftarkan ke jadwal lelang terdekat dalam waktu 24 jam.
              </p>
            </div>
          </div>
        </div>
      </div>
    </ProviderLayout>
  );
}
