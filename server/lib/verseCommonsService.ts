import fs from "node:fs";
import path from "node:path";
import { randomBytes, createHash, randomUUID } from "node:crypto";
import type { Express, Request, Response } from "express";
import { z } from "zod";
import { publishMeshEvent } from "./meshEventStore";
import { shapeWorld, type WorldShape } from "./ichingWorldShaper";

// Stable IDs are shared by Games, Social, and the YOU-N-I-VERSE mesh.
// "source" means files exist but no playable runtime is verified.
export const VERSE_WORLDS = [
  { id: "platformer", title: "Platformer", kind: "game", status: "browser-template", route: "/game-creator?play=platformer", connections: ["puzzle", "space-shooter", "simlish"] },
  { id: "space-shooter", title: "Space Shooter", kind: "game", status: "browser-template", route: "/game-creator?play=space-shooter", connections: ["platformer", "puzzle", "simlish"] },
  { id: "puzzle", title: "Puzzle Game", kind: "game", status: "browser-template", route: "/game-creator?play=puzzle", connections: ["platformer", "space-shooter", "human-design"] },
  { id: "simlish", title: "Simlish World", kind: "world", status: "runtime-dependent", route: "/simlish-world", connections: ["platformer", "space-shooter", "universe-creator"] },
  { id: "human-design", title: "Human Design", kind: "core", status: "app", route: "/human-design", connections: ["puzzle", "universe-creator", "simlish"] },
  { id: "universe-creator", title: "Universe Creator", kind: "studio", status: "creator", route: "/universe-creator", connections: ["simlish", "human-design", "platformer"] },
  { id: "godot-starter", title: "Godot Starter", kind: "source", status: "starter-only", route: "/game-creator", connections: ["simlish", "universe-creator"] },
] as const;

const ROOMS = [
  { id: "commons", name: "Verse Commons", description: "Community discussion across YOU-N-I-VERSE.", worldId: null },
  { id: "human-design", name: "Human Design", description: "Explore charts and share discoveries.", worldId: "human-design" },
  { id: "games", name: "Game Worlds", description: "Share games, creators and world paths.", worldId: null },
  ...VERSE_WORLDS.filter((world) => world.kind === "game" || world.id === "simlish").map((world) => ({
    id: "world:" + world.id, name: world.title, description: "Community room for " + world.title + ".", worldId: world.id,
  })),
];

type Explorer = { id: string; displayName: string; joinedRoomIds: string[]; createdAt: string };
type Session = { hash: string; explorerId: string; expiresAt: number };
type Post = { id: string; explorerId: string; roomId: string; worldId: string | null; message: string; createdAt: string };
type WorldVisit = {
  id: string; worldId: string; fromWorldId: string | null; enteredAt: string;
  visitNumber: number; shape: WorldShape;
};
type WorldAction = {
  id: string; worldId: string; operation: string; targetId: string;
  occurredAt: string; source: "client-reported";
  interactionCount?: number; localSaved?: boolean;
};
type WorldProgress = {
  explorerId: string; currentWorldId: string | null;
  visits: WorldVisit[]; actions: WorldAction[];
};
type Store = { explorers: Explorer[]; sessions: Session[]; posts: Post[]; worldProgress: WorldProgress[] };

const DATA_ROOT = path.resolve(process.env.MESH_DATA_DIR || process.env.LINUX_CONTAINER_WORKDIR || path.join(process.cwd(), "workspace"));
const DATA_PATH = path.join(DATA_ROOT, ".synthia", "verse-commons.json");
const SESSION_DAYS = 60;
const COOKIE_NAME = "verse_explorer";
const counts = new Map<string, { start: number; count: number }>();
const newStore = (): Store => ({ explorers: [], sessions: [], posts: [], worldProgress: [] });

function readStore(): Store {
  try {
    const parsed = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
    if (Array.isArray(parsed.explorers) && Array.isArray(parsed.sessions) && Array.isArray(parsed.posts)) {
      // Existing deployed Commons stores predate world progress.
      return { ...parsed, worldProgress: Array.isArray(parsed.worldProgress) ? parsed.worldProgress : [] };
    }
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") console.warn("[verse-commons] storage read failed", err);
  }
  return newStore();
}
let store = readStore();

function saveStore() {
  fs.mkdirSync(path.dirname(DATA_PATH), { recursive: true });
  const tmp = DATA_PATH + "." + process.pid + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(store, null, 2), { mode: 0o600 });
  fs.renameSync(tmp, DATA_PATH);
}

