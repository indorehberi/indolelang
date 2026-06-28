// ============================================================
// Indo-Lelang — Shared Utilities
// ============================================================

/**
 * Format number to Indonesian Rupiah currency format
 * Example: 1500000 -> "Rp 1.500.000"
 */
export function formatRupiah(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Format Date object or ISO string to standard Indonesian date-time string
 * Timezone is assumed/configured for Asia/Jakarta
 */
export function formatIndonesianDateTime(date: Date | string | number): string {
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'long',
    timeStyle: 'medium',
    timeZone: 'Asia/Jakarta',
  }).format(dateObj);
}

/**
 * Format Date object or ISO string to standard Indonesian date string
 */
export function formatIndonesianDate(date: Date | string | number): string {
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'long',
    timeZone: 'Asia/Jakarta',
  }).format(dateObj);
}

/**
 * Check if the given string is a valid Indonesian phone number
 * Valid formats: +628..., 628..., 08...
 * Min length 9, Max length 15 digits
 */
export function isValidIndonesianPhoneNumber(phone: string): boolean {
  const cleanPhone = phone.replace(/[^0-9+]/g, '');
  const idPhoneRegex = /^(?:\+62|62|0)8[1-9][0-9]{7,11}$/;
  return idPhoneRegex.test(cleanPhone);
}

/**
 * Format phone number to standard +62 format
 */
export function normalizeIndonesianPhoneNumber(phone: string): string {
  let cleanPhone = phone.replace(/[^0-9]/g, '');
  if (cleanPhone.startsWith('0')) {
    cleanPhone = '62' + cleanPhone.slice(1);
  } else if (!cleanPhone.startsWith('62')) {
    cleanPhone = '62' + cleanPhone;
  }
  return '+' + cleanPhone;
}

/**
 * Simple email validation helper
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Password strength checker
 * Minimum 8 characters, at least 1 letter and 1 number
 */
export function isPasswordStrong(password: string): boolean {
  if (password.length < 8) return false;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  return hasLetter && hasNumber;
}

// ============================================================
// Error Codes (UPPER_SNAKE_CASE)
// Sesuai dengan AGENTS.md Security & Database Rules
// ============================================================

export const ErrorCode = {
  // Auth Errors
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  USER_ALREADY_EXISTS: 'USER_ALREADY_EXISTS',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  USER_SUSPENDED: 'USER_SUSPENDED',
  USER_PENDING: 'USER_PENDING',
  
  // KYC Errors
  KYC_PENDING: 'KYC_PENDING',
  KYC_REJECTED: 'KYC_REJECTED',
  KYC_NOT_FOUND: 'KYC_NOT_FOUND',
  KYC_ALREADY_SUBMITTED: 'KYC_ALREADY_SUBMITTED',

  // OTP Errors
  OTP_INVALID: 'OTP_INVALID',
  OTP_EXPIRED: 'OTP_EXPIRED',
  OTP_TOO_MANY_ATTEMPTS: 'OTP_TOO_MANY_ATTEMPTS',

  // Bidding & Auction Errors
  INSUFFICIENT_DEPOSIT: 'INSUFFICIENT_DEPOSIT',
  LOT_NOT_ACTIVE: 'LOT_NOT_ACTIVE',
  BID_BELOW_INCREMENT: 'BID_BELOW_INCREMENT',
  BID_BELOW_STARTING_PRICE: 'BID_BELOW_STARTING_PRICE',
  BIDDER_OUTBID: 'BIDDER_OUTBID',
  AUCTION_SESSION_CLOSED: 'AUCTION_SESSION_CLOSED',
  AUCTION_SESSION_NOT_LIVE: 'AUCTION_SESSION_NOT_LIVE',
  OWN_ASSET_BID_FORBIDDEN: 'OWN_ASSET_BID_FORBIDDEN',

  // General & DB Errors
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  BAD_REQUEST: 'BAD_REQUEST',
  FEATURE_DISABLED: 'FEATURE_DISABLED',
  DB_ERROR: 'DB_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
} as const;

export type ErrorCodeType = typeof ErrorCode[keyof typeof ErrorCode];
