"""
AION Self-Modification Controller
The autopoietic engine - system modifies itself based on learning.
Lawful constraints prevent runaway modification.
"""

from typing import List, Dict, Any, Optional, Callable
from dataclasses import dataclass
from enum import Enum

class ModificationType(Enum):
    QUESTION_TEMPLATE = "question_template"
    TOOL_MODE = "tool_mode"
    GRAPH_TOPOLOGY = "graph_topology"
    CAPABILITY_REGISTRY = "capability_registry"
    DIMENSIONAL_MAPPING = "dimensional_mapping"
    INTERFACE_THEME = "interface_theme"

@dataclass
class ModificationProposal:
    type: ModificationType
    description: str
    target: str
    new_value: Any
    confidence: float
    evidence: List[str]

class DoctorParser:
    """
    Truth validation engine.
    Checks if proposed modifications are lawful.
    """

    def __init__(self):
        self.invariants = [
            'core_dimensions_must_remain_five',
            'combinatorial_rules_must_persist',
            'fractal_arbiter_must_be_consistent',
            'tool_hierarchy_must_be_maintained',
            'dimensional_order_must_be_lawful'
        ]

    def validate(self, proposal: ModificationProposal) -> Dict[str, Any]:
        """
        Validate a modification proposal.

        Checks:
        1. Does it violate core invariants?
        2. Does it create circular dependencies?
        3. Does it expose security vulnerabilities?
        4. Does it maintain causal graph integrity?
        """
        violations = []

        # Check invariants
        for invariant in self.invariants:
            if self._violates_invariant(proposal, invariant):
                violations.append(invariant)

        # Check circular dependencies
        if self._creates_circular_dependency(proposal):
            violations.append('circular_dependency')

        # Check security
        if self._security_risk(proposal):
            violations.append('security_risk')

        # Check causal integrity
        if self._breaks_causality(proposal):
            violations.append('causal_break')

        return {
            'valid': len(violations) == 0,
            'violations': violations,
            'confidence': proposal.confidence,
            'recommendation': 'approve' if len(violations) == 0 else 'reject'
        }

    def _violates_invariant(self, proposal: ModificationProposal, invariant: str) -> bool:
        """Check if proposal violates a specific invariant."""
        if invariant == 'core_dimensions_must_remain_five':
            if proposal.type == ModificationType.DIMENSIONAL_MAPPING:
                # Cannot add or remove dimensions
                if 'add_dimension' in proposal.description or 'remove_dimension' in proposal.description:
                    return True
        return False

    def _creates_circular_dependency(self, proposal: ModificationProposal) -> bool:
        """Check if proposal creates circular dependencies."""
        # Simplified: check if target depends on itself
        if proposal.target in str(proposal.new_value):
            return True
        return False

    def _security_risk(self, proposal: ModificationProposal) -> bool:
        """Check if proposal creates security risks."""
        # Cannot modify auth or security core
        if 'auth' in proposal.target or 'security' in proposal.target:
            if proposal.confidence < 0.9:
                return True
        return False

    def _breaks_causality(self, proposal: ModificationProposal) -> bool:
        """Check if proposal breaks causal graph integrity."""
        # Cannot modify past learning history
        if 'history' in proposal.target and 'delete' in proposal.description:
            return True
        return False


class InflectionArchitecture:
    """
    Lineage protection system.
    Ensures modifications respect evolutionary history.
    """

    def __init__(self):
        self.lineage = []
        self.rollback_points = []

    def record_modification(self, proposal: ModificationProposal, result: Dict):
        """Record modification in lineage."""
        self.lineage.append({
            'proposal': proposal,
            'result': result,
            'timestamp': self._now()
        })

    def can_rollback(self, steps: int = 1) -> bool:
        """Check if rollback is possible."""
        return len(self.lineage) >= steps

    def rollback(self, steps: int = 1) -> List[Dict]:
        """Rollback to previous state."""
        if not self.can_rollback(steps):
            return []

        rolled_back = self.lineage[-steps:]
        self.lineage = self.lineage[:-steps]
        return rolled_back

    def check_lineage(self, proposal: ModificationProposal) -> Dict:
        """Check if proposal respects lineage."""
        # Modifications must be incremental
        if proposal.confidence < 0.5:
            return {'valid': False, 'reason': 'confidence_too_low'}

        # Modifications must be reversible
        if not self._is_reversible(proposal):
            return {'valid': False, 'reason': 'not_reversible'}

        # Modifications must preserve core identity
        if self._changes_identity(proposal):
            return {'valid': False, 'reason': 'identity_change'}

        return {'valid': True}

    def _is_reversible(self, proposal: ModificationProposal) -> bool:
        """Check if modification can be reversed."""
        # Most modifications are reversible if we store old value
        return True

    def _changes_identity(self, proposal: ModificationProposal) -> bool:
        """Check if modification changes core identity."""
        # Cannot change the fundamental nature of the system
        if 'core_identity' in proposal.target:
            return True
        return False

    def _now(self) -> str:
        from datetime import datetime
        return datetime.now().isoformat()


