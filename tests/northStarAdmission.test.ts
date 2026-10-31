import test from "node:test";
import assert from "node:assert/strict";
import { ONTOLOGY_FIELDS, validateEntity, validatePosition } from "../server/lib/northStarRoutes";

const address = {
  planetary: "Sun", dimension: "Being", gate: 13, line: 2, color: 4, tone: 3, base: 2,
  degree: 25, minute: 59, second: 31.92, arc: "source:coordinate-13", zodiac: "Virgo", house: 5
};
test("canonical intake preserves all thirteen user-defined fields in order", () => {
  assert.equal(ONTOLOGY_FIELDS.length, 13);
  assert.deepEqual(ONTOLOGY_FIELDS, ["planetary","dimension","gate","line","color","tone","base","degree","minute","second","arc","zodiac","house"]);
  const result = validatePosition(address);
  assert.equal(result.ok, true);
  if (result.ok) assert.deepEqual(result.address, address);
});
test("missing coordinates cannot be silently filled in", () => {
  const { planetary, ...incomplete } = address;
  const result = validatePosition(incomplete);
  assert.equal(result.ok, false);
  if (!result.ok) assert.match(result.error, /planetary/);
});
test("unknown coordinates are rejected, not guessed from a filename or content hash", () => {
  const result = validateEntity({ kind: "thing", ref: "thing/1", name: "Unresolved", source: "uploaded file" });
  assert.equal(result.ok, false);
});
test("every admitted entity kind needs provenance and a complete position", () => {
  for (const kind of ["person","place","thing","app","tool","file","agent","world","project"]) {
    const result = validateEntity({kind,name:"Example",ref:kind+"/example",source:"test-fixture",address});
    assert.equal(result.ok, true, kind);
  }
  assert.equal(validateEntity({kind:"person",name:"Example",ref:"x",address}).ok, false);
});
test("coordinates cannot be out of range or lack an arc", () => {
  assert.equal(validatePosition({...address,gate:0}).ok, false);
  assert.equal(validatePosition({...address,house:13}).ok, false);
  assert.equal(validatePosition({...address,arc:""}).ok, false);
  assert.equal(validatePosition({...address,dimension:"Guess"}).ok, false);
});
test("no implicit conversion of the agreed arc field to arcAxis", () => {
  const {arc, ...old} = address;
  assert.equal(validatePosition({...old,arcAxis:{axis:"1",arcUnit:1}}).ok,false);
});
