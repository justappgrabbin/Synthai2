# SynthWorld (Godot 4) — Starter

You're here because you want **pretty + fast iteration** without Unity headaches. This is a **Godot 4.x** starter that boots to a tiny world, one agent, data-driven needs, and a simple Utility AI. Multiplayer hooks are stubbed for later.

## Quickstart (macOS/Windows/Linux)

1. **Install Godot 4.x** from https://godotengine.org/download (Standard edition).
2. **Download this repo** (or unzip the archive you got).
3. Open **Godot** → `Import` → point to `game/project.godot` → `Open` → `Run` ▶.
4. You should see a flat world, one agent wandering and "deciding" between `CookMeal`, `Wander`, `Socialize` using `/data` JSON.

## Repo layout

- `game/` — Godot project files (scenes, scripts, shaders, UI)
- `data/` — JSON datasets for agents, behaviors, biomes, nudges
- `tools/` — validators, importers
- `design/` — specs that drive the data
- `docs/` — notes & screenshots

## Add multiplayer later

- Add a `NetworkManager` autoload (stub included) and switch `Agent` to read inputs from `NetworkAgentController`.
- Use `SceneMultiplayer` with peer authority; replicate position/anim state via RPCs or `MultiplayerSynchronizer`.

## License

MIT for code. You own your art/assets.
