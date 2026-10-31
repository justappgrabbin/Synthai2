/**
 * Stage the user's original Simlish sources into SynthAi2's Vite assets.
 * Build fails rather than silently substituting a demo or missing runtime.
 */
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execFileSync } from "node:child_process";

const PIN = Object.freeze({
  world: "8cc989edd7895192f8edd834f834084f622a9ab0",
  morph: "757a86dc3b92b7e6808b16a39c2b8ef1c7a2775a",
  avatar3d: "6dca1915e15a34bc39593214bb4a9494221075af",
});
const URL = "https://github.com/justappgrabbin/Simlish.git";
const ROOT = process.cwd();
const DEST = path.join(ROOT, "client/public/simlish");
const tempRoot = path.join(os.tmpdir(), "synthai2-pinned-simlish");
function assert(condition, why) { if (!condition) throw new Error(why); }
function stageSource(name, override) {
  const provided = override && path.resolve(override);
  const source = provided || path.join(tempRoot, name);
  if (!provided) {
    fs.mkdirSync(tempRoot, { recursive: true });
    if (!fs.existsSync(path.join(source, ".git"))) {
      execFileSync("git", ["clone", "--no-checkout", "--filter=blob:none", URL, source], { stdio:"inherit" });
    }
    execFileSync("git", ["-C", source, "fetch", "--depth=1", "origin", PIN[name]], { stdio:"inherit" });
    execFileSync("git", ["-C", source, "checkout", "--force", "--detach", PIN[name]], { stdio:"inherit" });
  }
  const actual = execFileSync("git", ["-C", source, "rev-parse", "HEAD"], { encoding:"utf8" }).trim();
  assert(actual === PIN[name], name + " source mismatch: expected "+PIN[name]+" but got "+actual);
  assert(fs.existsSync(path.join(source,"you-n-i-verse/world.html")), name+" missing its own original world");
  return path.join(source,"you-n-i-verse");
}
const world = stageSource("world", process.env.SIMLISH_WORLD_SOURCE);
const morph = stageSource("morph", process.env.SIMLISH_MORPH_SOURCE);
const avatar3d = stageSource("avatar3d", process.env.SIMLISH_3D_SOURCE);

fs.rmSync(DEST, { force:true, recursive:true });
fs.cpSync(world,DEST,{recursive:true});
const provider = path.join(morph,"morph-provider.mjs");
assert(fs.existsSync(provider),"Original Simlish morph provider is absent");
fs.copyFileSync(provider,path.join(DEST,"morph-provider.mjs"));
fs.copyFileSync(path.join(morph,"morph-provider.test.mjs"),path.join(DEST,"morph-provider.test.mjs"));

// Restore the original Simlish 2D portrait -> 3D MHR body/face/rig implementation.
// Keep the LIVE Swarm/ATO world from PR #9, not the older demo world from PR #2.
const avatarFiles = [
  "index.html", "studio.mjs", "photo-morph.mjs", "project-store.mjs",
  "game-path.mjs", "scene-events.mjs", "rig.html", "rig.mjs",
  "FULL-CHARACTER.md", "PHOTO-3D.md", "MORPH-LIBRARY.md", "MORPH-SOURCES.md",
  "avatar-theme.mjs", "avatar-theme.test.mjs",
  "body-form.mjs", "body-form.test.mjs", "body-proportions.mjs",
  "full-avatar.mjs", "photo-3d.mjs", "photo-mesh.mjs", "photo-mesh.test.mjs",
  "photo-identity.mjs", "photo-identity.test.mjs",
  "model-client.mjs", "morph-geometry.mjs", "morph-geometry.test.mjs",
  "morph-library.mjs", "morph-library.test.mjs", "morph-project.test.mjs",
  "vendor/three/three.module.js", "vendor/three/GLTFLoader.js",
  "vendor/three/GLTFExporter.js", "vendor/three/TextureUtils.js",
  "vendor/three/BufferGeometryUtils.js", "vendor/three/LICENSE",
  "vendor/mhr/body-lod4.glb", "vendor/mhr/LICENSE", "vendor/mhr/README.md",
  "vendor/svmorph/LICENSE",
];
for (const file of avatarFiles) {
  const src=path.join(avatar3d,file),dest=path.join(DEST,file);
  assert(fs.existsSync(src),"Original 3D component missing: "+file);
  fs.mkdirSync(path.dirname(dest),{recursive:true});
  fs.copyFileSync(src,dest);
}
assert(fs.readFileSync(path.join(DEST,"studio.mjs"),"utf8").includes("mountPhoto3D"),"Studio did not retain 3D builder");
assert(fs.readFileSync(path.join(DEST,"photo-3d.mjs"),"utf8").includes("buildFullAvatar"),"3D body builder missing");


