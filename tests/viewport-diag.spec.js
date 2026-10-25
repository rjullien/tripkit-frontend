/**
 * tests/viewport-diag.spec.js — overlay de diagnostic viewport (Plus > ligne Soft)
 */
import { test, expect } from './fixtures.js';

test('toggle via la ligne de version, survit au reload, se coupe', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('.bottom-nav', { timeout: 8000 });
  await page.locator('.bottom-nav button[data-tab="plus"]').click();
  const diag = page.locator('#viewport-diag');
  await expect(diag).toHaveCount(0);

  await page.locator('#tripkit-version-info').click();
  await expect(diag).toContainText(/iH \d+ cH \d+ dvh \d+/);
  await expect(diag).toContainText(/nav \d+-\d+/);

  await page.reload();
  await page.waitForSelector('.bottom-nav', { timeout: 8000 });
  await expect(diag).toBeVisible();

  await page.locator('.bottom-nav button[data-tab="plus"]').click();
  await page.locator('#tripkit-version-info').click();
  await expect(diag).toHaveCount(0);
});
