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

fs.rmSync(DEST, { force:true, recursive:true });
fs.cpSync(world,DEST,{recursive:true});
const provider = path.join(morph,"morph-provider.mjs");
assert(fs.existsSync(provider),"Original Simlish morph provider is absent");
fs.copyFileSync(provider,path.join(DEST,"morph-provider.mjs"));
fs.copyFileSync(path.join(morph,"morph-provider.test.mjs"),path.join(DEST,"morph-provider.test.mjs"));

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
fs.writeFileSync(worldUi,ui);

const htmlPath=path.join(DEST,"world.html");
let html=fs.readFileSync(htmlPath,"utf8");
assert(html.includes('<script type="module" src="world-ui.mjs"></script>'),"Simlish world loader changed");
html=html.replace("</body>",'<script type="module" src="synthai2-bridge.mjs"></script></body>');
fs.writeFileSync(htmlPath,html);
fs.copyFileSync(path.join(ROOT,"integrations/simlish/synthai2-bridge.mjs"),path.join(DEST,"synthai2-bridge.mjs"));

const required = [
  "world.html","world-ui.mjs","world-session.mjs","world-canvas.mjs",
  "formation-spine.mjs","swarm/world.mjs","vendor/kernel.js",
  "vendor/world-bridge.js","vendor/mesh-assembly.js","vendor/sim-core.js",
  "vendor/klein/index.mjs","index.html","studio.mjs","project-store.mjs",
  "photo-morph.mjs","morph-provider.mjs","vendor/vision/face_landmarker.task",
  "vendor/vision/wasm/vision_wasm_internal.wasm",
];
for (const file of required) assert(fs.existsSync(path.join(DEST,file)), "Simlish staged file missing: "+file);
fs.writeFileSync(path.join(DEST,"source-manifest.json"),JSON.stringify({
  source:"justappgrabbin/Simlish", worldCommit:PIN.world, morphCommit:PIN.morph,
  mode:"live-world plus original local 2D morph provider",
  characterImageTransfer:"device local only", body3dReady:false,
},null,2));
console.log("Staged original Simlish world and portrait provider into SynthAi2 assets. Worlds and Morph pinned.");
