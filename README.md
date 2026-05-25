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
├── js/components/              ├── cmd/api/                 ├── usa-2026.js
├── js/day-helpers.js           ├── internal/handlers/       ├── langon-2026.js
├── js/day-resolver.js          ├── internal/middleware/     └── ...
├── css/                        └── internal/models/
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

```bash
# Run tests
npx playwright test

# Seed integrity check
npx playwright test tests/seed-integrity.spec.js
```

## Release

```bash
./release.sh patch "description of changes"
```

This bumps `version.json`, tags, builds Docker image, and updates ArgoCD.

## License

MIT
