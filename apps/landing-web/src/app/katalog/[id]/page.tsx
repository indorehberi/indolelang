"use client";

import Link from "next/link";
import { useState } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export default function DetailLotPage() {
  const [selectedThumb, setSelectedThumb] = useState(0);
  const [bidAmount, setBidAmount] = useState(145000000);
  const [wishlisted, setWishlisted] = useState(false);

  const images = [
    "https://lh3.googleusercontent.com/aida-public/AB6AXuBcS6tHKZpYYGzVd6NalL2sAwQ1i-oYWHGMg49cGf4YAschTELEp7pAOrezDdK7olQ3ndB21B1myenWUoLPNrW75NL_EfzKrRBazlhfxoTA0PSVXEjPFdDGaDNqxHZH3tptfatQgF6mTOgwwPZIcqeUSg_bnrWYV8RJ-Slr6Z2ltr1p5HPZjgZq16T_SVGJiQS2g7kuBo3hMXsW6tXG2JrTCu7N6moS_dGbowWE0j21z4vHv3DsDFv7XME5r0MDFozTzH0n9ug2sHhp",
    "https://lh3.googleusercontent.com/aida-public/AB6AXuAGJyrSIiC5CrjQ9ie6mdjiTukPacM8oYuRPhzR3WM3ldKjSIPxknbMVrUcq4MZtcHRxMwYosqUSfDCT1upZc-E-WE5mYQQ9MLyH4yPLAjXLhJEawqhzcn9LV7tYkI8mZxjLzxkAg5RfzTEU5JJIsVEV9pE--k0LXtch0ZYYRBbsHN0rxel0IldTrktEIwbs_M4NpsGoUUL1gkx5fTfp80e6PSQ0Oe5YOs0KNjAKBOUR9IqXHGgADXQKHRG_n9XaNBxQIOfBJTw_fGD",
    "https://lh3.googleusercontent.com/aida-public/AB6AXuDx_9SWM1Z1hW6_R8j18nKSwK80H9f7yZ5_mE1R5P0L-KjX6l_eF1qYgG4N4a5m_2kLp-h1zQ5yvM8_1rFj6xO0V1N_4zTfL8v9M_2jV4v8R-FmZ-v5L8k7z-Fm9jV8mZ-Tf0v7K-L2z",
    "https://lh3.googleusercontent.com/aida-public/AB6AXuAYN8O2A-8z9old1jiYKN3bl_YAgSjeeNrRfz65SyUOBZcClgtIAicB1Ef3G5ynkpckI4VeZbQ4euupLkJTi_0aOr3T_rmdoTSKwmPZoazXlnAh4I0nTlRtAvoiZJtrsvf3dRTzqXsNGpE2FX3rMHjM1YTvVRXkAVR62eV5Nm7ejEPopOiLePfyyDieJ7ak_hWwkhHnCRN1D3ouQ7Mg0Jnpq282YGoAgtZRiSIT8I4oud5JRGOokCF5DfXUp0Njgamd-sK7LQt10xZl"
  ];

  const specs = [
    { label: "Merk / Model", value: "Toyota Avanza 1.3 G MT" },
    { label: "Tahun Pembuatan", value: "2022" },
    { label: "Nomor Polisi", value: "B 2098 SJA (Jakarta)" },
    { label: "Transmisi / Bahan Bakar", value: "Manual / Bensin" },
    { label: "Odometer (KM)", value: "45,310 km" },
    { label: "Kondisi (Appraisal Grade)", value: "Grade B (Mesin Prima, Bodi Mulus)" },
    { label: "Status Surat-Surat", value: "BPKB & STNK Ready (Pajak Hidup s/d Des 2026)" },
  ];

  const similarLots = [
    {
      id: 2,
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAGJyrSIiC5CrjQ9ie6mdjiTukPacM8oYuRPhzR3WM3ldKjSIPxknbMVrUcq4MZtcHRxMwYosqUSfDCT1upZc-E-WE5mYQQ9MLyH4yPLAjXLhJEawqhzcn9LV7tYkI8mZxjLzxkAg5RfzTEU5JJIsVEV9pE--k0LXtch0ZYYRBbsHN0rxel0IldTrktEIwbs_M4NpsGoUUL1gkx5fTfp80e6PSQ0Oe5YOs0KNjAKBOUR9IqXHGgADXQKHRG_n9XaNBxQIOfBJTw_fGD",
      alt: "Honda CR-V",
      badge: "Mobil",
      badgeStyle: "bg-secondary text-on-secondary",
      location: "Bandung",
      title: "Honda CR-V Prestige 2020",
      hargaAwal: "Rp 325 Juta",
      deposit: "Rp 10 Juta",
      timer: "Mulai 15:30 WIB",
    },
    {
      id: 3,
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuB67l1UA3O3JqEltSt7_FoCtmkwazDVgtHh3zFH0--lZmvp7mKfkzCMLmT52NrO1D0X_UNyvrEO8wU1Y-V3crXAMKKfdKFiSVl_txDOE7P24t3idlxaEx0E9_HxZWh47SNE1mPkgtYNlJdtdgO03ZvxtVvXYjXo-jY0fmtkYKj8BSSvnVN8A8KXhatbMHKO-IuzBXbcU4N1SWJ4RyM7JwNDUmEU1-yOJtqHBm_Sv7ls52p9W4HgMu8VUCWtu9B4v7sSaGecisbNcYxW",
      alt: "Toyota Hilux",
      badge: "Mobil",
      badgeStyle: "bg-primary text-on-primary",
      location: "Surabaya",
      title: "Toyota Hilux Double Cabin 2019",
      hargaAwal: "Rp 278 Juta",
      deposit: "Rp 10 Juta",
      timer: "Besok, 10:00 WIB",
    },
    {
      id: 4,
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAYN8O2A-8z9old1jiYKN3bl_YAgSjeeNrRfz65SyUOBZcClgtIAicB1Ef3G5ynkpckI4VeZbQ4euupLkJTi_0aOr3T_rmdoTSKwmPZoazXlnAh4I0nTlRtAvoiZJtrsvf3dRTzqXsNGpE2FX3rMHjM1YTvVRXkAVR62eV5Nm7ejEPopOiLePfyyDieJ7ak_hWwkhHnCRN1D3ouQ7Mg0Jnpq282YGoAgtZRiSIT8I4oud5JRGOokCF5DfXUp0Njgamd-sK7LQt10xZl",
      alt: "Honda Brio",
      badge: "Mobil",
      badgeStyle: "bg-secondary text-on-secondary",
      location: "Semarang",
      title: "Honda Brio RS CVT 2022",
      hargaAwal: "Rp 142 Juta",
      deposit: "Rp 5 Juta",
      timer: "Jumat, 09:30 WIB",
    },
  ];

  const handleQuickBid = (increment: number) => {
    setBidAmount((prev) => prev + increment);
  };

  const formatRupiah = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-surface">
      {/* ====== STICKY MOBILE CTA ====== */}
      <div
        id="stickyCta"
        className="sticky-cta visible fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-outline-variant/20 px-6 py-3 md:hidden shadow-lg"
      >
        <div className="flex items-center gap-3 max-w-container-max mx-auto">
          <button className="flex-1 px-4 py-3 bg-primary text-on-primary rounded-xl font-bold text-sm btn-press transition-all hover:bg-primary/90 text-center shadow-md">
            Daftar Sekarang
          </button>
          <button className="flex-1 px-4 py-3 bg-secondary text-on-secondary rounded-xl font-bold text-sm btn-press transition-all hover:bg-secondary/90 text-center shadow-md">
            Lihat Lelang Aktif
          </button>
        </div>
      </div>

      <Header />

      <main className="max-w-container-max mx-auto px-6 py-6 pb-24">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-body-sm text-on-surface-variant mb-6 overflow-x-auto whitespace-nowrap py-1">
          <Link href="/" className="hover:text-primary transition-colors">
            Beranda
          </Link>
          <span className="text-outline">/</span>
          <Link href="/katalog" className="hover:text-primary transition-colors">
            Katalog Lelang
          </Link>
          <span className="text-outline">/</span>
          <span className="text-on-surface font-semibold">
            Toyota Avanza 1.3 G MT 2022
          </span>
        </div>

        {/* Two Column Detail Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Media & Specs */}
          <div className="lg:col-span-7 space-y-6">
            {/* Gallery Wrapper */}
            <div className="bg-white rounded-3xl p-4 border border-outline-variant/20 shadow-sm">
              <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden bg-surface-variant/20">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={images[selectedThumb]}
                  alt="Toyota Avanza Detail"
                  className="w-full h-full object-cover transition-all duration-300"
                />
                <div className="absolute top-4 left-4 flex gap-2">
                  <span className="bg-error text-white px-3 py-1 rounded-full text-badge-text font-bold uppercase tracking-wider shadow-sm flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    LIVE AUCTION
                  </span>
                  <span className="bg-white/90 backdrop-blur-md text-on-surface px-3 py-1 rounded-full text-badge-text font-bold shadow-sm">
                    LOT #1045
                  </span>
                </div>
              </div>

              {/* Thumbnails Grid */}
              <div className="grid grid-cols-4 gap-3 mt-4">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedThumb(idx)}
                    className={`relative aspect-[4/3] rounded-xl overflow-hidden border-2 transition-all bg-surface-variant/10 ${
                      selectedThumb === idx
                        ? "border-primary shadow-md scale-102"
                        : "border-transparent opacity-80 hover:opacity-100"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* Specifications Card */}
            <div className="bg-white rounded-3xl p-6 border border-outline-variant/20 shadow-sm">
              <h2 className="text-heading-md font-bold text-on-surface mb-5 flex items-center gap-2.5">
                <span className="material-symbols-outlined text-primary">description</span>
                Spesifikasi Lengkap Aset
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <tbody>
                    {specs.map((spec, idx) => (
                      <tr
                        key={idx}
                        className="border-b border-outline-variant/15 last:border-0 hover:bg-surface/30 transition-colors"
                      >
                        <td className="py-4 pr-4 font-semibold text-body-md text-on-surface-variant w-[35%]">
                          {spec.label}
                        </td>
                        <td className="py-4 text-body-md text-on-surface font-medium">
                          {spec.value}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Warehouse / Gudang Location */}
            <div className="bg-white rounded-3xl p-6 border border-outline-variant/20 shadow-sm">
              <h2 className="text-heading-md font-bold text-on-surface mb-4 flex items-center gap-2.5">
                <span className="material-symbols-outlined text-primary">location_on</span>
                Lokasi Gudang Penampungan
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-bold text-body-lg text-on-surface">Gudang Utama JKT Selatan</h3>
                  <p className="text-body-md text-on-surface-variant leading-relaxed mt-1">
                    Jl. Gatot Subroto No. 45, Jakarta Selatan. Terbuka untuk Open House / Cek Fisik pada 10-11 Juni 2026, pukul 09:00 - 16:00 WIB.
                  </p>
                </div>
                <div className="aspect-[21/9] w-full rounded-2xl overflow-hidden bg-surface-variant/20 border border-outline-variant/10 relative flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDx_9SWM1Z1hW6_R8j18nKSwK80H9f7yZ5_mE1R5P0L-KjX6l_eF1qYgG4N4a5m_2kLp-h1zQ5yvM8_1rFj6xO0V1N_4zTfL8v9M_2jV4v8R-FmZ-v5L8k7z-Fm9jV8mZ-Tf0v7K-L2z"
                    className="absolute inset-0 w-full h-full object-cover filter brightness-75 grayscale"
                    alt="Map mockup"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-4">
                    <span className="text-white text-body-sm font-bold flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm">map</span>
                      Lihat di Google Maps
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Sticky Bid Panel & Quick Info */}
          <div className="lg:col-span-5 space-y-6">
            {/* Sticky Container */}
            <div className="sticky top-[84px] space-y-6">
              {/* Bid Panel Card */}
              <div className="bid-panel rounded-3xl p-6 border border-outline-variant/20 shadow-md">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <span className="bg-error/10 text-error px-3 py-1 rounded-full text-badge-text font-bold uppercase tracking-wider">
                    Lelang Sedang Berlangsung
                  </span>
                  <span className="bg-success text-on-success px-3 py-1 rounded-full text-badge-text font-bold">
                    Grade B
                  </span>
                </div>

                <h1 className="text-heading-lg font-bold text-on-surface leading-tight">
                  Toyota Avanza 1.3 G MT 2022
                </h1>
                <p className="text-body-sm text-on-surface-variant mt-1.5">
                  Lot #1045 • Sesi Mobil Penumpang JKT
                </p>

                <div className="my-5 border-t border-outline-variant/20" />

                <div className="space-y-4">
                  {/* Pricing Info */}
                  <div>
                    <span className="text-body-sm font-semibold text-on-surface-variant uppercase tracking-wider block">
                      Harga Awal Pembukaan:
                    </span>
                    <span className="text-heading-xl font-black text-primary block mt-1">
                      {formatRupiah(bidAmount)}
                    </span>
                    <span className="text-body-sm text-on-surface-variant block mt-1.5">
                      Uang Jaminan (Deposit/NIPL): <strong className="text-on-surface">Rp 5.000.000</strong> per Lot
                    </span>
                  </div>

                  {/* Timer Alert Info */}
                  <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex items-start gap-3">
                    <span className="material-symbols-outlined text-primary mt-0.5">schedule</span>
                    <div>
                      <span className="text-body-sm font-bold text-primary block">
                        Jadwal Sesi Live Online:
                      </span>
                      <span className="text-body-md text-on-surface-variant block mt-0.5">
                        12 Juni 2026, 10:00 WIB (Sesi Live Online)
                      </span>
                    </div>
                  </div>

                  {/* Bid Interaction */}
                  <div className="space-y-3.5">
                    <div>
                      <label className="text-body-sm font-bold text-on-surface block mb-2">
                        Masukkan Nominal Bid Anda:
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="text-heading-md font-bold text-on-surface-variant ml-2">Rp</span>
                        <input
                          type="text"
                          value={bidAmount.toLocaleString("id-ID")}
                          onChange={(e) => {
                            const val = parseInt(e.target.value.replace(/\D/g, "")) || 0;
                            setBidAmount(val);
                          }}
                          className="flex-1 px-4 py-3 bg-white border border-outline-variant rounded-xl text-body-lg font-bold text-on-surface focus:border-primary focus:outline-none transition-all shadow-inner"
                        />
                      </div>
                    </div>

                    {/* Quick Bid Increments */}
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => handleQuickBid(1000000)}
                        className="py-2.5 px-3 bg-white border border-outline-variant/30 hover:border-primary hover:text-primary rounded-xl text-body-sm font-bold btn-press transition-all text-center shadow-sm"
                      >
                        +1 Juta
                      </button>
                      <button
                        onClick={() => handleQuickBid(2000000)}
                        className="py-2.5 px-3 bg-white border border-outline-variant/30 hover:border-primary hover:text-primary rounded-xl text-body-sm font-bold btn-press transition-all text-center shadow-sm"
                      >
                        +2 Juta
                      </button>
                      <button
                        onClick={() => handleQuickBid(5000000)}
                        className="py-2.5 px-3 bg-white border border-outline-variant/30 hover:border-primary hover:text-primary rounded-xl text-body-sm font-bold btn-press transition-all text-center shadow-sm"
                      >
                        +5 Juta
                      </button>
                    </div>

                    {/* Action buttons */}
                    <div className="space-y-2.5 pt-2">
                      <button className="w-full py-4 bg-primary text-on-primary rounded-2xl text-body-md font-bold hover:bg-primary/90 transition-all btn-press shadow-md flex items-center justify-center gap-2">
                        <span className="material-symbols-outlined font-bold">gavel</span>
                        Ajukan Bid Sekarang
                      </button>

                      <button
                        onClick={() => setWishlisted(!wishlisted)}
                        className={`w-full py-3.5 border rounded-2xl text-body-md font-bold transition-all btn-press flex items-center justify-center gap-2 shadow-sm ${
                          wishlisted
                            ? "bg-primary/10 border-primary text-primary"
                            : "bg-white border-outline-variant hover:bg-surface/40 text-on-surface"
                        }`}
                      >
                        <span className={`material-symbols-outlined ${wishlisted ? "filled text-primary" : ""}`}>
                          star
                        </span>
                        {wishlisted ? "Tersimpan di Watchlist" : "Tambah ke Watchlist"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Download Documents Card */}
              <div className="bg-white rounded-3xl p-6 border border-outline-variant/20 shadow-sm space-y-4">
                <h3 className="font-bold text-body-lg text-on-surface flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-primary">download</span>
                  Dokumen Lot &amp; Unduhan
                </h3>
                <div className="grid grid-cols-1 gap-2.5">
                  <a
                    href="#"
                    className="flex items-center justify-between p-3.5 rounded-xl border border-outline-variant/25 hover:border-primary hover:bg-primary/5 transition-all group"
                  >
                    <span className="flex items-center gap-2.5 text-body-md font-semibold text-on-surface">
                      <span className="material-symbols-outlined text-primary">picture_as_pdf</span>
                      Laporan Hasil Inspeksi.pdf
                    </span>
                    <span className="material-symbols-outlined text-outline group-hover:text-primary transition-colors">
                      download
                    </span>
                  </a>
                  <a
                    href="#"
                    className="flex items-center justify-between p-3.5 rounded-xl border border-outline-variant/25 hover:border-primary hover:bg-primary/5 transition-all group"
                  >
                    <span className="flex items-center gap-2.5 text-body-md font-semibold text-on-surface">
                      <span className="material-symbols-outlined text-primary">picture_as_pdf</span>
                      Syarat Ketentuan Khusus.pdf
                    </span>
                    <span className="material-symbols-outlined text-outline group-hover:text-primary transition-colors">
                      download
                    </span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Similar Lots Grid */}
        <div className="mt-16">
          <h2 className="text-heading-lg font-bold text-on-surface mb-6 flex items-center gap-2.5">
            <span className="material-symbols-outlined text-primary">grid_view</span>
            Rekomendasi Lot Serupa
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {similarLots.map((lot, idx) => (
              <div
                key={idx}
                className="bg-white rounded-3xl border border-outline-variant/20 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col group"
              >
                {/* Image */}
                <div className="relative aspect-[16/10] bg-surface-variant/20 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={lot.image}
                    alt={lot.alt}
                    className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="bg-white/95 backdrop-blur-sm text-on-surface text-badge-text font-bold px-2.5 py-0.5 rounded-full shadow-sm">
                      {lot.location}
                    </span>
                  </div>
                </div>

                {/* Body */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-body-lg text-on-surface line-clamp-1 group-hover:text-primary transition-colors">
                      {lot.title}
                    </h3>
                    <div className="flex justify-between items-center mt-3 text-body-sm text-on-surface-variant">
                      <span>Harga Awal</span>
                      <span className="font-extrabold text-body-md text-on-surface">
                        {lot.hargaAwal}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-1.5 text-body-sm text-on-surface-variant">
                      <span>Uang Jaminan</span>
                      <span className="font-semibold text-on-surface">
                        {lot.deposit}
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-outline-variant/20 flex items-center justify-between gap-4">
                    <span className="text-body-sm font-semibold text-error flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm">schedule</span>
                      {lot.timer}
                    </span>
                    <Link
                      href={`/katalog/${lot.id}`}
                      className="px-4 py-2 bg-primary/10 text-primary font-bold text-body-sm rounded-xl hover:bg-primary hover:text-on-primary transition-all btn-press"
                    >
                      Detail Lot
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
