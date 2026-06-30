/**
 * KleinAutoLing — TypeScript binding for the Klein AUTOLING Throat/Gate 20 organ.
 * Routes dimensional queries through the 69120-address lattice.
 * Calls the Python AUTOLING engine via Synthia server when available,
 * falls back to local dimensional addressing.
 */
import { SYNTHIA_API_URL } from '@/lib/synthiaApi';

export interface AutoLingQuery {
  who?: string;
  what?: string;
  where?: string;
  when?: string;
  why?: string;
}

export interface AutoLingResult {
  address: string;
  gate: number;
  line: number;
  response: string;
  dimension: string;
}

class KleinAutoLingEngine {
  async query(q: AutoLingQuery): Promise<AutoLingResult> {
    // Try Python server first
    if (SYNTHIA_API_URL) {
      try {
        const res = await fetch(`${SYNTHIA_API_URL}/consciousness/gate/20`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(q),
        });
        if (res.ok) return res.json();
      } catch { /* fall through */ }
    }
    // Local fallback — basic dimensional addressing
    const parts = Object.values(q).filter(Boolean);
    const gate = 20; // Throat / NOW channel
    const line = (parts.length % 6) + 1;
    return {
      address: `G${gate}.L${line}`,
      gate,
      line,
      response: parts.join(' → '),
      dimension: 'throat',
    };
  }

  process(text: string): AutoLingResult {
    const gate = 20;
    const line = (text.length % 6) + 1;
    return {
      address: `G${gate}.L${line}`,
      gate, line,
      response: text,
      dimension: 'throat',
    };
  }
}

export const kleinAutoLing = new KleinAutoLingEngine();
