# TripKit — Spec listes & sync (source de vérité)

> Spec produit — ne pas modifier sans revue explicite.
> Toute PR sur les listes doit faire passer `tests/list-sync-two-devices.test.cjs`
> (frontend — le vrai `api.js`) et les `TestSync_*` / `TestRepro*` (backend).

## Modèle

Une liste = items seed + items custom.

### Liste partagée Oui / Non

Bouton en haut de chaque liste. Défaut selon le **type seed**, pas un flag
aveugle à `true` :

| Type | Exemple | Défaut |
|------|---------|--------|
| `packing` | Checklist valise / vêtements (`checklist-*`) | **Non** — coches sur cet appareil |
| `todo` | Avant de partir (`avant-de-partir-*`) | **Oui** — coches et items au groupe |
| autre (`shopping`…) | Courses | **Oui** |

| | Oui | Non |
|--|-----|-----|
| Nouveaux items custom | `shared: true` → sync | `shared: false` → local |
| **Coches** | **partagées** (merge serveur) | **locales** (jamais envoyées ni appliquées) |
| Toggle Oui | promeut les items locaux | — |
| Toggle Non | futurs ajouts locaux ; cloud déjà publié reste jusqu’à 🔒/🗑 | |

Préférence : `{listId}-list-shared`. Si absente → défaut ci-dessus.

Un item peut encore être forcé local/cloud avec 🔒 / ☁️ sur sa ligne.

### Toujours local
- Masquage d’items
- Items `shared: false`
- Coches si liste **Non** (valise par défaut)

### État de synchro visible

Sous le bouton, le dernier résultat de sync (`{listId}-sync-state`) :
`☁️ Synchronisé il y a 12 s`, `🔒 Coches sur cet appareil`,
`🔌 Hors ligne — reprise auto`, `⚠️ Liste absente du serveur (404)`.
Un échec ne doit **jamais** être avalé silencieusement.

## Règles coches (listes partagées Oui seulement)

1. État `{ checked, updatedAt }`
2. **`updatedAt` le plus récent gagne** (sur le serveur, et pour les coches *dirty* locales)
3. À ts égal : **coché gagne** sur non coché
4. Pull à l’ouverture + **re-pull ~12 s** tant que la liste est ouverte + re-pull au resume (visibility/online)
5. Garde FE : un uncheck distant n’écrase pas une coche locale < 10 s (**dirty** seulement)
6. Liste Non → client envoie `checks: {}` et ignore `merged.checks`
7. **Push** : n’envoie que les coches **dirty**
8. **Pull** : envoie `checks: {}`, puis applique `merged.checks` en **force** pour tout item non dirty

## Règles items custom

1. Naissance selon Liste partagée (packing = Non, avant-de-partir = Oui)
2. ☁️ / 🔒 override ponctuel
3. 🗑 → tombstone, anti-résurrection
4. Pull à l’ouverture + re-render si merge
5. Re-pull périodique (~12 s) tant que la liste reste ouverte ; aussi au resume app

## Contrat sync

```json
{
  "deviceId": "…",
  "custom": { "<id>": { "text": "…", "section": 0, "createdAt": 1718… } },
  "deletedCustom": { "<id>": 1718… },
  "checks": { "<itemId>": { "checked": true, "updatedAt": 1718… } }
}
```

`checks` rempli seulement si Liste partagée Oui, sinon `{}`.

## Tests

`tests/list-sync-two-devices.test.cjs` pilote le **vrai** `js/api.js` + `js/store.js`
depuis deux appareils contre un stub HTTP. Pas de copie de `syncList`.

```bash
node tests/list-sync-two-devices.test.cjs
npm run test:unit
# BE
CGO_ENABLED=1 go test ./internal/handlers/ -run 'TestSync_|TestRepro' -count=1
```
