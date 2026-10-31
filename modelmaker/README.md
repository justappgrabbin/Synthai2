# Synthai2 Model Maker — full trainer + Klein structure registry

This review branch is additive to Synthai2. Existing `synthia-server/model.py`,
`synthia-server/train.py`, Android bridge, agents, and Human Design code are untouched.

## Full LLM framework
The pinned MIT-licensed [train-llm-from-scratch](https://github.com/FareedKhan-dev/train-llm-from-scratch)
framework is imported into `modelmaker/upstream/` by the `modelmaker-upstream.yml`
workflow. Its complete source, tests, configs, scripts, docs and non-code assets
are copied with the original LICENSE and attribution. The import is not considered
done until that workflow succeeds and the expected files are present in Git.

- Pinned upstream commit: `bdd480a518094ca834e05ab32131dc126b522d3d`.
- The upstream training framework contains classic and modern Transformers,
  Mixture-of-Experts, LoRA, supervised fine-tuning, PPO, DPO, GRPO, optimizers,
  model checkpoints, generation, tokenization and tests.
- No claim is made that those workflows have passed integrated Synthai2 training
  tests. This branch does not replace any old training entry point.
- Before any production training, evaluate real training data, hardware, privacy,
  licensing, output quality, and regression tests.

## Klein and Human Design integration (tested)
`klein_registry.py` is an evidence-first structure recorder, *not an LLM
trainer* and *not an implementation of Sheldon Klein's original methods*.

It can observe actual Python/PyTorch model components through `named_modules()`,
record model-subcomponent containment, store explicitly evidenced relations,
and attach user-approved thirteen-field addresses **without guessing them**:

`planetary.dimension.gate.line.color.tone.base.degree.minute.second.arc.zodiac.house`

Unmapped components remain explicitly reported. Learning rules are **not**
implemented or decided by the registry. This is intentional: the user's
topological state space, actual Klein tool implementations, and learning policy
must be independently verified before connecting them to training.

This registry can describe language, image, video, audio or multimodal model
components. It does not pretend to *generate video* or supersede existing
video-model tools.

Run the self-contained tests:

```bash
python -m unittest discover -s modelmaker -p 'test_klein_registry.py' -v
```

## Next acceptance gates
1. Confirm full upstream import and license fidelity.
2. Run upstream training, inference and post-training smoke tests with the
   actual pinned dependencies/runtime. Report every skipped/failed case.
3. Compare existing Synthai2 Model Maker and video maker with imported capabilities.
4. Add only improvements and missing capability; keep original routes/data.
5. Integrate the approved state-space learning rules once the state space is fixed.
