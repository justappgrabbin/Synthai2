import { AppRegistry, type AppModuleData } from "@/lib/appRegistry";

export const RESONANCE_NETWORK_APP: AppModuleData = {
  id: "resonance-network",
  name: "Resonance Network",
  description: "Launch the intact social organism, resonance field, MCP membrane, and creator network",
  path: "/resonance-network",
  iconName: "Network",
  variant: "primary",
  type: "core",
  version: "1.0.0",
  author: "Synthia",
  manifest: {
    id: "synthia/resonance-network",
    name: "Resonance Network Social Organism",
    version: "1.0.0",
    type: "core",
    entry: "/resonance-network",
    permissions: ["storage"],
    author: "verified",
    description: "Preserved launcher and runtime supervisor for the canonical Resonance Network organism",
  },
};

export function registerResonanceNetworkApp() {
  if (typeof window === "undefined") return false;
  const existing = AppRegistry.getInstalledApps().find((app) => app.id === RESONANCE_NETWORK_APP.id);
  if (existing?.version === RESONANCE_NETWORK_APP.version) return true;
  return AppRegistry.installApp(RESONANCE_NETWORK_APP);
}

registerResonanceNetworkApp();
