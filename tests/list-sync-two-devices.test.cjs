/**
 * tests/list-sync-two-devices.test.cjs
 *
 * Drives the shipped js/api.js + js/store.js from two isolated devices against
 * an HTTP stub of PATCH /lists/:id/sync. The stub is the other side of the
 * wire (store + LWW), not a copy of the frontend.
 */
const fs = require('fs');
const path = require('path');
const http = require('http');
const vm = require('vm');
const assert = require('assert');

const ROOT = path.join(__dirname, '..');

// ── Backend mock: same merge semantics as internal/handlers/handlers.go ──────
function startServer(state) {
  const server = http.createServer((req, res) => {
    const m = req.url.match(/^\/api\/trips\/([^/]+)\/lists\/([^/]+)\/sync$/);
    if (!m || req.method !== 'PATCH') {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end('{"error":"not found"}');
      return;
    }
    const listId = m[2];
    const list = state.lists[listId];
    if (!list) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end('{"error":"List not found"}');
      return;
    }
    if (list.owner && list.owner !== state.currentUser) {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end('{"error":"Cannot sync another user\'s personal list"}');
      return;
    }
    let raw = '';
    req.on('data', (c) => { raw += c; });
    req.on('end', () => {
      const body = JSON.parse(raw || '{}');
      if (!body.deviceId) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end('{"error":"deviceId is required"}');
        return;
      }
      for (const [id, inc] of Object.entries(body.checks || {})) {
        const cur = list.checks[id];
        if (!cur) list.checks[id] = { checked: !!inc.checked, updatedAt: inc.updatedAt || 0 };
        else if ((inc.updatedAt || 0) > cur.updatedAt) list.checks[id] = { checked: !!inc.checked, updatedAt: inc.updatedAt };
        else if ((inc.updatedAt || 0) === cur.updatedAt && inc.checked && !cur.checked) cur.checked = true;
      }
      for (const [id, inc] of Object.entries(body.custom || {})) {
        const createdAt = inc.createdAt || Date.now();
        if (list.tombs[id] != null) {
          if (list.tombs[id] >= createdAt) continue;
          delete list.tombs[id];
        }
        if (!list.custom[id]) list.custom[id] = { text: inc.text, section: inc.section, createdAt };
      }
      for (const [id, ts0] of Object.entries(body.deletedCustom || {})) {
        const ts = ts0 || Date.now();
        list.tombs[id] = Math.max(list.tombs[id] || 0, ts);
        if (list.custom[id] && list.custom[id].createdAt <= ts) {
          delete list.custom[id];
          delete list.checks['custom-' + id];
        }
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        merged: { checks: list.checks, custom: list.custom },
        hidden: [],
        conflicts: 0,
        serverSyncAt: Date.now(),
      }));
    });
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(server)));
}

function newList(owner) {
  return { owner: owner || '', checks: {}, custom: {}, tombs: {} };
}

// ── Device: real store.js + api.js on an isolated localStorage ───────────────
function makeDevice(base, tripId) {
  const mem = new Map();
  const ctx = {
    localStorage: {
      getItem: (k) => (mem.has(k) ? mem.get(k) : null),
      setItem: (k, v) => mem.set(k, String(v)),
      removeItem: (k) => mem.delete(k),
    },
    navigator: { onLine: true },
    fetch,
    AbortSignal,
    document: { querySelector: () => null },
    window: { location: { origin: base } },
    console: { warn() {}, debug() {}, log() {} },
    TRIPKIT_CONFIG: { apiUrl: base, apiPrefix: '/api' },
  };
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'js', 'store.js'), 'utf8'), ctx);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'js', 'api.js'), 'utf8'), ctx);
  ctx.Store.setCurrentTripId(tripId);
  return ctx;
}

let pass = 0;
const tests = [];
function test(name, fn) { tests.push([name, fn]); }

const TRIP = 'trip-test';
const L = 'avant-de-partir-test';

