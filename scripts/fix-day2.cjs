/**
 * Regenerate specific route maps that were broken
 */
const { chromium } = require('playwright');
const fs = require('fs');

const ROUTES = [
  { day: 2, url: 'https://www.google.com/maps/dir/Langon,+33210/Ch%C3%A2teau+de+Roquetaillade,+33210+Maz%C3%A8res/Sauternes,+33210/Langon,+33210', label: 'Roquetaillade + Sauternes' },
];

const OUTPUT_DIR = '/tmp/langon-maps';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 800, height: 500 },
    locale: 'fr-FR',
  });
  const page = await context.newPage();

  for (const route of ROUTES) {
    const dayPad = String(route.day).padStart(2, '0');
    const outFile = `${OUTPUT_DIR}/day-${dayPad}-route.jpg`;
    console.log(`📍 Day ${route.day}: ${route.label}...`);
    
    await page.goto(route.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    
    // Dismiss cookie consent
    try {
      const btn = page.locator('button:has-text("Tout accepter"), button:has-text("Accept all"), form[action*="consent"] button');
      await btn.first().click({ timeout: 5000 });
      await page.waitForTimeout(3000);
    } catch (e) {}
    
    // Wait longer for map tiles
    await page.waitForTimeout(6000);
    
    // Dismiss overlays
    try {
      await page.locator('[aria-label="Close"], .dismissButton').first().click({ timeout: 2000 });
    } catch (e) {}
    
    await page.waitForTimeout(1000);
    await page.screenshot({ path: outFile, type: 'jpeg', quality: 85 });
    const size = fs.statSync(outFile).size;
    console.log(`  → ${outFile} (${(size/1024).toFixed(1)} KB)`);
  }

  await browser.close();
  console.log('✅ Done!');
}

main().catch(console.error);
