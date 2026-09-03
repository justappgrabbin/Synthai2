import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { Activity, ArrowLeft, Clock3, Dna, Orbit, Save, ShieldCheck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CENTER_LABELS,
  GATE_DATA,
  calculateBirthTimeSensitivity,
  calculateHumanDesign,
  calculateTransit,
  compareHumanDesign,
  type CenterKey,
  type HumanDesignChart,
} from "@/lib/humanDesignEngine";

const STORAGE_KEY = "synthia-human-design-charts-v1";
type View = "chart" | "deep" | "activations" | "compare" | "transits" | "evidence";

function readCharts(): HumanDesignChart[] {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value ? JSON.parse(value) : [];
  } catch {
    return [];
  }
}

function writeCharts(charts: HumanDesignChart[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(charts));
}

const CENTER_POSITIONS: Record<CenterKey, { x: number; y: number }> = {
  head: { x: 180, y: 45 }, ajna: { x: 180, y: 120 }, throat: { x: 180, y: 215 }, g: { x: 180, y: 325 },
  heart: { x: 258, y: 345 }, spleen: { x: 92, y: 405 }, solar: { x: 278, y: 418 }, sacral: { x: 180, y: 475 }, root: { x: 180, y: 570 },
};

function BodyGraph({ chart }: { chart: HumanDesignChart }) {
  const defined = new Set(chart.centers.defined);
  return (
    <div className="rounded-xl border bg-background/60 p-3">
      <svg viewBox="0 0 360 625" className="mx-auto h-auto w-full max-w-[420px]" role="img" aria-label="Human Design BodyGraph">
        {chart.channels.map((channel) => {
          const a = CENTER_POSITIONS[channel.centers[0]], b = CENTER_POSITIONS[channel.centers[1]];
          return <line key={channel.gates.join("-")} x1={a.x} y1={a.y} x2={b.x} y2={b.y} className="stroke-primary" strokeWidth="8" strokeLinecap="round" opacity="0.72" />;
        })}
        {Object.entries(CENTER_POSITIONS).map(([key, pos]) => {
          const center = key as CenterKey, isDefined = defined.has(center), isDiamond = center === "g", isTriangle = ["head", "spleen", "solar"].includes(center);
          return (
            <g key={center}>
              {isDiamond ? <polygon points={`${pos.x},${pos.y - 37} ${pos.x + 37},${pos.y} ${pos.x},${pos.y + 37} ${pos.x - 37},${pos.y}`} className={isDefined ? "fill-primary stroke-primary" : "fill-background stroke-muted-foreground"} strokeWidth="3" />
                : isTriangle ? <polygon points={`${pos.x},${pos.y - 31} ${pos.x + 35},${pos.y + 29} ${pos.x - 35},${pos.y + 29}`} className={isDefined ? "fill-primary stroke-primary" : "fill-background stroke-muted-foreground"} strokeWidth="3" />
                : <rect x={pos.x - 38} y={pos.y - 28} width="76" height="56" rx="8" className={isDefined ? "fill-primary stroke-primary" : "fill-background stroke-muted-foreground"} strokeWidth="3" />}
              <text x={pos.x} y={pos.y + 4} textAnchor="middle" className={isDefined ? "fill-primary-foreground" : "fill-foreground"} fontSize="12" fontWeight="700">{CENTER_LABELS[center].replace(" / Ego", "")}</text>
            </g>
          );
        })}
      </svg>
      <div className="mt-2 text-center text-xs text-muted-foreground"><strong className="text-foreground">Defined:</strong> {chart.centers.defined.map((c) => CENTER_LABELS[c]).join(", ") || "None"}</div>
    </div>
  );
}

