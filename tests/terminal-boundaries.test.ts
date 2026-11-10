import assert from "node:assert/strict";
import { after, test } from "node:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { getContainerStatus, runContainerCommand } from "../server/lib/linuxContainerService";

const root = fs.mkdtempSync(path.join(os.tmpdir(), "synthia-terminal-"));
const outside = fs.mkdtempSync(path.join(os.tmpdir(), "synthia-terminal-outside-"));
const oldRoot = process.env.LINUX_CONTAINER_WORKDIR;
const oldEnabled = process.env.LINUX_CONTAINER_ENABLED;
process.env.LINUX_CONTAINER_WORKDIR = root;

after(() => {
  if (oldRoot === undefined) delete process.env.LINUX_CONTAINER_WORKDIR;
  else process.env.LINUX_CONTAINER_WORKDIR = oldRoot;
  if (oldEnabled === undefined) delete process.env.LINUX_CONTAINER_ENABLED;
  else process.env.LINUX_CONTAINER_ENABLED = oldEnabled;
  fs.rmSync(root, { recursive: true, force: true });
  fs.rmSync(outside, { recursive: true, force: true });
});

test("terminal refuses commands when bridge is disabled", async () => {
  process.env.LINUX_CONTAINER_ENABLED = "false";
  assert.equal(getContainerStatus().enabled, false);
  await assert.rejects(runContainerCommand("echo should-not-run"), /disabled/);
});

test("terminal refuses cwd parent traversal", async () => {
  process.env.LINUX_CONTAINER_ENABLED = "true";
  await assert.rejects(runContainerCommand("echo should-not-run", ".."), /workspace/);
});

test("terminal refuses cwd symlink escape", async (t) => {
  const link = path.join(root, "outside-link");
  try { fs.symlinkSync(outside, link, process.platform === "win32" ? "junction" : "dir"); }
  catch (error) { t.skip("symlinks unavailable: " + String(error)); return; }
  process.env.LINUX_CONTAINER_ENABLED = "true";
  await assert.rejects(runContainerCommand("echo should-not-run", "outside-link"), /symbolic links/);
});

test("terminal executes inside workspace when explicitly enabled", async (t) => {
  if (process.platform === "win32" || !fs.existsSync("/bin/bash")) {
    t.skip("POSIX bash unavailable"); return;
  }
  process.env.LINUX_CONTAINER_ENABLED = "true";
  const result = await runContainerCommand("printf 'synthia-ok'", ".");
  assert.equal(result.code, 0);
  assert.equal(result.stdout, "synthia-ok");
  assert.equal(result.cwd, root);
});
