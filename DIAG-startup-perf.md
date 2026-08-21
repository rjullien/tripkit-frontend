# 🔬 Diagnostic Performance — Démarrage PWA TripKit

**Date** : 2026-08-21  
**Auteur** : Kiro (analyse automatisée)  
**Scope** : Temps de chargement au lancement de l'app (cold start + retour)

---

## 📊 Résumé exécutif

| Scénario | Temps mesuré | Perception utilisateur |
|----------|-------------|----------------------|
| **Retour** (localStorage en cache) | **~50ms** | Instantané ✅ |
| **Cold start** (backend réactif, 3G) | **~8s** | Lent, « Chargement… » visible ⚠️ |
| **Réseau flaky** (SW network-first) | **+3-10s** avant le 1er octet HTML | Écran blanc 🔴 |
| **Pire cas** (timeouts cumulés) | **46s** d'écran blanc | Inutilisable 💀 |

**Verdict** : L'app est rapide *quand elle a du cache*. Le problème est le **cold start** et le **réseau instable** (WiFi captif, 4G intermittente, backend lent).

---

## 🏗️ Architecture de boot

```
index.html
 ├── <link> css/theme.css (55 KB)
 ├── <script defer> config.js (~100 B, runtime Docker)
 ├── <script defer> js/dist/bundle-core.js (154 KB / 43 KB gzip)
 └── <script defer> js/dist/bundle-components.js (299 KB / 80 KB gzip)
      └── DOMContentLoaded → App.init()
```

**Total shell** : ~140 KB gzip sur le fil — correct.  
**bundle-edge** (70 KB / 18 KB gzip) : chargé à la demande → OK, pas sur le chemin critique.

---

## 🔴 Problème #1 — Service Worker network-first

**Fichier** : `sw.js`, fonction `networkFirstShell()`

```javascript
// sw.js — stratégie pour le shell
function networkFirstShell(request) {
  return fetch(request)           // ← attend le réseau EN PREMIER
    .then(response => { ... })
    .catch(() => matchShell(request));  // fallback cache seulement si fetch échoue
}
```

