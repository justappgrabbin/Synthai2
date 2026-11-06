#!/usr/bin/env bash
set -euo pipefail
SOURCE=/app/studio/vendor/klein-agent
TARGET=/app/data/cynthia-resident
test -s "$SOURCE/run/model.pt"
test -s "$SOURCE/run/tokenizer.json"
python3 - "$SOURCE" <<'PY'
import hashlib,json,pathlib,sys
root=pathlib.Path(sys.argv[1])
manifest=json.loads((root/'run/artifact_manifest.json').read_text())
for rel in ('run/model.pt','run/tokenizer.json','web_app.py','klein_tools_fixed/neural/skilled_agent.py'):
    digest=hashlib.sha256((root/rel).read_bytes()).hexdigest()
    if digest != manifest[rel]:
        raise SystemExit(f"Original Cynthia hash mismatch: {rel}")
print("Original trained Cynthia files verified",flush=True)
PY
if [ ! -d "$TARGET" ]; then
  mkdir -p /app/data
  stage="$(mktemp -d /app/data/.cynthia-stage-XXXXXX)"
  cp -a "$SOURCE/." "$stage/"
  rm -rf "$stage/.venv" "$stage/.git"
  echo "78ea0e28c70d7a5d4c288279025a493ceccbde5d" > "$stage/.cynthia-original-pin"
  mv "$stage" "$TARGET"
elif [ "$(cat "$TARGET/.cynthia-original-pin" 2>/dev/null || true)" != "78ea0e28c70d7a5d4c288279025a493ceccbde5d" ]; then
  echo "Refusing to overwrite unknown existing Cynthia state" >&2
  exit 1
fi
if [ -z "${SYNTHIA_KLEIN_OWNER_TOKEN:-}" ]; then
  mkdir -p /app/data
  if [ ! -s /app/data/cynthia-owner-token ]; then
    umask 077
    python3 -c 'import secrets;open("/app/data/cynthia-owner-token","x").write(secrets.token_urlsafe(32))'
  fi
  export SYNTHIA_KLEIN_OWNER_TOKEN="$(cat /app/data/cynthia-owner-token)"
fi
echo "Cynthia owner token: $SYNTHIA_KLEIN_OWNER_TOKEN"
if [ -z "${TERMINAL_TOKEN:-}" ]; then
  if [ ! -s /app/data/terminal-owner-token ]; then
    umask 077
    python3 -c 'import secrets;open("/app/data/terminal-owner-token","x").write(secrets.token_urlsafe(32))'
  fi
  export TERMINAL_TOKEN="$(cat /app/data/terminal-owner-token)"
fi
exec /usr/bin/supervisord -n -c /etc/supervisor/supervisord.conf
