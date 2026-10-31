import type { Express } from "express";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile, rename } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import {
  audit, emptyStudio, makeAssignment, makeSpecialist, predictSmallNetwork,
  recruitSpecialist, runLocalTool, trainSmallNetwork,
  type Assignment, type Domain, type Message, type ModelBlueprint, type StudioState,
  type ToolBlueprint,
} from "../../shared/selfServingStudio";

/**
 * SynthAi2 attached backend: same Express origin as UI.
 * Everything runs without an LLM except optional free-text chat generation.
 * No client-side API key required. Model runtime is independently configured on the server.
 * Workspace tokens are bearer secrets; deployments exposed to the internet should
 * place authenticated access/TLS in front of the routes.
 */
const root = path.resolve(process.env.SYNTHAI_SPECIALIST_DATA_DIR || "./data/specialist-studio");
const keySchema = z.string().regex(/^[0-9a-f-]{32,64}$/i);
const domainSchema = z.enum(["research", "planning", "building", "writing", "analysis", "general"]);
const paramsText = z.string().trim().min(1).max(20000);
const stepStatus = z.enum(["queued", "active", "blocked", "done"]);
const agentsModel = process.env.SYNTHAI_LOCAL_MODEL || "llama3.2";
const modelUrl = (process.env.SYNTHAI_LOCAL_MODEL_URL || "http://127.0.0.1:11434").replace(/\/+$/, "");
const message = (role: Message["role"], text: string): Message => ({ id: randomUUID(), role, text, at: new Date().toISOString() });

