"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiUrl, apiFetch } from "@/lib/api";
import BidderLayout from "../../../components/layout/BidderLayout";
import PageSkeleton from "@/components/ui/PageSkeleton";
import { useToast } from "@/providers/ToastProvider";
import { useRefreshOnForeground } from "@/hooks/useRefreshOnForeground";

interface CartGroup {
  session_date: string;
  invoices: any[];
  subtotal: number;
}

const formatRupiah = (value: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
};

const formatSessionDate = (isoDate: string) => {
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

/**
 * Preview how much NIPL guarantee each individual unit's bill will have
 * deducted, mirroring the backend's per-unit allocation (checkout.service.ts
 * allocateNiplDeductions) so what the bidder sees here before checking out
 * matches what actually gets persisted per invoice afterwards. A deposit's
 * unique_code is spent in full the moment it's first touched — whether that
 * drains it completely or only partially — so only the oldest units drawing
 * from a given deposit "carry" its code in this preview; the total across all
 * units is unaffected either way.
 */
function allocateNiplPreview(
  invoices: any[],
  activeDeposits: any[],
  niplSettings: { mobil: number; motor: number }
): Map<string, number> {
  const isMotor = (inv: any) => !!inv.lot?.asset?.category?.toLowerCase().includes("motor");
  const sorted = [...invoices].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  const allocateForType = (invs: any[], deposits: any[], niplValue: number) => {
    const queue = deposits.map((d) => {
      const code = Number(d.unique_code || 0);
      return { remainingBase: Number(d.amount) - code, code };
    });
    const perInvoice = new Map<string, number>();
    for (const inv of invs) {
      let need = niplValue;
      let deduction = 0;
      while (need > 0 && queue.length > 0) {
        const d = queue[0];
        if (d.remainingBase <= need) {
          deduction += d.remainingBase;
          need -= d.remainingBase;
          if (d.code > 0) {
            deduction += d.code;
            d.code = 0;
          }
          queue.shift();
        } else {
          deduction += need;
          if (d.code > 0) {
            deduction += d.code;
            d.code = 0;
          }
          d.remainingBase -= need;
          need = 0;
        }
      }
      perInvoice.set(inv.id, deduction);
    }
    return perInvoice;
  };

  const motorMap = allocateForType(
    sorted.filter(isMotor),
    activeDeposits.filter((d) => d.unit_type === "motor"),
    niplSettings.motor
  );
  const mobilMap = allocateForType(
    sorted.filter((inv) => !isMotor(inv)),
    activeDeposits.filter((d) => d.unit_type === "mobil"),
    niplSettings.mobil
  );

  return new Map<string, number>([...motorMap, ...mobilMap]);
}

export default function BidderCart() {
  const router = useRouter();

  const [groups, setGroups] = useState<CartGroup[]>([]);
  const [activeDeposits, setActiveDeposits] = useState<any[]>([]);
  const [totalDepositValue, setTotalDepositValue] = useState<number>(0);
  const [hasUnlimited, setHasUnlimited] = useState<boolean>(false);
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);
  // Defaults match the backend's own fallback (checkout.service.ts) in case
  // /settings/public is unreachable — kept in sync deliberately, not a
  // separate source of truth.
  const [niplSettings, setNiplSettings] = useState({ mobil: 5000000, motor: 1000000 });

  const [loading, setLoading] = useState(true);

  const fetchCart = async ({ silent = false }: { silent?: boolean } = {}) => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("accessToken");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      if (!silent) setLoading(true);
      const response = await apiFetch("/checkout/cart");
      const resData = await response.json();
      if (response.ok && resData.success) {
        setGroups(resData.data.groups || []);
        setActiveDeposits(resData.data.active_deposits || []);
        setTotalDepositValue(resData.data.total_deposit_value || 0);
        setHasUnlimited(resData.data.has_unlimited || false);

        if (resData.data.pending_orders?.length > 0) {
           setPendingOrders(resData.data.pending_orders);
        } else {
           setPendingOrders([]);
        }
      }
    } catch (err) {
      console.error("Failed to fetch cart", err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // On-screen NIPL deduction estimate (before the bidder submits checkout)
  // used to be hardcoded here instead of reading the real "Deposit Jaminan
  // NIPL" values from Pengaturan Platform — so if an admin changed those
  // settings, the preview shown to the bidder silently went stale. The
  // amount actually charged was always correct (processCheckout computes it
  // server-side from the same settings), only this preview was wrong.
  const fetchNiplSettings = async () => {
    try {
      const res = await apiFetch("/settings/public");
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.data)) {
        const byKey = (key: string) => data.data.find((s: any) => s.key === key)?.value;
        const mobil = Number(byKey("nipl_deposit_amount"));
        const motor = Number(byKey("nipl_motor_deposit_amount"));
        setNiplSettings({
          mobil: mobil > 0 ? mobil : 5000000,
          motor: motor > 0 ? motor : 1000000,
        });
      }
    } catch (err) {
      console.error("Failed to fetch NIPL settings", err);
    }
  };

  useEffect(() => {
    fetchCart();
    fetchNiplSettings();
  }, []);

  // Invoices and deposit balances change server-side while the PWA sits in the
  // background; refresh them when the user comes back instead of on mount only.
  useRefreshOnForeground(() => fetchCart({ silent: true }));

  if (loading) {
    return (
      <BidderLayout pageTitle="Keranjang Tagihan">
        <PageSkeleton />
      </BidderLayout>
    );
  }

  return (
    <BidderLayout pageTitle="Pelunasan">
      {/* Tabs */}
      <div className="flex border-b border-outline-variant/60 mb-6 gap-6">
        <Link
          href="/bidder/cart"
          className="py-3 font-bold text-body-md text-primary border-b-2 border-primary relative transition-all"
        >
          🛒 Pelunasan Menunggu Pembayaran
        </Link>
      </div>

      {groups.length === 0 ? (
        <div className="card p-8 text-center border-2 border-dashed border-outline-variant/40 rounded-xl">
          <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">shopping_cart</span>
          <p className="text-slate-500 text-sm">Tidak ada tagihan unit yang menunggu pembayaran.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {groups.map((group) => (
            <div key={group.session_date}>
              <CartGroupCard
                group={group}
                totalDepositValue={totalDepositValue}
                hasUnlimited={hasUnlimited}
                activeDeposits={activeDeposits}
                niplSettings={niplSettings}
                onPaid={fetchCart}
              />
            </div>
          ))}
        </div>
      )}

      {pendingOrders.length > 0 && (
        <div className="mt-12">
          <h2 className="text-xl font-bold text-slate-800 border-b border-outline-variant/60 pb-3 mb-6">Menunggu Pembayaran / Verifikasi</h2>
          <div className="space-y-8">
            {pendingOrders.map((order) => (
              <CartGroupCard
                key={order.id}
                group={{
                  session_date: order.created_at.split('T')[0],
                  invoices: order.invoices,
                  subtotal: order.subtotal_amount,
                }}
                totalDepositValue={order.deposit_deduction}
                hasUnlimited={false} // Already applied
                activeDeposits={[]} // Not needed for existing order
                niplSettings={niplSettings}
                onPaid={fetchCart}
                existingOrder={order}
              />
            ))}
          </div>
        </div>
      )}
    </BidderLayout>
  );
}

