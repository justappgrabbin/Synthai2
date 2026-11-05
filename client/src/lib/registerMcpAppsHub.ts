import { AppRegistry, type AppModuleData } from "@/lib/appRegistry";

export const MCP_APPS_HUB: AppModuleData = {
  id: "mcp-apps",
  name: "MCP Apps",
  description: "Interactive system, mesh and mounted-app views with an MCP Apps bridge",
  path: "/mcp-apps",
  iconName: "Network",
  type: "core",
  version: "1.0.0",
  author: "Synthia",
  manifest: {
    id: "synthia/mcp-apps",
    name: "Synthia MCP Apps",
    version: "1.0.0",
    type: "core",
    entry: "/mcp-apps",
    permissions: [],
    author: "verified",
    description: "Read-only native control center for SynthAi2 MCP Apps",
  },
};

export function registerMcpAppsHub(): boolean {
  if (typeof window === "undefined") return false;
  const existing = AppRegistry.getInstalledApps().find((app) => app.id === MCP_APPS_HUB.id);
  if (existing?.version === MCP_APPS_HUB.version) return true;
  return AppRegistry.installApp(MCP_APPS_HUB);
}

registerMcpAppsHub();
