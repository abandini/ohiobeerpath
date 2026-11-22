#!/bin/bash
# The monthly re-check, as launchd runs it (scripts/ops/com.brewerytrip.monthly-check.plist): the full run on the 1st,
# the confirming pass on the 4th. By hand: scripts/ops/monthly-check.sh [--confirm] [any option of monthly-check.mjs].
# Read docs/monthly-check.md. Nothing is published unless MONTHLY_AUTOPUBLISH=1 is set in the environment.
set -u
REPO="${MONTHLY_REPO:-/Users/auto1/CascadeProjects/ohiobrewpath}"
LOG_DIR="${MONTHLY_LOG_DIR:-$HOME/logs}"
# launchd starts with almost no PATH: node, npx and git are looked for in the usual places.
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:${PATH:-}"
mkdir -p "$LOG_DIR"
cd "$REPO" || { echo "monthly check: no repository at $REPO"; exit 2; }

# Check what is live: bring this checkout level with origin/main when that is a plain fast-forward. If it is not, the
# checks still run on what is here, and the job will not publish (it publishes only from an up-to-date main).
if [ "$(git rev-parse --abbrev-ref HEAD 2>/dev/null)" = "main" ]; then
  git pull --ff-only --quiet origin main || echo "monthly check: could not fast-forward to origin/main; running on this checkout as it is"
fi

mode=""
if [ "$(date +%d)" = "04" ]; then mode="--confirm"; fi
for a in "$@"; do if [ "$a" = "--confirm" ]; then mode=""; fi; done   # given by hand: do not pass it twice

node scripts/monthly-check.mjs $mode "$@" 2>&1 | tee -a "$LOG_DIR/brewerytrip-monthly-check.log"
exit "${PIPESTATUS[0]}"
