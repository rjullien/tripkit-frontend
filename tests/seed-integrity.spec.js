/**
 * tests/seed-integrity.spec.js — Seed data integrity tests (no browser needed)
 */
import { test, expect, SEED } from './fixtures.js';

test.describe('Seed Data Integrity', () => {
  test('has 21 days (0-20)', async ({}) => {
    expect(SEED.days).toHaveLength(21);
    expect(SEED.days[0].day).toBe(0);
    expect(SEED.days[20].day).toBe(20);
  });

  test('trip has required metadata', async ({}) => {
    expect(SEED.trip.id).toBeTruthy();
    expect(SEED.trip.name).toBeTruthy();
    expect(SEED.trip.startDate).toBeTruthy();
    expect(SEED.trip.endDate).toBeTruthy();
  });

  test('every day has timeline', async ({}) => {
    for (const day of SEED.days) {
      expect(day.timeline, `Day ${day.day} missing timeline`).toBeDefined();
      expect(day.timeline.length, `Day ${day.day} has empty timeline`).toBeGreaterThan(0);
    }
  });

  test('every hotelId resolves to hotels dict', async ({}) => {
    for (const day of SEED.days) {
      if (day.hotelId) {
        expect(
          SEED.hotels[day.hotelId],
          `Day ${day.day} hotelId "${day.hotelId}" not found in hotels`
        ).toBeDefined();
      }
    }
  });

  test('every locationId resolves to locations dict', async ({}) => {
    for (const day of SEED.days) {
      if (day.locationId) {
        expect(
          SEED.locations[day.locationId],
          `Day ${day.day} locationId "${day.locationId}" not found in locations`
        ).toBeDefined();
      }
    }
  });

  test('no duplicate highlights (>50% overlap with timeline)', async ({}) => {
    for (const day of SEED.days) {
      if (!day.highlights || !day.timeline) continue;
      for (const h of day.highlights) {
        const hClean = h.replace(/<[^>]+>/g, '').toLowerCase();
        for (const t of day.timeline) {
          const tClean = (t.d || '').replace(/<[^>]+>/g, '').toLowerCase();
          // Simple overlap check: if highlight is a substring of timeline entry
          if (hClean.length > 20 && tClean.includes(hClean)) {
            throw new Error(`Day ${day.day}: highlight "${h}" duplicates timeline "${t.d}"`);
          }
        }
      }
    }
  });

  test('no from===to redundancy', async ({}) => {
    for (const day of SEED.days) {
      if (day.from && day.to) {
        // from===to should have been cleaned (to removed)
        // But if both exist and equal, flag it
        if (day.from === day.to) {
          throw new Error(`Day ${day.day}: from === to ("${day.from}") — should remove redundant to`);
        }
      }
    }
  });

  test('conference sessions have required fields', async ({}) => {
    for (const day of SEED.days) {
      if (!day.conference) continue;
      expect(day.conference.sessions, `Day ${day.day} conference missing sessions`).toBeDefined();
      for (const [person, sessions] of Object.entries(day.conference.sessions)) {
        for (const s of sessions) {
          expect(s.t, `Day ${day.day} ${person} session missing time`).toBeDefined();
          expect(s.title, `Day ${day.day} ${person} session missing title`).toBeDefined();
          expect(s.badge, `Day ${day.day} ${person} session missing badge`).toBeDefined();
        }
      }
    }
  });

  test('cards have required type and title', async ({}) => {
    for (const day of SEED.days) {
      if (!day.cards) continue;
      for (const card of day.cards) {
        expect(card.type, `Day ${day.day} card missing type`).toBeDefined();
        expect(card.title, `Day ${day.day} card missing title`).toBeDefined();
      }
    }
  });

  test('hotels have required fields', async ({}) => {
    for (const [id, hotel] of Object.entries(SEED.hotels)) {
      expect(hotel.name, `Hotel ${id} missing name`).toBeTruthy();
    }
  });

  test('locations have lat/lon', async ({}) => {
    for (const [id, loc] of Object.entries(SEED.locations)) {
      expect(typeof loc.lat, `Location ${id} lat not number`).toBe('number');
      expect(typeof loc.lon, `Location ${id} lon not number`).toBe('number');
    }
  });

  test('no inline hotel data in days (zero duplication)', async ({}) => {
    const hotelFields = ['hotel', 'hotelNote', 'hotelAddr', 'hotelBooking', 'hotelRef',
      'hotelCheckin', 'hotelCheckout', 'hotelAmenities', 'hotelLinks'];
    for (const day of SEED.days) {
      for (const field of hotelFields) {
        expect(
          day[field],
          `Day ${day.day} has inline "${field}" — should use hotelId ref`
        ).toBeUndefined();
      }
    }
  });

  test('no inline geo data in days (zero duplication)', async ({}) => {
    expect(
      SEED.days.some(d => d.geo),
      'Found inline geo in days — should use locationId ref'
    ).toBeFalsy();
  });
});
