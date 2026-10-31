import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import express from "express";
import { shapeWorld } from "../server/lib/ichingWorldShaper";

test("six-line world shape is reproducible, changes only the stated lines, and is not a Gate", () => {
  const first = shapeWorld("explorer-a", "simlish", 1);
  assert.deepEqual(first, shapeWorld("explorer-a", "simlish", 1));
  assert.equal(first.version, "six-lines-v1");
  assert.equal(first.primaryLines.length, 6);
  assert.equal(first.relatingLines.length, 6);
  assert.ok(first.changingLines.length >= 1 && first.changingLines.length <= 2);
  assert.deepEqual([...first.changingLines].sort((a, b) => a - b), first.changingLines);
  for (const [index, primary] of first.primaryLines.entries()) {
    assert.ok(primary === 0 || primary === 1);
    const expected = first.changingLines.includes(index + 1) ? 1 - primary : primary;
    assert.equal(first.relatingLines[index], expected);
  }
  const revisited = shapeWorld("explorer-a", "simlish", 2);
  assert.deepEqual(revisited.primaryLines, first.primaryLines);
  assert.equal(Object.hasOwn(first, "gate"), false);
});

test("world entry and original-runtime receipts survive route navigation and disk save", async () => {
  const root = mkdtempSync(path.join(tmpdir(), "synthia-world-continuity-"));
  process.env.MESH_DATA_DIR = root;
  const { registerVerseCommonsRoutes } = await import("../server/lib/verseCommonsService");
  const app = express();
  app.use(express.json({ limit: "16kb" }));
  registerVerseCommonsRoutes(app);
  const server = app.listen(0);
  try {
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("Missing test port");
    const base = "http://127.0.0.1:" + address.port;
    const first = await fetch(base + "/api/verse-commons/state");
    assert.equal(first.status, 200);
    const cookie = (first.headers.get("set-cookie") || "").split(";")[0];
    const initial = await first.json();
    assert.equal(initial.progress.currentWorldId, null);

    const write = (pathSuffix: string, body: object, extra: Record<string, string> = {}) =>
      fetch(base + "/api/verse-commons/" + pathSuffix, {
        method: "POST",
        headers: { Cookie: cookie, "Content-Type": "application/json", ...extra },
        body: JSON.stringify(body),
      });

    assert.equal((await write("world/record", { worldId: "simlish", operation: "move", targetId: "object-1" })).status, 409);
    assert.equal((await write("world/enter", { worldId: "unknown" })).status, 404);
    const enter = await write("world/enter", { worldId: "simlish" });
    assert.equal(enter.status, 201);
    const entry = await enter.json();
    assert.equal(entry.visit.worldId, "simlish");
    assert.equal(entry.visit.visitNumber, 1);
    assert.equal(entry.visit.shape.primaryLines.length, 6);

    const action = await write("world/record", {
      worldId: "simlish", operation: "move", targetId: "object-1", interactionCount: 1, localSaved: true,
    });
    assert.equal(action.status, 201);
    const actionResult = await action.json();
    assert.equal(actionResult.action.source, "client-reported");

    const portal = await write("world/enter", { worldId: "platformer" });
    assert.equal(portal.status, 201);
    const back = await write("world/enter", { worldId: "simlish" });
    assert.equal(back.status, 201);
    const next = await back.json();
    assert.equal(next.visit.visitNumber, 2);
    assert.deepEqual(next.visit.shape.primaryLines, entry.visit.shape.primaryLines);

    const resumed = await fetch(base + "/api/verse-commons/state", { headers: { Cookie: cookie } });
    const state = await resumed.json();
    assert.equal(state.me.id, initial.me.id);
    assert.equal(state.progress.currentWorldId, "simlish");
    assert.equal(state.progress.visits.length, 3);
    assert.equal(state.progress.actions.length, 1);
    assert.equal(state.progress.actions[0].targetId, "object-1");

    const disk = JSON.parse(readFileSync(path.join(root, ".synthia", "verse-commons.json"), "utf8"));
    const persisted = disk.worldProgress.find((p: { explorerId: string }) => p.explorerId === initial.me.id);
    assert.equal(persisted.currentWorldId, "simlish");
    assert.equal(persisted.actions[0].source, "client-reported");
    assert.equal(persisted.visits.length, 3);
    const rejected = await write("world/enter", { worldId: "puzzle" }, { Origin: "https://invalid.example" });
    assert.equal(rejected.status, 403);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    rmSync(root, { recursive: true, force: true });
  }
});
