"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useFeaturedLots, usePlatformStats, useCategoryStats, usePublicSessions, usePublicBlogs, usePublicTestimonials, usePublicGalleries } from "@/hooks/usePublicData";
import { apiUrl, getImageUrl, getAssetImages } from "@/lib/api";
import GalleryGrid from "@/components/gallery/GalleryGrid";
import { useToast } from "@/providers/ToastProvider";

function AnimatedCounter({
  target,
  prefix = "",
  suffix = "",
  duration = 1500,
}: {
  target: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
}) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = target;
    if (start === end) {
      setCount(end);
      return;
    }

    const incrementTime = 20; // 50 fps
    const step = end / (duration / incrementTime);

    const timer = setInterval(() => {
      start += step;
      if (start >= end) {
        clearInterval(timer);
        setCount(end);
      } else {
        setCount(Math.floor(start));
      }
    }, incrementTime);

    return () => clearInterval(timer);
  }, [target, duration]);

  return (
    <span className="inline-block transition-transform duration-300">
      {prefix}
      {count.toLocaleString("id-ID")}
      {suffix}
    </span>
  );
}

function addBusinessDays(startDate: Date, days: number): Date {
  const d = new Date(startDate);
  let count = 0;
  while (count < days) {
    d.setDate(d.getDate() + 1);
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) count++;
  }
  d.setHours(18, 0, 0, 0);
  return d;
}

