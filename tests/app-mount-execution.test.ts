import assert from "node:assert/strict";
import { after, test } from "node:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import JSZip from "jszip";
import { getMountedApp, getMountedAppRuns, listMountedApps, mountApp, runMountedApp } from "../server/lib/appMountService";

const root = fs.mkdtempSync(path.join(os.tmpdir(), "synthia-apps-"));
const previous = {
  LINUX_CONTAINER_WORKDIR: process.env.LINUX_CONTAINER_WORKDIR,
  LINUX_CONTAINER_ENABLED: process.env.LINUX_CONTAINER_ENABLED,
};
process.env.LINUX_CONTAINER_WORKDIR = root;
after(() => {
  for (const [key, value] of Object.entries(previous)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  fs.rmSync(root, { recursive: true, force: true });
});

test("mounted apps persist manifests and files across reads", async () => {
  const app = await mountApp({ name: "Synthia fixture", files: [{ path: "main.js", content: "console.log('ok')" }] });
  assert.ok((await listMountedApps()).some((item) => item?.id === app.id));
  assert.ok((await getMountedApp(app.id)).files.includes("main.js"));
});

test("app mount rejects traversal and absolute paths", async () => {
  await assert.rejects(mountApp({ name: "traversal", files: [{ path: "../escape.txt", content: "no" }] }), /Invalid upload path/);
  await assert.rejects(mountApp({ name: "absolute", files: [{ path: "/tmp/escape.txt", content: "no" }] }), /Invalid upload path/);
});

test("app mount rejects ZIPs exceeding entry count", async () => {
  const zip = new JSZip();
  for (let i = 0; i < 1001; i++) zip.file(`file-${i}.txt`, "x");
  const base64 = await zip.generateAsync({ type: "base64" });
  await assert.rejects(mountApp({ name: "oversized", files: [{ path: "bundle.zip", base64 }] }), /ZIP exceeds extraction limits/);
});

test("mounted JavaScript app executes and retains run history", async (t) => {
  if (process.platform === "win32") { t.skip("POSIX shell required"); return; }
  process.env.LINUX_CONTAINER_ENABLED = "true";
  const app = await mountApp({ name: "executable", files: [{ path: "main.js", content: "console.log('synthia-run-ok')" }] });
  const result = await runMountedApp(app.id);
  assert.equal(result.run.code, 0);
  assert.match(result.run.stdout, /synthia-run-ok/);
  assert.ok((await getMountedAppRuns(app.id)).length >= 1);
});

test("mounted app and run history survive module reload", async (t) => {
  if (process.platform === "win32") { t.skip("POSIX shell required"); return; }
  process.env.LINUX_CONTAINER_ENABLED = "true";
  const app = await mountApp({
    name: "restart recovery",
    files: [{ path: "main.js", content: "console.log('recovered-run')" }],
  });
  const first = await runMountedApp(app.id);
  assert.equal(first.run.code, 0);

  // A fresh module instance simulates service restart while keeping disk state.
  const recovered = await import(`../server/lib/appMountService.ts?recovery=${Date.now()}`);
  const restored = await recovered.getMountedApp(app.id);
  assert.equal(restored.id, app.id);
  assert.ok(restored.files.includes("main.js"));
  const history = await recovered.getMountedAppRuns(app.id);
  assert.equal(history.length, 1);
  assert.equal(history[0].stdout.trim(), "recovered-run");
  const second = await recovered.runMountedApp(app.id);
  assert.equal(second.run.code, 0);
  assert.equal((await recovered.getMountedAppRuns(app.id)).length, 2);
});