function CartGroupCard({
  group,
  totalDepositValue,
  hasUnlimited,
  activeDeposits,
  niplSettings,
  onPaid,
  existingOrder
}: {
  group: CartGroup;
  totalDepositValue: number;
  hasUnlimited: boolean;
  activeDeposits: any[];
  niplSettings: { mobil: number; motor: number };
  onPaid: () => void;
  existingOrder?: any;
}) {
  const router = useRouter();
  const toast = useToast();
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>(
    existingOrder ? group.invoices.map((i: any) => i.id) : group.invoices.map((i: any) => i.id)
  );
  const [useNiplInvoiceIds, setUseNiplInvoiceIds] = useState<string[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<string>("bca");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderResult, setOrderResult] = useState<any>(existingOrder || null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const isMotorInvoice = (id: string) => {
    const inv = group.invoices.find((i) => i.id === id);
    return !!inv?.lot?.asset?.category?.toLowerCase().includes("motor");
  };

  const activeMobilDeposits = activeDeposits.filter((d) => d.unit_type === "mobil");
  const activeMotorDeposits = activeDeposits.filter((d) => d.unit_type === "motor");

  const totalMobilNipl = activeMobilDeposits.reduce((sum, d) => {
    if (d.package_type === "unlimited") return sum + 5;
    return sum + (parseInt(d.package_type || "1", 10) || 1);
  }, 0);

  const totalMotorNipl = activeMotorDeposits.reduce((sum, d) => {
    if (d.package_type === "unlimited") return sum + 5;
    return sum + (parseInt(d.package_type || "1", 10) || 1);
  }, 0);

  // Auto-default NIPL selections when selected checkout invoices change
  useEffect(() => {
    if (existingOrder) return;
    let mobilAllocated = 0;
    let motorAllocated = 0;
    const initialNiplIds: string[] = [];

    const sortedSelected = group.invoices
      .filter((inv) => selectedInvoiceIds.includes(inv.id))
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    for (const inv of sortedSelected) {
      const isMotor = !!inv.lot?.asset?.category?.toLowerCase().includes("motor");
      if (isMotor) {
        if (motorAllocated < totalMotorNipl) {
          initialNiplIds.push(inv.id);
          motorAllocated++;
        }
      } else {
        if (mobilAllocated < totalMobilNipl) {
          initialNiplIds.push(inv.id);
          mobilAllocated++;
        }
      }
    }
    setUseNiplInvoiceIds(initialNiplIds);
  }, [selectedInvoiceIds, activeDeposits, existingOrder]);

  const toggleInvoice = (id: string) => {
    setSelectedInvoiceIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const calculateSubtotal = () => {
    let sum = 0;
    group.invoices.forEach((inv) => {
      if (selectedInvoiceIds.includes(inv.id)) {
        sum += Number(inv.total);
      }
    });
    return sum;
  };

  // Per-unit NIPL deduction: once an order exists, each invoice's own
  // nipl_deduction (persisted at checkout) is the source of truth; before
  // that, this previews the same allocation the backend will actually apply.
  const niplPerInvoice: Map<string, number> = existingOrder
    ? new Map(group.invoices.map((inv: any) => [inv.id, Number(inv.nipl_deduction || 0)]))
    : allocateNiplPreview(
        group.invoices.filter((inv) => useNiplInvoiceIds.includes(inv.id)),
        activeDeposits,
        niplSettings
      );

  const subtotal = calculateSubtotal();
  const depositDeduction = existingOrder
    ? existingOrder.deposit_deduction || 0
    : Array.from(niplPerInvoice.values()).reduce((sum, v) => sum + v, 0);
  const finalAmount = Math.max(0, subtotal - depositDeduction);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedInvoiceIds.length === 0) {
      toast.warning("Pilih setidaknya satu tagihan untuk di-checkout.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await apiFetch("/checkout/checkout", {
        method: "POST",
        body: JSON.stringify({
          invoice_ids: selectedInvoiceIds,
          bank: paymentMethod,
          use_nipl_invoice_ids: useNiplInvoiceIds,
        }),
      });

      const resData = await response.json();
      if (response.ok && resData.success) {
        setOrderResult(resData.data);
      } else {
        toast.error(resData.error?.message || "Gagal memproses checkout.");
      }
    } catch (err) {
      toast.error("Koneksi gagal. Pastikan API server aktif.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSimulatePayment = async () => {
    if (!orderResult?.id) return;
    try {
      const response = await fetch(apiUrl("/payments/webhook"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          order_id: `CHK-${orderResult.id}`,
          transaction_status: "settlement",
          status_code: "200",
          gross_amount: String(orderResult.final_amount),
          signature_key: "dev-bypass",
        }),
      });

      const resData = await response.json();
      if (response.ok && resData.success) {
        toast.success("Simulasi pembayaran sukses! Tagihan Anda telah lunas.");
        onPaid();
      } else {
        toast.error(resData.error?.message || "Gagal memproses simulasi pembayaran.");
      }
    } catch (err) {
      toast.error("Koneksi gagal.");
    }
  };

  const handleUploadProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proofFile || !orderResult?.id) {
      toast.warning("Pilih file bukti transfer terlebih dahulu.");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", proofFile);

    try {
      // 1. Upload File
      const uploadRes = await apiFetch("/upload/single", {
        method: "POST",
        body: formData,
      });
      const uploadData = await uploadRes.json();

      if (!uploadRes.ok || !uploadData.success) {
        throw new Error(uploadData.error?.message || "Gagal mengunggah bukti transfer.");
      }

      // 2. Submit Proof to Checkout Order
      const proofUrl = uploadData.data.url;
      const submitRes = await apiFetch(`/checkout/${orderResult.id}/proof`, {
        method: "POST",
        body: JSON.stringify({ transfer_proof_url: proofUrl }),
      });

      const submitData = await submitRes.json();
      if (submitRes.ok && submitData.success) {
        toast.success("Bukti transfer berhasil diunggah! Pembayaran Anda akan diverifikasi.");
        router.push("/bidder/home");
      } else {
        throw new Error(submitData.error?.message || "Gagal menyimpan bukti transfer.");
      }
    } catch (err: any) {
      toast.error(err.message || "Koneksi gagal saat mengunggah bukti transfer.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="grid-2-1">
      {/* Left Column Form */}
      <div>
        {orderResult ? (
          <div className="card">
            <div className="card-header text-success">
              <span className="material-symbols-outlined mr-2 align-middle">check_circle</span>
              Checkout Berhasil
            </div>
            <div className="p-4 bg-success/10 rounded-xl border border-success/20 mb-4">
              <p className="text-sm font-bold text-success-dark">Pesanan Anda telah dicatat (ID: {orderResult.id.substring(0, 8)})</p>
              {orderResult.status === "pending_approval" ? (
                <p className="text-xs text-success-dark mt-1">Bukti transfer telah diunggah dan sedang diverifikasi oleh Admin.</p>
              ) : (
                <p className="text-xs text-success-dark mt-1">Silakan ikuti instruksi pembayaran di panel sebelah kanan.</p>
              )}
            </div>
            {orderResult.status === "paid" && (
              <div className="text-center p-8">
                <span className="material-symbols-outlined text-6xl text-success mb-4">task_alt</span>
                <h3 className="text-xl font-bold text-slate-800">Pembayaran Lunas!</h3>
                <p className="text-slate-600 text-sm mt-2">Deposit NIPL Anda cukup untuk melunasi seluruh tagihan ini.</p>
                <Link href="/bidder/home" className="mt-6 inline-block py-2 px-6 bg-primary text-white font-bold rounded-lg hover:bg-primary/90">
                  Kembali ke Dashboard
                </Link>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="card mb-6">
              <div className="card-header flex justify-between items-center">
                <span>Unit yang Dimenangkan</span>
                {!existingOrder && (totalMobilNipl > 0 || totalMotorNipl > 0) && (
                  <div className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-lg flex gap-4">
                    {totalMobilNipl > 0 && (
                      <span>NIPL Mobil: {useNiplInvoiceIds.filter(id => !isMotorInvoice(id)).length}/{totalMobilNipl}</span>
                    )}
                    {totalMotorNipl > 0 && (
                      <span>NIPL Motor: {useNiplInvoiceIds.filter(id => isMotorInvoice(id)).length}/{totalMotorNipl}</span>
                    )}
                  </div>
                )}
              </div>
              <div className="space-y-4">
                {group.invoices.map((inv) => (
                  <label
                    key={inv.id}
                    className={`flex items-start p-4 border rounded-xl transition-all cursor-pointer gap-3 ${
                      selectedInvoiceIds.includes(inv.id)
                        ? "border-primary bg-primary/5"
                        : "border-slate-200 hover:border-slate-300 bg-surface"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedInvoiceIds.includes(inv.id)}
                      onChange={() => toggleInvoice(inv.id)}
                      disabled={!!existingOrder}
                      className="mt-1 accent-primary h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer"
                    />
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">No Lot: {inv.lot?.lot_number || "-"}</span>
                      </div>
                      <h4 className="font-bold text-slate-800 text-base mb-1">{inv.lot?.asset?.title || "Unknown Unit"}</h4>
                      <p className="text-[10px] text-slate-500 mb-3 font-medium flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px]">calendar_today</span>
                        {inv.lot?.session?.title || "Sesi Lelang"}
                      </p>
                      
                      <div className="text-xs text-slate-500 space-y-1">
                        <div className="flex justify-between">
                          <span>Harga Dasar</span>
                          <span className="font-medium text-slate-700">{formatRupiah(Number(inv.lot?.starting_price) || 0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Harga Terbentuk</span>
                          <span className="font-medium text-slate-700">{formatRupiah(Number(inv.hammer_price))}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Biaya Admin</span>
                          <span className="font-medium text-slate-700">{formatRupiah(Number(inv.admin_fee))}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Pajak (PPN & PMK-41)</span>
                          <span className="font-medium text-slate-700">{formatRupiah(Number(inv.tax) + Number(inv.pmk41_amount))}</span>
                        </div>
                        <div className="flex justify-between border-t border-slate-200 mt-1 pt-1">
                          <span>Total Tagihan</span>
                          <span className="font-medium text-slate-700">{formatRupiah(Number(inv.total))}</span>
                        </div>
                        {selectedInvoiceIds.includes(inv.id) && (niplPerInvoice.get(inv.id) || 0) > 0 && (
                          <div className="flex justify-between text-success">
                            <span>Potongan Jaminan NIPL</span>
                            <span className="font-medium">- {formatRupiah(niplPerInvoice.get(inv.id) || 0)}</span>
                          </div>
                        )}
                        {selectedInvoiceIds.includes(inv.id) && !existingOrder && (
                          <div 
                            className="mt-2.5 pt-2.5 border-t border-slate-100"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={useNiplInvoiceIds.includes(inv.id)}
                                disabled={
                                  !useNiplInvoiceIds.includes(inv.id) &&
                                  (!!inv.lot?.asset?.category?.toLowerCase().includes("motor")
                                    ? useNiplInvoiceIds.filter(id => isMotorInvoice(id)).length >= totalMotorNipl
                                    : useNiplInvoiceIds.filter(id => !isMotorInvoice(id)).length >= totalMobilNipl)
                                }
                                onChange={() => {
                                  setUseNiplInvoiceIds(prev =>
                                    prev.includes(inv.id) ? prev.filter(id => id !== inv.id) : [...prev, inv.id]
                                  );
                                }}
                                className="accent-primary h-3.5 w-3.5 rounded border-slate-300 text-primary cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                              />
                              <span className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wide">
                                Gunakan NIPL ({!!inv.lot?.asset?.category?.toLowerCase().includes("motor") ? "Motor" : "Mobil"})
                              </span>
                            </label>
                          </div>
                        )}
                        <div className="flex justify-between border-t border-slate-200 mt-1 pt-1 font-bold">
                          <span>Sisa Tagihan Unit</span>
                          <span className="text-sm text-primary">
                            {formatRupiah(Math.max(0, Number(inv.total) - (selectedInvoiceIds.includes(inv.id) ? niplPerInvoice.get(inv.id) || 0 : 0)))}
                          </span>
                        </div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="card-header">Metode pembayaran</div>
              <p className="text-xs text-slate-600">
                Pembayaran dilakukan lewat <strong>transfer bank manual</strong>. Nomor rekening tujuan akan tampil di ringkasan setelah Anda menekan "Proses Pembayaran".
              </p>
            </div>
          </>
        )}
      </div>

      {/* Right Column Summary */}
      <div>
        <div className="card sticky top-6">
          <div className="card-header">Ringkasan Checkout</div>

          <div className="space-y-4 mb-6">
            <div className="border-b border-dashed border-outline-variant/50 pb-3 mb-3">
              {group.invoices.map(inv => selectedInvoiceIds.includes(inv.id) && (
                <div key={`sum-${inv.id}`} className="flex justify-between text-sm mb-1">
                  <span className="text-slate-500 truncate pr-2 flex-1">
                    {inv.lot?.asset?.title || `Lot ${inv.lot?.lot_number}`}
                    {inv.nipl_codes?.[0]?.code && (
                      <span className="block text-[10px] text-slate-400">Kode NIPL: {inv.nipl_codes[0].code}</span>
                    )}
                  </span>
                  <span className="font-medium text-slate-800">
                    {formatRupiah(Math.max(0, Number(inv.total) - (niplPerInvoice.get(inv.id) || 0)))}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-dashed border-outline-variant/50 pt-4 flex justify-between items-center">
              <span className="text-sm font-bold text-slate-800">Total Tagihan</span>
              <span className="text-2xl font-black text-primary">{formatRupiah(orderResult ? Number(orderResult.final_amount) : finalAmount)}</span>
            </div>
          </div>

          {!orderResult ? (
            <button
              type="button"
              onClick={handleCheckout}
              disabled={isSubmitting || selectedInvoiceIds.length === 0}
              className="w-full py-3.5 bg-primary hover:bg-primary/95 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span className="material-symbols-outlined">shopping_cart_checkout</span>
                  Proses Pembayaran
                </>
              )}
            </button>
          ) : orderResult.status !== "paid" ? (
            <div className="mt-4 pt-4 border-t border-outline-variant/20">
              <div className="text-center p-4 bg-slate-900 text-white rounded-xl mb-4">
                <div className="text-xs text-slate-400 font-medium">Nomor Pembayaran {orderResult.va_bank?.replace("manual_", "").toUpperCase()}</div>
                <div className="text-lg font-black tracking-widest mt-1 text-primary-fixed">{orderResult.va_number}</div>
                <div className="text-xs text-slate-300 mt-2 font-medium">Total: {formatRupiah(orderResult.final_amount)}</div>
              </div>

              {orderResult.payment_method === "manual_transfer" ? (
                <form onSubmit={handleUploadProof} className="space-y-4">
                  <div className="p-4 border-2 border-dashed border-outline-variant/60 rounded-xl bg-surface">
                    <label className="block text-sm font-bold text-slate-700 mb-2">Upload Bukti Transfer *</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          setProofFile(e.target.files[0]);
                        }
                      }}
                      className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isUploading}
                    className="w-full py-3 bg-primary hover:bg-primary/95 text-white font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    {isUploading ? (
                      <>
                        <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Mengunggah...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined">upload_file</span>
                        Kirim Bukti Transfer
                      </>
                    )}
                  </button>
                  {orderResult.status === "pending_approval" && orderResult.transfer_proof_url && (
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-xl text-center text-xs text-blue-800">
                      <strong>Menunggu Verifikasi Admin</strong><br />
                      Bukti transfer sudah diunggah. <a href={orderResult.transfer_proof_url} target="_blank" rel="noreferrer" className="underline font-bold text-blue-900">Lihat Bukti</a>
                    </div>
                  )}
                </form>
              ) : (
                <button
                  type="button"
                  onClick={handleSimulatePayment}
                  className="w-full py-2 bg-success hover:bg-success/95 text-white font-bold rounded-xl transition-all shadow-md shadow-success/15 flex items-center justify-center gap-1.5 text-xs"
                >
                  <span className="material-symbols-outlined text-sm">task_alt</span>
                  Simulasikan Pembayaran (Dev)
                </button>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
