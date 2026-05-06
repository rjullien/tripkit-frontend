# TripKit Frontend

**PWA modulaire** — Programme jour par jour, hôtels, route, guide culturel, quiz, checklists.

🔗 **https://tripkit.bapttf.com** (auth Authelia)

---

## 🏗️ Architecture

```
rjullien/tripkit-frontend          CI (GitHub Actions)         BaptTF/vps-infra
─────────────────────────          ──────────────────          ────────────────
index.html + js/ + css/            Build Docker image          ArgoCD auto-deploy
sw.js, version.json     ──rel──►   ghcr.io/rjullien/   ──►    K3s (Nginx + Authelia)
js/seed/usa-2026.js                tripkit-frontend:sha-XXX    tripkit.bapttf.com
                                                                    ↕
rjullien/tripkit-backend           Build Docker image          tripkit-backend:3001
cmd/api/main.go          ──rel──►  ghcr.io/rjullien/   ──►    /api/ reverse proxy
internal/                          tripkit-backend:sha-XXX
```

| Composant | Rôle |
|-----------|------|
| `index.html` | Shell PWA — charge les modules JS |
| `js/app.js` | Orchestrateur principal (onglets, SW update, version display) |
| `js/seed/usa-2026.js` | Données voyage complètes (jours, hôtels, restos, culture) |
| `js/components/*.js` | Composants UI modulaires (timeline, hotel-card, weather...) |
| `js/store.js` | Store client — sync API backend + cache local |
| `js/api.js` | Client API backend (CRUD trips, days, hotels, lists) |
| `sw.js` | Service Worker — network-first avec cache fallback |
| `version.json` | `{"soft": "X.Y.Z", "data": "YYYY-MM-DD", "cache": N}` |
| `nginx.conf` | Serveur + reverse proxy `/api/` → backend + headers cache |
| `Dockerfile` | nginx:alpine + copie + injection `?v=N` au build |
| `.github/workflows/ci.yaml` | Tests Playwright → Build Docker → Push ghcr.io (sur release) |

---

## 🔄 Process de mise à jour

### 1. Modifier le code

Structure modulaire — chaque composant dans son fichier :

```
js/
├── app.js              # Orchestrateur (onglets, SW, version)
├── store.js            # Store + sync backend
├── api.js              # Client API
├── day-helpers.js      # Helpers dates
├── day-resolver.js     # Résolution jour courant
├── seed/usa-2026.js    # Données voyage (source de vérité)
└── components/
    ├── timeline.js     # Timeline jour
    ├── hotel-card.js   # Carte hôtel
    ├── weather.js      # Météo
    ├── culture-view.js # Guide culturel
    ├── route-view.js   # Route CarPlay
    ├── day-cards.js    # Cartes jours
    ├── list.js         # Checklists
    ├── conference.js   # Google Next
    └── trip-selector.js # Sélecteur trip
```

### 2. ⚠️ Bumper les versions (CHECKLIST OBLIGATOIRE)

**🚨 RÈGLE ABSOLUE : PAS DE RELEASE SANS ACCORD DE RENÉ !**

- Modifications → commit + push OK (CI lance les tests)
- **NE PAS créer de tag ni de release** sans validation explicite de René
- Workflow : modifier → tester → montrer à René → René dit "release" → release

**À FAIRE À CHAQUE MODIFICATION — dans cet ordre :**

```
☐  1. sw.js ligne 8 :        CACHE_NAME = 'tripkit-vN'             (incrémenter N)
☐  2. version.json :          {"soft": "X.Y.Z", "cache": N}        (MÊME N que sw.js)
☐  3. Tests passent :         npx playwright test
☐  4. git add + commit + push main
☐  5. Attendre CI verte
☐  6. gh release create vX.Y.Z --generate-notes
```

**Si tu oublies un de ces fichiers, les utilisateurs gardent l'ancienne version.**

| Fichier | Quoi bumper | Pourquoi |
|---------|-------------|----------|
| `sw.js` l.8 | `CACHE_NAME = 'tripkit-vN'` | Invalide le cache SW → force re-download |
| `version.json` → `soft` | `"X.Y.Z"` | Affiché dans onglet Plus → section Infos |
| `version.json` → `cache` | `N` (même que SW) | Dockerfile injecte `?v=N` → cache-bust Cloudflare |
| `version.json` → `data` | `"YYYY-MM-DD"` | Date de dernière mise à jour données |

### 3. Commit et push

