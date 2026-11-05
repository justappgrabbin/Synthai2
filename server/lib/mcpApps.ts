import type { Express, Request, Response } from "express";
import { timingSafeEqual } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import {
  registerAppResource,
  registerAppTool,
  RESOURCE_MIME_TYPE,
} from "@modelcontextprotocol/ext-apps/server";
import { z } from "zod";

import { getMeshEvents, getMeshStatus } from "./meshEventStore";
import { getContainerStatus } from "./linuxContainerService";
import { getPythonServiceStatus } from "./pythonService";
import { getWorkspaceStatus } from "./workspaceService";
import { listMountedApps } from "./appMountService";

// These MCP Apps reuse the existing Synthia services. No app, file, or
// command execution is exposed through this bridge.
const RESOURCE_URI = "ui://synthai2/control-center.html";
const VIEW_HTML = path.resolve(process.cwd(), "dist/mcp-apps/console.html");
const VIEW_JS = path.resolve(process.cwd(), "dist/mcp-apps/console.js");
const SOURCE_HTML = path.resolve(process.cwd(), "client/src/mcp-apps/console.html");
const SOURCE_JS = path.resolve(process.cwd(), "client/src/mcp-apps/console.ts");
let cachedView: string | null = null;

async function viewHtml(): Promise<string> {
  if (cachedView && process.env.NODE_ENV === "production") return cachedView;
  let html: string;
  let script: string;

  try {
    [html, script] = await Promise.all([
      readFile(VIEW_HTML, "utf8"),
      readFile(VIEW_JS, "utf8"),
    ]);
  } catch {
    if (process.env.NODE_ENV === "production") {
      throw new Error("MCP App view missing. Run npm run build.");
    }
    html = await readFile(SOURCE_HTML, "utf8");
    const { build } = await import("esbuild");
    const output = await build({
      entryPoints: [SOURCE_JS],
      bundle: true,
      write: false,
      platform: "browser",
      format: "iife",
      target: "es2020",
    });
    script = output.outputFiles[0].text;
  }
  cachedView = html.replace(
    "<!-- MCP_APP_SCRIPT -->",
    "<script>" + script.replace(/<\/script/gi, "<\\/script") + "</script>",
  );
  return cachedView;
}

function systemOverview() {
  const mesh = getMeshStatus();
  const container = getContainerStatus();
  const python = getPythonServiceStatus();
  const workspace = getWorkspaceStatus();
  return {
    service: "SynthAi2 — YOU-N-I-VERSE",
    bridge: "MCP Streamable HTTP",
    mesh: { status: mesh.status, events: mesh.events, topics: mesh.topics },
    container: {
      enabled: container.enabled,
      platform: container.platform,
      node: container.node,
    },
    python: {
      configured: python.configured,
      managed: python.managed,
      running: python.running,
    },
    workspace: { exists: workspace.exists },
  };
}

function resultFor(kind: string, data: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data) }],
    structuredContent: { kind, data },
  };
}

function createSynthiaMcpServer() {
  const server = new McpServer({ name: "synthai2-mcp-apps", version: "1.0.0" });

  registerAppTool(
    server,
    "synthia_system_overview",
    {
      title: "SynthAi2 System Overview",
      description: "Display the existing SynthAi2 mesh, container, Python and workspace status.",
      inputSchema: z.object({}),
      _meta: { ui: { resourceUri: RESOURCE_URI } },
    },
    async () => resultFor("system", systemOverview()),
  );

  registerAppTool(
    server,
    "synthia_mesh_events",
    {
      title: "SynthAi2 Mesh Events",
      description: "Browse recent SynthAi2 mesh event metadata, without exposing event payloads.",
      inputSchema: z.object({ limit: z.number().int().min(1).max(100).default(30) }),
      _meta: { ui: { resourceUri: RESOURCE_URI } },
    },
    async ({ limit }) => {
      const events = getMeshEvents(limit).map(({ id, at, source, type, topic }) => ({
        id, at, source, type, topic,
      }));
      return resultFor("mesh", { events });
    },
  );

  registerAppTool(
    server,
    "synthia_mounted_apps",
    {
      title: "SynthAi2 Mounted Apps",
      description: "Inspect existing locally mounted app manifests without launching or modifying apps.",
      inputSchema: z.object({}),
      _meta: { ui: { resourceUri: RESOURCE_URI } },
    },
    async () => {
      const records = (await listMountedApps()).filter(Boolean) as Array<Record<string, unknown>>;
      const apps = records.map((entry) => ({
        id: String(entry.id || ""),
        name: String(entry.name || ""),
        status: String(entry.status || "unknown"),
        createdAt: String(entry.createdAt || ""),
      }));
      return resultFor("apps", { apps });
    },
  );

  registerAppResource(
    server,
    "SynthAi2 Control Center",
    RESOURCE_URI,
    { mimeType: RESOURCE_MIME_TYPE },
    async () => ({
      contents: [{
        uri: RESOURCE_URI,
        mimeType: RESOURCE_MIME_TYPE,
        text: await viewHtml(),
      }],
    }),
  );

  return server;
}

function authorize(req: Request, res: Response): boolean {
  const token = process.env.SYNTHIA_MCP_TOKEN;
  if (!token || token.length < 32) {
    res.status(503).json({ error: "Set SYNTHIA_MCP_TOKEN to a secret with at least 32 characters." });
    return false;
  }

  // If the caller sends an Origin, only permit explicitly configured origins.
  // Server-to-server requests normally omit Origin.
  const origin = req.header("origin");
  if (origin) {
    const allowed = (process.env.SYNTHIA_MCP_ALLOWED_ORIGINS || "")
      .split(",").map((value) => value.trim()).filter(Boolean);
    if (!allowed.includes(origin)) {
      res.status(403).json({ error: "Origin not allowed" });
      return false;
    }
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }

  // CORS preflight carries no bearer token, but origin and configured secret
  // must already pass validation before the server grants it.
  if (req.method === "OPTIONS") return true;

  const header = req.header("authorization") || "";
  const supplied = header.startsWith("Bearer ") ? header.slice(7) : "";
  const a = Buffer.from(token);
  const b = Buffer.from(supplied);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    res.setHeader("WWW-Authenticate", 'Bearer realm="SynthAi2 MCP"');
    res.status(401).json({ error: "Unauthorized" });
    return false;
  }
  return true;
}

/**
 * Mount standards-compliant MCP Apps on the same Express server as SynthAi2.
 * Legacy /mcp/status and /mcp/call routes remain unchanged.
 */
export function registerMcpApps(app: Express): void {
  app.all("/mcp", async (req: Request, res: Response) => {
    if (!authorize(req, res)) return;
    if (req.method === "OPTIONS") {
      res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type, Accept, MCP-Protocol-Version");
      res.setHeader("Access-Control-Allow-Methods", "POST, GET, DELETE, OPTIONS");
      res.status(204).end();
      return;
    }
    const mcp = createSynthiaMcpServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });

    res.on("close", () => {
      void transport.close().catch(() => undefined);
      void mcp.close().catch(() => undefined);
    });

    try {
      await mcp.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      console.error("[mcp-apps] request failed:", error instanceof Error ? error.message : error);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: "2.0",
          error: { code: -32603, message: "Internal server error" },
          id: null,
        });
      }
    }
  });
}
