import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { publishMeshEvent } from "@/lib/meshEvents";

type Page = "world" | "studio";
type WorldReceipt = {
  mode:string; operation:string; targetId:string; changed:true; saved:boolean;
  interactionCount:number; activeObjects:number; composites:number;
  formationRevision:string | number; completed:boolean | null;
};
type CharacterStatus = {status:string;reason?:string|null};
function isWorldReceipt(x: unknown): x is WorldReceipt {
  if (!x || typeof x !== "object") return false;
  const r = x as Record<string,unknown>;
  return r.changed === true &&
    ["Play","Create","Mission"].includes(String(r.mode)) &&
    ["transform","move","duplicate","remove"].includes(String(r.operation)) &&
    typeof r.targetId === "string" && r.targetId.length <= 128 &&
    typeof r.interactionCount === "number" && Number.isSafeInteger(r.interactionCount) &&
    typeof r.saved === "boolean" &&
    typeof r.activeObjects === "number" && Number.isFinite(r.activeObjects) &&
    typeof r.composites === "number" && Number.isFinite(r.composites) &&
    (typeof r.formationRevision === "string" || typeof r.formationRevision === "number");
}

/**
 * Existing SynthAi2 computer owns the navigation and mesh events.
 * The actual Simlish engines run in their ORIGINAL same-origin local page,
 * with their original IndexedDB, world persistence, drawings and rendering.
 */
export default function SimlishWorld() {
  const [, navigate] = useLocation();
  const frame = useRef<HTMLIFrameElement>(null);
  const [page, setPage] = useState<Page>("world");
  const [runtime, setRuntime] = useState<"checking"|"ready"|"missing">("checking");
  const [last, setLast] = useState<WorldReceipt|null>(null);
  const [character, setCharacter] = useState<CharacterStatus|null>(null);

  useEffect(() => {
    let active = true;
    fetch("/simlish/source-manifest.json", {cache:"no-store"})
      .then(async r => {
        if (!r.ok) throw new Error("Bundled Simlish missing");
        const manifest = await r.json();
        if (!manifest.worldCommit || !manifest.morphCommit) throw new Error("Source identity missing");
        if (active) setRuntime("ready");
      }).catch(() => {if(active) setRuntime("missing");});
    return () => {active = false;};
  }, []);

  const onMessage = useCallback((event: MessageEvent) => {
    if (event.origin !== window.location.origin || event.source !== frame.current?.contentWindow) return;
    const data = event.data;
    if (!data || data.source !== "simlish-world-bridge-v1" || page !== "world") return;
    if (data.kind === "world.operation" && isWorldReceipt(data.payload)) {
      const receipt = data.payload;
      setLast(receipt);
      // Existing event bus; never fake unknown canonical 13-field positions.
      void publishMeshEvent({
        source:"simlish-live-world",
        type:"world.operation",
        topic:"simlish:world",
        payload:{
          mode:receipt.mode, op:receipt.operation, targetId:receipt.targetId,
          changed:true, localSaved:receipt.saved, interactionCount:receipt.interactionCount,
          objects:receipt.activeObjects, composites:receipt.composites,
          formationRevision:receipt.formationRevision, missionCompleted:receipt.completed,
        },
      });
    }
    if (data.kind === "character.status" && data.payload && typeof data.payload.status === "string") {
      setCharacter({status:data.payload.status,reason:typeof data.payload.reason === "string"?data.payload.reason:null});
    }
  }, [page]);
  useEffect(() => {
    window.addEventListener("message",onMessage);
    return () => window.removeEventListener("message",onMessage);
  },[onMessage]);

  const request3d = () => {
    if(page !== "world" || runtime !== "ready") return;
    setCharacter({status:"building-3d"});
    frame.current?.contentWindow?.postMessage({source:"synthai2-computer-v1",kind:"character.3d.request"},window.location.origin);
  };
  const reuseCharacter = () => {
    if (page !== "world" || runtime !== "ready") return;
    setCharacter({status:"requested"});
    frame.current?.contentWindow?.postMessage({
      source:"synthai2-computer-v1",kind:"character.reuse.request",
    },window.location.origin);
  };

  return <main className="mx-auto max-w-7xl space-y-4 px-3 py-4 pb-28" data-testid="simlish-world-integrated">
    <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div><h1 className="text-2xl font-semibold">Simlish · YOU-N-I-VERSE</h1>
        <p className="text-sm text-muted-foreground">Original local world, Swarm/ATO formation engine and character studio inside SynthAi2.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant={page==="world"?"default":"outline"} onClick={()=>{setPage("world");setCharacter(null);}}>Play World</Button>
        <Button variant={page==="studio"?"default":"outline"} onClick={()=>{setPage("studio");setCharacter(null);}}>Character Studio</Button>
        <Button variant="outline" onClick={()=>navigate("/human-design")}>Human Design</Button>
        <Button variant="outline" onClick={()=>navigate("/mesh")}>Morph / Mesh</Button>
      </div>
    </header>
    <section className="flex flex-wrap items-center gap-3 text-sm">
      <span role="status">Simlish package: {runtime==="ready"?"pinned source found":runtime==="missing"?"not bundled in this build":"checking"}</span>
      {page==="world" && <Button size="sm" onClick={request3d} disabled={runtime!=="ready"}>Build / load 3D character</Button>}
      {page==="world" && <Button size="sm" variant="secondary" disabled={runtime!=="ready"} onClick={reuseCharacter}>Use 2D portrait</Button>}
      {character && <span role="status">Character: {character.status}{character.reason?" ("+character.reason+")":""}</span>}
    </section>
    {runtime==="missing" ? <Card><CardContent className="p-6">This installed SynthAi2 build is missing the original Simlish assets. Rebuild from the pinned source integration; no replacement/demo world is shown.</CardContent></Card> :
      <iframe ref={frame} key={page} title={page==="world"?"Original Simlish live world":"Original Simlish character studio"}
        src={page==="world"?"/simlish/world.html":"/simlish/index.html"}
        className="h-[72vh] min-h-[520px] w-full rounded-lg border bg-background"
        allow="camera; microphone" />}
    {page==="world" && <Card><CardHeader><CardTitle>Actual world execution</CardTitle></CardHeader><CardContent>
      {last ? <p className="text-sm" role="status">{last.mode}: {last.operation} on {last.targetId} — {last.interactionCount} real actions; {last.activeObjects} objects, {last.composites} composites; local replay {last.saved?"saved":"not saved (export in world)"}.</p> :
      <p className="text-sm text-muted-foreground">Use Play, Create or Mission in the original world. Verified execution receipts will appear here and publish into the existing Mesh when its backend is available.</p>}
    </CardContent></Card>}
  </main>;
}
