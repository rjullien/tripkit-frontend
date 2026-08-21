# Release Process — TripKit Frontend

> **Règle absolue :** Ne JAMAIS créer un tag/release sans d'abord bumper `version.json`.
> Le script `release.sh` fait tout — l'utiliser ou suivre ses étapes exactement.

## Le bon processus

```bash
# Option A : le script (recommandé, fait tout)
./release.sh patch "description du fix"
./release.sh minor "nouvelle feature"

# Option B : manuellement (si pas d'accès au script)
# Suivre EXACTEMENT ces étapes dans cet ordre :
```

### Étapes manuelles (si release.sh pas dispo)

1. **Bumper `version.json`** — OBLIGATOIRE sinon le cache-buster ne change pas et les navigateurs gardent les anciens JS :
   ```bash
   # cache++ (entier qui incrémente), soft = nouvelle version, data = date du jour
   cat > version.json << 'EOF'
   {"cache":205,"data":"2026-08-22","soft":"2.31.61"}
   EOF
   ```

2. **Commit + push sur main** :
   ```bash
   git add version.json
   git commit -m "release: v2.31.61 — description"
   git push origin main
   ```

3. **Tag + push tag** :
   ```bash
   git tag v2.31.61
   git push origin v2.31.61
   ```

4. **Créer la GitHub Release** (déclenche le CI build-and-push) :
   ```bash
   gh api repos/rjullien/tripkit-frontend/releases -X POST \
     -f tag_name="v2.31.61" -f target_commitish="main" \
     -f name="v2.31.61 — description" \
     -f body="..." -F draft=false -F prerelease=false
   ```

5. **Attendre le CI** (job `build-and-push`, ~90s) :
   ```bash
   # Vérifier : gh api repos/rjullien/tripkit-frontend/actions/runs --jq '.workflow_runs[0]'
   ```

6. **ArgoCD Image Updater déploie automatiquement** (~30-60s après le push image) :
   - Il surveille `ghcr.io/rjullien/tripkit-frontend` (stratégie: `newest-build`)
   - Il commit dans `BaptTF/vps-infra` → ArgoCD sync → nouveau pod
   - Vérifier : la page affiche le nouveau `soft` dans Plus > Infos app

## Ce qui se passe si on oublie version.json

- Le SW sert le shell depuis le cache (stale-while-revalidate)
- Le `?v=<cache>` dans les URLs des scripts ne change PAS
- → Les navigateurs avec un SW actif ne voient **jamais** le nouveau code
- → L'app reste bloquée sur l'ancienne version indéfiniment

## Déploiement — Qui fait quoi

| Composant | Rôle |
|-----------|------|
| GitHub Actions CI | Build Docker image + push sur ghcr.io (déclenché par `release` event) |
| ArgoCD Image Updater | Détecte nouvelle image → commit `.argocd-source` dans vps-infra |
| ArgoCD | Sync le commit → rolling update du pod sur le cluster |
| `BaptTF/vps-infra` | Repo GitOps source-of-truth (PAS `rjullien/tripkit/k3s/`) |

## ⚠️ Ce qui ne marche PAS

- Modifier `rjullien/tripkit/k3s/frontend-deployment.yaml` → ce fichier est un **archivage**, pas le live
- Créer une release sans bumper version.json → les navigateurs ne voient rien
- Pousser directement sur main sans tag → pas de CI build-and-push
- `gh release create` via `gh pr create`-style → ne marche pas dans ce sandbox, utiliser `gh api`

## Numérotation

- `soft` : semver `MAJOR.MINOR.PATCH` (ex: `2.31.60`)
- `cache` : entier incrémental (ex: `204`). C'est le cache-buster du SW.
- `data` : date ISO du dernier changement de seed/données (ex: `2026-08-21`)
