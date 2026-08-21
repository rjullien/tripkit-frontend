# AGENTS.md — tripkit-frontend

Instructions pour tout agent IA travaillant sur ce repo (Kiro, Cursor, Copilot, Claude, etc.)

---

## Release Process (CRITIQUE — à suivre à la lettre)

**Ne JAMAIS créer un tag/release sans d'abord bumper `version.json`.**

### Étapes obligatoires (dans cet ordre)

1. **Bumper `version.json`** :
   - `cache` : incrémenter de 1 (c'est le cache-buster du SW)
   - `soft` : nouvelle version semver
   - `data` : date ISO du jour

2. **Commit + push sur main**

3. **Tag semver + push tag** : `git tag vX.Y.Z && git push origin vX.Y.Z`

4. **Créer la GitHub Release** (déclenche le CI `build-and-push`) :
   ```bash
   gh api repos/rjullien/tripkit-frontend/releases -X POST \
     -f tag_name="vX.Y.Z" -f target_commitish="main" \
     -f name="vX.Y.Z — description" -f body="..." \
     -F draft=false -F prerelease=false
   ```

5. **Attendre CI green** (job `build-and-push`, ~90s)

6. **ArgoCD Image Updater déploie automatiquement** (~30-60s après push image)

### Pourquoi version.json est obligatoire

Le SW utilise `?v=<cache>` comme cache-buster sur tous les scripts. Sans bump :
- Les navigateurs gardent les anciens JS indéfiniment
- Le stale-while-revalidate du SW ne met pas à jour le bon fichier
- → L'app reste bloquée sur l'ancienne version

### Infra de déploiement

| Composant | Rôle |
|-----------|------|
| GitHub Actions CI | Build Docker + push ghcr.io (event: `release`) |
| ArgoCD Image Updater | Détecte nouvelle image → commit dans `BaptTF/vps-infra` |
| ArgoCD | Sync → rolling update du pod |
| `BaptTF/vps-infra` | Source of truth GitOps (PAS `rjullien/tripkit/k3s/`) |

### Ce qui ne marche PAS

- Modifier `rjullien/tripkit/k3s/frontend-deployment.yaml` (c'est un archivage, pas le live)
- Release sans bump version.json (navigateurs ne voient rien)
- Push sur main sans tag (pas de CI build)

---

## Services centralisés (backend)

**Référence : [`../tripkit/SERVICES.md`](https://github.com/rjullien/tripkit/blob/main/SERVICES.md)**

Le frontend ne doit **jamais** appeler directement un service externe (météo,
géocodage, Overpass, LLM). Tout passe par les endpoints backend qui encapsulent
les services centralisés. Voir le doc ci-dessus pour la liste complète.

---

## LLM / Safari

Toute action UI qui appelle un LLM (Léo, Discovery, Polarsteps, Construction)
suit le skill **tripkit-llm-jobs** (`.cursor/skills/tripkit-llm-jobs/SKILL.md`) :

- `POST` → 202 `{jobId}` (timeout 15 s), jamais un POST qui attend Bifrost
- stream `GET /leo/jobs/{id}/stream` + `resumeIfNeeded`
- store `GET` si le SSE tombe (lock iPhone)

Ne pas « corriger » un 502 en montant `timeoutMs` à 120 s / 240 s.

---

## Architecture PWA — Boot & Refresh

Le boot de l'app suit ce pattern (ne pas casser) :

1. **SW stale-while-revalidate** : sert le shell depuis le cache immédiatement
2. **App.init()** : si localStorage a des données → render instantané
3. **refreshFromBackend()** : en background, vérifie la version → re-fetch si changée → re-render
4. **setupConnectivityResume()** : relance le refresh à chaque retour dans l'app

### Règles du refresh

- `probe()` + `getTrips()` sont lancés en **parallèle** (Promise.all)
- `syncConstructionData()` est **fire-and-forget** (jamais await sur le chemin de boot)
- Le version check compare `*-data-version` en localStorage vs backend
- `renderCurrentTab()` n'est appelé que si `loadTripSeed` retourne `'updated'`
- Données corrompues (pas de `trip` ou `days[]` vide) → force refresh
- Données non rafraîchies depuis 6h → force refresh même si version identique
