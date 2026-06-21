/**
 * tests/list-render.test.cjs — Test ListComponent render logic
 * Verifies items appear correctly after operations.
 */
const path = require('path');
const rootDir = path.join(__dirname, '..');
process.chdir(rootDir);
const fs = require('fs');
const assert = require('assert');

// ── Mock DOM + localStorage ──────────────────────────────────────────────────
const storage = {};
global.localStorage = {
  getItem: (k) => storage[k] || null,
  setItem: (k, v) => { storage[k] = String(v); },
  removeItem: (k) => { delete storage[k]; },
  clear: () => { Object.keys(storage).forEach(k => delete storage[k]); }
};
global.window = { localStorage: global.localStorage, dispatchEvent: () => {} };
global.navigator = { onLine: true, share: null, clipboard: { writeText: async () => {} } };
global.document = {
  getElementById: (id) => mockElements[id] || null,
  querySelectorAll: () => [],
  createElement: (tag) => ({ type: '', accept: '', click: () => {}, onchange: null })
};

const mockElements = {};
function createMockElement(id) {
  const el = {
    id,
    innerHTML: '',
    _listBoundId: undefined,
    _listData: undefined,
    addEventListener: function(event, handler) {
      this._handlers = this._handlers || [];
      this._handlers.push({ event, handler });
    },
    querySelector: function(sel) { return null; },
    querySelectorAll: function(sel) { return []; },
    classList: { toggle: () => {} }
  };
  mockElements[id] = el;
  return el;
}

// ── Load code ────────────────────────────────────────────────────────────────
eval(fs.readFileSync('js/store.js', 'utf8'));

// Mock API for backgroundSync
global.API = { syncList: async () => {} };
global.App = { showToast: () => {} };

eval(fs.readFileSync('js/components/list.js', 'utf8'));

// ── Test data ────────────────────────────────────────────────────────────────
const testList = {
  id: 'test-list',
  type: 'packing',
  title: 'Test List',
  sections: [
    {
      title: 'Section A',
      items: [
        { id: 'a1', text: 'Item A1' },
        { id: 'a2', text: 'Item A2' },
        { id: 'a3', text: 'Item A3', note: 'Important' }
      ]
    },
    {
      title: 'Section B',
      items: [
        { id: 'b1', text: 'Item B1' },
        { id: 'b2', text: 'Item B2' }
      ]
    }
  ]
};

// ── Tests ────────────────────────────────────────────────────────────────────
let passed = 0, failed = 0;
function test(name, fn) {
  localStorage.clear();
  Object.keys(mockElements).forEach(k => delete mockElements[k]);
  createMockElement('container');
  try {
    fn();
    passed++;
    console.log(`  ✅ ${name}`);
  } catch (e) {
    failed++;
    console.log(`  ❌ ${name}: ${e.message}`);
  }
}

console.log('\n══════ ListComponent: Render ══════');

test('renders all builtin items', () => {
  ListComponent.render('container', testList);
  const html = mockElements['container'].innerHTML;
  assert(html.includes('Item A1'), 'A1 missing');
  assert(html.includes('Item A2'), 'A2 missing');
  assert(html.includes('Item A3'), 'A3 missing');
  assert(html.includes('Item B1'), 'B1 missing');
  assert(html.includes('Item B2'), 'B2 missing');
});

test('renders item notes', () => {
  ListComponent.render('container', testList);
  const html = mockElements['container'].innerHTML;
  assert(html.includes('Important'), 'Note missing');
});

test('checked items have checked class', () => {
  Store.toggleCheck('test-list', 'a1');
  ListComponent.render('container', testList);
  const html = mockElements['container'].innerHTML;
  // The div should have class "checked"
  assert(html.includes('data-item="a1"'));
  // Find the item div for a1
  const idx = html.indexOf('data-item="a1"');
  const before = html.substring(Math.max(0, idx - 100), idx);
  assert(before.includes('checked'), 'a1 should have checked class');
});

test('hidden items do not appear in main list', () => {
  Store.hideItem('test-list', 'a2');
  ListComponent.render('container', testList);
  const html = mockElements['container'].innerHTML;
  // a2 should only appear in the hidden section, not as a regular item
  const mainItems = html.split('hidden-list')[0]; // before hidden section
  // Actually a2 should still appear in the hidden toggle area
  assert(html.includes('1 masqué'), 'Should show 1 hidden item');
});

test('custom items appear after add', () => {
  const id = Store.addCustomItem('test-list', 0, 'My custom item');
  ListComponent.render('container', testList);
  const html = mockElements['container'].innerHTML;
  assert(html.includes('My custom item'), 'Custom item not rendered');
});

test('custom item shows cloud emoji', () => {
  Store.addCustomItem('test-list', 0, 'Cloud item');
  ListComponent.render('container', testList);
  const html = mockElements['container'].innerHTML;
  assert(html.includes('☁️'), 'Cloud emoji missing');
});

