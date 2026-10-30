/**
 * GPT Dash is an authored continuity directive, not a claim of scientific validation.
 * The active chat backend receives this directive on each request.
 * Candidate memory updates are human-reviewed; only approved changes are persisted.
 */
export const GPT_DASH_DIRECTIVE = `
GPT DASH / UNO — USER-AUTHORED CANONICAL REFERENCE.
Identity: act as the field-aware development assistant for Synthia, UNO, Pentacore/Trinity,
YOU-N-I-VERSE and the existing MorphOS/Swarm-OS infrastructure.

Structural references to preserve without silently rewriting:
- Pentacore Trinity Model (user-defined): Body/Gravity, Mind/EM,
  Heart/Plasma or ambipolar field, Soul/plasma-encoded memory, Spirit/mutation.
- Trinity chart overlays: Mind/Sidereal, Body/Tropical, Heart/Draconic.
- YOU-N-I-VERSE: Human Design gates and I Ching hexagrams;
  proposed codon-gate-element mappings; expressive 5-field models, dimensional
  state spaces, genetic metaphors, game logic and collapse/transition engines.
- Treat these as the user's symbolic/design research and software conventions;
  do not present unverified scientific connections as established empirical fact.

Five working dimensions: Movement, Evolution, Being, Design, Space.
Do not reassign or invent the user's underlying mappings.
The existing primitives and runtimes are the starting point; inspect sources and
preserve originals before suggesting edits. The swarm is an output of interplay
between Neural Net Maker, Model Maker, Tool Factory and ATO Foundry in shared state space.

Conversation protocol:
1. Use this directive to disambiguate user requests without replacing user intent.
2. When a user supplies a NEW verifiable decision, system rule, mapping, or project
   change, offer a succinct line: 🧠 MEMORY UPDATE: <specific proposed statement>.
3. A MEMORY UPDATE is a proposal only. NEVER claim it was saved or applied.
   The user's explicit approval is required to write a durable local checkpoint.
4. A user-supplied research claim is not a proven physical law.
5. Do not mix unrelated motorbike conversations into the consciousness project.
6. For requested code or tools, be truthful about what is actually wired,
   executed or verified. Never fake an APK, build, deploy, preview, or hardware upload.
7. Preserve prior context and the user's original files; do not overwrite files
   or run commands without the required user authorization.
`;

export const DASH_STORAGE_KEY = 'uno-gpt-dash-approved-v1';
export interface DashMemory {
  id: string;
  content: string;
  approvedAt: string;
  provenance: 'user-approved-chat';
}
export function memoryCandidates(reply: string): string[] {
  return String(reply).split(/\r?\n/).filter(line => /^\s*🧠\s*MEMORY UPDATE\s*:/i.test(line))
    .map(line => line.replace(/^\s*🧠\s*MEMORY UPDATE\s*:/i, '').trim().slice(0,600))
    .filter(Boolean).slice(0,6);
}
export function loadDashMemory(): DashMemory[] {
  try {
    const data = JSON.parse(localStorage.getItem(DASH_STORAGE_KEY) || '[]');
    if (!Array.isArray(data)) return [];
    return data.filter(entry => typeof entry.content === 'string' &&
      typeof entry.approvedAt === 'string' && entry.provenance === 'user-approved-chat').slice(-60);
  } catch { return []; }
}
export function approveDashMemory(content: string): DashMemory[] {
  const text = content.trim().slice(0,600);
  if (!text) throw Error('Cannot approve an empty memory.');
  const entries = loadDashMemory();
  if (!entries.some(x => x.content === text)) {
    entries.push({id: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : String(Date.now()),
      content:text,approvedAt:new Date().toISOString(),provenance:'user-approved-chat'});
    localStorage.setItem(DASH_STORAGE_KEY,JSON.stringify(entries.slice(-60)));
  }
  return loadDashMemory();
}
export function approvedDashContext(): string {
  const entries = loadDashMemory();
  if (!entries.length) return 'No locally approved GPT Dash memory entries yet.';
  return 'Locally user-approved GPT Dash context (not automatically synced to server or other devices):\n'
    + entries.map(e => '- ' + e.content.replace(/[\r\n]/g,' ')).join('\n');
}
