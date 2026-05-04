const CACHE_NAME = 'rh-manager-v1';
const STATIC_ASSETS = ['/', '/rh', '/offline.html'];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
});

self.addEventListener('fetch', (e) => {
  if (!navigator.onLine) {
    e.respondWith(caches.match(e.request).then(r => r || caches.match('/offline.html')));
  }
});
