# TripKit Data Model

> **Spec v2.0** — Source of truth for all trip data structure.
> Any seed file, backend response, or import script MUST follow this schema.
> Last audit: v1.6.0 — **10/10 zero-duplication checks pass.**

## Overview

```
tripData = {
  trip:        TripMeta,           // Trip metadata + sharedLinks
  days:        Day[],              // Ordered days (refs only, no inline data)
  hotels:      { [id]: Hotel },    // Shared by days via hotelId
  locations:   { [id]: Location }, // Shared by days via locationId
  restaurants: { [key]: Restaurant }, // Keyed by day number
  culture:     CultureZone[],      // Independent cultural guide
  lists:       { [id]: List },     // Independent checklists
}
```

---

## Design Principles

### 1. Zero Data Duplication

Every piece of data exists in **exactly one place**. Days contain only
content and refs — never inline copies of shared entities.

| Data | Stored in | Referenced by |
|------|-----------|---------------|
| Hotel info | `hotels{}` | `day.hotelId` |
| Geo coordinates | `locations{}` | `day.locationId` |
| Restaurant details | `restaurants{}` | `timeline[].restaurantRef` |
| Date / day-of-week | **NOT stored** | Computed from `trip.startDate + day.day` |
| Culture articles | `culture[]` (top-level) | Culture tab reads directly |
| Departure details | `day.departures[]` | Timeline has `type: "departure"` marker only |
| Shared links | `trip.sharedLinks[]` | Never duplicated across hotels |

### 2. Single Source of Truth Rules

These rules MUST be followed when creating or editing seed data:

| Rule | Violation example | Correct pattern |
|------|-------------------|-----------------|
| **No hotel fields in days** | `day.hotel`, `day.hotelAddr` | `day.hotelId → hotels[id]` |
| **No date/dow in days** | `day.date: "28 avr"` | Computed by `DayHelpers.enrich()` |
| **No geo in days** | `day.geo: {lat, lon}` | `day.locationId → locations[id]` |
| **No culture in days** | `day.culture: [...]` | Top-level `culture[]` only |
| **No departure steps in timeline** | Copying flight details into timeline | `{type: "departure", ref}` marker |
| **No from===to** | `{from: "Vegas", to: "Vegas"}` | Omit `to` on city-stay days |
| **No shared URLs in hotels** | Same link in 4 hotels | `trip.sharedLinks[]` |
| **Highlights ≠ timeline** | Highlight that copies a timeline entry | Highlights = editorial only (fun facts, tips) |

### 3. Other Principles

- **Generic** — no trip-specific hardcoding in components
- **Monolith fetch** — 1 API call, 1 localStorage cache, multiple UI views
- **Offline-first** — cache in localStorage, version-gated refresh

---

## TripMeta

```typescript
{
  id:           string,      // URL-safe slug (e.g. "usa-2026", "japan-2027")
  name:         string,      // Display name "USA Road Trip 2026"
  emoji:        string,      // "🇺🇸"
  startDate:    string,      // ISO date of day 0 (e.g. "2026-04-16")
  endDate:      string,      // ISO date of last day (e.g. "2026-05-06")
  travelers:    Traveler[],
  phases:       Phase[],
  routeUrl?:    string,      // Google Maps full route URL
  sharedLinks?: SharedLink[], // Links shared across multiple hotels
  users?:       { [userId]: UserConfig }, // Per-user personalization
}
```

### Traveler
```typescript
{
  name:       string,      // "René"
  emoji?:     string,      // "👨"
  role?:      string,      // "owner" | "traveler"
  leaveDate?: string,      // ISO date if leaving early
}
```

### Phase
```typescript
{
  name:   string,          // "Road Trip"
  label:  string,          // "PHASE 1 — 5 voyageurs (René, Nicole, ...)"
  range:  [number, number] // [startDay, endDay] (0-based, inclusive)
}
```

### SharedLink
```typescript
{
  url:     string,         // Full URL
  label:   string,         // "📍 Airbnb Guidebook"
  hotels:  string[],       // Hotel IDs that share this link
}
```

---

## Day

Days contain **content + refs only**. No inline hotel, geo, date, or culture data.

