# Verified Simlish + SynthAi2 integration (2026-10-31)

## Source ownership and exact revisions

SynthAi2 is the existing official computer. It remains the single React/Capacitor host.
Simlish is not renamed, rebuilt from an invented architecture, or stripped of its own studio.

The normal \`npm run build\` now invokes \`scripts/stage-simlish.mjs\` before Vite.
This stages the ORIGINAL source from two inspected public Simlish commits:
- Simlish live world + executable formations + SwarmWorld: \`8cc989edd7895192f8edd834f834084f622a9ab0\` (PR #9). This contains the original Play/Create/Mission, changing object geometry, local replay persistence and test suite.
- Simlish original headless 2D portrait/motion Morph provider: \`757a86dc3b92b7e6808b16a39c2b8ef1c7a2775a\` (PR #12), plus its tests. The full-body 3D capability is NOT supplied by this provider.

The staging step checks exact Git commit IDs and expected paths, copies the entire original Simlish \`you-n-i-verse\` directory (including its source/asset/vendor files), and rejects changed upstream contracts. It patches exactly one successful-operation event in the live-world UI and loads the small device-local \`integrations/simlish/synthai2-bridge.mjs\` adapter. The original world and studio remain separate HTML experiences in one same-origin SynthAi2 app and both preserve their existing client-side stores.

## Browser and Android runtime

- \`/simlish-world\` is a real SynthAi2 route registered in its app registry and navigation, also reachable from Game Creator.
- \`/simlish/world.html\` is the original playable Simlish live world.
- \`/simlish/index.html\` is the original character editor.
- In the same-origin iframe, Simlish emits a structured receipt **only after a real, successful world operation**. The SynthAi2 host checks \`event.origin\`, \`event.source\`, event marker and payload fields before forwarding a non-personal receipt to the existing Mesh event API.
- Explicit \`Use my saved character\` click tells the Simlish frame to invoke its real \`createSimlishMorphProvider\`; it only reads local project data after consent. Source images, generated images, and birth data are never posted into Mesh. Without a saved character the original guide remains.
- Source packaging is performed by the standard \`npm run build\` lifecycle, which is used by \`.github/workflows/build-android-apk.yml\`; Vite places assets into the Capacitor web bundle. The APK must still complete GitHub Actions build and be tested on an Android device before claiming installed functionality.

## Existing Human Design + Morph connections

The existing local Human Design Studio and Morph Store keep their source data, separate storage keys and behavior. \`Connect to Morph\` is explicit because the existing Morph registration may contact its configured server. The field adapter preserves chart identity and the actual recorded gate/channel/center/profile/variable properties; it does not invent a traditional incarnation-cross name or absent 13-field coordinate values.

Worlds publishes observed \`world.created\` events into Mesh. Game Creator already publishes template events. These receipts share an event system, not a fabricated direct mapping between Simlish's old macro state-space and the canonical 13 fields.

## Verification

- Source-pinned packaging is tested by \`tests/simlish-integration.test.mjs\`.
- Original executable Simlish tests: \`world-session.test.mjs\`.
- Original Simlish morph-provider tests: \`morph-provider.test.mjs\`.
- Human Design-to-Morph projection tests: \`humanDesignMorphBridge.test.mjs\`.
- Web bundle: \`npm run build\`.
- APK: existing \`Build Android APK\` workflow.
- Full repository \`npm run check\` currently reports unrelated pre-existing TypeScript errors; do not claim it passes until fixed.

## Still outside this release

The photo-based full-body generator in Simlish PR #2, Godot SynthWorld in PR #1, and standalone Android/legacy host and kernel-repair branches are **not automatically merged** into the current source-pinned web game. Those carry incompatible or optional runtimes and must be individually verified. Do not represent the 2D portrait result as full 3D body reconstruction; do not force-merge unrelated draft PRs. Simlish's source repository and its unfinished PRs remain intact.

Live remote mesh persistence and personal chart-to-world behavior must be verified against an actual configured backend; no success is claimed merely by calling an API wrapper.
