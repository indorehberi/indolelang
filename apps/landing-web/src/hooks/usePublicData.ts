import { useQuery } from '@tanstack/react-query';
import { apiUrl } from '../lib/api';

async function fetchJson(url: string) {
  const res = await fetch(url);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || 'Gagal mengambil data dari API');
  }
  const result = await res.json();
  return result.data;
}

export function usePublicSessions() {
  return useQuery({
    queryKey: ['public-sessions'],
    queryFn: () => fetchJson(apiUrl('/public/sessions')),
  });
}

export function usePublicSessionDetail(id: string) {
  return useQuery({
    queryKey: ['public-sessions', id],
    queryFn: () => fetchJson(apiUrl(`/public/sessions/${id}`)),
    enabled: !!id,
  });
}

export function useFeaturedLots() {
  return useQuery({
    queryKey: ['featured-lots'],
    queryFn: () => fetchJson(apiUrl('/public/lots/featured')),
  });
}

export function useCategoryStats() {
  return useQuery({
    queryKey: ['category-stats'],
    queryFn: () => fetchJson(apiUrl('/public/categories/stats')),
  });
}

export function usePlatformStats() {
  return useQuery({
    queryKey: ['platform-stats'],
    queryFn: () => fetchJson(apiUrl('/public/stats')),
  });
}
