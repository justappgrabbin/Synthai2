# Unified addressing evidence audit — 2026-10-20

Status: inspected; no original addressing engine replaced or overwritten.

## Source files inspected

- Synthai2: `client/src/lib/meshAddressing.ts`, `client/src/lib/appRegistry.ts`, `server/lib/appMountService.ts`, `server/lib/workspaceService.ts`, `server/lib/githubService.ts`, `server/lib/meshEventStore.ts`, `server/index.ts`, `server/routes.ts`, and the new dispatch and r21.21 bridge files.
- Simlish (`justappgrabbin/Simlish@main`): `you-n-i-verse/vendor/klein/address-space.mjs`, `gate-address.mjs`, and `POV_SYSTEM_README.md`.
- Generative Address System (`justappgrabbin/Generative-address-system@recovery/library-donors-20261020`): `authorities/execution-spine/ADDRESS-RESOLUTION-v0.4.0.md`, `src/canonical-address.mjs`, `src/execution-address-resolver.mjs`.

## Material differences — do not flatten

1. Synthai2 `meshAddressing.ts` defaults absent Gate/Line/Color/Tone/Base to 1 and other absent coordinates to Aries/house 1. These are **synthetic defaults**, not evidence-based placement.
2. Simlish `normalizeAddress` explicitly supports unresolved fields; macro mode requires five coordinates when not unresolved. It uses `arc`, not the Generative Address System's structured `arcAxis`, and it constrains `degree` to 0..359.
3. Simlish `gate-address.mjs` explicitly converts between King Wen and binary order. Its mapping must not be reduced to gate-1.
4. Generative Address System requires the full planetary→dimension→gate→line→color→tone→base→degree→minute→second→arcAxis→zodiac→house spine; degree is structured 5-of-29 and arcAxis is an object. It derives a **computational coordinate after an observed first execution** and expressly does not claim astronomical or semantic truth. Creator-supplied canonical coordinates remain authoritative.
5. `server/lib/addressedDispatchService.ts` currently records identity SHA-256 and optionally user-supplied coordinates, **not** Generative Address System semantic or execution-derived placement. It must not be represented as complete address resolution.
6. The r21.21 donor is fingerprint-verified and stageable, but no runtime plugin activation is proven.

## Required unified protocol

- Preserve source bytes, source branch/commit, SHA-256, original address, derivation, and context.
- Resolve leading situational vector and constraints using the existing engines; never invent coordinates.
- Store separate `semantic`, `creatorSupplied`, `executionDerived`, `legacySimlish`, and `legacySynthai2` projections, with evidence and conversion metadata.
- Do not translate King Wen gate numbers by arithmetic offset; use Simlish's explicit gate mapping.
- Do not silently cast structured 5-of-29 degree to 0..359, or structured arcAxis to string arc.
- Only merge identities after explicit equivalence proof; otherwise maintain linked aliases.
- Route originals and receipts to GitHub/Supabase only after addressing and explicit owner approval. Never overwrite originals.
- MCP/mesh carries events and receipts, not the standalone Synthia brain.

## Blocking work before activation

Inspect the Generative Address System runtime assembly and tests, Simlish's `boolean-ato.mjs`, `king-wen.mjs`, `gate-data.mjs`, and tests, then implement and test lossless adapters. Validate Supabase configuration and GitHub write permissions in the actual runtime. No claims of full plugin installation, deployed runtime, or passing tests until demonstrated.
