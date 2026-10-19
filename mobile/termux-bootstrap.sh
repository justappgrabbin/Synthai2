#!/data/data/com.termux/files/usr/bin/bash
# SynthAI You-N-I-Verse Android self-host bootstrap.
# Run inside Termux on the phone. This installs and starts the local backend.

set -e

APP_DIR="${APP_DIR:-$HOME/synthai2}"
REPO_URL="${REPO_URL:-https://github.com/justappgrabbin/Synthai2.git}"
LOG_DIR="$HOME/synthai-logs"
STUDIO_PORT="${STUDIO_PORT:-5000}"
SYNTHIA_PORT="${SYNTHIA_PORT:-10000}"

echo "SynthAI You-N-I-Verse phone bootstrap"
echo "====================================="

mkdir -p "$LOG_DIR"

pkg update -y
pkg install -y git nodejs-lts python curl openssl-tool clang make termux-services

if [ ! -d "$APP_DIR/.git" ]; then
  echo "Cloning app into $APP_DIR"
  git clone "$REPO_URL" "$APP_DIR"
else
  echo "Updating existing app at $APP_DIR"
  cd "$APP_DIR"
  git pull --ff-only || true
fi

cd "$APP_DIR"

if [ ! -f ".env" ]; then
  cp .env.example .env
fi

mkdir -p workspace

echo "Installing Studio dependencies..."
npm install --legacy-peer-deps

echo "Building Studio..."
npm run build

echo "Installing Synthia backend dependencies..."
cd "$APP_DIR/synthia-server"
npm install --omit=dev --legacy-peer-deps

cd "$APP_DIR"

# Stable terminal authentication shared by the phone-local Studio and its UI.
TOKEN_FILE="$HOME/.synthai-terminal-token"
if [ ! -s "$TOKEN_FILE" ]; then
  (umask 077; openssl rand -hex 32 > "$TOKEN_FILE")
fi
chmod 600 "$TOKEN_FILE"

# Persist the approved phone-local environment; no internet connection or remote host is required.
RUNTIME_ENV="$APP_DIR/mobile-runtime-env.sh"
{
  printf 'export APP_DIR=%q\n' "$APP_DIR"
  printf 'export STUDIO_PORT=%q\n' "$STUDIO_PORT"
  printf 'export SYNTHIA_PORT=%q\n' "$SYNTHIA_PORT"
  printf '%s\n' 'export NODE_ENV=production'
  printf '%s\n' 'export NODE_MODE=lite'
  printf '%s\n' 'export PORT="$STUDIO_PORT"'
  printf '%s\n' 'export SYNTHIA_NODE_PORT="$SYNTHIA_PORT"'
  printf '%s\n' 'export SYNTHIA_PYTHON_PORT=8001'
  printf '%s\n' 'export VITE_SYNTHIA_API_URL="http://127.0.0.1:$SYNTHIA_PORT"'
  printf '%s\n' 'export VITE_SYNTHIA_WS_URL="ws://127.0.0.1:$SYNTHIA_PORT/ws"'
  printf '%s\n' 'export LINUX_CONTAINER_ENABLED=true'
  printf '%s\n' 'export LINUX_CONTAINER_SHELL="${PREFIX:-/data/data/com.termux/files/usr}/bin/bash"'
  printf '%s\n' 'export LINUX_CONTAINER_WORKDIR="$APP_DIR/workspace"'
  printf '%s\n' 'export MESH_DATA_DIR="$APP_DIR/workspace"'
  printf '%s\n' 'export STUDIO_BIND_HOST=127.0.0.1'
  printf '%s\n' 'export TERMINAL_TOKEN="$(cat "$HOME/.synthai-terminal-token")"'
  printf '%s\n' 'export PYTHON_API_AUTOSTART=false'
} > "$RUNTIME_ENV"
chmod 600 "$RUNTIME_ENV"

# Supervisors are provided by Termux's existing runit/termux-services integration.
# Reuse the original Studio and Synthia Node processes, not a replacement runtime.
SERVICE_DIR="$PREFIX/var/service"
mkdir -p "$SERVICE_DIR/synthai-studio" "$SERVICE_DIR/synthai-node"
{
  printf '#!%s/bin/bash\n' "$PREFIX"
  printf 'set -e\n'
  printf 'source %q\n' "$RUNTIME_ENV"
  printf 'cd "$APP_DIR"\n'
  printf 'exec npm start\n'
} > "$SERVICE_DIR/synthai-studio/run"
{
  printf '#!%s/bin/bash\n' "$PREFIX"
  printf 'set -e\n'
  printf 'source %q\n' "$RUNTIME_ENV"
  printf 'cd "$APP_DIR/synthia-server"\n'
  printf 'export PORT="$SYNTHIA_PORT"\n'
  printf 'exec npm run start:lite\n'
} > "$SERVICE_DIR/synthai-node/run"
chmod 700 "$SERVICE_DIR/synthai-studio/run" "$SERVICE_DIR/synthai-node/run"

cat > "$APP_DIR/mobile-start.sh" << 'EOF'
#!/data/data/com.termux/files/usr/bin/bash
set -e
# Start the runit daemon if the Termux shell did not already start it.
source "$PREFIX/etc/profile.d/start-services.sh"
export SVDIR="$PREFIX/var/service"
sv-enable synthai-studio
sv-enable synthai-node
echo "SynthAi 2 supervised services:"
sv status synthai-studio synthai-node
echo "Studio: http://127.0.0.1:5000"
echo "Status: sv status synthai-studio synthai-node"
echo "Logs: $PREFIX/var/log/sv/synthai-studio/current"
echo "Terminal key: cat ~/.synthai-terminal-token"
EOF

# Termux:Boot (optional add-on) can start the services after device reboot.
# It must be installed and opened once by the user to activate this script.
mkdir -p "$HOME/.termux/boot"
cat > "$HOME/.termux/boot/start-synthai-services" << 'EOF'
#!/data/data/com.termux/files/usr/bin/bash
termux-wake-lock 2>/dev/null || true
source "$PREFIX/etc/profile.d/start-services.sh"
EOF
chmod 700 "$HOME/.termux/boot/start-synthai-services"

chmod +x "$APP_DIR/mobile-start.sh"

echo ""
echo "Install complete."
echo "Start the phone server with:"
echo "  $APP_DIR/mobile-start.sh"
echo ""
echo "Then open the APK. It points to http://127.0.0.1:$STUDIO_PORT"
echo "A Termux:Boot helper was prepared for reboot recovery (requires Termux:Boot installed and opened once)."
echo "For the first terminal command, the app requests your local terminal key."
echo "Find it in Termux with: cat ~/.synthai-terminal-token"
