/**
 * tests/day-resolver.spec.js — DayResolver logic tests
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
    const idx = DayResolver.getDefaultDayIndex(tripData, {
      nowOverride: new Date('2026-04-01T12:00:00Z'),
      ignoreManual: true,
    });
    expect(idx).toBe(0);
  });

  test('returns last day after trip', async ({}) => {
    const idx = DayResolver.getDefaultDayIndex(tripData, {
      nowOverride: new Date('2026-06-01T12:00:00Z'),
      ignoreManual: true,
    });
    expect(idx).toBe(SEED.days.length - 1);
  });

  test('returns correct day during trip', async ({}) => {
    // startDate is 2026-04-16, so April 16 = Day 1 (index 1)
    const idx = DayResolver.getDefaultDayIndex(tripData, {
      nowOverride: new Date('2026-04-16T18:00:00Z'),
      ignoreManual: true,
    });
    expect(idx).toBe(1);
  });

  test('tripState returns before/during/after', async ({}) => {
    expect(DayResolver.tripState(SEED.trip, new Date('2026-04-01'))).toBe('before');
    expect(DayResolver.tripState(SEED.trip, new Date('2026-04-20'))).toBe('during');
    expect(DayResolver.tripState(SEED.trip, new Date('2026-06-01'))).toBe('after');
  });

  test('getCountdown returns days before trip', async ({}) => {
    const cd = DayResolver.getCountdown(SEED.trip, new Date('2026-04-10T12:00:00Z'));
    expect(cd.active).toBe(true);
    expect(cd.days).toBeGreaterThanOrEqual(5);
    expect(cd.days).toBeLessThanOrEqual(7);
  });

  test('getCountdown inactive during trip', async ({}) => {
    const cd = DayResolver.getCountdown(SEED.trip, new Date('2026-04-20T12:00:00Z'));
    expect(cd.active).toBe(false);
  });
});
