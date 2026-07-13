"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import BidderBottomNav from "@/components/layout/BidderBottomNav";
import { apiUrl, getImageUrl, getAssetImages } from "@/lib/api";
import { useToast } from "@/providers/ToastProvider";
import { useBidderSession } from "@/hooks/useBidderSession";

import { useFeaturedLots } from "@/hooks/usePublicData";

export default function DetailLotPage() {
  const router = useRouter();
  const toast = useToast();
  const { id } = useParams() as { id: string };
  const { data: dbFeaturedLots = [] } = useFeaturedLots();
  const { isBidderLoggedIn } = useBidderSession();

  const [lot, setLot] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedThumb, setSelectedThumb] = useState(0);
  const [bidAmount, setBidAmount] = useState<number>(0);
  const [zoomOpen, setZoomOpen] = useState(false);

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

  useEffect(() => {
    if (!zoomOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setZoomOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [zoomOpen]);

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
      <div className="min-h-screen bg-surface flex flex-col pb-20 lg:pb-0">
        <Header />
        <main className="flex-1 flex items-center justify-center py-20">
          <div className="text-center">
            <span className="material-symbols-outlined text-4xl text-primary animate-spin">sync</span>
            <p className="text-body-md text-on-surface-variant mt-3 font-semibold">Memuat detail lot...</p>
          </div>
        </main>
        <Footer />
        <BidderBottomNav />
      </div>
    );
  }

  if (error || !lot) {
    return (
      <div className="min-h-screen bg-surface flex flex-col pb-20 lg:pb-0">
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
        <BidderBottomNav />
      </div>
    );
  }

  const rawImages = getAssetImages(lot.asset);
  const images = rawImages.length > 0
    ? rawImages.map((img: string) => getImageUrl(img))
    : [getImageUrl(undefined)];

  const specs = [
    { label: "Cabang Lelang", value: lot.session?.branch?.name || "Pusat" },
    { label: "Kategori", value: lot.asset.category || "-" },
    { label: "Merk / Tipe", value: lot.asset.title || "-" },
    { label: "Tahun", value: lot.asset.year ? String(lot.asset.year) : "-" },
    { label: "Nomor Polisi", value: lot.asset.police_number || "-" },
    { label: "Warna", value: lot.asset.color || "-" },
    { label: "Transmisi", value: lot.asset.transmission || "-" },
    { label: "Bahan Bakar", value: lot.asset.fuel_type || "-" },
    { label: "Odometer", value: lot.asset.odometer ? `${lot.asset.odometer.toLocaleString("id-ID")} km` : "-" },
    { label: "Kapasitas Mesin", value: lot.asset.cylinder ? `${lot.asset.cylinder} cc` : "-" },
    { label: "Nomor Rangka", value: lot.asset.frame_number || "-" },
    { label: "Status BPKB", value: lot.asset.bpkb_status || "-" },
    { label: "Status STNK", value: lot.asset.stnk_status || "-" },
    { label: "Grade Mesin", value: lot.asset.grade_engine || "-" },
    { label: "Grade Interior", value: lot.asset.grade_interior || "-" },
    { label: "Grade Eksterior", value: lot.asset.grade_exterior || "-" },
    { label: "Deskripsi", value: lot.asset.description || "-" }
  ];
  let isLive = lot.status === "active";
  if (lot.session) {
    const now = new Date();
    const start = new Date(lot.session.scheduled_at);
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
    if (now >= start && now <= end) isLive = true;
    else isLive = false;
  }

  const grade = lot.asset.grade_engine || lot.asset.grade_interior || (lot.asset.condition === "BARU" ? "A" : "B");

  const similarLots = dbFeaturedLots
    .filter((l: any) => l.id !== lot.id && l.asset?.category === lot.asset?.category)
    .slice(0, 3)
    .map((l: any) => {
      const img = getImageUrl(getAssetImages(l.asset)[0]);
      
      const sp = [];
      if (l.asset.year) sp.push(l.asset.year);
      if (l.asset.transmission) sp.push(l.asset.transmission);
      if (l.asset.police_number) sp.push(l.asset.police_number);
      
      return {
        id: l.id,
        image: img,
        alt: l.asset.title,
        location: l.session?.branch?.city || "Jakarta",
        title: l.asset.title,
        hargaAwal: `Rp ${Number(l.starting_price).toLocaleString("id-ID")}`,
        deposit: "Rp 5.000.000",
        action: l.status === "active" ? "Bid" : "Lihat Detail",
        badge: l.status === "active" ? "LIVE" : "OPEN",
        specString: sp.join(" | ") || "Spesifikasi tidak tersedia",
        jenisLelang: "English Auction",
        grade: l.asset.grade_engine || (l.asset.condition === "BARU" ? "A" : "B")
      };
    });

  return (
    <div className="min-h-screen bg-surface">
      {/* ====== STICKY MOBILE CTA (logged-out visitors only — bidders get BidderBottomNav instead) ====== */}
      {!isBidderLoggedIn && (
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
      )}
      <BidderBottomNav />

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
              <button
                type="button"
                onClick={() => setZoomOpen(true)}
                className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden bg-surface-variant/20 cursor-zoom-in group block"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={images[selectedThumb]}
                  alt={`${lot.asset.title} Detail`}
                  className="w-full h-full object-cover transition-all duration-300"
                />
                <span className="absolute bottom-4 right-4 w-9 h-9 rounded-full bg-black/50 group-hover:bg-black/70 backdrop-blur-md text-white flex items-center justify-center transition-colors">
                  <span className="material-symbols-outlined text-lg">zoom_in</span>
                </span>
                <div className="absolute top-4 left-4 flex gap-2">
                  {/* Grade Badge */}
                  <span className="w-8 h-8 rounded-full bg-white/95 backdrop-blur-md text-primary flex items-center justify-center font-black shadow-sm border border-white">
                    {grade}
                  </span>
                  {/* Status Badge */}
                  <span className={`px-3 py-1 rounded-full text-badge-text font-bold uppercase tracking-wider shadow-sm flex items-center gap-1.5 ${
                    isLive ? "bg-error text-white" : "bg-info text-white"
                  }`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    {isLive ? "LIVE AUCTION" : (lot.status === "sold" ? "TERJUAL" : "UPCOMING")}
                  </span>
                  {/* Lot Number */}
                  <span className="bg-white/90 backdrop-blur-md text-on-surface px-3 py-1 rounded-full text-badge-text font-bold shadow-sm">
                    LOT #{lot.lot_number}
                  </span>
                </div>
              </button>

              {/* Thumbnail Strip (Only if > 1 image) - single row, click to zoom */}
              {images.length > 1 && (
                <div className="flex gap-3 mt-4 overflow-x-auto pb-1">
                  {images.map((img: string, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setSelectedThumb(idx);
                        setZoomOpen(true);
                      }}
                      className={`relative shrink-0 w-24 aspect-[4/3] rounded-xl overflow-hidden border-2 transition-all bg-surface-variant/10 cursor-zoom-in ${
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
              )}
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
                    </div>
                  </div>
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
            {similarLots.map((similar: any, idx: number) => (
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
                  </div>

                  <div className="mt-5 pt-4 border-t border-outline-variant/20 flex items-center justify-between gap-4">
                    <span className="text-body-sm font-semibold text-error flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm">schedule</span>
                      {similar.timer}
                    </span>
                    <button
                      onClick={() => toast.info("Gunakan katalog utama untuk melihat lot real.")}
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

      {/* Photo Zoom Lightbox */}
      {zoomOpen && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 md:p-10"
          onClick={() => setZoomOpen(false)}
        >
          <button
            type="button"
            onClick={() => setZoomOpen(false)}
            className="absolute top-4 right-4 md:top-6 md:right-6 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            aria-label="Tutup"
          >
            <span className="material-symbols-outlined">close</span>
          </button>

          {images.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedThumb((prev) => (prev - 1 + images.length) % images.length);
              }}
              className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
              aria-label="Foto sebelumnya"
            >
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
          )}

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={images[selectedThumb]}
            alt={`${lot.asset.title} - Foto ${selectedThumb + 1}`}
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />

          {images.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedThumb((prev) => (prev + 1) % images.length);
              }}
              className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
              aria-label="Foto berikutnya"
            >
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          )}

          {images.length > 1 && (
            <span className="absolute bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 bg-white/10 text-white text-body-sm font-semibold px-3 py-1 rounded-full">
              {selectedThumb + 1} / {images.length}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
