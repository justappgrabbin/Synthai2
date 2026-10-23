# Cynthia — birth-derived initialization / root-cause audit
Date: 2026-10-23
Status: STATIC SOURCE FINDINGS, NOT RUNTIME VALIDATION

## User-corrected requirement
The universal genome/framework is shared; birth-chart calculations establish an individual's initial *configuration and expression* within it. This is a core initialization input in Cynthia's specified developmental and semantic architecture, NOT a birthday form, post-hoc persona prompt, cosmetic chart, or optional decoration. The individual's own work and context subsequently refine expression. The app must not claim that natal calculations provide scientific evidence of behavior or capability; they are owner-defined architectural inputs.

The installed Solo Hover planet's complete source/behavior has **not yet been identified or reproduced**. Findings below are from candidate/recovered sources, not a diagnosis of the installed APK.

## Confirmed source-level failures / gaps

### 1. Default states are built independently of the chart (HIGH, confirmed)
[GraphRuntime.js](https://github.com/justappgrabbin/SynthAi/blob/main/computer/donors/recovered/synthai-r21.22-self-cultivation-graph-integrated/runtime/GraphRuntime.js), `activateInitialStates`, declares `initialGates = [1,25,10,34,57]` and loops over all 6 lines to activate those gates before reading `intent.chartCoordinates`. The coordinates are optional (`[]` when absent); only then does the runtime attach additional `chart-coordinate` nodes. Thus birth chart information is not a necessary initialization input and cannot be claimed to drive all initial states. That is inconsistent with the requirement.

### 2. Current UI boot sequence is not chart-driven (HIGH, confirmed)
[Synthai2 OSBootGate.tsx](https://github.com/justappgrabbin/Synthai2/blob/main/client/src/components/OSBootGate.tsx) checks frontend, event bus, Synthia server, MCP status and persists the dismissed boot-gate flag. No birth-derived calculation, integrity check, chart provenance check, or application of chart seed is in that component. Another boot path may exist elsewhere; **do not assert system-wide absence**.

### 3. Chart adapter produces empty channels and centers (HIGH, confirmed for that adapter's return value)
[ChartCalculatorAdapter.mjs](https://github.com/justappgrabbin/SynthAi/blob/main/computer/donors/recovered/synthai-r21.22-self-cultivation-graph-integrated/runtime/ChartCalculatorAdapter.mjs) calls the IsoHuman GeonatalCalculator, projects placements and gate coordinates and returns `humanDesign.channels: []` and `centers: []`. The output retains useful canonical chart coordinates, but does not itself establish the downstream relational channel graph or center activations. Trace consumers before assuming these empty arrays remain unpopulated.

### 4. Another calculator uses a sequential zodiac-to-gate shortcut (HIGH, requires chart correctness test)
[Synthai2 chart-calculators.ts](https://github.com/justappgrabbin/Synthai2/blob/main/server/services/chart-calculators.ts) calculates `gateNumber=Math.floor(longitude/5.625)+1`. This mathematically returns an angle sector index, but is not, by itself, an established Human Design gate lookup with ordering and offset. It also approximates the lunar node and uses fixed speed estimates. Test against canonical owner-selected mapping and known precision examples before selecting as authoritative.

### 5. 'Birthday calculator' asset is not actual working source (HIGH, confirmed)
[Synthai2 attached_assets/birthcalc_1761745539874.ts](https://github.com/justappgrabbin/Synthai2/blob/main/attached_assets/birthcalc_1761745539874.ts) contains only a comment saying a birthday calculator and adapters were provided earlier. Do not treat the filename as proof of an implemented birthday calculator.

## Existing parts to reuse before writing
- [Synthia r21.22 chart adapter](https://github.com/justappgrabbin/SynthAi/blob/main/computer/donors/recovered/synthai-r21.22-self-cultivation-graph-integrated/runtime/ChartCalculatorAdapter.mjs) — strict birth time and geographical input validation; outputs planetary/orientation/gate/line/color/tone/base and provenance.
- [IsoHuman GeonatalCalculator donor](https://github.com/justappgrabbin/SynthAi/tree/main/computer/donors/recovered/synthai-r21.22-self-cultivation-graph-integrated/donors/isohuman) — used by adapter; validate against known ephemeris/test cases, not assume correctness.
- [GraphRuntime](https://github.com/justappgrabbin/SynthAi/blob/main/computer/donors/recovered/synthai-r21.22-self-cultivation-graph-integrated/runtime/GraphRuntime.js) — tool execution, dimensional stepping, channel processing, expression graph; retain its operational pieces, replace its incorrect early hardcoded seed initialization once the contract is defined.
- [Simlish/Klein](https://github.com/justappgrabbin/Simlish/tree/neural-language-contact-model/you-n-i-verse/vendor/klein) — actual linguistic and relational tools to configure/activate downstream of the seed.
- [r21.22 SynthiaToolBootstrap](https://github.com/justappgrabbin/SynthAi/blob/main/computer/donors/recovered/synthai-r21.22-self-cultivation-graph-integrated/UPGRADES/bootstrap/SynthiaToolBootstrap.js) — already connects several Klein tool adapters to GraphRuntime.

## Proposed corrected initialization contract (implementation to be verified)
1. Load the stable universal genome and selected versioned chart-calculation method. Do not hardcode personality gates into the runtime.
2. Resolve the person's consented birth date, local time/UTC offset, birthplace/location and uncertainties. Keep originals, source references and precision.
3. Validate input and calculate owner-selected chart projections (the established five-chart/dimensional mechanisms where applicable), planetary orientations, exact canonical gate sequence, finer coordinates and provenance.
4. Produce an **immutable, versioned chart seed snapshot**. Report errors or unknown precision instead of silently substituting invented positions. Hash may identify the snapshot but does not replace its semantic structure.
5. Initialize the individual swarm/tool/neural configuration from that snapshot, with universal genome shared across people. Keep relationship, context, contribution and outcome dynamics active; do not mistake seed for fixed fate/personality.
6. Connect dimensional and Klein linguistic pathways, neural contact state, tool registry, expression graph, morphology and the planet interface after the seed has been installed.
7. Persist/reuse snapshot between app launches; changes to profile, sources or method version produce a reviewed new version, without erasing the original.
8. Treat people who cannot supply precise birth data via an explicit unresolved/partial configuration path (no fake precision), with capability choices according to product policy. Exact fallback behavior remains to be confirmed by owner.

## Mandatory acceptance checks before APK promotion
- Different valid birth seeds yield distinguishable recorded initial configurations without changing universal genome implementation.
- Same inputs/calculation version yield equivalent initial configurations on repeated startup (determinism test).
- Incorrect/no coordinates cannot silently trigger five hardcoded gates as though they were personal output.
- Time-zone boundary, birth-location boundaries, daylight-saving and unknown-time cases have clear validation behavior.
- Gate lookup matches an independently verified canonical chart fixture, including design vs personality and fine precision.
- Chart-derived outputs are **consumed** by the runtime's tool selection, relationships, and expression graph; displaying a chart alone does not pass.
- Klein tools and neural contact runtime remain callable and source-linked; no fabricated conversational output.
- Android planet and Hands stay separate; Hands code unchanged; original screen only reused after its exact source is identified.
- Device build and startup checks performed before claiming repaired APK.
