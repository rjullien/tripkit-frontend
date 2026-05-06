/**
 * Generate route maps for Montreal days (USA trip)
 */
const { chromium } = require('playwright');
const fs = require('fs');

const ROUTES = [
  { day: 16, url: 'https://www.google.com/maps/dir/4027+Avenue+Papineau,+Montr%C3%A9al/Mile+End,+Montr%C3%A9al/Oratoire+Saint-Joseph,+Montr%C3%A9al/Mont-Royal,+Montr%C3%A9al', label: 'Mile End + Oratoire + Mont-Royal' },
  { day: 17, url: 'https://www.google.com/maps/dir/4027+Avenue+Papineau,+Montr%C3%A9al/Stade+Olympique+de+Montr%C3%A9al/Oratoire+Saint-Joseph,+Montr%C3%A9al/4027+Avenue+Papineau,+Montr%C3%A9al', label: 'Stade Olympique + Oratoire' },
  { day: 18, url: 'https://www.google.com/maps/dir/4027+Avenue+Papineau,+Montr%C3%A9al/Parc+Jean-Drapeau,+Montr%C3%A9al/Vieux-Montr%C3%A9al/Centre-ville+de+Montr%C3%A9al', label: 'Jean-Drapeau + Vieux-Montréal' },
  { day: 19, url: 'https://www.google.com/maps/dir/4027+Avenue+Papineau,+Montr%C3%A9al/March%C3%A9+Jean-Talon,+Montr%C3%A9al/Westmount,+Montr%C3%A9al/A%C3%A9roport+international+Pierre-Elliott-Trudeau+de+Montr%C3%A9al', label: 'Jean-Talon + Westmount + Aéroport' },
];

const OUTPUT_DIR = '/tmp/usa-maps';

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
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
    
    await page.waitForTimeout(5000);
    
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
