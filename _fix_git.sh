#!/bin/bash
# One-shot recovery: align local .git with origin/main, preserve resequenced index.html.
set -e

cd "/Users/nitin/Documents/Claude/Projects/Sarah Science Chapters"

echo "==> Removing stuck index.lock"
rm -f .git/index.lock

echo "==> Backing up resequenced index.html"
cp index.html /tmp/index_resequenced.html

echo "==> Force-aligning local main with origin/main (overwrites tracked files)"
git fetch origin
git checkout -B main origin/main --force

echo "==> Restoring resequenced index.html"
cp /tmp/index_resequenced.html index.html

echo "==> Done. Status:"
git status --short

echo ""
echo "Local main now tracks origin/main."
echo "index.html is the resequenced version (modified vs origin)."
echo ""
echo "To commit and push the resequence:"
echo "  git add index.html"
echo "  git commit -m \"Resequence chapters to match BFSU Volume I parallel flow chart\""
echo "  git push origin main"
