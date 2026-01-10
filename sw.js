const CACHE_NAME = 'readact-v4';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  // Uncomment the lines below once you have created your icons
  // './icon-192.png',
  // './icon-512.png'
];

// Install event: cache files
self.addEventListener('install', (event) => {
  self.skipWaiting(); // Forces this new worker to become active immediately
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Activate event: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME) {
          return caches.delete(key);
        }
      }));
    }).then(() => self.clients.claim()) // Takes control of the page immediately
  );
});

// Fetch event: Network-First for HTML, Cache-First for assets
self.addEventListener('fetch', (event) => {
  // 1. If it's a navigation request (loading index.html), try Network first
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          return caches.open(CACHE_NAME).then((cache) => {
            // Update cache with the new version for next time
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        })
        .catch(() => {
          // If offline, fall back to cache
          return caches.match(event.request);
        })
    );
  } else {
    // 2. For everything else (images, scripts, manifest), use Cache First (faster)
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request);
      })
    );
  }
});
