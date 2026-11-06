// Original Synthai2 Computer services, running inside the phone's ARM64 Linux guest.
// This is not a hosted web app. The local Express server serves its own frontend.
import { spawn } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
const base="/opt/synthai";
const data="/var/lib/synthai";
const expectedModel="ed94061b70e07d83aab5da6a1519cc293c413d541f183eac5d95a1525574f75e";
const expectedTokenizer="8c61e8b0bc628d165b4d5a8c6f485399765b8c236b71e0cb901a910e3671f73a";
const sha=file=>createHash("sha256").update(readFileSync(file)).digest("hex");
const source=path.join(base,"klein-source");
if(sha(path.join(source,"run/model.pt"))!==expectedModel ||
   sha(path.join(source,"run/tokenizer.json"))!==expectedTokenizer){
  console.error("Original Cynthia weights or tokenizer differ from pinned source.");
  process.exit(1);
}
mkdirSync(data,{recursive:true});
mkdirSync(path.join(data,"workspace"),{recursive:true});
const modelRoot=path.join(data,"cynthia-working-copy");
const pinFile=path.join(modelRoot,".source-pin");
const pin="78ea0e28c70d7a5d4c288279025a493ceccbde5d";
if(!existsSync(modelRoot)){
  cpSync(source,modelRoot,{recursive:true,filter:p=>!p.split(path.sep).some(x=>x===".git"||x===".venv"||x==="__pycache__")});
  writeFileSync(pinFile,pin+"\n");
}else if(!existsSync(pinFile)||readFileSync(pinFile,"utf8").trim()!==pin){
  console.error("Cynthia working directory has an unexpected version. Refusing to change it.");
  process.exit(1);
}
const environment={...process.env,
  NODE_ENV:"production",
  SYNTHIA_PHONE_CONTAINER:"1",
  SYNTHIA_NODE_PORT:"10000",
  SYNTHIA_PYTHON_PORT:"8001",
  SYNTHIA_KLEIN_PORT:"7860",
  SYNTHAI_DATA_DIR:data,
  MESH_DATA_DIR:data,
  LINUX_CONTAINER_ENABLED:"true",
  LINUX_CONTAINER_WORKDIR:path.join(data,"workspace"),
  PYTHON_API_URL:"http://127.0.0.1:8001",
  PYTHON_API_AUTOSTART:"false",
  SYNTHIA_URL:"http://127.0.0.1:8001",
  PORT:"5000"
};
const services=[
  {name:"cynthia-original",cwd:modelRoot,exe:"python3",args:["web_app.py","--root",modelRoot,"--port","7860"]},
  {name:"synthia-python",cwd:path.join(base,"synthia-server"),exe:"python3",args:["-m","uvicorn","server:app","--host","127.0.0.1","--port","8001"]},
  {name:"synthia-node",cwd:path.join(base,"synthia-server"),exe:"node",args:["--max-old-space-size=512","-r","./server/control-preload.js","server/lite.js"],env:{PORT:"10000",NODE_MODE:"lite"}},
  {name:"studio",cwd:path.join(base,"studio"),exe:"node",args:["dist/index.js"]},
];
const active=new Map();
for(const s of services){
  const worker=spawn(s.exe,s.args,{cwd:s.cwd,env:{...environment,...s.env},stdio:["ignore","pipe","pipe"]});
  active.set(s.name,worker);
  for(const stream of [worker.stdout,worker.stderr]){
    let buffer="";
    stream.setEncoding("utf8");
    stream.on("data",part=>{
      buffer+=part;
      let pos;
      while((pos=buffer.indexOf("\n"))>=0){
        const line=buffer.slice(0,pos);buffer=buffer.slice(pos+1);
        // Suppress private message bodies in Android/system log output.
        if(/listening|started|error|traceback|failed|ready|serving/i.test(line))
          console.log("["+s.name+"] "+line.slice(0,350));
      }
    });
  }
  worker.on("error",e=>{console.error(s.name+" failed:",e.message);process.exitCode=1;shutdown();});
  worker.on("exit",(code,signal)=>{if(!stopping){console.error(s.name+" exited:",code,signal);process.exitCode=1;shutdown();}});
}
let stopping=false;
function shutdown(){
  if(stopping)return;
  stopping=true;
  for(const worker of active.values())worker.kill("SIGTERM");
  setTimeout(()=>process.exit(process.exitCode||1),3000).unref();
}
process.on("SIGTERM",shutdown);
process.on("SIGINT",shutdown);
console.log("Synthai2 Linux guest started: original trained Cynthia + Synthia Node/Python + Studio Express");
