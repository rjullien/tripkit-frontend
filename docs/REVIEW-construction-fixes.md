# Review « Mode Construction » — rebase frontend sur main v2.31.25

**Périmètre** : les 20 constats de la review croisée backend #61 / frontend #74, côté frontend.
**Branche** : `cursor/construction-fe-rebase-6143` (rejoue #74 sur `main` v2.31.25, boot bundles #77).
**Pendant backend** : `tripkit-backend/docs/REVIEW-construction-fixes.md` — #61 reste à rebaser sur le backend courant.
**Verdict de départ** : NEEDS_CHANGES (corrigé ici pour le frontend).

Cette PR ne merge **pas** #74 ni #76 tels quels. #76 (`feat/construction-checks-live`, empilée sur #74) visait à afficher vraiment admin / santé / nuisances (SPEC §7–§8) : la review de #74 a ensuite posé `construction-contract.js`, qui **remplace** la lecture `travelers[]` / `recommendations` de #76. Le lot unique encore utile de #76 est repris ici : timeouts admin/santé 60 s (Bifrost), échéance admin, alternatives nuisances, exports `handleAdmin` / `handleSante`.

Un merge naïf de #74/#76 aurait reverté les 3 bundles (`bundle-core` / `bundle-components` / `bundle-edge`). Les modules Construction sont listés dans `bundles.json` ; Léo Construction charge `bundle-edge` via `App.ensureEdgeBundle()`. Le mode Léo suit la phase (`construction:ideation` / `route` / `activities`) ; le formulaire profil utilise `construction:profile-edit`.

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
- Le cycle de vie SSE contre un vrai endpoint de streaming : deux analyses concurrentes, reprise
  après coupure. L'annulation à la sortie d'onglet est désormais couverte par un test Playwright
  contre un flux bouchonné (§6, constat 10), pas contre un vrai serveur SSE.
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
- ~~**Précision de `appliesTo`**~~ : corrigé côté backend dans la deuxième passe (§6) —
  `appliesTo` ne porte plus que les nationalités qui déclenchent la règle, la fixture
  `admin-check.json` a été régénérée et le test de contrat épingle désormais qu'un voyageur hors du
  `appliesTo` ne reçoit pas l'item.
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
   rattachées. Depuis la deuxième passe, `appliesTo` ne contient que les nationalités **déclenchantes**
   (et `["*"]` pour une règle universelle), ce qui rend ce regroupement significatif.
4. **Loader de config ops différé** (lot 0.3) et synthèse construction empruntant la config Bifrost de
   plus-chat.
5. **`retain` / `pin-nuisance` / `profile-edit` répondent 501** : les critères d'acceptation
   correspondants ne peuvent pas être cochés.

---

## 6. Deuxième passe — review de suivi (verdict APPROVED, 12 constats non bloquants)

La review de l'implémentation ci-dessus a validé le travail et laissé 12 constats non bloquants.
Côté frontend :

| # | Constat de suivi | Statut | Détail |
|---|---|---|---|
| 1 (rendu) | Le regroupement par voyageur était décoratif : `appliesTo` portait toutes les nationalités du voyage | ✅ | Corrigé côté backend ; ici la fixture `admin-check.json` a été resynchronisée (l'eTA canadien passe de `["FR","US"]` à `["FR"]`) et `tests/construction-contract.test.cjs` épingle la sémantique restreinte : un voyageur **US seul** ne reçoit pas l'eTA canadien, aucun `appliesTo` n'est vide, et René (FR) comme Dinah (FR+US) le reçoivent toujours |
| 2 | La recopie des fixtures n'était contrôlée par rien | ✅ | `tests/fixtures/construction-contract/CHECKSUMS.txt` (manifeste sha256 committé des deux côtés) est vérifié par le test unitaire — hash de chaque fixture **et** égalité des listes de fichiers. Côté backend, `TestContractFixtures_Checksums` et `TestContractFixtures_FrontendCopyInSync` (comparaison octet à octet des deux répertoires quand les dépôts sont côte à côte). Vérifié par mutation : altérer une fixture ici fait tomber 3 assertions, altérer la copie backend fait tomber le test Go |
| 3 | Le report n'était visible qu'après l'action | ✅ | Les trois commandes concernées l'annoncent maintenant d'entrée, comme le faisait déjà « Épingler » : marqueur ⏳ dans le libellé, `title` explicite (« Pas encore branché : Léo n'écrit pas encore dans le seed, rien ne sera enregistré. »), classe `deferred` (opacité réduite), et pour le formulaire de profil un bandeau `#profile-edit-deferred` en tête. `js/components/discovery-panel.js`, `js/components/construction-view.js`, `css/theme.css`. **Les contrôles restent actionnables** : le corps 501 porte le détail exact du backend, et le traitement après action est inchangé (« Pas encore disponible », contrôle désactivé, aucun succès peint). Tests : `construction-checks.spec.js`, `discovery-panel.spec.js` |
| 10 | Un flux nuisances survivait à la sortie de l'onglet | ✅ | `js/app.js` : `_teardownTab(onglet quitté)` appelé depuis `switchTab` **et** depuis le routeur `handleHash` (retour navigateur, hash saisi à la main) ; il coupe le flux de `ConstructionView` et celui du panneau Plus. Les abandons par panneau (PR #73) et les contrôleurs par hôtel de Résa (`btn._nuisanceAbort`) sont inchangés : ils appartiennent à leurs boutons et restent hors de portée de `_teardownTab`. Test Playwright : le GET final n'est jamais émis après la sortie d'onglet (vérifié par mutation — retirer les deux appels fait tomber le test) |

Constats 4, 5, 6, 7, 9 (backend), 8 et 11 (acceptés comme documentés) et 12 (dépôt de specs) : voir
`tripkit-backend/docs/REVIEW-construction-fixes.md` §5.

`sw.js` : `CACHE_NAME` passé à `tripkit-121` (contenu de `js/` et `css/` modifié) ;
`tests/offline-core.spec.js` épingle ce nom. Aucun nouveau module, donc `ASSETS` et `index.html` sont
inchangés.

**Vérifications** (locales, comme la première passe — rien contre une instance qui tourne) :
`npm run test:unit` (11 fichiers, 35 assertions dans `construction-contract.test.cjs`) et
`npx playwright test` (130 passés, contre 128 avant cette passe : +2 tests).

---

## 7. Troisième passe — review v2 (verdict NEEDS_CHANGES, 8 constats dont 1 bloquant)

La restriction de `appliesTo` de la passe précédente était juste, mais elle a rendu **atteignable**
une branche de rendu qui ne l'était pas : un voyageur sans item recevait un `✅ Aucune démarche
spécifique`. Côté frontend :

| # | Constat v2 | Statut | Détail |
|---|---|---|---|
| 1 (bloquant) | Un panier de voyageur vide s'affichait en vert | ✅ | `js/components/construction-view.js` : la branche « aucun item pour ce voyageur » rend désormais « ⚠️ Aucune règle connue pour ce passeport : à vérifier auprès du consulat ou de l'ambassade du pays de destination. » (classe `.admin-unknown`, orange, jamais verte), et la branche « aucun item pour le voyage » « ⚠️ Aucune règle connue pour cette destination […] Ce silence n'est pas un feu vert. » La base ne couvre qu'une douzaine de destinations : zéro item veut dire « pas de règle connue », pas « rien à faire » (un passeport CN parti aux États-Unis a besoin d'un visa B1/B2, un passeport BR d'un visa canadien). Tests Playwright : groupe FR+CN sur la fixture réelle, et enveloppe à zéro item. Vérifié par mutation : remettre l'ancien libellé fait tomber les deux |
| 2 | La présence d'un item reste calculée sur l'union des nationalités | ✅ (côté surface) | Le moteur reste inchangé (le corriger change l'enveloppe, cf. §6) mais la limite n'est plus seulement dans ce doc : le panneau porte une note `.admin-limitation` — « Liste indicative : la présence d'un item est calculée sur l'ensemble des nationalités du voyage, pas passeport par passeport. Un item peut donc manquer pour l'un si un autre passeport du groupe en dispense. » Épinglée par le même test Playwright |
| 4 | Les flux nuisances de Résa survivaient à la sortie d'onglet | ✅ | `js/components/bookings-view.js` : les `AbortController` par hôtel sont rangés dans une `Map` de module (`_hotelNuisanceAborts`, clé `locationId`) en plus du bouton, et `BookingsView.abortHotelNuisanceStreams()` les coupe tous ; `js/app.js` l'appelle depuis `_teardownTab('hotels')`. Le contrôleur n'est donc plus perdu quand `render()` reconstruit `hotels-content`. Test Playwright dans `tests/bookings.spec.js` : le GET final n'est jamais émis après la sortie d'onglet (mutation vérifiée). **Limite inchangée et maintenant écrite dans le code** : `abort()` ne coupe que la lecture côté client, le job serveur continue d'interroger Overpass |
| 8 | La coupure via le routeur n'était pas testée | ✅ | Le test existant passait par `switchTab` (clic de la nav). Nouveau test : `page.goBack()`, donc `hashchange` → `handleHash` → `_teardownTab`, aucun `onclick` joué. Mutation vérifiée : retirer l'appel dans `handleHash` fait tomber ce test et pas l'autre |

Constats 3, 5, 6 et 7 (backend) : voir `tripkit-backend/docs/REVIEW-construction-fixes.md` §6.

`sw.js` : `CACHE_NAME` passé à `tripkit-122` (contenu de `js/` et `css/` modifié) ;
`tests/offline-core.spec.js` épingle ce nom. Aucun nouveau module : `ASSETS` et `index.html` sont
inchangés.

**Vérifications** (locales — rien contre une instance qui tourne, ni Overpass, ni Bifrost) :
`npm run test:unit` (11 fichiers, 35 assertions de contrat) et `npx playwright test`
(**134 passés**, contre 130 avant cette passe : +4 tests, aucune régression de compte).

---

## 8. Quatrième passe — review v3 (verdict NEEDS_CHANGES, 6 constats dont 2 bloquants)

La passe précédente avait fermé le faux feu vert **au niveau du voyageur** ; les deux constats
bloquants de la v3 sont le même défaut **un cran au-dessus**, sur la ligne d'en-tête du panneau et
sur le panneau santé. C'est la dernière passe de code : la boucle de review a consommé ses trois
tours, donc chaque correctif est vérifié par test **et** par mutation (retirer le correctif fait
tomber le test, ce qui est noté ci-dessous cas par cas).

| # | Constat v3 | Statut | Détail |
|---|---|---|---|
| 1 (bloquant) | L'en-tête admin restait `✅ Rien à faire` au-dessus de l'avertissement orange | ✅ | `js/components/construction-view.js` : la phrase de verdict n'est plus rendue quand `items` est vide (`parsed.items.length ? verdictSentence(...) : ''`). `worstVerdict([])` vaut `"ok"`, donc `AdminCheck` renvoie **verdict `ok` avec zéro item** dès qu'aucun pays n'est détecté, qu'aucune nationalité n'est connue (le cas ordinaire : `nationalities` est optionnel dans un seed, et absent de `js/seed/test-trip.js`) ou qu'aucune règle ne matche : le panneau affichait « rien à faire » **puis** « ce silence n'est pas un feu vert ». Le test de la passe précédente ne pouvait pas le voir, il servait `verdict:"none"` (vocabulaire *santé*, que le service admin n'émet jamais) : il sert maintenant `{"verdict":"ok","countries":["BR"],"items":[]}` et assert l'absence de la phrase elle-même (`not.toContainText('Rien à faire')`, `.admin-verdict` à 0, aucun `✅`). Mutation vérifiée : remettre `verdictSentence(parsed.verdict)` fait tomber les deux tests admin à zéro item |
| 2 (bloquant) | Le panneau santé rendait le silence de la spec pour une destination **non identifiée** | ✅ | `HealthCheck` répond `verdict:"none"` dans deux situations opposées. Le silence vert reste pour la première (pays détecté, aucune recommandation : `construction/SPEC.md` §7.2 impose de ne pas afficher de section) ; quand `countries` est **vide**, donc que `DetectCountries` n'a rien reconnu, le panneau rend « ⚠️ Destination non identifiée : aucun pays n'a pu être déduit du voyage, donc aucun contrôle n'a été fait. À compléter dans le seed, puis relancer. » (classe `.health-unknown`, orange). Aucun changement d'enveloppe n'a été nécessaire : `countries` vide est déjà le signal. Le panneau admin utilise le même libellé dans le même cas, au lieu de parler « de cette destination ». Deux tests Playwright, un par branche ; mutation vérifiée sur la branche orange |
| 4 | Les flux nuisances de Résa survivaient à un ré-affichage **sur place** | ✅ | `BookingsView.render()` appelle désormais `abortHotelNuisanceStreams()` avant de reconstruire le conteneur, ce que son propre commentaire annonçait déjà. `App.refreshFromBackend()` appelle `renderCurrentTab()` **sans changer d'onglet** (kick `visibilitychange` / `online` : verrouiller puis déverrouiller un téléphone pendant l'analyse), donc `hotels-content` était reconstruit sous un flux vivant et la ligne de progression ne se résolvait plus jusqu'à la sortie d'onglet. Nouveau test Playwright : après `App.reloadAllViews()` (= `renderCurrentTab()`), le GET final n'est jamais émis, plus aucune `.nuisance-progress` ne subsiste et le bouton est de nouveau actionnable. Mutation vérifiée : retirer l'appel fait tomber ce test et **pas** celui de la sortie d'onglet |

Constats 3, 5 et 6 (backend : ref du job `fixtures-cross-repo`, classe d'espaces du régex de
délimiteurs, axe du compromis mots composés) : voir `tripkit-backend/docs/REVIEW-construction-fixes.md`
§7.

`sw.js` : `CACHE_NAME` passé à `tripkit-123` (contenu de `js/` et `css/` modifié) ;
`tests/offline-core.spec.js` épingle ce nom. Aucun nouveau module : `ASSETS` et `index.html` sont
inchangés.

**Vérifications** (locales — rien contre une instance qui tourne, ni Overpass, ni Bifrost) :
`npm run test:unit` (35 assertions de contrat, inchangé) et `npx playwright test`
(**137 passés**, contre 134 avant cette passe : +3 tests, aucune régression de compte). Les specs
météo qui comptent les appels Open-Meteo bouchonnés échouent par intermittence sous charge
parallèle et passent en isolation — reproduit sur la base **avant** cette passe (`7ad1e0f`, où
`tests/route-weather-iso.spec.js:19` est tombé), donc préexistant et étranger à ce diff.
