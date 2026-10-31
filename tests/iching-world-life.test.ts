import test from "node:test";
import assert from "node:assert/strict";
import { shapeSituation, TRIGRAMS } from "../client/src/lib/ichingWorldShaper";
import { beginSimlishLife, readWorldLife, completeSimlishLife } from "../client/src/lib/worldLife";

const store = new Map<string, string>();
Object.defineProperty(globalThis, "localStorage", {
  configurable: true,
  value: {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => { store.set(key, value); },
    removeItem: (key: string) => { store.delete(key); },
  },
});

const verified = {
  mode: "Mission",
  operation: "transform",
  targetId: "chair",
  changed: true,
  saved: true,
  interactionCount: 1,
  formationRevision: 1,
  completed: true,
} as const;

test("all eight I Ching trigrams use canonical bottom-to-top lines", () => {
  assert.deepEqual(Object.keys(TRIGRAMS).sort(), ["000", "001", "010", "011", "100", "101", "110", "111"]);
  assert.equal(TRIGRAMS["100"].nature, "Thunder");
  assert.equal(TRIGRAMS["010"].nature, "Water");
  assert.equal(TRIGRAMS["101"].nature, "Fire");
});

test("I Ching shaper is deterministic and changes exactly one of six lines", () => {
  const first = shapeSituation("cynthia:chapter-1");
  assert.deepEqual(first, shapeSituation("cynthia:chapter-1"));
  assert.equal(first.lines.length, 6);
  assert.ok(first.changingLine >= 1 && first.changingLine <= 6);
  assert.equal(first.lines.filter((bit, i) => bit !== first.changedLines[i]).length, 1);
  assert.equal(first.lower.key, first.lines.slice(0, 3).join(""));
  assert.equal(first.upper.key, first.lines.slice(3).join(""));
  assert.equal(first.relatingLower.key, first.changedLines.slice(0, 3).join(""));
  assert.equal(first.relatingUpper.key, first.changedLines.slice(3).join(""));
  assert.throws(() => shapeSituation(" "));
});

test("life does not advance without a verified real Simlish mission", () => {
  const id = "test-player-one";
  const started = beginSimlishLife(id);
  assert.ok(started);
  assert.equal(beginSimlishLife(id)?.id, started.id);
  const invalid = [
    { ...verified, mode: "Play" },
    { ...verified, targetId: "plant" },
    { ...verified, saved: false },
    { ...verified, changed: false },
    { ...verified, completed: false },
    { ...verified, operation: "duplicate" },
  ];
  for (const receipt of invalid) {
    assert.equal(completeSimlishLife(id, receipt), null);
    assert.equal(readWorldLife(id).chapters.length, 0);
  }
  const finished = completeSimlishLife(id, verified);
  assert.ok(finished?.completedAt);
  assert.equal(finished?.outcome?.missionCompleted, true);
  assert.equal(readWorldLife(id).active, null);
  assert.equal(readWorldLife(id).chapters.length, 1);
  assert.equal(completeSimlishLife(id, verified), null, "duplicate receipt cannot award another chapter");
  const next = beginSimlishLife(id);
  assert.notEqual(next?.seed, started?.seed);
  assert.equal(readWorldLife("other-player").chapters.length, 0);
});
