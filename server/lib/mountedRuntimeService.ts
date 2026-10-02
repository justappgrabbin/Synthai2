import { spawn, type ChildProcessWithoutNullStreams } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";
import { getMountedApp, getMountedAppDirectory } from "./appMountService";

const RESONANCE_BACKEND_PORT = Number(process.env.RESONANCE_NETWORK_BACKEND_PORT || 8811);
const RESONANCE_OPPORTUNITY_PORT = Number(process.env.RESONANCE_NETWORK_OPPORTUNITY_PORT || 8812);
const RESONANCE_FRONTEND_PORT = Number(process.env.RESONANCE_NETWORK_FRONTEND_PORT || 8813);
const MAX_LOG_LINES = 400;

type RuntimeRecord = {
  appId: string;
  kind: "resonance-network" | "unknown";
  process: ChildProcessWithoutNullStreams;
  pid: number | null;
  startedAt: string;
  stoppedAt: string | null;
  exitCode: number | null;
  signal: NodeJS.Signals | null;
  logs: string[];
  command: string;
};

const runtimes = new Map<string, RuntimeRecord>();

function appendLog(record: RuntimeRecord, prefix: string, chunk: Buffer | string) {
  const lines = String(chunk)
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => `${new Date().toISOString()} ${prefix} ${line}`);
  record.logs.push(...lines);
  if (record.logs.length > MAX_LOG_LINES) {
    record.logs.splice(0, record.logs.length - MAX_LOG_LINES);
  }
}

function detectKind(appDir: string): RuntimeRecord["kind"] {
  const root = path.join(appDir, "organism");
  const markers = [
    path.join(root, "backend", "main.py"),
    path.join(root, "frontend", "package.json"),
    path.join(root, "run-backend-with-opportunities.sh"),
  ];
  return markers.every((marker) => fs.existsSync(marker)) ? "resonance-network" : "unknown";
}

function shellCommandFor(appDir: string, kind: RuntimeRecord["kind"]) {
  if (kind !== "resonance-network") {
    throw new Error("Mounted app does not expose a managed runtime profile");
  }

  const organism = path.join(appDir, "organism");
  const quoted = JSON.stringify(organism);
  const backendPort = RESONANCE_BACKEND_PORT;
  const opportunityPort = RESONANCE_OPPORTUNITY_PORT;
  const frontendPort = RESONANCE_FRONTEND_PORT;

  return `set -euo pipefail
cd ${quoted}
export SYNTHIA_OPPORTUNITY_PORT=${opportunityPort}
export RESONANCE_PORT=${backendPort}
export VITE_API_BASE_URL=http://127.0.0.1:${backendPort}/api
RUNTIME_DIR="$PWD/.synthia-runtime"
PYTHON_BIN="\${RESONANCE_PYTHON_BIN:-python3}"
if ! "$PYTHON_BIN" -c "import fastapi,uvicorn,skyfield,pydantic" >/dev/null 2>&1; then
  if [ ! -x "$RUNTIME_DIR/venv/bin/python" ]; then
    mkdir -p "$RUNTIME_DIR"
    "$PYTHON_BIN" -m venv "$RUNTIME_DIR/venv"
  fi
  if ! "$RUNTIME_DIR/venv/bin/python" -c "import fastapi,uvicorn,skyfield,pydantic" >/dev/null 2>&1; then
    "$RUNTIME_DIR/venv/bin/python" -m pip install --disable-pip-version-check -r backend/requirements.txt
  fi
  PYTHON_BIN="$RUNTIME_DIR/venv/bin/python"
fi
if [ ! -e frontend/node_modules ]; then
  if [ -d /opt/resonance-web-runtime/node_modules ]; then
    ln -s /opt/resonance-web-runtime/node_modules frontend/node_modules
  elif [ -f frontend/package-lock.json ]; then
    (cd frontend && npm ci --no-audit --no-fund)
  else
    (cd frontend && npm install --no-audit --no-fund)
  fi
fi
node external-opportunity/service.mjs &
OPP_PID=$!
(cd backend && "$PYTHON_BIN" -m uvicorn main:app --host 0.0.0.0 --port ${backendPort}) &
BACK_PID=$!
(cd frontend && npm run dev -- --host 0.0.0.0 --port ${frontendPort}) &
FRONT_PID=$!
cleanup() {
  kill "$FRONT_PID" "$BACK_PID" "$OPP_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM
wait -n "$OPP_PID" "$BACK_PID" "$FRONT_PID"`;
}

