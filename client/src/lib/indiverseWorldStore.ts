/**
 * Shared reader for the pre-existing SemanticUniverseCreator storage contract.
 * No migration, deletion, or synthetic world creation happens here.
 */
export type SemanticLayer = {
  id: number;
  name: string;
  function: string;
  extractedData?: string;
};
export type SavedUniverse = {
  id: string;
  name: string;
  prompt: string;
  createdAt: string;
  layers: SemanticLayer[];
  seed: string;
};

export const WORLD_LIBRARY_KEY = "semantic_universes";

export function parseSavedWorlds(raw: string | null): SavedUniverse[] {
  try {
    const parsed: unknown = JSON.parse(raw || "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((world): world is SavedUniverse => {
      if (!world || typeof world !== "object") return false;
      const value = world as Record<string, unknown>;
      return (
        typeof value.id === "string" &&
        typeof value.name === "string" &&
        typeof value.prompt === "string" &&
        typeof value.seed === "string" &&
        typeof value.createdAt === "string" &&
        Array.isArray(value.layers) &&
        value.layers.every((layer: unknown) => {
          if (!layer || typeof layer !== "object") return false;
          const item = layer as Record<string, unknown>;
          return (
            typeof item.id === "number" &&
            typeof item.name === "string" &&
            typeof item.function === "string" &&
            (item.extractedData === undefined || typeof item.extractedData === "string")
          );
        })
      );
    });
  } catch {
    return [];
  }
}

export function readSavedWorlds(): SavedUniverse[] {
  if (typeof localStorage === "undefined") return [];
  try {
    return parseSavedWorlds(localStorage.getItem(WORLD_LIBRARY_KEY));
  } catch {
    return [];
  }
}
