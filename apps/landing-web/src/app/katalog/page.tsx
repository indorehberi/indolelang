"use client";

import Link from "next/link";
import { useState } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

/* -------------------------------------------------------------------------- */
/* Data                                                                         */
/* -------------------------------------------------------------------------- */

const lots = [
  {
    id: 1,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBcS6tHKZpYYGzVd6NalL2sAwQ1i-oYWHGMg49cGf4YAschTELEp7pAOrezDdK7olQ3ndB21B1myenWUoLPNrW75NL_EfzKrRBazlhfxoTA0PSVXEjPFdDGaDNqxHZH3tptfatQgF6mTOgwwPZIcqeUSg_bnrWYV8RJ-Slr6Z2ltr1p5HPZjgZq16T_SVGJiQS2g7kuBo3hMXsW6tXG2JrTCu7N6moS_dGbowWE0j21z4vHv3DsDFv7XME5r0MDFozTzH0n9ug2sHhp",
    alt: "Toyota Avanza",
    badge: "LIVE",
    badgeStyle: "countdown-badge bg-error text-white",
    location: "Jakarta Timur",
    title: "Toyota Avanza 1.5 G 2021",
    hargaAwal: "Rp 155 Juta",
    deposit: "Rp 5 Juta",
    timer: "Berakhir 02:14:32",
    action: "Bid",
    category: "Mobil",
  },
  {
    id: 2,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAGJyrSIiC5CrjQ9ie6mdjiTukPacM8oYuRPhzR3WM3ldKjSIPxknbMVrUcq4MZtcHRxMwYosqUSfDCT1upZc-E-WE5mYQQ9MLyH4yPLAjXLhJEawqhzcn9LV7tYkI8mZxjLzxkAg5RfzTEU5JJIsVEV9pE--k0LXtch0ZYYRBbsHN0rxel0IldTrktEIwbs_M4NpsGoUUL1gkx5fTfp80e6PSQ0Oe5YOs0KNjAKBOUR9IqXHGgADXQKHRG_n9XaNBxQIOfBJTw_fGD",
    alt: "Honda CR-V",
    badge: "OPEN",
    badgeStyle: "bg-secondary text-on-secondary",
    location: "Bandung",
    title: "Honda CR-V Prestige 2020",
    hargaAwal: "Rp 325 Juta",
    deposit: "Rp 10 Juta",
    timer: "Mulai 15:30 WIB",
    action: "Detail",
    category: "Mobil",
  },
  {
    id: 3,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuB67l1UA3O3JqEltSt7_FoCtmkwazDVgtHh3zFH0--lZmvp7mKfkzCMLmT52NrO1D0X_UNyvrEO8wU1Y-V3crXAMKKfdKFiSVl_txDOE7P24t3idlxaEx0E9_HxZWh47SNE1mPkgtYNlJdtdgO03ZvxtVvXYjXo-jY0fmtkYKj8BSSvnVN8A8KXhatbMHKO-IuzBXbcU4N1SWJ4RyM7JwNDUmEU1-yOJtqHBm_Sv7ls52p9W4HgMu8VUCWtu9B4v7sSaGecisbNcYxW",
    alt: "Toyota Hilux",
    badge: "INSPEKSI",
    badgeStyle: "bg-primary text-on-primary",
    location: "Surabaya",
    title: "Toyota Hilux Double Cabin 2019",
    hargaAwal: "Rp 278 Juta",
    deposit: "Rp 10 Juta",
    timer: "Besok, 10:00 WIB",
    action: "Detail",
    category: "Mobil",
  },
  {
    id: 4,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAYN8O2A-8z9old1jiYKN3bl_YAgSjeeNrRfz65SyUOBZcClgtIAicB1Ef3G5ynkpckI4VeZbQ4euupLkJTi_0aOr3T_rmdoTSKwmPZoazXlnAh4I0nTlRtAvoiZJtrsvf3dRTzqXsNGpE2FX3rMHjM1YTvVRXkAVR62eV5Nm7ejEPopOiLePfyyDieJ7ak_hWwkhHnCRN1D3ouQ7Mg0Jnpq282YGoAgtZRiSIT8I4oud5JRGOokCF5DfXUp0Njgamd-sK7LQt10xZl",
    alt: "Honda Brio",
    badge: "OPEN",
    badgeStyle: "bg-secondary text-on-secondary",
    location: "Semarang",
    title: "Honda Brio RS CVT 2022",
    hargaAwal: "Rp 142 Juta",
    deposit: "Rp 5 Juta",
    timer: "Jumat, 09:30 WIB",
    action: "Detail",
    category: "Mobil",
  },
  {
    id: 5,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuC31zy45WQwhdCOMrDzZCm2is66KzQ3Ef-59eRlRHkxzGC5DpJj5VKLOvc3lGiQG68JH60S9yYbjI2JAl1ms-Imx6t9eaDfxqxFmaBKRys70HjrcZ5YnCiwuv-yCKaSrD7A28rXssA0Ak7J2_CZ73L4rSL6BEMP3BALcG7uqjaShWLmgCP7TdrYqffviwAtHoJO4H8Nbu1F3fC2iQnLgvWmXu_oGP3B1DIug9vTfVnGi75xhMNL1Ybhm-iHUPaTCbQVBDSpOveGl1u6",
    alt: "Yamaha NMAX",
    badge: "LIVE",
    badgeStyle: "countdown-badge bg-error text-white",
    location: "Yogyakarta",
    title: "Yamaha NMAX Connected 2023",
    hargaAwal: "Rp 24 Juta",
    deposit: "Rp 1 Juta",
    timer: "Berakhir 00:42:18",
    action: "Bid",
    category: "Motor",
  },
  {
    id: 6,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDAKe_8vmxw29JLRtQYJu9kIj9SSxejc7c-x8FZ9yvwAcraOjYJQWtAun90V_9mWhx5Fc0yj7qi226wff8XoO-B8zS94kC8jRdGIB8O9bsH7Nhr0u4sJZGBdX9R6-JALgUiUFbI_NW_vN-QiNbVb_WGRUuassF6O_AjU9RuREtTqPZI9hvaWxO6IxqUzevGmKDWDbe9XRHS-qXcH0eH4c1lTgfR2ZHLmTZvUQbPf2dM8WY2ksd1kXL4JpiipvA98Fs_rPDJFniNHLto",
    alt: "Rumah Cluster",
    badge: "PROPERTI",
    badgeStyle: "bg-primary text-on-primary",
    location: "Bekasi",
    title: "Rumah 2 Lantai Cluster Selatan",
    hargaAwal: "Rp 780 Juta",
    deposit: "Rp 25 Juta",
    timer: "Sabtu, 13:00 WIB",
    action: "Detail",
    category: "Properti",
  },
];

