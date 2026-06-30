/**
 * useMesh — pulls mesh nodes/edges from Supabase via AionBridge.
 * Falls back to empty arrays when Aion is not active.
 * BodyInterface uses nodes for orbital display.
 */
import { useState, useEffect, useCallback } from 'react';
import { AionBridge, type MeshNodeStub } from '@/lib/aionBridge';

export interface MeshNode {
  id: string;
  type: string;
  subtype?: string;
  name?: string;
  properties: Record<string, any>;
}

export function useMesh() {
  const [nodes, setNodes] = useState<MeshNode[]>([]);
  const [loading, setLoading] = useState(false);

  const loadMesh = useCallback(async () => {
    if (!AionBridge.isActive) return;
    setLoading(true);
    try {
      // Pull Integration Network gates as seed mesh
      const results = await Promise.all(
        AionBridge.INTEGRATION_NETWORK.map(g => AionBridge.queryGate(g))
      );
      const flat: MeshNode[] = results.flat().map((n: MeshNodeStub) => ({
        id: n.id,
        type: n.type,
        name: `Gate ${n.gate}`,
        properties: { gate: n.gate, resonance_score: n.resonance_score },
      }));
      setNodes(flat);
    } catch { /* degraded gracefully */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadMesh(); }, [loadMesh]);

  return { nodes, edges: [], loading, loadMesh };
}
