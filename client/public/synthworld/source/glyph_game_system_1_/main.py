"""
MAIN ENTRY POINT
================
This file runs FIRST and declares all glyphs before any modules load.

This is how we prevent Replit consistency issues:
1. Glyphs are declared up front
2. Substrate is locked
3. THEN modules import and validate their glyphs
"""

import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent))

from glyph_substrate import substrate
from data.codons import get_codon_name, get_codon_trigram


def declare_all_glyphs():
    """
    STEP 1: Declare ALL glyphs before importing any modules.
    
    This is the ontological foundation - nothing can load without this.
    """
    print("\n" + "="*60)
    print("INITIALIZING GLYPH SUBSTRATE")
    print("="*60)
    
    # Player System - Foundation of player identity
    substrate.declare(
        codon=1,
        module_name='PlayerSystem',
        field='Mind',
        trigram=get_codon_trigram(1),
        hexagram_name=get_codon_name(1),
        properties={'priority': 'high', 'core_system': True}
    )
    
    # Quest System - Progression and growth
    substrate.declare(
        codon=3,
        module_name='QuestSystem',
        field='Heart',
        trigram=get_codon_trigram(3),
        hexagram_name=get_codon_name(3),
        properties={'generates_content': True}
    )
    
    # Resonance Engine - The invisible physics
    substrate.declare(
        codon=61,
        module_name='ResonanceEngine',
        field='Soul',
        trigram=get_codon_trigram(61),
        hexagram_name=get_codon_name(61),
        properties={'background_process': True, 'calculates_fields': True}
    )
    
    # Lock substrate - no more declarations allowed
    substrate.lock()
    
    # Validate coherence
    warnings = substrate.validate_coherence()
    if warnings:
        print("\n⚠️ COHERENCE WARNINGS:")
        for warning in warnings:
            print(f"  {warning}")
    
    print("\n✅ Glyph substrate initialized successfully!\n")


def load_modules():
    """
    STEP 2: Now that glyphs are declared, import and initialize modules.
    
    Each module will verify its glyph exists during __init__.
    """
    print("="*60)
    print("LOADING MODULES")
    print("="*60)
    
    from modules.player_system import PlayerSystem
    from modules.quest_system import QuestSystem
    from modules.resonance_engine import ResonanceEngine
    
    print("\n📦 Initializing modules...")
    
    # Initialize in dependency order
    player_system = PlayerSystem()
    quest_system = QuestSystem()
    resonance_engine = ResonanceEngine()
    
    print("\n✅ All modules loaded successfully!\n")
    
    return {
        'player_system': player_system,
        'quest_system': quest_system,
        'resonance_engine': resonance_engine
    }


def run_example_game():
    """
    STEP 3: Run example gameplay demonstrating glyph system.
    """
    print("="*60)
    print("RUNNING EXAMPLE GAME")
    print("="*60)
    
    # Get modules
    modules = load_modules()
    player_sys = modules['player_system']
    quest_sys = modules['quest_system']
    resonance_eng = modules['resonance_engine']
    
    # Create a player
    print("\n👤 Creating player...")
    player = player_sys.create_player(
        player_id='p001',
        name='Celestial',
        birth_data={'date': '1990-09-18', 'time': '14:30', 'location': 'San Francisco'}
    )
    
    # Create some quests
    print("\n📜 Creating quests...")
    quest_sys.create_quest(
        quest_id='q001',
        title='Discover Your First Field',
        required_glyph=None,  # Available from start
        reward_glyph=3  # Unlocks Quest System glyph
    )
    
    quest_sys.create_quest(
        quest_id='q002',
        title='Explore Inner Truth',
        required_glyph=3,
        reward_glyph=61  # Unlocks Resonance Engine glyph
    )
    
    # Complete first quest
    print("\n🎮 Gameplay simulation...")
    reward = quest_sys.complete_quest('p001', 'q001')
    if reward:
        player_sys.unlock_glyph('p001', reward)
    
    # Analyze resonance
    print("\n🌊 Analyzing glyph resonance...")
    player_glyphs = player_sys.get_player_glyphs('p001')
    
    resonance = resonance_eng.calculate_resonance(1, 3)
    print(f"  Resonance between Glyph 1 and Glyph 3: {resonance:.2f}")
    
    coherence = resonance_eng.analyze_field_coherence(player_glyphs)
    print(f"  Player field coherence: {coherence['coherence']:.2f}")
    print(f"  Dominant field: {coherence['dominant_field']}")
    
    # Suggest next glyph
    print("\n💡 Glyph progression suggestions...")
    available = [61, 8, 15, 23]  # Some available glyphs
    suggestions = resonance_eng.suggest_next_glyph(player_glyphs, available)
    
    print("  Recommended next glyphs:")
    for glyph, score in suggestions[:3]:
        name = get_codon_name(glyph)
        print(f"    {glyph:2d}. {name:30s} (resonance: {score:.2f})")
    
    print("\n✅ Game simulation complete!\n")


def main():
    """
    Main entry point - proper initialization order.
    """
    try:
        # CRITICAL ORDER:
        # 1. Declare glyphs FIRST
        declare_all_glyphs()
        
        # 2. Show substrate status
        substrate.print_status()
        
        # 3. Save manifest for debugging
        substrate.save_manifest('glyph_manifest.json')
        
        # 4. Run example game
        run_example_game()
        
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == '__main__':
    main()
