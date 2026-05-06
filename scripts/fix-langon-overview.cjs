const { chromium } = require('playwright');
const fs = require('fs');

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 900, height: 550 }, locale: 'fr-FR' });
  const page = await context.newPage();

  // Langon overview — full route with waypoints
  const url = 'https://www.google.com/maps/dir/Eyguians,+05300/Langon,+33210/Roquefort-les-Pins,+06330';
  console.log('📍 Langon overview (Eyguians → Langon → Roquefort)...');
  
  await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 });
  
  // Accept cookies
  try {
    const btn = page.locator('button:has-text("Tout accepter"), button:has-text("Accept all"), form[action*="consent"] button');
    await btn.first().click({ timeout: 5000 });
    console.log('  Cookie accepted');
    await page.waitForTimeout(3000);
  } catch (e) {
    console.log('  No cookie banner');
  }
  
  // Wait for route to calculate (blue line)
  console.log('  Waiting for route calculation...');
  await page.waitForTimeout(8000);
  
  // Try clicking the first route suggestion if available
  try {
    await page.locator('[data-trip-index="0"], .directions-mode-group button').first().click({ timeout: 3000 });
    await page.waitForTimeout(3000);
  } catch (e) {}
  
  // Close any overlays
  try { await page.locator('[aria-label="Close"], .dismissButton, [aria-label="Fermer"]').first().click({ timeout: 2000 }); } catch (e) {}
  await page.waitForTimeout(2000);
  
  const outFile = '/tmp/langon-maps/map-overview.jpg';
  await page.screenshot({ path: outFile, type: 'jpeg', quality: 85 });
  const size = fs.statSync(outFile).size;
  console.log(`  → ${outFile} (${(size/1024).toFixed(1)} KB)`);
  
  await browser.close();
  console.log('✅ Done!');
}

main().catch(console.error);