function formatDeadlineDate(scheduledAt: string | undefined): string {
  if (!scheduledAt) return 'N/A';
  const sesi = new Date(scheduledAt);
  const deadline = addBusinessDays(sesi, 3);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(deadline.getDate())}/${pad(deadline.getMonth() + 1)}/${deadline.getFullYear()} 18:00 WIB`;
}

function LotCard({
  lot,
}: {
  lot: any;
}) {
  const formatRupiah = (v: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(v);
  const formatStnk = (iso: string | undefined) => {
    if (!iso) return "-";
    return new Date(iso).toLocaleDateString("id-ID", { month: "short", year: "numeric" });
  };

  const lokasiUnit = lot.notes || 'N/A';
  const deadlineDate = formatDeadlineDate(lot.scheduledAt);

  return (
    <div className="auction-card bg-white/60 backdrop-blur-md border border-white/60 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all flex flex-col h-full group">
      {/* ── FOTO ─────────────────────────────────── */}
      <div className="relative">
        <div className="aspect-[4/3] overflow-hidden bg-surface-container-low">
          {lot.isCancelled ? (
            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-200">
              <span className="material-symbols-outlined text-slate-400" style={{ fontSize: 56 }}>cancel</span>
              <p className="text-2xl font-black text-slate-500 tracking-widest mt-2">DIBATALKAN</p>
            </div>
          ) : (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              alt={lot.title}
              src={lot.image}
            />
          )}
        </div>
        {/* No lot — pojok kiri atas */}
        <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded z-10">
          Lot {lot.lot_number || "-"}
        </div>
        {/* Harga dasar box — menutup ~50% bawah foto */}
        {!lot.isCancelled && (
          <div className="absolute bottom-0 left-3 right-3 translate-y-1/2 z-20 bg-white rounded-xl shadow-lg px-4 py-2.5 border border-outline-variant/10 text-center">
            <p className="text-[10px] text-on-surface-variant font-semibold uppercase tracking-wide">Harga Dasar</p>
            <p className="text-base font-black text-primary leading-tight">{formatRupiah(lot.hargaDasar)}</p>
          </div>
        )}
      </div>

      {/* ── BODY ─────────────────────────────────── */}
      <div className={`flex flex-col flex-1 px-4 pb-4 text-center ${lot.isCancelled ? 'pt-4' : 'pt-10'}`}>
        {/* Nama unit */}
        <h4 className="font-bold text-body-md text-on-surface group-hover:text-premium transition-colors line-clamp-2 mb-1">
          <Link href={`/katalog/${lot.id}`}>{lot.title}</Link>
        </h4>

        {/* Views & likes */}
        <div className="flex items-center justify-center gap-3 text-[11px] text-outline mb-2">
          <span className="flex items-center gap-0.5"><span className="material-symbols-outlined text-sm">visibility</span> 0</span>
          <span className="flex items-center gap-0.5"><span className="material-symbols-outlined text-sm">favorite</span> 0</span>
        </div>

        {/* Lokasi Unit */}
        <p className="text-body-sm text-outline flex items-center justify-center gap-1.5 mb-1">
          <span className="material-symbols-outlined text-sm text-primary">location_on</span>
          <span>{lokasiUnit}</span>
        </p>

        {/* Batas pelunasan */}
        <p className="text-[11px] text-warning font-semibold mb-0.5 flex items-center justify-center gap-1">
          <span className="material-symbols-outlined text-sm">schedule</span>
          Batas Pelunasan : 5 HK
        </p>
        <p className="text-[10px] text-on-surface-variant mb-3">{deadlineDate}</p>

        {/* Tabel Info Kendaraan */}
        <div className="border border-outline-variant/10 rounded-xl overflow-hidden mb-3 bg-surface/60">
          <div className="bg-surface-container-lowest/80 px-3 py-1.5 text-[10px] font-bold text-on-surface uppercase tracking-wide border-b border-outline-variant/10">
            Info Kendaraan
          </div>
          <div className="grid grid-cols-3 divide-x divide-outline-variant/10">
            {[
              { icon: "calendar_today", val: lot.year || "-" },
              { icon: "settings", val: lot.transmission || "-" },
              { icon: "speed", val: lot.odometer ? `${Number(lot.odometer).toLocaleString("id-ID")} km` : "-" },
            ].map((c, i) => (
              <div key={i} className="px-2 py-2 text-center">
                <span className="material-symbols-outlined text-primary" style={{ fontSize: 14 }}>{c.icon}</span>
                <p className="text-[10px] font-semibold text-on-surface mt-0.5 truncate">{c.val}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 divide-x divide-outline-variant/10 border-t border-outline-variant/10">
            {[
              { icon: "confirmation_number", val: lot.police_number || "-" },
              { icon: "local_gas_station", val: lot.fuel_type || "-" },
              { icon: "article", val: formatStnk(lot.stnk_date) },
            ].map((c, i) => (
              <div key={i} className="px-2 py-2 text-center">
                <span className="material-symbols-outlined text-primary" style={{ fontSize: 14 }}>{c.icon}</span>
                <p className="text-[10px] font-semibold text-on-surface mt-0.5 truncate">{c.val}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Grade Kendaraan */}
        {(lot.grade_engine || lot.grade_exterior || lot.grade_interior) && (
          <div className="border border-outline-variant/10 rounded-xl overflow-hidden mb-3 bg-surface/60">
            <div className="bg-surface-container-lowest/80 px-3 py-1.5 text-[10px] font-bold text-on-surface uppercase tracking-wide border-b border-outline-variant/10">
              Grade Kendaraan
            </div>
            <div className="grid grid-cols-3 divide-x divide-outline-variant/10">
              {[
                { grade: lot.grade_engine, label: "Mesin" },
                { grade: lot.grade_exterior, label: "Eksterior" },
                { grade: lot.grade_interior, label: "Interior" },
              ].map((g, i) => (
                <div key={i} className="px-2 py-2 text-center">
                  <p className={`text-lg font-black leading-none ${
                    g.grade === 'A' ? 'text-green-600' :
                    g.grade === 'B' ? 'text-blue-600' :
                    g.grade === 'C' ? 'text-amber-600' :
                    g.grade === 'N/A' ? 'text-slate-400' : 'text-red-600'
                  }`}>{g.grade || "-"}</p>
                  <p className="text-[9px] text-on-surface-variant mt-0.5">{g.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="mt-auto">
          <Link
            href={`/katalog/${lot.id}`}
            className="w-full px-4 py-2.5 rounded-xl font-bold text-body-sm btn-press transition-all bg-premium text-on-premium shadow-sm hover:bg-premium/85 text-center block"
          >
            Lihat Detail
          </Link>
        </div>
      </div>
    </div>
  );
}

const initialLots: any[] = [];

export default function Home() {
  const router = useRouter();
  const toast = useToast();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: dbFeaturedLots = [] } = useFeaturedLots();
  const { data: dbSessions = [] } = usePublicSessions();
  const { data: platformStats } = usePlatformStats();
  const { data: categoryStats } = useCategoryStats();
  const { data: publicBlogs = [] } = usePublicBlogs();
  const { data: publicTestimonials = [] } = usePublicTestimonials();
  const { data: galleriesData, isLoading: loadingGalleries } = usePublicGalleries(1, 6);
  
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches) {
      const token = localStorage.getItem("accessToken");
      if (token) {
        router.replace("/bidder/home");
      } else {
        router.replace("/login");
      }
    }
  }, [router]);
  const galleries = galleriesData?.data || [];

  const [lotsList, setLotsList] = useState<any[]>(initialLots);
  const isLiveAuctionRunning = lotsList.some((lot) => lot.status === "Live");
  const [enabledTypes, setEnabledTypes] = useState({ english: true, dutch: false, sealed: false, timed: false, buynow: false, group: false });
  const [enabledCategories, setEnabledCategories] = useState({ mobil: true, motor: true, properti: false, heavy: false });

  // Catalog filter/sort state
  const [filterCabang, setFilterCabang] = useState("");
  const [filterKategori, setFilterKategori] = useState("");
  const [filterMerk, setFilterMerk] = useState("");
  const [sortOrder, setSortOrder] = useState<"lot_asc" | "price_asc" | "price_desc">("lot_asc");

  useEffect(() => {
    if (dbFeaturedLots && dbFeaturedLots.length > 0) {
      const mapped = dbFeaturedLots.map((dbLot: any) => {
        const image = getImageUrl(getAssetImages(dbLot.asset)[0]);
        const isLive = dbLot.status.toLowerCase() === "active";
        const isCancelled = dbLot.status.toLowerCase() === "cancelled";

        return {
          id: dbLot.id,
          lot_number: dbLot.lot_number || 0,
          title: dbLot.asset.title,
          grade: dbLot.asset.grade_engine || dbLot.asset.grade || undefined,
          grade_engine: dbLot.asset.grade_engine || undefined,
          grade_exterior: dbLot.asset.grade_exterior || undefined,
          grade_interior: dbLot.asset.grade_interior || undefined,
          transmission: dbLot.asset.transmission || undefined,
          odometer: dbLot.asset.odometer || undefined,
          police_number: dbLot.asset.police_number || undefined,
          fuel_type: dbLot.asset.fuel_type || undefined,
          year: dbLot.asset.year || undefined,
          stnk_date: dbLot.asset.stnk_date || undefined,
          notes: dbLot.asset.notes || undefined,
          scheduledAt: dbLot.session?.scheduled_at || undefined,
          deposit: "Rp 5.000.000",
          location: dbLot.session?.branch?.city || "Jakarta",
          cabang: dbLot.session?.branch?.name || "",
          kategori: dbLot.asset.category || "",
          merk: dbLot.asset.brand || "",
          hargaDasar: Number(dbLot.starting_price),
          status: isLive ? "Live" : "Akan Datang",
          isCancelled,
          timerKey: dbLot.id,
          timerLabel: dbLot.session ? new Date(dbLot.session.scheduled_at).toLocaleDateString("id-ID", { day: "numeric", month: "short" }) : "Segera",
          participants: 0,
          image,
          jenisLelang: "English Auction",
          featured: true,
        };
      });
      setLotsList(mapped);
    }
  }, [dbFeaturedLots]);


  // Derived filtered+sorted catalog lots
  const filteredCatalogLots = React.useMemo(() => {
    let list = lotsList.filter((l) => l.featured);
    if (filterCabang) list = list.filter((l) => l.cabang === filterCabang);
    if (filterKategori) list = list.filter((l) => l.kategori === filterKategori);
    if (filterMerk) list = list.filter((l) => l.merk === filterMerk);
    if (sortOrder === "lot_asc") list = [...list].sort((a, b) => a.lot_number - b.lot_number);
    else if (sortOrder === "price_asc") list = [...list].sort((a, b) => a.hargaDasar - b.hargaDasar);
    else if (sortOrder === "price_desc") list = [...list].sort((a, b) => b.hargaDasar - a.hargaDasar);
    return list;
  }, [lotsList, filterCabang, filterKategori, filterMerk, sortOrder]);

  // Unique values for filter dropdowns
  const cabangOptions = React.useMemo(() => [...new Set(lotsList.filter(l => l.featured && l.cabang).map(l => l.cabang))], [lotsList]);
  const kategoriOptions = React.useMemo(() => [...new Set(lotsList.filter(l => l.featured && l.kategori).map(l => l.kategori))], [lotsList]);
  const merkOptions = React.useMemo(() => [...new Set(lotsList.filter(l => l.featured && l.merk).map(l => l.merk))], [lotsList]);

  // --- STATE FOR FAQ ACCORDION ---
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  // --- STATE FOR MOBILE MENU ---
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // --- STATE FOR STICKY MOBILE CTA ---
  const [stickyVisible, setStickyVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show sticky CTA after scrolling down 400px
      if (window.scrollY > 400) {
        setStickyVisible(true);
      } else {
        setStickyVisible(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // --- COUNTDOWN TIMERS STATE (SECONDS) ---
  const [timers, setTimers] = useState<Record<string, number>>({
    avanza: 45296, // 12h 34m 56s
    hilux: 29722,  // 08h 15m 22s
    brio: 17110,   // 04h 45m 10s
    pajero: 22353, // 06h 12m 33s
    xenia: 9045,   // 02h 30m 45s
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setTimers((prev) => {
        const next: Record<string, number> = {};
        Object.keys(prev).forEach((k) => {
          next[k] = prev[k] > 0 ? prev[k] - 1 : 0;
        });
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      // 1. Read cookies for enabled auction types
      const cookieMap: Record<string, string> = {};
      document.cookie.split(";").forEach((c) => {
        const parts = c.trim().split("=");
        if (parts[0]) cookieMap[parts[0]] = parts[1] || "";
      });

      setEnabledTypes({
        english: cookieMap["feat_auction_english"] !== "false",
        dutch: cookieMap["feat_auction_dutch"] === "true",
        sealed: cookieMap["feat_auction_sealed"] === "true",
        timed: cookieMap["feat_auction_timed"] === "true",
        buynow: cookieMap["feat_auction_buynow"] === "true",
        group: cookieMap["feat_auction_group"] === "true",
      });

      setEnabledCategories({
        mobil: cookieMap["feat_category_mobil"] !== "false",
        motor: cookieMap["feat_category_motor"] !== "false",
        properti: cookieMap["feat_category_properti"] === "true",
        heavy: cookieMap["feat_category_heavy"] === "true",
      });

      // 2. Read user titip-jual assets from localStorage
      const stored = localStorage.getItem("provider_assets");
      if (stored) {
        try {
          const list = JSON.parse(stored);
          const parsed = list.map((item: any, index: number) => ({
            id: item.id || `stored-${index}`,
            title: item.name,
            grade: "A",
            location: "Jakarta Barat",
            hargaDasar: item.limitPrice,
            status: "Live",
            timerKey: `stored-${index}`,
            participants: 12,
            image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBcS6tHKZpYYGzVd6NalL2sAwQ1i-oYWHGMg49cGf4YAschTELEp7pAOrezDdK7olQ3ndB21B1myenWUoLPNrW75NL_EfzKrRBazlhfxoTA0PSVXEjPFdDGaDNqxHZH3tptfatQgF6mTOgwwPZIcqeUSg_bnrWYV8RJ-Slr6Z2ltr1p5HPZjgZq16T_SVGJiQS2g7kuBo3hMXsW6tXG2JrTCu7N6moS_dGbowWE0j21z4vHv3DsDFv7XME5r0MDFozTzH0n9ug2sHhp",
            jenisLelang: item.jenisLelang || "Lelang Terbuka",
            featured: false,
          }));
          setLotsList([...initialLots, ...parsed]);

          // Set temporary timer for stored lots if live
          setTimers((prev) => {
            const next = { ...prev };
            parsed.forEach((p: any) => {
              next[p.timerKey] = 3600 * 5; // 5 hours default
            });
            return next;
          });
        } catch (e) {}
      }
    }
  }, []);

  // Helper to format remaining seconds as HH:MM:SS
  const formatTime = (totalSeconds: number) => {
    if (totalSeconds <= 0) return "00:00:00";
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return [hrs, mins, secs]
      .map((val) => val.toString().padStart(2, "0"))
      .join(":");
  };

  const handleMobileMenuClick = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/katalog?search=${encodeURIComponent(searchQuery)}`);
  };

  const handleActionClick = (actionName: string) => {
    const action = actionName.toLowerCase();
    if (action.includes("daftar") || action.includes("registrasi")) {
      router.push("/register");
    } else if (action.includes("masuk") || action.includes("portal")) {
      router.push("/login");
    } else if (action.includes("katalog") || action.includes("aktif") || action.includes("kategori") || action.includes("semua lelang")) {
      router.push("/katalog");
    } else if (action.includes("tawar") || action.includes("bid")) {
      router.push("/katalog/1"); // Redirect to the demo Avanza detail page
    } else if (action.includes("syarat")) {
      router.push("/syarat");
    } else if (action.includes("ekyc")) {
      router.push("/ekyc/upload");
    } else if (action.includes("provider")) {
      router.push("/register");
    } else if (action.includes("kontak") || action.includes("hubungi")) {
      router.push("/kontak");
    } else {
      toast.info(`Fitur "${actionName}" sedang disiapkan.`);
    }
  };

  const enabledCount = Object.values(enabledTypes).filter(Boolean).length;

  return (
    <>


      <Header />

      <main>
        {/* ========== HERO SECTION ========== */}
        <section className="hero-gradient relative overflow-hidden pt-10 pb-20 md:pb-28 lg:pb-32">
          <div className="max-w-container-max mx-auto px-margin-page">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
              {/* Left Content */}
              <div className="flex flex-col gap-5 animate-fade-in-up">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-secondary-fixed text-on-secondary-fixed rounded-full text-badge-text font-bold w-fit">
                  <span className="material-symbols-outlined text-sm filled">
                    verified
                  </span>
                  Trusted Digital Auction di Indonesia
                </div>

                <h1 className="text-heading-3xl md:text-[3.25rem] md:leading-[1.08] font-extrabold text-on-background tracking-tight font-serif">
                  Lelang Digital <span className="text-primary">Terpercaya</span>,
                  <br className="hidden sm:block" />
                  Cepat &amp; Transparan
                </h1>

                <p className="text-body-lg text-on-surface-variant max-w-md leading-relaxed">
                  Dapatkan kendaraan impian dan aset berkualitas melalui sistem lelang
                  BIDKU yang aman, terintegrasi secara nasional, dan mudah diikuti.
                </p>

                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    onClick={() => handleActionClick("Lihat Lelang Aktif")}
                    className="px-7 py-3.5 bg-premium text-on-premium rounded-xl font-bold text-body-md btn-press btn-shine transition-all shadow-lg shadow-premium/15 hover:bg-premium/85 flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-lg">gavel</span>
                    Lihat Lelang Aktif
                  </button>
                  <a
                    href="#how-it-works"
                    className="px-7 py-3.5 border-2 border-premium/20 text-premium rounded-xl font-bold text-body-md btn-press transition-all hover:border-premium hover:bg-premium/5 flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-lg">
                      play_circle
                    </span>
                    Cara Kerja
                  </a>
                </div>

                {/* Trust badges - inline */}
                <div className="flex flex-nowrap items-center gap-2 sm:gap-4 pt-4 w-full overflow-hidden">
                  <div className="flex items-center gap-1 sm:gap-1.5 whitespace-nowrap">
                    <span className="material-symbols-outlined text-xs sm:text-sm text-primary filled">
                      verified
                    </span>
                    <span className="text-[10px] sm:text-body-sm font-medium text-on-surface-variant">
                      Aman &amp; Terpercaya
                    </span>
                  </div>
                  <div className="w-px h-4 sm:h-5 bg-outline-variant/30 flex-shrink-0"></div>
                  <div className="flex items-center gap-1 sm:gap-1.5 whitespace-nowrap">
                    <span className="material-symbols-outlined text-xs sm:text-sm text-secondary filled">
                      bolt
                    </span>
                    <span className="text-[10px] sm:text-body-sm font-medium text-on-surface-variant">
                      Proses Cepat
                    </span>
                  </div>
                  <div className="w-px h-4 sm:h-5 bg-outline-variant/30 flex-shrink-0"></div>
                  <div className="flex items-center gap-1 sm:gap-1.5 whitespace-nowrap">
                    <span className="material-symbols-outlined text-xs sm:text-sm text-primary filled">
                      support_agent
                    </span>
                    <span className="text-[10px] sm:text-body-sm font-medium text-on-surface-variant">
                      Dukungan 24/7
                    </span>
                  </div>
                </div>
              </div>

              {/* Right - Hero Image */}
              <div className="relative lg:block">
                <div className="rounded-2xl overflow-hidden shadow-2xl border-4 border-white/80 relative">
                  <img
                    className="w-full h-auto object-cover aspect-[4/3] lg:aspect-[4/3]"
                    alt="Deretan mobil lelang mewah yang elegan"
                    src="/hero_cars_row.png"
                  />
                  {/* Floating badge */}
                  <div className="absolute bottom-4 left-4 bg-white/70 backdrop-blur-md rounded-xl shadow-xl border border-white/40 p-3 flex items-center gap-3 animate-pulse-soft">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isLiveAuctionRunning ? "bg-[#178630]" : "bg-neutral-variant"}`}>
                      <span className="material-symbols-outlined text-white filled">
                        {isLiveAuctionRunning ? "bolt" : "do_not_disturb_on"}
                      </span>
                    </div>
                    <div>
                      <p className="text-body-sm font-medium text-outline">
                        Live Auction
                      </p>
                      <p className={`text-heading-md font-bold ${isLiveAuctionRunning ? "text-[#178630]" : "text-outline"}`}>
                        {isLiveAuctionRunning ? "Sedang Berlangsung" : "Sedang Tidak Ada"}
                      </p>
                    </div>
                  </div>
                  {/* Participant count badge */}
                  <div className="absolute top-3 right-3 bg-white/70 backdrop-blur-md border border-white/30 rounded-full px-3 py-1.5 shadow-lg flex items-center gap-1.5 text-body-sm font-medium">
                    <span className="material-symbols-outlined text-primary text-sm filled">
                      group
                    </span>
                    1.240+ Peserta
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========== STATISTICS SECTION ========== */}
        <section className="py-6 md:py-8 bg-surface-container-low/30 border-b border-outline-variant/10">
          <div className="max-w-container-max mx-auto px-margin-page">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              <div className="stat-card text-center p-4 rounded-xl bg-white/40 backdrop-blur-md border border-white/60 shadow-sm transition-all duration-500 hover:-translate-y-1">
                <p className="stat-number text-primary">
                  <AnimatedCounter target={platformStats?.total_lots_sold || 1200} suffix="+" />
                </p>
                <p className="text-body-sm font-medium text-outline mt-0.5">
                  Lot Terjual
                </p>
              </div>
              <div className="stat-card text-center p-4 rounded-xl bg-white/40 backdrop-blur-md border border-white/60 shadow-sm transition-all duration-500 hover:-translate-y-1">
                <p className="stat-number text-primary">
                  <AnimatedCounter target={platformStats?.total_users || 3400} suffix="+" />
                </p>
                <p className="text-body-sm font-medium text-outline mt-0.5">
                  Peserta Terdaftar
                </p>
              </div>
              <div className="stat-card text-center p-4 rounded-xl bg-white/40 backdrop-blur-md border border-white/60 shadow-sm transition-all duration-500 hover:-translate-y-1">
                <p className="stat-number text-primary">
                  <AnimatedCounter target={platformStats?.total_sales ? Math.floor(platformStats.total_sales / 1000000) : 120000} prefix="Rp " suffix="Jt+" />
                </p>
                <p className="text-body-sm font-medium text-outline mt-0.5">
                  Nilai Transaksi
                </p>
              </div>
              <div className="stat-card text-center p-4 rounded-xl bg-white/40 backdrop-blur-md border border-white/60 shadow-sm transition-all duration-500 hover:-translate-y-1">
                <p className="stat-number text-primary">
                  <AnimatedCounter target={30} suffix="+" />
                </p>
                <p className="text-body-sm font-medium text-outline mt-0.5">
                  Kota Terlayani
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ========== TRUST INDICATORS ========== */}
        <section className="py-10 md:py-14 bg-surface-container-low/30">
          <div className="max-w-container-max mx-auto px-margin-page">
            <div className="text-center mb-10">
              <h2 className="text-heading-2xl font-bold text-on-background font-serif">
                Mengapa Memilih BIDKU?
              </h2>
              <p className="text-body-lg text-on-surface-variant mt-2">
                Keamanan dan kenyamanan Anda adalah prioritas kami
              </p>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              <div className="bg-white/50 backdrop-blur-md p-5 md:p-6 rounded-2xl border border-white/60 text-center hover:border-primary/50 transition-all shadow-sm">
                <div className="w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                  <img src="/Trusted.gif" alt="Transaksi Aman" className="w-12 h-12 object-contain" />
                </div>
                <h4 className="font-bold text-body-md">Transaksi Aman</h4>
                <p className="text-body-sm text-on-surface-variant mt-1">
                  Sistem terenkripsi &amp; verifikasi eKYC
                </p>
              </div>
              <div className="bg-white/50 backdrop-blur-md p-5 md:p-6 rounded-2xl border border-white/60 text-center hover:border-primary/50 transition-all shadow-sm">
                <div className="w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                  <img src="/verified.gif" alt="Penjual Terverifikasi" className="w-12 h-12 object-contain" />
                </div>
                <h4 className="font-bold text-body-md">Penjual Terverifikasi</h4>
                <p className="text-body-sm text-on-surface-variant mt-1">
                  Semua unit melalui inspeksi ketat
                </p>
              </div>
              <div className="bg-white/50 backdrop-blur-md p-5 md:p-6 rounded-2xl border border-white/60 text-center hover:border-primary/50 transition-all shadow-sm">
                <div className="w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                  <img src="/Transparant.gif" alt="Proses Transparan" className="w-12 h-12 object-contain" />
                </div>
                <h4 className="font-bold text-body-md">Proses Transparan</h4>
                <p className="text-body-sm text-on-surface-variant mt-1">
                  Semua bid &amp; harga terbuka untuk umum
                </p>
              </div>
              <div className="bg-white/50 backdrop-blur-md p-5 md:p-6 rounded-2xl border border-white/60 text-center hover:border-primary/50 transition-all shadow-sm">
                <div className="w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                  <img src="/support.gif" alt="Dukungan 24/7" className="w-12 h-12 object-contain" />
                </div>
                <h4 className="font-bold text-body-md">Dukungan 24/7</h4>
                <p className="text-body-sm text-on-surface-variant mt-1">
                  Tim siap membantu Anda setiap saat
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ========== CATEGORIES SECTION ========== */}
        <section id="categories" className="py-12 md:py-16 bg-surface-container-low/30">
          <div className="max-w-container-max mx-auto px-margin-page">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
              <div>
                <h2 className="text-heading-2xl font-bold text-on-background font-serif">
                  Kategori Lelang
                </h2>
                <p className="text-body-lg text-on-surface-variant mt-1">
                  Pilih kategori aset yang Anda cari
                </p>
              </div>
              <Link
                href="/katalog"
                className="text-primary font-bold flex items-center gap-1 hover:underline text-body-md"
              >
                Lihat Semua
                <span className="material-symbols-outlined text-sm">chevron_right</span>
              </Link>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Mobil */}
              {enabledCategories.mobil && (
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    router.push('/katalog?category=MOBIL');
                  }}
                  className="group relative aspect-[4/3] rounded-2xl overflow-hidden shadow-md"
                >
                  <img
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    alt="Mobil"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAfO6fRTBCfJVz6MUYCEQuH3UDV81F-F4DY_MQbOx18fvPHR0qu3z6dqm-XIHHrYpEsl-LUvyzzVw_rp9xw2ghrTUmUTz3239DZ7OUAAVjaIOedVl6K5emlIYjlz81T1VKKI8PugGBlfIwam3VPYHuUMUCCxIEBfN-bJXqFfvP6GPBQ8SRQT-HbBIgrbsbbvxtc6acdLRGMX5q5ScguyKNiTVPgNQdpCLmt1lOjJz8couih2BWAfseY00DK7axG4bWw30rAHVe6njfB"
                  />
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        "linear-gradient(to top, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0.2) 60%, transparent 100%)",
                    }}
                  ></div>
                  <div className="absolute bottom-3 left-3 right-3 bg-black/45 backdrop-blur-md border border-white/10 rounded-xl p-3 text-white">
                    <h4 className="font-bold text-white text-body-md truncate">
                      Mobil Penumpang
                    </h4>
                    <p className="text-white/80 text-body-sm">{categoryStats?.MOBIL || 0} Lot Tersedia</p>
                  </div>
                </a>
              )}
              {/* Motor */}
              {enabledCategories.motor && (
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    router.push('/katalog?category=MOTOR');
                  }}
                  className="group relative aspect-[4/3] rounded-2xl overflow-hidden shadow-md"
                >
                  <img
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    alt="Motor"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuC31zy45WQwhdCOMrDzZCm2is66KzQ3Ef-59eRlRHkxzGC5DpJj5VKLOvc3lGiQG68JH60S9yYbjI2JAl1ms-Imx6t9eaDfxqxFmaBKRys70HjrcZ5YnCiwuv-yCKaSrD7A28rXssA0Ak7J2_CZ73L4rSL6BEMP3BALcG7uqjaShWLmgCP7TdrYqffviwAtHoJO4H8Nbu1F3fC2iQnLgvWmXu_oGP3B1DIug9vTfVnGi75xhMNL1Ybhm-iHUPaTCbQVBDSpOveGl1u6"
                  />
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        "linear-gradient(to top, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0.2) 60%, transparent 100%)",
                    }}
                  ></div>
                  <div className="absolute bottom-3 left-3 right-3 bg-black/45 backdrop-blur-md border border-white/10 rounded-xl p-3 text-white">
                    <h4 className="font-bold text-white text-body-md truncate">Sepeda Motor</h4>
                    <p className="text-white/80 text-body-sm">{categoryStats?.MOTOR || 0} Lot Tersedia</p>
                  </div>
                </a>
              )}
              {/* Komersial */}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  toast.info("Kategori lelang Alat Berat akan segera hadir!");
                }}
                className="group relative aspect-[4/3] rounded-2xl overflow-hidden shadow-md opacity-75 hover:opacity-90 transition-opacity"
              >
                <img
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 grayscale"
                  alt="Alat Berat"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAs9bK1pYSqW-cfuVQ0j_xaNa18g0-LSKMlqXs886QplfdQJMpEpP1QMActoH4cjgCfElrjUmVeKBxZVQVERgNfc2zSLCVv2UcnDiN6IO_QCfIakOyYLKtnmAgPKmKsWBa1ORjMrEM06UyeALxwJt3IrYZgbWJlt-xUYGT82U7KK4daYCRCfpOkvmNGrixxaYWSqkLiku5XuFG82BcpZl5LPtaAHB0dIz4IU5kzkOoMJYeEbJFBusmFinqTtPOlivVZ31ihUEJH1e64"
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(to top, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0.2) 60%, transparent 100%)",
                  }}
                ></div>
                <div className="absolute bottom-3 left-3 right-3 bg-black/45 backdrop-blur-md border border-white/10 rounded-xl p-3 text-white">
                  <h4 className="font-bold text-white text-body-md truncate">Alat Berat</h4>
                  <p className="text-white/80 text-body-sm font-semibold text-amber-400">Segera Hadir</p>
                </div>
              </a>
              {/* Properti */}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  toast.info("Kategori lelang Properti akan segera hadir!");
                }}
                className="group relative aspect-[4/3] rounded-2xl overflow-hidden shadow-md opacity-75 hover:opacity-90 transition-opacity"
              >
                <img
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 grayscale"
                  alt="Properti"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDAKe_8vmxw29JLRtQYJu9kIj9SSxejc7c-x8FZ9yvwAcraOjYJQWtAun90V_9mWhx5Fc0yj7qi226wff8XoO-B8zS94kC8jRdGIB8O9bsH7Nhr0u4sJZGBdX9R6-JALgUiUFbI_NW_vN-QiNbVb_WGRUuassF6O_AjU9RuREtTqPZI9hvaWxO6IxqUzevGmKDWDbe9XRHS-qXcH0eH4c1lTgfR2ZHLmTZvUQbPf2dM8WY2ksd1kXL4JpiipvA98Fs_rPDJFniNHLto"
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(to top, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0.2) 60%, transparent 100%)",
                  }}
                ></div>
                <div className="absolute bottom-3 left-3 right-3 bg-black/45 backdrop-blur-md border border-white/10 rounded-xl p-3 text-white">
                  <h4 className="font-bold text-white text-body-md truncate">Properti</h4>
                  <p className="text-white/80 text-body-sm font-semibold text-amber-400">Segera Hadir</p>
                </div>
              </a>
              {/* Barang Sehari-hari */}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  toast.info("Kategori lelang Barang akan segera hadir!");
                }}
                className="group relative aspect-[4/3] rounded-2xl overflow-hidden shadow-md opacity-75 hover:opacity-90 transition-opacity"
              >
                <img
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 grayscale"
                  alt="Barang Sehari-hari"
                  src="https://images.unsplash.com/photo-1584433144859-1fc3ab64a957?auto=format&fit=crop&q=80&w=600"
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(to top, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0.2) 60%, transparent 100%)",
                  }}
                ></div>
                <div className="absolute bottom-3 left-3 right-3 bg-black/45 backdrop-blur-md border border-white/10 rounded-xl p-3 text-white">
                  <h4 className="font-bold text-white text-body-md truncate">Barang</h4>
                  <p className="text-white/80 text-body-sm font-semibold text-amber-400">Segera Hadir</p>
                </div>
              </a>
            </div>
          </div>
        </section>

        {/* ========== LIVE AUCTIONS GRID ========== */}
        <section id="live-auctions" className="py-12 md:py-16 bg-surface-container-low/30">
          <div className="max-w-container-max mx-auto px-margin-page">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-error-container/20 text-error rounded-full text-badge-text font-bold mb-2">
                  <span className="material-symbols-outlined text-sm filled text-error">
                    circle
                  </span>
                  LIVE NOW
                </div>
                <h2 className="text-heading-2xl font-bold text-on-background font-serif">
                  Lelang Aktif
                </h2>
                <p className="text-body-lg text-on-surface-variant mt-1">
                  Penawaran terbaik dari berbagai kategori yang sedang berlangsung
                </p>
              </div>
              <Link
                href="/katalog"
                className="text-primary font-bold flex items-center gap-1 hover:underline text-body-md"
              >
                Lihat Semua
                <span className="material-symbols-outlined text-sm">chevron_right</span>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {lotsList.filter((l) => l.status === "Live").slice(0, 4).map((lot) => (
                <LotCard
                  key={lot.id}
                  lot={lot}
                />
              ))}
            </div>
          </div>
        </section>

        {/* ========== FEATURED AUCTIONS ========== */}
        <section className="py-12 md:py-16 bg-surface-container-low/30 border-t border-outline-variant/10">
          <div className="max-w-container-max mx-auto px-margin-page">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-6">
              <div>
                <h2 className="text-heading-2xl font-bold text-on-background font-serif">
                  Katalog
                </h2>
                <p className="text-body-lg text-on-surface-variant mt-1">
                  Daftar aset lelang terbaru
                </p>
              </div>
              <Link
                href="/katalog"
                className="text-primary font-bold flex items-center gap-1 hover:underline text-body-md"
              >
                Lihat Semua
                <span className="material-symbols-outlined text-sm">chevron_right</span>
              </Link>
            </div>

            {/* Filter & Sort Bar */}
            <div className="flex flex-wrap gap-3 mb-6 items-center">
              {cabangOptions.length > 0 && (
                <select
                  value={filterCabang}
                  onChange={(e) => setFilterCabang(e.target.value)}
                  className="text-body-sm border border-outline-variant/30 rounded-lg px-3 py-2 bg-white/70 backdrop-blur-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="">Semua Cabang</option>
                  {cabangOptions.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              )}
              {kategoriOptions.length > 0 && (
                <select
                  value={filterKategori}
                  onChange={(e) => setFilterKategori(e.target.value)}
                  className="text-body-sm border border-outline-variant/30 rounded-lg px-3 py-2 bg-white/70 backdrop-blur-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="">Semua Kategori</option>
                  {kategoriOptions.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              )}
              {merkOptions.length > 0 && (
                <select
                  value={filterMerk}
                  onChange={(e) => setFilterMerk(e.target.value)}
                  className="text-body-sm border border-outline-variant/30 rounded-lg px-3 py-2 bg-white/70 backdrop-blur-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="">Semua Merk</option>
                  {merkOptions.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              )}
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as "lot_asc" | "price_asc" | "price_desc")}
                className="text-body-sm border border-outline-variant/30 rounded-lg px-3 py-2 bg-white/70 backdrop-blur-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 ml-auto"
              >
                <option value="lot_asc">Urutkan: No Lot ↑</option>
                <option value="price_asc">Harga: Terendah</option>
                <option value="price_desc">Harga: Tertinggi</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {filteredCatalogLots.slice(0, 8).map((lot) => (
                <LotCard
                  key={lot.id}
                  lot={lot}
                />
              ))}
              {filteredCatalogLots.length === 0 && (
                <div className="col-span-4 py-16 text-center text-on-surface-variant">
                  <span className="material-symbols-outlined text-5xl mb-3 block">inventory_2</span>
                  <p className="text-body-md">Tidak ada lot yang cocok dengan filter ini.</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ========== SUB-LIST: ENGLISH AUCTION ========== */}
        {enabledCount > 1 && enabledTypes.english && (
          <section className="py-12 md:py-16 bg-surface-container-low/30 border-t border-outline-variant/10">
            <div className="max-w-container-max mx-auto px-margin-page">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-badge-text font-bold mb-2">
                    <span className="material-symbols-outlined text-sm filled">
                      gavel
                    </span>
                    ENGLISH AUCTION
                  </div>
                  <h2 className="text-heading-2xl font-bold text-on-background font-serif">
                    English Auction
                  </h2>
                  <p className="text-body-lg text-on-surface-variant mt-1">
                    Sistem lelang terbuka dengan penawaran harga yang terus naik hingga batas waktu berakhir
                  </p>
                </div>
                <Link
                  href="/katalog"
                  className="text-primary font-bold flex items-center gap-1 hover:underline text-body-md"
                >
                  Lihat Semua
                  <span className="material-symbols-outlined text-sm">chevron_right</span>
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {lotsList.filter((l) => l.jenisLelang === "English Auction").slice(0, 4).map((lot) => (
                  <LotCard
                    key={lot.id}
                    lot={lot}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ========== SUB-LIST: DUTCH AUCTION ========== */}
        {enabledCount > 1 && enabledTypes.dutch && (
          <section className="py-12 md:py-16 bg-surface-container-low/30 border-t border-outline-variant/10">
            <div className="max-w-container-max mx-auto px-margin-page">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-error-container/20 text-error rounded-full text-badge-text font-bold mb-2">
                    <span className="material-symbols-outlined text-sm filled">
                      trending_down
                    </span>
                    DUTCH AUCTION
                  </div>
                  <h2 className="text-heading-2xl font-bold text-on-background font-serif">
                    Dutch Auction
                  </h2>
                  <p className="text-body-lg text-on-surface-variant mt-1">
                    Lelang dengan penawaran harga yang terus turun berkala sampai ada penawar pertama yang setuju
                  </p>
                </div>
                <Link
                  href="/katalog"
                  className="text-primary font-bold flex items-center gap-1 hover:underline text-body-md"
                >
                  Lihat Semua
                  <span className="material-symbols-outlined text-sm">chevron_right</span>
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {lotsList.filter((l) => l.jenisLelang === "Dutch Auction").slice(0, 4).map((lot) => (
                  <LotCard
                    key={lot.id}
                    lot={lot}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ========== SUB-LIST: SEALED BID ========== */}
        {enabledCount > 1 && enabledTypes.sealed && (
          <section className="py-12 md:py-16 bg-surface-container-low/30 border-t border-outline-variant/10">
            <div className="max-w-container-max mx-auto px-margin-page">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-secondary/15 text-secondary rounded-full text-badge-text font-bold mb-2">
                    <span className="material-symbols-outlined text-sm filled">
                      lock
                    </span>
                    SEALED-BID
                  </div>
                  <h2 className="text-heading-2xl font-bold text-on-background font-serif">
                    Sealed-Bid
                  </h2>
                  <p className="text-body-lg text-on-surface-variant mt-1">
                    Masukkan penawaran terbaik Anda secara tertutup tanpa terlihat oleh peserta lain
                  </p>
                </div>
                <Link
                  href="/katalog"
                  className="text-primary font-bold flex items-center gap-1 hover:underline text-body-md"
                >
                  Lihat Semua
                  <span className="material-symbols-outlined text-sm">chevron_right</span>
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {lotsList.filter((l) => l.jenisLelang === "Sealed-Bid").slice(0, 4).map((lot) => (
                  <LotCard
                    key={lot.id}
                    lot={lot}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ========== SUB-LIST: TIMED AUCTION ========== */}
        {enabledCount > 1 && enabledTypes.timed && (
          <section className="py-12 md:py-16 bg-surface-container-low/30 border-t border-outline-variant/10">
            <div className="max-w-container-max mx-auto px-margin-page">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 text-amber-600 rounded-full text-badge-text font-bold mb-2">
                    <span className="material-symbols-outlined text-sm filled">
                      schedule
                    </span>
                    TIMED AUCTION
                  </div>
                  <h2 className="text-heading-2xl font-bold text-on-background font-serif">
                    Timed Auction
                  </h2>
                  <p className="text-body-lg text-on-surface-variant mt-1">
                    Lelang dengan penawaran dalam batas waktu tertentu tanpa adanya juru lelang fisik
                  </p>
                </div>
                <Link
                  href="/katalog"
                  className="text-primary font-bold flex items-center gap-1 hover:underline text-body-md"
                >
                  Lihat Semua
                  <span className="material-symbols-outlined text-sm">chevron_right</span>
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {lotsList.filter((l) => l.jenisLelang === "Timed Auction").slice(0, 4).map((lot) => (
                  <LotCard
                    key={lot.id}
                    lot={lot}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ========== SUB-LIST: BUY NOW + AUCTION ========== */}
        {enabledCount > 1 && enabledTypes.buynow && (
          <section className="py-12 md:py-16 bg-surface-container-low/30 border-t border-outline-variant/10">
            <div className="max-w-container-max mx-auto px-margin-page">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-600 rounded-full text-badge-text font-bold mb-2">
                    <span className="material-symbols-outlined text-sm filled">
                      shopping_bag
                    </span>
                    BUY NOW + AUCTION
                  </div>
                  <h2 className="text-heading-2xl font-bold text-on-background font-serif">
                    Buy Now + Auction
                  </h2>
                  <p className="text-body-lg text-on-surface-variant mt-1">
                    Beli langsung unit secara instan dengan harga tetap atau ikuti proses bidding biasa
                  </p>
                </div>
                <Link
                  href="/katalog"
                  className="text-primary font-bold flex items-center gap-1 hover:underline text-body-md"
                >
                  Lihat Semua
                  <span className="material-symbols-outlined text-sm">chevron_right</span>
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {lotsList.filter((l) => l.jenisLelang === "Buy Now + Auction").slice(0, 4).map((lot) => (
                  <LotCard
                    key={lot.id}
                    lot={lot}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ========== SUB-LIST: GROUP/BUNDLE ========== */}
        {enabledCount > 1 && enabledTypes.group && (
          <section className="py-12 md:py-16 bg-surface-container-low/30 border-t border-outline-variant/10">
            <div className="max-w-container-max mx-auto px-margin-page">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-500/10 text-teal-600 rounded-full text-badge-text font-bold mb-2">
                    <span className="material-symbols-outlined text-sm filled">
                      inventory_2
                    </span>
                    GROUP/BUNDLE
                  </div>
                  <h2 className="text-heading-2xl font-bold text-on-background font-serif">
                    Group/Bundle
                  </h2>
                  <p className="text-body-lg text-on-surface-variant mt-1">
                    Dapatkan penawaran paket grosir atau sekumpulan aset sekaligus dalam satu lot
                  </p>
                </div>
                <Link
                  href="/katalog"
                  className="text-primary font-bold flex items-center gap-1 hover:underline text-body-md"
                >
                  Lihat Semua
                  <span className="material-symbols-outlined text-sm">chevron_right</span>
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {lotsList.filter((l) => l.jenisLelang === "Group/Bundle").slice(0, 4).map((lot) => (
                  <LotCard
                    key={lot.id}
                    lot={lot}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ========== UPCOMING AUCTION TYPES ========== */}
        {(!enabledTypes.dutch || !enabledTypes.sealed || !enabledTypes.timed || !enabledTypes.buynow || !enabledTypes.group) && (
          <section className="py-12 md:py-16 bg-surface-container-low/30 border-t border-outline-variant/10">
            <div className="max-w-container-max mx-auto px-margin-page">
              <div className="text-center mb-8">
                <h2 className="text-heading-2xl font-bold text-on-background font-serif">
                  Fitur Lelang Mendatang
                </h2>
                <p className="text-body-lg text-on-surface-variant mt-1">
                  Kami terus berinovasi. Berikut adalah jenis lelang yang akan segera hadir di platform kami.
                </p>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2 sm:gap-4">
                {!enabledTypes.dutch && (
                  <div className="relative overflow-hidden rounded-2xl shadow-sm text-center grayscale opacity-80 hover:grayscale-0 hover:opacity-100 transition-all min-h-[200px] flex flex-col justify-end group cursor-pointer border border-white/20">
                    <div className="absolute inset-0 bg-cover bg-center group-hover:scale-110 transition-transform duration-500" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=600')" }}></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-black/20"></div>
                    <div className="relative z-10 text-white flex flex-col items-center p-5">
                      <span className="material-symbols-outlined text-4xl mb-2 text-white">trending_down</span>
                      <h4 className="font-bold text-body-md mb-1 text-white">Dutch Auction</h4>
                      <p className="text-body-sm text-white/80 mb-3">Harga turun berkala hingga deal.</p>
                      <span className="px-3 py-1 bg-white/20 backdrop-blur-md border border-white/30 text-white text-xs font-bold rounded-full">Segera Hadir</span>
                    </div>
                  </div>
                )}
                {!enabledTypes.sealed && (
                  <div className="relative overflow-hidden rounded-2xl shadow-sm text-center grayscale opacity-80 hover:grayscale-0 hover:opacity-100 transition-all min-h-[200px] flex flex-col justify-end group cursor-pointer border border-white/20">
                    <div className="absolute inset-0 bg-cover bg-center group-hover:scale-110 transition-transform duration-500" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1596526131083-e8c633c948d2?q=80&w=600')" }}></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-black/20"></div>
                    <div className="relative z-10 text-white flex flex-col items-center p-5">
                      <span className="material-symbols-outlined text-4xl mb-2 text-white">lock</span>
                      <h4 className="font-bold text-body-md mb-1 text-white">Sealed-Bid</h4>
                      <p className="text-body-sm text-white/80 mb-3">Penawaran tertutup & rahasia.</p>
                      <span className="px-3 py-1 bg-white/20 backdrop-blur-md border border-white/30 text-white text-xs font-bold rounded-full">Segera Hadir</span>
                    </div>
                  </div>
                )}
                {!enabledTypes.timed && (
                  <div className="relative overflow-hidden rounded-2xl shadow-sm text-center grayscale opacity-80 hover:grayscale-0 hover:opacity-100 transition-all min-h-[200px] flex flex-col justify-end group cursor-pointer border border-white/20">
                    <div className="absolute inset-0 bg-cover bg-center group-hover:scale-110 transition-transform duration-500" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1508962914676-134849a727f0?q=80&w=600')" }}></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-black/20"></div>
                    <div className="relative z-10 text-white flex flex-col items-center p-5">
                      <span className="material-symbols-outlined text-4xl mb-2 text-white">schedule</span>
                      <h4 className="font-bold text-body-md mb-1 text-white">Timed Auction</h4>
                      <p className="text-body-sm text-white/80 mb-3">Lelang dengan batas waktu.</p>
                      <span className="px-3 py-1 bg-white/20 backdrop-blur-md border border-white/30 text-white text-xs font-bold rounded-full">Segera Hadir</span>
                    </div>
                  </div>
                )}
                {!enabledTypes.buynow && (
                  <div className="relative overflow-hidden rounded-2xl shadow-sm text-center grayscale opacity-80 hover:grayscale-0 hover:opacity-100 transition-all min-h-[200px] flex flex-col justify-end group cursor-pointer border border-white/20">
                    <div className="absolute inset-0 bg-cover bg-center group-hover:scale-110 transition-transform duration-500" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=600')" }}></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-black/20"></div>
                    <div className="relative z-10 text-white flex flex-col items-center p-5">
                      <span className="material-symbols-outlined text-4xl mb-2 text-white">shopping_bag</span>
                      <h4 className="font-bold text-body-md mb-1 text-white">Buy Now</h4>
                      <p className="text-body-sm text-white/80 mb-3">Beli instan tanpa proses bidding.</p>
                      <span className="px-3 py-1 bg-white/20 backdrop-blur-md border border-white/30 text-white text-xs font-bold rounded-full">Segera Hadir</span>
                    </div>
                  </div>
                )}
                {!enabledTypes.group && (
                  <div className="relative overflow-hidden rounded-2xl shadow-sm text-center grayscale opacity-80 hover:grayscale-0 hover:opacity-100 transition-all min-h-[200px] flex flex-col justify-end group cursor-pointer border border-white/20">
                    <div className="absolute inset-0 bg-cover bg-center group-hover:scale-110 transition-transform duration-500" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=600')" }}></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-black/20"></div>
                    <div className="relative z-10 text-white flex flex-col items-center p-5">
                      <span className="material-symbols-outlined text-4xl mb-2 text-white">inventory_2</span>
                      <h4 className="font-bold text-body-md mb-1 text-white">Group/Bundle</h4>
                      <p className="text-body-sm text-white/80 mb-3">Penawaran paket aset sekaligus.</p>
                      <span className="px-3 py-1 bg-white/20 backdrop-blur-md border border-white/30 text-white text-xs font-bold rounded-full">Segera Hadir</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* ========== HOW IT WORKS - 7 STEPS ========== */}
        <section
          id="how-it-works"
          className="py-12 md:py-16 bg-surface-container-low/30"
        >
          <div className="max-w-container-max mx-auto px-margin-page">
            <div className="text-center mb-12">
              <h2 className="text-heading-2xl font-bold text-on-background font-serif">
                Cara Mudah Ikut Lelang
              </h2>
              <p className="text-body-lg text-on-surface-variant mt-2 max-w-2xl mx-auto">
                Hanya dengan 7 langkah mudah, unit impian Anda bisa segera dibawa pulang
              </p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-5">
              {/* Step 1: Register */}
              <div className="bg-white/50 backdrop-blur-md p-6 rounded-2xl border border-white/60 shadow-sm hover:shadow-md transition-all text-center group hover:border-primary/50">
                <div className="w-14 h-14 mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <img src="/daftar.gif" alt="Daftar Akun" className="w-14 h-14 object-contain" />
                </div>
                <h4 className="font-bold text-body-md mb-2">1. Daftar Akun</h4>
                <p className="text-body-sm text-on-surface-variant">
                  Buat akun BIDKU dengan email dan nomor telepon aktif Anda
                </p>
              </div>

              {/* Step 2: Verification */}
              <div className="bg-white/50 backdrop-blur-md p-6 rounded-2xl border border-white/60 shadow-sm hover:shadow-md transition-all text-center group hover:border-primary/50">
                <div className="w-14 h-14 mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <img src="/id-card.gif" alt="Verifikasi Identitas" className="w-14 h-14 object-contain" />
                </div>
                <h4 className="font-bold text-body-md mb-2">2. Verifikasi Identitas</h4>
                <p className="text-body-sm text-on-surface-variant">
                  Lengkapi verifikasi eKYC resmi untuk keamanan akun Anda
                </p>
              </div>

              {/* Step 3: Deposit */}
              <div className="bg-white/50 backdrop-blur-md p-6 rounded-2xl border border-white/60 shadow-sm hover:shadow-md transition-all text-center group hover:border-primary/50">
                <div className="w-14 h-14 mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <img src="/deposit.gif" alt="Deposit Dana" className="w-14 h-14 object-contain" />
                </div>
                <h4 className="font-bold text-body-md mb-2">3. Deposit Dana</h4>
                <p className="text-body-sm text-on-surface-variant">
                  Siapkan deposit sebagai jaminan untuk mengikuti sesi lelang
                </p>
              </div>

              {/* Step 4: Bid */}
              <div className="bg-white/50 backdrop-blur-md p-6 rounded-2xl border border-white/60 shadow-sm hover:shadow-md transition-all text-center group hover:border-primary/50">
                <div className="w-14 h-14 mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <img src="/gavel.gif" alt="Mulai Bidding" className="w-14 h-14 object-contain" />
                </div>
                <h4 className="font-bold text-body-md mb-2">4. Mulai Bidding</h4>
                <p className="text-body-sm text-on-surface-variant">
                  Lakukan penawaran secara real-time pada unit yang Anda incar
                </p>
              </div>

              {/* Step 5: Win */}
              <div className="bg-white/50 backdrop-blur-md p-6 rounded-2xl border border-white/60 shadow-sm hover:shadow-md transition-all text-center group hover:border-primary/50">
                <div className="w-14 h-14 mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <img src="/menang.gif" alt="Menang Lelang" className="w-14 h-14 object-contain" />
                </div>
                <h4 className="font-bold text-body-md mb-2">5. Menang Lelang</h4>
                <p className="text-body-sm text-on-surface-variant">
                  Dapatkan notifikasi kemenangan dan informasi tagihan
                </p>
              </div>

              {/* Step 6: Payment */}
              <div className="bg-white/50 backdrop-blur-md p-6 rounded-2xl border border-white/60 shadow-sm hover:shadow-md transition-all text-center group hover:border-primary/50">
                <div className="w-14 h-14 mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <img src="/bayar.gif" alt="Pelunasan" className="w-14 h-14 object-contain" />
                </div>
                <h4 className="font-bold text-body-md mb-2">6. Pelunasan</h4>
                <p className="text-body-sm text-on-surface-variant">
                  Selesaikan pembayaran via Virtual Account (VA) dengan cepat
                </p>
              </div>

              {/* Step 7: Item Collection */}
              <div className="bg-white/50 backdrop-blur-md p-6 rounded-2xl border border-white/60 shadow-sm hover:shadow-md transition-all text-center group hover:border-primary/50 sm:col-span-2 lg:col-span-1 xl:col-span-1">
                <div className="w-14 h-14 mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <img src="/unit.gif" alt="Ambil Unit" className="w-14 h-14 object-contain" />
                </div>
                <h4 className="font-bold text-body-md mb-2">7. Ambil Unit</h4>
                <p className="text-body-sm text-on-surface-variant">
                  Ambil unit di lokasi balai lelang atau gunakan layanan pengiriman
                </p>
              </div>
            </div>

            {/* Optional: CTA below steps */}
            <div className="text-center mt-10">
              <p className="text-body-md text-on-surface-variant mb-4">
                Siap memulai perjalanan lelang Anda?
              </p>
              <button
                onClick={() => handleActionClick("Masuk")}
                className="px-8 py-3.5 bg-premium text-on-premium rounded-xl font-bold text-body-md btn-press btn-shine transition-all hover:bg-premium/85 shadow-lg shadow-premium/15 inline-flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">login</span>
                Masuk
              </button>
            </div>
          </div>
        </section>

        {/* ========== TESTIMONIALS ========== */}
        <section className="py-12 md:py-16 bg-surface-container-low/30">
          <div className="max-w-container-max mx-auto px-margin-page">
            <div className="text-center mb-10">
              <h2 className="text-heading-2xl font-bold text-on-background font-serif">
                Apa Kata Mereka?
              </h2>
              <p className="text-body-lg text-on-surface-variant mt-2">
                Pengalaman nyata dari para pemenang lelang BIDKU
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {publicTestimonials && publicTestimonials.length > 0 ? (
                publicTestimonials.slice(0, 3).map((testimoni: any) => (
                  <div key={testimoni.id} className="testimonial-card bg-white/50 backdrop-blur-md border border-white/60 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-11 h-11 rounded-full overflow-hidden bg-primary-fixed flex items-center justify-center font-bold text-on-primary-fixed text-body-md">
                        {testimoni.image_url ? (
                          <img
                            src={testimoni.image_url}
                            alt={testimoni.user?.full_name || 'User'}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="material-symbols-outlined text-on-primary-fixed">person</span>
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-body-md">{testimoni.user?.full_name || 'Pengguna Anonim'}</h4>
                        <p className="text-body-sm text-outline">Pengguna BIDKU</p>
                      </div>
                    </div>
                    <div className="flex text-primary mb-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span key={i} className={`material-symbols-outlined text-sm ${i < testimoni.rating ? 'filled' : ''}`}>star</span>
                      ))}
                    </div>
                    <p className="text-body-md text-on-surface-variant italic leading-relaxed">
                      "{testimoni.content}"
                    </p>
                  </div>
                ))
              ) : (
                <div className="col-span-1 md:col-span-3 text-center py-10 text-outline">
                  Belum ada testimoni.
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ========== BLOG & TIPS SECTION ========== */}
        <section className="py-12 md:py-16 bg-surface-container-low/30 border-t border-outline-variant/10">
          <div className="max-w-container-max mx-auto px-margin-page">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
              <div>
                <h2 className="text-heading-2xl font-bold text-on-background font-serif">
                  Blog &amp; Tips
                </h2>
                <p className="text-body-lg text-on-surface-variant mt-1">
                  Informasi terbaru seputar dunia lelang dan otomotif
                </p>
              </div>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  handleActionClick("Lihat Semua Artikel");
                }}
                className="text-primary font-bold flex items-center gap-1 hover:underline text-body-md"
              >
                Lihat Semua
                <span className="material-symbols-outlined text-sm">chevron_right</span>
              </a>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {publicBlogs && publicBlogs.length > 0 ? (
                publicBlogs.slice(0, 3).map((blog: any) => (
                  <Link href={`/blog/${blog.slug}`} key={blog.id}>
                    <article className="group bg-white/50 backdrop-blur-md border border-white/60 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all h-full flex flex-col">
                      <div className="aspect-video overflow-hidden bg-surface-container-low relative">
                        {blog.image_url ? (
                          <img
                            alt={blog.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            src={blog.image_url}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-primary/10">
                            <span className="material-symbols-outlined text-4xl text-primary/50">image</span>
                          </div>
                        )}
                      </div>
                      <div className="p-5 flex-grow flex flex-col">
                        <div className="flex items-center gap-2 text-body-sm text-outline mb-3">
                          <span className="material-symbols-outlined text-sm">
                            calendar_today
                          </span>
                          <span>
                            {blog.published_at
                              ? new Date(blog.published_at).toLocaleDateString('id-ID', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })
                              : 'Belum dipublikasi'}
                          </span>
                        </div>
                        <h4 className="font-bold text-heading-md mb-2 group-hover:text-primary transition-colors line-clamp-2">
                          {blog.title}
                        </h4>
                        <p className="text-body-md text-on-surface-variant mb-4 line-clamp-2 flex-grow">
                          {blog.content.replace(/<[^>]+>/g, '').substring(0, 100)}...
                        </p>
                        <div className="inline-flex items-center gap-1 text-primary font-bold text-body-sm hover:gap-2 transition-all mt-auto">
                          Baca Selengkapnya
                          <span className="material-symbols-outlined text-sm">
                            arrow_forward
                          </span>
                        </div>
                      </div>
                    </article>
                  </Link>
                ))
              ) : (
                <div className="col-span-1 md:col-span-3 text-center py-10 text-outline">
                  Belum ada artikel.
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ========== FAQ SECTION ========== */}
        <section id="faq" className="py-12 md:py-16 bg-surface-container-low/30">
          <div className="max-w-container-max mx-auto px-margin-page">
            <div className="text-center mb-10">
              <h2 className="text-heading-2xl font-bold text-on-background font-serif">
                Pertanyaan Umum
              </h2>
              <p className="text-body-lg text-on-surface-variant mt-2">
                Temukan jawaban atas pertanyaan yang sering diajukan seputar lelang BIDKU
              </p>
            </div>

            <div className="max-w-3xl mx-auto flex flex-col gap-3">
              {/* FAQ 1 */}
              <div className="bg-white/50 backdrop-blur-md rounded-2xl border border-white/60 shadow-sm overflow-hidden">
                <button
                  onClick={() => toggleFaq(0)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-surface-container-low/30 transition-colors"
                  aria-expanded={openFaq === 0}
                >
                  <span className="font-bold text-body-md">
                    Apakah item yang dilelang asli dan terjamin keasliannya?
                  </span>
                  <span
                    className={`material-symbols-outlined text-outline transition-transform ${
                      openFaq === 0 ? "hover:scale-105" : ""
                    }`}
                    style={{
                      transform: openFaq === 0 ? "rotate(180deg)" : "rotate(0deg)",
                    }}
                  >
                    expand_more
                  </span>
                </button>
                {openFaq === 0 && (
                  <div className="px-6 pb-4 border-t border-outline-variant/10 pt-3">
                    <p className="text-body-md text-on-surface-variant leading-relaxed">
                      Ya, semua item yang dilelang di BIDKU telah melalui proses inspeksi
                      dan verifikasi ketat oleh tim ahli kami. Setiap unit dilengkapi
                      dengan dokumen keaslian dan grade yang jelas, sehingga Anda dapat
                      memastikan keaslian dan kondisi barang sebelum melakukan penawaran.
                    </p>
                  </div>
                )}
              </div>

              {/* FAQ 2 */}
              <div className="bg-white/50 backdrop-blur-md rounded-2xl border border-white/60 shadow-sm overflow-hidden">
                <button
                  onClick={() => toggleFaq(1)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-surface-container-low/30 transition-colors"
                  aria-expanded={openFaq === 1}
                >
                  <span className="font-bold text-body-md">
                    Apakah saya bisa melakukan inspeksi fisik sebelum bidding?
                  </span>
                  <span
                    className="material-symbols-outlined text-outline transition-transform"
                    style={{
                      transform: openFaq === 1 ? "rotate(180deg)" : "rotate(0deg)",
                    }}
                  >
                    expand_more
                  </span>
                </button>
                {openFaq === 1 && (
                  <div className="px-6 pb-4 border-t border-outline-variant/10 pt-3">
                    <p className="text-body-md text-on-surface-variant leading-relaxed">
                      Tentu saja! BIDKU menyediakan jadwal inspeksi fisik di setiap lokasi
                      balai lelang. Anda dapat datang langsung untuk memeriksa kondisi unit
                      secara detail. Informasi jadwal inspeksi tersedia di halaman detail
                      setiap lelang.
                    </p>
                  </div>
                )}
              </div>

              {/* FAQ 3 */}
              <div className="bg-white/50 backdrop-blur-md rounded-2xl border border-white/60 shadow-sm overflow-hidden">
                <button
                  onClick={() => toggleFaq(2)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-surface-container-low/30 transition-colors"
                  aria-expanded={openFaq === 2}
                >
                  <span className="font-bold text-body-md">
                    Bagaimana sistem pembayaran setelah saya memenangkan lelang?
                  </span>
                  <span
                    className="material-symbols-outlined text-outline transition-transform"
                    style={{
                      transform: openFaq === 2 ? "rotate(180deg)" : "rotate(0deg)",
                    }}
                  >
                    expand_more
                  </span>
                </button>
                {openFaq === 2 && (
                  <div className="px-6 pb-4 border-t border-outline-variant/10 pt-3">
                    <p className="text-body-md text-on-surface-variant leading-relaxed">
                      Setelah memenangkan lelang, Anda akan menerima notifikasi dan
                      instruksi pembayaran melalui email dan dashboard. Pembayaran
                      dilakukan melalui Virtual Account (VA) yang terintegrasi dengan
                      bank-bank terkemuka. Prosesnya cepat, aman, dan dilengkapi dengan
                      jaminan pengembalian dana jika terjadi kendala.
                    </p>
                  </div>
                )}
              </div>

              {/* FAQ 4 */}
              <div className="bg-white/50 backdrop-blur-md rounded-2xl border border-white/60 shadow-sm overflow-hidden">
                <button
                  onClick={() => toggleFaq(3)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-surface-container-low/30 transition-colors"
                  aria-expanded={openFaq === 3}
                >
                  <span className="font-bold text-body-md">
                    Apakah ada biaya tambahan selain harga akhir lelang?
                  </span>
                  <span
                    className="material-symbols-outlined text-outline transition-transform"
                    style={{
                      transform: openFaq === 3 ? "rotate(180deg)" : "rotate(0deg)",
                    }}
                  >
                    expand_more
                  </span>
                </button>
                {openFaq === 3 && (
                  <div className="px-6 pb-4 border-t border-outline-variant/10 pt-3">
                    <p className="text-body-md text-on-surface-variant leading-relaxed">
                      Selain harga akhir lelang, terdapat biaya administrasi dan lelang
                      yang besarnya transparan dan telah diinformasikan sebelum bidding
                      dimulai. Tidak ada biaya tersembunyi. Semua rincian biaya dapat Anda
                      lihat di halaman detail lelang dan syarat &amp; ketentuan yang
                      berlaku.
                    </p>
                  </div>
                )}
              </div>

              {/* FAQ 5 */}
              <div className="bg-white/50 backdrop-blur-md rounded-2xl border border-white/60 shadow-sm overflow-hidden">
                <button
                  onClick={() => toggleFaq(4)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-surface-container-low/30 transition-colors"
                  aria-expanded={openFaq === 4}
                >
                  <span className="font-bold text-body-md">
                    Bagaimana jika saya tidak bisa mengambil unit langsung?
                  </span>
                  <span
                    className="material-symbols-outlined text-outline transition-transform"
                    style={{
                      transform: openFaq === 4 ? "rotate(180deg)" : "rotate(0deg)",
                    }}
                  >
                    expand_more
                  </span>
                </button>
                {openFaq === 4 && (
                  <div className="px-6 pb-4 border-t border-outline-variant/10 pt-3">
                    <p className="text-body-md text-on-surface-variant leading-relaxed">
                      BIDKU menyediakan layanan pengiriman unit ke lokasi Anda dengan biaya
                      yang kompetitif. Anda juga dapat menunjuk perwakilan untuk mengambil
                      unit atas nama Anda. Informasi lebih lanjut mengenai opsi pengiriman
                      akan diberikan setelah proses pelunasan selesai.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ========== GALLERY SECTION ========== */}
        <section id="gallery" className="py-12 md:py-16 bg-white">
          <div className="max-w-container-max mx-auto px-margin-page">
            <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
              <div>
                <h2 className="text-heading-2xl font-bold text-on-background font-serif">
                  Gallery
                </h2>
                <p className="text-body-lg text-on-surface-variant mt-2">
                  Momen-momen terbaik di setiap acara lelang BIDKU
                </p>
              </div>
              <Link
                href="/gallery"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-surface-container-low text-primary rounded-xl font-bold text-body-md hover:bg-surface-container transition-colors shrink-0"
              >
                Lihat Semua
                <span className="material-symbols-outlined text-sm">
                  arrow_forward
                </span>
              </Link>
            </div>
            
            <GalleryGrid galleries={galleries} loading={loadingGalleries} />
          </div>
        </section>

        {/* ========== FINAL CTA ========== */}
        <section className="final-cta-luxury py-16 md:py-20">
          <div className="max-w-container-max mx-auto px-margin-page text-center">
            <h2 className="text-heading-3xl md:text-[3rem] font-extrabold text-white font-serif">
              Siap Menemukan Penawaran Terbaik?
            </h2>
            <p className="text-body-lg text-white/80 max-w-xl mx-auto mt-3">
              Bergabung sekarang dan ikuti berbagai lelang menarik dari seluruh Indonesia
            </p>
            <div className="flex flex-wrap justify-center gap-4 mt-8">
              <button
                onClick={() => handleActionClick("Masuk")}
                className="px-8 py-4 bg-[#178630] text-white rounded-xl font-bold text-body-md btn-press btn-shine transition-all hover:bg-[#178630]/90 shadow-xl shadow-[#178630]/15 flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">login</span>
                Masuk
              </button>
              <button
                onClick={() => handleActionClick("Lihat Lelang Aktif")}
                className="px-8 py-4 bg-[#f67904] text-white rounded-xl font-bold text-body-md btn-press transition-all hover:bg-[#f67904]/90 shadow-xl shadow-[#f67904]/15 flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">visibility</span>
                Lihat Lelang Aktif
              </button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
