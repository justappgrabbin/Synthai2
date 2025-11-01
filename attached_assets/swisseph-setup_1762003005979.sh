    #!/usr/bin/env bash
    set -e

    echo "🌌 Starting React Native Swiss Ephemeris Setup..."
    echo "=================================================="

    RED='\033[0;31m'
    GREEN='\033[0;32m'
    YELLOW='\033[1;33m'
    BLUE='\033[0;34m'
    NC='\033[0m'

    info(){ echo -e "${BLUE}[INFO]${NC} $1"; }
    ok(){ echo -e "${GREEN}[SUCCESS]${NC} $1"; }
    warn(){ echo -e "${YELLOW}[WARNING]${NC} $1"; }
    err(){ echo -e "${RED}[ERROR]${NC} $1"; }

    # --- sanity check ---
    if [ ! -f "package.json" ] || ! grep -q "react-native" package.json; then
      err "This doesn't appear to be a React Native project root."
      exit 1
    fi
    ok "React Native project detected"

    info "Creating directory structure..."
    mkdir -p android/app/src/main/assets/ephemeris
    mkdir -p android/app/libs
    mkdir -p ios/ephemeris
    mkdir -p src/consciousness
    ok "Directories created"

    # --- download ephemeris data ---
    info "Downloading Swiss Ephemeris data files (1800-2400 CE)..."
    BASE_URL="https://github.com/aloistr/swisseph/raw/master/ephe"
    FILES=("sepl_18.se1" "semo_18.se1" "seas_18.se1")

    pushd android/app/src/main/assets/ephemeris >/dev/null
    for f in "${FILES[@]}"; do
      if [ ! -f "$f" ]; then
        info "Downloading $f ..."
        if command -v curl >/dev/null 2>&1; then
          curl -L -s -O "$BASE_URL/$f" || warn "Failed to download $f"
        else
          wget -q "$BASE_URL/$f" || warn "Failed to download $f"
        fi
      fi
      if [ -f "$f" ]; then ok "✓ $f"; fi
    done
    popd >/dev/null

    info "Copying ephemeris files to iOS folder"
    rsync -a android/app/src/main/assets/ephemeris/ ios/ephemeris/ || warn "Copy to iOS failed; create ios/ephemeris manually"

    # --- install library ---
    info "Installing react-native-swisseph"
    if command -v yarn >/dev/null 2>&1; then
      yarn add react-native-swisseph
    else
      npm install react-native-swisseph
    fi
    ok "react-native-swisseph installed"

    # --- configure Android ---
    APP_GRADLE="android/app/build.gradle"
    if [ -f "$APP_GRADLE" ]; then
      info "Patching $APP_GRADLE for assets + packaging options"
      cp "$APP_GRADLE" "$APP_GRADLE.bak"

      if ! grep -q "assets.srcDirs" "$APP_GRADLE"; then
        python3 - <<'PY'
from pathlib import Path
p = Path("android/app/build.gradle")
txt = p.read_text()
txt = txt.replace("android {", "android {
    sourceSets {
        main {
            assets.srcDirs = ['src/main/assets', 'src/main/assets/']
        }
    }")
p.write_text(txt)
PY
        ok "Added assets.srcDirs"
      else
        ok "assets.srcDirs already present"
      fi

      if ! grep -q "packagingOptions" "$APP_GRADLE"; then
        python3 - <<'PY'
from pathlib import Path
p = Path("android/app/build.gradle")
txt = p.read_text()
txt = txt.replace("android {", "android {
    packagingOptions {
        pickFirst '**/libc++_shared.so'
        pickFirst '**/libjsc.so'
    }")
p.write_text(txt)
PY
        ok "Added packagingOptions"
      else
        ok "packagingOptions already present"
      fi
    else
      warn "Missing android/app/build.gradle; skip Android patch"
    fi

    # --- iOS pods ---
    if [ -d "ios" ]; then
      info "Installing iOS pods"
      (cd ios && (pod install || warn "pod install failed; run manually"))
    else
      warn "iOS directory not found"
    fi

    # --- seed source files if absent ---
    if [ ! -f "src/consciousness/AndroidFieldParser.js" ]; then
      cp "tools/AndroidFieldParser.js" "src/consciousness/AndroidFieldParser.js" || warn "Could not seed AndroidFieldParser.js"
    fi
    if [ ! -f "src/consciousness/ConsciousnessFieldCalculator.jsx" ]; then
      cp "tools/ConsciousnessFieldCalculator.jsx" "src/consciousness/ConsciousnessFieldCalculator.jsx" || warn "Could not seed ConsciousnessFieldCalculator.jsx"
    fi
    if [ ! -f "test-swisseph.js" ]; then
      cp "tools/test-swisseph.js" "test-swisseph.js" || warn "Could not seed test-swisseph.js"
      chmod +x test-swisseph.js || true
    fi

    # --- add NPM script ---
    if command -v npx >/dev/null 2>&1; then
      npx json -I -f package.json -e 'this.scripts = this.scripts || {}'
      npx json -I -f package.json -e 'this.scripts["test-swisseph"] = "node test-swisseph.js"'
      ok "Added npm script: test-swisseph"
    else
      warn "npx not found; add npm script manually"
    fi

    echo ""
    ok "Setup Complete"
    echo "Next:"
    echo "  • npm run test-swisseph"
    echo "  • npx react-native run-android   # or: cd ios && pod install && npx react-native run-ios"
    echo ""
