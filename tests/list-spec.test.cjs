// Test d'isolation de la "partie liste" avec mocks.
// Charge le VRAI js/store.js (localStorage mocké) et rejoue la spec d’isolation :
//  - coche / masquage = LOCAL, jamais transmis
//  - item créé = LOCAL (shared:false), invisible des autres
//  - bouton ☁️ = publie l'ITEM (pas la coche) ; suppression/retrait se propagent
const fs = require('fs');
// horloge monotone : chaque action a un timestamp distinct (comme des taps réels espacés)
let _clock = 1700000000000; Date.now = () => (_clock += 1000);
const assert = require('assert');

const storeSrc = fs.readFileSync(require('path').join(__dirname, '..', 'js', 'store.js'), 'utf8');
function makeLS() {
  const m = new Map();
  return { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k), _dump: () => Object.fromEntries(m) };
}
function makeDevice(name) {
  const ls = makeLS();
  const Store = new Function('localStorage', 'console', storeSrc + '\nreturn Store;')(ls, console);
  return { name, ls, Store };
}

// ── Backend mock : reproduit la sémantique du serveur Go (custom + tombstones, AUCUNE coche) ──
function makeBackend() {
  const items = {};   // id -> {text, section, createdAt}
  const tombs = {};   // id -> deletedAt
  return {
    sync(body) {
      // 1) creates (respecte les tombstones)
      for (const [id, it] of Object.entries(body.custom || {})) {
        const createdAt = it.createdAt || Date.now();
        if (tombs[id] != null) {
          if (tombs[id] >= createdAt) continue;        // stale → reste supprimé
          delete tombs[id];                            // re-création légitime
        }
        if (!items[id]) items[id] = { text: it.text, section: it.section, createdAt };
      }
      // 2) deletions (tombstones)
      for (const [id, ts0] of Object.entries(body.deletedCustom || {})) {
        const ts = ts0 || Date.now();
        tombs[id] = Math.max(tombs[id] || 0, ts);
        if (items[id] && items[id].createdAt <= ts) delete items[id];
      }
      return { merged: { custom: JSON.parse(JSON.stringify(items)) }, serverSyncAt: Date.now() };
    }
  };
}

// ── Réplique fidèle de api.js syncList (publie le shared, réconcilie, jamais de coches) ──
function syncList(dev, listId, backend) {
  const deletedCustom = dev.Store.getCustomDeleted(listId);
  const all = dev.Store.getCustomItems(listId);
  const sharedCustom = {};
  for (const [id, it] of Object.entries(all)) if (it.shared) sharedCustom[id] = { text: it.text, section: it.section, createdAt: it.createdAt };
  const body = { deviceId: dev.Store.getDeviceId(), custom: sharedCustom, deletedCustom };
  // garde-fou de spec : le payload ne contient JAMAIS de coches ni de masquage
  assert.ok(!('checks' in body) && !('hidden' in body), 'le payload sync ne doit pas contenir checks/hidden');
  const result = backend.sync(body);
  if (!result || !result.merged) return body;
  const serverShared = result.merged.custom || {};
  const tomb = dev.Store.getCustomDeleted(listId);
  const cur = dev.Store.getCustomItems(listId);
  let changed = false;
  for (const [id, it] of Object.entries(serverShared)) if (!cur[id] && !tomb[id]) { cur[id] = { ...it, shared: true }; changed = true; }
  for (const [id, it] of Object.entries(cur)) if (it.shared && !serverShared[id]) { delete cur[id]; changed = true; }
  if (changed) dev.Store.set(`${listId}-custom`, cur);
  return body;
}

const L = 'checklist-malte';
let pass = 0;
const ok = (msg) => { console.log('  ✅', msg); pass++; };

// ===== Scénario 1 : coche locale, jamais transmise =====
{
  const be = makeBackend();
  const alice = makeDevice('alice'); const bob = makeDevice('bob');
  alice.Store.toggleCheck(L, 'div-1'); // prise UK
  alice.Store.toggleCheck(L, 'div-2');
  assert.equal(alice.Store.getChecks(L)['div-1'].checked, true);
  assert.equal(alice.Store.getChecks(L)['div-2'].checked, true, 'cocher un autre item ne décoche pas le premier');
  const body = syncList(alice, L, be);
  assert.deepEqual(body.custom, {}, 'aucun item à partager → payload vide');
  syncList(bob, L, be);
  assert.deepEqual(bob.Store.getChecks(L), {}, 'Bob ne reçoit AUCUNE coche d’Alice');
  ok('coche locale: persiste, et ne fuit jamais vers l’autre device');
}

