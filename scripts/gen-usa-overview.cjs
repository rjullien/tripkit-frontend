const { chromium } = require('playwright');
const fs = require('fs');

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 900, height: 550 }, locale: 'fr-FR' });
  const page = await context.newPage();

  // USA overview: Las Vegas → road trip → Denver → Montreal
  const url = 'https://www.google.com/maps/dir/Las+Vegas,+NV/Grand+Canyon+Village,+AZ/Page,+AZ/Bryce+Canyon,+UT/Moab,+UT/Denver,+CO/Montr%C3%A9al,+QC,+Canada';
  console.log('📍 USA overview map...');
  
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  
  try {
    const btn = page.locator('button:has-text("Tout accepter"), button:has-text("Accept all"), form[action*="consent"] button');
    await btn.first().click({ timeout: 5000 });
    await page.waitForTimeout(3000);
  } catch (e) {}
  
  await page.waitForTimeout(7000);
  
  try { await page.locator('[aria-label="Close"], .dismissButton').first().click({ timeout: 2000 }); } catch (e) {}
  await page.waitForTimeout(1000);
  
  const outFile = '/tmp/usa-maps/map-overview.jpg';
  await page.screenshot({ path: outFile, type: 'jpeg', quality: 85 });
  console.log(`  → ${(fs.statSync(outFile).size/1024).toFixed(1)} KB`);
  
  await browser.close();
  console.log('✅ Done!');
}

main().catch(console.error);
