# Supplied Klein implementations

Four user-supplied archives were downloaded and inspected:

- `Inspect and Test Architecture for Complete Executable Trace (4).zip`: an inspection bundle containing nested ATO, state-space, and tool-factory archives.
- `klein-mesh-game-engine-v5.1-FIXED.zip`: TypeScript game grammars and mesh contexts. Its patch notes explicitly distinguish hash compression from a trained VQ-VAE and describe the remaining shared-substrate gap.
- `ATO-Core-Klein-Browser-v0.4.0-gate-content-3.zip`: standalone executable Klein algorithms and tests.
- `Synthia-v0.5.1-KLEIN-SITUATION-ROUTER-AUTOLING-PATCH.zip`: an overlay requiring the universal-primitive-bridge full checkpoint; the overlay alone lacks imported dependencies.

The browser ATO archive supplies the six-module dependency closure now included
under `client/src/lib/klein/vendor`. Original source hashes are recorded in
`klein-source-manifest.json`. AUTOLING's tokenizer and grammar validation and
substitution were hardened; other vendored files retain their original content.

Before responding, Synthia now executes AUTOLING explicit-template recognition
and DISEMINER windowed cooccurrence/cosine analysis against current-conversation
user text. These results enter the common reasoning prompt and completed contact
trace. Assistant responses are excluded from the evidence corpus. Conversation
context is limited to thirty messages and four thousand characters per message.
The `/contact-lab` rules lab also runs these algorithms directly on editable text.

Supported template matches are HAS_PROPERTY and PART_OF, taken from the supplied
ATO defaults. They are candidate parses, not facts. Empty matches remain
unresolved. Similarity scores are distributional measurements, not semantic
correctness probabilities or causal claims. No gate or personality is inferred.

This connects two supplied algorithms to chat. Other supplied exports remain
available in the vendor module, but are not automatically invoked or mapped to
the older Python dimensional modes. The Python suite continues to reject its
unfinished operations. The complete NSNF runtime is still outstanding; the full app check and build
now pass locally (see build-verification.md); this is an inspectable rules trial, not proof of cross-scale transfer.

Validation: the supplied Klein and computational grammar test files pass locally;
five integration regressions check actual parses, contextual distributional
evidence, conversation isolation, Unicode, exact-variable generation, and invalid
rules. The thirteen existing Synthia/GitHub integration tests also pass locally.
