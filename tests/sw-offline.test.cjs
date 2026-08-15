/**
 * tests/sw-offline.test.cjs — sw.js servi hors ligne, en particulier bundle-edge
 *
 * Régression couverte : bundle-edge n'est plus dans index.html, il est injecté par
 * App.ensureEdgeBundle avec le cache-buster (`bundle-edge.js?v=<cache>`), alors que
 * la liste ASSETS précache le chemin nu. Un utilisateur qui démarre en ligne SANS
 * ouvrir l'onglet Plus puis passe hors ligne n'a donc jamais l'URL exacte en cache :
 * sans repli `ignoreSearch`, les sections Léo / Bifrost / Local disparaissent.
 *
 * sw.js est évalué dans un vm avec une Cache API minimale : pas de navigateur ici,
 * ce sont les branches du handler `fetch` qui sont vérifiées.
 */
const path = require('path');
const fs = require('fs');
const assert = require('assert');
const vm = require('vm');

process.chdir(path.join(__dirname, '..'));

let pass = 0;
function test(name, fn) {
  return Promise.resolve()
    .then(fn)
    .then(() => { console.log(`  ✅ ${name}`); pass++; })
    .catch(e => { console.log(`  ❌ ${name}\n     ${e.message}`); process.exitCode = 1; });
}

const ORIGIN = 'https://tripkit.test';

/** Fabrique un environnement de service worker jouable. */
function makeSW({ network }) {
  const caches = new Map(); // name -> Map<url, {url, body, status}>
  const listeners = {};

  const urlOf = (req) => new URL(typeof req === 'string' ? req : req.url, ORIGIN).href;
  const pathOf = (href) => new URL(href).origin + new URL(href).pathname;

  const fetchImpl = (req) => {
    const href = urlOf(req);
    if (!network) return Promise.reject(new Error('offline'));
    const body = network[pathOf(href)];
    if (body === undefined) {
      return Promise.resolve({ url: href, status: 404, body: '', clone() { return this; } });
    }
    return Promise.resolve({ url: href, status: 200, body, clone() { return Object.assign({}, this); } });
  };

  const wrap = (store) => ({
    add: (path) => fetchImpl(path).then(res => {
      if (res.status !== 200) throw new Error('precache ' + res.status);
      store.set(urlOf(path), res);
    }),
    put: (req, res) => { store.set(urlOf(req), res); return Promise.resolve(); },
    match: (req, opts) => {
      const href = urlOf(req);
      if (store.has(href)) return Promise.resolve(store.get(href));
      if (opts && opts.ignoreSearch) {
        for (const [key, res] of store) {
          if (pathOf(key) === pathOf(href)) return Promise.resolve(res);
        }
      }
      return Promise.resolve(undefined);
    },
  });

  const cachesApi = {
    open: (name) => {
      if (!caches.has(name)) caches.set(name, new Map());
      return Promise.resolve(wrap(caches.get(name)));
    },
    keys: () => Promise.resolve([...caches.keys()]),
    delete: (name) => Promise.resolve(caches.delete(name)),
    match: (req, opts) => {
      const names = [...caches.keys()];
      const next = (i) => {
        if (i >= names.length) return Promise.resolve(undefined);
        return wrap(caches.get(names[i])).match(req, opts)
          .then(hit => hit || next(i + 1));
      };
      return next(0);
    },
  };

  const self = {
    addEventListener: (type, fn) => { (listeners[type] = listeners[type] || []).push(fn); },
    skipWaiting: () => {},
    clients: { claim: () => {} },
    location: { origin: ORIGIN },
    navigator: { onLine: !!network },
    registration: {},
  };

  const sandbox = {
    self, caches: cachesApi, fetch: fetchImpl, URL, console: { warn() {}, log() {}, debug() {} },
    Response: function FakeResponse(body, init) {
      return { body, status: (init && init.status) || 200, url: '' };
    },
    setTimeout, clearTimeout, Promise,
  };
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync('sw.js', 'utf8'), sandbox, { filename: 'sw.js' });

  const dispatch = (type, event) => {
    const fns = listeners[type] || [];
    assert.ok(fns.length, `sw.js n'écoute pas ${type}`);
    fns.forEach(fn => fn(event));
  };

  return {
    caches,
    install() {
      const waits = [];
      dispatch('install', { waitUntil: p => waits.push(p) });
      return Promise.all(waits);
    },
    /** @returns {Promise<{status:number, body:string}|null>} null = pas de respondWith */
    request(url, extra) {
      let responded = null;
      const request = Object.assign({ url: new URL(url, ORIGIN).href, method: 'GET', mode: 'no-cors' }, extra);
      dispatch('fetch', { request, respondWith: p => { responded = p; } });
      return responded ? Promise.resolve(responded) : Promise.resolve(null);
    },
  };
}