function SummaryPill({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border bg-card p-3"><div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</div><div className="mt-1 text-sm font-semibold text-foreground">{value}</div></div>;
}

function VariableCard({ label, value }: { label: string; value: HumanDesignChart["variables"]["determination"] }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-start justify-between gap-3"><div><div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</div><div className="mt-1 text-lg font-semibold">{value.name}</div></div><div className="rounded-full border px-2 py-1 text-xs font-bold uppercase">{value.direction === "left" ? "← L" : "R →"}</div></div>
      <p className="mt-2 text-sm text-muted-foreground">{value.description}</p>
      <div className="mt-3 grid grid-cols-4 gap-2 text-center text-xs"><div className="rounded border p-2"><div className="text-muted-foreground">Color</div><strong>{value.color}</strong></div><div className="rounded border p-2"><div className="text-muted-foreground">Tone</div><strong>{value.tone}</strong></div><div className="rounded border p-2"><div className="text-muted-foreground">Base</div><strong>{value.base}</strong></div><div className="rounded border p-2"><div className="text-muted-foreground">Base mode</div><strong>{value.baseOrientation}</strong></div></div>
      {value.cognition && <div className="mt-2 text-xs"><span className="text-muted-foreground">Cognition:</span> <strong>{value.cognition}</strong></div>}
    </div>
  );
}

