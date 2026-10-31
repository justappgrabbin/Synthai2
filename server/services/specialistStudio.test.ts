import { after, test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";
import express from "express";
import { detectDomain, makeAssignment, runLocalTool, trainSmallNetwork, predictSmallNetwork } from "../../shared/selfServingStudio";

process.env.SYNTHAI_SPECIALIST_DATA_DIR = join(tmpdir(), "synthai2-specialist-tests-" + randomUUID());
const { registerSpecialistRoutes } = await import("./specialistStudio");

const app = express();
app.use(express.json());
registerSpecialistRoutes(app);
const server = await new Promise<ReturnType<typeof app.listen>>(resolve => {
  const s = app.listen(0, "127.0.0.1", () => resolve(s));
});
const address = server.address();
if (!address || typeof address === "string") throw new Error("Could not bind test server");
const root = "http://127.0.0.1:" + address.port;
after(() => new Promise<void>(resolve => server.close(() => resolve())));
const workspace = randomUUID();
async function invoke(route: string, body?: Record<string, unknown>, key = workspace) {
  const response = await fetch(root + route, {
    method: body ? "POST" : "GET",
    headers: { "Content-Type": "application/json", "x-specialist-workspace": key },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return { status: response.status, data: await response.json() as any };
}
test("classifies requests and creates explicit checkpoints with no false completion", () => {
  assert.equal(detectDomain("research an unfamiliar book"), "research");
  const a = makeAssignment("Research a book and build a study app");
  assert.equal(a.domain, "research");
  assert.ok(a.crew.some(c => c.domain === "building"));
  assert.equal(a.steps.filter(s => s.status === "done").length, 0);
  assert.equal(a.messages[0].role, "user");
});
test("local tools produce real inspected results", () => {
  assert.match(runLocalTool("questions", "Why? How?"), /Why/);
  assert.match(runLocalTool("terms", "cats dogs cats"), /cats: 2/);
  assert.throws(() => runLocalTool("terms", ""), /Text is required/);
});
test("small neural network trains usable weights and rejects invalid rows", () => {
  const net = trainSmallNetwork("XOR", "0,0,0\n0,1,1\n1,0,1\n1,1,0");
  assert.ok(net.accuracy > .75, "must learn at least 3/4 examples");
  assert.ok(predictSmallNetwork(net, 1, 0) > .5);
  assert.ok(predictSmallNetwork(net, 1, 1) < .5);
  assert.throws(() => trainSmallNetwork("invalid", "0,0,0\n0,1,4\n1,0,1\n1,1,0"), /Row 2/);
});
test("backend persists an assignment, runs tools, and rejects unsupported completion claims", async () => {
  const initial = await invoke("/api/specialist/state");
  assert.equal(initial.status, 200);
  assert.equal(initial.data.state.assignments.length, 0);
  const started = await invoke("/api/specialist/action", { type: "start", request: "Help research a topic" });
  assert.equal(started.status, 200);
  const a = started.data.state.assignments[0];
  assert.equal(a.lead.name, "Research Specialist");
  const run = await invoke("/api/specialist/action", { type: "run-step", assignmentId: a.id, stepId: a.steps[0].id, input: "What evidence do we have?" });
  assert.equal(run.status, 200);
  assert.equal(run.data.state.assignments[0].steps[0].status, "active");
  assert.match(run.data.state.assignments[0].steps[0].evidence, /Executed/);
  const noProof = await invoke("/api/specialist/action", { type: "step", assignmentId: a.id, stepId: a.steps[0].id, status: "done" });
  assert.equal(noProof.status, 422);
  const checked = await invoke("/api/specialist/action", { type: "step", assignmentId: a.id, stepId: a.steps[0].id, status: "done", evidence: "Reviewed tool output manually" });
  assert.equal(checked.status, 200);
  const persisted = await invoke("/api/specialist/state");
  assert.equal(persisted.data.state.assignments[0].steps[0].status, "done");
  assert.ok(persisted.data.state.activity.length >= 3);
});
test("factory assembles executable tool and captures actual output", async () => {
  const created = await invoke("/api/specialist/action", { type: "new-tool", name: "Pipeline test", purpose: "Count terms in text", input: "text", output: "counts", pipeline: ["terms"] });
  assert.equal(created.status, 200);
  const tool = created.data.state.tools.find((t: any) => t.name === "Pipeline test");
  assert.equal(tool.status, "composed");
  const executed = await invoke("/api/specialist/action", { type: "run-tool", toolId: tool.id, input: "dog dog cat" });
  assert.equal(executed.status, 200);
  assert.match(executed.data.result.output, /dog: 2/);
});
test("workspace key scopes data; absent key is rejected", async () => {
  const other = await invoke("/api/specialist/state", undefined, randomUUID());
  assert.equal(other.status, 200);
  assert.equal(other.data.state.assignments.length, 0);
  const missing = await fetch(root + "/api/specialist/state");
  assert.equal(missing.status, 401);
});
