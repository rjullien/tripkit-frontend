# TripKit — Spécifications Fonctionnelles v2

> **Version :** 2.0  
> **Date :** 2026-05-01  
> **Auteur :** Léa 🌙  
> **Objectif :** Porter l'intégralité de voyage-app dans TripKit, avec données USA 2026 comme premier seed de validation  
> **Philosophie :** Générique, multi-voyage, zéro hardcoding — mais UI aussi riche que voyage-app

---

## Table des Matières

1. [Décisions de design](#1-décisions-de-design)
2. [Architecture](#2-architecture)
3. [Authentification](#3-authentification)
4. [Data Flow & Offline](#4-data-flow--offline)
5. [Navigation & Layout](#5-navigation--layout)
6. [Tab JOUR — Programme quotidien](#6-tab-jour--programme-quotidien)
7. [Tab ROUTE — Vue itinéraire](#7-tab-route--vue-itinéraire)
8. [Tab CULTURE — Guide culturel](#8-tab-culture--guide-culturel)
9. [Tab HÔTELS — Hébergements](#9-tab-hôtels--hébergements)
10. [Tab PLUS — Listes, Quiz, Settings](#10-tab-plus--listes-quiz-settings)
11. [Système Météo](#11-système-météo)
12. [Système WiFi Connect](#12-système-wifi-connect)
13. [Système Quiz (optionnel)](#13-système-quiz-optionnel)
14. [Restaurants](#14-restaurants)
15. [Day Cards](#15-day-cards)
16. [Conférence/Événements](#16-conférenceévénements)
17. [Fuseaux horaires](#17-fuseaux-horaires)
18. [Personnalisation utilisateur](#18-personnalisation-utilisateur)
19. [PWA & Service Worker](#19-pwa--service-worker)
20. [Listes (Checklists & Courses)](#20-listes-checklists--courses)
21. [UX & Interactions](#21-ux--interactions)
22. [Backend API](#22-backend-api)
23. [Seed & Import](#23-seed--import)
24. [Tests](#24-tests)
25. [Gap analysis : ce qu'il reste à porter](#25-gap-analysis--ce-quil-reste-à-porter)

---

## 1. Décisions de design

Décisions actées par René (1er mai 2026) :

| # | Décision | Détail |
|---|----------|--------|
| 1 | **Abandon GitHub OAuth** | Plus de dépendance oauth2-proxy/GitHub. Nouvelle auth légère (voir §3). |
| 2 | **Backend = source de vérité** | Plus de données hardcodées dans le JS. Tout vient du backend via API, mis en cache local. |
| 3 | **Offline-first via cache local** | Le localStorage reste le cache de lecture. L'app fonctionne sans réseau après le 1er chargement. |
| 4 | **Zéro duplication de données** | Un hôtel = une entrée dans `hotels{}`. Un lieu = une entrée dans `locations{}`. Refs partout. |
| 5 | **UI de voyage-app conservée** | Tous les swipes, animations, toasts, modals, gestures tactiles sont portés tels quels. |
| 6 | **Quiz optionnel** | Le quiz est un module activable par trip (flag `trip.features.quiz`). Pas de quiz = pas d'onglet/section. |
| 7 | **Onglet Hôtels gardé** | La vue dédiée Hôtels de TripKit (liste dédupliquée) est conservée — absente de voyage-app, c'est un plus. |
| 8 | **Validation avec données USA 2026** | Le premier seed importé = les données réelles du voyage USA 2026. Ça sert de test E2E. |

---

## 2. Architecture

### Stack

| Couche | Existant TripKit | Changement |
|--------|-----------------|------------|
| **Frontend** | Vanilla JS, modules IIFE, CSS custom props | Pas de changement de stack. On ajoute les composants manquants. |
| **Backend** | Go + SQLite + Chi router | Pas de changement. On étend l'API (auth endpoint). |
| **Deploy** | Docker + K3s | Pas de changement. |
| **Auth** | Bearer token API (write) + OAuth2 Proxy GitHub (read) | **Changement** → auth légère intégrée (voir §3) |

### Structure frontend cible

```
js/
├── api.js                    # ✅ Existe — étendre pour auth
├── app.js                    # ✅ Existe — ajouter quiz tab routing
├── store.js                  # ✅ Existe — ajouter quiz persistence
├── day-helpers.js            # ✅ Existe — OK
├── day-resolver.js           # ✅ Existe — OK
├── components/
│   ├── daily-view.js         # ✅ Existe — enrichir (countdown, culture badges, WiFi, poem toggle, map screenshots)
│   ├── timeline.js           # ✅ Existe — enrichir (culture badges cliquables)
│   ├── weather.js            # ✅ Existe — FIX trip start hardcodé, ajouter NWS overlay, route batch
│   ├── hotel-card.js         # ✅ Existe — ajouter WiFi QR code
│   ├── day-cards.js          # ✅ Existe — ajouter CarPlay links
│   ├── conference.js         # ✅ Existe — OK
│   ├── route-view.js         # ✅ Existe — enrichir (météo batch, phases visuelles, stats banner)
│   ├── culture-view.js       # ✅ Existe — enrichir (multi-carnet, swipe, PDFs)
│   ├── list.js               # ✅ Existe — enrichir (multi-profil, auto-update, print)
│   ├── trip-selector.js      # ✅ Existe — OK
│   ├── quiz.js               # 🆕 À créer — module quiz complet
│   ├── wifi-connect.js       # 🆕 À créer — QR code SVG + clipboard
│   └── countdown.js          # 🆕 À créer — J-X avant le trip
├── lib/
│   └── qrcode-svg.min.js    # 🆕 À ajouter — ~7KB, MIT, SVG QR generation
└── seed/
    └── usa-2026.js           # Optionnel — backup statique
```

### Design System (conservé)
```css
:root {
  --bg: #0d1117;
  --surface: #161b22;
  --border: #30363d;
  --text: #e6edf3;
  --muted: #8b949e;
  --acc: #f0a500;        /* or — accent principal */
  --sec: #4ecdc4;        /* turquoise */
  --accent: #e94560;     /* rouge — danger/alertes */
  --green: #3fb950;
  --orange: #d29922;
}
```

---

## 3. Authentification

### Abandon GitHub OAuth

**Pourquoi :** dépendance lourde (oauth2-proxy, GitHub app), complexe à self-host, inutile pour une app voyage familiale.

### Nouvelle auth : Token par lien + Device ID

**Principe :** l'organisateur génère un lien d'accès par voyageur. Chaque device s'identifie automatiquement.

#### Flow

```
1. Organisateur crée le trip dans le backend
2. Backend génère un token par voyageur (ou un token trip partagé)
3. Organisateur partage le lien : https://tripkit.example.com/?t=TOKEN
4. Premier accès → token stocké en localStorage (tk-api-token)
5. Device ID auto-généré (tk-device-id) → identifie le device pour sync
6. Accès suivants → token lu depuis localStorage, transparent
```

#### Token types

| Type | Usage | Exemple |
|------|-------|---------|
| **Trip token** | Accès lecture à un trip spécifique | `t_usa2026_abc123` |
| **User token** | Identifie un voyageur (personalisation) | `u_rene_xyz789` |
| **Admin token** | Lecture + écriture (seed import, edit) | `a_master_def456` |

#### Backend changes

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `POST /api/auth/token` | POST | Admin crée un token (type, tripId, userId, expiry) |
| `GET /api/auth/me` | GET | Retourne le profil associé au token (userId, role, tripId) |

#### Frontend changes

```javascript
// Boot: extract token from URL or localStorage
function initAuth() {
  const params = new URLSearchParams(window.location.search);
  const urlToken = params.get('t');
  if (urlToken) {
    Store.set('tk-api-token', urlToken);
    // Clean URL (remove token from address bar)
    window.history.replaceState({}, '', window.location.pathname);
  }
  const token = Store.get('tk-api-token');
  if (token) API.setToken(token);
}

// Fetch user profile (for personalization)
async function fetchUserProfile() {
  const me = await API.getMe(); // GET /api/auth/me
  if (me && me.userId) {
    Store.set('tk-user-id', me.userId);
    Store.set('tk-user-role', me.role);
  }
}
```

#### ⚠️ Pas de mode public / fallback sans auth

**RÈGLE SÉCURITÉ :** L'app NE DOIT PAS fonctionner sans authentification. Tout accès (lecture ET écriture) requiert un token valide.

- `TRIPKIT_AUTH_REQUIRED=true` est la **seule** valeur acceptée en production
- Si le token est absent ou invalide → écran de login, **jamais** d'accès aux données
- Pas de mode "lecture seule publique" — les données voyage sont privées (adresses, codes WiFi, accès logements...)
- Le backend DOIT retourner 401 sur tout endpoint `/api/*` si le token est absent/expiré
- Frontend : si `/api/auth/me` retourne 401 → afficher page d'erreur "Lien d'accès requis" avec instruction de demander le lien à l'organisateur

---

## 4. Data Flow & Offline

### Principe : Backend = source de vérité, localStorage = cache

```
Backend (SQLite)
     │
     ▼ API REST
Frontend boot
     │
     ├─ Cache localStorage existe ?
     │    ├─ OUI → Render immédiat (offline OK)
     │    │         └─ Background: check version → si changé → fetch seed → re-render
     │    └─ NON → Fetch seed → store → render
     │
     └─ Offline + pas de cache → Écran "Première connexion requise"
```

### Règles

| Règle | Détail |
|-------|--------|
| **Jamais de données dupliquées** | Un hôtel, un lieu, un restaurant = une seule source dans le seed |
| **localStorage = cache, pas source** | Les données sont la copie exacte du backend. Pas de données générées/augmentées côté client (sauf check states). |
| **Version-gated refresh** | `GET /api/trips/:id/version` → 50 bytes, 3s timeout. Même version = skip fetch. |
| **Check states = bidirectionnel, par utilisateur** | Les coches sont **individuelles par userId** — chaque voyageur a son propre état de coches. Sync via `PATCH /lists/:lid/sync` avec merge par `(userId, itemId, timestamp)` au niveau item. Le merge granulaire item-par-item (LWW = Last Writer Wins par item) évite tout écrasement : si Alex coche "maillot" pendant que René coche "passeport", les deux coches sont préservées. |
| **Quiz state = local only** | Scores quiz stockés en localStorage, pas sync backend (jeu en local pendant le voyage). |

### DayHelpers.enrich() — résolution des refs

Chaque jour brut contient uniquement des **refs**. Avant render :

```javascript
const day = DayHelpers.enrich(rawDay, tripData);
// Résout : date, dow, _isoDate (depuis trip.startDate)
//          geo (depuis locations[locationId])
//          Hotel accessible via hotels[hotelId]
```

**Règle absolue :** les composants ne lisent JAMAIS `date`, `dow`, `geo` directement du seed.

---

## 5. Navigation & Layout

### Bottom Tab Bar (5 onglets — identique TripKit actuel)

| # | Icône | Label | Hash | Contenu |
|---|-------|-------|------|---------|
| 1 | 📅 | Jour | `#programme` | Programme jour par jour |
| 2 | 🗺️ | Route | `#route` | Vue itinéraire complet |
| 3 | 📚 | Culture | `#culture` | Guide culturel |
| 4 | 🏨 | Hôtels | `#hotels` | Liste hébergements (**gardé de TripKit**) |
| 5 | ⚙️ | Plus | `#plus` | Listes, Quiz (si activé), Settings |

### Layout (identique)

```
┌──────────────────────────┐
│         Tab View          │  flex:1, overflow-y:auto
│    (contenu scrollable)   │
├──────────────────────────┤
│  📅   🗺️   📚   🏨   ⚙️  │  nav fixe, 52px + safe-area
└──────────────────────────┘
```

### Router hash
- `#programme/3` → Jour index 3
- `#plus/listes/checklist-id` → Liste spécifique
- `#plus/quiz` → Quiz (si activé)

---

## 6. Tab JOUR — Programme quotidien

### Composant : `DailyView.render(container, tripData, dayIndex)`

### Rendu complet (ordre des éléments)

#### 6.1 Navigation jour
- ✅ **Existe** — Boutons ◀ / ▶ + compteur `3 / 21`
- ✅ **Existe** — Swipe horizontal pour changer de jour
- Seuil : >60px horizontal, direction horizontale > verticale

#### 6.2 Countdown (🆕 à porter)
- **Avant le trip** (`DayResolver.tripState() === 'before'`) → afficher `J-X` en gros gradient
- Style : `font-size:3.5em; font-weight:900; background:linear-gradient(135deg, var(--accent), var(--sec)); -webkit-background-clip:text`
- Affiché uniquement sur Day 0 (ou le premier jour visible)
- Données : calculé depuis `trip.startDate`, pas stocké dans le seed

#### 6.3 Header avec Hero Image
- ✅ **Existe** — `day.heroImage` chargé async
- ✅ **Existe** — Day 0 personnalisé par ville (`day.heroImages` + `trip.users[userId].city`)
- Overlay gradient noir pour lisibilité

#### 6.4 Info Chips
- ✅ **Existe** — Distance, durée, villes from→to

#### 6.5 Lien Google Maps
- ✅ **Existe** — Bouton primaire `day.mapUrl`
- 🆕 **À ajouter** — Bouton secondaire **CarPlay** : `comgooglemaps://?daddr=...` (sans saddr = position GPS)

#### 6.6 Route Map Screenshot (🆕 à porter)
- Image du tracé par jour : `day.routeImage` (URL dans le seed)
- Fallback si pas d'image : pas affiché
- Chargé async comme hero image

#### 6.7 Météo inline (async)
- ✅ **Existe** — `Weather.renderInline()`
- Cliquable → modal détaillée
- ⚠️ **FIX requis** : `TRIP_START` hardcodé dans `weather.js` → résoudre depuis `tripData.trip.startDate`

#### 6.8 Timeline
- ✅ **Existe** — Frise verticale
- 🆕 **À ajouter** — Badges cliquables `📚 Culture` sur certaines entrées (`timeline[].cultureRef`)
  - Tap → overlay modal avec contenu culturel inline
  - Données : `cultureRef: "zone-0-section-2"` → résolu depuis `tripData.culture[]`

#### 6.9 Points Forts (Highlights)
- ✅ **Existe** — Liste éditoriale avec liens HTML sécurisés

#### 6.10 Departures
- ✅ **Existe** — Cards colorées par voyageur (steps, footer)

#### 6.11 Poème (🆕 à enrichir)
- ✅ **Existe** — Rendu basique
- 🆕 **À ajouter** — Toggle collapsible (tap ▶/▼) comme dans voyage-app
- Style : italique, fond dégradé subtil

#### 6.12 Carte Hébergement
- ✅ **Existe** — `HotelCard.render()` avec résolution `hotelId` → `hotels{}`
- 🆕 **À ajouter** — Section WiFi (voir §12)

#### 6.13 Restaurant
- ✅ **Existe** — Principal + alternatives + breakfast/lunch

#### 6.14 Day Cards
- ✅ **Existe** — 5 types (rental-pickup, rental-return, info, warning, ticket)
- 🆕 **À ajouter** — CarPlay link dans `rental-return`

#### 6.15 Conférence
- ✅ **Existe** — Switcher par participant

---

## 7. Tab ROUTE — Vue itinéraire

### Composant : `RouteView.render(containerId, tripData)`

### Existant à enrichir

| Feature | Status | Détail |
|---------|--------|--------|
| Stats banner | ✅ Existe | Jours, km, voyageurs |
| Google Maps link | ✅ Existe | `trip.routeUrl` |
| Phases visuelles | ✅ Existe | `trip.phases[]` labels |
| Route cards expandable | ✅ Existe | Tap → highlights + hôtel + lien programme |
| **Météo inline par jour** | 🆕 À ajouter | Icône + temp à côté de chaque jour |
| **Météo batch loading** | 🆕 À ajouter | Un appel par location unique, cache localStorage 3h |
| **NWS overlay (USA)** | 🆕 À ajouter | `api.weather.gov` overlay pour les trips USA (7 jours, plus précis) |
| **Indicateurs confiance** | 🆕 À ajouter | Badge coloré vert/orange/rouge selon horizon |

### Météo route batch

```javascript
// Collecte locations uniques
const uniqueLocations = new Map();
days.forEach(d => {
  if (d.geo) uniqueLocations.set(d.locationId, d.geo);
});

// Un appel Open-Meteo par location, range startDate→endDate
uniqueLocations.forEach((geo, locId) => {
  fetchWeatherRange(geo.lat, geo.lon, trip.startDate, trip.endDate, geo.tz);
});
```

Cache : `localStorage` key `wx-route-{tripId}`, TTL 3h.

---

## 8. Tab CULTURE — Guide culturel

### Composant : `CultureView.render(containerId, tripData)`

### Existant à enrichir

| Feature | Status | Détail |
|---------|--------|--------|
| Zones accordéon | ✅ Existe | Tap titre → expand |
| Sections accordéon | ✅ Existe | Double niveau (zone → section) |
| Fun facts | ✅ Existe | Badges 💡 |
| **Multi-carnet** | 🆕 À ajouter | Switcher onglets + swipe entre N carnets |
| **PDFs téléchargeables** | 🆕 À ajouter | Liens dans `tripData.culture` metadata |
| **Swipe entre carnets** | 🆕 À ajouter | Geste horizontal >60px entre carnets |
| **Dots indicateurs** | 🆕 À ajouter | Points sous les onglets |

### Modèle de données étendu

```typescript
// tripData.culture est maintenant un array de Notebooks
culture: CultureNotebook[]

CultureNotebook = {
  id:     string,          // "road-trip" | "montreal"
  title:  string,          // "🇺🇸 Road Trip"
  pdf?:   string,          // URL du PDF téléchargeable
  zones:  CultureZone[],   // Zones existantes (renommé depuis culture[])
}
```

**Migration** : si `culture[]` est un array de zones (format actuel), le traiter comme un notebook unique.

---

## 9. Tab HÔTELS — Hébergements

### Composant : Garde la vue TripKit actuelle (absent de voyage-app, c'est un **plus**)

### Fonctionnement
- Parcourt tous les jours, déduplique par `hotelId`
- Affiche : date + ville + carte hôtel
- Réutilise `HotelCard.render()`

### Enrichissements

| Feature | Status | Détail |
|---------|--------|--------|
| Liste dédupliquée | ✅ Existe | Groupé par hôtel unique |
| Carte complète | ✅ Existe | Nom, adresse, booking, check-in/out, amenities, liens |
| **WiFi section** | 🆕 À ajouter | QR code + bouton copie mdp (voir §12) |
| **CarPlay link** | 🆕 À ajouter | `comgooglemaps://?daddr={address}` |

---

## 10. Tab PLUS — Listes, Quiz, Settings

### Sections rendues

```
⚙️ Plus
├── 📋 Listes (checklists, courses)
├── 🧠 Quiz (SI trip.features.quiz === true)
├── 🌍 Voyage actif (trip selector)
└── ℹ️ Infos app + Actions
```

### Quiz dans Plus (🆕)
- Si `trip.features.quiz === true` → section "🧠 Quiz" apparaît
- Tap → ouvre la vue Quiz en plein tab (`#plus/quiz`)
- Si `trip.features.quiz` absent ou `false` → section masquée, aucun code quiz chargé

### Trip selector
- ✅ Existe — liste des trips, tap pour switcher

---

## 11. Système Météo

### Composant : `Weather.renderInline()` + `Weather.openModal()`

### ⚠️ FIX CRITIQUE : supprimer le hardcoding

```javascript
// ACTUEL (BROKEN pour multi-trip) :
const TRIP_START = new Date(2026, 3, 16);

// CORRIGÉ :
function dayDate(dayNum, tripStartDate) {
  const d = new Date(tripStartDate + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + dayNum);
  return d.toISOString().split('T')[0];
}
```

`Weather.renderInline(container, day, tripData)` reçoit maintenant `tripData` pour résoudre la date.

### Sources

| Source | Couverture | Appel | Usage |
|--------|-----------|-------|-------|
| **Open-Meteo** | Mondiale | `api.open-meteo.com/v1/forecast` | Baseline, tous trips |
| **NWS** | USA uniquement | `api.weather.gov/points/{lat},{lon}` → forecast | Overlay précis (7j) |

### Rendu inline (carte cliquable dans Tab Jour)
- Icône WMO + description français
- Température min → max
- Stats : pluie%, vent, UV (code couleur)
- "Tap pour détails"

### Modal détaillée (tap)
1. En-tête : icône + temp + description
2. Stats grid : précipitations, vent, UV, lever/coucher soleil
3. Prévisions horaires : scroll horizontal 6h→22h
4. Précipitations mm/h : barres colorées
5. Prévisions 3 jours
6. Conseil vestimentaire (généré dynamiquement)

### Cache

| Scope | Stockage | TTL |
|-------|----------|-----|
| Route batch | `localStorage` `wx-route-{tripId}` | 3h |
| Day inline | `Weather.cache{}` (mémoire) | Session |
| Day detail | `Weather.detailCache{}` (mémoire) | Session |

---

## 12. Système WiFi Connect

### Status : 🆕 À implémenter

### Composant : `WifiConnect.render(hotel)` + lib `qrcode-svg.min.js`

### Modèle de données

```typescript
// Dans hotels[id]
{
  wifi?: {
    ssid: string,     // "chezfrancois"
    pass: string,     // "purplestar059"
    auth?: string,    // "WPA" (défaut) | "WEP" | "nopass"
  }
}
```

### Rendu dans HotelCard
Si `hotel.wifi` existe :

```html
<div class="wifi-section">
  <div class="wifi-title">📶 WiFi — {ssid}</div>
  <div class="wifi-qr">[SVG QR Code 104×104px]</div>
  <div class="wifi-pass">Mot de passe : <code>{pass}</code></div>
  <button onclick="wifiConnect('{ssid}', '{pass}')">📱 Se connecter au WiFi</button>
</div>
```

### QR Code
- Format string : `WIFI:T:{auth};S:{ssid};P:{pass};;`
- Lib : `qrcode-svg` (MIT, ~7KB minifié), inline SVG
- Config : taille 104×104, pad 2, ECL Medium, noir sur blanc
- Généré via `setTimeout(50ms)` après render DOM

### Bouton "Se connecter"
1. Copie `pass` au clipboard (`navigator.clipboard.writeText`)
2. Affiche toast : "✅ Mot de passe {pass} copié ! Réglages → WiFi → {ssid} → Coller"
3. Toast auto-dismiss 4s

---

## 13. Système Quiz (optionnel)

### Activation
- `trip.features.quiz === true` → module chargé
- `trip.features.quiz` absent/false → rien du tout

### Composant : `Quiz.render(container, tripData)` (🆕)

### Modèle de données

```typescript
// Dans tripData (top-level)
quiz?: {
  unlockDate?:  string,    // ISO date — quiz verrouillé avant cette date
  levels: {
    [key: string]: { label: string, points: number }
  },
  days: QuizDay[],
}

QuizDay = {
  day:       number,
  label:     string,
  questions: QuizQuestion[],
}

QuizQuestion = {
  text:        string,
  options:     string[],    // 4 choix
  correct:     number,      // index 0-based
  explanation: string,
  link?:       string,
  level:       string,      // clé dans quiz.levels
}
```

### Joueurs
- Déduits de `trip.travelers[]`
- Voyageur avec `leaveDate` avant le jour en cours → bouton masqué

### Mécanique complète (portée de voyage-app)
- Navigation par jour (‹ J1 ›) + day picker grille
- Barre de progression X/N
- 4 options, correction immédiate (vert/rouge/dim)
- Explication + lien
- "Qui a trouvé ?" si correct → boutons voyageurs toggle
- Streak bonus : 3 consécutives = +2 pts (toast 🔥)
- Swipe horizontal entre questions
- Scoreboard 🏆 (cumulé + par jour)
- Export/Import JSON
- Day complete (scores + classement)

### Teaser (verrouillage temporel)
- Si `quiz.unlockDate` et `now < unlockDate` → overlay blur + countdown
- Déverrouillé si `trip.users[userId].quizAlwaysUnlock: true`

### Persistence (localStorage only, pas sync backend)

| Clé | Description |
|-----|------------|
| `tk-quiz-scores-{tripId}` | Scores cumulés |
| `tk-quiz-day-{tripId}` | Scores par jour |
| `tk-quiz-answered-{tripId}` | Réponses données |
| `tk-quiz-streaks-{tripId}` | Streaks en cours |
| `tk-quiz-pos-{tripId}` | Position courante (day, idx) |

---

## 14. Restaurants

### ✅ Existe dans TripKit — complet

Rendu dans `DailyView` :
1. Breakfast compact
2. Lunch compact
3. Restaurant principal (icône, nom, badges réservé/étoiles/prix, note, Maps)
4. Alternatives (section secondaire)

Pas de changement requis. Données dans `tripData.restaurants[dayNum]`.

---

## 15. Day Cards

### ✅ Existe dans TripKit — 5 types

| Type | ✅ | Changement |
|------|---|-----------|
| `rental-pickup` | ✅ | — |
| `rental-return` | ✅ | 🆕 Ajouter lien CarPlay |
| `info` | ✅ | — |
| `warning` | ✅ | — |
| `ticket` | ✅ | — |

### CarPlay link
```javascript
// Dans rental-return, si d.carplayUrl existe :
if (d.carplayUrl) {
  html += `<a href="${esc(d.carplayUrl)}" class="hotel-link-btn">🚗 CarPlay</a>`;
}
// Format : comgooglemaps://?daddr=ADRESSE (pas de saddr = utilise GPS)
```

---

## 16. Conférence/Événements

### ✅ Existe dans TripKit — complet

Switcher par participant, badges colorés par type, compteur sessions.
Pas de changement requis.

---

## 17. Fuseaux horaires

### Résolution
- `location.tz` = IANA timezone string (ex: `"America/Denver"`)
- `DayHelpers.enrich()` copie dans `day.geo.tz`
- Les composants météo utilisent `day.geo.tz` pour les heures locales

### Alertes timezone (dans le seed)
- Gérées via `timeline` entries de type `warning` ou `info`
- Exemple : `{ t: "⚠️", d: "Changement de fuseau : Mountain → Eastern", type: "info" }`
- Pas de détection automatique (trop complexe, mieux géré éditorialement)

---

## 18. Personnalisation utilisateur

### Identification

```javascript
// Nouvelle méthode (remplace GitHub OAuth) :
const userId = Store.get('tk-user-id');       // Set par /api/auth/me
const userCfg = trip.users?.[userId] || null; // Config dans le seed
```

### `trip.users[userId]`

| Champ | Type | Effet |
|-------|------|-------|
| `city` | string | Hero image Day 0 personnalisée |
| `locationId` | string | Météo Day 0 sur ville de départ |
| `defaultConf` | string | Tab conférence par défaut ("rene", "laurine") |
| `startDay` | number | Jour par défaut pour late joiners |
| `skipDays` | number[] | Jours masqués (ex: [0] = pas de jour prépa) |
| `quizAlwaysUnlock` | boolean | Déverrouille le quiz avant la date |

### DayResolver — Navigation par défaut

| État | Jour affiché |
|------|-------------|
| **Avant** | Day 0 (late joiners → leur `startDay`) |
| **Pendant** | Jour courant calculé depuis `trip.startDate` |
| **Après** | Dernier jour |

✅ Existe déjà dans TripKit, fonctionnel.

---

## 19. PWA & Service Worker

### Manifest
```json
{
  "name": "TripKit 🌍",
  "short_name": "TripKit",
  "start_url": "/index.html",
  "display": "standalone",
  "orientation": "portrait",
  "theme_color": "#0d1117",
  "background_color": "#0d1117"
}
```

### Service Worker (`sw.js`)
- ✅ Existe — Network-first avec cache fallback
- Update check toutes les 30 min
- Update banner quand nouveau SW waiting
- Exception : version check jamais caché

Pas de changement requis.

---

## 20. Listes (Checklists & Courses)

### ✅ Existe dans TripKit — déjà très complet

| Feature | Status |
|---------|--------|
| Sections collapsibles | ✅ |
| Items checkable | ✅ |
| Barre de progression | ✅ |
| Items custom | ✅ |
| Hide/restore items | ✅ |
| Export/Import JSON | ✅ |
| Sync backend bidirectionnel | ✅ |
| Store card (shopping) | ✅ |

### Enrichissements à porter

| Feature | Détail |
|---------|--------|
| **Multi-profil individualisé** | Chaque voyageur a SA checklist liée à son `userId` (from `/api/auth/me`). Les coches de René ne touchent pas celles d'Alex. Modèle : `list.profiles: [{userId, label, items}]` |
| **Auto-update** | Poll `checklist-version.json` toutes les 2min → reload si nouvelle version |
| **Print-friendly** | CSS `@media print` pour impression A4 propre |

---

## 21. UX & Interactions

### Animations CSS (portées de voyage-app)

| Animation | Effet | Fichier |
|-----------|-------|---------|
| `fadeIn` | opacity 0→1, translateY 6px→0 (0.25s) | ✅ Existe dans theme.css |
| `slideLeft` | translateX 40px→0 (0.25s) | 🆕 À ajouter |
| `slideRight` | translateX -40px→0 (0.25s) | 🆕 À ajouter |
| Quiz slide transitions | entering/leaving left/right | 🆕 À ajouter |

### Gestures tactiles

| Zone | Geste | Action | Status |
|------|-------|--------|--------|
| Tab Jour | Swipe H (>60px) | Jour ±1 | ✅ Existe |
| Tab Culture | Swipe H (>60px) | Carnet ±1 | 🆕 À ajouter |
| Quiz | Swipe H (>60px) | Question ±1 | 🆕 À ajouter |

### Toast System
- ✅ Existe — Container fixe, auto-dismiss 2.5s

### Liens CarPlay (🆕)
- Format : `comgooglemaps://?daddr=ADRESSE` (sans saddr = GPS actuel)
- Utilisé dans : hotel cards, rental-return cards, day map link secondaire

---

## 22. Backend API

### Endpoints existants (✅)

| Méthode | Path | Description |
|---------|------|-------------|
| GET | `/api/trips` | Liste trips |
| GET | `/api/trips/:id/version` | Version check (50 bytes, 3s) |
| GET | `/api/trips/:id/seed` | Données complètes |
| PUT | `/api/trips/:id` | Update métadonnées |
| PUT | `/api/trips/:id/days/:num` | Upsert jour |
| PATCH | `/api/trips/:id/lists/:lid/sync` | Sync checklist (per-user) |

### 🛡️ Sécurité API

**TOUS les endpoints `/api/*` exigent un Bearer token valide.** Aucune exception.

```
Authorization: Bearer <trip_token|user_token|admin_token>
```

- Token absent ou invalide → `401 Unauthorized`
- Token trip valide mais mauvais tripId → `403 Forbidden`
- Token user donne accès lecture + écriture de SES check states uniquement
- Token admin donne accès écriture complet (seed import, création tokens)

### 📋 Checklist Sync Protocol (per-user, item-level LWW)

**Principe :** Chaque voyageur a son propre état de coches. Pas de partage, pas d'écrasement.

#### Modèle de données

```
check_states table:
  (list_id, user_id, item_id) → PRIMARY KEY
  checked: boolean
  updated_at: ISO-8601 timestamp (ms precision)
```

#### PATCH `/api/trips/:id/lists/:lid/sync`

```json
// Request (client → backend)
{
  "userId": "rene",
  "states": [
    { "itemId": "passeport", "checked": true, "at": "2026-04-10T14:32:00.123Z" },
    { "itemId": "maillot", "checked": true, "at": "2026-04-10T14:33:05.456Z" }
  ]
}

// Response (backend → client) — renvoie l'état complet du user
{
  "userId": "rene",
  "states": [
    { "itemId": "passeport", "checked": true, "at": "2026-04-10T14:32:00.123Z" },
    { "itemId": "maillot", "checked": true, "at": "2026-04-10T14:33:05.456Z" },
    { "itemId": "adaptateur", "checked": false, "at": "2026-04-09T10:00:00.000Z" }
  ]
}
```

#### Règles de merge

1. **Granularité = item individuel.** Chaque `(userId, itemId)` est mergé indépendamment
2. **LWW (Last Writer Wins) par item :** si `client.at > server.at` → client gagne, sinon server gagne
3. **Jamais de bulk overwrite** — un PATCH ne remplace pas tout, il merge item par item
4. **userId vient du token** (vérifié côté backend), pas du body — un user ne peut pas modifier les coches d'un autre
5. **Réponse = état complet** pour que le client puisse se resync après offline

#### Frontend flow

```javascript
// Sur chaque coche/décoche :
// 1. Écrire en localStorage immédiatement (UX instant)
// 2. Debounce 2s puis PATCH /sync avec les items modifiés
// 3. Sur réponse : merger l'état serveur dans localStorage (LWW)
// 4. Sur conflit (server plus récent) : mettre à jour la UI

// Après retour online :
// PATCH /sync avec TOUS les items locaux → serveur renvoie la vérité
```

#### Isolation multi-profil

- Le sélecteur voyageur en haut de la checklist affiche les items filtrés
- Chaque voyageur voit SES coches, jamais celles des autres
- Items partagés ("documents maison", "courses") = liste séparée avec profil `shared`
- L'admin peut voir toutes les coches (dashboard progression)

### Nouveaux endpoints (🆕)

| Méthode | Path | Description |
|---------|------|-------------|
| POST | `/api/auth/token` | Créer un token (admin only) |
| GET | `/api/auth/me` | Profil associé au token courant |

### Auth middleware (changement)
- Actuel : Bearer token unique (`TRIPKIT_API_TOKEN` env var)
- Nouveau : table `tokens` en SQLite, types trip/user/admin, vérification par lookup

---

## 23. Seed & Import

### Format seed USA 2026 (validation)

Le premier seed importé dans TripKit sera **exactement les données voyage-app**, restructurées :

```javascript
var SEED_USA_2026 = {
  trip: {
    id: "usa-2026",
    name: "Juju's Adventures — USA 2026",
    emoji: "🇺🇸",
    startDate: "2026-04-16",
    endDate: "2026-05-06",
    travelers: [
      { name: "René", role: "owner" },
      { name: "Nicole" },
      { name: "Alexandre" },
      { name: "Dinah" },
      { name: "Laurine", leaveDate: "2026-04-27" },
    ],
    phases: [
      { name: "Road Trip", label: "Phase 1 — 5 voyageurs", range: [0, 10] },
      { name: "Sans Laurine", label: "Phase 2 — 4 voyageurs", range: [11, 14] },
      { name: "Montréal", label: "Phase 3 — René & Nicole", range: [15, 19] },
      { name: "Retour", label: "Retour", range: [20, 20] },
    ],
    features: { quiz: true },
    routeUrl: "https://www.google.com/maps/dir/...",
    users: {
      "rene":      { city: "Nice", locationId: "nice", defaultConf: "rene" },
      "nicole":    { city: "Nice", locationId: "nice" },
      "alexandre": { city: "Paris", locationId: "paris" },
      "dinah":     { city: "Paris", locationId: "paris" },
      "laurine":   { city: "Nice", locationId: "nice", defaultConf: "laurine" },
      "baptiste":  { city: "Montréal", locationId: "montreal", startDay: 15, skipDays: [0] },
      "emma":      { city: "Montréal", locationId: "montreal", startDay: 15, skipDays: [0] },
    },
  },
  days: [ /* 21 jours, refs only, zéro inline hotel/geo/date */ ],
  hotels: {
    "shep-s-miners-inn": { name: "Shep's Miners Inn", addr: "...", ... },
    "yavapai-lodge": { ... },
    // ... 12 hôtels
  },
  locations: {
    "nice": { lat: 43.70, lon: 7.27, tz: "Europe/Paris" },
    "las-vegas": { lat: 36.17, lon: -115.14, tz: "America/Los_Angeles" },
    // ... ~15 locations
  },
  restaurants: { "1": { main: {...}, alts: [...] }, /* ... 19 jours */ },
  culture: [
    { id: "road-trip", title: "🇺🇸 Road Trip", zones: [...] },
    { id: "montreal", title: "🍁 Montréal", zones: [...] },
  ],
  lists: {
    "checklist-usa2026": { type: "packing", title: "🧳 Valises USA", sections: [...] },
    "courses-day1": { type: "shopping", title: "🛒 Courses Vons", store: {...}, sections: [...] },
    "courses-day3": { type: "shopping", title: "🛒 Courses Safeway", ... },
  },
  quiz: {
    unlockDate: "2026-04-18T07:00:00-07:00",
    levels: {
      easy: { label: "⭐ Facile", points: 1 },
      medium: { label: "⭐⭐ Moyen", points: 2 },
      expert: { label: "🔥 Expert", points: 3 },
      wtaf: { label: "🤯 WTAF", points: 5 },
      cinema: { label: "🎬 Ciné", points: 2 },
    },
    days: [ /* 14 jours × 10 questions */ ],
  },
};
```

### Import

```bash
node seed-import.js --api https://tripkit.example.com --token $ADMIN_TOKEN --seed usa-2026.js
```

### Audit checklist (10 points de DATA-MODEL.md)
Inchangée. À exécuter sur chaque seed avant import.

---

## 24. Tests

### Framework : Playwright

### Tests existants
```bash
cd tripkit-frontend && npx playwright test
```

### Tests à ajouter pour les features portées

| Test | Description |
|------|------------|
| Auth token URL | `?t=TOKEN` → stocké en localStorage |
| Auth me | Mock `/api/auth/me` → userId résolu |
| Weather generic | `trip.startDate` utilisé (plus de hardcoding) |
| WiFi QR | Si hotel.wifi → QR SVG rendu |
| WiFi copy | Tap "Se connecter" → clipboard |
| Quiz render | Si `features.quiz` → quiz affiché |
| Quiz hidden | Si pas `features.quiz` → pas de quiz |
| Quiz answer | Tap option → correction |
| Quiz score | Attribution → score mis à jour |
| Culture multi | 2 carnets → swipe switch |
| CarPlay link | Bouton CarPlay → `comgooglemaps://` |
| Countdown | Avant trip → J-X affiché |
| Route weather | Météo batch chargée par location |

---

## 25. Gap analysis — Ce qu'il reste à porter

> **Dernière MAJ :** 2026-05-01 (v2.5.0 released)

### Récapitulatif effort

| Feature | Fichier cible | Complexité | Priorité | Status |
|---------|--------------|-----------|----------|--------|
| **Fix weather.js TRIP_START** | `weather.js` | 🟢 Trivial | 🔴 Critique | ✅ v2.3.0 |
| **CarPlay links** | `daily-view.js` + `hotel-card.js` | 🟢 Faible | 🟢 Haute | ✅ v2.3.0 |
| **Responsive layout** | `theme.css` | 🟢 Faible | 🟢 Haute | ✅ v2.3.0 |
| **Special day cards** | `daily-view.js` | 🟡 Moyenne | 🟢 Haute | ✅ v2.3.0 |
| **Hotel access codes** | `hotel-card.js` | 🟢 Faible | 🟢 Haute | ✅ v2.3.0 |
| **Culture badges timeline** | `timeline.js` + overlay | 🟡 Moyenne | 🟡 Moyenne | ✅ v2.3.0 |
| **Version display** | `app.js` + `version.json` | 🟢 Trivial | 🟢 Haute | ✅ v2.3.0 |
| **WiFi Connect** | `hotel-card.js` | 🟢 Faible | 🟢 Haute | ✅ v2.4.0 |
| **Countdown J-X** | `daily-view.js` | 🟢 Faible | 🟡 Moyenne | ✅ v2.4.0 |
| **mapUrl Day 15+19** | `usa-2026.js` | 🟢 Trivial | 🟡 Moyenne | ✅ v2.4.0 |
| **Route map screenshots** | `daily-view.js` + 11 images | 🟢 Faible | 🟡 Moyenne | ✅ v2.5.0 |
| **Checklist valise** | `checklist.html` (standalone) | 🟡 Moyenne | 🟢 Haute | ✅ v2.5.0 |
| **Quiz complet** | `quiz.html` + `questions.json` | 🔴 Haute | 🟡 Moyenne | ✅ v2.5.0 |
| **Weather modal complet** | `weather.js` (hourly+3day+dress) | 🟡 Moyenne | 🟡 Moyenne | ✅ v2.3.0 |
| **Auth token par lien** | `api.js` + backend | 🟡 Moyenne | 🟢 Haute | 🔲 TODO (backend) |
| **Culture multi-carnet** | `culture-view.js` | 🟡 Moyenne | 🟡 Moyenne | 🔲 TODO |
| **Poem toggle** | `daily-view.js` | 🟢 Faible | 🟡 Moyenne | 🔲 TODO |
| **List multi-profil** | `list.js` | 🟡 Moyenne | 🔵 Basse | 🔲 TODO |
| **Animations slide** | `theme.css` | 🟢 Faible | 🔵 Basse | 🔲 TODO |

### Prochaines priorités (post v2.5.0)

```
Phase 3 — Auth + Enrichissements UI
  ① Auth token par lien (backend requis — Baptiste)
  ② Culture multi-carnet + swipe
  ③ Poem toggle

Phase 4 — Polish
  ④ Animations slide transitions
  ⑤ List multi-profil + auto-update
```

---

*Spécifications TripKit v2 — Léa 🌙*  
*Basé sur : voyage-app (2 700 lignes), tripkit-frontend (~8 000 lignes), tripkit-backend (Go/SQLite)*  
*Validation : seed USA 2026 comme premier jeu de données*  
*Release : v2.5.0 (2026-05-01) — ghcr.io/rjullien/tripkit-frontend*
