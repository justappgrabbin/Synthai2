"""Bounded, inspectable semantic evidence for the existing TRIDENT/Klein path.

This is linguistic analysis, not a personality diagnosis or factual verifier.
Human Design and I Ching values are treated as user-supplied symbolic addresses.
No birth chart or gate interpretation is inferred without a verified mapping.
"""
from __future__ import annotations

import re
from typing import Any

WORD = re.compile(r"[^\W_]+(?:['’-][^\W_]+)*", re.UNICODE)
NEGATIONS = {"not", "never", "no", "neither", "cannot", "can't", "won't", "don't", "isn't"}
UNCERTAIN = {"maybe", "perhaps", "possibly", "might", "could", "seems", "apparently"}
QUESTIONS = {"who", "what", "when", "where", "why", "how"}
TEMPORAL = {"yesterday", "today", "tomorrow", "before", "after", "during", "now", "later"}
RELATIONS = {"is", "are", "was", "were", "has", "have", "had", "does", "do",
             "makes", "made", "causes", "caused", "means", "relates", "becomes"}
ADDRESS_FIELDS = ("gate", "line", "color", "tone", "base", "degree", "minute",
                  "second", "house", "zodiac", "axis", "center")

def analyze_semantics(text: str, *, address: dict[str, Any] | None = None) -> dict[str, Any]:
    """Extract evidence from an utterance without claiming human understanding."""
    if not isinstance(text, str) or not text.strip() or len(text) > 4096:
        raise ValueError("Semantic text must be 1..4096 characters")
    words = WORD.findall(text.casefold())[:128]
    clauses = [c.strip() for c in re.split(r"(?<=[.!?])\s+|\n+", text)
               if c.strip()][:16]
    markers = {
        "negation": [w for w in words if w in NEGATIONS],
        "uncertainty": [w for w in words if w in UNCERTAIN],
        "temporal": [w for w in words if w in TEMPORAL],
        "question": [w for w in words if w in QUESTIONS],
    }
    # Simple relation evidence; no guessed subject, motive or truth value.
    relations = [{"word": w, "position": i} for i, w in enumerate(words) if w in RELATIONS][:24]
    symbolic = None
    if address is not None:
        if not isinstance(address, dict):
            raise ValueError("Symbolic address must be a mapping")
        unknown = set(address) - set(ADDRESS_FIELDS)
        if unknown:
            raise ValueError("Unknown symbolic address fields: " + ", ".join(sorted(unknown)))
        ranges = {"gate": (1, 64), "line": (1, 6), "color": (1, 6),
                  "tone": (1, 6), "base": (1, 5), "house": (1, 12),
                  "degree": (0, 359), "minute": (0, 59), "second": (0, 59)}
        for key, (low, high) in ranges.items():
            if key in address:
                val = address[key]
                if isinstance(val, bool) or not isinstance(val, int) or not low <= val <= high:
                    raise ValueError(f"{key} must be an integer in {low}..{high}")
        symbolic = {
            "address": dict(address),
            "interpretation": "unresolved-without-authoritative-mapping",
            "framework": "user-supplied-Human-Design-I-Ching-spacetime",
            "evidence_status": "symbolic-not-empirical-personality-inference",
        }
    return {
        "clauses": clauses,
        "tokens": words,
        "markers": markers,
        "relations": relations,
        "speaker_claims_verified": False,
        "inferred_personality": None,
        "symbolic": symbolic,
        "analysis_type": "bounded-linguistic-evidence",
    }
