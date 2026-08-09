/**
 * tests/plus-documents.spec.js — Documents in Plus (collapsed by default)
 */
import { test, expect } from './fixtures.js';

test.describe('Plus Documents', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.bottom-nav', { timeout: 8000 });
    await page.locator('.bottom-nav button[data-tab="plus"]').click();
    await page.waitForSelector('#plus-docs-head', { timeout: 8000 });
  });

  test('order: Listes, Documents, Voyage actif', async ({ page }) => {
    const plus = page.locator('#plus-content');
    const text = await plus.innerText();
    const iListes = text.indexOf('Listes');
    const iDocs = text.indexOf('Documents');
    const iVoyage = text.indexOf('Voyage actif');
    expect(iListes).toBeGreaterThanOrEqual(0);
    expect(iDocs).toBeGreaterThan(iListes);
    expect(iVoyage).toBeGreaterThan(iDocs);
  });

  test('documents collapsed by default; expand on click', async ({ page }) => {
    const body = page.locator('#plus-docs-body');
    await expect(body).toBeHidden();
    await expect(page.locator('#hotels-content')).not.toBeVisible();

    await page.locator('#plus-docs-head').click();
    await expect(body).toBeVisible();
    await expect(body).toContainText('ESTA USA');
    await expect(body).toContainText('Alice');
    await expect(body).toContainText('Passeport');

    await page.locator('#plus-docs-head').click();
    await expect(body).toBeHidden();
  });

  test('documents are not in Résa', async ({ page }) => {
    await page.locator('.bottom-nav button[data-tab="hotels"]').click();
    await page.waitForSelector('#hotels-content', { timeout: 8000 });
    const resa = page.locator('#hotels-content');
    await expect(resa).toContainText('Réservations');
    await expect(resa).not.toContainText('ESTA USA');
    await expect(resa.locator('.booking-section-title', { hasText: 'Documents' })).toHaveCount(0);
  });
});
