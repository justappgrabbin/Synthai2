# YOU-N-I-VERSE 2025 recovery into SynthAi2 (non-destructive phase 1)

Source: [YOU-N-I-VERSE (1).zip](https://drive.google.com/file/d/1PEsO2z_7LvMF1oj2lQGbmOMRmEJ_271I/view?usp=drivesdk), examined October 31, 2026.

## Existing host: SynthAi2

SynthAi2 is the authoritative computer. Its React/Vite OS, existing `you_n_i_verse` Python package, `synthia-server`, local agent, charts, game engine, workspace and terminal are not replaced or redefined.

## Installed and wired now

- Route: `/synthia`, linked from the dashboard and global navigation.
- Companion action opens the *existing* `AgentFlyUp`, which calls SynthAi2's actual `askLocalModel`; no imaginary AI response or hardcoded replacement model.
- Resonance Quest's five original prompts and activities have been transcribed from `templates/resonance_quest.html`. A local-first React quest UI stores before/after self-ratings, completion timestamps, and 10-point awards in `localStorage` under `youniverse_recovered_resonance_quest_v1`.
- Python runtime status reads the existing `GET /api/python/status`; existing Human Design, ingest, calibration, novel, player and mesh interfaces remain separate and accessible.
- The user can preview an original Synthia portrait locally without uploading it or storing its bytes remotely.

## Still contained in the source ZIP — NOT claimed as connected

- `app.py`, `api_routes.py`, `models.py`: Original Flask / SQLAlchemy backend and API.
- `avatar_engine.py`, `static/avatar-engine.js`, `static/synthia-avatar-{1,2,3}.png`: Original animated avatar pipeline and three full-size portraits.
- `speech_engine.py`, `static/speech-synthesis.js`: Audio behavior.
- `memory_module.py`, `synthia_memory.db`: Historical memory implementation and old user data.
- `book_processor.py`, `templates/book_interface.html`, `books/`: Book processing, some historical content.
- `ephemeris.py`, `spec1_calculator.py`, `field_scanner.py`, `consciousness_field_engine.py`, `intervention_engine.py`: Independent experimental calculation/simulation implementations.
- `static/resonance_quest.js`, `static/gamification.js`: Additional legacy game logic not yet ported.

Do not import the old SQLite databases, session configuration, uploaded photographs, private books, generated caches, or `settings.json` into the public repository. Do not rewrite SynthAi2's 13-field address or planetary mappings to accommodate the older archives. The archived Flask calculations are not authoritative for the current system and must not silently replace its Human Design implementations.

## Verification gates

1. `npm ci && npm run build` and `npm run check`.
2. Open `/synthia` from dashboard and global navigation.
3. Start, complete, reload and re-open each quest: progress should persist, each completion adds 10 points.
4. Open the existing Synthia agent; if its model is unavailable the agent must display a genuine error, not a fake response.
5. Open Human Design and other preexisting routes; ensure no regressions.
6. Verify optional historical Flask modules in an isolated service with explicit dependencies and sanitized fixture data before any server integration.

This commit adds a functional user-facing integration surface and an isolated quest port; it is **not** a claim that the complete 2025 Flask application has been merged, tested or deployed.
