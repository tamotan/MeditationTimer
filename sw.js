const CACHE_NAME = 'meditation-v1';
const PRECACHE_URLS = [
  './',
  './index.html',
  './audio/horagai1.mp3'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return Promise.all(PRECACHE_URLS.map(url => {
        return fetch(url, {cache: 'no-cache'}).then(resp => {
          if (!resp || resp.status !== 200) {
            return Promise.resolve();
          }
          return cache.put(url, resp.clone());
        }).catch(() => Promise.resolve());
      }));
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.destination === 'audio' || /\.mp3$/i.test(req.url)) {
    event.respondWith(
      caches.match(req).then(cached => {
        if (cached) return cached;
        return fetch(req).then(networkRes => {
          if (!networkRes || networkRes.status !== 200) return networkRes;
          const copy = networkRes.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
          return networkRes;
        }).catch(() => cached);
      })
    );
    return;
  }

  event.respondWith(
    fetch(req).then(res => res).catch(() => caches.match(req))
  );
});
