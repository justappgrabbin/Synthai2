# Cynthia birth-engine donor selection — audit of eleven user-provided Drive archives
Date: 2026-10-23
Status: **STATIC SOURCE COMPARISON + LOCAL UNIT/SMOKE TESTS**. No production birth engine or original Solo Hover APK modified.

## Decision
**Reuse Synthia-Human-Design-Engine-v2.0.0 as the central calculation interface**, especially `src/index.mjs` and its verified-natal versus explicitly low-precision-offline separation. For birthday/birthplace entry **reuse the Open Human Design place-autocomplete interaction**, its `src/views/entry.js` / `src/lib/placesearch.js`, and the existing `natalengine` geocoding/IANA timezone functions, with explicit corrections below. Do NOT require a person to type IANA timezone strings or underscores. Existing runtime's born-derived chart should be installed as a first-class initial condition, not bolted onto a hardcoded generic runtime.

## Eleven Drive archives assessed
1. `astrology-skill-main.zip`: extensive text/interpretation and an opt-in AGPL Python birth-to-chart calculator. Best **research/interpretation reference**, not primary phone-native JS engine; review license if distributing.
2. `astro-calculator-main.zip`: Next/React `src/app/_birth-form.tsx` already has debounced city autocomplete and auto-filled lat/lon/timezone; endpoint uses Nominatim and tz-lookup. Good **alternative UI/reference**, but requires server endpoint and should not be substituted for native offline runtime without adaptation.
3. `AstroParser.zip`: CynthiaBirthParser uses input `tz` defaulting to `America/Los_Angeles`, `lat` 34.05 and `lon` -118.25. Do NOT use this as canonical onboarding: silent example-city defaults and manual geo fields can produce incorrect birth seeds.
4. `xyflow-main.zip`: interactive React/Svelte flow graph library. Potential later visual graph component; **not** an astrological calculation engine.
5. `resonance-first-verification-and-repair.zip`: existing integration audit/log reporting 85 passes and 68 environment-related failures, Node/Python runtime mismatch and missing astronomy dependencies. Useful **repair/provenance evidence**, not runnable chart system. Its historical results are not present-day verified.
6. `cosmos-main.zip`: TypeScript astrology/Human Design/Gene Keys wrapper dependent on `circular-natal-horoscope-js`. Useful **secondary JS comparison**, not yet run in this audit.
7. `open-human-design-main.zip`: first choice **birthplace UI** and timezone resolver; `src/lib/placesearch.js`, `src/views/entry.js`, `src/lib/location.js`. It uses `natalengine.searchPlaces` (Open-Meteo geocoder) and `resolveUtcOffset` from historical IANA data. Its file `tests/location.test.js` passed 8/8 locally. It supports human city names, not a manually typed IANA zone. MIT according to README, verify LICENSE before distribution.
8. `Synthia-Human-Design-Engine-v2.0.0.zip`: first choice **Synthia chart-calculation API**. It intentionally separates higher-accuracy natalengine path from a low-precision offline deep donor, includes full 13-field/canonical address, channels, defined centers and relationship/timing functions; tests `tests/engine.test.mjs` passed 4/4 and `provenance/deep.test.mjs` passed 3/3. Two separate `calculateHumanDesign` smoke fixtures returned 13 Personality + 13 Design placements and internally repeatable chart facts. Independent external accuracy/reference-fixture check still pending.
9. `Synthia-Design-Dream-Seed-v0.1.0-source-1.zip`: local-first design/experiment and resonance integration using expressly low-precision planetary approximation. Reuse **experiments/outcome tracking**, not primary ephemeris.
10. `SharpAstrology.HumanDesign-master.zip`: C#/.NET Human Design engine, channels, deep coordinates; needs compatible ephemeris context. Useful **independent cross-check/reference**; avoid imposing .NET dependency on compact phone JS just for chart calculations.
11. `hdkit-main.zip`: original Human Design library and very large (145MB ZIP) Ruby/vendor sample-app archive. Core has `hdkit.js`, `constants.js`, `bodygraph-data.js`; useful **reference and possible visualization donor**, not a compact production Android dependency.

## Source-level tests performed
- Synthia v2 `node --test tests/*.test.mjs`: 4 passes, 0 fails.
- Synthia deep `node --test provenance/deep.test.mjs`: 3 passes, 0 fails.
- OpenHD `node --test tests/location.test.js` using preserved natalengine 1.6.0 dependency in an extracted copy: 8 passes, 0 fails.
- Programmatically called Synthia v2 `calculateHumanDesign` on two anonymized, timezone-aware fixtures: each returned 13 Personality / 13 Design activations and nonempty computed center/channel data. Equivalent result on repeated invocation aside from generated ID and creation timestamp.
- Stubbed Open-Meteo geocoder response to verify that `searchPlaces('Salinas, CA')` is URL-encoded without underscore coercion and returns a human-readable `Salinas, California, United States` label with IANA `America/Los_Angeles`. This was a **mocked network test**, not a live search or proof that comma-qualified query text is supported by the remote search API.
- No Android APK build, actual location autocomplete UI/keyboard test or remote Open-Meteo live lookup was performed.

## Required location-entry UX (do not substitute schema display for form)
- Visible input label **Birth city or town**. Accept `Salinas, CA`, `San Francisco, California`, spaces, accents, apostrophes and normal punctuation. **Never instruct users to type underscores**.
- As text is entered (after 2–3 characters, with debounce), display selectable **human-readable place suggestions** and support keyboard, touchscreen and assistive accessibility.
- A user's `City, State` qualifier must help disambiguate city names: don't assume that a raw comma-containing search string necessarily works in Open-Meteo's `name` argument; resolve the city-name query and apply region/country disambiguation using results; do not silently accept the wrong city. Real provider and UI tests needed.
- When user chooses a match, save **city/place label + lat/lon + IANA zone** and resolve the **historical offset for the entered birth moment**. Treat `America/Los_Angeles` solely as an internal technical identifier.
- **Never default to Los Angeles, UTC+0, latitude 0, longitude 0, or the current location** without explicit selection. Missing or failed timezone must stay unresolved with an actionable error; no silent `catch { timezone = 0 }`.
- Network geocoding is not offline by default. Use previously verified cached locations or consented offline gazetteer when offline, or provide manual place/offset fallback clearly labeled with associated uncertainty.
- For unknown birth time, distinguish unknown precision; do not silently present a noon-generated chart as exact.
- Persist chart seed/version/provenance in a way that prevents accidental re-creation/overwrite of established originals.
- After derivation, prove that the resulting 5-dimension/gate/line/color/tone/base/degree-minute-second/etc data drives the actual runtime's initial semantic connections, Klein tools, model and swarm, and continues adapting as relationships evolve.
- Preserve the universal genome common to all people: the birth chart configures individual expression, not the genome's fundamental implementation.

## Wiring / licensing / safety
- Pin exact selected archives/hashes and preserve originals immutable. License-review every redistributed donor (especially AGPL), document original copyright headers.
- Synthia v2 tests prove internal invariants and basic execution, **not** astronomical accuracy or Human Design's scientific validity. Add independent ephemeris checks before declaring precision.
- OpenHD already contains an autocomplete form. Integrate and fix its known silent fallback; do not build a parallel generic autocomplete from scratch.
- Hold the current candidate Android shell as untested until the original hover planet implementation/opening page is identified. Hands remains untouched.
