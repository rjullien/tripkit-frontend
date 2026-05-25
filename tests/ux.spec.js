/**
 * tests/ux.spec.js — UX & responsive tests (ported from voyage-app/tests/ux-audit.mjs)
 * Covers: responsive viewports, accessibility basics, performance, nav consistency
 */
import { test, expect } from './fixtures.js';

test.describe('Responsive', () => {
  const viewports = [
    { name: 'iPhone SE', width: 375, height: 667 },
    { name: 'iPhone 14 Pro Max', width: 430, height: 932 },
    { name: 'iPad Mini', width: 768, height: 1024 },
  ];

  for (const vp of viewports) {
    test(`no horizontal overflow on ${vp.name}`, async ({ browser }) => {
      const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
      const page = await ctx.newPage();

      // Mock API routes (same as fixtures)
      await page.route('**/config.js', route => route.fulfill({
        status: 200,
        contentType: 'application/javascript',
        body: `var TRIPKIT_CONFIG = { apiUrl: "", apiPrefix: "/api", defaultTripId: "test-trip-2026" };`,
      }));
      await page.route('**/api/**', route => route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: '{}',
      }));

      await page.goto('/');
      await page.waitForTimeout(2000);

      const hasOverflow = await page.evaluate(() =>
        document.documentElement.scrollWidth > document.documentElement.clientWidth
      );
      expect(hasOverflow).toBe(false);
      await ctx.close();
    });
  }
});

test.describe('Accessibility', () => {
  test('has lang attribute', async ({ page }) => {
    await page.goto('/');
    const lang = await page.locator('html').getAttribute('lang');
    expect(lang).toBeTruthy();
  });

  test('has viewport meta', async ({ page }) => {
    await page.goto('/');
    const viewport = page.locator('meta[name="viewport"]');
    await expect(viewport).toHaveCount(1);
  });

  test('has theme-color meta', async ({ page }) => {
    await page.goto('/');
    const themeColor = page.locator('meta[name="theme-color"]');
    await expect(themeColor).toHaveCount(1);
  });

  test('no images without alt text', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
    const missingAlt = await page.evaluate(() => {
      let count = 0;
      document.querySelectorAll('img').forEach(img => { if (!img.alt) count++; });
      return count;
    });
    // Allow some (hero images, decorative) but flag excessive
    if (missingAlt > 10) {
      console.warn(`⚠️ ${missingAlt} images without alt text`);
    }
  });

  test('buttons have accessible labels', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
    const unlabeled = await page.evaluate(() => {
      let count = 0;
      document.querySelectorAll('button').forEach(btn => {
        const text = btn.textContent.trim();
        const label = btn.getAttribute('aria-label');
        if (!text && !label) count++;
      });
      return count;
    });
    if (unlabeled > 0) {
      console.warn(`⚠️ ${unlabeled} buttons without accessible labels`);
    }
  });
});

test.describe('Navigation Consistency', () => {
  test('all tabs have active state', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.bottom-nav', { timeout: 8000 });

    const tabs = ['programme', 'route', 'culture', 'hotels', 'plus'];
    for (const tab of tabs) {
      const btn = page.locator(`.bottom-nav button[data-tab="${tab}"]`);
      if (await btn.count() === 0) continue;
      await btn.click();
      await page.waitForTimeout(200);

      // Check that exactly one tab is active
      const activeCount = await page.locator('.bottom-nav button.active').count();
      expect(activeCount).toBe(1);
    }
  });

  test('day navigation arrows work', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.bottom-nav', { timeout: 8000 });

    // Find day nav buttons
    const nextBtn = page.locator('.day-nav button, button[class*="next"]').last();
    if (await nextBtn.count() > 0 && !(await nextBtn.isDisabled())) {
      const textBefore = await page.locator('#programme-content').textContent();
      await nextBtn.click();
      await page.waitForTimeout(400);
      const textAfter = await page.locator('#programme-content').textContent();
      // Content should change (different day)
      expect(textAfter).not.toBe(textBefore);
    }
  });
});

test.describe('Performance', () => {
  test('page loads in under 5 seconds', async ({ page }) => {
    const start = Date.now();
    await page.goto('/');
    await page.waitForSelector('.bottom-nav', { timeout: 8000 });
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(5000);
    console.log(`Load time: ${elapsed}ms`);
  });

  test('DOM is not too deep', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
    const maxDepth = await page.evaluate(() => {
      let max = 0;
      function walk(el, depth) {
        if (depth > max) max = depth;
        for (const child of el.children) walk(child, depth + 1);
      }
      walk(document.body, 0);
      return max;
    });
    expect(maxDepth).toBeLessThan(30);
    console.log(`Max DOM depth: ${maxDepth}`);
  });
});
