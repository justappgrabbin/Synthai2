import { useEffect, useMemo, useState } from "react";
import {
  Activity, ArrowRight, Bot, BrainCircuit, CheckCircle2, ClipboardList,
  Database, Download, Hammer, History, Layers, Library, MessageSquare,
  Plus, Send, Sparkles, Users, WandSparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Assignment, Domain, NeuralModel, StudioState, ToolBlueprint } from "@/lib/selfServingStudio";

type Tab = "chat" | "plan" | "tools" | "models" | "neural" | "store" | "history";
const tabs: Array<{ id: Tab; label: string }> = [
  { id: "chat", label: "Chat" }, { id: "plan", label: "Goal & Crew" },
  { id: "tools", label: "Tool Factory" }, { id: "models", label: "Model Maker" },
  { id: "neural", label: "Neural Net Maker" }, { id: "store", label: "Store" },
  { id: "history", label: "History" },
];
const domains: Domain[] = ["research", "planning", "building", "writing", "analysis", "general"];
type Health = { ok: boolean; attached: boolean; backend: string; storage: string; model: string; localModelReady: boolean };
const sessionKey = "synthai2-specialist-workspace-key";
function identity() {
  let key = localStorage.getItem(sessionKey);
  if (!key) {
    key = crypto.randomUUID();
    localStorage.setItem(sessionKey, key);
  }
  return key;
}
const download = (name: string, value: unknown) => {
  const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: "application/json" }));
  const a = document.createElement("a"); a.href = url; a.download = name; a.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 600);
};
async function api<T>(method: "GET" | "POST", path: string, payload?: unknown): Promise<T> {
  const response = await fetch(path, {
    method, credentials: "same-origin",
    headers: { "Content-Type": "application/json", "x-specialist-workspace": identity() },
    ...(payload === undefined ? {} : { body: JSON.stringify(payload) }),
  });
  const json = await response.json().catch(() => ({})) as Record<string, unknown>;
  if (!response.ok) throw new Error(String(json.error || "Request failed (" + response.status + ")"));
  return json as T;
}
type Result = { state: StudioState; result?: unknown; note?: string };
const sample = "0,0,0\n0,1,1\n1,0,1\n1,1,0";
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block space-y-1 text-sm text-slate-300"><span>{label}</span>{children}</label>;
}
function Panel({ children, title, subtitle }: { children: React.ReactNode; title?: string; subtitle?: string }) {
  return <section className="rounded-xl border border-slate-700/75 bg-slate-900/70 p-4 space-y-3">
    {title && <div><h3 className="font-semibold text-slate-100">{title}</h3>{subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}</div>}
    {children}
  </section>;
}
function Status({ status }: { status: string }) {
  return <span className={"rounded-full px-2 py-0.5 text-xs border " +
    (status === "done" || status === "online" ? "border-emerald-600 text-emerald-300" :
     status === "blocked" || status === "offline" ? "border-amber-600 text-amber-300" : "border-violet-700 text-violet-300")}>{status}</span>;
}

