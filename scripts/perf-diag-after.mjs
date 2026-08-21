#!/usr/bin/env node
/**
 * perf-diag-after.mjs — Measure the AFTER state of the boot optimization.
 * Same mock backend, but simulates the new parallel flow.
 */
import http from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 9098;

const LATENCIES = {
  '/health': 800,
  '/api/trips': 1200,
  '/api/trips/test-trip/version': 600,
  '/api/trips/test-trip/seed': 2500,
  '/api/trips/test-trip/construction': 1500,
};

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

const server = http.createServer(async (req, res) => {
  const path = new URL(req.url, `http://localhost:${PORT}`).pathname;
  if (path === '/health') { await delay(LATENCIES['/health']); res.writeHead(200, { 'Content-Type': 'application/json' }); res.end('{"status":"ok","version":"0.42.0"}'); return; }
  if (path === '/api/trips') { await delay(LATENCIES['/api/trips']); res.writeHead(200, { 'Content-Type': 'application/json' }); res.end('[{"id":"test-trip","name":"Test"}]'); return; }
  if (path === '/api/trips/test-trip/version') { await delay(LATENCIES['/api/trips/test-trip/version']); res.writeHead(200, { 'Content-Type': 'application/json' }); res.end('{"version":"1"}'); return; }
  if (path === '/api/trips/test-trip/seed') { await delay(LATENCIES['/api/trips/test-trip/seed']); res.writeHead(200, { 'Content-Type': 'application/json' }); res.end('{"trip":{"id":"test-trip"},"days":[{"day":1}]}'); return; }
  if (path === '/api/trips/test-trip/construction') { await delay(LATENCIES['/api/trips/test-trip/construction']); res.writeHead(200, { 'Content-Type': 'application/json' }); res.end('{"phase":"active"}'); return; }
  if (path.startsWith('/api/')) { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end('null'); return; }
  res.writeHead(404); res.end('');
});

async function fetchTimed(url, timeoutMs = 10000) {
  const start = Date.now();
  try {
    const c = new AbortController();
    const t = setTimeout(() => c.abort(), timeoutMs);
    const res = await fetch(url, { signal: c.signal });
    clearTimeout(t);
    await res.text();
    return { elapsed: Date.now() - start, ok: true };
  } catch (e) {
    return { elapsed: Date.now() - start, ok: false, error: e.message };
  }
}

async function run() {
  await new Promise(r => server.listen(PORT, r));
  const B = `http://localhost:${PORT}`;

  console.log(`\n${'═'.repeat(76)}`);
  console.log(`  📊 COMPARAISON AVANT / APRÈS — Boot séquentiel`);
  console.log(`${'═'.repeat(76)}\n`);

  // ═══════════════════════════════════════════════════════════════════════════
  // AVANT: 6 sequential calls
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('  ❌ AVANT (6 appels séquentiels):');
  console.log('  ' + '─'.repeat(60));

  let beforeTotal = 0;
  const beforeSteps = [
    { label: 'probe /health', url: '/health' },
    { label: 'getTrips (reconcile)', url: '/api/trips' },
    { label: 'getTrips (resolve — DUPLIQUÉ)', url: '/api/trips' },
    { label: 'checkVersion', url: '/api/trips/test-trip/version' },
    { label: 'fetchSeed', url: '/api/trips/test-trip/seed' },
    { label: 'syncConstruction (BLOQUANT)', url: '/api/trips/test-trip/construction' },
  ];
  for (const s of beforeSteps) {
    const r = await fetchTimed(B + s.url);
    beforeTotal += r.elapsed;
    console.log(`    ${s.label.padEnd(40)} ${String(r.elapsed).padStart(5)}ms`);
  }
  console.log(`    ${'─'.repeat(50)}`);
  console.log(`    TOTAL:                                   ${String(beforeTotal).padStart(5)}ms\n`);

  // ═══════════════════════════════════════════════════════════════════════════
  // APRÈS: parallélisé + dédupliqué + fire-and-forget
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('  ✅ APRÈS (parallélisé + dédupliqué + non-bloquant):');
  console.log('  ' + '─'.repeat(60));

  // Step 1: probe + getTrips in PARALLEL (max of the two)
  const step1Start = Date.now();
  const [probeR, tripsR] = await Promise.all([
    fetchTimed(B + '/health'),
    fetchTimed(B + '/api/trips'),
  ]);
  const step1 = Date.now() - step1Start;
  console.log(`    [parallel] probe + getTrips             ${String(step1).padStart(5)}ms (max of ${probeR.elapsed}/${tripsR.elapsed})`);

  // Step 2: checkVersion (sequential, needed)
  const verR = await fetchTimed(B + '/api/trips/test-trip/version');
  console.log(`    checkVersion                            ${String(verR.elapsed).padStart(5)}ms`);

  // Step 3: fetchSeed (sequential, needed)
  const seedR = await fetchTimed(B + '/api/trips/test-trip/seed');
  console.log(`    fetchSeed                               ${String(seedR.elapsed).padStart(5)}ms`);

  // Step 4: construction = fire-and-forget (NOT blocking)
  const constR = await fetchTimed(B + '/api/trips/test-trip/construction');
  console.log(`    syncConstruction (fire-and-forget)       ${String(constR.elapsed).padStart(5)}ms ← NON comptée`);

  const afterTotal = step1 + verR.elapsed + seedR.elapsed;
  console.log(`    ${'─'.repeat(50)}`);
  console.log(`    TOTAL BLOQUANT:                          ${String(afterTotal).padStart(5)}ms\n`);

  // ═══════════════════════════════════════════════════════════════════════════
  // Summary
  // ═══════════════════════════════════════════════════════════════════════════
  const gain = beforeTotal - afterTotal;
  const pct = Math.round((gain / beforeTotal) * 100);

  console.log(`  ${'═'.repeat(60)}`);
  console.log(`  📈 RÉSULTAT:`);
  console.log(`     AVANT:  ${beforeTotal}ms`);
  console.log(`     APRÈS:  ${afterTotal}ms`);
  console.log(`     GAIN:   -${gain}ms (${pct}% plus rapide)`);
  console.log('');
  console.log(`  Et avec le SW stale-while-revalidate :`);
  console.log(`     Utilisateur qui revient: ~0ms (shell servi depuis cache)`);
  console.log(`     → Le render se fait AVANT même que le backend soit contacté`);
  console.log(`  ${'═'.repeat(60)}\n`);

  server.close();
}

run().catch(e => { console.error(e); process.exit(1); });
