# 🧬 GLYPH SUBSTRATE QUICK REFERENCE

---

## 📋 ADDING A NEW MODULE (3 STEPS)

### 1. DECLARE GLYPH (in `main.py`)
```python
substrate.declare(
    codon=42,
    module_name='MyFeature',
    field='Mind',  # Mind/Heart/Body/Soul/Spirit/Shadow/Light/Void/Unity
    hexagram_name='The Answer',
    properties={'key': 'value'}
)
```

### 2. CREATE MODULE FILE
```python
# modules/my_feature.py
from base_module import GlyphModule

class MyFeature(GlyphModule):
    MODULE_NAME = 'MyFeature'
    
    def __init__(self):
        super().__init__()  # ← Enforces glyph requirement
        # Your code here
```

### 3. IMPORT IN MAIN
```python
# In load_modules() function
from modules.my_feature import MyFeature
my_feature = MyFeature()
```

---

## 🔍 ACCESSING GLYPH DATA

### From Within a Module
```python
self.glyph           # Codon number (1-64)
self.field           # Consciousness field
self.hexagram_name   # I Ching name
self.trigram         # Position (upper/lower/both)
self.get_property('key')  # Custom properties
```

### From Outside a Module
```python
from glyph_substrate import substrate

glyph = substrate.get_module_glyph('ModuleName')
data = substrate.get_glyph_data(42)
```

---

## 🌊 CALCULATING RESONANCE

```python
from modules.resonance_engine import ResonanceEngine

engine = ResonanceEngine()

# Between two glyphs
score = engine.calculate_resonance(glyph_a, glyph_b)

# Field coherence of a set
coherence = engine.analyze_field_coherence([1, 3, 8, 15])

# Next best glyph
suggestions = engine.suggest_next_glyph(
    current_glyphs=[1, 3],
    available_glyphs=[8, 15, 23, 61]
)
```

---

## 🎮 PLAYER PROGRESSION

```python
from modules.player_system import PlayerSystem

players = PlayerSystem()

# Create player
player = players.create_player('id', 'Name', birth_data={})

# Unlock glyph
players.unlock_glyph('id', glyph=42)

# Check glyphs
glyphs = players.get_player_glyphs('id')
```

---

## 📜 QUEST SYSTEM

```python
from modules.quest_system import QuestSystem

quests = QuestSystem()

# Create quest
quests.create_quest(
    quest_id='q1',
    title='Quest Name',
    required_glyph=3,   # Need this to start
    reward_glyph=8      # Get this on complete
)

# Check if player can start
can_start = quests.can_start_quest(player_glyphs, 'q1')

# Complete quest
reward = quests.complete_quest('player_id', 'q1')
```

---

## 🔒 SUBSTRATE OPERATIONS

```python
from glyph_substrate import substrate

# Lock substrate (call after all declarations)
substrate.lock()

# Check if module has glyph
glyph = substrate.get_module_glyph('ModuleName')

# Enforce glyph requirement (crashes if not declared)
glyph = substrate.require_glyph('ModuleName')

# Validate coherence
warnings = substrate.validate_coherence()

# Export manifest
manifest = substrate.export_manifest()
substrate.save_manifest('output.json')

# Print status
substrate.print_status()
```

---

## 🧬 64 CODONS (I CHING)

```
 1. The Creative              17. Following                33. Retreat
 2. The Receptive             18. Work on the Decayed      34. Power of the Great
 3. Difficulty at Beginning   19. Approach                 35. Progress
 4. Youthful Folly            20. Contemplation            36. Darkening of Light
 5. Waiting                   21. Biting Through           37. The Family
 6. Conflict                  22. Grace                    38. Opposition
 7. The Army                  23. Wielding Power           39. Obstruction
 8. Unity of the People       24. Return                   40. Deliverance
 9. Taming Power (Small)      25. Innocence                41. Decrease
10. Treading                  26. Taming Power (Great)     42. Increase
11. Peace                     27. Nourishment              43. Breakthrough
12. Standstill                28. Preponderance (Great)    44. Coming to Meet
13. Fellowship                29. The Abysmal              45. Gathering Together
14. Great Possession          30. The Clinging             46. Pushing Upward
15. Unity in Conduct          31. Influence                47. Oppression
16. Enthusiasm                32. Duration                 48. The Well

49. Revolution                57. The Gentle               
50. The Cauldron              58. The Joyous
51. The Arousing              59. Dispersion
52. Keeping Still             60. Limitation
53. Development               61. Inner Truth
54. The Marrying Maiden       62. Preponderance (Small)
55. Abundance                 63. After Completion
56. The Wanderer              64. Before Completion
```

---

## ⚠️ COMMON ERRORS

### "Module has no glyph declaration"
→ Add `substrate.declare()` in `main.py` before `substrate.lock()`

### "Glyph collision"
→ Two modules using same codon - assign different numbers

### Module won't import
→ Check `MODULE_NAME` matches declaration exactly

### Changes not persisting in Replit
→ Make sure `.replit` entrypoint is `main.py`

---

## 🎯 FILE STRUCTURE

```
/
├── main.py                    # Entry point - declares glyphs FIRST
├── glyph_substrate.py         # Ontological foundation
├── base_module.py             # Enforces glyph requirement
├── data/
│   └── codons.py              # I Ching reference
├── modules/
│   ├── player_system.py       # Player management
│   ├── quest_system.py        # Quest/progression
│   └── resonance_engine.py    # Field calculations
├── .replit                    # Replit config
├── README.md                  # Full documentation
└── IMPLEMENTATION_GUIDE.md    # How to add your features
```

---

## 🚀 DEPLOYMENT CHECKLIST

- [ ] All modules declared in `main.py`
- [ ] `substrate.lock()` called
- [ ] `.replit` entrypoint set to `main.py`
- [ ] Test with `python main.py`
- [ ] Check `glyph_manifest.json` output
- [ ] Verify no collision warnings
- [ ] Push to Replit

---

**Glyphs are the substrate. Everything else emerges.** ✨
