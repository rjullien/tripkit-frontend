// Spec listes : items partagés, coches selon Liste partagée Oui/Non.
const fs = require('fs');
let _clock = 1700000000000; Date.now = () => (_clock += 1000);
const assert = require('assert');

const storeSrc = fs.readFileSync(require('path').join(__dirname, '..', 'js', 'store.js'), 'utf8');
function makeLS() {
  const m = new Map();
  return { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k) };
}
function makeDevice(name) {
  const ls = makeLS();
  const Store = new Function('localStorage', 'console', storeSrc + '\nreturn Store;')(ls, console);
  return { name, ls, Store };
}

// Backend mock : custom + tombstones + checks (LWW, checked wins on tie)
function makeBackend() {
  const items = {};
  const tombs = {};
  const checks = {}; // id -> {checked, updatedAt}
  return {
    sync(body) {
      for (const [id, it] of Object.entries(body.custom || {})) {
        const createdAt = it.createdAt || Date.now();
        if (tombs[id] != null) {
          if (tombs[id] >= createdAt) continue;
          delete tombs[id];
        }
        if (!items[id]) items[id] = { text: it.text, section: it.section, createdAt };
      }
      for (const [id, ts0] of Object.entries(body.deletedCustom || {})) {
        const ts = ts0 || Date.now();
        tombs[id] = Math.max(tombs[id] || 0, ts);
        if (items[id] && items[id].createdAt <= ts) delete items[id];
      }
      for (const [id, incoming] of Object.entries(body.checks || {})) {
        const cur = checks[id];
        if (!cur) {
          checks[id] = { checked: !!incoming.checked, updatedAt: incoming.updatedAt || 0 };
        } else if ((incoming.updatedAt || 0) > cur.updatedAt) {
          checks[id] = { checked: !!incoming.checked, updatedAt: incoming.updatedAt };
        } else if ((incoming.updatedAt || 0) === cur.updatedAt && incoming.checked && !cur.checked) {
          checks[id] = { checked: true, updatedAt: cur.updatedAt };
        }
      }
      return {
        merged: {
          custom: JSON.parse(JSON.stringify(items)),
          checks: JSON.parse(JSON.stringify(checks)),
        },
        serverSyncAt: Date.now(),
      };
    },
  };
}

/** Miroir de api.js syncList (checks dirty-only en push ; vides en pull). */
function syncList(dev, listId, backend, opts) {
  const mode = (opts && opts.mode) === 'pull' ? 'pull' : 'push';
  const listShared = dev.Store.isListShared(listId);
  const deletedCustom = dev.Store.getCustomDeleted(listId);
  const all = dev.Store.getCustomItems(listId);
  const sharedCustom = {};
  for (const [id, it] of Object.entries(all)) {
    if (it.shared) sharedCustom[id] = { text: it.text, section: it.section, createdAt: it.createdAt };
  }
  let checksPayload = {};
  let dirtyIds = [];
  if (listShared && mode === 'push') {
    dirtyIds = typeof dev.Store.getDirtyCheckIds === 'function'
      ? dev.Store.getDirtyCheckIds(listId)
      : Object.keys(dev.Store.getChecks(listId));
    checksPayload = typeof dev.Store.getDirtyChecks === 'function'
      ? dev.Store.getDirtyChecks(listId)
      : dev.Store.getChecks(listId);
  }
  const body = {
    deviceId: dev.Store.getDeviceId(),
    custom: sharedCustom,
    deletedCustom,
    checks: checksPayload,
  };
  assert.ok(!('hidden' in body), 'hidden ne doit pas partir');
  if (!listShared) assert.deepEqual(body.checks, {}, 'liste Non → checks vides');
  if (mode === 'pull') assert.deepEqual(body.checks, {}, 'pull → checks vides');

  const result = backend.sync(body);
  if (!result || !result.merged) return body;

  const serverShared = result.merged.custom || {};
  const tomb = dev.Store.getCustomDeleted(listId);
  const cur = dev.Store.getCustomItems(listId);
  let changed = false;
  for (const [id, it] of Object.entries(serverShared)) {
    if (!cur[id] && !tomb[id]) { cur[id] = { ...it, shared: true }; changed = true; }
  }
  for (const [id, it] of Object.entries(cur)) {
    if (it.shared && !serverShared[id]) { delete cur[id]; changed = true; }
  }
  if (changed) dev.Store.set(`${listId}-custom`, cur);

  if (listShared && result.merged.checks) {
    if (typeof dev.Store.applyRemoteChecks === 'function') {
      dev.Store.applyRemoteChecks(listId, result.merged.checks);
    } else {
      for (const [id, it] of Object.entries(result.merged.checks)) {
        dev.Store.setCheck(listId, id, !!it.checked, it.updatedAt || 0);
      }
    }
  }
  if (listShared && mode === 'push' && dirtyIds.length && typeof dev.Store.clearDirtyChecks === 'function') {
    dev.Store.clearDirtyChecks(listId, dirtyIds);
  }
  return body;
}

const L = 'avant-de-partir-test';
let pass = 0;
const ok = (msg) => { console.log('  ✅', msg); pass++; };

// 1) Liste Non → coches locales
{
  const be = makeBackend();
  const alice = makeDevice('alice'); const bob = makeDevice('bob');
  alice.Store.setListShared(L, false);
  bob.Store.setListShared(L, false);
  alice.Store.toggleCheck(L, 'div-1');
  const body = syncList(alice, L, be);
  assert.deepEqual(body.checks, {});
  syncList(bob, L, be);
  assert.deepEqual(bob.Store.getChecks(L), {}, 'Bob ne reçoit pas les coches (liste Non)');
  ok('liste Non: coches locales, jamais transmises');
}

