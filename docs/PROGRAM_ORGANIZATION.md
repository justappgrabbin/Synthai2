# Organize the existing computer

This change organizes access to the existing programs. It adds no starter templates, substitutes no engines, deletes no source/assets, and does not merge unrelated feature branches. Baseline: main at c933a62b531b7d8036bb23d51b99c02d2e75d9c0, including the recent Visual Morph and original Simlish rigged-3D integration.

## Existing programs, explicit homes

- Worlds opens the original Simlish runtime at /worlds; /simlish-world still works. Its section includes Character Studio, Universes, Games, Player, SynthWorld, Morph / Mesh, Human Design and Agents. Related entries open the same programs, not copies.
- Morph groups the existing mesh, ingestion, ZIP Studio, Glyphs and Character Studio. All original Morph panels, including Visual Morph, remain mounted. The existing fixed panels are contained below the shared navigation and above the mobile dock.
- Human Design has a visible primary entrance alongside the existing calibration program. No chart calculation or interpretation changes are included.
- Agents groups the existing Agent Creator, Autonomy, Synthia and SynthWorld. SynthWorld is the actual AgenticRealityLab already used by the Verse fly-up; its existing buttons, source views and agent controls remain intact.
- Creation tools retain IDE, Novel, GAN, Planner, Mods, Store and the related ingestion/game tools.
- All programs is a searchable grouped index, including additional installed apps from the original registry.

The old URLs are not removed or redirected. The only new program routes are /worlds (same Simlish component), /agent-world (existing lab) and /programs (index). Both direct links and browser back/forward select Character Studio using studio=1. The home tray gains Worlds and All programs without resetting its saved order or hidden choices. Embedded TopNav components defer to the computer's navigation; their standalone fallback is retained.

## Boundaries

Navigation relationships are not new runtime connections. This change does not claim that agents share world state, Human Design is complete, contextual generation is fully integrated, or self-repair works. The open contextual-worlds branch needs separate reconciliation with the newer Simlish 3D runtime. No invented I Ching/gate rules or fixed missions are introduced here.

The owner explicitly requires organization without simplification and no generic template replacement. A separate request for Foundry needs to distinguish the preserved Resonance Foundry source from a workspace for executable builders; neither should be silently replaced with a newly named catalogue.

## Packaging evidence

scripts/package-inventory.mjs reads actual build output and writes package-inventory.json. Android CI inventories both dist/public and the assets actually copied into Capacitor, then publishes a separate synthai-package-inventory artifact. It changes no packaged files. The report uses uncompressed sizes and must not be confused with ZIP/APK compression or installed storage.

Tracked main source/assets total approximately 107 MB, including approximately 91 MB of attached archives/assets. This excludes Git history, dependencies, build-staged Simlish files, and separately installed model weights. The local model client references roughly 491 MB–1.12 GB model files; declarations alone are not bundled models. Android's existing documentation says a native Node/Python host is not included. A successful APK build does not prove those runtimes exist inside it.

## Verification

Run node --test tests/programNavigation.test.mjs tests/packageInventory.test.mjs. The tests protect original route discoverability, world/program relationships, query navigation, user tray preferences and inventory byte accounting. The existing Android PR workflow performs the actual production build and APK packaging.

Manual acceptance still required: desktop and phone navigation; all original routes and panels; direct Character Studio link and browser back; saved tray preferences; original world 2D/3D controls; keyboard navigation; program search and installed apps; inspect the generated package inventory. Local full build/browser verification was unavailable because the execution environment could not reach its configured network proxy and has no project dependencies/browser installed. Do not equate the targeted Node tests with a complete visual or runtime walkthrough.
