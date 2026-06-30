"use client";

import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

/* -------------------------------------------------------------------------- */
/* Data                                                                         */
/* -------------------------------------------------------------------------- */

const initialLots = [
  {
    id: 1,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBcS6tHKZpYYGzVd6NalL2sAwQ1i-oYWHGMg49cGf4YAschTELEp7pAOrezDdK7olQ3ndB21B1myenWUoLPNrW75NL_EfzKrRBazlhfxoTA0PSVXEjPFdDGaDNqxHZH3tptfatQgF6mTOgwwPZIcqeUSg_bnrWYV8RJ-Slr6Z2ltr1p5HPZjgZq16T_SVGJiQS2g7kuBo3hMXsW6tXG2JrTCu7N6moS_dGbowWE0j21z4vHv3DsDFv7XME5r0MDFozTzH0n9ug2sHhp",
    alt: "Toyota Avanza",
    badge: "LIVE",
    badgeStyle: "countdown-badge bg-error text-white",
    location: "Jakarta Timur",
    title: "Toyota Avanza 1.5 G 2021",
    hargaAwal: "Rp 155 Juta",
    hargaValue: 155000000,
    deposit: "Rp 5 Juta",
    timer: "Berakhir 02:14:32",
    action: "Bid",
    category: "Mobil",
    jenisLelang: "English Auction",
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
    hargaValue: 325000000,
    deposit: "Rp 10 Juta",
    timer: "Mulai 15:30 WIB",
    action: "Detail",
    category: "Mobil",
    jenisLelang: "English Auction",
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
    hargaValue: 278000000,
    deposit: "Rp 10 Juta",
    timer: "Besok, 10:00 WIB",
    action: "Detail",
    category: "Mobil",
    jenisLelang: "English Auction",
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
    hargaValue: 142000000,
    deposit: "Rp 5 Juta",
    timer: "Jumat, 09:30 WIB",
    action: "Detail",
    category: "Mobil",
    jenisLelang: "Sealed-Bid",
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
    hargaValue: 24000000,
    deposit: "Rp 1 Juta",
    timer: "Berakhir 00:42:18",
    action: "Bid",
    category: "Motor",
    jenisLelang: "English Auction",
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
    hargaValue: 780000000,
    deposit: "Rp 25 Juta",
    timer: "Sabtu, 13:00 WIB",
    action: "Detail",
    category: "Properti",
    jenisLelang: "Sealed-Bid",
  },
  {
    id: 7,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAfO6fRTBCfJVz6MUYCEQuH3UDV81F-F4DY_MQbOx18fvPHR0qu3z6dqm-XIHHrYpEsl-LUvyzzVw_rp9xw2ghrTUmUTz3239DZ7OUAAVjaIOedVl6K5emlIYjlz81T1VKKI8PugGBlfIwam3VPYHuUMUCCxIEBfN-bJXqFfvP6GPBQ8SRQT-HbBIgrbsbbvxtc6acdLRGMX5q5ScguyKNiTVPgNQdpCLmt1lOjJz8couih2BWAfseY00DK7axG4bWw30rAHVe6njfB",
    alt: "Suzuki Swift",
    badge: "LIVE",
    badgeStyle: "countdown-badge bg-error text-white",
    location: "Tangerang Selatan",
    title: "Suzuki Swift 1.2 GS 2021",
    hargaAwal: "Rp 112 Juta",
    hargaValue: 112000000,
    deposit: "Rp 5 Juta",
    timer: "Berakhir 00:15:30",
    action: "Bid",
    category: "Mobil",
    jenisLelang: "Dutch Auction",
  },
  {
    id: 8,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuC31zy45WQwhdCOMrDzZCm2is66KzQ3Ef-59eRlRHkxzGC5DpJj5VKLOvc3lGiQG68JH60S9yYbjI2JAl1ms-Imx6t9eaDfxqxFmaBKRys70HjrcZ5YnCiwuv-yCKaSrD7A28rXssA0Ak7J2_CZ73L4rSL6BEMP3BALcG7uqjaShWLmgCP7TdrYqffviwAtHoJO4H8Nbu1F3fC2iQnLgvWmXu_oGP3B1DIug9vTfVnGi75xhMNL1Ybhm-iHUPaTCbQVBDSpOveGl1u6",
    alt: "Vespa Sprint",
    badge: "LIVE",
    badgeStyle: "countdown-badge bg-error text-white",
    location: "Jakarta Barat",
    title: "Vespa Sprint S 150 2022",
    hargaAwal: "Rp 42 Juta",
    hargaValue: 42000000,
    deposit: "Rp 2 Juta",
    timer: "Berakhir 00:25:10",
    action: "Bid",
    category: "Motor",
    jenisLelang: "Dutch Auction",
  },
  {
    id: 9,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAGJyrSIiC5CrjQ9ie6mdjiTukPacM8oYuRPhzR3WM3ldKjSIPxknbMVrUcq4MZtcHRxMwYosqUSfDCT1upZc-E-WE5mYQQ9MLyH4yPLAjXLhJEawqhzcn9LV7tYkI8mZxjLzxkAg5RfzTEU5JJIsVEV9pE--k0LXtch0ZYYRBbsHN0rxel0IldTrktEIwbs_M4NpsGoUUL1gkx5fTfp80e6PSQ0Oe5YOs0KNjAKBOUR9IqXHGgADXQKHRG_n9XaNBxQIOfBJTw_fGD",
    alt: "iPhone 15 Bundle",
    badge: "LIVE",
    badgeStyle: "countdown-badge bg-error text-white",
    location: "Bandung",
    title: "iPhone 15 Pro Max Bundle",
    hargaAwal: "Rp 18 Juta",
    hargaValue: 18000000,
    deposit: "Rp 1 Juta",
    timer: "Berakhir 01:30:15",
    action: "Bid",
    category: "Alat Berat",
    jenisLelang: "Timed Auction",
  },
  {
    id: 10,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDx_9SWM1Z1hW6_ynwMqo7kT08ssXXJsGSjibfPe57XznHvi41Mjkt_jbGy2-a-fycvwk4nWH-5hnGlwnp8whWELZ8pnG5Wn3HWlbNIMntoz4ZlhohDti-SiLDsyXHy0w7sLLVEiGae386QxYS6XpMnVccBqdLunYwvCBAofP1PVuJ06D3eZMDxE7kbVO-Bqv_c3hUHPl9BWSeq3qkYHWBvv239rgOVx49WJqOn7TN_vhwg0VV1-q_vqf7m_6HOyuTivEWRM9MrhzrM",
    alt: "Toyota Raize",
    badge: "LIVE",
    badgeStyle: "countdown-badge bg-error text-white",
    location: "Jakarta Barat",
    title: "Toyota Raize 1.0T CVT 2022",
    hargaAwal: "Rp 210 Juta",
    hargaValue: 210000000,
    deposit: "Rp 5 Juta",
    timer: "Berakhir 02:15:00",
    action: "Bid",
    category: "Mobil",
    jenisLelang: "Buy Now + Auction",
  },
  {
    id: 11,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAs9bK1pYSqW-cfuVQ0j_xaNa18g0-LSKMlqXs886QplfdQJMpEpP1QMActoH4cjgCfElrjUmVeKBxZVQVERgNfc2zSLCVv2UcnDiN6IO_QCfIakOyYLKtnmAgPKmKsWBa1ORjMrEM06UyeALxwJt3IrYZgbWJlt-xUYGT82U7KK4daYCRCfpOkvmNGrixxaYWSqkLiku5XuFG82BcpZl5LPtaAHB0dIz4IU5kzkOoMJYeEbJFBusmFinqTtPOlivVZ31ihUEJH1e64",
    alt: "PT ABC Bundle",
    badge: "LIVE",
    badgeStyle: "countdown-badge bg-error text-white",
    location: "Surabaya",
    title: "Paket Alat Kantor PT ABC",
    hargaAwal: "Rp 45 Juta",
    hargaValue: 45000000,
    deposit: "Rp 3 Juta",
    timer: "Berakhir 03:10:00",
    action: "Bid",
    category: "Alat Berat",
    jenisLelang: "Group/Bundle",
  },
];

