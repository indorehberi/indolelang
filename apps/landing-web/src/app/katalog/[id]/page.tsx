"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { apiUrl } from "@/lib/api";

export default function DetailLotPage() {
  const router = useRouter();
  const { id } = useParams() as { id: string };

  const [lot, setLot] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedThumb, setSelectedThumb] = useState(0);
  const [bidAmount, setBidAmount] = useState(0);
  const [wishlisted, setWishlisted] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchLotDetail = async () => {
      try {
        setLoading(true);
        const res = await fetch(apiUrl(`/lots/${id}`));
        if (!res.ok) {
          throw new Error("Gagal memuat detail lot dari API");
        }
        const result = await res.json();
        if (result.success && result.data) {
          const lotData = result.data;
          setLot(lotData);
          setBidAmount(lotData.hammer_price || lotData.starting_price);
          
          // Check watchlist status from localStorage
          const stored = localStorage.getItem("watchlist");
          if (stored) {
            try {
              const list: string[] = JSON.parse(stored);
              setWishlisted(list.includes(lotData.id));
            } catch (e) {
              // ignore
            }
          }
        } else {
          setError(result.error?.message || "Lot tidak ditemukan");
        }
      } catch (err: any) {
        setError(err.message || "Terjadi kesalahan saat memuat data.");
      } finally {
        setLoading(false);
      }
    };

    fetchLotDetail();
  }, [id]);

  const toggleWishlist = () => {
    if (!lot) return;
    if (typeof window === "undefined") return;

    try {
      const stored = localStorage.getItem("watchlist");
      let list: string[] = stored ? JSON.parse(stored) : [];
      if (!Array.isArray(list)) list = [];

      let nextWishlisted = false;
      if (list.includes(lot.id)) {
        list = list.filter((x) => x !== lot.id);
        nextWishlisted = false;
      } else {
        list.push(lot.id);
        nextWishlisted = true;
      }

      localStorage.setItem("watchlist", JSON.stringify(list));
      setWishlisted(nextWishlisted);
      window.dispatchEvent(new Event("watchlist-updated"));
    } catch (e) {
      console.error("Failed to update watchlist", e);
    }
  };

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

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center py-20">
          <div className="text-center">
            <span className="material-symbols-outlined text-4xl text-primary animate-spin">sync</span>
            <p className="text-body-md text-on-surface-variant mt-3 font-semibold">Memuat detail lot...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !lot) {
    return (
      <div className="min-h-screen bg-surface flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center py-20">
          <div className="text-center max-w-md px-6">
            <span className="material-symbols-outlined text-5xl text-error">error</span>
            <h2 className="text-heading-md font-bold text-on-surface mt-4">Lot Tidak Ditemukan</h2>
            <p className="text-body-sm text-on-surface-variant mt-2 leading-relaxed">{error || "Detail lot lelang ini tidak dapat ditemukan."}</p>
            <Link href="/katalog" className="btn-press inline-flex items-center gap-2 mt-6 px-5 py-2.5 bg-primary text-on-primary rounded-xl text-body-sm font-bold shadow-md hover:bg-primary/95 transition-all">
              <span className="material-symbols-outlined text-base">arrow_back</span>
              Kembali ke Katalog
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Specs & images dynamic setup
  const images = lot.asset.images && lot.asset.images.length > 0
    ? lot.asset.images
    : ["https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&q=80&w=600"];

  const specs = [
    { label: "Kategori", value: lot.asset.category },
    { label: "Merk / Model", value: lot.asset.title },
    { label: "Tahun Pembuatan", value: lot.asset.year ? String(lot.asset.year) : "-" },
    { label: "Nomor Polisi", value: lot.asset.police_number || "-" },
    { label: "Transmisi", value: lot.asset.transmission || "-" },
    { label: "Bahan Bakar", value: lot.asset.fuel_type || "-" },
    { label: "Odometer", value: lot.asset.odometer ? `${lot.asset.odometer.toLocaleString("id-ID")} km` : "-" },
    { label: "Kondisi", value: lot.asset.grade_exterior ? `Eksterior Grade ${lot.asset.grade_exterior} | Interior Grade ${lot.asset.grade_interior || "-"}` : "Grade B" },
    { label: "Status Dokumen", value: lot.asset.bpkb_number ? `BPKB No. ${lot.asset.bpkb_number} & STNK Ready` : "STNK Ready" },
  ];

  const isLive = lot.status === "active";

  const similarLots = [
    {
      id: "dummy-similar-1",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAGJyrSIiC5CrjQ9ie6mdjiTukPacM8oYuRPhzR3WM3ldKjSIPxknbMVrUcq4MZtcHRxMwYosqUSfDCT1upZc-E-WE5mYQQ9MLyH4yPLAjXLhJEawqhzcn9LV7tYkI8mZxjLzxkAg5RfzTEU5JJIsVEV9pE--k0LXtch0ZYYRBbsHN0rxel0IldTrktEIwbs_M4NpsGoUUL1gkx5fTfp80e6PSQ0Oe5YOs0KNjAKBOUR9IqXHGgADXQKHRG_n9XaNBxQIOfBJTw_fGD",
      alt: "Honda CR-V",
      location: "Bandung",
      title: "Honda CR-V Prestige 2020",
      hargaAwal: "Rp 325 Juta",
      deposit: "Rp 10 Juta",
      timer: "Mulai 15:30 WIB",
    },
    {
      id: "dummy-similar-2",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuB67l1UA3O3JqEltSt7_FoCtmkwazDVgtHh3zFH0--lZmvp7mKfkzCMLmT52NrO1D0X_UNyvrEO8wU1Y-V3crXAMKKfdKFiSVl_txDOE7P24t3idlxaEx0E9_HxZWh47SNE1mPkgtYNlJdtdgO03ZvxtVvXYjXo-jY0fmtkYKj8BSSvnVN8A8KXhatbMHKO-IuzBXbcU4N1SWJ4RyM7JwNDUmEU1-yOJtqHBm_Sv7ls52p9W4HgMu8VUCWtu9B4v7sSaGecisbNcYxW",
      alt: "Toyota Hilux",
      location: "Surabaya",
      title: "Toyota Hilux Double Cabin 2019",
      hargaAwal: "Rp 278 Juta",
      deposit: "Rp 10 Juta",
      timer: "Besok, 10:00 WIB",
    },
    {
      id: "dummy-similar-3",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAYN8O2A-8z9old1jiYKN3bl_YAgSjeeNrRfz65SyUOBZcClgtIAicB1Ef3G5ynkpckI4VeZbQ4euupLkJTi_0aOr3T_rmdoTSKwmPZoazXlnAh4I0nTlRtAvoiZJtrsvf3dRTzqXsNGpE2FX3rMHjM1YTvVRXkAVR62eV5Nm7ejEPopOiLePfyyDieJ7ak_hWwkhHnCRN1D3ouQ7Mg0Jnpq282YGoAgtZRiSIT8I4oud5JRGOokCF5DfXUp0Njgamd-sK7LQt10xZl",
      alt: "Honda Brio",
      location: "Semarang",
      title: "Honda Brio RS CVT 2022",
      hargaAwal: "Rp 142 Juta",
      deposit: "Rp 5 Juta",
      timer: "Jumat, 09:30 WIB",
    },
  ];

  return (
    <div className="min-h-screen bg-surface">
      {/* ====== STICKY MOBILE CTA ====== */}
      <div
        id="stickyCta"
        className="sticky-cta visible fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-outline-variant/20 px-6 py-3 md:hidden shadow-lg"
      >
        <div className="flex items-center gap-3 max-w-container-max mx-auto">
          <button className="flex-1 px-4 py-3 bg-premium text-on-premium rounded-xl font-bold text-sm btn-press btn-shine transition-all hover:bg-premium/85 text-center shadow-md">
            Daftar Sekarang
          </button>
          <button className="flex-1 px-4 py-3 border-2 border-premium/20 text-premium rounded-xl font-bold text-sm btn-press transition-all hover:bg-premium hover:text-on-premium text-center shadow-md">
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
            {lot.asset.title}
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
                  alt={`${lot.asset.title} Detail`}
                  className="w-full h-full object-cover transition-all duration-300"
                />
                <div className="absolute top-4 left-4 flex gap-2">
                  <span className={`px-3 py-1 rounded-full text-badge-text font-bold uppercase tracking-wider shadow-sm flex items-center gap-1.5 ${
                    isLive ? "bg-error text-white" : "bg-info text-white"
                  }`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    {isLive ? "LIVE AUCTION" : "UPCOMING"}
                  </span>
                  <span className="bg-white/90 backdrop-blur-md text-on-surface px-3 py-1 rounded-full text-badge-text font-bold shadow-sm">
                    LOT #{lot.lot_number}
                  </span>
                </div>
              </div>

              {/* Thumbnails Grid */}
              <div className="grid grid-cols-4 gap-3 mt-4">
                {images.map((img: string, idx: number) => (
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
                        <td className="py-2 pr-4 text-body-sm text-on-surface-variant w-[35%]">
                          {spec.label}
                        </td>
                        <td className="py-2 text-body-sm text-on-surface font-medium">
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
                  <h3 className="font-bold text-body-lg text-on-surface">Pool Kantor Pusat Bidku</h3>
                  <p className="text-body-sm text-on-surface-variant leading-relaxed mt-1">
                    Jl. Raden Patah Jl. Lembang II Lama No.62, Ciledug, Kota Tangerang, Banten 15151. Terbuka untuk Open House / Cek Fisik, pukul 09:00 - 16:00 WIB.
                  </p>
                </div>
                <a
                  href="https://maps.app.goo.gl/TTfvM1o9M852AFKfA"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block aspect-[21/9] w-full rounded-2xl overflow-hidden bg-surface-variant/20 border border-outline-variant/10 relative group hover:border-premium transition-all"
                >
                  <iframe
                    src="https://maps.google.com/maps?q=Jl.+Raden+Patah+Jl.+Lembang+II+Lama+No.62,+Ciledug,+Kota+Tangerang,+Banten+15151&t=&z=15&ie=UTF8&iwloc=&output=embed"
                    className="absolute inset-0 w-full h-full border-none pointer-events-none"
                    allowFullScreen
                    loading="lazy"
                    title="Google Map Gudang Penampungan"
                  ></iframe>
                  <div className="absolute inset-0 bg-black/5 group-hover:bg-black/15 transition-colors flex items-end p-4">
                    <span className="bg-premium text-on-premium px-3 py-1.5 rounded-xl text-body-sm font-bold shadow-md flex items-center gap-1.5 transform scale-100 group-hover:scale-105 transition-transform duration-300">
                      <span className="material-symbols-outlined text-sm">open_in_new</span>
                      Lihat di Google Maps
                    </span>
                  </div>
                </a>
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
                  <span className={`px-3 py-1 rounded-full text-badge-text font-bold uppercase tracking-wider ${
                    isLive ? "bg-error/10 text-error" : "bg-info/10 text-info"
                  }`}>
                    {isLive ? "Lelang Berlangsung" : "Lelang Akan Datang"}
                  </span>
                  <span className="bg-success text-on-success px-3 py-1 rounded-full text-badge-text font-bold font-sans">
                    {lot.asset.grade_exterior ? `Grade ${lot.asset.grade_exterior}` : "Grade B"}
                  </span>
                </div>

                <h1 className="text-heading-lg font-bold text-on-surface leading-tight font-serif">
                  {lot.asset.title}
                </h1>
                <p className="text-body-sm text-on-surface-variant mt-1.5">
                  Lot #{lot.lot_number} &bull; Sesi {lot.session?.title || "Umum"}
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
                  <div className="bg-premium/5 border border-premium/20 rounded-2xl p-4 flex items-start gap-3">
                    <span className="material-symbols-outlined text-premium mt-0.5">schedule</span>
                    <div>
                      <span className="text-body-sm font-bold text-premium block">
                        Jadwal Sesi Live Online:
                      </span>
                      <span className="text-body-md text-on-surface-variant block mt-0.5">
                        {lot.session?.scheduled_at ? new Date(lot.session.scheduled_at).toLocaleString("id-ID", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "-"} WIB
                      </span>
                    </div>
                  </div>

                  {/* Bid Interaction */}
                  <div className="space-y-3.5">
                    {/* Action buttons */}
                    <div className="space-y-2.5 pt-2">
                      <button
                        onClick={() => router.push(`/bidder/bidding-room?lotId=${lot.id}`)}
                        className="w-full py-4 bg-premium text-on-premium rounded-2xl text-body-md font-bold hover:bg-premium/85 transition-all btn-press btn-shine shadow-md flex items-center justify-center gap-2"
                      >
                        <span className="material-symbols-outlined font-bold">gavel</span>
                        Ikut Bid Sekarang
                      </button>

                      <button
                        onClick={toggleWishlist}
                        className={`w-full py-3.5 border rounded-2xl text-body-md font-bold transition-all btn-press flex items-center justify-center gap-2 shadow-sm ${
                          wishlisted
                            ? "bg-premium/10 border-premium text-premium"
                            : "bg-white border-outline-variant hover:bg-surface/40 text-on-surface"
                        }`}
                      >
                        <span className={`material-symbols-outlined ${wishlisted ? "filled text-premium" : ""}`}>
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
                  <span className="material-symbols-outlined text-premium">download</span>
                  Dokumen Lot &amp; Unduhan
                </h3>
                <div className="grid grid-cols-1 gap-2.5">
                  <a
                    href="#"
                    className="flex items-center justify-between p-3.5 rounded-xl border border-outline-variant/25 hover:border-premium hover:bg-premium/5 transition-all group"
                  >
                    <span className="flex items-center gap-2.5 text-body-md text-on-surface">
                      <span className="material-symbols-outlined text-premium">picture_as_pdf</span>
                      Laporan Hasil Inspeksi.pdf
                    </span>
                    <span className="material-symbols-outlined text-outline group-hover:text-premium transition-colors">
                      download
                    </span>
                  </a>
                  <a
                    href="#"
                    className="flex items-center justify-between p-3.5 rounded-xl border border-outline-variant/25 hover:border-premium hover:bg-premium/5 transition-all group"
                  >
                    <span className="flex items-center gap-2.5 text-body-md text-on-surface">
                      <span className="material-symbols-outlined text-premium">picture_as_pdf</span>
                      Syarat Ketentuan Khusus.pdf
                    </span>
                    <span className="material-symbols-outlined text-outline group-hover:text-premium transition-colors">
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
          <h2 className="text-heading-lg font-bold text-on-surface mb-6 flex items-center gap-2.5 font-serif">
            <span className="material-symbols-outlined text-premium">grid_view</span>
            Rekomendasi Lot Serupa
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {similarLots.map((similar, idx) => (
              <div
                key={idx}
                className="bg-white rounded-3xl border border-outline-variant/20 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col group"
              >
                {/* Image */}
                <div className="relative aspect-[16/10] bg-surface-variant/20 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={similar.image}
                    alt={similar.alt}
                    className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="bg-white/95 backdrop-blur-sm text-on-surface text-badge-text font-bold px-2.5 py-0.5 rounded-full shadow-sm">
                      {similar.location}
                    </span>
                  </div>
                </div>

                {/* Body */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-body-lg text-on-surface line-clamp-1 group-hover:text-premium transition-colors">
                      {similar.title}
                    </h3>
                    <div className="flex justify-between items-center mt-3 text-body-sm text-on-surface-variant">
                      <span>Harga Awal</span>
                      <span className="font-extrabold text-body-md text-on-surface">
                        {similar.hargaAwal}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-1.5 text-body-sm text-on-surface-variant">
                      <span>Uang Jaminan</span>
                      <span className="font-semibold text-on-surface">
                        {similar.deposit}
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-outline-variant/20 flex items-center justify-between gap-4">
                    <span className="text-body-sm font-semibold text-error flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm">schedule</span>
                      {similar.timer}
                    </span>
                    <button
                      onClick={() => alert("Gunakan katalog utama untuk melihat lot real.")}
                      className="px-4 py-2 bg-premium/10 text-premium font-bold text-body-sm rounded-xl hover:bg-premium hover:text-on-premium transition-all btn-press"
                    >
                      Detail Lot
                    </button>
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
