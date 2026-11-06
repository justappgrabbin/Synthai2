# Linux Computer and APK: verified architecture distinction

The intended Computer is the **Linux process environment**, with the real Express backend, Synthia Node/MCP service, Synthia Python service and trained Cynthia Klein process. The UI is only its interface.

The existing default Android build in `.github/workflows/build-android-apk.yml` is a **Capacitor WebView preview**. It does **not** package Linux, Node, Python, PyTorch or the trained model. Do not call that build a complete offline Computer.

## Full Linux Computer

Checkout the repository and its original model submodule:

```bash
git submodule update --init --recursive
docker compose -f docker-compose.computer.yml up --build
```

Open the Computer at `http://localhost:5000` and select Cynthia Klein. The model is inside the same Linux container, listening only on `127.0.0.1:7860`. Its checkpoint is pinned and checked at boot. Runtime chat/feedback state is in a persistent Docker volume, never written back to the original model checkout.

The Computer's backend is required; a disconnected UI must report an error, not pretend it is functional.

## Actual on-phone Linux APK: not yet built

Android does not provide Docker inside an APK. An **offline, self-contained phone APK** needs an Android-native Linux userspace or separately packaged native binaries for the device's CPU architecture, a lifecycle-managed Node/Python/PyTorch backend, model weights, storage and permissions, plus on-device testing. None of those are supplied by a Capacitor build. The Linux Docker image above is for Linux hosts and is **not** the Android runtime.

Until those components are packaged and tested, any generated APK must remain labeled incomplete. This is an implementation gap, not a UI setting.
