"""Functional smoke tests for the curated components; no false-green assertions."""
import os
import sys
import tempfile
import unittest
from pathlib import Path

import torch

sys.path.insert(0, str(Path(__file__).resolve().parent / "advanced"))
from src.models.modern import ModernConfig, ModernTransformer
from src.models.lora import apply_lora, merge_lora
from src.checkpoint import atomic_save, load_checkpoint, load_model_weights, model_state_from_checkpoint


class AdvancedModelSmoke(unittest.TestCase):
    def setUp(self):
        torch.manual_seed(77)
        self.cfg = ModernConfig(
            vocab_size=256, context_length=16, n_embed=32, n_head=4,
            n_kv_head=2, n_blocks=1, dropout=0.0
        )

    def test_modern_model_forward_and_real_optimizer_step(self):
        model = ModernTransformer(self.cfg)
        x = torch.randint(0, 256, (2, 8))
        y = torch.randint(0, 256, (2, 8))
        optimizer = torch.optim.AdamW(model.parameters(), lr=1e-3)
        before = model.token_embed.weight.detach().clone()
        logits, loss = model(x, y)
        self.assertEqual(tuple(logits.shape), (2, 8, 256))
        self.assertIsNotNone(loss)
        self.assertTrue(torch.isfinite(loss).item())
        loss.backward()
        optimizer.step()
        self.assertFalse(torch.equal(before, model.token_embed.weight.detach()))

    def test_generate_actual_tokens(self):
        model = ModernTransformer(self.cfg).eval()
        result = model.generate(torch.tensor([[1, 2, 3]]), max_new_tokens=3, top_k=8, use_cache=False)
        self.assertEqual(tuple(result.shape), (1, 6))
        self.assertTrue(result.min().item() >= 0 and result.max().item() < 256)

    def test_lora_freeze_train_and_merge(self):
        model = ModernTransformer(self.cfg)
        names = apply_lora(model, rank=2)
        self.assertTrue(len(names) > 0)
        self.assertTrue(any(p.requires_grad for p in model.parameters()))
        self.assertTrue(any(not p.requires_grad for p in model.parameters()))
        sample = torch.tensor([[1, 2, 3]])
        before = model(sample)[0].detach().clone()
        optimizer = torch.optim.AdamW([p for p in model.parameters() if p.requires_grad], lr=1e-3)
        _, loss = model(sample, torch.tensor([[2, 3, 4]]))
        loss.backward()
        optimizer.step()
        trained = model(sample)[0].detach().clone()
        self.assertFalse(torch.equal(before, trained))
        merge_lora(model)
        merged = model(sample)[0]
        self.assertTrue(torch.allclose(trained, merged, atol=1e-4))

    def test_checkpoint_roundtrip(self):
        original = ModernTransformer(self.cfg)
        with tempfile.TemporaryDirectory() as temp:
            path = os.path.join(temp, "model.pt")
            atomic_save({"model_state_dict": original.state_dict(), "cfg": self.cfg.to_dict()}, path)
            artifact = load_checkpoint(path, map_location="cpu")
            restored = ModernTransformer(self.cfg)
            load_model_weights(restored, model_state_from_checkpoint(artifact))
            for key, value in original.state_dict().items():
                self.assertTrue(torch.equal(value, restored.state_dict()[key]), key)

    def test_configuration_rejects_invalid_attention_dimensions(self):
        with self.assertRaises(ValueError):
            ModernConfig(vocab_size=256, context_length=16, n_embed=30, n_head=8, n_blocks=1)


if __name__ == "__main__":
    unittest.main()
