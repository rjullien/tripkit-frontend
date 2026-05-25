/**
 * tests/day-resolver.spec.js — DayResolver logic tests
 * Uses test-trip seed: startDate=2026-06-15, endDate=2026-06-18, 4 days (0-3)
 */
import { test, expect, SEED } from './fixtures.js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname_local = dirname(fileURLToPath(import.meta.url));
const helperCode = readFileSync(join(__dirname_local, '..', 'js', 'day-helpers.js'), 'utf8');
const resolverCode = readFileSync(join(__dirname_local, '..', 'js', 'day-resolver.js'), 'utf8');

// Execute in a sandboxed context that mimics browser globals
function loadModules() {
  const glob = {};
  const fn = new Function('window', 'localStorage',
    helperCode + '\n' + resolverCode +
    '\nreturn { DayResolver: typeof DayResolver !== "undefined" ? DayResolver : window.DayResolver, DayHelpers: typeof DayHelpers !== "undefined" ? DayHelpers : window.DayHelpers };'
  );
  const fakeStorage = { getItem: () => null, setItem: () => {} };
  return fn(glob, fakeStorage);
}

const { DayResolver } = loadModules();

test.describe('DayResolver', () => {
  const tripData = { trip: SEED.trip, days: SEED.days };

  test('returns day 0 before trip', async ({}) => {
    // Well before the trip (June 1 is before startDate June 15)
    const idx = DayResolver.getDefaultDayIndex(tripData, {
      nowOverride: new Date('2026-06-01T12:00:00Z'),
      ignoreManual: true,
    });
    expect(idx).toBe(0);
  });

  test('returns last day after trip', async ({}) => {
    // After endDate (June 18)
    const idx = DayResolver.getDefaultDayIndex(tripData, {
      nowOverride: new Date('2026-07-01T12:00:00Z'),
      ignoreManual: true,
    });
    expect(idx).toBe(SEED.days.length - 1);
  });

  test('returns correct day during trip', async ({}) => {
    // startDate is 2026-06-15 = Day 1 (index 1)
    const idx = DayResolver.getDefaultDayIndex(tripData, {
      nowOverride: new Date('2026-06-15T18:00:00Z'),
      ignoreManual: true,
    });
    expect(idx).toBe(1);
  });

  test('tripState returns before/during/after', async ({}) => {
    expect(DayResolver.tripState(SEED.trip, new Date('2026-06-01'))).toBe('before');
    expect(DayResolver.tripState(SEED.trip, new Date('2026-06-16'))).toBe('during');
    expect(DayResolver.tripState(SEED.trip, new Date('2026-07-01'))).toBe('after');
  });

  test('getCountdown returns days before trip', async ({}) => {
    // June 10 = 4-5 days before Day 0 (June 14)
    const cd = DayResolver.getCountdown(SEED.trip, new Date('2026-06-10T12:00:00Z'));
    expect(cd.active).toBe(true);
    expect(cd.days).toBeGreaterThanOrEqual(3);
    expect(cd.days).toBeLessThanOrEqual(5);
  });

  test('getCountdown inactive during trip', async ({}) => {
    const cd = DayResolver.getCountdown(SEED.trip, new Date('2026-06-16T12:00:00Z'));
    expect(cd.active).toBe(false);
  });
});
