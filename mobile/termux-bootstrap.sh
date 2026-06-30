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
pkg install -y git nodejs-lts python curl openssl-tool clang make

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

cat > "$APP_DIR/mobile-start.sh" << 'EOF'
#!/data/data/com.termux/files/usr/bin/bash
set -e

APP_DIR="${APP_DIR:-$HOME/synthai2}"
LOG_DIR="$HOME/synthai-logs"
STUDIO_PORT="${STUDIO_PORT:-5000}"
SYNTHIA_PORT="${SYNTHIA_PORT:-10000}"

mkdir -p "$LOG_DIR"
cd "$APP_DIR"

export NODE_ENV=production
export NODE_MODE=lite
export PORT="$STUDIO_PORT"
export SYNTHIA_NODE_PORT="$SYNTHIA_PORT"
export SYNTHIA_PYTHON_PORT=8001
export VITE_SYNTHIA_API_URL="http://127.0.0.1:$SYNTHIA_PORT"
export VITE_SYNTHIA_WS_URL="ws://127.0.0.1:$SYNTHIA_PORT/ws"
export LINUX_CONTAINER_ENABLED=false
export LINUX_CONTAINER_WORKDIR="$APP_DIR/workspace"
export MESH_DATA_DIR="$APP_DIR/workspace"
export PYTHON_API_AUTOSTART=false

if ! pgrep -f "synthia-server/server/lite.js" >/dev/null 2>&1; then
  echo "Starting Synthia backend on $SYNTHIA_PORT"
  (
    cd "$APP_DIR/synthia-server"
    SYNTHIA_NODE_PORT="$SYNTHIA_PORT" PORT="$SYNTHIA_PORT" npm run start:lite
  ) > "$LOG_DIR/synthia-node.log" 2>&1 &
fi

if ! pgrep -f "dist/index.js" >/dev/null 2>&1; then
  echo "Starting Studio OS on $STUDIO_PORT"
  (
    cd "$APP_DIR"
    PORT="$STUDIO_PORT" npm start
  ) > "$LOG_DIR/studio.log" 2>&1 &
fi

echo ""
echo "SynthAI is starting on this phone."
echo "Open the APK, or open this URL in Android Chrome:"
echo "http://127.0.0.1:$STUDIO_PORT"
echo ""
echo "Logs:"
echo "$LOG_DIR/studio.log"
echo "$LOG_DIR/synthia-node.log"
EOF

chmod +x "$APP_DIR/mobile-start.sh"

echo ""
echo "Install complete."
echo "Start the phone server with:"
echo "  $APP_DIR/mobile-start.sh"
echo ""
echo "Then open the APK. It points to http://127.0.0.1:$STUDIO_PORT"
