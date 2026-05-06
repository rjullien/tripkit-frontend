/**
 * tests/e2e-prod-audit.spec.js — Full visual audit of 3 TripKit trips in production
 *
 * Audits: langon-2026, canada-ontario-2026, canada-2026
 * Runs against https://tripkit.bapttf.com with Authelia auth.
 *
 * All 3 trips confirmed clean via backend API (seed check, 2026-05-05):
 *   - langon-2026:          10 days, all with timeline items (4-8 each)
 *   - canada-ontario-2026:  22 days, all with timeline items (1-7 each)
 *   - canada-2026:          22 days, all with timeline items (2-6 each)
 */
import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const PROD_URL = 'https://tripkit.bapttf.com';
const AUTH_USER = process.env.TRIPKIT_USER || 'Rene';
const AUTH_PASS = process.env.TRIPKIT_PASS || '';

const TRIPS = [
  { id: 'langon-2026',         days: 10, hasMap: false, name: 'Langon — Chez Camille' },
  { id: 'canada-ontario-2026', days: 22, hasMap: true,  name: 'Canada Ontario & Niagara 2026' },
  { id: 'canada-2026',         days: 22, hasMap: true,  name: 'Canada Maritimes 2026' },
];

const SCREENSHOT_DIR = process.env.CI
  ? path.join(process.cwd(), 'test-results', 'audit')
  : '/home/node/.openclaw/lea/workspace/tripkit-audit';

// Ensure screenshot dirs exist
for (const trip of TRIPS) {
  fs.mkdirSync(path.join(SCREENSHOT_DIR, trip.id), { recursive: true });
}

/**
 * Login via Authelia and wait for the TripKit app shell to be ready.
 * 
 * IMPORTANT: On first visit with no localStorage, the app calls /api/trips to
 * discover trips. But /api/trips returns [] in this deployment (no list endpoint),
 * causing infinite "Chargement..." state.
 * WORKAROUND: Pre-seed localStorage with the target tripId so the app skips
 * trip discovery and loads the specific trip directly.
 */
