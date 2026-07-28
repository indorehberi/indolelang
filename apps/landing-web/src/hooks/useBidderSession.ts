"use client";

import { useSyncExternalStore } from "react";
import { getAuthToken } from "@/lib/api";

// Roles the bidder app-shell belongs to. "user" is included because a freshly
// registered account has not picked bidder-or-provider yet and still browses
// the bidder side. Everything else — provider and the staff roles — must be
// excluded by name: in production the admin panel is served from /admin on
// this same origin, so a signed-in superadmin shares this localStorage, and
// an "anything but provider" test would hand them the bidder shell.
const BIDDER_SHELL_ROLES = ["bidder", "user"];

function getSnapshot(): boolean {
  const token = getAuthToken();
  if (!token) return false;
  try {
    const stored = localStorage.getItem("user");
    const role = stored ? JSON.parse(stored).role : undefined;
    return BIDDER_SHELL_ROLES.includes(role);
  } catch {
    return false;
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
