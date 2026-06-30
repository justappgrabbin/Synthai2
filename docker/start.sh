#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
#  YOU-N-I-VERSE OS — Container Entry Point
# ═══════════════════════════════════════════════════════════════════════════════
set -e

V='\033[0;35m' G='\033[0;32m' Y='\033[1;33m' C='\033[0;36m' R='\033[0;31m' N='\033[0m'

echo -e "${V}"
echo "  ╔══════════════════════════════════════════════════════╗"
echo "  ║          Y O U - N - I - V E R S E   O S            ║"
echo "  ╠══════════════════════════════════════════════════════╣"
printf "  ║  Studio UI      → http://localhost:%-5s            ║\n" "${PORT:-5000}"
printf "  ║  Synthia Node   → http://localhost:%-5s            ║\n" "${SYNTHIA_NODE_PORT:-10000}"
printf "  ║  Synthia Python → http://localhost:%-5s (internal) ║\n" "${SYNTHIA_PYTHON_PORT:-8001}"
echo "  ║  WebSocket      → ws://localhost:${SYNTHIA_NODE_PORT:-10000}/ws          ║"
echo "  ╚══════════════════════════════════════════════════════╝"
echo -e "${N}"

# Auto-generate TERMINAL_TOKEN if unset
if [ -z "${TERMINAL_TOKEN:-}" ]; then
    export TERMINAL_TOKEN="$(cat /dev/urandom | tr -dc 'A-Za-z0-9' | head -c 40 2>/dev/null || echo 'synthia-change-me')"
    echo -e "${Y}[BOOT] TERMINAL_TOKEN auto-generated. Set it in .env to persist.${N}"
fi

# Supabase warning
if [ -z "${SUPABASE_PRIMARY_KEY:-}" ]; then
    echo -e "${Y}[BOOT] SUPABASE_PRIMARY_KEY not set — Aion mesh persistence disabled.${N}"
fi

# Python deps (server.py auto-installs, but pre-check for faster startup)
echo -e "${C}[BOOT] Checking Python environment...${N}"
python -c "import fastapi, uvicorn" 2>/dev/null || {
    echo -e "${Y}[BOOT] Installing Python deps...${N}"
    pip install -q fastapi "uvicorn[standard]" sse-starlette httpx numpy --break-system-packages 2>/dev/null \
      || pip install -q fastapi "uvicorn[standard]" sse-starlette httpx numpy
}

# Node deps for Synthia-server
echo -e "${C}[BOOT] Checking Synthia-server Node modules...${N}"
if [ ! -f "/app/synthia-server/node_modules/.package-lock.json" ]; then
    echo -e "${Y}[BOOT] Installing Synthia-server deps...${N}"
    cd /app/synthia-server && npm ci --omit=dev --ignore-scripts && cd /
fi

echo -e "${G}[BOOT] All checks passed. Starting three-process supervisor...${N}"
echo -e "${G}[BOOT]   synthia-node   → port ${SYNTHIA_NODE_PORT:-10000}${N}"
echo -e "${G}[BOOT]   synthia-python → port ${SYNTHIA_PYTHON_PORT:-8001}${N}"
echo -e "${G}[BOOT]   studio         → port ${PORT:-5000}${N}"

exec /usr/bin/supervisord -n -c /etc/supervisor/conf.d/you-n-i-verse.conf