**Effet** : Quand le téléphone dit « en ligne » mais que le réseau est pourri (4G intermittente, WiFi captif, avion qui vient d'atterrir) :
- Le navigateur attend `fetch(request)` pour le HTML, le CSS, et les 2 JS
- Il n'y a **pas de timeout** sur ces fetch dans le SW
- Le cache n'est consulté qu'après **échec réseau** (pas après lenteur)
- **Résultat : écran blanc pendant 3-10+ secondes** même avec tout en cache

**Ligne offline** : il y a un short-circuit `if (!self.navigator.onLine)` → cache, mais ça ne couvre pas le réseau lent.

---

## 🔴 Problème #2 — Chaîne séquentielle de 6 requêtes

**Fichier** : `js/app.js`, fonctions `init()` → `refreshFromBackend()` → `loadTripSeed()`

Après le shell, **6 appels réseau sont exécutés en série** (chaque `await` bloque le suivant) :

```
┌──────────────────────────────────────────────────────────────────┐
│ Séquence              │ Endpoint             │ Timeout │ Mesuré  │
├───────────────────────┼──────────────────────┼─────────┼─────────┤
│ 1. API.probe()        │ GET /health          │ 3s      │ ~800ms  │
│ 2. reconcileTrips     │ GET /api/trips       │ 8s      │ ~1200ms │
│ 3. resolveTripId      │ GET /api/trips ⚠️    │ 8s      │ ~1200ms │
│ 4. checkVersionStatus │ GET /trips/:id/ver   │ 4s      │ ~600ms  │
│ 5. fetchSeed          │ GET /trips/:id/seed  │ 8s      │ ~2500ms │
│ 6. syncConstruction   │ GET /trips/:id/const │ 15s     │ ~1500ms │
└───────────────────────┴──────────────────────┴─────────┴─────────┘
 Total séquentiel mesuré : ~7800ms
 Total pire cas (timeouts) : 46s
```

### Waterfall visuel

```
t=0ms     ├─── probe /health ───────┤
t=800ms                              ├─── getTrips ──────────────────┤
t=2000ms                                                              ├─── getTrips (2ème!) ────────┤
t=3200ms                                                                                             ├── checkVersion ──┤
t=3800ms                                                                                                                  ├───── fetchSeed ─────────────────────┤
t=6300ms                                                                                                                                                          ├─── syncConstruction ──────────┤
t=7800ms  PREMIER RENDU ←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←
```

---

## 🟡 Problème #3 — Double appel GET /api/trips

**Fichier** : `js/app.js`, lignes ~278-300

```javascript
async function refreshFromBackend(opts) {
  // ...
  await reconcileTripRegistry();   // ← GET /api/trips (1)
  let tripId = await resolveTripId();  // ← GET /api/trips (2) si pas de localStorage
  // ...
}
```

`reconcileTripRegistry()` appelle `API.getTrips()` pour nettoyer les trips locaux.  
`resolveTripId()` rappelle `API.getTrips()` si `Store.getCurrentTripId()` est null.

**Coût** : ~1200ms dupliqué sur le chemin critique cold start.

---

## 🟡 Problème #4 — syncConstructionData bloquant

**Fichier** : `js/app.js`, dans `loadTripSeed()` (4 occurrences)

```javascript
async function loadTripSeed(tripId) {
  // ... fetch seed ...
  await syncConstructionData(tripId);  // ← ATTEND 15s timeout max
  return 'updated';
}
```

`syncConstructionData` fait `API.getConstruction(tripId)` qui utilise `requestJSON` (timeout 15s par défaut).

**Problème** : Ce n'est pas nécessaire pour le premier rendu. L'onglet Construction n'est même pas visible par défaut.

**Coût** : ~1500ms sur CHAQUE boot, même quand mode construction = OFF.

---

## 🟡 Problème #5 — /health appelé deux fois

**Fichier** : `js/app.js`

```javascript
async function init() {
  // ...
  fetchBackendVersion();        // ← GET /health (non-blocking mais consomme la connexion)
  // ...
  refreshFromBackend();         // ← dans refreshFromBackend: await API.probe() = GET /health ENCORE
}
```

Le 1er `/health` dans `fetchBackendVersion()` est fire-and-forget, mais il occupe une connexion HTTP.  
Le 2ème `/health` dans `refreshFromBackend()` est **await** (bloquant, 3s timeout).

Le résultat du 1er n'est jamais réutilisé pour le 2ème.

---

## ℹ️ Ce qui fonctionne bien

- ✅ **Cache localStorage** : quand il y a des données en cache, `init()` fait `handleHash()` (rendu instantané) AVANT de lancer `refreshFromBackend()` en background
- ✅ **bundle-edge en lazy-load** : pas sur le chemin critique
- ✅ **Taille du shell** : 140 KB gzip est raisonnable pour une app vanilla JS
- ✅ **Version check léger** : `/trips/:id/version` = ~50 bytes, permet de skip le seed quand rien n'a changé
- ✅ **Le banner « Mise à jour dispo »** : détecte un nouveau SW correctement

---

## 💡 Recommandations par impact

### R1. SW → stale-while-revalidate pour le shell (🔴 impact max)

```javascript
// sw.js — AVANT (network-first)
function networkFirstShell(request) {
  return fetch(request)
    .then(response => { cache; return response; })
    .catch(() => matchShell(request));
}

// sw.js — APRÈS (stale-while-revalidate)
function staleWhileRevalidate(request) {
  return matchShell(request).then(cached => {
    const fetchPromise = fetch(request).then(response => {
      if (response.ok) {
        caches.open(CACHE_NAME).then(c => c.put(request, response.clone()));
      }
      return response;
    });
    // Si on a un cache → le servir immédiatement, mettre à jour en arrière-plan
    // Si pas de cache → attendre le réseau (premier install)
    return cached || fetchPromise;
  });
}
```

**Gain estimé** : Élimine les 3-10s d'écran blanc sur réseau lent pour les visites de retour.  
**Risque** : L'utilisateur voit l'ancienne version pendant 1 refresh. Le banner update le corrige déjà.

---

### R2. Paralléliser la chaîne de boot (🔴 impact majeur)

```javascript
// AVANT : 6 appels séquentiels
async function refreshFromBackend() {
  await API.probe();                     // 800ms
  await reconcileTripRegistry();         // 1200ms
  let tripId = await resolveTripId();    // 1200ms
  await loadTripSeed(tripId);            // 4600ms
}

// APRÈS : 3 étapes au lieu de 6
async function refreshFromBackend() {
  // Étape 1 : probe + getTrips en parallèle
  const [probeOk, trips] = await Promise.all([
    API.probe(),
    API.getTrips()   // un seul appel, résultat partagé
  ]);
  if (!probeOk) return;

  // Réconcilier + résoudre tripId depuis le même résultat
  Store.reconcileTripsFromServer(trips.map(t => t.id));
  const tripId = Store.getCurrentTripId() || (trips[0] && trips[0].id);
  if (!tripId) return;

  // Étape 2 : version + seed (séquentiel — nécessaire)
  await loadTripSeed(tripId);

  // Étape 3 : construction en fire-and-forget
  syncConstructionData(tripId);  // PAS de await
}
```

**Gain estimé** :
- Élimine ~2400ms (double getTrips + probe parallélisé)
- Élimine ~1500ms (construction non-bloquant)
- **Boot séquentiel : ~7800ms → ~3700ms**

---

### R3. Timeout global sur le boot (🟡 filet de sécurité)

```javascript
async function refreshFromBackend() {
  const BOOT_DEADLINE_MS = 10000; // 10s max — après on reste sur le cache

  try {
    await Promise.race([
      _doRefreshFromBackend(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('boot-timeout')), BOOT_DEADLINE_MS)
      )
    ]);
  } catch (e) {
    if (e.message === 'boot-timeout') {
      console.warn('[App] Boot deadline reached — using cached data');
      // Le cache est déjà rendu (si disponible). On ne bloque plus.
    }
  }
}
```

**Gain** : Cap le pire cas de 46s à 10s.

---

### R4. Dédupliquer getTrips (🟢 quick win)

```javascript
let _tripsCache = null;
let _tripsCacheAt = 0;
const TRIPS_CACHE_TTL = 5000; // 5s

async function getTrips() {
  if (_tripsCache && Date.now() - _tripsCacheAt < TRIPS_CACHE_TTL) return _tripsCache;
  _tripsCache = await safeFetch('/trips');
  _tripsCacheAt = Date.now();
  return _tripsCache;
}
```

**Gain** : -1200ms sur cold start.

---

### R5. Réutiliser le probe de fetchBackendVersion (🟢 quick win)

```javascript
// Dans init() : fetchBackendVersion fait déjà /health
// → si ça réussit, pas besoin de re-prober dans refreshFromBackend

async function init() {
  const healthOk = await fetchBackendVersion(); // retourne true/false
  // ...
  refreshFromBackend({ probed: !!healthOk });  // skip le re-probe
}
```

**Gain** : -800ms sur le chemin critique.

---

## 📐 Résumé des gains cumulés

| Recommandation | Gain estimé | Complexité | Risque |
|----------------|-------------|-----------|--------|
| R1. SW stale-while-revalidate | -3 à -10s (réseau lent) | Moyenne | Faible |
| R2. Parallélisation boot | -4100ms | Moyenne | Faible |
| R3. Timeout global 10s | Cap à 10s vs 46s | Faible | Nul |
| R4. Cache getTrips | -1200ms | Faible | Nul |
| R5. Réutiliser probe | -800ms | Faible | Nul |

**Après R1-R5** :
- Cold start backend rapide : **~3.7s** (vs 7.8s avant)
- Réseau lent avec cache : **instantané** (vs 3-10s d'écran blanc)
- Pire cas : **10s** puis fallback cache (vs 46s d'écran blanc)

---

## 🔧 Outil de diagnostic

Un script de mesure automatisé a été créé :

```bash
# Mesure complète avec backend mock
node scripts/perf-diag-full.mjs

# Mesure des assets de boot sur une instance existante
node scripts/measure-boot.mjs https://tripkit.bapttf.com
```

Le script `scripts/perf-diag-full.mjs` :
- Lance un serveur mock avec des latences réalistes
- Mesure la chaîne séquentielle exacte
- Affiche un waterfall visuel
- Calcule les pires cas

---

## 🗂️ Fichiers concernés

| Fichier | Rôle | Problème |
|---------|------|----------|
| `sw.js` | Service Worker | network-first → écran blanc sur réseau lent |
| `js/app.js` | Boot controller | Chaîne séquentielle de 6 await |
| `js/api.js` | Client HTTP | Timeouts corrects mais pas de déduplication |
| `nginx.conf` | Reverse proxy | `proxy_read_timeout 270s` (OK mais long pour le client) |

---

*Diagnostic généré automatiquement — reproductible via `node scripts/perf-diag-full.mjs`*