test('a check made by one device reaches the other', async (state, base) => {
  const rene = makeDevice(base, TRIP);
  const nicole = makeDevice(base, TRIP);
  rene.Store.toggleCheck(L, 'passeport');
  const push = await rene.API.syncList(TRIP, L, { mode: 'push' });
  assert.strictEqual(push.ok, true);
  await nicole.API.syncList(TRIP, L, { mode: 'pull' });
  assert.strictEqual(nicole.Store.getChecks(L).passeport.checked, true);
});

test('a custom item added by one device reaches the other', async (state, base) => {
  const rene = makeDevice(base, TRIP);
  const nicole = makeDevice(base, TRIP);
  const id = nicole.Store.addCustomItem(L, 0, 'Adaptateur');
  await nicole.API.syncList(TRIP, L, { mode: 'push' });
  await rene.API.syncList(TRIP, L, { mode: 'pull' });
  assert.ok(rene.Store.getCustomItems(L)[id], 'peer item missing');
});

test('a device left on the legacy « Liste partagée Non » still syncs', async (state, base) => {
  const rene = makeDevice(base, TRIP);
  const nicole = makeDevice(base, TRIP);
  nicole.Store.set(`${L}-list-shared`, false); // state left by versions < 2.31.4

  rene.Store.toggleCheck(L, 'visa');
  await rene.API.syncList(TRIP, L, { mode: 'push' });
  await nicole.API.syncList(TRIP, L, { mode: 'pull' });
  assert.strictEqual(nicole.Store.getChecks(L).visa.checked, true, 'peer check not applied');

  const id = nicole.Store.addCustomItem(L, 0, 'Chapeau');
  await nicole.API.syncList(TRIP, L, { mode: 'push' });
  await rene.API.syncList(TRIP, L, { mode: 'pull' });
  assert.ok(rene.Store.getCustomItems(L)[id], 'item from legacy-Non device not shared');

  nicole.Store.toggleCheck(L, 'visa');
  await nicole.API.syncList(TRIP, L, { mode: 'push' });
  assert.strictEqual(state.lists[L].checks.visa.checked, false, 'check never reached the server');
});

test('an item locked with 🔒 stays on its device', async (state, base) => {
  const rene = makeDevice(base, TRIP);
  const nicole = makeDevice(base, TRIP);
  const id = nicole.Store.addCustomItem(L, 0, 'Note perso');
  nicole.Store.toggleShareItem(L, id);
  await nicole.API.syncList(TRIP, L, { mode: 'push' });
  await rene.API.syncList(TRIP, L, { mode: 'pull' });
  assert.ok(!rene.Store.getCustomItems(L)[id], 'locked item leaked to the group');
});

test('a missing list reports 404 instead of failing silently', async (state, base) => {
  const dev = makeDevice(base, TRIP);
  const res = await dev.API.syncList(TRIP, 'ghost-list', { mode: 'push' });
  assert.strictEqual(res.ok, false);
  assert.strictEqual(res.status, 404);
  assert.match(dev.Store.getSyncState('ghost-list').message, /404/);
});

test("another user's personal list reports 403", async (state, base) => {
  state.lists['perso-list'] = newList('someone-else');
  const dev = makeDevice(base, TRIP);
  const res = await dev.API.syncList(TRIP, 'perso-list', { mode: 'push' });
  assert.strictEqual(res.status, 403);
  assert.strictEqual(dev.Store.getSyncState('perso-list').state, 'error');
});

test('offline is reported as offline and retried from the outbox', async (state, base) => {
  const dev = makeDevice(base, TRIP);
  dev.navigator.onLine = false;
  dev.Store.toggleCheck(L, 'billets');
  const off = await dev.API.syncList(TRIP, L, { mode: 'push' });
  assert.strictEqual(off.ok, false);
  assert.strictEqual(dev.Store.getSyncState(L).state, 'offline');
  dev.navigator.onLine = true;
  await dev.API.syncList(TRIP, L, { mode: 'push' });
  assert.strictEqual(state.lists[L].checks.billets.checked, true);
  assert.strictEqual(dev.Store.getSyncState(L).state, 'ok');
});

