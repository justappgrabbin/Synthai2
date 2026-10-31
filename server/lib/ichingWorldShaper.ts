/** 
 * Experimental I Ching six-line scenario shaper.
 * Lines are bottom-to-top: 0 = yin, 1 = yang.
 * This is a deterministic scenario grammar, NOT a claimed King Wen number,
 * a Human Design Gate, divination, natal interpretation or a physics engine.
 * Keep hexagrams and gates separate until a verified mapping is supplied.
 */
import { createHash } from "node:crypto";

export type YinYang = 0 | 1;
export type WorldShape = {
  version: "six-lines-v1";
  primaryLines: YinYang[];
  changingLines: number[];
  relatingLines: YinYang[];
  scene: {
    lighting: "soft" | "bright";
    terrain: "enclosed" | "open";
    rhythm: "slow" | "quick";
    encounters: "quiet" | "active";
    resources: "sparse" | "plentiful";
    transition: "anchored" | "fluid";
  };
};

export function shapeWorld(explorerId: string, worldId: string, visitNumber: number): WorldShape {
  if (!explorerId || !worldId || !Number.isSafeInteger(visitNumber) || visitNumber < 1) {
    throw new Error("A stable explorer ID, world ID and positive visit count are required.");
  }
  // The primary shape stays consistent for this explorer/world.
  const primaryHash = createHash("sha256").update(
    JSON.stringify(["synthia-iching-primary-v1", explorerId, worldId]),
  ).digest();
  // A different transformation can arise when that same world is revisited.
  const changeHash = createHash("sha256").update(
    JSON.stringify(["synthia-iching-change-v1", explorerId, worldId, visitNumber]),
  ).digest();
  const primaryLines = Array.from({ length: 6 }, (_, i) => (primaryHash[i] & 1) as YinYang);
  const first = (changeHash[0] % 6) + 1;
  const second = (changeHash[1] % 6) + 1;
  const changingLines = [first];
  if ((changeHash[2] & 1) === 1 && second !== first) changingLines.push(second);
  changingLines.sort((a, b) => a - b);
  const relatingLines = primaryLines.map((line, i) =>
    changingLines.includes(i + 1) ? ((1 - line) as YinYang) : line,
  );

  // Six scenario levers belong to this game grammar, not to historical
  // line meanings. Rendering engines may adopt or ignore each lever.
  return {
    version: "six-lines-v1",
    primaryLines,
    changingLines,
    relatingLines,
    scene: {
      lighting: relatingLines[0] ? "bright" : "soft",
      terrain: relatingLines[1] ? "open" : "enclosed",
      rhythm: relatingLines[2] ? "quick" : "slow",
      encounters: relatingLines[3] ? "active" : "quiet",
      resources: relatingLines[4] ? "plentiful" : "sparse",
      transition: relatingLines[5] ? "fluid" : "anchored",
    },
  };
}
