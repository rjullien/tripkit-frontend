/**
 * sw.js — TripKit Service Worker
 * Network-first strategy with cache fallback.
 * Bump CACHE_NAME when deploying new versions.
 */

const CACHE_NAME = 'tripkit-v47';

const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/version.json',
  '/css/theme.css',
  '/js/store.js',
  '/js/api.js',
  '/js/day-helpers.js',
  '/js/day-resolver.js',
  '/js/app.js',
  '/js/components/list.js',
  '/js/components/daily-view.js',
  '/js/components/hotel-card.js',
  '/js/components/day-cards.js',
  '/js/components/conference.js',
  '/js/components/timeline.js',
  '/js/components/weather.js',
  '/js/components/trip-selector.js',
  '/js/components/route-view.js',
  '/js/components/culture-view.js',
  '/js/lib/qrcode-svg.min.js',
  '/checklist.html',
  '/quiz.html',
  '/questions.json',
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

// ── Fetch: network-first, fallback to cache ───────────────────────────────────
self.addEventListener('fetch', event => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  // Skip API calls (they handle their own offline logic)
  const url = new URL(event.request.url);
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
