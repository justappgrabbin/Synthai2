export type ActionName =
  | "finish"
  | "monetize"
  | "advertise"
  | "test"
  | "package"
  | "deploy"
  | "audit"
  | "status";

export type ActionRisk = "read" | "write-copy" | "publish" | "spend";

export interface SynthAction {
  name: ActionName;
  description: string;
  risk: ActionRisk;
  requiresApproval: boolean;
  steps: readonly string[];
}

export const ACTIONS: Record<ActionName, SynthAction> = {
  finish: {
    name: "finish",
    description: "Discover incomplete product work, assemble it on copies, build, test, repair, and emit runnable artifacts.",
    risk: "write-copy",
    requiresApproval: false,
    steps: ["discover", "inventory", "reduce", "plan", "assemble", "build", "test", "repair", "package", "report"],
  },
  monetize: {
    name: "monetize",
    description: "Inspect the actual product and produce a cost-aware monetization implementation plan.",
    risk: "write-copy",
    requiresApproval: false,
    steps: ["inspect-product", "identify-value", "model-costs", "design-offers", "map-payments", "emit-plan"],
  },
  advertise: {
    name: "advertise",
    description: "Prepare positioning, launch copy, campaign assets, channel variants, and measurement hooks.",
    risk: "write-copy",
    requiresApproval: false,
    steps: ["inspect-product", "inspect-offer", "position", "create-assets", "create-campaigns", "measurement-plan"],
  },
  test: { name: "test", description: "Run available checks and report failures.", risk: "read", requiresApproval: false, steps: ["check", "build", "report"] },
  package: { name: "package", description: "Create available distributable artifacts including mobile packages.", risk: "write-copy", requiresApproval: false, steps: ["build", "package", "verify"] },
  deploy: { name: "deploy", description: "Prepare deployment. Public release requires explicit approval.", risk: "publish", requiresApproval: true, steps: ["build", "verify", "stage", "approve", "publish"] },
  audit: { name: "audit", description: "Inspect completeness, security, provenance, cost, and release readiness.", risk: "read", requiresApproval: false, steps: ["inventory", "security", "provenance", "cost", "readiness"] },
  status: { name: "status", description: "Show action state and produced artifacts.", risk: "read", requiresApproval: false, steps: ["read-state", "report"] },
};

export const COMPOSITIONS = {
  launch: ["finish", "monetize", "advertise"] as const,
};

export const POLICY = Object.freeze({
  originals: "read-only",
  workMode: "copy-or-branch",
  deleteOrigins: false,
  overwriteOrigins: false,
  publicPublishRequiresApproval: true,
  externalSpendRequiresApproval: true,
});

export function resolveActions(input: string[]): ActionName[] {
  const expanded = input.flatMap((name) =>
    name === "launch" ? [...COMPOSITIONS.launch] : [name],
  );
  const invalid = expanded.filter((name) => !(name in ACTIONS));
  if (invalid.length) throw new Error(`Unknown SynthAI action: ${invalid.join(", ")}`);
  return expanded as ActionName[];
}
