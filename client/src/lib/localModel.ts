// Local coding model client, ported from Alexis's Synthia Adaptive v0.5.4 (assets/web/proactive/model.mjs).
// Free and local only. Order: her native bridge (window.SynthiaAndroid: bundled llama.cpp server on 127.0.0.1:19841),
// then a llama.cpp server on 127.0.0.1:19841 / :8080 (OpenAI-style /v1/chat/completions), then Ollama on :11434.
// No paid API and no remote host is ever called from here.

export type LocalModelChoice = "qwen-1.5b" | "qwen-0.5b" | "tinyllama";

export const LOCAL_MODELS: Record<LocalModelChoice, { label: string; ollamaTag: string; gguf: string; bytes: number }> = {
  "qwen-1.5b": { label: "Qwen2.5-Coder 1.5B (default)", ollamaTag: "qwen2.5-coder:1.5b", gguf: "qwen2.5-coder-1.5b-instruct-q4_k_m.gguf", bytes: 1117320768 },
  "qwen-0.5b": { label: "Qwen2.5-Coder 0.5B (light)", ollamaTag: "qwen2.5-coder:0.5b", gguf: "qwen2.5-coder-0.5b-instruct-q4_k_m.gguf", bytes: 491400064 },
  "tinyllama": { label: "TinyLlama 1.1B (lighter fallback)", ollamaTag: "tinyllama", gguf: "tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf", bytes: 668788096 },
};

const CHOICE_KEY = "agent_local_model_choice";
const TINY_KEY = "agent_tinyllama_enabled";

export function getTinyLlamaEnabled() { return localStorage.getItem(TINY_KEY) === "1"; }
export function setTinyLlamaEnabled(on: boolean) { localStorage.setItem(TINY_KEY, on ? "1" : "0"); if (!on && getModelChoice() === "tinyllama") setModelChoice("qwen-1.5b"); }
export function getModelChoice(): LocalModelChoice {
  const c = localStorage.getItem(CHOICE_KEY) as LocalModelChoice | null;
  if (c === "tinyllama" && !getTinyLlamaEnabled()) return "qwen-1.5b";
  return c && c in LOCAL_MODELS ? c : "qwen-1.5b";
}
export function setModelChoice(c: LocalModelChoice) { localStorage.setItem(CHOICE_KEY, c); }

type Native = { startLocalModel?: () => string; getLocalModelStatus?: () => string };
type ChatMsg = { role: "system" | "user" | "assistant"; content: string };

