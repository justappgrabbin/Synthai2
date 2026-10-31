import type { Express } from "express";

/**
 * Pascal is an independent, self-hosted 3D building editor. Its Next.js runtime,
 * database and MCP service stay under the Pascal process. This module does not
 * pretend Synthai2 owns Pascal scene data, or require Docker/hosted providers.
 */
function configuredUrl(raw: string | undefined): URL | null {
  if (!raw?.trim()) return null;
  try {
    const parsed = new URL(raw.trim());
    if (!["http:", "https:"].includes(parsed.protocol) || parsed.username || parsed.password ||
        parsed.search || parsed.hash) return null;
    return parsed;
  } catch {
    return null;
  }
}

export type PascalServiceState = {
  status: "unconfigured" | "reachable" | "unreachable" | "unhealthy";
  launchUrl: string | null;
  mode: "self-hosted-sidecar";
  setupRequired: boolean;
};

export async function getPascalServiceState(
  internal = process.env.SYNTHAI_PASCAL_EDITOR_URL,
  publicUrl = process.env.SYNTHAI_PASCAL_EDITOR_PUBLIC_URL,
  check: typeof fetch = fetch,
): Promise<PascalServiceState> {
  const internalUrl = configuredUrl(internal);
  const visibleUrl = configuredUrl(publicUrl);
  if (!internalUrl) return { status: "unconfigured", launchUrl: null, mode: "self-hosted-sidecar", setupRequired: true };
  try {
    const health = await check(new URL("/api/health", internalUrl), {
      method: "GET",
      signal: AbortSignal.timeout(3000),
      redirect: "error",
    });
    if (!health.ok) return { status: "unhealthy", launchUrl: null, mode: "self-hosted-sidecar", setupRequired: true };
    const info = await health.json() as Record<string, unknown>;
    if (info.app !== "editor" || info.status !== "ok")
      return { status: "unhealthy", launchUrl: null, mode: "self-hosted-sidecar", setupRequired: true };
    return { status: "reachable", launchUrl: visibleUrl?.toString() ?? null,
      mode: "self-hosted-sidecar", setupRequired: !visibleUrl };
  } catch {
    return { status: "unreachable", launchUrl: null, mode: "self-hosted-sidecar", setupRequired: true };
  }
}

export function registerPascalEditorRoutes(app: Express) {
  // No user-supplied URLs or credentials are forwarded by this status-only endpoint.
  app.get("/api/pascal-editor/status", async (_req, res) => {
    res.setHeader("Cache-Control", "no-store");
    res.json(await getPascalServiceState());
  });
}
