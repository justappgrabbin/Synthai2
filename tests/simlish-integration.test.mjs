import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const read = p => fs.readFileSync(p,"utf8");
const dir="client/public/simlish/";
const manifest=JSON.parse(read(dir+"source-manifest.json"));
const world=read(dir+"world-ui.mjs");
const html=read(dir+"world.html");
const bridge=read(dir+"synthai2-bridge.mjs");
const portal=read("client/src/pages/SimlishWorld.tsx");
test("real Simlish commits are pinned, not placeholders",()=>{
 assert.equal(manifest.worldCommit,"8cc989edd7895192f8edd834f834084f622a9ab0");
 assert.equal(manifest.morphCommit,"757a86dc3b92b7e6808b16a39c2b8ef1c7a2775a");
 assert.ok(fs.existsSync(dir+"swarm/world.mjs"));
 assert.ok(fs.existsSync(dir+"formation-spine.mjs"));
 assert.ok(fs.existsSync(dir+"vendor/klein/index.mjs"));
 assert.ok(fs.statSync(dir+"vendor/vision/wasm/vision_wasm_internal.wasm").size>100000);
});
test("real interactive world, original studio and character provider are bundled",()=>{
 assert.match(world,/new WorldSession/);
 assert.match(world,/session\.perform/);
 assert.match(world,/synthai2:simlish-world-operation/);
 assert.match(html,/liveWorld/);
 assert.match(html,/synthai2-bridge\.mjs/);
 assert.match(read(dir+"index.html"),/studio\.mjs/);
 assert.match(read(dir+"morph-provider.mjs"),/createSimlishMorphProvider/);
});
test("cross-frame event includes only real world receipts; photo access is consented",()=>{
 assert.match(bridge,/d\.changed !== true/);
 assert.match(bridge,/event\.origin !== sameOrigin/);
 assert.match(bridge,/reuseSavedPortrait:true/);
 assert.doesNotMatch(bridge,/postMessage\([^\n]*dataUrl/);
 assert.match(portal,/event\.source !== frame\.current\?\.contentWindow/);
 assert.match(portal,/publishMeshEvent/);
 assert.match(portal,/simlish-world\/source-manifest\.json/);
});
