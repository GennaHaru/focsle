const cacheName = 'focsle-v15';
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

// Fetching assets - Smart matching for query strings and subdirectories
self.addEventListener('fetch', evt => {
  // Create a clean URL object from the request
  const requestUrl = new URL(evt.request.url);

  // Strip query parameters (?v=11) so it matches the asset array cache key
  const cleanPath = requestUrl.pathname.endsWith('/')
    ? './'
    : './' + requestUrl.pathname.split('/').pop();

  evt.respondWith(
    caches.match(cleanPath).then(cachedResponse => {
      // Return the cached file if found, otherwise hit the network
      return cachedResponse || fetch(evt.request);
    })
  );
});

// Activate Service Worker and clear old caches
self.addEventListener('activate', evt => {
  evt.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys
          .filter(key => key !== cacheName)
          .map(key => caches.delete(key))
      );
    })
  );
});
