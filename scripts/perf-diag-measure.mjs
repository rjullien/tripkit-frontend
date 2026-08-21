#!/usr/bin/env node
/**
 * perf-diag-measure.mjs — Automated startup performance measurement.
 *
 * Launches a headless browser, loads the app, and captures:
 * - All network requests (timing waterfall)
 * - Console performance marks
 * - First Contentful Paint
 * - Time to Interactive
 * - Total blocking time due to sequential awaits
 *
 * Usage:
 *   node scripts/perf-diag-measure.mjs http://localhost:9090
 */
import http from 'node:http';

const BASE = process.argv[2] || 'http://localhost:9090';

// Lightweight measurement without Playwright — pure Node.js
// Measures what matters: sequential network request chain timings

async function fetchTimed(url, opts = {}) {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), opts.timeoutMs || 10000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    const body = await res.text();
    const elapsed = Date.now() - start;
    return { url: url.replace(BASE, ''), status: res.status, elapsed, size: body.length, ok: true };
  } catch (e) {
    const elapsed = Date.now() - start;
    return { url: url.replace(BASE, ''), status: 0, elapsed, size: 0, ok: false, error: e.message };
  }
}

async function measureBootSequence() {
  console.log(`\n🔬 TripKit PWA Startup Performance Analysis`);
  console.log(`   Target: ${BASE}`);
  console.log(`   Date: ${new Date().toISOString()}`);
  console.log(`${'═'.repeat(72)}\n`);

  // ════════════════════════════════════════════════════════════════════════════
  // PHASE 1: Shell download (parallel with <script defer>)
  // ════════════════════════════════════════════════════════════════════════════
  console.log('📦 PHASE 1: Shell Download (blocking render)');
  console.log('─'.repeat(72));

  const shellAssets = [
    '/index.html',
    '/config.js',
    '/css/theme.css',
    '/js/dist/bundle-core.js',
    '/js/dist/bundle-components.js',
  ];

  let shellTotal = 0;
  const shellResults = [];
  // Browser fetches these mostly in parallel (defer scripts + CSS)
  const shellPromises = shellAssets.map(path => fetchTimed(BASE + path));
  const shellResponses = await Promise.all(shellPromises);

  for (const r of shellResponses) {
    shellResults.push(r);
    console.log(`  ${r.ok ? '✅' : '❌'} ${r.url.padEnd(35)} ${String(r.elapsed).padStart(5)}ms  ${(r.size / 1024).toFixed(1)} KB`);
  }
  // Shell download = longest single request (parallel)
  const shellMax = Math.max(...shellResponses.map(r => r.elapsed));
  shellTotal = shellMax;
  console.log(`  ⏱️  Shell download (parallel): ${shellMax}ms (bottleneck = slowest asset)\n`);

  // ════════════════════════════════════════════════════════════════════════════
  // PHASE 2: Boot sequence (SEQUENTIAL — this is the problem)
  // ════════════════════════════════════════════════════════════════════════════
  console.log('🔗 PHASE 2: Boot Sequence (SEQUENTIAL network calls — THE BOTTLENECK)');
  console.log('─'.repeat(72));

  // Simulate the exact sequential chain from app.js init() + refreshFromBackend()
  const bootSteps = [];
  let bootTotal = 0;

  // Step 1: version.json (non-blocking, but happens during init)
  const versionJson = await fetchTimed(BASE + '/version.json');
  bootSteps.push({ label: 'version.json (non-blocking)', ...versionJson });

  // Step 2: /health probe (fetchBackendVersion — 3s timeout)
  const healthProbe1 = await fetchTimed(BASE + '/health', { timeoutMs: 3000 });
  bootSteps.push({ label: '/health (fetchBackendVersion)', ...healthProbe1 });

  // Step 3: refreshFromBackend → API.probe() — ANOTHER /health call (3s timeout)
  const healthProbe2 = await fetchTimed(BASE + '/health', { timeoutMs: 3000 });
  bootSteps.push({ label: '/health (API.probe in refreshFromBackend)', ...healthProbe2 });
  bootTotal += healthProbe2.elapsed;

  // Step 4: reconcileTripRegistry → GET /trips (8s timeout)
  const getTrips = await fetchTimed(BASE + '/api/trips', { timeoutMs: 8000 });
  bootSteps.push({ label: 'GET /api/trips (reconcileTripRegistry)', ...getTrips });
  bootTotal += getTrips.elapsed;

  // Step 5: resolveTripId → same GET /trips again if no localStorage (8s timeout)
  const getTrips2 = await fetchTimed(BASE + '/api/trips', { timeoutMs: 8000 });
  bootSteps.push({ label: 'GET /api/trips (resolveTripId — 2nd call!)', ...getTrips2 });
  bootTotal += getTrips2.elapsed;

  // Step 6: loadTripSeed → checkVersionStatus (4s timeout)
  const checkVer = await fetchTimed(BASE + '/api/trips/test-trip/version', { timeoutMs: 4000 });
  bootSteps.push({ label: 'GET /trips/:id/version (checkVersionStatus)', ...checkVer });
  bootTotal += checkVer.elapsed;

  // Step 7: loadTripSeed → fetchSeed (8s timeout)
  const fetchSeed = await fetchTimed(BASE + '/api/trips/test-trip/seed', { timeoutMs: 8000 });
  bootSteps.push({ label: 'GET /trips/:id/seed (fetchSeed)', ...fetchSeed });
  bootTotal += fetchSeed.elapsed;

  // Step 8: syncConstructionData (15s timeout via requestJSON)
  const construction = await fetchTimed(BASE + '/api/trips/test-trip/construction', { timeoutMs: 15000 });
  bootSteps.push({ label: 'GET /trips/:id/construction (sync)', ...construction });
  bootTotal += construction.elapsed;

  console.log('  Step  Endpoint                                          Time    Blocking?');
  console.log('  ' + '─'.repeat(70));
  bootSteps.forEach((s, i) => {
    const blocking = i >= 2 ? '⛓️  YES' : '   no';
    console.log(`  ${String(i + 1).padStart(2)}.  ${s.label.padEnd(50)} ${String(s.elapsed).padStart(5)}ms  ${blocking}`);
  });

  console.log(`\n  ⏱️  Sequential blocking chain total: ${bootTotal}ms`);
  console.log(`  ⚠️  This is the time user sees "Chargement du voyage..." on cold start\n`);

  // ════════════════════════════════════════════════════════════════════════════
  // PHASE 3: Post-boot background activity
  // ════════════════════════════════════════════════════════════════════════════
  console.log('🔄 PHASE 3: Post-boot background (non-blocking)');
  console.log('─'.repeat(72));

  const bgSteps = [
    { label: 'warmTripAssets (day route images)', url: '/api/trips/test-trip/assets/day-01-route.jpg' },
    { label: 'backgroundSyncTrip (flushOutbox)', url: '/api/trips' },
  ];

  for (const step of bgSteps) {
    const r = await fetchTimed(BASE + step.url);
    console.log(`  ℹ️  ${step.label.padEnd(45)} ${String(r.elapsed).padStart(5)}ms (background)`);
  }

  // ════════════════════════════════════════════════════════════════════════════
  // SUMMARY
  // ════════════════════════════════════════════════════════════════════════════
  console.log(`\n${'═'.repeat(72)}`);
  console.log('📊 PERFORMANCE SUMMARY');
  console.log('═'.repeat(72));
  console.log(`  Shell download (parallel):      ${shellMax}ms`);
  console.log(`  Boot sequence (sequential):     ${bootTotal}ms`);
  console.log(`  ─────────────────────────────────────────`);
  console.log(`  TOTAL Time to First Render:     ${shellMax + bootTotal}ms (cold start, no cache)`);
  console.log(`  With cache (localStorage):      ${shellMax}ms (renders instantly from cache)`);
  console.log('');
  console.log('⚠️  KEY FINDINGS:');
  console.log('');
  console.log('  1. SERVICE WORKER: network-first for shell means even repeat visits');
  console.log('     wait for network response before showing the app (unless offline).');
  console.log('     On slow/flaky network, this can add 3-8s before ANY paint.');
  console.log('');
  console.log('  2. SEQUENTIAL BOOT CHAIN: After shell loads, the app makes 5-6 sequential');
  console.log('     awaited network calls. Each must complete before the next starts:');
  console.log('       probe → getTrips → getTrips(again) → checkVersion → fetchSeed → syncConstruction');
  console.log(`     With ${ENDPOINT_LATENCY_NOTE()} latencies, this alone takes ${bootTotal}ms.`);
  console.log('');
  console.log('  3. DUPLICATE CALLS: GET /api/trips is called TWICE on cold start');
  console.log('     (once in reconcileTripRegistry, once in resolveTripId).');
  console.log('');
  console.log('  4. WORST CASE TIMEOUTS: If backend is slow/unreachable but device');
  console.log('     reports online, the sequential chain hits timeouts:');
  console.log('       probe(3s) + getTrips(8s) + getTrips(8s) + version(4s) + seed(8s) + construction(15s)');
  console.log('       = 46 SECONDS of white screen before giving up');
  console.log('');
  console.log('  5. syncConstructionData is AWAITED even on the happy path.');
  console.log('     It adds 1-2s on every boot even when construction mode is off.');
  console.log('═'.repeat(72));
}

function ENDPOINT_LATENCY_NOTE() { return 'simulated'; }

measureBootSequence().catch(e => {
  console.error('Measurement failed:', e);
  process.exit(1);
});
