/**
 * Audits the *actual compiled Android APK* against the official SynthAi2
 * computer's runtime contracts. It never infers that a backend is functioning
 * merely because a React screen, API client or package name is present.
 *
 * Usage: node scripts/audit-computer-apk.mjs [apk] [report.json]
 *        node scripts/audit-computer-apk.mjs [apk] [report.json] --require-complete
 *
 * The normal Android workflow may ship a clearly labelled INCOMPLETE PREVIEW
 * with a report. --require-complete is the release gate: it will reject a
 * web-shell package until every native backend and the on-device acceptance
 * proof are actually available.
 */
import fs from "node:fs";
import path from "node:path";
import JSZip from "jszip";

export function inspectApkEntries(entries, opts={}) {
  const files=new Set(entries);
  const has=name=>files.has(name);
  const any=predicate=>[...files].some(predicate);
  const pieces=[
    {id:"frontend",label:"SynthAi2 screens and local JavaScript",proof:["assets/public/index.html"],required:true,kind:"static"},
    {id:"simlish-world",label:"Simlish executable world assets",proof:["assets/public/simlish/world.html","assets/public/simlish/world-session.mjs"],required:true,kind:"static"},
    {id:"simlish-3d",label:"Real original 2D-to-3D conversion source and rig",proof:[
      "assets/public/simlish/photo-3d.mjs",
      "assets/public/simlish/full-avatar.mjs",
      "assets/public/simlish/vendor/mhr/body-lod4.glb",
      "assets/public/simlish/synthai2-3d-world.mjs",
    ],required:true,kind:"static"},
    {id:"local-express",label:"Working local Express API process",proof:["assets/server/index.js"],required:true,kind:"runtime"},
    {id:"synthia-node",label:"Working Synthia Node/MCP/Mesh process",proof:["assets/synthia-server/server/lite.js"],required:true,kind:"runtime"},
    {id:"synthia-python",label:"Working Synthia Python service",proof:["assets/synthia-server/trident/mcp_server.py"],required:true,kind:"runtime"},
    {id:"terminal",label:"Live native/container command execution",proof:[],required:true,kind:"runtime"},
    {id:"apps-and-gamepacks",label:"Mounted, runnable game packs and app store",proof:[],required:true,kind:"runtime"},
    {id:"local-ai",label:"Usable locally resident AI backend",proof:[],required:true,kind:"runtime"},
  ];
  const components=pieces.map(item=>{
    const found=item.proof.filter(has),missing=item.proof.filter(p=>!has(p));
    // A file's presence cannot establish that a process or tool really runs.
    const status=item.kind==="static"?(missing.length?"incomplete":"included"):
      missing.length?"not_packaged":"not_runtime_verified";
    return {id:item.id,label:item.label,status,required:item.required,kind:item.kind,found,missing,
      proofKind:item.kind==="static"?"APK file paths":"Requires on-device execution proof"};
  });
  const mobileNativeNode=any(f=>/^lib\/[^/]+\/libnode(?:\.so|-\S+\.so)$/.test(f)
    || /^assets\/(?:runtime|bin)\/(?:node|nodejs)$/.test(f));
  const mobilePython=any(f=>/^lib\/[^/]+\/libpython\S*\.so$/.test(f)
    || /^assets\/(?:runtime|bin)\/python3?$/.test(f));
  const localModel=any(f=>/\.(gguf|safetensors|onnx)$/i.test(f));
  const gamePack=any(f=>/^assets\/public\/(?:game-packs|workspace\/game-packs)\//.test(f));
  const javaLauncher=any(f=>/^classes\d*\.dex$/.test(f));
  const sourceWebAssets=any(f=>f.startsWith("assets/public/"));
  const serverIncluded=has("assets/index.js")||has("assets/server/index.js")||has("assets/dist/index.js");
  const observations={
    mobileNativeNode,
    mobilePython,
    localModelFilesFound:localModel,
    gamePackFilesFound:gamePack,
    androidCodePresent:javaLauncher,
    webAssetsPresent:sourceWebAssets,
    expressServerEntryIncluded:serverIncluded,
    fullMobileNativeRuntimeProved:false,
    physicalDeviceE2eVerified:false,
    notes:[
      "The Express entrypoint built to dist/index.js is outside Capacitor webDir dist/public.",
      "An API frontend does not prove a server listens on the device-local origin.",
      "A terminal command input is not a real shell unless a verified executor responds.",
      "An AI backend selector or model filename is not evidence of successful local inference.",
      "Runtime services, model inference and app execution require device-level tests; no proof is inferred from file size.",
    ],
  };
  const staticReady=components.filter(p=>p.kind==="static").every(p=>p.status==="included");
  const excluded=components.filter(p=>p.required&&p.status!=="included").map(p=>p.id);
  return {
    schema:"synthai2.computer-apk-completeness.v1",
    target:"existing justappgrabbin/Synthai2 official computer",
    classification:"incomplete_webview_preview",
    fullComputerReady:false,
    staticFrontendReady:staticReady,
    evidence:"compiled APK entries plus original server and client API contracts",
    components,observations,missingOrUnverified:excluded,
    interpretation:"This APK must not be described, released or advertised as the complete autonomous offline SynthAi2 computer.",
  };
}

export async function auditApk(apkPath) {
  const buffer=fs.readFileSync(apkPath);
  const archive=await JSZip.loadAsync(buffer,{checkCRC32:false});
  const paths=Object.keys(archive.files).filter(p=>!archive.files[p].dir);
  const report=inspectApkEntries(paths);
  report.apk={name:path.basename(apkPath),bytes:buffer.byteLength,entryCount:paths.length};
  return report;
}

const invoked=process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname);
if(invoked){
  const [apk="android/app/build/outputs/apk/debug/app-debug.apk",output="artifacts/full-computer-apk-audit.json"]=
    process.argv.slice(2).filter(a=>!a.startsWith("--"));
  const strict=process.argv.includes("--require-complete");
  try{
    const report=await auditApk(apk);
    fs.mkdirSync(path.dirname(output),{recursive:true});
    fs.writeFileSync(output,JSON.stringify(report,null,2)+"\n");
    console.log("SynthAi2 APK AUDIT: "+(report.fullComputerReady?"FULL COMPUTER VERIFIED":"INCOMPLETE WEBSITE/WEBVIEW PREVIEW"));
    console.log("Included: "+report.components.filter(p=>p.status==="included").map(p=>p.id).join(", "));
    console.log("Missing/unverified: "+report.missingOrUnverified.join(", "));
    console.log("Proof report: "+output);
    // Do not let a stripped front end pass even the preview lane.
    if(!report.staticFrontendReady || (strict&&!report.fullComputerReady))process.exitCode=1;
  }catch(error){
    console.error("Unable to audit APK: "+error.message);
    process.exitCode=1;
  }
}
