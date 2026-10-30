import { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Home, Save, Plus, Download, Trash2, Settings2 } from "lucide-react";
import { DEFAULT_HOUSE, type HousePlan, readHousePlans, writeHousePlans, downloadHousePlan } from "@/lib/housing";
import { Link } from "wouter";

/** Shared 3D mesh: used by Housing and the actual Worlds viewer. */
export function HouseMesh({ plan }: { plan: HousePlan }) {
  const w = plan.width;
  const d = plan.depth;
  const h = plan.height;
  const wall = 0.16;
  const doorWidth = Math.min(1.25, w / 3);
  const doorHeight = Math.min(2.2, h * 0.8);
  const sideWidth = (w - doorWidth) / 2;
  const rise = Math.min(1.5, d * 0.25);
  const angle = Math.atan2(rise, d / 2);
  const roofLength = Math.hypot(d / 2, rise) + 0.25;

  return (
    <group>
      <mesh position={[0, 0.06, 0]} receiveShadow>
        <boxGeometry args={[w, 0.12, d]} />
        <meshStandardMaterial color="#c7bdad" />
      </mesh>
      <mesh position={[0, h / 2, d / 2]} castShadow>
        <boxGeometry args={[w, h, wall]} />
        <meshStandardMaterial color={plan.color} />
      </mesh>
      <mesh position={[0, h / 2, -d / 2]} castShadow>
        <boxGeometry args={[w, h, wall]} />
        <meshStandardMaterial color={plan.color} />
      </mesh>
      <mesh position={[-w / 2, h / 2, 0]} castShadow>
        <boxGeometry args={[wall, h, d]} />
        <meshStandardMaterial color={plan.color} />
      </mesh>
      <mesh position={[w / 2, h / 2, 0]} castShadow>
        <boxGeometry args={[wall, h, d]} />
        <meshStandardMaterial color={plan.color} />
      </mesh>
      <mesh position={[0, doorHeight / 2, -d / 2 - 0.09]}>
        <boxGeometry args={[doorWidth, doorHeight, 0.04]} />
        <meshStandardMaterial color="#62504a" />
      </mesh>
      <mesh position={[0, doorHeight * 0.52, -d / 2 - 0.13]}>
        <sphereGeometry args={[0.07, 8, 8]} />
        <meshStandardMaterial color="#e1c77b" metalness={0.6} roughness={0.4} />
      </mesh>
      {[-w * 0.3, w * 0.3].map(x => (
        <mesh key={x} position={[x, h * 0.57, d / 2 + 0.09]}>
          <boxGeometry args={[Math.min(1, w / 5), Math.min(1.15, h / 3), 0.04]} />
          <meshStandardMaterial color="#83b6c7" metalness={0.1} roughness={0.15} />
        </mesh>
      ))}
      {plan.roof === "flat" ? (
        <mesh position={[0, h + 0.12, 0]} castShadow>
          <boxGeometry args={[w + 0.45, 0.22, d + 0.45]} />
          <meshStandardMaterial color="#574555" />
        </mesh>
      ) : (
        <>
          <mesh position={[0, h + rise / 2, -d / 4]} rotation={[-angle, 0, 0]} castShadow>
            <boxGeometry args={[w + 0.4, 0.16, roofLength]} />
            <meshStandardMaterial color="#574555" />
          </mesh>
          <mesh position={[0, h + rise / 2, d / 4]} rotation={[angle, 0, 0]} castShadow>
            <boxGeometry args={[w + 0.4, 0.16, roofLength]} />
            <meshStandardMaterial color="#574555" />
          </mesh>
        </>
      )}
    </group>
  );
}

type WorldOption = { id: string; name: string };

