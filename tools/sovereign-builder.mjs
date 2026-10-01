#!/usr/bin/env node
/**
 * SynthAI Sovereign Build Automaton
 * Copy-on-write autonomous build controller.
 * Origins are evidence only. All mutation occurs in workspace copies.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";

const ROOT = process.cwd();
const STATE = path.join(ROOT, ".synthai-builder");
const ORIGINS = path.join(STATE, "origins");
const WORK = path.join(STATE, "workspace");
const LEDGER = path.join(STATE, "provenance.jsonl");
const DNA = path.join(STATE, "dna.json");
const sha256 = b => crypto.createHash("sha256").update(b).digest("hex");
const ensure = p => fs.mkdirSync(p,{recursive:true});
const emit = e => { ensure(STATE); fs.appendFileSync(LEDGER, JSON.stringify({at:new Date().toISOString(),...e})+"\n"); };
const readJSON = (p,d={}) => { try{return JSON.parse(fs.readFileSync(p,"utf8"))}catch{return d} };
const writeJSON = (p,v) => { ensure(path.dirname(p)); fs.writeFileSync(p,JSON.stringify(v,null,2)+"\n"); };

function copyTree(src,dst){
  const st=fs.statSync(src); ensure(path.dirname(dst));
  if(st.isDirectory()){ensure(dst); for(const n of fs.readdirSync(src)) copyTree(path.join(src,n),path.join(dst,n));}
  else fs.copyFileSync(src,dst);
}
function fingerprint(p){
  const st=fs.statSync(p);
  if(st.isFile()) return sha256(fs.readFileSync(p));
  const rows=[];
  for(const n of fs.readdirSync(p).sort()) rows.push(n+":"+fingerprint(path.join(p,n)));
  return sha256(rows.join("\n"));
}
function ingest(src,label=path.basename(src)){
  const abs=path.resolve(src); if(!fs.existsSync(abs)) throw new Error("Missing source: "+abs);
  ensure(ORIGINS); ensure(WORK);
  const id=sha256(abs+"|"+fingerprint(abs)).slice(0,16);
  const immutable=path.join(ORIGINS,id); const work=path.join(WORK,id);
  if(!fs.existsSync(immutable)) copyTree(abs,immutable);
  if(!fs.existsSync(work)) copyTree(immutable,work);
  emit({event:"INGEST",id,label,origin:abs,originHash:fingerprint(immutable),workspace:work});
  console.log(JSON.stringify({id,label,workspace:work},null,2));
}
function discover(dir=WORK){
  const found=[];
  if(!fs.existsSync(dir)) return found;
  const walk=p=>{for(const d of fs.readdirSync(p,{withFileTypes:true})){if(["node_modules",".git","dist","build"].includes(d.name))continue;
    const q=path.join(p,d.name); if(d.isDirectory()) walk(q); else if(["package.json","pyproject.toml","requirements.txt","Cargo.toml","go.mod","Dockerfile","docker-compose.yml","vite.config.ts","vite.config.js"].includes(d.name)) found.push(q);
  }}; walk(dir); return found;
}
function run(cmd,args,cwd){
  const t=Date.now(); const r=spawnSync(cmd,args,{cwd,encoding:"utf8",timeout:20*60*1000,env:process.env});
  const out={cmd:[cmd,...args],cwd,code:r.status,signal:r.signal,stdout:(r.stdout||"").slice(-20000),stderr:(r.stderr||"").slice(-20000),ms:Date.now()-t};
  emit({event:"EXECUTE",...out}); return out;
}
function candidates(){
  return discover().filter(p=>path.basename(p)==="package.json").map(p=>path.dirname(p));
}
function verifyNodeProject(cwd){
  const pkg=readJSON(path.join(cwd,"package.json"),{}); const scripts=pkg.scripts||{}; const checks=[];
  if(fs.existsSync(path.join(cwd,"package-lock.json"))) checks.push(run("npm",["ci","--ignore-scripts"],cwd)); else checks.push(run("npm",["install","--ignore-scripts"],cwd));
  for(const s of ["test","check","build"]) if(scripts[s]) checks.push(run("npm",["run",s],cwd));
  const ok=checks.every(x=>x.code===0); emit({event:"VERIFY",cwd,ok,checks:checks.map(x=>({cmd:x.cmd,code:x.code}))}); return {cwd,ok,checks};
}
function learn(result){
  const dna=readJSON(DNA,{version:1,successful:[],failed:[]});
  const rec={at:new Date().toISOString(),cwd:result.cwd,hash:fingerprint(result.cwd),commands:result.checks.map(x=>x.cmd)};
  (result.ok?dna.successful:dna.failed).push(rec); writeJSON(DNA,dna);
}
function status(){
  console.log(JSON.stringify({stateDir:STATE,origins:fs.existsSync(ORIGINS)?fs.readdirSync(ORIGINS):[],candidates:candidates(),ledger:LEDGER,dna:DNA},null,2));
}
function build(){
  const cs=candidates(); if(!cs.length) throw new Error("No ingested Node application candidates.");
  const results=[]; for(const c of cs){const r=verifyNodeProject(c); learn(r); results.push({cwd:c,ok:r.ok});}
  const all=results.every(x=>x.ok); emit({event:all?"PRESENT_FOR_REVIEW":"REPAIR_REQUIRED",results});
  console.log(JSON.stringify({state:all?"PRESENT_FOR_REVIEW":"REPAIR_REQUIRED",results},null,2));
  process.exitCode=all?0:2;
}
ensure(STATE);
const [op,...args]=process.argv.slice(2);
if(op==="ingest") ingest(args[0],args[1]);
else if(op==="discover") console.log(discover().join("\n"));
else if(op==="build") build();
else if(op==="status") status();
else { console.log("SynthAI Sovereign Build Automaton\n  ingest <path> [label]\n  discover\n  build\n  status"); }