export default function HumanDesignStudio() {
  const [, setLocation] = useLocation();
  const defaultTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  const [name, setName] = useState(""), [birthDate, setBirthDate] = useState(""), [birthTime, setBirthTime] = useState(""), [timezone, setTimezone] = useState(defaultTimezone);
  const [uncertainty, setUncertainty] = useState(30), [nodeType, setNodeType] = useState<"true" | "mean">("true");
  const [chart, setChart] = useState<HumanDesignChart | null>(null), [sensitivity, setSensitivity] = useState<ReturnType<typeof calculateBirthTimeSensitivity> | null>(null);
  const [saved, setSaved] = useState<HumanDesignChart[]>(() => readCharts()), [activeView, setActiveView] = useState<View>("chart"), [error, setError] = useState(""), [compareId, setCompareId] = useState("");
  const [transitMoment, setTransitMoment] = useState(() => new Date().toISOString().slice(0, 16));

  const comparison = useMemo(() => { if (!chart || !compareId) return null; const other = saved.find((item) => item.id === compareId); return other ? { other, result: compareHumanDesign(chart, other) } : null; }, [chart, compareId, saved]);
  const transit = useMemo(() => { if (!chart) return null; const date = new Date(transitMoment); return Number.isNaN(date.getTime()) ? null : calculateTransit(date, chart, nodeType); }, [chart, transitMoment, nodeType]);

  const runChart = () => {
    setError(""); if (!birthDate || !birthTime || !timezone) { setError("Birth date, time, and timezone are required."); return; }
    try { const input = { name, birthDate, birthTime, timezone, nodeType }; const next = calculateHumanDesign(input); setChart(next); setSensitivity(calculateBirthTimeSensitivity(input, uncertainty)); setActiveView("chart"); }
    catch (cause) { setError(cause instanceof Error ? cause.message : String(cause)); }
  };
  const saveChart = () => { if (!chart) return; const next = [chart, ...saved.filter((item) => item.id !== chart.id)]; setSaved(next); writeCharts(next); };
  const loadChart = (loaded: HumanDesignChart) => { setChart(loaded); setName(loaded.subject.name); setBirthDate(loaded.subject.birthDate); setBirthTime(loaded.subject.birthTime); setTimezone(loaded.subject.timezone); setSensitivity(null); };
  const views: Array<{ id: View; label: string; icon: typeof Dna }> = [{ id: "chart", label: "Chart", icon: Dna }, { id: "deep", label: "Deep Map", icon: Orbit }, { id: "activations", label: "Activations", icon: Activity }, { id: "compare", label: "Compare", icon: Users }, { id: "transits", label: "Transits", icon: Clock3 }, { id: "evidence", label: "Evidence", icon: ShieldCheck }];

  return (
    <div className="min-h-screen bg-background px-3 pb-28 pt-20 md:px-6" data-testid="human-design-studio">
      <div className="mx-auto max-w-7xl space-y-5">
        <header className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3"><Button variant="outline" size="icon" onClick={() => setLocation("/")} aria-label="Back to Synthia"><ArrowLeft className="h-4 w-4" /></Button><div><div className="flex items-center gap-2"><Dna className="h-5 w-5 text-primary" /><span className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Synthia Human Design</span></div><h1 className="mt-1 text-2xl font-bold md:text-3xl">BodyGraph Studio</h1><p className="mt-1 text-sm text-muted-foreground">Deterministic charting first. Interpretation stays downstream of the facts.</p></div></div>
          {chart && <Button onClick={saveChart}><Save className="mr-2 h-4 w-4" />Save Chart</Button>}
        </header>

        <Card><CardHeader><CardTitle>Birth Input</CardTitle><CardDescription>Calculated locally with the ephemeris already inside SynthAI.</CardDescription></CardHeader><CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-6">
            <label className="space-y-1 lg:col-span-2"><span className="text-xs font-medium">Name</span><input className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={name} onChange={(e) => setName(e.target.value)} placeholder="Chart name" /></label>
            <label className="space-y-1"><span className="text-xs font-medium">Birth date</span><input type="date" className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} /></label>
            <label className="space-y-1"><span className="text-xs font-medium">Birth time</span><input type="time" className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={birthTime} onChange={(e) => setBirthTime(e.target.value)} /></label>
            <label className="space-y-1"><span className="text-xs font-medium">Timezone</span><input className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={timezone} onChange={(e) => setTimezone(e.target.value)} placeholder="America/Los_Angeles" /></label>
            <label className="space-y-1"><span className="text-xs font-medium">Birth-time ± min</span><input type="number" min="0" max="720" className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={uncertainty} onChange={(e) => setUncertainty(Math.max(0, Number(e.target.value) || 0))} /></label>
          </div><div className="mt-3 flex flex-wrap items-end gap-3"><label className="space-y-1"><span className="text-xs font-medium">Lunar node</span><select className="h-10 rounded-md border bg-background px-3 text-sm" value={nodeType} onChange={(e) => setNodeType(e.target.value as "true" | "mean")}><option value="true">True Node</option><option value="mean">Mean Node</option></select></label><Button className="h-10" onClick={runChart}>Calculate BodyGraph</Button>{error && <p className="text-sm text-destructive">{error}</p>}</div>
        </CardContent></Card>

        {saved.length > 0 && <div className="flex gap-2 overflow-x-auto pb-1">{saved.map((item) => <button key={item.id} onClick={() => loadChart(item)} className="shrink-0 rounded-full border bg-card px-3 py-1.5 text-xs font-medium hover:border-primary">{item.subject.name} · {item.summary.type}</button>)}</div>}

        {!chart ? <Card className="border-dashed"><CardContent className="flex min-h-56 flex-col items-center justify-center text-center"><Dna className="mb-3 h-10 w-10 text-primary" /><h2 className="text-lg font-semibold">A real chart lives here.</h2><p className="mt-1 max-w-lg text-sm text-muted-foreground">Enter birth data. Synthia calculates the astronomical positions, exact 88° design moment, BodyGraph structure, and deep substructure locally.</p></CardContent></Card> : <>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4 lg:grid-cols-8"><SummaryPill label="Type" value={chart.summary.type} /><SummaryPill label="Strategy" value={chart.summary.strategy} /><SummaryPill label="Authority" value={chart.summary.authority} /><SummaryPill label="Profile" value={`${chart.summary.profile} · ${chart.summary.profileName}`} /><SummaryPill label="Definition" value={chart.summary.definition} /><SummaryPill label="Signature" value={chart.summary.signature} /><SummaryPill label="Not-Self" value={chart.summary.notSelf} /><SummaryPill label="Variables" value={chart.variables.notation} /></div>
          <div className="flex gap-2 overflow-x-auto rounded-lg border bg-card p-2">{views.map((view) => <Button key={view.id} size="sm" variant={activeView === view.id ? "default" : "ghost"} className="shrink-0" onClick={() => setActiveView(view.id)}><view.icon className="mr-2 h-4 w-4" />{view.label}</Button>)}</div>

          {activeView === "chart" && <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]"><BodyGraph chart={chart} /><div className="space-y-4"><Card><CardHeader><CardTitle>{chart.subject.name}</CardTitle><CardDescription>{chart.subject.birthDate} {chart.subject.birthTime} · {chart.subject.timezone}</CardDescription></CardHeader><CardContent className="space-y-3 text-sm"><p><strong>Incarnation Cross gates:</strong> {chart.summary.crossGates.join(" / ")}</p><p><strong>Active channels:</strong> {chart.channels.length ? chart.channels.map((c) => `${c.gates.join("-")} ${c.name}`).join(", ") : "None"}</p><p><strong>Undefined centers:</strong> {chart.centers.undefined.map((c) => CENTER_LABELS[c]).join(", ") || "None"}</p><p><strong>Open centers:</strong> {chart.centers.open.map((c) => CENTER_LABELS[c]).join(", ") || "None"}</p></CardContent></Card><Card className={sensitivity?.stable === false ? "border-destructive/60" : "border-primary/30"}><CardHeader><CardTitle className="text-base">Birth-time sensitivity</CardTitle></CardHeader><CardContent><p className="text-sm">{sensitivity ? (sensitivity.stable ? `Core chart is stable across ±${sensitivity.minutes} minutes.` : `Core chart changes inside the ±${sensitivity.minutes} minute window.`) : "Sensitivity was not recalculated for this saved chart."}</p>{sensitivity?.changes.map((change) => <p key={change} className="mt-1 text-xs text-muted-foreground">• {change}</p>)}</CardContent></Card></div></div>}
          {activeView === "deep" && <div className="grid gap-4 md:grid-cols-2"><VariableCard label="Determination / Digestion · Design Sun" value={chart.variables.determination} /><VariableCard label="Environment · Design Node" value={chart.variables.environment} /><VariableCard label="Motivation · Personality Sun" value={chart.variables.motivation} /><VariableCard label="Perspective / View · Personality Node" value={chart.variables.perspective} /></div>}
          {activeView === "activations" && <Card><CardHeader><CardTitle>Planetary Activations</CardTitle><CardDescription>Every activation preserves longitude → gate → line → color → tone → base.</CardDescription></CardHeader><CardContent><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="border-b text-xs uppercase text-muted-foreground"><tr><th className="p-2">Side</th><th className="p-2">Planet</th><th className="p-2">Gate</th><th className="p-2">Line</th><th className="p-2">Color</th><th className="p-2">Tone</th><th className="p-2">Base</th><th className="p-2">Longitude</th><th className="p-2">Center</th></tr></thead><tbody>{[...chart.activations.personality, ...chart.activations.design].map((a) => <tr key={`${a.side}-${a.planet}`} className="border-b last:border-0"><td className="p-2 capitalize">{a.side}</td><td className="p-2 capitalize font-medium">{a.planet}</td><td className="p-2"><strong>{a.gate}</strong> · {a.gateName}</td><td className="p-2">{a.line}</td><td className="p-2">{a.color}</td><td className="p-2">{a.tone}</td><td className="p-2">{a.base}</td><td className="p-2 font-mono text-xs">{a.longitude.toFixed(6)}°</td><td className="p-2">{CENTER_LABELS[a.center]}</td></tr>)}</tbody></table></div></CardContent></Card>}
          {activeView === "compare" && <Card><CardHeader><CardTitle>Relationship Lab</CardTitle><CardDescription>Compare two deterministic structures before narrative interpretation.</CardDescription></CardHeader><CardContent className="space-y-4"><select className="h-10 w-full max-w-md rounded-md border bg-background px-3 text-sm" value={compareId} onChange={(e) => setCompareId(e.target.value)}><option value="">Choose a saved chart…</option>{saved.filter((item) => item.id !== chart.id).map((item) => <option key={item.id} value={item.id}>{item.subject.name} · {item.summary.type}</option>)}</select>{comparison ? <div className="grid gap-3 md:grid-cols-2"><SummaryPill label="Pair" value={comparison.result.typePair} /><SummaryPill label="Authorities" value={comparison.result.authorityPair} /><SummaryPill label="Shared Gates" value={comparison.result.sharedGates.join(", ") || "None"} /><SummaryPill label="Shared Channels" value={comparison.result.sharedChannels.map((c) => c.gates.join("-")).join(", ") || "None"} /><div className="rounded-lg border bg-card p-4 md:col-span-2"><div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Electromagnetic channels</div><p className="mt-2 text-sm">{comparison.result.electromagneticChannels.map((c) => `${c.gates.join("-")} ${c.name}`).join(", ") || "No complete electromagnetic connections from the two gate sets."}</p></div></div> : <p className="text-sm text-muted-foreground">Save at least one other chart, then select it here.</p>}</CardContent></Card>}
          {activeView === "transits" && <Card><CardHeader><CardTitle>Transit Overlay</CardTitle><CardDescription>Calculate the sky for any moment and compare its gates with this natal chart.</CardDescription></CardHeader><CardContent className="space-y-4"><input type="datetime-local" className="h-10 rounded-md border bg-background px-3 text-sm" value={transitMoment} onChange={(e) => setTransitMoment(e.target.value)} />{transit && <div className="grid gap-3 md:grid-cols-3"><SummaryPill label="Transit Gates" value={transit.gates.join(", ")} /><SummaryPill label="Natal Repeats" value={transit.sharedWithNatal.join(", ") || "None"} /><SummaryPill label="New / Bridged Channels" value={transit.bridgedChannels.map((c) => c.gates.join("-")).join(", ") || "None"} /><div className="overflow-x-auto rounded-lg border md:col-span-3"><table className="w-full min-w-[620px] text-sm"><thead className="border-b text-xs uppercase text-muted-foreground"><tr><th className="p-2 text-left">Planet</th><th className="p-2 text-left">Gate.Line</th><th className="p-2 text-left">Color</th><th className="p-2 text-left">Tone</th><th className="p-2 text-left">Base</th></tr></thead><tbody>{transit.activations.map((a) => <tr key={a.planet} className="border-b last:border-0"><td className="p-2 capitalize">{a.planet}</td><td className="p-2">{a.gate}.{a.line} · {GATE_DATA[a.gate].name}</td><td className="p-2">{a.color}</td><td className="p-2">{a.tone}</td><td className="p-2">{a.base}</td></tr>)}</tbody></table></div></div>}</CardContent></Card>}
          {activeView === "evidence" && <div className="grid gap-4 md:grid-cols-2"><Card><CardHeader><CardTitle>Calculation Provenance</CardTitle><CardDescription>The chart facts are reproducible without an LLM.</CardDescription></CardHeader><CardContent className="space-y-2 text-sm"><p><strong>Engine:</strong> {chart.evidence.engine}</p><p><strong>Ephemeris:</strong> {chart.evidence.ephemeris}</p><p><strong>Node:</strong> {chart.evidence.nodeType}</p><p><strong>Design:</strong> exact {chart.evidence.designSolarArc}° solar arc</p><p><strong>Wheel anchor:</strong> {chart.evidence.gateWheelOffset}°</p><p><strong>Generated:</strong> {new Date(chart.evidence.generatedAt).toLocaleString()}</p></CardContent></Card><Card><CardHeader><CardTitle>Trust Chain</CardTitle></CardHeader><CardContent><ol className="space-y-3 text-sm"><li><strong>1. Birth wall time → UTC</strong><div className="text-muted-foreground">{chart.subject.birthUtc} ({chart.subject.utcOffsetHours >= 0 ? "+" : ""}{chart.subject.utcOffsetHours}h)</div></li><li><strong>2. Astronomical positions</strong><div className="text-muted-foreground">Sun, Earth, Moon, nodes, Mercury through Pluto.</div></li><li><strong>3. 88° Design moment</strong><div className="text-muted-foreground">{chart.subject.designUtc}</div></li><li><strong>4. Nested coordinate</strong><div className="text-muted-foreground">Longitude → Gate → Line → Color → Tone → Base.</div></li><li><strong>5. Structural derivation</strong><div className="text-muted-foreground">Channels → centers → definition → type → authority; Variables from Sun/Nodes.</div></li></ol></CardContent></Card></div>}
        </>}
      </div>
    </div>
  );
}
