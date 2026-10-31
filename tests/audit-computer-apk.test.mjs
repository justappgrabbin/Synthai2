import test from "node:test";
import assert from "node:assert/strict";
import { inspectApkEntries } from "../scripts/audit-computer-apk.mjs";
const surface=[
  "assets/public/index.html",
  "assets/public/simlish/world.html",
  "assets/public/simlish/world-session.mjs",
  "assets/public/simlish/photo-3d.mjs",
  "assets/public/simlish/full-avatar.mjs",
  "assets/public/simlish/vendor/mhr/body-lod4.glb",
  "assets/public/simlish/synthai2-3d-world.mjs",
  "classes.dex",
];
test("a verified 3D web bundle is never called a complete computer",()=>{
  const report=inspectApkEntries(surface);
  assert.equal(report.staticFrontendReady,true);
  assert.equal(report.fullComputerReady,false);
  assert.equal(report.classification,"incomplete_webview_preview");
  assert.equal(report.components.find(x=>x.id==="simlish-3d").status,"included");
  assert.equal(report.components.find(x=>x.id==="local-express").status,"not_packaged");
  for(const name of ["terminal","synthia-node","synthia-python","apps-and-gamepacks","local-ai"])
    assert.ok(report.missingOrUnverified.includes(name),name);
});
test("missing 3D body mesh makes even a preview invalid",()=>{
  const report=inspectApkEntries(surface.filter(p=>!p.endsWith("body-lod4.glb")));
  assert.equal(report.staticFrontendReady,false);
  assert.equal(report.components.find(x=>x.id==="simlish-3d").status,"incomplete");
});
test("inserting model files or Node binaries does not claim that services run",()=>{
  const report=inspectApkEntries([...surface,
    "lib/arm64-v8a/libnode.so",
    "assets/public/models/assistant.gguf",
    "assets/server/index.js",
    "assets/synthia-server/server/lite.js",
    "assets/synthia-server/trident/mcp_server.py",
  ]);
  assert.equal(report.observations.mobileNativeNode,true);
  assert.equal(report.observations.localModelFilesFound,true);
  assert.equal(report.components.find(x=>x.id==="local-express").status,"not_runtime_verified");
  assert.equal(report.fullComputerReady,false);
});
test("empty/website-only APK cannot masquerade as working hardware",()=>{
  const report=inspectApkEntries(["assets/public/index.html","classes.dex"]);
  assert.equal(report.staticFrontendReady,false);
  assert.ok(report.missingOrUnverified.includes("simlish-world"));
  assert.ok(report.missingOrUnverified.includes("simlish-3d"));
});
