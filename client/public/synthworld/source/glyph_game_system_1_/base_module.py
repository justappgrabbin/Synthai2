"""
BASE MODULE - All game modules inherit from this
===============================================
Enforces glyph declaration and provides glyph-aware functionality.
"""

from glyph_substrate import substrate
from typing import Optional, Dict, Any


class GlyphModule:
    """
    Base class for all modules in the system.
    
    Enforces glyph declaration and provides glyph-based functionality.
    All game modules should inherit from this.
    
    Usage:
        class MyFeature(GlyphModule):
            MODULE_NAME = 'MyFeature'
            
            def __init__(self):
                super().__init__()
                # Your initialization here
    """
    
    # Subclasses MUST set this
    MODULE_NAME: str = None
    
    def __init__(self):
        if self.MODULE_NAME is None:
            raise ValueError(
                f"{self.__class__.__name__} must define MODULE_NAME class variable"
            )
        
        # ENFORCE GLYPH REQUIREMENT
        self.glyph = substrate.require_glyph(self.MODULE_NAME)
        self.glyph_data = substrate.get_glyph_data(self.glyph)
        
        print(f"  → {self.MODULE_NAME} loaded with Glyph {self.glyph}")
    
    @property
    def codon(self) -> int:
        """The I Ching codon number (1-64)"""
        return self.glyph
    
    @property
    def field(self) -> Optional[str]:
        """Which consciousness field this module belongs to"""
        return self.glyph_data.get('field')
    
    @property
    def hexagram_name(self) -> Optional[str]:
        """Traditional I Ching hexagram name"""
        return self.glyph_data.get('hexagram_name')
    
    @property
    def trigram(self) -> Optional[str]:
        """Position in I Ching structure"""
        return self.glyph_data.get('trigram')
    
    def get_property(self, key: str, default: Any = None) -> Any:
        """
        Get a glyph-specific property.
        
        Args:
            key: Property name
            default: Value to return if property doesn't exist
        """
        return self.glyph_data.get('properties', {}).get(key, default)
    
    def resonates_with(self, other_module: 'GlyphModule') -> bool:
        """
        Check if this module resonates with another module.
        
        Basic implementation - override for custom resonance logic.
        """
        # Same field = resonance
        if self.field and other_module.field:
            return self.field == other_module.field
        
        # Same trigram = resonance
        if self.trigram and other_module.trigram:
            return self.trigram == other_module.trigram
        
        return False
    
    def __repr__(self):
        return f"<{self.MODULE_NAME} (Glyph {self.glyph}: {self.hexagram_name or 'Unnamed'})>"
