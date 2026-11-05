"""Executable Klein context for the *real* PyTorch TRIDENT model.

Eight bounded operations produce inspectable, deterministic structure and a
numeric tensor the model can learn from. DISEMINER and AUTOLING invoke the
existing AION classes; the other six use concrete local analyses instead of
the legacy canned "generated/analyzed" strings. They are explicitly limited
operators, not proof of semantic truth or independent agency.
"""
from __future__ import annotations

import ast
import hashlib
import json
import re
from collections import Counter
from typing import Any

from aion.KleinTools import (AUTOLING, DISEMINER, AUTOCODER, MORPH,
                             DISCRIMINATOR, ROUTER, GENERATOR, STORYTELLER, Dimension)

TOOL_ORDER = (
    "DISEMINER", "AUTOLING", "AUTOCODER", "MORPH",
    "DISCRIMINATOR", "ROUTER", "GENERATOR", "STORYTELLER",
)
FEATURE_SIZE = 32
MAX_TEXT = 4096
MAX_TOKENS = 128
WORD_RE = re.compile(r"[^\W_]+(?:['’-][^\W_]+)*", re.UNICODE)
PUNCT_RE = re.compile(r"[.!?]+")
CODE_RE = re.compile(r"\b(def |class |import |from |function |const |let |var |return |async )|[{};]")

def _tokens(text: str) -> list[str]:
    return WORD_RE.findall(text.lower())[:MAX_TOKENS]

