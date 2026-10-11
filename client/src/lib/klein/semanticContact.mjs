import { AutoLingMemory, DiseminerMemory } from './vendor/klein-tools.mjs';

export const KLEIN_SOURCE = 'ATO-Core-Klein-Browser-v0.4.0-gate-content-3.zip';

/** Execute supplied Klein algorithms on current-conversation evidence only. */
export function analyzeKleinContact(text, priorUserTexts = []) {
  if (typeof text !== 'string') throw new TypeError('Klein contact requires text');
  const memory = new DiseminerMemory({ windowSize: 2 });
  for (const [index, value] of priorUserTexts.slice(-30).entries()) {
    if (typeof value === 'string') memory.ingest(value.slice(0, 4000), { source: `conversation-user-${index}` });
  }
  const document = memory.ingest(text.slice(0, 4000), { source: 'current-user-message' });
  const grammar = new AutoLingMemory();
  // Explicit templates from the supplied ATO implementation. Matches are candidates.
  grammar.learn({ id: 'has-property.v1', relation: 'HAS_PROPERTY',
    pattern: ['$object', 'is', '$property'], template: '$object is $property', provenance: KLEIN_SOURCE });
  grammar.learn({ id: 'part-of.v1', relation: 'PART_OF',
    pattern: ['$part', 'belongs', 'to', '$whole'], template: '$part belongs to $whole', provenance: KLEIN_SOURCE });
  const recognized = grammar.recognize(text);
  const terms = [...new Set(document.tokens)].slice(0, 12);
  const neighbors = terms.map(term => ({ term,
    neighbors: memory.neighbors(term, { limit: 3 }).filter(item => item.similarity > 0) }));
  return {
    source: KLEIN_SOURCE,
    status: 'executed',
    autoling: { method: 'explicit-template-recognition', matches: recognized.matches,
      rules: grammar.export(), semanticStatus: recognized.ok ? 'candidate' : 'unresolved' },
    diseminer: { method: 'windowed-cooccurrence-cosine', neighbors,
      documentCount: memory.documents.length, semanticStatus: 'candidate' },
    limits: ['Template recognition does not establish truth or speaker intent.',
      'Distributional similarity is not a causal relationship or a verified meaning.',
      'No NSNF gate, personality, audio, or gesture is inferred.',
      'Context is bounded to 30 user messages of 4000 characters each.'],
  };
}
