"""
QUEST SYSTEM MODULE
===================
Manages quests, challenges, and glyph-based progression paths.
"""

from base_module import GlyphModule
from typing import List, Dict, Optional


class QuestSystem(GlyphModule):
    """
    Quest and progression system based on glyph resonance.
    """
    
    MODULE_NAME = 'QuestSystem'
    
    def __init__(self):
        super().__init__()
        
        self.quests = {}
        self.active_quests = {}  # player_id -> [quest_ids]
        
        print(f"    Quest glyph resonance: {self.hexagram_name}")
    
    def create_quest(self, 
                     quest_id: str, 
                     title: str, 
                     required_glyph: int = None,
                     reward_glyph: int = None):
        """
        Create a quest tied to glyph progression.
        
        Args:
            quest_id: Unique quest identifier
            title: Quest name
            required_glyph: Glyph needed to start quest (None = always available)
            reward_glyph: Glyph unlocked upon completion
        """
        self.quests[quest_id] = {
            'id': quest_id,
            'title': title,
            'required_glyph': required_glyph,
            'reward_glyph': reward_glyph,
            'system_glyph': self.glyph,  # This quest system's glyph
            'completed_by': []
        }
        
        print(f"  📜 Quest created: '{title}' (requires Glyph {required_glyph}, rewards Glyph {reward_glyph})")
        return self.quests[quest_id]
    
    def can_start_quest(self, player_glyphs: List[int], quest_id: str) -> bool:
        """
        Check if player has required glyph to start quest.
        """
        quest = self.quests.get(quest_id)
        if not quest:
            return False
        
        required = quest['required_glyph']
        if required is None:
            return True
        
        return required in player_glyphs
    
    def complete_quest(self, player_id: str, quest_id: str) -> Optional[int]:
        """
        Complete a quest and return reward glyph if any.
        """
        quest = self.quests.get(quest_id)
        if not quest:
            return None
        
        if player_id not in quest['completed_by']:
            quest['completed_by'].append(player_id)
        
        reward = quest['reward_glyph']
        if reward:
            print(f"  🎁 Quest '{quest['title']}' complete! Rewarded Glyph {reward}")
        
        return reward
