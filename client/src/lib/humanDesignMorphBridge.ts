/**
 * Preserve the calculated Human Design chart in the existing Studio, and
 * project only fields that the existing Morph orchestrator actually accepts.
 *
 * This is NOT a replacement for the full chart, a new ontology, or a guessed
 * equivalence between the two different address systems.
 */
import type { HumanDesign } from "../engine/ResonanceOrchestrator";
import type { CenterKey, HumanDesignChart } from "./humanDesignEngine";

// Exact 0–8 center order used by ResonanceOrchestrator.centerNames.
const MORPH_CENTER_ORDER: readonly CenterKey[] = [
  "head", "ajna", "throat", "g", "heart", "sacral", "solar", "spleen", "root",
];

const KNOWN_TYPES = [
  "Generator", "Manifesting Generator", "Manifestor", "Projector", "Reflector",
] as const;

function centerIndices(centers: CenterKey[]): number[] {
  return centers.map(center => {
    const index = MORPH_CENTER_ORDER.indexOf(center);
    if (index < 0) throw new Error(`Unrecognized Human Design center: ${center}`);
    return index;
  });
}

export function chartToMorphDesign(chart: HumanDesignChart): HumanDesign {
  const type = chart.summary.type;
  if (!KNOWN_TYPES.some(known => known === type)) {
    throw new Error(`Morph does not recognize chart type: ${type}`);
  }
  const profile = /^([1-6])\/([1-6])$/.exec(chart.summary.profile);
  if (!profile) throw new Error("Chart profile must be two lines, for example 3/5");
  if (chart.summary.crossGates.length !== 4) {
    throw new Error("Expected four documented incarnation-cross gates");
  }
  return {
    type: type as HumanDesign["type"],
    strategy: chart.summary.strategy,
    authority: chart.summary.authority,
    profile: [Number(profile[1]), Number(profile[2])],
    definedCenters: centerIndices(chart.centers.defined),
    undefinedCenters: centerIndices(chart.centers.undefined),
    gates: [...chart.gates],
    channels: chart.channels.map(({ gates }) => [...gates] as [number, number]),
    // The existing chart contains cross GATES, not a verified traditional cross NAME.
    incarnationCross: `Cross gates: ${chart.summary.crossGates.join("/")}`,
    variables: {
      digestion: chart.variables.determination.name,
      environment: chart.variables.environment.name,
      awareness: chart.variables.perspective.name,
      motivation: chart.variables.motivation.name,
    },
  };
}
