#!/usr/bin/env bash
# Start the existing Synthai2 Computer with the original trained Cynthia Klein resident.
# Original source and checkpoint remain untouched. State lives in a separate working copy.
set -euo pipefail
COMPUTER_ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$COMPUTER_ROOT"
if git -C "$COMPUTER_ROOT" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  git submodule update --init --recursive
fi
ORIGINAL="$COMPUTER_ROOT/vendor/klein-agent"
SOURCE_COMMIT="78ea0e28c70d7a5d4c288279025a493ceccbde5d"
CYNTHIA_DATA="${SYNTHIA_KLEIN_WORK_DIR:-$COMPUTER_ROOT/data/cynthia-resident}"
CYNTHIA_PORT="${SYNTHIA_KLEIN_PORT:-7860}"
export SYNTHIA_KLEIN_PORT="$CYNTHIA_PORT"
# A persistent owner token lets the same Computer serve a phone over the home network.
# It never goes into model prompts or tracked source.
if [[ -z "${SYNTHIA_KLEIN_OWNER_TOKEN:-}" ]]; then
  TOKEN_FILE="$COMPUTER_ROOT/data/cynthia-resident-owner-token"
  mkdir -p "$(dirname "$TOKEN_FILE")"
  if [[ ! -f "$TOKEN_FILE" ]]; then
    umask 077
    python3 -c 'import secrets,sys;open(sys.argv[1],"x").write(secrets.token_urlsafe(32))' "$TOKEN_FILE"
  fi
  export SYNTHIA_KLEIN_OWNER_TOKEN="$(cat "$TOKEN_FILE")"
fi
echo "Cynthia Computer owner token (for phone sign-in): $SYNTHIA_KLEIN_OWNER_TOKEN"
if [[ ! -f "$ORIGINAL/run/model.pt" || ! -f "$ORIGINAL/run/tokenizer.json" ]]; then
  echo "Original trained Cynthia model or tokenizer is missing" >&2
  exit 1
fi
ORIGINAL="$ORIGINAL" python3 - <<'PY'
import os, json, hashlib, pathlib, sys
root=pathlib.Path(os.environ["ORIGINAL"])
manifest=json.loads((root/"run/artifact_manifest.json").read_text())
for rel in ("run/model.pt","run/tokenizer.json","web_app.py","klein_tools_fixed/neural/skilled_agent.py"):
    actual=hashlib.sha256((root/rel).read_bytes()).hexdigest()
    if actual != manifest[rel]:
        sys.exit("Pinned Cynthia file hash mismatch: "+rel)
print("Original model and code hashes verified")
PY
if [[ ! -x "$ORIGINAL/.venv/bin/python" ]]; then
  echo "Installing Cynthia's existing requirements into its own Python environment"
  (cd "$ORIGINAL" && bash setup.sh)
fi
if [[ ! -d "$CYNTHIA_DATA" ]]; then
  mkdir -p "$(dirname "$CYNTHIA_DATA")"
  stage="$(mktemp -d "$(dirname "$CYNTHIA_DATA")/.cynthia-staging.XXXXXX")"
  trap 'rm -rf "$stage"' EXIT
  cp -a "$ORIGINAL/." "$stage/"
  rm -rf "$stage/.git" "$stage/.venv"
  printf '%s\n' "$SOURCE_COMMIT" > "$stage/.cynthia-original-pin"
  mv "$stage" "$CYNTHIA_DATA"
  trap - EXIT
elif [[ "$(cat "$CYNTHIA_DATA/.cynthia-original-pin" 2>/dev/null || true)" != "$SOURCE_COMMIT" ]]; then
  echo "Cynthia data directory already exists with a different source. Refusing to overwrite." >&2
  exit 1
fi
"$ORIGINAL/.venv/bin/python" "$CYNTHIA_DATA/web_app.py" --root "$CYNTHIA_DATA" --port "$CYNTHIA_PORT" &
CYNTHIA_PID=$!
cleanup() { kill "$CYNTHIA_PID" 2>/dev/null || true; wait "$CYNTHIA_PID" 2>/dev/null || true; }
trap cleanup EXIT INT TERM
if [[ ! -d "$COMPUTER_ROOT/node_modules" ]]; then
  npm ci
fi
echo "Starting Synthai2 Computer; original Cynthia resident at 127.0.0.1:$CYNTHIA_PORT"
npm run dev
