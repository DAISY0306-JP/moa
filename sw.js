// 모아 service worker
// 自分のサイトのファイル（本体・データ）はネット優先：更新をすぐ反映し、オフラインのときだけ保存版を使う。
// Google Fonts はキャッシュ優先。
// ファイル構成を変えたときは VERSION を上げると古いキャッシュが消えます。
const VERSION = "moa-v4";
const SHELL = [
  "./", "./index.html", "./manifest.webmanifest",
  "./css/style.css",
  "./data/words.js", "./data/grammar.js", "./data/writing.js",
  "./js/tips.js", "./js/state.js", "./js/common.js", "./js/quiz.js", "./js/write51.js", "./js/gram.js",
  "./js/menu.js", "./js/write53-54.js", "./js/book.js", "./js/log.js", "./js/backup.js", "./js/main.js",
  "./icons/icon-192.png", "./icons/icon-512.png", "./icons/apple-touch-icon.png"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // 自分のサイト：ネット優先（失敗したら保存版）
  if (url.origin === location.origin) {
    const key = req.mode === "navigate" ? "./index.html" : req;
    e.respondWith(
      fetch(req)
        .then(res => { if (res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(key, copy)); } return res; })
        .catch(() => caches.match(key).then(hit => hit || caches.match(req, { ignoreSearch: true })))
    );
    return;
  }

  // Google Fonts：キャッシュ優先（裏で更新）
  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    e.respondWith(
      caches.match(req).then(hit => {
        const net = fetch(req).then(res => {
          if (res && (res.ok || res.type === "opaque")) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
          return res;
        }).catch(() => hit);
        return hit || net;
      })
    );
  }
});
