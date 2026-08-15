# Review « Mode Construction » (#74) — statut des corrections (frontend)

**Périmètre** : les 20 constats de la review croisée backend #61 / frontend #74, côté frontend.
**Branche** : `feat/construction-mode` (#74).
**Pendant backend** : `tripkit-backend/docs/REVIEW-construction-fixes.md`.
**Verdict de départ** : NEEDS_CHANGES.

Légende : ✅ **corrigé** · 🟡 **partiellement corrigé** · ⏸️ **différé** (non implémenté, tracé).

> ⚠️ Toutes les vérifications ci-dessous sont **locales** : `npm run test:unit` (11 fichiers `.cjs`
> exécutés, 122 assertions vertes) et `npx playwright test` (128 tests OK). **Rien n'a été validé contre une
> instance qui tourne** : le DNS interne du cluster est injoignable, la prod est derrière Authelia,
> Overpass n'est pas accessible. Chaque panneau de vérification est exercé via `page.route` qui sert
> les fixtures d'or du backend : ce qui est prouvé, c'est le contrat **payload → DOM**, pas le backend
> réel.

---

## 1. Constats côté frontend

| # | Constat | Statut | Fichiers touchés |
|---|---|---|---|
| 1 | Enveloppe QA : le frontend lisait `data.results` au lieu de `data.violations` | ✅ | `js/construction-contract.js` (nouveau, `parseQA`), `js/components/construction-view.js` (`handleQA`) |
| 2 | Enveloppe admin-check + rendu construit autour d'un groupement « par voyageur » que le backend ne produit pas | ✅ | `js/construction-contract.js` (`parseAdminCheck`, `groupAdminItemsByTraveler`), `js/components/construction-view.js` (`handleAdmin`), `css/theme.css`. `appliesTo` porte les **nationalités** du voyage : la checklist par voyageur est reconstruite par intersection, avec un panier « Nationalités non rattachées à un voyageur » pour ne jamais perdre un item, et une liste plate par pays quand aucun voyageur n'est connu |
| 3 | Enveloppe health-check : `data.recommendations` au lieu de `items` | ✅ | `js/construction-contract.js` (`parseHealthCheck`), `js/components/construction-view.js` (`handleSante`). Règle de silence conservée : verdict `none` ou zéro item → « Aucune recommandation santé pour cette destination » |
| 4 | Les trois ratés retombaient sur `[]`, donc sur l'état vide rassurant | ✅ | Un payload non reconnu renvoie `{ok:false, reason:'unrecognized_payload'}` et affiche « Réponse inattendue du serveur… », jamais « Aucun problème détecté ». L'état vide légitime n'est rendu que pour un payload **reconnu** à zéro item. `items: null` (slice nil Go) compte comme liste vide reconnue |
| 5 | Endpoints stub : l'UI annonçait un succès | ✅ | `isNotImplemented(res)` (501 ou `error === 'not_implemented'`) → « Pas encore disponible », contrôle désactivé, `detail` du backend dans le `title`. `js/components/discovery-panel.js`, `js/components/construction-view.js`. La fonctionnalité elle-même reste ⏸️ côté backend |
| 6 | « Retenu ✓ » sur un no-op | ✅ | `js/components/discovery-panel.js` : le badge de succès exige une trame `done` explicite |
| 7 | Retain « réussissait » sur échec de flux SSE | ✅ | Une trame `error` ou une exception va sur la branche d'échec (`retainFailed` / `resetPinButton` / `profileEditFailed`) ; le swallow-and-continue a disparu des trois flux |
| 9 | Rendu : un échec Overpass ne doit pas se lire comme un feu vert | ✅ | `js/construction-contract.js` (`parseNuisance`, `worstNuisanceVerdict` avec la précédence `ELEVE > INDETERMINE > MODERE > FAIBLE`), `js/components/nuisance-stream.js` : bandeau « Analyse incomplète : certaines données n'ont pas pu être récupérées » nommant les catégories en échec, classe `.nuisance-cat-unavailable`, verdict global recalculé depuis `results[]` (le backend n'émet pas de verdict au niveau racine) |
| 11 | Phase 1 sautée (`(data && data.phase) \|\| 1`) | ✅ | `ConstructionContract.readPhase()` n'accepte qu'un vrai nombre ; phase 0 affiche « Construction pas encore démarrée » avec `data-phase="0"` et le premier « Phase suivante » demande bien la phase 1. Bouton toujours désactivé à partir de la phase 4 |
| 12 | Blocages de transition affichés en JSON brut | ✅ | `showTransitionError()` lit `res.data.blockers` sur un 409 et les rend avec les mêmes badges que la liste QA ; `errorLabel` traduit `transition_blocked` / `admin_required` / `not_implemented`. Test Playwright : le DOM ne contient ni `[{` ni `"severity"` |
| 20 | Régression d'accents dans la copie visible | ✅ | `js/components/construction-view.js` (Vérifications, Santé, Section à modifier, Centres d'intérêt, Leçons apprises, Envoyer à Léo, Réessayer, Aucun problème détecté, Épingler/Épinglé, Paramètres du voyage, Date de départ, Durée, Connexion perdue. Réessaie.…), `js/app.js` (« hôtels »), `js/components/discovery-panel.js` (« Envoi à Léo… », restauration de « Rien trouvé autour pour ces thèmes. »). Les occurrences sans accent restantes sont des identifiants (`action-sante`, clé de thème `randonnee`) et des commentaires |

