import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import express from "express";

test("Verse Commons has real rooms, persistent posts, and world links", async () => {
  const root = mkdtempSync(path.join(tmpdir(), "verse-commons-"));
  process.env.MESH_DATA_DIR = root;
  const { registerVerseCommonsRoutes } = await import("../server/lib/verseCommonsService");
  const app = express();
  app.use(express.json({ limit: "16kb" }));
  registerVerseCommonsRoutes(app);
  const server = app.listen(0);
  try {
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("Missing port");
    const base = "http://127.0.0.1:" + address.port;
    const stateResponse = await fetch(base + "/api/verse-commons/state");
    assert.equal(stateResponse.status, 200);
    const cookie = (stateResponse.headers.get("set-cookie") || "").split(";")[0];
    assert.match(cookie, /^verse_explorer=[a-f0-9]{64}$/);
    const state = await stateResponse.json();
    assert.ok(state.worlds.some((world: {id: string}) => world.id === "platformer"));
    assert.ok(state.worlds.some((world: {id: string}) => world.id === "simlish"));
    assert.ok(state.rooms.some((room: {id: string}) => room.id === "world:platformer"));
    const write = (route: string, data: object, extra: Record<string, string> = {}) => fetch(base + route, {
      method: "POST", headers: { Cookie: cookie, "Content-Type": "application/json", ...extra }, body: JSON.stringify(data),
    });
    const rejected = await write("/api/verse-commons/posts", { roomId: "world:platformer", message: "Not joined" });
    assert.equal(rejected.status, 403);
    const join = await write("/api/verse-commons/join", { roomId: "world:platformer" });
    assert.equal(join.status, 200);
    const posted = await write("/api/verse-commons/posts", {
      roomId: "world:platformer", worldId: "puzzle", message: "Visit Puzzle Game through this world",
    });
    assert.equal(posted.status, 201);
    const crossOrigin = await write("/api/verse-commons/posts", {
      roomId: "commons", message: "Not permitted",
    }, { Origin: "https://invalid.example" });
    assert.equal(crossOrigin.status, 403);
    const refreshed = await fetch(base + "/api/verse-commons/state", { headers: { Cookie: cookie } });
    const newState = await refreshed.json();
    assert.equal(newState.me.id, state.me.id);
    assert.equal(newState.posts[0].worldId, "puzzle");
    assert.equal(newState.posts[0].message, "Visit Puzzle Game through this world");
    const persisted = JSON.parse(readFileSync(path.join(root, ".synthia", "verse-commons.json"), "utf8"));
    assert.equal(persisted.posts[0].worldId, "puzzle");
    assert.equal(persisted.posts.length, 1);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    rmSync(root, { recursive: true, force: true });
  }
});
