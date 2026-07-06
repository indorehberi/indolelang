/**
 * Centralized API configuration for the admin panel.
 * Uses NEXT_PUBLIC_API_URL environment variable instead of hardcoded localhost.
 */
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
export const API_PREFIX = '/api/v1';

/**
 * Build a full API URL from a path.
 * @example apiUrl('/auth/login') => 'http://localhost:8000/api/v1/auth/login'
 */
export function apiUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  
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

/**
 * Build a base URL (without API prefix) for WebSocket connections.
 * @example wsBaseUrl() => 'http://localhost:8000'
 */
export function wsBaseUrl(): string {
  return API_BASE_URL;
}

/**
 * Centralized API token retriever
 */
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken') || localStorage.getItem('token');
}

/**
 * Standard fetch wrapper with auth token from localStorage.
 */
export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }
  return fetch(apiUrl(path), { ...options, headers });
}
