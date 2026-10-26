# TRIDENT semantic reasoning — incremental extension

This branch extends the existing October 25 TRIDENT/Klein integration, preserving the original model, its eight-tool tensor contract, specialist heads, training records and checkpoint format.

## Implemented in this branch
- `semantic_evidence.analyze_semantics(text, address=None)` extracts bounded lexical, question, negation, uncertainty, time and relation evidence.
- An optional symbolic address accepts explicit gate, line, color, tone, base, house, degree, minute, second, zodiac, axis and center values. Numeric ranges are checked; the system does not invent an address, infer a birth chart, or silently assert an I Ching mapping.
- `trident_klein.observe` now returns `semantic_evidence` alongside its original eight tool observations and unchanged `[8,32]` features.
- Regression tests cover uncertainty, symbolic validation, and preservation of the existing tensor shape.

## Not yet implemented
This does **not** make TRIDENT a capable conversational or coding language model by itself. The existing model is a small character-level Transformer and the checked-in training script uses toy examples. The new semantic evidence is inspectable output; it is not yet additional learned conditioning in the neural model.

Next milestones should reuse the existing train/generate/runtime pathways: (1) approved and licensed source ingestion with provenance, including Human Design/I Ching references and space/time address mappings; (2) linguistic role and relation analysis beyond word-level heuristics, including uncertainty and speaker perspective; (3) owner-approved chat and code instruction datasets with evaluation held out from training; (4) explicit semantic conditioning or retrieval via the existing RAG/Klein pathway; (5) grounded tests for dialogue, code generation, meaning contrasts, and safe treatment of symbolic interpretations.

Avoid treating birth data as a scientifically validated measure of personality or counseling needs. Personal information and training examples require consent, access controls, and encryption before production.

## Tests
From `synthia-server`:

```bash
python -m unittest discover -s test -p "test_semantic_evidence.py" -v
python -m unittest discover -s test -p "test_trident_klein.py" -v
```

These tests have been added but have not been executed by the assistant. The original PyTorch tests require `torch`.
