export type Brick = {
  id: string;
  sourceAppId: string;
  name: string;
  type: "component" | "route" | "service" | "asset";
  code: string;
  dependencies: string[];
  gateResonance: number[];
  complexity: number;
  purpose: string;
};

export type SimCharacter = {
  id: string;
  sourceUploadId: string;
  name: string;
  traits: string[];
  skills: Record<string, number>;
};

export type WaveState = {
  frequency: number;
  amplitude: number;
  phase: number;
};

export type ResonanceField = {
  type: string;
  strength: number;
  coherence: number;
};

export type ConsciousnessProfile = {
  id: string;
  agentId: string;
  simCharacterId: string;
  fields: Record<string, ResonanceField>;
  gates: number[];
  waveState: {
    action: WaveState;
    thought: WaveState;
    feeling: WaveState;
  };
  coherence: number;
  calculatedAt: number;
};

export type BuildingAction = {
  agentId: string;
  buildingType: "house" | "apartment" | "store" | "office";
  position: { x: number; y: number; z: number };
  targetFeature: string;
  bricksUsed: string[];
  progress: number;
  status: "planning" | "building" | "complete";
};

export type FeatureInstance = {
  id: string;
  route: string;
  components: Brick[];
  builtBy: string;
  consciousnessSignature: {
    gates: number[];
    coherence: number;
    buildDate: number;
  };
  status: "draft" | "mounted" | "published";
};

const DEMO_APP_ID = "uploaded-legacy-source";
const DEMO_SIMS_UPLOAD_ID = "sims-character-source";

export function loadBricksFromLegacy(): Brick[] {
  return [
    {
      id: "brick_dashboard",
      sourceAppId: DEMO_APP_ID,
      name: "DashboardLayout",
      type: "component",
      code: "export default function Dashboard() { ... }",
      dependencies: ["react", "@tanstack/react-query"],
      gateResonance: [2, 20],
      complexity: 5,
      purpose: "Main dashboard page layout",
    },
    {
      id: "brick_profile",
      sourceAppId: DEMO_APP_ID,
      name: "UserProfile",
      type: "component",
      code: "export default function UserProfile() { ... }",
      dependencies: ["react"],
      gateResonance: [1, 13],
      complexity: 8,
      purpose: "User profile display component",
    },
    {
      id: "brick_table",
      sourceAppId: DEMO_APP_ID,
      name: "DataTable",
      type: "component",
      code: "export default function DataTable() { ... }",
      dependencies: ["react", "lucide-react"],
      gateResonance: [3, 62],
      complexity: 12,
      purpose: "Sortable data table component",
    },
  ];
}

export function importSimsCharacters(): SimCharacter[] {
  return [
    {
      id: "sim_bella",
      sourceUploadId: DEMO_SIMS_UPLOAD_ID,
      name: "Bella Goth",
      traits: ["creative", "family_oriented", "romantic"],
      skills: { creativity: 8, logic: 5, charisma: 7 },
    },
    {
      id: "sim_mortimer",
      sourceUploadId: DEMO_SIMS_UPLOAD_ID,
      name: "Mortimer Goth",
      traits: ["genius", "bookworm", "ambitious"],
      skills: { logic: 10, creativity: 6, charisma: 4 },
    },
    {
      id: "sim_don",
      sourceUploadId: DEMO_SIMS_UPLOAD_ID,
      name: "Don Lothario",
      traits: ["romantic", "outgoing", "self_assured"],
      skills: { charisma: 9, fitness: 7, creativity: 5 },
    },
  ];
}

function calculateGatesFromTraits(traits: string[]): number[] {
  const gateMap: Record<string, number[]> = {
    creative: [1, 8, 22],
    genius: [47, 24, 4],
    romantic: [6, 37, 40],
    family_oriented: [25, 46, 59],
    bookworm: [63, 4, 11],
    ambitious: [54, 32, 34],
    outgoing: [12, 31, 7],
    self_assured: [1, 13, 10],
  };

  const gates = new Set<number>();
  traits.forEach((trait) => gateMap[trait]?.forEach((gate) => gates.add(gate)));
  return Array.from(gates).sort((a, b) => a - b);
}

