const CACHE_PREFIX =
  `mental-weather-auto:${self.registration.scope}:`;
const CACHE_NAME = `${CACHE_PREFIX}v5`;

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

// 必要なファイルをすべて取得できたら、自動で新版を有効化。
self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);

    await cache.addAll(
      APP_SHELL.map(url => new Request(
        new URL(url, self.registration.scope).href,
        { cache: "reload" }
      ))
    );

    await self.skipWaiting();
  })());
});

// 旧画面の更新ボタンも引き続き受け付ける。
self.addEventListener("message", event => {
  if (event.data?.type === "ACTIVATE_UPDATE") {
    event.waitUntil(self.skipWaiting());
  }
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();

    await Promise.all(
      keys
        .filter(key =>
          key !== CACHE_NAME &&
          (
            key.startsWith(CACHE_PREFIX) ||
            key === "mental-weather-v3-manual-update"
          )
        )
        .map(key => caches.delete(key))
    );

    await self.clients.claim();
  })());
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  const requestUrl = new URL(event.request.url);
  const scopeUrl = new URL(self.registration.scope);

  if (
    requestUrl.origin !== scopeUrl.origin ||
    !requestUrl.pathname.startsWith(scopeUrl.pathname)
  ) {
    return;
  }

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);

    if (event.request.mode === "navigate") {
      const indexUrl = new URL(
        "./index.html",
        self.registration.scope
      ).href;

      const cached = await cache.match(indexUrl);
      if (cached) return cached;

      return fetch(event.request);
    }

    const cached = await cache.match(event.request);
    if (cached) return cached;

    const response = await fetch(event.request);

    if (response.ok && response.type === "basic") {
      await cache.put(event.request, response.clone());
    }

    return response;
  })());
});
