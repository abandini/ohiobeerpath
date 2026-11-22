#!/bin/bash
# The monthly re-check, as launchd runs it (scripts/ops/com.brewerytrip.monthly-check.plist): the full run on the 1st,
# the confirming pass on the 4th. By hand: scripts/ops/monthly-check.sh [--confirm] [any option of monthly-check.mjs].
# Read docs/monthly-check.md. The job publishes nothing: it observes, keeps state and writes a report and proposals.
set -u
REPO="${MONTHLY_REPO:-/Users/auto1/CascadeProjects/ohiobrewpath}"
DATA="${MONTHLY_DATA_DIR:-$HOME/brewerytrip-monthly}"
LOG_DIR="${MONTHLY_LOG_DIR:-$HOME/logs}"
# launchd starts with almost no PATH: node, npx and git are looked for in the usual places.
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:${PATH:-}"
mkdir -p "$LOG_DIR" "$DATA" || exit 2
DATA="$(cd "$DATA" && pwd -P)" || exit 2
export MONTHLY_DATA_DIR="$DATA"
cd "$REPO" || { echo "monthly check: no repository at $REPO"; exit 2; }

# One run at a time, from before the pull to the end. mkdir either makes the lock or fails: there is no gap between
# looking and taking. A lock that is already there is reported and left alone, however old it is.
LOCK="$DATA/lock"
if ! mkdir "$LOCK" 2>/dev/null; then
  if [ -n "$(find "$LOCK" -maxdepth 0 -mmin +720 2>/dev/null)" ]; then
    echo "monthly check: STOPPED. A lock more than 12 hours old is at $LOCK ($(cat "$LOCK/info.json" 2>/dev/null)). It was not removed: check that no run is going, then delete that directory by hand."
  else
    echo "monthly check: STOPPED. Another run holds the lock at $LOCK ($(cat "$LOCK/info.json" 2>/dev/null))."
  fi
  exit 2
fi
printf '{"pid": %s, "started": "%s", "by": "monthly-check.sh"}\n' "$$" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" > "$LOCK/info.json"
trap 'rm -rf "$LOCK"' EXIT
export MONTHLY_LOCK_HELD="$LOCK"

# Read what is live: bring this checkout level with origin/main when that is a plain fast-forward. If it is not, the
# checks run on what is here.
if [ "$(git rev-parse --abbrev-ref HEAD 2>/dev/null)" = "main" ]; then
  git pull --ff-only --quiet origin main || echo "monthly check: could not fast-forward to origin/main; running on this checkout as it is"
fi

mode=""
if [ "$(date +%d)" = "04" ]; then mode="--confirm"; fi
for a in "$@"; do if [ "$a" = "--confirm" ]; then mode=""; fi; done   # given by hand: do not pass it twice

node scripts/monthly-check.mjs $mode "$@" 2>&1 | tee -a "$LOG_DIR/brewerytrip-monthly-check.log"
exit "${PIPESTATUS[0]}"
