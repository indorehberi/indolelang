export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
export const API_PREFIX = '/api/v1';

export function apiUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  
  // Dynamic host replacement for mobile device testing on local network
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    const dynamicBase = API_BASE_URL.replace('localhost', window.location.hostname).replace('127.0.0.1', window.location.hostname);
    return `${dynamicBase}${API_PREFIX}${cleanPath}`;
  }
  
  return `${API_BASE_URL}${API_PREFIX}${cleanPath}`;
}
