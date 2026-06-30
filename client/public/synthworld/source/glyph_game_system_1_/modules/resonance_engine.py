"""
RESONANCE ENGINE MODULE
========================
Calculates glyph resonance and field interference patterns.
"""

from base_module import GlyphModule
from typing import List, Dict, Tuple
from glyph_substrate import substrate


class ResonanceEngine(GlyphModule):
    """
    Analyzes glyph interactions and field resonance.
    
    This is where the invisible physics of the system lives.
    Players don't see this - they just experience coherent gameplay.
    """
    
    MODULE_NAME = 'ResonanceEngine'
    
    def __init__(self):
        super().__init__()
        
        self.resonance_cache = {}
        print(f"    Resonance calculations powered by Glyph {self.glyph}")
    
    def calculate_resonance(self, glyph_a: int, glyph_b: int) -> float:
        """
        Calculate resonance strength between two glyphs.
        
        Returns value between 0.0 (interference) and 1.0 (perfect resonance).
        """
        cache_key = tuple(sorted([glyph_a, glyph_b]))
        if cache_key in self.resonance_cache:
            return self.resonance_cache[cache_key]
        
        # Get glyph data
        data_a = substrate.get_glyph_data(glyph_a)
        data_b = substrate.get_glyph_data(glyph_b)
        
        if not data_a or not data_b:
            return 0.0
        
        resonance = 0.0
        
        # Same field = strong resonance
        if data_a.get('field') == data_b.get('field'):
            resonance += 0.5
        
        # Same trigram = moderate resonance
        if data_a.get('trigram') == data_b.get('trigram'):
            resonance += 0.3
        
        # Sequential codons = flow resonance
        if abs(glyph_a - glyph_b) == 1:
            resonance += 0.2
        
        # Complementary pairs (I Ching opposites)
        if self._are_complementary(glyph_a, glyph_b):
            resonance += 0.4
        
        # Cap at 1.0
        resonance = min(1.0, resonance)
        
        self.resonance_cache[cache_key] = resonance
        return resonance
    
    def _are_complementary(self, glyph_a: int, glyph_b: int) -> bool:
        """
        Check if glyphs are I Ching complements (inverted hexagrams).
        Simplified version - full implementation would use actual hexagram structure.
        """
        # Example: 1 and 2 are complements (Creative/Receptive)
        complements = {
            (1, 2), (3, 4), (5, 6), (7, 8), (9, 10),
            (11, 12), (13, 14), (15, 16), (17, 18), (19, 20),
            (21, 22), (23, 24), (25, 26), (27, 28), (29, 30),
            (31, 32), (33, 34), (35, 36), (37, 38), (39, 40),
            (41, 42), (43, 44), (45, 46), (47, 48), (49, 50),
            (53, 54), (55, 56), (59, 60), (61, 62), (63, 64)
        }
        
        pair = tuple(sorted([glyph_a, glyph_b]))
        return pair in complements
    
    def analyze_field_coherence(self, glyphs: List[int]) -> Dict:
        """
        Analyze overall coherence of a set of glyphs.
        
        Returns metrics about field alignment, resonance, interference.
        """
        if not glyphs:
            return {'coherence': 0.0, 'interference': 0.0, 'dominant_field': None}
        
        # Calculate average pairwise resonance
        total_resonance = 0.0
        pairs = 0
        
        for i, glyph_a in enumerate(glyphs):
            for glyph_b in glyphs[i+1:]:
                total_resonance += self.calculate_resonance(glyph_a, glyph_b)
                pairs += 1
        
        avg_resonance = total_resonance / pairs if pairs > 0 else 0.0
        
        # Find dominant field
        fields = {}
        for glyph in glyphs:
            data = substrate.get_glyph_data(glyph)
            if data and data.get('field'):
                field = data['field']
                fields[field] = fields.get(field, 0) + 1
        
        dominant_field = max(fields, key=fields.get) if fields else None
        
        return {
            'coherence': avg_resonance,
            'interference': 1.0 - avg_resonance,
            'dominant_field': dominant_field,
            'field_distribution': fields
        }
    
    def suggest_next_glyph(self, current_glyphs: List[int], available_glyphs: List[int]) -> List[Tuple[int, float]]:
        """
        Suggest which glyph to unlock next based on resonance.
        
        Returns list of (glyph, resonance_score) tuples, sorted by score.
        """
        suggestions = []
        
        for candidate in available_glyphs:
            if candidate in current_glyphs:
                continue
            
            # Calculate average resonance with current glyphs
            total_resonance = sum(
                self.calculate_resonance(candidate, existing)
                for existing in current_glyphs
            )
            
            avg_resonance = total_resonance / len(current_glyphs) if current_glyphs else 0.0
            suggestions.append((candidate, avg_resonance))
        
        # Sort by resonance (highest first)
        suggestions.sort(key=lambda x: x[1], reverse=True)
        
        return suggestions
