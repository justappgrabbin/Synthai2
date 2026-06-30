const configuredApiUrl = import.meta.env.VITE_SYNTHIA_API_URL;
const configuredWsUrl = import.meta.env.VITE_SYNTHIA_WS_URL;

const isBrowser = typeof window !== "undefined";

function sameOriginWsUrl() {
  if (!isBrowser) return "";
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}/ws`;
}

export const SYNTHIA_API_URL = configuredApiUrl || "";
export const SYNTHIA_WS_URL =
  configuredWsUrl || (SYNTHIA_API_URL ? `${SYNTHIA_API_URL.replace(/^http/, "ws")}/ws` : sameOriginWsUrl());

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${SYNTHIA_API_URL}${path}`, {
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

export const synthiaApi = {
  health: () => request<Record<string, unknown>>("/health"),
  synthiaStatus: () => request<Record<string, unknown>>("/api/synthia/status"),
  morphStatus: () => request<Record<string, unknown>>("/api/morph/status"),
  apps: () => request<unknown[]>("/api/apps"),

  upload: async (files: File[]) => {
    const formData = new FormData();
    for (const file of files) {
      formData.append("files", file, file.webkitRelativePath || file.name);
    }

    const response = await fetch(`${SYNTHIA_API_URL}/api/upload`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`${response.status} ${response.statusText}: ${text}`);
    }

    return response.json();
  },

  uploadMorph: async (files: File[], options: { name?: string; runCommand?: string; forceWrapper?: boolean } = {}) => {
    const formData = new FormData();
    if (options.name) formData.append("name", options.name);
    if (options.runCommand) formData.append("run_command", options.runCommand);
    if (options.forceWrapper) formData.append("force_wrapper", "true");

    for (const file of files) {
      formData.append("files", file, file.webkitRelativePath || file.name);
    }

    const response = await fetch(`${SYNTHIA_API_URL}/api/morph/upload`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`${response.status} ${response.statusText}: ${text}`);
    }

    return response.json();
  },
};

export function connectSynthiaSocket(
  onMessage: (message: unknown) => void,
  onStatus?: (status: "connected" | "closed" | "error" | "not_configured") => void,
) {
  if (!SYNTHIA_WS_URL) {
    onStatus?.("not_configured");
    return { close: () => undefined };
  }

  const socket = new WebSocket(SYNTHIA_WS_URL);
  socket.onopen = () => onStatus?.("connected");
  socket.onerror = () => onStatus?.("error");
  socket.onclose = () => onStatus?.("closed");
  socket.onmessage = (event) => {
    try {
      onMessage(JSON.parse(event.data));
    } catch {
      onMessage(event.data);
    }
  };

  return socket;
}
