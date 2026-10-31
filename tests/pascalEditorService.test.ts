import assert from "node:assert/strict";
import test from "node:test";
import { getPascalServiceState } from "../server/lib/pascalEditorRoutes";

function healthyJson(app = "editor", status = "ok") {
  return async (_url: URL | RequestInfo, _init?: RequestInit) =>
    new Response(JSON.stringify({ app, status, version: "1.0.6" }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
}

test("Pascal editor is unconfigured until an actual self-hosted endpoint is provided", async () => {
  const state = await getPascalServiceState("", "", healthyJson() as typeof fetch);
  assert.equal(state.status, "unconfigured");
  assert.equal(state.launchUrl, null);
  assert.equal(state.setupRequired, true);
});

test("health validation rejects other services despite HTTP 200", async () => {
  const state = await getPascalServiceState("http://127.0.0.1:3302", "https://pascal.internal.example", healthyJson("not-pascal") as typeof fetch);
  assert.equal(state.status, "unhealthy");
  assert.equal(state.launchUrl, null);
});

test("a real Pascal health response enables the configured tablet-accessible editor", async () => {
  let checked = "";
  const check = async (url: URL | RequestInfo) => {
    checked = String(url);
    return new Response(JSON.stringify({ app: "editor", status: "ok" }), { status: 200 });
  };
  const state = await getPascalServiceState("http://127.0.0.1:3302", "https://pascal.private.example", check as typeof fetch);
  assert.equal(checked, "http://127.0.0.1:3302/api/health");
  assert.equal(state.status, "reachable");
  assert.equal(state.launchUrl, "https://pascal.private.example/");
});

test("server reachability does not fabricate a browser URL", async () => {
  const state = await getPascalServiceState("http://127.0.0.1:3302", "", healthyJson() as typeof fetch);
  assert.equal(state.status, "reachable");
  assert.equal(state.launchUrl, null);
  assert.equal(state.setupRequired, true);
});

test("reject credentials, dangerous protocols and unverified network responses", async () => {
  const urls = ["file:///tmp/editor", "javascript:alert(1)", "http://user:pass@localhost:3302", "http://localhost:3302/?url=https://other"];
  for (const url of urls) assert.equal((await getPascalServiceState(url, "", healthyJson() as typeof fetch)).status, "unconfigured", url);
  const unreachable = await getPascalServiceState("http://127.0.0.1:3302", "https://pascal.private.example", (async () => { throw new Error("connection refused"); }) as typeof fetch);
  assert.equal(unreachable.status, "unreachable");
  assert.equal(unreachable.launchUrl, null);
});
