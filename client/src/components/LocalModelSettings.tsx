import { useCallback, useEffect, useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  askLocalModel,
  getModelChoice,
  getTinyLlamaEnabled,
  LOCAL_MODELS,
  probeLocalModel,
  setModelChoice,
  setTinyLlamaEnabled,
  type LocalEngineProbe,
  type LocalModelChoice,
} from "@/lib/localModel";

/**
 * The first screen in Settings must reflect observed runtime behavior.
 * A configured GGUF filename and an installed, responding model are different things.
 */
export function LocalModelSettings() {
  const [choice, setChoice] = useState<LocalModelChoice>(getModelChoice);
  const [tiny, setTiny] = useState(getTinyLlamaEnabled);
  const [selectedBackend, setSelectedBackend] = useState(() => localStorage.getItem("ai_backend") || "local");
  const [probe, setProbe] = useState<LocalEngineProbe | null>(null);
  const [checking, setChecking] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState("");
  const [reply, setReply] = useState("");
  const [progress, setProgress] = useState("");
  const [llamaUrl, setLlamaUrl] = useState(() => localStorage.getItem("llama_server_url") || "");
  const [ollamaUrl, setOllamaUrl] = useState(() => localStorage.getItem("ollama_url") || "");

  const check = useCallback(async () => {
    setChecking(true);
    setError("");
    try {
      setProbe(await probeLocalModel());
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setProbe(null);
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => { void check(); }, [check, choice]);

  const changeModel = (selected: LocalModelChoice) => {
    setModelChoice(selected);
    setChoice(selected);
    setProbe(null);
    setReply("");
  };
  const setAsDefault = () => {
    localStorage.setItem("ai_backend", "local");
    setSelectedBackend("local");
    window.dispatchEvent(new Event("synthia-ai-backend-changed"));
  };
  const sendTest = async () => {
    setTesting(true);
    setError("");
    setReply("");
    setProgress("Starting an actual inference request");
    try {
      const response = await askLocalModel(
        [{ role: "user", content: "Reply with the single word READY." }],
        { maxTokens: 24, onProgress: setProgress, timeoutMs: 25000, nativeStartupTimeoutMs: 60000 },
      );
      if (!response.text.trim()) throw new Error("Model returned an empty response");
      setReply(response.text + " (served by " + response.via + ")");
      setProgress("A real model response was received.");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setProgress("Chat test failed");
    } finally {
      setTesting(false);
      void check();
    }
  };
  const saveServerUrls = () => {
    if (llamaUrl.trim()) localStorage.setItem("llama_server_url", llamaUrl.trim());
    else localStorage.removeItem("llama_server_url");
    if (ollamaUrl.trim()) localStorage.setItem("ollama_url", ollamaUrl.trim());
    else localStorage.removeItem("ollama_url");
    setProbe(null);
    void check();
  };
  const nativeReady = probe?.nativeBridge === "ready" && choice === "qwen-1.5b";
  const model = LOCAL_MODELS[choice];

  return (
    <div className="space-y-5" data-testid="local-model-settings">
      <Card>
        <CardHeader>
          <CardTitle>Synthia on-device model</CardTitle>
          <CardDescription>
            Checks what is actually installed on this device. Choosing a model only changes a preference;
            it does not download model weights or install an Android inference engine.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="synthia-local-model">Selected local model</Label>
            <select id="synthia-local-model" data-testid="select-local-model" value={choice}
              onChange={(event) => changeModel(event.target.value as LocalModelChoice)}
              className="w-full rounded-md border bg-background p-2">
              {(Object.keys(LOCAL_MODELS) as LocalModelChoice[]).filter((id) => id !== "tinyllama" || tiny).map((id) =>
                <option value={id} key={id}>{LOCAL_MODELS[id].label}</option>
              )}
            </select>
            <p className="text-xs text-muted-foreground">
              Expected weights: {model.gguf} · approximate {(model.bytes / (1024 * 1024)).toFixed(0)} MiB.
              This filename is not evidence of an installed file.
            </p>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={tiny} onChange={(event) => {
              setTinyLlamaEnabled(event.target.checked);
              setTiny(event.target.checked);
              setChoice(getModelChoice());
            }} />
            Allow TinyLlama as a selectable fallback
          </label>

          <div className="rounded-md border p-3 space-y-2" aria-live="polite">
            <div><strong>Android embedded bridge:</strong> {probe ? probe.nativeBridge : "not checked"}</div>
            <div className="text-sm text-muted-foreground">{probe?.nativeMessage || "Run the device check."}</div>
            <div><strong>Selected model detected:</strong> {probe ? (probe.modelFound ? "yes (requires chat test)" : "no") : "not checked"}</div>
            <div><strong>Embedded model ready:</strong> {probe ? (nativeReady ? "reported ready (test reply still required)" : "not verified") : "not checked"}</div>
            <div><strong>External llama.cpp:</strong> {probe?.llamaServer || "not found"}</div>
            <div><strong>External Ollama:</strong> {probe?.ollamaServer || "not found"}</div>
            <p className="text-sm">{probe?.reason || "No runtime status yet."}</p>
            <Button size="sm" variant="outline" disabled={checking || testing} onClick={() => void check()}>
              {checking ? "Checking device…" : "Check model on this device"}
            </Button>
          </div>

          <div className="rounded-md border p-3 space-y-2">
            <strong>Chat test</strong>
            <p className="text-sm text-muted-foreground">
              Sends a real message through the same local chat code used by the Synthia Agent.
              Only a nonempty model response counts as success.
            </p>
            <Button disabled={testing || checking} onClick={() => void sendTest()} data-testid="button-test-local-chat">
              {testing ? "Waiting for real model response…" : "Send test message to model"}
            </Button>
            {progress && <p className="text-sm">{progress}</p>}
            {reply && <pre data-testid="model-chat-reply" className="whitespace-pre-wrap break-words rounded bg-muted p-3 text-sm">{reply}</pre>}
            {error && <p role="alert" className="text-sm text-destructive break-words">{error}</p>}
          </div>
          <div className="rounded-md border p-3 space-y-2">
            <strong>Default assistant routing</strong>
            <p className="text-sm">Current general chat backend: <b>{selectedBackend}</b>. The Synthia Agent fly-up uses the local model route directly.</p>
            <Button variant={selectedBackend === "local" ? "outline" : "default"}
              onClick={setAsDefault} disabled={selectedBackend === "local"}>
              {selectedBackend === "local" ? "Local model selected" : "Use local model for general chat"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Optional external local servers</CardTitle>
          <CardDescription>
            These are separate from the APK. Leaving both blank keeps the default local probes;
            a URL cannot turn a WebView into a bundled model runtime.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Label htmlFor="llama-server-url">Additional llama.cpp URL</Label>
          <Input id="llama-server-url" value={llamaUrl}
            onChange={(event) => setLlamaUrl(event.target.value)}
            placeholder="http://127.0.0.1:19841" />
          <Label htmlFor="ollama-server-url">Ollama URL (optional)</Label>
          <Input id="ollama-server-url" value={ollamaUrl}
            onChange={(event) => setOllamaUrl(event.target.value)}
            placeholder="http://127.0.0.1:11434" />
          <Button variant="outline" onClick={saveServerUrls}>Save endpoints and check again</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Computer self-builder</CardTitle>
          <CardDescription>
            The separate web-app builder currently calls a model from the Computer backend, not the Android native bridge.
            Its readiness is not proof of an on-device model or an installable APK.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/self-build"><Button variant="outline">Open builder and build history</Button></Link>
        </CardContent>
      </Card>
    </div>
  );
}
