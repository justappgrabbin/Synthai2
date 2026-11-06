import type { Express, Request, Response, NextFunction } from "express";
import { randomBytes, timingSafeEqual } from "node:crypto";

const HOST = "http://127.0.0.1:" + (process.env.SYNTHIA_KLEIN_PORT || "7860");
const COOKIE = "cynthia_resident";
const sessions = new Map<string, number>();
const endpoints = new Set(["status","skills","history","source","file","chat","action","settings","feedback","reset","rollback","train"]);

function permitted(req: Request): boolean {
  const token = process.env.SYNTHIA_KLEIN_OWNER_TOKEN;
  if (!token) return process.env.NODE_ENV !== "production" &&
    ["127.0.0.1","::1","::ffff:127.0.0.1"].includes(req.socket.remoteAddress || "");
  const value = (req.headers.cookie || "").split(";").map(s => s.trim()).find(s => s.startsWith(COOKIE + "="))?.slice(COOKIE.length + 1);
  return Boolean(value && (sessions.get(value) || 0) > Date.now());
}
function gate(req: Request, res: Response, next: NextFunction) {
  if (!permitted(req)) return res.status(401).json({error:"Owner sign-in required"});
  if (req.method !== "GET" && req.header("origin")) {
    try { if (new URL(req.header("origin")!).host !== req.get("host")) return res.sendStatus(403); }
    catch { return res.sendStatus(403); }
  }
  next();
}
async function healthy(): Promise<boolean> {
  try {
    const r = await fetch(HOST + "/api/status", {signal:AbortSignal.timeout(1800)});
    const s = await r.json() as {checkpoint_step?:number, skill_count?:number};
    return r.ok && typeof s.checkpoint_step === "number" && typeof s.skill_count === "number";
  } catch { return false; }
}
export function cynthiaHtml(s:string) {
  return s.replaceAll('href="/','href="/resident/cynthia/').replaceAll('src="/','src="/resident/cynthia/');
}
export function cynthiaJs(s:string) {
  return s.replaceAll("'/api/","'/resident/cynthia/api/").replaceAll('"/api/','"/resident/cynthia/api/');
}
export function registerCynthiaResidentBridge(app: Express) {
  app.get("/api/cynthia-resident/status",async (req,res) =>
    res.json({name:"Cynthia Klein (original)",running:await healthy(),authorized:permitted(req),
      source:"justappgrabbin/klein-agent", sourceCommit:"78ea0e28c70d7a5d4c288279025a493ceccbde5d",
      embeddedAndroid:false, ownerTokenRequired:Boolean(process.env.SYNTHIA_KLEIN_OWNER_TOKEN)}));
  app.post("/api/cynthia-resident/login",(req,res) => {
    const expected=process.env.SYNTHIA_KLEIN_OWNER_TOKEN;
    if (!expected) return res.status(503).json({error:"Configure SYNTHIA_KLEIN_OWNER_TOKEN on the Computer host"});
    const supplied=String(req.body?.token || "");
    const a=Buffer.from(supplied),b=Buffer.from(expected);
    if (a.length!==b.length || !timingSafeEqual(a,b)) return res.sendStatus(401);
    const id=randomBytes(32).toString("hex");
    sessions.set(id,Date.now()+8*3600_000);
    res.cookie(COOKIE,id,{httpOnly:true,sameSite:"strict",secure:process.env.NODE_ENV==="production",path:"/",maxAge:8*3600_000});
    res.json({authorized:true});
  });
  app.all("/resident/cynthia/api/:action",gate,async(req,res)=>{
    const action=req.params.action;
    if (!endpoints.has(action)) return res.sendStatus(404);
    const path=new URL(req.originalUrl,"http://localhost").search;
    try {
      const upstream=await fetch(HOST+"/api/"+action+path,{
        method:req.method,
        headers:req.method==="GET"?{}:{"content-type":"application/json"},
        body:req.method==="GET"?undefined:JSON.stringify(req.body || {}),
        signal:AbortSignal.timeout(90000)
      });
      const size=Number(upstream.headers.get("content-length") || "0");
      if (size>12_000_000) return res.sendStatus(413);
      const buffer=Buffer.from(await upstream.arrayBuffer());
      if (buffer.length>12_000_000) return res.sendStatus(413);
      res.setHeader("content-type",upstream.headers.get("content-type") || "application/octet-stream");
      res.setHeader("cache-control","no-store");
      return res.status(upstream.status).send(buffer);
    } catch { return res.status(503).json({error:"Original Cynthia service unavailable"}); }
  });
  app.get(["/resident/cynthia","/resident/cynthia/","/resident/cynthia/index.html","/resident/cynthia/app.js","/resident/cynthia/style.css","/resident/cynthia/favicon.svg"],gate,async(req,res)=>{
    const name=req.path.split("/").pop() || "";
    const target=!name || name==="cynthia" || name==="index.html"?"/":"/"+name;
    try {
      const upstream=await fetch(HOST+target,{signal:AbortSignal.timeout(8000)});
      if (!upstream.ok) return res.status(503).send("Original Cynthia interface unavailable");
      let raw=await upstream.text();
      if (target==="/") raw=cynthiaHtml(raw);
      if (target==="/app.js") raw=cynthiaJs(raw);
      res.setHeader("cache-control","no-store");
      res.setHeader("X-Content-Type-Options","nosniff");
      res.type(target==="/app.js"?"javascript":target==="/style.css"?"css":target==="/favicon.svg"?"svg":"html");
      return res.send(raw);
    }catch {return res.status(503).send("Start original Cynthia on the Computer host first");}
  });
}