test('a successful sync clears a previous error state', async (state, base) => {
  const dev = makeDevice(base, TRIP);
  dev.Store.setSyncState(L, { state: 'error', at: Date.now(), status: 500, message: 'Erreur serveur 500' });
  await dev.API.syncList(TRIP, L, { mode: 'pull' });
  assert.strictEqual(dev.Store.getSyncState(L).state, 'ok');
});

test('deleting an item on one device removes it on the other', async (state, base) => {
  const rene = makeDevice(base, TRIP);
  const nicole = makeDevice(base, TRIP);
  const id = rene.Store.addCustomItem(L, 0, 'Powerbank');
  await rene.API.syncList(TRIP, L, { mode: 'push' });
  await nicole.API.syncList(TRIP, L, { mode: 'pull' });
  assert.ok(nicole.Store.getCustomItems(L)[id]);
  rene.Store.deleteCustomItem(L, id);
  await rene.API.syncList(TRIP, L, { mode: 'push' });
  await nicole.API.syncList(TRIP, L, { mode: 'pull' });
  assert.ok(!nicole.Store.getCustomItems(L)[id], 'deleted item still on peer');
});

test('unshare then reshare an item via 🔒 / ☁️', async (state, base) => {
  const rene = makeDevice(base, TRIP);
  const nicole = makeDevice(base, TRIP);
  const id = rene.Store.addCustomItem(L, 0, 'Jumelles');
  await rene.API.syncList(TRIP, L, { mode: 'push' });
  await nicole.API.syncList(TRIP, L, { mode: 'pull' });
  rene.Store.toggleShareItem(L, id); // 🔒
  await rene.API.syncList(TRIP, L, { mode: 'push' });
  await nicole.API.syncList(TRIP, L, { mode: 'pull' });
  assert.ok(!nicole.Store.getCustomItems(L)[id], 'unshared item still on peer');
  rene.Store.toggleShareItem(L, id); // ☁️
  await rene.API.syncList(TRIP, L, { mode: 'push' });
  await nicole.API.syncList(TRIP, L, { mode: 'pull' });
  assert.ok(nicole.Store.getCustomItems(L)[id], 'reshared item missing on peer');
});

test('a pull applies the server check even if local timestamp is in the future', async (state, base) => {
  const rene = makeDevice(base, TRIP);
  const nicole = makeDevice(base, TRIP);
  rene.Store.toggleCheck(L, 'galets');
  await rene.API.syncList(TRIP, L, { mode: 'push' });
  nicole.Store.set(`${L}-checks`, { galets: { checked: false, updatedAt: 9999999999999 } });
  const pull = await nicole.API.syncList(TRIP, L, { mode: 'pull' });
  assert.strictEqual(pull.ok, true);
  assert.strictEqual(nicole.Store.getChecks(L).galets.checked, true, 'stale local ts blocked the peer tick');
  await nicole.API.syncList(TRIP, L, { mode: 'push' });
  assert.strictEqual(state.lists[L].checks.galets.checked, true, 'non-dirty push wiped the server');
});

(async () => {
  console.log('\n── List sync, two devices, real api.js ────────────────────');
  for (const [name, fn] of tests) {
    const state = { currentUser: 'rene', lists: { [L]: newList() } };
    const server = await startServer(state);
    const base = `http://127.0.0.1:${server.address().port}`;
    try {
      await fn(state, base);
      console.log(`  ✅ ${name}`);
      pass++;
    } catch (e) {
      console.log(`  ❌ ${name}\n     ${e.message}`);
      process.exitCode = 1;
    } finally {
      server.close();
    }
  }
  console.log(`\n${pass}/${tests.length} tests passed\n`);
})();