// PR #9 has the real live-world state. PR #12 has the original headless morph.
// Preserve both instead of replacing the live world with the old static scene.
const worldUi = path.join(DEST,"world-ui.mjs");
let ui = fs.readFileSync(worldUi,"utf8");
const marker = "    const saved=await save();\n    refresh();";
assert(ui.split(marker).length===2,"Simlish live-world receipt API changed; integration requires review");
const eventSource = [
  '    window.dispatchEvent(new CustomEvent("synthai2:simlish-world-operation", {',
  '      detail: {',
  '        mode: receipt.command.mode, operation: receipt.command.op,',
  '        targetId: receipt.command.targetId, changed: receipt.changed === true,',
  '        formationRevision: receipt.formationRevision, completed: receipt.completed,',
  '        saved,',
  '        activeObjects: session.snapshot().objects.filter(item=>!item.removed).length,',
  '        composites: session.snapshot().composites.length,',
  '        interactionCount: session.snapshot().interactions',
  '      }',
  '    }));',
].join("\n");
ui = ui.replace(marker, marker + "\n" + eventSource);
const snapshotMarker = "  drawWorld($('#liveWorld'),snapshot,{selected:$('#worldTarget').value});";
assert(ui.split(snapshotMarker).length===2,"Simlish snapshot source changed");
ui=ui.replace(snapshotMarker,snapshotMarker+"\n  window.dispatchEvent(new CustomEvent('simlish-world-snapshot',{detail:snapshot}));");
const bootMarker="setMode('Play');\nboot().catch";
assert(ui.includes(bootMarker),"Simlish world startup source changed");
ui=ui.replace(bootMarker,"window.addEventListener('simlish-world-snapshot-request',()=>refresh());\n"+bootMarker);

fs.writeFileSync(worldUi,ui);

const htmlPath=path.join(DEST,"world.html");
let html=fs.readFileSync(htmlPath,"utf8");
assert(html.includes('<script type="module" src="world-ui.mjs"></script>'),"Simlish world loader changed");

const viewMarker = '<canvas id="liveWorld" width="720" height="390" role="img" aria-label="Current Simlish simulation objects and their actual world state"></canvas>';
assert(html.includes(viewMarker),"Original world canvas changed");
html=html.replace(viewMarker,viewMarker+
'<section class="simlish-three-panel" aria-label="Rigged 3D Simlish world"><canvas id="simlish3DWorld" width="720" height="410" aria-label="Actual Simlish objects in interactive 3D"></canvas><p id="simlish3DStatus" role="status">Loading interactive 3D world and saved character…</p></section>');
html=html.replace("</body>",'<script type="module" src="synthai2-bridge.mjs"></script><script type="module" src="synthai2-3d-world.mjs"></script></body>');
fs.writeFileSync(htmlPath,html);
fs.copyFileSync(path.join(ROOT,"integrations/simlish/synthai2-bridge.mjs"),path.join(DEST,"synthai2-bridge.mjs"));
fs.copyFileSync(path.join(ROOT,"integrations/simlish/synthai2-3d-world.mjs"),path.join(DEST,"synthai2-3d-world.mjs"));

const required = [
  "world.html","world-ui.mjs","world-session.mjs","world-canvas.mjs",
  "formation-spine.mjs","swarm/world.mjs","vendor/kernel.js",
  "vendor/world-bridge.js","vendor/mesh-assembly.js","vendor/sim-core.js",
  "vendor/klein/index.mjs","index.html","studio.mjs","project-store.mjs",
  "photo-morph.mjs","morph-provider.mjs","vendor/vision/face_landmarker.task",
  "vendor/vision/wasm/vision_wasm_internal.wasm",
  "full-avatar.mjs","photo-3d.mjs","photo-mesh.mjs","body-form.mjs",
  "photo-identity.mjs","vendor/mhr/body-lod4.glb","vendor/three/GLTFExporter.js",
  "synthai2-3d-world.mjs",
];
for (const file of required) assert(fs.existsSync(path.join(DEST,file)), "Simlish staged file missing: "+file);
fs.writeFileSync(path.join(DEST,"source-manifest.json"),JSON.stringify({
  source:"justappgrabbin/Simlish", worldCommit:PIN.world, morphCommit:PIN.morph, avatar3dCommit:PIN.avatar3d,
  mode:"original live world, 2D Morph and rigged 3D character generation",
  characterImageTransfer:"device local only", body3dReady:true,
},null,2));
console.log("Staged original Simlish world, 2D Morph and photo-to-3D full-body rig.");
