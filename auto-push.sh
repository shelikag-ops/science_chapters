#!/bin/bash
# auto-push.sh — fswatch-driven auto-commit and push for Sarah Science Chapters
#
# Watches the repo, debounces edits by 60 seconds, then commits any changes
# and pushes to origin/main. Runs as a launchd agent so it survives reboots.
# Uses your macOS Keychain credentials for git push (no PAT in config).
#
# Install: see auto-push-install.md in this folder.

REPO="$HOME/Documents/Claude/Projects/Sarah Science Chapters"
LOG="$REPO/.auto-push.log"
DEBOUNCE_SECS=60
BRANCH="main"

cd "$REPO" || exit 1

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG"
}

push_if_changes() {
  cd "$REPO" || return
  # Clear stale locks if a prior git command was interrupted.
  rm -f .git/index.lock .git/HEAD.lock 2>/dev/null

  # Only auto-add files matching these patterns. Anything else
  # (binary drafts, scratch files, etc.) requires manual git add.
  git add 'chapter-*.html' 'index.html' 2>/dev/null

  # If nothing was staged, there's nothing for us to commit.
  if git diff --cached --quiet; then
    log "settled — no chapter changes to commit"
    return
  fi

  local file_list
  file_list=$(git diff --cached --name-only | head -5 | tr '\n' ' ')
  log "settled — committing chapters: ${file_list}"

  git commit -m "auto: $(date '+%Y-%m-%d %H:%M') ${file_list}" >> "$LOG" 2>&1

  if git push origin "$BRANCH" >> "$LOG" 2>&1; then
    log "✓ pushed"
  else
    log "✗ push failed (check Keychain credentials)"
  fi
}

log "auto-push starting (watching $REPO, debounce ${DEBOUNCE_SECS}s)"

# Catch up on any pending uncommitted changes from before the daemon started.
push_if_changes

# fswatch -o emits one line per batch of file events.
# --latency groups events that happen within N seconds into one batch.
# Excludes prevent self-trigger from log writes and git index churn.
FSWATCH=$(command -v fswatch)
[[ -z "$FSWATCH" ]] && FSWATCH=/opt/homebrew/bin/fswatch
[[ ! -x "$FSWATCH" ]] && FSWATCH=/usr/local/bin/fswatch
log "using fswatch at: $FSWATCH"

exec "$FSWATCH" -o \
  --latency "$DEBOUNCE_SECS" \
  --exclude='\.git/' \
  --exclude='\.auto-push.*\.log' \
  --exclude='\.DS_Store' \
  "$REPO" | while read -r _; do
    push_if_changes
done
