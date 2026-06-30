import fs from "fs";
import fsp from "fs/promises";
import path from "path";
import crypto from "crypto";
import JSZip from "jszip";
import { runContainerCommand } from "./linuxContainerService";

export interface MountedAppFile {
  path: string;
  content?: string;
  base64?: string;
}

export interface MountedAppInput {
  name: string;
  files: MountedAppFile[];
  runCommand?: string;
  icon?: string;
}

function getAppsRoot() {
  const workspace = process.env.LINUX_CONTAINER_WORKDIR || path.join(process.cwd(), "workspace");
  return path.resolve(workspace, "apps");
}

function safeName(value: string) {
  return String(value || "mounted-app")
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "mounted-app";
}

function createAppId(name: string) {
  return `${safeName(name)}-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;
}

function resolveAppPath(id: string) {
  const root = getAppsRoot();
  const target = path.resolve(root, safeName(id));
  if (target !== root && !target.startsWith(root + path.sep)) {
    throw new Error("App path must stay inside workspace apps");
  }
  return target;
}

function resolveInside(root: string, filePath: string) {
  const normalized = filePath.replace(/\\/g, "/").replace(/^\/+/, "");
  if (!normalized || normalized.includes("../")) {
    throw new Error("Invalid upload path");
  }

  const target = path.resolve(root, normalized);
  if (!target.startsWith(path.resolve(root) + path.sep) && target !== path.resolve(root)) {
    throw new Error("Upload path must stay inside mounted app");
  }
  return target;
}

async function ensureDir(dir: string) {
  await fsp.mkdir(dir, { recursive: true });
}

async function writeJson(file: string, value: unknown) {
  await ensureDir(path.dirname(file));
  await fsp.writeFile(file, JSON.stringify(value, null, 2));
}

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await fsp.readFile(file, "utf8")) as T;
  } catch {
    return fallback;
  }
}

async function listFiles(dir: string, base = dir, acc: string[] = []) {
  if (!fs.existsSync(dir)) return acc;
  const entries = await fsp.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    const rel = path.relative(base, full).replace(/\\/g, "/");
    if (entry.isDirectory()) {
      if (!["node_modules", ".git", "__pycache__", ".venv", "venv"].includes(entry.name)) {
        await listFiles(full, base, acc);
      }
    } else if (!rel.startsWith(".you-n-i-verse-")) {
      acc.push(rel);
    }
  }
  return acc.slice(0, 500);
}

async function extractZip(buffer: Buffer, destination: string) {
  const zip = await JSZip.loadAsync(buffer);
  const extracted: string[] = [];
  const writes: Promise<void>[] = [];

  zip.forEach((relativePath, file) => {
    if (file.dir) return;
    const normalized = relativePath.replace(/\\/g, "/").replace(/^\/+/, "");
    if (!normalized || normalized.includes("../")) return;
    writes.push((async () => {
      const target = resolveInside(destination, normalized);
      await ensureDir(path.dirname(target));
      await fsp.writeFile(target, await file.async("nodebuffer"));
      extracted.push(normalized);
    })());
  });

  await Promise.all(writes);
  return extracted;
}

async function writeMountedFile(appDir: string, file: MountedAppFile) {
  const buffer = file.base64
    ? Buffer.from(file.base64, "base64")
    : Buffer.from(file.content || "", "utf8");

  if (file.path.toLowerCase().endsWith(".zip")) {
    return extractZip(buffer, appDir);
  }

  const target = resolveInside(appDir, file.path);
  await ensureDir(path.dirname(target));
  await fsp.writeFile(target, buffer);
  return [path.relative(appDir, target).replace(/\\/g, "/")];
}

async function detectRunCommand(appDir: string) {
  const files = await listFiles(appDir);
  if (fs.existsSync(path.join(appDir, "package.json"))) return "npm install && npm start";
  const html = files.find((file) => file.toLowerCase().endsWith("index.html"))
    || files.find((file) => file.toLowerCase().endsWith(".html"));
  if (html) return `node -e "console.log('Static HTML app mounted: ${html}')"`;
  const py = files.find((file) => file.toLowerCase().endsWith(".py"));
  if (py) return `python3 ${JSON.stringify(py)} || python ${JSON.stringify(py)}`;
  const js = files.find((file) => file.toLowerCase().endsWith(".js"));
  if (js) return `node ${JSON.stringify(js)}`;
  return "ls -la";
}

export async function mountApp(input: MountedAppInput) {
  if (!input.files?.length) throw new Error("At least one file is required");

  const id = createAppId(input.name);
  const appDir = resolveAppPath(id);
  await ensureDir(appDir);

  const written: string[] = [];
  for (const file of input.files) {
    written.push(...await writeMountedFile(appDir, file));
  }

  const manifest = {
    id,
    name: input.name,
    icon: input.icon || "box",
    status: "mounted",
    path: path.relative(process.env.LINUX_CONTAINER_WORKDIR || process.cwd(), appDir).replace(/\\/g, "/"),
    runCommand: input.runCommand || await detectRunCommand(appDir),
    files: await listFiles(appDir),
    written,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await writeJson(path.join(appDir, ".you-n-i-verse-app.json"), manifest);
  return manifest;
}

export async function listMountedApps() {
  await ensureDir(getAppsRoot());
  const entries = await fsp.readdir(getAppsRoot(), { withFileTypes: true });
  return Promise.all(entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => readJson(path.join(getAppsRoot(), entry.name, ".you-n-i-verse-app.json"), null)));
}

export async function getMountedApp(id: string) {
  const appDir = resolveAppPath(id);
  const manifest = await readJson<Record<string, unknown> | null>(path.join(appDir, ".you-n-i-verse-app.json"), null);
  if (!manifest) throw new Error("Mounted app not found");
  return { ...manifest, files: await listFiles(appDir) };
}

export async function runMountedApp(id: string, command?: string) {
  const appDir = resolveAppPath(id);
  const manifest = await getMountedApp(id);
  const runCommand = command || String(manifest.runCommand || "ls -la");
  const cwd = path.relative(process.env.LINUX_CONTAINER_WORKDIR || process.cwd(), appDir).replace(/\\/g, "/");
  const result = await runContainerCommand(runCommand, cwd);
  const run = { id: `run-${Date.now()}`, ...result, at: new Date().toISOString() };
  const runsFile = path.join(appDir, ".you-n-i-verse-runs.json");
  const runs = await readJson<unknown[]>(runsFile, []);
  await writeJson(runsFile, [run, ...runs].slice(0, 50));
  await writeJson(path.join(appDir, ".you-n-i-verse-app.json"), {
    ...manifest,
    runCommand,
    status: result.code === 0 ? "ran" : "error",
    updatedAt: new Date().toISOString(),
  });
  return { app: await getMountedApp(id), run };
}

export async function getMountedAppRuns(id: string) {
  const appDir = resolveAppPath(id);
  return readJson(path.join(appDir, ".you-n-i-verse-runs.json"), []);
}
