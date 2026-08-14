/**
 * tests/fixtures.js — Shared test fixtures for TripKit
 *
 * Intercepts ALL backend API calls and injects seed data.
 * Tests run fully offline — no backend needed.
 */
import { test as base } from '@playwright/test';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const seedCode = readFileSync(join(__dirname, '..', 'js', 'seed', 'test-trip.js'), 'utf8');
const fn = new Function(seedCode + '; return SEED_TEST_TRIP;');
const SEED = fn();
const TRIP_ID = SEED.trip.id;

/**
 * Extended test fixture that mocks the entire backend API via route interception.
 */
export const test = base.extend({
  page: async ({ page }, use) => {
    // Intercept ALL requests and mock API + config
    await page.route('**/*', (route) => {
      const url = route.request().url();

      // config.js — runtime Docker config
      if (url.endsWith('/config.js')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/javascript',
          body: `var TRIPKIT_CONFIG = { apiUrl: "", apiPrefix: "/api", defaultTripId: "${TRIP_ID}" };`,
        });
      }

      // GET /health — required since API.probe() gates refreshFromBackend (#19).
      // Without this mock, probe fails against the static server and seed never loads.
      if (url.includes('/health') && !url.includes('/api/')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ status: 'ok', version: 'test-be' }),
        });
      }

      // GET /api/trips/:id/version
      if (url.includes(`/api/trips/${TRIP_ID}/version`)) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            version: 'test-1',
            updated_at: new Date().toISOString(),
          }),
        });
      }

      // GET /api/trips/:id/seed
      if (url.includes(`/api/trips/${TRIP_ID}/seed`)) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            trip: {
              id: TRIP_ID,
              name: SEED.trip.name,
              emoji: SEED.trip.emoji,
              start_date: SEED.trip.startDate,
              end_date: SEED.trip.endDate,
              data: {
                travelers: SEED.trip.travelers,
                phases: SEED.trip.phases,
                restaurants: SEED.restaurants || {},
                culture: SEED.culture || [],
                hotels: SEED.hotels || {},
                locations: SEED.locations || {},
                flights: SEED.flights || null,
                carRental: SEED.carRental || null,
                ferry: SEED.ferry || null,
                ferries: SEED.ferries || null,
                events: SEED.events || null,
                sharedLinks: SEED.trip.sharedLinks,
                users: SEED.trip.users,
                homeTz: SEED.trip.homeTz || 'Europe/Paris',
                people: SEED.people || null,
              },
            },
            days: SEED.days.map(d => ({ day_num: d.day, data: d })),
            hotels: Object.entries(SEED.hotels || {}).map(([id, h]) => ({
              ...h, hotelId: id,
              day_num: SEED.days.find(dd => dd.hotelId === id)?.day || 0,
            })),
            lists: Object.entries(SEED.lists || {}).map(([id, l]) => ({
              id, type: l.type || 'generic', title: l.title || id, data: l,
            })),
          }),
        });
      }

      // GET /api/trips (list)
      if (url.match(/\/api\/trips\/?$/) || url.match(/\/api\/trips\?/)) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            results: [{
              id: TRIP_ID,
              name: SEED.trip.name,
              emoji: SEED.trip.emoji,
              start_date: SEED.trip.startDate,
              end_date: SEED.trip.endDate,
            }]
          }),
        });
      }

      // Polarsteps caption — hidden on the generic test trip (no seed flag).
      if (url.includes(`/api/trips/${TRIP_ID}/polarsteps/`)) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ enabled: false, ready: false, seedEnabled: false, active: false }),
        });
      }

      if (url.includes(`/api/trips/${TRIP_ID}/discovery/`)) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ themes: [], items: [] }),
        });
      }

      // GET /api/trips/:id (single trip)
      if (url.includes(`/api/trips/${TRIP_ID}`) && !url.includes('/days') && !url.includes('/hotels') && !url.includes('/lists')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: TRIP_ID,
            name: SEED.trip.name,
            emoji: SEED.trip.emoji,
          }),
        });
      }

      // GET /api/me — Authelia login for Plus grouping
      if (url.includes('/api/me')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ user: 'alice' }),
        });
      }

      // Any other /api/* — return empty success
      if (url.includes('/api/')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: '{}',
        });
      }

      // Everything else — pass through to static server
      return route.continue();
    });

    await use(page);
  },

  seed: async ({}, use) => {
    await use(SEED);
  },

  tripId: async ({}, use) => {
    await use(TRIP_ID);
  },
});

export { SEED };
export { expect } from '@playwright/test';
