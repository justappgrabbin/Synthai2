# Cynthia hover rebuild — source audit before implementation
Date: 2026-10-23
Status: **DISCOVERY ONLY; original phone APK and opening page have not been identified.**
This document distinguishes code presence from successful wiring and runtime verification.

## Preservation rules
- Do **not** modify or copy over original Android Hands, accessibility services, branches, installed APKs, or source files.
- Existing prototypes belong in a **separate candidate branch**. The partially created app in this directory is NOT a rebuild of the verified original and is NOT a confirmed APK.
- Original sources and user-authored architecture remain authoritative. No Netlify fallback. No hardcoded simulated chat, research sources, or model predictions.
- Evidence levels: PRESENT (file exists), WIRED (call chain inspected), VERIFIED (run and behavior observed). Never promote one level automatically.

## Existing pieces confirmed PRESENT

| Capability | Owner / source | Observation | Next validation |
|---|---|---|---|
| Klein automata (8 factories) | [Simlish](https://github.com/justappgrabbin/Simlish/blob/neural-language-contact-model/you-n-i-verse/vendor/klein/klein-tools.mjs) | AUTOLING, DISEMINER, analogy, I Ching grammar, language contact, historical Monte Carlo, AutoNovel, MESSY | Execute fixtures; inspect complete set elsewhere before claiming 16 |
| Exact duplicate Klein automata | [Synthaide](https://github.com/justappgrabbin/Synthaide/blob/main/src/synthia/ato-core/klein-tools.mjs) | Git blob SHA **95b17ae78a53a6318d5f013e35efda954e584be6** matches Simlish file byte-for-byte | Reuse one canonical implementation rather than copying both |
| Extended Klein implementation | [SynthAi donor](https://github.com/justappgrabbin/SynthAi/blob/main/computer/donors/recovered/synthai-r21.22-self-cultivation-graph-integrated/vendor/ato-core/src/klein-tools.mjs) | Distinct SHA, longer source; same factory names; **not** yet compared behaviorally | Diff semantics/tests before choosing |
| Rich linguistic learning implementation | [SynthAi KleinLinguisticLayer](https://github.com/justappgrabbin/SynthAi/blob/main/computer/donors/recovered/synthai-r21.22-self-cultivation-graph-integrated/organs/today/KleinLinguisticLayer.js) | Informant-based grammar training, class formation, recycling and cross-language rules | Verify imports, persistence and test contract |
| Five-dimensional Klein modes | [Synthai2 AION KleinTools.py](https://github.com/justappgrabbin/Synthai2/blob/main/synthia-server/aion/KleinTools.py) | Eight families each exposing dimension-specific modes | Verify modes with fixtures; do not confuse eight families with full 16+ tool objective |
| Recurrent contact checkpoint + memory | [Simlish language-contact-model](https://github.com/justappgrabbin/Simlish/tree/neural-language-contact-model/language-contact-model) | NPZ trained checkpoint, NumPy recurrent runtime, session/correction SQLite, model-card and training reports | Run tests and checkpoint inference; determine Klein ↔ neural invocation and data adaptation |
| Research organ | [SynthAi ResearchOrgan](https://github.com/justappgrabbin/SynthAi/blob/main/computer/donors/recovered/synthai-r21.22-self-cultivation-graph-integrated/organs/ResearchOrgan.js) | Claims/sources/hypotheses/experiments workspace | Verify external retrieval adapter and evidence lineage |
| Android native shell and Hands | [stellar-proximology-full-v0.1.0](https://github.com/justappgrabbin/stellar-proximology-full-v0.1.0/tree/main/src/com/synthia/autonomy) | MainActivity + SynthiaAccessibilityService; no evidence this is the installed Solo Hover planet | Preserve; inspect only |
| Browser/mesh Hands | [yniSwarmHands](https://github.com/justappgrabbin/stellar-proximology-full-v0.1.0/blob/main/assets/web/synthia-server/pure-synthia/host/yniSwarmHands.mjs) | Permission-gated DOM/browser/network/files adapter | Preserve unchanged |
| Purple hover chat prototype | [Synthai2 UI branch](https://github.com/justappgrabbin/Synthai2/blob/ui/purple-hover-screen-2026-09-21/client/src/components/PersistentAssistant.tsx) | Floating assistant button and existing chat view; web interface rather than confirmed installed Android planet | Locate phone source/assets before claiming original interface restored |

## Important integration corrections
1. **Klein tools are part of the intended language contact model**, not a newly proposed optional plugin. They are implemented in the broader Simlish source tree. The separate Python neural runtime inspected currently operates on numeric channels; no Klein invocation found inside that runtime. The composition/wiring is a specific audit target, not a reason to rebuild Klein.
2. [Original model card](https://github.com/justappgrabbin/Simlish/blob/neural-language-contact-model/language-contact-model/MODEL_CARD.md) explicitly disclaims trained open-ended text conversation. Do not use its numeric outputs as invented chat responses; route chat through an independently verified generator or combined engine.
3. [Synthai2 Google Drive service](https://github.com/justappgrabbin/Synthai2/blob/main/server/lib/googleDriveService.ts) relies on Replit connection credentials, which cannot be presumed to work on a standalone Android runtime. A read-only authenticated Drive adapter must be evaluated against the user's existing connector infrastructure; no fabricated document access.
4. A prior [SWARM-OS audit and assembly checkpoint](https://docs.google.com/document/d/11VrcozcbxpP4YiyljWnfbBnsnejTNWzMX9GsDem0tTU/edit) explicitly says: Drive originals first; GitHub fallback; preserve originals; and distinguish PRESENT/WIRED/VERIFIED. It also reports mobile APK unverified in historical material.

## Blockers before next implementation
- Identify **the exact source and opening page of the currently installed Solo Hover/Cynthia Sovereign planet**. Similar browser buttons and sovereign-studio PWA are not proof of the same app. Do not replace it with a generic page.
- Trace the model's Klein invocation path, runtime environments (JS vs Python), checkpoint acquisition and persistence. Reuse code and avoid redundant implementations.
- Locate and validate the user's Drive research model before deciding model routing; do not substitute Trident without comparison.
- Verify minimal real flows: open overlay; chat makes actual model call; to-do survives restart; inbox receives real event; notification permission/reminder fires; foreground voice opt-in wakes; authenticated Drive research returns cited source.
- Run native Android builds and device tests; no APK or functional notification/wake-word claims before passing.

## Current candidate status
A separate, isolated Android shell with purple/teal UI, tasks, inbox, voice and connector scaffolding exists **only as source code** on this branch. It has NOT been compiled, installed, connected to the original model, or verified. Do not mistake this for the final requested build. No changes to Hands, Supabase RLS or the original default branch were made.
