// Minimal service worker: enables PWA installability (Add to Home Screen)
// without any offline caching strategy yet. Activates immediately and takes
// control of open pages, then simply passes every request through to the
// network unchanged.
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});
