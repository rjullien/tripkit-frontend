#!/bin/bash
# TripKit Frontend — Release Script
# Usage: ./release.sh [patch|minor|major] "Release description"
# Example: ./release.sh patch "fix version.json + langon update"
#
# What it does:
# 1. Bumps version.json (cache++, data=today, soft=new version)
# 2. Commits + pushes
# 3. Tags + pushes tag
# 4. Creates GitHub release
# 5. Passes repo public, waits for build, re-passes private
# 6. Bumps .argocd-source in vps-infra + pushes

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
FRONTEND_DIR="$SCRIPT_DIR"
INFRA_DIR="/home/node/projects/vps-infra"
ARGOCD_SOURCE="$INFRA_DIR/workloads/tripkit-frontend/.argocd-source-tripkit-frontend.yaml"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
err() { echo -e "${RED}[✗]${NC} $1"; exit 1; }

# Args
BUMP_TYPE="${1:-patch}"
DESCRIPTION="${2:-Release}"

if [[ ! "$BUMP_TYPE" =~ ^(patch|minor|major)$ ]]; then
  err "Usage: $0 [patch|minor|major] \"description\""
fi

cd "$FRONTEND_DIR"

# 1. Read current version.json
CURRENT_SOFT=$(node -p "require('./version.json').soft")
CURRENT_CACHE=$(node -p "require('./version.json').cache")

# Compute new version
IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT_SOFT"
case "$BUMP_TYPE" in
  major) MAJOR=$((MAJOR + 1)); MINOR=0; PATCH=0 ;;
  minor) MINOR=$((MINOR + 1)); PATCH=0 ;;
  patch) PATCH=$((PATCH + 1)) ;;
esac
NEW_VERSION="$MAJOR.$MINOR.$PATCH"
NEW_CACHE=$((CURRENT_CACHE + 1))
TODAY=$(date -u +%Y-%m-%d)

log "Bumping: v$CURRENT_SOFT → v$NEW_VERSION (cache $CURRENT_CACHE → $NEW_CACHE, data $TODAY)"

# 2. Update version.json
cat > version.json << EOF
{"cache":$NEW_CACHE,"data":"$TODAY","soft":"$NEW_VERSION"}
EOF

# 3. Commit + push
git add version.json
git commit -m "release: v$NEW_VERSION — $DESCRIPTION"
git push
NEW_SHA=$(git rev-parse --short HEAD)
log "Committed: $NEW_SHA"

# 4. Tag + release
TAG="v$NEW_VERSION"
git tag "$TAG"
git push origin "$TAG"
gh release create "$TAG" --title "$TAG — $DESCRIPTION" --notes "## $DESCRIPTION

- Version: $NEW_VERSION
- Cache: $NEW_CACHE
- Data: $TODAY
- SHA: $NEW_SHA"
log "Release created: $TAG"

# 5. Build: public → build → private
warn "Passing repo PUBLIC for build..."
gh api repos/rjullien/tripkit-frontend -X PATCH -f visibility=public > /dev/null 2>&1

# Wait for build to start
sleep 5

# Get the run ID
RUN_ID=$(gh run list --limit 1 --json databaseId -q '.[0].databaseId')
log "Build started: run $RUN_ID"

# Poll until done (max 120s)
ELAPSED=0
while [ $ELAPSED -lt 120 ]; do
  STATUS=$(gh run list --limit 1 --json status -q '.[0].status')
  if [ "$STATUS" = "completed" ]; then
    CONCLUSION=$(gh run list --limit 1 --json conclusion -q '.[0].conclusion')
    if [ "$CONCLUSION" = "success" ]; then
      log "Build SUCCESS in ${ELAPSED}s"
      break
    elif [ "$CONCLUSION" = "failure" ]; then
      warn "Build failed — retrying once..."
      gh run rerun "$RUN_ID"
      sleep 5
      ELAPSED=0
      RUN_ID=$(gh run list --limit 1 --json databaseId -q '.[0].databaseId')
      continue
    fi
  fi
  sleep 5
  ELAPSED=$((ELAPSED + 5))
done

if [ $ELAPSED -ge 120 ]; then
  err "Build timed out after 120s!"
fi

# Re-private
gh api repos/rjullien/tripkit-frontend -X PATCH -f visibility=private > /dev/null 2>&1
log "Repo back to PRIVATE"

# 6. Bump ArgoCD source
cd "$INFRA_DIR"
git pull origin main --rebase 2>/dev/null || true

cat > "$ARGOCD_SOURCE" << EOF
kustomize:
  images:
  - ghcr.io/rjullien/tripkit-frontend:sha-$NEW_SHA
EOF

git add "$ARGOCD_SOURCE"
git commit -m "chore(tripkit): bump frontend to sha-$NEW_SHA ($TAG)"
git push origin main
log "ArgoCD source bumped to sha-$NEW_SHA"

# 7. Import ALL seeds into backend
log "Importing seeds into backend..."
cd "$FRONTEND_DIR"
BACKEND_URL="http://tripkit-backend.tripkit.svc.cluster.local:3001"

for SEED_FILE in js/seed/*.js; do
  SEED_NAME=$(basename "$SEED_FILE" .js)
  echo -n "  → $SEED_NAME... "
  OUTPUT=$(node seed-import.cjs --api "$BACKEND_URL" --seed "$SEED_FILE" 2>&1)
  if echo "$OUTPUT" | grep -q "Import complete"; then
    echo -e "${GREEN}✓${NC}"
  else
    echo -e "${YELLOW}⚠ $(echo $OUTPUT | tail -1)${NC}"
  fi
done
log "All seeds imported into backend"

echo ""
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo -e "${GREEN}  🚀 Released $TAG (sha-$NEW_SHA)${NC}"
echo -e "${GREEN}  ArgoCD will deploy in ~30s${NC}"
echo -e "${GREEN}  Backend data refreshed ✓${NC}"
echo -e "${GREEN}═══════════════════════════════════════${NC}"
