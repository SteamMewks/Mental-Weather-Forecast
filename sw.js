const APP_VERSION = "v6";

const CACHE_PREFIX =
  `mental-weather-auto:${self.registration.scope}:`;

const CACHE_NAME =
  `${CACHE_PREFIX}${APP_VERSION}`;

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

/* =========================
   インストール
========================= */

self.addEventListener("install", event => {
  event.waitUntil((async () => {

    const cache = await caches.open(CACHE_NAME);

    await cache.addAll(
      APP_SHELL.map(url =>
        new Request(
          new URL(url, self.registration.scope).href,
          {
            cache: "reload"
          }
        )
      )
    );

    // 待機せず即座に新版SWへ
    await self.skipWaiting();

  })());
});


/* =========================
   メッセージ受信
========================= */

self.addEventListener("message", event => {

  if (event.data?.type === "GET_APP_VERSION") {

    const message = {
      type: "APP_VERSION",
      version: APP_VERSION
    };

    // MessageChannel経由
    if (event.ports && event.ports[0]) {
      event.ports[0].postMessage(message);
      return;
    }

    // 念のため通常postMessageにも対応
    if (event.source) {
      event.source.postMessage(message);
    }

  }

});


/* =========================
   有効化
========================= */

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

    // 開いているページを即座に新版SWの管理下へ
    await self.clients.claim();

  })());
});


/* =========================
   Fetch
========================= */

self.addEventListener("fetch", event => {

  if (event.request.method !== "GET") {
    return;
  }

  const requestUrl =
    new URL(event.request.url);

  const scopeUrl =
    new URL(self.registration.scope);

  // アプリ自身のファイルだけ処理
  if (
    requestUrl.origin !== scopeUrl.origin ||
    !requestUrl.pathname.startsWith(scopeUrl.pathname)
  ) {
    return;
  }


  /* -------------------------
     HTMLページ
     Network First
  ------------------------- */

  if (event.request.mode === "navigate") {

    event.respondWith((async () => {

      const cache =
        await caches.open(CACHE_NAME);

      try {

        // まず最新版を取得
        const response =
          await fetch(
            event.request,
            {
              cache: "no-store"
            }
          );

        if (response.ok) {

          const indexUrl =
            new URL(
              "./index.html",
              self.registration.scope
            ).href;

          await cache.put(
            indexUrl,
            response.clone()
          );

        }

        return response;

      } catch (error) {

        // オフライン時はキャッシュ
        const indexUrl =
          new URL(
            "./index.html",
            self.registration.scope
          ).href;

        const cached =
          await cache.match(indexUrl);

        if (cached) {
          return cached;
        }

        throw error;

      }

    })());

    return;
  }


  /* -------------------------
     その他のアセット
     Cache First
  ------------------------- */

  event.respondWith((async () => {

    const cache =
      await caches.open(CACHE_NAME);

    const cached =
      await cache.match(event.request);

    if (cached) {
      return cached;
    }

    const response =
      await fetch(event.request);

    if (
      response.ok &&
      response.type === "basic"
    ) {

      await cache.put(
        event.request,
        response.clone()
      );

    }

    return response;

  })());

});