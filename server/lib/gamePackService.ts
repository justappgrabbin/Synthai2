import fs from "fs";
import fsp from "fs/promises";
import path from "path";
import crypto from "crypto";
import JSZip from "jszip";
import { mountApp } from "./appMountService";

export interface GamePackSummary {
  id: string;
  filename: string;
  name: string;
  path: string;
  size: number;
  sizeMb: number;
  entries: number;
  nestedZips: number;
  roots: string[];
  status: "ready" | "empty" | "unreadable";
  warning?: string;
}

function getWorkspaceRoot() {
  return path.resolve(process.env.LINUX_CONTAINER_WORKDIR || path.join(process.cwd(), "workspace"));
}

function getGamePacksRoot() {
  return path.join(getWorkspaceRoot(), "game-packs");
}

function safeId(value: string) {
  return String(value || "game-pack")
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120) || "game-pack";
}

async function resolvePackPath(id: string) {
  const root = getGamePacksRoot();
  const entries = await fsp.readdir(root, { withFileTypes: true });
  const match = entries.find((entry) => entry.isFile() && safeId(entry.name) === safeId(id));
  if (!match) {
    throw new Error("Game pack not found");
  }

  const target = path.resolve(root, match.name);
  if (!target.startsWith(root + path.sep)) {
    throw new Error("Game pack path must stay inside workspace game-packs");
  }
  return target;
}

function displayName(filename: string) {
  return filename
    .replace(/\.zip$/i, "")
    .replace(/[_-]?\d{10,}.*$/g, "")
    .replace(/\(\d+\)/g, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim() || filename;
}

async function inspectZip(filePath: string): Promise<Pick<GamePackSummary, "entries" | "nestedZips" | "roots" | "status" | "warning">> {
  try {
    const buffer = await fsp.readFile(filePath);
    const zip = await JSZip.loadAsync(buffer);
    const files = Object.values(zip.files).filter((entry) => !entry.dir);
    const roots = Array.from(new Set(files
      .map((entry) => entry.name.split("/").filter(Boolean)[0])
      .filter(Boolean)))
      .slice(0, 8);
    const nestedZips = files.filter((entry) => entry.name.toLowerCase().endsWith(".zip")).length;

    if (files.length === 0) {
      return {
        entries: 0,
        nestedZips,
        roots,
        status: "empty",
        warning: "ZIP opened but no readable files were found.",
      };
    }

    return {
      entries: files.length,
      nestedZips,
      roots,
      status: "ready",
      warning: nestedZips > 0 ? "Contains nested ZIPs; mount will preserve them for later extraction." : undefined,
    };
  } catch (error) {
    return {
      entries: 0,
      nestedZips: 0,
      roots: [],
      status: "unreadable",
      warning: error instanceof Error ? error.message : "Unable to inspect ZIP.",
    };
  }
}

export async function ensureGamePacksDir() {
  await fsp.mkdir(getGamePacksRoot(), { recursive: true });
  return getGamePacksRoot();
}

export async function listGamePacks(): Promise<GamePackSummary[]> {
  const root = await ensureGamePacksDir();
  const entries = await fsp.readdir(root, { withFileTypes: true });
  const packs = await Promise.all(entries
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".zip"))
    .map(async (entry) => {
      const filePath = path.join(root, entry.name);
      const stat = await fsp.stat(filePath);
      const inspection = await inspectZip(filePath);
      return {
        id: safeId(entry.name),
        filename: entry.name,
        name: displayName(entry.name),
        path: path.relative(getWorkspaceRoot(), filePath).replace(/\\/g, "/"),
        size: stat.size,
        sizeMb: Math.round((stat.size / 1024 / 1024) * 100) / 100,
        ...inspection,
      };
    }));

  return packs.sort((a, b) => a.name.localeCompare(b.name));
}

export async function mountGamePack(id: string) {
  const packPath = await resolvePackPath(id);
  if (!fs.existsSync(packPath)) throw new Error("Game pack not found");

  const stat = await fsp.stat(packPath);
  if (!stat.isFile()) throw new Error("Game pack must be a file");

  const fileBuffer = await fsp.readFile(packPath);
  const hash = crypto.createHash("sha256").update(fileBuffer).digest("hex").slice(0, 12);
  const name = displayName(path.basename(packPath));

  return mountApp({
    name: `${name} Pack`,
    icon: "gamepad",
    files: [{
      path: path.basename(packPath),
      base64: fileBuffer.toString("base64"),
    }],
    runCommand: "find . -maxdepth 3 -type f | sed 's#^./##' | head -80",
  }).then((app) => ({
    ...app,
    sourcePack: {
      id,
      filename: path.basename(packPath),
      sha256: hash,
      size: stat.size,
    },
  }));
}
