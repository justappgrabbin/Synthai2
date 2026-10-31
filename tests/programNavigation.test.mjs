import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { PROGRAMS, PROGRAM_GROUPS, programAt, programsIn, includeNewPrograms } from "../client/src/lib/programNavigation.ts";

const originalRoutes = ["/grove-store", "/ide", "/game-creator", "/gan-trainer", "/mod-manager", "/autonomy", "/calibration-tank", "/universe-creator", "/ingest", "/mesh", "/novel", "/settings", "/zip-manager", "/player", "/agents", "/presentation-planner", "/continuity-glyph", "/human-design", "/simlish-world", "/synthia"];
const router = fs.readFileSync(new URL("../client/src/App.tsx", import.meta.url), "utf8");
const registeredRoutes = [...router.matchAll(/<Route path="([^"]+)"/g)].map(match => match[1]);

test("every original program still has its route and an organized navigation entry", () => {
  for (const path of originalRoutes) {
    assert.ok(registeredRoutes.includes(path), `original route lost: ${path}`);
    assert.ok(PROGRAMS.some(program => program.path === path), `program not discoverable: ${path}`);
  }
  for (const program of PROGRAMS) {
    assert.ok(registeredRoutes.includes(program.path.split("?")[0]), `unregistered destination: ${program.path}`);
    assert.ok(PROGRAM_GROUPS.some(group => group.id === program.group));
  }
  for (const group of PROGRAM_GROUPS) assert.ok(registeredRoutes.includes(group.path));
});

test("Worlds opens the existing world and preserves access to original creation programs", () => {
  assert.match(router, /<Route path="\/worlds" component=\{SimlishWorld\}/);
  for (const path of ["/simlish-world", "/simlish-world?studio=1", "/universe-creator", "/game-creator", "/player", "/agent-world", "/mesh", "/human-design", "/agents"]) {
    assert.ok(programsIn("worlds").some(program => program.path === path), path);
  }
});

test("Character Studio selection follows query parameters and browser navigation", () => {
  assert.equal(programAt("/simlish-world?from=worlds&studio=1").label, "Character Studio");
  assert.equal(programAt("/simlish-world?studio=0").label, "Simlish World");
  assert.equal(programAt("/worlds").label, "Simlish World");
  assert.equal(programAt("/worlds?studio=1").label, "Character Studio");
  assert.equal(programAt("/mesh?studio=1").group, "morph");
  assert.equal(programAt("/unregistered"), undefined);
});

test("new tray programs preserve the user's existing order, including hidden entries", () => {
  const saved = ["agent", "games", "ide", "legacy-app"];
  const result = includeNewPrograms(saved, ["worlds", "ide", "games", "agent", "programs"]);
  assert.deepEqual(result, ["agent", "games", "ide", "legacy-app", "worlds", "programs"]);
  assert.deepEqual(includeNewPrograms(result, ["worlds", "ide", "games", "agent", "programs"]), result);
  assert.deepEqual(saved, ["agent", "games", "ide", "legacy-app"]);
});
