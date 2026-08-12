/**
 * tests/list-unit.test.js — Isolated unit tests for List + Store + Sync
 * Pure Node.js, no browser required. Tests the logic that's been buggy.
 */
const path = require('path');
const rootDir = path.join(__dirname, '..');
process.chdir(rootDir);
const fs = require('fs');
const assert = require('assert');

// ── Mock localStorage ────────────────────────────────────────────────────────
const storage = {};
global.localStorage = {
  getItem: (k) => storage[k] || null,
  setItem: (k, v) => { storage[k] = String(v); },
  removeItem: (k) => { delete storage[k]; },
  clear: () => { Object.keys(storage).forEach(k => delete storage[k]); }
};
global.window = { localStorage: global.localStorage };
Object.defineProperty(global, 'navigator', {
  value: { onLine: true },
  writable: true,
  configurable: true
});
global.AbortSignal = { timeout: () => ({}) };
global.fetch = async () => ({ ok: true, json: async () => ({}) });
global.document = { getElementById: () => null, querySelectorAll: () => [] };

// ── Load Store ───────────────────────────────────────────────────────────────
eval(fs.readFileSync('js/store.js', 'utf8'));

// ── Test helpers ─────────────────────────────────────────────────────────────
let passed = 0, failed = 0;
function test(name, fn) {
  localStorage.clear();
  try {
    fn();
    passed++;
    console.log(`  ✅ ${name}`);
  } catch (e) {
    failed++;
    console.log(`  ❌ ${name}: ${e.message}`);
  }
}

console.log('\n══════ Store: toggleCheck ══════');

test('toggle check creates entry with checked=true', () => {
  Store.toggleCheck('list1', 'item1');
  const checks = Store.getChecks('list1');
  assert.strictEqual(checks['item1'].checked, true);
  assert(checks['item1'].updatedAt > 0);
});

test('double toggle returns to checked=false', () => {
  Store.toggleCheck('list1', 'item1');
  Store.toggleCheck('list1', 'item1');
  const checks = Store.getChecks('list1');
  assert.strictEqual(checks['item1'].checked, false);
});

test('toggle different items independently', () => {
  Store.toggleCheck('list1', 'a');
  Store.toggleCheck('list1', 'b');
  const checks = Store.getChecks('list1');
  assert.strictEqual(checks['a'].checked, true);
  assert.strictEqual(checks['b'].checked, true);
});

console.log('\n══════ Store: setCheck (sync merge) ══════');

test('setCheck respects timestamp (newer wins)', () => {
  Store.toggleCheck('list1', 'item1'); // checked=true, ts=now
  const ts = Store.getChecks('list1')['item1'].updatedAt;
  
  // Server tries to set false with OLDER timestamp → ignored
  Store.setCheck('list1', 'item1', false, ts - 1000);
  assert.strictEqual(Store.getChecks('list1')['item1'].checked, true);
  
  // Server tries to set false with NEWER timestamp → accepted... unless grace period
  Store.setCheck('list1', 'item1', false, ts + 100000);
  // BUT grace period (10s) protects it since we just checked it
  // The check was done < 10s ago → should be protected
  assert.strictEqual(Store.getChecks('list1')['item1'].checked, true);
});

test('setCheck grace period: allows server uncheck after 10s', () => {
  // Simulate old check (>10s ago)
  const oldTs = Date.now() - 15000;
  const checks = Store.getChecks('list1');
  checks['old-item'] = { checked: true, updatedAt: oldTs };
  localStorage.setItem('list1-checks', JSON.stringify(checks));
  
  // Server can now uncheck it (old enough)
  Store.setCheck('list1', 'old-item', false, oldTs + 1);
  assert.strictEqual(Store.getChecks('list1')['old-item'].checked, false);
});

test('setCheck: server cannot uncheck item checked <10s ago', () => {
  Store.toggleCheck('list1', 'fresh');
  const ts = Store.getChecks('list1')['fresh'].updatedAt;
  
  // Even with a future timestamp, can't uncheck within 10s
  Store.setCheck('list1', 'fresh', false, ts + 50000);
  assert.strictEqual(Store.getChecks('list1')['fresh'].checked, true);
});

test('setCheck: equal timestamp → checked wins', () => {
  Store.setCheck('list1', 'tie', false, 9000);
  Store.setCheck('list1', 'tie', true, 9000);
  assert.strictEqual(Store.getChecks('list1')['tie'].checked, true);
  Store.setCheck('list1', 'tie', false, 9000);
  assert.strictEqual(Store.getChecks('list1')['tie'].checked, true);
});

