import assert from "node:assert/strict";
import { after, test } from "node:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { getContainerStatus, runContainerCommand } from "../server/lib/linuxContainerService";

const root = fs.mkdtempSync(path.join(os.tmpdir(), "synthia-terminal-"));
const outside = fs.mkdtempSync(path.join(os.tmpdir(), "synthia-terminal-outside-"));
const previous = {
  LINUX_CONTAINER_ENABLED: process.env.LINUX_CONTAINER_ENABLED,
  LINUX_CONTAINER_WORKDIR: process.env.LINUX_CONTAINER_WORKDIR,
  LINUX_CONTAINER_TIMEOUT_MS: process.env.LINUX_CONTAINER_TIMEOUT_MS,
};
process.env.LINUX_CONTAINER_WORKDIR = root;

after(() => {
  for (const [key, value] of Object.entries(previous)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  fs.rmSync(root, { recursive: true, force: true });
  fs.rmSync(outside, { recursive: true, force: true });
});

test("terminal disabled by default unless explicitly enabled", async () => {
  process.env.LINUX_CONTAINER_ENABLED = "false";
  assert.equal(getContainerStatus().enabled, false);
  await assert.rejects(runContainerCommand("echo forbidden"), /disabled/);
});

test("terminal executes a command in its configured workspace", async (t) => {
  if (process.platform === "win32") { t.skip("POSIX shell required"); return; }
  process.env.LINUX_CONTAINER_ENABLED = "true";
  const result = await runContainerCommand("printf synthia");
  assert.equal(result.code, 0);
  assert.equal(result.stdout, "synthia");
  assert.equal(result.cwd, root);
});

test("terminal rejects parent-directory cwd escape", async () => {
  process.env.LINUX_CONTAINER_ENABLED = "true";
  await assert.rejects(runContainerCommand("pwd", "../"), /workspace/);
});

test("terminal rejects symlink cwd escape", async (t) => {
  process.env.LINUX_CONTAINER_ENABLED = "true";
  try { fs.symlinkSync(outside, path.join(root, "outside"), process.platform === "win32" ? "junction" : "dir"); }
  catch (error) { t.skip(String(error)); return; }
  await assert.rejects(runContainerCommand("pwd", "outside"), /symbolic links/);
});

test("terminal timeout reports timedOut", async (t) => {
  if (process.platform === "win32") { t.skip("POSIX shell required"); return; }
  process.env.LINUX_CONTAINER_ENABLED = "true";
  process.env.LINUX_CONTAINER_TIMEOUT_MS = "100";
  const result = await runContainerCommand("sleep 2");
  assert.equal(result.timedOut, true);
});