// Ce que sert vraiment le serveur statique au moment du boot en ligne.
const NETWORK = {};
[
  '/', '/index.html', '/manifest.json', '/version.json', '/edge-model.json', '/config.js',
  '/icons/juju-icon.svg', '/icons/icon-192-v3.png', '/icons/icon-512-v3.png', '/css/theme.css',
  '/js/dist/bundle-core.js', '/js/dist/bundle-components.js',
].forEach(p => { NETWORK[ORIGIN + p] = 'body:' + p; });
NETWORK[ORIGIN + '/js/dist/bundle-edge.js'] = 'var EdgeChatStream = 1;';

const CACHE_BUSTER = '?v=' + JSON.parse(fs.readFileSync('version.json', 'utf8')).cache;

async function bootOnlineThenOffline() {
  // 1) boot en ligne : le SW précache la liste ASSETS…
  const online = makeSW({ network: NETWORK });
  await online.install();
  // …et l'utilisateur n'ouvre PAS l'onglet Plus : bundle-edge?v=… n'est jamais demandé.
  const snapshot = online.caches;

  // 2) même cache, réseau coupé.
  const offline = makeSW({ network: null });
  offline.caches.clear();
  for (const [name, store] of snapshot) offline.caches.set(name, store);
  return offline;
}

(async () => {
  await test('précache : bundle-edge est bien stocké au boot, sans ouvrir Plus', async () => {
    const sw = await bootOnlineThenOffline();
    const stores = [...sw.caches.values()];
    assert.strictEqual(stores.length, 1, 'un seul cache attendu');
    assert.ok(stores[0].has(ORIGIN + '/js/dist/bundle-edge.js'), 'bundle-edge absent du précache');
  });

  await test('hors ligne : bundle-edge.js?v=<cache> est servi depuis le précache', async () => {
    const sw = await bootOnlineThenOffline();
    const res = await sw.request('/js/dist/bundle-edge.js' + CACHE_BUSTER);
    assert.ok(res, 'aucun respondWith pour bundle-edge');
    assert.strictEqual(res.status, 200,
      'bundle-edge répond ' + res.status + ' hors ligne : Léo / Bifrost / Local seraient vides');
    assert.ok(String(res.body).includes('EdgeChatStream'), 'ce n\'est pas bundle-edge qui est servi');
  });

  await test('hors ligne : un cache-buster différent (release passée) marche aussi', async () => {
    const sw = await bootOnlineThenOffline();
    const res = await sw.request('/js/dist/bundle-edge.js?v=999999');
    assert.strictEqual(res.status, 200, 'seule la version courante serait disponible hors ligne');
  });

  await test('hors ligne : le shell versionné (bundle-core, css) est servi', async () => {
    const sw = await bootOnlineThenOffline();
    for (const p of ['/js/dist/bundle-core.js', '/js/dist/bundle-components.js', '/css/theme.css']) {
      const res = await sw.request(p + CACHE_BUSTER);
      assert.strictEqual(res.status, 200, p + ' indisponible hors ligne');
    }
  });

  await test('hors ligne : une ressource jamais mise en cache reste un 503', async () => {
    const sw = await bootOnlineThenOffline();
    const res = await sw.request('/js/lib/wllama/index.min.js?v=1');
    assert.strictEqual(res.status, 503, 'un miss doit rester un miss, pas un faux 200');
  });

  await test('hors ligne : une navigation retombe sur /index.html', async () => {
    const sw = await bootOnlineThenOffline();
    const res = await sw.request('/#plus', { mode: 'navigate' });
    assert.strictEqual(res.status, 200);
  });

  await test('en ligne : le réseau gagne et alimente le cache sous l\'URL demandée', async () => {
    const sw = makeSW({ network: NETWORK });
    await sw.install();
    const res = await sw.request('/js/dist/bundle-edge.js' + CACHE_BUSTER);
    assert.strictEqual(res.status, 200);
    const store = [...sw.caches.values()][0];
    assert.ok(store.has(ORIGIN + '/js/dist/bundle-edge.js' + CACHE_BUSTER),
      'la réponse réseau n\'a pas été mise en cache');
  });

  await test('les assets de voyage gardent une correspondance exacte (mode dev sans cache)', async () => {
    // cacheFirst ne doit PAS ignorer la query : sinon le buster « Mode dev (pas de
    // cache images) » resservirait l'image en cache.
    const src = fs.readFileSync('sw.js', 'utf8');
    const body = src.slice(src.indexOf('function cacheFirst'), src.indexOf('function networkFirstShell'));
    assert.ok(!body.includes('ignoreSearch'), 'cacheFirst ne doit pas ignorer la query string');
    assert.ok(!body.includes('matchShell'), 'cacheFirst doit rester en correspondance exacte');
  });

  await test('les deux chemins hors ligne du handler passent par matchShell', async () => {
    const src = fs.readFileSync('sw.js', 'utf8');
    assert.ok(src.includes('matchShell(request)'), 'networkFirstShell n\'utilise pas matchShell');
    assert.ok(src.includes('matchShell(event.request)'), 'la branche hors ligne n\'utilise pas matchShell');
  });

  console.log(`\n  ${pass} passed\n`);
})();
