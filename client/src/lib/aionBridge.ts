/**
 * AionBridge — interface layer between studio and aion-substrate runtime
 * Dormant until core workflow is stable; activates via Settings toggle.
 * Connects to Supabase project leisphnjslcuepflefri for mesh persistence.
 */

const SB_URL_KEY  = "synthia_supabase_url";
const SB_ANON_KEY = "synthia_supabase_anon";
const ACTIVE_KEY  = "synthia_aion_active";

export interface MorphAddress {
  gate: number;      // 1–64
  line: number;      // 1–6
  color: number;     // 1–6
  tone: number;      // 1–6
  base: number;      // 1–5
}

export interface MeshNodeStub {
  id: string;
  type: string;
  gate?: number;
  resonance_score?: number;
}

export class AionBridge {
  private static get url(): string { return localStorage.getItem(SB_URL_KEY) || ""; }
  private static get anon(): string { return localStorage.getItem(SB_ANON_KEY) || ""; }
  static get isActive(): boolean { return localStorage.getItem(ACTIVE_KEY) === "true"; }

  static activate() { localStorage.setItem(ACTIVE_KEY, "true"); window.dispatchEvent(new Event("synthia:aion-active")); }
  static deactivate() { localStorage.setItem(ACTIVE_KEY, "false"); }

  /** Address → 69120-space index (Gate × Line × Color × Tone × Base) */
  static addressToIndex(a: MorphAddress): number {
    // (gate-1)*6*6*6*5 + (line-1)*6*6*5 + (color-1)*6*5 + (tone-1)*5 + (base-1)
    return (a.gate - 1) * 1080 + (a.line - 1) * 180 + (a.color - 1) * 30 + (a.tone - 1) * 5 + (a.base - 1);
  }

  /** Query mesh nodes from Supabase (gate_neural_ops table) */
  static async queryGate(gate: number): Promise<MeshNodeStub[]> {
    if (!this.url || !this.anon) return [];
    try {
      const res = await fetch(
        `${this.url}/rest/v1/gate_neural_ops?gate_number=eq.${gate}&select=id,gate_number,operation_type,resonance_weight`,
        { headers: { apikey: this.anon, Authorization: `Bearer ${this.anon}` } }
      );
      if (!res.ok) return [];
      const rows = await res.json();
      return rows.map((r: any) => ({
        id: r.id,
        type: r.operation_type || "gate_op",
        gate: r.gate_number,
        resonance_score: r.resonance_weight,
      }));
    } catch { return []; }
  }

  /** Persist a field state to Supabase field_states table */
  static async persistFieldState(state: Record<string, unknown>): Promise<boolean> {
    if (!this.url || !this.anon || !this.isActive) return false;
    try {
      const res = await fetch(`${this.url}/rest/v1/field_states`, {
        method: "POST",
        headers: {
          apikey: this.anon,
          Authorization: `Bearer ${this.anon}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({ state_data: state, source: "synthia-studio", created_at: new Date().toISOString() }),
      });
      return res.ok;
    } catch { return false; }
  }

  /** Integration Network backbone — gates 10, 20, 34, 57 */
  static readonly INTEGRATION_NETWORK = [10, 20, 34, 57] as const;

  /** FUSE weights */
  static readonly FUSE = { Body: 0.30, Heart: 0.28, Spirit: 0.20, Mind: 0.12, Soul: 0.10 };
}
