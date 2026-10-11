export const KLEIN_SOURCE: string;
export interface KleinContactResult {
  source: string;
  status: 'executed';
  autoling: { method: string; matches: readonly { ruleId: string; relation: string;
    bindings: Readonly<Record<string, string>>; structure: readonly string[] }[];
    rules: readonly unknown[]; semanticStatus: 'candidate' | 'unresolved' };
  diseminer: { method: string; neighbors: { term: string; neighbors: readonly {
    term: string; similarity: number }[] }[]; documentCount: number; semanticStatus: 'candidate' };
  limits: string[];
}
export function analyzeKleinContact(text: string, priorUserTexts?: string[]): KleinContactResult;
