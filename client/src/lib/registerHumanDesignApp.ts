import { AppRegistry, type AppModuleData } from "@/lib/appRegistry";

export const HUMAN_DESIGN_APP: AppModuleData = {
  id: "human-design",
  name: "Human Design",
  description: "Deterministic BodyGraph, deep Variables/PHS, transits, relationship lab, and evidence chain",
  path: "/human-design",
  iconName: "Dna",
  variant: "primary",
  type: "core",
  version: "1.0.0",
  author: "Synthia",
  manifest: {
    id: "synthia/human-design",
    name: "Synthia Human Design",
    version: "1.0.0",
    type: "core",
    entry: "/human-design",
    permissions: ["storage"],
    author: "verified",
    signature: "synthia-core-human-design-v1",
    description: "Local deterministic Human Design calculation and exploration studio",
  },
};

export function registerHumanDesignApp() {
  if (typeof window === "undefined") return false;
  return AppRegistry.installApp(HUMAN_DESIGN_APP, true);
}

registerHumanDesignApp();
