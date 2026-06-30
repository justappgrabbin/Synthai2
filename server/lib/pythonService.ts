import { spawn, type ChildProcessWithoutNullStreams } from "child_process";
import os from "os";

export interface PythonServiceStatus {
  configured: boolean;
  managed: boolean;
  running: boolean;
  pid: number | null;
  url: string;
  command: string;
  lastStartedAt: string | null;
  lastExit: {
    code: number | null;
    signal: NodeJS.Signals | null;
    at: string;
  } | null;
  lastError: string | null;
}

const DEFAULT_PYTHON_PORT = 8000;
const DEFAULT_PYTHON_HOST = "127.0.0.1";

let pythonProcess: ChildProcessWithoutNullStreams | null = null;
let lastStartedAt: string | null = null;
let lastExit: PythonServiceStatus["lastExit"] = null;
let lastError: string | null = null;

function getPythonPort() {
  return Number(process.env.PYTHON_API_PORT || DEFAULT_PYTHON_PORT);
}

export function getPythonApiUrl() {
  return process.env.PYTHON_API_URL || `http://${DEFAULT_PYTHON_HOST}:${getPythonPort()}`;
}

function getPythonCommand() {
  if (process.env.PYTHON_BIN) {
    return { command: process.env.PYTHON_BIN, args: [] };
  }

  return os.platform() === "win32"
    ? { command: "py", args: ["-3"] }
    : { command: "python3", args: [] };
}

function getUvicornArgs() {
  return [
    "-m",
    "uvicorn",
    "you_n_i_verse.api:app",
    "--host",
    DEFAULT_PYTHON_HOST,
    "--port",
    String(getPythonPort()),
  ];
}

export function getPythonServiceStatus(): PythonServiceStatus {
  const python = getPythonCommand();
  const externallyManaged = process.env.PYTHON_API_AUTOSTART === "false";
  return {
    configured: true,
    managed: Boolean(pythonProcess && !pythonProcess.killed),
    running: Boolean(pythonProcess && !pythonProcess.killed) || externallyManaged,
    pid: pythonProcess?.pid || null,
    url: getPythonApiUrl(),
    command: [python.command, ...python.args, ...getUvicornArgs()].join(" "),
    lastStartedAt,
    lastExit,
    lastError,
  };
}

export async function startPythonService() {
  if (pythonProcess && !pythonProcess.killed) {
    return getPythonServiceStatus();
  }

  const python = getPythonCommand();
  pythonProcess = spawn(python.command, [...python.args, ...getUvicornArgs()], {
    cwd: process.cwd(),
    env: process.env,
    windowsHide: true,
  });

  lastStartedAt = new Date().toISOString();
  lastError = null;
  lastExit = null;

  pythonProcess.stdout.on("data", (chunk) => {
    console.log(`[python] ${chunk.toString().trim()}`);
  });

  pythonProcess.stderr.on("data", (chunk) => {
    console.warn(`[python] ${chunk.toString().trim()}`);
  });

  pythonProcess.on("error", (error) => {
    lastError = error.message;
    pythonProcess = null;
  });

  pythonProcess.on("close", (code, signal) => {
    lastExit = { code, signal, at: new Date().toISOString() };
    pythonProcess = null;
  });

  return getPythonServiceStatus();
}

export function stopPythonService() {
  if (pythonProcess && !pythonProcess.killed) {
    pythonProcess.kill("SIGTERM");
  }

  return getPythonServiceStatus();
}

export async function proxyPythonRequest(method: string, path: string, body?: unknown) {
  const url = new URL(path, getPythonApiUrl());
  const allowsBody = method !== "GET" && method !== "HEAD";
  const hasBody = allowsBody && body !== undefined && !(typeof body === "object" && body !== null && Object.keys(body).length === 0);
  const response = await fetch(url, {
    method,
    headers: hasBody ? { "content-type": "application/json" } : undefined,
    body: hasBody ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  const contentType = response.headers.get("content-type") || "application/json";

  return {
    ok: response.ok,
    status: response.status,
    contentType,
    body: contentType.includes("application/json") && text ? JSON.parse(text) : text,
  };
}

process.once("exit", () => {
  if (pythonProcess && !pythonProcess.killed) {
    pythonProcess.kill("SIGTERM");
  }
});