```bash
git add -A
git commit -m "fix: description courte

v2.12.1"
git push origin main
```

### 4. Attendre la CI (tests Playwright)

```bash
# Vérifier que les tests passent
gh run list --repo rjullien/tripkit-frontend --limit 1
```

⚠️ **Le push sur main lance les tests mais NE build PAS l'image Docker.** Le build Docker ne se déclenche que sur une GitHub Release.

### 5. Créer la release

```bash
gh release create vX.Y.Z \
  --title "vX.Y.Z — Description courte" \
  --notes "### Fix
- Ce qui a changé"
```

⚠️ **Piège réel (v2.11.1) :** si le tag est créé avant que le commit du bump SW soit poussé, l'image Docker sera buildée sans le nouveau cache → les utilisateurs gardent l'ancienne version. Toujours : **bump SW → commit → push → attendre CI verte → release.**

### 6. Déploiement automatique (ArgoCD Image Updater)

**Aucune action manuelle côté infra.** Le pipeline est entièrement automatisé :

```
Release créée
  → CI build Docker image (ghcr.io/rjullien/tripkit-frontend:sha-XXX)
  → ArgoCD Image Updater détecte la nouvelle image (~2 min)
  → Met à jour .argocd-source-tripkit-frontend.yaml dans BaptTF/vps-infra
  → ArgoCD sync → nouveau pod → déployé
  → Temps total : ~5 min
```

### 7. Vérifier le déploiement

```bash
# Côté infra : vérifier que l'image a été mise à jour
gh api repos/BaptTF/vps-infra/contents/workloads/tripkit-frontend/.argocd-source-tripkit-frontend.yaml \
  --jq '.content' | base64 -d

# Côté app : vérifier version.json
curl -b COOKIES "https://tripkit.bapttf.com/version.json"
```

Ou dans l'app → onglet **⚙️ Plus** → section **ℹ️ Infos app**.

---

## 🌐 Cache-busting (Cloudflare + Service Worker)

### Le problème

Trois couches de cache entre le serveur et l'utilisateur :

```
Serveur nginx (origin)
  → Cloudflare CDN (cache selon Cache-Control headers)
    → Service Worker (cache local dans le browser)
      → Utilisateur
```

Si UNE des couches garde l'ancien fichier, l'utilisateur ne voit pas la mise à jour.

### La solution : triple mécanisme

| Couche | Mécanisme | Détail |
|--------|-----------|--------|
| **Nginx** | Headers `Cache-Control` | `sw.js` + `version.json` = jamais cachés. JS/CSS = 5 min + must-revalidate |
| **Cloudflare** | `?v=N` query string | Chaque release = nouvelle URL → cache miss → fichier frais |
| **Service Worker** | `CACHE_NAME` bump | Nouveau nom de cache → purge l'ancien → re-precache tout |

### Injection automatique `?v=N` (Dockerfile)

Le Dockerfile lit `version.json` → champ `cache` et injecte `?v=N` dans `index.html` au build :

```dockerfile
RUN CACHE_VER=$(jq -r '.cache' /usr/share/nginx/html/version.json) && \
    sed -i -E "s/(src=\"[^\"]+\.js)(\")/\1?v=${CACHE_VER}\2/g" /usr/share/nginx/html/index.html && \
    sed -i -E "s/(href=\"[^\"]+\.css)(\")/\1?v=${CACHE_VER}\2/g" /usr/share/nginx/html/index.html
```

**⚠️ Ne PAS mettre `?v=N` dans le source `index.html`** — ça casse les tests Playwright (qui tournent sans Docker). Le Dockerfile s'en charge.

### Headers nginx (`nginx.conf`)

| Resource | Cache | Header |
|----------|-------|--------|
| `sw.js` | ❌ Jamais | `no-store, no-cache, must-revalidate` |
| `version.json` | ❌ Jamais | `no-store, no-cache, must-revalidate` |
| `.js`, `.css` | 5 min + revalidate | `public, max-age=300, must-revalidate` |
| Images, fonts | 7 jours | `public, max-age=604800` |

---

## 🏨 Mise à jour données (sans release)

