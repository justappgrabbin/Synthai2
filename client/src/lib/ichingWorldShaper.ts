/**
 * I Ching world shaper. The hexagram is a six-line relation, not a Human
 * Design gate or a substitution for a calculated chart.
 * Lines are stored bottom first; 1 = yang, 0 = yin.
 * Stable situation seeds make the same encounter replay with the same skin.
 */
export type LineState = 0 | 1;

export interface TrigramShape {
  key: string;
  symbol: string;
  name: string;
  nature: string;
  setting: string;
  force: string;
  accent: string;
  shadow: string;
}

export const TRIGRAMS: Record<string, TrigramShape> = {
  "111": { key: "111", symbol: "☰", name: "Qian", nature: "Heaven", setting: "open sky", force: "initiative", accent: "#dfb97d", shadow: "#3b2e43" },
  "000": { key: "000", symbol: "☷", name: "Kun", nature: "Earth", setting: "quiet garden", force: "receptivity", accent: "#bbaf8e", shadow: "#34382f" },
  "100": { key: "100", symbol: "☳", name: "Zhen", nature: "Thunder", setting: "storm-lit crossing", force: "awakening", accent: "#9db7f5", shadow: "#252d52" },
  "011": { key: "011", symbol: "☴", name: "Xun", nature: "Wind", setting: "whispering forest", force: "gentle influence", accent: "#9cd4b6", shadow: "#21413b" },
  "010": { key: "010", symbol: "☵", name: "Kan", nature: "Water", setting: "river passage", force: "navigating difficulty", accent: "#82bce4", shadow: "#182b47" },
  "101": { key: "101", symbol: "☲", name: "Li", nature: "Fire", setting: "lantern-lit courtyard", force: "clarity", accent: "#e9a57c", shadow: "#59352f" },
  "001": { key: "001", symbol: "☶", name: "Gen", nature: "Mountain", setting: "stone sanctuary", force: "stillness", accent: "#c2a6d8", shadow: "#353044" },
  "110": { key: "110", symbol: "☱", name: "Dui", nature: "Lake", setting: "reflecting lakeside", force: "joyful exchange", accent: "#e5afc9", shadow: "#48324b" },
};

export interface IChingShape {
  seed: string;
  lines: LineState[];
  changingLine: number;
  changedLines: LineState[];
  lower: TrigramShape;
  upper: TrigramShape;
  relatingLower: TrigramShape;
  relatingUpper: TrigramShape;
  symbol: string;
  setting: string;
  situation: string;
  invitation: string;
  challenge: string;
  transition: string;
  accent: string;
  shadow: string;
}

function stableHash(text: string): number {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function nextNumber(state: number): number {
  let n = state || 0x9e3779b9;
  n ^= n << 13;
  n ^= n >>> 17;
  n ^= n << 5;
  return n >>> 0;
}

function trigram(lines: LineState[]): TrigramShape {
  const key = lines.join("");
  const value = TRIGRAMS[key];
  if (!value) throw new Error("Invalid I Ching trigram");
  return value;
}

export function shapeSituation(seed: string): IChingShape {
  if (!seed.trim()) throw new Error("Situation needs a stable seed");
  let state = stableHash(seed);
  const lines: LineState[] = [];
  for (let position = 0; position < 6; position++) {
    state = nextNumber(state);
    lines.push((state & 1) as LineState);
  }
  state = nextNumber(state);
  const changingLine = (state % 6) + 1;
  const changedLines = [...lines] as LineState[];
  changedLines[changingLine - 1] = changedLines[changingLine - 1] === 1 ? 0 : 1;
  const lower = trigram(lines.slice(0, 3));
  const upper = trigram(lines.slice(3, 6));
  const relatingLower = trigram(changedLines.slice(0, 3));
  const relatingUpper = trigram(changedLines.slice(3, 6));
  return {
    seed,
    lines,
    changingLine,
    changedLines,
    lower,
    upper,
    relatingLower,
    relatingUpper,
    symbol: upper.symbol + lower.symbol,
    setting: lower.setting,
    situation: "In the " + lower.setting + ", Cynthia notices that something ordinary needs to change. " +
      "The movement of " + upper.nature.toLowerCase() + " lends this encounter a feeling of " + upper.force + ".",
    invitation: "Cynthia invites you to restore a chair in the local world. Enter the mission and change the chair itself.",
    challenge: "In Simlish, choose Mission, select Chair and execute the transformation.",
    transition: "The changing " + ["first", "second", "third", "fourth", "fifth", "sixth"][changingLine - 1] +
      " line opens a path from " + lower.nature + " beneath " + upper.nature +
      " toward " + relatingLower.nature + " beneath " + relatingUpper.nature + ".",
    accent: upper.accent,
    shadow: lower.shadow,
  };
}
