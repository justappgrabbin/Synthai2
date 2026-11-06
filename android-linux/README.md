# Synthai2 Android — embedded ARM64 Linux Computer

This is the **native APK + local Linux guest** delivery path, replacing the old frontend-only Capacitor build as the default Android workflow. It is not a hosted website.

Inside the APK are:
- ARM64 Linux root filesystem with glibc, Node 24, Python 3.12, installed dependencies
- Original Synthai2 Express backend, executable application server and bundled frontend
- Original Synthia Node/MCP service and Synthia Python service
- Unmodified Cynthia Klein model `run/model.pt`, tokenizer, tools, web app and skills, pinned from `justappgrabbin/klein-agent`
- Android-native Activity, foreground service and compiled PRoot runtime/loader

## Boot sequence

1. Native Activity launches foreground `ComputerBackendService`.
2. `RootfsInstaller` extracts the bundled guest into private Android app storage with versioned/atomic replacement.
3. Native `LinuxContainer` starts PRoot on ARM64 and maps the persistent data folder to `/var/lib/synthai`.
4. `guest/start.mjs` verifies exact Cynthia model/tokenizer SHA-256 and copies the original model to a writable **private working copy** on first launch. It starts four genuine backend processes.
5. The native service checks `/api/health` (Express), `:10000/health` (Synthia Node), `:8001/health` (Synthia Python), and `/api/cynthia-resident/status` (real model loaded).
6. After **all four** checks pass, the native Activity opens `http://127.0.0.1:5000/computer`. This is the local Linux process, not an external web host. Cynthia signs into the Computer's own local bridge with the private token.

If any backend fails, the native Activity reports an error rather than silently showing only a static frontend. No network is needed at runtime once the complete APK has been built. Build requires downloading dependencies and PRoot source.

The original Klein source and trained weights are not trained or rewritten by the build. In-app optional feedback training updates only the persistent working copy, leaving the APK's original weights unchanged.

## Build & verification

In GitHub Actions run `Build Android APK — embedded Linux Computer (ARM64)`. It cross-builds the Linux filesystem, executes its ARM64 services and original model in a smoke test, builds PRoot from pinned source, compiles the native Android app and **refuses to publish** an APK missing the model or Linux runtime.

Artifact: `Synthai2-EMBEDDED-LINUX-Computer-Cynthia-ARM64-debug-APK`.

## Boundaries and known constraints

- **ARM64 Android only**; x86 Android emulators cannot execute the ARM64 PRoot guest.
- The packed PyTorch ARM64 runtime is substantial; device storage and RAM requirements must be assessed on the target phone.
- GitHub ARM64 QEMU smoke checks and APK inspection do not prove a real Android-device boot. Device installation/acceptance must be reported separately.
- Android can restrict foreground services and CPU-intensive workloads, particularly after long background periods.
- The app is a native container host with a locally served UI. A WebView can display that local UI, but unlike the old preview, the backend is actually inside the APK.
- Localhost access does not isolate the process from *other apps* on the same phone. Keep sensitive operations behind existing Computer authorization and never expose this guest on external interfaces.
