# YOU-N-I-VERSE Commons + connected game portals

This integration adds a working small social foundation to the existing SynthAI2 host without deleting or replacing the separate Resonance Foundry social implementation.

## What is connected

- `/verse-commons` is reachable from the OS dashboard, desktop navigation, and mobile dock.
- Each browser receives a guest identity backed by an HttpOnly same-site session cookie. A nickname can be changed without entering birth information.
- Posts and room membership are shared on the same backend and persisted to `workspace/.synthia/verse-commons.json` (or `MESH_DATA_DIR/.synthia/verse-commons.json`).
- Rooms exist for the Commons, Human Design, Games, and the individual browser games / Simlish world.
- Posts can reference a canonical world ID. Another visitor can follow that link to the same game or world route.
- The Platformer, Space Shooter and Puzzle Game open their existing interactive browser-template previews; Simlish opens its original routed world if the pinned assets have been staged.
- Each game has a small list of connected portal destinations in `VERSE_WORLDS`. Portal selection emits `game.portal.entered`; posting/joining emits metadata-only social events.
- Game Creator and Simlish both link back into the relevant game community room.
- Existing Human Design calculation engines, game templates, Simlish source staging, and Resonance Foundry source files are preserved.

## What is NOT yet connected

- Browser games do not transfer character state, inventory, scores, or progress; portal links are navigation only.
- Standalone Godot projects and ZIP game packs still require mounting, export, and runtime verification. The Godot card is clearly labeled starter-only.
- Guest identities are scoped to the current browser. No account recovery, verified friends, moderation or cross-device authentication are implemented.
- This is not a production-ready public social network. Before public launch implement actual user authentication, moderation/reporting, abuse controls, deletion/privacy handling, backups, and database-backed concurrent storage.
- Simlish runtime assets are staged by the existing pinned build process, not committed directly in this repository. Verify build artifacts before claiming the world is playable on a device.
- Synthia Light Mobile `Nodejs-1.zip` is deliberately not merged in this PR; its Kaboom generator needs a separate compatibility adapter and smoke test.

## Test

`npx tsx --test tests/verse-commons.integration.test.ts`

The integration test checks guest identity, room joining, cross-game attached posts, persisted records and same-origin write rejection. The pull request has a focused GitHub Actions check. The repository's broader `npm run check` has known pre-existing TypeScript failures; do not claim it passes until those are repaired.

## Architecture and migration path

The canonical world registry is the server-side `VERSE_WORLDS` and the shared world IDs appear in post records and mesh events. Future integration should add real player identity/auth and world state/event migration, and may adapt the preserved `client/public/synthworld/source/resonance_foundry_4_` social source rather than replacing it.
