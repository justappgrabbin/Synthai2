export type StudioHealth = {
  status: string;
  service: string;
  mesh?: { status?: string; events?: number; topics?: string[] };
  container?: { enabled?: boolean; shell?: string; cwd?: string; message?: string };
  python?: { running?: boolean; url?: string; managed?: boolean };
  workspace?: { root?: string; exists?: boolean };
  apps?: { mounted?: number };
};

export type McpStatus = {
  ok: boolean;
  name: string;
  transport: string;
  mesh?: StudioHealth["mesh"];
  container?: StudioHealth["container"];
  python?: StudioHealth["python"];
  workspace?: StudioHealth["workspace"];
};

export type MountedApp = {
  id: string;
  name: string;
  path: string;
  runCommand?: string;
  files?: string[];
  createdAt?: string;
};

export type GamePack = {
  id: string;
  filename: string;
  name: string;
  path: string;
  size: number;
  sizeMb: number;
  entries: number;
  nestedZips: number;
  roots: string[];
  status: "ready" | "empty" | "unreadable";
  warning?: string;
};

export type AppRunResult = {
  success: boolean;
  app?: MountedApp;
  run: {
    command: string;
    code: number | null;
    stdout: string;
    stderr: string;
  };
};

async function jsonRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${response.status} ${response.statusText}: ${text}`);
  }

  return response.json();
}

export const systemApi = {
  health: () => jsonRequest<StudioHealth>("/api/health"),
  mcpStatus: () => jsonRequest<McpStatus>("/mcp/status"),
  pythonHealth: () => jsonRequest<Record<string, unknown>>("/api/python/proxy/health"),
  apps: () => jsonRequest<{ success: boolean; apps: MountedApp[] }>("/api/apps"),
  gamePacks: () => jsonRequest<{ success: boolean; packs: GamePack[] }>("/api/game-packs"),
  mountGamePack: (id: string) =>
    jsonRequest<{ success: boolean; app: MountedApp }>(`/api/game-packs/${encodeURIComponent(id)}/mount`, {
      method: "POST",
      body: JSON.stringify({}),
    }),
  mountApp: (payload: { name: string; runCommand?: string; files: Array<{ path: string; content?: string; base64?: string }> }) =>
    jsonRequest<{ success: boolean; app: MountedApp }>("/api/apps/mount", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  runApp: (id: string, command?: string) =>
    jsonRequest<AppRunResult>(`/api/apps/${encodeURIComponent(id)}/run`, {
      method: "POST",
      body: JSON.stringify({ command }),
    }),
  containerExec: (command: string, cwd?: string) =>
    jsonRequest<{ success: boolean; stdout: string; stderr: string; code: number | null }>("/api/container/exec", {
      method: "POST",
      body: JSON.stringify({ command, cwd }),
    }),
};