async function probe(url: string) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 1200);
  try {
    const response = await fetch(url, { signal: controller.signal });
    return { ok: response.ok, status: response.status };
  } catch (error) {
    return { ok: false, status: null, error: error instanceof Error ? error.message : String(error) };
  } finally {
    clearTimeout(timer);
  }
}

export async function getMountedRuntimeStatus(appId: string) {
  const app = await getMountedApp(appId);
  const appDir = getMountedAppDirectory(appId);
  const kind = detectKind(appDir);
  const runtime = runtimes.get(appId);
  const processRunning = Boolean(runtime && runtime.process && !runtime.process.killed && runtime.exitCode === null);

  const [backend, opportunity, frontend] = kind === "resonance-network"
    ? await Promise.all([
        probe(`http://127.0.0.1:${RESONANCE_BACKEND_PORT}/api/health`),
        probe(`http://127.0.0.1:${RESONANCE_OPPORTUNITY_PORT}/health`),
        probe(`http://127.0.0.1:${RESONANCE_FRONTEND_PORT}/`),
      ])
    : [{ ok: false, status: null }, { ok: false, status: null }, { ok: false, status: null }];

  return {
    app,
    kind,
    running: processRunning || backend.ok || frontend.ok,
    pid: runtime?.pid || null,
    startedAt: runtime?.startedAt || null,
    stoppedAt: runtime?.stoppedAt || null,
    exitCode: runtime?.exitCode ?? null,
    signal: runtime?.signal ?? null,
    command: runtime?.command || null,
    logs: runtime?.logs.slice(-120) || [],
    services: {
      backend: { ...backend, url: `http://127.0.0.1:${RESONANCE_BACKEND_PORT}` },
      opportunity: { ...opportunity, url: `http://127.0.0.1:${RESONANCE_OPPORTUNITY_PORT}` },
      frontend: { ...frontend, url: `http://127.0.0.1:${RESONANCE_FRONTEND_PORT}` },
    },
  };
}

export async function startMountedRuntime(appId: string) {
  const existing = runtimes.get(appId);
  if (existing && !existing.process.killed && existing.exitCode === null) {
    return getMountedRuntimeStatus(appId);
  }

  await getMountedApp(appId);
  const appDir = getMountedAppDirectory(appId);
  const kind = detectKind(appDir);
  const command = shellCommandFor(appDir, kind);
  const shell = process.env.LINUX_CONTAINER_SHELL || (os.platform() === "win32" ? "powershell.exe" : "/bin/bash");
  const args = os.platform() === "win32"
    ? ["-NoLogo", "-NoProfile", "-Command", command]
    : ["-lc", command];

  const child = spawn(shell, args, {
    cwd: appDir,
    env: process.env,
    windowsHide: true,
    detached: os.platform() !== "win32",
  });

  const record: RuntimeRecord = {
    appId,
    kind,
    process: child,
    pid: child.pid || null,
    startedAt: new Date().toISOString(),
    stoppedAt: null,
    exitCode: null,
    signal: null,
    logs: [],
    command,
  };
  runtimes.set(appId, record);

  child.stdout.on("data", (chunk) => appendLog(record, "stdout", chunk));
  child.stderr.on("data", (chunk) => appendLog(record, "stderr", chunk));
  child.on("error", (error) => appendLog(record, "error", error.message));
  child.on("close", (code, signal) => {
    record.exitCode = code;
    record.signal = signal;
    record.stoppedAt = new Date().toISOString();
  });

  return getMountedRuntimeStatus(appId);
}

export async function stopMountedRuntime(appId: string) {
  const runtime = runtimes.get(appId);
  if (!runtime) return getMountedRuntimeStatus(appId);

  if (runtime.process.pid && !runtime.process.killed) {
    try {
      if (os.platform() !== "win32") process.kill(-runtime.process.pid, "SIGTERM");
      else runtime.process.kill("SIGTERM");
    } catch {
      runtime.process.kill("SIGTERM");
    }
  }
  runtime.stoppedAt = new Date().toISOString();
  return getMountedRuntimeStatus(appId);
}

process.once("exit", () => {
  for (const runtime of runtimes.values()) {
    if (!runtime.process.killed && runtime.process.pid) {
      try {
        if (os.platform() !== "win32") process.kill(-runtime.process.pid, "SIGTERM");
        else runtime.process.kill("SIGTERM");
      } catch {
        // best effort shutdown
      }
    }
  }
});
