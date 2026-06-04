const cacheName = 'focsle-v12';
const assets = [
  './',
  './index.html',
  './style.css?v=11',
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
