# Design: Onglet Réservations + QA Cross-Check Cards/Sections

> **Statut**: Implemented (FE PR #7 merged 2026-08-08) — kept as design archive  
> **Auteur**: Kiro (+ corrections Léo/GLM 2026-08-02, finalisation 2026-08-08)  
> **Repos concernés**: `tripkit-frontend`, `tripkit-seeds`  
> **Review**: `docs/REVIEW-leo-glm-pr3.md` — 3 points rouges **intégréés ci-dessous**

---

## 1. Problème

### 1.1 Données structurées non injectées (ferry, events)

`seed-import.cjs` injecte dans `trip.data` : hotels, locations, restaurants, culture, flights, carRental.
Mais **ferry** et **events** sont ignorés. Ces sections existent dans les seeds (ex: `quebec-2026.js`) mais ne sont jamais stockées côté backend. Les informations ne sont visibles qu'à travers les `day.cards[]` / `day.booking` créés manuellement.

Conséquence : si on met à jour `SEED.ferry.total` sans modifier la card correspondante dans le bon jour, le voyageur voit des données obsolètes.

### 1.2 Onglet Hotels trop limité

L'onglet "Hotels" ne montre que les hébergements. Or un voyageur a besoin de retrouver rapidement TOUTES ses réservations confirmées :

- **Hotels** (10 dans quebec-2026)
- **Vols** (aller + retour)
- **Location voiture** (Avis)
- **Traversier** (Les Escoumins → Trois-Pistoles)
- **Événements** (Cirque de la Pointe-Sèche)

### 1.3 QA ne cross-check pas cards vs sections structurées

`skills/tripkit-qa/scripts/validate.js` vérifie que les champs requis sont présents dans `SEED.ferry` et `SEED.events`, mais ne vérifie pas :
1. Qu'il EXISTE une card / `booking` dans le bon jour qui affiche cette info
2. Que les données CORRESPONDENT à la section structurée (même date, ref, prix)

---

## 2. Solution proposée

### Feature A : QA Cross-check cards ↔ sections structurées

Ajouter dans `tripkit-seeds/skills/tripkit-qa/scripts/validate.js` (et miroir éventuel dans `seed-qa.py` via `tools-sync` si pertinent) une section :

```
=== CROSS-CHECK CARDS ===
```

#### 2.A.1 Calcul du jour attendu (1-based)

Les seeds utilisent `day.day` **1-based** (`daily-view.js` : display number).  
Formule :

```
dayNum = daysBetween(trip.startDate, section.date) + 1
```

Ex. quebec-2026 : startDate `2026-08-14`, ferry `2026-08-23` → **day 10**  
(le day 9 peut contenir une card `info` d'aperçu — le match principal est sur le jour calculé).

#### 2.A.2 Table de correspondance EXACTE (champs divergents)

Les noms divergent entre section structurée et card/`booking`. Ne **jamais** comparer homonyme à homonyme sans cette table.

**Section → chemin dans le jour :**

| Section | Emplacement attendu dans `days[]` | Comment matcher |
|---|---|---|
| `SEED.ferry` | `day.booking` avec `booking.type === "ferry"` **ou** `day.cards[]` avec `type` ∈ `{ferry, info}` dont le contenu cite la ref | Priorité : `booking.type === "ferry"` |
| `SEED.events[id]` | `day.cards[]` avec `type === "ticket"` | Match si `data.ref` / `title` contient `orderRef` ou `name` |
| `SEED.carRental` | `day.cards[]` avec `type === "rental-pickup"` | Sur le jour de `pickup.date` |
| `SEED.flights.outbound` / `.return` | `day.cards[]` / `day.departures` / highlights | Match sur `pnr` |

**Champs à comparer (après normalisation) :**

| Section | Champ section | Champ card / booking | Notes |
|---|---|---|---|
| ferry | `orderRef` | `booking.orderNumber` | quebec: `"316243"` ↔ `"316243"` |
| ferry | `total` | `booking.totalPrice` | Normaliser `148,50` / `148.50` / espaces / devise |
| ferry | `date` | `booking.date` | ISO exact |
| events | `orderRef` | `card.data.ref` | Souvent texte libre `"Commande #88277 — …"` → **substring** |
| events | `total` | `card.data.totalPrice` **ou** extraction depuis `card.data.text` | quebec ticket n'a **pas** `totalPrice` isolé — parser le montant dans `text` |
| events | `date` | jour calculé vs `event.date` | La card ticket peut ne pas porter `date` |
| carRental | `bookingRef` | `card.data.confirmation` | quebec: `"355160633 (Avis #…)"` → **prefix / substring** |
| flights | `pnr` | card / departure `pnr` | Substring OK |

```javascript
// Pseudo-code canonique pour l'implémentation QA
const FIELD_MAP = {
  ferry: {
    find: (day) => day.booking?.type === 'ferry' ? day.booking
                 : (day.cards || []).find(c => c.type === 'ferry'),
    ref:   { section: 'orderRef', card: 'orderNumber' },
    total: { section: 'total',    card: 'totalPrice' },
    date:  { section: 'date',     card: 'date' },
  },
  events: {
    find: (day, evt) => (day.cards || []).find(c =>
      c.type === 'ticket' && (
        String(c.data?.ref || '').includes(evt.orderRef) ||
        String(c.title || '').includes(evt.name)
      )
    ),
    ref:   { section: 'orderRef', card: 'data.ref', match: 'substring' },
    total: { section: 'total',    card: 'data.totalPrice|data.text', match: 'normalized-money' },
  },
  carRental: {
    find: (day) => (day.cards || []).find(c => c.type === 'rental-pickup'),
    ref:   { section: 'bookingRef', card: 'data.confirmation', match: 'substring' },
  },
  flights: {
    ref: { section: 'pnr', card: 'pnr', match: 'substring' },
  },
};
```

**Guards :**
- `if (!card?.type && !day.booking) continue;` — ignorer cards sans type
- Normaliser les montants avant compare (strip devise, unifier `,`/`.`, trim espaces)
- Divergences ref/prix → **WARNING** (pas ERROR) ; absence totale de card/booking au jour attendu → **ERROR**

#### 2.A.3 Logique

1. Pour `ferry` : `dayNum = daysBetween(start, ferry.date) + 1` → chercher `booking.type==="ferry"` sur ce jour
2. Pour chaque `events[id]` : idem avec `event.date` + card `ticket`
3. Pour `carRental` : jour de `pickup.date`
4. WARNING si ref/prix divergent après normalisation ; ERROR si introuvable

---

### Feature B : Onglet Réservations (remplace Hotels)

#### 2.1 Injection ferry + events dans seed-import.cjs

```javascript
const tripData = {
  // ... existant ...
  flights: SEED.flights || null,
  carRental: SEED.carRental || null,
  ferry: SEED.ferry || null,        // NOUVEAU
  events: SEED.events || null,      // NOUVEAU
};
```

**Obligatoire aussi** : ajouter `ferry` et `events` à `TRIP_META_FIELDS` dans `js/seed-merge.js`  
(sinon même régression que `mapHtml`/`meteoHtml` en v2.27.34 — champs droppés au `TripSelector.select()`).

**Backend** : aucune modification. `trip.data` est un JSON blob flexible.

#### 2.2 Renommage de l'onglet

| Avant | Après |
|-------|-------|
| `tab-hotels` / "Hotels" | `tab-hotels` / "Réservations" |
| Icône: `🏨` | Icône: `📋` |
| Label: "Hotels" | Label: **"Résa"** |

Le `data-tab` reste `hotels` pour ne pas casser les deep links (`#hotels`).

#### 2.3 Empty state & label

- Toujours afficher le label **"Résa"** (pas de bascule dynamique Hotels/Résa).
- Chaque section non-hôtel est **conditionnelle** : absente du DOM si la donnée n'existe pas / objet vide.
- Si le trip n'a que des hôtels : l'onglet montre uniquement la section Hébergements — reste fonctionnel.
- Events : trier par date  
  `Object.entries(events).sort(([,a],[,b]) => String(a.date).localeCompare(String(b.date)))`

#### 2.4 Ordre des sections (décision review)

Pas d'ordre chronologique global (vols aller/retour encadrent tout le voyage ; hôtels sont une liste longue).  
**Grouper par type**, dates visibles dans chaque en-tête de carte :

```
📋 Réservations
├── ✈️ Vols                    (si flights)     — dates sur chaque carte
├── 🚗 Location voiture        (si carRental)   — pickup → return
├── ⛴️ Traversier              (si ferry)       — date/heure
├── 🎪 Événements              (si events)      — triés par date
└── 🏨 Hébergements            (toujours si hotels/days) — ordre chronologique existant
```

#### 2.5 Composants

Créer `js/components/bookings-view.js` :

- Reçoit `tripData` complet
- Rend chaque section conditionnellement
- Réutilise `HotelCard.render()` pour les hôtels
- Un seul fichier, fonctions internes :  
  `renderFlightsSection`, `renderCarRentalSection`, `renderFerrySection`, `renderEventsSection`, `renderHotelsSection`

#### 2.6 Structure HTML d'une card réservation (hors hôtel)

```html
<div class="booking-card">
  <div class="booking-header">
    <span class="booking-icon">✈️</span>
    <span class="booking-title">Vol aller — Air France</span>
  </div>
  <div class="booking-meta">
    <div>📅 15 août 2026</div>
    <div>🔖 PNR: <strong>ABC123</strong></div>
    <div>💶 1 250,00 EUR</div>
  </div>
  <!-- Tags : même pattern que hotel amenities + annulation -->
  <div class="booking-tags">
    <span class="badge badge-accent">Vol</span>
    <span class="badge badge-green">🟢 Flexible</span>
    <span class="badge badge-green">Bagage cabine inclus</span>
  </div>
  <div class="booking-details">
    <!-- segments, horaires, etc. -->
  </div>
</div>
```

#### 2.7 Tags (obligatoire — même language que hotels / checklists)

Pas de nouveau design system. On **réutilise** `.badge` / `.badge-green|red|orange|accent` de `theme.css`, comme `hotel-card.js` pour `amenities` et comme la convention QA `🟢🔴⚠️` des annulations hôtels.

Chaque carte Résa affiche une rangée de chips **sous** `.booking-meta` :

| Couche | Source | Exemple | Classe |
|---|---|---|---|
| 1. Type | dérivé (toujours) | `Vol` / `Voiture` / `Ferry` / `Event` | `.badge.badge-accent` |
| 2. Annulation | `cancellation` (emoji lead) | `🟢 Flexible` / `🔴 Non remboursable` / `⚠️ À vérifier` | green / red / orange |
| 3. Contenu | `tags: string[]` (seed) | `Prépayé`, `1re rangée`, `Plein fait` | `.badge.badge-green` |

**Règles :**
- Champ seed canonique : **`tags: string[]`** (comme `hotels[].amenities` — pas de gros bloc texte)
- `cancellation` **obligatoire** pour ferry / events / carRental (même règles hotels) :
  - `🟢` = annulation / modif possible (avec date limite dans le texte)
  - `🔴` = non remboursable
  - `⚠️` = à vérifier / partiel
- Le frontend **parse l'emoji lead** de `cancellation` → classe badge ; le reste du texte part en `.booking-details` ou tooltip court sur le badge (`🟢 Flexible`)
- Tags dérivés **autorisés en plus** (pas à la place de `tags[]`) si le champ structuré est clair :
  - ferry avec `balance` non vide → chip `Solde au quai`
  - carRental `fuelPolicy` contenant « plein » → chip `Plein fait`
  - event avec `seats` → chip `1re rangée` seulement si déjà dans `tags` (éviter la magie)
- **Hôtels dans l'onglet Résa** : enfin afficher aussi le badge annulation (aujourd'hui `cancellation` est en seed/QA mais **jamais rendu** dans `hotel-card.js` — à corriger dans Task 2/3, soit via `HotelCard`, soit wrapper Résa)

**Exemple quebec-2026 (seed à enrichir en Task 4b) :**

```javascript
ferry: {
  // ... champs existants ...
  cancellation: "🟢 Remboursable >24h (moins 3-4% frais). <24h = dépôt perdu.",
  tags: ["Voiture + 3 adultes", "Solde au quai"],
},
events: {
  "cirque-pointe-seche": {
    // ...
    cancellation: "🔴 Non remboursable. Modif ≤5j (5$/billet).",
    tags: ["1re rangée", "Expérience Pure", "3 billets"],
  }
},
carRental: {
  // ...
  cancellation: "⚠️ Voir conditions Avis / prépayé",
  tags: ["SUV", "Km illimité", "Plein fait"],
}
```

**Anti-patterns (interdits) :**
- Coller les tags dans `note` en prose (pattern checklist `item.note` = sous-texte, pas un chip)
- Inventer SafeText / nouveau composant badge
- Badges flottants / stickers sur une image hero

#### 2.8 CSS

Dans `css/theme.css` :
- `.booking-card` (similaire à `.hotel-card`)
- `.booking-header`, `.booking-meta`, `.booking-details`, `.booking-tags`
- `.booking-section-title`
- **Réutiliser** `.badge`, `.badge-green`, `.badge-red`, `.badge-orange`, `.badge-accent` — pas de nouvelles couleurs
---

## 3. Data Model Changes

### 3.1 trip.data (backend JSON blob)

```typescript
{
  // ... existants (hotels, locations, restaurants, culture, flights, carRental) ...
  ferry?: {
    route: string,
    orderRef: string,
    date: string,       // ISO date
    time: string,
    vehicle?: string,
    total: string,
    deposit?: string,
    balance?: string,
    note?: string,
    cancellation: string,   // OBLIGATOIRE — préfixe 🟢|🔴|⚠️
    tags?: string[],        // chips UI (comme hotels.amenities)
  },
  events?: {
    [id: string]: {
      name: string,
      orderRef: string,
      date: string,     // ISO date
      time?: string,
      items?: EventItem[],
      tickets?: string[],
      total: string,
      phone?: string,
      cancellation: string, // OBLIGATOIRE — préfixe 🟢|🔴|⚠️
      tags?: string[],
    }
  },
  // carRental / flights : mêmes champs optionnels cancellation + tags
}
```

### 3.2 Aucun changement backend

Le backend Go stocke `trip.data` comme JSON blob (`datatypes.JSON` / GORM). Pas de migration.

### 3.3 Compatibilité

- Trips sans `ferry`/`events` : sections absentes, onglet OK
- Trips déjà importés : re-import avec le nouveau `seed-import.cjs`
- Frontend conditionnel : `if (tripData.ferry) { ... }`
- `SeedMerge.TRIP_META_FIELDS` doit lister `ferry` et `events`

---

## 4. Architecture des composants

```
index.html
  └── js/app.js
        ├── renderBookings(tripData)  [ex-renderHotels]
        │     └── BookingsView.render(containerId, tripData)
        │           ├── renderFlightsSection(tripData.flights)
        │           ├── renderCarRentalSection(tripData.carRental)
        │           ├── renderFerrySection(tripData.ferry)
        │           ├── renderEventsSection(tripData.events)  // sorted by date
        │           └── renderHotelsSection(days, hotels)
        └── ...

  └── js/components/bookings-view.js  [NOUVEAU — inclut renderBookingTags]
  └── js/components/hotel-card.js     [AFFICHER badge cancellation 🟢🔴⚠️]
  └── js/seed-merge.js               [AJOUTER ferry, events à TRIP_META_FIELDS]

tripkit-seeds/
  └── skills/tripkit-qa/scripts/validate.js
        └── Section "=== CROSS-CHECK CARDS ===" [NOUVEAU]
```

---

## 5. Task Breakdown

### Task 1 : seed-import.cjs + seed-merge.js
**Repo** : `tripkit-frontend`  
**Fichiers** : `seed-import.cjs`, `js/seed-merge.js`, `tests/seed-merge.test.cjs`  
**Changements** :
- Injecter `ferry` / `events` dans `tripData`
- Ajouter `'ferry'`, `'events'` à `TRIP_META_FIELDS`
- Étendre les tests seed-merge (même garde-fou que mapHtml)  
**Dépendances** : aucune  
**Vérif** : import quebec-2026 → `trip.data.ferry` / `.events` présents ; tests unit OK

### Task 2 : Créer bookings-view.js (+ tags)
**Repo** : `tripkit-frontend`  
**Fichier** : `js/components/bookings-view.js` (+ petit fix `hotel-card.js` annulation)  
**Changements** :
- Rendu sections conditionnelles
- Helper `renderBookingTags({ type, cancellation, tags })` → rangée `.booking-tags` avec `.badge*`
- Afficher badge annulation aussi sur les hôtels (parse 🟢🔴⚠️)
**Dépendances** : Task 1  
**Vérif** : chips visibles sur vol/voiture/ferry/event/hôtel ; trip hotels-only OK

### Task 3 : Renommer l'onglet et brancher
**Repo** : `tripkit-frontend`  
**Fichiers** : `index.html`, `js/app.js`, `css/theme.css`, `sw.js` (precache + CACHE_NAME)  
**Changements** :
- Label nav "Hotels" → "Résa", icône → `📋`
- `renderHotels` délègue à `BookingsView.render()`
- Script tag + CSS (`.booking-card`, `.booking-tags` ; badges déjà là)
- Bump SW cache  
**Dépendances** : Task 2  
**Vérif** : onglet "Résa", deep link `#hotels` intact, Playwright `tabs` / `hotels` mis à jour si besoin

### Task 4 : QA Cross-check + tags annulation
**Repo** : `tripkit-seeds`  
**Fichiers** : `skills/tripkit-qa/scripts/validate.js`, seeds (`quebec-2026.js`, …)  
**Changements** :
- Section CROSS-CHECK avec `FIELD_MAP`
- QA : `ferry` / `events` / `carRental` doivent avoir `cancellation` préfixé `🟢|🔴|⚠️` (même règle hotels)
- QA warning si `tags` absent ou non-array sur une résa structurée
- Enrichir quebec (et autres) : `cancellation` + `tags[]` clean  
**Dépendances** : aucune pour le validateur ; seeds en parallèle de Task 2  
**Vérif** : validate.js vert sur quebec ; warning si on retire le 🟢 d'un ferry

### Task 5 : DATA-MODEL.md + SEED-GUIDE
**Repo** : `tripkit-frontend` (+ mention miroir dans `tripkit-seeds/SEED-GUIDE.md`)  
**Changements** : documenter `ferry`/`events`, `tags[]`, convention annulation  
**Dépendances** : Tasks 1–3
---

## 6. Ordre d'implémentation

```
Task 1 (seed-import + seed-merge) ────────────┐
                                              v
Task 4 (QA cross-check) ──── indépendant      Task 2 (bookings-view.js)
                                              │
                                              v
                                         Task 3 (branchement onglet)
                                              │
                                              v
                                         Task 5 (docs)
```

**Parallélisable** : Task 1 + Task 4.

---

## 7. Risques et décisions

| Décision | Justification |
|----------|---------------|
| Garder `data-tab="hotels"` | Bookmarks `#hotels` |
| Label toujours "Résa" | Pas de bascule dynamique ; empty sections simplement absentes |
| Ordre par type, dates dans les cartes | Review Léo/GLM — chrono global non pertinent (vols encadrent le voyage) |
| `FIELD_MAP` obligatoire avant code QA | Noms de champs divergent (`orderRef`/`orderNumber`, `total`/`totalPrice`) |
| dayNum 1-based `+1` | Aligné sur `day.day` des seeds (ferry quebec = day 10) |
| QA prix/ref en WARNING | Formats monétaires hétérogènes |
| SeedMerge pour ferry/events | Évite la régression mapHtml (champs droppés au select) |
| Tags = `.badge` existants + `tags[]` | Même language que `hotels.amenities` et tags annulation 🟢🔴⚠️ |
| `cancellation` obligatoire sur résas | Cohérent avec QA hotels ; enfin visible en UI |
| Un seul `bookings-view.js` | Pattern 1 fichier = 1 composant |
| Pas de nouvel endpoint backend | JSON blob flexible |

---

## 8. Hors scope

- Modifications du backend Go
- Endpoint dédié réservations
- Champ `booked` pour ferry/events
- Notifications de changement
- i18n (français uniquement)
- Refonte chronologique mixte de toutes les résas dans une seule timeline

---

## 9. Checklist avant merge d'implémentation

- [ ] `FIELD_MAP` respecté (pas de compare naïf homonyme)
- [ ] `ferry` + `events` dans `seed-import.cjs` **et** `TRIP_META_FIELDS`
- [ ] Events triés par date
- [ ] Trip sans ferry/events : onglet fonctionnel
- [ ] Cards sans `type` ignorées (guard)
- [ ] Chaque carte Résa a type badge + chips `tags[]` + badge annulation
- [ ] Hôtels affichent aussi le badge 🟢🔴⚠️ annulation
- [ ] Seeds : `cancellation` préfixé emoji sur ferry/events/carRental
- [ ] Deep link `#hotels` OK
- [ ] `npm run test:unit` + Playwright tabs/hotels verts
- [ ] Re-import quebec-2026 en staging/prod après release
