/**
 * tests/polarsteps-panel.spec.js — Plus Polarsteps box (text caption)
 *
 * Generate is a leo.Hub job: POST 202 {jobId}, then GET /leo/jobs/{id}/stream.
 * GET /polarsteps/caption is the persisted store (Safari lock / SSE drop).
 */
import { test, expect } from './fixtures.js';

const GOLDEN = `Décollage depuis Nice Côte d'Azur ce matin pour une grande boucle au Québec.

18 jours, tous les 3 avec Baptiste. Nice → Genève → Montréal.`;

function sseDone(result) {
  return [
    'event: done',
    `data: ${JSON.stringify({ reply: JSON.stringify(result) })}`,
    '',
    '',
  ].join('\n');
}

function sseError(payload) {
  return [
    'event: error',
    `data: ${JSON.stringify(payload)}`,
    '',
    '',
  ].join('\n');
}

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
      return route.fulfill({
        status: 202,
        contentType: 'application/json',
        body: JSON.stringify({ jobId: 'job-ps-1' }),
      });
    });
    await page.route('**/api/leo/jobs/job-ps-1/stream**', async (route) => {
      const note = (() => {
        try {
          return route.request().postDataJSON();
        } catch (_) {
          return null;
        }
      })();
      // Stream is GET; userNote was on the POST. Tests that need the note
      // pass it via the generate mock below (job-ps-note).
      void note;
      return route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body: sseDone({
          text: GOLDEN,
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
    await page.unroute('**/api/trips/*/polarsteps/caption');
    await page.unroute('**/api/leo/jobs/job-ps-1/stream**');
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
        status: 202,
        contentType: 'application/json',
        body: JSON.stringify({ jobId: body.userNote ? 'job-ps-note' : 'job-ps-1' }),
      });
    });
    await page.route('**/api/leo/jobs/job-ps-note/stream**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body: sseDone({
          text: GOLDEN + '\n\nescale un peu longue à Genève',
          day: 1,
          kind: 'opening',
          qa: { verdict: 'PASSED', summary: 'QA PASSED' },
        }),
      }),
    );
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
    await page.unroute('**/api/leo/jobs/job-ps-1/stream**');
    await page.route('**/api/trips/*/polarsteps/caption', async (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ text: '', day: 1, kind: 'opening' }),
        });
      }
      return route.fulfill({
        status: 202,
        contentType: 'application/json',
        body: JSON.stringify({ jobId: 'job-ps-qa' }),
      });
    });
    await page.route('**/api/leo/jobs/job-ps-qa/stream**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body: sseError({
          error: 'QA FAILED - PNR/vol',
          code: 'qa_failed',
          tool: { qa: { verdict: 'FAILED', summary: 'QA FAILED - PNR/vol' } },
        }),
      }),
    );
    await page.locator('#polarsteps-generate').click();
    await expect(page.locator('#polarsteps-error')).toBeVisible();
    await expect(page.locator('#polarsteps-error')).toContainText('QA FAILED');
    await expect(page.locator('#polarsteps-result-wrap')).toBeHidden();
  });

  test('recovers caption from GET store if SSE drops', async ({ page }) => {
    let saved = false;
    await page.unroute('**/api/trips/*/polarsteps/caption');
    await page.unroute('**/api/leo/jobs/job-ps-1/stream**');
    await page.route('**/api/trips/*/polarsteps/caption', async (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            text: saved ? GOLDEN : '',
            day: 1,
            kind: 'opening',
            qa: { verdict: 'PASSED' },
          }),
        });
      }
      saved = true;
      return route.fulfill({
        status: 202,
        contentType: 'application/json',
        body: JSON.stringify({ jobId: 'job-ps-drop' }),
      });
    });
    await page.route('**/api/leo/jobs/job-ps-drop/stream**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body: 'event: progress\ndata: {"text":"Génération…"}\n\n',
      }),
    );
    await page.locator('#polarsteps-generate').click();
    await expect(page.locator('#polarsteps-result')).toBeVisible();
    await expect(page.locator('#polarsteps-result')).toHaveValue(/Décollage depuis Nice/);
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
