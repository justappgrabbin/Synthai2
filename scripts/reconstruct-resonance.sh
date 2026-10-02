#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BUNDLE_DIR="${1:-$ROOT/resonance-bundles}"
OUT="${2:-$ROOT/.cache/Resonance-Network-Social-Organism-MCP-Wired.zip}"

mkdir -p "$(dirname "$OUT")"
node "$ROOT/scripts/resonance-bundle.mjs" join "$BUNDLE_DIR" "$OUT"

echo
echo "Canonical Resonance archive reconstructed and verified:"
echo "  $OUT"
echo
echo "No files inside the archive were changed."