def _stable_digest(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()

def _meaningful(text: str, dimension: str) -> list[dict[str, Any]]:
    words = _tokens(text)
    clauses = [c.strip() for c in re.split(r"(?<=[.!?;])\s+|\n+", text) if c.strip()][:16]
    counts = Counter(words)
    runs = [(a, b) for a, b in zip(words, words[1:])]

    # Invoke all eight versioned AION Klein components. Six original modes
    # currently report fixed metadata; real input-dependent structures for
    # those are computed below instead of trusting canned "generated" claims.
    sources = (
        (DISEMINER, Dimension.EVOLUTION), (AUTOLING, Dimension.EVOLUTION),
        (AUTOCODER, Dimension.DESIGN), (MORPH, Dimension.MOVEMENT),
        (DISCRIMINATOR, Dimension.DESIGN), (ROUTER, Dimension.MOVEMENT),
        (GENERATOR, Dimension.DESIGN), (STORYTELLER, Dimension.BEING),
    )
    invoked = {}
    for cls, selected_dimension in sources:
        original = cls()
        original.arise(selected_dimension)
        result = original.operate(text)
        if not isinstance(result, dict):
            raise TypeError(f"Native {original.name} returned no structured output")
        invoked[original.name] = {"mode": original.get_mode_name(), "result": result}
    parts = invoked["DISEMINER"]["result"]["parts"]
    syntax = invoked["AUTOLING"]["result"]

    # Parse only; never evaluate, import or run untrusted code.
    code_like = bool(CODE_RE.search(text))
    code = {"applicable": code_like, "syntax": "not-a-python-code-candidate",
            "functions": [], "classes": [], "imports": [], "assignments": 0}
    if code_like:
        try:
            parsed = ast.parse(text)
            code.update({
                "syntax": "valid-python",
                "functions": [n.name for n in ast.walk(parsed)
                              if isinstance(n, (ast.FunctionDef, ast.AsyncFunctionDef))][:16],
                "classes": [n.name for n in ast.walk(parsed) if isinstance(n, ast.ClassDef)][:16],
                "imports": [n.module or "" for n in ast.walk(parsed)
                            if isinstance(n, ast.ImportFrom)][:16],
                "assignments": sum(isinstance(n, (ast.Assign, ast.AnnAssign))
                                   for n in ast.walk(parsed)),
            })
        except SyntaxError:
            code["syntax"] = "not-valid-python"

    endings = {suffix: sum(w.endswith(suffix) and len(w) > len(suffix) + 2
                           for w in words) for suffix in ("ing", "ed", "s", "ly")}
    score_terms = {
        "code": sum(w in {"code", "python", "function", "class", "variable", "build",
                          "script", "import", "bug"} for w in words) + int(code_like),
        "math": sum(w in {"sum", "integral", "derivative", "equation", "matrix",
                          "calculate", "plus", "number", "fraction"} for w in words)
                + sum(ch in "+=×÷∫" for ch in text),
        "research": sum(w in {"why", "study", "evidence", "research", "source",
                             "model", "hypothesis", "explain", "meaning"} for w in words),
    }
    leading = max(score_terms, key=lambda k: (score_terms[k], -list(score_terms).index(k)))
    if not any(score_terms.values()):
        leading = "undetermined"
    bracket_errors = sum(text.count(l) != text.count(r)
                         for l, r in (("(", ")"), ("[", "]"), ("{", "}")))
    doubled = [w for a, w in zip(words, words[1:]) if a == w][:8]
    # "Quality" is structural diagnostics only, not a fact or answer check.
    diagnostics = {"balanced_brackets": bracket_errors == 0,
                   "repeated_adjacent_tokens": doubled,
                   "control_characters": sum(ord(ch) < 32 and ch not in "\t\n\r" for ch in text)}

    # None of these tools claims observed clauses are verified propositions.
    observations = [
        {"name": "DISEMINER", "dimension": "evolution", "implementation": "aion-original+bounded-lexical",
         "data": {"parts": parts[:MAX_TOKENS], "part_count": len(parts),
                  "adjacent_pairs": [[a, b] for a, b in runs[:20]],
                  "epistemic": "speaker-language-not-verified-fact"}},
        {"name": "AUTOLING", "dimension": "evolution", "implementation": "aion-original+bounded-grammar",
         "data": {"word_count": syntax["word_count"], "sentence_count": len(clauses),
                  "endings": endings, "clauses": clauses[:8],
                  "vocabulary_size": len(counts)}},
        {"name": "AUTOCODER", "dimension": "design", "implementation": "syntax-inspection-only",
         "data": code},
        {"name": "MORPH", "dimension": "movement", "implementation": "reversible-case-and-affix-analysis",
         "data": {"casefolded": text.casefold()[:256], "case_changed": text != text.casefold(),
                  "suffix_counts": endings, "original_sha256": _stable_digest(text)}},
        {"name": "DISCRIMINATOR", "dimension": "design", "implementation": "structural-diagnostics",
         "data": diagnostics},
        {"name": "ROUTER", "dimension": "movement", "implementation": "explicit-domain-evidence",
         "data": {"domain_scores": score_terms, "proposed_domain": leading,
                  "permission_to_execute": False}},
        {"name": "GENERATOR", "dimension": "design", "implementation": "observed-fragment-composition",
         "data": {"observed_bigrams": [" ".join(pair) for pair in runs[:16]],
                  "novel_facts_created": False}},
        {"name": "STORYTELLER", "dimension": "being", "implementation": "ordered-clause-relations",
         "data": {"ordered_clauses": clauses[:8],
                  "sequence_links": [[i, i+1] for i in range(min(len(clauses)-1, 7))],
                  "epistemic": "utterance-order-only"}},
    ]
    for item in observations:
        item["legacy_mode_executed"] = invoked[item["name"]]["mode"]
        item["native_component_invoked"] = True
    return observations

def observe(text: str, dimension: str = "evolution") -> dict[str, Any]:
    if not isinstance(text, str) or not text.strip() or len(text) > MAX_TEXT:
        raise ValueError("Klein input must be nonempty text of at most 4096 characters")
    if dimension not in {d.value for d in Dimension}:
        raise ValueError("Unknown dimension")
    result = _meaningful(text, dimension)
    return {"input_sha256": _stable_digest(text), "dimension": dimension,
            "claim_status": "unverified-utterance",
            "tools": result, "features": _vectorize(result, dimension)}

def _vectorize(items: list[dict], dimension: str) -> list[list[float]]:
    features = []
    for i, item in enumerate(items):
        data = item["data"]
        row = [0.0] * FEATURE_SIZE
        row[i] = 1.0
        row[8 + list(d.value for d in Dimension).index(dimension)] = 1.0
        canonical = json.dumps(data, sort_keys=True, ensure_ascii=False)
        lexical = _tokens(canonical)
        row[13] = min(len(canonical) / 1024, 1.0)
        row[14] = min(len(lexical) / 128, 1.0)
        row[15] = min(len(set(lexical)) / 128, 1.0)
        row[16] = float(bool(data.get("applicable", True)))
        row[17] = min(canonical.count(":") / 40, 1.0)
        row[18] = min(canonical.count('"') / 100, 1.0)
        # Stable lexical features are *coordinates*, not semantic identities.
        for word in lexical:
            digest = int.from_bytes(hashlib.blake2b(word.encode(), digest_size=4).digest(), "big")
            row[19 + digest % 13] += 1
        total = sum(row[19:]) or 1
        row[19:] = [n / total for n in row[19:]]
        features.append(row)
    return features

def batch_observe(texts: list[str], dimension: str = "evolution"):
    """Return torch.float32 [batch,8,32] plus complete tool provenance."""
    import torch
    readings = [observe(text, dimension) for text in texts]
    return torch.tensor([r["features"] for r in readings], dtype=torch.float32), readings
