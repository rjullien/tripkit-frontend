/**
 * tests/steps-map.spec.js — bouton Étapes du jour (hôtels + split overlap)
 */
import { test, expect, SEED } from './fixtures.js';

test.describe('Étapes du jour', () => {
  test('un lien Maps encadré par l\'hôtel du matin et du soir', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.day-nav', { timeout: 8000 });
    await page.evaluate(() => { if (App && App.goToDay) App.goToDay(2); });
    const btn = page.locator('#programme-content a.map-btn-primary', { hasText: 'Étapes du jour' });
    await expect(btn).toHaveCount(1, { timeout: 5000 });
    const href = await btn.getAttribute('href');
    expect(href).toMatch(/^https:\/\/www\.google\.com\/maps\/dir\//);
    const parts = href.split('/dir/')[1].split('/').map(decodeURIComponent);
    expect(parts[0]).toBe('123 Main Street, Destination');
    expect(parts[parts.length - 1]).toBe('123 Main Street, Destination');
    expect(parts).toContain('City Museum, Destination');
    expect(parts).toContain('Riverfront, Destination');
    expect(parts.length).toBeGreaterThanOrEqual(4);
  });

  test('plus de 10 waypoints → 2 liens, départ du 2e = arrivée du 1er', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.day-nav', { timeout: 8000 });
    await page.evaluate((tripId) => {
      const trip = Store.getTripData(tripId);
      const day = trip.days.find(d => d.day === 2);
      day.timeline = [];
      for (let i = 0; i < 11; i++) {
        day.timeline.push({ t: '10:00', d: 'Stop ' + i, place: 'Place-' + i });
      }
      Store.setTripData(tripId, trip);
      App.goToDay(2);
      if (App.reloadAllViews) App.reloadAllViews();
    }, SEED.trip.id);

    const btns = page.locator('#programme-content a.map-btn-primary', { hasText: 'Étapes du jour' });
    await expect(btns).toHaveCount(2, { timeout: 5000 });
    await expect(btns.nth(0)).toContainText('1/2');
    await expect(btns.nth(1)).toContainText('2/2');
    const href1 = await btns.nth(0).getAttribute('href');
    const href2 = await btns.nth(1).getAttribute('href');
    const a = href1.split('/dir/')[1].split('/').map(decodeURIComponent);
    const b = href2.split('/dir/')[1].split('/').map(decodeURIComponent);
    expect(a).toHaveLength(10);
    expect(a[a.length - 1]).toBe(b[0]);
    expect(b[b.length - 1]).toBe('123 Main Street, Destination');
  });
});
