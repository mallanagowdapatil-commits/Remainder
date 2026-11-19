/**
 * MediTrack - Progressive Web App Service Worker
 * Application shell caching and offline resilience.
 */

const CACHE_NAME = 'meditrack-pwa-v2';

const STATIC_APP_SHELL = [
  './',
  './index.html',
  './login.html',
  './register.html',
  './dashboard.html',
  './assets/css/style.css',
  './assets/css/auth.css',
  './assets/css/dashboard.css',
  './assets/js/app.js',
  './assets/js/auth.js',
  './assets/js/dashboard.js',
  './assets/js/medicines.js',
  './assets/js/reminders.js',
  './assets/js/reports.js',
  './assets/js/history.js',
  './assets/js/ocr.js',
  './assets/js/language.js',
  './assets/js/offline.js',
  './assets/js/pharmacy.js',
  './assets/js/caregiver.js',
  './assets/js/blockchain.js',
  './assets/js/supabase.js',
  './config/config.js',
  './pwa/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching Application Shell...');
      return Promise.allSettled(
        STATIC_APP_SHELL.map((url) => {
          return cache.add(url).catch((err) => {
            console.warn(`[Service Worker] Resource skipped for ${url}:`, err.message);
          });
        })
      );
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            console.log('[Service Worker] Removing deprecated cache:', name);
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  if (req.method !== 'GET' || !url.protocol.startsWith('http')) {
    return;
  }

  // Same-origin asset handling: Stale-While-Revalidate
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(req).then((cachedResponse) => {
        const fetchPromise = fetch(req)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(req, responseToCache);
              });
            }
            return networkResponse;
          })
          .catch(() => {
            if (req.mode === 'navigate') {
              return caches.match('./dashboard.html') || caches.match('./index.html');
            }
          });

        return cachedResponse || fetchPromise;
      })
    );
  }
});
