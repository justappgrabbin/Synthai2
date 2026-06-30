# Current File View - June 30, 2026

This is the stop-point map for the current SynthAI / You-N-I-Verse shell before the next rebuild pass.

## Live OS Shell

- `SELF_INSTALL.md`
  - Current self-install guide.
  - Confirms the app uses one Linux Docker container with the Studio OS, Synthia Node backend/MCP mesh, Python service, and workspace mount inside it.
  - Explains both mobile lanes: phone connects to the desktop/self-host container, or Android self-hosts through Termux and the APK opens `127.0.0.1:5000`.

- `mobile/PHONE_SELF_HOST.md`
  - Android no-computer setup guide.
  - Uses Termux for the phone-local backend and a Capacitor APK as the launcher shell.

- `mobile/termux-bootstrap.sh`
  - Installs the phone-local backend from GitHub into Termux.
  - Creates `mobile-start.sh` so the phone can start Studio OS and Synthia Node/MCP mesh locally.

- `capacitor.config.json`
  - APK wrapper configuration.
  - Points the Android WebView shell at `http://127.0.0.1:5000`, which is the local phone server.

- `.github/workflows/build-android-apk.yml`
  - GitHub Actions workflow for building a debug APK artifact.

- `Start-You-N-IDE-OS.ps1`
  - Windows self-installer/launcher.
  - Checks Docker Desktop, creates `.env` if missing, starts the container, waits for health, opens the app, and prints the mobile URL for phones on the same Wi-Fi.

- `client/src/components/Dashboard.tsx`
  - Main phone-first OS home.
  - Holds tray/widgets/perspectives/customization.
  - The root route now behaves like the OS entry screen.

- `client/src/components/MakerStudioPanel.tsx`
  - Slide-up panel launcher.
  - The panel currently opens the You-N-I-Verse / SynthWorld agentic reality surface.

- `client/src/components/AgenticRealityLab.tsx`
  - Current SynthWorld runtime view.
  - Tabs include World, Network, Run, Agents, Bricks, Grammar, and Source.
  - This is the visible agentic reality layer for now, not the final full game.

- `client/src/lib/agenticRealityOrchestrator.ts`
  - The main current runtime bridge for SynthWorld.
  - Stores the preserved source pack registry, SynthWorld runtime data, network layers, orchestration helpers, agent actions, grammar pieces, and source links.

## Live Alternate Views

- `client/src/components/GrimoirePanel.tsx`
  - Mounts the notebook/grimoire view.

- `client/public/grimoire/grimoire_v4.html`
  - Current Grimoire source.
  - This replaces the earlier world/oracle page direction for the notebook slot.

- `client/src/components/CynthiaBodyLayer.tsx`
  - Current body/story perspective.
  - Intended as the body-world layer, not a separate random page.

## Preserved SynthWorld Sources

These are preserved in the app package so the next pass can wire them instead of searching again.

- `client/public/synthworld/source/synthworld_godot_starter_7_`
  - Godot starter/game source.
  - Preserved, but not yet exported and mounted as a browser-playable game.

- `client/public/synthworld/source/synthworld_traits_starter_5_`
  - Trait system source.

- `client/public/synthworld/source/synthworld_sentence_engine_6_`
  - Sentence/phrase generation source.

- `client/public/synthworld/source/GnomeQualities_Kit_4_`
  - Qualities/personality kit source.

- `client/public/synthworld/source/cynthia_pt3_webui_connector_4_`
  - Cynthia connector source.

- `client/public/synthworld/source/resonance_foundry_4_`
  - Resonance Network / Foundry source.
  - This is one of the future hub foundations.

- `client/public/synthworld/source/you_and_i_first_3_`
  - You-and-I / universe-builder material.
  - Includes parser, memory hub, and component material.

- `client/public/synthworld/source/glyph_game_system_1_`
  - Glyph quest/game system source.
  - Includes quest/player/resonance/codon logic.
  - Preserved, but not yet wired into the active game loop.

- `client/public/synthworld/source/motivation_gate_42_`
  - Motivation Gate 42 source.
  - Preserved for journey/task progression.

## Is The Game Playable Now?

Partly, but not fully.

What is usable now:

- The OS shell loads.
- The SynthWorld slide-up panel opens.
- The SynthWorld runtime view is interactive.
- The World, Network, Run, Agents, Bricks, Grammar, and Source tabs expose the current journey/scaffold data.
- The preserved game and network packs are registered in the app.

What is not fully playable yet:

- The Godot game is not exported and embedded as a playable web game yet.
- The Glyph Quest system is preserved but not driving a live player loop yet.
- The FairyGAN / GameGAN scene generation layer is not wired into the current UI yet.
- MCP tool gameplay and hub progression are not wired yet.

Plain answer: the current build has a playable shell and interactive SynthWorld scaffolding, but not the final playable SynthWorld game loop yet.

## Known Next Pass

1. Add Stellar Proximology.
2. Wire the Resonance Network as a hub foundation.
3. Set up the two MCP/message hubs.
4. Add gamified MCP tool access.
5. Give users/agents their tool set through the gameplay layer.
6. Wire Autoling for addresses, ontology, inventory, and placement.
7. Wire the Glyph Quest / SynthWorld game loop.
8. Decide whether the Godot starter becomes a web export or whether the first playable loop should be implemented in TypeScript inside the OS.

## Important Design Decisions

- The OS comes first.
- You-N-I-Verse / SynthWorld lives in the slide-up panel, not as the whole screen.
- Apps and widgets belong in the app tray/store, not scattered as unrelated pages.
- Grimoire is a notebook/workspace view.
- Body view is a body-world/game perspective.
- Resonance and I Ching addressing are the organizing authority.
- Autoling owns addresses and classification.
- Autocoder fills implementation gaps only; it does not own addresses.
- Stellar Proximology and the MCP hubs are planned for the next phase.
