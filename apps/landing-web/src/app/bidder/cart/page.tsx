"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiUrl } from "@/lib/api";
import BidderLayout from "../../../components/layout/BidderLayout";

export default function BidderCart() {
  const router = useRouter();
  
  const [invoices, setInvoices] = useState<any[]>([]);
  const [activeDeposits, setActiveDeposits] = useState<any[]>([]);
  const [totalDepositValue, setTotalDepositValue] = useState<number>(0);
  const [hasUnlimited, setHasUnlimited] = useState<boolean>(false);
  
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Selection
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<string>("bca");
  
  // Checkout Result
  const [orderResult, setOrderResult] = useState<any>(null);

  const [proofFile, setProofFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const fetchCart = async () => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("accessToken");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(apiUrl("/checkout/cart"), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const resData = await response.json();
      if (response.ok && resData.success) {
        setInvoices(resData.data.invoices || []);
        setActiveDeposits(resData.data.active_deposits || []);
        setTotalDepositValue(resData.data.total_deposit_value || 0);
        setHasUnlimited(resData.data.has_unlimited || false);
        
        // Auto select all invoices by default
        const ids = (resData.data.invoices || []).map((i: any) => i.id);
        setSelectedInvoiceIds(ids);
      }
    } catch (err) {
      console.error("Failed to fetch cart", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const toggleInvoice = (id: string) => {
    setSelectedInvoiceIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const calculateSubtotal = () => {
    let sum = 0;
    invoices.forEach(inv => {
      if (selectedInvoiceIds.includes(inv.id)) {
        sum += Number(inv.total);
      }
    });
    return sum;
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedInvoiceIds.length === 0) {
      alert("Pilih setidaknya satu tagihan untuk di-checkout.");
      return;
    }

    const token = localStorage.getItem("accessToken");
    setIsSubmitting(true);

    try {
      const response = await fetch(apiUrl("/checkout/checkout"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          invoice_ids: selectedInvoiceIds,
          bank: paymentMethod,
        }),
      });

      const resData = await response.json();
      if (response.ok && resData.success) {
        setOrderResult(resData.data);
      } else {
        alert(resData.error?.message || "Gagal memproses checkout.");
      }
    } catch (err) {
      alert("Koneksi gagal. Pastikan API server aktif.");
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
        alert("Simulasi pembayaran sukses! Tagihan Anda telah lunas.");
        router.push("/bidder/dashboard");
      } else {
        alert(resData.error?.message || "Gagal memproses simulasi pembayaran.");
      }
    } catch (err) {
      alert("Koneksi gagal.");
    }
  };

  const handleUploadProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proofFile || !orderResult?.id) {
      alert("Pilih file bukti transfer terlebih dahulu.");
      return;
    }

    setIsUploading(true);
    const token = localStorage.getItem("accessToken");
    const formData = new FormData();
    formData.append("file", proofFile);

    try {
      // 1. Upload File
      const uploadRes = await fetch(apiUrl("/upload/image"), {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const uploadData = await uploadRes.json();

      if (!uploadRes.ok || !uploadData.success) {
        throw new Error(uploadData.error?.message || "Gagal mengunggah bukti transfer.");
      }

      // 2. Submit Proof to Checkout Order
      const proofUrl = uploadData.data.url;
      const submitRes = await fetch(apiUrl(`/checkout/${orderResult.id}/proof`), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ transfer_proof_url: proofUrl }),
      });

      const submitData = await submitRes.json();
      if (submitRes.ok && submitData.success) {
        alert("Bukti transfer berhasil diunggah! Pembayaran Anda akan diverifikasi.");
        router.push("/bidder/dashboard");
      } else {
        throw new Error(submitData.error?.message || "Gagal menyimpan bukti transfer.");
      }
    } catch (err: any) {
      alert(err.message || "Koneksi gagal saat mengunggah bukti transfer.");
    } finally {
      setIsUploading(false);
    }
  };

  const formatRupiah = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (loading) {
    return (
      <BidderLayout pageTitle="Keranjang Tagihan">
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-premium mb-4"></div>
          <p className="text-body-md text-on-surface-variant font-medium">Memuat keranjang Anda...</p>
        </div>
      </BidderLayout>
    );
  }

  const subtotal = calculateSubtotal();
  const finalAmount = Math.max(0, subtotal - totalDepositValue);

  return (
    <BidderLayout pageTitle="Keranjang Tagihan">
      <p className="page-subtitle">Selesaikan pembayaran untuk unit lelang yang Anda menangkan</p>

      {/* Tabs */}
      <div className="flex border-b border-outline-variant/60 mb-6 gap-6">
        <Link
          href="/bidder/cart"
          className="py-3 font-bold text-body-md text-primary border-b-2 border-primary relative transition-all"
        >
          🛒 Tagihan Menunggu Pembayaran
        </Link>
      </div>

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
                <p className="text-sm font-bold text-success-dark">Pesanan Anda telah dicatat (ID: {orderResult.id.substring(0,8)})</p>
                <p className="text-xs text-success-dark mt-1">Silakan ikuti instruksi pembayaran di panel sebelah kanan.</p>
              </div>
              {orderResult.status === 'paid' && (
                <div className="text-center p-8">
                  <span className="material-symbols-outlined text-6xl text-success mb-4">task_alt</span>
                  <h3 className="text-xl font-bold text-slate-800">Pembayaran Lunas!</h3>
                  <p className="text-slate-600 text-sm mt-2">Deposit NIPL Anda cukup untuk melunasi seluruh tagihan ini.</p>
                  <Link href="/bidder/dashboard" className="mt-6 inline-block py-2 px-6 bg-primary text-white font-bold rounded-lg hover:bg-primary/90">
                    Kembali ke Dashboard
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="card mb-6">
                <div className="card-header">Unit yang Dimenangkan</div>
                {invoices.length === 0 ? (
                  <div className="p-8 text-center border-2 border-dashed border-outline-variant/40 rounded-xl">
                    <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">shopping_cart</span>
                    <p className="text-slate-500 text-sm">Tidak ada tagihan unit yang menunggu pembayaran.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {invoices.map((inv) => (
                      <label key={inv.id} className={`flex items-start p-4 border rounded-xl cursor-pointer transition-all ${selectedInvoiceIds.includes(inv.id) ? 'border-primary bg-primary/5' : 'border-outline-variant/40 hover:bg-slate-50'}`}>
                        <div className="pt-1 mr-4">
                          <input 
                            type="checkbox" 
                            className="w-5 h-5 rounded text-primary focus:ring-primary border-outline-variant"
                            checked={selectedInvoiceIds.includes(inv.id)}
                            onChange={() => toggleInvoice(inv.id)}
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-1">
                            <h4 className="font-bold text-slate-800">{inv.lot?.asset?.title || 'Unknown Unit'}</h4>
                            <span className="font-black text-primary">{formatRupiah(Number(inv.total))}</span>
                          </div>
                          <div className="text-xs text-slate-500 space-y-1">
                            <p>Lot: <span className="font-medium text-slate-700">{inv.lot?.lot_number}</span></p>
                            <p>Harga Ketok Palu: <span className="font-medium">{formatRupiah(Number(inv.hammer_price))}</span></p>
                            <p>Admin Fee & Pajak: <span className="font-medium">{formatRupiah(Number(inv.admin_fee) + Number(inv.tax) + Number(inv.pmk41_amount))}</span></p>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {invoices.length > 0 && (
                <div className="card">
                  <div className="card-header">Metode Pembayaran Sisa Tagihan</div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                    {["bca", "mandiri", "bni", "bri"].map((b) => (
                      <button
                        key={b}
                        type="button"
                        onClick={() => setPaymentMethod(b)}
                        className={`p-3 border rounded-xl font-bold text-center transition-all uppercase text-xs ${
                          paymentMethod === b
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-outline-variant/30 text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        {b} VA
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Right Column Summary */}
        <div>
          <div className="card sticky top-6">
            <div className="card-header">Ringkasan Checkout</div>
            
            <div className="space-y-4 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Total Tagihan Unit ({selectedInvoiceIds.length} item)</span>
                <span className="font-bold text-slate-800">{formatRupiah(subtotal)}</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Potongan Deposit (NIPL)</span>
                <span className="font-bold text-success">- {formatRupiah(totalDepositValue)} {hasUnlimited && '(Unlimited)'}</span>
              </div>
              
              <div className="border-t border-dashed border-outline-variant/50 pt-4 flex justify-between items-center">
                <span className="text-sm font-bold text-slate-800">Sisa Pembayaran</span>
                <span className="text-2xl font-black text-primary">{formatRupiah(finalAmount)}</span>
              </div>
              
              {activeDeposits.length > 0 && (
                <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg text-[11px] text-warning-dark leading-relaxed">
                  <strong>Catatan:</strong> Saat Anda melakukan checkout, <strong>SELURUH</strong> saldo deposit aktif Anda akan ditarik oleh sistem sebagai potongan tagihan. Jika ada sisa deposit, akan hangus.
                </div>
              )}
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
            ) : orderResult.status !== 'paid' ? (
              <div className="mt-4 pt-4 border-t border-outline-variant/20">
                <div className="text-center p-4 bg-slate-900 text-white rounded-xl mb-4">
                  <div className="text-xs text-slate-400 font-medium">Nomor Pembayaran {orderResult.va_bank?.replace('manual_','').toUpperCase()}</div>
                  <div className="text-lg font-black tracking-widest mt-1 text-primary-fixed">{orderResult.va_number}</div>
                  <div className="text-xs text-slate-300 mt-2 font-medium">Total: {formatRupiah(orderResult.final_amount)}</div>
                </div>

                {orderResult.payment_method === 'manual_transfer' ? (
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
    </BidderLayout>
  );
}
