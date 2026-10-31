# SynthAi2 + Simlish — verified boundary and integration work

## Existing sources (2026-10-31)

- **SynthAi2 `main`** contains its own Game Creator, Semantic Universe Creator, Housing, Morph Memory Engine / Morph Store, Human Design Studio, and Mesh events. These are part of one repository; game world and character morph are not interchangeable.
- **Simlish `main`** is a separate Android/Studio/player source, not bundled into the current SynthAi2 APK or website merely because the name Morph appears in both.
- **Simlish PR #12** (`integration/synthia-autonomous-morph-20261030`) contains the original-headless morph adapter in `you-n-i-verse/morph-provider.mjs`. Its `registerWithComputer(computer)` needs a real shared runtime with `computer.morph.registerProvider`. Checks on the inspected PR head passed, but it is still a draft and not installed in SynthAi2. It changes Android default entry from studio to world; verify that change against the user's preferred startup behavior before merging.
- **Simlish PR #9** (`integration/live-world-formations-20261017`) implements a live world and formation rendering. It targets `swarm-os-evolution-morph-apk-20261016`, **not Simlish main**, so it cannot be treated as a ready-to-merge patch to main. Other Simlish branches separately hold the full-body photo project (PR #2), Godot SynthWorld (PR #1), King Wen kernel repair (PR #8), and older Android host integrations (PR #5–#7).
- **SynthAi2 PR #7** (Specialist Studio) and **PR #10** (North Star) showed failing latest CI, and PR #8 declares its model components not yet wired. Do not force-merge them as one change.

## Connected now on this integration branch

1. The **existing** Human Design calculation can explicitly project documented fields into the **existing** Morph registration; nothing changes the source chart, birth input, or original store key. Registration is opt-in because Morph currently contacts a configured Synthia server.
2. Worlds now emits `world.created` on the **existing** mesh event channel, with only observed identifiers and layer count. The tool does not synthesize unknown 13-field coordinates.
3. The Game Creator already sends template events to the mesh. The Worlds integration makes world creation visible in that same event system when a mesh backend is available.

## Required to complete Simlish inclusion

1. Inspect and preserve Simlish's existing Android WebView host and its separate local project database; do not overwrite its project files or rename SynthAi2's computer into another app.
2. Resolve the overlap among PR #2, #9, #12, and the Android host branches against current Simlish main. A passing isolated PR check does **not** prove the combined app.
3. Expose Simlish's original morph provider to SynthAi2 only when both components run in one actual JS context, or implement and test an explicitly authorized device-local bridge if they remain separate apps. Never send private portraits over a public API or fabricate a 3D body from a 2D preview.
4. Verify a real player action, saved character reuse, persistent world changes, live scene update, game state transfer, and back navigation on physical Android before shipping a unified APK.
5. Preserve the user's canonical 13 fields and keep any unverified address fields unresolved; do not replace Semantic SpaceTime with a guessed coordinate adapter.

**This file records a partial integration, not a claim that the Simlish world and character engines have already been incorporated into SynthAi2.**
