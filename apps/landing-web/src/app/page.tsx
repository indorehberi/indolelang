"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

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

function LotCard({
  lot,
  timers,
  formatTime,
  handleActionClick,
}: {
  lot: any;
  timers: Record<string, number>;
  formatTime: (sec: number) => string;
  handleActionClick: (act: string) => void;
}) {
  const isLive = lot.status === "Live";
  const timerVal = timers[lot.timerKey] || 0;

  return (
    <div className="auction-card bg-white/50 backdrop-blur-md border border-white/60 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all flex flex-col justify-between h-full">
      <div>
        <div className="relative aspect-[4/3] overflow-hidden bg-surface-container-low">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="w-full h-full object-cover"
            alt={lot.title}
            src={lot.image}
          />
          <div className={`absolute top-2 left-2 px-2.5 py-1 text-badge-text font-bold rounded-full ${isLive ? "bg-secondary text-on-secondary" : "bg-primary text-on-primary"}`}>
            {lot.status}
          </div>

          {/* Auction Type Badge */}
          <div className="absolute top-2 right-2 px-2.5 py-1 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold rounded-full flex items-center gap-1">
            <span className="material-symbols-outlined text-[10px] filled text-secondary-fixed">
              {lot.jenisLelang === "Lelang Terbuka" ? "gavel" : "lock"}
            </span>
            {lot.jenisLelang}
          </div>

          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-white text-body-sm font-medium">
            <span className="flex items-center gap-1 bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded-full">
              <span className="material-symbols-outlined text-sm">timer</span>
              <span className="countdown-badge">
                {isLive ? formatTime(timerVal) : (lot.timerLabel || "Segera")}
              </span>
            </span>
            <span className="flex items-center gap-1 bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded-full">
              <span className="material-symbols-outlined text-sm">group</span>
              {lot.participants}
            </span>
          </div>
        </div>
        <div className="p-4">
          <div className="flex justify-between items-start mb-1 gap-2">
            <h4 className="font-bold text-body-md truncate">
              {lot.title}
            </h4>
            <span className="px-2 py-0.5 bg-surface-container-low text-body-sm font-bold rounded">
              {lot.grade}
            </span>
          </div>
          <p className="text-body-sm text-outline flex items-center gap-1 mb-3">
            <span className="material-symbols-outlined text-sm">
              location_on
            </span>
            {lot.location}
          </p>
        </div>
      </div>
      <div className="p-4 pt-0">
        <div className="flex justify-between items-end">
          <div>
            <p className="text-body-sm text-outline">Harga Dasar</p>
            <p className="text-heading-lg font-bold text-primary">
              Rp {lot.hargaDasar.toLocaleString("id-ID")}
            </p>
          </div>
          <button
            onClick={() => handleActionClick(`${isLive ? "Bid" : "Ingatkan"} ${lot.title}`)}
            className={`px-4 py-2 rounded-xl font-bold text-body-sm btn-press transition-all ${isLive ? "bg-premium text-on-premium shadow-sm hover:bg-premium/85" : "border-2 border-premium/20 text-premium hover:bg-premium hover:text-on-premium"}`}
          >
            {isLive ? "Bid" : "Ingatkan"}
          </button>
        </div>
      </div>
    </div>
  );
}