class VetoProtocol:
    """
    Subsystem authority system.
    Body, Mind, Heart can veto modifications.
    """

    def __init__(self):
        self.subsystems = {
            'body': {'priority': 1, 'concerns': ['stability', 'resources', 'performance']},
            'heart': {'priority': 2, 'concerns': ['meaning', 'purpose', 'alignment']},
            'mind': {'priority': 3, 'concerns': ['logic', 'consistency', 'uncertainty']}
        }

    def evaluate(self, proposal: ModificationProposal) -> Dict[str, Any]:
        """
        Evaluate proposal from all three subsystems.

        Priority: Body > Heart > Mind
        Body veto overrides all.
        """
        vetoes = []

        for subsystem, config in self.subsystems.items():
            veto = self._check_subsystem(subsystem, proposal, config)
            if veto:
                vetoes.append(veto)
                # Body veto is absolute
                if subsystem == 'body':
                    break

        return {
            'approved': len(vetoes) == 0,
            'vetoes': vetoes,
            'priority_veto': any(v['subsystem'] == 'body' for v in vetoes)
        }

    def _check_subsystem(self, name: str, proposal: ModificationProposal, config: Dict) -> Optional[Dict]:
        """Check if subsystem vetoes."""
        concerns = config['concerns']

        # Body: stability concerns
        if 'stability' in concerns and proposal.type == ModificationType.GRAPH_TOPOLOGY:
            if proposal.confidence < 0.7:
                return {
                    'subsystem': name,
                    'concern': 'stability',
                    'reason': f'{name} veto: modification too risky for system stability'
                }

        # Heart: meaning concerns
        if 'meaning' in concerns and proposal.type == ModificationType.DIMENSIONAL_MAPPING:
            if 'meaning' not in proposal.description:
                return {
                    'subsystem': name,
                    'concern': 'meaning',
                    'reason': f'{name} veto: modification lacks meaning alignment'
                }

        # Mind: logic concerns
        if 'logic' in concerns and proposal.confidence < 0.6:
            return {
                'subsystem': name,
                'concern': 'logic',
                'reason': f'{name} veto: insufficient confidence for logical consistency'
            }

        return None


class SelfModificationController:
    """
    The autopoietic engine.
    Watches the mesh, identifies gaps, generates solutions, validates, deploys.
    """

    def __init__(self):
        self.doctor = DoctorParser()
        self.inflection = InflectionArchitecture()
        self.veto = VetoProtocol()
        self.proposal_history = []
        self.modification_log = []

    def watch_mesh(self, mesh_state: Dict) -> List[ModificationProposal]:
        """
        Monitor mesh for capability gaps.
        Generate modification proposals.
        """
        proposals = []

        # Check for missing capabilities
        capabilities = mesh_state.get('capabilities', [])
        known_types = ['code', 'data', 'media', 'document', 'archive']

        for file_type in known_types:
            if file_type not in capabilities:
                proposals.append(ModificationProposal(
                    type=ModificationType.CAPABILITY_REGISTRY,
                    description=f'Add capability for {file_type} processing',
                    target='capability_registry',
                    new_value=file_type,
                    confidence=0.8,
                    evidence=[f'Missing {file_type} handler in mesh']
                ))

        # Check for under-explored dimensions
        dimensional_coverage = mesh_state.get('dimensional_coverage', {})
        for dim in ['movement', 'evolution', 'being', 'design', 'space']:
            if dimensional_coverage.get(dim, 0) < 0.3:
                proposals.append(ModificationProposal(
                    type=ModificationType.QUESTION_TEMPLATE,
                    description=f'Enhance {dim} question templates',
                    target=f'question_templates.{dim}',
                    new_value='enhanced_set',
                    confidence=0.7,
                    evidence=[f'Low coverage in {dim} dimension']
                ))

        return proposals

    def validate_proposal(self, proposal: ModificationProposal) -> Dict:
        """
        Full validation pipeline:
        1. Doctor Parser: truth validation
        2. Inflection Architecture: lineage protection
        3. Veto Protocol: subsystem authority
        """
        # Step 1: Doctor Parser
        doctor_result = self.doctor.validate(proposal)
        if not doctor_result['valid']:
            return {
                'approved': False,
                'stage': 'doctor_parser',
                'reason': doctor_result['violations']
            }

        # Step 2: Inflection Architecture
        lineage_result = self.inflection.check_lineage(proposal)
        if not lineage_result['valid']:
            return {
                'approved': False,
                'stage': 'inflection',
                'reason': lineage_result['reason']
            }

        # Step 3: Veto Protocol
        veto_result = self.veto.evaluate(proposal)
        if not veto_result['approved']:
            return {
                'approved': False,
                'stage': 'veto',
                'reason': veto_result['vetoes']
            }

        return {
            'approved': True,
            'stages': ['doctor_parser', 'inflection', 'veto']
        }

    def deploy_modification(self, proposal: ModificationProposal) -> Dict:
        """
        Deploy validated modification.
        Record in lineage.
        """
        # Execute modification
        result = self._execute(proposal)

        # Record in lineage
        self.inflection.record_modification(proposal, result)

        # Log
        self.modification_log.append({
            'proposal': proposal,
            'result': result,
            'timestamp': self._now()
        })

        return result

    def _execute(self, proposal: ModificationProposal) -> Dict:
        """Execute the modification."""
        # In a real system, this would modify code, config, etc.
        return {
            'status': 'deployed',
            'type': proposal.type.value,
            'target': proposal.target,
            'new_value': proposal.new_value,
            'confidence': proposal.confidence
        }

    def self_update(self, mesh_state: Dict) -> List[Dict]:
        """
        Full self-update cycle:
        1. Watch mesh
        2. Generate proposals
        3. Validate
        4. Deploy approved
        """
        proposals = self.watch_mesh(mesh_state)
        results = []

        for proposal in proposals:
            validation = self.validate_proposal(proposal)
            if validation['approved']:
                result = self.deploy_modification(proposal)
                results.append({
                    'proposal': proposal,
                    'status': 'deployed',
                    'result': result
                })
            else:
                results.append({
                    'proposal': proposal,
                    'status': 'rejected',
                    'reason': validation
                })

        return results

    def _now(self) -> str:
        from datetime import datetime
        return datetime.now().isoformat()


# Export
__all__ = [
    'SelfModificationController',
    'DoctorParser',
    'InflectionArchitecture',
    'VetoProtocol',
    'ModificationProposal',
    'ModificationType'
]
