import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Link2, Upload, Download, ClipboardList } from "lucide-react";

/**
 * Connect the REAL SynthAi 2 IDE to the local SYNTHAI CONTINUITY app.
 * Does not replace this IDE, mutate originals, or silently observe typing.
 * Continuity stores immutable SHA-256 addressed copies and receipts.
 */
const ENDPOINT = "http://127.0.0.1:4183";
interface Artifact {
  address: string;
  name: string;
  kind: string;
  project: string|null;
  size: number;
}
interface Props {
  fileName: string|null;
  editorText: string;
  onReceive: (name:string,text:string)=>void;
}
export function ContinuityIDEBridge({fileName,editorText,onReceive}:Props) {
  const [open,setOpen]=useState(false);
  const [key,setKey]=useState("");
  const [project,setProject]=useState("justappgrabbin/Synthai2");
  const [items,setItems]=useState<Artifact[]>([]);
  const [status,setStatus]=useState("Disconnected: Continuity's local Android service must be running.");
  const [busy,setBusy]=useState(false);
  const [note,setNote]=useState("");

  async function api(path:string, options:{method?:string,body?:unknown,raw?:Blob,responseType?:'json'|'buffer'}={}) {
    if(!/^[0-9a-f]{64}$/.test(key.trim()))throw Error("Paste the Continuity access key from the Android app");
    const method=options.method||"GET";
    const headers:Record<string,string>={"x-synthia-access-key":key.trim()};
    if(options.body!=null)headers["Content-Type"]="application/json";
    const result=await fetch(ENDPOINT+path,{method,headers,
      body:options.raw??(options.body==null?undefined:JSON.stringify(options.body))
    });
    if(!result.ok) {
      const message=await result.text();
      throw Error("Continuity returned HTTP "+result.status+": "+message.slice(0,160));
    }
    return options.responseType==="buffer"?result.arrayBuffer():result.json();
  }
  async function work(task:()=>Promise<void>) {
    setBusy(true);
    try{await task();}catch(error) {
      setStatus("Failed: "+(error instanceof Error?error.message:String(error)));
    }finally{setBusy(false);}
  }
  async function connect() {
    const result=await api("/api/companion/events?limit=1");
    if(!result.ok)throw Error("Continuity refused access");
    setStatus("Connected to local Continuity. Append-only entry #"+result.state.seq);
    await list();
  }
  async function list() {
    const result=await api("/api/companion/library");
    setItems((result.items||[]).filter((x:Artifact)=>x.size<1024*1024&&
      ["source","document","data","web"].includes(x.kind)));
  }
  async function send() {
    if(!fileName)throw Error("Select a file in this IDE first");
    if(!editorText.length)throw Error("Current editor text is empty");
    if(!confirm("Save a separately addressed COPY of "+fileName+" to SYNTHAI CONTINUITY? Your SynthAi 2 source remains unchanged."))return;
    const bytes=new TextEncoder().encode(editorText);
    if(bytes.byteLength>5*1024*1024)throw Error("Use the phone file picker for sources larger than 5 MiB");
    const result=await api("/api/companion/library/start",{method:"POST",body:{
      name:fileName,size:bytes.byteLength,mime:"text/plain",
      originalSource:"synthai2-ide-explicit-export",project:project.trim()||null
    }});
    let offset=0;
    while(offset<bytes.byteLength){
      const chunk=bytes.slice(offset,offset+result.chunkSize);
      const progress=await api("/api/companion/library/chunk?uploadId="+encodeURIComponent(result.uploadId),
        {method:"POST",raw:new Blob([chunk])});
      offset=progress.offset;
    }
    const saved=await api("/api/companion/library/complete",{method:"POST",body:{uploadId:result.uploadId}});
    setStatus("Preserved "+fileName+" as "+saved.artifact.address+"; original IDE file unchanged");
    await list();
  }
  async function bringIn(item:Artifact) {
    if(!confirm("Open a new, editable COPY of "+item.name+" in SynthAi 2?"))return;
    const data=await api("/api/companion/library/download?address="+encodeURIComponent(item.address),
      {responseType:"buffer"}) as ArrayBuffer;
    const content=new TextDecoder("utf-8",{fatal:true}).decode(data);
    const filename="continuity-"+Date.now()+"-"+item.name.replace(/[^a-zA-Z0-9._-]/g,"_");
    onReceive(filename,content);
    setStatus("Imported addressed file as "+filename+" — no originals overwritten");
  }
  async function checkpoint() {
    if(!note.trim())throw Error("Enter a checkpoint first");
    const result=await api("/api/companion/events",{method:"POST",body:{
      type:"checkpoint",actor:"synthai2-ide",content:note,ref:"justappgrabbin/Synthai2"
    }});
    setStatus("Shared checkpoint #"+result.event.seq+" with Cynthia/GPT");
    setNote("");
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" data-testid="button-continuity-ide" title="Share real IDE sources and context with SYNTHAI CONTINUITY">
          <Link2 className="h-4 w-4 mr-1" /> Continuity
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>SYNTHAI CONTINUITY · SynthAi 2 IDE</DialogTitle>
          <DialogDescription>Preserve and exchange actual source files with the phone companion, Cynthia Acode, and GPT. No simulation or silent changes.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <label className="block">Local companion access key
            <Input type="password" value={key} onChange={e=>setKey(e.target.value)} placeholder="From SYNTHAI CONTINUITY Android launcher" autoComplete="off"/>
          </label>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" disabled={busy} onClick={()=>work(connect)}>Connect & fetch library</Button>
            <Button size="sm" variant="outline" disabled={busy} onClick={()=>work(list)}>Refresh</Button>
          </div>
          <p className="text-xs text-muted-foreground break-words" role="status">{status}</p>
          <label className="block">Project
            <Input value={project} onChange={e=>setProject(e.target.value)} />
          </label>
          <p className="text-xs text-muted-foreground">Selected IDE file: {fileName||"No file selected"}; unsaved editor text is included only if you choose Send.</p>
          <Button disabled={busy||!fileName} onClick={()=>work(send)} size="sm"><Upload className="h-4 w-4 mr-1"/>Send addressed copy of current IDE file</Button>
          <h3 className="font-medium">Addressed files from Continuity</h3>
          <div className="max-h-48 overflow-y-auto space-y-2">
            {items.length?items.map(item=>(
              <div key={item.address} className="flex items-center justify-between border rounded p-2 gap-2">
                <div className="min-w-0"><div className="font-medium truncate">{item.name}</div><div className="text-xs text-muted-foreground truncate">{item.project||"Unassigned"} · {item.kind}</div></div>
                <Button type="button" size="sm" variant="secondary" disabled={busy} onClick={()=>work(()=>bringIn(item))}>
                  <Download className="h-4 w-4 mr-1"/>Open copy
                </Button>
              </div>
            )):<p className="text-xs text-muted-foreground">No addressed text files loaded yet.</p>}
          </div>
          <label className="block">Checkpoint / next task
            <Textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="What changed and what do we need to do next?" rows={3} />
          </label>
          <Button size="sm" disabled={busy||!note.trim()} onClick={()=>work(checkpoint)}>
            <ClipboardList className="h-4 w-4 mr-1"/>Record continuity checkpoint
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
