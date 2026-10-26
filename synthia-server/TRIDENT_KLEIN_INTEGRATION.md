# TRIDENT and Klein: executable neuro-symbolic integration

This updates the existing PyTorch TRIDENT in SynthAi2. Changes are preserved on a new branch; no original model, donor or checkpoint is deleted.

## Real execution path

1. trident_klein.observe(prompt) now invokes all eight original AION Klein classes: DISEMINER, AUTOLING, AUTOCODER, MORPH, DISCRIMINATOR, ROUTER, GENERATOR and STORYTELLER. Every source class is instantiated, activated in its dimensional mode and operated.
2. The existing AION implementation often returns hardcoded "verified/generated" labels. We do not treat these labels as facts. Functional supplementary adapters instead compute bounded input-dependent lexical relationships, grammatical structure, code syntax, morphology, structural diagnostics, routing evidence, compositional fragments and ordered clauses. They are not claimed as complete replicas of Sheldon Klein's historical tools.
3. A numeric tensor with shape [batch,8 tools,32 features] feeds into a trainable model-side Klein encoder. Its learned output enters TRIDENT's attention and backbone, and is routed through specialist code/math/research heads. Klein observations therefore affect neural logits and training gradients.
4. Real supervised training uses owner-approved prompt/response/head examples, saves checkpoint weights and records provenance, and reloads them after restart. No public chatbot turn is automatically adopted as a fact or training data.

## Replace simulated server behavior

The old server.py model-training route waited and displayed fabricated losses. The new /trident/model/train route performs actual PyTorch optimizer steps, and /trident/model/status exposes real checkpoint state. Generation refuses requests until weights are trained; no fallback pretends to be a locally trained model. /trident/generate defaults to this real implementation; its old Groq and heuristic providers are available only when explicitly requested. Destructive reset is disabled.

## Local owner setup

Configure a secret of at least 32 characters on the trusted server:

    export SYNTHIA_OWNER_TOKEN="$(openssl rand -hex 32)"
    export SYNTHIA_TRIDENT_DIR="$PWD/synthia-server/runtime/trident-klein"

Examples of API calls:
- GET /trident/model/status: actual parameter count, training steps, checkpoint and tool status (no private training samples).
- POST /trident/model/understand with JSON {"text":"Analyze this sentence","dimension":"evolution"}: actual tool results and feature vectors.
- POST /trident/model/train requires X-Synthia-Owner-Token and JSON {"examples":[{"head":"research","prompt":"What is a graph?","response":"A graph has nodes and edges.","approved":true}],"epochs":1}. Limited to 8 examples and 3 epochs per request.
- POST /trident/model/generate with JSON {"prompt":"What is a graph?","head":"auto","max_tokens":40}: local neural decode, with Klein feature provenance.
- GET /trident/model/remember?q=graph requires the owner token: look up saved training examples with provenance.
- POST /trident/model/reset is disabled to preserve previous weights and memory.

## Verify

    cd synthia-server
    python -m pip install torch --index-url https://download.pytorch.org/whl/cpu
    python -m unittest discover -s test -p "test_trident_klein.py" -v

The repository GitHub Action verifies actual tool invocation, changing neural logits, neural gradients through the Klein encoder, persistent trained weights and restart retrieval, and cold-start refusal.

## Limits and safety

This is a small character-level Transformer with differentiable tool conditioning; it is not a pretrained open-domain LLM. Its output may be incoherent without meaningful training data. Symbolic Python operators do not themselves train by gradient descent; the feature encoder learns how to use their observations. Tool output about a statement is not proof of the statement. Training text is locally stored unencrypted by this development runtime, and production deployments need protected encrypted persistence and trusted owner authentication. Physical-device Android behavior has not been verified.
