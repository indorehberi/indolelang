"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export default function Home() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

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
  const [timers, setTimers] = useState({
    avanza: 45296, // 12h 34m 56s
    hilux: 29722,  // 08h 15m 22s
    brio: 17110,   // 04h 45m 10s
    pajero: 22353, // 06h 12m 33s
    xenia: 9045,   // 02h 30m 45s
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setTimers((prev) => ({
        avanza: prev.avanza > 0 ? prev.avanza - 1 : 0,
        hilux: prev.hilux > 0 ? prev.hilux - 1 : 0,
        brio: prev.brio > 0 ? prev.brio - 1 : 0,
        pajero: prev.pajero > 0 ? prev.pajero - 1 : 0,
        xenia: prev.xenia > 0 ? prev.xenia - 1 : 0,
      }));
    }, 1000);
    return () => clearInterval(interval);
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
      router.push("/register/bidder");
    } else if (action.includes("masuk") || action.includes("portal")) {
      router.push("/login");
    } else if (action.includes("katalog") || action.includes("aktif") || action.includes("kategori") || action.includes("semua lelang")) {
      router.push("/katalog");
    } else if (action.includes("tawar")) {
      router.push("/katalog/1"); // Redirect to the demo Avanza detail page
    } else if (action.includes("syarat")) {
      router.push("/syarat");
    } else if (action.includes("ekyc")) {
      router.push("/ekyc/upload");
    } else if (action.includes("provider")) {
      router.push("/register/provider");
    } else if (action.includes("kontak") || action.includes("hubungi")) {
      router.push("/kontak");
    } else {
      alert(`Fitur "${actionName}" sedang disiapkan.`);
    }
  };

  return (
    <>
      {/* ========== STICKY MOBILE CTA ========== */}
      <div
        id="stickyCta"
        className={`sticky-cta fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-outline-variant/20 px-4 py-3 md:hidden shadow-lg ${
          stickyVisible ? "visible" : ""
        }`}
      >
        <div className="flex items-center gap-3 max-w-container-max mx-auto">
          <button
            onClick={() => handleActionClick("Daftar Sekarang")}
            className="flex-1 px-4 py-2.5 bg-primary text-on-primary rounded-xl font-bold text-sm btn-press transition-all hover:bg-primary/90 text-center"
          >
            Daftar Sekarang
          </button>
          <button
            onClick={() => handleActionClick("Lihat Lelang Aktif")}
            className="flex-1 px-4 py-2.5 bg-secondary text-on-secondary rounded-xl font-bold text-sm btn-press transition-all hover:bg-secondary/90 text-center"
          >
            Lihat Lelang Aktif
          </button>
        </div>
      </div>

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
                  #1 Digital Auction di Indonesia
                </div>

                <h1 className="text-heading-3xl md:text-[3.25rem] md:leading-[1.08] font-extrabold text-on-background tracking-tight">
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
                    className="px-7 py-3.5 bg-primary text-on-primary rounded-xl font-bold text-body-md btn-press transition-all hover:bg-primary/90 shadow-lg shadow-primary/20 flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-lg">gavel</span>
                    Lihat Lelang Aktif
                  </button>
                  <a
                    href="#how-it-works"
                    className="px-7 py-3.5 border-2 border-outline-variant/30 text-on-surface rounded-xl font-bold text-body-md btn-press transition-all hover:border-primary hover:text-primary flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-lg">
                      play_circle
                    </span>
                    Cara Kerja
                  </a>
                </div>

                {/* Trust badges - inline */}
                <div className="flex flex-wrap items-center gap-4 pt-4">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm text-primary filled">
                      verified
                    </span>
                    <span className="text-body-sm font-medium text-on-surface-variant">
                      Aman &amp; Terpercaya
                    </span>
                  </div>
                  <div className="w-px h-5 bg-outline-variant/30"></div>
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm text-secondary filled">
                      bolt
                    </span>
                    <span className="text-body-sm font-medium text-on-surface-variant">
                      Proses Cepat
                    </span>
                  </div>
                  <div className="w-px h-5 bg-outline-variant/30 hidden sm:block"></div>
                  <div className="flex items-center gap-1.5 hidden sm:flex">
                    <span className="material-symbols-outlined text-sm text-primary filled">
                      support_agent
                    </span>
                    <span className="text-body-sm font-medium text-on-surface-variant">
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
                    alt="Modern digital auction environment with luxury cars"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDx_9SWM1Z1hW6_ynwMqo7kT08ssXXJsGSjibfPe57XznHvi41Mjkt_jbGy2-a-fycvwk4nWH-5hnGlwnp8whWELZ8pnG5Wn3HWlbNIMntoz4ZlhohDti-SiLDsyXHy0w7sLLVEiGae386QxYS6XpMnVccBqdLunYwvCBAofP1PVuJ06D3eZMDxE7kbVO-Bqv_c3hUHPl9BWSeq3qkYHWBvv239rgOVx49WJqOn7TN_vhwg0VV1-q_vqf7m_6HOyuTivEWRM9MrhzrM"
                  />
                  {/* Floating badge */}
                  <div className="absolute bottom-4 left-4 bg-white/70 backdrop-blur-md rounded-xl shadow-xl border border-white/40 p-3 flex items-center gap-3 animate-pulse-soft">
                    <div className="w-10 h-10 rounded-full bg-secondary-fixed flex items-center justify-center">
                      <span className="material-symbols-outlined text-on-secondary-fixed filled">
                        bolt
                      </span>
                    </div>
                    <div>
                      <p className="text-body-sm font-medium text-outline">
                        Live Auction
                      </p>
                      <p className="text-heading-md font-bold text-secondary">
                        Sedang Berlangsung
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
              <div className="text-center p-4 rounded-xl bg-white/40 backdrop-blur-md border border-white/60 shadow-sm">
                <p className="stat-number text-primary">1.200+</p>
                <p className="text-body-sm font-medium text-outline mt-0.5">
                  Lot Terjual / Bulan
                </p>
              </div>
              <div className="text-center p-4 rounded-xl bg-white/40 backdrop-blur-md border border-white/60 shadow-sm">
                <p className="stat-number text-primary">3.400+</p>
                <p className="text-body-sm font-medium text-outline mt-0.5">
                  Peserta Aktif
                </p>
              </div>
              <div className="text-center p-4 rounded-xl bg-white/40 backdrop-blur-md border border-white/60 shadow-sm">
                <p className="stat-number text-primary">Rp 120M+</p>
                <p className="text-body-sm font-medium text-outline mt-0.5">
                  Nilai Transaksi
                </p>
              </div>
              <div className="text-center p-4 rounded-xl bg-white/40 backdrop-blur-md border border-white/60 shadow-sm">
                <p className="stat-number text-primary">30+</p>
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
              <h2 className="text-heading-2xl font-bold text-on-background">
                Mengapa Memilih BIDKU?
              </h2>
              <p className="text-body-lg text-on-surface-variant mt-2">
                Keamanan dan kenyamanan Anda adalah prioritas kami
              </p>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              <div className="bg-white p-5 md:p-6 rounded-2xl border border-outline-variant/10 text-center hover:border-primary/30 transition-all">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-primary-fixed/30 flex items-center justify-center">
                  <span className="material-symbols-outlined text-2xl text-primary filled">
                    shield
                  </span>
                </div>
                <h4 className="font-bold text-body-md">Transaksi Aman</h4>
                <p className="text-body-sm text-on-surface-variant mt-1">
                  Sistem terenkripsi &amp; verifikasi eKYC
                </p>
              </div>
              <div className="bg-white p-5 md:p-6 rounded-2xl border border-outline-variant/10 text-center hover:border-primary/30 transition-all">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-secondary-fixed/30 flex items-center justify-center">
                  <span className="material-symbols-outlined text-2xl text-secondary filled">
                    verified
                  </span>
                </div>
                <h4 className="font-bold text-body-md">Penjual Terverifikasi</h4>
                <p className="text-body-sm text-on-surface-variant mt-1">
                  Semua unit melalui inspeksi ketat
                </p>
              </div>
              <div className="bg-white p-5 md:p-6 rounded-2xl border border-outline-variant/10 text-center hover:border-primary/30 transition-all">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-primary-fixed/30 flex items-center justify-center">
                  <span className="material-symbols-outlined text-2xl text-primary filled">
                    visibility
                  </span>
                </div>
                <h4 className="font-bold text-body-md">Proses Transparan</h4>
                <p className="text-body-sm text-on-surface-variant mt-1">
                  Semua bid &amp; harga terbuka untuk umum
                </p>
              </div>
              <div className="bg-white p-5 md:p-6 rounded-2xl border border-outline-variant/10 text-center hover:border-primary/30 transition-all">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-secondary-fixed/30 flex items-center justify-center">
                  <span className="material-symbols-outlined text-2xl text-secondary filled">
                    headset_mic
                  </span>
                </div>
                <h4 className="font-bold text-body-md">Dukungan 24/7</h4>
                <p className="text-body-sm text-on-surface-variant mt-1">
                  Tim siap membantu Anda setiap saat
                </p>
              </div>
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
                <h2 className="text-heading-2xl font-bold text-on-background">
                  Lelang Aktif
                </h2>
                <p className="text-body-lg text-on-surface-variant mt-1">
                  Penawaran terbaik dari berbagai kategori
                </p>
              </div>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  handleActionClick("Lihat Semua Lelang Aktif");
                }}
                className="text-primary font-bold flex items-center gap-1 hover:underline text-body-md"
              >
                Lihat Semua
                <span className="material-symbols-outlined text-sm">chevron_right</span>
              </a>
            </div>

            {/* Auction Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* Card 1 */}
              <div className="auction-card bg-white/50 backdrop-blur-md border border-white/60 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all">
                <div className="relative aspect-[4/3] overflow-hidden bg-surface-container-low">
                  <img
                    className="w-full h-full object-cover"
                    alt="Toyota Avanza"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBcS6tHKZpYYGzVd6NalL2sAwQ1i-oYWHGMg49cGf4YAschTELEp7pAOrezDdK7olQ3ndB21B1myenWUoLPNrW75NL_EfzKrRBazlhfxoTA0PSVXEjPFdDGaDNqxHZH3tptfatQgF6mTOgwwPZIcqeUSg_bnrWYV8RJ-Slr6Z2ltr1p5HPZjgZq16T_SVGJiQS2g7kuBo3hMXsW6tXG2JrTCu7N6moS_dGbowWE0j21z4vHv3DsDFv7XME5r0MDFozTzH0n9ug2sHhp"
                  />
                  <div className="absolute top-2 left-2 px-2.5 py-1 bg-secondary text-on-secondary text-badge-text font-bold rounded-full">
                    Live
                  </div>
                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-white text-body-sm font-medium">
                    <span className="flex items-center gap-1 bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded-full">
                      <span className="material-symbols-outlined text-sm">timer</span>
                      <span className="countdown-badge">
                        {formatTime(timers.avanza)}
                      </span>
                    </span>
                    <span className="flex items-center gap-1 bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded-full">
                      <span className="material-symbols-outlined text-sm">group</span>
                      47
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-start mb-1 gap-2">
                    <h4 className="font-bold text-body-md truncate">
                      Toyota Avanza 1.3 G
                    </h4>
                    <span className="px-2 py-0.5 bg-surface-container-low text-body-sm font-bold rounded">
                      B
                    </span>
                  </div>
                  <p className="text-body-sm text-outline flex items-center gap-1 mb-3">
                    <span className="material-symbols-outlined text-sm">
                      location_on
                    </span>
                    Jakarta Selatan
                  </p>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-body-sm text-outline">Harga Dasar</p>
                      <p className="text-heading-lg font-bold text-primary">
                        Rp 135.000.000
                      </p>
                    </div>
                    <button
                      onClick={() => handleActionClick("Tawar Toyota Avanza")}
                      className="px-4 py-2 bg-secondary text-on-secondary rounded-xl font-bold text-body-sm btn-press transition-all hover:bg-secondary/90"
                    >
                      Tawar
                    </button>
                  </div>
                </div>
              </div>

              {/* Card 2 */}
              <div className="auction-card bg-white/50 backdrop-blur-md border border-white/60 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all">
                <div className="relative aspect-[4/3] overflow-hidden bg-surface-container-low">
                  <img
                    className="w-full h-full object-cover"
                    alt="Honda CR-V"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAGJyrSIiC5CrjQ9ie6mdjiTukPacM8oYuRPhzR3WM3ldKjSIPxknbMVrUcq4MZtcHRxMwYosqUSfDCT1upZc-E-WE5mYQQ9MLyH4yPLAjXLhJEawqhzcn9LV7tYkI8mZxjLzxkAg5RfzTEU5JJIsVEV9pE--k0LXtch0ZYYRBbsHN0rxel0IldTrktEIwbs_M4NpsGoUUL1gkx5fTfp80e6PSQ0Oe5YOs0KNjAKBOUR9IqXHGgADXQKHRG_n9XaNBxQIOfBJTw_fGD"
                  />
                  <div className="absolute top-2 left-2 px-2.5 py-1 bg-primary text-on-primary text-badge-text font-bold rounded-full">
                    Akan Datang
                  </div>
                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-white text-body-sm font-medium">
                    <span className="flex items-center gap-1 bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded-full">
                      <span className="material-symbols-outlined text-sm">timer</span>
                      <span>2 Hari</span>
                    </span>
                    <span className="flex items-center gap-1 bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded-full">
                      <span className="material-symbols-outlined text-sm">group</span>
                      89
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-start mb-1 gap-2">
                    <h4 className="font-bold text-body-md truncate">
                      Honda CR-V 1.5 Turbo
                    </h4>
                    <span className="px-2 py-0.5 bg-surface-container-low text-body-sm font-bold rounded">
                      A
                    </span>
                  </div>
                  <p className="text-body-sm text-outline flex items-center gap-1 mb-3">
                    <span className="material-symbols-outlined text-sm">
                      location_on
                    </span>
                    Surabaya
                  </p>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-body-sm text-outline">Harga Dasar</p>
                      <p className="text-heading-lg font-bold text-primary">
                        Rp 310.000.000
                      </p>
                    </div>
                    <button
                      onClick={() => handleActionClick("Ingatkan Honda CR-V")}
                      className="px-4 py-2 border-2 border-primary/30 text-primary rounded-xl font-bold text-body-sm btn-press transition-all hover:bg-primary hover:text-white"
                    >
                      Ingatkan
                    </button>
                  </div>
                </div>
              </div>

              {/* Card 3 */}
              <div className="auction-card bg-white/50 backdrop-blur-md border border-white/60 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all">
                <div className="relative aspect-[4/3] overflow-hidden bg-surface-container-low">
                  <img
                    className="w-full h-full object-cover"
                    alt="Toyota Hilux"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuB67l1UA3O3JqEltSt7_FoCtmkwazDVgtHh3zFH0--lZmvp7mKfkzCMLmT52NrO1D0X_UNyvrEO8wU1Y-V3crXAMKKfdKFiSVl_txDOE7P24t3idlxaEx0E9_HxZWh47SNE1mPkgtYNlJdtdgO03ZvxtVvXYjXo-jY0fmtkYKj8BSSvnVN8A8KXhatbMHKO-IuzBXbcU4N1SWJ4RyM7JwNDUmEU1-yOJtqHBm_Sv7ls52p9W4HgMu8VUCWtu9B4v7sSaGecisbNcYxW"
                  />
                  <div className="absolute top-2 left-2 px-2.5 py-1 bg-secondary text-on-secondary text-badge-text font-bold rounded-full">
                    Live
                  </div>
                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-white text-body-sm font-medium">
                    <span className="flex items-center gap-1 bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded-full">
                      <span className="material-symbols-outlined text-sm">timer</span>
                      <span className="countdown-badge">
                        {formatTime(timers.hilux)}
                      </span>
                    </span>
                    <span className="flex items-center gap-1 bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded-full">
                      <span className="material-symbols-outlined text-sm">group</span>
                      34
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-start mb-1 gap-2">
                    <h4 className="font-bold text-body-md truncate">
                      Toyota Hilux 2.4 V
                    </h4>
                    <span className="px-2 py-0.5 bg-surface-container-low text-body-sm font-bold rounded">
                      B
                    </span>
                  </div>
                  <p className="text-body-sm text-outline flex items-center gap-1 mb-3">
                    <span className="material-symbols-outlined text-sm">
                      location_on
                    </span>
                    Medan
                  </p>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-body-sm text-outline">Harga Dasar</p>
                      <p className="text-heading-lg font-bold text-primary">
                        Rp 285.000.000
                      </p>
                    </div>
                    <button
                      onClick={() => handleActionClick("Tawar Toyota Hilux")}
                      className="px-4 py-2 bg-secondary text-on-secondary rounded-xl font-bold text-body-sm btn-press transition-all hover:bg-secondary/90"
                    >
                      Tawar
                    </button>
                  </div>
                </div>
              </div>

              {/* Card 4 */}
              <div className="auction-card bg-white/50 backdrop-blur-md border border-white/60 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all">
                <div className="relative aspect-[4/3] overflow-hidden bg-surface-container-low">
                  <img
                    className="w-full h-full object-cover"
                    alt="Honda Brio"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAYN8O2A-8z9old1jiYKN3bl_YAgSjeeNrRfz65SyUOBZcClgtIAicB1Ef3G5ynkpckI4VeZbQ4euupLkJTi_0aOr3T_rmdoTSKwmPZoazXlnAh4I0nTlRtAvoiZJtrsvf3dRTzqXsNGpE2FX3rMHjM1YTvVRXkAVR62eV5Nm7ejEPopOiLePfyyDieJ7ak_hWwkhHnCRN1D3ouQ7Mg0Jnpq282YGoAgtZRiSIT8I4oud5JRGOokCF5DfXUp0Njgamd-sK7LQt10xZl"
                  />
                  <div className="absolute top-2 left-2 px-2.5 py-1 bg-secondary text-on-secondary text-badge-text font-bold rounded-full">
                    Live
                  </div>
                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-white text-body-sm font-medium">
                    <span className="flex items-center gap-1 bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded-full">
                      <span className="material-symbols-outlined text-sm">timer</span>
                      <span className="countdown-badge">
                        {formatTime(timers.brio)}
                      </span>
                    </span>
                    <span className="flex items-center gap-1 bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded-full">
                      <span className="material-symbols-outlined text-sm">group</span>
                      56
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-start mb-1 gap-2">
                    <h4 className="font-bold text-body-md truncate">
                      Honda Brio 1.2 RS
                    </h4>
                    <span className="px-2 py-0.5 bg-surface-container-low text-body-sm font-bold rounded">
                      A
                    </span>
                  </div>
                  <p className="text-body-sm text-outline flex items-center gap-1 mb-3">
                    <span className="material-symbols-outlined text-sm">
                      location_on
                    </span>
                    Semarang
                  </p>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-body-sm text-outline">Harga Dasar</p>
                      <p className="text-heading-lg font-bold text-primary">
                        Rp 98.000.000
                      </p>
                    </div>
                    <button
                      onClick={() => handleActionClick("Tawar Honda Brio")}
                      className="px-4 py-2 bg-secondary text-on-secondary rounded-xl font-bold text-body-sm btn-press transition-all hover:bg-secondary/90"
                    >
                      Tawar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========== CATEGORIES SECTION ========== */}
        <section id="categories" className="py-12 md:py-16 bg-surface-container-low/30">
          <div className="max-w-container-max mx-auto px-margin-page">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
              <div>
                <h2 className="text-heading-2xl font-bold text-on-background">
                  Kategori Lelang
                </h2>
                <p className="text-body-lg text-on-surface-variant mt-1">
                  Pilih kategori aset yang Anda cari
                </p>
              </div>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  handleActionClick("Semua Kategori");
                }}
                className="text-primary font-bold flex items-center gap-1 hover:underline text-body-md"
              >
                Lihat Semua
                <span className="material-symbols-outlined text-sm">chevron_right</span>
              </a>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Mobil */}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  handleActionClick("Kategori Mobil");
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
                  <p className="text-white/80 text-body-sm">842 Unit Tersedia</p>
                </div>
              </a>
              {/* Motor */}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  handleActionClick("Kategori Motor");
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
                  <p className="text-white/80 text-body-sm">1.120 Unit Tersedia</p>
                </div>
              </a>
              {/* Komersial */}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  handleActionClick("Kategori Alat Berat");
                }}
                className="group relative aspect-[4/3] rounded-2xl overflow-hidden shadow-md"
              >
                <img
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
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
                  <p className="text-white/80 text-body-sm">145 Unit Tersedia</p>
                </div>
              </a>
              {/* Properti */}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  handleActionClick("Kategori Properti");
                }}
                className="group relative aspect-[4/3] rounded-2xl overflow-hidden shadow-md"
              >
                <img
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
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
                  <p className="text-white/80 text-body-sm">52 Unit Tersedia</p>
                </div>
              </a>
            </div>
          </div>
        </section>

        {/* ========== FEATURED AUCTIONS ========== */}
        <section className="py-12 md:py-16 bg-surface-container-low/30">
          <div className="max-w-container-max mx-auto px-margin-page">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
              <div>
                <h2 className="text-heading-2xl font-bold text-on-background">
                  Lelang Unggulan
                </h2>
                <p className="text-body-lg text-on-surface-variant mt-1">
                  Rekomendasi terbaik untuk Anda
                </p>
              </div>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  handleActionClick("Lihat Semua Lelang Unggulan");
                }}
                className="text-primary font-bold flex items-center gap-1 hover:underline text-body-md"
              >
                Lihat Semua
                <span className="material-symbols-outlined text-sm">chevron_right</span>
              </a>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* Featured 1 */}
              <div className="auction-card bg-white/50 backdrop-blur-md border border-white/60 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all">
                <div className="relative aspect-[4/3] overflow-hidden bg-surface-container-low">
                  <img
                    className="w-full h-full object-cover"
                    alt="Mitsubishi Pajero"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDx_9SWM1Z1hW6_ynwMqo7kT08ssXXJsGSjibfPe57XznHvi41Mjkt_jbGy2-a-fycvwk4nWH-5hnGlwnp8whWELZ8pnG5Wn3HWlbNIMntoz4ZlhohDti-SiLDsyXHy0w7sLLVEiGae386QxYS6XpMnVccBqdLunYwvCBAofP1PVuJ06D3eZMDxE7kbVO-Bqv_c3hUHPl9BWSeq3qkYHWBvv239rgOVx49WJqOn7TN_vhwg0VV1-q_vqf7m_6HOyuTivEWRM9MrhzrM"
                  />
                  <div
                    className="absolute top-2 left-2 px-2.5 py-1 text-white text-badge-text font-bold rounded-full"
                    style={{ backgroundColor: "var(--primary)" }}
                  >
                    ⭐ Terbaik
                  </div>
                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-white text-body-sm font-medium">
                    <span className="flex items-center gap-1 bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded-full">
                      <span className="material-symbols-outlined text-sm">timer</span>
                      <span className="countdown-badge">
                        {formatTime(timers.pajero)}
                      </span>
                    </span>
                    <span className="flex items-center gap-1 bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded-full">
                      <span className="material-symbols-outlined text-sm">group</span>
                      72
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-start mb-1 gap-2">
                    <h4 className="font-bold text-body-md truncate">
                      Mitsubishi Pajero Sport
                    </h4>
                    <span className="px-2 py-0.5 bg-surface-container-low text-body-sm font-bold rounded">
                      A
                    </span>
                  </div>
                  <p className="text-body-sm text-outline flex items-center gap-1 mb-3">
                    <span className="material-symbols-outlined text-sm">
                      location_on
                    </span>
                    Jakarta Pusat
                  </p>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-body-sm text-outline">Harga Dasar</p>
                      <p className="text-heading-lg font-bold text-primary">
                        Rp 425.000.000
                      </p>
                    </div>
                    <button
                      onClick={() => handleActionClick("Tawar Mitsubishi Pajero")}
                      className="px-4 py-2 bg-secondary text-on-secondary rounded-xl font-bold text-body-sm btn-press transition-all hover:bg-secondary/90"
                    >
                      Tawar
                    </button>
                  </div>
                </div>
              </div>
              {/* Featured 2 */}
              <div className="auction-card bg-white/50 backdrop-blur-md border border-white/60 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all">
                <div className="relative aspect-[4/3] overflow-hidden bg-surface-container-low">
                  <img
                    className="w-full h-full object-cover"
                    alt="BMW X5"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDx_9SWM1Z1hW6_ynwMqo7kT08ssXXJsGSjibfPe57XznHvi41Mjkt_jbGy2-a-fycvwk4nWH-5hnGlwnp8whWELZ8pnG5Wn3HWlbNIMntoz4ZlhohDti-SiLDsyXHy0w7sLLVEiGae386QxYS6XpMnVccBqdLunYwvCBAofP1PVuJ06D3eZMDxE7kbVO-Bqv_c3hUHPl9BWSeq3qkYHWBvv239rgOVx49WJqOn7TN_vhwg0VV1-q_vqf7m_6HOyuTivEWRM9MrhzrM"
                  />
                  <div className="absolute top-2 left-2 px-2.5 py-1 bg-secondary text-on-secondary text-badge-text font-bold rounded-full">
                    Premium
                  </div>
                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-white text-body-sm font-medium">
                    <span className="flex items-center gap-1 bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded-full">
                      <span className="material-symbols-outlined text-sm">timer</span>
                      <span>3 Hari</span>
                    </span>
                    <span className="flex items-center gap-1 bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded-full">
                      <span className="material-symbols-outlined text-sm">group</span>
                      104
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-start mb-1 gap-2">
                    <h4 className="font-bold text-body-md truncate">
                      BMW X5 xDrive30d
                    </h4>
                    <span className="px-2 py-0.5 bg-surface-container-low text-body-sm font-bold rounded">
                      A
                    </span>
                  </div>
                  <p className="text-body-sm text-outline flex items-center gap-1 mb-3">
                    <span className="material-symbols-outlined text-sm">
                      location_on
                    </span>
                    Tangerang
                  </p>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-body-sm text-outline">Harga Dasar</p>
                      <p className="text-heading-lg font-bold text-primary">
                        Rp 1.150.000.000
                      </p>
                    </div>
                    <button
                      onClick={() => handleActionClick("Ingatkan BMW X5")}
                      className="px-4 py-2 border-2 border-primary/30 text-primary rounded-xl font-bold text-body-sm btn-press transition-all hover:bg-primary hover:text-white"
                    >
                      Ingatkan
                    </button>
                  </div>
                </div>
              </div>
              {/* Featured 3 */}
              <div className="auction-card bg-white/50 backdrop-blur-md border border-white/60 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all">
                <div className="relative aspect-[4/3] overflow-hidden bg-surface-container-low">
                  <img
                    className="w-full h-full object-cover"
                    alt="Daihatsu Xenia"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAfO6fRTBCfJVz6MUYCEQuH3UDV81F-F4DY_MQbOx18fvPHR0qu3z6dqm-XIHHrYpEsl-LUvyzzVw_rp9xw2ghrTUmUTz3239DZ7OUAAVjaIOedVl6K5emlIYjlz81T1VKKI8PugGBlfIwam3VPYHuUMUCCxIEBfN-bJXqFfvP6GPBQ8SRQT-HbBIgrbsbbvxtc6acdLRGMX5q5ScguyKNiTVPgNQdpCLmt1lOjJz8couih2BWAfseY00DK7axG4bWw30rAHVe6njfB"
                  />
                  <div className="absolute top-2 left-2 px-2.5 py-1 bg-secondary text-on-secondary text-badge-text font-bold rounded-full">
                    Live
                  </div>
                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-white text-body-sm font-medium">
                    <span className="flex items-center gap-1 bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded-full">
                      <span className="material-symbols-outlined text-sm">timer</span>
                      <span className="countdown-badge">
                        {formatTime(timers.xenia)}
                      </span>
                    </span>
                    <span className="flex items-center gap-1 bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded-full">
                      <span className="material-symbols-outlined text-sm">group</span>
                      38
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-start mb-1 gap-2">
                    <h4 className="font-bold text-body-md truncate">
                      Daihatsu Xenia 1.5 R
                    </h4>
                    <span className="px-2 py-0.5 bg-surface-container-low text-body-sm font-bold rounded">
                      B
                    </span>
                  </div>
                  <p className="text-body-sm text-outline flex items-center gap-1 mb-3">
                    <span className="material-symbols-outlined text-sm">
                      location_on
                    </span>
                    Bandung
                  </p>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-body-sm text-outline">Harga Dasar</p>
                      <p className="text-heading-lg font-bold text-primary">
                        Rp 165.000.000
                      </p>
                    </div>
                    <button
                      onClick={() => handleActionClick("Tawar Daihatsu Xenia")}
                      className="px-4 py-2 bg-secondary text-on-secondary rounded-xl font-bold text-body-sm btn-press transition-all hover:bg-secondary/90"
                    >
                      Tawar
                    </button>
                  </div>
                </div>
              </div>
              {/* Featured 4 */}
              <div className="auction-card bg-white/50 backdrop-blur-md border border-white/60 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all">
                <div className="relative aspect-[4/3] overflow-hidden bg-surface-container-low">
                  <img
                    className="w-full h-full object-cover"
                    alt="Yamaha NMAX"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuC31zy45WQwhdCOMrDzZCm2is66KzQ3Ef-59eRlRHkxzGC5DpJj5VKLOvc3lGiQG68JH60S9yYbjI2JAl1ms-Imx6t9eaDfxqxFmaBKRys70HjrcZ5YnCiwuv-yCKaSrD7A28rXssA0Ak7J2_CZ73L4rSL6BEMP3BALcG7uqjaShWLmgCP7TdrYqffviwAtHoJO4H8Nbu1F3fC2iQnLgvWmXu_oGP3B1DIug9vTfVnGi75xhMNL1Ybhm-iHUPaTCbQVBDSpOveGl1u6"
                  />
                  <div className="absolute top-2 left-2 px-2.5 py-1 bg-primary text-on-primary text-badge-text font-bold rounded-full">
                    Akan Datang
                  </div>
                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-white text-body-sm font-medium">
                    <span className="flex items-center gap-1 bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded-full">
                      <span className="material-symbols-outlined text-sm">timer</span>
                      <span>5 Hari</span>
                    </span>
                    <span className="flex items-center gap-1 bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded-full">
                      <span className="material-symbols-outlined text-sm">group</span>
                      28
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-start mb-1 gap-2">
                    <h4 className="font-bold text-body-md truncate">
                      Yamaha NMAX 155
                    </h4>
                    <span className="px-2 py-0.5 bg-surface-container-low text-body-sm font-bold rounded">
                      A
                    </span>
                  </div>
                  <p className="text-body-sm text-outline flex items-center gap-1 mb-3">
                    <span className="material-symbols-outlined text-sm">
                      location_on
                    </span>
                    Yogyakarta
                  </p>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-body-sm text-outline">Harga Dasar</p>
                      <p className="text-heading-lg font-bold text-primary">
                        Rp 28.000.000
                      </p>
                    </div>
                    <button
                      onClick={() => handleActionClick("Ingatkan Yamaha NMAX")}
                      className="px-4 py-2 border-2 border-primary/30 text-primary rounded-xl font-bold text-body-sm btn-press transition-all hover:bg-primary hover:text-white"
                    >
                      Ingatkan
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========== HOW IT WORKS - 7 STEPS ========== */}
        <section
          id="how-it-works"
          className="py-12 md:py-16 bg-surface-container-low/30"
        >
          <div className="max-w-container-max mx-auto px-margin-page">
            <div className="text-center mb-12">
              <h2 className="text-heading-2xl font-bold text-on-background">
                Cara Mudah Ikut Lelang
              </h2>
              <p className="text-body-lg text-on-surface-variant mt-2 max-w-2xl mx-auto">
                Hanya dengan 7 langkah mudah, unit impian Anda bisa segera dibawa pulang
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {/* Step 1: Register */}
              <div className="bg-white p-6 rounded-2xl border border-outline-variant/10 shadow-sm hover:shadow-md transition-all text-center group hover:border-primary/30">
                <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-primary-fixed/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-2xl text-primary">
                    person_add
                  </span>
                </div>
                <h4 className="font-bold text-body-md mb-2">1. Daftar Akun</h4>
                <p className="text-body-sm text-on-surface-variant">
                  Buat akun BIDKU dengan email dan nomor telepon aktif Anda
                </p>
              </div>

              {/* Step 2: Verification */}
              <div className="bg-white p-6 rounded-2xl border border-outline-variant/10 shadow-sm hover:shadow-md transition-all text-center group hover:border-primary/30">
                <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-secondary-fixed/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-2xl text-secondary">
                    verified
                  </span>
                </div>
                <h4 className="font-bold text-body-md mb-2">2. Verifikasi Identitas</h4>
                <p className="text-body-sm text-on-surface-variant">
                  Lengkapi verifikasi eKYC resmi untuk keamanan akun Anda
                </p>
              </div>

              {/* Step 3: Deposit */}
              <div className="bg-white p-6 rounded-2xl border border-outline-variant/10 shadow-sm hover:shadow-md transition-all text-center group hover:border-primary/30">
                <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-primary-fixed/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-2xl text-primary">
                    payments
                  </span>
                </div>
                <h4 className="font-bold text-body-md mb-2">3. Deposit Dana</h4>
                <p className="text-body-sm text-on-surface-variant">
                  Siapkan deposit sebagai jaminan untuk mengikuti sesi lelang
                </p>
              </div>

              {/* Step 4: Bid */}
              <div className="bg-white p-6 rounded-2xl border border-outline-variant/10 shadow-sm hover:shadow-md transition-all text-center group hover:border-primary/30">
                <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-secondary-fixed/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-2xl text-secondary">
                    gavel
                  </span>
                </div>
                <h4 className="font-bold text-body-md mb-2">4. Mulai Bidding</h4>
                <p className="text-body-sm text-on-surface-variant">
                  Lakukan penawaran secara real-time pada unit yang Anda incar
                </p>
              </div>

              {/* Step 5: Win */}
              <div className="bg-white p-6 rounded-2xl border border-outline-variant/10 shadow-sm hover:shadow-md transition-all text-center group hover:border-primary/30">
                <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-primary-fixed/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-2xl text-primary">
                    emoji_events
                  </span>
                </div>
                <h4 className="font-bold text-body-md mb-2">5. Menang Lelang</h4>
                <p className="text-body-sm text-on-surface-variant">
                  Dapatkan notifikasi kemenangan dan informasi tagihan
                </p>
              </div>

              {/* Step 6: Payment */}
              <div className="bg-white p-6 rounded-2xl border border-outline-variant/10 shadow-sm hover:shadow-md transition-all text-center group hover:border-primary/30">
                <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-secondary-fixed/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-2xl text-secondary">
                    account_balance_wallet
                  </span>
                </div>
                <h4 className="font-bold text-body-md mb-2">6. Pelunasan</h4>
                <p className="text-body-sm text-on-surface-variant">
                  Selesaikan pembayaran via Virtual Account (VA) dengan cepat
                </p>
              </div>

              {/* Step 7: Item Collection */}
              <div className="bg-white p-6 rounded-2xl border border-outline-variant/10 shadow-sm hover:shadow-md transition-all text-center group hover:border-primary/30 sm:col-span-2 lg:col-span-1 xl:col-span-1">
                <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-primary-fixed/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-2xl text-primary">
                    inventory_2
                  </span>
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
                onClick={() => handleActionClick("Daftar Sekarang")}
                className="px-8 py-3.5 bg-primary text-on-primary rounded-xl font-bold text-body-md btn-press transition-all hover:bg-primary/90 shadow-lg shadow-primary/20 inline-flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">person_add</span>
                Daftar Sekarang
              </button>
            </div>
          </div>
        </section>

        {/* ========== TESTIMONIALS ========== */}
        <section className="py-12 md:py-16 bg-surface-container-low/30">
          <div className="max-w-container-max mx-auto px-margin-page">
            <div className="text-center mb-10">
              <h2 className="text-heading-2xl font-bold text-on-background">
                Apa Kata Mereka?
              </h2>
              <p className="text-body-lg text-on-surface-variant mt-2">
                Pengalaman nyata dari para pemenang lelang BIDKU
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Testimonial 1 */}
              <div className="testimonial-card bg-white/50 backdrop-blur-md border border-white/60 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-11 h-11 rounded-full bg-secondary-fixed flex items-center justify-center font-bold text-on-secondary-fixed text-body-md">
                    BS
                  </div>
                  <div>
                    <h4 className="font-bold text-body-md">Bambang Susilo</h4>
                    <p className="text-body-sm text-outline">Pemenang Toyota Avanza</p>
                  </div>
                </div>
                <div className="flex text-primary mb-2">
                  <span className="material-symbols-outlined text-sm filled">star</span>
                  <span className="material-symbols-outlined text-sm filled">star</span>
                  <span className="material-symbols-outlined text-sm filled">star</span>
                  <span className="material-symbols-outlined text-sm filled">star</span>
                  <span className="material-symbols-outlined text-sm filled">star</span>
                </div>
                <p className="text-body-md text-on-surface-variant italic leading-relaxed">
                  "Proses bidding di BIDKU sangat transparan dan mudah diikuti. Saya
                  mendapatkan mobil idaman dengan harga yang jauh lebih kompetitif."
                </p>
              </div>
              {/* Testimonial 2 */}
              <div className="testimonial-card bg-white/50 backdrop-blur-md border border-white/60 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-11 h-11 rounded-full bg-primary-fixed flex items-center justify-center font-bold text-on-primary-fixed text-body-md">
                    RM
                  </div>
                  <div>
                    <h4 className="font-bold text-body-md">Ratna Mutia</h4>
                    <p className="text-body-sm text-outline">Pemenang Honda Brio</p>
                  </div>
                </div>
                <div className="flex text-primary mb-2">
                  <span className="material-symbols-outlined text-sm filled">star</span>
                  <span className="material-symbols-outlined text-sm filled">star</span>
                  <span className="material-symbols-outlined text-sm filled">star</span>
                  <span className="material-symbols-outlined text-sm filled">star</span>
                  <span className="material-symbols-outlined text-sm filled">star</span>
                </div>
                <p className="text-body-md text-on-surface-variant italic leading-relaxed">
                  "Awalnya ragu lelang online, tapi setelah coba di BIDKU ternyata aman
                  banget. Verifikasi datanya ketat, tidak khawatir ada penipuan."
                </p>
              </div>
              {/* Testimonial 3 */}
              <div className="testimonial-card bg-white/50 backdrop-blur-md border border-white/60 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-11 h-11 rounded-full bg-secondary-fixed flex items-center justify-center font-bold text-on-secondary-fixed text-body-md">
                    AP
                  </div>
                  <div>
                    <h4 className="font-bold text-body-md">Aditya Pratama</h4>
                    <p className="text-body-sm text-outline">Pemenang Alat Berat</p>
                  </div>
                </div>
                <div className="flex text-primary mb-2">
                  <span className="material-symbols-outlined text-sm filled">star</span>
                  <span className="material-symbols-outlined text-sm filled">star</span>
                  <span className="material-symbols-outlined text-sm filled">star</span>
                  <span className="material-symbols-outlined text-sm filled">star</span>
                  <span className="material-symbols-outlined text-sm filled">star</span>
                </div>
                <p className="text-body-md text-on-surface-variant italic leading-relaxed">
                  "Sangat terbantu untuk pengadaan unit usaha kami. Deskripsi unit jujur
                  sesuai grade, memudahkan estimasi sebelum bidding."
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ========== BLOG & TIPS SECTION ========== */}
        <section className="py-12 md:py-16 bg-surface-container-low/30 border-t border-outline-variant/10">
          <div className="max-w-container-max mx-auto px-margin-page">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
              <div>
                <h2 className="text-heading-2xl font-bold text-on-background">
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
              {/* Article 1 */}
              <article className="group bg-white/50 backdrop-blur-md border border-white/60 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all">
                <div className="aspect-video overflow-hidden bg-surface-container-low">
                  <img
                    alt="Tips Membeli Mobil Bekas Lewat Lelang"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAfO6fRTBCfJVz6MUYCEQuH3UDV81F-F4DY_MQbOx18fvPHR0qu3z6dqm-XIHHrYpEsl-LUvyzzVw_rp9xw2ghrTUmUTz3239DZ7OUAAVjaIOedVl6K5emlIYjlz81T1VKKI8PugGBlfIwam3VPYHuUMUCCxIEBfN-bJXqFfvP6GPBQ8SRQT-HbBIgrbsbbvxtc6acdLRGMX5q5ScguyKNiTVPgNQdpCLmt1lOjJz8couih2BWAfseY00DK7axG4bWw30rAHVe6njfB"
                  />
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2 text-body-sm text-outline mb-3">
                    <span className="material-symbols-outlined text-sm">
                      calendar_today
                    </span>
                    <span>12 Juni 2024</span>
                    <span className="w-px h-3 bg-outline-variant/30"></span>
                    <span className="material-symbols-outlined text-sm">schedule</span>
                    <span>5 menit baca</span>
                  </div>
                  <h4 className="font-bold text-heading-md mb-2 group-hover:text-primary transition-colors">
                    Tips Membeli Mobil Bekas Lewat Lelang
                  </h4>
                  <p className="text-body-md text-on-surface-variant mb-4 line-clamp-2">
                    Pelajari cara memeriksa kondisi dokumen kendaraan agar tidak salah pilih
                    saat mengikuti lelang online.
                  </p>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handleActionClick("Baca Artikel 1");
                    }}
                    className="inline-flex items-center gap-1 text-primary font-bold text-body-sm hover:gap-2 transition-all"
                  >
                    Baca Selengkapnya
                    <span className="material-symbols-outlined text-sm">
                      arrow_forward
                    </span>
                  </a>
                </div>
              </article>

              {/* Article 2 */}
              <article className="group bg-white/50 backdrop-blur-md border border-white/60 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all">
                <div className="aspect-video overflow-hidden bg-surface-container-low">
                  <img
                    alt="Panduan Lengkap Lelang Digital 2024"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDx_9SWM1Z1hW6_ynwMqo7kT08ssXXJsGSjibfPe57XznHvi41Mjkt_jbGy2-a-fycvwk4nWH-5hnGlwnp8whWELZ8pnG5Wn3HWlbNIMntoz4ZlhohDti-SiLDsyXHy0w7sLLVEiGae386QxYS6XpMnVccBqdLunYwvCBAofP1PVuJ06D3eZMDxE7kbVO-Bqv_c3hUHPl9BWSeq3qkYHWBvv239rgOVx49WJqOn7TN_vhwg0VV1-q_vqf7m_6HOyuTivEWRM9MrhzrM"
                  />
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2 text-body-sm text-outline mb-3">
                    <span className="material-symbols-outlined text-sm">
                      calendar_today
                    </span>
                    <span>8 Juni 2024</span>
                    <span className="w-px h-3 bg-outline-variant/30"></span>
                    <span className="material-symbols-outlined text-sm">schedule</span>
                    <span>8 menit baca</span>
                  </div>
                  <h4 className="font-bold text-heading-md mb-2 group-hover:text-primary transition-colors">
                    Panduan Lengkap Lelang Digital 2024
                  </h4>
                  <p className="text-body-md text-on-surface-variant mb-4 line-clamp-2">
                    Langkah demi langkah mengikuti lelang mulai dari pendaftaran akun hingga
                    pengambilan unit untuk pemula.
                  </p>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handleActionClick("Baca Artikel 2");
                    }}
                    className="inline-flex items-center gap-1 text-primary font-bold text-body-sm hover:gap-2 transition-all"
                  >
                    Baca Selengkapnya
                    <span className="material-symbols-outlined text-sm">
                      arrow_forward
                    </span>
                  </a>
                </div>
              </article>

              {/* Article 3 */}
              <article className="group bg-white/50 backdrop-blur-md border border-white/60 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all">
                <div className="aspect-video overflow-hidden bg-surface-container-low">
                  <img
                    alt="Keunggulan Grade Kendaraan di IBID"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAYN8O2A-8z9old1jiYKN3bl_YAgSjeeNrRfz65SyUOBZcClgtIAicB1Ef3G5ynkpckI4VeZbQ4euupLkJTi_0aOr3T_rmdoTSKwmPZoazXlnAh4I0nTlRtAvoiZJtrsvf3dRTzqXsNGpE2FX3rMHjM1YTvVRXkAVR62eV5Nm7ejEPopOiLePfyyDieJ7ak_hWwkhHnCRN1D3ouQ7Mg0Jnpq282YGoAgtZRiSIT8I4oud5JRGOokCF5DfXUp0Njgamd-sK7LQt10xZl"
                  />
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2 text-body-sm text-outline mb-3">
                    <span className="material-symbols-outlined text-sm">
                      calendar_today
                    </span>
                    <span>3 Juni 2024</span>
                    <span className="w-px h-3 bg-outline-variant/30"></span>
                    <span className="material-symbols-outlined text-sm">schedule</span>
                    <span>6 menit baca</span>
                  </div>
                  <h4 className="font-bold text-heading-md mb-2 group-hover:text-primary transition-colors">
                    Keunggulan Grade Kendaraan di BIDKU
                  </h4>
                  <p className="text-body-md text-on-surface-variant mb-4 line-clamp-2">
                    Memahami sistem penilaian grade A hingga E pada unit lelang untuk
                    menjamin kepuasan pembeli.
                  </p>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handleActionClick("Baca Artikel 3");
                    }}
                    className="inline-flex items-center gap-1 text-primary font-bold text-body-sm hover:gap-2 transition-all"
                  >
                    Baca Selengkapnya
                    <span className="material-symbols-outlined text-sm">
                      arrow_forward
                    </span>
                  </a>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* ========== FAQ SECTION ========== */}
        <section id="faq" className="py-12 md:py-16 bg-surface-container-low/30">
          <div className="max-w-container-max mx-auto px-margin-page">
            <div className="text-center mb-10">
              <h2 className="text-heading-2xl font-bold text-on-background">
                Pertanyaan Umum
              </h2>
              <p className="text-body-lg text-on-surface-variant mt-2">
                Temukan jawaban atas pertanyaan yang sering diajukan seputar lelang BIDKU
              </p>
            </div>

            <div className="max-w-3xl mx-auto flex flex-col gap-3">
              {/* FAQ 1 */}
              <div className="bg-white rounded-2xl border border-outline-variant/10 shadow-sm overflow-hidden">
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
              <div className="bg-white rounded-2xl border border-outline-variant/10 shadow-sm overflow-hidden">
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
              <div className="bg-white rounded-2xl border border-outline-variant/10 shadow-sm overflow-hidden">
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
              <div className="bg-white rounded-2xl border border-outline-variant/10 shadow-sm overflow-hidden">
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
              <div className="bg-white rounded-2xl border border-outline-variant/10 shadow-sm overflow-hidden">
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

        {/* ========== FINAL CTA ========== */}
        <section className="final-cta-luxury py-16 md:py-20">
          <div className="max-w-container-max mx-auto px-margin-page text-center">
            <h2 className="text-heading-3xl md:text-[3rem] font-extrabold text-black/70">
              Siap Menemukan Penawaran Terbaik?
            </h2>
            <p className="text-body-lg text-black/70 max-w-xl mx-auto mt-3">
              Bergabung sekarang dan ikuti berbagai lelang menarik dari seluruh Indonesia
            </p>
            <div className="flex flex-wrap justify-center gap-4 mt-8">
              <button
                onClick={() => handleActionClick("Daftar Sekarang")}
                className="px-8 py-4 bg-primary text-white rounded-xl font-bold text-body-md btn-press transition-all hover:bg-white/90 hover:text-secondary shadow-xl shadow-black/10 flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">person_add</span>
                Daftar Sekarang
              </button>
              <button
                onClick={() => handleActionClick("Lihat Lelang Aktif")}
                className="px-8 py-4 border-2 border-black/30 text-black/70 rounded-xl font-bold text-body-md btn-press transition-all hover:bg-black/10 flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">visibility</span>
                Lihat Lelang Aktif
              </button>
            </div>
            <p className="text-black/50 text-body-sm mt-6">
              *Gratis mendaftar. Tanpa komitmen.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
