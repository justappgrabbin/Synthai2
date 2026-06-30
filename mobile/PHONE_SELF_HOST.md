# Phone Self-Host Mode

This is the Android path for using SynthAI without the computer.

The desktop Docker container is not used on the phone. Android does not run Docker normally. Instead:

1. Termux runs the local Node/Synthia backend on the phone.
2. The APK opens the phone-local server at `http://127.0.0.1:5000`.
3. The app works without the computer once the phone server is started.

## Build The APK From GitHub

1. Push this repo to GitHub.
2. Open the repo on GitHub.
3. Go to **Actions**.
4. Run **Build Android APK**.
5. Download the artifact named `synthai-you-n-i-verse-debug-apk`.
6. Install `app-debug.apk` on Android.

## Install The Phone Backend

Install Termux from F-Droid, then run:

```bash
pkg install -y curl
curl -fsSL https://raw.githubusercontent.com/justappgrabbin/Synthai2/main/mobile/termux-bootstrap.sh | bash
```

Start SynthAI on the phone:

```bash
~/synthai2/mobile-start.sh
```

Then open the APK.

## What This Gives You

- No computer required after phone setup.
- Studio OS runs on the phone at `127.0.0.1:5000`.
- Synthia Node/MCP mesh runs on the phone at `127.0.0.1:10000`.
- Files and mounted apps live under `~/synthai2/workspace` in Termux.

## What Still Needs A Later Hardening Pass

- One-tap Termux startup from inside the APK.
- Signed release APK instead of debug APK.
- Better Android background-service handling.
- Python service startup on phone if the full Python organism is required.
