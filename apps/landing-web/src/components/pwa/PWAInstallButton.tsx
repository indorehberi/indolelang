"use client";

import { useEffect, useState } from "react";

interface PWAInstallButtonProps {
  className?: string;
  label?: string;
}

export default function PWAInstallButton({
  className = "px-4 py-2 text-body-md font-bold text-primary border border-primary rounded-full hover:bg-primary/5 transition-all flex items-center gap-1.5",
  label = "Pasang Aplikasi",
}: PWAInstallButtonProps) {
  const [installable, setInstallable] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    // 1. Check if already running in standalone PWA mode
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    if (isStandalone) {
      return;
    }

    // 2. Check if iOS device
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !("MSStream" in window);
    setIsIOS(iOS);

    // iOS supports PWA but doesn't trigger beforeinstallprompt, so it's always "installable" manually
    if (iOS) {
      setInstallable(true);
      return;
    }

    // 3. For Android/Chrome/Desktop: check if prompt is already captured on window
    if ((window as any).deferredPWAInstallPrompt) {
      setInstallable(true);
    }

    // Listen for custom event if the prompt is captured after this component mounts
    const handleInstallAvailable = () => {
      setInstallable(true);
    };

    window.addEventListener("pwa-install-available", handleInstallAvailable);
    return () => {
      window.removeEventListener("pwa-install-available", handleInstallAvailable);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      // Show iOS Safari installation guide modal
      setShowIOSInstructions(true);
      return;
    }

    const promptEvent = (window as any).deferredPWAInstallPrompt;
    if (!promptEvent) {
      return;
    }

    // Trigger the native install prompt
    await promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;
    
    if (outcome === "accepted") {
      (window as any).deferredPWAInstallPrompt = null;
      setInstallable(false);
    }
  };

  if (!installable) return null;

  return (
    <>
      <button onClick={handleInstallClick} className={className} type="button">
        <span className="material-symbols-outlined text-lg">install_mobile</span>
        <span>{label}</span>
      </button>

      {/* iOS Instructions Modal */}
      {showIOSInstructions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl border border-outline-variant/60 shadow-2xl w-full max-w-[420px] p-6 relative animate-scale-up">
            {/* Close Button */}
            <button
              onClick={() => setShowIOSInstructions(false)}
              className="absolute top-4 right-4 text-on-surface-variant/70 hover:text-on-surface hover:bg-surface-variant/40 rounded-full p-1.5 transition-all"
            >
              <span className="material-symbols-outlined text-xl font-bold">close</span>
            </button>

            <div className="text-center pt-2">
              <span className="material-symbols-outlined text-primary text-5xl mb-3 block">
                install_mobile
              </span>
              <h3 className="text-heading-sm font-bold text-on-surface mb-2">
                Pasang di iPhone/iPad
              </h3>
              <p className="text-body-sm text-on-surface-variant mb-6 leading-relaxed">
                Ikuti langkah mudah ini untuk memasang aplikasi <strong>BIDKU</strong> pada layar utama iOS Anda:
              </p>

              <ol className="text-left space-y-4 text-body-sm text-on-surface-variant max-w-xs mx-auto mb-6">
                <li className="flex gap-3 items-start">
                  <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                    1
                  </span>
                  <span>
                    Buka situs ini menggunakan browser <strong>Safari</strong> bawaan HP.
                  </span>
                </li>
                <li className="flex gap-3 items-start">
                  <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                    2
                  </span>
                  <span>
                    Ketuk tombol <strong>Bagikan (Share)</strong>{" "}
                    <span className="material-symbols-outlined align-text-bottom text-base text-slate-600">
                      ios_share
                    </span>{" "}
                    di bagian bawah layar Safari Anda.
                  </span>
                </li>
                <li className="flex gap-3 items-start">
                  <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                    3
                  </span>
                  <span>
                    Gulir ke bawah dan ketuk opsi <strong>&quot;Tambah ke Layar Utama&quot;</strong> (*Add to Home Screen*).
                  </span>
                </li>
              </ol>

              <button
                onClick={() => setShowIOSInstructions(false)}
                className="w-full py-2.5 bg-primary text-on-primary rounded-xl font-bold text-body-md btn-press hover:bg-primary/95 transition-all shadow-md shadow-primary/20"
              >
                Saya Mengerti
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
