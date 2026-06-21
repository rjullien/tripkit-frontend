# TripKit — Spec listes & sync (source de vérité)

> Décidée par René. Ne pas la modifier sans son accord explicite.
> Toute PR sur les listes doit faire passer `tests/list-spec.test.cjs` (frontend)
> et les `TestRepro*` (backend). Pas de changement de feature sans validation.

## Modèle

Une liste = des items intégrés (du seed) + des items custom ajoutés par l'utilisateur.
Chaque item a un état **coché / masqué** propre à chaque personne.

### Ce qui reste LOCAL (jamais transmis, par device)
- **Coche** (fait / pas fait) — chacun la sienne. La coche ne quitte JAMAIS le téléphone.
- **Masquage** d'un item — par device.
- **Item custom non partagé** (`shared: false`) — visible seulement par son créateur.

### Ce qui est PARTAGÉ au groupe (seulement sur action explicite)
- **L'item custom** lui-même (son texte + sa section), via le bouton ☁️.
- C'est **l'item** qui voyage, **pas** son état coché.

## Règles

1. Un item custom **naît local** (`shared: false`).
2. Bouton **☁️ / 🔒** : publie l'item au groupe (☁️) ou le garde local (🔒).
   - Publier → l'item apparaît chez les autres au prochain sync ; chacun le coche chez soi.
   - Retirer (un-share) → l'item disparaît chez les autres mais **reste en local** chez le créateur.
3. **Supprimer (🗑)** un item → suppression propagée à tous (tombstone), **sans résurrection**.
4. Le **sync ne transporte que** : les items partagés + les suppressions (`deletedCustom`).
   Jamais de coches, jamais de masquages.
5. Le serveur fait **autorité sur les items partagés** uniquement. À la réception, on :
   - ajoute les items partagés publiés par les autres (sauf tombstone local) ;
   - retire les items partagés que le groupe n'a plus (supprimés/retirés par un pair) ;
   - ne touche JAMAIS aux coches ni aux items locaux.

## Conséquence

La classe de bugs « ça se décoche quand je coche autre chose / sur l'autre device »
est **impossible par construction** : les coches ne transitent jamais.

## Contrat sync (PATCH /trips/{tripId}/lists/{listId}/sync)

Requête (client → serveur) :
```json
{
  "deviceId": "…",
  "custom":        { "<id>": { "text": "…", "section": 0, "createdAt": 1718… } },  // items partagés UNIQUEMENT
  "deletedCustom": { "<id>": 1718… }                                                // tombstones (id → deletedAt)
}
```
Réponse (serveur → client) :
```json
{ "merged": { "custom": { "<id>": { "text": "…", "section": 0, "createdAt": 1718… } } }, "serverSyncAt": 1718… }
```
Le serveur ne renvoie plus rien d'autre d'utile au client (les coches éventuellement
présentes en base sont ignorées côté client).

## Tests (exécutables)

- **Frontend (isolation, mocks)** : `tests/list-spec.test.cjs`
  Charge le vrai `js/store.js` (localStorage mocké), 2 devices (René/Nicole),
  backend mock reproduisant la sémantique serveur. Couvre : coche locale,
  création locale, partage, coche personnelle d'un item partagé, suppression
  propagée + anti-résurrection, retrait/re-partage.
  ```bash
  node tests/list-spec.test.cjs
  ```
- **Backend (Go, SQLite mémoire)** : `internal/handlers/repro_bug_test.go`
  `TestReproA..F` — dont la non-résurrection des items supprimés (tombstones).
  ```bash
  CGO_ENABLED=1 go test ./internal/handlers/ -run TestRepro -v
  ```

## Limite connue (assumée, non bloquante)

Le re-partage d'un item après l'avoir retiré le même **millième de seconde** que le
retrait est ignoré (garde anti-résurrection `deletedAt >= createdAt`). En usage réel
les actions sont espacées → sans effet. Ne PAS « corriger » en relâchant le garde.
