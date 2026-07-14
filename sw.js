// Галипов — service worker
// Bump CACHE_VERSION whenever you upload a new index.html so phones fetch the fresh copy.
const CACHE_VERSION = "v38";
const CACHE_NAME = "numagalipov-" + CACHE_VERSION;

// The app is a single self-contained index.html, so that's all we need to cache.
const APP_SHELL = [
  "./",
  "./index.html"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k.startsWith("numagalipov-") && k !== CACHE_NAME)
            .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// STALE-WHILE-REVALIDATE:
// Serve the cached copy INSTANTLY (works offline and on flaky metro networks),
// while refreshing the cache in the background when the network allows.
// Version updates are picked up on the *next* launch after a successful refresh.
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Only handle same-origin GET requests (our own app files).
  // Google API / Drive requests pass straight through to the network.
  if (req.method !== "GET" || url.origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(req, { ignoreSearch: true });
      const refresh = fetch(req)
        .then((res) => {
          if (res && res.ok) cache.put(req, res.clone());
          return res;
        })
        .catch(() => null);
      if (cached) {
        // keep the background refresh alive even after we respond
        event.waitUntil(refresh);
        return cached;
      }
      const net = await refresh;
      return net || cache.match("./index.html", { ignoreSearch: true });
    })
  );
});
