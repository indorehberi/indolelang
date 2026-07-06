"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiUrl } from "@/lib/api";
import BidderLayout from "../../../../components/layout/BidderLayout";

export default function BidderNiplAllocations() {
  const router = useRouter();
  const [niplStatus, setNiplStatus] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Allocate Form State
  const [allocateSessionId, setAllocateSessionId] = useState("");
  const [allocateUnitType, setAllocateUnitType] = useState<"mobil" | "motor">("mobil");
  const [allocateQty, setAllocateQty] = useState(1);

  // Reallocate Form State
  const [fromSessionId, setFromSessionId] = useState("");
  const [toSessionId, setToSessionId] = useState("");
  const [reallocateUnitType, setReallocateUnitType] = useState<"mobil" | "motor">("mobil");
  const [reallocateQty, setReallocateQty] = useState(1);

  const loadAllocationsData = async () => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("accessToken");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      setLoading(true);
      setErrorMsg("");

      // 1. Fetch NIPL status & allocations
      const resStatus = await fetch(apiUrl("/nipl/status"), {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (resStatus.status === 401) {
        localStorage.removeItem("accessToken");
        router.push("/login");
        return;
      }

      const resStatusData = await resStatus.json();
      if (resStatus.ok && resStatusData.success) {
        setNiplStatus(resStatusData.data);
      } else {
        setErrorMsg(resStatusData.error?.message || "Gagal memuat status NIPL");
        return;
      }

      // 2. Fetch Sessions list
      const resSessions = await fetch(apiUrl("/sessions?per_page=50"), {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (resSessions.status === 401) {
        localStorage.removeItem("accessToken");
        router.push("/login");
        return;
      }

      const resSessData = await resSessions.json();
      if (resSessions.ok && resSessData.success) {
        const list = resSessData.data || [];
        const activeSessions = list.filter((s: any) => s.status !== "draft" && s.status !== "closed");
        setSessions(activeSessions);
        if (activeSessions.length > 0) {
          setAllocateSessionId(activeSessions[0].id);
          setToSessionId(activeSessions[0].id);
        }
      } else {
        setErrorMsg(resSessData.error?.message || "Gagal memuat daftar sesi");
      }
    } catch (err) {
      console.error("Failed to load allocations", err);
      setErrorMsg("Koneksi ke server API gagal. Pastikan backend server aktif.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllocationsData();
  }, []);

  const handleAllocate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allocateSessionId) return;

    const token = localStorage.getItem("accessToken");
    setSubmitting(true);
    try {
      const response = await fetch(apiUrl("/nipl/allocate"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          session_id: allocateSessionId,
          unit_type: allocateUnitType,
          quantity: allocateQty,
        }),
      });

      const resData = await response.json();
      if (response.ok && resData.success) {
        alert("NIPL bebas berhasil dialokasikan!");
        setAllocateQty(1);
        loadAllocationsData();
      } else {
        alert(resData.error?.message || "Gagal mengalokasikan NIPL.");
      }
    } catch (err) {
      alert("Koneksi gagal. Pastikan API server aktif.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReallocate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromSessionId || !toSessionId) return;

    const token = localStorage.getItem("accessToken");
    setSubmitting(true);
    try {
      const response = await fetch(apiUrl("/nipl/reallocate"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          from_session_id: fromSessionId,
          to_session_id: toSessionId,
          unit_type: reallocateUnitType,
          quantity: reallocateQty,
        }),
      });

      const resData = await response.json();
      if (response.ok && resData.success) {
        alert("NIPL berhasil dipindahkan ke sesi tujuan!");
        setReallocateQty(1);
        loadAllocationsData();
      } else {
        alert(resData.error?.message || "Gagal memindahkan NIPL.");
      }
    } catch (err) {
      alert("Koneksi gagal. Pastikan API server aktif.");
    } finally {
      setSubmitting(false);
    }
  };

  if (errorMsg) {
    return (
      <BidderLayout pageTitle="Manajemen Alokasi NIPL">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-error text-heading-xl mb-3">⚠️</div>
          <p className="text-body-md text-slate-800 font-bold mb-2">Terjadi Kesalahan</p>
          <p className="text-xs text-slate-500 max-w-sm mb-6 leading-relaxed">{errorMsg}</p>
          <div className="flex gap-4">
            <button
              onClick={loadAllocationsData}
              className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary/95 transition-all shadow-sm"
            >
              Coba Lagi
            </button>
            <Link
              href="/login"
              className="px-4 py-2 border border-outline-variant/30 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50 transition-all"
            >
              Login Kembali
            </Link>
          </div>
        </div>
      </BidderLayout>
    );
  }

  if (loading || !niplStatus) {
    return (
      <BidderLayout pageTitle="Alokasi NIPL">
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-premium mb-4"></div>
          <p className="text-body-md text-on-surface-variant font-medium">Memuat alokasi NIPL...</p>
        </div>
      </BidderLayout>
    );
  }

  const allocsWithUnused = niplStatus.allocations.filter(
    (al: any) => al.unused_quantity > 0 && al.session_status !== "closed"
  );

  return (
    <BidderLayout pageTitle="Manajemen Alokasi NIPL">
      <p className="page-subtitle">Alokasikan jaminan NIPL Anda untuk mengikuti dan memenangkan lot kendaraan di berbagai sesi</p>

      {/* Tabs / Sub navigation */}
      <div className="flex border-b border-outline-variant/60 mb-6 gap-6">
        <Link
          href="/bidder/deposit"
          className="py-3 font-semibold text-body-md text-on-surface-variant/60 hover:text-on-surface transition-all"
        >
          💳 Setor Deposit NIPL
        </Link>
        <Link
          href="/bidder/deposit/allocations"
          className="py-3 font-bold text-body-md text-primary border-b-2 border-primary relative transition-all"
        >
          ⚙️ Kelola Alokasi NIPL
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="card">
          <div className="card-header border-b pb-2 mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-primary font-bold">
              <span className="material-symbols-outlined">directions_car</span>
              Saldo NIPL Mobil
            </div>
            <div className="text-xs bg-slate-100 px-2 py-1 rounded font-bold">{niplStatus.mobil.total_nipl_purchased >= 999 ? 'UNLIMITED' : `${niplStatus.mobil.total_nipl_purchased} NIPL`}</div>
          </div>
          <div className="flex justify-between items-center text-sm mb-2">
            <span className="text-slate-500">Bebas / Belum Dialokasi</span>
            <span className="font-bold text-success">{niplStatus.mobil.free_nipl >= 999 ? 'UNLIMITED' : niplStatus.mobil.free_nipl}</span>
          </div>
          <div className="flex justify-between items-center text-sm mb-2">
            <span className="text-slate-500">Sedang Dialokasikan</span>
            <span className="font-bold text-slate-800">{niplStatus.mobil.total_nipl_allocated}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-500">Terpakai (Menang)</span>
            <span className="font-bold text-error">{niplStatus.mobil.total_nipl_used}</span>
          </div>
        </div>

        <div className="card">
          <div className="card-header border-b pb-2 mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-primary font-bold">
              <span className="material-symbols-outlined">two_wheeler</span>
              Saldo NIPL Motor
            </div>
            <div className="text-xs bg-slate-100 px-2 py-1 rounded font-bold">{niplStatus.motor.total_nipl_purchased >= 999 ? 'UNLIMITED' : `${niplStatus.motor.total_nipl_purchased} NIPL`}</div>
          </div>
          <div className="flex justify-between items-center text-sm mb-2">
            <span className="text-slate-500">Bebas / Belum Dialokasi</span>
            <span className="font-bold text-success">{niplStatus.motor.free_nipl >= 999 ? 'UNLIMITED' : niplStatus.motor.free_nipl}</span>
          </div>
          <div className="flex justify-between items-center text-sm mb-2">
            <span className="text-slate-500">Sedang Dialokasikan</span>
            <span className="font-bold text-slate-800">{niplStatus.motor.total_nipl_allocated}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-500">Terpakai (Menang)</span>
            <span className="font-bold text-error">{niplStatus.motor.total_nipl_used}</span>
          </div>
        </div>
      </div>

      <div className="grid-2-1">
        {/* Left Column: Allocations List */}
        <div className="space-y-4">
          <div className="card">
            <div className="card-header">Daftar Alokasi NIPL Anda (Per Sesi & Unit)</div>
            <div className="space-y-3">
              {niplStatus.allocations.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6">Belum ada alokasi NIPL aktif pada sesi lelang manapun.</p>
              ) : (
                niplStatus.allocations.map((al: any) => (
                  <div key={al.id} className="p-4 border border-outline-variant/20 rounded-xl bg-slate-50 flex justify-between items-center gap-4">
                    <div>
                      <div className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px] text-primary">{al.unit_type === 'mobil' ? 'directions_car' : 'two_wheeler'}</span>
                        {al.session_title}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1.5 uppercase font-semibold">
                        Status Sesi: <span className={al.session_status === "live" ? "text-error" : "text-slate-600"}>{al.session_status}</span>
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-6">
                      <div className="text-xs">
                        <div className="text-slate-500">Alokasi: <span className="font-bold text-slate-800">{al.allocated_quantity >= 999 ? 'UNLMTD' : al.allocated_quantity} NIPL {al.unit_type.toUpperCase()}</span></div>
                        <div className="text-slate-500 mt-0.5">Menang/Terpakai: <span className="font-bold text-error">{al.used_quantity}</span></div>
                      </div>
                      <div className="px-3 py-2 bg-primary/5 border border-primary/20 text-primary font-black rounded-lg text-center text-sm">
                        {al.unused_quantity >= 999 ? 'UNLMTD' : al.unused_quantity}
                        <span className="block text-[8px] font-bold text-primary/60 mt-0.5 uppercase">Sisa Hak</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Allocate & Move Actions */}
        <div className="space-y-4">
          
          {/* Action 1: Allocate Free NIPL */}
          <div className="card">
            <div className="card-header text-primary">Alokasikan NIPL Bebas</div>
            <form onSubmit={handleAllocate} className="space-y-3">
              <p className="text-[11px] text-slate-500 leading-normal">
                Gunakan NIPL bebas Anda untuk mendaftar sesi lelang aktif/mendatang agar Anda berhak menawar lot di dalamnya.
              </p>

              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-1">Pilih Sesi Lelang</label>
                {sessions.length === 0 ? (
                  <div className="p-2.5 bg-slate-100 border rounded-xl text-xs text-slate-500">Tidak ada sesi aktif tersedia.</div>
                ) : (
                  <select
                    value={allocateSessionId}
                    onChange={(e) => setAllocateSessionId(e.target.value)}
                    className="panel-form-select text-xs py-2"
                  >
                    {sessions.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-1">Jenis Unit NIPL</label>
                <select
                  value={allocateUnitType}
                  onChange={(e) => {
                    setAllocateUnitType(e.target.value as any);
                    setAllocateQty(1);
                  }}
                  className="panel-form-select text-xs py-2"
                >
                  <option value="mobil">NIPL Mobil (Sisa: {niplStatus.mobil.free_nipl >= 999 ? 'Unlimited' : niplStatus.mobil.free_nipl})</option>
                  <option value="motor">NIPL Motor (Sisa: {niplStatus.motor.free_nipl >= 999 ? 'Unlimited' : niplStatus.motor.free_nipl})</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-1">Jumlah Alokasi (NIPL)</label>
                <select
                  value={allocateQty}
                  onChange={(e) => setAllocateQty(Number(e.target.value))}
                  className="panel-form-select text-xs py-2"
                  disabled={niplStatus[allocateUnitType].free_nipl <= 0}
                >
                  {niplStatus[allocateUnitType].free_nipl >= 999 ? (
                     <option value={999}>Unlimited NIPL</option>
                  ) : (
                    Array.from({ length: niplStatus[allocateUnitType].free_nipl }, (_, i) => i + 1).map((num) => (
                      <option key={num} value={num}>{num} NIPL</option>
                    ))
                  )}
                  {niplStatus[allocateUnitType].free_nipl === 0 && <option value={0}>0 NIPL Tersedia</option>}
                </select>
              </div>

              <button
                type="submit"
                disabled={submitting || niplStatus[allocateUnitType].free_nipl <= 0 || sessions.length === 0}
                className="w-full py-2 bg-primary hover:bg-primary/95 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5"
              >
                Simpan Alokasi
              </button>
            </form>
          </div>

          {/* Action 2: Reallocate / Move NIPLs */}
          <div className="card">
            <div className="card-header text-amber-700">Pindahkan Alokasi NIPL</div>
            <form onSubmit={handleReallocate} className="space-y-3">
              <p className="text-[11px] text-slate-500 leading-normal">
                Pindahkan NIPL yang belum terpakai dari suatu sesi lelang ke sesi lelang aktif lainnya secara instan.
              </p>

              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-1">Dari Sesi Asal & Jenis Unit</label>
                {allocsWithUnused.length === 0 ? (
                  <div className="p-2.5 bg-slate-100 border rounded-xl text-xs text-slate-500">Tidak ada NIPL bebas di sesi manapun.</div>
                ) : (
                  <select
                    value={`${fromSessionId}|${reallocateUnitType}`}
                    onChange={(e) => {
                      const [sId, uType] = e.target.value.split('|');
                      setFromSessionId(sId);
                      setReallocateUnitType(uType as any);
                      setReallocateQty(1);
                    }}
                    className="panel-form-select text-xs py-2"
                  >
                    <option value="|mobil">-- Pilih Sesi Asal --</option>
                    {allocsWithUnused.map((al: any) => (
                      <option key={al.id} value={`${al.session_id}|${al.unit_type}`}>
                        {al.session_title} - {al.unit_type.toUpperCase()} (Sisa {al.unused_quantity >= 999 ? 'Unlimited' : al.unused_quantity})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-1">Ke Sesi Tujuan</label>
                {sessions.length === 0 ? (
                  <div className="p-2.5 bg-slate-100 border rounded-xl text-xs text-slate-500">Tidak ada sesi aktif tersedia.</div>
                ) : (
                  <select
                    value={toSessionId}
                    onChange={(e) => setToSessionId(e.target.value)}
                    className="panel-form-select text-xs py-2"
                  >
                    <option value="">-- Pilih Sesi Tujuan --</option>
                    {sessions
                      .filter((s) => s.id !== fromSessionId)
                      .map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                  </select>
                )}
              </div>

              {fromSessionId && (
                <div>
                  <label className="text-[10px] font-bold text-slate-600 block mb-1">Jumlah NIPL Dipindahkan</label>
                  <select
                    value={reallocateQty}
                    onChange={(e) => setReallocateQty(Number(e.target.value))}
                    className="panel-form-select text-xs py-2"
                  >
                    {(() => {
                      const maxUnused = niplStatus.allocations.find((al: any) => al.session_id === fromSessionId && al.unit_type === reallocateUnitType)?.unused_quantity || 1;
                      if (maxUnused >= 999) return <option value={999}>Unlimited NIPL</option>;
                      return Array.from({ length: maxUnused }, (_, i) => i + 1).map((num) => (
                        <option key={num} value={num}>{num} NIPL</option>
                      ));
                    })()}
                  </select>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || !fromSessionId || !toSessionId || sessions.length === 0}
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5"
              >
                Pindahkan NIPL
              </button>
            </form>
          </div>

        </div>
      </div>
    </BidderLayout>
  );
}
