const engagementStore = new Map<string, { view_count: number; like_count: number }>();

export function getLotEngagementMetrics(lotId: string) {
  const existing = engagementStore.get(lotId);
  if (existing) {
    return { view_count: existing.view_count, like_count: existing.like_count };
  }

  return { view_count: 0, like_count: 0 };
}

export function incrementLotView(lotId: string) {
  const current = engagementStore.get(lotId) || { view_count: 0, like_count: 0 };
  const next = { ...current, view_count: current.view_count + 1 };
  engagementStore.set(lotId, next);
  return next;
}

export function incrementLotLike(lotId: string) {
  const current = engagementStore.get(lotId) || { view_count: 0, like_count: 0 };
  const next = { ...current, like_count: current.like_count + 1 };
  engagementStore.set(lotId, next);
  return next;
}
