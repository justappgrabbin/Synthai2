import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { inventory } from "../scripts/package-inventory.mjs";

test("inventory accounts for nested packaged files without changing their contents", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "synthai-package-test-"));
  try {
    fs.mkdirSync(path.join(root, "models"));
    fs.writeFileSync(path.join(root, "index.html"), "hello");
    fs.writeFileSync(path.join(root, "models", "model.gguf"), Buffer.alloc(11));
    const report = inventory(root);
    assert.equal(report.fileCount, 2);
    assert.equal(report.bytes, 16);
    assert.deepEqual(report.files[0], { path: "models/model.gguf", bytes: 11 });
    assert.equal(fs.readFileSync(path.join(root, "index.html"), "utf8"), "hello");
    assert.throws(() => inventory(path.join(root, "absent")), /missing/);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});
