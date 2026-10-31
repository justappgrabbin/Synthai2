import { AppRegistry, type AppModuleData } from "@/lib/appRegistry";

/** Registers the original bundled Simlish world in the existing computer. */
export const SIMLISH_WORLD_APP: AppModuleData = {
  id: "simlish-world",
  name: "Simlish · YOU-N-I-VERSE",
  description: "Original Simlish live Swarm/ATO world and local character studio",
  path: "/simlish-world",
  iconName: "Gamepad2",
  type: "game",
  variant: "primary",
  version: "1.0.0",
  author: "justappgrabbin/Simlish",
  manifest: {
    id: "simlish/world",
    name: "Simlish World",
    version: "1.0.0",
    type: "game",
    entry: "/simlish-world",
    permissions: ["storage"],
    author: "justappgrabbin/Simlish",
    description: "Original pinned local Simlish world and portrait tools; no remote photo transfer",
  },
};
export function registerSimlishWorldApp(): boolean {
  if (typeof window === "undefined") return false;
  const current = AppRegistry.getInstalledApps().find(app=>app.id === SIMLISH_WORLD_APP.id);
  return current?.version === SIMLISH_WORLD_APP.version || AppRegistry.installApp(SIMLISH_WORLD_APP);
}
registerSimlishWorldApp();
