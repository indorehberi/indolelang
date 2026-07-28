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
  { name: "Katalog", shortLabel: "Katalog", href: "/katalog", icon: "directions_car" },
  { name: "Beli NIPL", shortLabel: "Beli NIPL", href: "/bidder/deposit", icon: "payments" },
  { name: "Aktifitas", shortLabel: "Aktifitas", href: "/bidder/dashboard", icon: "query_stats" },
];

// Folded into the bottom tab bar's "Lainnya" bottom sheet on mobile. The
// desktop sidebar renders primaryNavItems + moreNavItems together.
export const moreNavItems: MenuItem[] = [
  { name: "Ruang Lelang Live", href: "/bidder/bidding-room", icon: "gavel", isLive: true },
  { name: "Keranjang", href: "/bidder/cart", icon: "shopping_cart" },
  { name: "Tagihan", href: "/bidder/invoices", icon: "receipt_long" },
  { name: "Riwayat", href: "/bidder/riwayat-lelang", icon: "history" },
  { name: "Refund", href: "/bidder/deposit/history", icon: "account_balance_wallet" },
  { name: "Profil", href: "/bidder/profile", icon: "person" },
  { name: "Jadi Mitra Provider", href: "/register/provider", icon: "storefront" },
];

export const allBidderNavItems: MenuItem[] = [...primaryNavItems, ...moreNavItems];
