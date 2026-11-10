import assert from "node:assert/strict";
import { after, test } from "node:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { getWorkspaceStatus, listWorkspaceFiles, readWorkspaceFile, writeWorkspaceFile } from "../server/lib/workspaceService";

const root = fs.mkdtempSync(path.join(os.tmpdir(), "synthia-workspace-"));
const outside = fs.mkdtempSync(path.join(os.tmpdir(), "synthia-outside-"));
const previous = process.env.LINUX_CONTAINER_WORKDIR;
process.env.LINUX_CONTAINER_WORKDIR = root;

after(() => {
  if (previous === undefined) delete process.env.LINUX_CONTAINER_WORKDIR;
  else process.env.LINUX_CONTAINER_WORKDIR = previous;
  fs.rmSync(root, { recursive: true, force: true });
  fs.rmSync(outside, { recursive: true, force: true });
});

test("workspace persists written files and returns their hash", () => {
  assert.equal(getWorkspaceStatus().exists, true);
  const written = writeWorkspaceFile({ path: "notes/test.txt", content: "persistent data" });
  assert.equal(readWorkspaceFile("notes/test.txt").content, "persistent data");
  assert.equal(written.sha256, readWorkspaceFile("notes/test.txt").sha256);
  assert.ok(listWorkspaceFiles("notes").entries.some((entry) => entry.name === "test.txt"));
});

test("workspace rejects parent traversal", () => {
  assert.throws(() => writeWorkspaceFile({ path: "../escape.txt", content: "no" }));
  assert.throws(() => readWorkspaceFile("../escape.txt"));
});

test("workspace rejects symlink escapes for reads, writes, and listings", (t) => {
  const link = path.join(root, "external");
  try { fs.symlinkSync(outside, link, process.platform === "win32" ? "junction" : "dir"); }
  catch (error) { t.skip("symlinks unavailable: " + String(error)); return; }
  fs.writeFileSync(path.join(outside, "secret.txt"), "outside");
  assert.throws(() => readWorkspaceFile("external/secret.txt"), /symbolic links/);
  assert.throws(() => writeWorkspaceFile({ path: "external/new.txt", content: "no" }), /symbolic links/);
  assert.throws(() => listWorkspaceFiles("external"), /symbolic links/);
  assert.equal(fs.existsSync(path.join(outside, "new.txt")), false);
});
