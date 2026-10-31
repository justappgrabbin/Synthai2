import { shapeSituation, type IChingShape } from "./ichingWorldShaper";

/**
 * Phone-local life journal for the first connected game. This does not claim
 * remote synchronization, rewards, or a completed mission without a receipt.
 * Keep Morph's identity and Simlish's original replay store untouched.
 */
export interface LifeEpisode {
  id: string;
  worldId: "simlish-world";
  seed: string;
  startedAt: string;
  completedAt?: string;
  outcome?: {
    operation: "transform";
    targetId: "chair";
    interactionCount: number;
    formationRevision: string | number;
    missionCompleted: true;
  };
}

export interface WorldLife {
  version: 1;
  active: LifeEpisode | null;
  chapters: LifeEpisode[];
}

export interface SimlishMissionReceipt {
  mode: string;
  operation: string;
  targetId: string;
  changed: boolean;
  saved: boolean;
  interactionCount: number;
  formationRevision: string | number;
  completed: boolean | null;
}

const PREFIX = "synthai2-world-life-v1:";
const emptyLife = (): WorldLife => ({ version: 1, active: null, chapters: [] });
const keyFor = (userId: string) => PREFIX + encodeURIComponent(userId || "local");

export function readWorldLife(userId: string): WorldLife {
  try {
    const raw = localStorage.getItem(keyFor(userId));
    if (!raw) return emptyLife();
    const parsed = JSON.parse(raw);
    if (parsed?.version !== 1 || !Array.isArray(parsed.chapters)) return emptyLife();
    return {
      version: 1,
      active: parsed.active?.worldId === "simlish-world" && !parsed.active.completedAt
        ? parsed.active as LifeEpisode : null,
      chapters: parsed.chapters.filter((chapter: LifeEpisode) =>
        chapter?.worldId === "simlish-world" && !!chapter.completedAt).slice(-100),
    };
  } catch {
    return emptyLife();
  }
}

function saveLife(userId: string, life: WorldLife): boolean {
  try {
    localStorage.setItem(keyFor(userId), JSON.stringify(life));
    return true;
  } catch {
    return false;
  }
}

export function beginSimlishLife(userId: string): LifeEpisode | null {
  const life = readWorldLife(userId);
  if (life.active) return life.active;
  const startedAt = new Date().toISOString();
  const id = globalThis.crypto?.randomUUID?.() ?? String(Date.now()) + "-" + Math.random().toString(36).slice(2);
  const episode: LifeEpisode = {
    id,
    worldId: "simlish-world",
    seed: "simlish-life:" + (userId || "local") + ":chapter:" + (life.chapters.length + 1),
    startedAt,
  };
  life.active = episode;
  return saveLife(userId, life) ? episode : null;
}

export function activeLifeShape(userId: string): { episode: LifeEpisode; shape: IChingShape } | null {
  const episode = readWorldLife(userId).active;
  return episode ? { episode, shape: shapeSituation(episode.seed) } : null;
}

/** Only Simlish's actual saved, completed chair mission advances life. */
export function completeSimlishLife(userId: string, receipt: SimlishMissionReceipt): LifeEpisode | null {
  if (receipt.mode !== "Mission" || receipt.operation !== "transform" ||
      receipt.targetId !== "chair" || receipt.changed !== true ||
      receipt.saved !== true || receipt.completed !== true ||
      !Number.isSafeInteger(receipt.interactionCount) || receipt.interactionCount < 1) return null;
  const life = readWorldLife(userId);
  if (!life.active || life.active.worldId !== "simlish-world") return null;
  const finished: LifeEpisode = {
    ...life.active,
    completedAt: new Date().toISOString(),
    outcome: {
      operation: "transform",
      targetId: "chair",
      interactionCount: receipt.interactionCount,
      formationRevision: receipt.formationRevision,
      missionCompleted: true,
    },
  };
  life.active = null;
  life.chapters = [...life.chapters, finished].slice(-100);
  return saveLife(userId, life) ? finished : null;
}