export default function SelfServingStudio() {
  const [state, setState] = useState<StudioState | null>(null);
  const [health, setHealth] = useState<Health | null>(null);
  const [newSession, setNewSession] = useState(false);
  const [tab, setTab] = useState<Tab>("chat");
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [draftGoal, setDraftGoal] = useState("");
  const [stepInput, setStepInput] = useState("");
  const [proof, setProof] = useState("");
  const [selectedStep, setSelectedStep] = useState("");
  const [toolName, setToolName] = useState("");
  const [toolPurpose, setToolPurpose] = useState("");
  const [toolInputFormat, setToolInputFormat] = useState("text");
  const [toolOutputFormat, setToolOutputFormat] = useState("text");
  const [stages, setStages] = useState<Array<"outline" | "questions" | "terms">>(["outline"]);
  const [toolInput, setToolInput] = useState("");
  const [toolResult, setToolResult] = useState("");
  const [modelName, setModelName] = useState("");
  const [modelPurpose, setModelPurpose] = useState("");
  const [modelInstructions, setModelInstructions] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [networkName, setNetworkName] = useState("XOR classifier");
  const [trainingRows, setTrainingRows] = useState(sample);
  const [epochs, setEpochs] = useState(2400);
  const [predictText, setPredictText] = useState("0,1");
  const [prediction, setPrediction] = useState("");

  useEffect(() => {
    let live = true;
    Promise.all([
      api<{ state: StudioState }>("GET", "/api/specialist/state"),
      fetch("/api/specialist/health").then(r => r.json() as Promise<Health>),
    ]).then(([s, h]) => { if (live) { setState(s.state); setHealth(h); } }).catch(e => { if (live) setError(String(e)); });
    return () => { live = false; };
  }, []);
  const active = useMemo(() => (!newSession && state?.activeId ? state.assignments.find(a => a.id === state.activeId) : null) || null, [newSession, state]);
  useEffect(() => { setDraftGoal(active?.goal || ""); setStepInput(active?.request || ""); setSelectedStep(""); setProof(""); }, [active?.id]);
  async function action(type: string, data: Record<string, unknown> = {}) {
    if (busy) return null;
    setBusy(true); setError(""); setNotice("");
    try {
      const response = await api<Result>("POST", "/api/specialist/action", { type, ...data });
      setState(response.state);
      if (response.note) setNotice(response.note);
      return response;
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      return null;
    } finally { setBusy(false); }
  }
  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    const r = active
      ? await action("message", { assignmentId: active.id, text, ...(selectedModel ? { modelId: selectedModel } : {}) })
      : await action("start", { request: text });
    if (r) { setInput(""); setNewSession(false); setTab("chat"); }
  };
  async function choose(a: Assignment) {
    const r = await action("select", { assignmentId: a.id });
    if (r) { setNewSession(false); setTab("chat"); }
  }
  const run = async (tool: ToolBlueprint) => {
    const r = await action("run-tool", { toolId: tool.id, input: toolInput || active?.request || "" });
    if (r?.result && typeof r.result === "object" && "output" in r.result) setToolResult(String(r.result.output));
  };
  const runStep = async (stepId: string) => {
    const r = await action("run-step", { assignmentId: active?.id, stepId, input: stepInput.trim() });
    if (r?.result && typeof r.result === "object" && "output" in r.result) setToolResult(String(r.result.output));
    if (r) setSelectedStep(stepId);
  };
  const createTool = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = await action("new-tool", { name: toolName, purpose: toolPurpose, input: toolInputFormat, output: toolOutputFormat, pipeline: stages });
    if (r) { setToolName(""); setToolPurpose(""); setTab("tools"); }
  };
  const createModel = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = await action("new-model", { name: modelName, purpose: modelPurpose, instructions: modelInstructions });
    if (r) { setModelName(""); setModelPurpose(""); setModelInstructions(""); }
  };
  const train = async (e: React.FormEvent) => {
    e.preventDefault();
    await action("train-network", { name: networkName, rows: trainingRows, epochs });
  };
  const predict = async (net: NeuralModel) => {
    const parts = predictText.split(",").map(s => Number(s.trim()));
    if (parts.length !== 2 || !parts.every(Number.isFinite)) return setError("Give two numbers, e.g. 0,1");
    const r = await action("predict", { networkId: net.id, x: parts[0], y: parts[1] });
    if (r?.result && typeof r.result === "object" && "probability" in r.result) setPrediction((Number(r.result.probability) * 100).toFixed(1) + "% positive");
  };

  return <div className="min-h-[calc(100vh-4rem)] bg-[#090d19] text-slate-100 pb-24">
    <header className="border-b border-violet-900/50 bg-gradient-to-r from-[#18132e] via-[#0e142b] to-[#08242b] px-4 py-5">
      <div className="mx-auto max-w-7xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-violet-500/20 p-3"><BrainCircuit className="h-7 w-7 text-violet-300"/></div>
          <div><h1 className="text-xl md:text-2xl font-semibold tracking-tight">Specialist Studio</h1>
            <p className="text-xs text-slate-300">GPT-style help with an attached SynthAi2 backend, factories, and recorded work.</p></div>
        </div>
        <div className="flex items-center gap-3">
          <Status status={health?.localModelReady ? "model online" : health?.attached ? "backend online" : "offline"} />
          <Button size="sm" onClick={() => { setNewSession(true); setInput(""); setTab("chat"); }} className="gap-1 bg-violet-600 hover:bg-violet-500"><Plus className="h-4 w-4"/>New assignment</Button>
        </div>
      </div>
    </header>
    {error && <div role="alert" className="mx-auto max-w-7xl mt-3 rounded-lg border border-red-800 bg-red-950/60 p-3 text-sm text-red-200">{error}</div>}
    {notice && <div className="mx-auto max-w-7xl mt-3 rounded-lg border border-teal-800 bg-teal-950/30 p-3 text-sm text-teal-200">{notice}</div>}
    <div className="mx-auto max-w-7xl grid gap-4 px-3 py-4 lg:grid-cols-[245px_minmax(0,1fr)]">
      <aside className="space-y-3">
        <Panel title="Assignments" subtitle="Saved on the attached server">
          <div className="max-h-60 overflow-y-auto space-y-2">
            {!state && <p className="text-sm text-slate-400">Connecting to SynthAi2 backend…</p>}
            {state?.assignments.length === 0 && <p className="text-sm text-slate-400">Your first request creates your first specialist.</p>}
            {state?.assignments.map(a => <button type="button" key={a.id} onClick={() => choose(a)}
              className={"w-full rounded-md border px-3 py-2 text-left text-sm transition " + (active?.id === a.id ? "border-violet-400 bg-violet-900/40" : "border-slate-700 hover:bg-slate-800")}>
              <span className="block truncate font-medium">{a.title}</span>
              <span className="text-xs text-slate-400">{a.lead.name} · {a.steps.filter(s => s.status === "done").length}/{a.steps.length} marked done</span>
            </button>)}
          </div>
        </Panel>
        <Panel title="System connections">
          <div className="space-y-2 text-xs text-slate-300">
            <div className="flex items-center justify-between"><span>Attached API</span><Status status={health?.attached ? "online" : "offline"}/></div>
            <div className="flex items-center justify-between"><span>Server-side history</span><Status status={health?.storage === "server-disk" ? "online" : "offline"}/></div>
            <div className="flex items-center justify-between"><span>Local chat model</span><Status status={health?.localModelReady ? "online" : "offline"}/></div>
            <p className="text-slate-400">{health?.localModelReady ? "Model: " + health.model : "Tools, plans, and small-neural-net training work without an LLM. Free-form AI replies need a local model runtime."}</p>
          </div>
        </Panel>
      </aside>

      <main className="min-w-0 space-y-3">
        <div className="flex gap-1 overflow-x-auto border-b border-slate-700 pb-2">
          {tabs.map(t => <button key={t.id} type="button" onClick={() => setTab(t.id)}
            className={"whitespace-nowrap rounded-lg px-3 py-2 text-sm transition " + (tab === t.id ? "bg-violet-700 text-white" : "text-slate-300 hover:bg-slate-800")}>{t.label}</button>)}
        </div>

        {tab === "chat" && <Panel>
          {!active ? <div className="py-8 text-center space-y-4">
            <Sparkles className="h-10 w-10 mx-auto text-fuchsia-300"/>
            <h2 className="text-xl font-semibold">What do you need help with?</h2>
            <p className="mx-auto max-w-xl text-sm text-slate-400">Describe a situation. A specialist will be created with a goal, a plan, and assigned tool capabilities. Nothing is silently marked complete.</p>
            <div className="flex flex-wrap justify-center gap-2">
              {["Help me research an unfamiliar topic", "Plan my next app feature", "Audit these test results"].map(sampleText =>
                <Button key={sampleText} size="sm" variant="outline" onClick={() => setInput(sampleText)}>{sampleText}</Button>)}
            </div>
          </div> : <>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-700 pb-3">
              <div><h2 className="font-semibold">{active.lead.name}</h2><p className="text-xs text-slate-400">Purpose: {active.lead.intent}</p></div>
              <div className="flex items-center gap-2"><Status status={active.domain}/><Button size="sm" variant="outline" onClick={() => setTab("plan")}>View plan <ArrowRight className="w-3 h-3 ml-1"/></Button></div>
            </div>
            <div className="space-y-4 max-h-[54vh] min-h-[240px] overflow-y-auto p-1" aria-live="polite">
              {active.messages.map(m => <div key={m.id} className={"max-w-[92%] rounded-xl p-3 text-sm whitespace-pre-wrap " + (m.role === "user" ? "ml-auto bg-violet-800/55 border border-violet-700/40" : m.role === "system" ? "mx-auto border border-slate-700 bg-slate-800/60 text-slate-300" : "mr-auto border border-slate-700 bg-slate-800/90")}>
                <span className="block text-[11px] font-semibold uppercase tracking-wide text-violet-300 mb-1">{m.role === "assistant" ? active.lead.name : m.role}</span>{m.text}
              </div>)}
            </div>
          </>}
          <form onSubmit={send} className="flex items-end gap-2 border-t border-slate-700 pt-3">
            <Textarea value={input} onChange={e => setInput(e.target.value)} rows={3} className="resize-y bg-slate-950 border-slate-600 text-slate-100" placeholder={active ? "Reply to your specialist…" : "I need help with…"} disabled={busy || !state} />
            <Button type="submit" disabled={busy || !state || !input.trim()} className="bg-violet-600 hover:bg-violet-500 h-12 px-4"><Send className="w-4 h-4"/></Button>
          </form>
          {active && state && state.models.length > 0 && <div className="text-xs flex items-center gap-2">
            <label htmlFor="specialist-model">Instruction profile:</label>
            <select id="specialist-model" value={selectedModel} onChange={e => setSelectedModel(e.target.value)} className="rounded border border-slate-700 bg-slate-900 p-1">
              <option value="">Default specialist</option>
              {state.models.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>}
        </Panel>}

        {tab === "plan" && (!active ? <Panel title="No active assignment">Begin with your first message to generate a goal and a specialist team.</Panel> : <div className="space-y-3">
          <Panel title="Goal" subtitle="Editable. The original request stays in the conversation record.">
            <Textarea value={draftGoal} onChange={e => setDraftGoal(e.target.value)} rows={2} className="bg-slate-950 border-slate-700"/>
            <Button size="sm" disabled={busy || !draftGoal.trim()} onClick={() => action("goal", { assignmentId: active.id, goal: draftGoal })}>Save goal</Button>
          </Panel>
          <Panel title="Specialist crew" subtitle="The lead proposes work. Additional specialists offer focused capabilities.">
            <div className="flex flex-wrap gap-2">{[active.lead, ...active.crew].map(agent => <div key={agent.id} className="rounded-lg border border-violet-700/60 bg-violet-900/25 p-3 min-w-[155px] flex-1">
              <div className="flex gap-2 items-center"><Bot className="h-4 w-4 text-violet-300"/><strong className="text-sm">{agent.name}</strong></div>
              <div className="text-xs text-slate-400 mt-2">{agent.intent}</div><div className="text-xs mt-2">Promises: {agent.promises.join("; ")}</div>
            </div>)}</div>
            <div className="flex gap-2 flex-wrap">{domains.filter(d => d !== active.domain && !active.crew.some(c => c.domain === d)).map(domain =>
              <Button key={domain} size="sm" variant="outline" disabled={busy} onClick={() => action("recruit", { assignmentId: active.id, domain })}><Plus className="w-3 h-3 mr-1"/>{domain}</Button>)}</div>
          </Panel>
          <Panel title="Evidence checkpoints" subtitle="Running a tool supplies evidence but does not automatically pass a checkpoint.">
            {active.steps.map((step, i) => <div key={step.id} className="rounded-lg border border-slate-700 p-3 space-y-2">
              <button type="button" onClick={() => { setSelectedStep(selectedStep === step.id ? "" : step.id); setProof(step.evidence || ""); }} className="w-full text-left flex items-center justify-between gap-2">
                <span className="text-sm"><strong>{i + 1}. {step.title}</strong><span className="block text-xs text-slate-400">{step.outcome} · tool: {step.toolId}</span></span><Status status={step.status}/>
              </button>
              {selectedStep === step.id && <>
                <Field label="Input for local tool"><Textarea rows={2} value={stepInput} onChange={e => setStepInput(e.target.value)} className="bg-slate-950 border-slate-700"/></Field>
                <Button size="sm" disabled={busy || !stepInput.trim()} onClick={() => runStep(step.id)}><Hammer className="w-3 h-3 mr-1"/>Run assigned tool</Button>
                <Field label="Verification evidence (required for Done)"><Textarea rows={3} value={proof} onChange={e => setProof(e.target.value)} placeholder="What was actually completed? Include source, file, test output, or other verification." className="bg-slate-950 border-slate-700"/></Field>
                {step.evidence && <pre className="whitespace-pre-wrap rounded bg-slate-950 p-3 text-xs max-h-44 overflow-auto">{step.evidence}</pre>}
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" disabled={busy} onClick={() => action("step", { assignmentId: active.id, stepId: step.id, status: "active", evidence: proof })}>In progress</Button>
                  <Button size="sm" variant="outline" disabled={busy} onClick={() => action("step", { assignmentId: active.id, stepId: step.id, status: "blocked", evidence: proof })}>Blocked</Button>
                  <Button size="sm" disabled={busy || !proof.trim()} onClick={() => action("step", { assignmentId: active.id, stepId: step.id, status: "done", evidence: proof })}><CheckCircle2 className="w-3 h-3 mr-1"/>Mark done with evidence</Button>
                </div>
              </>}
            </div>)}
          </Panel>
        </div>)}

        {tab === "tools" && <div className="space-y-3">
          <Panel title="Tool Factory" subtitle="Build real executable tool pipelines from available local operations.">
            <form onSubmit={createTool} className="grid gap-3">
              <Field label="Tool name"><Input required maxLength={120} value={toolName} onChange={e => setToolName(e.target.value)} placeholder="Evidence Prep Tool" className="bg-slate-950 border-slate-700"/></Field>
              <Field label="Purpose"><Textarea required value={toolPurpose} onChange={e => setToolPurpose(e.target.value)} placeholder="Prepare a research question and extract its open questions" className="bg-slate-950 border-slate-700"/></Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Input contract"><Input required value={toolInputFormat} onChange={e => setToolInputFormat(e.target.value)} className="bg-slate-950 border-slate-700"/></Field>
                <Field label="Output contract"><Input required value={toolOutputFormat} onChange={e => setToolOutputFormat(e.target.value)} className="bg-slate-950 border-slate-700"/></Field>
              </div>
              <p className="text-xs text-slate-400">Operations run in order, with each output passed into the next stage. All stages are deterministic.</p>
              <div className="flex flex-wrap items-center gap-2">{stages.map((s, i) => <select key={i} aria-label={"Pipeline stage " + (i + 1)} value={s} onChange={e => setStages(v => v.map((x, j) => i === j ? e.target.value as typeof s : x))} className="bg-slate-950 border border-slate-700 rounded p-2 text-sm">
                <option value="outline">Outline Builder</option><option value="questions">Question Finder</option><option value="terms">Term Counter</option>
              </select>)}
              <Button type="button" variant="outline" size="sm" disabled={stages.length >= 6} onClick={() => setStages(v => [...v, "questions"])}>+ Stage</Button>
              <Button type="button" variant="outline" size="sm" disabled={stages.length <= 1} onClick={() => setStages(v => v.slice(0, -1))}>− Stage</Button></div>
              <Button type="submit" disabled={busy || !toolName.trim() || !toolPurpose.trim()} className="justify-self-start"><WandSparkles className="h-4 w-4 mr-2"/>Assemble runnable tool</Button>
            </form>
          </Panel>
          <Panel title="Registered tools" subtitle="Execute on SynthAi2’s own server, not in a simulated chat.">
            <Field label="Text input for testing a tool"><Textarea rows={3} value={toolInput} onChange={e => setToolInput(e.target.value)} placeholder="Enter the source text or instruction to process…" className="bg-slate-950 border-slate-700"/></Field>
            <div className="grid gap-2 md:grid-cols-2">{state?.tools.map(tool => <div key={tool.id} className="rounded-lg border border-slate-700 p-3 space-y-2">
              <div className="flex items-center justify-between gap-2"><strong className="text-sm">{tool.name}</strong><Status status={tool.status}/></div>
              <p className="text-xs text-slate-400">{tool.purpose}</p>
              <p className="text-xs text-slate-500">{tool.pipeline?.join(" → ") || tool.handler}</p>
              <Button size="sm" variant="outline" disabled={busy || !toolInput.trim()} onClick={() => run(tool)}>Run and inspect result</Button>
            </div>)}</div>
            {toolResult && <div><div className="text-xs text-slate-400 mb-1">Actual returned result</div><pre className="whitespace-pre-wrap break-words bg-slate-950 rounded-lg p-3 max-h-72 overflow-auto text-xs">{toolResult}</pre></div>}
          </Panel>
        </div>}

        {tab === "models" && <div className="space-y-3">
          <Panel title="Model Maker" subtitle="Define reusable model personas/instruction configurations. This does not train a large language model.">
            <form onSubmit={createModel} className="grid gap-3">
              <Field label="Configuration name"><Input required maxLength={120} value={modelName} onChange={e => setModelName(e.target.value)} placeholder="Scholarly Researcher" className="bg-slate-950 border-slate-700"/></Field>
              <Field label="Purpose"><Textarea required value={modelPurpose} onChange={e => setModelPurpose(e.target.value)} placeholder="Evaluate a specific category of source without overlooking sections" className="bg-slate-950 border-slate-700"/></Field>
              <Field label="Behavior instructions"><Textarea required rows={5} value={modelInstructions} onChange={e => setModelInstructions(e.target.value)} placeholder="Read all supplied pages, identify coverage gaps, and cite every factual claim…" className="bg-slate-950 border-slate-700"/></Field>
              <Button type="submit" disabled={busy} className="justify-self-start">Create specialized configuration</Button>
            </form>
          </Panel>
          <Panel title="Saved configurations">{state?.models.length ? state.models.map(m => <div key={m.id} className="border-b border-slate-700 pb-3 space-y-1">
            <div className="flex justify-between items-center"><strong>{m.name}</strong><Button size="sm" variant="outline" onClick={() => { setSelectedModel(m.id); setTab("chat"); }}>Use in chat</Button></div>
            <p className="text-sm text-slate-400">{m.purpose}</p><p className="text-xs text-slate-400 whitespace-pre-wrap">{m.instructions}</p>
          </div>) : <p className="text-sm text-slate-400">No model configurations yet.</p>}</Panel>
        </div>}

        {tab === "neural" && <div className="space-y-3">
          <Panel title="Neural Net Maker" subtitle="Train a real, small 2-input/4-hidden/1-output sigmoid neural network locally in the attached backend.">
            <form onSubmit={train} className="grid gap-3">
              <Field label="Network name"><Input required maxLength={120} value={networkName} onChange={e => setNetworkName(e.target.value)} className="bg-slate-950 border-slate-700"/></Field>
              <Field label="Training data — CSV rows: x,y,label"><Textarea required rows={6} value={trainingRows} onChange={e => setTrainingRows(e.target.value)} className="font-mono bg-slate-950 border-slate-700"/></Field>
              <Field label="Training epochs"><Input required type="number" min={100} max={10000} value={epochs} onChange={e => setEpochs(Number(e.target.value))} className="bg-slate-950 border-slate-700"/></Field>
              <Button type="submit" disabled={busy} className="justify-self-start"><BrainCircuit className="h-4 w-4 mr-2"/>Train network on server</Button>
              <p className="text-xs text-slate-400">This trains real weights, not an LLM. Inputs must be 0–1; labels must be 0 or 1. Accuracy is computed on training rows only.</p>
            </form>
          </Panel>
          <Panel title="Trained networks" subtitle="Inspect actual weights and make predictions.">
            <Field label="Prediction input (x,y)"><Input value={predictText} onChange={e => setPredictText(e.target.value)} className="font-mono bg-slate-950 border-slate-700"/></Field>
            {state?.networks.length ? state.networks.map(net => <div key={net.id} className="border-b border-slate-700 pb-3 space-y-2">
              <div className="flex gap-3 items-center justify-between"><strong className="text-sm">{net.name}</strong><Status status="trained"/></div>
              <p className="text-xs text-slate-400">{net.kind} · {net.samples} examples · train accuracy: {(net.accuracy * 100).toFixed(1)}% · mean squared error: {net.loss.toFixed(4)}</p>
              <div className="flex gap-2 flex-wrap"><Button size="sm" variant="outline" disabled={busy} onClick={() => predict(net)}>Predict</Button><Button size="sm" variant="outline" onClick={() => download(net.name.replace(/[^a-z0-9]/gi, "-") + ".json", net)}><Download className="w-3 h-3 mr-1"/>Weights</Button></div>
            </div>) : <p className="text-sm text-slate-400">Train a small neural network to start your collection.</p>}
            {prediction && <p role="status" className="text-sm text-teal-300">{prediction}</p>}
          </Panel>
        </div>}

        {tab === "store" && <Panel title="Personal Systems Store" subtitle="A local catalog of your created assets. Export individual items for reuse; this is not a public marketplace or installation service.">
          <div className="flex flex-wrap gap-2 mb-2">
            {[
              { label: "Agents", count: state?.assignments.length || 0, icon: Bot },
              { label: "Tools", count: state?.tools.length || 0, icon: Hammer },
              { label: "Configurations", count: state?.models.length || 0, icon: Layers },
              { label: "Neural nets", count: state?.networks.length || 0, icon: BrainCircuit },
            ].map(v => <div key={v.label} className="rounded-lg border border-slate-700 px-3 py-2 text-xs flex items-center gap-2"><v.icon className="w-4 h-4 text-violet-300"/>{v.count} {v.label}</div>)}
          </div>
          {[
            ...(state?.assignments.map(a => ({ name: a.lead.name + ": " + a.title, type: "specialist", data: a })) || []),
            ...(state?.tools.map(t => ({ name: t.name, type: "tool", data: t })) || []),
            ...(state?.models.map(m => ({ name: m.name, type: "model configuration", data: m })) || []),
            ...(state?.networks.map(n => ({ name: n.name, type: "trained neural net", data: n })) || []),
          ].map(item => <div key={item.type + item.data.id} className="flex items-center gap-3 justify-between border-b border-slate-700 py-2">
            <div><strong className="text-sm">{item.name}</strong><p className="text-xs text-slate-400">{item.type}</p></div>
            <Button size="sm" variant="outline" onClick={() => download(item.type.replace(/ /g, "-") + "-" + item.data.id + ".json", item.data)}><Download className="h-4 w-4 mr-1"/>Export</Button>
          </div>)}
          <div className="pt-3"><Button size="sm" variant="outline" disabled={!state} onClick={() => download("synthai2-specialist-studio-backup.json", state)}><Database className="w-4 h-4 mr-2"/>Export full backup</Button></div>
        </Panel>}

        {tab === "history" && <Panel title="Audit history" subtitle="What was proposed, executed, blocked, or verified. Persisted in backend storage.">
          <div className="max-h-[62vh] overflow-y-auto space-y-2">{state?.activity.length ? state.activity.map(event => <div key={event.id} className="border-b border-slate-700 py-2 text-sm">
            <span className="text-xs text-slate-500">{new Date(event.at).toLocaleString()}</span>
            <p>{event.text}</p>
          </div>) : <p className="text-sm text-slate-400">No recorded actions yet.</p>}</div>
        </Panel>}
      </main>
    </div>
  </div>;
}
