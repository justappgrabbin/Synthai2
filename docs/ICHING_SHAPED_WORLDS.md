# I Ching-shaped Worlds — first connected life loop

This integration branch implements a narrow, non-destructive **Worlds** entrance and a real Simlish gameplay-to-life transition. It does not relabel ZIP Player as a game and does not replace Simlish, Morph, Game Creator, or the existing Three.js universes.

## Player path

1. Open **Worlds** in the mobile dock, desktop navigation, or OS tray.
2. The current Morph user identity selects a separate local life journal. The I Ching shaper derives six yin/yang lines (bottom to top), two trigrams, a changing line, and relating trigrams from a stable episode seed.
3. The lower trigram shapes the setting; the upper trigram shapes the environmental force, colors, and narrative. This is **symbolic world composition**, not a calculated Human Design gate or a claim of causal divination.
4. Enter the chapter. SynthAI2 opens the **original** Simlish world and posts only a validated scene title, narrative, challenge, and two six-digit hex colors to the same-origin game frame.
5. The original Simlish bridge selects **Mission** mode with the **Chair** target; the original world engine still requires an actual transformation. No fabricated completion event is produced.
6. The host accepts the original, same-origin Simlish receipt. An episode is completed only for a changed, **saved**, Mission / transform / chair operation with completed equal to true.
7. Return to Worlds. The completed chapter appears in a locally saved journal; the next chapter has a new deterministic I Ching shape.

## Original systems and access

- Simlish: /simlish-world (original world from pinned commits, built by scripts/stage-simlish.mjs).
- Simlish character studio: /simlish-world?studio=1. Source photos are never read without an explicit saved-character reuse action.
- Original Game Creator: /game-creator (templates and game packs unchanged).
- Morph and mesh: /mesh (unchanged original store and orchestrator).
- SynthWorld agent/biome research lab: /agent-world (existing AgenticRealityLab; **not** presented as a completed free-roam game).
- Semantic 3D universe creator: /universe-creator (original scenes and local storage preserved).
- ZIP executor: /player (untouched).

The new /worlds route is the common discovery point, not a merged rewrite of every engine.

## Constraints and honest readiness

- The first live loop uses one already-supported Simlish mission. Other generated game templates do **not** yet provide a standardized result receipt, so their outcomes are not falsely credited to life.
- The I Ching changes narrative, mission introduction, and visual theme. It does not yet synthesize arbitrary 3D biomes or rig a full-body character.
- Existing 2D character Morph remains opt-in and same-origin; we don't auto-transfer personal source photos, birth information, or private chart data.
- Player chapters persist in the synthai2-world-life-v1 localStorage namespace scoped to the Morph user id. Original Simlish game replay and other stores remain separate. There is no verified cloud sync, cross-device life continuity, or creator economy in this branch.
- All new code is on a separate integration branch, intended for review before merging.

## Verification

CI workflow: .github/workflows/iching-worlds.yml.

Runs:
- node --import tsx --test tests/iching-world-life.test.ts
- npm run build (stages original Simlish sources and compiles existing frontend/server)
- Original Simlish runtime, morph provider, and integration tests

Manual browser/Android acceptance: launch Worlds → start encounter → verify original Simlish Mission and Chair selected with I Ching skin → execute transformation → return to Worlds → verify one journal chapter, reload and see it persist → confirm direct Simlish and ZIP Player still work → ensure no chapter is awarded for a failed or unsaved mission.

The repository's unrelated, pre-existing TypeScript check failures are outside this narrow slice; CI build and the targeted tests are the honest acceptance baseline.
