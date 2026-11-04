import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { mountApp } from "./appMountService";
import { deployToNetlify } from "./netlifyService";
import { publishMeshEvent } from "./meshEventStore";

/**
 * Synthia2's existing Computer backend owns this execution spine.
 * It deliberately does not execute generated code on the host.
 * Verification is static (syntax, references, file limits), NOT functional QA.
 */
export type BuildTarget = "grove" | "site";
export type BuildPhase = "queued" | "generating" | "repairing" | "publishing" | "completed" | "failed";
export interface BuildFile { path: string; content: string }
export interface BuildRequest {
  prompt: string;
  name?: string;
  target: BuildTarget;
  netlifyApiKey?: string;
  siteName?: string;
}
export interface BuildJob {
  id: string;
  name: string;
  goal: string;
  target: BuildTarget;
  phase: BuildPhase;
  attempts: number;
  tests: string[];
  issues: string[];
  artifact?: string;
  mountedAppId?: string;
  siteUrl?: string;
  model: string;
  training: "not-run";
  createdAt: string;
  updatedAt: string;
}

const buildRoot = path.resolve(process.env.SYNTHIA_BUILDS_DIR ||
  path.join(process.env.LINUX_CONTAINER_WORKDIR || path.join(process.cwd(), "workspace"), ".synthia", "self-build"));
