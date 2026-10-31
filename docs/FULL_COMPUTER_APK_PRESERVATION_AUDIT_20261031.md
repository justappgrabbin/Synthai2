# SynthAi2 official computer — APK completeness and preservation audit
Date: October 31, 2026. This is a repository/build audit, not a physical-device test.

## Verified packaging failure
The official Android workflow builds the frontend and Node backend separately, but Capacitor only copies webDir = dist/public. The Express backend built at dist/index.js is not launched as an Android service. The standard APK cannot therefore provide local Express routes, Synthia Node/Python services, or a native command executor without another runtime.
The existing Terminal.tsx calls /api/container/status and /api/container/exec. When disconnected it falls back to IDE virtual files, not the native OS shell. AIService's local CodeLlama setting targets http://localhost:11434/api/generate, but the APK build does not install Ollama or model weights.
The backend is genuine code in the repository, yet its existence is not proof that it is on the phone. UI tests, source files and a successful Gradle step do not constitute a complete-computer proof.

## Source payload outside the default APK
- The main repository has ~91.2 MB in attached_assets, including GameAssetStudio (5)_1761696924826.zip at 31,386,638 bytes. No generic automatic Vite/Capacitor copying of that directory exists.
- server/lib/gamePackService.ts reads workspace/game-packs on the server-side filesystem, not attached_assets or an Android-native game-pack directory. server/lib/appMountService.ts similarly depends on the server workspace and execution backend.
- synthia-server Node/Python code lives separately from the Vite public assets and is not installed as Android resident services.
- The real Simlish 2D and 3D assets explicitly copied by scripts/stage-simlish.mjs are present in the web preview. They do not prove server functionality.

## Unmerged existing source branches (not lost and not assumed compatible)
- feature/modelmaker-full-training-20261030: independent modelmaker Python implementations.
- feature/self-serving-specialist-studio: specialist orchestration and studio UI.
- feature/synthai-continuity-ide-20261018: Continuity IDE, dock and assistant.
- integration/trident-klein-neurosymbolic-20261025: Synthia TRIDENT/Klein Python runtime and tests.
- integration/autoapp-state-space-20261030: North Star/Pascal/Housing additions.
- build/embedded-linux-birth-candidate: runtime and Node residence design documents, NOT an integrated executable APK.
- justappgrabbin/SynthAi branches feature/synthia-android-resident-store and integration/synthia-mobile-computer-bridge-20261027: candidate native launcher/Computer donor code. Preserve and inspect the existing contract and signing identity before integration. Do not invent a replacement Android architecture.

## Non-stripping build policy
1. Never delete or overwrite the source branches or user data to produce an APK.
2. The new scripts/audit-computer-apk.mjs inspects actual compiled APK ZIP entries and lists each static feature separately from live, device-executable services.
3. The Android preview build uploads the exact JSON audit beside a correctly labelled INCOMPLETE webview preview. It fails if core packaged Simlish world/3D assets are missing.
4. The --require-complete gate fails until a separate native-runtime and physical-device acceptance path provides real evidence. Adding server scripts or model filenames without a running device service is not success.
5. A genuine complete computer must start its existing native residence and verify on a device: OS command execution; actual Synthia/AI answer; MCP tool execution; Node/Python services as required; functional Model Maker, saved/loaded games and projects; 2D-to-3D Simlish; real app persistence. Verify what remains optional versus required against the original source before shipping.

This audit creates accountability and a release gate. It does not falsely claim that the missing Android backend, AI or the entire app is restored.