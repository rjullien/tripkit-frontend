const { chromium } = require('playwright');
const fs = require('fs');

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 800, height: 500 }, locale: 'fr-FR' });
  const page = await context.newPage();

  const url = 'https://www.google.com/maps/dir/16+Rue+du+Gaz,+33210+Langon/163+Rue+des+Cavales,+47120+Duras/Saint-%C3%89milion,+33330/16+Rue+du+Gaz,+33210+Langon';
  console.log('📍 Day 8: Langon → Duras → Saint-Émilion → Langon...');
  
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  try {
    const btn = page.locator('button:has-text("Tout accepter"), button:has-text("Accept all"), form[action*="consent"] button');
    await btn.first().click({ timeout: 5000 });
    await page.waitForTimeout(3000);
  } catch (e) {}
  await page.waitForTimeout(6000);
  try { await page.locator('[aria-label="Close"], .dismissButton').first().click({ timeout: 2000 }); } catch (e) {}
  await page.waitForTimeout(1000);
  
  const outFile = '/tmp/langon-maps/day-08-route.jpg';
  await page.screenshot({ path: outFile, type: 'jpeg', quality: 85 });
  console.log(`  → ${(fs.statSync(outFile).size/1024).toFixed(1)} KB`);
  await browser.close();
  console.log('✅ Done!');
}
main().catch(console.error);