function progressFor(explorerId: string): WorldProgress {
  let progress = store.worldProgress.find((item) => item.explorerId === explorerId);
  if (!progress) {
    progress = { explorerId, currentWorldId: null, visits: [], actions: [] };
    store.worldProgress.push(progress);
    saveStore();
  }
  return progress;
}

function digest(token: string) { return createHash("sha256").update(token).digest("hex"); }
function cookieValue(req: Request) {
  const raw = req.headers.cookie || "";
  const entry = raw.split(";").map((part) => part.trim()).find((part) => part.startsWith(COOKIE_NAME + "="));
  return entry ? entry.slice(COOKIE_NAME.length + 1) : "";
}
function sessionFor(req: Request, res: Response): Explorer {
  const now = Date.now();
  const token = cookieValue(req);
  const found = token && /^[a-f0-9]{64}$/.test(token) ? store.sessions.find((s) => s.hash === digest(token) && s.expiresAt > now) : null;
  const existing = found && store.explorers.find((u) => u.id === found.explorerId);
  if (existing) return existing;
  const id = randomUUID();
  const explorer: Explorer = { id, displayName: "Explorer " + id.slice(0, 4), joinedRoomIds: ["commons"], createdAt: new Date().toISOString() };
  const secret = randomBytes(32).toString("hex");
  store.explorers.push(explorer);
  store.sessions = store.sessions.filter((s) => s.expiresAt > now);
  store.sessions.push({ hash: digest(secret), explorerId: id, expiresAt: now + SESSION_DAYS * 86400_000 });
  saveStore();
  res.setHeader("Set-Cookie", COOKIE_NAME + "=" + secret + "; HttpOnly; SameSite=Strict; Path=/; Max-Age=" + SESSION_DAYS * 86400 + (req.secure ? "; Secure" : ""));
  return explorer;
}

function sameOrigin(req: Request) {
  const origin = req.get("origin");
  if (!origin) return true;
  try {
    const originUrl = new URL(origin);
    return originUrl.host === req.get("host");
  } catch { return false; }
}
function allowAction(key: string) {
  const now = Date.now();
  const rate = counts.get(key);
  if (!rate || now - rate.start > 60_000) {
    counts.set(key, { start: now, count: 1 });
    return true;
  }
  rate.count++;
  return rate.count <= 12;
}
function respondError(res: Response, error: unknown) {
  if (error instanceof z.ZodError) return res.status(400).json({ error: "Please check the entered values." });
  console.error("[verse-commons]", error);
  return res.status(500).json({ error: "Could not save community data." });
}
const profileInput = z.object({ displayName: z.string().trim().min(2).max(32).regex(/^[\p{L}\p{N} _.-]+$/u) });
const postInput = z.object({
  roomId: z.string().max(70),
  message: z.string().trim().min(1).max(2000),
  worldId: z.string().max(50).nullable().optional(),
});
const joinInput = z.object({ roomId: z.string().max(70) });
const worldEntryInput = z.object({ worldId: z.string().trim().min(1).max(64) });
const worldActionInput = z.object({
  worldId: z.string().trim().min(1).max(64),
  operation: z.string().trim().min(1).max(64),
  targetId: z.string().trim().min(1).max(128),
  interactionCount: z.number().int().min(0).max(10000000).optional(),
  localSaved: z.boolean().optional(),
});

