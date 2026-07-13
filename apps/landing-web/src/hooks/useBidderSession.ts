"use client";

import { useSyncExternalStore } from "react";
import { getAuthToken } from "@/lib/api";

function getSnapshot(): boolean {
  const token = getAuthToken();
  if (!token) return false;
  try {
    const stored = localStorage.getItem("user");
    const role = stored ? JSON.parse(stored).role : undefined;
    return role !== "provider";
  } catch {
    return true;
  }
}

function getServerSnapshot(): boolean {
  return false;
}

// Login state never changes without a navigation (no in-page login/logout
// UI mounts alongside this), so there's nothing to actively subscribe to —
// only the initial read needs to be correct on both server and client.
function subscribe(): () => void {
  return () => {};
}

/**
 * Whether the mobile app-shell (bottom nav, install prompt) should render:
 * a logged-in user whose role isn't "provider". Uses useSyncExternalStore
 * (React's built-in primitive for reading external mutable state like
 * localStorage) rather than a useState+useEffect pair — it guarantees the
 * server snapshot (false, since localStorage doesn't exist there) is used
 * for the initial hydration pass and the real client snapshot is read
 * correctly afterward, which a plain effect was not doing reliably on
 * every route in this app.
 */
export function useBidderSession() {
  const isBidderLoggedIn = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return { isBidderLoggedIn };
}
