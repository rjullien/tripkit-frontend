/**
 * sw.js — TripKit Service Worker
 * - App shell: network-first online, cache-first when offline
 * - Trip assets under /api/trips/<id>/assets/: cache-first always
 * Bump CACHE_NAME when deploying new shell versions.
 */

const CACHE_NAME = 'tripkit-122';


const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/version.json',
  '/edge-model.json',
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
  '/js/trip-groups.js',
  '/js/construction-contract.js',
  '/js/app.js',
  '/js/components/list.js',
  '/js/components/daily-view.js',
  '/js/components/discovery-panel.js',
  '/js/components/hotel-card.js',
  '/js/components/bookings-view.js',
  '/js/components/day-cards.js',
  '/js/components/conference.js',
  '/js/components/timeline.js',
  '/js/components/weather.js',
  '/js/components/trip-selector.js',
  '/js/components/publish-panel.js',
  '/js/components/polarsteps-panel.js',
  '/js/components/leo-chat-stream.js',
  '/js/components/plus-chat-stream.js',
  '/js/components/edge-chat-stream.js',
  '/js/edge-model/config.js',
  '/js/edge-model/intent.js',
  '/js/edge-model/prompt-builder.js',
  '/js/edge-model/engine.js',
  '/js/components/route-view.js',
  '/js/components/culture-view.js',
  '/js/components/nuisance-stream.js',
  '/js/components/construction-view.js',
  '/js/lib/qrcode-svg.min.js',
  // Wllama JS only in precache — wasm (~7MB) loads on demand when user opts in.
  '/js/lib/wllama/index.min.js',
];

// ── Install: precache all assets ──────────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      // One-by-one so a single miss does not abort the whole shell.
      Promise.all(
        ASSETS.map(path =>
          cache.add(path).catch(err => {
            console.warn('[SW] precache miss:', path, err && err.message);
          })
        )
      )
    )
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

function cacheFirst(request) {
  return caches.open(CACHE_NAME).then(cache =>
    cache.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request)
        .then(response => {
          if (response && response.status === 200) {
            cache.put(request, response.clone());
          }
          return response;
        })
        .catch(() => new Response('Offline', { status: 503 }));
    })
  );
}

function networkFirstShell(request) {
  return fetch(request)
    .then(response => {
      if (response && response.status === 200) {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(request, clone);
        });
      }
      return response;
    })
    .catch(() =>
      caches.match(request).then(cached => {
        if (cached) return cached;
        if (request.mode === 'navigate') {
          return caches.match('/index.html');
        }
        return new Response('Offline', { status: 503 });
      })
    );
}

// ── Fetch ─────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Cross-origin (open-meteo, weather.gov, huggingface.co GGUF…) is never part of
  // the app shell: caching it would serve stale forecasts and put ~1 GB of model
  // into the Cache API. Let those requests go straight to the network.
  if (url.origin !== self.location.origin) return;

  // Wllama runtime (7–14 Mo) and any self-hosted GGUF: cloning a response that
  // large into the Cache API is enough to stall the wasm fetch on iOS Safari.
  if (url.pathname.endsWith('.gguf') || url.pathname.endsWith('.wasm')) return;

  // Trip assets: cache-first so the voyage keeps images offline after one online load
  if (/^\/api\/trips\/[^/]+\/assets\//.test(url.pathname)) {
    event.respondWith(cacheFirst(event.request));
    return;
  }

  // Other API calls: app handles offline (localStorage)
  if (url.pathname.startsWith('/api/')) return;

  // Offline: never wait on a hung network for the app shell
  if (!self.navigator.onLine) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
        return new Response('Offline', { status: 503 });
      })
    );
    return;
  }

  event.respondWith(networkFirstShell(event.request));
});
