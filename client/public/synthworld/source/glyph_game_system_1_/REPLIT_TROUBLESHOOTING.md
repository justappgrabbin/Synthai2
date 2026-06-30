# 🔧 REPLIT CONSISTENCY TROUBLESHOOTING

This guide addresses the specific issues you've been experiencing with Replit.

---

## ❌ THE PROBLEMS YOU'VE BEEN HAVING

### Problem 1: "Every time I add one thing, I lose another"
**Root cause:** Modules storing state in files that Replit overwrites on hot reload

**Solution:** State is now in `main.py` declarations, which are version controlled

### Problem 2: "Glyphs keep getting lost"
**Root cause:** Glyphs were metadata that could be dropped during restart

**Solution:** Glyphs are now **ontologically mandatory** - system crashes without them

### Problem 3: "Can't keep progress between sessions"
**Root cause:** Dynamic state not properly persisted

**Solution:** Substrate rebuilds from source code on every restart

---

## ✅ HOW THIS SYSTEM PREVENTS THOSE ISSUES

### 1. **Single Source of Truth**
```python
# main.py - This is THE source of truth
def declare_all_glyphs():
    substrate.declare(codon=1, module_name='PlayerSystem', ...)
    substrate.declare(codon=3, module_name='QuestSystem', ...)
    # etc.
```

**Every restart rebuilds from here.** No database to corrupt, no state to lose.

### 2. **Fail-Fast Design**
```python
class MyModule(GlyphModule):
    def __init__(self):
        super().__init__()  # ← Crashes if glyph not declared
```

**If glyphs are missing, system REFUSES to run.** Better than silent corruption.

### 3. **Immutable After Lock**
```python
substrate.lock()  # ← No changes allowed after this
```

**Can't accidentally overwrite glyphs during runtime.**

### 4. **Self-Documenting**
```python
substrate.save_manifest('glyph_manifest.json')
```

**Every run generates manifest showing exact state.** Easy to debug.

---

## 🔒 REPLIT-SPECIFIC SETUP

### Step 1: Set Entry Point
```
# .replit file
[run]
entrypoint = "main.py"
run = ["python3", "main.py"]
```

### Step 2: Disable Auto-Restart (Optional)
In Replit settings:
- Turn OFF "Always On" (costs credits)
- Turn OFF "Hot Reload" (causes state loss)

### Step 3: Use Version Control
```bash
git init
git add .
git commit -m "Glyph substrate foundation"
```

Now your glyph declarations are safe even if Replit crashes.

---

## 🎯 TESTING CONSISTENCY

### Test 1: Restart Test
1. Run `python main.py`
2. Stop the program
3. Run again
4. Check `glyph_manifest.json` - should be identical

### Test 2: Code Change Test
1. Add new module declaration
2. Create module file
3. Import in main
4. Run - should work immediately

### Test 3: Crash Recovery
1. Force a glyph collision (use same codon twice)
2. System should crash with clear error
3. Fix the collision
4. System should run normally

---

## 🔍 DEBUGGING WORKFLOW

### If Modules Won't Load

**Check 1:** Is glyph declared in `main.py`?
```python
# Should be BEFORE substrate.lock()
substrate.declare(codon=X, module_name='MyModule', ...)
```

**Check 2:** Does `MODULE_NAME` match exactly?
```python
# In main.py:
substrate.declare(module_name='MyFeature', ...)

# In module file:
class MyFeature(GlyphModule):
    MODULE_NAME = 'MyFeature'  # ← Must match exactly
```

**Check 3:** Is module imported AFTER lock?
```python
def load_modules():
    # This should be AFTER substrate.lock()
    from modules.my_feature import MyFeature
```

### If Glyphs Seem to Disappear

**Check 1:** Look at `glyph_manifest.json`
```bash
cat glyph_manifest.json
```

**Check 2:** Run status check
```python
from glyph_substrate import substrate
substrate.print_status()
```

**Check 3:** Verify `.replit` entry point
```bash
cat .replit | grep entrypoint
# Should show: entrypoint = "main.py"
```

---

## 🚨 COMMON REPLIT GOTCHAS

### Gotcha 1: File Permissions
**Problem:** Replit sometimes makes files read-only

**Solution:** 
```bash
chmod +x main.py
chmod -R +w .
```

### Gotcha 2: Python Version Mismatch
**Problem:** Replit defaults to Python 3.8, some features need 3.10+

**Solution:** Add to `.replit`:
```
[nix]
channel = "stable-23_11"
```

### Gotcha 3: Module Import Paths
**Problem:** Imports fail with "module not found"

**Solution:** `main.py` already adds project root to path:
```python
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
```

### Gotcha 4: Hot Reload Corruption
**Problem:** Replit's hot reload breaks state

**Solution:** Disable it, or embrace stateless design (we use stateless)

---

## 💾 PERSISTENCE STRATEGY

### What's Persisted in Code
✅ Glyph declarations (in `main.py`)
✅ Module definitions (in `modules/`)
✅ Codon reference data (in `data/`)

### What's Runtime-Only
⚠️ Player progress (rebuilt each run in example)
⚠️ Quest completion (rebuilt each run)
⚠️ Resonance cache (recalculated)

### If You Need Database Persistence

Add to your modules:
```python
import json

class PlayerSystem(GlyphModule):
    def save_state(self):
        with open('player_state.json', 'w') as f:
            json.dump(self.players, f)
    
    def load_state(self):
        try:
            with open('player_state.json', 'r') as f:
                self.players = json.load(f)
        except FileNotFoundError:
            self.players = {}
```

But the **glyph substrate itself never needs persistence** - it rebuilds from `main.py`.

---

## 🎯 MIGRATION CHECKLIST

Moving your existing code to this system:

- [ ] Identify all game features (modules)
- [ ] Assign each feature a codon (1-64)
- [ ] Create declarations in `main.py`
- [ ] Create module files inheriting from `GlyphModule`
- [ ] Move feature logic into module classes
- [ ] Test with `python main.py`
- [ ] Commit to git
- [ ] Deploy to Replit
- [ ] Test restart consistency

---

## 🚀 DEPLOYMENT CHECKLIST

Before pushing to Replit:

- [ ] `python main.py` runs without errors locally
- [ ] `glyph_manifest.json` generates correctly
- [ ] No collision warnings in output
- [ ] `.replit` entrypoint is `main.py`
- [ ] All modules have `MODULE_NAME` defined
- [ ] All declarations have matching imports
- [ ] Code committed to git

---

## ⚡️ EMERGENCY RESET

If everything breaks:

```bash
# Reset to known good state
git reset --hard HEAD

# Clear any corrupted runtime files
rm -f *.pyc
rm -rf __pycache__

# Re-run
python main.py
```

The beauty of this system: **Your glyphs are in version-controlled code,** not in a database that can corrupt.

---

**The substrate is your foundation. It won't disappear.** 🧬✨
