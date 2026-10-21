import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { getGitHubAccessToken } from "./githubService";
import { publishMeshEvent } from "./meshEventStore";

type Target = "github" | "supabase";
export type AddressedInput = { name: string; base64: string; kind?: string; canonicalAddress?: Record<string, unknown>; destination: Target; approve: boolean };
const fields = ["planetary","dimension","gate","line","color","tone","base","degree","minute","second","arcAxis","zodiac","house"] as const;
function canonical(input?: Record<string,unknown>) {
  if (!input) return null;
  const extra = Object.keys(input).filter(k=>!fields.includes(k as any));
  if (extra.length) throw new Error("Unsupported address fields: "+extra.join(","));
  const output: Record<string,unknown> = {};
  for (const key of fields) output[key] = input[key] ?? null;
  return output;
}
function decode(base64: string) {
  if (!base64 || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(base64)) throw new Error("Invalid base64");
  const bytes = Buffer.from(base64,"base64");
  if (!bytes.length || bytes.length > 20 * 1024 * 1024) throw new Error("File must be 1 byte to 20 MB");
  return bytes;
}
function slug(s:string) {return s.replace(/[^a-zA-Z0-9._-]/g,"_").slice(0,100) || "file";}
export function addressFile(input: AddressedInput) {
  const bytes=decode(input.base64);
  const sha256=crypto.createHash("sha256").update(bytes).digest("hex");
  const name=slug(path.basename(input.name));
  return {bytes,receipt:{version:1,identity:"sha256:"+sha256,sha256,bytes:bytes.length,name,kind:input.kind ?? "file",address:canonical(input.canonicalAddress),addressStatus:input.canonicalAddress?"provided-unverified":"pending-semantic-placement",provenance:"synthai2-addressed-intake",destination:input.destination,approved:Boolean(input.approve)}};
}
async function githubPut(repo:string, branch:string, filepath:string, content:Buffer, token:string) {
  if (!/^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/.test(repo) || !/^[a-zA-Z0-9._/-]+$/.test(branch) || branch.includes("..")) throw new Error("Invalid GitHub destination");
  const url="https://api.github.com/repos/"+repo+"/contents/"+filepath.split("/").map(encodeURIComponent).join("/")+"?ref="+encodeURIComponent(branch);
  const headers={Authorization:"Bearer "+token,Accept:"application/vnd.github+json","Content-Type":"application/json","X-GitHub-Api-Version":"2022-11-28"};
  const existing=await fetch(url,{headers});
  if (existing.status===200) throw new Error("Destination already exists; originals are immutable");
  if (existing.status!==404) throw new Error("GitHub destination check failed: "+existing.status);
  const put=await fetch(url.split("?")[0],{method:"PUT",headers,body:JSON.stringify({message:"Store addressed original "+filepath,branch,content:content.toString("base64")})});
  if (!put.ok) throw new Error("GitHub write failed: "+put.status+" "+(await put.text()).slice(0,200));
  const response=await put.json();
  return {path:filepath,commit:response.commit?.sha,url:response.content?.html_url};
}
export async function dispatchAddressedFile(input:AddressedInput, opts:{githubRepo?:string;githubBranch?:string}={}) {
  const {bytes,receipt}=addressFile(input);
  if (!input.approve) return {ok:true,dispatched:false,receipt,reason:"approval-required"};
  if (input.destination==="github") {
    const repo=opts.githubRepo || process.env.SYNTHIA_GITHUB_REPO;
    const branch=opts.githubBranch || process.env.SYNTHIA_GITHUB_BRANCH || "main";
    if (!repo) throw new Error("SYNTHIA_GITHUB_REPO must be configured");
    const token=process.env.GITHUB_TOKEN || await getGitHubAccessToken();
    const dir="synthia-addressed-vault/"+receipt.sha256.slice(0,2)+"/"+receipt.sha256;
    const artifact=await githubPut(repo,branch,dir+"/"+receipt.name,bytes,token);
    const manifest=await githubPut(repo,branch,dir+"/address-receipt.json",Buffer.from(JSON.stringify(receipt,null,2)),token);
    const event=publishMeshEvent({source:"synthia-addressed-intake",type:"artifact.dispatched",topic:"addressed-files",payload:{sha256:receipt.sha256,destination:"github",addressStatus:receipt.addressStatus}});
    return {ok:true,dispatched:true,receipt,artifact,manifest,eventId:event.id};
  }
  if (input.destination==="supabase") {
    const base=process.env.SUPABASE_URL, key=process.env.SUPABASE_SERVICE_ROLE_KEY, bucket=process.env.SYNTHIA_SUPABASE_BUCKET;
    if (!base || !key || !bucket) throw new Error("Supabase Storage destination not configured");
    if (!/^https:\/\//.test(base) || !/^[a-zA-Z0-9._-]+$/.test(bucket)) throw new Error("Invalid Supabase configuration");
    const dir="synthia-addressed-vault/"+receipt.sha256.slice(0,2)+"/"+receipt.sha256;
    const upload=async(name:string,data:Buffer,mime:string)=>{
      const objectPath=dir+"/"+name;
      const url=base.replace(/\/$/,"")+"/storage/v1/object/"+encodeURIComponent(bucket)+"/"+objectPath.split("/").map(encodeURIComponent).join("/");
      const response=await fetch(url,{method:"POST",headers:{Authorization:"Bearer "+key,apikey:key,"Content-Type":mime,"x-upsert":"false"},body:new Uint8Array(data)});
      if(!response.ok)throw new Error("Supabase write failed: "+response.status+" "+(await response.text()).slice(0,200));
      return objectPath;
    };
    const artifact=await upload(receipt.name,bytes,"application/octet-stream");
    const manifest=await upload("address-receipt.json",Buffer.from(JSON.stringify(receipt,null,2)),"application/json");
    const event=publishMeshEvent({source:"synthia-addressed-intake",type:"artifact.dispatched",topic:"addressed-files",payload:{sha256:receipt.sha256,destination:"supabase",addressStatus:receipt.addressStatus}});
    return {ok:true,dispatched:true,receipt,artifact,manifest,eventId:event.id};
  }
  throw new Error("Unsupported destination");
}
