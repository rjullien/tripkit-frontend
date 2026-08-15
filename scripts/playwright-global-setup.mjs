/**
 * scripts/playwright-global-setup.mjs — bundles à jour avant TOUTE exécution.
 *
 * playwright.config.js construit déjà les bundles dans sa commande `webServer`,
 * mais `reuseExistingServer: !CI` saute cette commande quand quelque chose écoute
 * déjà sur 4173 : `npx playwright test` (la commande du README) testait alors le
 * js/dist du dernier build, potentiellement périmé. Le globalSetup, lui, tourne
 * toujours.
 */
import { spawnSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export default function globalSetup() {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const res = spawnSync(process.execPath, [join(root, 'scripts', 'build-bundles.mjs')], {
    cwd: root,
    encoding: 'utf8',
  });
  if (res.status !== 0) {
    throw new Error('[playwright] build des bundles en échec :\n' + (res.stderr || res.stdout));
  }
}
