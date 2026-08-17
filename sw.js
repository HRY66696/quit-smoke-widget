// 极简 Service Worker:缓存应用外壳与风格素材,支持离线 / 添加到主屏幕
const CACHE = 'smoke-v5';
const FILES = [
  'index.html',
  'css/style.css',
  'js/app.js',
  'js/quotes.js',
  'manifest.json',
  'assets/%E5%B1%8F%E5%B9%95%E6%88%AA%E5%9B%BE%202026-08-17%20101452.png',
  'assets/%E5%B1%8F%E5%B9%95%E6%88%AA%E5%9B%BE%202026-08-17%20101456.png',
  'assets/%E5%B1%8F%E5%B9%95%E6%88%AA%E5%9B%BE%202026-08-17%20101505.png',
  'assets/%E5%B1%8F%E5%B9%95%E6%88%AA%E5%9B%BE%202026-08-17%20101519.png',
  'assets/%E5%B1%8F%E5%B9%95%E6%88%AA%E5%9B%BE%202026-08-17%20102705.png',
  'assets/%E5%B1%8F%E5%B9%95%E6%88%AA%E5%9B%BE%202026-08-17%20103709.png',
  'assets/%E5%B1%8F%E5%B9%95%E6%88%AA%E5%9B%BE%202026-08-17%20103716.png',
  'assets/%E5%B1%8F%E5%B9%95%E6%88%AA%E5%9B%BE%202026-08-17%20103749.png',
  'assets/%E5%B1%8F%E5%B9%95%E6%88%AA%E5%9B%BE%202026-08-17%20103756.png',
  'assets/%E5%B1%8F%E5%B9%95%E6%88%AA%E5%9B%BE%202026-08-17%20103805.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then((hit) => hit || fetch(e.request).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(e.request, copy));
      return res;
    }).catch(() => hit))
  );
});
