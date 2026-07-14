"use client";

import { useEffect, useRef } from "react";

const DEFAULT_MIN_INTERVAL_MS = 15_000;

/**
 * Re-runs `refresh` whenever the app returns to the foreground or the network
 * reconnects.
 *
 * An installed PWA is normally *resumed* rather than reloaded, so a page that
 * only fetches inside a mount-time useEffect keeps showing whatever it loaded
 * the first time it was opened — days ago, in practice. For auction prices, lot
 * status and NIPL counts that is not acceptable.
 *
 * `minIntervalMs` throttles rapid app-switching so a user flipping back and
 * forth doesn't hammer the API.
 */
export function useRefreshOnForeground(
  refresh: () => void | Promise<void>,
  minIntervalMs: number = DEFAULT_MIN_INTERVAL_MS
) {
  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;
  // Seeded at mount so the page's own initial fetch isn't immediately repeated.
  const lastRunRef = useRef(Date.now());

  useEffect(() => {
    const run = () => {
      const now = Date.now();
      if (now - lastRunRef.current < minIntervalMs) return;
      lastRunRef.current = now;
      void refreshRef.current();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") run();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("online", run);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("online", run);
    };
  }, [minIntervalMs]);
}
