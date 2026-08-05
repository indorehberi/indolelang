"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiUrl, apiFetch, cekUkuranBerkas } from "@/lib/api";
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
 * matches what actually gets persisted per invoice afterwards.
 *
 * Prinsip 1 deposit = 1 invoice: kode unik setiap deposit dikreditkan ke
 * invoice yang sama persis dengan deposit tersebut menanggungnya.
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
    // Clone deposits with mutable fields
    const queue = deposits.map((d) => {
      const code = Number(d.unique_code || 0);
      return { 
        remainingBase: Number(d.amount) - code, 
        code, 
        activeCodes: d.nipl_codes ? [...d.nipl_codes] : []
      };
    });
    const perInvoice = new Map<string, number>();

    for (const inv of invs) {
      let need = niplValue;
      let deduction = 0;

      while (need > 0 && queue.length > 0) {
        const d = queue[0];
        if (d.remainingBase <= need) {
          // Fully consumed by current invoice
          deduction += d.remainingBase;
          need -= d.remainingBase;
          
          let codesSum = 0;
          while (d.activeCodes.length > 0) {
            const popped = d.activeCodes.shift()!;
            codesSum += (popped.payment_unique_code || 0);
          }
          deduction += codesSum;
          d.code = 0;

          queue.shift();
        } else {
          // Partial: credit exactly one active code to this invoice
          deduction += need;
          
          let codeToDeduct = 0;
          if (d.activeCodes.length > 0) {
            const popped = d.activeCodes.shift()!;
            codeToDeduct = (popped.payment_unique_code || 0);
          }
          deduction += codeToDeduct;
          d.code -= codeToDeduct;

          d.remainingBase -= need;
          need = 0;

          // Note: the backend removes and spawns a new deposit, but here we can 
          // just leave the partially consumed deposit in the queue
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
  const toast = useToast();

  const [groups, setGroups] = useState<CartGroup[]>([]);
  const [activeDeposits, setActiveDeposits] = useState<any[]>([]);
  const [totalDepositValue, setTotalDepositValue] = useState<number>(0);
  const [hasUnlimited, setHasUnlimited] = useState<boolean>(false);
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);
  const [niplSettings, setNiplSettings] = useState({ mobil: 5000000, motor: 1000000 });
  const [loading, setLoading] = useState(true);

  // Global Checkout State
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>([]);
  const [useNiplInvoiceIds, setUseNiplInvoiceIds] = useState<string[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<string>("bca");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        const nextGroups = resData.data.groups || [];
        setGroups(nextGroups);
        setActiveDeposits(resData.data.active_deposits || []);
        setTotalDepositValue(resData.data.total_deposit_value || 0);
        setHasUnlimited(resData.data.has_unlimited || false);
        setPendingOrders(resData.data.pending_orders || []);

        // Start with no invoices selected so the user must explicitly choose which to pay
        setSelectedInvoiceIds([]);
      }
    } catch (err) {
      console.error("Failed to fetch cart", err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

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

  useRefreshOnForeground(() => fetchCart({ silent: true }));

  const allInvoices = groups.flatMap((g) => g.invoices);
  const isMotorInvoice = (id: string) => {
    const inv = allInvoices.find((i) => i.id === id);
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

  // Auto-default and validate NIPL selections based on unlimited NIPL rules
  useEffect(() => {
    const selectedMobilInvoices = allInvoices.filter(
      (inv) => selectedInvoiceIds.includes(inv.id) && !isMotorInvoice(inv.id)
    );
    const selectedMotorInvoices = allInvoices.filter(
      (inv) => selectedInvoiceIds.includes(inv.id) && isMotorInvoice(inv.id)
    );

    let nextUseNiplIds = [...useNiplInvoiceIds].filter((id) =>
      selectedInvoiceIds.includes(id)
    );

    // Rule: Owner of Unlimited NIPL package
    if (hasUnlimited) {
      // 1. Mobil
      if (selectedMobilInvoices.length <= totalMobilNipl) {
        selectedMobilInvoices.forEach((inv) => {
          if (!nextUseNiplIds.includes(inv.id)) {
            nextUseNiplIds.push(inv.id);
          }
        });
      } else {
        const currentMobilChecked = nextUseNiplIds.filter(id => !isMotorInvoice(id));
        if (currentMobilChecked.length > totalMobilNipl) {
          let excessCount = currentMobilChecked.length - totalMobilNipl;
          nextUseNiplIds = nextUseNiplIds.filter((id) => {
            if (!isMotorInvoice(id)) {
              if (excessCount > 0) {
                excessCount--;
                return false;
              }
            }
            return true;
          });
        }
      }

      // 2. Motor
      if (selectedMotorInvoices.length <= totalMotorNipl) {
        selectedMotorInvoices.forEach((inv) => {
          if (!nextUseNiplIds.includes(inv.id)) {
            nextUseNiplIds.push(inv.id);
          }
        });
      } else {
        const currentMotorChecked = nextUseNiplIds.filter(id => isMotorInvoice(id));
        if (currentMotorChecked.length > totalMotorNipl) {
          let excessCount = currentMotorChecked.length - totalMotorNipl;
          nextUseNiplIds = nextUseNiplIds.filter((id) => {
            if (isMotorInvoice(id)) {
              if (excessCount > 0) {
                excessCount--;
                return false;
              }
            }
            return true;
          });
        }
      }
    } else {
      // Regular bidder: apply greedy allocation by default
      let mobilAllocated = 0;
      let motorAllocated = 0;
      const initialNiplIds: string[] = [];

      const sortedSelected = [...allInvoices]
        .filter((inv) => selectedInvoiceIds.includes(inv.id))
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

      for (const inv of sortedSelected) {
        const isMotor = isMotorInvoice(inv.id);
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
      nextUseNiplIds = initialNiplIds;
    }

    setUseNiplInvoiceIds(nextUseNiplIds);
  }, [selectedInvoiceIds, totalMobilNipl, totalMotorNipl, hasUnlimited, groups]);

  const toggleInvoice = (id: string) => {
    setSelectedInvoiceIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const calculateSubtotal = () => {
    let sum = 0;
    allInvoices.forEach((inv) => {
      if (selectedInvoiceIds.includes(inv.id)) {
        sum += Number(inv.total);
      }
    });
    return sum;
  };

  const niplPerInvoice: Map<string, number> = allocateNiplPreview(
    allInvoices.filter((inv) => useNiplInvoiceIds.includes(inv.id)),
    activeDeposits,
    niplSettings
  );

  const subtotal = calculateSubtotal();
  const depositDeduction = Array.from(niplPerInvoice.values()).reduce((sum, v) => sum + v, 0);
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
        toast.success("Checkout berhasil!");
        fetchCart();
      } else {
        toast.error(resData.error?.message || "Gagal memproses checkout.");
      }
    } catch (err) {
      toast.error("Koneksi gagal. Pastikan API server aktif.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <BidderLayout pageTitle="Keranjang Tagihan">
        <PageSkeleton />
      </BidderLayout>
    );
  }

  return (
    <BidderLayout pageTitle="Pelunasan">
      {/* Unlimited NIPL Warning Banner */}
      {hasUnlimited && (
        <div className="mb-6 p-4 rounded-xl border border-warning/30 bg-warning/10 flex items-start gap-3">
          <span className="material-symbols-outlined text-warning mt-0.5">info</span>
          <div>
            <h4 className="font-bold text-slate-800 text-sm mb-1">Status Hak Bidding Unlimited</h4>
            <p className="text-sm text-slate-600">
              Sisa fisik NIPL aktif Anda: <strong className="text-primary-strong">{totalMobilNipl} Mobil</strong> & <strong className="text-primary-strong">{totalMotorNipl} Motor</strong>.
              <br />
              Jika Anda telah menggunakan semua fisik NIPL ini untuk checkout/pelunasan unit, NIPL aktif Anda akan habis dan hak bidding unlimited Anda di hari/lelang berikutnya akan dibatasi hingga Anda membeli NIPL baru atau tagihan lunas.
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-outline-variant/60 mb-6 gap-6">
        <Link
          href="/bidder/cart"
          className="py-3 font-bold text-body-md text-primary-strong border-b-2 border-primary relative transition-all"
        >
          🛒 Pelunasan Menunggu Pembayaran
        </Link>
      </div>

      {groups.length === 0 && pendingOrders.length === 0 ? (
        <div className="card p-8 text-center border-2 border-dashed border-outline-variant/40 rounded-xl">
          <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">shopping_cart</span>
          <p className="text-slate-500 text-sm">Tidak ada tagihan unit yang menunggu pembayaran.</p>
        </div>
      ) : (
        <div className="space-y-12">
          {/* BARIS PERTAMA: 🛒 Pelunasan Menunggu Pembayaran (Active Checkout) */}
          {groups.length > 0 && (
            <div>
              <div className="grid-2-1">
                {/* Kolom 1 & 2 diisi oleh card list tagihan */}
                <div>
                  <div className="space-y-6">
                    {groups.map((group) => (
                      <div key={group.session_date} className="card p-6">
                        <h3 className="text-lg font-black text-slate-800 border-b pb-3 mb-4 flex items-center gap-2">
                          <span className="material-symbols-outlined text-primary-strong">calendar_today</span>
                          Lelang {formatSessionDate(group.session_date)}
                        </h3>
                        <div className="space-y-4">
                          {group.invoices.map((inv) => {
                            const isMotor = isMotorInvoice(inv.id);
                            const limit = isMotor ? totalMotorNipl : totalMobilNipl;
                            const selectedInvoicesOfSameType = isMotor 
                              ? selectedInvoiceIds.filter(isMotorInvoice)
                              : selectedInvoiceIds.filter(id => !isMotorInvoice(id));
                            
                            const isNiplForced = hasUnlimited && (selectedInvoicesOfSameType.length <= limit);
                            const isNiplMaxReached = !useNiplInvoiceIds.includes(inv.id) && (
                              useNiplInvoiceIds.filter(id => isMotorInvoice(id) === isMotor).length >= limit
                            );
                            const isCheckboxDisabled = isNiplForced || isNiplMaxReached;

                            return (
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
                                  className="mt-1 accent-primary h-4 w-4 rounded border-slate-300 text-primary-strong focus:ring-primary cursor-pointer"
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
                                      <span>Pajak (PPN &amp; PMK-41)</span>
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
                                    {selectedInvoiceIds.includes(inv.id) && (
                                      <div 
                                        className="mt-2.5 pt-2.5 border-t border-slate-100"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <label className="flex items-center gap-2 cursor-pointer select-none">
                                          <input
                                            type="checkbox"
                                            checked={useNiplInvoiceIds.includes(inv.id) || isNiplForced}
                                            disabled={isCheckboxDisabled}
                                            onChange={() => {
                                              setUseNiplInvoiceIds(prev =>
                                                prev.includes(inv.id) ? prev.filter(id => id !== inv.id) : [...prev, inv.id]
                                              );
                                            }}
                                            className="accent-primary h-3.5 w-3.5 rounded border-slate-300 text-primary-strong cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                          />
                                          <span className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wide">
                                            Gunakan NIPL ({isMotor ? "Motor" : "Mobil"})
                                            {isNiplForced && " (Wajib)"}
                                          </span>
                                        </label>
                                      </div>
                                    )}
                                    <div className="flex justify-between border-t border-slate-200 mt-1 pt-1 font-bold">
                                      <span>Sisa Tagihan Unit</span>
                                      <span className="text-sm text-primary-strong">
                                        {formatRupiah(Math.max(0, Number(inv.total) - (selectedInvoiceIds.includes(inv.id) ? niplPerInvoice.get(inv.id) || 0 : 0)))}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Kolom 3 diisi oleh ringkasan checkout (tidak sticky!) */}
                <div>
                  <div className="card">
                    <div className="card-header flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary-strong">shopping_cart_checkout</span>
                      Ringkasan Checkout
                    </div>

                    <div className="space-y-4 mb-6">
                      {(totalMobilNipl > 0 || totalMotorNipl > 0) && (
                        <div className="text-xs font-bold text-slate-600 bg-slate-50 p-3 rounded-xl space-y-1 border border-slate-100">
                          <div className="text-[10px] text-slate-400 uppercase tracking-wider">Kuota NIPL Jaminan Anda:</div>
                          {totalMobilNipl > 0 && (
                            <div>Mobil: {useNiplInvoiceIds.filter(id => !isMotorInvoice(id)).length} dari {totalMobilNipl} NIPL digunakan</div>
                          )}
                          {totalMotorNipl > 0 && (
                            <div>Motor: {useNiplInvoiceIds.filter(id => isMotorInvoice(id)).length} dari {totalMotorNipl} NIPL digunakan</div>
                          )}
                        </div>
                      )}

                      <div className="border-b border-dashed border-outline-variant/50 pb-3 mb-3 max-h-[300px] overflow-y-auto space-y-2">
                        {allInvoices.map(inv => selectedInvoiceIds.includes(inv.id) && (
                          <div key={`sum-${inv.id}`} className="flex justify-between text-sm mb-1">
                            <span className="text-slate-500 truncate pr-2 flex-1">
                              {inv.lot?.asset?.title || `Lot ${inv.lot?.lot_number}`}
                            </span>
                            <span className="font-medium text-slate-800">
                              {formatRupiah(Math.max(0, Number(inv.total) - (niplPerInvoice.get(inv.id) || 0)))}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="border-t border-dashed border-outline-variant/50 pt-4 flex justify-between items-center">
                        <span className="text-sm font-bold text-slate-800">Total Tagihan</span>
                        <span className="text-2xl font-black text-primary-strong">{formatRupiah(finalAmount)}</span>
                      </div>
                    </div>

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
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* BARIS KEDUA: Menunggu Pembayaran / Verifikasi */}
          {pendingOrders.length > 0 && (
            <div>
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
                    hasUnlimited={false}
                    activeDeposits={[]}
                    niplSettings={niplSettings}
                    onPaid={fetchCart}
                    existingOrder={order}
                  />
                ))}
              </div>
            </div>
          )}
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
  
  // Menghitung timeLeft (dalam detik) dari due_date atau default 3600 detik (60 menit)
  const initialTimeLeft = orderResult?.invoices?.[0]?.due_date 
    ? Math.max(0, Math.floor((new Date(orderResult.invoices[0].due_date).getTime() - Date.now()) / 1000))
    : 3600;

  const [timeLeft, setTimeLeft] = useState<number>(initialTimeLeft);

  useEffect(() => {
    if (orderResult && timeLeft > 0) {
      const timerId = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timerId);
    }
  }, [timeLeft, orderResult]);

  const formatTime = (seconds: number) => {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    if (d > 0) return `${d} Hari ${h}:${m}`;
    return `${h}:${m}:${s}`;
  };

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

    const terlaluBesar = cekUkuranBerkas(proofFile);
    if (terlaluBesar) {
      toast.error(terlaluBesar);
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", proofFile);

    try {
      const uploadRes = await apiFetch("/upload/single", {
        method: "POST",
        body: formData,
      });
      const uploadData = await uploadRes.json();

      if (!uploadRes.ok || !uploadData.success) {
        throw new Error(uploadData.error?.message || "Gagal mengunggah bukti transfer.");
      }

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
    <div className="grid-2-1" style={{ alignItems: 'start' }}>
      
      {/* Left Main Column: matches widths with the active cart item list */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
        
        {/* Kolom 1 — Detail Pembayaran Tagihan */}
        <div>
          <div className="card">
            <div className="card-header text-success flex items-center gap-2">
              <span className="material-symbols-outlined">check_circle</span>
              Detail Pembayaran Tagihan
            </div>
            <div className="p-4 bg-success/5 rounded-xl border border-success/10 mb-4">
              <p className="text-sm font-bold text-success-dark">ID Pesanan: {orderResult.id.substring(0, 8)}</p>
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

            <div className="space-y-4 mt-4">
              {group.invoices.map((inv) => (
                <div
                  key={inv.id}
                  className="p-4 border rounded-xl border-slate-200 bg-surface"
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">No Lot: {inv.lot?.lot_number || "-"}</span>
                  </div>
                  <h4 className="font-bold text-slate-800 text-base mb-1">{inv.lot?.asset?.title || "Unknown Unit"}</h4>

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
                      <span>Pajak (PPN &amp; PMK-41)</span>
                      <span className="font-medium text-slate-700">{formatRupiah(Number(inv.tax) + Number(inv.pmk41_amount))}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-200 mt-1 pt-1">
                      <span>Total Tagihan</span>
                      <span className="font-medium text-slate-700">{formatRupiah(Number(inv.total))}</span>
                    </div>
                    {(niplPerInvoice.get(inv.id) || 0) > 0 && (
                      <div className="flex justify-between text-success">
                        <span>Potongan Jaminan NIPL</span>
                        <span className="font-medium">- {formatRupiah(niplPerInvoice.get(inv.id) || 0)}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t border-slate-200 mt-1 pt-1 font-bold">
                      <span>Sisa Tagihan Unit</span>
                      <span className="text-sm text-primary-strong">
                        {formatRupiah(Math.max(0, Number(inv.total) - (niplPerInvoice.get(inv.id) || 0)))}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Kolom 2 — Ringkasan Checkout (Sticky!) */}
        <div style={{ position: 'sticky', top: '1.5rem' }}>
          <div className="card">
            <div className="card-header">Ringkasan Checkout</div>

            <div className="space-y-4 mb-6">
              <div className="border-b border-dashed border-outline-variant/50 pb-3 mb-3">
                {group.invoices.map(inv => (
                  <div key={`sum-${inv.id}`} className="flex justify-between text-sm mb-1">
                    <span className="text-slate-500 truncate pr-2 flex-1">
                      {inv.lot?.asset?.title || `Lot ${inv.lot?.lot_number}`}
                    </span>
                    <span className="font-medium text-slate-800">
                      {formatRupiah(Math.max(0, Number(inv.total) - (niplPerInvoice.get(inv.id) || 0)))}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-dashed border-outline-variant/50 pt-4 flex justify-between items-center">
                <span className="text-sm font-bold text-slate-800">Total Tagihan</span>
                <span className="text-2xl font-black text-primary-strong">{formatRupiah(orderResult.final_amount)}</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Right Sidebar Column: matches width with the active checkout sidebar */}
      <div>
        {orderResult.status !== "paid" && (
          <div className="card border-primary/30 bg-primary/[0.02] p-0 overflow-hidden">
            <div className="bg-primary/10 p-3 text-primary-strong font-bold text-sm text-center">
              Instruksi Pembayaran
            </div>
            <div className="p-4 space-y-4">
              <div className="text-center p-4 bg-slate-900 text-white rounded-xl">
                <div className="text-xs text-slate-400 font-medium">Rekening Tujuan ({orderResult.va_bank?.replace("manual_", "").toUpperCase() || "BCA"})</div>
                <div className="text-lg font-black tracking-widest mt-1 text-primary-fixed">{orderResult.va_number || "7015886161"}</div>
                <div className="text-xs text-slate-300 mt-2 font-medium">a.n. PT Indo Lelang Sejahtera</div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Jumlah Harus Ditransfer</span>
                  <span className="font-bold text-slate-800">{formatRupiah(orderResult.final_amount)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Batas Waktu Pembayaran</span>
                  <span className="font-bold text-error">{formatTime(timeLeft)} Menit</span>
                </div>
              </div>

              <div className="border-t border-outline-variant/20 pt-3 space-y-2 text-[11px] text-slate-600">
                <p className="font-bold text-slate-800">Petunjuk Pembayaran:</p>
                <ol className="list-decimal pl-4 space-y-1">
                  <li>Gunakan ATM, M-Banking, atau Internet Banking Anda.</li>
                  <li>Pilih menu Transfer antar bank / ke rekening tujuan.</li>
                  <li>Masukkan rekening tujuan: {orderResult.va_number || "7015886161"} ({orderResult.va_bank?.replace("manual_", "").toUpperCase() || "BCA"}).</li>
                  <li>Masukkan nominal pas sebesar {formatRupiah(orderResult.final_amount)} (sangat penting agar sistem memproses).</li>
                  <li>Simpan bukti transfer dan unggah pada form di bawah.</li>
                  <li>Tunggu persetujuan Admin.</li>
                </ol>
              </div>

              {orderResult.payment_method === "manual_transfer" || orderResult.payment_method?.includes("manual") ? (
                <div className="border-t border-outline-variant/20 pt-3">
                  <form onSubmit={handleUploadProof} className="space-y-4">
                    <div className="p-4 border-2 border-dashed border-outline-variant/60 rounded-xl bg-surface">
                      <label className="block text-sm font-bold text-slate-700 mb-2">Upload Bukti Transfer</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            setProofFile(e.target.files[0]);
                          }
                        }}
                        className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-primary/10 file:text-primary-strong hover:file:bg-primary/20"
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
                          Saya Sudah Membayar
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
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleSimulatePayment}
                  className="w-full py-2 mt-2 bg-success hover:bg-success/95 text-white font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 text-xs"
                >
                  <span className="material-symbols-outlined text-sm">task_alt</span>
                  Simulasikan Pembayaran (Dev)
                </button>
              )}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}