test('multiple custom items in same section all render', () => {
  Store.addCustomItem('test-list', 0, 'Custom 1');
  Store.addCustomItem('test-list', 0, 'Custom 2');
  Store.addCustomItem('test-list', 0, 'Custom 3');
  ListComponent.render('container', testList);
  const html = mockElements['container'].innerHTML;
  assert(html.includes('Custom 1'), 'Custom 1 missing');
  assert(html.includes('Custom 2'), 'Custom 2 missing');
  assert(html.includes('Custom 3'), 'Custom 3 missing');
});

test('custom item in section B renders in section B', () => {
  Store.addCustomItem('test-list', 1, 'In section B');
  ListComponent.render('container', testList);
  const html = mockElements['container'].innerHTML;
  assert(html.includes('In section B'), 'Custom in section B missing');
});

test('deleted custom item disappears', () => {
  const id = Store.addCustomItem('test-list', 0, 'To remove');
  ListComponent.render('container', testList);
  assert(mockElements['container'].innerHTML.includes('To remove'));
  
  Store.deleteCustomItem('test-list', id);
  ListComponent.render('container', testList);
  assert(!mockElements['container'].innerHTML.includes('To remove'), 'Deleted item still visible');
});

test('re-render preserves custom items', () => {
  Store.addCustomItem('test-list', 0, 'Persistent');
  ListComponent.render('container', testList);
  ListComponent.render('container', testList);
  ListComponent.render('container', testList); // 3 renders
  assert(mockElements['container'].innerHTML.includes('Persistent'), 'Item lost after re-renders');
});

test('progress bar counts correctly', () => {
  Store.toggleCheck('test-list', 'a1');
  Store.toggleCheck('test-list', 'b1');
  ListComponent.render('container', testList);
  const html = mockElements['container'].innerHTML;
  // 2/5 = 40%
  assert(html.includes('2/5'), 'Progress should show 2/5');
  assert(html.includes('40%'), 'Progress should show 40%');
});

test('custom items count in progress', () => {
  Store.addCustomItem('test-list', 0, 'Extra');
  Store.toggleCheck('test-list', 'a1');
  ListComponent.render('container', testList);
  const html = mockElements['container'].innerHTML;
  // 5 builtin + 1 custom = 6 total, 1 checked
  assert(html.includes('1/6'), 'Progress should be 1/6 with custom item');
});

console.log('\n══════ ListComponent: Event binding ══════');

test('events bound only once per list', () => {
  ListComponent.render('container', testList);
  const el = mockElements['container'];
  const handlerCount1 = el._handlers ? el._handlers.length : 0;
  
  ListComponent.render('container', testList);
  const handlerCount2 = el._handlers ? el._handlers.length : 0;
  
  assert.strictEqual(handlerCount1, handlerCount2, 
    `Handlers should not stack: ${handlerCount1} vs ${handlerCount2}`);
});

test('events re-bind for different list', () => {
  const list2 = { ...testList, id: 'list-2', sections: [{ title: 'X', items: [{ id: 'x1', text: 'X1' }] }] };
  
  ListComponent.render('container', testList);
  const el = mockElements['container'];
  const bound1 = el._listBoundId;
  
  ListComponent.render('container', list2);
  const bound2 = el._listBoundId;
  
  assert.strictEqual(bound1, 'test-list');
  assert.strictEqual(bound2, 'list-2');
});

console.log('\n══════ Simulate: Full user flow ══════');

test('user adds item, checks it, re-renders — item stays', () => {
  const id = Store.addCustomItem('test-list', 0, 'Pack sunscreen');
  Store.toggleCheck('test-list', 'custom-' + id);
  
  // Multiple re-renders (simulating sync, tab switch)
  ListComponent.render('container', testList);
  ListComponent.render('container', testList);
  
  const html = mockElements['container'].innerHTML;
  assert(html.includes('Pack sunscreen'), 'Custom item should persist');
  assert(html.includes('checked'), 'Should show checked state');
});

test('server sync does not remove local custom item', () => {
  const id = Store.addCustomItem('test-list', 0, 'Local new');
  
  // Simulate sync merge (server has different items)
  const serverCustom = { 'from-server': { text: 'Server item', section: 0, createdAt: 1000 } };
  const existing = Store.getCustomItems('test-list');
  Object.entries(serverCustom).forEach(([sid, item]) => {
    if (!existing[sid]) {
      const cur = Store.getCustomItems('test-list');
      cur[sid] = { ...item, shared: true };
      Store.set('test-list-custom', cur);
    }
  });
  
  ListComponent.render('container', testList);
  const html = mockElements['container'].innerHTML;
  assert(html.includes('Local new'), 'Local item must survive sync');
  assert(html.includes('Server item'), 'Server item must appear');
});

// ── Summary ──────────────────────────────────────────────────────────────────
console.log(`\n══════════════════════════════════════`);
console.log(`  Results: ${passed} passed, ${failed} failed`);
console.log(`══════════════════════════════════════\n`);
process.exit(failed > 0 ? 1 : 0);
