export type MeshEventInput = {
  source: string;
  type: string;
  topic?: string;
  payload?: Record<string, unknown>;
};

export type MeshStatus = {
  status: string;
  events: number;
  topics?: string[];
};

export type MeshEvent = {
  id?: string;
  timestamp?: string;
  source?: string;
  type?: string;
  topic?: string;
  payload?: Record<string, unknown>;
};

export async function publishMeshEvent(event: MeshEventInput) {
  try {
    await fetch("/api/mesh/events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(event),
    });
  } catch {
    // The studio remains usable when the backend is not running.
  }
}

export async function getMeshEvents(limit = 100): Promise<MeshEvent[]> {
  try {
    const response = await fetch(`/api/mesh/events?limit=${limit}`, { cache: "no-store" });
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data.events) ? data.events : [];
  } catch {
    return [];
  }
}

export async function getMeshStatus(): Promise<MeshStatus | null> {
  try {
    const response = await fetch("/api/mesh/status", { cache: "no-store" });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}
