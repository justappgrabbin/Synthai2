# YOU-N-I-VERSE is the world in SynthAI2

This branch makes the existing YOU-N-I-VERSE the entry world of the **SynthAI2** application. It does not replace the original SynthAI2 Computer, the original Simlish runtime, or the Human Design application. The root world is a **spatial navigation and world-discovery layer** connected to working modules, not a newly invented simulation engine.

## Verified integration points

| World surface | Existing source and behavior |
| --- | --- |
| Root world at / and /world | New 3D spatial map for the canonical five dimensions (Movement, Evolution, Being, Design, Space) |
| Human Design | Existing /human-design application, kept as the main product |
| Synthia | Existing /synthia interface |
| Agent employment | Existing /agents interface; no invented agent activity or success claims |
| Original Simlish world | Existing /simlish-world and its separately pinned, staged original sources |
| Created semantic universes | Read-only integration with existing localStorage key semantic_universes; open them with the existing UniverseViewer3D |
| World creation and housing | Existing /universe-creator and housing world IDs |
| Resonance/mesh | Existing /mesh |
| Computer/IDE | Existing SynthAI2 Dashboard at /computer and editor at /ide |
| Game Creator | Existing /game-creator |

All original routes remain available. The original Dashboard is **moved, not deleted**, from / to /computer. Existing universe saves are read, not migrated. Existing world creation, 3D rendering, registration, and Simlish asset-staging code are untouched.

### Source truth

Five dimensions and central Human Design identity come from YOU-N-I-VERSE's established architecture. Portal-to-application assignments are UI navigation mappings, not scientific assertions about dimensions. The five nodes are navigational landmarks; do not interpret them as evidence of a fully running social simulation, chart computation, or autonomous agent lifecycle.

The existing SemanticUniverseCreator uses seven semantic renderer layers. This remains its independent rendering model, not an asserted one-to-one mapping to the five macro dimensions.

### Not included in this change

- A new backend world-state schema or distributed persistent world store
- Cross-device sync of local semantic worlds
- Unverified agent outputs, simulated food/sleep/training, or fabricated narrative events
- Changes to source-provenance rules, Human Design calculations, or the existing Simlish resolver

The next deeper integration requires explicit state contracts linking a world ID to real agent IDs, verified task executions, needs, training artifacts, memory snapshots, and observable results. Those must be emitted by the genuine runtime with provenance, not decorative front-end widgets.

### Verification

Run:

    node --experimental-strip-types --test tests/indiverseWorldStore.test.mjs
    npm run build
    npm run check

The build stages pinned original Simlish source as a required dependency, and deliberately fails if that original source cannot be retrieved. Existing TypeScript diagnostics outside changed files should be tracked separately.

This change should be reviewed and verified on its dedicated integration branch before merging into main.
