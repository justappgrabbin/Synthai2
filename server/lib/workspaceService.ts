import fs from "fs";
import path from "path";
import crypto from "crypto";

export interface WorkspaceFileInput {
  path: string;
  content?: string;
  base64?: string;
}

export interface WorkspaceFileRecord {
  path: string;
  absolutePath: string;
  size: number;
  sha256: string;
  writtenAt: string;
}

function getWorkspaceRoot() {
  return path.resolve(process.env.LINUX_CONTAINER_WORKDIR || path.join(process.cwd(), "workspace"));
}

function resolveWorkspacePath(filePath: string) {
  const root = getWorkspaceRoot();
  const normalized = filePath.replace(/\\/g, "/").replace(/^\/+/, "");
  const target = path.resolve(root, normalized);

  if (target !== root && !target.startsWith(root + path.sep)) {
    throw new Error("Workspace path must stay inside the configured workspace");
  }

  return target;
}

function getHash(buffer: Buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

export function getWorkspaceStatus() {
  const root = getWorkspaceRoot();
  fs.mkdirSync(root, { recursive: true });

  return {
    root,
    exists: fs.existsSync(root),
  };
}

export function writeWorkspaceFile(input: WorkspaceFileInput): WorkspaceFileRecord {
  if (!input.path) {
    throw new Error("File path is required");
  }

  const target = resolveWorkspacePath(input.path);
  const buffer = input.base64
    ? Buffer.from(input.base64, "base64")
    : Buffer.from(input.content || "", "utf8");

  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, buffer);

  return {
    path: path.relative(getWorkspaceRoot(), target).replace(/\\/g, "/"),
    absolutePath: target,
    size: buffer.byteLength,
    sha256: getHash(buffer),
    writtenAt: new Date().toISOString(),
  };
}

export function readWorkspaceFile(filePath: string) {
  const target = resolveWorkspacePath(filePath);
  const buffer = fs.readFileSync(target);

  return {
    path: path.relative(getWorkspaceRoot(), target).replace(/\\/g, "/"),
    absolutePath: target,
    size: buffer.byteLength,
    sha256: getHash(buffer),
    content: buffer.toString("utf8"),
  };
}

export function listWorkspaceFiles(dir = ".") {
  const target = resolveWorkspacePath(dir);
  const entries = fs.existsSync(target)
    ? fs.readdirSync(target, { withFileTypes: true }).map((entry) => {
        const fullPath = path.join(target, entry.name);
        const stats = fs.statSync(fullPath);
        return {
          name: entry.name,
          path: path.relative(getWorkspaceRoot(), fullPath).replace(/\\/g, "/"),
          type: entry.isDirectory() ? "directory" : "file",
          size: stats.size,
          modifiedAt: stats.mtime.toISOString(),
        };
      })
    : [];

  return {
    root: getWorkspaceRoot(),
    dir,
    entries,
  };
}