const categories = ["Semua Lot", "Mobil", "Motor", "Properti", "Alat Berat"];

/* -------------------------------------------------------------------------- */
/* Component                                                                    */
/* -------------------------------------------------------------------------- */

export default function KatalogPage() {
  return (
    <Suspense fallback={<div className="p-20 text-center font-bold font-serif text-primary text-heading-xl bg-surface">Memuat Katalog BIDKU...</div>}>
      <KatalogContent />
    </Suspense>
  );
}

function KatalogContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialSearch = searchParams ? searchParams.get("search") || "" : "";

  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [activeCategory, setActiveCategory] = useState("Semua Lot");
  const [lokasi, setLokasi] = useState("Semua Lokasi");
  const [status, setStatus] = useState("Semua Status");
  const [jenisLelangFilter, setJenisLelangFilter] = useState("Semua Jenis Lelang");
  const [urutan, setUrutan] = useState("Urutkan Terbaru");
  const [minHarga, setMinHarga] = useState("");
  const [maxHarga, setMaxHarga] = useState("");
  const [wishlist, setWishlist] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [showMobileFilter, setShowMobileFilter] = useState(false);
  const [lotsList, setLotsList] = useState(initialLots);
  const [enabledCategories, setEnabledCategories] = useState({ mobil: true, motor: true, properti: true, heavy: true });

  useEffect(() => {
    if (searchParams) {
      setSearchQuery(searchParams.get("search") || "");
    }
  }, [searchParams]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Load enabled categories from cookies
      const cookieMap: Record<string, string> = {};
      document.cookie.split(";").forEach((c) => {
        const parts = c.trim().split("=");
        if (parts[0]) cookieMap[parts[0]] = parts[1] || "";
      });

      setEnabledCategories({
        mobil: cookieMap["feat_category_mobil"] !== "false",
        motor: cookieMap["feat_category_motor"] !== "false",
        properti: cookieMap["feat_category_properti"] !== "false",
        heavy: cookieMap["feat_category_heavy"] !== "false",
      });

      const stored = localStorage.getItem("provider_assets");
      if (stored) {
        try {
          const list = JSON.parse(stored);
          const parsed = list.map((item: any, index: number) => ({
            id: 100 + index,
            image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBcS6tHKZpYYGzVd6NalL2sAwQ1i-oYWHGMg49cGf4YAschTELEp7pAOrezDdK7olQ3ndB21B1myenWUoLPNrW75NL_EfzKrRBazlhfxoTA0PSVXEjPFdDGaDNqxHZH3tptfatQgF6mTOgwwPZIcqeUSg_bnrWYV8RJ-Slr6Z2ltr1p5HPZjgZq16T_SVGJiQS2g7kuBo3hMXsW6tXG2JrTCu7N6moS_dGbowWE0j21z4vHv3DsDFv7XME5r0MDFozTzH0n9ug2sHhp",
            alt: item.name,
            badge: "LIVE",
            badgeStyle: "countdown-badge bg-error text-white",
            location: "Jakarta Barat",
            title: item.name,
            hargaAwal: `Rp ${(item.limitPrice / 1000000).toFixed(0)} Juta`,
            hargaValue: item.limitPrice,
            deposit: "Rp 5 Juta",
            timer: "Mulai Baru",
            action: "Bid",
            category: item.category === "mobil" ? "Mobil" : item.category === "motor" ? "Motor" : item.category === "properti" ? "Properti" : "Alat Berat",
            jenisLelang: item.jenisLelang || "English Auction",
          }));
          setLotsList([...initialLots, ...parsed]);
        } catch (e) {}
      }
    }
  }, []);

  const toggleWishlist = (id: number) => {
    setWishlist((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    router.push(`/katalog?search=${encodeURIComponent(searchQuery)}`);
  };

  const filteredLots = lotsList.filter((l) => {
    const query = searchQuery ? searchQuery.toLowerCase().trim() : "";
    const matchesSearch =
      !query ||
      l.title.toLowerCase().includes(query) ||
      l.location.toLowerCase().includes(query);
    const matchesCategory =
      activeCategory === "Semua Lot" || l.category === activeCategory;
    const matchesLokasi =
      lokasi === "Semua Lokasi" || l.location.toLowerCase().includes(lokasi.toLowerCase());
    const matchesStatus =
      status === "Semua Status" ||
      status === "Semua" ||
      (status === "Live" && l.badge === "LIVE") ||
      (status === "Akan Datang" && (l.badge === "OPEN" || l.badge === "INSPEKSI"));
    const matchesJenisLelang =
      jenisLelangFilter === "Semua Jenis Lelang" || l.jenisLelang === jenisLelangFilter;

    const priceVal = l.hargaValue;
    const minVal = minHarga ? parseFloat(minHarga.replace(/\./g, "")) : 0;
    const maxVal = maxHarga ? parseFloat(maxHarga.replace(/\./g, "")) : Infinity;
    const matchesPrice = priceVal >= minVal && priceVal <= maxVal;

    return matchesSearch && matchesCategory && matchesLokasi && matchesStatus && matchesJenisLelang && matchesPrice;
  });

  const totalLots = lotsList.length;
  const totalSesi = Array.from(new Set(lotsList.map((l) => l.jenisLelang))).length;
  const totalKota = Array.from(new Set(lotsList.map((l) => l.location))).length;
  const upcomingLot = lotsList.find((l) => l.badge === "LIVE" && l.timer && l.timer.includes(":"));
  const sesiTerdekatText = upcomingLot ? `Hari ini, ${upcomingLot.timer}` : "Besok, 10:00 WIB";

  return (
    <div className="min-h-screen bg-surface">
      {/* ====== STICKY MOBILE CTA ====== */}
      <div
        id="stickyCta"
        className="sticky-cta visible fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-outline-variant/20 px-4 py-3 md:hidden shadow-lg"
      >
        <div className="flex items-center gap-3 max-w-container-max mx-auto">
          <button className="flex-1 px-4 py-2.5 bg-premium text-on-premium rounded-xl font-bold text-sm btn-press btn-shine transition-all hover:bg-premium/85 text-center">
            Daftar Sekarang
          </button>
          <button className="flex-1 px-4 py-2.5 border-2 border-premium/20 text-premium rounded-xl font-bold text-sm btn-press transition-all hover:bg-premium hover:text-on-premium text-center">
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
                    <h1 className="text-heading-3xl md:text-[3.25rem] md:leading-[1.08] font-extrabold text-on-surface tracking-tight font-serif">
                      Katalog Lelang{" "}
                      <span className="text-primary">BIDKU</span>
                    </h1>
                    <p className="text-body-lg text-on-surface-variant max-w-2xl mt-4 leading-relaxed">
                      Temukan lot kendaraan, properti, dan aset pilihan dengan
                      informasi jadwal, deposit, lokasi, dan harga awal yang
                      transparan.
                    </p>
                  </div>
                  <form onSubmit={handleSearchSubmit} className="flex gap-3">
                    <div className="relative flex-1">
                      <input
                        className="w-full h-12 rounded-xl border border-outline-variant/30 bg-white px-4 pr-11 text-body-md outline-none focus:border-premium focus:ring-2 focus:ring-premium/20"
                        type="text"
                        placeholder="Cari lot, merek, model, atau kota... (Tekan Enter)"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                      <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-primary">
                        <span className="material-symbols-outlined">
                          search
                        </span>
                      </button>
                    </div>
                  </form>
                </div>

                {/* Right — stat grid */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white/90 rounded-2xl p-4 border border-white shadow-sm hover:shadow-md transition-shadow">
                    <p className="text-heading-xl font-extrabold text-primary">{totalLots}</p>
                    <p className="text-body-sm text-on-surface-variant mt-1">Lot Aktif</p>
                  </div>
                  <div className="bg-white/90 rounded-2xl p-4 border border-white shadow-sm hover:shadow-md transition-shadow">
                    <p className="text-heading-xl font-extrabold text-secondary">{totalSesi}</p>
                    <p className="text-body-sm text-on-surface-variant mt-1">Sesi</p>
                  </div>
                  <div className="bg-white/90 rounded-2xl p-4 border border-white shadow-sm hover:shadow-md transition-shadow">
                    <p className="text-heading-xl font-extrabold text-on-surface">{totalKota}</p>
                    <p className="text-body-sm text-on-surface-variant mt-1">Kota</p>
                  </div>
                  <div className="col-span-3 bg-white/90 rounded-2xl p-4 border border-white shadow-sm flex items-center justify-between gap-4 hover:shadow-md transition-shadow">
                    <div>
                      <p className="text-body-sm text-outline">Sesi terdekat</p>
                      <p className="text-heading-md font-bold text-on-surface mt-1">
                        {sesiTerdekatText}
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
                  {categories.filter((cat) => {
                    if (cat === "Semua Lot") return true;
                    if (cat === "Mobil") return enabledCategories.mobil;
                    if (cat === "Motor") return enabledCategories.motor;
                    if (cat === "Properti") return enabledCategories.properti;
                    if (cat === "Alat Berat") return enabledCategories.heavy;
                    return true;
                  }).map((cat) => (
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
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 lg:min-w-[680px]">
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
                    value={jenisLelangFilter}
                    onChange={(e) => setJenisLelangFilter(e.target.value)}
                    className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-body-md px-3 py-2 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                  >
                    <option>Semua Jenis Lelang</option>
                    <option>English Auction</option>
                    <option>Dutch Auction</option>
                    <option>Sealed-Bid</option>
                    <option>Timed Auction</option>
                    <option>Buy Now + Auction</option>
                    <option>Group/Bundle</option>
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
                    <button
                      onClick={() => {
                        setActiveCategory("Semua Lot");
                        setLokasi("Semua Lokasi");
                        setStatus("Semua Status");
                        setJenisLelangFilter("Semua Jenis Lelang");
                        setUrutan("Urutkan Terbaru");
                        setMinHarga("");
                        setMaxHarga("");
                        setSearchQuery("");
                      }}
                      className="text-body-sm font-bold text-primary hover:underline"
                    >
                      Reset
                    </button>
                  </div>
                  <div className="mt-5 space-y-5">
                    {/* Kategori */}
                    <div>
                      <p className="text-body-sm font-bold text-on-surface mb-3">Kategori</p>
                      <div className="space-y-2">
                        {["Mobil", "Motor", "Properti", "Alat Berat"].filter((c) => {
                          if (c === "Mobil") return enabledCategories.mobil;
                          if (c === "Motor") return enabledCategories.motor;
                          if (c === "Properti") return enabledCategories.properti;
                          if (c === "Alat Berat") return enabledCategories.heavy;
                          return true;
                        }).map((c) => (
                          <label key={c} className="flex items-center gap-2 text-body-md text-on-surface-variant cursor-pointer hover:text-premium transition-colors">
                            <input
                              type="checkbox"
                              checked={activeCategory === c}
                              onChange={() => setActiveCategory(activeCategory === c ? "Semua Lot" : c)}
                              className="rounded accent-premium w-4 h-4"
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
                          className="rounded-xl border border-outline-variant/30 text-body-sm px-3 py-2 focus:ring-2 focus:ring-premium/20 focus:border-premium outline-none"
                          placeholder="Min"
                          type="text"
                          value={minHarga}
                          onChange={(e) => setMinHarga(e.target.value)}
                        />
                        <input
                          className="rounded-xl border border-outline-variant/30 text-body-sm px-3 py-2 focus:ring-2 focus:ring-premium/20 focus:border-premium outline-none"
                          placeholder="Max"
                          type="text"
                          value={maxHarga}
                          onChange={(e) => setMaxHarga(e.target.value)}
                        />
                      </div>
                    </div>
                    {/* Status */}
                    <div>
                      <p className="text-body-sm font-bold text-on-surface mb-3">Status</p>
                      <div className="space-y-2">
                        {["Semua", "Live", "Akan Datang"].map((s) => {
                          const statusMap: Record<string, string> = {
                            "Semua": "Semua Status",
                            "Live": "Live Auction",
                            "Akan Datang": "Segera Dimulai",
                          };
                          const mappedVal = statusMap[s] || s;
                          return (
                            <label key={s} className="flex items-center gap-2 text-body-md text-on-surface-variant cursor-pointer hover:text-premium transition-colors">
                              <input
                                type="radio"
                                name="status"
                                checked={status === mappedVal}
                                onChange={() => setStatus(mappedVal)}
                                className="accent-premium w-4 h-4"
                              />
                              {s}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </aside>

              {/* ---- LOT GRID ---- */}
              <div>
                {/* Grid header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                  <div>
                    <h2 className="text-heading-xl font-extrabold text-on-surface font-serif">Lot Tersedia</h2>
                    <p className="text-body-md text-on-surface-variant mt-1">
                      Menampilkan {filteredLots.length} dari {lotsList.length} lot aktif
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
                        {/* Jenis Lelang Badge */}
                        <span className="absolute top-3 right-14 px-2.5 py-1 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold rounded-full flex items-center gap-1">
                          <span className="material-symbols-outlined text-[10px] filled text-secondary-fixed">
                            {lot.jenisLelang === "English Auction" ? "gavel" : 
                             lot.jenisLelang === "Dutch Auction" ? "trending_down" :
                             lot.jenisLelang === "Sealed-Bid" ? "lock" :
                             lot.jenisLelang === "Timed Auction" ? "schedule" :
                             lot.jenisLelang === "Buy Now + Auction" ? "shopping_bag" :
                             "inventory_2"}
                          </span>
                          {lot.jenisLelang}
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
                        <h3 className="text-heading-md font-bold text-on-surface mt-2 group-hover:text-premium transition-colors">
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
                                : "bg-premium text-on-premium hover:bg-premium/85"
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
                          ? "bg-premium text-on-premium shadow-sm"
                          : "bg-white border border-outline-variant/20 text-on-surface hover:text-premium hover:border-premium"
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

