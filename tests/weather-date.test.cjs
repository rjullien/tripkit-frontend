/**
 * tests/weather-date.test.cjs — past dates keep today (not "indisponible")
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

process.chdir(path.join(__dirname, '..'));
eval(fs.readFileSync('js/components/weather.js', 'utf8'));

let pass = 0;
function test(name, fn) {
  try { fn(); console.log(`  ✅ ${name}`); pass++; }
  catch (e) { console.log(`  ❌ ${name}\n     ${e.message}`); process.exitCode = 1; }
}

function localISO(offsetDays) {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + offsetDays);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + day;
}

console.log('\n── Weather clampForecastDate ────────────────────────────');

test('aujourd\'hui n\'est pas traité comme passé', () => {
  const today = localISO(0);
  assert.strictEqual(Weather.clampForecastDate(today), today);
  assert.strictEqual(Weather.daysFromToday(today), 0);
});

test('une date dans le passé garde le jour en cours', () => {
  const today = localISO(0);
  assert.strictEqual(Weather.clampForecastDate(localISO(-1)), today);
  assert.strictEqual(Weather.clampForecastDate('2020-01-01'), today);
});

test('une date future n\'est pas ramenée à aujourd\'hui', () => {
  const future = localISO(3);
  assert.strictEqual(Weather.clampForecastDate(future), future);
});

test('vide → aujourd\'hui', () => {
  assert.strictEqual(Weather.clampForecastDate(''), localISO(0));
  assert.strictEqual(Weather.clampForecastDate(null), localISO(0));
});

console.log(`\n  ${pass} passed\n`);