export function HousingStudio({ worlds }: { worlds: WorldOption[] }) {
  const { toast } = useToast();
  const [plans, setPlans] = useState<HousePlan[]>(readHousePlans);
  const [draft, setDraft] = useState<HousePlan>({ ...DEFAULT_HOUSE });

  useEffect(() => {
    const refresh = () => setPlans(readHousePlans());
    window.addEventListener("synthai-housing-changed", refresh);
    return () => window.removeEventListener("synthai-housing-changed", refresh);
  }, []);

  const change = <K extends keyof HousePlan>(key: K, value: HousePlan[K]) =>
    setDraft(prev => ({ ...prev, [key]: value }));

  const save = () => {
    if (!draft.name.trim()) {
      toast({ title: "Name the home before saving", variant: "destructive" });
      return;
    }
    const saved: HousePlan = {
      ...draft,
      id: draft.id || String(Date.now()) + "-" + Math.random().toString(36).slice(2, 8),
      name: draft.name.trim(),
      updatedAt: new Date().toISOString()
    };
    const updated = [saved, ...plans.filter(h => h.id !== saved.id)];
    try {
      writeHousePlans(updated);
      setPlans(updated);
      setDraft(saved);
      toast({ title: "Home saved", description: saved.worldId ? "Linked to its chosen World" : "Saved in the Housing library" });
    } catch {
      toast({ title: "Couldn't save the home", description: "Check browser storage permissions.", variant: "destructive" });
    }
  };

  const remove = (id: string) => {
    if (!window.confirm("Delete this saved home?")) return;
    try {
      const updated = plans.filter(h => h.id !== id);
      writeHousePlans(updated);
      setPlans(updated);
      if (draft.id === id) setDraft({ ...DEFAULT_HOUSE });
    } catch {
      toast({ title: "Couldn't delete home", variant: "destructive" });
    }
  };

  const numberInput = (label: string, key: "width" | "depth" | "height", min: number, max: number) => (
    <div className="space-y-1">
      <Label htmlFor={"housing-" + key}>{label} (m)</Label>
      <Input id={"housing-" + key} type="number" step="0.5" min={min} max={max} value={draft[key]}
        onChange={e => change(key, Math.max(min, Math.min(max, Number(e.target.value) || min)))} />
    </div>
  );

  return (
    <div className="space-y-4" data-testid="housing-studio">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2"><Home className="w-5 h-5 text-primary" /> Housing</h2>
          <p className="text-sm text-muted-foreground">Design homes, save them, and assign each one to an existing World.</p>
        </div>
        <Link href="/settings"><Button variant="outline" size="sm"><Settings2 className="w-4 h-4 mr-2" /> Builder Add-ons in Settings</Button></Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Home Layout</CardTitle>
            <CardDescription>The built-in editor works without downloading a 3D engine. Pascal offers more detailed construction when installed separately.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1"><Label htmlFor="housing-name">Name</Label>
              <Input id="housing-name" value={draft.name} onChange={e => change("name", e.target.value)} />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {numberInput("Width", "width", 3, 30)}
              {numberInput("Depth", "depth", 3, 30)}
              {numberInput("Walls", "height", 2, 10)}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label htmlFor="housing-roof">Roof</Label>
                <select id="housing-roof" className="w-full h-10 rounded-md border bg-background px-2" value={draft.roof}
                  onChange={e => change("roof", e.target.value as HousePlan["roof"])}>
                  <option value="gable">Gable</option><option value="flat">Flat</option>
                </select>
              </div>
              <div className="space-y-1"><Label htmlFor="housing-color">Exterior color</Label>
                <Input id="housing-color" type="color" className="h-10 w-full" value={draft.color} onChange={e => change("color", e.target.value)} />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="housing-world">Place in World</Label>
              <select id="housing-world" className="w-full h-10 rounded-md border bg-background px-2"
                value={draft.worldId} onChange={e => change("worldId", e.target.value)}>
                <option value="">Housing library only</option>
                {worlds.map(world => <option key={world.id} value={world.id}>{world.name}</option>)}
              </select>
              <p className="text-xs text-muted-foreground">World-linked homes appear in that World's 3D view after you save.</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1"><Label htmlFor="housing-x">Position X</Label>
                <Input id="housing-x" type="number" value={draft.positionX} onChange={e => change("positionX", Number(e.target.value) || 0)} />
              </div>
              <div className="space-y-1"><Label htmlFor="housing-z">Position Z</Label>
                <Input id="housing-z" type="number" value={draft.positionZ} onChange={e => change("positionZ", Number(e.target.value) || 0)} />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={save} data-testid="housing-save"><Save className="w-4 h-4 mr-1" /> Save Home</Button>
              <Button variant="outline" onClick={() => setDraft({ ...DEFAULT_HOUSE })}><Plus className="w-4 h-4 mr-1" /> New Home</Button>
              <Button variant="outline" disabled={!draft.id} onClick={() => downloadHousePlan(draft)}><Download className="w-4 h-4 mr-1" /> Export JSON</Button>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>3D Housing Preview</CardTitle><CardDescription>Drag to rotate, pinch or scroll to zoom.</CardDescription></CardHeader>
          <CardContent>
            <div className="h-[340px] sm:h-[450px] overflow-hidden rounded-lg bg-slate-950" data-testid="housing-preview">
              <Canvas camera={{ position: [15, 11, 16], fov: 48 }} shadows>
                <ambientLight intensity={0.9} />
                <directionalLight position={[12, 18, 9]} intensity={1.4} castShadow />
                <HouseMesh plan={draft} />
                <gridHelper args={[40, 40, "#64748b", "#334155"]} position={[0, -0.03, 0]} />
                <OrbitControls enablePan enableZoom minDistance={5} maxDistance={70} />
              </Canvas>
            </div>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader><CardTitle>Saved Homes ({plans.length})</CardTitle>
          <CardDescription>Stored on this device. Export JSON backups before clearing app data or reinstalling.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {plans.length === 0 ? <p className="text-sm text-muted-foreground">Your first editable home is ready above. Press Save Home to add it here.</p> :
            plans.map(plan => (
              <div key={plan.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3">
                <div><p className="font-medium">{plan.name}</p>
                  <p className="text-xs text-muted-foreground">{plan.width} × {plan.depth} m · {worlds.find(w => w.id === plan.worldId)?.name || "Housing library"}</p>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" onClick={() => setDraft({ ...plan })}>Edit</Button>
                  <Button size="sm" variant="outline" onClick={() => downloadHousePlan(plan)} aria-label={"Export " + plan.name}><Download className="w-4 h-4" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => remove(plan.id)} aria-label={"Delete " + plan.name}><Trash2 className="w-4 h-4" /></Button>
                </div>
              </div>
            ))}
        </CardContent>
      </Card>
    </div>
  );
}
