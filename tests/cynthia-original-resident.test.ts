import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { cynthiaHtml, cynthiaJs } from "../server/lib/cynthiaResidentBridge";

const root = path.resolve("vendor/klein-agent");
const pin = "78ea0e28c70d7a5d4c288279025a493ceccbde5d";

test("original pinned trained model and tools are present without modification", () => {
  assert.ok(existsSync(path.join(root, "run/model.pt")), "checkout submodules to include the real trained weights");
  assert.equal(execFileSync("git", ["-C", root, "rev-parse", "HEAD"], { encoding: "utf8" }).trim(), pin);
  const manifest = JSON.parse(readFileSync(path.join(root, "run/artifact_manifest.json"), "utf8"));
  for (const name of ["run/model.pt", "run/tokenizer.json", "web_app.py",
    "klein_tools_fixed/neural/skilled_agent.py", "klein_tools_fixed/neural/skill_library.py"]) {
    const actual = createHash("sha256").update(readFileSync(path.join(root, name))).digest("hex");
    assert.equal(actual, manifest[name], name + " matches the original");
  }
});

test("original frontend references are rebased only when served, not edited on disk", () => {
  assert.equal(cynthiaHtml('<link href="/style.css"><script src="/app.js"></script>'),
    '<link href="/resident/cynthia/style.css"><script src="/resident/cynthia/app.js"></script>');
  assert.equal(cynthiaJs("fetch('/api/chat'); fetch(\"/api/status\");"),
    "fetch('/resident/cynthia/api/chat'); fetch(\"/resident/cynthia/api/status\");");
  assert.ok(readFileSync(path.join(root, "web/app.js"), "utf8").includes("'/api/chat'"));
});

test("Computer has source-level route, default provider and an original interface entry", () => {
  assert.match(readFileSync("server/routes.ts", "utf8"), /registerCynthiaResidentBridge\(app\)/);
  assert.match(readFileSync("client/src/lib/AIService.ts", "utf8"), /ai_backend"\) \|\| "cynthia"/);
  assert.match(readFileSync("client/src/App.tsx", "utf8"), /path="\/cynthia-resident"/);
});
