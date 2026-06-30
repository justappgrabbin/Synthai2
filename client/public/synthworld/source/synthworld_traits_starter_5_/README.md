
# SynthWorld (Godot 4) — Trait Engine + Cynthia Builder/Repair

This package adds a **Trait Engine** you can data-drive via JSON.
- Attach **TraitComponent** to any agent.
- Define traits in `/data/traits/*.json` (stats, drive tweaks, action biases).
- Cynthia now reads `/data/agents/cynthia_traits.json` and applies traits (e.g., speed/repair boosts).

Quickstart:
1) Open `game/project.godot` in Godot 4.x → **Run** ▶
2) Edit `/data/traits/*.json` to see immediate behavior changes.
3) Assign traits per-agent by editing `/data/agents/*_traits.json`.
