// Bump the version on every deploy: old caches get deleted on activate,
// so the PWA picks up the new build at the second launch at the latest.
const CACHE = 'ns-studio-v3';

const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then(cached =>
      cached ||
      fetch(event.request).then(res => {
        if (res.ok && new URL(event.request.url).origin === self.location.origin) {
          const copy = res.clone();
          caches.open(CACHE).then(cache => cache.put(event.request, copy));
        }
        return res;
      })
    )
  );
});
