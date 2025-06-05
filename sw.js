// sw.js
const CACHE_NAME = 'ai-image-translator-cache-v1';
const urlsToCache = [
  './', // Or your specific HTML file name e.g., './index.html'
  './112992.jpg', // Cache the app icon
  // Add other critical assets if any, like main CSS or JS files if they are separate
  'https://cdn.jsdelivr.net/npm/marked/marked.min.js' // Cache external library
];

self.addEventListener('install', event => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching app shell');
        // Use addAll which fetches and caches. If any fetch fails, addAll fails.
        // For external resources like CDNs, be mindful of CORS if using cache.put directly with new Request(url, {mode: 'no-cors'})
        // but addAll handles standard CORS requests.
        return cache.addAll(urlsToCache.map(urlToCache => new Request(urlToCache, {cache: 'reload'})));
      })
      .then(() => {
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('Service Worker: Failed to cache during install:', error);
      })
  );
});

self.addEventListener('activate', event => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method === 'GET') {
    // Cache-First strategy
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          if (response) {
            return response; // Serve from cache
          }
          // Not in cache, fetch from network
          return fetch(event.request).then(
            networkResponse => {
              // Optionally, cache new GET requests dynamically if they are important
              // Be careful about caching API calls or frequently changing content
              // For example, only cache if it's one of the predefined URLs or asset types
              // const shouldCache = urlsToCache.some(url => event.request.url.endsWith(new URL(url, self.location.origin).pathname));
              // if (shouldCache) {
              // return caches.open(CACHE_NAME).then(cache => {
              // cache.put(event.request, networkResponse.clone());
              // return networkResponse;
              // });
              // }
              return networkResponse;
            }
          );
        })
        .catch(error => {
          console.error('Service Worker: Fetch error: ', error, event.request.url);
          // You could return a fallback offline page here if desired
        })
    );
  } else {
    // For non-GET requests (POST, etc.), always fetch from network
    event.respondWith(fetch(event.request));
  }
});
