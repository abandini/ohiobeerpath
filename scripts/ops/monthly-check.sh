#!/bin/bash
# The monthly re-check, as launchd runs it (scripts/ops/com.brewerytrip.monthly-check.plist): the full run on the 1st,
# the confirming pass on the 4th. By hand: scripts/ops/monthly-check.sh [--confirm] [any option of monthly-check.mjs].
# Read docs/monthly-check.md.
#
# The job needs a checkout of its own that nobody works in. This wrapper makes one change to it, before the run: a
# fast-forward of main to origin/main. The run itself never edits a file there. If the checkout is not on main, is
# not clean, or cannot be fetched and fast-forwarded, the wrapper STOPS with exit 2: it never falls back to observing
# whatever happens to be there.
set -u
stop() { echo "monthly check: STOPPED. $1"; echo "Brewery Trip monthly check: STOPPED before observing. $1" | cut -c1-299; exit 2; }
# launchd starts with almost no PATH: after whatever PATH there is, node, npx and git are looked for in the usual places.
export PATH="${PATH:+$PATH:}/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"
# Keys. launchd gives the job none, so the named entries it needs, and only those, are read from the machine's vault
# file when the environment does not already have them. Nothing is printed. By default that is the status-service key
# alone: the directory is read through the machine's own wrangler login, and a Cloudflare token in the environment
# would be used ahead of that login even when it cannot read the database (found on the mini, 2026-11-23). On a
# machine whose token can read it, set MONTHLY_VAULT_KEYS="GEMINI_API_KEY CLOUDFLARE_API_TOKEN". Without a working
# key or login, checks B and C report "could not observe" and the run exits 2; it is never a pass.
VAULT="${MONTHLY_VAULT:-$HOME/.vault/keys.env}"
for k in ${MONTHLY_VAULT_KEYS:-GEMINI_API_KEY}; do
  case "$k" in GEMINI_API_KEY|CLOUDFLARE_API_TOKEN|CLOUDFLARE_ACCOUNT_ID) ;; *) continue ;; esac
  if [ -z "${!k:-}" ] && [ -r "$VAULT" ]; then
    v="$(sed -n "s/^\(export[[:space:]]\{1,\}\)\{0,1\}$k=//p" "$VAULT" | tail -1)"
    v="${v%\"}"; v="${v#\"}"; v="${v%\'}"; v="${v#\'}"
    [ -n "$v" ] && export "$k=$v"
  fi
done
unset v k
REPO="${MONTHLY_REPO:-/Users/auto1/CascadeProjects/ohiobrewpath}"
DATA="${MONTHLY_DATA_DIR:-$HOME/brewerytrip-monthly}"
LOG_DIR="${MONTHLY_LOG_DIR:-$HOME/logs}"

# The canonical form of a path that may not exist yet: the real path of its nearest existing ancestor, plus the rest,
# normalised (no "..", no "."). It creates nothing. The path it returns is the one used from then on.
canon() {
  node --input-type=module - "$1" <<'NODE'
import { existsSync, realpathSync } from 'node:fs';
import { resolve, dirname, basename } from 'node:path';

let at = resolve(process.argv[2]);
const rest = [];
while (!existsSync(at) && dirname(at) !== at) {
  rest.unshift(basename(at));
  at = dirname(at);
}
console.log(resolve(realpathSync(at), ...rest));
NODE
}
inside() { [ "$1" = "$2" ] || case "$1" in "$2"/*) return 0 ;; *) return 1 ;; esac; }

# 1. Paths, judged before anything is created: absolute, canonical, and outside the checkout.
for p in "$REPO" "$DATA" "$LOG_DIR"; do case "$p" in /*) ;; *) stop "the path $p is not absolute." ;; esac; done
[ -d "$REPO/.git" ] || [ -f "$REPO/.git" ] || stop "there is no git checkout at $REPO."
REPO="$(canon "$REPO")" || stop "the checkout path cannot be resolved."
DATA="$(canon "$DATA")" || stop "the data directory path cannot be resolved."
LOG_DIR="$(canon "$LOG_DIR")" || stop "the log directory path cannot be resolved."
if inside "$DATA" "$REPO" || inside "$REPO" "$DATA"; then stop "the data directory ($DATA) must be outside the checkout ($REPO)."; fi
if inside "$LOG_DIR" "$REPO"; then stop "the log directory ($LOG_DIR) must be outside the checkout ($REPO)."; fi
mkdir -p "$LOG_DIR" "$DATA" || stop "could not create $LOG_DIR or $DATA."
export MONTHLY_DATA_DIR="$DATA"
cd "$REPO" || stop "could not enter $REPO."

# 2. One run at a time, from before the checkout is touched to the end. mkdir either makes the lock or fails: there
# is no gap between looking and taking. A lock that is already there is reported and left alone, however old it is.
LOCK="$DATA/lock"
if ! mkdir "$LOCK" 2>/dev/null; then
  if [ -n "$(find "$LOCK" -maxdepth 0 -mmin +720 2>/dev/null)" ]; then
    stop "a lock more than 12 hours old is at $LOCK ($(cat "$LOCK/info.json" 2>/dev/null)). It was not removed: check that no run is going, then delete that directory by hand."
  fi
  stop "another run holds the lock at $LOCK ($(cat "$LOCK/info.json" 2>/dev/null))."
fi
printf '{"pid": %s, "started": "%s", "by": "monthly-check.sh"}\n' "$$" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" > "$LOCK/info.json"
trap 'rm -rf "$LOCK"' EXIT
# Interrupted, the wrapper cannot know that its child has stopped, so it keeps the lock: a person checks that no run
# is going and removes it by hand.
trap '
  trap - EXIT
  echo "Brewery Trip monthly check: wrapper interrupted; lock retained because child processes may still be running."
  exit 2
' HUP INT TERM
export MONTHLY_LOCK_HELD="$LOCK"

# 3. The source revision. On main, clean (working tree, index and untracked files), then exactly origin/main.
branch="$(git rev-parse --abbrev-ref HEAD 2>/dev/null)" || stop "could not read the checkout's branch."
[ "$branch" = "main" ] || stop "the checkout is on '$branch', not main."
dirty="$(git status --porcelain 2>/dev/null)" || stop "could not read the checkout's status."
[ -z "$dirty" ] || stop "the checkout has uncommitted or untracked changes ($(printf '%s\n' "$dirty" | head -1)). The job needs a checkout of its own that nobody works in."
git fetch --quiet origin main || stop "could not fetch origin/main."
git merge --ff-only --quiet origin/main || stop "the checkout could not be fast-forwarded to origin/main."
sha="$(git rev-parse HEAD)" || stop "could not read the commit."
[ "$sha" = "$(git rev-parse origin/main)" ] || stop "the checkout is at $sha, which is not origin/main."
export MONTHLY_SOURCE_SHA="$sha"
echo "monthly check: observing commit $sha"

mode=""
if [ "$(date +%d)" = "04" ]; then mode="--confirm"; fi
for a in "$@"; do if [ "$a" = "--confirm" ]; then mode=""; fi; done   # given by hand: do not pass it twice

node scripts/monthly-check.mjs $mode "$@" 2>&1 | tee -a "$LOG_DIR/brewerytrip-monthly-check.log"
exit "${PIPESTATUS[0]}"