export function registerVerseCommonsRoutes(app: Express) {
  app.get("/api/verse-commons/state", (req, res) => {
    try {
      const explorer = sessionFor(req, res);
      res.setHeader("Cache-Control", "no-store");
      res.json({
        me: explorer, worlds: VERSE_WORLDS, rooms: ROOMS, progress: progressFor(explorer.id),
        posts: store.posts.slice(0, 200).map((post) => ({
          ...post, author: store.explorers.find((e) => e.id === post.explorerId)?.displayName || "Explorer",
        })),
        scope: "Shared on this server; guest profiles are browser-specific. Not production-authenticated.",
      });
    } catch (error) { respondError(res, error); }
  });

  function guard(req: Request, res: Response) {
    if (!sameOrigin(req)) { res.status(403).json({ error: "Cross-origin write rejected." }); return null; }
    const explorer = sessionFor(req, res);
    if (!allowAction(explorer.id)) { res.status(429).json({ error: "Please try again shortly." }); return null; }
    return explorer;
  }

  app.post("/api/verse-commons/profile", (req, res) => {
    try {
      const explorer = guard(req, res); if (!explorer) return;
      const input = profileInput.parse(req.body);
      explorer.displayName = input.displayName;
      saveStore();
      res.json({ me: explorer });
    } catch (error) { respondError(res, error); }
  });

  app.post("/api/verse-commons/join", (req, res) => {
    try {
      const explorer = guard(req, res); if (!explorer) return;
      const { roomId } = joinInput.parse(req.body);
      if (!ROOMS.some((r) => r.id === roomId)) return res.status(404).json({ error: "Unknown room." });
      if (!explorer.joinedRoomIds.includes(roomId)) explorer.joinedRoomIds.push(roomId);
      saveStore();
      publishMeshEvent({ source: "verse-commons", type: "social.room.joined", topic: "social:" + roomId, payload: { explorerId: explorer.id, roomId } });
      res.json({ me: explorer });
    } catch (error) { respondError(res, error); }
  });

  app.post("/api/verse-commons/posts", (req, res) => {
    try {
      const explorer = guard(req, res); if (!explorer) return;
      const { roomId, message, worldId = null } = postInput.parse(req.body);
      if (!ROOMS.some((r) => r.id === roomId)) return res.status(404).json({ error: "Unknown room." });
      if (worldId && !VERSE_WORLDS.some((w) => w.id === worldId)) return res.status(400).json({ error: "Unknown world." });
      if (!explorer.joinedRoomIds.includes(roomId)) return res.status(403).json({ error: "Join this room before posting." });
      const post: Post = { id: randomUUID(), explorerId: explorer.id, roomId, worldId, message, createdAt: new Date().toISOString() };
      store.posts.unshift(post);
      store.posts = store.posts.slice(0, 400);
      saveStore();
      // Event payload deliberately excludes post text.
      publishMeshEvent({ source: "verse-commons", type: "social.post.created", topic: "social:" + roomId, payload: { postId: post.id, explorerId: explorer.id, roomId, worldId } });
      res.status(201).json({ post: { ...post, author: explorer.displayName } });
    } catch (error) { respondError(res, error); }
  });

  // The same guest identity now retains visits across world routes.
  // A six-line shape is a scenario proposal, not a verified engine effect.
  app.post("/api/verse-commons/world/enter", (req, res) => {
    try {
      const explorer = guard(req, res); if (!explorer) return;
      const { worldId } = worldEntryInput.parse(req.body);
      const world = VERSE_WORLDS.find((candidate) => candidate.id === worldId);
      if (!world) return res.status(404).json({ error: "Unknown world." });
      if (world.status === "starter-only") return res.status(409).json({ error: "This world is source-only, not playable." });
      const progress = progressFor(explorer.id);
      const visitNumber = progress.visits.filter((visit) => visit.worldId === worldId).length + 1;
      const visit: WorldVisit = {
        id: randomUUID(), worldId, fromWorldId: progress.currentWorldId,
        enteredAt: new Date().toISOString(), visitNumber,
        shape: shapeWorld(explorer.id, worldId, visitNumber),
      };
      progress.currentWorldId = worldId;
      progress.visits.unshift(visit);
      progress.visits = progress.visits.slice(0, 100);
      saveStore();
      publishMeshEvent({ source: "verse-commons", type: "world.visit.recorded", topic: "world:" + worldId,
        payload: { explorerId: explorer.id, worldId, visitId: visit.id, visitNumber } });
      res.status(201).json({ visit, progress });
    } catch (error) { respondError(res, error); }
  });

  // Runtime receipts are explicitly labeled client-reported: no scores,
  // virtual currency or authoritative game-state claims are inferred.
  app.post("/api/verse-commons/world/record", (req, res) => {
    try {
      const explorer = guard(req, res); if (!explorer) return;
      const input = worldActionInput.parse(req.body);
      if (!VERSE_WORLDS.some((world) => world.id === input.worldId)) {
        return res.status(404).json({ error: "Unknown world." });
      }
      const progress = progressFor(explorer.id);
      if (progress.currentWorldId !== input.worldId) {
        return res.status(409).json({ error: "Enter the world before recording its events." });
      }
      const action: WorldAction = {
        id: randomUUID(), worldId: input.worldId, operation: input.operation,
        targetId: input.targetId, occurredAt: new Date().toISOString(),
        source: "client-reported", interactionCount: input.interactionCount,
        localSaved: input.localSaved,
      };
      progress.actions.unshift(action);
      progress.actions = progress.actions.slice(0, 200);
      saveStore();
      publishMeshEvent({ source: "verse-commons", type: "world.action.reported", topic: "world:" + input.worldId,
        payload: { explorerId: explorer.id, actionId: action.id, worldId: input.worldId } });
      res.status(201).json({ action });
    } catch (error) { respondError(res, error); }
  });

}