### Constats hors frontend

| # | Constat | Où |
|---|---|---|
| 5, 8, 9 (moteur), 10, 12 (contrat), 13, 14, 15, 16, 17, 18, 19 | 501 honnêtes, `?force=1` réservé aux admins, verdict `INDETERMINE`, cache Overpass, transaction phase+log, gate de modes Léo, prompt système, règle QA transport, matching de mots-clés, synthèse Bifrost, loader ops | Backend — voir `tripkit-backend/docs/REVIEW-construction-fixes.md` |

---

## 2. Dette de duplication traitée (SSE nuisances)

La review pointait un correctif `AbortController` appliqué à **une seule** des deux copies du flux
nuisances. Il y en avait en fait **trois**. Elles partagent désormais un module unique :

- `js/components/nuisance-stream.js` (nouveau) : `start` / `subscribe` / `render`, paramètres
  `{tripId, data, signal, compact, locationId, onRendered}`.
- Appelants : `js/app.js` (panneau Plus, compact), `js/components/construction-view.js` (ActionBar,
  balisage complet + bouton d'épinglage via `onRendered`), `js/components/bookings-view.js`
  (bouton par hébergement, compact + filtre `locationId`).
- `subscribePlusNuisanceJob`, `renderPlusNuisanceResult`, `subscribeHotelNuisanceJob`,
  `renderHotelNuisanceResult`, `subscribeNuisanceJob`, `renderNuisanceResults` et `categoryEmoji`
  sont supprimés.
- Chaque appelant garde son propre `AbortController` (au niveau module dans `app.js` et
  `construction-view.js`, porté par le nœud DOM dans `bookings-view.js` pour que deux hôtels ne
  s'annulent pas). Un abandon est distingué d'une vraie erreur **deux fois** : par le code de trame
  (`API.chatSSE` transforme un fetch annulé en `{event:'error', data:{code:'cancelled'}}`) **et** par
  `signal.aborted` dans le `catch`. La progression est localisée par la classe `.nuisance-progress`
  et non par un id global.

Effet visible assumé : le résultat par hôtel affiche maintenant le nom du lieu et la ligne de verdict,
et l'ancien message rassurant « Aucune nuisance détectée » a disparu.

---

## 3. Tests inter-dépôts ajoutés

La review notait que « rien dans les deux dépôts ne traverse la frontière », d'où les trois enveloppes
divergentes livrées avec deux suites vertes. C'est corrigé :

- `tests/fixtures/construction-contract/` : copie **octet à octet** des fixtures d'or du backend
  (`qa-violations.json`, `admin-check.json`, `health-check.json`, `nuisance-check.json`,
  `phase-transition-blocked.json`).
- `tests/construction-contract.test.cjs` (ajouté au script `test:unit` — sinon il ne tourne jamais)
  vérifie la présence des cinq fichiers et le parsing de chaque enveloppe, refuse explicitement les
  anciennes clés (`data.results`, `data.travelers`, `data.recommendations`, `data.locations`), et
  couvre le rendu (bandeau incomplet, erreur sur enveloppe inconnue, échappement HTML, pas de
  peinture après abandon, filtre par hébergement).
- `tests/construction-checks.spec.js` (13 tests Playwright) pilote la vraie UI avec `page.route`
  servant ces fixtures ; `tests/discovery-panel.spec.js` couvre le retain en 501.
- **Régénération** : côté backend `go test ./internal/handlers/ -run TestContractFixtures -update`,
  puis recopier les JSON ici. `diff`/`cmp` peuvent manquer dans l'environnement : comparer avec
  `node -e` et `Buffer.equals`.
- `sw.js` : `CACHE_NAME` passé à `tripkit-120` et les deux nouveaux modules ajoutés à `ASSETS` et à
  `index.html` ; `tests/offline-core.spec.js` épingle ce nom.

---

## 4. Reste à faire

### Vérifiable seulement contre une instance qui tourne

- Les vrais corps 501 / 403 / 409 renvoyés par le backend déployé (ici : fixtures et corps écrits à
  la main).
- Le cycle de vie SSE contre un vrai endpoint de streaming : annulation au changement d'onglet ou de
  voyage, deux analyses concurrentes, reprise après coupure.
- Le rendu admin/santé sur des données de production : un vrai voyage doit porter
  `people[].nationalities`, ce que le seed de démo ne fait pas — sur ce voyage la checklist admin
  affiche donc des paniers par voyageur **plus** un panier « non rattaché ».
- L'apparence réelle du bloc CSS ajouté (~55 lignes) sur appareil, et le comportement d'Overpass
  sous charge (verdicts `INDETERMINE` réellement observés).

### Genuinement non implémenté

- **Write-back Léo** : `retain-discovery-item`, `pin-nuisance-to-seed` et `travel-profile/request`
  répondent 501 côté backend. L'UI le dit honnêtement (« Pas encore disponible ») mais **aucune de
  ces trois actions n'écrit quoi que ce soit**.
- **Loader de config ops** `TRIPKIT_CONSTRUCTION_*` (lot 0.3) : côté frontend rien à faire, mais les
  seuils et phases affichés restent ceux compilés en dur dans le backend.
- **Précision de `appliesTo`** : le backend attache l'ensemble des nationalités du voyage à chaque
  item, donc un item peut être attribué à un voyageur qui n'en a pas strictement besoin. Correctif à
  faire côté backend, pas ici.
- **Synthèse Bifrost** : le champ `summary` est rendu **s'il est présent** ; il est absent tant que la
  config Bifrost de construction n'est pas fournie.

---

## 5. Specs à mettre à jour (dépôt `rjullien/tripkit`)

Les specs de référence vivent dans **`rjullien/tripkit`** et **ce travail ne les a volontairement pas
modifiées** (dépôt en lecture seule pour cette tâche, édité en parallèle). Le même statut doit y être
reporté, en particulier dans **`construction/SPEC.md` §11** (cases à cocher des critères
d'acceptation) et **`construction/TASKS.md`** :

1. **`applies_to` → `appliesTo`** (camelCase) : à corriger dans `SPEC-admin-check.md`,
   `construction/DESIGN.md`, `construction/TASKS.md`, `construction/ANNEX-recovery.md`.
2. **Quatrième niveau de verdict `INDETERMINE` (⚪)**, prioritaire sur `MODERE`, avec les champs
   `unavailable` / `incomplete` / `failedCategories` : `SPEC-nuisance-check.md` §4.1 ne définit que
   `ELEVE`/`MODERE`/`FAIBLE`.
3. **`appliesTo` porte des nationalités, pas des voyageurs** : la « checklist par voyageur » de
   `construction/SPEC.md` §7 est reconstruite côté client, avec un panier pour les nationalités non
   rattachées.
4. **Loader de config ops différé** (lot 0.3) et synthèse construction empruntant la config Bifrost de
   plus-chat.
5. **`retain` / `pin-nuisance` / `profile-edit` répondent 501** : les critères d'acceptation
   correspondants ne peuvent pas être cochés.
