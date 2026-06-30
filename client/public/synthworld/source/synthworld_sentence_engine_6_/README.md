
# SynthWorld — Sentence Engine (Godot 4)

This adds **Controlled Natural Language (CNL)** sentences you can author safely, parse deterministically,
and execute in-game. It also includes a **YiJing scene template** system and a **Pieces** catalog (mind, body,
heart, soul, spirit) for Blockly-like authoring.

## CNL Sentence format (lossless, strict)
Sentences are single lines with `|`-separated key:value pairs. Order is free; keys must be from the allowed set.

Required: `agent`, `verb`.
Optional: `object`, `at`, `when`, `because`, `scene`, `with`, `note`.

Example:
```
agent:Cynthia | verb:build | object:prop/tree | at:(0,0,8) | when:mood.harmony>=0.7 & time.day | because:nudge.place_symbol_garden | scene:yijing/hex-24 | note:demo
```

### Keys
- `agent`   : identifier (letters, digits, _)
- `verb`    : one of [build, repair, move, emote, spawn, set, light, play]
- `object`  : category/id (e.g., `prop/tree`, `vfx/fireflies`, `sfx/wind_chimes`)
- `at`      : (x,y,z) floats
- `when`    : boolean expr using identifiers, numbers, comparators (==,!=,>=,<=,>,<), logical (&,|,!), and dotted paths (e.g., mood.harmony)
- `because` : tag path like `nudge.place_symbol_garden` or `cause.user_request`
- `scene`   : `yijing/hex-##` or your own scene template id
- `with`    : comma-separated kv (e.g., `with:scale=1.2,color=#88ffaa`)
- `note`    : free text (ignored by executor)

## Files
- `/data/cnl/sentences.txt`     — author your sentences here.
- `/data/cnl/pieces_catalog.json` — "pieces" for Blockly-like editor (mind/body/heart/soul/spirit).
- `/data/yijing/scenes.json`    — maps hexagrams to scene directives.
- `/data/user/profile.json`     — birth info to deterministically pick a YiJing seed (fallback).

## Godot scripts
- `Engine/SentenceParser.gd`    — parse/validate to a Dictionary AST.
- `Engine/SentenceExecutor.gd`  — apply actions in-game.
- `Systems/YiJingResolver.gd`   — picks a hexagram via plugin or deterministic fallback.

To run headless tests: open project and attach executor to your world, or call the parser from a unit test.
