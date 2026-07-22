"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import SessionTimeout from "./SessionTimeout";
import BidderBottomNav from "./BidderBottomNav";
import Header from "./Header";
import Footer from "./Footer";
import { allBidderNavItems } from "./bidderNavItems";
import InstallPrompt from "../pwa/InstallPrompt";
import { clearAuthAndRedirect, apiUrl, apiFetch, getAuthToken } from "../../lib/api";

interface BidderLayoutProps {
  children: React.ReactNode;
  pageTitle: string;
  // When true, suppress the PWA topbar on mobile (the page draws its own
  // full-bleed header, e.g. the beranda banner). Desktop keeps its topbar.
  hidePwaTopbar?: boolean;
}

/**
 * Three shells, one component:
 *
 * - Desktop (lg+), any context: dark sidebar + topbar. Unchanged.
 * - Mobile browser: the site Header/Footer, exactly like the public pages —
 *   no app chrome. The sidebar's menu folds into a hamburger drawer, since it
 *   is the only way to reach the bidder pages once the bottom tab bar is gone.
 * - Installed PWA: app chrome (topbar + bottom tab bar), no site Header/Footer.
 */
export default function BidderLayout({ children, pageTitle, hidePwaTopbar = false }: BidderLayoutProps) {
  const pathname = usePathname();
  const [userName, setUserName] = useState("Budi Santoso");
  const [userInitial, setUserInitial] = useState("BS");
  const [isPWA, setIsPWA] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Exclusive sessions popups state
  const [exclusiveSessions, setExclusiveSessions] = useState<any[]>([]);
  const [currentSessionIndex, setCurrentSessionIndex] = useState(0);
  const [regStatus, setRegStatus] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [popupStep, setPopupStep] = useState(1); // 1: details, 2: upload
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submittingReg, setSubmittingReg] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; success: boolean } | null>(null);

  useEffect(() => {
    const checkExclusiveSessions = async () => {
      if (typeof window === "undefined") return;
      const token = getAuthToken();
      if (!token) return;

      try {
        // 1. Check if user is verified (approved KYC)
        const kycRes = await apiFetch('/kyc/status');
        const kycData = await kycRes.json();
        
        let isVerified = false;
        if (kycRes.ok && kycData.success) {
          isVerified = kycData.data?.status === 'approved';
        }

        if (!isVerified) return; // Only show if user is verified!

        // 2. Fetch published sessions
        const res = await apiFetch('/sessions?status=published&per_page=100');
        const data = await res.json();
        if (res.ok && data.success) {
          const now = new Date();
          // Filter sessions: is_exclusive is true, and registration deadline has not passed
          const activeExclusive = data.data.filter((s: any) => {
            if (!s.is_exclusive) return false;
            const scheduledAt = new Date(s.scheduled_at);
            const leadHours = s.registration_lead_hours || 0;
            const deadline = new Date(scheduledAt.getTime() - (leadHours * 60 * 60 * 1000));
            return now < deadline;
          });

          // Check registration status for each active exclusive session
          const sessionsToShow = [];
          for (const s of activeExclusive) {
            const statusRes = await apiFetch(`/sessions/${s.id}/exclusive/status`);
            const statusData = await statusRes.json();
            if (statusRes.ok && statusData.success) {
              const { status } = statusData.data;
              // If not approved yet (not registered, pending, or rejected), we show the popup
              if (status !== 'approved') {
                sessionsToShow.push({
                  ...s,
                  regStatus: status,
                  rejectionReason: statusData.data.rejection_reason
                });
              }
            }
          }

          if (sessionsToShow.length > 0) {
            setExclusiveSessions(sessionsToShow);
            setCurrentSessionIndex(0);
            setRegStatus(sessionsToShow[0].regStatus);
            setRejectionReason(sessionsToShow[0].rejectionReason);
            setPopupStep(1);
            setShowPopup(true);
          }
        }
      } catch (err) {
        console.error("Error checking exclusive sessions", err);
      }
    };

    checkExclusiveSessions();
  }, [pathname]);

  const handleRegisterSubmit = async () => {
    if (!selectedFile || exclusiveSessions.length === 0) return;
    const session = exclusiveSessions[currentSessionIndex];
    setSubmittingReg(true);

    try {
      const token = getAuthToken();
      const formData = new FormData();
      formData.append("file", selectedFile);

      const res = await fetch(apiUrl(`/sessions/${session.id}/exclusive/register`), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setToastMessage({ text: 'Pendaftaran sukses! Menunggu peninjauan Admin.', success: true });
        setTimeout(() => setToastMessage(null), 4000);
        setShowPopup(false);
      } else {
        setToastMessage({ text: data.error?.message || 'Gagal mendaftar', success: false });
        setTimeout(() => setToastMessage(null), 4000);
      }
    } catch (err) {
      setToastMessage({ text: 'Terjadi kesalahan sistem saat mendaftar', success: false });
      setTimeout(() => setToastMessage(null), 4000);
    } finally {
      setSubmittingReg(false);
    }
  };

  const handleDownloadDocument = async () => {
    if (exclusiveSessions.length === 0) return;
    const session = exclusiveSessions[currentSessionIndex];
    
    try {
      const res = await apiFetch(`/sessions/${session.id}/exclusive/document`);
      if (!res.ok) throw new Error("Gagal mengunduh dokumen");
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `surat-pernyataan-${session.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Gagal mendownload surat pernyataan", err);
      setToastMessage({ text: 'Gagal mendownload surat pernyataan', success: false });
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  useEffect(() => {
    setIsPWA(
      window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone ||
        document.referrer.includes("android-app://")
    );
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const user = localStorage.getItem("user");
      if (user) {
        try {
          const parsed = JSON.parse(user);
          setUserName(parsed.full_name);
          setUserInitial(
            parsed.full_name
              .split(" ")
              .map((n: string) => n[0])
              .join("")
              .substring(0, 2)
              .toUpperCase()
          );
        } catch (e) {
          console.error("Error parsing user data");
        }
      }
    }
  }, []);

  // Close the drawer whenever the user navigates.
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    clearAuthAndRedirect('Anda telah logout.');
  };

  const isActive = (href: string) => pathname === href;

  const navLinks = (onNavigate?: () => void) =>
    allBidderNavItems
      .filter((item) => item.href !== "/bidder/home")
      .map((item) => {
        const displayName = item.href === "/bidder/dashboard" ? "Beranda" : item.name;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              isActive(item.href)
                ? "bg-primary text-on-primary shadow-md shadow-primary/20"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <span className="material-symbols-outlined text-lg">{item.icon}</span>
            <span className="flex-1">{displayName}</span>
            {item.badge && (
              <span className="bg-error text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                {item.badge}
              </span>
            )}
            {item.isLive && (
              <span className="w-2.5 h-2.5 rounded-full bg-error animate-pulse" />
            )}
          </Link>
        );
      });

  const sidebarFooter = (onNavigate?: () => void) => (
    <div className="p-4 border-t border-slate-800 flex flex-col gap-2">
      <Link
        href="/"
        onClick={onNavigate}
        className="flex items-center gap-2 px-4 py-2 text-xs text-slate-400 hover:text-white transition-colors"
      >
        <span className="material-symbols-outlined text-base">home</span>
        Kembali ke Beranda
      </Link>
      <button
        onClick={handleLogout}
        className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-red-600 hover:bg-red-700 transition-all w-full shadow-md shadow-red-900/20"
      >
        <span className="material-symbols-outlined text-lg">logout</span>
        Keluar Akun
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-surface flex flex-col font-sans">
      <SessionTimeout />

      {/* Site header — mobile browser only. Desktop keeps the sidebar, the PWA
          keeps its own topbar. */}
      {!isPWA && (
        <div className="lg:hidden">
          <Header />
        </div>
      )}

      {/* ====== DESKTOP SIDEBAR ====== */}
      <aside className="hidden lg:flex flex-col w-64 bg-slate-900 text-white fixed top-0 bottom-0 left-0 z-30 shadow-xl overflow-hidden">
        {/* Brand Logo */}
        <div className="h-16 px-6 border-b border-slate-800 flex items-center justify-start flex-shrink-0">
          <Link href="/">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt="BIDKU"
              className="h-12 w-auto"
              src="/logo-bidku.png"
            />
          </Link>
        </div>

        {/* User Role Tag */}
        <div className="px-6 py-2 bg-slate-950 border-b border-slate-800 text-[10px] tracking-wider text-secondary uppercase font-bold flex-shrink-0">
          Panel Area Bidder
        </div>

        {/* Menu Navigation */}
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto sidebar-scroller">{navLinks()}</nav>

        <div className="flex-shrink-0">
          {sidebarFooter()}
        </div>
      </aside>

      {/* ====== MOBILE BROWSER: bidder menu trigger ====== */}
      {!isPWA && (
        <div className="lg:hidden sticky top-0 z-20 flex items-center gap-3 px-margin-page py-2.5 bg-white/95 glass-nav border-b border-outline-variant/20">
          <button
            onClick={() => setDrawerOpen(true)}
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-surface-container-low transition-colors"
            aria-label="Menu Bidder"
          >
            <span className="material-symbols-outlined text-on-surface">menu</span>
          </button>
          <span className="text-sm font-bold text-on-surface">{pageTitle}</span>
        </div>
      )}

      {/* ====== MOBILE BROWSER: sidebar as a drawer ====== */}
      {!isPWA && drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
          />
          <aside className="fixed top-0 bottom-0 left-0 w-72 max-w-[85%] bg-slate-900 text-white shadow-2xl flex flex-col animate-slide-in-left overflow-y-auto">
            <div className="h-16 px-6 border-b border-slate-800 flex items-center justify-between">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img alt="BIDKU" className="h-10 w-auto" src="/logo-bidku.png" />
              <button
                onClick={() => setDrawerOpen(false)}
                className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-slate-800 transition-colors"
                aria-label="Tutup menu"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="px-6 py-2 bg-slate-950 border-b border-slate-800 text-[10px] tracking-wider text-secondary uppercase font-bold">
              Panel Area Bidder
            </div>

            <nav className="flex-1 px-4 py-4 space-y-1">
              {navLinks(() => setDrawerOpen(false))}
            </nav>

            {sidebarFooter(() => setDrawerOpen(false))}
          </aside>
        </div>
      )}

      {/* ====== MAIN CONTENT CONTAINER ====== */}
      <div className="flex-1 lg:pl-64 flex flex-col">
        {/* ====== TOPBAR — desktop always, mobile only inside the PWA ====== */}
        <header
          className={`h-16 border-b border-outline-variant/20 bg-white/95 sticky top-0 z-20 items-center justify-between px-6 shadow-sm ${
            isPWA && !hidePwaTopbar ? "flex" : "hidden"
          } lg:flex`}
        >
          <div className="flex flex-col justify-center">
            <h1 className="text-heading-lg text-on-surface font-extrabold leading-tight">{pageTitle}</h1>
            <span className="text-[10px] text-primary font-bold uppercase tracking-wider mt-0.5">Bidder</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col text-right">
              <span className="text-sm font-bold text-on-surface">{userName}</span>
              <span className="text-[10px] text-on-surface-variant font-medium uppercase tracking-wider">
                Peserta Lelang
              </span>
            </div>
            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm border border-primary/25">
              {userInitial}
            </div>
          </div>
        </header>

        <InstallPrompt />

        {/* ====== PAGE BODY ====== */}
        <main className={`flex-1 p-6 max-w-container-max w-full mx-auto ${isPWA ? "pb-24" : ""}`}>
          {children}
        </main>

        {/* Site footer — mobile browser only, same as the public pages. */}
        {!isPWA && (
          <div className="lg:hidden">
            <Footer />
          </div>
        )}
      </div>

      <BidderBottomNav />

      {/* Exclusive Session Popup Modal */}
      {showPopup && exclusiveSessions.length > 0 && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.75)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1.5rem', backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: 'white', borderRadius: '1.25rem', width: '100%', maxWidth: '500px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            overflow: 'hidden', border: '1px solid #e2e8f0'
          }}>
            {/* Header */}
            <div style={{
              background: 'linear-gradient(135deg, #1e293b, #0f172a)', padding: '1.25rem 1.5rem',
              color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', margin: 0 }}>Lelang Exclusive</h3>
                <p style={{ fontSize: '0.75rem', color: '#cbd5e1', margin: '2px 0 0 0' }}>
                  Sesi Eksklusif dari {exclusiveSessions[currentSessionIndex].exclusive_provider?.company_name || exclusiveSessions[currentSessionIndex].exclusive_provider?.user?.full_name || 'Mitra Kami'}
                </p>
              </div>
              <button
                onClick={() => setShowPopup(false)}
                style={{ background: 'transparent', border: 0, color: 'white', fontSize: '1.5rem', cursor: 'pointer', lineHeight: 1 }}
              >
                &times;
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: '1.5rem' }}>
              {popupStep === 1 ? (
                <div>
                  <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem', color: '#1e293b' }}>
                      <div>
                        <span style={{ color: '#64748b', fontSize: '0.75rem', display: 'block', fontWeight: 600 }}>Sesi Lelang</span>
                        <strong>{exclusiveSessions[currentSessionIndex].title}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748b', fontSize: '0.75rem', display: 'block', fontWeight: 600 }}>Tanggal Sesi</span>
                        <strong>
                          {new Date(exclusiveSessions[currentSessionIndex].scheduled_at).toLocaleDateString('id-ID', {
                            day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                          })} WIB
                        </strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748b', fontSize: '0.75rem', display: 'block', fontWeight: 600 }}>Batas Pendaftaran</span>
                        <strong style={{ color: '#ef4444' }}>
                          {new Date(
                            new Date(exclusiveSessions[currentSessionIndex].scheduled_at).getTime() - 
                            ((exclusiveSessions[currentSessionIndex].registration_lead_hours || 0) * 60 * 60 * 1000)
                          ).toLocaleDateString('id-ID', {
                            day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                          })} WIB
                        </strong>
                      </div>
                    </div>
                  </div>

                  {regStatus === 'pending' ? (
                    <div style={{ background: '#fef3c7', color: '#92400e', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #fde68a', fontSize: '0.875rem', marginBottom: '1rem', textAlign: 'center', fontWeight: 'bold' }}>
                      ⏳ Pendaftaran Anda sedang ditinjau oleh Admin.
                    </div>
                  ) : (
                    <>
                      {regStatus === 'rejected' && (
                        <div style={{ background: '#fee2e2', color: '#991b1b', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #fca5a5', fontSize: '0.875rem', marginBottom: '1rem' }}>
                          <strong>❌ Pendaftaran sebelumnya ditolak:</strong>
                          <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem' }}>{rejectionReason || 'Berkas tidak sesuai kriteria'}</p>
                        </div>
                      )}
                      <p style={{ fontSize: '0.85rem', color: '#475569', marginBottom: '1.5rem', lineHeight: 1.5 }}>
                        Anda diundang untuk berpartisipasi dalam Sesi Lelang Eksklusif ini. Silakan mendaftar dan melengkapi berkas persyaratan.
                      </p>
                      <button
                        onClick={() => setPopupStep(2)}
                        style={{
                          width: '100%', padding: '0.75rem', borderRadius: '0.75rem', border: 0,
                          background: '#2563eb', color: 'white', fontWeight: 'bold', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                        }}
                      >
                        Ikuti Lelang Eksklusif
                      </button>
                    </>
                  )}
                </div>
              ) : (
                <div>
                  <p style={{ fontSize: '0.85rem', color: '#475569', marginBottom: '1rem', lineHeight: 1.5 }}>
                    Silakan download, tanda-tangan dan upload kembali surat pernyataan berikut untuk dapat mengikuti lelang ini:
                  </p>

                  {/* Actions */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                    <button
                      type="button"
                      onClick={handleDownloadDocument}
                      style={{
                        width: '100%', padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid #cbd5e1',
                        background: '#f8fafc', color: '#334155', fontWeight: 'bold', textAlign: 'center',
                        fontSize: '0.875rem', cursor: 'pointer', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                      }}
                    >
                      📄 Download Surat Pernyataan
                    </button>

                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '0.25rem' }}>
                        Upload Surat Pernyataan Ter-tandatangan (PDF) *
                      </label>
                      <input
                        type="file"
                        accept="application/pdf"
                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                        style={{
                          width: '100%', padding: '0.5rem', borderRadius: '0.5rem',
                          border: '1px solid #cbd5e1', fontSize: '0.8rem'
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                      onClick={() => setPopupStep(1)}
                      style={{
                        flex: 1, padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid #cbd5e1',
                        background: 'white', color: '#475569', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.9rem'
                      }}
                      disabled={submittingReg}
                    >
                      Kembali
                    </button>
                    <button
                      onClick={handleRegisterSubmit}
                      style={{
                        flex: 2, padding: '0.75rem', borderRadius: '0.75rem', border: 0,
                        background: '#22c55e', color: 'white', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.9rem'
                      }}
                      disabled={submittingReg || !selectedFile}
                    >
                      {submittingReg ? 'Mendaftarkan...' : 'Daftar Sekarang'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {toastMessage && (
        <div style={{
          position: 'fixed', bottom: '5rem', left: '50%', transform: 'translateX(-50%)', zIndex: 10000,
          padding: '0.75rem 1.25rem', borderRadius: '0.75rem',
          background: toastMessage.success ? '#22c55e' : '#ef4444',
          color: 'white', fontWeight: 'bold', fontSize: '0.875rem',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', textAlign: 'center'
        }}>
          {toastMessage.text}
        </div>
      )}
    </div>
  );
}
