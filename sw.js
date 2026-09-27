const CACHE_NAME = "mental-weather-v3-manual-update";
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png",
  "./icons/apple-touch-icon.png",
  "./icons/favicon-32.png",
  "./icons/favicon-16.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      cache.addAll(APP_SHELL.map(url => new Request(url, { cache: "reload" })))
    )
  );
  // skipWaiting() は呼ばない。
  // 更新版は待機させ、画面の「更新する」が押された時だけ有効化する。
});

self.addEventListener("message", event => {
  if (event.data?.type === "ACTIVATE_UPDATE") {
    self.skipWaiting();
  }
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) return;

  if (event.request.mode === "navigate") {
    event.respondWith(
      caches.open(CACHE_NAME).then(async cache => {
        const cached = await cache.match("./index.html");
        if (cached) return cached;
        return fetch(event.request);
      })
    );
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then(async cache => {
      const cached = await cache.match(event.request);
      if (cached) return cached;

      const response = await fetch(event.request);
      if (response.ok) {
        cache.put(event.request, response.clone());
      }
      return response;
    })
  );
});
