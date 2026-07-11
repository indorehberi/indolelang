export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
export const API_PREFIX = '/api/v1';

export function getImageUrl(url: string | undefined): string {
  if (!url) return "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&q=80&w=600";
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  
  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    if (API_BASE_URL.includes('localhost') || API_BASE_URL.includes('127.0.0.1')) {
      let dynamicBase = API_BASE_URL.replace('localhost', window.location.hostname).replace('127.0.0.1', window.location.hostname);
      if (window.location.protocol === 'https:' && dynamicBase.startsWith('http://')) {
        dynamicBase = dynamicBase.replace('http://', 'https://');
      }
      return `${dynamicBase}${cleanPath}`;
    }
  }
  
  return `${API_BASE_URL}${cleanPath}`;
}

export function apiUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  
  // Dynamic host replacement for mobile device testing on local network
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    if (API_BASE_URL.includes('localhost') || API_BASE_URL.includes('127.0.0.1')) {
      let dynamicBase = API_BASE_URL.replace('localhost', window.location.hostname).replace('127.0.0.1', window.location.hostname);
      if (window.location.protocol === 'https:' && dynamicBase.startsWith('http://')) {
        dynamicBase = dynamicBase.replace('http://', 'https://');
      }
      return `${dynamicBase}${API_PREFIX}${cleanPath}`;
    }
  }
  
  return `${API_BASE_URL}${API_PREFIX}${cleanPath}`;
}

export async function fetchWithRetry(url: string, options?: RequestInit, retries = 3, delayMs = 1000): Promise<Response> {
  let lastError: any;

  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      return response;
    } catch (error) {
      lastError = error;
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }

  throw lastError;
}

/**
 * Centralized API token retriever
 */
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken') || localStorage.getItem('token');
}

/**
 * Minimal pub-sub so non-component code (e.g. clearAuthAndRedirect below) can
 * trigger a floating toast without importing React. ToastProvider registers
 * itself here on mount.
 */
type ToastVariant = 'success' | 'error' | 'warning' | 'info';
type ToastHandler = (message: string, variant?: ToastVariant, duration?: number) => void;
let toastHandler: ToastHandler | null = null;

export function registerToastHandler(handler: ToastHandler | null): void {
  toastHandler = handler;
}

export function notify(message: string, variant: ToastVariant = 'info', duration?: number): void {
  if (toastHandler) {
    toastHandler(message, variant, duration);
  }
}

// Endpoints that legitimately return 401 for reasons other than an expired
// access token (e.g. wrong password) — never auto-refresh/redirect for these.
const AUTH_EXEMPT_PATHS = ['/auth/login', '/auth/register', '/auth/refresh-token', '/auth/verify-otp', '/auth/google'];

function isAuthExempt(path: string): boolean {
  return AUTH_EXEMPT_PATHS.some((p) => path.startsWith(p));
}

let refreshPromise: Promise<string | null> | null = null;

/**
 * Exchange the httpOnly refresh-token cookie for a new access token.
 * Concurrent callers share the same in-flight request.
 */
export async function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const res = await fetch(apiUrl('/auth/refresh-token'), {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });
        if (!res.ok) return null;
        const data = await res.json();
        const token = data?.data?.accessToken;
        if (!token) return null;
        localStorage.setItem('accessToken', token);
        return token;
      } catch {
        return null;
      } finally {
        refreshPromise = null;
      }
    })();
  }
  return refreshPromise;
}

/**
 * Clear the session (server + local) and send the user back to login.
 * Shared by idle-timeout, the 401 handler below, and manual logout buttons.
 */
export function clearAuthAndRedirect(reason?: string): void {
  fetch(apiUrl('/auth/logout'), { method: 'POST', credentials: 'include' }).catch(() => {});
  localStorage.removeItem('accessToken');
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('refreshToken');
  notify(reason || 'Sesi Anda telah berakhir. Silakan login kembali.', 'error');
  window.location.href = '/login';
}

/**
 * Auth-aware fetch wrapper. On a 401 (expired access token) it silently
 * exchanges the refresh-token cookie for a new access token and retries the
 * request once. If the refresh also fails, the session is cleared and the
 * user is redirected to login instead of the app failing silently.
 */
export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const doFetch = (token: string | null) => {
    // Let the browser set Content-Type (with boundary) for FormData bodies —
    // forcing application/json would break multipart file uploads.
    const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
    const headers: HeadersInit = {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...options.headers,
    };
    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }
    return fetch(apiUrl(path), { ...options, credentials: 'include', headers });
  };

  let response = await doFetch(getAuthToken());

  if (response.status === 401 && !isAuthExempt(path)) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      response = await doFetch(newToken);
    } else {
      clearAuthAndRedirect();
    }
  } else if (response.status === 403 && !isAuthExempt(path)) {
    // A 403 can mean the cached access token still carries a stale role
    // (e.g. an admin approved a bidder->provider upgrade in another
    // session). Try one silent refresh + retry — refreshAccessToken()
    // re-reads the user's current role from the DB. If it's still
    // forbidden afterward, it's a genuine permission error, so don't
    // clear the session — just return that response as-is.
    const newToken = await refreshAccessToken();
    if (newToken) {
      response = await doFetch(newToken);
    }
  }

  return response;
}