Si seules les données changent (horaires, hôtels, restaurants, codes d'accès, culture) :

### 🚨 RÈGLE CRITIQUE : Re-seeder après modif seed

**Le frontend PWA lit la DB backend, PAS les fichiers seed JS locaux.**

Chaque fois qu'un fichier `js/seed/*.js` est modifié (ajout culture, modif hotels, etc.) :
```bash
# OBLIGATOIRE après toute modif de seed
node seed-import.cjs --api http://tripkit-backend.tripkit.svc.cluster.local:3001 --seed js/seed/<trip>.js
```

Sinon la DB garde les anciennes données et l'app n'affiche rien de nouveau.

**Flow complet :**
```
1. Modifier js/seed/canada-ontario-2026.js (ex: ajout culture)
2. Re-seeder: node seed-import.cjs --api <backend> --seed js/seed/canada-ontario-2026.js
3. Vérifier dans l'app (refresh)
4. Commit + push
5. Release si c'est un changement de code (pas juste data)
```

### Via seed-import (sync complète)

```bash
# Depuis le repo frontend — synchro seed → backend
node seed-import.cjs --api https://tripkit.bapttf.com --token "User:Pass"
```

### Via API directe (mise à jour ciblée)

```bash
# Mettre à jour un hôtel spécifique
curl -b COOKIES -X PUT "https://tripkit.bapttf.com/api/trips/usa-2026/hotels/16" \
  -H "Content-Type: application/json" \
  -d '{"name": "B&B Chez François", "access": "🔑 Code: [REDACTED]", ...}'
```

**⚠️ IMPORTANT :** Lors d'un PUT hôtel, **toujours inclure `hotelId` et `dayNums`** dans le body — sinon l'app perd le lien entre jours et hôtels.

### Source de vérité

```
rjullien/jujus-adventures              →  js/seed/usa-2026.js  →  Backend API
(trips/.../hotels.md, route-plan.md)       (export JS)             (seed-import)
```

La sync entre `jujus-adventures` et le seed est **manuelle** — pas de CI automatique.

---

## 🔐 Accès & Groupes ACL

Auth Authelia via `auth.bapttf.com` :

| Utilisateur | Qui |
|-------------|-----|
| `Rene` | René (admin — voit tout) |
| `Nicole` | Nicole |
| `Baptiste` | Baptiste |
| `Camille` | Camille |
| `Alexandre` | Alexandre |
| `Dinah` | Dinah |
| `Emma` | Emma |
| `Laurine` | Laurine |

### Système de groupes (backend v1.6+)

Les trips sont protégés par un système de groupes. Chaque user appartient à un ou plusieurs groupes, chaque groupe a accès à certains trips.

| Groupe | Membres | Trips |
|--------|---------|-------|
| `jullien` | Rene, Nicole, Baptiste, Camille, Alexandre, Dinah, Emma | Tous |
| `rolland` | Laurine | usa-2026 uniquement |

**Comportement :**
- `GET /api/trips` ne retourne que les trips autorisés pour l'user
- Accès direct `/api/trips/{id}/seed` bloqué si pas dans un groupe autorisé
- **Rene** = admin bypass (voit toujours tout, même sans groupe)
- **Mode ouvert** : si aucun groupe n'est configuré (table vide), tout est visible (backward compat)
- **Trip sans ACL** : si un trip n'a aucun `TripAccess` associé, il reste ouvert à tous

### Gestion des groupes (admin)

```bash
# Créer/modifier un groupe
PUT /api/groups/{groupId}
{"name": "Famille Jullien", "members": ["Rene", "Nicole", ...], "trips": ["usa-2026", ...]}

# Lister les groupes
GET /api/groups

# Supprimer un groupe
DELETE /api/groups/{groupId}

# Voir les trips accessibles pour l'user courant
GET /api/my/trips
```

### Ajouter un nouveau user (collègue, ami)

1. Baptiste crée le user dans Authelia
2. Créer un groupe (ou l'ajouter à un existant) :
   ```bash
   curl -X PUT "https://tripkit.bapttf.com/api/groups/demo" \
     -H "Content-Type: application/json" \
     -d '{"name":"Demo","members":["NouvelUser"],"trips":["usa-2026"]}'
   ```
3. Le user ne verra que les trips de son groupe

---

## ⚠️ Pièges à éviter

1. **Cache PWA** : Toujours bumper `CACHE_NAME` dans `sw.js` **ET** `cache` dans `version.json` (même N). Oublier un des deux = update invisible.
2. **Ordre release** : bump SW + version.json → commit → push → CI verte → release. **Jamais** release avant le bump.
3. **Release obligatoire pour build Docker** : Le push sur main lance les tests mais **ne build pas l'image**. Il faut créer une `gh release`.
4. **Cache-busters uniquement dans le Dockerfile** : Ne PAS ajouter `?v=N` dans le source `index.html` — ça casse les tests Playwright en CI (les tests tournent sans Docker).
5. **PUT hôtels = toujours inclure `hotelId` + `dayNums`** : Sinon l'app perd le mapping jour↔hôtel.
6. **ArgoCD : structure flat obligatoire** : Chaque app (frontend/backend) a son propre kustomization.yaml racine. Pas de sous-kustomizations — les overrides `images:` ne s'y propagent pas (bug connu Kustomize).
7. **Cloudflare devant** : Les headers `Cache-Control` du nginx contrôlent ce que CF cache. `sw.js` et `version.json` ne doivent JAMAIS être cachés.

---

## 🛡️ Leçons Cloudflare & Cache (découvertes mai 2026)

### Assets par trip — JAMAIS de noms génériques

**Problème :** Si deux trips utilisent le même nom de fichier (ex: `day-01-route.jpg`), Cloudflare cache le premier servi et le renvoie à tous les trips.

**Solution :** Chaque asset est scopé par trip ID dans l'URL :
```
/api/trips/{tripId}/assets/day-01-route.jpg
```
Résultat : USA et Langon ont chacun leur propre namespace, pas de collision.

**RÈGLE :** Ne JAMAIS utiliser de chemins relatifs pour les assets (`day-01-route.jpg`). Toujours préfixer par le trip ID.

### manifest.json et icônes PWA

**Problème :** iOS cache le manifest.json et l'icône PWA agressivement. Même après un changement d'icône, les anciens téléphones gardent l'ancienne.

**Solution multi-niveaux :**
1. Versionner le nom de l'icône : `icon-192-v3.png` (pas juste `icon-192.png`)
2. Versionner le lien manifest : `<link rel="manifest" href="manifest.json?v=3">`
3. Mettre `Cache-Control: no-cache` sur `manifest.json` dans nginx
4. Mettre la même version dans `apple-touch-icon`

**⚠️ iOS spécifique :** Les raccourcis écran d'accueil ne mettent PAS à jour l'icône automatiquement. L'utilisateur doit supprimer le raccourci et le recréer.

### API responses — no-store obligatoire

**Problème :** Cloudflare cache les réponses `/api/` même avec des données dynamiques. Switcher de trip retourne les données de l'ancien trip.

**Solution :** `nginx.conf` sur le reverse proxy `/api/` :
```nginx
location /api/ {
    proxy_pass http://tripkit-backend:3001/api/;
    add_header Cache-Control "no-store" always;
    add_header CDN-Cache-Control "no-store" always;
}
```
`CDN-Cache-Control` est un header spécifique Cloudflare qui override leur heuristique.

### localStorage — purge au switch trip

**Problème :** Le Store garde les données de l'ancien trip en localStorage. Au switch, le render utilise les anciennes données avant que le fetch finisse.

**Solution :** `Store.clearTripData(tripId)` + reset `data-version` AVANT de refetch. Triple protection :
1. Purge localStorage keys du nouveau trip
2. Reset version pour forcer un full fetch
3. Force `refreshFromBackend()` sans condition

### Google Maps URLs — unique par jour

**Problème :** Si deux jours partagent la même `mapUrl` (même si c'est différent), le browser cache le résultat.

**Solution :** Chaque jour doit avoir une `mapUrl` distincte avec les vrais points de passage. Pas de template générique.

### Service Worker — network-first CRITIQUE

**Architecture :** Le SW utilise network-first pour TOUT sauf les assets statiques. Si le réseau est disponible, toujours aller chercher la version fraîche. Le cache n'est que pour l'offline.

```
requête → réseau disponible ? → fetch frais → mettre en cache → servir
                            → réseau KO ? → servir depuis cache → ⚡ offline mode
```

---

## 🧪 Tests

### Prérequis

```bash
npm ci
npx playwright install --with-deps chromium
```

### Lancer les tests

```bash
npx playwright test
```

### Tests disponibles

| Fichier | Description |
|---------|-------------|
| `tests/app-loads.spec.js` | Chargement app, rendu données |
| `tests/tabs.spec.js` | Navigation onglets |
| `tests/hotels.spec.js` | Affichage hôtels |
| `tests/components.spec.js` | Composants UI |
| `tests/culture.spec.js` | Guide culturel |
| `tests/route.spec.js` | Vue route |
| `tests/weather.spec.js` | Météo |
| `tests/pwa.spec.js` | Service Worker, manifest |
| `tests/seed-integrity.spec.js` | Intégrité du seed |
| `tests/day-resolver.spec.js` | Résolution jour |
| `tests/ux.spec.js` | UX regression |

### Avant chaque release

```bash
# 1. Lancer les tests
npx playwright test

# 2. Tous passent ? → Bumper versions
# 3. Commit + push + attendre CI verte
# 4. gh release create vX.Y.Z
```

> 💥 **Règle #1 : INTERDICTION DE RELEASE SANS TESTS VERTS.** Pas de "je teste après". Pas de "c'est juste un petit changement". Les tests Playwright tournent en CI à chaque push et doivent passer AVANT la release.

---

## 🏗️ Infra ArgoCD (référence)

**Repo infra :** `BaptTF/vps-infra`

Frontend et backend sont **deux apps ArgoCD séparées** (split PR #35, 2 mai 2026) :

| Fichier dans vps-infra | Rôle |
|------------------------|------|
| `apps/tripkit-frontend.yaml` | Application ArgoCD frontend |
| `apps/tripkit-backend.yaml` | Application ArgoCD backend |
| `system/argocd-image-updater/crs/tripkit-frontend-updater.yaml` | Surveille `ghcr.io/rjullien/tripkit-frontend` |
| `system/argocd-image-updater/crs/tripkit-backend-updater.yaml` | Surveille `ghcr.io/rjullien/tripkit-backend` |
| `workloads/tripkit-frontend/.argocd-source-tripkit-frontend.yaml` | Auto-généré — override tag image |
| `workloads/tripkit-backend/.argocd-source-tripkit-backend.yaml` | Auto-généré — override tag image |

**Stratégie Image Updater :** `newest-build` — pull la plus récente image buildée.

**Pull secret :** `pullsecret:argocd/tripkit-ghcr-login-secret` (Infisical → dockerconfigjson)

**Si le deploy ne se fait pas :**
1. CI verte ? → Vérifier `gh run list --repo rjullien/tripkit-frontend --limit 3`
2. Image Updater a écrit ? → Vérifier `.argocd-source-tripkit-frontend.yaml` dans vps-infra
3. Kustomization flat ? → Pas de sous-kustomizations (structure plate obligatoire)
4. En dernier recours : modifier manuellement le `.argocd-source-*` avec le bon tag

---

## ⚠️ Ownership

**Frontend ET backend gérés par Léa (agent IA de René).** Accès complet aux deux repos. Peut coder, tester, pusher et releaser. Baptiste gère l'infra K3s/ArgoCD (`BaptTF/vps-infra`).

---

## Runtime Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `API_URL` | `` (empty) | Backend base URL. Empty = same origin. |
| `API_PREFIX` | `/api` | API path prefix. |
| `DEFAULT_TRIP_ID` | `` (empty) | Default trip to load. |

---

## Versioning

- **MAJOR** (vX.0.0) : refacto structurel, breaking changes
- **MINOR** (v0.X.0) : nouvelles features
- **PATCH** (v0.0.X) : bugfixes, data updates

---

## 🏨 Règles Hotels/Hébergements (pour TOUS les voyages)

### Règle générale
Pour tout voyage où on n'est PAS hébergé chez quelqu'un (ex: Langon = chez Camille → pas d'hôtels à gérer) :

1. **Chaque hôtel DOIT avoir une `city`** — la ville où il se trouve
2. **Grouper les nuits consécutives** — si 2+ jours au même endroit, un seul hôtel avec note "X nuits (JX-JY)"
3. **`booked: false`** + note "À réserver" tant que non réservé
4. **`booked: true`** + infos complètes dès la réservation faite (ref, addr, wifi, etc.)

### Exemples
```js
// Pas encore réservé
{ id: "quebec-city", name: "Hébergement Québec", city: "Québec City", emoji: "🏰", type: "hotel", booked: false, note: "À réserver — 2 nuits (J2-J3)" }

// Réservé
{ id: "quebec-city", name: "Hôtel Château Laurier", city: "Québec City", emoji: "🏰", type: "hotel", booked: true, addr: "1220 Place George-V O", booking: "Booking.com", ref: "123456", checkin: "15:00", checkout: "11:00", wifi: { ssid: "ChateauGuest", pass: "abc123" } }
```

### Trips concernés
- ✅ `usa-2026` — hôtels à réserver
- ✅ `canada-ontario-2026` — hôtels à réserver  
- ✅ `canada-2026` — hôtels à réserver
- ❌ `langon-2026` — hébergé chez Camille, pas d'hôtels
