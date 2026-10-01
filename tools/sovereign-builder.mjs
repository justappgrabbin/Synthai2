#!/usr/bin/env node
/**
 * SynthAI Sovereign Build Automaton
 * Copy-on-write autonomous production finisher.
 * Origins are immutable evidence. All mutation occurs only in workspace copies.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";

const ROOT=process.cwd(), STATE=path.join(ROOT,".synthai-builder"), ORIGINS=path.join(STATE,"origins"), WORK=path.join(STATE,"workspace");
const LEDGER=path.join(STATE,"provenance.jsonl"), DNA=path.join(STATE,"dna.json"), REPORT=path.join(STATE,"completion.json");
const sha256=b=>crypto.createHash("sha256").update(b).digest("hex");
const ensure=p=>fs.mkdirSync(p,{recursive:true});
const emit=e=>{ensure(STATE);fs.appendFileSync(LEDGER,JSON.stringify({at:new Date().toISOString(),...e})+"\n")};
const readJSON=(p,d={})=>{try{return JSON.parse(fs.readFileSync(p,"utf8"))}catch{return d}};
const writeJSON=(p,v)=>{ensure(path.dirname(p));fs.writeFileSync(p,JSON.stringify(v,null,2)+"\n")};

function copyTree(src,dst){const st=fs.statSync(src);ensure(path.dirname(dst));if(st.isDirectory()){ensure(dst);for(const n of fs.readdirSync(src))copyTree(path.join(src,n),path.join(dst,n));}else fs.copyFileSync(src,dst)}
function fingerprint(p){const st=fs.statSync(p);if(st.isFile())return sha256(fs.readFileSync(p));const rows=[];for(const n of fs.readdirSync(p).sort())rows.push(n+":"+fingerprint(path.join(p,n)));return sha256(rows.join("\n"))}
function ingest(src,label=path.basename(src)){const abs=path.resolve(src);if(!fs.existsSync(abs))throw new Error("Missing source: "+abs);ensure(ORIGINS);ensure(WORK);const id=sha256(abs+"|"+fingerprint(abs)).slice(0,16),immutable=path.join(ORIGINS,id),work=path.join(WORK,id);if(!fs.existsSync(immutable))copyTree(abs,immutable);if(!fs.existsSync(work))copyTree(immutable,work);emit({event:"INGEST",id,label,origin:abs,originHash:fingerprint(immutable),workspace:work});console.log(JSON.stringify({id,label,workspace:work},null,2))}
function discover(dir=WORK){const found=[];if(!fs.existsSync(dir))return found;const walk=p=>{for(const d of fs.readdirSync(p,{withFileTypes:true})){if(["node_modules",".git","dist","build"].includes(d.name))continue;const q=path.join(p,d.name);if(d.isDirectory())walk(q);else if(d.name==="package.json")found.push(q)}};walk(dir);return found}
function candidates(){return discover().map(p=>path.dirname(p))}
function run(cmd,args,cwd,timeout=20*60*1000){const t=Date.now(),r=spawnSync(cmd,args,{cwd,encoding:"utf8",timeout,env:process.env});const out={cmd:[cmd,...args],cwd,code:r.status,signal:r.signal,stdout:(r.stdout||"").slice(-30000),stderr:(r.stderr||"").slice(-30000),ms:Date.now()-t};emit({event:"EXECUTE",...out});return out}
function shell(script,cwd,timeout=20*60*1000){return run("bash",["-lc",script],cwd,timeout)}
function install(cwd){return fs.existsSync(path.join(cwd,"package-lock.json"))?run("npm",["ci","--ignore-scripts"],cwd):run("npm",["install","--ignore-scripts"],cwd)}

function repairProject(cwd){
  const changes=[];
  const ts=path.join(cwd,"tsconfig.json");
  if(fs.existsSync(ts)){
    const cfg=readJSON(ts,null);
    if(cfg?.compilerOptions && !cfg.compilerOptions.target){
      cfg.compilerOptions.target="ES2022";
      writeJSON(ts,cfg);changes.push("tsconfig.target=ES2022");
    }
  }
  const pkgPath=path.join(cwd,"package.json"),pkg=readJSON(pkgPath,{});
  if(pkg.engines?.node?.includes("24") && Number(process.versions.node.split(".")[0])<24) changes.push("requires-node-24");
  if(changes.length)emit({event:"REPAIR_APPLIED",cwd,changes});
  return changes;
}

function serviceTest(cwd){
  const script=`set -u
LOG=.synthia-service.log
npm start >"$LOG" 2>&1 &
PID=$!
cleanup(){ kill "$PID" 2>/dev/null || true; wait "$PID" 2>/dev/null || true; }
trap cleanup EXIT
READY=0
for i in $(seq 1 45); do
  if node -e "fetch(process.env.TEST_URL||'http://localhost:10000/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"; then READY=1; break; fi
  if ! kill -0 "$PID" 2>/dev/null; then break; fi
  sleep 1
done
if [ "$READY" -ne 1 ]; then cat "$LOG"; exit 91; fi
npm test`;
  return shell(script,cwd,10*60*1000);
}

function verifyNodeProject(cwd){
  const pkg=readJSON(path.join(cwd,"package.json"),{}),scripts=pkg.scripts||{},hard=[],diagnostics=[];
  hard.push(install(cwd));
  if(hard[0].code!==0)return {cwd,ok:false,hard,diagnostics,state:"REPAIR_REQUIRED"};
  if(scripts.build) hard.push(run("npm",["run","build"],cwd));
  if(scripts.test){
    if(scripts.start && /fetch\s*\(|TEST_URL|localhost/i.test(fs.existsSync(path.join(cwd,"test/deploy.test.js"))?fs.readFileSync(path.join(cwd,"test/deploy.test.js"),"utf8"):"")) hard.push(serviceTest(cwd));
    else hard.push(run("npm",["test"],cwd));
  }
  if(scripts.check) diagnostics.push(run("npm",["run","check"],cwd));
  const ok=hard.every(x=>x.code===0);
  const state=ok?(diagnostics.every(x=>x.code===0)?"FINISHED":"FINISHED_WITH_DIAGNOSTICS"):"REPAIR_REQUIRED";
  emit({event:"VERIFY",cwd,ok,state,hard:hard.map(x=>({cmd:x.cmd,code:x.code})),diagnostics:diagnostics.map(x=>({cmd:x.cmd,code:x.code}))});
  return {cwd,ok,state,hard,diagnostics};
}
function learn(result){const dna=readJSON(DNA,{version:2,successful:[],failed:[]});const rec={at:new Date().toISOString(),cwd:result.cwd,hash:fingerprint(result.cwd),state:result.state,commands:[...result.hard,...result.diagnostics].map(x=>x.cmd)};(result.ok?dna.successful:dna.failed).push(rec);writeJSON(DNA,dna)}
function compact(r){return {cwd:r.cwd,ok:r.ok,state:r.state,hard:r.hard.map(x=>({cmd:x.cmd,code:x.code})),diagnostics:r.diagnostics.map(x=>({cmd:x.cmd,code:x.code}))}}
function build(){
  const cs=candidates();if(!cs.length)throw new Error("No ingested Node application candidates.");
  let results=[];
  for(let pass=1;pass<=3;pass++){
    emit({event:"PASS_START",pass,candidates:cs});
    let mutated=false;results=[];
    for(const c of cs){if(pass>1){const ch=repairProject(c);if(ch.length)mutated=true}const r=verifyNodeProject(c);learn(r);results.push(r)}
    if(results.every(x=>x.ok))break;
    if(pass===1){for(const c of cs){const ch=repairProject(c);if(ch.length)mutated=true}}
    if(!mutated && pass>1)break;
  }
  const all=results.every(x=>x.ok), report={state:all?"PRESENT_FOR_REVIEW":"REPAIR_REQUIRED",node:process.version,results:results.map(compact)};
  writeJSON(REPORT,report);emit({event:report.state,results:report.results});console.log(JSON.stringify(report,null,2));process.exitCode=all?0:2;
}
function status(){console.log(JSON.stringify({stateDir:STATE,origins:fs.existsSync(ORIGINS)?fs.readdirSync(ORIGINS):[],candidates:candidates(),ledger:LEDGER,dna:DNA,report:REPORT},null,2))}
ensure(STATE);const [op,...args]=process.argv.slice(2);
if(op==="ingest")ingest(args[0],args[1]);else if(op==="discover")console.log(discover().join("\n"));else if(op==="build")build();else if(op==="status")status();else console.log("SynthAI Sovereign Build Automaton\n  ingest <path> [label]\n  discover\n  build\n  status");
