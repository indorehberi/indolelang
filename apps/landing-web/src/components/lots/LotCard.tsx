"use client";

import Link from "next/link";
import { getImageUrl, getAssetImages } from "@/lib/api";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                      */
/* -------------------------------------------------------------------------- */

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

export function formatDeadlineDate(scheduledAt: string | undefined): string {
  if (!scheduledAt) return "N/A";
  const sesi = new Date(scheduledAt);
  const deadline = addBusinessDays(sesi, 3);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(deadline.getDate())}/${pad(deadline.getMonth() + 1)}/${deadline.getFullYear()} 18:00 WIB`;
}

const formatRupiah = (v: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(v);

const formatPajak = (iso: string | undefined) => {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("id-ID", { month: "short", year: "numeric" });
};

/* -------------------------------------------------------------------------- */
/* Mapping — turns a raw lot (from /public/lots/featured or /lots) into the     */
/* shape this card renders. Single source so the katalog grid and the bidder    */
/* home grid can never drift apart.                                             */
/* -------------------------------------------------------------------------- */

export interface LotCardData {
  id: string;
  image: string;
  title: string;
  isCancelled: boolean;
  lot_number: number;
  hargaDasar: number;
  priceLabel?: string;
  view_count: number;
  like_count: number;
  location: string;
  scheduledAt?: string;
  year?: number | string;
  transmission?: string;
  odometer?: number;
  police_number?: string;
  fuel_type?: string;
  stnk_tax_date?: string;
  grade_engine?: string;
  grade_exterior?: string;
  grade_interior?: string;
  timer: string;
  action: string;
}

export function mapLotToCard(dbLot: any): LotCardData {
  const image = getImageUrl(getAssetImages(dbLot.asset)[0]);
  const status = dbLot.status?.toLowerCase();
  const isCancelled = status === "cancelled";
  const isSold = status === "sold";
  const isLiveRaw = status === "active";
  let isLive = isLiveRaw && !isCancelled;
  let timerText = "Akan Datang";

  if (isCancelled) {
    timerText = "Dibatalkan";
  } else if (isSold) {
    timerText = "Terjual";
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

  return {
    id: dbLot.id,
    image,
    title: dbLot.asset?.title || `${dbLot.asset?.brand || ""} ${dbLot.asset?.model || ""}`.trim() || "Unit",
    isCancelled,
    lot_number: dbLot.lot_number || 0,
    hargaDasar: isSold
      ? Number(dbLot.hammer_price || dbLot.starting_price)
      : Number(dbLot.starting_price),
    priceLabel: isSold ? "Harga Terbentuk" : "Harga Dasar",
    view_count: dbLot.view_count || 0,
    like_count: dbLot.like_count || 0,
    location: dbLot.asset?.notes || dbLot.session?.branch?.city || "Jakarta",
    scheduledAt: dbLot.session?.scheduled_at || undefined,
    year: dbLot.asset?.year || undefined,
    transmission: dbLot.asset?.transmission || undefined,
    odometer: dbLot.asset?.odometer || undefined,
    police_number: dbLot.asset?.police_number || undefined,
    fuel_type: dbLot.asset?.fuel_type || undefined,
    stnk_tax_date: dbLot.asset?.stnk_tax_date || undefined,
    grade_engine: dbLot.asset?.grade_engine || undefined,
    grade_exterior: dbLot.asset?.grade_exterior || undefined,
    grade_interior: dbLot.asset?.grade_interior || undefined,
    timer: timerText,
    action: isCancelled ? "Dibatalkan" : isSold ? "Lihat Detail" : isLive ? "Bid" : "Lihat Detail",
  };
}

/* -------------------------------------------------------------------------- */
/* Card                                                                         */
/* -------------------------------------------------------------------------- */

export default function LotCard({ lot }: { lot: LotCardData }) {
  return (
    <article className="auction-card bg-white/60 backdrop-blur-md border border-white/60 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all flex flex-col h-full group">
      {/* ── FOTO ─────────────────────────────────── */}
      <div className="relative">
        <div className="aspect-[4/3] overflow-hidden bg-surface-container-low relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className={`w-full h-full object-cover transition-transform duration-500 ${
              lot.isCancelled ? "blur-sm scale-105 grayscale" : "group-hover:scale-105"
            }`}
            alt={lot.title}
            src={lot.image}
          />
          {lot.isCancelled && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/40">
              <span className="material-symbols-outlined text-white" style={{ fontSize: 40 }}>cancel</span>
              <p className="text-xl font-black text-white tracking-widest mt-1 drop-shadow">DIBATALKAN</p>
            </div>
          )}
        </div>
        {/* No lot — pojok kiri atas */}
        <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded z-10">
          Lot {lot.lot_number || "-"}
        </div>
        {/* Harga box — menutup ~50% bawah foto */}
        {!lot.isCancelled && (
          <div className="absolute bottom-0 left-3 right-3 translate-y-1/2 z-20 bg-white rounded-xl shadow-lg px-4 py-2.5 border border-outline-variant/10 text-center">
            <p className="text-[10px] text-on-surface-variant font-semibold uppercase tracking-wide">{lot.priceLabel ?? "Harga Dasar"}</p>
            <p className="text-base font-black text-primary leading-tight">{formatRupiah(lot.hargaDasar)}</p>
          </div>
        )}
      </div>

      {/* ── BODY ─────────────────────────────────── */}
      <div className={`flex flex-col flex-1 px-4 pb-4 text-center ${lot.isCancelled ? "pt-4" : "pt-10"}`}>
        {/* Nama unit */}
        <h4 className="font-bold text-body-md text-on-surface group-hover:text-premium transition-colors line-clamp-2 mb-1">
          {lot.isCancelled ? lot.title : <Link href={`/katalog/${lot.id}`}>{lot.title}</Link>}
        </h4>

        {/* Views & likes */}
        <div className="flex items-center justify-center gap-3 text-[10px] text-slate-400 mb-2">
          <span className="flex items-center gap-0.5"><span className="material-symbols-outlined text-xs opacity-70">visibility</span> {lot.view_count ?? 0}</span>
          <span className="flex items-center gap-0.5"><span className="material-symbols-outlined text-xs opacity-70">favorite</span> {lot.like_count ?? 0}</span>
        </div>

        {/* Lokasi Unit */}
        <div className="mb-2">
          <span className="text-[10px] text-black/15 bg-black/5 font-bold px-2.5 py-0.5 rounded-xl inline-block uppercase tracking-wider">
            {lot.location || "N/A"}
          </span>
        </div>

        {/* Batas pelunasan */}
        <p className="text-[11px] text-info font-bold mb-0.5">
          Batas Pelunasan : 3 HK
        </p>
        <p className="text-[10px] text-on-surface-variant mb-3">{lot.scheduledAt ? formatDeadlineDate(lot.scheduledAt) : "N/A"}</p>

        {/* Tabel Info Kendaraan */}
        <div className="-mx-4 border-y border-slate-300/80 overflow-hidden mb-3 bg-slate-900/95 text-white shadow-sm">
          <div className="bg-slate-800/90 px-3 py-1 text-[9px] font-bold uppercase tracking-wide border-b border-slate-700/90">
            Info Kendaraan
          </div>
          <div className="grid grid-cols-3 divide-x divide-slate-700/90">
            {[
              { icon: "calendar_today", val: lot.year || "-" },
              { icon: "settings", val: lot.transmission || "-" },
              { icon: "speed", val: lot.odometer ? `${Number(lot.odometer).toLocaleString("id-ID")} km` : "-" },
            ].map((c, i) => (
              <div key={i} className="px-0.5 py-1 text-center">
                <span className="material-symbols-outlined text-primary" style={{ fontSize: 11 }}>{c.icon}</span>
                <p className="text-[9px] font-semibold text-white mt-0.5 truncate">{c.val}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 divide-x divide-slate-700/90 border-t border-slate-700/90">
            {[
              { icon: "confirmation_number", val: lot.police_number || "-" },
              { icon: "local_gas_station", val: lot.fuel_type || "-" },
              { icon: "receipt_long", val: formatPajak(lot.stnk_tax_date) },
            ].map((c, i) => (
              <div key={i} className="px-0.5 py-1 text-center">
                <span className="material-symbols-outlined text-primary" style={{ fontSize: 11 }}>{c.icon}</span>
                <p className="text-[9px] font-semibold text-white mt-0.5 truncate">{c.val}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Grade Kendaraan */}
        {(lot.grade_engine || lot.grade_exterior || lot.grade_interior) && (
          <div className="-mx-4 border-y border-slate-300/80 overflow-hidden mb-3 bg-slate-900/95 text-white shadow-sm">
            <div className="bg-slate-800/90 px-3 py-1 text-[9px] font-bold uppercase tracking-wide border-b border-slate-700/90">
              Grade Kendaraan
            </div>
            <div className="grid grid-cols-3 divide-x divide-slate-700/90">
              {[
                { grade: lot.grade_engine, label: "Mesin" },
                { grade: lot.grade_exterior, label: "Eksterior" },
                { grade: lot.grade_interior, label: "Interior" },
              ].map((g, i) => (
                <div key={i} className="px-1 py-1.5 text-center text-white">
                  <p className={`text-base font-black leading-none ${
                    g.grade === "A" ? "text-green-600" :
                    g.grade === "B" ? "text-blue-600" :
                    g.grade === "C" ? "text-amber-600" :
                    g.grade === "N/A" ? "text-slate-400" : "text-red-600"
                  }`}>{g.grade || "-"}</p>
                  <p className="text-[8px] text-slate-300 mt-0.5">{g.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="mt-auto pt-3 border-t border-outline-variant/10 flex justify-center w-full">
          {lot.isCancelled ? (
            <span className="w-full text-center py-2 rounded-xl text-body-sm font-bold bg-slate-200 text-slate-400 cursor-not-allowed">
              {lot.action}
            </span>
          ) : (
            <Link
              href={`/katalog/${lot.id}`}
              className={`w-full text-center py-2 rounded-xl text-body-sm font-bold btn-press transition-colors ${
                lot.action === "Bid"
                  ? "bg-error text-white hover:bg-error/90"
                  : "bg-premium text-on-premium hover:bg-premium/85"
              }`}
            >
              {lot.action}
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
