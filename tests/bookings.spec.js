/**
 * tests/bookings.spec.js — Onglet Résa (ex-Hotels)
 */
import { test, expect } from './fixtures.js';

test.describe('Résa tab', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.bottom-nav', { timeout: 8000 });
    await page.locator('.bottom-nav button[data-tab="hotels"]').click();
    await page.waitForTimeout(400);
  });

  test('nav label is Résa', async ({ page }) => {
    const btn = page.locator('.bottom-nav button[data-tab="hotels"]');
    await expect(btn).toContainText('Résa');
  });

  test('shows flights, car, ferry, events and hotels', async ({ page }) => {
    const content = page.locator('#hotels-content');
    await expect(content).toContainText('Réservations');
    await expect(content).toContainText('Transport principal');
    await expect(content).toContainText('TESTPNR');
    await expect(content).toContainText('Location de voiture');
    await expect(content).toContainText('RENT123');
    await expect(content).toContainText('Traversier');
    await expect(content).toContainText('FERRY1');
    await expect(content).toContainText('Événements');
    await expect(content).toContainText('Test Show');
    await expect(content).toContainText('Grand Hotel');
  });

  test('renders cancellation and content badge tags', async ({ page }) => {
    const badges = page.locator('#hotels-content .badge');
    expect(await badges.count()).toBeGreaterThan(3);
    const text = await page.locator('#hotels-content').textContent();
    expect(text).toMatch(/Non remboursable|Flexible|À vérifier/);
    expect(text).toContain('Front row');
  });

  test('deep link #hotels still opens the tab', async ({ page }) => {
    await page.goto('/#hotels');
    await page.waitForTimeout(400);
    await expect(page.locator('#tab-hotels')).toBeVisible();
    await expect(page.locator('#hotels-content')).toContainText('Réservations');
  });
});
