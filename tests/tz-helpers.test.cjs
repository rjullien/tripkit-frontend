/**
 * tests/tz-helpers.test.cjs — Local → home (Nice) conversion for timeline dual times
 */
const path = require('path');
const fs = require('fs');
const assert = require('assert');

process.chdir(path.join(__dirname, '..'));
eval(fs.readFileSync('js/tz-helpers.js', 'utf8'));

let pass = 0;
function test(name, fn) {
  try { fn(); console.log(`  ✅ ${name}`); pass++; }
  catch (e) { console.log(`  ❌ ${name}\n     ${e.message}`); process.exitCode = 1; }
}

console.log('\n── TzHelpers ──────────────────────────────────────────────');

test('YUL 20:40 America/Toronto → 02:40+1 Europe/Paris', () => {
  const r = TzHelpers.homeTimeLabel({
    t: '20:40',
    tz: 'America/Toronto',
    date: '2026-08-14',
    homeTz: 'Europe/Paris',
  });
  assert.ok(r, 'expected label');
  assert.strictEqual(r.hm, '02:40');
  assert.strictEqual(r.dayDelta, 1);
  assert.ok(r.text.includes('02:40+1'));
  assert.ok(r.text.includes('🇫🇷'));
});

test('same zone → no secondary', () => {
  const r = TzHelpers.homeTimeLabel({
    t: '09:10',
    tz: 'Europe/Paris',
    date: '2026-08-14',
    homeTz: 'Europe/Paris',
  });
  assert.strictEqual(r, null);
});

test('Zurich ≈ Paris summer → no secondary clutter', () => {
  const r = TzHelpers.homeTimeLabel({
    t: '12:40',
    tz: 'Europe/Zurich',
    date: '2026-08-14',
    homeTz: 'Europe/Paris',
  });
  assert.strictEqual(r, null);
});

test('YUL dep 19:50 → Nice 01:50+1', () => {
  const r = TzHelpers.homeTimeLabel({
    t: '19:50',
    tz: 'America/Toronto',
    date: '2026-09-01',
    homeTz: 'Europe/Paris',
  });
  assert.ok(r);
  assert.strictEqual(r.hm, '01:50');
  assert.strictEqual(r.dayDelta, 1);
});

test('non-clock t (emoji) → null', () => {
  const r = TzHelpers.homeTimeLabel({
    t: '☀️',
    tz: 'America/Toronto',
    date: '2026-08-14',
    homeTz: 'Europe/Paris',
  });
  assert.strictEqual(r, null);
});

test('homeTz() defaults to Europe/Paris', () => {
  assert.strictEqual(TzHelpers.homeTz({}), 'Europe/Paris');
  assert.strictEqual(TzHelpers.homeTz({ homeTz: 'America/Toronto' }), 'America/Toronto');
});

console.log(`\n  ${pass} passed\n`);
