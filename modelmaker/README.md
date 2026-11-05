# Synthai2 Model Maker: targeted upgrades, not a full repo import

**Scope corrected:** This branch imports ONLY the necessary pieces from
[FareedKhan-dev/train-llm-from-scratch](https://github.com/FareedKhan-dev/train-llm-from-scratch)
(MIT license; upstream SHA `bdd480a518094ca834e05ab32131dc126b522d3d`).
The original full 288-file vendoring was removed from this review branch.

## Selected upstream capabilities
- Modern configurable Transformer components in `advanced/src/models/modern/`:
  grouped-query / latent attention, RoPE, RMSNorm, SwiGLU, optional MoE and KV-cache.
- Low-rank model adaptation in `advanced/src/models/lora.py`.
- Checkpoint safety/restore utilities in `advanced/src/checkpoint.py`.
- Sampling and generation utilities in `advanced/src/inference/sampling.py`.
- Original upstream MIT license is included at `advanced/LICENSE`.

These are optional additions: no model is replaced and no training algorithm or
Human Design correspondence has been decided.

The Synthai2 `synthia-server/model.py` and `synthia-server/train.py` stay
untouched; the existing Model Maker and Android interface are unchanged.
This branch does **not yet** integrate the upgrades into existing UI/backend routes.
The experimental evidence-first `klein_registry.py` remains separate and does
not claim to implement Sheldon Klein's methods.

## Run functional smoke tests
```sh
python -m pip install torch jaxtyping
python -m unittest discover -s modelmaker -p test_advanced.py -v
python -m unittest discover -s modelmaker -p test_klein_registry.py -v
```

## Before merge
- Verify source module/training compatibility and actual performance against
  the existing Model Maker instead of claiming superiority.
- Integrate only missing or demonstrably stronger functionality into existing
  model creation/training entry points; no duplicate replacement screen.
- Evaluate mobile/Termux device requirements and training costs explicitly.
- Finish original Klein and state-space tools before mapping them into learning.
