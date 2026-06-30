/**
 * useHumanDesign — resolves HD profile from Supabase if available,
 * falls back to localStorage-persisted profile, then to null.
 * Keeps BodyInterface functional with or without a Supabase connection.
 */
import { useState, useEffect } from 'react';
import { AionBridge } from '@/lib/aionBridge';

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

const STORAGE_KEY = 'synthia_hd_profile';

export function useHumanDesign() {
  const [profile, setProfile] = useState<HumanDesignProfile | null>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(false);

  // Try to pull from Supabase gate_neural_ops / persons table if Aion active
  useEffect(() => {
    if (!AionBridge.isActive) return;
    setLoading(true);
    // Query Integration Network gates as a proxy for defined centers
    Promise.all(AionBridge.INTEGRATION_NETWORK.map(g => AionBridge.queryGate(g)))
      .then(results => {
        const active = results.flat().filter(n => (n.resonance_score ?? 0) > 0.5);
        if (active.length > 0 && !profile) {
          // Seed a minimal profile from known active gates
          const p: HumanDesignProfile = {
            type: 'Generator',
            strategy: 'Wait to Respond',
            authority: 'Sacral',
            profile: '6/2',
            centers: { defined: ['Sacral', 'Spleen', 'Throat'], undefined: ['Head', 'Ajna'], open: [] },
            gates: AionBridge.INTEGRATION_NETWORK.map(String),
            channels: ['20-57', '34-20'],
            incarnation_cross: 'Right Angle Cross of the Vessel of Love',
            variables: {},
          };
          setProfile(p);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const saveProfile = (p: HumanDesignProfile) => {
    setProfile(p);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  };

  return { profile, loading, saveProfile };
}
