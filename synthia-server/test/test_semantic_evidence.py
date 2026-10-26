"""Regression tests for semantic evidence alongside the original Klein model."""
import unittest
from semantic_evidence import analyze_semantics
from trident_klein import observe

class SemanticEvidenceTests(unittest.TestCase):
    def test_claims_and_negation_are_not_treated_as_facts(self):
        data = analyze_semantics("Maybe she does not know why it happened yesterday.")
        self.assertIn("maybe", data["markers"]["uncertainty"])
        self.assertIn("not", data["markers"]["negation"])
        self.assertIn("why", data["markers"]["question"])
        self.assertFalse(data["speaker_claims_verified"])
        self.assertIsNone(data["inferred_personality"])

    def test_symbolic_address_is_preserved_not_invented(self):
        address = {"gate": 1, "line": 3, "color": 2, "tone": 4, "base": 5, "house": 12}
        result = analyze_semantics("I am learning.", address=address)
        self.assertEqual(result["symbolic"]["address"], address)
        self.assertEqual(result["symbolic"]["interpretation"],
                         "unresolved-without-authoritative-mapping")
        with self.assertRaises(ValueError):
            analyze_semantics("x", address={"gate": 65})
        with self.assertRaises(ValueError):
            analyze_semantics("x", address={"mystery": 2})

    def test_original_klein_feature_contract_unchanged(self):
        obs = observe("What does this sentence mean?")
        self.assertEqual(len(obs["tools"]), 8)
        self.assertEqual([len(row) for row in obs["features"]], [32] * 8)
        self.assertIn("semantic_evidence", obs)
        self.assertIn("what", obs["semantic_evidence"]["markers"]["question"])

if __name__ == "__main__":
    unittest.main()