const initialLots = [
  {
    id: "1",
    title: "Toyota Avanza 1.3 G",
    grade: "B",
    location: "Jakarta Selatan",
    hargaDasar: 135000000,
    status: "Live",
    timerKey: "avanza",
    participants: 47,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBcS6tHKZpYYGzVd6NalL2sAwQ1i-oYWHGMg49cGf4YAschTELEp7pAOrezDdK7olQ3ndB21B1myenWUoLPNrW75NL_EfzKrRBazlhfxoTA0PSVXEjPFdDGaDNqxHZH3tptfatQgF6mTOgwwPZIcqeUSg_bnrWYV8RJ-Slr6Z2ltr1p5HPZjgZq16T_SVGJiQS2g7kuBo3hMXsW6tXG2JrTCu7N6moS_dGbowWE0j21z4vHv3DsDFv7XME5r0MDFozTzH0n9ug2sHhp",
    jenisLelang: "English Auction",
    featured: false,
  },
  {
    id: "2",
    title: "Honda CR-V 1.5 Turbo",
    grade: "A",
    location: "Surabaya",
    hargaDasar: 310000000,
    status: "Akan Datang",
    timerKey: "crv",
    timerLabel: "2 Hari",
    participants: 89,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAGJyrSIiC5CrjQ9ie6mdjiTukPacM8oYuRPhzR3WM3ldKjSIPxknbMVrUcq4MZtcHRxMwYosqUSfDCT1upZc-E-WE5mYQQ9MLyH4yPLAjXLhJEawqhzcn9LV7tYkI8mZxjLzxkAg5RfzTEU5JJIsVEV9pE--k0LXtch0ZYYRBbsHN0rxel0IldTrktEIwbs_M4NpsGoUUL1gkx5fTfp80e6PSQ0Oe5YOs0KNjAKBOUR9IqXHGgADXQKHRG_n9XaNBxQIOfBJTw_fGD",
    jenisLelang: "English Auction",
    featured: false,
  },
  {
    id: "3",
    title: "Toyota Hilux 2.4 V",
    grade: "B",
    location: "Medan",
    hargaDasar: 285000000,
    status: "Live",
    timerKey: "hilux",
    participants: 34,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuB67l1UA3O3JqEltSt7_FoCtmkwazDVgtHh3zFH0--lZmvp7mKfkzCMLmT52NrO1D0X_UNyvrEO8wU1Y-V3crXAMKKfdKFiSVl_txDOE7P24t3idlxaEx0E9_HxZWh47SNE1mPkgtYNlJdtdgO03ZvxtVvXYjXo-jY0fmtkYKj8BSSvnVN8A8KXhatbMHKO-IuzBXbcU4N1SWJ4RyM7JwNDUmEU1-yOJtqHBm_Sv7ls52p9W4HgMu8VUCWtu9B4v7sSaGecisbNcYxW",
    jenisLelang: "English Auction",
    featured: false,
  },
  {
    id: "4",
    title: "Honda Brio 1.2 RS",
    grade: "A",
    location: "Semarang",
    hargaDasar: 98000000,
    status: "Live",
    timerKey: "brio",
    participants: 56,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAYN8O2A-8z9old1jiYKN3bl_YAgSjeeNrRfz65SyUOBZcClgtIAicB1Ef3G5ynkpckI4VeZbQ4euupLkJTi_0aOr3T_rmdoTSKwmPZoazXlnAh4I0nTlRtAvoiZJtrsvf3dRTzqXsNGpE2FX3rMHjM1YTvVRXkAVR62eV5Nm7ejEPopOiLePfyyDieJ7ak_hWwkhHnCRN1D3ouQ7Mg0Jnpq282YGoAgtZRiSIT8I4oud5JRGOokCF5DfXUp0Njgamd-sK7LQt10xZl",
    jenisLelang: "Sealed-Bid",
    featured: false,
  },
  {
    id: "5",
    title: "Mitsubishi Pajero Sport",
    grade: "A",
    location: "Jakarta Pusat",
    hargaDasar: 425000000,
    status: "Live",
    timerKey: "pajero",
    participants: 72,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDx_9SWM1Z1hW6_ynwMqo7kT08ssXXJsGSjibfPe57XznHvi41Mjkt_jbGy2-a-fycvwk4nWH-5hnGlwnp8whWELZ8pnG5Wn3HWlbNIMntoz4ZlhohDti-SiLDsyXHy0w7sLLVEiGae386QxYS6XpMnVccBqdLunYwvCBAofP1PVuJ06D3eZMDxE7kbVO-Bqv_c3hUHPl9BWSeq3qkYHWBvv239rgOVx49WJqOn7TN_vhwg0VV1-q_vqf7m_6HOyuTivEWRM9MrhzrM",
    jenisLelang: "Buy Now + Auction",
    featured: true,
  },
  {
    id: "6",
    title: "BMW X5 xDrive30d",
    grade: "A",
    location: "Tangerang",
    hargaDasar: 1150000000,
    status: "Akan Datang",
    timerKey: "bmw",
    timerLabel: "3 Hari",
    participants: 104,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDx_9SWM1Z1hW6_ynwMqo7kT08ssXXJsGSjibfPe57XznHvi41Mjkt_jbGy2-a-fycvwk4nWH-5hnGlwnp8whWELZ8pnG5Wn3HWlbNIMntoz4ZlhohDti-SiLDsyXHy0w7sLLVEiGae386QxYS6XpMnVccBqdLunYwvCBAofP1PVuJ06D3eZMDxE7kbVO-Bqv_c3hUHPl9BWSeq3qkYHWBvv239rgOVx49WJqOn7TN_vhwg0VV1-q_vqf7m_6HOyuTivEWRM9MrhzrM",
    jenisLelang: "English Auction",
    featured: true,
  },
  {
    id: "7",
    title: "Daihatsu Xenia 1.5 R",
    grade: "B",
    location: "Bandung",
    hargaDasar: 165000000,
    status: "Live",
    timerKey: "xenia",
    participants: 38,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAfO6fRTBCfJVz6MUYCEQuH3UDV81F-F4DY_MQbOx18fvPHR0qu3z6dqm-XIHHrYpEsl-LUvyzzVw_rp9xw2ghrTUmUTz3239DZ7OUAAVjaIOedVl6K5emlIYjlz81T1VKKI8PugGBlfIwam3VPYHuUMUCCxIEBfN-bJXqFfvP6GPBQ8SRQT-HbBIgrbsbbvxtc6acdLRGMX5q5ScguyKNiTVPgNQdpCLmt1lOjJz8couih2BWAfseY00DK7axG4bWw30rAHVe6njfB",
    jenisLelang: "Sealed-Bid",
    featured: true,
  },
  {
    id: "8",
    title: "Yamaha NMAX Connected",
    grade: "A",
    location: "Yogyakarta",
    hargaDasar: 22000000,
    status: "Akan Datang",
    timerKey: "nmax",
    timerLabel: "5 Hari",
    participants: 19,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuC31zy45WQwhdCOMrDzZCm2is66KzQ3Ef-59eRlRHkxzGC5DpJj5VKLOvc3lGiQG68JH60S9yYbjI2JAl1ms-Imx6t9eaDfxqxFmaBKRys70HjrcZ5YnCiwuv-yCKaSrD7A28rXssA0Ak7J2_CZ73L4rSL6BEMP3BALcG7uqjaShWLmgCP7TdrYqffviwAtHoJO4H8Nbu1F3fC2iQnLgvWmXu_oGP3B1DIug9vTfVnGi75xhMNL1Ybhm-iHUPaTCbQVBDSpOveGl1u6",
    jenisLelang: "English Auction",
    featured: true,
  },
  {
    id: "9",
    title: "Suzuki Swift 1.2 GS",
    grade: "B",
    location: "Tangerang Selatan",
    hargaDasar: 112000000,
    status: "Live",
    timerKey: "swift",
    participants: 23,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAfO6fRTBCfJVz6MUYCEQuH3UDV81F-F4DY_MQbOx18fvPHR0qu3z6dqm-XIHHrYpEsl-LUvyzzVw_rp9xw2ghrTUmUTz3239DZ7OUAAVjaIOedVl6K5emlIYjlz81T1VKKI8PugGBlfIwam3VPYHuUMUCCxIEBfN-bJXqFfvP6GPBQ8SRQT-HbBIgrbsbbvxtc6acdLRGMX5q5ScguyKNiTVPgNQdpCLmt1lOjJz8couih2BWAfseY00DK7axG4bWw30rAHVe6njfB",
    jenisLelang: "Dutch Auction",
    featured: false,
  },
  {
    id: "10",
    title: "Vespa Sprint S 150",
    grade: "A",
    location: "Jakarta Barat",
    hargaDasar: 42000000,
    status: "Live",
    timerKey: "vespa",
    participants: 15,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuC31zy45WQwhdCOMrDzZCm2is66KzQ3Ef-59eRlRHkxzGC5DpJj5VKLOvc3lGiQG68JH60S9yYbjI2JAl1ms-Imx6t9eaDfxqxFmaBKRys70HjrcZ5YnCiwuv-yCKaSrD7A28rXssA0Ak7J2_CZ73L4rSL6BEMP3BALcG7uqjaShWLmgCP7TdrYqffviwAtHoJO4H8Nbu1F3fC2iQnLgvWmXu_oGP3B1DIug9vTfVnGi75xhMNL1Ybhm-iHUPaTCbQVBDSpOveGl1u6",
    jenisLelang: "Dutch Auction",
    featured: true,
  },
  {
    id: "11",
    title: "iPhone 15 Pro Max Bundle",
    grade: "A",
    location: "Bandung",
    hargaDasar: 18000000,
    status: "Live",
    timerKey: "iphone",
    participants: 41,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAGJyrSIiC5CrjQ9ie6mdjiTukPacM8oYuRPhzR3WM3ldKjSIPxknbMVrUcq4MZtcHRxMwYosqUSfDCT1upZc-E-WE5mYQQ9MLyH4yPLAjXLhJEawqhzcn9LV7tYkI8mZxjLzxkAg5RfzTEU5JJIsVEV9pE--k0LXtch0ZYYRBbsHN0rxel0IldTrktEIwbs_M4NpsGoUUL1gkx5fTfp80e6PSQ0Oe5YOs0KNjAKBOUR9IqXHGgADXQKHRG_n9XaNBxQIOfBJTw_fGD",
    jenisLelang: "Timed Auction",
    featured: false,
  },
  {
    id: "12",
    title: "Toyota Raize 1.0T CVT",
    grade: "A",
    location: "Jakarta Barat",
    hargaDasar: 210000000,
    status: "Live",
    timerKey: "raize",
    participants: 12,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDx_9SWM1Z1hW6_ynwMqo7kT08ssXXJsGSjibfPe57XznHvi41Mjkt_jbGy2-a-fycvwk4nWH-5hnGlwnp8whWELZ8pnG5Wn3HWlbNIMntoz4ZlhohDti-SiLDsyXHy0w7sLLVEiGae386QxYS6XpMnVccBqdLunYwvCBAofP1PVuJ06D3eZMDxE7kbVO-Bqv_c3hUHPl9BWSeq3qkYHWBvv239rgOVx49WJqOn7TN_vhwg0VV1-q_vqf7m_6HOyuTivEWRM9MrhzrM",
    jenisLelang: "Buy Now + Auction",
    featured: true,
  },
  {
    id: "13",
    title: "Paket Alat Kantor PT ABC",
    grade: "B",
    location: "Surabaya",
    hargaDasar: 45000000,
    status: "Live",
    timerKey: "ptabc",
    participants: 8,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAs9bK1pYSqW-cfuVQ0j_xaNa18g0-LSKMlqXs886QplfdQJMpEpP1QMActoH4cjgCfElrjUmVeKBxZVQVERgNfc2zSLCVv2UcnDiN6IO_QCfIakOyYLKtnmAgPKmKsWBa1ORjMrEM06UyeALxwJt3IrYZgbWJlt-xUYGT82U7KK4daYCRCfpOkvmNGrixxaYWSqkLiku5XuFG82BcpZl5LPtaAHB0dIz4IU5kzkOoMJYeEbJFBusmFinqTtPOlivVZ31ihUEJH1e64",
    jenisLelang: "Group/Bundle",
    featured: false,
  },
];

