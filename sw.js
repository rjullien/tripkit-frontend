/**
 * sw.js — TripKit Service Worker
 * Network-first strategy with cache fallback.
 * Bump CACHE_NAME when deploying new versions.
 */

const CACHE_NAME = 'tripkit-75';

const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/version.json',
  '/config.js',
  '/icons/juju-icon.svg',
  '/icons/icon-192-v3.png',
  '/icons/icon-512-v3.png',
  '/css/theme.css',
  '/js/store.js',
  '/js/api.js',
  '/js/seed-merge.js',
  '/js/day-helpers.js',
  '/js/tz-helpers.js',
  '/js/people-helpers.js',
  '/js/day-resolver.js',
  '/js/app.js',
  '/js/components/list.js',
  '/js/components/daily-view.js',
  '/js/components/hotel-card.js',
  '/js/components/bookings-view.js',
  '/js/components/day-cards.js',
  '/js/components/conference.js',
  '/js/components/timeline.js',
  '/js/components/weather.js',
  '/js/components/trip-selector.js',
  '/js/components/publish-panel.js',
  '/js/components/leo-chat.js',
  '/js/components/route-view.js',
  '/js/components/culture-view.js',
  '/js/lib/qrcode-svg.min.js',
];

// ── Install: precache all assets ──────────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS).catch(err => {
        // Don't fail install if some assets are missing (dev mode)
        console.warn('[SW] Some assets failed to precache:', err);
      });
    })
  );
  self.skipWaiting();
});

// ── Activate: clean old caches ────────────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// ── Fetch: network-first (shell), cache-first for trip assets ─────────────────
self.addEventListener('fetch', event => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Trip assets: cache-first so the current voyage keeps images offline
  // after they were loaded once online.
  if (/^\/api\/trips\/[^/]+\/assets\//.test(url.pathname)) {
    event.respondWith(
      caches.open(CACHE_NAME).then(cache =>
        cache.match(event.request).then(cached => {
          const network = fetch(event.request)
            .then(response => {
              if (response && response.status === 200) {
                cache.put(event.request, response.clone());
              }
              return response;
            })
            .catch(() => cached || new Response('Offline', { status: 503 }));
          return cached || network;
        })
      )
    );
    return;
  }

  // Other API calls: app handles offline (localStorage)
  if (url.pathname.startsWith('/api/')) return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Cache successful responses
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, clone);
          });
        }
        return response;
      })
      .catch(() => {
        // Network failed — serve from cache
        return caches.match(event.request).then(cached => {
          if (cached) return cached;
          // Last resort: return index.html for navigation requests
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
          return new Response('Offline', { status: 503 });
        });
      })
  );
});
