/**
 * tests/polarsteps-panel.spec.js — Plus Polarsteps box (text caption)
 */
import { test, expect } from './fixtures.js';

const GOLDEN = `Décollage depuis Nice Côte d'Azur ce matin pour une grande boucle au Québec.

18 jours, tous les 3 avec Baptiste. Nice → Genève → Montréal.`;

test.describe('Plus Polarsteps', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/trips/*/polarsteps/status', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          enabled: true,
          ready: true,
          seedEnabled: true,
          active: true,
          opsEnabled: true,
          tripUrl: 'https://www.polarsteps.com/test/quebec/',
        }),
      }),
    );
    await page.route('**/api/trips/*/polarsteps/caption', async (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ text: '', day: 1, kind: 'opening', qa: { verdict: 'PASSED' } }),
        });
      }
      const body = route.request().postDataJSON() || {};
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          text: GOLDEN + (body.userNote ? `\n\n${body.userNote}` : ''),
          day: 1,
          kind: 'opening',
          qa: { verdict: 'PASSED', summary: 'QA PASSED' },
        }),
      });
    });
    await page.goto('/');
    await page.waitForSelector('.bottom-nav', { timeout: 8000 });
    await page.locator('.bottom-nav button[data-tab="plus"]').click();
    await page.waitForSelector('#plus-polarsteps-panel .polarsteps-section', { timeout: 8000 });
  });

  test('box sits between Voyage actif and Léo', async ({ page }) => {
    const plus = page.locator('#plus-content');
    const text = await plus.innerText();
    const iVoyage = text.indexOf('Voyage actif');
    const iPolar = text.indexOf('Polarsteps');
    const iLeo = text.indexOf('Léo');
    expect(iVoyage).toBeGreaterThanOrEqual(0);
    expect(iPolar).toBeGreaterThan(iVoyage);
    expect(iLeo).toBeGreaterThan(iPolar);
  });

  test('generate then copy', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.locator('#polarsteps-note').fill('escale un peu longue à Genève');
    await page.locator('#polarsteps-generate').click();
    await expect(page.locator('#polarsteps-result')).toBeVisible();
    await expect(page.locator('#polarsteps-result')).toHaveValue(/Décollage depuis Nice/);
    await expect(page.locator('#polarsteps-result')).toHaveValue(/escale un peu longue/);
    await expect(page.locator('#polarsteps-result')).not.toHaveValue(/PNR/);
    await page.locator('#polarsteps-copy').click();
    const clip = await page.evaluate(() => navigator.clipboard.readText());
    expect(clip).toContain('Décollage depuis Nice');
  });

  test('QA failed shows error without copyable text', async ({ page }) => {
    await page.unroute('**/api/trips/*/polarsteps/caption');
    await page.route('**/api/trips/*/polarsteps/caption', async (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ text: '', day: 1, kind: 'opening' }),
        });
      }
      return route.fulfill({
        status: 422,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'QA FAILED - PNR/vol',
          code: 'qa_failed',
          qa: { verdict: 'FAILED', summary: 'QA FAILED - PNR/vol' },
        }),
      });
    });
    await page.locator('#polarsteps-generate').click();
    await expect(page.locator('#polarsteps-error')).toBeVisible();
    await expect(page.locator('#polarsteps-error')).toContainText('QA FAILED');
    await expect(page.locator('#polarsteps-result-wrap')).toBeHidden();
  });
});

test.describe('Plus Polarsteps hidden without flag', () => {
  test('section absent on the generic test trip', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.bottom-nav', { timeout: 8000 });
    await page.locator('.bottom-nav button[data-tab="plus"]').click();
    await page.waitForSelector('#plus-content', { timeout: 8000 });
    await expect(page.locator('#plus-polarsteps-panel .polarsteps-section')).toHaveCount(0);
  });
});
