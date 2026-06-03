const cacheName = 'focsle-v6';
const assets = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './Logo.png',
  './SNAS.png',
  './favicon.png'
];

// Install Service Worker
self.addEventListener('install', evt => {
  evt.waitUntil(
    caches.open(cacheName).then(cache => {
      cache.addAll(assets);
    })
  );
});

// Fetching assets
self.addEventListener('fetch', evt => {
  evt.respondWith(
    caches.match(evt.request).then(rec => {
      return rec || fetch(evt.request);
    })
  );
});
