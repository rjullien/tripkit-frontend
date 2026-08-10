/**
 * tests/trip-registry.test.cjs — reconcile local tk-trips with BE list
 */
const path = require('path');
process.chdir(path.join(__dirname, '..'));
const fs = require('fs');
const assert = require('assert');

const storage = {};
global.localStorage = {
  getItem: (k) => (k in storage ? storage[k] : null),
  setItem: (k, v) => { storage[k] = String(v); },
  removeItem: (k) => { delete storage[k]; },
  clear: () => { Object.keys(storage).forEach(k => delete storage[k]); }
};
global.window = { localStorage: global.localStorage, dispatchEvent: () => {} };

eval(fs.readFileSync('js/store.js', 'utf8'));

function reset() {
  localStorage.clear();
}

let passed = 0;
let failed = 0;
function test(name, fn) {
  reset();
  try {
    fn();
    console.log('  ✅', name);
    passed++;
  } catch (e) {
    console.log('  ❌', name + ':', e.message);
    failed++;
  }
}

console.log('\n══════ Store.reconcileTripsFromServer ══════');

test('adds server trips missing locally', () => {
  Store.registerTrip('quebec-2026');
  const r = Store.reconcileTripsFromServer(['quebec-2026', 'balears-2026']);
  assert.deepStrictEqual(Store.getAllTripIds().sort(), ['balears-2026', 'quebec-2026']);
  assert.deepStrictEqual(r.removed, []);
  assert.ok(r.kept.includes('balears-2026'));
});

test('removes local orphans present after BE delete', () => {
  Store.registerTrip('quebec-2026');
  Store.registerTrip('gone-trip');
  Store.setTripData('gone-trip', { trip: { id: 'gone-trip', name: 'Gone' } });
  Store.set('gone-trip-data-version', 9);
  Store.setCurrentTripId('quebec-2026');

  const r = Store.reconcileTripsFromServer(['quebec-2026']);
  assert.deepStrictEqual(Store.getAllTripIds(), ['quebec-2026']);
  assert.deepStrictEqual(r.removed, ['gone-trip']);
  assert.strictEqual(Store.getTripData('gone-trip'), null);
  assert.strictEqual(Store.get('gone-trip-data-version'), null);
  assert.strictEqual(Store.getCurrentTripId(), 'quebec-2026');
});

test('empty BE list clears registry (authoritative)', () => {
  Store.registerTrip('a');
  Store.registerTrip('b');
  Store.setTripData('a', { trip: { id: 'a' } });
  Store.setCurrentTripId('a');

  const r = Store.reconcileTripsFromServer([]);
  assert.deepStrictEqual(Store.getAllTripIds(), []);
  assert.deepStrictEqual(r.removed.sort(), ['a', 'b']);
  assert.strictEqual(Store.getCurrentTripId(), null);
  assert.strictEqual(Store.getTripData('a'), null);
});

test('non-array (network failure) does not prune', () => {
  Store.registerTrip('quebec-2026');
  Store.setTripData('quebec-2026', { trip: { id: 'quebec-2026' } });
  const before = Store.getAllTripIds().slice();

  const r1 = Store.reconcileTripsFromServer(null);
  const r2 = Store.reconcileTripsFromServer(undefined);
  assert.deepStrictEqual(Store.getAllTripIds(), before);
  assert.deepStrictEqual(r1.removed, []);
  assert.deepStrictEqual(r2.removed, []);
  assert.ok(Store.getTripData('quebec-2026'));
});

test('current trip switched when removed from BE', () => {
  Store.registerTrip('gone');
  Store.registerTrip('keep');
  Store.setCurrentTripId('gone');
  Store.reconcileTripsFromServer(['keep']);
  assert.strictEqual(Store.getCurrentTripId(), 'keep');
  assert.deepStrictEqual(Store.getAllTripIds(), ['keep']);
});

console.log(`\n══════════════════════════════════════`);
console.log(`  Results: ${passed} passed, ${failed} failed`);
console.log(`══════════════════════════════════════\n`);
if (failed) process.exit(1);