```typescript
{
  day:          number,    // 0-based index. Display as day+1.
  emoji:        string,    // "🎰"
  label:        string,    // Editorial title: "Google Cloud Next — Jour 2"
  from:         string,    // Origin city: "Las Vegas"
  to?:          string,    // Destination city (OMIT if same as from = city stay)
  dist?:        string,    // "245 km"
  dur?:         string,    // "2h30"

  // Content
  timeline:     TimelineEntry[],  // Ordered schedule
  highlights?:  string[],         // Editorial fun facts for Route tab (NOT timeline copies!)
  
  // Refs (zero inline data!)
  hotelId?:     string,           // → hotels[hotelId]
  locationId?:  string,           // → locations[locationId]
  mapUrl?:      string,           // Google Maps day route

  // Visual
  heroImage?:   string,           // URL for day header background
  heroImages?:  { [city]: string }, // Per-city variants (Day 0 personalization)

  // Optional rich content
  poem?:        Poem,
  departures?:  Departure[],      // Travelers leaving this day
  cards?:       DayCard[],        // Special cards (rental, ticket, info, warning)
  conference?:  Conference,       // Conference sessions (data-driven switcher)
}
```

**⚠️ Fields that do NOT exist in days:**
- `date`, `dow` → computed by `DayHelpers.enrich()`
- `geo` → resolved from `locations[locationId]` by `DayHelpers.enrich()`
- `hotel`, `hotelAddr`, `hotelPhone`, etc. → resolved from `hotels[hotelId]`
- `culture` → lives only in top-level `culture[]`

### TimelineEntry
```typescript
{
  t:              string,    // Time "09:30" (or emoji for timeless events)
  d:              string,    // Description (may contain safe HTML <a> links)
  type?:          string,    // "departure" = marker (details in day.departures[])
  ref?:           string,    // Departure traveler ref (when type=departure)
  restaurantRef?: number,    // → restaurants[N] for structured data linkage
  link?:          string,    // Direct URL button
  accent?:        boolean,   // Visual emphasis (auto-detected from ✈️/🚗/DÉPART)
  green?:         boolean,   // Green dot marker (auto-detected from ⭐/✅)
}
```

**Departure markers:** `type: "departure"` entries are **visual placeholders only**.
The actual steps live in `day.departures[]`. The timeline component renders the
departure card at the marker position. This avoids duplicating flight details,
shuttle info, etc. in two places.

**Restaurant refs:** `restaurantRef` links to `tripData.restaurants[N]` for
rich expansion (rating, alternatives, address). The `d` text is the **editorial
context** ("Déjeuner en centre-ville"). These serve different purposes:
ref = structured data, text = display narrative.

### Departure
```typescript
{
  traveler:  string,              // "Laurine"
  emoji?:    string,              // "👋"
  color?:    string,              // CSS color "#f0a500"
  subtitle?: string,              // "Bus en retard → conduit à St George"
  steps:     { time?: string, desc: string }[],
  footer?:   string,              // Summary line
}
```

### Poem
```typescript
{
  title?:  string,
  lines:   string[],
  author?: string,
}
```

### Highlights (editorial only!)

Highlights are **NOT a copy of the timeline**. They serve the Route tab as
short editorial bullets: fun facts, cultural notes, practical tips.

**Rule:** If a highlight has ≥50% word overlap with any timeline entry in the
same day, it is a duplicate and must be removed.

---

## DayCard

Generic cards rendered after timeline. New types = new render function, no view changes.

```typescript
{
  type:    string,      // "rental-pickup" | "rental-return" | "info" | "warning" | "ticket"
  title:   string,      // "🎫 Pick-up Ticket Alamo"
  data:    object,      // Type-specific payload (see below)
}
```

### Card types

| Type | Data fields |
|------|-------------|
| `rental-pickup` | `confirmation`, `ticketImage`, `steps[]` (supports **bold**) |
| `rental-return` | `company`, `location`, `address`, `returnBefore`, `phone`, `fuelPolicy`, `mapUrl`, `carplayUrl` |
| `info` | `text` or `html` |
| `warning` | `text` or `html` |
| `ticket` | `ref`, `image`, `text` |

---

## Conference

Per-day conference schedule with attendee switcher.

```typescript
{
  dayLabel?:  string,                          // "Mercredi 22 avril"
  sessions:   { [person]: ConfSession[] },     // "rene", "laurine"
}
```

### ConfSession
```typescript
{
  t:       string,    // "09:00"
  title:   string,    // "Opening keynote: The agentic cloud"
  badge:   string,    // "keynote" | "breakout" | "lightning" | "meeting" | "party" | "bof"
  code?:   string,    // "BRK1-043"
  room?:   string,    // "Oceanside B"
  shared?: boolean,   // True if both attendees share this session
  note?:   string,    // "Laurine couvre le début"
}
```

**Note:** Shared sessions appear in BOTH person arrays. This is intentional —
each person's schedule is a standalone view. Extracting shared sessions
would add complexity for no benefit.

---

## Users (trip.users)

Per-user personalization config, stored in `trip.users{}`.

