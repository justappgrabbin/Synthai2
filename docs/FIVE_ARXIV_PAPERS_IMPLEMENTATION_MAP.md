# Five-paper research integration map for Synthai2 / I Ching-shaped worlds
Date: 2026-10-31

## Fidelity warning
This is a source-based engineering map for five papers provided by the project owner. Referencing a paper does not mean its model, weights, training setup, neural architecture or measured performance have been implemented. The existing experimental branch provides persistent world visits, action receipts and a deterministic **experimental** six-line scene grammar; it does NOT implement any of the five published neural algorithms.

Keep **Human Design the product**; world creation stays inside Morph; Simlish, ZIP Player and Verse Commons are supporting systems. Do not replace the original code, confuse I Ching hexagram lines with Human Design gates, or promise local neural inference without measurement.

| Source | Research mechanism | Current honest status | Target in this repository | Proof required |
| --- | --- | --- | --- | --- |
| [2602.00608 — Scalable Generative Game Engine](https://arxiv.org/pdf/2602.00608) | Split compute-bound world model from memory-bound decoder; operator fusion, latent extrapolation and speculative responsiveness; accelerator-cluster experiments. | **NOT implemented.** Current browser games/Simlish are not this neural engine. | Optional `renderers/neural/` provider behind current Simlish/Morph renderer. Support mobile conventional-renderer fallback; no forced GPU deployment. | Reproduce paper-relevant FPS and frame-to-action latency on stated device, report accelerator count/memory/expense. Compare image consistency and cost with original renderers. |
| [2503.21172 — Model as a Game](https://arxiv.org/pdf/2503.21172) | Two distinct modules: numerical consistency (trained LogicNet event detection + external calculator) and spatial consistency (explicit explored map and local-map conditioning for generation). | **PARTIAL CONCEPT only.** `server/lib/verseCommonsService.ts` now stores visits and reported actions and a stable world registry, but it has **NO LogicNet, numeric rule calculator, coordinate map, or map-conditioned diffusion model**. | Extend canonical world state with position/objects/map tiles or landmarks reported by the actual engine. Add validated deterministic event rules, authoritative numeric values, and replay tests before neural conditioning. | Walk to site A, change an object or score, visit B, revisit A: exact saved object/position and causally justified numerical value survive. Malformed or out-of-order events rejected. |
| [2608.13200 — GEM](https://arxiv.org/pdf/2608.13200) | Reason over query intent, then generate an embedding token for retrieval in a unified model. | **NOT implemented.** `VERSE_WORLDS` literal links and the existing Mesh are not a GEM retriever. | A replaceable retrieval adapter for user requests such as 'find the world where this happened', searching world identities, visit history, research and installed modules with provenance. Existing exact-ID search as fallback. | Retrieval accuracy on labeled world/memory/tool requests vs baseline; latency and hallucinated-target rate. Never fabricate source or world IDs. |
| [2412.08781 — GMem](https://arxiv.org/pdf/2412.08781) | A separate immutable semantic memory bank conditions training and inference of **diffusion** models and reduces neural memory burden. | **NOT implemented.** Persisting social posts/JSON gameplay visits is **not** GMem. | Optional visual-generation/training adapter that stores versioned, immutable scene semantic features. Avoid swapping live save state for the immutable visual memory. | Compare same training/inference task with and without memory bank on fixed data/seed/hardware: quality, training steps, latency, memory and cost. |
| [2610.12847 — When Generative Models Act as Simulators](https://arxiv.org/pdf/2610.12847) | Tests editability of trained generative latent representations via probe steering versus inverse state mapping. Success is environment-dependent, even when state is decodable. | **NOT implemented.** Current `server/lib/ichingWorldShaper.ts` derives six abstract scene levers but does not control neural latents or the Simlish renderer. | Formal adapter from validated world-simulation state to renderer/generative model inputs; separately experiment with inverse mapping only after there is a trained compatible generative model. | Controlled change to simulator state causes corresponding observed world change, while unrelated objects remain stable; test failures and reversibility. |

## Order of integration

1. **Actual state/scene bridge, no pretense of neural world model:** consume `shapeWorld` from `server/lib/ichingWorldShaper.ts` as explicit scenario constraints, feed a documented message/event to the original Simlish/Morph renderer, receive a runtime acknowledgement/receipt, and persist the resulting state. Verify changed environment in the actual built app.
2. **MaaG-inspired numerical + spatial rules:** run authoritative deterministic object/location/score updates from actual event triggers, keep per-world coordinates and an explored map (not just portal links). Test moving between worlds and returning without reset. Reconcile the independent Simlish IndexedDB saves against server/browser scoped guest progress with explicit conflict rules.
3. **Editable simulator boundary:** use the result of step 2 as an explicit `WorldState`; define a provider-neutral `applyState(state): WorldObservation` renderer protocol. Do **not** call this the paper's inverse neural latent map.
4. **GEM experiment:** add optional reasoned retrieval alongside exact ID and search baseline; measure hit rate and resource use. Integration is optional until real trained weights/service are present.
5. **GMem and scalable neural engine experiments:** only after hardware/model/data are available. A generic key-value cache or CSS animation is not these published techniques. Keep existing renderer as the default/offline path.

## Canonical symbolic boundary

- I Ching / Zhouyi **hexagram**: six ordered yin/yang lines and documented line changes, textual and canonical ordering *only when backed by a cited mapping*.
- Human Design **gate**: its own model entity; do not equate numeric gate IDs to binary hexagram indices or invent gate correspondences.
- `shapeWorld` uses SHA-256 to generate a **procedural six-line sample**, NOT a canonical King Wen hexagram identification, divination, or validated Human Design calculation.
- Before presenting a named hexagram, bind a versioned canonical source map for trigrams, hexagram ordering, line positions, changed-line transformation and provenance. The world may be shaped by the symbolic grammar without falsely claiming it is the actual classical textual interpretation.

## Code artifacts in experimental PR
- `server/lib/ichingWorldShaper.ts`: repeatable line and changed-line scenario shapes.
- `server/lib/verseCommonsService.ts`: browser-scoped guest, stable world registry, visit logs and source-labeled action reports.
- `client/src/pages/VerseCommons.tsx`: records entry before navigation.
- `client/src/pages/SimlishWorld.tsx`: submits checked same-origin original Simlish world-operation receipts.
- `tests/world-continuity.integration.test.ts`: deterministic shape and save/reentry test.
- `docs/ICHING_WORLD_CONTINUITY_EXPERIMENT.md`: implementation boundaries.

## Deployment and security gates
- Never claim these research algorithms were reproduced or trained without checking source and running benchmarks.
- The JSON store is a **prototype**, not concurrent public social storage. The server currently accepts client-reported actions; it must not award money/currency, scores or public achievements from them.
- Mobile is a first-class acceptance target; build for a real phone, test iframe world assets and low-memory fallback.
- No automatic merges to the main product. Preserve existing original modules and use a reversible Git branch.
