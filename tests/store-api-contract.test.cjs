/**
 * tests/store-api-contract.test.cjs
 *
 * Every `Store.x(` / `API.x(` call in js/ must exist on the module it targets.
 * Removing Store.isListShared once left a live call in app.js renderPlus, which
 * threw and blanked the whole Plus tab — no test caught it because the unit
 * tests never render that tab.
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT = path.join(__dirname, '..');
const JS_DIR = path.join(ROOT, 'js');

function loadModule(file, globals) {
  const src = fs.readFileSync(path.join(ROOT, file), 'utf8');
  const names = Object.keys(globals);
  const fn = new Function(...names, src + `\nreturn ${path.basename(file, '.js') === 'store' ? 'Store' : 'API'};`);
  return fn(...names.map((n) => globals[n]));
}

function memLocalStorage() {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
  };
}

const Store = loadModule('js/store.js', { localStorage: memLocalStorage(), console });
const API = loadModule('js/api.js', {
  localStorage: memLocalStorage(),
  console,
  navigator: { onLine: true },
  document: { querySelector: () => null },
  window: { location: { origin: 'http://x' } },
  Store,
  fetch: () => Promise.reject(new Error('no network in contract test')),
  AbortSignal,
});

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'lib') continue; // vendored bundles
      out.push(...walk(full));
    } else if (entry.name.endsWith('.js')) {
      out.push(full);
    }
  }
  return out;
}

const MODULES = { Store, API };
let pass = 0;
let calls = 0;

console.log('\n── Store / API call contract ──────────────────────────────');

for (const [name, mod] of Object.entries(MODULES)) {
  const missing = [];
  const re = new RegExp(`\\b${name}\\.([A-Za-z_$][\\w$]*)\\s*\\(`, 'g');
  for (const file of walk(JS_DIR)) {
    const src = fs.readFileSync(file, 'utf8');
    let m;
    while ((m = re.exec(src)) !== null) {
      calls++;
      const method = m[1];
      if (typeof mod[method] !== 'function') {
        missing.push(`${path.relative(ROOT, file)} → ${name}.${method}()`);
      }
    }
  }
  try {
    assert.deepStrictEqual(missing, [], `${name} calls with no implementation:\n     ` + missing.join('\n     '));
    console.log(`  ✅ every ${name}.x() call resolves`);
    pass++;
  } catch (e) {
    console.log(`  ❌ ${e.message}`);
    process.exitCode = 1;
  }
}

console.log(`\n${pass}/2 checks passed (${calls} call sites)\n`);

console.log('── Safari stream error copy ────────────────────────────────');
try {
  assert.strictEqual(typeof API.netFailMessage, 'function');
  assert.strictEqual(API.netFailMessage({ message: 'Load failed' }, false), 'Connexion interrompue — réessaie.');
  assert.strictEqual(API.netFailMessage({ message: 'Failed to fetch' }, false), 'Connexion interrompue — réessaie.');
  assert.strictEqual(API.netFailMessage({ message: 'Load failed' }, true), 'Annulé.');
  assert.strictEqual(API.netFailMessage({ message: 'Hermes injoignable. Réessaie plus tard.' }, false), 'Hermes injoignable. Réessaie plus tard.');
  console.log('  ✅ netFailMessage maps Safari Load failed\n');
} catch (e) {
  console.log(`  ❌ ${e.message}\n`);
  process.exitCode = 1;
}
