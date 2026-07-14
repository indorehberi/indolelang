// PWA lifecycle only — this worker deliberately caches nothing.
//
// The fetch listener exists solely because Chrome requires one before it treats
// the site as installable. It must never call respondWith(): leaving requests
// untouched means bids, socket.io traffic and API calls go straight to the
// network, so this worker can never serve a stale response or become an extra
// point of failure during a live auction. Freshness of the app shell is handled
// by the build-id check in ServiceWorkerRegister instead.
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Insurance: drop anything an earlier worker may have cached, so no device
      // can keep booting an old build out of Cache Storage.
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", () => {});
