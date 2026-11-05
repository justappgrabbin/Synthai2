import assert from "node:assert/strict";
import { test } from "node:test";
import type { Server } from "node:http";
import express from "express";
import { registerMcpApps } from "../server/lib/mcpApps";

const priorToken = process.env.SYNTHIA_MCP_TOKEN;
const priorOrigins = process.env.SYNTHIA_MCP_ALLOWED_ORIGINS;

test("MCP Apps endpoint fails closed and enforces authentication", async (t) => {
  const app = express();
  app.use(express.json());
  registerMcpApps(app);
  const server = await new Promise<Server>((resolve) => {
    const listener = app.listen(0, "127.0.0.1", () => resolve(listener));
  });
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const url = "http://127.0.0.1:" + address.port + "/mcp";
  const body = JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list", params: {} });
  const headers = { "Content-Type": "application/json", Accept: "application/json, text/event-stream" };

  try {
    await t.test("unset token denies access", async () => {
      delete process.env.SYNTHIA_MCP_TOKEN;
      const response = await fetch(url, { method: "POST", headers, body });
      assert.equal(response.status, 503);
    });

    await t.test("short token denies access", async () => {
      process.env.SYNTHIA_MCP_TOKEN = "short";
      const response = await fetch(url, { method: "POST", headers, body });
      assert.equal(response.status, 503);
    });

    await t.test("missing bearer denies access", async () => {
      process.env.SYNTHIA_MCP_TOKEN = "1234567890123456789012345678901234567890";
      const response = await fetch(url, { method: "POST", headers, body });
      assert.equal(response.status, 401);
    });

    await t.test("invalid bearer denies access", async () => {
      const response = await fetch(url, {
        method: "POST",
        headers: { ...headers, Authorization: "Bearer wrong-token" },
        body,
      });
      assert.equal(response.status, 401);
    });

    await t.test("disallowed browser origin denies access", async () => {
      process.env.SYNTHIA_MCP_ALLOWED_ORIGINS = "https://trusted.example";
      const response = await fetch(url, {
        method: "POST",
        headers: { ...headers, Authorization: "Bearer " + process.env.SYNTHIA_MCP_TOKEN, Origin: "https://untrusted.example" },
        body,
      });
      assert.equal(response.status, 403);
    });

    await t.test("approved browser preflight succeeds without bearer", async () => {
      process.env.SYNTHIA_MCP_ALLOWED_ORIGINS = "https://trusted.example";
      const response = await fetch(url, {
        method: "OPTIONS",
        headers: { Origin: "https://trusted.example", "Access-Control-Request-Method": "POST" },
      });
      assert.equal(response.status, 204);
      assert.equal(response.headers.get("access-control-allow-origin"), "https://trusted.example");
    });

    await t.test("preflight requires an allowed origin", async () => {
      const response = await fetch(url, {
        method: "OPTIONS",
        headers: { Origin: "https://untrusted.example", "Access-Control-Request-Method": "POST" },
      });
      assert.equal(response.status, 403);
    });
  } finally {
    if (priorToken === undefined) delete process.env.SYNTHIA_MCP_TOKEN;
    else process.env.SYNTHIA_MCP_TOKEN = priorToken;
    if (priorOrigins === undefined) delete process.env.SYNTHIA_MCP_ALLOWED_ORIGINS;
    else process.env.SYNTHIA_MCP_ALLOWED_ORIGINS = priorOrigins;
    await new Promise<void>((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
  }
});
