#!/bin/bash
#
# One-shot deploy for Sheets + Drive export.
#
# Run this once after deploying the Apps Script:
#   bash "/Users/nitin/Documents/Claude/Projects/Sarah Science Chapters/deploy-sheets-export.sh"
#
# It does four things:
#   1. Copies the updated chapter-quiz-sync.js into your Worker repo
#   2. Sets the APPS_SCRIPT_URL secret (baked in below)
#   3. Prompts you for the SHARED_SECRET (hidden input) and sets it
#   4. Runs wrangler deploy
#
# You can safely delete this file after it finishes.

set -e

WORKER_DIR="/Users/nitin/Documents/Claude/Projects/Sarah Homeschooling"
SOURCE_FILE="/Users/nitin/Documents/Claude/Projects/Sarah Science Chapters/worker/chapter-quiz-sync.js"
APPS_SCRIPT_URL="https://script.google.com/macros/s/AKfycbxyQSirK31wH-HEl4zPCE1WIHAFIv-u5LFlhjkCnKxGnm97tPZ1nn751QbDzglC_k6zgg/exec"

echo ""
echo "═══════════════════════════════════════════════════════"
echo "  Sarah Chapter Sync — Sheets + Drive deploy"
echo "═══════════════════════════════════════════════════════"
echo ""

# --- Step 1: Copy the updated worker file --------------------------
echo "▸ Step 1/4: Copying updated worker code..."
if [ ! -f "$SOURCE_FILE" ]; then
  echo "  ✗ Source file not found: $SOURCE_FILE"
  echo "    (Did the Sarah Science Chapters folder move?)"
  exit 1
fi

EXISTING=$(find "$WORKER_DIR" -name "chapter-quiz-sync.js" -not -path "*/node_modules/*" 2>/dev/null | head -1)
if [ -n "$EXISTING" ]; then
  cp "$SOURCE_FILE" "$EXISTING"
  echo "  ✓ Copied to: $EXISTING"
else
  cp "$SOURCE_FILE" "$WORKER_DIR/chapter-quiz-sync.js"
  echo "  ✓ Copied to: $WORKER_DIR/chapter-quiz-sync.js (no existing file found)"
fi
echo ""

# --- Step 2: cd into Worker dir and set APPS_SCRIPT_URL ------------
cd "$WORKER_DIR"

if [ ! -f "wrangler.toml" ]; then
  echo "  ✗ No wrangler.toml in $WORKER_DIR — wrong Worker directory?"
  exit 1
fi

echo "▸ Step 2/4: Setting APPS_SCRIPT_URL secret..."
printf "%s" "$APPS_SCRIPT_URL" | npx wrangler secret put APPS_SCRIPT_URL
echo ""

# --- Step 3: Prompt for SHARED_SECRET ------------------------------
echo "▸ Step 3/4: Setting APPS_SCRIPT_SECRET secret"
echo "  Paste the SHARED_SECRET string you put in the Apps Script."
echo "  (Input is hidden — you won't see characters as you paste.)"
printf "  Secret: "
read -s SHARED_SECRET
echo ""
echo ""

if [ -z "$SHARED_SECRET" ]; then
  echo "  ✗ Empty secret. Aborting."
  exit 1
fi

printf "%s" "$SHARED_SECRET" | npx wrangler secret put APPS_SCRIPT_SECRET
echo ""

# --- Step 4: Deploy ------------------------------------------------
echo "▸ Step 4/4: Deploying Worker..."
npx wrangler deploy
echo ""

echo "═══════════════════════════════════════════════════════"
echo "  ✓ Done."
echo ""
echo "  Next: take a quiz on chapter-a3-air-substance.html,"
echo "  wait ~30 seconds, then open your Google Sheet."
echo "  A new row should appear with a PDF link."
echo "═══════════════════════════════════════════════════════"