type ActionResult = { state: StudioState; result?: unknown; note?: string };
const queue = new Map<string, Promise<void>>();
async function transact<T>(workspace: string, process: () => Promise<T>): Promise<T> {
  const before = queue.get(workspace) || Promise.resolve();
  let release!: () => void;
  const next = new Promise<void>(resolve => { release = resolve; });
  const tail = before.catch(() => {}).then(() => next);
  queue.set(workspace, tail);
  await before.catch(() => {});
  try { return await process(); }
  finally { release(); if (queue.get(workspace) === tail) queue.delete(workspace); }
}
const statePath = (workspace: string) => path.join(root, workspace + ".json");
async function read(workspace: string): Promise<StudioState> {
  try {
    const raw = JSON.parse(await readFile(statePath(workspace), "utf8"));
    if (raw.version !== 1 || !Array.isArray(raw.assignments) || !Array.isArray(raw.activity) || !Array.isArray(raw.tools) || !Array.isArray(raw.models) || !Array.isArray(raw.networks)) throw new Error("Invalid specialist state on disk; refusing to overwrite");
    return raw as StudioState;
  } catch (e: unknown) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return emptyStudio();
    throw e;
  }
}
async function save(workspace: string, state: StudioState): Promise<void> {
  await mkdir(root, { recursive: true });
  const file = statePath(workspace);
  const temporary = file + "." + randomUUID() + ".tmp";
  await writeFile(temporary, JSON.stringify(state, null, 2), { mode: 0o600, flag: "wx" });
  await rename(temporary, file);
}
function patchAssignment(s: StudioState, id: string, fn: (a: Assignment) => Assignment): StudioState {
  if (!s.assignments.some(a => a.id === id)) throw new Error("Assignment not found");
  return { ...s, assignments: s.assignments.map(a => a.id === id ? { ...fn(a), updated: new Date().toISOString() } : a) };
}
function assertEvidence(text: string) {
  if (!text.trim()) throw new Error("Completion needs evidence; don't mark a task done without recording what happened");
}
async function connectedModel(): Promise<boolean> {
  try {
    const response = await fetch(modelUrl + "/api/tags", { signal: AbortSignal.timeout(1800) });
    if (!response.ok) return false;
    const payload = await response.json() as { models?: Array<{ name: string }> };
    return Array.isArray(payload.models) && payload.models.some(m => m.name === agentsModel || m.name.startsWith(agentsModel + ":"));
  } catch { return false; }
}
async function respond(a: Assignment, instructions: string): Promise<{ text: string; generated: boolean }> {
  const base = "You are " + a.lead.name + ". Your purpose: " + a.lead.intent + ". Goal: " + a.goal + ". Promises: " + a.lead.promises.join("; ") +
    ". Limits: " + a.lead.limits.join("; ") + ". You may propose tools or other specialists but must never claim an unexecuted task is complete. Respect existing architecture and the user's words. Ask at most one genuinely necessary question. ";
  try {
    const response = await fetch(modelUrl + "/api/chat", {
      method: "POST", signal: AbortSignal.timeout(45000),
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: agentsModel, stream: false, messages: [
        { role: "system", content: base + instructions },
        ...a.messages.slice(-18).filter(m => m.role !== "system").map(m => ({ role: m.role, content: m.text })),
      ] }),
    });
    if (!response.ok) throw new Error("Local model response " + response.status);
    const data = await response.json() as { message?: { content?: string } };
    if (!data.message?.content?.trim()) throw new Error("Local model returned no text");
    return { text: data.message.content, generated: true };
  } catch {
    return { text: "I recorded your input and kept the assignment plan. The attached task engine is working, but the optional local conversational model (" + agentsModel + ") is not responding at " + modelUrl + ". You can still assign specialists, run built-in tools, train the small neural network, and track evidence without an LLM.", generated: false };
  }
}
function parseAction(raw: unknown): { type: string; [key: string]: unknown } {
  const base = z.object({ type: z.string().min(1).max(40) }).passthrough().parse(raw);
  return base;
}
function executeTool(tool: ToolBlueprint, input: string): string {
  if (tool.status === "built-in" && tool.handler) return runLocalTool(tool.handler, input);
  if (tool.status === "composed" && tool.pipeline?.length) {
    let working = input;
    const stages: string[] = [];
    for (const handler of tool.pipeline) {
      working = runLocalTool(handler, working);
      stages.push(handler + " result:\\n" + working);
    }
    return stages.join("\\n\\n");
  }
  throw new Error("No executable handler is attached to this tool");
}
async function execute(s: StudioState, raw: unknown): Promise<ActionResult> {
  const action = parseAction(raw);
  const p = action as Record<string, unknown>;
  let result: unknown;
  let note = "";
  switch (action.type) {
    case "start": {
      const data = z.object({ request: paramsText }).parse(p);
      const a = makeAssignment(data.request);
      s = audit({ ...s, activeId: a.id, assignments: [a, ...s.assignments] }, "Opened " + a.lead.name, a.id);
      result = { assignmentId: a.id };
      break;
    }
    case "select": {
      const data = z.object({ assignmentId: z.string().uuid() }).parse(p);
      if (!s.assignments.some(a => a.id === data.assignmentId)) throw new Error("Assignment not found");
      s = { ...s, activeId: data.assignmentId };
      break;
    }
    case "goal": {
      const data = z.object({ assignmentId: z.string().uuid(), goal: paramsText }).parse(p);
      s = patchAssignment(s, data.assignmentId, a => ({ ...a, goal: data.goal }));
      s = audit(s, "Revised goal", data.assignmentId); break;
    }
    case "recruit": {
      const data = z.object({ assignmentId: z.string().uuid(), domain: domainSchema }).parse(p);
      s = patchAssignment(s, data.assignmentId, a => recruitSpecialist(a, data.domain));
      s = audit(s, "Recruited " + data.domain + " specialist", data.assignmentId); break;
    }
    case "message": {
      const data = z.object({ assignmentId: z.string().uuid(), text: paramsText, modelId: z.string().optional() }).parse(p);
      let a = s.assignments.find(a => a.id === data.assignmentId);
      if (!a) throw new Error("Assignment not found");
      const chosen = data.modelId ? s.models.find(m => m.id === data.modelId) : undefined;
      a = { ...a, messages: [...a.messages, message("user", data.text)] };
      const reply = await respond(a, chosen?.instructions || "Respond as the assigned specialist; provide one useful next action.");
      s = patchAssignment(s, a.id, () => ({ ...a!, messages: [...a!.messages, message("assistant", reply.text)] }));
      s = audit(s, reply.generated ? "Local model response received" : "Local model unavailable; saved user message", a.id);
      result = { generated: reply.generated }; break;
    }
    case "step": {
      const data = z.object({ assignmentId: z.string().uuid(), stepId: z.string().uuid(), status: stepStatus, evidence: z.string().max(12000).optional() }).parse(p);
      if (data.status === "done") assertEvidence(data.evidence || "");
      s = patchAssignment(s, data.assignmentId, a => {
        if (!a.steps.some(v => v.id === data.stepId)) throw new Error("Step not found");
        return { ...a, steps: a.steps.map(v => v.id === data.stepId ? { ...v, status: data.status, evidence: data.evidence || v.evidence } : v) };
      });
      s = audit(s, "Step changed to " + data.status + (data.evidence ? " with evidence" : ""), data.assignmentId);
      break;
    }
    case "run-step": {
      const data = z.object({ assignmentId: z.string().uuid(), stepId: z.string().uuid(), input: paramsText }).parse(p);
      const a = s.assignments.find(a => a.id === data.assignmentId);
      const step = a?.steps.find(v => v.id === data.stepId);
      if (!step) throw new Error("Step not found");
      const tool = s.tools.find(v => v.id === step.toolId && v.status === "built-in" && v.handler);
      if (!tool?.handler) throw new Error("This step has no executable local tool");
      const output = runLocalTool(tool.handler, data.input);
      s = patchAssignment(s, data.assignmentId, a => ({ ...a, steps: a.steps.map(v => v.id === data.stepId ? { ...v, status: "active", evidence: "Executed " + tool.name + " at " + new Date().toISOString() + ":\n" + output } : v) }));
      s = audit(s, "Executed " + tool.name + "; step remains active until verified", data.assignmentId);
      result = { output }; note = "Tool ran. The step is NOT automatically marked done.";
      break;
    }
    case "new-tool": {
      const data = z.object({ name: z.string().trim().min(1).max(120), purpose: paramsText, input: paramsText, output: paramsText, pipeline: z.array(z.enum(["outline", "questions", "terms"])).min(1).max(6) }).parse(p);
      const tool: ToolBlueprint = { id: randomUUID(), name: data.name, purpose: data.purpose, input: data.input, output: data.output, status: "composed", pipeline: data.pipeline };
      s = audit({ ...s, tools: [...s.tools, tool] }, "Created tool specification: " + tool.name);
      result = tool; note = "Tool assembled from runnable, registered local operations.";
      break;
    }
    case "run-tool": {
      const data = z.object({ toolId: z.string(), input: paramsText }).parse(p);
      const tool = s.tools.find(t => t.id === data.toolId);
      if (!tool) throw new Error("Tool not found");
      result = { output: executeTool(tool, data.input) };
      s = audit(s, "Ran local tool " + tool.name); break;
    }
    case "new-model": {
      const data = z.object({ name: z.string().trim().min(1).max(120), purpose: paramsText, instructions: paramsText }).parse(p);
      const model: ModelBlueprint = { id: randomUUID(), name: data.name, purpose: data.purpose, instructions: data.instructions, backend: "selected", kind: "prompt-configuration" };
      s = audit({ ...s, models: [...s.models, model] }, "Created specialized model configuration: " + model.name);
      result = model; note = "This is a specialist instruction configuration, not newly trained LLM weights.";
      break;
    }
    case "train-network": {
      const data = z.object({ name: z.string().trim().min(1).max(120), rows: z.string().min(15).max(100000), epochs: z.number().int().min(100).max(10000).default(2400) }).parse(p);
      const net = trainSmallNetwork(data.name, data.rows, data.epochs);
      s = audit({ ...s, networks: [...s.networks, net] }, "Trained " + net.kind + " network on " + net.samples + " samples; training accuracy=" + net.accuracy.toFixed(3));
      result = { networkId: net.id, accuracy: net.accuracy, loss: net.loss };
      note = "Training metrics are in-sample only, not proof of generalization."; break;
    }
    case "predict": {
      const data = z.object({ networkId: z.string(), x: z.number().min(0).max(1), y: z.number().min(0).max(1) }).parse(p);
      const net = s.networks.find(n => n.id === data.networkId);
      if (!net) throw new Error("Network not found");
      result = { probability: predictSmallNetwork(net, data.x, data.y) };
      s = audit(s, "Ran inference with " + net.name); break;
    }
    default: throw new Error("Unknown action: " + action.type);
  }
  return { state: s, result, note };
}
export function registerSpecialistRoutes(app: Express): void {
  app.get("/api/specialist/health", async (_req, res) => {
    res.json({ ok: true, attached: true, backend: "SynthAi2 Express", storage: "server-disk", model: agentsModel, localModelReady: await connectedModel(), capability: ["assignments", "agents", "plans", "tool-execution", "models", "neural-training", "audit-log"] });
  });
  app.use("/api/specialist", (req, res, next) => {
    if (req.path === "/health") return next();
    const parsed = keySchema.safeParse(req.header("x-specialist-workspace"));
    if (!parsed.success) return res.status(401).json({ error: "Workspace identity required" });
    res.locals.workspace = parsed.data;
    next();
  });
  app.get("/api/specialist/state", async (_req, res) => {
    try { res.json({ state: await read(res.locals.workspace) }); }
    catch (err) { res.status(500).json({ error: err instanceof Error ? err.message : "Could not read state" }); }
  });
  app.post("/api/specialist/action", async (req, res) => {
    try {
      const value = await transact(res.locals.workspace, async () => {
        const state = await read(res.locals.workspace);
        const outcome = await execute(state, req.body);
        await save(res.locals.workspace, outcome.state);
        return outcome;
      });
      res.json(value);
    } catch (err) {
      res.status(err instanceof z.ZodError ? 400 : 422).json({ error: err instanceof Error ? err.message : "Action failed" });
    }
  });
}
