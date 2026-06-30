"""
GLYPH SUBSTRATE - Ontological Foundation Layer
==============================================
This is the PRIMARY reality layer. Nothing exists without a glyph.
All modules MUST declare their glyph before they can load.

Glyphs are not metadata - they ARE the substrate of information.
"""

from datetime import datetime
from typing import Dict, Optional, List, Any
import json


class GlyphCollisionError(Exception):
    """Raised when two modules try to claim the same glyph"""
    pass


class GlyphNotDeclaredError(Exception):
    """Raised when a module tries to load without declaring its glyph"""
    pass


class GlyphSubstrate:
    """
    The base reality layer for the entire system.
    
    This is not a database or metadata store - it's the SUBSTRATE.
    Modules don't "have" glyphs, they EMERGE FROM glyphs.
    """
    
    def __init__(self):
        self.registry: Dict[int, Dict[str, Any]] = {}
        self.module_index: Dict[str, int] = {}  # module_name -> codon
        self.locked = False
        self.initialization_order = []
        
    def declare(self, 
                codon: int, 
                module_name: str, 
                field: str = None,
                trigram: str = None,
                hexagram_name: str = None,
                properties: Dict = None):
        """
        MANDATORY DECLARATION - All modules must call this before loading
        
        Args:
            codon: I Ching codon number (1-64)
            module_name: The name of the module/component
            field: Which consciousness field (Mind/Heart/Body/Soul/Spirit/Shadow/Light/Void/Unity)
            trigram: Position in I Ching structure (upper/lower)
            hexagram_name: Traditional I Ching name
            properties: Additional glyph-specific properties
        """
        if self.locked:
            raise RuntimeError(
                f"❌ Substrate is locked. Cannot declare glyph for '{module_name}'. "
                f"All declarations must happen during initialization."
            )
        
        # Validate codon range
        if not 1 <= codon <= 64:
            raise ValueError(f"Invalid codon {codon}. Must be 1-64.")
        
        # Check for collision
        if codon in self.registry:
            existing = self.registry[codon]
            raise GlyphCollisionError(
                f"⚠️ GLYPH COLLISION at Codon {codon}\n"
                f"  Already assigned to: {existing['module']}\n"
                f"  Cannot assign to: {module_name}\n"
                f"  → Resolve field interference before proceeding."
            )
        
        # Check if module already has a different glyph
        if module_name in self.module_index:
            existing_codon = self.module_index[module_name]
            raise GlyphCollisionError(
                f"⚠️ MODULE COLLISION\n"
                f"  Module '{module_name}' already has Glyph {existing_codon}\n"
                f"  Cannot assign additional Glyph {codon}\n"
                f"  → One module, one glyph."
            )
        
        # Register the glyph
        self.registry[codon] = {
            'module': module_name,
            'field': field,
            'trigram': trigram,
            'hexagram_name': hexagram_name,
            'properties': properties or {},
            'declared_at': datetime.now().isoformat()
        }
        
        self.module_index[module_name] = codon
        self.initialization_order.append(module_name)
        
        print(f"✓ Glyph {codon} ({hexagram_name or 'Unnamed'}) → {module_name} [{field or 'Unknown Field'}]")
        
    def lock(self):
        """
        Lock the substrate - no more declarations allowed.
        Call this after all modules have declared their glyphs.
        """
        if self.locked:
            print("⚠️ Substrate already locked")
            return
            
        self.locked = True
        print(f"\n🔒 SUBSTRATE LOCKED")
        print(f"   Registered {len(self.registry)} glyphs across {len(self.initialization_order)} modules")
        print(f"   Initialization order: {' → '.join(self.initialization_order)}")
        
    def get_module_glyph(self, module_name: str) -> Optional[int]:
        """
        Reverse lookup: What glyph does this module have?
        
        Returns None if module hasn't declared a glyph.
        """
        return self.module_index.get(module_name)
    
    def get_glyph_data(self, codon: int) -> Optional[Dict]:
        """
        Get all data associated with a glyph.
        """
        return self.registry.get(codon)
    
    def get_module_data(self, module_name: str) -> Optional[Dict]:
        """
        Get glyph data for a specific module.
        """
        codon = self.get_module_glyph(module_name)
        if codon is None:
            return None
        return self.get_glyph_data(codon)
    
    def require_glyph(self, module_name: str) -> int:
        """
        Enforce that a module has declared its glyph.
        Raises GlyphNotDeclaredError if not found.
        
        Use this in module __init__ methods:
        
        class MyModule:
            def __init__(self):
                self.glyph = substrate.require_glyph('MyModule')
        """
        glyph = self.get_module_glyph(module_name)
        
        if glyph is None:
            raise GlyphNotDeclaredError(
                f"❌ Module '{module_name}' has no glyph declaration.\n"
                f"   Add substrate.declare() in main.py BEFORE importing this module.\n"
                f"   Example:\n"
                f"     substrate.declare(\n"
                f"         codon=15,\n"
                f"         module_name='{module_name}',\n"
                f"         field='Mind',\n"
                f"         hexagram_name='Unity in Conduct'\n"
                f"     )"
            )
        
        return glyph
    
    def validate_coherence(self) -> List[str]:
        """
        Check if glyph assignments create valid field structure.
        Returns list of warnings/issues.
        """
        warnings = []
        
        # Group modules by field
        fields = {}
        for codon, data in self.registry.items():
            field = data.get('field')
            if field:
                if field not in fields:
                    fields[field] = []
                fields[field].append(codon)
        
        # Check for imbalances
        if len(fields) > 0:
            field_counts = {f: len(codons) for f, codons in fields.items()}
            max_field = max(field_counts, key=field_counts.get)
            min_field = min(field_counts, key=field_counts.get)
            
            if field_counts[max_field] > 3 * field_counts[min_field]:
                warnings.append(
                    f"⚠️ Field imbalance: {max_field} has {field_counts[max_field]} modules, "
                    f"but {min_field} only has {field_counts[min_field]}"
                )
        
        return warnings
    
    def export_manifest(self) -> Dict:
        """
        Export the complete glyph substrate as JSON.
        Useful for debugging and documentation.
        """
        return {
            'locked': self.locked,
            'total_glyphs': len(self.registry),
            'initialization_order': self.initialization_order,
            'glyphs': self.registry,
            'module_index': self.module_index
        }
    
    def save_manifest(self, filepath: str = 'glyph_manifest.json'):
        """
        Save substrate state to JSON file.
        """
        with open(filepath, 'w') as f:
            json.dump(self.export_manifest(), f, indent=2)
        print(f"💾 Substrate manifest saved to {filepath}")
    
    def print_status(self):
        """
        Display current substrate status.
        """
        print("\n" + "="*60)
        print("GLYPH SUBSTRATE STATUS")
        print("="*60)
        print(f"Status: {'🔒 LOCKED' if self.locked else '🔓 UNLOCKED'}")
        print(f"Total Glyphs: {len(self.registry)}")
        print(f"Total Modules: {len(self.module_index)}")
        
        if self.registry:
            print("\nRegistered Glyphs:")
            for codon in sorted(self.registry.keys()):
                data = self.registry[codon]
                print(f"  {codon:2d}. {data['hexagram_name'] or 'Unnamed':30s} → {data['module']:20s} [{data.get('field', 'N/A')}]")
        
        warnings = self.validate_coherence()
        if warnings:
            print("\n⚠️ Coherence Warnings:")
            for warning in warnings:
                print(f"  {warning}")
        
        print("="*60 + "\n")


# Global substrate instance
# All modules import and use this single instance
substrate = GlyphSubstrate()
