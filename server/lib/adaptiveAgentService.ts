import { spawn } from "child_process";
import fs from "fs";
import path from "path";

const projectRoot = path.resolve(process.cwd());
const workspace = path.resolve(process.env.LINUX_CONTAINER_WORKDIR || path.join(projectRoot, "workspace"));
const driver = path.join(projectRoot, "synthia-server", "adaptive-agent", "bridge.py");
let running = false;
let busy = false;
let timer: ReturnType<typeof setTimeout> | null = null;
let lastError: string | null = null;
let lastReport: Record<string, unknown> | null = null;

function readProgress(): Record<string, unknown> {
  try {
    return JSON.parse(fs.readFileSync(path.join(workspace, ".synthia", "adaptive-agent-state.json"), "utf8"));
  } catch {
    return { phase: "idle", step: 0, blocked: null, events: [] };
  }
}
export function adaptiveStatus() {
  return {
    available: fs.existsSync(driver),
    running,
    busy,
    lastError,
    progress: readProgress(),
    lastReport,
    observation: "In-app navigation only when explicitly enabled; no Android screen or camera access",
  };
}

async function cycle(): Promise<void> {
  if (!running || busy) return;
  busy = true;
  try {
    const report = await new Promise<Record<string, unknown>>((resolve, reject) => {
      const child = spawn(process.env.SYNTHIA_ADAPTIVE_PYTHON || "python3", [
        driver, "--project-root", projectRoot, "--workspace", workspace, "--execute",
      ], { cwd: projectRoot, env: process.env, stdio: ["ignore", "pipe", "pipe"] });
      let output = "";
      let error = "";
      const timeout = setTimeout(() => child.kill("SIGTERM"), 195000);
      child.stdout.on("data", (chunk: Buffer) => { output += String(chunk).slice(0, 120000); });
      child.stderr.on("data", (chunk: Buffer) => { error = (error + String(chunk)).slice(-6000); });
      child.once("error", (err) => { clearTimeout(timeout); reject(err); });
      child.once("close", (code) => {
        clearTimeout(timeout);
        if (code !== 0) return reject(new Error(error || "Adaptive cycle exited with code " + code));
        try { resolve(JSON.parse(output)); } catch { reject(new Error("Adaptive cycle returned invalid JSON")); }
      });
    });
    lastReport = report;
    const progress = readProgress();
    if (progress.phase === "blocked" || progress.phase === "verified") running = false;
    lastError = typeof progress.blocked === "string" ? progress.blocked : null;
  } catch (error) {
    running = false;
    lastError = error instanceof Error ? error.message : String(error);
  } finally {
    busy = false;
    if (running) timer = setTimeout(() => { void cycle(); }, 30000);
  }
}

export function startAdaptiveBuild() {
  if (!fs.existsSync(driver)) return { ok: false, error: "Bundled Adaptive Agent unavailable" };
  if (running || busy) return { ok: false, error: "An agent cycle is already running" };
  running = true;
  lastError = null;
  timer = setTimeout(() => { void cycle(); }, 0);
  return { ok: true, status: adaptiveStatus() };
}
export function stopAdaptiveBuild() {
  running = false;
  if (timer) clearTimeout(timer);
  timer = null;
  return { ok: true, status: adaptiveStatus() };
}
