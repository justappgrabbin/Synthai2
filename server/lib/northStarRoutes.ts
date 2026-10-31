import type { Express, Request, Response } from "express";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { publishMeshEvent } from "./meshEventStore";

export const ONTOLOGY_FIELDS = [
  "planetary", "dimension", "gate", "line", "color", "tone", "base",
  "degree", "minute", "second", "arc", "zodiac", "house",
] as const;

export type OntologicalPosition = Record<(typeof ONTOLOGY_FIELDS)[number], string | number>;
export type AddressedEntityKind = "person" | "place" | "thing" | "app" | "tool" | "file" | "agent" | "world" | "project";
export interface AddressedEntity {
  id: string;
  kind: AddressedEntityKind;
  ref: string;
  name: string;
  address: OntologicalPosition;
  source: string;
  createdAt: string;
}
interface Relationship {
  id: string;
  from: string;
  to: string;
  relation: string;
  source: string;
  createdAt: string;
}
interface Ledger { entities: AddressedEntity[]; relationships: Relationship[] }
const TYPES = new Set<AddressedEntityKind>(["person", "place", "thing", "app", "tool", "file", "agent", "world", "project"]);
const DIMENSIONS = new Set(["Movement", "Evolution", "Being", "Design", "Space"]);
const MAX_ENTITIES = 200000;
const MAX_RELATIONS = 500000;
const DATA_FILE = path.resolve(process.env.SYNTHAI_DATA_DIR || "./data", "north-star-ontology.json");
let pending = Promise.resolve();
const intBetween = (x: unknown, min: number, max: number) => typeof x === "number" && Number.isInteger(x) && x >= min && x <= max;
const numberBetween = (x: unknown, min: number, max: number) => typeof x === "number" && Number.isFinite(x) && x >= min && x < max;
const nonempty = (v: unknown, max = 200) => typeof v === "string" && v.trim().length > 0 && v.length <= max;
const clean = (value: string) => value.trim();

export function validatePosition(raw: unknown): { ok: true; address: OntologicalPosition } | { ok: false; error: string } {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return { ok: false, error: "An explicit 13-field address is required" };
  const r = raw as Record<string, unknown>;
  const missing = ONTOLOGY_FIELDS.filter(k => r[k] === undefined || r[k] === null || r[k] === "");
  if (missing.length) return { ok: false, error: "Missing ontological fields: " + missing.join(", ") };
  if (!nonempty(r.planetary) || !DIMENSIONS.has(r.dimension as string)) return { ok: false, error: "A sourced planetary position and known dimension are required" };
  if (!intBetween(r.gate, 1, 64) || !intBetween(r.line, 1, 6) ||
      !intBetween(r.color, 1, 6) || !intBetween(r.tone, 1, 6) ||
      !intBetween(r.base, 1, 5)) return { ok: false, error: "Invalid gate/line/color/tone/base coordinates" };
  if (!numberBetween(r.degree, 0, 360) || !numberBetween(r.minute, 0, 60) ||
      !numberBetween(r.second, 0, 60)) return { ok: false, error: "Invalid degree/minute/second coordinates" };
  if (!(nonempty(r.arc) || (typeof r.arc === "number" && Number.isFinite(r.arc)))) return { ok: false, error: "Arc is required; no default or arcAxis conversion is assumed" };
  if (!nonempty(r.zodiac) || !intBetween(r.house, 1, 12)) return { ok: false, error: "Valid zodiac and house are required" };
  const address = Object.fromEntries(ONTOLOGY_FIELDS.map(k => [k, r[k]])) as OntologicalPosition;
  return { ok: true, address };
}

export function validateEntity(raw: unknown) {
  if (!raw || typeof raw !== "object") return { ok: false as const, error: "Entity object is required" };
  const r = raw as Record<string, unknown>;
  if (!TYPES.has(r.kind as AddressedEntityKind)) return { ok: false as const, error: "Unknown entity kind" };
  if (!nonempty(r.name) || !nonempty(r.ref) || !nonempty(r.source, 1000)) return { ok: false as const, error: "name, stable ref, and provenance source are mandatory" };
  if (!/^[a-zA-Z0-9:_./-]{1,200}$/.test(r.ref as string)) return { ok: false as const, error: "ref may contain letters, digits, colon, underscore, dash, dot or slash only" };
  const position = validatePosition(r.address);
  if (!position.ok) return position;
  return { ok: true as const, entity: { kind: r.kind as AddressedEntityKind, name: clean(r.name as string), ref: r.ref as string, source: clean(r.source as string), address: position.address } };
}

