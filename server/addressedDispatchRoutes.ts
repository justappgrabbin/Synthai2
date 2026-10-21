import type { Express } from "express";
import { addressFile, dispatchAddressedFile } from "./lib/addressedDispatchService";
import { z } from "zod";
const schema=z.object({
  name:z.string().min(1).max(255),
  base64:z.string().min(1),
  kind:z.string().max(80).optional(),
  canonicalAddress:z.record(z.unknown()).optional(),
  destination:z.enum(["github","supabase"]),
  approve:z.boolean().default(false),
  githubRepo:z.string().optional(),
  githubBranch:z.string().optional(),
});
export function registerAddressedDispatchRoutes(app:Express) {
  app.post("/api/synthia/address/preview", (req,res)=>{
    try {const input=schema.parse(req.body);const {receipt}=addressFile(input);res.json({ok:true,receipt,dispatched:false});}
    catch(e){res.status(400).json({ok:false,error:String(e)});}
  });
  app.post("/api/synthia/address/dispatch",async(req,res)=>{
    try {
      const parsed=schema.parse(req.body);
      if (!parsed.approve) return res.status(403).json({ok:false,error:"Explicit approval required"});
      const {githubRepo,githubBranch,...input}=parsed;
      const result=await dispatchAddressedFile(input,{githubRepo,githubBranch});
      res.json(result);
    } catch(e){res.status(400).json({ok:false,error:String(e)});}
  });
}
