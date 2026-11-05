import json
import tempfile
import unittest
from pathlib import Path
from klein_registry import ADDRESS_FIELDS, ModelStructureRegistry, parse_address


class TestKleinRegistry(unittest.TestCase):
    def setUp(self):
        self.reg = ModelStructureRegistry()
        self.reg.add_component(id="backbone.attn.0", kind="attention", modality="language",
                               source="src/models/modern/attention.py")
        self.reg.add_component(id="video.temporal.0", kind="temporal_layer", modality="video",
                               source="user/video-model/temporal.py")

    def test_explicit_unmapped_is_reported(self):
        x = self.reg.coverage()
        self.assertEqual(x["unmapped_component_ids"], ["backbone.attn.0", "video.temporal.0"])
        self.assertFalse(x["mapping_complete"])

    def test_address_is_exactly_thirteen_fields(self):
        addr = ["value" + str(i) for i in range(13)]
        self.reg.attach_address("backbone.attn.0", addr, evidence_source="approved user mapping")
        self.assertEqual(list(self.reg.components["backbone.attn.0"].address), list(ADDRESS_FIELDS))
        self.assertEqual(self.reg.coverage()["addressed_count"], 1)
        with self.assertRaises(ValueError):
            parse_address(["x"] * 12)
        with self.assertRaises(ValueError):
            parse_address(["x"] * 14)

    def test_conflict_does_not_replace_mapping(self):
        self.reg.attach_address("backbone.attn.0", ["A"] * 13, evidence_source="source A")
        with self.assertRaises(ValueError):
            self.reg.attach_address("backbone.attn.0", ["B"] * 13, evidence_source="source B")
        self.assertEqual(self.reg.components["backbone.attn.0"].address["gate"], "A")

    def test_relations_require_real_provenance_and_endpoints(self):
        with self.assertRaises(ValueError):
            self.reg.add_relation("backbone.attn.0", "video.temporal.0", "similar",
                                  evidence="", provenance="example")
        with self.assertRaises(KeyError):
            self.reg.add_relation("backbone.attn.0", "missing", "depends_on",
                                  evidence="import reference", provenance="file.py:12")
        self.reg.add_relation("backbone.attn.0", "video.temporal.0", "compares_with",
                              evidence="user proposed cross-modal comparison", provenance="user input")
        self.assertEqual(self.reg.coverage()["relation_count"], 1)

    def test_export_roundtrip_and_no_overwrite(self):
        self.reg.add_relation("backbone.attn.0", "video.temporal.0", "related",
                              evidence="explicit", provenance="test")
        with tempfile.TemporaryDirectory() as d:
            p = Path(d) / "structure.json"
            self.reg.write(p)
            restored = ModelStructureRegistry.from_dict(json.loads(p.read_text()))
            self.assertEqual(restored.to_dict(), self.reg.to_dict())
            with self.assertRaises(FileExistsError):
                self.reg.write(p)

    def test_module_introspection_records_real_structure(self):
        class Backbone:
            pass
        class Attention:
            pass
        class FakeModel:
            def named_modules(self):
                yield "", self
                yield "backbone", Backbone()
                yield "backbone.attention", Attention()
        reg = ModelStructureRegistry()
        ids = reg.inspect_module(FakeModel(), model_id="my-llm", modality="language", source="observed test model")
        self.assertEqual(ids, ["my-llm/backbone", "my-llm/backbone.attention"])
        self.assertEqual(reg.coverage()["relation_count"], 1)
        self.assertEqual(reg.coverage()["addressed_count"], 0)

    def test_no_learning_claims_or_auto_assigned_hd(self):
        record = self.reg.to_dict()
        self.assertEqual(record["learning_policy"], "not_defined_by_this_registry")
        self.assertTrue(all(c["address"] is None for c in record["components"]))


if __name__ == "__main__":
    unittest.main()
