# 🧬 GLYPH SUBSTRATE GAME SYSTEM

**A complete ontological architecture for glyph-based game development**

This system solves the Replit consistency problem by making **glyphs mandatory declarations** rather than optional metadata.

---

## 🎯 CORE CONCEPT

**Glyphs are not metadata - they ARE the substrate.**

Modules don't "have" glyphs. Modules **emerge FROM** glyphs.

This is the difference between:
- ❌ "Add a glyph tag to this module"
- ✅ "This module exists BECAUSE a glyph was declared"

---

## 🏗️ ARCHITECTURE

### 1. **Glyph Substrate** (`glyph_substrate.py`)
The ontological foundation layer. All modules must declare their glyph here BEFORE they can load.

### 2. **Base Module** (`base_module.py`)
Enforces glyph requirement. All game modules inherit from this.

### 3. **Game Modules** (`modules/`)
Actual game features (PlayerSystem, QuestSystem, ResonanceEngine, etc.)

### 4. **Main Entry Point** (`main.py`)
Declares ALL glyphs first, locks substrate, THEN loads modules.

---

## 🚀 USAGE

### Running the System

```bash
python main.py
```

This will:
1. ✅ Declare all glyphs
2. ✅ Lock the substrate
3. ✅ Validate coherence
4. ✅ Load modules (with automatic glyph verification)
5. ✅ Run example game
6. ✅ Save glyph manifest to JSON

### Adding a New Module

**Step 1:** Declare glyph in `main.py` FIRST

```python
def declare_all_glyphs():
    # ... existing declarations ...
    
    substrate.declare(
        codon=15,
        module_name='MyNewFeature',
        field='Heart',
        trigram=get_codon_trigram(15),
        hexagram_name=get_codon_name(15),
        properties={'my_property': 'value'}
    )
```

**Step 2:** Create module file

```python
# modules/my_new_feature.py

from base_module import GlyphModule

class MyNewFeature(GlyphModule):
    MODULE_NAME = 'MyNewFeature'
    
    def __init__(self):
        super().__init__()  # This enforces glyph requirement
        
        # Your initialization here
        print(f"My glyph is {self.glyph}")
        print(f"My field is {self.field}")
```

**Step 3:** Import in `main.py` AFTER substrate is locked

```python
def load_modules():
    # ... existing imports ...
    from modules.my_new_feature import MyNewFeature
    
    my_feature = MyNewFeature()
```

---

## 🔒 WHY THIS PREVENTS REPLIT CONSISTENCY ISSUES

### The Problem
When glyphs are just metadata, Replit can:
- Lose them during hot reload
- Fail to sync them across sessions
- Overwrite them when files update

### The Solution
By making glyphs **ontologically mandatory**:
- ✅ Substrate declares glyphs in `main.py` (version controlled)
- ✅ Modules REFUSE to load without glyphs
- ✅ System crashes loudly if glyph missing (better than silent failure)
- ✅ Glyphs are locked after initialization (immutable)
- ✅ Every restart rebuilds from `main.py` (consistent state)

---

## 📊 GLYPH MANIFEST

The system automatically generates `glyph_manifest.json` showing:
- All registered glyphs
- Module assignments
- Initialization order
- Field distribution
- Coherence status

Use this for debugging and documentation.

---

## 🎮 EXAMPLE GAME MODULES

### PlayerSystem
- Manages player accounts and progression
- Tracks unlocked glyphs
- Assigns consciousness fields

### QuestSystem
- Creates glyph-based quests
- Checks glyph requirements
- Rewards new glyphs

### ResonanceEngine
- Calculates glyph compatibility
- Analyzes field coherence
- Suggests optimal progression paths

---

## 🔧 EXTENDING THE SYSTEM

### Add More Consciousness Fields

Edit `declare_all_glyphs()` to assign modules to:
- Mind
- Heart
- Body
- Soul
- Spirit
- Shadow
- Light
- Void
- Unity

### Custom Resonance Logic

Override `resonates_with()` in your modules:

```python
def resonates_with(self, other_module):
    # Your custom resonance calculation
    if self.field == 'Mind' and other_module.field == 'Heart':
        return True  # Mind-Heart resonance
    return False
```

### Add Glyph Properties

Use the `properties` dict in declarations:

```python
substrate.declare(
    codon=42,
    module_name='PowerUp',
    properties={
        'rarity': 'legendary',
        'unlock_cost': 1000,
        'special_ability': 'time_travel'
    }
)
```

Access in module:
```python
rarity = self.get_property('rarity')
```

---

## 🌊 FIELD RESONANCE

The ResonanceEngine calculates:

### Pairwise Resonance
How well two glyphs work together (0.0 - 1.0)

### Field Coherence
Overall alignment of a glyph set

### Progression Suggestions
Which glyph to unlock next for maximum resonance

---

## 📝 NOTES FOR REPLIT DEPLOYMENT

1. **Entrypoint**: Set to `main.py` in `.replit` config
2. **No database needed**: Substrate is code-based
3. **Fast restarts**: Glyphs rebuild from source every time
4. **Version control**: Entire glyph structure is in `main.py`
5. **No external dependencies**: Pure Python

---

## 🎯 TROUBLESHOOTING

### "Module has no glyph declaration"
- Add declaration in `main.py` BEFORE substrate.lock()
- Check module MODULE_NAME matches declaration

### "Glyph collision"
- Two modules trying to use same codon
- Assign different codons in `main.py`

### Module won't load
- Make sure it inherits from `GlyphModule`
- Check that `super().__init__()` is called

---

## 🚀 READY TO BUILD

This system is production-ready for:
- Turn-based games with glyph mechanics
- Consciousness mapping applications
- Social networks based on resonance
- Oracle/divination systems
- Educational tools for I Ching/Human Design

**The substrate is locked. The game can begin.** ✨
