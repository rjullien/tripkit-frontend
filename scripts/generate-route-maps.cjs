/**
 * generate-route-maps.js — Capture Google Maps screenshots for trip days
 * Usage: node generate-route-maps.js [--trip langon-2026|usa-2026]
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const LANGON_ROUTES = [
  { day: 0, url: 'https://www.google.com/maps/dir/Eyguians,+05300/16+Rue+du+Gaz,+33210+Langon', label: 'Eyguians → Langon' },
  { day: 1, url: 'https://www.google.com/maps/dir/Langon,+33210/Saint-Macaire,+33490/Langon,+33210', label: 'Langon → Saint-Macaire' },
  { day: 2, url: 'https://www.google.com/maps/dir/Langon,+33210/Ch%C3%A2teau+de+Roquetaillade,+Maz%C3%A8res/Sauternes,+33210/Langon,+33210', label: 'Roquetaillade + Sauternes' },
  { day: 3, url: 'https://www.google.com/maps/dir/Langon,+33210/Ciron,+Pr%C3%A9chac,+33730/Langon,+33210', label: 'Canoë Ciron' },
  { day: 4, url: 'https://www.google.com/maps/dir/Langon,+33210/Bazas,+33430/Langon,+33210', label: 'Bazas' },
  { day: 5, url: 'https://www.google.com/maps/dir/Langon,+33210/Lac+de+Langon,+33210/Langon,+33210', label: 'Marché + Lac' },
  { day: 6, url: 'https://www.google.com/maps/dir/Langon,+33210/Verdelais,+33490/Langon,+33210', label: 'Vélo Verdelais' },
  { day: 7, url: 'https://www.google.com/maps/dir/Langon,+33210/Bordeaux/Dune+du+Pilat,+La+Teste-de-Buch/Langon,+33210', label: 'Bordeaux / Arcachon' },
  { day: 8, url: 'https://www.google.com/maps/dir/Langon,+33210/Saint-%C3%89milion,+33330/Langon,+33210', label: 'Saint-Émilion' },
  { day: 9, url: 'https://www.google.com/maps/dir/16+Rue+du+Gaz,+33210+Langon/70+Chemin+du+P%C3%A8re+Goiran,+06330+Roquefort-les-Pins', label: 'Langon → Roquefort' },
];

// Global overview route
const LANGON_OVERVIEW = 'https://www.google.com/maps/dir/Eyguians,+05300/16+Rue+du+Gaz,+33210+Langon/70+Chemin+du+P%C3%A8re+Goiran,+06330+Roquefort-les-Pins';

const OUTPUT_DIR = '/tmp/langon-maps';

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 800, height: 500 },
    locale: 'fr-FR',
    geolocation: { latitude: 44.55, longitude: -0.25 },
  });

  // Accept cookies once
  const page = await context.newPage();
  
  console.log('📍 Generating overview map...');
  await captureMap(page, LANGON_OVERVIEW, path.join(OUTPUT_DIR, 'map-overview.jpg'));

  for (const route of LANGON_ROUTES) {
    const dayPad = String(route.day).padStart(2, '0');
    const outFile = path.join(OUTPUT_DIR, `day-${dayPad}-route.jpg`);
    console.log(`📍 Day ${route.day}: ${route.label}...`);
    await captureMap(page, route.url, outFile);
  }

  await browser.close();
  console.log(`\n✅ Done! ${LANGON_ROUTES.length + 1} maps in ${OUTPUT_DIR}`);
}

async function captureMap(page, url, outFile) {
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    
    // Dismiss cookie consent if present
    try {
      const acceptBtn = page.locator('button:has-text("Tout accepter"), button:has-text("Accept all"), form[action*="consent"] button');
      await acceptBtn.first().click({ timeout: 5000 });
      await page.waitForTimeout(2000);
    } catch (e) {
      // No cookie banner, continue
    }
    
    // Wait for map tiles to load
    await page.waitForTimeout(4000);
    
    // Try to dismiss any other overlays
    try {
      await page.locator('[aria-label="Close"], .dismissButton').first().click({ timeout: 2000 });
    } catch (e) {}
    
    await page.waitForTimeout(1000);
    
    // Screenshot
    await page.screenshot({ path: outFile, type: 'jpeg', quality: 80 });
    const size = fs.statSync(outFile).size;
    console.log(`  → ${outFile} (${(size/1024).toFixed(1)} KB)`);
  } catch (e) {
    console.error(`  ⚠️ FAILED: ${e.message}`);
  }
}

main().catch(console.error);
