# TripKit — Spec listes & sync (source de vérité)

> Spec produit — ne pas modifier sans revue explicite.
> Toute PR sur les listes doit faire passer `tests/list-spec.test.cjs` (frontend)
> et les `TestSync_*` / `TestRepro*` (backend).

## Modèle

Une liste = items seed + items custom.

### Synchro : pas d’interrupteur global

Les **coches** et les **items custom** d’une liste du voyage se synchronisent
toujours. Un item reste privé uniquement si l’utilisateur le verrouille avec
**🔒** sur sa ligne.

> Historique : jusqu’à 2.31.3 un réglage par appareil `{listId}-list-shared`
> coupait *toute* la synchro (coches **et** items, dans les deux sens) dès qu’il
> passait à Non — sans message, et sans que l’autre téléphone puisse le voir.
> Le réglage est supprimé ; `Store.migrateLegacyListShare()` l’efface et
> repromeut les items qu’il avait bloqués.

### Toujours local
- Masquage d’items
- Items verrouillés 🔒 (`shared: false`)

### État de synchro visible

Chaque liste affiche son dernier résultat de sync (`{listId}-sync-state`) :
`☁️ Synchronisé il y a 12 s`, `🔌 Hors ligne — reprise auto`,
`⚠️ Liste absente du serveur (404)`, `⚠️ Liste perso d’un autre compte (403)`.
Un échec ne doit **jamais** être avalé silencieusement.

## Règles coches

1. État `{ checked, updatedAt }`
2. **`updatedAt` le plus récent gagne** (sur le serveur, et pour les coches *dirty* locales)
3. À ts égal : **coché gagne** sur non coché
4. Pull à l’ouverture + **re-pull ~12 s** tant que la liste est ouverte + re-pull au resume (visibility/online)
5. Garde FE : un uncheck distant n’écrase pas une coche locale < 10 s (**dirty** seulement)
6. **Push** : n’envoie que les coches **dirty** (togglées localement depuis le dernier push réussi) — évite qu’un téléphone avec des `updatedAt` locaux périmés/futurs écrase les coches des autres
7. **Pull** : envoie `checks: {}`, puis applique `merged.checks` en **force** pour tout item non dirty (le serveur fait foi)

## Règles items custom

1. Naissance partagée (`shared: true`)
2. 🔒 sur la ligne = privé ; ☁️ = republié
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

`checks` rempli en push (dirty only), vide en pull.

## Tests

`list-spec.test.cjs` recopie la logique de `syncList` : il valide les règles,
pas le code livré. `list-sync-two-devices.test.cjs` pilote le **vrai** `api.js`
de deux appareils contre un mock HTTP du backend — c’est lui qui attrape les
régressions de transport (gate silencieux, 403/404 avalés).

```bash
node tests/list-spec.test.cjs
node tests/list-sync-two-devices.test.cjs
npm run test:unit
# BE
CGO_ENABLED=1 go test ./internal/handlers/ -run 'TestSync_|TestRepro' -count=1
```
