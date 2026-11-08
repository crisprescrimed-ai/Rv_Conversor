const CACHE_PREFIX = "rv-digital-pwa-";
const CACHE_NAME = `${CACHE_PREFIX}v7`;
const APP_SHELL = [
  "./index.html",
  "./manifest.webmanifest",
  "./icons/rv-digital.svg",
  "./icons/rv-digital-192.png",
  "./icons/rv-digital-512.png",
  "./icons/apple-touch-icon.png",
  "./modelos/declaracao-residencia-1.pdf",
  "./modelos/declaracao-residencia-2.pdf"
];

async function cacheResponse(request, response) {
  if (!response.ok) return response;
  try {
    const cache = await caches.open(CACHE_NAME);
    await cache.put(request, response.clone());
  } catch (error) {
    console.warn("Não foi possível guardar um recurso para uso offline:", error);
  }
  return response;
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => Promise.all(
        cacheNames
          .filter((cacheName) => cacheName.startsWith(CACHE_PREFIX) && cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const requestUrl = new URL(request.url);
  if (request.method !== "GET" || requestUrl.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => cacheResponse(request, response))
        .catch(async () => (await caches.match(request)) || caches.match("./index.html"))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;
      return fetch(request).then((response) => cacheResponse(request, response));
    })
  );
});
