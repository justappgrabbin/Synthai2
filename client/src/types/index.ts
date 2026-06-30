/**
 * Shared types for the SYNTHIA OS field platform.
 */
export type { Center, Color } from '@/data/humanDesign';

export interface MeshNode {
  id: string;
  type: string;
  subtype?: string;
  name?: string;
  properties: Record<string, any>;
}

export interface MeshEdge {
  id: string;
  source_id: string;
  target_id: string;
  type: string;
  weight: number;
  properties: Record<string, any>;
}

export interface HumanDesignProfile {
  type: string;
  strategy: string;
  authority: string;
  profile: string;
  centers: { defined: string[]; undefined: string[]; open: string[] };
  gates: string[];
  channels: string[];
  incarnation_cross: string;
  variables: Record<string, string[]>;
}

export interface FieldState {
  gate: number;
  line: number;
  color: number;
  tone: number;
  base: number;
  resonance: number;
}