```typescript
{
  [userId]: {
    city:          string,     // "Nice" — departure city (Day 0 hero)
    locationId?:   string,     // → locations[id] for weather on Day 0
    defaultConf?:  string,     // "rene" | "laurine" — conference toggle default
    startDay?:     number,     // Default landing day for late joiners
    skipDays?:     number[],   // Days to hide (e.g. [0] for users who don't need prep)
  }
}
```

---

## Hotel

Stored in `hotels{}` dict, shared across days via `day.hotelId`.

```typescript
{
  name:        string,      // "Luxor (R+N+L) / LINQ (A+D)"
  addr?:       string,      // Full address
  phone?:      string,
  booking?:    string,      // Platform name "Booking.com"
  ref?:        string,      // Booking reference
  note?:       string,      // "Vue Strip, 2 chambres"
  checkin?:    string,      // "15:00"
  checkout?:   string,      // "11:00"
  amenities?:  string[],    // ["🏊 Piscine", "🅿️ Parking"]
  links?:      { label: string, url: string }[],  // Hotel-specific only!
  access?:     string,      // Door code / access instructions
  extras?:     string,      // Additional info
}
```

**ID format:** slug from hotel name — lowercase, strip accents, non-alnum → `-`.
Example: `"Shep's Miners Inn"` → `"shep-s-miners-inn"`

**Links rule:** Only hotel-specific links. Shared links (e.g. Airbnb guidebook
used by multiple hotels) go in `trip.sharedLinks[]`.

---

## Location

Stored in `locations{}` dict, shared across days via `day.locationId`.
Multiple days at the same place (e.g. 3 days in Vegas) share **one** entry.

```typescript
{
  lat:  number,    // 36.17
  lon:  number,    // -115.14
  tz:   string,    // "America/Los_Angeles"
}
```

**ID format:** slug from city/place name — e.g. `"las-vegas"`, `"denver-co"`, `"montreal"`.

**Resolved at render time** by `DayHelpers.enrich()` → adds `.geo` to the day.

---

## Restaurant

Keyed by day number. Structure supports main choice + alternatives.

```typescript
{
  main: {
    name:     string,      // "El Tovar Dining Room"
    icon?:    string,      // "🍽️"
    note?:    string,      // "Réservation obligatoire"
    booked?:  boolean,     // Reservation confirmed
    mapUrl?:  string,      // Google Maps link
    addr?:    string,
    phone?:   string,
    hours?:   string,      // "11:30-21:00"
    web?:     string,
    price?:   string,      // "$$"
    rating?:  number,      // 4.5
  },
  alts?: {                 // Alternative options
    name:    string,
    note?:   string,
    mapUrl?: string,
  }[],
  breakfast?: string,      // Breakfast description if separate from main
}
```

---

## CultureZone

Top-level cultural guide. **Never stored in days.**

```typescript
{
  title:     string,      // "🎰 Zone 1 — Las Vegas & le Mojave"
  sub?:      string,      // "Chloride, Valley of Fire • J1, J5-8"
  sections:  CultureSection[],
  facts?:    string[],    // Fun facts for quiz
}
```

### CultureSection
```typescript
{
  h:  string,   // Heading
  p:  string,   // Paragraph (may be long)
}
```

---

## List (Checklists)

```typescript
{
  id:       string,        // "checklist-usa2026"
  type:     string,        // "packing" | "shopping" | "todo" | "generic"
  title:    string,        // "🧳 Valises USA"
  sections: ListSection[],
}
```

### ListSection
```typescript
{
  title: string,
  items: ListItem[],
}
```

### ListItem
```typescript
{
  id:    string,           // Unique within list
  text:  string,
  note?: string,
}
```

Check state is stored in **localStorage per-device** (not in seed).
Synced via backend `/sync` endpoint.

---

## Auto-Day Navigation (DayResolver)

`DayResolver.getDefaultDayIndex(tripData, opts)` determines which day to show:

| Trip state | Behavior |
|------------|----------|
| **Before** | Day 0 (prep). Late joiners → their `startDay`. |
| **During** | Today's day, computed from `trip.startDate`. |
| **After** | Last day. |

Also provides:
- `getCountdown(trip)` → `{ days, hours, active }` for pre-trip countdown
- `tripState(trip)` → `"before"` \| `"during"` \| `"after"`
- `filterDays(days, userCfg)` → hides `skipDays` for specific users

**Zero hardcoded dates.** Everything derives from `trip.startDate` + `trip.endDate`.

---

## Computed Fields (DayHelpers)

These fields are **NOT stored** in the seed. Computed at render time by
`DayHelpers.enrich(day, tripData)`:

