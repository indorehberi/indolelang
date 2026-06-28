// ============================================================
// Indo-Lelang — API Response Types
// Format standar sesuai AGENTS.md
// ============================================================

/** Meta pagination untuk list endpoints */
export interface PaginationMeta {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

/** Success response wrapper */
export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  message: string;
  meta?: PaginationMeta;
}

/** Error detail object */
export interface ApiErrorDetail {
  code: string;         // UPPER_SNAKE_CASE, e.g. INSUFFICIENT_DEPOSIT
  message: string;      // Pesan dalam Bahasa Indonesia
  details?: Record<string, unknown>;
}

/** Error response wrapper */
export interface ApiErrorResponse {
  success: false;
  error: ApiErrorDetail;
}

/** Union type untuk semua API responses */
export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

// ============================================================
// Auth Types
// ============================================================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterBidderRequest {
  email: string;
  phone: string;
  password: string;
  full_name: string;
  role: 'bidder';
}

export interface RegisterProviderRequest {
  email: string;
  phone: string;
  password: string;
  full_name: string;
  role: 'provider';
  company_name: string;
  npwp: string;
}

export type RegisterRequest = RegisterBidderRequest | RegisterProviderRequest;

export interface AuthTokens {
  accessToken: string;
}

export interface AuthUser {
  id: string;
  email: string;
  phone: string;
  full_name: string;
  role: string;
  status: string;
  kyc_status?: string;
}

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

export interface VerifyOtpRequest {
  phone: string;
  otp: string;
}

// ============================================================
// Entity DTOs (Data Transfer Objects)
// ============================================================

export interface UserDTO {
  id: string;
  email: string;
  phone: string;
  full_name: string;
  role: string;
  status: string;
  company_name?: string;
  npwp?: string;
  created_at: string;
  updated_at: string;
}

export interface KycDocumentDTO {
  id: string;
  user_id: string;
  ktp_url?: string;
  selfie_url?: string;
  ktp_selfie_url?: string;
  status: string;
  reviewer_id?: string;
  reviewed_at?: string;
  rejection_reason?: string;
  provider_ref_id?: string;
  created_at: string;
}

export interface BranchDTO {
  id: string;
  tenant_id: string;
  name: string;
  city: string;
  address: string;
  phone: string;
  pic_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuctionSessionDTO {
  id: string;
  branch_id: string;
  title: string;
  description?: string;
  scheduled_at: string;
  status: string;
  operator_id?: string;
  branch?: BranchDTO;
  created_at: string;
  updated_at: string;
}

export interface AssetDTO {
  id: string;
  provider_id: string;
  category: string;
  title: string;
  description?: string;
  base_price: number;
  images?: string[];
  status: string;
  created_at: string;
  updated_at: string;
}

export interface LotDTO {
  id: string;
  session_id: string;
  asset_id: string;
  lot_number: number;
  starting_price: number;
  hammer_price?: number;
  winner_id?: string;
  status: string;
  asset?: AssetDTO;
  created_at: string;
  updated_at: string;
}

export interface BidDTO {
  id: string;
  lot_id: string;
  bidder_id: string;
  amount: number;
  is_winning: boolean;
  created_at: string;
}

export interface DepositDTO {
  id: string;
  user_id: string;
  session_id: string;
  amount: number;
  va_number?: string;
  va_bank?: string;
  payment_method?: string;
  status: string;
  paid_at?: string;
  created_at: string;
}

export interface InvoiceDTO {
  id: string;
  lot_id: string;
  bidder_id: string;
  hammer_price: number;
  commission: number;
  tax: number;
  total: number;
  due_date: string;
  status: string;
  paid_at?: string;
  created_at: string;
}

export interface SettlementDTO {
  id: string;
  lot_id: string;
  provider_id: string;
  gross_amount: number;
  commission_deducted: number;
  net_amount: number;
  status: string;
  transferred_at?: string;
  created_at: string;
}

export interface DocumentDTO {
  id: string;
  invoice_id: string;
  type: string;
  file_url: string;
  generated_at: string;
  qr_hash: string;
}

export interface NotificationDTO {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  deep_link?: string;
  is_read: boolean;
  sent_at: string;
}

export interface PlatformSettingDTO {
  id: string;
  tenant_id: string;
  key: string;
  value: string;
  is_encrypted: boolean;
  updated_by?: string;
  updated_at: string;
}

export interface AuditLogDTO {
  id: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id: string;
  old_value?: string;
  new_value?: string;
  ip_address?: string;
  created_at: string;
}
