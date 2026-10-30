import { useSyncExternalStore } from "react";

export type FlyUpId = "verse" | "agent" | null;
let current: FlyUpId = null;
const listeners = new Set<() => void>();

export function openFlyUp(id: Exclude<FlyUpId, null>) { current = id; listeners.forEach((l) => l()); }
export function closeFlyUp() { current = null; listeners.forEach((l) => l()); }
export function useFlyUp() {
  return useSyncExternalStore(
    (l) => { listeners.add(l); return () => { listeners.delete(l); }; },
    () => current,
    () => current,
  );
}
