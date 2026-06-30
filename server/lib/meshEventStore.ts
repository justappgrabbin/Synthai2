import fs from "fs";
import path from "path";
import crypto from "crypto";

export interface MeshEvent {
  id: string;
  at: string;
  source: string;
  type: string;
  topic: string;
  payload: Record<string, unknown>;
}

export interface MeshEventInput {
  source?: string;
  type?: string;
  topic?: string;
  payload?: Record<string, unknown>;
}

const MAX_EVENTS = 1000;

function getMeshPath() {
  const base = process.env.MESH_DATA_DIR
    || process.env.LINUX_CONTAINER_WORKDIR
    || path.join(process.cwd(), "workspace");
  return path.join(path.resolve(base), ".synthia", "mesh-events.json");
}

function loadMeshEvents(): MeshEvent[] {
  try {
    const file = getMeshPath();
    if (!fs.existsSync(file)) return [];
    const parsed = JSON.parse(fs.readFileSync(file, "utf8"));
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn("[mesh] failed to load events:", error instanceof Error ? error.message : error);
    return [];
  }
}

let meshEvents = loadMeshEvents();

function saveMeshEvents() {
  const file = getMeshPath();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(meshEvents.slice(0, MAX_EVENTS), null, 2));
}

export function getMeshEvents(limit = 100) {
  return meshEvents.slice(0, Math.max(1, Math.min(200, limit)));
}

export function getMeshStatus() {
  return {
    status: "online",
    events: meshEvents.length,
    path: getMeshPath(),
    topics: Array.from(new Set(meshEvents.slice(0, 100).map((event) => event.topic))).slice(0, 20),
  };
}

export function publishMeshEvent(input: MeshEventInput): MeshEvent {
  const event: MeshEvent = {
    id: `mesh_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`,
    at: new Date().toISOString(),
    source: input.source || "you-n-ide-verse",
    type: input.type || "event",
    topic: input.topic || "system",
    payload: input.payload || {},
  };

  meshEvents = [event, ...meshEvents].slice(0, MAX_EVENTS);
  saveMeshEvents();
  return event;
}
