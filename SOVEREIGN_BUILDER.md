# SynthAI Sovereign Builder

This branch is a working copy. The original `main` branch is not mutated by the builder.

## Non-negotiable laws
1. SynthAI is the sovereign federated application. The builder is external construction machinery.
2. Origin artifacts are evidence only. Never edit or delete an origin.
3. Every mutable artifact is a copy with a provenance record and content hash.
4. No placeholder may satisfy a requirement.
5. Completion states are VERIFIED, BLOCKED with evidence, or UNRESOLVED.
6. Automated success transitions to PRESENT_FOR_REVIEW. Human acceptance is the final gate.
7. Successful execution patterns are retained in DNA so repeated work can reuse verified paths.
8. Federation must not be replaced by a central controller.
9. A self-hosted backend, when present, belongs to the sovereign app.

## Loop
INGEST -> DISCOVER -> REDUCE -> ADDRESS -> BUILD -> EXECUTE -> VERIFY -> REPAIR -> REMEMBER -> PRESENT_FOR_REVIEW

## Source intake
Authorized sources may include GitHub, Google Drive, Supabase, ChatGPT Library, and supplied files. Connector access remains outside this repository; retrieved artifacts must be copied into an intake workspace before this controller is allowed to mutate them.

## Run
`node tools/sovereign-builder.mjs ingest <copied-source-path> <label>`
`node tools/sovereign-builder.mjs build`
`node tools/sovereign-builder.mjs status`

The ledger is append-only at `.synthai-builder/provenance.jsonl`. Learned successful and failed execution patterns are recorded at `.synthai-builder/dna.json`.
