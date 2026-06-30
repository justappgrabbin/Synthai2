import { useSyncExternalStore } from "react";

let assistantOpen = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

export function getAssistantOpen() {
  return assistantOpen;
}

export function setAssistantOpen(open: boolean) {
  if (assistantOpen === open) return;
  assistantOpen = open;
  emit();
}

export function toggleAssistant() {
  setAssistantOpen(!assistantOpen);
}

export function useAssistantDock() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getAssistantOpen,
    getAssistantOpen,
  );
}
