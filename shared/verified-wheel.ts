// shared/verified-wheel.ts  (added 2026-10-19, branch fill/synthai2-20261019)
//
// Verified gate wheel + Fagan-Bradley ayanamsa, added NEXT TO the existing
// functions. Nothing is rewired; shared/transit-system.ts and
// server/services/chart-calculators.ts are unchanged.
//
// FLAGS (her decision whether to switch):
// - shared/transit-system.ts longitudeToGate(): "Gates start at 0° (Gate 1),
//   proceed sequentially" -> gate = index+1. EphemerisService.ts uses it.
// - server/services/chart-calculators.ts longitudeToGate(): Math.floor(lon/5.625)+1.
// - shared/transit-system.ts PROJECTION_OFFSETS.Sidereal = -23.4 ("approximate,
//   adjust per year"); Fagan-Bradley is 24.7403 at J2000, 25.1035 on 1 Jan 2026.
// Her client/src/lib/humanDesignEngine.ts already uses the verified wheel
// (GATE_OFFSET = 358.25 with gate 25 first), so client and server disagree today.
//
// SOURCES: research/hd-math-verification.md s.1 (gate 41 at 302.0 tropical,
// 5.625 per gate; human-design-py 358.25 for gate 25) and s.5 (Swiss
// Ephemeris Fagan-Bradley values). Order identical to her humanDesignEngine.ts GATE_ORDER.

export const WHEEL_FROM_41 = [
  41,19,13,49,30,55,37,63,22,36,25,17,21,51,42,3,27,24,2,23,8,20,16,35,45,12,15,52,39,53,62,56,
  31,33,7,4,29,59,40,64,47,6,46,18,48,57,32,50,28,44,1,43,14,34,9,5,26,11,10,58,38,54,61,60,
] as const;
export const GATE_41_START = 302.0;
const GATE = 360 / 64, LINE = GATE / 6, COLOR = LINE / 6, TONE = COLOR / 6, BASE = TONE / 5;
const EPS = 1e-12;

export interface VerifiedActivation { gate: number; line: number; color: number; tone: number; base: number; address: string }

export function longitudeToGateVerified(longitude: number): VerifiedActivation {
  const x = ((((longitude % 360) + 360) % 360 - GATE_41_START) % 360 + 360) % 360;
  const k = Math.min(63, Math.floor(x / GATE + EPS));
  let r = x - k * GATE;
  const line = Math.min(6, Math.floor(r / LINE + EPS) + 1); r -= (line - 1) * LINE;
  const color = Math.min(6, Math.floor(r / COLOR + EPS) + 1); r -= (color - 1) * COLOR;
  const tone = Math.min(6, Math.floor(r / TONE + EPS) + 1); r -= (tone - 1) * TONE;
  const base = Math.min(5, Math.floor(r / BASE + EPS) + 1);
  const gate = WHEEL_FROM_41[k];
  return { gate, line, color, tone, base, address: `${gate}.${line}.${color}.${tone}.${base}` };
}

// Swiss Ephemeris SE_SIDM_FAGAN_BRADLEY, mean (no nutation): hd-math-verification.md s.5
export const FB_FIXTURES: Array<[number, number]> = [
  [2433282.5, 24 + 2 / 60 + 30.96 / 3600], // 1 Jan 1950 0h UT
  [2451545.0, 24.7403],                    // J2000.0
  [2461041.5, 25.103512],                  // 1 Jan 2026 0h UT
];

/** filled in, no source: quadratic through the three Swiss Ephemeris values
 * (my interpolation; within 0.002" of Swiss Ephemeris 1950-2026 per the
 * synthia-server/tests check). Use Swiss Ephemeris for production. */
export function faganBradleyAyanamsa(jd: number): number {
  const [[x0, y0], [x1, y1], [x2, y2]] = FB_FIXTURES;
  return y0 * ((jd - x1) * (jd - x2)) / ((x0 - x1) * (x0 - x2))
       + y1 * ((jd - x0) * (jd - x2)) / ((x1 - x0) * (x1 - x2))
       + y2 * ((jd - x0) * (jd - x1)) / ((x2 - x0) * (x2 - x1));
}

export function toFaganBradley(tropical: number, jd: number): number {
  return (((tropical - faganBradleyAyanamsa(jd)) % 360) + 360) % 360;
}