// ===== Scénario 2 : liste Non → item créé reste local =====
{
  const be = makeBackend();
  const alice = makeDevice('alice'); const bob = makeDevice('bob');
  alice.Store.setListShared(L, false);
  const id = alice.Store.addCustomItem(L, 0, 'Adaptateur UK secours');
  assert.equal(alice.Store.getCustomItems(L)[id].shared, false, 'liste Non → créé en local');
  syncList(alice, L, be);
  syncList(bob, L, be);
  assert.equal(bob.Store.getCustomItems(L)[id], undefined, 'item non partagé → invisible chez Bob');
  ok('liste Non: item local, invisible des autres');
}

// ===== Scénario 2b : liste Oui (défaut) → item naît partagé =====
{
  const be = makeBackend();
  const alice = makeDevice('alice'); const bob = makeDevice('bob');
  assert.equal(alice.Store.isListShared(L), true, 'défaut liste partagée = Oui');
  const id = alice.Store.addCustomItem(L, 0, 'Crème solaire 50+');
  assert.equal(alice.Store.getCustomItems(L)[id].shared, true, 'liste Oui → shared:true à la création');
  syncList(alice, L, be);
  syncList(bob, L, be);
  assert.ok(bob.Store.getCustomItems(L)[id], 'Bob voit l’item sans toggle ☁️');
  ok('liste Oui: nouveaux items visibles par le groupe après sync');
}

// ===== Scénario 3 : partage item + coche personnelle =====
{
  const be = makeBackend();
  const alice = makeDevice('alice'); const bob = makeDevice('bob');
  const id = alice.Store.addCustomItem(L, 0, 'Chapeau');
  syncList(alice, L, be);
  syncList(bob, L, be);
  assert.ok(bob.Store.getCustomItems(L)[id], 'Bob voit l’item partagé');
  bob.Store.toggleCheck(L, 'custom-' + id);       // Bob coche chez lui
  syncList(bob, L, be);
  syncList(alice, L, be);
  assert.equal(alice.Store.getChecks(L)['custom-' + id], undefined, 'Alice ne récupère PAS la coche de Bob');
  assert.ok(alice.Store.getCustomItems(L)[id], 'l’item reste présent chez Alice');
  ok('partage: l’item voyage, la coche reste personnelle à chaque device');
}

// ===== Scénario 4+5 : suppression se propage et ne ressuscite pas =====
{
  const be = makeBackend();
  const alice = makeDevice('alice'); const bob = makeDevice('bob');
  const id = alice.Store.addCustomItem(L, 0, 'Powerbank');
  syncList(alice, L, be); syncList(bob, L, be);
  assert.ok(bob.Store.getCustomItems(L)[id], 'Bob a bien reçu l’item');
  alice.Store.deleteCustomItem(L, id); syncList(alice, L, be); // Alice supprime
  syncList(bob, L, be);                                   // Bob (encore l’item) resync
  assert.equal(bob.Store.getCustomItems(L)[id], undefined, 'suppression propagée chez Bob');
  syncList(bob, L, be);                                   // re-sync : pas de résurrection
  assert.equal(bob.Store.getCustomItems(L)[id], undefined, 'pas de résurrection');
  ok('suppression: se propage aux autres et ne ressuscite jamais');
}

// ===== Scénario 6+7 : retrait (unshare) puis re-partage =====
{
  const be = makeBackend();
  const alice = makeDevice('alice'); const bob = makeDevice('bob');
  const id = alice.Store.addCustomItem(L, 0, 'Jumelles');
  syncList(alice, L, be); syncList(bob, L, be);
  assert.ok(bob.Store.getCustomItems(L)[id], 'partagé puis reçu par Bob');
  alice.Store.toggleShareItem(L, id); syncList(alice, L, be);  // retrait
  assert.equal(alice.Store.getCustomItems(L)[id].shared, false, 'Alice garde l’item en local après retrait');
  syncList(bob, L, be);
  assert.equal(bob.Store.getCustomItems(L)[id], undefined, 'retrait propagé : Bob ne le voit plus');
  alice.Store.toggleShareItem(L, id); syncList(alice, L, be);  // re-partage
  syncList(bob, L, be);
  assert.ok(bob.Store.getCustomItems(L)[id], 're-partage fonctionne après un retrait');
  ok('retrait/re-partage: réversible et cohérent');
}

// ===== Scénario 8 : toggle liste Oui promeut les items locaux =====
{
  const be = makeBackend();
  const alice = makeDevice('alice'); const bob = makeDevice('bob');
  alice.Store.setListShared(L, false);
  const id = alice.Store.addCustomItem(L, 0, 'Note perso');
  assert.equal(alice.Store.getCustomItems(L)[id].shared, false);
  alice.Store.setListShared(L, true); // Oui → promote
  assert.equal(alice.Store.getCustomItems(L)[id].shared, true, 'toggle Oui promeut l’item local');
  syncList(alice, L, be);
  syncList(bob, L, be);
  assert.ok(bob.Store.getCustomItems(L)[id], 'Bob reçoit après promotion');
  ok('liste Oui: promeut les items locaux existants');
}

console.log(`\n${pass}/7 scénarios OK — spec respectée.`);