console.log('\n══════ Store: Custom Items ══════');

test('addCustomItem is shared on avant-de-partir (todo)', () => {
  const id = Store.addCustomItem('avant-de-partir-test', 0, 'Test item');
  const items = Store.getCustomItems('avant-de-partir-test');
  assert(items[id]);
  assert.strictEqual(items[id].shared, true);
  assert.strictEqual(Store.isListShared('avant-de-partir-test'), true);
});

test('addCustomItem is local on packing / valise', () => {
  Store.rememberListType('valise-test', 'packing');
  const id = Store.addCustomItem('valise-test', 0, 'Chaussettes');
  assert.strictEqual(Store.isListShared('valise-test'), false);
  assert.strictEqual(Store.getCustomItems('valise-test')[id].shared, false);
});

test('an item stays local only when locked with 🔒', () => {
  const id = Store.addCustomItem('avant-de-partir-test', 0, 'Private note');
  Store.toggleShareItem('avant-de-partir-test', id);
  assert.strictEqual(Store.getCustomItems('avant-de-partir-test')[id].shared, false);
});

test('turning a packing list to Oui promotes local items', () => {
  Store.rememberListType('valise-test', 'packing');
  const id = Store.addCustomItem('valise-test', 0, 'Note');
  assert.strictEqual(Store.getCustomItems('valise-test')[id].shared, false);
  Store.setListShared('valise-test', true);
  assert.strictEqual(Store.isListShared('valise-test'), true);
  assert.strictEqual(Store.getCustomItems('valise-test')[id].shared, true);
});

test('deleteCustomItem removes item', () => {
  const id = Store.addCustomItem('list1', 0, 'To delete');
  Store.deleteCustomItem('list1', id);
  const items = Store.getCustomItems('list1');
  assert(!items[id]);
});

test('custom item persists after multiple adds', () => {
  const id1 = Store.addCustomItem('list1', 0, 'First');
  const id2 = Store.addCustomItem('list1', 1, 'Second');
  const id3 = Store.addCustomItem('list1', 0, 'Third');
  const items = Store.getCustomItems('list1');
  assert.strictEqual(Object.keys(items).length, 3);
  assert.strictEqual(items[id1].text, 'First');
  assert.strictEqual(items[id2].text, 'Second');
  assert.strictEqual(items[id3].text, 'Third');
});

console.log('\n══════ Store: Hidden Items ══════');

test('hideItem adds to hidden set', () => {
  Store.hideItem('list1', 'item-x');
  const hidden = Store.getHidden('list1');
  assert(hidden.has('item-x'));
});

test('restoreItem removes from hidden set', () => {
  Store.hideItem('list1', 'item-x');
  Store.restoreItem('list1', 'item-x');
  const hidden = Store.getHidden('list1');
  assert(!hidden.has('item-x'));
});

test('multiple hides accumulate', () => {
  Store.hideItem('list1', 'a');
  Store.hideItem('list1', 'b');
  Store.hideItem('list1', 'c');
  const hidden = Store.getHidden('list1');
  assert.strictEqual(hidden.size, 3);
});

console.log('\n══════ Concurrent operations ══════');

test('rapid check/uncheck/check maintains final state', () => {
  Store.toggleCheck('list1', 'rapid');
  Store.toggleCheck('list1', 'rapid');
  Store.toggleCheck('list1', 'rapid');
  assert.strictEqual(Store.getChecks('list1')['rapid'].checked, true);
});

test('add custom + check custom in sequence', () => {
  const id = Store.addCustomItem('list1', 2, 'Checkable custom');
  const checkId = 'custom-' + id;
  Store.toggleCheck('list1', checkId);
  
  const checks = Store.getChecks('list1');
  const items = Store.getCustomItems('list1');
  assert.strictEqual(checks[checkId].checked, true);
  assert(items[id]);
});

test('check item then sync server false → stays checked (grace period)', () => {
  Store.toggleCheck('list1', 'protected');
  const localTs = Store.getChecks('list1')['protected'].updatedAt;
  
  // Simulate server returning false with high timestamp (corrupted data)
  Store.setCheck('list1', 'protected', false, localTs + 999999);
  
  // Must stay checked (grace period)
  assert.strictEqual(Store.getChecks('list1')['protected'].checked, true);
});

// ── Summary ──────────────────────────────────────────────────────────────────
console.log(`\n══════════════════════════════════════`);
console.log(`  Results: ${passed} passed, ${failed} failed`);
console.log(`══════════════════════════════════════\n`);
process.exit(failed > 0 ? 1 : 0);
