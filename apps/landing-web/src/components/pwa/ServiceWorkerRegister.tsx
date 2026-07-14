"use client";

import { useEffect } from "react";
import { notify } from "@/lib/api";

// Build id baked into this bundle at compile time (see next.config.ts).
const BUILD_ID = process.env.NEXT_PUBLIC_BUILD_ID ?? "";
const CHECK_INTERVAL_MS = 60_000;
// Reloading mid-bid could cost a user the lot, so the bidding room is asked
// rather than forced. Everywhere else the reload is silent and immediate.
const BIDDING_ROOM_PATH = "/bidder/bidding-room";
const RELOAD_GUARD_KEY = "pwa-reloaded-for-build";

export default function ServiceWorkerRegister() {
  useEffect(() => {
    let disposed = false;
    let reloading = false;
    let notifiedBuildId: string | null = null;

    const register = () => {
      if (!("serviceWorker" in navigator)) return;
      navigator.serviceWorker
        .register("/sw.js", { scope: "/", updateViaCache: "none" })
        .catch((err) => console.error("Service worker registration failed", err));
    };

    const reloadToNewBuild = async (latestBuildId: string) => {
      if (reloading) return;
      reloading = true;
      // If the reload somehow lands us on the old build again, this stops us
      // from looping forever.
      sessionStorage.setItem(RELOAD_GUARD_KEY, latestBuildId);
      try {
        const registration = await navigator.serviceWorker?.getRegistration();
        await registration?.update();
      } catch {
        // A failed worker update must not block the reload.
      }
      window.location.reload();
    };

    const checkForNewBuild = async () => {
      if (disposed || reloading || !BUILD_ID) return;

      let latestBuildId = "";
      try {
        const res = await fetch("/version", { cache: "no-store" });
        if (!res.ok) return;
        latestBuildId = (await res.json())?.buildId ?? "";
      } catch {
        return; // Offline or flaky network — the next check will retry.
      }

      if (!latestBuildId || latestBuildId === BUILD_ID) return;

      if (sessionStorage.getItem(RELOAD_GUARD_KEY) === latestBuildId) {
        console.error(
          `Still running build ${BUILD_ID} after reloading for ${latestBuildId} — a stale response is being served.`
        );
        return;
      }

      if (window.location.pathname.startsWith(BIDDING_ROOM_PATH)) {
        // Never yank the page out from under an active bidder. The check keeps
        // running, so the reload happens as soon as they leave the room.
        if (document.visibilityState === "visible" && notifiedBuildId !== latestBuildId) {
          notifiedBuildId = latestBuildId;
          notify(
            "Versi baru BIDKU tersedia. Halaman akan dimuat ulang setelah Anda keluar dari ruang lelang.",
            "info",
            8000
          );
        }
        return;
      }

      await reloadToNewBuild(latestBuildId);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") void checkForNewBuild();
    };

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      (window as any).deferredPWAInstallPrompt = e;
      window.dispatchEvent(new CustomEvent("pwa-install-available"));
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register);
    }

    void checkForNewBuild();
    const interval = window.setInterval(() => void checkForNewBuild(), CHECK_INTERVAL_MS);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      disposed = true;
      window.clearInterval(interval);
      window.removeEventListener("load", register);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return null;
}