| Field | Source | Example |
|-------|--------|---------|
| `date` | `trip.startDate + day.day` | `"28 avr"` |
| `dow` | `trip.startDate + day.day` | `"Lun"` |
| `_isoDate` | `trip.startDate + day.day` | `"2026-04-28"` |
| `geo` | `locations[day.locationId]` | `{ lat: 36.17, lon: -115.14, tz: "..." }` |

**All components MUST call `DayHelpers.enrich()` before accessing these fields.**
Raw seed day objects do NOT have them.

---

## Zero-Duplication Audit Checklist

Run this checklist on any seed before shipping:

| # | Check | How to verify |
|---|-------|---------------|
| 1 | No hotel fields in days | `days[].hotel`, `.hotelAddr`, etc. must not exist |
| 2 | No date/dow in days | `days[].date`, `.dow` must not exist |
| 3 | No geo in days | `days[].geo` must not exist |
| 4 | No culture in days | `days[].culture` must not exist |
| 5 | All refs resolve | Every `hotelId` → `hotels{}`, every `locationId` → `locations{}` |
| 6 | No departure/timeline overlap | Departure steps must not appear in timeline text |
| 7 | No highlight/timeline overlap | Highlights with ≥50% word match to timeline = duplicate |
| 8 | No from===to | City-stay days: omit `to`, keep only `from` |
| 9 | No shared links in hotels | Links appearing in 2+ hotels → `trip.sharedLinks[]` |
| 10 | No long string duplicates | No string >40 chars appearing 2+ times in the entire seed |

**Target: 10/10 ✅ on every release.**

---

## Backend API

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/trips` | List all trips |
| GET | `/api/trips/:id/version` | Version check (~50 bytes, 3s timeout) |
| GET | `/api/trips/:id/seed` | Full trip data (monolith ~80-100 KB) |
| PUT | `/api/trips/:id` | Update trip metadata |
| PUT | `/api/trips/:id/days/:num` | Upsert a day |
| PATCH | `/api/trips/:id/lists/:lid/sync` | Sync list check state |

### Version check
```json
{ "version": 1714262400000, "updated_at": "2026-04-28T00:00:00Z" }
```

### Seed response (backend assembles from DB)
```json
{
  "trip": {
    "id": "usa-2026",
    "name": "...",
    "data": {
      "travelers": [],
      "phases": [],
      "hotels": {},
      "locations": {},
      "restaurants": {},
      "sharedLinks": []
    }
  },
  "days": [{ "day_num": 0, "data": { ... } }],
  "lists": [{ "id": "...", "data": { ... } }]
}
```

### Data flow
```
seed-import.js ──→ Backend API ──→ SQLite
                                      │
Frontend boot ──→ GET /version (3s)   │
                    │                  │
             same? skip         GET /seed ──→ localStorage
                                                   │
                                              UI renders
                                          (DayHelpers.enrich)
```

---

## Seed File Format

Static JS files for import:

```javascript
var SEED_USA_2026 = {
  trip: { id: "usa-2026", name: "...", startDate: "2026-04-16", ... },
  days: [{ day: 0, emoji: "📋", label: "...", from: "...", ... }],
  hotels: { "luxor-linq": { name: "...", ... } },
  locations: { "las-vegas": { lat: 36.17, lon: -115.14, tz: "..." } },
  restaurants: { "5": { main: { name: "..." }, alts: [...] } },
  culture: [{ title: "...", sections: [...] }],
  lists: { "checklist": { ... } },
};
```

Variable name: `SEED_<ID>` (uppercase, hyphens → underscores) or `TRIP_DATA`.
`seed-import.js` auto-detects the variable name.

### Import
```bash
node seed-import.js --api https://api.example.com --token $TOKEN --seed path/to/seed.js
```

---

## Adding a New Trip

1. Create a seed JS file following this schema
2. Run the **10-point audit checklist** above
3. `node seed-import.js --api $URL --token $TOKEN --seed my-trip.js`
4. App auto-discovers via `GET /api/trips`
5. User selects trip in Plus > Trip selector

**No code changes needed. Components are 100% generic.**

---

## Size Budget

Target: <150 KB per trip seed (fits comfortably in localStorage).

Reference (USA 2026, v1.6.0):
```
days          28.3 KB  (34%)   21 days, refs + content
culture       28.8 KB  (35%)   8 zones, 56 sections
lists         11.1 KB  (14%)   3 checklists
restaurants    8.6 KB  (10%)   19 entries with alternatives
hotels         3.8 KB   (5%)   12 unique
locations      0.7 KB   (1%)   12 unique
trip           0.6 KB   (1%)   meta + sharedLinks
─────────────────────────────
TOTAL         82.0 KB
```
