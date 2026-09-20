// 体外循環技術認定士 対策問題集 - オフライン対応用 Service Worker
// index.html は全問題データを内包した単一ファイルなので、これ1つをキャッシュすればオフラインで動作する。
//
// v2での変更点（重要）：
// fetch(event.request) をそのまま呼ぶと、ブラウザ自身のHTTPキャッシュ
// （GitHub Pages配信時のCache-Controlヘッダ等）が優先され、
// 「ネットワーク優先」のつもりでも実際には古いキャッシュ済みレスポンスが
// 返ってしまい、index.html を更新してデプロイしてもアプリに反映されない
// 不具合があった。{cache:"no-store"} を指定して常にサーバーへ再取得しに
// 行くよう修正し、あわせてCACHE_NAMEを更新して古いキャッシュを破棄する。
const CACHE_NAME = "ecc-quiz-cache-v2";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ネットワーク優先、失敗時（オフライン時）はキャッシュから返す
// cache: "no-store" を指定し、ブラウザのHTTPキャッシュを経由せず必ずサーバーへ再取得しに行く。
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    fetch(event.request, { cache: "no-store" })
      .then((res) => {
        const resClone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(event.request).then((cached) => cached || caches.match("./index.html")))
  );
});
