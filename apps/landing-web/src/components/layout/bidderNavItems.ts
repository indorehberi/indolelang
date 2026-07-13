export type MenuItem = {
  name: string;
  shortLabel?: string; // compact label for the mobile bottom tab bar
  href: string;
  icon: string;
  isLive?: boolean;
  badge?: string;
};

// Promoted to the mobile bottom tab bar (max 5, native convention).
export const primaryNavItems: MenuItem[] = [
  { name: "Beranda", shortLabel: "Beranda", href: "/bidder/home", icon: "home" },
  { name: "Statistik", shortLabel: "Statistik", href: "/bidder/dashboard", icon: "query_stats" },
  { name: "Ruang Lelang Live", shortLabel: "Live", href: "/bidder/bidding-room", icon: "play_circle", isLive: true },
  { name: "Keranjang Tagihan", shortLabel: "Keranjang", href: "/bidder/cart", icon: "shopping_cart" },
];

// Folded into the bottom tab bar's "Lainnya" bottom sheet on mobile. The
// desktop sidebar renders primaryNavItems + moreNavItems together.
export const moreNavItems: MenuItem[] = [
  { name: "Beli Deposit NIPL", href: "/bidder/deposit", icon: "payments" },
  { name: "Riwayat Tagihan", href: "/bidder/invoices", icon: "receipt_long" },
  { name: "Riwayat Lelang", href: "/bidder/riwayat-lelang", icon: "history" },
  { name: "Riwayat Deposit & Refund", href: "/bidder/deposit/history", icon: "account_balance_wallet" },
  { name: "Profil & eKYC", href: "/bidder/profile", icon: "person" },
];

export const allBidderNavItems: MenuItem[] = [...primaryNavItems, ...moreNavItems];
