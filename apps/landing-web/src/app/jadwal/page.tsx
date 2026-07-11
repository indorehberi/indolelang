"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { usePublicSessions } from "@/hooks/usePublicData";

const initialSessions: any[] = [];

export default function JadwalPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("Semua Wilayah");
  const [sessionsList, setSessionsList] = useState<any[]>(initialSessions);

  const { data: dbSessions = [] } = usePublicSessions();

  useEffect(() => {
    if (dbSessions && dbSessions.length > 0) {
      const mapped = dbSessions.map((s: any) => ({
        id: s.id.substring(0, 8).toUpperCase(),
        name: s.title,
        dateTime: new Date(s.scheduled_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) + ", " + new Date(s.scheduled_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + " WIB",
        lotCount: `${s._count?.lots || 0} Lot`,
        deposit: "Rp 5.000.000 / NIPL",
        region: s.branch?.city || "Jakarta",
        status: s.status.toLowerCase() === "live" ? "Sedang Berlangsung" : "Membuka Pendaftaran",
        statusStyle: s.status.toLowerCase() === "live" ? "bg-error/15 text-error" : "bg-success/15 text-success",
      }));
      setSessionsList(mapped);
    }
  }, [dbSessions]);

  const uniqueRegions = Array.from(new Set(sessionsList.map(s => s.region))).filter(Boolean);

  const filteredSessions = sessionsList.filter((session) => {
    const matchesSearch = session.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesRegion =
      selectedRegion === "Semua Wilayah" || session.region === selectedRegion;
    return matchesSearch && matchesRegion;
  });

  return (
    <div className="min-h-screen bg-surface">
      <Header />

      <main className="max-w-container-max mx-auto px-6 py-10">
        <h1 className="text-heading-xl font-black text-on-surface leading-tight font-serif">
          Jadwal Sesi Lelang Aktif
        </h1>
        <p className="text-body-lg text-on-surface-variant mt-2 max-w-2xl">
          Daftarkan diri Anda pada sesi lelang dan bayar uang jaminan sebelum sesi dimulai untuk mendapatkan NIPL.
        </p>

        {/* Toolbar / Filters */}
        <div className="bg-white rounded-3xl p-6 border border-outline-variant/20 shadow-sm mt-8">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center mb-6">
            <div className="flex flex-1 flex-col sm:flex-row gap-3">
              <div className="relative flex-1 max-w-md">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline">
                  search
                </span>
                <input
                  type="text"
                  placeholder="Cari nama sesi..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-surface border border-outline-variant/60 rounded-xl text-body-md text-on-surface placeholder-outline focus:border-premium focus:ring-2 focus:ring-premium/20 focus:outline-none transition-all shadow-inner"
                />
              </div>
              <div className="relative">
                <select
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                  className="w-full sm:w-[200px] pl-4 pr-10 py-3 bg-surface border border-outline-variant/60 rounded-xl text-body-md font-medium text-on-surface appearance-none focus:border-premium focus:ring-2 focus:ring-premium/20 focus:outline-none transition-all shadow-sm cursor-pointer"
                >
                  <option>Semua Wilayah</option>
                  {uniqueRegions.map((region) => (
                    <option key={region as string} value={region as string}>{region as string}</option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none">
                  unfold_more
                </span>
              </div>
            </div>
          </div>

          {/* Table Wrapper */}
          <div className="overflow-x-auto rounded-2xl border border-outline-variant/60">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant/60">
                  <th className="py-4 px-5 text-body-sm font-bold text-on-surface uppercase tracking-wider text-center">
                    ID Sesi
                  </th>
                  <th className="py-4 px-5 text-body-sm font-bold text-on-surface uppercase tracking-wider text-center">
                    Nama Sesi Lelang
                  </th>
                  <th className="py-4 px-5 text-body-sm font-bold text-on-surface uppercase tracking-wider text-center">
                    Tanggal &amp; Waktu
                  </th>
                  <th className="py-4 px-5 text-body-sm font-bold text-on-surface uppercase tracking-wider text-center">
                    Jumlah Lot
                  </th>
                  <th className="py-4 px-5 text-body-sm font-bold text-on-surface uppercase tracking-wider text-center">
                    Uang Jaminan
                  </th>
                  <th className="py-4 px-5 text-body-sm font-bold text-on-surface uppercase tracking-wider text-center">
                    Status
                  </th>
                  <th className="py-4 px-5 text-body-sm font-bold text-on-surface uppercase tracking-wider text-center">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredSessions.length > 0 ? (
                  filteredSessions.map((session, idx) => (
                    <tr
                      key={idx}
                      className="border-b border-outline-variant/40 hover:bg-surface-container-low transition-all text-center"
                    >
                      <td className="py-4.5 px-5 text-body-sm text-on-surface-variant">
                        {session.id}
                      </td>
                      <td className="py-4.5 px-5 text-body-sm text-on-surface hover:text-primary transition-colors text-left font-medium">
                        {session.name}
                      </td>
                      <td className="py-4.5 px-5 text-body-sm text-on-surface-variant">
                        {session.dateTime}
                      </td>
                      <td className="py-4.5 px-5 text-body-sm text-on-surface">
                        {session.lotCount}
                      </td>
                      <td className="py-4.5 px-5 text-body-sm text-on-surface-variant">
                        {session.deposit}
                      </td>
                      <td className="py-4.5 px-5">
                        <span
                          className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${session.statusStyle}`}
                        >
                          {session.status}
                        </span>
                      </td>
                      <td className="py-4.5 px-5">
                        <Link
                          href="/katalog"
                          className={`text-body-sm font-bold transition-all hover:underline ${
                            session.status === "Segera Hadir"
                              ? "text-outline pointer-events-none"
                              : "text-premium"
                          }`}
                        >
                          Lihat Katalog Sesi
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-10 text-center text-body-sm text-on-surface-variant"
                    >
                      Tidak ada sesi lelang yang cocok dengan pencarian Anda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
