# TripKit Frontend 🗺️

A progressive web app for collaborative trip planning. Offline-first, multi-device sync, beautiful day-by-day itineraries.

## Features

- 📱 PWA — installable, works offline
- 🗓️ Day-by-day itinerary with timeline, hotels, highlights
- 🗺️ Interactive maps (route overview + daily)
- 📋 Collaborative checklists with multi-device sync
- 🌤️ Weather integration (location-aware)
- 👥 Multi-user with group-based ACL
- 🔄 Backend sync with version-gated refresh
- 📊 Culture articles per destination

## Architecture

```
tripkit-frontend (this repo)    tripkit-backend (Go API)     tripkit-seeds (private)
├── js/components/              ├── cmd/api/                 ├── my-trip-2026.js
├── js/day-helpers.js           ├── internal/handlers/       ├── ...
├── js/day-resolver.js          ├── internal/middleware/     └── ...
├── css/                        └── internal/models/
├── bundles.json (boot bundles)
├── seed-import.cjs
└── DATA-MODEL.md (spec)
```

## Quick Start

### 1. Deploy the backend

See [tripkit-backend](https://github.com/rjullien/tripkit-backend).

### 2. Create a seed file

Follow [DATA-MODEL.md](./DATA-MODEL.md) to create your trip data:

```javascript
var SEED_MY_TRIP = {
  trip: {
    id: "my-trip-2026",
    name: "My Amazing Trip",
    emoji: "🌍",
    startDate: "2026-06-15",  // Day 1 = first travel day
    endDate: "2026-06-22",
    travelers: [{ name: "Alice", role: "owner" }, { name: "Bob" }],
    phases: [{ name: "City", label: "CITY — Explore", range: [0, 2] }]
  },
  days: [
    { day: 0, emoji: "📋", label: "Prep — Packing & checklist", ... },  // MANDATORY
    { day: 1, emoji: "✈️", label: "Arrival", ... },
    // ...
  ],
  hotels: { "hotel-id": { name: "...", addr: "..." } },
  locations: { "city": { lat: 48.85, lon: 2.35, tz: "Europe/Paris" } },
  restaurants: {},
  culture: [],
  lists: {}
};
```

### 3. Import the seed

```bash
node seed-import.cjs --api http://localhost:3001 --seed my-trip.js
```

### 4. Serve the frontend

Any static file server works:

```bash
npx serve .
# or Docker (see Dockerfile)
```

## Date Model

- `startDate` = date of **Day 1** (first real travel day)
- **Day 0 is MANDATORY** = startDate - 1 = prep/packing day
- Formula: `displayed_date = startDate + (day_num - 1)`
- DayResolver auto-navigates to today's day during the trip

## Configuration

Set in `config.js` or via Docker env:

| Variable | Description |
|----------|-------------|
| `TRIPKIT_API_URL` | Backend API URL |
| `DEFAULT_TRIP_ID` | Skip trip selector, load this trip |

## ACL & Groups

The backend supports group-based access control:

```bash
# Create a group with members and trip access
PUT /api/groups/my-group
{"name": "Family", "members": ["alice", "bob"], "trips": ["my-trip-2026"]}
```

Users only see trips assigned to their groups. Admin users bypass ACL.

## Development

### Build step

The app stays a no-framework, no-transpiler PWA, but the boot scripts are concatenated
into three bundles so the shell costs 5 requests instead of 34:

```bash
npm run build   # node scripts/build-bundles.mjs → js/dist/bundle-*.js
```

- `bundles.json` is the source of truth: output name → ordered list of sources.
  The order is the old `<script>` order, so it matters.
- `js/dist/` is generated and **gitignored** — never edit it, re-run `npm run build`.
- `index.html` loads `config.js`, `bundle-core` and `bundle-components` with `defer`;
  `bundle-edge` (local AI + chat streams) is injected on demand from the Plus tab.
- The Docker image builds the bundles itself in a `node:22-alpine` stage, so
  `docker build` needs no prior `npm run build`.
- Zero npm dependency: the build script only uses Node's standard library.

```bash
# Run tests (npm test builds first, then runs Playwright)
npm test

# Playwright alone: its webServer command runs the build before serving
npx playwright test

# Node unit tests (the CI superset, 11 files)
for f in tests/*.test.cjs; do node "$f"; done

# Seed integrity check
npx playwright test tests/seed-integrity.spec.js
```

### Measuring the boot path

`scripts/measure-boot.mjs` lists every boot asset of a running instance with its
transferred (gzip) and uncompressed size, and exits non-zero if one is not 200 —
handy as a smoke test after `docker build`:

```bash
node scripts/measure-boot.mjs http://localhost:8099
```

## Release

```bash
./release.sh patch "description of changes"
```

This bumps `version.json`, tags, builds Docker image, and updates ArgoCD.

## License

MIT
