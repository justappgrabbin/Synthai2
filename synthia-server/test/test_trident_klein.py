"""Acceptance tests: Klein execution changes real TRIDENT tensors and survives restart."""
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import torch

from aion.KleinTools import AUTOLING, DISEMINER
from model import Trident
from train import make_batch
from trident_klein import TOOL_ORDER, batch_observe, observe
from trident_runtime import TridentKleinRuntime


class TridentKleinTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        torch.set_num_threads(2)
        torch.manual_seed(31)

    def test_legacy_engines_actually_execute_and_eight_tools_have_evidence(self):
        original = AUTOLING.operate
        with patch.object(AUTOLING, "operate", autospec=True,
                          side_effect=lambda tool, text: original(tool, text)) as intercepted:
            obs = observe("A model reads language, and words have relationships.")
            self.assertGreaterEqual(intercepted.call_count, 1)
        original = DISEMINER.operate
        with patch.object(DISEMINER, "operate", autospec=True,
                          side_effect=lambda tool, text: original(tool, text)) as intercepted:
            observe("A model reads language.")
            self.assertGreaterEqual(intercepted.call_count, 1)
        self.assertEqual([x["name"] for x in obs["tools"]], list(TOOL_ORDER))
        self.assertEqual(obs["claim_status"], "unverified-utterance")
        self.assertEqual((len(obs["features"]), len(obs["features"][0])), (8, 32))
        other = observe("def square(x):\n    return x * x")
        self.assertNotEqual(obs["features"], other["features"])
        self.assertTrue(other["tools"][2]["data"]["functions"])
        self.assertEqual(other["tools"][5]["data"]["permission_to_execute"], False)
        self.assertEqual(obs["features"], observe("A model reads language, and words have relationships.")["features"])

    def test_klein_context_changes_logits_and_receives_gradients(self):
        model = Trident()
        model.eval()
        ids = torch.tensor([[84, 101, 115, 116]], dtype=torch.long)
        a, _ = batch_observe(["Model meaning and language learning"])
        b, _ = batch_observe(["def foo(): return 3"])
        with torch.no_grad():
            baseline = model(ids, head="research")
            first = model(ids, head="research", klein=a)
            second = model(ids, head="research", klein=b)
        self.assertFalse(torch.allclose(baseline, first))
        self.assertFalse(torch.allclose(first, second))
        self.assertEqual(first.shape, (1, 4, 4096))
        model.train()
        loss = model(ids, head="research", klein=a).mean()
        loss.backward()
        self.assertIsNotNone(model.klein_encoder[0].weight.grad)
        self.assertGreater(model.klein_encoder[0].weight.grad.abs().sum().item(), 0.0)
        with self.assertRaises(ValueError):
            model(ids, klein=torch.zeros(1, 7, 32))

    def test_real_owner_training_checkpoint_reload_and_record_memory(self):
        with tempfile.TemporaryDirectory() as folder:
            before = TridentKleinRuntime(directory=folder)
            self.assertEqual(before.status()["gradient_steps"], 0)
            self.assertFalse(before.status()["weights_saved"])
            with self.assertRaises(RuntimeError):
                before.generate("How do models learn?", max_new=2)
            weights = before.model.klein_encoder[0].weight.detach().clone()
            with self.assertRaises(ValueError):
                before.train([{"approved": False, "head": "research",
                              "prompt": "Hi", "response": "Hello"}])
            result = before.train([{"approved": True, "head": "research",
                                    "prompt": "What is a neural model?",
                                    "response": "A model learns numerical parameters."}],
                                  epochs=1)
            self.assertTrue(result["trained"])
            self.assertEqual(result["gradient_steps"], 1)
            self.assertNotEqual(weights.tolist(),
                                before.model.klein_encoder[0].weight.detach().tolist())
            self.assertTrue(Path(folder, "trident.pt").exists())
            self.assertTrue(Path(folder, "state.json").exists())
            after = TridentKleinRuntime(directory=folder)
            self.assertEqual(after.status()["gradient_steps"], 1)
            self.assertEqual(len(after.recall("neural")["records"]), 1)
            self.assertTrue(torch.equal(before.model.klein_encoder[0].weight,
                                        after.model.klein_encoder[0].weight))
            generated = after.generate("What is a neural model?", head="research", max_new=2)
            self.assertEqual(generated["provider"], "local-pytorch-trident-klein")
            self.assertEqual(len(generated["klein"]["executed"]), 8)

    def test_existing_train_batches_supply_8_klein_vectors(self):
        x, y, klein = make_batch("math", batch_size=2)
        self.assertEqual(x.shape, y.shape)
        self.assertEqual(klein.shape, (2, 8, 32))


if __name__ == "__main__":
    unittest.main()
