// 甜甜收藏夹 Service Worker
// 作用：让浏览器识别为可安装 PWA，并提供基础离线缓存
const CACHE_NAME = "tian-store-v1";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-512.png"
];

// 安装：预缓存核心资源
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

// 激活：清理旧缓存
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// 请求：网络优先，失败回退缓存（导航请求离线时返回首页）
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  // 导航请求：先尝试网络，失败时返回缓存的 index.html
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).catch(() => caches.match("./index.html").then((r) => r || caches.match("./")))
    );
    return;
  }

  // 静态资源：缓存优先，回退网络
  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req).then((res) => {
      // 同源 GET 才缓存，避免缓存第三方资源
      try {
        const url = new URL(req.url);
        if (url.origin === self.location.origin && res && res.status === 200) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(req, copy));
        }
      } catch (e) {}
      return res;
    }).catch(() => cached))
  );
});
