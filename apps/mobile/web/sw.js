const CACHE = "bm-v2";
const ASSET_CACHE = "bm-assets-v2";
const API_CACHE = "bm-api-v2";

const STATIC_EXTENSIONS = /\.(js|css|json|png|jpg|jpeg|gif|svg|ico|woff2?|ttf|eot)$/;
const API_PATTERN = /\/api\//;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => {
      return cache.addAll(["/", "/index.html"]).catch(() => {});
    })
  );
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  const cacheList = [CACHE, ASSET_CACHE, API_CACHE];
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => !cacheList.includes(key))
          .map((key) => caches.delete(key))
      )
    )
  );
  event.waitUntil(clients.claim());
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (API_PATTERN.test(url.pathname)) {
    event.respondWith(networkFirst(request, API_CACHE));
    return;
  }

  if (STATIC_EXTENSIONS.test(url.pathname)) {
    event.respondWith(cacheFirst(request, ASSET_CACHE));
    return;
  }

  event.respondWith(networkFirst(request, CACHE));
});

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const fallback = await caches.match("/index.html");
    if (fallback) return fallback;
    throw error;
  }
}

async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) return cached;
    const fallback = await caches.match("/index.html");
    if (fallback) return fallback;
    throw error;
  }
}
