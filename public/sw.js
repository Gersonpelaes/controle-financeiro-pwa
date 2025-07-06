const CACHE_NAME = 'controle-financeiro-cache-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
  'https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;700&display=swap'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache and caching shell assets');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', event => {
  // We only want to cache GET requests.
  if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) {
    return;
  }

  // Strategy: Stale-While-Revalidate
  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cachedResponse = await cache.match(event.request);
      
      const fetchedResponsePromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          cache.put(event.request, networkResponse.clone());
        }
        return networkResponse;
      }).catch(err => {
        console.error('Fetch failed:', err);
        // If fetch fails and we have a cached response, we can still use it.
        // If not, the browser will show its default offline error.
      });

      // Return the cached response if it's available, otherwise wait for the network.
      return cachedResponse || fetchedResponsePromise;
    })
  );
});