// Same as her ensureEmbeddedModel(): start the bundled engine through the Android bridge and wait until ready.
async function ensureEmbeddedModel(native: Native, onProgress: (s: string) => void, timeoutMs = 240000) {
  const started = JSON.parse(native.startLocalModel!());
  if (!started.ok) throw new Error(started.error || "Bundled model could not start.");
  const end = Date.now() + timeoutMs;
  while (Date.now() < end) {
    const state = JSON.parse(native.getLocalModelStatus!());
    if (state.ready) return;
    if (state.ok === false) throw new Error(state.error || "Bundled model failed.");
    onProgress("Bundled model: " + state.phase);
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error("Bundled model startup timed out.");
}

async function post(url: string, body: unknown, ms: number) {
  const c = new AbortController(); const t = setTimeout(() => c.abort(), ms);
  try { return await fetch(url, { method: "POST", headers: { "Content-Type": "application/json", "X-Synthia-Local": "1" }, body: JSON.stringify(body), signal: c.signal }); }
  finally { clearTimeout(t); }
}


export interface LocalEngineProbe {
  choice: LocalModelChoice;
  model: string;
  nativeBridge: "missing" | "ready" | "starting" | "error";
  nativeMessage: string;
  llamaServer: string | null;
  ollamaServer: string | null;
  modelFound: boolean;
  available: boolean;
  reason: string;
}

/** Diagnostic only. A valid server response is not proof that the model can generate. */
export async function probeLocalModel(): Promise<LocalEngineProbe> {
  const choice = getModelChoice();
  const m = LOCAL_MODELS[choice];
  const result: LocalEngineProbe = {
    choice, model: m.label, nativeBridge: "missing", nativeMessage: "Android inference bridge not detected",
    llamaServer: null, ollamaServer: null, modelFound: false, available: false,
    reason: "No verified local model found. A model name in Settings does not install its weights.",
  };
  const native = (globalThis as any).SynthiaAndroid as Native | undefined;
  if (native?.getLocalModelStatus) {
    try {
      const status = JSON.parse(native.getLocalModelStatus());
      result.nativeBridge = status.ready ? "ready" : status.ok === false ? "error" : "starting";
      result.nativeMessage = status.error || status.phase || (status.ready ? "Native inference ready" : "Native inference not ready");
      if (status.ready && choice === "qwen-1.5b") {
        result.available = true; result.modelFound = true;
        result.reason = "Android bridge reports Qwen2.5 Coder ready. Run the chat test to verify generation.";
      }
    } catch (e) {
      result.nativeBridge = "error";
      result.nativeMessage = "Native bridge returned invalid status";
    }
  }
  const bases = [
    localStorage.getItem("llama_server_url"),
    "http://127.0.0.1:19841",
    "http://127.0.0.1:8080",
  ].filter(Boolean) as string[];
  const uniqueBases = [...new Set(bases)];
  for (const base of uniqueBases) {
    try {
      const r = await fetch(base.replace(/\/+$/, "") + "/v1/models", { signal: AbortSignal.timeout(3000) });
      if (!r.ok) continue;
      result.llamaServer = base;
      const data = await r.json();
      const ids = (Array.isArray(data?.data) ? data.data : [])
        .map((x: any) => String(x?.id || "").toLowerCase());
      const tag = m.ollamaTag.split(":")[0].toLowerCase();
      if (ids.some((x: string) => x === m.gguf.toLowerCase() || x.includes(tag))) {
        result.modelFound = true; result.available = true;
        result.reason = "llama.cpp reports a compatible model. Run the chat test to verify generation.";
        break;
      }
    } catch { /* absent servers are expected */ }
  }
  const ollama = localStorage.getItem("ollama_url") || "http://127.0.0.1:11434";
  try {
    const r = await fetch(ollama.replace(/\/+$/, "") + "/api/tags", { signal: AbortSignal.timeout(3000) });
    if (r.ok) {
      result.ollamaServer = ollama;
      const data = await r.json();
      const tags = (Array.isArray(data?.models) ? data.models : [])
        .map((x: any) => String(x?.name || x?.model || "").toLowerCase());
      if (tags.includes(m.ollamaTag.toLowerCase())) {
        result.modelFound = true; result.available = true;
        result.reason = "Ollama reports the selected model installed. Run chat test to verify generation.";
      }
    }
  } catch { /* Ollama is optional and external, not an embedded engine */ }
  if (!result.available) {
    result.reason = result.nativeBridge === "missing"
      ? "No Android model bridge detected and no selected model found on local inference servers."
      : result.nativeMessage + ". No selected model found running.";
  }
  return result;
}

export async function askLocalModel(messages: ChatMsg[], { onProgress = (_: string) => {}, maxTokens = 1024 } = {}): Promise<{ text: string; via: string }> {
  const choice = getModelChoice();
  const m = LOCAL_MODELS[choice];
  const native = (globalThis as any).SynthiaAndroid as Native | undefined;
  const errors: string[] = [];

  if (native?.startLocalModel && native?.getLocalModelStatus && choice === "qwen-1.5b") {
    try { await ensureEmbeddedModel(native, onProgress); } catch (e: any) { errors.push("bundled: " + e.message); }
  }
  const llamaBody = { model: m.ollamaTag, messages, stream: false, temperature: 0.1, max_tokens: maxTokens };
  const custom = localStorage.getItem("llama_server_url");
  for (const base of [custom, "http://127.0.0.1:19841", "http://127.0.0.1:8080"].filter(Boolean) as string[]) {
    try {
      const r = await post(`${base}/v1/chat/completions`, llamaBody, 180000);
      if (!r.ok) { errors.push(`${base}: HTTP ${r.status}`); continue; }
      const j = await r.json(); const text = j?.choices?.[0]?.message?.content;
      if (typeof text === "string" && text.trim()) return { text, via: `llama.cpp ${base}` };
    } catch (e: any) { errors.push(`${base}: ${e.name === "AbortError" ? "timeout" : "not running"}`); }
  }
  const ollama = localStorage.getItem("ollama_url") || "http://localhost:11434";
  try {
    const r = await post(`${ollama}/api/chat`, { model: m.ollamaTag, messages, stream: false, options: { temperature: 0.1, num_predict: maxTokens } }, 180000);
    if (r.ok) { const j = await r.json(); if (j?.message?.content) return { text: j.message.content, via: `Ollama ${m.ollamaTag}` }; }
    errors.push(`ollama: HTTP ${r.status}`);
  } catch { errors.push("ollama: not running"); }
  throw new Error(`No local engine answered for ${m.label}. Tried: ${errors.join("; ")}`);
}
