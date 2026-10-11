/** Source-bounded Shona morphology, not a general Bantu grammar or semantic model. */
export const SHONA_SOURCE = 'https://arxiv.org/html/2511.16680v1';
export interface ShonaAnalysis {
  token: string;
  offset: number;
  status: 'source-example' | 'candidate' | 'unknown';
  lemma?: string;
  pos?: string;
  features: Record<string, string>;
  evidence: 'SOURCE CLAIM' | 'ENGINEERING HYPOTHESIS' | 'UNKNOWN';
  source: string;
  section: string;
  note?: string;
  candidates?: { nounClass: number; prefix: string }[];
}
type Entry = { lemma?: string; pos: string; features: Record<string, string>; section: string; note?: string };
// Entries retain the paper's analysis, including its stated lemma conventions.
// These are attributed examples, not independently validated linguistic labels.
const examples: Record<string, Entry> = {
  mwana: { lemma: 'ana', pos: 'NOUN', features: { NounClass: '1', Number: 'Singular' }, section: '3.1; 3.5', note: 'Lemma follows the paper’s explicit example.' },
  vana: { lemma: 'ana', pos: 'NOUN', features: { NounClass: '2', Number: 'Plural' }, section: '3.3.1' },
  chikoro: { pos: 'NOUN', features: { NounClass: '7' }, section: '3.3.1', note: 'The paper documents chi- and class 7; it does not establish a lemma for this entry.' },
  mapanga: { pos: 'NOUN', features: { NounClass: '6' }, section: '3.3.1', note: 'The paper documents ma- and class 6; no lemma is assigned.' },
  vakadzi: { lemma: 'kadzi', pos: 'NOUN', features: { NounClass: '2', Number: 'Plural' }, section: '4.2' },
  mbudzi: { lemma: 'mbudzi', pos: 'NOUN', features: { NounClass: '9' }, section: '4.5.1' },
  mumunda: { lemma: 'munda', pos: 'NOUN', features: { NounClass: '18', Locative: 'True' }, section: '3.5' },
  kumhanya: { lemma: 'mhanya', pos: 'VERB', features: { SC: 'ku', Tense: 'None' }, section: '3.5', note: 'SC=ku is retained as the paper’s notation, not a claim of personal subject agreement.' },
  ndichakupai: { lemma: 'kupa', pos: 'VERB', features: { SC: 'ndi', Tense: 'Future', Segmentation: 'ndi- + -cha- + kupa + -i' }, section: '1', note: 'The paper glosses this as “I will give you” (plural). This segmentation is attributed, not independently verified.' },
  famba: { lemma: 'famba', pos: 'VERB', features: {}, section: '3.3.5' },
  fambisa: { lemma: 'famba', pos: 'VERB', features: { Deriv: 'Causative' }, section: '3.3.5' },
  mangwana: { lemma: 'mangwana', pos: 'ADV', features: {}, section: '3.3.7' },
  nokukurumidza: { lemma: 'nokukurumidza', pos: 'ADV', features: {}, section: '3.3.7' },
  zvishoma: { lemma: 'zvishoma', pos: 'ADV', features: {}, section: '3.3.7' },
  kana: { lemma: 'kana', pos: 'CCONJ', features: {}, section: '3.3.8' },
  asi: { lemma: 'asi', pos: 'CCONJ', features: {}, section: '3.3.8' },
  uye: { lemma: 'uye', pos: 'CCONJ', features: {}, section: '3.3.8' },
  nekuti: { lemma: 'nekuti', pos: 'CCONJ', features: {}, section: '3.3.8' },
  uyo: { lemma: 'uyo', pos: 'DET', features: {}, section: '3.3.8' },
  ichi: { lemma: 'ichi', pos: 'DET', features: {}, section: '3.3.8' },
  izi: { lemma: 'izi', pos: 'DET', features: {}, section: '3.3.8' },
};

export function analyzeShona(text: string): { language: 'sn'; source: string; tokens: ShonaAnalysis[]; linguisticTone: 'UNKNOWN'; nsnfMapping: 'UNRESOLVED' } {
  if (text.length > 10000) throw new Error('Please analyze at most 10,000 characters at once.');
  const tokens: ShonaAnalysis[] = [];
  for (const match of text.matchAll(/[\p{L}\p{M}]+/gu)) {
    const token = match[0], word = token.normalize('NFC').toLowerCase(), entry = Object.prototype.hasOwnProperty.call(examples, word) ? examples[word] : undefined;
    if (entry) {
      tokens.push({ token, offset: match.index!, status: 'source-example', ...entry, features: { ...entry.features }, evidence: 'SOURCE CLAIM', source: SHONA_SOURCE });
      continue;
    }
    // Prefix matches alone cannot determine a noun's class or even whether it is a noun.
    // mu- is ambiguous; its canonical decision is intentionally left unresolved.
    const candidates = word.startsWith('mu') && word.length > 2 ? [{ nounClass: 1, prefix: 'mu-' }, { nounClass: 18, prefix: 'mu-' }]
      : word.startsWith('va') && word.length > 2 ? [{ nounClass: 2, prefix: 'va-' }]
      : word.startsWith('chi') && word.length > 3 ? [{ nounClass: 7, prefix: 'chi-' }]
      : word.startsWith('ma') && word.length > 2 ? [{ nounClass: 6, prefix: 'ma-' }] : [];
    tokens.push({ token, offset: match.index!, status: candidates.length ? 'candidate' : 'unknown', features: {},
      evidence: candidates.length ? 'ENGINEERING HYPOTHESIS' : 'UNKNOWN', source: SHONA_SOURCE, section: '3.3.1',
      candidates: candidates.length ? candidates : undefined,
      note: candidates.length ? 'Prefix-based candidates only; verify language, lexical category, and agreement from context. No class is assigned.' : 'Not covered by the current source-example lexicon. No meaning or intent is inferred.' });
  }
  return { language: 'sn', source: SHONA_SOURCE, tokens, linguisticTone: 'UNKNOWN', nsnfMapping: 'UNRESOLVED' };
}

export function parseShonaRequest(text: string): string | null {
  const match = text.trim().match(/^(?:\/shona\s+analyze\s+|analy[sz]e\s+(?:this\s+)?shona\s*:\s*)([\s\S]+)$/i);
  return match ? match[1] : null;
}
