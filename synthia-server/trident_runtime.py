"""Persistent, owner-trainable TRIDENT/Klein runtime.

Unlike the older server route, this module performs REAL PyTorch gradient steps.
No imitation losses, seeded fake replies, remote LLM fallback or automatic
promotion of conversation text to training data.
"""
from __future__ import annotations

import hashlib
import json
import os
import threading
import time
from pathlib import Path

import torch
import torch.nn.functional as F

from model import Trident, TridentConfig
from trident_klein import TOOL_ORDER, batch_observe

MAX_PROMPT = 160
MAX_RESPONSE = 160
MAX_GENERATED = 80

def encode_text(text: str) -> list[int]:
    # TRIDENT v1 uses a character-level 4096-token vocabulary.
    return [ord(c) if 0 < ord(c) < 4096 else ord("?") for c in text]

def decode_text(ids: list[int]) -> str:
    return "".join(chr(t) if 32 <= t <= 4095 else ("\n" if t == 10 else "")
                   for t in ids)

def _atomic_json(path: Path, value: dict) -> None:
    tmp = path.with_suffix(".json.tmp")
    tmp.write_text(json.dumps(value, indent=2, ensure_ascii=False), encoding="utf8")
    os.replace(tmp, path)

class TridentKleinRuntime:
    def __init__(self, directory=None):
        self.directory = Path(directory or os.environ.get("SYNTHIA_TRIDENT_DIR")
                              or Path(__file__).resolve().parent / "runtime" / "trident-klein")
        self.directory.mkdir(parents=True, exist_ok=True)
        self.state_path = self.directory / "state.json"
        self.weights_path = self.directory / "trident.pt"
        self.lock = threading.RLock()
        self.model = Trident()
        self.records = []
        self.steps = 0
        self.train_epochs = 0
        self.loss = None
        self.ready = False
        if self.state_path.exists():
            state = json.loads(self.state_path.read_text(encoding="utf8"))
            self.records = state.get("records", [])
            self.steps = state.get("steps", 0)
            self.train_epochs = state.get("epochs", 0)
            self.loss = state.get("loss")
            if self.records and not self.weights_path.exists():
                raise RuntimeError("Training ledger exists but real model checkpoint is missing")
        if self.weights_path.exists():
            checkpoint = torch.load(self.weights_path, map_location="cpu", weights_only=True)
            self.model.load_state_dict(checkpoint["model"], strict=True)
            self.ready = self.steps > 0
        self.model.eval()

    def status(self) -> dict:
        with self.lock:
            return {
                "engine": "pytorch-trident-klein", "type": "3-head-char-transformer",
                "param_count": self.model.param_count(),
                "trained_epochs": self.train_epochs,
                "gradient_steps": self.steps, "best_loss": self.loss,
                "weights_saved": self.weights_path.exists() and self.ready,
                "trained": self.ready,
                "training_records": len(self.records),
                "heads": list(self.model.cfg.heads),
                "klein_tools": list(TOOL_ORDER),
                "epistemic": "tool-analysis-not-verified-facts",
                "learning": "owner-approved-supervised-backprop-only",
                "language_capability": "small-character-model-experimental",
            }

    def train(self, examples: list[dict], *, epochs: int = 1, lr: float = 0.0003) -> dict:
        if not isinstance(examples, list) or not 1 <= len(examples) <= 8:
            raise ValueError("Provide 1..8 owner-approved prompt/response records")
        if not isinstance(epochs, int) or not 1 <= epochs <= 3:
            raise ValueError("epochs must be 1..3 per request")
        if not isinstance(lr, (float, int)) or not 0 < lr <= 0.003:
            raise ValueError("learning rate must be between 0 and 0.003")
        training = []
        for record in examples:
            if not isinstance(record, dict) or record.get("approved") is not True:
                raise ValueError("Every example requires explicit approved:true")
            prompt, answer, head = (record.get(k) for k in ("prompt", "response", "head"))
            if head not in self.model.cfg.heads:
                raise ValueError("Head must be code, math or research")
            if not isinstance(prompt, str) or not 1 <= len(prompt.strip()) <= MAX_PROMPT:
                raise ValueError("Prompt must be 1..160 characters")
            if not isinstance(answer, str) or not 1 <= len(answer.strip()) <= MAX_RESPONSE:
                raise ValueError("Response must be 1..160 characters")
            context = prompt.strip()
            output = answer.strip()
            ids = encode_text(context + "\n" + output)[:self.model.cfg.max_seq_len]
            context_len = len(encode_text(context + "\n"))
            if context_len >= len(ids) - 1:
                raise ValueError("No response tokens remain after truncation")
            input_ids = torch.tensor([ids[:-1]], dtype=torch.long)
            labels = torch.tensor([ids[1:]], dtype=torch.long)
            labels[:, :context_len - 1] = 0
            features, observations = batch_observe([context])
            training.append((input_ids, labels, features, observations[0], context, output, head))

        with self.lock:
            optimizer = torch.optim.AdamW(self.model.parameters(), lr=float(lr), weight_decay=0.01)
            total_loss, total_steps = 0.0, 0
            self.model.train()
            try:
                for _ in range(epochs):
                    for input_ids, labels, features, _, _, _, head in training:
                        optimizer.zero_grad()
                        logits = self.model(input_ids, head=head, klein=features)
                        loss = F.cross_entropy(logits.reshape(-1, logits.shape[-1]),
                                               labels.reshape(-1), ignore_index=0)
                        if not torch.isfinite(loss):
                            raise RuntimeError("Non-finite training loss")
                        loss.backward()
                        torch.nn.utils.clip_grad_norm_(self.model.parameters(), 1.0)
                        optimizer.step()
                        total_loss += float(loss.detach())
                        total_steps += 1
            finally:
                self.model.eval()
            # Mark completion only after finite gradient steps; keep full model
            # and training-example provenance across Computer restarts.
            if not total_steps:
                raise RuntimeError("No gradient update occurred")
            new_records = list(self.records)
            at = time.time()
            for _, _, _, obs, prompt, answer, head in training:
                new_records.append({
                    "id": len(new_records) + 1, "prompt": prompt, "response": answer,
                    "head": head, "approved": True, "timestamp": at,
                    "klein_input_sha256": obs["input_sha256"],
                    "tool_names": list(TOOL_ORDER), "origin": "authenticated-owner",
                })
            new_steps = self.steps + total_steps
            new_epochs = self.train_epochs + epochs
            avg_loss = total_loss / total_steps
            tmp = self.weights_path.with_suffix(".pt.tmp")
            torch.save({"model": self.model.state_dict()}, tmp)
            os.replace(tmp, self.weights_path)
            _atomic_json(self.state_path, {"version": 1, "records": new_records,
                                          "steps": new_steps, "epochs": new_epochs,
                                          "loss": avg_loss})
            self.records = new_records
            self.steps, self.train_epochs, self.loss = new_steps, new_epochs, avg_loss
            self.ready = True
            return {"trained": True, "gradient_steps": total_steps,
                    "loss": avg_loss, "saved": True,
                    "total_training_records": len(self.records)}

    def generate(self, prompt: str, *, head: str = "auto",
                 max_new: int = 48, temperature: float = 0.8) -> dict:
        if not isinstance(prompt, str) or not 1 <= len(prompt.strip()) <= MAX_PROMPT:
            raise ValueError("Prompt must be 1..160 characters")
        if head not in (*self.model.cfg.heads, "auto", "cynthia", None):
            raise ValueError("Unknown TRIDENT head")
        selected_head = None if head in ("auto", "cynthia", None) else head
        if not isinstance(max_new, int) or not 1 <= max_new <= MAX_GENERATED:
            raise ValueError("max_new must be 1..80")
        if not 0.1 <= temperature <= 2:
            raise ValueError("temperature must be 0.1..2")
        with self.lock:
            if not self.ready:
                raise RuntimeError("TRIDENT has no trained checkpoint; owner training required")
            klein, observations = batch_observe([prompt.strip()])
            ids = torch.tensor([encode_text(prompt.strip())], dtype=torch.long)
            with torch.no_grad():
                _, routed = self.model(ids, klein=klein, return_router=True)
                output = self.model.generate(ids, head=selected_head, klein=klein,
                                             max_new=max_new, temp=temperature)
            completion = decode_text(output[0, ids.shape[1]:].tolist())
            return {"generated": completion, "full": prompt.strip() + completion,
                    "head_used": selected_head or "auto-neural-router",
                    "router_weights": dict(zip(self.model.cfg.heads, routed[0].tolist())),
                    "provider": "local-pytorch-trident-klein",
                    "tokens_generated": output.shape[1] - ids.shape[1],
                    "klein": {"input_sha256": observations[0]["input_sha256"],
                              "claim_status": observations[0]["claim_status"],
                              "executed": [
                                  {"name": t["name"], "implementation": t["implementation"]}
                                  for t in observations[0]["tools"]]},
                    "checkpoint_steps": self.steps,
                    "quality_notice": "Small, sparsely trained character model; text may be incoherent"}

    def recall(self, term: str = "", limit: int = 20) -> dict:
        if not isinstance(term, str) or len(term) > 160:
            raise ValueError("Bounded query required")
        limit = max(1, min(30, int(limit)))
        with self.lock:
            records = [r for r in reversed(self.records)
                       if term.casefold() in (r["prompt"] + " " + r["response"]).casefold()]
            return {"total": len(self.records), "records": records[:limit],
                    "source": "persistent-approved-training-ledger"}
