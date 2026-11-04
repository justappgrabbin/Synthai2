"""Train the EXISTING Synthia TRIDENT weights from verified Synthia2 build sources.

This does real PyTorch gradient updates. It does not fine-tune the Ollama code
model, and does not establish that TRIDENT can independently build software.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path

import torch
import torch.nn as nn
from torch.optim import AdamW
from model import Trident, TridentConfig


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dataset", required=True)
    parser.add_argument("--checkpoint", required=True)
    parser.add_argument("--epochs", type=int, default=1)
    args = parser.parse_args()
    if not 1 <= args.epochs <= 3:
        parser.error("Epochs must be between 1 and 3")

    dataset_path = Path(args.dataset).resolve()
    checkpoint = Path(args.checkpoint).resolve()
    payload = dataset_path.read_bytes()
    data = json.loads(payload)
    examples = data.get("examples")
    if not isinstance(examples, list) or not 1 <= len(examples) <= 64:
        parser.error("Dataset needs 1–64 verified examples")
    snippets = [
        item["text"] for item in examples
        if isinstance(item, dict)
        and item.get("head") == "code"
        and isinstance(item.get("text"), str)
        and len(item["text"]) >= 8
    ]
    if not snippets:
        parser.error("No verified code examples")
    torch.manual_seed(71)
    torch.set_num_threads(2)
    cfg = TridentConfig()
    model = Trident(cfg)
    resumed = checkpoint.exists()
    if resumed:
        state = torch.load(checkpoint, map_location="cpu", weights_only=True)
        model.load_state_dict(state, strict=True)
    opt = AdamW(model.parameters(), lr=1e-4, weight_decay=1e-2)
    criterion = nn.CrossEntropyLoss(ignore_index=0)
    losses = []
    model.train()

    for epoch in range(args.epochs):
        for snippet in snippets[:16]:
            # Match the existing TRIDENT character vocabulary. Split long source
            # into slices so training is based on actual code, not fabricated toys.
            for start in range(0, min(len(snippet), 768), 64):
                chunk = snippet[start:start + 64]
                if len(chunk) < 8:
                    continue
                tokens = [ord(c) % cfg.vocab_size for c in chunk]
                inputs = torch.tensor([tokens[:-1]], dtype=torch.long)
                targets = torch.tensor([tokens[1:]], dtype=torch.long)
                opt.zero_grad(set_to_none=True)
                logits = model(inputs, head="code")
                loss = criterion(logits.reshape(-1, cfg.vocab_size), targets.reshape(-1))
                loss.backward()
                nn.utils.clip_grad_norm_(model.parameters(), 1.0)
                opt.step()
                losses.append(float(loss.detach()))
    if not losses:
        parser.error("Not enough tokens to train")
    checkpoint.parent.mkdir(parents=True, exist_ok=True)
    temporary = checkpoint.with_suffix(".tmp")
    torch.save(model.state_dict(), temporary)
    os.replace(temporary, checkpoint)
    receipt = {
        "model": "TRIDENT (code head)",
        "actual_gradient_steps": len(losses),
        "examples": len(snippets),
        "resumed_prior_weights": resumed,
        "avg_training_loss": sum(losses) / len(losses),
        "dataset_sha256": hashlib.sha256(payload).hexdigest(),
        "checkpoint": str(checkpoint),
        "disclaimer": "This does not train Ollama or prove general coding competence."
    }
    print(json.dumps(receipt))


if __name__ == "__main__":
    main()