const activeJobs = new Map<string, BuildJob>();
const running = new Set<string>();
const MAX_FILES = 24;
const MAX_BYTES = 800_000;
const SAFE_EXT = new Set([".html", ".js", ".css", ".json", ".svg", ".txt", ".md", ".webmanifest", ".png"]);
const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".md": "text/plain; charset=utf-8",
  ".png": "image/png",
};
function isSafePath(filePath: string): boolean {
  if (typeof filePath !== "string" || filePath.length > 160) return false;
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._/-]*$/.test(filePath)) return false;
  const segments = filePath.split("/");
  return !segments.some((s) => s === "" || s === "." || s === ".." || s.startsWith("."));
}
function ensureRoot() { fs.mkdirSync(buildRoot, { recursive: true }); }
function jobPath(id: string) { return path.join(buildRoot, "jobs", id + ".json"); }
function save(job: BuildJob) {
  job.updatedAt = new Date().toISOString();
  const target = jobPath(job.id);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target + ".tmp", JSON.stringify(job, null, 2));
  fs.renameSync(target + ".tmp", target);
  activeJobs.set(job.id, job);
}
export function getBuildJob(id: string): BuildJob | null {
  if (!/^[a-f0-9-]{36}$/.test(id)) return null;
  if (activeJobs.has(id)) return activeJobs.get(id)!;
  try { return JSON.parse(fs.readFileSync(jobPath(id), "utf8")) as BuildJob; }
  catch { return null; }
}
export function listBuildJobs(): BuildJob[] {
  ensureRoot();
  const root = path.join(buildRoot, "jobs");
  if (!fs.existsSync(root)) return [];
  return fs.readdirSync(root).filter((s) => s.endsWith(".json")).slice(-100).map((f) =>
    getBuildJob(f.slice(0, -5))).filter((x): x is BuildJob => !!x)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
export function validateBuildFiles(files: unknown): { files: BuildFile[]; issues: string[]; tests: string[] } {
  const issues: string[] = [];
  const tests: string[] = [];
  if (!Array.isArray(files) || files.length === 0 || files.length > MAX_FILES) {
    return { files: [], issues: ["Expected 1 to " + MAX_FILES + " project files"], tests };
  }
  let total = 0;
  const normalized: BuildFile[] = [];
  const names = new Set<string>();
  for (const item of files) {
    if (!item || typeof item.path !== "string" || typeof item.content !== "string") {
      issues.push("Every file requires a string path and content"); continue;
    }
    const filename = item.path.replace(/\\/g, "/");
    const ext = path.posix.extname(filename).toLowerCase();
    if (!isSafePath(filename) || !SAFE_EXT.has(ext) || ext === ".png") {
      issues.push("Disallowed file path or extension: " + filename); continue;
    }
    if (names.has(filename.toLowerCase())) { issues.push("Duplicate file: " + filename); continue; }
    names.add(filename.toLowerCase());
    total += Buffer.byteLength(item.content, "utf8");
    normalized.push({ path: filename, content: item.content });
  }
  if (total > MAX_BYTES) issues.push("Project exceeds " + MAX_BYTES + " bytes");
  if (!names.has("index.html")) issues.push("Project must have root index.html");
  if (issues.length) return { files: normalized, issues, tests };
  const index = normalized.find((f) => f.path === "index.html")!;
  if (!/<html[\s>]/i.test(index.content) || !/<body[\s>]/i.test(index.content)) {
    issues.push("index.html must contain html and body elements");
  }
  for (const file of normalized) {
    if (file.path.endsWith(".json") || file.path.endsWith(".webmanifest")) {
      try { JSON.parse(file.content); tests.push("JSON parsed: " + file.path); }
      catch (e) { issues.push(file.path + ": " + String(e)); }
    }
    if (file.path.endsWith(".js")) {
      const checked = spawnSync(process.execPath, ["--check", "-"], {
        input: file.content, encoding: "utf8", timeout: 8000, maxBuffer: 200000,
      });
      if (checked.error || checked.status !== 0) {
        issues.push(file.path + ": " + (checked.stderr || checked.error?.message || "JavaScript syntax error").slice(0, 600));
      } else tests.push("Node syntax: " + file.path);
    }
    if (file.path.endsWith(".html")) {
      const inline = [...file.content.matchAll(/<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)];
      for (let i = 0; i < inline.length; i++) {
        const script = inline[i][1].trim();
        if (!script) continue;
        const checked = spawnSync(process.execPath, ["--check", "-"], {
          input: script, encoding: "utf8", timeout: 8000, maxBuffer: 200000,
        });
        if (checked.error || checked.status !== 0) {
          issues.push(file.path + " inline script " + (i + 1) + ": " + (checked.stderr || checked.error?.message || "Syntax error").slice(0, 600));
        } else tests.push("Node inline-script syntax: " + file.path);
      }
    }
  }
  // Local resources need to exist; external dependency loading is deliberately disallowed.
  for (const match of index.content.matchAll(/<(?:script|link)\b[^>]*(?:src|href)=["']([^"']+)["']/gi)) {
    const address = match[1];
    if (address.startsWith("#") || address.startsWith("data:")) continue;
    if (/^(https?:)?\/\//i.test(address)) {
      issues.push("Remote script/style dependency is not self-contained: " + address); continue;
    }
    const clean = address.split(/[?#]/)[0].replace(/^\.\//, "");
    if (!isSafePath(clean) || !names.has(clean.toLowerCase())) {
      issues.push("Missing local resource: " + address);
    }
  }
  if (!issues.length) tests.push("All static checks passed (not browser/behavior tests)");
  return { files: normalized, issues, tests };
}
function examples(): string {
  const jobs = listBuildJobs().filter((j) => j.phase === "completed").slice(0, 3);
  return jobs.map((j) => "Prior verified request: " + j.goal.slice(0, 450) +
    " | app: " + j.name + " | checks: " + j.tests.join("; ").slice(0, 300)).join("\n");
}
function modelName(): string { return process.env.SYNTHIA_BUILD_MODEL || "qwen2.5-coder:7b"; }
export function buildCapability() {
  return {
    provider: "ollama",
    model: modelName(),
    endpoint: process.env.SYNTHIA_OLLAMA_URL || "http://127.0.0.1:11434",
    enabled: true,
    training: "Not wired: successful jobs become retrievable examples, no weights update",
    verification: "Static checks only; no generated app is executed on the backend",
  };
}
async function generate(prompt: string): Promise<{ name?: string; files?: BuildFile[] }> {
  const base = (process.env.SYNTHIA_OLLAMA_URL || "http://127.0.0.1:11434").replace(/\/+$/, "");
  const response = await fetch(base + "/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: AbortSignal.timeout(150_000),
    body: JSON.stringify({
      model: modelName(), stream: false, format: "json",
      messages: [
        { role: "system", content: "You are the implementation worker in the existing Synthia2 Computer. Produce a genuinely interactive, complete, offline-capable, dependency-free WEB APP from the task. Return ONLY JSON {name:string,files:[{path:string,content:string}]}. Root index.html is mandatory. Optional local .js, .css, .json, .svg and .webmanifest. Build working buttons and save state to localStorage when useful. No placeholders, APIs, external scripts, package files, fake data pretending to be real, or prose outside JSON. All referenced local files must be included. You cannot claim model weight training or APK packaging." },
        { role: "user", content: prompt },
      ],
      options: { temperature: 0.2, num_predict: 12000 },
    }),
  });
  if (!response.ok) throw new Error("Model server HTTP " + response.status + ". Verify Ollama and model installation.");
  const json = await response.json() as { message?: { content?: string } };
  if (!json.message?.content) throw new Error("Model returned no code");
  let output: any;
  try { output = JSON.parse(json.message.content); }
  catch { throw new Error("Model returned invalid JSON instead of build files"); }
  if (!output || !Array.isArray(output.files)) throw new Error("Model did not return build files");
  return output;
}
function writeArtifact(job: BuildJob, files: BuildFile[]) {
  const root = path.join(buildRoot, "artifacts", job.id);
  fs.mkdirSync(root, { recursive: true });
  for (const file of files) {
    const dest = path.resolve(root, file.path);
    if (!dest.startsWith(root + path.sep)) throw new Error("Invalid artifact path");
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, file.content, { flag: "wx" });
  }
  fs.writeFileSync(path.join(root, "receipt.json"), JSON.stringify({
    job: job.id, goal: job.goal, verification: job.tests, files: files.map((f) => ({
      path: f.path, sha256: crypto.createHash("sha256").update(f.content).digest("hex"),
    })),
  }, null, 2), { flag: "wx" });
  return root;
}
async function execute(job: BuildJob, input: BuildRequest) {
  running.add(job.id);
  let repairs = "";
  try {
    for (let attempt = 1; attempt <= 3; attempt++) {
      job.attempts = attempt;
      job.phase = attempt === 1 ? "generating" : "repairing"; save(job);
      const generated = await generate(
        "GOAL:\n" + input.prompt + "\nNAME: " + (input.name || "Untitled") +
        "\nREUSE CONTEXT (verified history, not source code):\n" + examples() +
        "\n" + repairs
      );
      const validation = validateBuildFiles(generated.files);
      job.tests = validation.tests;
      job.issues = validation.issues; save(job);
      if (validation.issues.length) {
        repairs = "REPAIR THE ENTIRE PROJECT. Static checks failed:\n" + validation.issues.join("\n");
        continue;
      }
      job.name = String(input.name || generated.name || job.name).slice(0, 100);
      writeArtifact(job, validation.files);
      job.artifact = "/api/self-build/artifacts/" + job.id + "/index.html";
      job.phase = "publishing"; save(job);
      if (input.target === "site") {
        if (!input.netlifyApiKey) throw new Error("Site publication requires Netlify API token");
        const deployed = await deployToNetlify(input.netlifyApiKey, validation.files,
          input.siteName || undefined);
        if (deployed.status !== "ready") throw new Error("Netlify has not confirmed a ready deploy");
        job.siteUrl = deployed.url;
      } else {
        const mounted = await mountApp({ name: job.name, files: validation.files, icon: "code" });
        job.mountedAppId = mounted.id;
      }
      job.phase = "completed";
      publishMeshEvent({ source: "self-builder", type: "build.completed", topic: job.id,
        payload: { name: job.name, target: job.target, artifact: job.artifact, mountedAppId: job.mountedAppId, siteUrl: job.siteUrl } });
      save(job);
      return;
    }
    throw new Error("Failed static verification after three attempts: " + job.issues.join("; "));
  } catch (error) {
    job.phase = "failed";
    job.issues.push(error instanceof Error ? error.message : String(error));
    publishMeshEvent({ source: "self-builder", type: "build.failed", topic: job.id,
      payload: { issues: job.issues.slice(-4) } });
    save(job);
  } finally { running.delete(job.id); }
}
export function submitSelfBuild(input: BuildRequest): BuildJob {
  if (running.size >= 2) throw new Error("Build queue is full (2 concurrent builds)");
  if (input.target === "site" && !input.netlifyApiKey) throw new Error("Netlify token required for publishing to a site");
  const now = new Date().toISOString();
  const job: BuildJob = {
    id: crypto.randomUUID(), name: (input.name || "Synthia Build").slice(0, 100),
    goal: input.prompt, target: input.target, phase: "queued", attempts: 0,
    tests: [], issues: [], model: modelName(), training: "not-run", createdAt: now, updatedAt: now,
  };
  save(job);
  void execute(job, input);
  return job;
}
export function readBuildArtifact(id: string, relativePath: string): { content: Buffer; mime: string } | null {
  const job = getBuildJob(id);
  if (!job || job.phase !== "completed") return null;
  if (!isSafePath(relativePath)) return null;
  const ext = path.posix.extname(relativePath).toLowerCase();
  if (!SAFE_EXT.has(ext)) return null;
  const root = path.join(buildRoot, "artifacts", id);
  const target = path.resolve(root, relativePath);
  if (!target.startsWith(root + path.sep)) return null;
  try {
    const stat = fs.lstatSync(target);
    if (!stat.isFile() || stat.isSymbolicLink()) return null;
    return { content: fs.readFileSync(target), mime: MIME[ext] || "application/octet-stream" };
  } catch { return null; }
}
