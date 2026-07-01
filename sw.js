// Нюма Галипов — service worker
// Bump CACHE_VERSION whenever you upload a new index.html so phones fetch the fresh copy.
const CACHE_VERSION = "v31";
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

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Only handle same-origin GET requests (our own app files).
  // Google API / Drive requests pass straight through to the network.
  if (req.method !== "GET" || url.origin !== self.location.origin) {
    return;
  }

  // Network-first for the app shell so updates are picked up when online,
  // falling back to cache when offline.
  event.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
        return res;
      })
      .catch(() => caches.match(req).then((hit) => hit || caches.match("./index.html")))
  );
});
