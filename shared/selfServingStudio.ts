// Self-serving Specialist Studio: task-specific agents and auditable local work.
// Reuses SynthAi2's existing AIService; no hidden backend or invented tool executions.
export type Domain = "research" | "planning" | "building" | "writing" | "analysis" | "general";
export type StepStatus = "queued" | "active" | "done" | "blocked";
export type Step = { id: string; title: string; outcome: string; status: StepStatus; toolId: string; evidence?: string };
export type Specialist = { id: string; name: string; domain: Domain; intent: string; promises: string[]; limits: string[] };
export type Message = { id: string; role: "user" | "assistant" | "system"; text: string; at: string };
export type Assignment = {
  id: string; title: string; request: string; goal: string; domain: Domain; lead: Specialist;
  crew: Specialist[]; steps: Step[]; messages: Message[]; created: string; updated: string;
};
export type ToolBlueprint = { id: string; name: string; purpose: string; input: string; output: string; status: "built-in" | "blueprint" | "composed"; handler?: "outline" | "questions" | "terms"; pipeline?: Array<"outline" | "questions" | "terms"> };
export type ModelBlueprint = { id: string; name: string; purpose: string; instructions: string; backend: "selected"; kind: "prompt-configuration" };
export type NeuralModel = { id: string; name: string; kind: "2-4-1 sigmoid"; weights: number[][]; biases: number[][]; samples: number; accuracy: number; loss: number; trainedAt: string };
export type Activity = { id: string; at: string; text: string; assignmentId?: string };
export type StudioState = { version: 1; assignments: Assignment[]; activeId: string | null; tools: ToolBlueprint[]; models: ModelBlueprint[]; networks: NeuralModel[]; activity: Activity[] };
export const STORAGE_KEY = "synthai2-specialist-studio-v1";
const uid = () => (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") ? crypto.randomUUID() : "id-" + Date.now() + "-" + Math.random().toString(36).slice(2);
const now = () => new Date().toISOString();
const msg = (role: Message["role"], text: string): Message => ({ id: uid(), role, text, at: now() });
export const BUILT_IN_TOOLS: ToolBlueprint[] = [
  { id: "outline", name: "Outline Builder", purpose: "Produce an actionable outline from a request", input: "request text", output: "outline", status: "built-in", handler: "outline" },
  { id: "questions", name: "Question Finder", purpose: "Find explicit unanswered questions in supplied text", input: "text", output: "questions", status: "built-in", handler: "questions" },
  { id: "terms", name: "Term Counter", purpose: "Count recurring words in supplied text (no semantic inference)", input: "text", output: "counts", status: "built-in", handler: "terms" },
];
export const emptyStudio = (): StudioState => ({ version: 1, assignments: [], activeId: null, tools: [...BUILT_IN_TOOLS], models: [], networks: [], activity: [] });
const signals: Array<{ domain: Domain; pattern: RegExp }> = [
  { domain: "research", pattern: /research|investigat|study|source|book|evidence|verify|cite|literature|learn about|find out/i },
  { domain: "planning", pattern: /plan|schedule|organize|roadmap|project|timeline|priorit|goal|strategy|event/i },
  { domain: "building", pattern: /build|create an app|code|develop|debug|program|repository|prototype|software|android/i },
  { domain: "writing", pattern: /write|draft|script|novel|story|rewrite|edit|essay|email|speech/i },
  { domain: "analysis", pattern: /analy|compare|classif|dataset|measure|calculate|test|audit|patterns|numbers/i },
];
export function detectDomain(request: string): Domain {
  const weights: Record<Domain, number> = { research: 0, planning: 0, building: 0, writing: 0, analysis: 0, general: 0 };
  for (const rule of signals) if (rule.pattern.test(request)) weights[rule.domain] += 1;
  const ranked = (Object.keys(weights).filter(d => d !== "general") as Domain[]).sort((a, b) => weights[b] - weights[a]);
  return weights[ranked[0]] ? ranked[0] : "general";
}
const roles: Record<Domain, { name: string; intent: string; promises: string[]; limits: string[]; steps: Array<[string, string, string]> }> = {
  research: { name: "Research Specialist", intent: "Investigate the question and account for source quality", promises: ["Organize evidence", "Identify unanswered questions", "Separate observations from assumptions"], limits: ["External sources require connected search or supplied files", "No claims of reading unprovided documents"], steps: [["Frame the question", "Research question and criteria", "outline"], ["Gather evidence", "Supplied passages or linked source material", "questions"], ["Evaluate findings", "Evidence table with uncertainty", "terms"], ["Synthesize", "Grounded answer with citations", "outline"]] },
  planning: { name: "Planning Specialist", intent: "Turn a situation into a manageable, revisable plan", promises: ["Define milestones", "Track progress", "Surface dependencies"], limits: ["No unseen calendar access", "External actions require permission"], steps: [["Clarify outcome", "Defined success criterion", "outline"], ["Break into work", "Milestones and dependencies", "outline"], ["Check blockers", "Missing inputs and risks", "questions"], ["Review progress", "Updated next actions", "outline"]] },
  building: { name: "Build Specialist", intent: "Design, implement and verify a requested system", promises: ["Specify working behavior", "Check tool and runtime availability", "Show test evidence"], limits: ["Cannot claim unexecuted builds succeeded", "No external deployment without integration"], steps: [["Specify behavior", "Acceptance criteria", "outline"], ["Inspect dependencies", "Existing components and constraints", "questions"], ["Build and run", "Working code and output", "outline"], ["Verify", "Tests and observed results", "terms"]] },
  writing: { name: "Writing Specialist", intent: "Produce and improve writing for a stated purpose", promises: ["Draft toward audience", "Revise against feedback", "Preserve constraints"], limits: ["No invented references"], steps: [["Identify audience", "Brief and tone", "outline"], ["Outline", "Structure", "outline"], ["Draft", "Written artifact", "outline"], ["Revise", "Final reviewed draft", "questions"]] },
  analysis: { name: "Analysis Specialist", intent: "Evaluate material using explicit criteria and evidence", promises: ["Make assumptions visible", "Check coverage", "Report gaps"], limits: ["No fabricated metrics or test runs"], steps: [["Set criteria", "Metrics and hypotheses", "outline"], ["Collect inputs", "Actual records", "questions"], ["Run checks", "Results with coverage", "terms"], ["Interpret", "Findings and limitations", "outline"]] },
  general: { name: "Situation Specialist", intent: "Understand the situation and adapt assistance to it", promises: ["Define a goal", "Organize action", "Ask for missing essentials"], limits: ["No invented information or execution"], steps: [["Understand", "Problem definition", "outline"], ["Plan", "Steps and resources", "outline"], ["Act", "Recorded result", "questions"], ["Review", "Next best action", "outline"]] },
};
export function makeSpecialist(domain: Domain): Specialist {
  const r = roles[domain];
  return { id: uid(), name: r.name, domain, intent: r.intent, promises: [...r.promises], limits: [...r.limits] };
}
export function makeAssignment(input: string): Assignment {
  const request = input.trim();
  if (!request) throw new Error("Describe what you need first.");
  const domain = detectDomain(request);
  const lead = makeSpecialist(domain), config = roles[domain], created = now();
  const steps = config.steps.map(([title, outcome, toolId]) => ({ id: uid(), title, outcome, toolId, status: "queued" as StepStatus }));
  const opening = "I'm your " + lead.name + ". My goal is to help with: " + request + "\n\nI propose four checkpoints below. I can use local text tools now; for original research, generation or external actions I need a connected capability or your material.\n\nFirst question: What would a successful result look like to you? You can answer here or open the plan and start with the current information.";
  return { id: uid(), title: request.slice(0, 64), request, goal: request, domain, lead, crew: [], steps, messages: [msg("user", request), msg("assistant", opening)], created, updated: created };
}
export function recruitSpecialist(a: Assignment, domain: Domain): Assignment {
  if (a.lead.domain === domain || a.crew.some(c => c.domain === domain)) return a;
  const agent = makeSpecialist(domain);
  return { ...a, crew: [...a.crew, agent], updated: now(), messages: [...a.messages, msg("system", agent.name + " has offered to help with " + agent.intent + ". No external work has been performed.")] };
}
export function runLocalTool(handler: NonNullable<ToolBlueprint["handler"]>, text: string): string {
  const content = text.trim();
  if (!content) throw new Error("Text is required to run the tool.");
  if (handler === "outline") return "Goal: " + content + "\n\n1. Define a successful outcome\n2. Gather the necessary inputs\n3. Complete the smallest verifiable task\n4. Record evidence and remaining questions";
  if (handler === "questions") {
    const matches = (content.match(/[^.!?\n]*\?/g) || []).map(s => s.trim()).filter(Boolean);
    return matches.length ? matches.map((s, i) => (i + 1) + ". " + s).join("\n") : "No explicit questions detected in this text. This does not mean all questions are answered.";
  }
  const counts = new Map<string, number>();
  for (const term of (content.toLocaleLowerCase().match(/[\p{L}\p{N}]{3,}/gu) || [])) counts.set(term, (counts.get(term) || 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 25).map(([term, count]) => term + ": " + count).join("\n") || "No countable terms.";
}
export function trainSmallNetwork(name: string, csv: string, epochs = 2400): NeuralModel {
  const rows = csv.trim().split(/\r?\n/).filter(Boolean).map((line, i) => {
    const nums = line.split(",").map(x => Number(x.trim()));
    if (nums.length !== 3 || nums.some(v => !Number.isFinite(v)) || nums.some(v => v < 0 || v > 1) || ![0, 1].includes(nums[2])) throw new Error("Row " + (i + 1) + " must be x,y,label using 0..1 inputs and a 0 or 1 label.");
    return nums;
  });
  if (rows.length < 4 || rows.length > 1000) throw new Error("Provide 4–1000 labeled rows.");
  if (!Number.isInteger(epochs) || epochs < 100 || epochs > 10000) throw new Error("Epochs must be 100–10000.");
  // Deterministic PRNG means the same training data/epochs are reproducible.
  let seed = 74021;
  const rand = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  const weights = [Array.from({ length: 4 }, () => [rand() * 2 - 1, rand() * 2 - 1]), Array.from({ length: 4 }, () => [rand() * 2 - 1])];
  const biases = [Array.from({ length: 4 }, () => (rand() - .5) * .4), [(rand() - .5) * .4]];
  const sigmoid = (v: number) => 1 / (1 + Math.exp(-Math.max(-30, Math.min(30, v))));
  for (let epoch = 0; epoch < epochs; epoch++) {
    const rate = .65 * (1 - .5 * epoch / epochs);
    // Rotate sample order to avoid persistent ordering bias.
    for (let k = 0; k < rows.length; k++) {
      const row = rows[(k + epoch) % rows.length], [x, y, target] = row;
      const hidden = weights[0].map((w, j) => sigmoid(w[0] * x + w[1] * y + biases[0][j]));
      const output = sigmoid(hidden.reduce((s, h, j) => s + h * weights[1][j][0], biases[1][0]));
      const deltaOut = (target - output) * output * (1 - output);
      const deltaHidden = hidden.map((h, j) => h * (1 - h) * weights[1][j][0] * deltaOut);
      for (let j = 0; j < 4; j++) {
        weights[1][j][0] += rate * deltaOut * hidden[j];
        weights[0][j][0] += rate * deltaHidden[j] * x;
        weights[0][j][1] += rate * deltaHidden[j] * y;
        biases[0][j] += rate * deltaHidden[j];
      }
      biases[1][0] += rate * deltaOut;
    }
  }
  const predict = (x: number, y: number) => {
    const h = weights[0].map((w, j) => sigmoid(w[0] * x + w[1] * y + biases[0][j]));
    return sigmoid(h.reduce((s, v, j) => s + v * weights[1][j][0], biases[1][0]));
  };
  const accuracy = rows.filter(([x, y, label]) => Number(predict(x, y) >= .5) === label).length / rows.length;
  const loss = rows.reduce((s, [x, y, label]) => { const e = predict(x, y) - label; return s + e * e; }, 0) / rows.length;
  return { id: uid(), name: name.trim() || "Untitled classifier", kind: "2-4-1 sigmoid", weights, biases, samples: rows.length, accuracy, loss, trainedAt: now() };
}
export function predictSmallNetwork(net: NeuralModel, x: number, y: number): number {
  if (![x, y].every(v => Number.isFinite(v) && v >= 0 && v <= 1)) throw new Error("Inputs must be between 0 and 1.");
  const sigmoid = (v: number) => 1 / (1 + Math.exp(-Math.max(-30, Math.min(30, v))));
  const h = net.weights[0].map((w, j) => sigmoid(w[0] * x + w[1] * y + net.biases[0][j]));
  return sigmoid(h.reduce((s, v, j) => s + v * net.weights[1][j][0], net.biases[1][0]));
}
export function audit(state: StudioState, text: string, assignmentId?: string): StudioState {
  return { ...state, activity: [{ id: uid(), at: now(), text, assignmentId }, ...state.activity].slice(0, 1000) };
}
export function loadStudio(): StudioState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyStudio();
    const parsed = JSON.parse(raw);
    if (parsed.version !== 1 || !Array.isArray(parsed.assignments) || !Array.isArray(parsed.tools) || !Array.isArray(parsed.activity) || !Array.isArray(parsed.models) || !Array.isArray(parsed.networks)) throw new Error("Invalid studio state");
    return { ...parsed, tools: [...BUILT_IN_TOOLS, ...parsed.tools.filter((t: ToolBlueprint) => t.status !== "built-in")] };
  } catch (error) {
    console.warn("Studio data unavailable; not overwriting it.", error);
    return emptyStudio();
  }
}