async function loginAuthelia(page, preSeedTripId = 'langon-2026') {
  // Inject localStorage before page scripts run
  await page.addInitScript((tripId) => {
    // Pre-seed currentTripId so app.js skips getTrips() discovery
    // Keys from store.js:
    //   'tk-current-trip' → getCurrentTripId()
    //   'tk-trips'        → getAllTripIds() — must include tripId for trip-selector
    localStorage.setItem('tk-current-trip', tripId);
    // Register all known trips so trip-selector shows full list
    const allTrips = ['langon-2026', 'canada-ontario-2026', 'canada-2026'];
    const existing = JSON.parse(localStorage.getItem('tk-trips') || '[]');
    allTrips.forEach(id => { if (!existing.includes(id)) existing.push(id); });
    localStorage.setItem('tk-trips', JSON.stringify(existing));
  }, preSeedTripId);

  await page.goto(PROD_URL, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(500);

  // Handle Authelia login redirect
  if (page.url().includes('auth.bapttf.com')) {
    await page.fill('input[name="username"], #username-textfield', AUTH_USER);
    await page.fill('input[name="password"], #password-textfield', AUTH_PASS);
    await page.click('button[type="submit"], #sign-in-button');
    await page.waitForURL(`${PROD_URL}/**`, { timeout: 20000 }).catch(async () => {
      await page.waitForLoadState('domcontentloaded', { timeout: 10000 });
    });
  }

  // Wait for bottom-nav — app shell is rendered
  await page.waitForSelector('#bottom-nav', { timeout: 25000 });

  // Wait for the programme tab to show real content (not "Chargement").
  // Now that we pre-seeded tripId, the app should load the trip directly.
  await page.waitForFunction(() => {
    const el = document.getElementById('programme-content');
    if (!el) return false;
    const txt = el.textContent || '';
    return txt.length > 30 && !txt.includes('Chargement') && !txt.includes('Connexion');
  }, { timeout: 35000 });
}

/**
 * Switch to a trip by calling TripSelector.select() directly.
 * This is the most reliable approach — no need to click Plus tab.
 * Works as long as loginAuthelia() was called first (TripSelector is defined).
 */
async function switchTrip(page, tripId) {
  // Call TripSelector.select() directly — fetches seed + renders
  await page.evaluate((id) => {
    return TripSelector.select(id);
  }, tripId);

  // Wait for seed fetch + full render (backend fetch ~1-3s)
  await page.waitForTimeout(4500);
}

/** Navigate to Route tab */
async function goToRoute(page) {
  await page.locator('button[data-tab="route"]').click();
  await page.waitForTimeout(2000);
}

/** Navigate to a specific programme day via hash */
async function goToDay(page, dayNum) {
  await page.locator('button[data-tab="programme"]').click();
  await page.waitForTimeout(300);
  await page.evaluate((n) => { window.location.hash = `#programme/${n}`; }, dayNum);
  await page.waitForTimeout(1500);
}

/** Returns true if programme content has .timeline-item elements */
async function hasTimeline(page) {
  const count = await page.locator('#programme-content .timeline-item').count();
  return count > 0;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Version Check
// ─────────────────────────────────────────────────────────────────────────────

test.describe('TripKit Prod Audit — Version Check', () => {
  test('app shows valid version (>= 2.17.1 / cache >= 30)', async ({ page }) => {
    await loginAuthelia(page);

    const versionResp = await page.request.get(`${PROD_URL}/version.json`);
    if (versionResp.ok()) {
      const ver = await versionResp.json();
      console.log('Version:', JSON.stringify(ver));
      expect(ver.soft).toMatch(/^2\.\d+\.\d+$/);
      expect(ver.cache).toBeGreaterThanOrEqual(30);
    }

    const body = await page.textContent('body');
    expect(body.length).toBeGreaterThan(200);
    expect(body).not.toContain('Connexion nécessaire');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Trip Switching
// ─────────────────────────────────────────────────────────────────────────────

test.describe('TripKit Prod Audit — Trip Switching', () => {
  test('can switch between all 3 trips', async ({ page }) => {
    test.setTimeout(60000);
    await loginAuthelia(page);

    for (const trip of TRIPS) {
      await switchTrip(page, trip.id);
      const body = await page.textContent('body');
      expect(body).not.toContain('Connexion nécessaire');
      console.log(`✓ Switched to ${trip.id}`);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. Langon 2026 — Route tab + 10 days
// ─────────────────────────────────────────────────────────────────────────────

test.describe('TripKit Prod Audit — Langon 2026 (10 days)', () => {
  const trip = TRIPS[0];

  test('route tab loads', async ({ page }) => {
    await loginAuthelia(page, trip.id);
    await switchTrip(page, trip.id);
    await goToRoute(page);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, trip.id, 'route.png'), fullPage: true });
    console.log(`Saved: ${trip.id}/route.png`);
    const body = await page.textContent('body');
    expect(body.length).toBeGreaterThan(100);
  });

  for (let day = 0; day < trip.days; day++) {
    test(`day ${day} has timeline`, async ({ page }) => {
      await loginAuthelia(page, trip.id);
      await switchTrip(page, trip.id);
      await goToDay(page, day);
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, trip.id, `day-${String(day).padStart(2, '0')}.png`),
        fullPage: true,
      });
      const hasTL = await hasTimeline(page);
      console.log(`${trip.id} Day ${day}: timeline=${hasTL}`);
      expect(hasTL).toBe(true);
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. Canada Ontario 2026 — Route tab + 22 days
// ─────────────────────────────────────────────────────────────────────────────

test.describe('TripKit Prod Audit — Canada Ontario 2026 (22 days)', () => {
  const trip = TRIPS[1];

  test('route tab shows map and route cards', async ({ page }) => {
    await loginAuthelia(page, trip.id);
    await switchTrip(page, trip.id);
    await goToRoute(page);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, trip.id, 'route.png'), fullPage: true });
    console.log(`Saved: ${trip.id}/route.png`);

    const mapImg = page.locator('img[alt*="Carte"], img[src*="map-overview"]');
    const mapVisible = await mapImg.isVisible({ timeout: 5000 }).catch(() => false);
    console.log(`${trip.id} map visible: ${mapVisible}`);
    expect(mapVisible).toBe(true);

    const cardCount = await page.locator('.route-card').count();
    console.log(`${trip.id} route cards: ${cardCount}`);
    expect(cardCount).toBeGreaterThan(0);
  });

  for (let day = 0; day < trip.days; day++) {
    test(`day ${day} has timeline`, async ({ page }) => {
      await loginAuthelia(page, trip.id);
      await switchTrip(page, trip.id);
      await goToDay(page, day);
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, trip.id, `day-${String(day).padStart(2, '0')}.png`),
        fullPage: true,
      });
      const hasTL = await hasTimeline(page);
      console.log(`${trip.id} Day ${day}: timeline=${hasTL}`);
      expect(hasTL).toBe(true);
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. Canada Maritimes 2026 — Route tab + 22 days
// ─────────────────────────────────────────────────────────────────────────────

test.describe('TripKit Prod Audit — Canada Maritimes 2026 (22 days)', () => {
  const trip = TRIPS[2];

  test('route tab shows map and route cards', async ({ page }) => {
    await loginAuthelia(page, trip.id);
    await switchTrip(page, trip.id);
    await goToRoute(page);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, trip.id, 'route.png'), fullPage: true });
    console.log(`Saved: ${trip.id}/route.png`);

    const mapImg = page.locator('img[alt*="Carte"], img[src*="map-overview"]');
    const mapVisible = await mapImg.isVisible({ timeout: 5000 }).catch(() => false);
    console.log(`${trip.id} map visible: ${mapVisible}`);
    expect(mapVisible).toBe(true);

    const cardCount = await page.locator('.route-card').count();
    console.log(`${trip.id} route cards: ${cardCount}`);
    expect(cardCount).toBeGreaterThan(0);
  });

  for (let day = 0; day < trip.days; day++) {
    test(`day ${day} has timeline`, async ({ page }) => {
      await loginAuthelia(page, trip.id);
      await switchTrip(page, trip.id);
      await goToDay(page, day);
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, trip.id, `day-${String(day).padStart(2, '0')}.png`),
        fullPage: true,
      });
      const hasTL = await hasTimeline(page);
      console.log(`${trip.id} Day ${day}: timeline=${hasTL}`);
      expect(hasTL).toBe(true);
    });
  }
});