export default function Home() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [lotsList, setLotsList] = useState(initialLots);
  const isLiveAuctionRunning = lotsList.some((lot) => lot.status === "Live");
  const [enabledTypes, setEnabledTypes] = useState({ english: true, dutch: true, sealed: true, timed: true, buynow: true, group: true });
  const [enabledCategories, setEnabledCategories] = useState({ mobil: true, motor: true, properti: true, heavy: true });

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
        dutch: cookieMap["feat_auction_dutch"] !== "false",
        sealed: cookieMap["feat_auction_sealed"] !== "false",
        timed: cookieMap["feat_auction_timed"] !== "false",
        buynow: cookieMap["feat_auction_buynow"] !== "false",
        group: cookieMap["feat_auction_group"] !== "false",
      });

      setEnabledCategories({
        mobil: cookieMap["feat_category_mobil"] !== "false",
        motor: cookieMap["feat_category_motor"] !== "false",
        properti: cookieMap["feat_category_properti"] !== "false",
        heavy: cookieMap["feat_category_heavy"] !== "false",
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
      router.push("/register/bidder");
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
            className="flex-1 px-4 py-2.5 bg-[#178630] text-white rounded-xl font-bold text-sm btn-press btn-shine transition-all shadow-lg shadow-[#178630]/15 hover:bg-[#178630]/90 text-center"
          >
            Daftar Sekarang
          </button>
          <button
            onClick={() => handleActionClick("Lihat Lelang Aktif")}
            className="flex-1 px-4 py-2.5 bg-[#f67904] text-white rounded-xl font-bold text-sm btn-press transition-all hover:bg-[#f67904]/90 text-center"
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
              <div className="text-center p-4 rounded-xl bg-white/40 backdrop-blur-md border border-white/60 shadow-sm transition-all duration-500 hover:-translate-y-1">
                <p className="stat-number text-primary">
                  <AnimatedCounter target={1200} suffix="+" />
                </p>
                <p className="text-body-sm font-medium text-outline mt-0.5">
                  Lot Terjual / Bulan
                </p>
              </div>
              <div className="text-center p-4 rounded-xl bg-white/40 backdrop-blur-md border border-white/60 shadow-sm transition-all duration-500 hover:-translate-y-1">
                <p className="stat-number text-primary">
                  <AnimatedCounter target={3400} suffix="+" />
                </p>
                <p className="text-body-sm font-medium text-outline mt-0.5">
                  Peserta Aktif
                </p>
              </div>
              <div className="text-center p-4 rounded-xl bg-white/40 backdrop-blur-md border border-white/60 shadow-sm transition-all duration-500 hover:-translate-y-1">
                <p className="stat-number text-primary">
                  <AnimatedCounter target={120} prefix="Rp " suffix="M+" />
                </p>
                <p className="text-body-sm font-medium text-outline mt-0.5">
                  Nilai Transaksi
                </p>
              </div>
              <div className="text-center p-4 rounded-xl bg-white/40 backdrop-blur-md border border-white/60 shadow-sm transition-all duration-500 hover:-translate-y-1">
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
              )}
              {/* Motor */}
              {enabledCategories.motor && (
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
              )}
              {/* Komersial */}
              {enabledCategories.heavy && (
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
              )}
              {/* Properti */}
              {enabledCategories.properti && (
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
              )}
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
                  timers={timers}
                  formatTime={formatTime}
                  handleActionClick={handleActionClick}
                />
              ))}
            </div>
          </div>
        </section>

        {/* ========== FEATURED AUCTIONS ========== */}
        <section className="py-12 md:py-16 bg-surface-container-low/30 border-t border-outline-variant/10">
          <div className="max-w-container-max mx-auto px-margin-page">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
              <div>
                <h2 className="text-heading-2xl font-bold text-on-background font-serif">
                  Lelang Unggulan
                </h2>
                <p className="text-body-lg text-on-surface-variant mt-1">
                  Rekomendasi terbaik khusus untuk Anda
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
              {lotsList.filter((l) => l.featured).slice(0, 4).map((lot) => (
                <LotCard
                  key={lot.id}
                  lot={lot}
                  timers={timers}
                  formatTime={formatTime}
                  handleActionClick={handleActionClick}
                />
              ))}
            </div>
          </div>
        </section>

        {/* ========== SUB-LIST: ENGLISH AUCTION ========== */}
        {enabledTypes.english && (
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
                    timers={timers}
                    formatTime={formatTime}
                    handleActionClick={handleActionClick}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ========== SUB-LIST: DUTCH AUCTION ========== */}
        {enabledTypes.dutch && (
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
                    timers={timers}
                    formatTime={formatTime}
                    handleActionClick={handleActionClick}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ========== SUB-LIST: SEALED BID ========== */}
        {enabledTypes.sealed && (
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
                    timers={timers}
                    formatTime={formatTime}
                    handleActionClick={handleActionClick}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ========== SUB-LIST: TIMED AUCTION ========== */}
        {enabledTypes.timed && (
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
                    timers={timers}
                    formatTime={formatTime}
                    handleActionClick={handleActionClick}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ========== SUB-LIST: BUY NOW + AUCTION ========== */}
        {enabledTypes.buynow && (
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
                    timers={timers}
                    formatTime={formatTime}
                    handleActionClick={handleActionClick}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ========== SUB-LIST: GROUP/BUNDLE ========== */}
        {enabledTypes.group && (
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
                    timers={timers}
                    formatTime={formatTime}
                    handleActionClick={handleActionClick}
                  />
                ))}
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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
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
                onClick={() => handleActionClick("Daftar Sekarang")}
                className="px-8 py-3.5 bg-premium text-on-premium rounded-xl font-bold text-body-md btn-press btn-shine transition-all hover:bg-premium/85 shadow-lg shadow-premium/15 inline-flex items-center gap-2"
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
              <h2 className="text-heading-2xl font-bold text-on-background font-serif">
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
                onClick={() => handleActionClick("Daftar Sekarang")}
                className="px-8 py-4 bg-[#178630] text-white rounded-xl font-bold text-body-md btn-press btn-shine transition-all hover:bg-[#178630]/90 shadow-xl shadow-[#178630]/15 flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">person_add</span>
                Daftar Sekarang
              </button>
              <button
                onClick={() => handleActionClick("Lihat Lelang Aktif")}
                className="px-8 py-4 bg-[#f67904] text-white rounded-xl font-bold text-body-md btn-press transition-all hover:bg-[#f67904]/90 shadow-xl shadow-[#f67904]/15 flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">visibility</span>
                Lihat Lelang Aktif
              </button>
            </div>
            <p className="text-white/50 text-body-sm mt-6">
              *Gratis mendaftar. Tanpa komitmen.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
