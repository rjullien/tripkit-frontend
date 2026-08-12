# TripKit — Spec listes & sync (source de vérité)

> Spec produit — ne pas modifier sans revue explicite.
> Toute PR sur les listes doit faire passer `tests/list-spec.test.cjs` (frontend)
> et les `TestSync_*` / `TestRepro*` (backend).

## Modèle

Une liste = items seed + items custom.

### Liste partagée Oui / Non

| | Oui (défaut) | Non |
|--|--------------|-----|
| Nouveaux items custom | `shared: true` → sync | `shared: false` → local |
| **Coches** | **partagées** (merge serveur) | **locales** (jamais envoyées) |
| Toggle Oui | promeut les items locaux | — |
| Toggle Non | futurs ajouts locaux ; cloud déjà publié reste jusqu’à 🔒/🗑 | |

Préférence localStorage : `{listId}-list-shared`. Défaut = **Oui**.

### Toujours local
- Masquage d’items
- Items `shared: false`
- Coches si liste **Non**

## Règles coches (listes partagées Oui seulement)

1. État `{ checked, updatedAt }`
2. **`updatedAt` le plus récent gagne**
3. À ts égal : **coché gagne** sur non coché
4. Pull à l’ouverture + **re-pull ~12 s** tant que la liste est ouverte + re-pull au resume (visibility/online)
5. Garde FE : un uncheck distant n’écrase pas une coche locale < 10 s
6. Liste Non → client envoie `checks: {}` et ignore `merged.checks`

## Règles items custom

1. Naissance selon Liste partagée (défaut Oui)
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

```bash
node tests/list-spec.test.cjs
npm run test:unit
# BE
CGO_ENABLED=1 go test ./internal/handlers/ -run 'TestSync_|TestRepro' -count=1
```
