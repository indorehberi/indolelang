// ============================================================
// Indo-Lelang — Shared Enums
// Semua enum values lowercase sesuai AGENTS.md convention
// ============================================================

// --- User & Auth ---

export enum Role {
  SUPERADMIN = 'superadmin',
  ADMIN = 'admin',
  OPERATOR = 'operator',
  PROVIDER = 'provider',
  BIDDER = 'bidder',
  INSPECTOR = 'inspector',
  USER = 'user',
  FINANCE = 'finance',
}

export enum UserStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
}

// --- KYC ---

export enum KycStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum KycProvider {
  MANUAL = 'manual',
  VERIHUBS = 'verihubs',
  PRIVY = 'privy',
}

// --- Auction ---

export enum SessionStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  LIVE = 'live',
  CLOSED = 'closed',
}

export enum AssetStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  LISTED = 'listed',
  SOLD = 'sold',
  RETURNED = 'returned',
}

export enum AssetCategory {
  MOBIL = 'mobil',
  MOTOR = 'motor',
  ALAT_BERAT = 'alat_berat',
  PROPERTI = 'properti',
}

export enum LotStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  SOLD = 'sold',
  UNSOLD = 'unsold',
  CANCELLED = 'cancelled',
}

// --- Finance ---

export enum DepositStatus {
  PENDING = 'pending',
  PAID = 'paid',
  EXPIRED = 'expired',
  REFUNDED = 'refunded',
}

export enum PaymentMethod {
  VA_BCA = 'va_bca',
  VA_MANDIRI = 'va_mandiri',
  VA_BNI = 'va_bni',
  VA_BRI = 'va_bri',
  VA_PERMATA = 'va_permata',
  QRIS = 'qris',
}

export enum InvoiceStatus {
  UNPAID = 'unpaid',
  PAID = 'paid',
  OVERDUE = 'overdue',
}

export enum SettlementStatus {
  PENDING = 'pending',
  PROCESSED = 'processed',
  TRANSFERRED = 'transferred',
}

// --- Documents ---

export enum DocumentType {
  SURAT_JALAN = 'surat_jalan',
  BAST = 'bast',
  INVOICE = 'invoice',
}

// --- Notifications ---

export enum NotificationType {
  DEPOSIT_SUCCESS = 'deposit_success',
  NIPL_ACTIVE = 'nipl_active',
  SESSION_REMINDER = 'session_reminder',
  SESSION_STARTED = 'session_started',
  BID_OUTBID = 'bid_outbid',
  BID_WON = 'bid_won',
  INVOICE_CREATED = 'invoice_created',
  PAYMENT_REMINDER = 'payment_reminder',
  REFUND_PROCESSED = 'refund_processed',
  PICKUP_SCHEDULED = 'pickup_scheduled',
  BAST_READY = 'bast_ready',
  KYC_APPROVED = 'kyc_approved',
  KYC_REJECTED = 'kyc_rejected',
  ASSET_APPROVED = 'asset_approved',
  ASSET_REJECTED = 'asset_rejected',
  SETTLEMENT_TRANSFERRED = 'settlement_transferred',
}

// --- Feature Toggles ---

export enum FeatureToggle {
  LIVE_STREAMING = 'feat_live_streaming',
  EKYC_AUTO = 'feat_ekyc_auto',
  PUSH_NOTIFICATION = 'feat_push_notification',
  QRIS_PAYMENT = 'feat_qris_payment',
  ESIGN_BAST = 'feat_esign_bast',
  AUTO_REFUND = 'feat_auto_refund',
  PRICE_ALERT = 'feat_price_alert',
  MULTI_BRANCH = 'feat_multi_branch',
  ANALYTICS_DASHBOARD = 'feat_analytics_dashboard',
  AUDIT_TRAIL = 'feat_audit_trail',
}

// Default feature toggle values
export const FEATURE_TOGGLE_DEFAULTS: Record<FeatureToggle, boolean> = {
  [FeatureToggle.LIVE_STREAMING]: false,
  [FeatureToggle.EKYC_AUTO]: false,
  [FeatureToggle.PUSH_NOTIFICATION]: false,
  [FeatureToggle.QRIS_PAYMENT]: false,
  [FeatureToggle.ESIGN_BAST]: false,
  [FeatureToggle.AUTO_REFUND]: false,
  [FeatureToggle.PRICE_ALERT]: false,
  [FeatureToggle.MULTI_BRANCH]: true,
  [FeatureToggle.ANALYTICS_DASHBOARD]: true,
  [FeatureToggle.AUDIT_TRAIL]: true,
};
