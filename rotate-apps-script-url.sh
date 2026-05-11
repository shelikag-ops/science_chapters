#!/bin/bash
#
# Rotates the APPS_SCRIPT_URL secret to point at the NEW Apps Script deployment
# (the one created after archiving the broken v1 deployment), then redeploys
# the Worker so the change takes effect.
#
# Run once:
#   bash "/Users/nitin/Documents/Claude/Projects/Sarah Science Chapters/rotate-apps-script-url.sh"
#
# After this finishes, take a real quiz on chapter-a3-air-substance.html — the
# Worker will forward to the new Apps Script URL and your Sheet/Drive will get
# fresh rows + PDFs automatically.
#
# You can delete this file after it runs successfully.

set -e

WORKER_DIR="/Users/nitin/Documents/Claude/Projects/Sarah Homeschooling"
NEW_URL="https://script.google.com/macros/s/AKfycbyBMFHlDB22vbjscc2EYjWAXuG6MvnKfyTH2DMrXxtOKlcNnH-nOhg83a-GnH09jsVyBg/exec"

echo ""
echo "▸ Rotating APPS_SCRIPT_URL secret in Cloudflare..."
cd "$WORKER_DIR"
printf "%s" "$NEW_URL" | npx wrangler secret put APPS_SCRIPT_URL
echo ""

echo "▸ Redeploying Worker..."
npx wrangler deploy
echo ""

echo "✓ Done. The Worker now points at your new Apps Script deployment."
echo "  Test it: take a quiz on chapter-a3, wait ~30 seconds, check your Sheet."
