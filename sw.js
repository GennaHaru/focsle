const cacheName = 'focsle-v21'; // Bump version
const assets = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './Logo.png',
  './SNAS.png',
  './favicon.png'
];

// Install Service Worker & Force Activation
self.addEventListener('install', evt => {
  self.skipWaiting(); // Skip waiting room and activate immediately
  evt.waitUntil(
    caches.open(cacheName).then(cache => {
      cache.addAll(assets);
    })
  );
});

// Activate Service Worker, clear old caches, & take control immediately
self.addEventListener('activate', evt => {
  evt.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys
          .filter(key => key !== cacheName)
          .map(key => caches.delete(key))
      );
    }).then(() => self.clients.claim()) // Claim all open PWA windows immediately
  );
});

// Fetching assets
self.addEventListener('fetch', evt => {
  const requestUrl = new URL(evt.request.url);

  // Network-First for HTML/Page Navigations (Ensures latest version is fetched)
  if (evt.request.mode === 'navigate' || requestUrl.pathname.endsWith('index.html')) {
    evt.respondWith(
      fetch(evt.request)
        .then(networkResponse => {
          return caches.open(cacheName).then(cache => {
            cache.put(evt.request, networkResponse.clone());
            return networkResponse;
          });
        })
        .catch(() => caches.match(evt.request))
    );
    return;
  }

  // Cache-First for static assets
  const cleanPath = requestUrl.pathname.endsWith('/')
    ? './'
    : './' + requestUrl.pathname.split('/').pop();

  evt.respondWith(
    caches.match(cleanPath).then(cachedResponse => {
      return cachedResponse || fetch(evt.request);
    })
  );
});
