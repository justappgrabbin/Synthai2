"""
PLAYER SYSTEM MODULE
====================
Manages player state, progression, and consciousness field alignment.
"""

from base_module import GlyphModule
from typing import Dict, List


class PlayerSystem(GlyphModule):
    """
    Core player management system.
    
    This module MUST have Glyph declared in main.py before it can load.
    """
    
    MODULE_NAME = 'PlayerSystem'
    
    def __init__(self):
        super().__init__()
        
        # Player state
        self.players = {}
        self.active_fields = set()
        
        print(f"    Field: {self.field}")
        print(f"    Hexagram: {self.hexagram_name}")
    
    def create_player(self, player_id: str, name: str, birth_data: Dict = None):
        """
        Create a new player with glyph-based initialization.
        """
        self.players[player_id] = {
            'id': player_id,
            'name': name,
            'birth_data': birth_data or {},
            'primary_glyph': self.glyph,  # Inherit from module glyph
            'consciousness_field': self.field,
            'level': 1,
            'unlocked_glyphs': [self.glyph]
        }
        
        print(f"  ✓ Player '{name}' created with primary Glyph {self.glyph}")
        return self.players[player_id]
    
    def unlock_glyph(self, player_id: str, glyph: int):
        """
        Unlock a new glyph for player progression.
        """
        if player_id not in self.players:
            raise ValueError(f"Player {player_id} not found")
        
        player = self.players[player_id]
        if glyph not in player['unlocked_glyphs']:
            player['unlocked_glyphs'].append(glyph)
            print(f"  🔓 Player '{player['name']}' unlocked Glyph {glyph}")
    
    def get_player_glyphs(self, player_id: str) -> List[int]:
        """
        Get all glyphs unlocked by this player.
        """
        if player_id not in self.players:
            return []
        return self.players[player_id]['unlocked_glyphs']