async function readLedger(): Promise<Ledger> {
  try {
    const parsed = JSON.parse(await readFile(DATA_FILE, "utf8"));
    if (!Array.isArray(parsed.entities) || !Array.isArray(parsed.relationships)) throw new Error("Ontology ledger has invalid structure");
    return parsed as Ledger;
  } catch (error: any) {
    if (error?.code === "ENOENT") return { entities: [], relationships: [] };
    throw error;
  }
}
async function saveLedger(ledger: Ledger): Promise<void> {
  await mkdir(path.dirname(DATA_FILE), { recursive: true, mode: 0o700 });
  const temp = DATA_FILE + "." + randomUUID() + ".tmp";
  await writeFile(temp, JSON.stringify(ledger, null, 2), { mode: 0o600 });
  await rename(temp, DATA_FILE);
}
async function transaction<T>(action: (ledger: Ledger) => Promise<T> | T): Promise<T> {
  const job = pending.then(async () => {
    const ledger = await readLedger();
    const result = await action(ledger);
    await saveLedger(ledger);
    return result;
  });
  pending = job.then(() => undefined, () => undefined);
  return job;
}
const ADMIN_TOKEN = process.env.SYNTHAI_ONTOLOGY_ADMIN_TOKEN || "";
function requireAdmin(req: Request, res: Response): boolean {
  if (ADMIN_TOKEN.length < 24) { res.status(503).json({ ok: false, error: "Set SYNTHAI_ONTOLOGY_ADMIN_TOKEN (24+ characters) on the self-hosted backend to enable private ontology access" }); return false; }
  if (req.get("authorization") !== "Bearer " + ADMIN_TOKEN) { res.status(401).json({ ok: false, error: "Administrator token required" }); return false; }
  return true;
}
function errorResponse(res: Response, error: unknown) {
  const message = error instanceof Error ? error.message : "Unknown error";
  res.status(500).json({ ok: false, error: message });
}
const localAutoappUrl = process.env.SYNTHAI_AUTOAPP_URL?.trim() || "";
const publicAutoappUrl = process.env.SYNTHAI_AUTOAPP_PUBLIC_URL?.trim() || "";
function configuredBackend(): URL | null {
  if (!localAutoappUrl) return null;
  try {
    const url = new URL(localAutoappUrl);
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) return null;
    return url;
  } catch { return null; }
}
function autoappLaunch(): string | null {
  if (!publicAutoappUrl) return null;
  try {
    const url = new URL(publicAutoappUrl);
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) return null;
    return new URL("/builder", url).toString();
  } catch { return null; }
}
function p2pIce(): string[] {
  return (process.env.SYNTHAI_P2P_ICE_URLS || "").split(",").map(x => x.trim()).filter(x => /^(stun|stuns):[a-zA-Z0-9_.:-]+$/.test(x)).slice(0, 6);
}
export function registerNorthStarRoutes(app: Express): void {
  app.get("/api/north-star/status", async (_req, res) => {
    const backend = configuredBackend();
    let autoapp = "unconfigured";
    if (backend) {
      try {
        const response = await fetch(new URL("/api/health", backend), { signal: AbortSignal.timeout(3000) });
        autoapp = response.ok ? "reachable" : "unhealthy";
      } catch { autoapp = "unreachable"; }
    }
    res.json({ ok: true, ontology: { writeEnabled: ADMIN_TOKEN.length >= 24, persistent: true, addressFields: [...ONTOLOGY_FIELDS] },
      autoapp: { status: autoapp, launchUrl: autoapp === "reachable" ? autoappLaunch() : null },
      p2p: { mode: "browser-webrtc-manual-signaling", iceUrls: p2pIce(), remotePeersRequireNetworkPath: true },
      hosting: "self-hosted-linux-container" });
  });
  app.post("/api/north-star/entities", async (req, res) => {
    if (!requireAdmin(req, res)) return;
    const validated = validateEntity(req.body);
    if (!validated.ok) { res.status(400).json({ ok: false, error: validated.error }); return; }
    try {
      const record = await transaction(ledger => {
        if (ledger.entities.length >= MAX_ENTITIES) throw new Error("Entity capacity reached");
        const key = validated.entity.kind + ":" + validated.entity.ref;
        if (ledger.entities.some(e => e.id === key)) throw new Error("Entity already admitted: " + key);
        const entity: AddressedEntity = { id: key, ...validated.entity, createdAt: new Date().toISOString() };
        ledger.entities.push(entity);
        return entity;
      });
      publishMeshEvent({ source: "north-star", type: "ontology.entity.admitted", topic: "ontology.admission",
        payload: { kind: record.kind, addressed: true } });
      res.status(201).json({ ok: true, entity: record });
    } catch (error) {
      if (String(error).includes("already admitted")) { res.status(409).json({ ok: false, error: String(error) }); return; }
      errorResponse(res, error);
    }
  });
  app.get("/api/north-star/entities", async (req, res) => {
    if (!requireAdmin(req, res)) return;
    try {
      const ledger = await readLedger();
      res.json({ ok: true, entities: ledger.entities.slice(-Math.min(200, Math.max(1, Number(req.query.limit) || 50))) });
    } catch (error) { errorResponse(res, error); }
  });
  app.post("/api/north-star/relationships", async (req, res) => {
    if (!requireAdmin(req, res)) return;
    const { from, to, relation, source } = req.body || {};
    if (![from, to, relation, source].every(x => nonempty(x, 1000))) { res.status(400).json({ ok: false, error: "from, to, relation and provenance source are required" }); return; }
    try {
      const record = await transaction(ledger => {
        if (ledger.relationships.length >= MAX_RELATIONS) throw new Error("Relationship capacity reached");
        const ids = new Set(ledger.entities.map(x => x.id));
        if (!ids.has(from) || !ids.has(to)) throw new Error("Both endpoints must be admitted with complete addresses before relating them");
        const link: Relationship = { id: randomUUID(), from, to, relation, source, createdAt: new Date().toISOString() };
        ledger.relationships.push(link);
        return link;
      });
      publishMeshEvent({ source: "north-star", type: "ontology.relationship.created", topic: "ontology.relationship",
        payload: { type: "observed-link" } });
      res.status(201).json({ ok: true, relationship: record });
    } catch (error) { res.status(String(error).includes("must be admitted") ? 422 : 500).json({ ok: false, error: String(error) }); }
  });
  app.get("/api/north-star/relationships", async (req, res) => {
    if (!requireAdmin(req, res)) return;
    try { res.json({ ok: true, relationships: (await readLedger()).relationships.slice(-100) }); } catch (error) { errorResponse(res, error); }
  });
}