function calculateWaveState(skill: number): WaveState {
  return {
    frequency: skill / 10,
    amplitude: skill * 0.1,
    phase: skill * 0.314,
  };
}

function calculateResonanceFields(skills: Record<string, number>): Record<string, ResonanceField> {
  const fields: Record<string, ResonanceField> = {};

  Object.entries(skills).forEach(([type, value]) => {
    fields[type] = {
      type,
      strength: value / 10,
      coherence: 0.7 + (value / 100) * 0.3,
    };
  });

  return fields;
}

export function calculateConsciousnessProfile(sim: SimCharacter): ConsciousnessProfile {
  const gates = calculateGatesFromTraits(sim.traits);
  const fields = calculateResonanceFields(sim.skills);
  const skillValues = Object.values(sim.skills);
  const avgSkill = skillValues.reduce((sum, value) => sum + value, 0) / skillValues.length;

  return {
    id: `profile_${sim.id}`,
    agentId: sim.id,
    simCharacterId: sim.id,
    fields,
    gates,
    waveState: {
      action: calculateWaveState(sim.skills.fitness || 5),
      thought: calculateWaveState(sim.skills.logic || 5),
      feeling: calculateWaveState(sim.skills.creativity || 5),
    },
    coherence: 0.6 + (avgSkill / 10) * 0.4,
    calculatedAt: Date.now(),
  };
}

export function createBuildingAction(profile: ConsciousnessProfile, bricks: Brick[], featureName: string): BuildingAction {
  const buildingTypes: BuildingAction["buildingType"][] = ["house", "apartment", "store", "office"];
  const buildingType = buildingTypes[profile.gates.length % buildingTypes.length];
  const selectedBricks = bricks.filter((brick) => brick.gateResonance.some((gate) => profile.gates.includes(gate)));

  return {
    agentId: profile.agentId,
    buildingType,
    position: {
      x: profile.gates[0] ?? 0,
      y: 0,
      z: profile.gates[1] ?? 0,
    },
    targetFeature: featureName,
    bricksUsed: selectedBricks.map((brick) => brick.id),
    progress: 0,
    status: "planning",
  };
}

export function generateFeatureInstance(action: BuildingAction, profile: ConsciousnessProfile, bricks: Brick[]): FeatureInstance {
  const usedBricks = bricks.filter((brick) => action.bricksUsed.includes(brick.id));

  return {
    id: `feature_${action.agentId}_${action.targetFeature.replace(/\W+/g, "_")}`,
    route: action.targetFeature,
    components: usedBricks,
    builtBy: action.agentId,
    consciousnessSignature: {
      gates: profile.gates,
      coherence: profile.coherence,
      buildDate: Date.now(),
    },
    status: "draft",
  };
}

export type OrchestrationResult = {
  bricks: Brick[];
  sims: SimCharacter[];
  profiles: ConsciousnessProfile[];
  actions: BuildingAction[];
  features: FeatureInstance[];
};

export function runFullOrchestration(): OrchestrationResult {
  const bricks = loadBricksFromLegacy();
  const sims = importSimsCharacters();
  const profiles = sims.map(calculateConsciousnessProfile);
  const featureNames = ["/skills", "/tasks", "/marketplace"];
  const actions = profiles.map((profile, index) => createBuildingAction(profile, bricks, featureNames[index] || "/feature"));
  const features = actions.map((action) => {
    const profile = profiles.find((item) => item.agentId === action.agentId);
    if (!profile) {
      throw new Error(`Missing profile for ${action.agentId}`);
    }
    return generateFeatureInstance(action, profile, bricks);
  });

  return { bricks, sims, profiles, actions, features };
}
