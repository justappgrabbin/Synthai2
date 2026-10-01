#!/usr/bin/env node
/**
 * Synthia Autonomous Product Factory
 *
 * Contract:
 * - Never mutates the origin/main checkout directly.
 * - Works in an isolated copy.
 * - Persists only reviewer+verifier-approved text changes to the autobuilder branch.
 * - Continues through build, review, checker-check, APK release, monetization,
 *   creative/advertising preparation, then performs a second discovery sweep.
 * - Stops successfully only at QUIESCENT or at a genuine external human/credential gate.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";

const ROOT = process.cwd();
const STATE = path.join(ROOT, ".synthia-factory");
const WORK = path.join(STATE, "workspace");
const REPO = path.join(WORK, "repository");
const REPORT = path.join(STATE, "report.json");
const LEDGER = path.join(STATE, "ledger.jsonl");
const APPLY = path.join(STATE, "apply-manifest.json");
const MODEL = process.env.SYNTHIA_MODEL || "gpt-5.4";
const MAX_LOOPS = Math.max(1, Number(process.env.SYNTHIA_MAX_LOOPS || 6));

const SKIP = new Set([".git","node_modules",".synthia-factory",".synthai-builder","dist","build",".vite","coverage"]);
const FORBIDDEN_PREFIX = [".github/","tools/",".env","node_modules/","dist/","build/"];
const TEXT_EXT = new Set([".ts",".tsx",".js",".jsx",".mjs",".cjs",".json",".md",".html",".css",".scss",".py",".toml",".yml",".yaml",".txt",".xml",".gradle",".properties"]);

const ensure = p => fs.mkdirSync(p,{recursive:true});
const now = () => new Date().toISOString();
const hash = b => crypto.createHash("sha256").update(b).digest("hex");
const jread = (p,d=null) => { try{return JSON.parse(fs.readFileSync(p,"utf8"))}catch{return d} };
const jwrite = (p,v) => { ensure(path.dirname(p)); fs.writeFileSync(p, JSON.stringify(v,null,2)+"\n"); };
const emit = e => { ensure(STATE); fs.appendFileSync(LEDGER,JSON.stringify({at:now(),...e})+"\n"); };

function copyFiltered(src,dst){
  const st=fs.statSync(src);
  if(st.isDirectory()){
    ensure(dst);
    for(const name of fs.readdirSync(src)){
      if(SKIP.has(name)) continue;
      copyFiltered(path.join(src,name),path.join(dst,name));
    }
  } else {
    ensure(path.dirname(dst));
    fs.copyFileSync(src,dst);
  }
}

function freshWorkspace(){
  fs.rmSync(WORK,{recursive:true,force:true});
  ensure(WORK);
  copyFiltered(ROOT,REPO);
  emit({event:"WORKSPACE_CREATED",repo:REPO});
}

function walk(root,fn){
  if(!fs.existsSync(root)) return;
  for(const ent of fs.readdirSync(root,{withFileTypes:true})){
    if(SKIP.has(ent.name)) continue;
    const p=path.join(root,ent.name);
    if(ent.isDirectory()) walk(p,fn); else fn(p);
  }
}

function rel(p){ return path.relative(REPO,p).replaceAll("\\","/"); }

function discoverProjects(){
  const out=[];
  walk(REPO,p=>{
    if(path.basename(p)!=="package.json") return;
    const pkg=jread(p,{});
    if(pkg && typeof pkg==="object"){
      out.push({dir:path.dirname(p),path:rel(p),name:pkg.name||rel(path.dirname(p))||"root",scripts:pkg.scripts||{}});
    }
  });
  return out;
}

function run(cmd,args,cwd,timeout=20*60*1000){
  const t=Date.now();
  const r=spawnSync(cmd,args,{cwd,encoding:"utf8",timeout,env:{...process.env,CI:"true"}});
  const result={cmd:[cmd,...args],cwd:rel(cwd)||".",code:r.status,signal:r.signal,stdout:(r.stdout||"").slice(-30000),stderr:(r.stderr||"").slice(-30000),ms:Date.now()-t};
  emit({event:"EXECUTE",...result});
  return result;
}

function checkProject(p){
  const checks=[];
  const lock=fs.existsSync(path.join(p.dir,"package-lock.json"));
  checks.push(run("npm",[lock?"ci":"install","--no-audit","--no-fund"],p.dir));
  if(checks.at(-1).code!==0) return {project:p.name,dir:rel(p.dir)||".",ok:false,checks};
  for(const s of ["check","test","build"]){
    if(p.scripts[s]){
      const r=run("npm",["run",s],p.dir);
      checks.push(r);
      if(r.code!==0) break;
    }
  }
  return {project:p.name,dir:rel(p.dir)||".",ok:checks.every(x=>x.code===0),checks};
}

function runEngineeringSweep(){
  const projects=discoverProjects();
  const results=projects.map(checkProject);
  const ok=results.length>0 && results.every(x=>x.ok);
  emit({event:"ENGINEERING_SWEEP",ok,projects:results.map(x=>({project:x.project,dir:x.dir,ok:x.ok}))});
  return {ok,projects,results};
}

function failureDigest(sweep){
  const chunks=[];
  for(const r of sweep.results){
    for(const c of r.checks){
      if(c.code!==0) chunks.push(`PROJECT ${r.dir}\nCOMMAND ${c.cmd.join(" ")}\nSTDOUT\n${c.stdout}\nSTDERR\n${c.stderr}`);
    }
  }
  return chunks.join("\n\n").slice(-60000);
}

function likelyFilesFromLogs(text){
  const found=new Set();
  const re=/(?:^|[\s(])([A-Za-z0-9_./-]+\.(?:ts|tsx|js|jsx|mjs|cjs|json|css|html|py))(?::\d+(?::\d+)?)?/gm;
  for(const m of text.matchAll(re)){
    const candidate=m[1].replace(/^\.\//,"");
    const abs=path.resolve(REPO,candidate);
    if(abs.startsWith(REPO+path.sep) && fs.existsSync(abs) && fs.statSync(abs).isFile()) found.add(candidate);
    if(found.size>=10) break;
  }
  return [...found];
}

function coreContext(extra=[]){
  const preferred=["package.json","capacitor.config.json","client/src/App.tsx","client/src/main.tsx","server/index.ts"];
  const files=[...new Set([...preferred,...extra])];
  const blocks=[];
  for(const f of files){
    const abs=path.join(REPO,f);
    if(!fs.existsSync(abs) || !fs.statSync(abs).isFile()) continue;
    const txt=fs.readFileSync(abs,"utf8");
    blocks.push(`--- FILE: ${f} ---\n${txt.slice(0,18000)}`);
  }
  return blocks.join("\n\n").slice(0,90000);
}

async function callModel(role,instruction,context){
  const key=process.env.OPENAI_API_KEY;
  if(!key) return {blocked:"OPENAI_API_KEY"};
  const body={
    model:MODEL,
    messages:[
      {role:"system",content:`You are Synthia's ${role}. You operate inside a copy-on-write autonomous software factory. Originals are sacred. Do not delete files. Never modify .github, tools, secrets, credentials, lockfiles, or generated build output. Return ONLY valid JSON.`},
      {role:"user",content:`${instruction}\n\nCONTEXT:\n${context}`}
    ],
    response_format:{type:"json_object"}
  };
  const res=await fetch("https://api.openai.com/v1/chat/completions",{method:"POST",headers:{"content-type":"application/json","authorization":`Bearer ${key}`},body:JSON.stringify(body)});
  if(!res.ok) return {blocked:`MODEL_HTTP_${res.status}`,detail:(await res.text()).slice(0,2000)};
  const data=await res.json();
  const txt=data?.choices?.[0]?.message?.content;
  if(!txt) return {blocked:"MODEL_EMPTY"};
  try{return JSON.parse(txt)}catch{return {blocked:"MODEL_BAD_JSON",detail:txt.slice(0,2000)}}
}

function safePath(p){
  if(typeof p!=="string" || !p || p.includes("..") || path.isAbsolute(p)) return false;
  const q=p.replaceAll("\\","/");
  if(FORBIDDEN_PREFIX.some(x=>q===x.replace(/\/$/,"") || q.startsWith(x))) return false;
  return true;
}

function applyActions(payload,stage){
  const changed=[];
  for(const a of payload?.actions||[]){
    if(a?.type!=="write" || !safePath(a.path) || typeof a.content!=="string") continue;
    if(a.content.length>250000) continue;
    const ext=path.extname(a.path).toLowerCase();
    if(!TEXT_EXT.has(ext) && path.basename(a.path)!=="Dockerfile") continue;
    const abs=path.join(REPO,a.path);
    ensure(path.dirname(abs));
    const before=fs.existsSync(abs)?fs.readFileSync(abs,"utf8"):null;
    if(before===a.content) continue;
    fs.writeFileSync(abs,a.content);
    changed.push(a.path);
    emit({event:"WRITE",stage,path:a.path,beforeHash:before===null?null:hash(before),afterHash:hash(a.content)});
  }
  return changed;
}

function changedAgainstOrigin(){
  const changed=[];
  const current=new Map();
  walk(REPO,p=>{ const r=rel(p); current.set(r,p); });
  for(const [r,p] of current){
    const origin=path.join(ROOT,r);
    if(!fs.existsSync(origin)){
      changed.push(r); continue;
    }
    if(fs.statSync(origin).isFile() && hash(fs.readFileSync(origin))!==hash(fs.readFileSync(p))) changed.push(r);
  }
  return changed.filter(safePath);
}

async function repairLoop(){
  let sweep=runEngineeringSweep();
  let loops=0;
  while(!sweep.ok && loops<MAX_LOOPS){
    loops++;
    const digest=failureDigest(sweep);
    const files=likelyFilesFromLogs(digest);
    const payload=await callModel("Builder",
      `Repair the build failures. Continue until the repository can pass its own checks. Make the smallest correct changes. Return {"summary":"...","actions":[{"type":"write","path":"relative/path","content":"complete replacement file"}],"remaining":[]}. Do not merely explain.`,
      digest+"\n\n"+coreContext(files));
    if(payload.blocked) return {ok:false,blocked:payload.blocked,detail:payload.detail,loops,sweep};
    const changed=applyActions(payload,"BUILDER");
    emit({event:"BUILDER_CYCLE",loop:loops,summary:payload.summary||"",changed});
    if(!changed.length) return {ok:false,blocked:"BUILDER_NO_ACTION",loops,sweep};
    sweep=runEngineeringSweep();
  }
  return {ok:sweep.ok,blocked:sweep.ok?null:"REPAIR_BUDGET_EXHAUSTED",loops,sweep};
}

async function reviewer(changed){
  const context=coreContext(changed.slice(0,12));
  const payload=await callModel("Independent Reviewer",
    `Independently review these Builder changes for correctness, regressions, incomplete implementation, fake/stub behavior, security mistakes, and whether the requested product behavior is actually implemented. Do not approve based on intent. Return {"pass":true|false,"findings":[{"severity":"critical|high|medium|low","path":"...","problem":"...","required_action":"..."}],"summary":"..."}.`,
    context);
  if(payload.blocked) return {pass:false,blocked:payload.blocked,findings:[]};
  emit({event:"REVIEW",pass:!!payload.pass,summary:payload.summary||"",findings:payload.findings||[]});
  return payload;
}

async function verifier(review,changed){
  const sweep=runEngineeringSweep();
  const payload=await callModel("Verifier of the Reviewer",
    `Check whether the reviewer actually proved its conclusion. Treat passing builds as necessary but not sufficient. Review the review findings and the changed implementation. Return {"pass":true|false,"review_was_sufficient":true|false,"findings":[...],"summary":"..."}.`,
    JSON.stringify({review,sweep:{ok:sweep.ok,projects:sweep.results.map(x=>({project:x.project,ok:x.ok}))}},null,2)+"\n\n"+coreContext(changed.slice(0,10)));
  if(payload.blocked) return {pass:false,blocked:payload.blocked,sweep};
  const pass=!!payload.pass && !!payload.review_was_sufficient && sweep.ok;
  emit({event:"VERIFY_REVIEWER",pass,summary:payload.summary||"",findings:payload.findings||[]});
  return {...payload,pass,sweep};
}

function hasCapacitor(){
  const pkg=jread(path.join(REPO,"package.json"),{});
  return !!pkg?.scripts?.["mobile:apk"] || fs.existsSync(path.join(REPO,"capacitor.config.json"));
}

function buildApk(){
  if(!hasCapacitor()) return {attempted:false,ok:false,reason:"NO_ANDROID_CAPABILITY"};
  const pkg=jread(path.join(REPO,"package.json"),{});
  let r;
  if(pkg?.scripts?.["mobile:apk"]) r=run("npm",["run","mobile:apk"],REPO,30*60*1000);
  else r={code:1,stdout:"",stderr:"mobile:apk script missing",cmd:[],cwd:"."};
  const apks=[];
  walk(REPO,p=>{ if(/\.apk$/i.test(p)) apks.push(rel(p)); });
  const out={attempted:true,ok:r.code===0&&apks.length>0,apks,command:r};
  emit({event:"APK_RELEASE",attempted:true,ok:out.ok,apks});
  return out;
}

async function productStage(stage,instruction,seedFiles=[]){
  const payload=await callModel(stage,instruction,coreContext(seedFiles));
  if(payload.blocked) return {ok:false,blocked:payload.blocked,changed:[]};
  const changed=applyActions(payload,stage);
  emit({event:stage,summary:payload.summary||"",changed,remaining:payload.remaining||[]});
  return {ok:true,changed,remaining:payload.remaining||[],summary:payload.summary||""};
}

async function main(){
  freshWorkspace();
  const state={startedAt:now(),state:"RUNNING",phases:[],blocked:[],changed:[]};

  const engineering=await repairLoop();
  state.phases.push({name:"BUILD_REPAIR",ok:engineering.ok,loops:engineering.loops,blocked:engineering.blocked});
  if(!engineering.ok){
    state.state=engineering.blocked?.includes("API_KEY")?"BLOCKED_CREDENTIAL":"BLOCKED_ENGINEERING";
    if(engineering.blocked) state.blocked.push(engineering.blocked);
    jwrite(REPORT,state); jwrite(APPLY,{files:[]}); console.log(JSON.stringify(state,null,2)); process.exitCode=2; return;
  }

  let changed=changedAgainstOrigin();
  const review=await reviewer(changed);
  state.phases.push({name:"REVIEW_BUILDER",ok:!!review.pass,blocked:review.blocked||null,findings:review.findings||[]});
  if(!review.pass){
    state.state=review.blocked?"BLOCKED_CREDENTIAL":"REVIEW_REJECTED";
    if(review.blocked) state.blocked.push(review.blocked);
    jwrite(REPORT,state); jwrite(APPLY,{files:[]}); console.log(JSON.stringify(state,null,2)); process.exitCode=3; return;
  }

  const verify=await verifier(review,changed);
  state.phases.push({name:"VERIFY_REVIEWER",ok:!!verify.pass,blocked:verify.blocked||null,findings:verify.findings||[]});
  if(!verify.pass){
    state.state=verify.blocked?"BLOCKED_CREDENTIAL":"VERIFIER_REJECTED";
    if(verify.blocked) state.blocked.push(verify.blocked);
    jwrite(REPORT,state); jwrite(APPLY,{files:[]}); console.log(JSON.stringify(state,null,2)); process.exitCode=4; return;
  }

  const apk=buildApk();
  state.phases.push({name:"APK_RELEASE",ok:apk.ok,attempted:apk.attempted,apks:apk.apks||[]});
  if(apk.attempted && !apk.ok) state.blocked.push("APK_BUILD_REQUIRES_REPAIR");

  const monetization=await productStage("MONETIZER",
    `Implement a real monetization-ready product layer for this APK/app using the existing architecture. Prefer a simple paid upgrade/entitlement path and clear pricing surface. Do not invent credentials or charge anyone. External payment credentials or merchant enrollment must be reported in remaining. Return {"summary":"...","actions":[{"type":"write","path":"...","content":"complete file"}],"remaining":["human/external items only"]}.`,
    ["client/src/App.tsx","client/src/main.tsx"]);
  state.phases.push({name:"MONETIZE",ok:monetization.ok,blocked:monetization.blocked||null,remaining:monetization.remaining||[]});
  if(monetization.ok){
    const mSweep=runEngineeringSweep();
    const mReview=await reviewer(changedAgainstOrigin());
    const mVerify=await verifier(mReview,changedAgainstOrigin());
    state.phases.push({name:"VERIFY_MONETIZATION",ok:mSweep.ok&&!!mReview.pass&&!!mVerify.pass});
    if(!(mSweep.ok&&mReview.pass&&mVerify.pass)) state.blocked.push("MONETIZATION_REQUIRES_REPAIR");
  } else if(monetization.blocked) state.blocked.push(monetization.blocked);

  const creative=await productStage("CREATIVE",
    `Prepare truthful short-form launch assets for TikTok/Reels using only verified app capabilities. The project may use authorized user photos or clearly synthetic fictional people; never impersonate an unrelated real person. Create reusable campaign files inside marketing/ including hooks, 15-30 second scripts, shot lists, synthetic-character prompts, captions, CTA, and a morphing-pipeline manifest for authorized-face -> character/body -> scene -> video. Do not claim a feature that is not present. Return JSON actions and any external video-generation/publishing requirements in remaining.`);
  state.phases.push({name:"CREATIVE_VIDEO_PACKAGE",ok:creative.ok,blocked:creative.blocked||null,remaining:creative.remaining||[]});
  if(creative.blocked) state.blocked.push(creative.blocked);

  const advertising=await productStage("ADVERTISER",
    `Prepare an advertising launch package for the finished APK. Create marketing/launch-manifest.json plus platform-ready captions, product description, campaign variants, measurement events, and Google Play listing draft materials. Do NOT publish to Google Play or spend money. Google Play submission must remain a human approval gate. Return JSON actions and remaining human/external actions.`);
  state.phases.push({name:"ADVERTISE_PREP",ok:advertising.ok,blocked:advertising.blocked||null,remaining:advertising.remaining||[]});
  if(advertising.blocked) state.blocked.push(advertising.blocked);

  const finalSweep=runEngineeringSweep();
  const finalChanged=changedAgainstOrigin();
  const finalReview=await reviewer(finalChanged);
  const finalVerify=await verifier(finalReview,finalChanged);
  const noInternalBlocks=state.blocked.filter(x=>!String(x).includes("API_KEY")).length===0;
  const quiescent=finalSweep.ok && finalReview.pass && finalVerify.pass && noInternalBlocks;

  state.changed=finalChanged;
  state.phases.push({name:"FINAL_AUDIT",ok:quiescent,files:finalChanged.length});
  state.state=quiescent?"QUIESCENT":(state.blocked.some(x=>String(x).includes("API_KEY"))?"BLOCKED_CREDENTIAL":"ACTIONABLE_WORK_REMAINS");
  state.humanGates=[
    "Approve Google Play publication after reviewing the verified APK/AAB and store package.",
    ...(monetization.remaining||[]),
    ...(creative.remaining||[]),
    ...(advertising.remaining||[])
  ];
  state.finishedAt=now();

  jwrite(REPORT,state);
  jwrite(APPLY,{files:quiescent?finalChanged:[]});
  console.log(JSON.stringify(state,null,2));
  process.exitCode=quiescent?0:5;
}

main().catch(err=>{
  emit({event:"FATAL",message:String(err?.stack||err)});
  const state={state:"FATAL",message:String(err?.stack||err),at:now()};
  jwrite(REPORT,state); jwrite(APPLY,{files:[]});
  console.error(err); process.exitCode=10;
});
