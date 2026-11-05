"""Evidence-first model component registry for future Klein/state-space integration.

No semantic, Human Design, or model-learning correspondence is inferred.
This indexes *observed* model structure, source-supported relationships,
and optional, explicitly supplied 13-field ontological addresses.
"""
from __future__ import annotations

from dataclasses import dataclass, field, asdict
from pathlib import Path
from typing import Any
import json

ADDRESS_FIELDS = (
    "planetary", "dimension", "gate", "line", "color", "tone", "base",
    "degree", "minute", "second", "arc", "zodiac", "house",
)
SUPPORTED_MODALITIES = ("language", "image", "video", "audio", "multimodal", "other")


def parse_address(raw: str | list[str] | tuple[str, ...]) -> dict[str, str]:
    """Preserve a supplied address, never manufacture a mapping."""
    values = raw.split(".") if isinstance(raw, str) else list(raw)
    if len(values) != len(ADDRESS_FIELDS):
        raise ValueError(f"Expected 13 address fields, got {len(values)}")
    if any(not isinstance(v, str) or not v.strip() for v in values):
        raise ValueError("All 13 address fields must be explicit nonempty strings")
    return dict(zip(ADDRESS_FIELDS, values))


@dataclass
class Component:
    id: str
    kind: str
    modality: str
    source: str
    context: dict[str, Any] = field(default_factory=dict)
    address: dict[str, str] | None = None
    address_source: str | None = None


@dataclass
class Relation:
    source_id: str
    target_id: str
    kind: str
    evidence: str
    provenance: str


class ModelStructureRegistry:
    """Record structure/evidence; do not pretend to train or understand the model."""

    def __init__(self) -> None:
        self.components: dict[str, Component] = {}
        self.relations: list[Relation] = []

    def add_component(self, *, id: str, kind: str, modality: str, source: str,
                      context: dict[str, Any] | None = None) -> Component:
        if not all(isinstance(s, str) and s.strip() for s in (id, kind, modality, source)):
            raise ValueError("Component id, kind, modality and source are required")
        if modality not in SUPPORTED_MODALITIES:
            raise ValueError(f"Unsupported modality: {modality}")
        if id in self.components:
            raise ValueError(f"Component already exists: {id}")
        if context is not None and not isinstance(context, dict):
            raise ValueError("Context must be a dictionary")
        entry = Component(id=id, kind=kind, modality=modality, source=source,
                          context=context or {})
        self.components[id] = entry
        return entry

    def attach_address(self, component_id: str, address: str | list[str] | tuple[str, ...],
                       *, evidence_source: str) -> None:
        if component_id not in self.components:
            raise KeyError(component_id)
        if not evidence_source.strip():
            raise ValueError("Address provenance is required")
        parsed = parse_address(address)
        obj = self.components[component_id]
        if obj.address is not None and obj.address != parsed:
            raise ValueError("Conflicting address; preserve prior mapping and investigate")
        obj.address = parsed
        obj.address_source = evidence_source

    def add_relation(self, source_id: str, target_id: str, kind: str,
                     *, evidence: str, provenance: str) -> Relation:
        if source_id not in self.components or target_id not in self.components:
            raise KeyError("Both relation endpoints must exist")
        if not all(isinstance(v, str) and v.strip() for v in (kind, evidence, provenance)):
            raise ValueError("Relation type, evidence and provenance are required")
        rel = Relation(source_id, target_id, kind, evidence, provenance)
        if rel not in self.relations:
            self.relations.append(rel)
        return rel

    def inspect_module(self, model: Any, *, model_id: str, modality: str,
                       source: str) -> list[str]:
        """Inspect real named modules, e.g. PyTorch. Never guess HD correspondences."""
        if not hasattr(model, "named_modules") or not callable(model.named_modules):
            raise TypeError("Model must expose a callable named_modules method")
        if not model_id.strip():
            raise ValueError("Model id is required")
        paths: list[str] = []
        for name, module in model.named_modules():
            if not name:
                continue
            component_id = model_id + "/" + name
            self.add_component(id=component_id, kind=type(module).__name__,
                modality=modality, source=source, context={"qualified_name": name})
            paths.append(name)
        for name in paths:
            if "." in name:
                parent = name.rsplit(".", 1)[0]
                if parent in paths:
                    self.add_relation(model_id + "/" + parent, model_id + "/" + name,
                        "contains", evidence="Observed named_modules parent-child hierarchy",
                        provenance=source)
        return [model_id + "/" + name for name in paths]

    def coverage(self) -> dict[str, Any]:
        unmapped = [key for key, comp in self.components.items() if comp.address is None]
        return {
            "component_count": len(self.components),
            "relation_count": len(self.relations),
            "addressed_count": len(self.components) - len(unmapped),
            "unmapped_component_ids": unmapped,
            "mapping_complete": len(unmapped) == 0 and bool(self.components),
        }

    def to_dict(self) -> dict[str, Any]:
        return {
            "schema": "synthai2.modelmaker.klein-structure.v1",
            "address_order": list(ADDRESS_FIELDS),
            "components": [asdict(c) for c in self.components.values()],
            "relations": [asdict(r) for r in self.relations],
            "coverage": self.coverage(),
            "learning_policy": "not_defined_by_this_registry",
        }

    def write(self, path: str | Path) -> Path:
        """Export a snapshot; never overwrite an existing project artifact."""
        dest = Path(path)
        dest.parent.mkdir(parents=True, exist_ok=True)
        with dest.open("x", encoding="utf-8") as handle:
            json.dump(self.to_dict(), handle, indent=2, ensure_ascii=False)
            handle.write("\n")
        return dest

    @classmethod
    def from_dict(cls, value: dict[str, Any]) -> ModelStructureRegistry:
        if value.get("schema") != "synthai2.modelmaker.klein-structure.v1":
            raise ValueError("Unsupported model structure schema")
        if value.get("address_order") != list(ADDRESS_FIELDS):
            raise ValueError("Address field order does not match canonical 13 positions")
        registry = cls()
        for item in value.get("components", []):
            comp = registry.add_component(id=item["id"], kind=item["kind"],
                modality=item["modality"], source=item["source"], context=item.get("context"))
            if item.get("address") is not None:
                raw = item["address"]
                if set(raw) != set(ADDRESS_FIELDS):
                    raise ValueError("Address must have exactly the canonical fields")
                registry.attach_address(comp.id, [raw[f] for f in ADDRESS_FIELDS],
                    evidence_source=item.get("address_source") or "")
        for item in value.get("relations", []):
            registry.add_relation(item["source_id"], item["target_id"], item["kind"],
                evidence=item["evidence"], provenance=item["provenance"])
        return registry
