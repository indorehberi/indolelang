"use client";

import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import BidderBottomNav from "@/components/layout/BidderBottomNav";
import { useBidderSession } from "@/hooks/useBidderSession";
import { useFeaturedLots } from "@/hooks/usePublicData";
import { apiUrl, getImageUrl, getAssetImages } from "@/lib/api";

/* -------------------------------------------------------------------------- */
/* Data                                                                         */
/* -------------------------------------------------------------------------- */

const initialLots: any[] = [];

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
  const { isBidderLoggedIn } = useBidderSession();
  const initialSearch = searchParams ? searchParams.get("search") || "" : "";
  const initialCategory = searchParams ? (searchParams.get("category") === "MOBIL" ? "Mobil" : "Semua Lot") : "Semua Lot";

  const { data: dbFeaturedLots = [] } = useFeaturedLots();

  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [lokasi, setLokasi] = useState("Semua Lokasi");
  const [status, setStatus] = useState("Semua Status");
  const [jenisLelangFilter, setJenisLelangFilter] = useState("Semua Jenis Lelang");
  const [urutan, setUrutan] = useState("Urutkan Terbaru");
  const [minHarga, setMinHarga] = useState("");
  const [maxHarga, setMaxHarga] = useState("");
  const [showMobileFilter, setShowMobileFilter] = useState(false);
  const [lotsList, setLotsList] = useState<any[]>(initialLots);
  const [enabledCategories, setEnabledCategories] = useState({ mobil: true, motor: true, properti: false, heavy: false });
  const [enabledTypes, setEnabledTypes] = useState<string[]>(["English Auction"]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches) {
       setIsStandalone(true);
    }
  }, []);

  useEffect(() => {
    if (searchParams) {
      setSearchQuery(searchParams.get("search") || "");
      const cat = searchParams.get("category");
      if (cat === "MOBIL") {
        setActiveCategory("Mobil");
      }
    }
  }, [searchParams]);

  useEffect(() => {
    if (dbFeaturedLots && dbFeaturedLots.length > 0) {
      const mapped = dbFeaturedLots.map((dbLot: any) => {
        const image = getImageUrl(getAssetImages(dbLot.asset)[0]);
        const isLiveRaw = dbLot.status?.toLowerCase() === "active";
        let isCancelled = dbLot.status?.toLowerCase() === "cancelled";
        let isLive = isLiveRaw && !isCancelled;
        let timerText = "Akan Datang";
        
        if (isCancelled) {
          timerText = "Dibatalkan";
        } else if (dbLot.session) {
          const now = new Date();
          const start = new Date(dbLot.session.start_time || dbLot.session.scheduled_at);
          const end = new Date(dbLot.session.end_time || new Date(start.getTime() + 2 * 60 * 60 * 1000));

          if (now >= start && now <= end) {
            isLive = true;
            const endTimeString = end.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
            timerText = `Hari ini, ${endTimeString} WIB`;
          } else if (now < start) {
            isLive = false;
            const dateString = start.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
            const timeString = start.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
            timerText = `${dateString}, ${timeString} WIB`;
          } else {
            isLive = false;
            timerText = "Selesai";
          }
        } else {
          timerText = isLive ? "Berakhir Hari Ini" : "Akan Datang";
        }
        
        const specParts = [];
        if (dbLot.asset.year) specParts.push(dbLot.asset.year);
        if (dbLot.asset.transmission) specParts.push(dbLot.asset.transmission);
        if (dbLot.asset.police_number) specParts.push(dbLot.asset.police_number);
        const specString = specParts.join(" | ") || "Spesifikasi tidak tersedia";

        return {
          id: dbLot.id,
          image,
          alt: dbLot.asset.title,
          badge: isCancelled ? "DIBATALKAN" : (isLive ? "LIVE" : "OPEN"),
          badgeStyle: isCancelled ? "bg-slate-500 text-white" : (isLive ? "bg-error text-white" : "bg-primary text-on-primary"),
          isCancelled,
          grade: dbLot.asset.grade_engine || dbLot.asset.grade_interior || (dbLot.asset.condition === "BARU" ? "A" : "B"),
          location: dbLot.session?.branch?.city || "Jakarta",
          title: dbLot.asset.title,
          specString,
          hargaAwal: `Rp ${Number(dbLot.starting_price).toLocaleString("id-ID")}`,
          hargaValue: Number(dbLot.starting_price),
          deposit: "Rp 5.000.000",
          timer: timerText,
          action: isCancelled ? "Dibatalkan" : (isLive ? "Bid" : "Lihat Detail"),
          category: dbLot.asset?.category?.toUpperCase() === "MOBIL" ? "Mobil" : (dbLot.asset?.category?.toUpperCase() === "MOTOR" ? "Motor" : (dbLot.asset?.category?.toUpperCase() === "PROPERTI" ? "Properti" : "Alat Berat")),
          jenisLelang: "English Auction",
          sessionId: dbLot.session_id,
        };
      });
      setLotsList(mapped);
    }
  }, [dbFeaturedLots]);

  const uniqueLocations = Array.from(new Set(lotsList.map((l) => l.location))).filter(Boolean);

  useEffect(() => {
    const fetchPlatformSettings = async () => {
      try {
        const response = await fetch(apiUrl("/public/settings"));
        const data = await response.json();
        
        let settingsMap: Record<string, string> = {};
        if (response.ok && data.success) {
          settingsMap = data.data || {};
        } else {
          // Fallback to cookies
          if (typeof document !== "undefined") {
            document.cookie.split(";").forEach((c) => {
              const parts = c.trim().split("=");
              if (parts[0]) settingsMap[parts[0]] = parts[1] || "";
            });
          }
        }

        setEnabledCategories({
          mobil: settingsMap["feat_category_mobil"] !== "false",
          motor: settingsMap["feat_category_motor"] !== "false",
          properti: settingsMap["feat_category_properti"] === "true",
          heavy: settingsMap["feat_category_heavy"] === "true",
        });

        const list = [];
        if (settingsMap["feat_auction_english"] !== "false") list.push("English Auction");
        if (settingsMap["feat_auction_dutch"] === "true") list.push("Dutch Auction");
        if (settingsMap["feat_auction_sealed"] === "true") list.push("Sealed-Bid");
        if (settingsMap["feat_auction_timed"] === "true") list.push("Timed Auction");
        if (settingsMap["feat_auction_buynow"] === "true") list.push("Buy Now + Auction");
        if (settingsMap["feat_auction_group"] === "true") list.push("Group/Bundle");

        if (list.length > 0) {
          setEnabledTypes(list);
        }
      } catch (err) {
        console.error("Gagal mengambil pengaturan platform", err);
      }
    };
    
    fetchPlatformSettings();
  }, []);

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

  const itemsPerPage = 6;
  const totalPages = Math.ceil(filteredLots.length / itemsPerPage) || 1;
  const validCurrentPage = Math.min(currentPage, totalPages);
  const paginatedLots = filteredLots.slice((validCurrentPage - 1) * itemsPerPage, validCurrentPage * itemsPerPage);

  const totalLots = lotsList.length;
  const totalSesi = Array.from(new Set(lotsList.map((l) => l.sessionId))).length;
  const totalKota = Array.from(new Set(lotsList.map((l) => l.location))).length;
  const upcomingLot = lotsList.find((l) => l.badge === "LIVE" && l.timer && l.timer.includes(":"));
  const futureLot = lotsList.find((l) => l.badge === "OPEN" && l.timer && l.timer.includes(":"));
  
  let sesiTerdekatText = "Belum Ada Jadwal";
  if (upcomingLot) {
    sesiTerdekatText = upcomingLot.timer;
  } else if (futureLot) {
    sesiTerdekatText = futureLot.timer;
  }

  return (
    <div className="min-h-screen bg-surface pb-20 lg:pb-0">
      {/* ====== STICKY MOBILE CTA (logged-out visitors only — bidders get BidderBottomNav instead) ====== */}
      {!isBidderLoggedIn && (
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
      )}
      <BidderBottomNav />

      {!isStandalone && <Header />}

      <main>
        {/* ====== CATALOG HERO ====== */}
        <section className={`hero-gradient relative overflow-hidden ${isStandalone ? 'pt-4 pb-4' : 'pt-10 pb-10 md:pt-14 md:pb-14'}`}>
          <div className="max-w-container-max mx-auto px-margin-page">
            <div className={`${isStandalone ? '' : 'catalog-hero-panel rounded-3xl border border-white/80 shadow-xl shadow-black/5 p-6 md:p-10'}`}>
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
        <section id="catalog" className={`${isStandalone ? 'py-4' : 'py-8'} bg-surface`}>
          <div className="max-w-container-max mx-auto px-margin-page">
            <div className={`${isStandalone ? '' : 'bg-white rounded-2xl border border-outline-variant/10 shadow-sm p-4 md:p-5'}`}>
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
                    {uniqueLocations.map((loc) => (
                      <option key={loc as string} value={loc as string}>{loc as string}</option>
                    ))}
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
                    {enabledTypes.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
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
                  {!isStandalone && (
                    <button className="w-fit px-4 py-2 bg-secondary-fixed text-on-secondary-fixed rounded-full text-body-sm font-bold flex items-center gap-2 hover:bg-secondary-fixed-dim transition-colors">
                      <span className="material-symbols-outlined text-base">notifications_active</span>
                      Ingatkan Saya
                    </button>
                  )}
                </div>

                {/* Cards */}
                <div className={isStandalone ? "grid grid-cols-2 gap-3" : "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5"}>
                  {paginatedLots.map((lot) => {
                    if (isStandalone) {
                      return (
                        <Link href={`/katalog/${lot.id}`} key={lot.id} className="bg-surface border border-outline-variant/40 rounded-xl overflow-hidden shadow-sm flex flex-col active:scale-95 transition-transform">
                          <div className="aspect-[4/3] bg-slate-100 relative">
                            {lot.image ? (
                              <img src={lot.image} alt={lot.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-300">
                                <span className="material-symbols-outlined text-4xl">directions_car</span>
                              </div>
                            )}
                            <div className="absolute top-1.5 left-1.5 bg-black/70 backdrop-blur-sm text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                              Lot {lot.lot_number || '-'}
                            </div>
                            {lot.grade && (
                              <div className="absolute top-1.5 right-1.5 bg-secondary text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                                Grade {lot.grade}
                              </div>
                            )}
                          </div>
                          <div className="p-2.5 flex-1 flex flex-col justify-between">
                            <div>
                              <h4 className="font-bold text-slate-800 text-xs leading-snug line-clamp-2 mb-1">{lot.title}</h4>
                              <p className="text-[10px] text-slate-500 mb-1">{lot.specString}</p>
                            </div>
                            <div className="mt-2">
                              <p className="text-[10px] text-slate-500">Harga Dasar</p>
                              <p className="text-sm font-black text-primary leading-none">{lot.hargaAwal}</p>
                              <p className="text-[9px] text-slate-400 mt-1 italic">
                                +Biaya PMK41 (1,1%)
                              </p>
                              <p className="text-[9px] text-slate-500 mt-1.5 flex items-center gap-0.5 font-semibold">
                                <span className="material-symbols-outlined text-[10px]">location_on</span>
                                <span className="truncate">{lot.location}</span>
                              </p>
                            </div>
                          </div>
                        </Link>
                      );
                    }
                    return (
                      <article
                      key={lot.id}
                      className={`auction-card bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/60 shadow-sm group ${lot.isCancelled ? 'grayscale opacity-75' : ''}`}
                    >
                      {/* Image */}
                      <div className="relative aspect-[4/3] overflow-hidden bg-surface-container-low">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          alt={lot.alt}
                          src={lot.image}
                        />
                        {/* Grade Badge */}
                        <span className="absolute top-3 left-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur text-primary flex items-center justify-center font-black shadow-sm border border-white z-10">
                          {lot.grade}
                        </span>
                        {/* Status Badge */}
                        <span
                          className={`absolute top-3 left-13 px-3 py-1 rounded-full text-badge-text font-bold ${lot.badgeStyle}`}
                        >
                          {lot.badge}
                        </span>
                        {/* Jenis Lelang Badge */}
                        <span className="absolute top-3 right-3 px-2.5 py-1 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold rounded-full flex items-center gap-1">
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
                        <p className="text-body-sm text-outline mt-1 mb-2 font-medium">{lot.specString}</p>
                        <div className="mt-3">
                          <p className="text-body-sm text-outline">Harga Awal</p>
                          <p className="text-body-md font-bold text-primary">{lot.hargaAwal}</p>
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
                  )})}
                  {filteredLots.length === 0 && (
                    <div className="col-span-1 md:col-span-2 lg:col-span-3 py-16 text-center bg-white/50 backdrop-blur-sm rounded-2xl border border-white/60">
                      <span className="material-symbols-outlined text-6xl text-outline mb-4">inventory_2</span>
                      <h3 className="text-heading-md font-bold text-on-surface">Tidak ada lelang yang ditemukan</h3>
                      <p className="text-body-md text-on-surface-variant mt-2">Belum ada data unit lelang yang tersedia untuk saat ini.</p>
                    </div>
                  )}
                </div>

                {/* Pagination */}
                {filteredLots.length > 0 && totalPages > 1 && (
                  <div className="mt-8 flex items-center justify-center gap-2">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={validCurrentPage === 1}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                        validCurrentPage === 1 
                          ? "bg-surface-container text-outline/50 cursor-not-allowed" 
                          : "bg-white border border-outline-variant/20 text-outline hover:text-primary hover:border-primary"
                      }`}
                    >
                      <span className="material-symbols-outlined">chevron_left</span>
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                      <button
                        key={p}
                        onClick={() => setCurrentPage(p)}
                        className={`w-10 h-10 rounded-full font-bold transition-colors ${
                          validCurrentPage === p
                            ? "bg-premium text-on-premium shadow-sm"
                            : "bg-white border border-outline-variant/20 text-on-surface hover:text-premium hover:border-premium"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={validCurrentPage === totalPages}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                        validCurrentPage === totalPages 
                          ? "bg-surface-container text-outline/50 cursor-not-allowed" 
                          : "bg-white border border-outline-variant/20 text-outline hover:text-primary hover:border-primary"
                      }`}
                    >
                      <span className="material-symbols-outlined">chevron_right</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