const categories = ["Semua Lot", "Mobil", "Motor", "Properti", "Alat Berat"];

/* -------------------------------------------------------------------------- */
/* Component                                                                    */
/* -------------------------------------------------------------------------- */

export default function KatalogPage() {
  const [activeCategory, setActiveCategory] = useState("Semua Lot");
  const [lokasi, setLokasi] = useState("Semua Lokasi");
  const [status, setStatus] = useState("Semua Status");
  const [urutan, setUrutan] = useState("Urutkan Terbaru");
  const [wishlist, setWishlist] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [showMobileFilter, setShowMobileFilter] = useState(false);

  const toggleWishlist = (id: number) => {
    setWishlist((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const filteredLots =
    activeCategory === "Semua Lot"
      ? lots
      : lots.filter((l) => l.category === activeCategory);

  return (
    <div className="min-h-screen bg-surface">
      {/* ====== STICKY MOBILE CTA ====== */}
      <div
        id="stickyCta"
        className="sticky-cta visible fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-outline-variant/20 px-4 py-3 md:hidden shadow-lg"
      >
        <div className="flex items-center gap-3 max-w-container-max mx-auto">
          <button className="flex-1 px-4 py-2.5 bg-primary text-on-primary rounded-xl font-bold text-sm btn-press transition-all hover:bg-primary/90 text-center">
            Daftar Sekarang
          </button>
          <button className="flex-1 px-4 py-2.5 bg-secondary text-on-secondary rounded-xl font-bold text-sm btn-press transition-all hover:bg-secondary/90 text-center">
            Lihat Lelang Aktif
          </button>
        </div>
      </div>

      <Header />

      <main>
        {/* ====== CATALOG HERO ====== */}
        <section className="hero-gradient relative overflow-hidden pt-10 pb-10 md:pt-14 md:pb-14">
          <div className="max-w-container-max mx-auto px-margin-page">
            <div className="catalog-hero-panel rounded-3xl border border-white/80 shadow-xl shadow-black/5 p-6 md:p-10">
              <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-8 items-center">
                {/* Left — headline + search */}
                <div className="flex flex-col gap-5">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-secondary-fixed text-on-secondary-fixed rounded-full text-badge-text font-bold w-fit">
                    <span className="material-symbols-outlined text-sm filled">verified</span>
                    Katalog lelang resmi
                  </div>
                  <div>
                    <h1 className="text-heading-3xl md:text-[3.25rem] md:leading-[1.08] font-extrabold text-on-surface tracking-tight">
                      Katalog Lelang{" "}
                      <span className="text-primary">BIDKU</span>
                    </h1>
                    <p className="text-body-lg text-on-surface-variant max-w-2xl mt-4 leading-relaxed">
                      Temukan lot kendaraan, properti, dan aset pilihan dengan
                      informasi jadwal, deposit, lokasi, dan harga awal yang
                      transparan.
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <input
                        className="w-full h-12 rounded-xl border border-outline-variant/30 bg-white px-4 pr-11 text-body-md outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
                        type="text"
                        placeholder="Cari lot, merek, model, atau kota"
                      />
                      <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline">
                        search
                      </span>
                    </div>
                    <button className="h-12 px-6 bg-primary text-on-primary rounded-xl font-bold text-body-md btn-press transition-all hover:bg-primary/90 flex items-center justify-center gap-2">
                      <span className="material-symbols-outlined text-lg">tune</span>
                      Filter
                    </button>
                  </div>
                </div>

                {/* Right — stat grid */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white/90 rounded-2xl p-4 border border-white shadow-sm hover:shadow-md transition-shadow">
                    <p className="text-heading-xl font-extrabold text-primary">128</p>
                    <p className="text-body-sm text-on-surface-variant mt-1">Lot Aktif</p>
                  </div>
                  <div className="bg-white/90 rounded-2xl p-4 border border-white shadow-sm hover:shadow-md transition-shadow">
                    <p className="text-heading-xl font-extrabold text-secondary">24</p>
                    <p className="text-body-sm text-on-surface-variant mt-1">Sesi</p>
                  </div>
                  <div className="bg-white/90 rounded-2xl p-4 border border-white shadow-sm hover:shadow-md transition-shadow">
                    <p className="text-heading-xl font-extrabold text-on-surface">12</p>
                    <p className="text-body-sm text-on-surface-variant mt-1">Kota</p>
                  </div>
                  <div className="col-span-3 bg-white/90 rounded-2xl p-4 border border-white shadow-sm flex items-center justify-between gap-4 hover:shadow-md transition-shadow">
                    <div>
                      <p className="text-body-sm text-outline">Sesi terdekat</p>
                      <p className="text-heading-md font-bold text-on-surface mt-1">
                        Hari ini, 14:00 WIB
                      </p>
                    </div>
                    <span className="material-symbols-outlined text-primary text-3xl">
                      event_available
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ====== FILTER BAR ====== */}
        <section id="catalog" className="py-8 bg-surface">
          <div className="max-w-container-max mx-auto px-margin-page">
            <div className="bg-white rounded-2xl border border-outline-variant/10 shadow-sm p-4 md:p-5">
              <div className="flex flex-col lg:flex-row lg:items-center gap-4 justify-between">
                {/* Category pills */}
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`px-4 py-2 rounded-full text-body-sm font-bold whitespace-nowrap transition-all btn-press ${
                        activeCategory === cat
                          ? "bg-primary text-on-primary shadow-sm"
                          : "bg-surface-container-low text-on-surface hover:text-primary hover:bg-primary/10"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Dropdowns */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:min-w-[520px]">
                  <select
                    value={lokasi}
                    onChange={(e) => setLokasi(e.target.value)}
                    className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-body-md px-3 py-2 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                  >
                    <option>Semua Lokasi</option>
                    <option>Jakarta</option>
                    <option>Bandung</option>
                    <option>Surabaya</option>
                    <option>Semarang</option>
                    <option>Yogyakarta</option>
                    <option>Bekasi</option>
                  </select>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-body-md px-3 py-2 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                  >
                    <option>Semua Status</option>
                    <option>Live Auction</option>
                    <option>Segera Dimulai</option>
                    <option>Open House</option>
                  </select>
                  <select
                    value={urutan}
                    onChange={(e) => setUrutan(e.target.value)}
                    className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-body-md px-3 py-2 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                  >
                    <option>Urutkan Terbaru</option>
                    <option>Harga Terendah</option>
                    <option>Harga Tertinggi</option>
                    <option>Jadwal Terdekat</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ====== CATALOG CONTENT ====== */}
        <section className="pb-20 bg-surface">
          <div className="max-w-container-max mx-auto px-margin-page">
            <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">

              {/* ---- SIDEBAR FILTER ---- */}
              <aside className="hidden lg:block">
                <div className="bg-white rounded-2xl border border-outline-variant/10 shadow-sm p-5 sticky top-24">
                  <div className="flex items-center justify-between">
                    <h2 className="text-heading-md font-bold text-on-surface">Filter Lelang</h2>
                    <button className="text-body-sm font-bold text-primary hover:underline">
                      Reset
                    </button>
                  </div>
                  <div className="mt-5 space-y-5">
                    {/* Kategori */}
                    <div>
                      <p className="text-body-sm font-bold text-on-surface mb-3">Kategori</p>
                      <div className="space-y-2">
                        {["Mobil", "Motor", "Properti", "Alat Berat"].map((c) => (
                          <label key={c} className="flex items-center gap-2 text-body-md text-on-surface-variant cursor-pointer hover:text-primary transition-colors">
                            <input
                              type="checkbox"
                              defaultChecked={c === "Mobil"}
                              className="rounded accent-primary w-4 h-4"
                            />
                            {c}
                          </label>
                        ))}
                      </div>
                    </div>
                    {/* Rentang Harga */}
                    <div>
                      <p className="text-body-sm font-bold text-on-surface mb-3">Rentang Harga</p>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          className="rounded-xl border border-outline-variant/30 text-body-sm px-3 py-2 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                          placeholder="Min"
                          type="text"
                        />
                        <input
                          className="rounded-xl border border-outline-variant/30 text-body-sm px-3 py-2 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                          placeholder="Max"
                          type="text"
                        />
                      </div>
                    </div>
                    {/* Status */}
                    <div>
                      <p className="text-body-sm font-bold text-on-surface mb-3">Status</p>
                      <div className="space-y-2">
                        {["Semua", "Live", "Akan Datang"].map((s) => (
                          <label key={s} className="flex items-center gap-2 text-body-md text-on-surface-variant cursor-pointer hover:text-primary transition-colors">
                            <input
                              type="radio"
                              name="status"
                              defaultChecked={s === "Semua"}
                              className="accent-primary w-4 h-4"
                            />
                            {s}
                          </label>
                        ))}
                      </div>
                    </div>
                    {/* Apply Button */}
                    <button className="w-full py-2.5 bg-primary text-on-primary rounded-xl font-bold text-body-md btn-press transition-all hover:bg-primary/90">
                      Terapkan Filter
                    </button>
                  </div>
                </div>
              </aside>

              {/* ---- LOT GRID ---- */}
              <div>
                {/* Grid header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                  <div>
                    <h2 className="text-heading-xl font-extrabold text-on-surface">Lot Tersedia</h2>
                    <p className="text-body-md text-on-surface-variant mt-1">
                      Menampilkan {filteredLots.length} dari 128 lot aktif
                    </p>
                  </div>
                  <button className="w-fit px-4 py-2 bg-secondary-fixed text-on-secondary-fixed rounded-full text-body-sm font-bold flex items-center gap-2 hover:bg-secondary-fixed-dim transition-colors">
                    <span className="material-symbols-outlined text-base">notifications_active</span>
                    Ingatkan Saya
                  </button>
                </div>

                {/* Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {filteredLots.map((lot) => (
                    <article
                      key={lot.id}
                      className="auction-card bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/60 shadow-sm group"
                    >
                      {/* Image */}
                      <div className="relative aspect-[4/3] overflow-hidden bg-surface-container-low">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          alt={lot.alt}
                          src={lot.image}
                        />
                        {/* Badge */}
                        <span
                          className={`absolute top-3 left-3 px-3 py-1 rounded-full text-badge-text font-bold ${lot.badgeStyle}`}
                        >
                          {lot.badge}
                        </span>
                        {/* Wishlist */}
                        <button
                          onClick={() => toggleWishlist(lot.id)}
                          className={`absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center transition-colors ${
                            wishlist.includes(lot.id)
                              ? "text-error"
                              : "text-outline hover:text-primary"
                          }`}
                          aria-label={wishlist.includes(lot.id) ? "Hapus dari favorit" : "Tambah ke favorit"}
                        >
                          <span className={`material-symbols-outlined text-lg ${wishlist.includes(lot.id) ? "filled" : ""}`}>
                            favorite
                          </span>
                        </button>
                      </div>

                      {/* Body */}
                      <div className="p-5">
                        <div className="flex items-center gap-2 text-body-sm text-on-surface-variant">
                          <span className="material-symbols-outlined text-base text-primary">location_on</span>
                          {lot.location}
                        </div>
                        <h3 className="text-heading-md font-bold text-on-surface mt-2 group-hover:text-primary transition-colors">
                          <Link href={`/katalog/${lot.id}`}>{lot.title}</Link>
                        </h3>
                        <div className="grid grid-cols-2 gap-3 mt-4">
                          <div>
                            <p className="text-body-sm text-outline">Harga Awal</p>
                            <p className="text-body-md font-bold text-primary">{lot.hargaAwal}</p>
                          </div>
                          <div>
                            <p className="text-body-sm text-outline">Deposit</p>
                            <p className="text-body-md font-bold text-on-surface">{lot.deposit}</p>
                          </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-outline-variant/10 flex items-center justify-between">
                          <p className="text-body-sm text-on-surface-variant">{lot.timer}</p>
                          <Link
                            href={`/katalog/${lot.id}`}
                            className={`px-4 py-2 rounded-xl text-body-sm font-bold btn-press transition-colors ${
                              lot.action === "Bid"
                                ? "bg-error text-white hover:bg-error/90"
                                : "bg-primary text-on-primary hover:bg-primary/90"
                            }`}
                          >
                            {lot.action}
                          </Link>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>

                {/* Pagination */}
                <div className="mt-8 flex items-center justify-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="w-10 h-10 rounded-full bg-white border border-outline-variant/20 text-outline flex items-center justify-center hover:text-primary hover:border-primary transition-colors"
                  >
                    <span className="material-symbols-outlined">chevron_left</span>
                  </button>
                  {[1, 2, 3].map((p) => (
                    <button
                      key={p}
                      onClick={() => setCurrentPage(p)}
                      className={`w-10 h-10 rounded-full font-bold transition-colors ${
                        currentPage === p
                          ? "bg-primary text-on-primary shadow-sm"
                          : "bg-white border border-outline-variant/20 text-on-surface hover:text-primary hover:border-primary"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(3, p + 1))}
                    className="w-10 h-10 rounded-full bg-white border border-outline-variant/20 text-outline flex items-center justify-center hover:text-primary hover:border-primary transition-colors"
                  >
                    <span className="material-symbols-outlined">chevron_right</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

