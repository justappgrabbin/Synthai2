import test from "node:test";
import assert from "node:assert/strict";
import { validateBuildFiles } from "../server/lib/selfBuildService";

const complete = [
  { path: "index.html", content: '<!doctype html><html><body><button id="go">Go</button><link rel="stylesheet" href="style.css"><script src="app.js"></script></body></html>' },
  { path: "style.css", content: "body { color: #fff; }" },
  { path: "app.js", content: 'document.getElementById("go").onclick = () => alert("It works");' },
];

test("valid generated app has real files and syntax receipt", () => {
  const result = validateBuildFiles(complete);
  assert.deepEqual(result.issues, []);
  assert.ok(result.tests.includes("Node syntax: app.js"));
  assert.ok(result.tests.some((s) => s.includes("static checks passed")));
});

test("rejects missing frontend dependencies", () => {
  const result = validateBuildFiles(complete.filter((f) => f.path !== "app.js"));
  assert.ok(result.issues.some((i) => i.includes("Missing local resource")));
});

test("rejects malformed javascript", () => {
  const result = validateBuildFiles(complete.map((f) =>
    f.path === "app.js" ? { ...f, content: "const = ;" } : f));
  assert.ok(result.issues.some((i) => i.includes("app.js")));
});

test("checks inline scripts too", () => {
  const result = validateBuildFiles([
    { path: "index.html", content: "<html><body><script>if(</script></body></html>" },
  ]);
  assert.ok(result.issues.some((i) => i.includes("inline script")));
});

test("refuses traversal and external CDN dependencies", () => {
  assert.ok(validateBuildFiles([{ path: "../index.html", content: "<html><body></body></html>" }]).issues.length);
  assert.ok(validateBuildFiles([{ path: "index.html",
    content: '<html><body><script src="https://cdn.example/test.js"></script></body></html>',
  }]).issues.some((i) => i.includes("Remote script")));
});

test("checks JSON and duplicate paths", () => {
  assert.ok(validateBuildFiles([
    { path: "index.html", content: "<html><body></body></html>" },
    { path: "config.json", content: "{bad json}" },
  ]).issues.some((i) => i.includes("config.json")));
  assert.ok(validateBuildFiles([
    { path: "index.html", content: "<html><body></body></html>" },
    { path: "index.html", content: "<html><body></body></html>" },
  ]).issues.some((i) => i.includes("Duplicate")));
});
