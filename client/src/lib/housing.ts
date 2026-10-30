// Lightweight housing scene records shared by Worlds and its 3D viewer.
// This is an additive housing layer; it does not replace universe/scene engines.
export interface HousePlan {
  id: string;
  name: string;
  width: number;
  depth: number;
  height: number;
  roof: "flat" | "gable";
  color: string;
  worldId: string;
  positionX: number;
  positionZ: number;
  updatedAt: string;
}

export const HOUSING_STORAGE_KEY = "synthai_world_housing_v1";

export const DEFAULT_HOUSE: HousePlan = {
  id: "",
  name: "New Home",
  width: 7,
  depth: 6,
  height: 3,
  roof: "gable",
  color: "#cf8fae",
  worldId: "",
  positionX: 0,
  positionZ: 0,
  updatedAt: ""
};

const isHousePlan = (value: unknown): value is HousePlan => {
  if (!value || typeof value !== "object") return false;
  const h = value as Partial<HousePlan>;
  return typeof h.id === "string" && typeof h.name === "string" &&
    typeof h.width === "number" && h.width >= 3 && h.width <= 30 &&
    typeof h.depth === "number" && h.depth >= 3 && h.depth <= 30 &&
    typeof h.height === "number" && h.height >= 2 && h.height <= 10 &&
    (h.roof === "flat" || h.roof === "gable") &&
    typeof h.color === "string" && /^#[0-9a-fA-F]{6}$/.test(h.color) &&
    typeof h.worldId === "string" &&
    typeof h.positionX === "number" && Number.isFinite(h.positionX) &&
    typeof h.positionZ === "number" && Number.isFinite(h.positionZ) &&
    typeof h.updatedAt === "string";
};

export function readHousePlans(): HousePlan[] {
  try {
    const data = JSON.parse(localStorage.getItem(HOUSING_STORAGE_KEY) || "[]");
    return Array.isArray(data) ? data.filter(isHousePlan) : [];
  } catch {
    return [];
  }
}

export function writeHousePlans(plans: HousePlan[]): void {
  localStorage.setItem(HOUSING_STORAGE_KEY, JSON.stringify(plans));
  window.dispatchEvent(new Event("synthai-housing-changed"));
}

export function downloadHousePlan(plan: HousePlan): void {
  const blob = new Blob([JSON.stringify(plan, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = (plan.name.toLowerCase().replace(/[^a-z0-9-]+/g, "-") || "home") + ".house.json";
  anchor.click();
  URL.revokeObjectURL(url);
}