// 2) Liste Oui → coches partagées (LWW)
{
  const be = makeBackend();
  const alice = makeDevice('alice'); const bob = makeDevice('bob');
  alice.Store.toggleCheck(L, 'frigo'); // true
  syncList(alice, L, be);
  syncList(bob, L, be);
  assert.equal(bob.Store.getChecks(L)['frigo'].checked, true, 'Bob reçoit la coche');
  bob.Store.toggleCheck(L, 'frigo'); // false, ts plus récent
  syncList(bob, L, be);
  // Hors grâce 10s : la coche locale d’Alice est « vieille »
  const aged = alice.Store.getChecks(L);
  aged.frigo = { checked: true, updatedAt: Date.now() - 20000 };
  alice.Store.set(`${L}-checks`, aged);
  syncList(alice, L, be);
  assert.equal(alice.Store.getChecks(L)['frigo'].checked, false, 'Alice reçoit le uncheck plus récent');
  ok('liste Oui: coches partagées, updatedAt gagne');
}

// 3) Tie-break : coché gagne
{
  const alice = makeDevice('alice');
  alice.Store.setCheck(L, 'bag', false, 5000);
  alice.Store.setCheck(L, 'bag', true, 5000); // même ts, checked
  assert.equal(alice.Store.getChecks(L)['bag'].checked, true);
  alice.Store.setCheck(L, 'bag', false, 5000); // tie uncheck → keep checked
  assert.equal(alice.Store.getChecks(L)['bag'].checked, true, 'à ts égal coché gagne');
  ok('tie-break local: coché > non coché');
}

// 4) Item liste Non reste invisible
{
  const be = makeBackend();
  const alice = makeDevice('alice'); const bob = makeDevice('bob');
  alice.Store.setListShared(L, false);
  const id = alice.Store.addCustomItem(L, 0, 'Note perso');
  syncList(alice, L, be);
  syncList(bob, L, be);
  assert.equal(bob.Store.getCustomItems(L)[id], undefined);
  ok('liste Non: item local invisible');
}

// 5) Liste Oui → item + coche partagés
{
  const be = makeBackend();
  const alice = makeDevice('alice'); const bob = makeDevice('bob');
  const id = alice.Store.addCustomItem(L, 0, 'Crème');
  alice.Store.toggleCheck(L, 'custom-' + id);
  syncList(alice, L, be);
  syncList(bob, L, be);
  assert.ok(bob.Store.getCustomItems(L)[id]);
  assert.equal(bob.Store.getChecks(L)['custom-' + id].checked, true);
  ok('liste Oui: item + coche visibles chez Bob');
}

// 6) Suppression item
{
  const be = makeBackend();
  const alice = makeDevice('alice'); const bob = makeDevice('bob');
  const id = alice.Store.addCustomItem(L, 0, 'Powerbank');
  syncList(alice, L, be); syncList(bob, L, be);
  alice.Store.deleteCustomItem(L, id); syncList(alice, L, be);
  syncList(bob, L, be);
  assert.equal(bob.Store.getCustomItems(L)[id], undefined);
  ok('suppression propagée');
}

// 7) Unshare / re-share item
{
  const be = makeBackend();
  const alice = makeDevice('alice'); const bob = makeDevice('bob');
  const id = alice.Store.addCustomItem(L, 0, 'Jumelles');
  syncList(alice, L, be); syncList(bob, L, be);
  alice.Store.toggleShareItem(L, id); syncList(alice, L, be);
  syncList(bob, L, be);
  assert.equal(bob.Store.getCustomItems(L)[id], undefined);
  alice.Store.toggleShareItem(L, id); syncList(alice, L, be);
  syncList(bob, L, be);
  assert.ok(bob.Store.getCustomItems(L)[id]);
  ok('retrait/re-partage item');
}

// 8) Toggle liste Oui promeut items
{
  const be = makeBackend();
  const alice = makeDevice('alice'); const bob = makeDevice('bob');
  alice.Store.setListShared(L, false);
  const id = alice.Store.addCustomItem(L, 0, 'Note');
  alice.Store.setListShared(L, true);
  assert.equal(alice.Store.getCustomItems(L)[id].shared, true);
  syncList(alice, L, be); syncList(bob, L, be);
  assert.ok(bob.Store.getCustomItems(L)[id]);
  ok('toggle Oui promeut items locaux');
}

// 9) Pull force : ts local périmé/futur n’empêche plus de voir la coche du peer
{
  const be = makeBackend();
  const alice = makeDevice('alice'); const bob = makeDevice('bob');
  alice.Store.toggleCheck(L, 'galets'); // true + dirty
  syncList(alice, L, be, { mode: 'push' });
  // Bob a un faux uncheck local avec ts farfelu (ex. ancien bug / diag) — pas dirty
  bob.Store.set(`${L}-checks`, { galets: { checked: false, updatedAt: 9999999999999 } });
  const pullBody = syncList(bob, L, be, { mode: 'pull' });
  assert.deepEqual(pullBody.checks, {}, 'pull n’envoie aucune coche');
  assert.equal(bob.Store.getChecks(L).galets.checked, true, 'Bob voit la coche d’Alice malgré ts local futur');
  // Un second push de Bob sans dirty ne doit pas écraser le serveur
  const pushBody = syncList(bob, L, be, { mode: 'push' });
  assert.deepEqual(pushBody.checks, {}, 'sans dirty → push checks vide');
  assert.equal(be.sync({ checks: {} }).merged.checks.galets.checked, true);
  ok('pull force + dirty-only: peer ticks survivent à un local stale');
}

console.log(`\n${pass}/9 scénarios OK — spec respectée.`);
