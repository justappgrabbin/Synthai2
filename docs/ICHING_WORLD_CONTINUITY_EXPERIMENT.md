# Experimental world continuity: I Ching as the shaper

This branch builds **on** `integration/verse-commons-game-portals-20261031` and its existing Social/Simlish/Human Design code; it does not delete or replace Morph, the original Simlish runtime, the ZIP player, the Human Design chart, or the internal game tools.

## What this branch actually does

1. A browser-scoped guest identity is reused when a player enters a connected world from the Verse Commons portals.
2. Each entry receives a deterministic six-line scenario grammar (yin/yang bottom-to-top, one or two changing lines, resulting six lines).
3. Scene levers (lighting, terrain, rhythm, encounters, resources, transition) are **proposals**, not yet attached to the visual renderer.
4. Visits survive route navigation and are persisted in the existing `workspace/.synthia/verse-commons.json`.
5. Validated same-origin Simlish world-operation receipts are also submitted as **client-reported** actions and can be retrieved across worlds.
6. A minimal journey status is shown in Verse Commons. No extra game-builder templates are introduced.

## Boundaries / what is not yet done

- The shaping module outputs scenario settings; the live Simlish renderer and other games do **not** yet apply those settings. That is the next adapter to build.
- World visits and receipts are persistent, but game-level positions, inventories, combat, scores, and complete per-world saves are **not** shared across games. Simlish retains its original independent local IndexedDB save mechanism.
- Game operation receipts are client-reported, not server-validated gameplay. They must not mint currency, achievements or authoritative scores.
- The scenario grammar is not claimed to be the traditional King Wen hexagram numbering or historical line interpretation. A Human Design **gate is not** being treated as interchangeable with a hexagram. The research bibliography and canonical mappings need separate review.
- This is browser-scoped identity and JSON-file persistence, not production-ready cross-device authentication, public-social moderation, or concurrent database storage.
- The original Simlish assets are only playable if the existing pinned integration process stages them in the built app.
- A bounded in-memory rate limit rejects excess writes. Production deployments need shared storage/rate limiting and idempotent event handling.

## Acceptance check

`npx tsx --test tests/world-continuity.integration.test.ts`

The test checks six-line determinism, the changing-line transformation, entry -> action -> portal -> return, persisted data on disk, unchanged guest identity, and cross-origin write rejection.

## Next engineering slice

Connect the six scene levers to the **existing** Simlish/Morph world-runtime interface, then use a world-operation receipt to demonstrate a visual or environmental change survives a return visit. Add player-controlled save export/import and verified account identity before treating browser-local records as a cross-device continuity system.
