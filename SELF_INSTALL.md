# YOU-N-I-VERSE Self Install

This app is already set up as one Linux Docker container.

The container includes:

- Studio / OS web app on port `5000`
- Synthia Node backend, MCP bridge, mesh, and WebSocket service on port `10000`
- Synthia Python service inside the container on port `8001`
- Shared workspace mounted from `./workspace` into `/workspace`

You do not need a second Linux container for the normal self-hosted setup.

## Windows Start Button

Double-click:

```text
Start-You-N-IDE-OS.ps1
```

If Windows blocks script execution, open PowerShell in this folder and run:

```powershell
powershell -ExecutionPolicy Bypass -File .\Start-You-N-IDE-OS.ps1
```

The launcher will:

1. Check Docker Desktop.
2. Create `.env` from `.env.example` if needed.
3. Create the local `workspace` folder.
4. Build and start the Docker container.
5. Wait for the Studio health check.
6. Open the app on the computer.
7. Print a phone URL for mobile use on the same Wi-Fi.

## Manual Start

```bash
docker compose up --build -d
```

Then open:

```text
http://localhost:5000
```

Backend checks:

```text
http://localhost:5000/api/health
http://localhost:10000/health
```

## Mobile Self-Host

There are now two mobile modes.

### Mode A: Phone Connects To Computer

The computer runs the Docker Linux container, and the phone opens the mobile OS shell from the computer.

1. Start the container on the computer with `Start-You-N-IDE-OS.ps1`.
2. Keep the phone on the same Wi-Fi.
3. Open the phone URL printed by the launcher, usually:

```text
http://YOUR-COMPUTER-IP:5000
```

4. Install it to the phone home screen:
   - Android Chrome: menu, then Install app or Add to Home screen.
   - iPhone Safari: Share, then Add to Home Screen.

### Mode B: Phone Works Without Computer

Android can run the local backend through Termux, and the APK opens the phone-local app at `http://127.0.0.1:5000`.

Use:

```text
mobile/PHONE_SELF_HOST.md
```

That path gives you:

- APK wrapper through Capacitor.
- Phone-local Studio OS on `127.0.0.1:5000`.
- Phone-local Synthia Node/MCP mesh on `127.0.0.1:10000`.
- Termux bootstrap for installing/updating the local backend.

The desktop Docker container remains the best full-power self-host option. The Android self-host lane is the phone-contained option.

## Stop

```bash
docker compose down
```

## Logs

```bash
docker compose logs -f you-n-i-verse-os
```
