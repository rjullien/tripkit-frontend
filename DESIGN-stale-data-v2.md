# DESIGN — v2 : Éliminer les scénarios de données stale

**Contexte** : Après le fix v2.31.58 (stale-while-revalidate + parallélisation), le
**shell** est instantané. Mais les **données voyage** (localStorage) peuvent rester
bloquées sur une vieille version dans certains scénarios.

---

## Scénarios identifiés de données bloquées

### S1. `checkVersionStatus` timeout/erreur → données jamais rafraîchies

```javascript
const verRes = await API.checkVersionStatus(tripId); // 4s timeout
if (!verRes.ok || !verRes.data) {
  return hasLocal ? 'unchanged' : false;  // ← sort SANS tenter le seed
}
```

**Problème** : Si le version-check échoue systématiquement (backend surchargé, DNS
lent mais pas mort, réseau qui drop les petites requêtes), l'app ne tente JAMAIS de
re-fetch le seed. L'utilisateur reste sur des données arbitrairement vieilles.

**Fréquence** : Modérée (4G intermittente en voyage, WiFi captif qui laisse passer
certaines requêtes mais pas d'autres).

---

### S2. Version identique mais seed corrompu/incomplet en localStorage

```javascript
if (hasLocal && cachedVersion && String(cachedVersion) === String(ver.version)) {
  return 'unchanged';  // ← ne vérifie jamais l'INTÉGRITÉ des données locales
}
```

**Problème** : Si `setTripData` a été interrompu (quota exceeded, crash navigateur,
batterie morte pendant l'écriture), les données locales sont potentiellement
tronquées mais la `*-data-version` est déjà la bonne → le check ne détecte rien.

**Fréquence** : Rare mais grave (un seul cas = app cassée indéfiniment).

---

### S3. `probe()` échoue → tout le refresh est abandonné

```javascript
if (!probeOk) {
  if (typeof API.flushOutbox === 'function') API.flushOutbox();
  return;  // ← sort immédiatement, aucun refresh tenté
}
```

**Problème** : `probe()` fait un GET /health avec 3s timeout. Si ça timeout
(backend lent mais pas mort), aucune tentative n'est faite pour le version check
ou le seed — même si ces endpoints sont peut-être disponibles.

**Fréquence** : Élevée en voyage (3G lente, backend qui met 4s à répondre au health
mais seed est en cache CDN et répond en 1s).

---

### S4. SW stale-while-revalidate + app jamais rechargée

**Problème** : Le SW sert le cache immédiatement et met à jour en arrière-plan pour
le PROCHAIN chargement. Mais si l'utilisateur ne ferme jamais l'app (iPhone, le
Safari tab reste ouvert des jours), il ne voit jamais le nouveau code.

L'app a un `showUpdateBanner` quand un nouveau SW est installé, mais ça ne couvre
que les changements de SW (CACHE_NAME bump). Un hotfix JS sans bump de CACHE_NAME
ne déclenche rien.

**Fréquence** : Faible (CACHE_NAME est toujours bumpé en pratique).

---

### S5. localStorage plein → `setTripData` échoue silencieusement

```javascript
function set(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('[Store] localStorage write failed:', e);  // ← log and continue
  }
}
```

**Problème** : Si localStorage est plein (5 MB sur Safari iOS), le nouveau seed est
droppé mais `-data-version` est déjà bumpé → au prochain boot, version match, skip
refresh, mais les données locales sont toujours l'ancienne version.

En fait non — `Store.set(tripId + '-data-version', ver.version)` est APRÈS
`Store.setTripData()`. Si setTripData échoue... on bumpe quand même la version dans
le code actuel. C'est un bug.

---

## Solutions proposées

### Fix 1 : Version bump SEULEMENT si setTripData réussit

```javascript
// Avant (bug)
Store.setTripData(tripId, tripData);
Store.set(tripId + '-data-version', ver.version);

// Après (fix)
const stored = Store.setTripData(tripId, tripData);
if (stored) Store.set(tripId + '-data-version', ver.version);
```

Et `Store.setTripData` retourne `true/false` selon le succès du write.

**Impact** : Élimine S5 et S2 — si le write échoue, la prochaine boot retente le
fetch (version mismatch).

---

### Fix 2 : Integrity check — forcer un refresh si les données sont corrompues

```javascript
function tripDataIsUsable(tripData) {
  return !!(tripData && tripData.days && tripData.days.length > 0 && tripData.trip);
}

// Dans loadTripSeed, AVANT le version check
const hasLocal = !!Store.getTripData(tripId);
const localUsable = hasLocal && tripDataIsUsable(Store.getTripData(tripId));

// Utiliser localUsable au lieu de hasLocal pour le skip
if (localUsable && cachedVersion && String(cachedVersion) === String(ver.version)) {
  return 'unchanged';
}
```

**Impact** : Élimine S2 — données corrompues détectées, refresh forcé.

---

### Fix 3 : Timeout progressif / skip probe quand version-check suffit

Le probe `/health` est un gardien excessif. Si le device est online ET qu'on a du
cache, on peut tenter le version-check directement — s'il échoue on sait que le
backend est down, pas besoin d'un probe séparé.

```javascript
async function refreshFromBackend(opts) {
  if (!navigator.onLine) return;

  // Skip probe for returning users — version check IS the probe
  const hasAnyLocal = !!Store.getTripData(Store.getCurrentTripId());
  if (hasAnyLocal && !(opts && opts.probed)) {
    // Go directly to version check — it's ~50 bytes, fastest signal
    const tripsResult = await _cachedGetTrips();
    // ... reconcile + resolve as before ...
    const ok = await loadTripSeed(tripId);
    // If version check failed (network), THEN set reachable=false
    // No separate probe needed.
    return;
  }
  // ... existing probe flow for cold start ...
}
```

**Impact** : Élimine S3 — un probe lent ne bloque plus le refresh pour les users
avec du cache. Et réduit encore la latence de 800ms.

---

### Fix 4 : Force-refresh après N heures sans update réussie

Si les données n'ont pas été mises à jour depuis X heures (configurable), forcer un
refresh complet en ignorant la version locale.

```javascript
const STALE_THRESHOLD_MS = 6 * 60 * 60 * 1000; // 6 heures

function isDataStale(tripId) {
  const lastRefresh = Store.get(tripId + '-last-refresh-at');
  if (!lastRefresh) return true;
  return (Date.now() - lastRefresh) > STALE_THRESHOLD_MS;
}

// Dans loadTripSeed
if (hasLocal && cachedVersion && String(cachedVersion) === String(ver.version)) {
  if (isDataStale(tripId)) {
    console.debug('[App] Data version matches but stale (' + STALE_THRESHOLD_MS/3600000 + 'h) — forcing refresh');
    // Continue to fetch seed even though version matches
  } else {
    return 'unchanged';
  }
}
```

**Impact** : Filet de sécurité ultime — même si le version check est correct, les
données sont rafraîchies au moins toutes les 6h.

---

## Plan d'implémentation (par priorité)

| # | Fix | Impact | Risque | Effort |
|---|-----|--------|--------|--------|
| 1 | Version bump conditionnel | Élimine le pire bug (S5) | Nul | 10 min |
| 2 | Integrity check | Élimine données corrompues (S2) | Nul | 15 min |
| 3 | Skip probe pour returning users | -800ms + élimine S3 | Faible | 20 min |
| 4 | Force-refresh après 6h | Filet de sécurité universel | Nul | 10 min |

---

## Décision

Fix 1 + 2 + 4 sont des quick wins sans risque. Fix 3 est le plus impactant en perf
mais change la logique de connectivity, à valider.
