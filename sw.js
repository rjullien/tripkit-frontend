/**
 * sw.js — TripKit Service Worker
 * - App shell: network-first online, cache-first when offline
 * - Trip assets under /api/trips/<id>/assets/: cache-first always
 * Bump CACHE_NAME when deploying new shell versions.
 */

const CACHE_NAME = 'tripkit-143';


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
  // The shell's JS is now 3 generated bundles instead of 31 individual files:
  // scripts/build-bundles.mjs concatenates the sources listed in bundles.json.
  // bundle-edge is NOT in index.html anymore: App injects it on demand on the
  // first Plus render (ensureEdgeBundle in js/app.js). It stays precached here so
  // the Léo / Bifrost / local-AI panels survive offline even for a user who never
  // opened the Plus tab while online. Careful: what the page requests is
  // `bundle-edge.js?v=<cache>` (cache-buster), while this list precaches the bare
  // path — the offline lookups below therefore retry with `ignoreSearch`, without
  // which the precached entry would never be hit and those panels would be lost.
  '/js/dist/bundle-core.js',
  '/js/dist/bundle-components.js',
  '/js/dist/bundle-edge.js',
  // NOT precached: /js/lib/wllama/index.min.js (~300 Ko). No <script> tag loads
  // it — edge-model/engine.js does `import()` it, but only when the user opts in
  // to the local AI. networkFirstShell caches it at that moment, so the feature
  // still works offline afterwards; paying 300 Ko on every first load did not.
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

/**
 * Cache lookup for a shell asset: exact URL first, then the same path with the
 * query string ignored. The shell is served with a `?v=<cache>` buster injected
 * by the Dockerfile (and by App.ensureEdgeBundle for bundle-edge), while ASSETS
 * precaches bare paths: without the second attempt, a precached-but-never-fetched
 * asset (typically /js/dist/bundle-edge.js) is a miss offline.
 * API responses never reach this helper (they return early in the fetch handler),
 * and trip assets keep an exact-match cacheFirst so the dev « no cache images »
 * buster still bypasses the cache.
 *
 * La recherche est bornée au cache de la release courante. Le global
 * `caches.match()` parcourait TOUS les caches de l'origine dans leur ordre de
 * création : comme `install` appelle `skipWaiting()`, le nouveau worker répond
 * déjà aux fetches pendant que `activate` supprime encore l'ancien cache dans son
 * `waitUntil`. Sur cette fenêtre d'une à deux secondes, un iPhone hors ligne
 * demandant `bundle-core.js?v=<nouveau>` tombait en repli `ignoreSearch` sur le
 * chemin nu de l'ANCIEN cache, donc sur l'ancien bundle.
 */
function matchShell(request) {
  return caches.open(CACHE_NAME).then(cache =>
    cache.match(request).then(cached => {
      if (cached) return cached;
      return cache.match(request, { ignoreSearch: true });
    })
  );
}

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
      matchShell(request).then(cached => {
        if (cached) return cached;
        if (request.mode === 'navigate') {
          return matchShell('/index.html');
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
      matchShell(event.request).then(cached => {
        if (cached) return cached;
        if (event.request.mode === 'navigate') {
          return matchShell('/index.html');
        }
        return new Response('Offline', { status: 503 });
      })
    );
    return;
  }

  event.respondWith(networkFirstShell(event.request));
});
