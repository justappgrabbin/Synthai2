/** Navigation only. Original routes, engines and storage remain owned by their programs. */
export const PROGRAM_GROUPS = [
  { id: "worlds", label: "Worlds", path: "/worlds" },
  { id: "morph", label: "Morph", path: "/mesh" },
  { id: "human-design", label: "Human Design", path: "/human-design" },
  { id: "agents", label: "Agents", path: "/agents" },
  { id: "studio", label: "Studio", path: "/ide" },
  { id: "system", label: "System", path: "/settings" },
] as const;

export type ProgramGroup = typeof PROGRAM_GROUPS[number]["id"];
export type Program = { path: string; label: string; group: ProgramGroup; related?: ProgramGroup[] };

// Every existing routed program has a home. Related entries are links to the
// same program, not a second implementation or a claim of shared runtime state.
export const PROGRAMS: Program[] = [
  { path: "/simlish-world", label: "Simlish World", group: "worlds" },
  { path: "/simlish-world?studio=1", label: "Character Studio", group: "worlds", related: ["morph"] },
  { path: "/universe-creator", label: "Universes", group: "worlds" },
  { path: "/game-creator", label: "Games", group: "worlds", related: ["studio"] },
  { path: "/player", label: "Player", group: "worlds" },
  { path: "/agent-world", label: "SynthWorld", group: "worlds", related: ["agents"] },
  { path: "/mesh", label: "Morph / Mesh", group: "morph", related: ["worlds"] },
  { path: "/ingest", label: "Ingest", group: "morph", related: ["studio"] },
  { path: "/zip-manager", label: "ZIP Studio", group: "morph", related: ["studio"] },
  { path: "/continuity-glyph", label: "Glyphs", group: "morph" },
  { path: "/human-design", label: "Human Design", group: "human-design", related: ["worlds", "morph"] },
  { path: "/calibration-tank", label: "Cal Tank", group: "human-design" },
  { path: "/agents", label: "Agents", group: "agents", related: ["worlds"] },
  { path: "/autonomy", label: "Autonomy", group: "agents" },
  { path: "/synthia", label: "Synthia", group: "agents" },
  { path: "/ide", label: "IDE", group: "studio" },
  { path: "/novel", label: "Novel", group: "studio" },
  { path: "/gan-trainer", label: "GAN", group: "studio" },
  { path: "/presentation-planner", label: "Planner", group: "studio" },
  { path: "/mod-manager", label: "Mods", group: "studio" },
  { path: "/grove-store", label: "Store", group: "studio" },
  { path: "/settings", label: "Settings", group: "system" },
];

export function programAt(location: string): Program | undefined {
  const url = new URL(location, "https://synthai.local");
  if (url.pathname === "/worlds") url.pathname = "/simlish-world";
  // Query-specific programs win, regardless of unrelated query parameters.
  return PROGRAMS.find(program => {
    const candidate = new URL(program.path, url.origin);
    return candidate.pathname === url.pathname && candidate.search !== "" &&
      [...candidate.searchParams].every(([key, value]) => url.searchParams.get(key) === value);
  }) || PROGRAMS.find(program => program.path === url.pathname);
}

export function programsIn(group: ProgramGroup): Program[] {
  return PROGRAMS.filter(program => program.group === group || program.related?.includes(group));
}

/** Add new tray entries without resetting the user's saved order or hidden choices. */
export function includeNewPrograms(savedIds: string[], currentIds: string[]): string[] {
  return [...savedIds, ...currentIds.filter(id => !savedIds.includes(id))];
}
