/**
 * tests/timeline-links.test.cjs — safe timeline anchor rendering
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

process.chdir(path.join(__dirname, '..'));
eval(fs.readFileSync('js/components/timeline.js', 'utf8'));

let pass = 0;
function test(name, fn) {
  try { fn(); console.log(`  ✅ ${name}`); pass++; }
  catch (e) { console.log(`  ❌ ${name}\n     ${e.message}`); process.exitCode = 1; }
}

function renderDescription(text) {
  const html = Timeline.render([{ t: '09:00', d: text }]);
  const match = html.match(/<span class="tl-desc">([\s\S]*?)<\/span>/);
  assert.ok(match, 'timeline description rendered');
  return match[1];
}

console.log('\n── Timeline links ────────────────────────────────────────');

test('Google Docs anchor remains clickable and balanced', () => {
  const desc = renderDescription(
    '📘 <a href="https://docs.google.com/x" target="_blank">Livret du voyage (Google Docs)</a>'
  );
  assert.ok(desc.includes(
    '<a href="https://docs.google.com/x" target="_blank" rel="noopener">Livret du voyage (Google Docs)</a>'
  ));
  assert.strictEqual((desc.match(/<a /g) || []).length, 1);
  assert.strictEqual((desc.match(/<\/a>/g) || []).length, 1);
});

test('fragment href remains clickable', () => {
  const desc = renderDescription('<a href="#plus/listes/x">Listes</a>');
  assert.strictEqual(desc, '<a href="#plus/listes/x">Listes</a>');
  assert.ok(!desc.includes('target='));
});

test('javascript href is removed but its label remains', () => {
  const desc = renderDescription('<a href="javascript:alert(1)">clic</a>');
  assert.ok(!desc.includes('<a '));
  assert.ok(desc.includes('clic'));
});

test('other tags and attributes are stripped', () => {
  const desc = renderDescription('<b>gras</b> <img src=x onerror=alert(1)>');
  assert.strictEqual(desc.trim(), 'gras');
  assert.ok(!desc.includes('<img'));
  assert.ok(!desc.includes('<b>'));
});

test('two links in one description are both rendered', () => {
  const desc = renderDescription(
    '<a href="https://example.com/one">One</a> puis <a href="https://example.com/two">Two</a>'
  );
  assert.ok(desc.includes('<a href="https://example.com/one" target="_blank" rel="noopener">One</a>'));
  assert.ok(desc.includes('<a href="https://example.com/two" target="_blank" rel="noopener">Two</a>'));
  assert.strictEqual((desc.match(/<a /g) || []).length, 2);
});

test('plain text is unchanged and link-label ampersands are escaped', () => {
  assert.strictEqual(renderDescription('plain text unchanged'), 'plain text unchanged');
  assert.ok(renderDescription('<a href="https://example.com">A & B</a>').includes('A &amp; B'));
});

console.log(`\n  ${pass} passed\n`);
