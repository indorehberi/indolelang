"use client";

import { useEffect, useState } from "react";

const DISMISSED_KEY = "pwa-install-dismissed";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    const dismissed = localStorage.getItem(DISMISSED_KEY) === "1";
    if (isStandalone || dismissed) return;

    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !("MSStream" in window);
    setIsIOS(iOS);
    if (iOS) setVisible(true);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISSED_KEY, "1");
    setVisible(false);
  };

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    dismiss();
  };

  if (!visible) return null;

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 bg-primary/10 border-b border-primary/20 text-on-surface">
      <span className="material-symbols-outlined text-primary text-xl flex-shrink-0">
        install_mobile
      </span>
      {isIOS ? (
        <p className="flex-1 text-body-sm">
          Pasang BIDKU di layar utama: ketuk tombol{" "}
          <span className="material-symbols-outlined align-text-bottom text-base">ios_share</span>{" "}
          Bagikan, lalu &quot;Tambah ke Layar Utama&quot;.
        </p>
      ) : (
        <>
          <p className="flex-1 text-body-sm">Pasang BIDKU sebagai aplikasi di perangkat Anda.</p>
          <button
            onClick={handleInstall}
            className="px-3 py-1.5 text-body-sm font-bold text-on-primary bg-primary rounded-full btn-press flex-shrink-0"
          >
            Pasang
          </button>
        </>
      )}
      <button
        onClick={dismiss}
        aria-label="Tutup"
        className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 hover:bg-primary/15"
      >
        <span className="material-symbols-outlined text-lg">close</span>
      </button>
    </div>
  );
}
