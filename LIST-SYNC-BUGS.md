# LIST SYNC BUGS — Brief pour Claude Code

## Contexte

TripKit frontend — checklist partagée voyage (Malte). Vanilla JS, pas de framework.
Les fichiers concernés sont dans `/home/node/projects/tripkit-frontend/` :
- `js/store.js` — localStorage wrapper avec timestamps
- `js/api.js` — sync PATCH avec le backend
- `js/components/list.js` — rendu et event handling

Backend : `http://tripkit-backend.tripkit.svc.cluster.local:3001`  
Endpoint sync : `PATCH /api/trips/:tripId/lists/:listId/sync`

## Fonctionnalité attendue

Les utilisateurs (René + Nicole, 2 iPhones) partagent une checklist.
- Chaque item peut être coché/décoché (stocké en localStorage + sync backend)
- L'utilisateur peut ajouter des **custom items** qui commencent en `shared: false`
- Un bouton **toggle-share** (↑ → ☁️) permet de partager l'item avec le groupe
- Les items masqués (bouton ✕) sont cachés mais récupérables

## Bugs actuels (tous liés au sync)

### 1. Custom item disparaît quand on clique toggle-share

**Symptôme :** L'utilisateur ajoute un item, clique ↑ pour partager → l'item disparaît du DOM.

**Analyse :** Le `render()` après `toggleShareItem()` devrait afficher l'item. Les tests unitaires prouvent que le Store conserve l'item. Le problème est une **race condition async** entre le `backgroundSync(listData)` dans le handler et quelque chose qui interfère avec le render/DOM.

**Note :** Le `backgroundSyncTrip` au startup a été désactivé (c'était la source principale). Mais le bug persiste peut-être via le `backgroundSync` appelé DANS le handler toggle-share (`API.syncList` → response → side effects ?).

### 2. Checks se décochent tout seuls

**Symptôme :** On coche prise UK → on coche un autre item → prise UK se décoche.

**Cause identifiée :** Le serveur avait des `checked: false` avec des timestamps récents (posés par un ancien bug de double-toggle, maintenant fixé). Le `setCheck()` du sync écrasait le local.

**Fix en place :** Grace period de 10s dans `setCheck()` — le sync ne peut pas décocher un item coché < 10s. **Mais c'est un band-aid.** La vraie solution serait de ne jamais accepter un `checked: false` du serveur si le client vient de le mettre à true dans la même session (ou de versionner les opérations).

### 3. Items masqués disparaissent

**Symptôme :** On masque des items → plus tard le bouton "👁️ X masqués" disparaît.

**Cause :** Le sync retournait `hidden: []` et le code écrasait le local. 

**Fix en place :** Le merge hidden est maintenant un union (local + server). Si le server retourne [], on ne touche pas au local.

## Architecture du sync actuel

```
User action (check/add/delete)
  → Store.toggleCheck() / addCustomItem()
  → ListComponent.render() (sync, immédiat)
  → backgroundSync(listData)
    → API.syncList(tripId, listId)
      → PATCH backend avec {checks, custom, hidden}
      → Response: {merged: {checks, custom}, hidden, serverSyncAt}
      → Applique merged au localStorage via Store.setCheck/set
```

Le `backgroundSyncTrip` au startup est **désactivé** car il causait des race conditions.

## Ce qui doit être fixé

1. **Toggle-share ne doit pas faire disparaître l'item.** Quelque chose dans le flow `toggleShareItem → render → backgroundSync → response` provoque la disparition. Les tests unitaires passent → c'est un problème de timing/async spécifique au browser.

2. **Le sync response ne doit JAMAIS annuler une action locale.** Le pattern actuel (setCheck avec grace period 10s) est fragile. Il faudrait un mécanisme plus robuste (vector clock, ou simplement : ne jamais appliquer le merged state du sync au localStorage — le sync est push-only, pas pull).

3. **Réactiver backgroundSyncTrip de manière safe** pour que les items de l'autre device apparaissent sans reload complet. Possible solutions :
   - Ne pas appliquer le merged state au localStorage si l'utilisateur a interagi dans les dernières 5s
   - Ou ne l'appliquer que pour les items que le client n'a PAS touchés dans cette session
   - Ou utiliser un event bus qui defer le merge au prochain `render()` idle

## Contraintes

- Vanilla JS (pas de React/Vue)
- localStorage comme source de vérité locale
- iOS Safari (où les bugs sont plus visibles que sur Chrome)
- Le backend fait du last-write-wins sur les timestamps
- 35 tests unitaires existants dans `tests/list-unit.test.cjs` et `tests/list-render.test.cjs` — ne pas les casser

## Pour lancer les tests

```bash
node tests/list-unit.test.cjs    # 19 tests Store logic
node tests/list-render.test.cjs  # 16 tests Render logic
```

## Proposition d'architecture cible

**Push-only sync** : le client pousse ses changements au serveur mais n'applique JAMAIS le merged response au localStorage local. Les items de l'autre device sont chargés UNIQUEMENT au chargement initial de la page (via le seed endpoint `/trips/:id/seed` qui inclut les listes).

Ça élimine 100% des race conditions. Le trade-off : les items de Nicole n'apparaissent chez René qu'au prochain reload (pas en temps réel). C'est acceptable pour une checklist voyage.
