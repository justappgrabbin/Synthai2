import { useEffect, useRef, useState } from "react";
import { Network, Play, Square, Upload, RefreshCw, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const STORAGE_KEY = "synthia_resonance_network_app_id";

type RuntimeStatus = {
  kind: string;
  running: boolean;
  pid: number | null;
  startedAt: string | null;
  exitCode: number | null;
  logs: string[];
  services: {
    backend: { ok: boolean; status: number | null; url: string };
    opportunity: { ok: boolean; status: number | null; url: string };
    frontend: { ok: boolean; status: number | null; url: string };
  };
  app: { id: string; name: string; profile?: unknown; files?: string[] };
};

async function readJson(response: Response) {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body?.error || `${response.status} ${response.statusText}`);
  return body;
}

export default function ResonanceNetwork() {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [appId, setAppId] = useState(() => localStorage.getItem(STORAGE_KEY) || "");
  const [runtime, setRuntime] = useState<RuntimeStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const refresh = async (id = appId) => {
    if (!id) return;
    try {
      const data = await readJson(await fetch(`/api/resonance/runtime/${encodeURIComponent(id)}`));
      setRuntime(data.runtime);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  useEffect(() => {
    if (!appId) return;
    refresh(appId);
    const timer = window.setInterval(() => refresh(appId), 2500);
    return () => window.clearInterval(timer);
  }, [appId]);

  const install = async (file: File) => {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/resonance/install", {
        method: "POST",
        headers: {
          "Content-Type": file.type || "application/zip",
          "X-App-Name": "Resonance Network",
        },
        body: file,
      });
      const data = await readJson(response);
      const id = data.app.id as string;
      localStorage.setItem(STORAGE_KEY, id);
      setAppId(id);
      await refresh(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const start = async () => {
    if (!appId) return;
    setBusy(true);
    setError("");
    try {
      const data = await readJson(await fetch(`/api/resonance/runtime/${encodeURIComponent(appId)}/start`, { method: "POST" }));
      setRuntime(data.runtime);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const stop = async () => {
    if (!appId) return;
    setBusy(true);
    try {
      const data = await readJson(await fetch(`/api/resonance/runtime/${encodeURIComponent(appId)}/stop`, { method: "POST" }));
      setRuntime(data.runtime);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const frontendReady = Boolean(runtime?.services.frontend.ok);

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="mx-auto max-w-7xl space-y-5 p-4 md:p-8">
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Network className="h-6 w-6" />
                  <CardTitle>Resonance Network</CardTitle>
                </div>
                <CardDescription className="mt-2">
                  The social organism is mounted and executed as one intact application. Its <code>organism/</code> hierarchy is preserved.
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <input
                  ref={fileRef}
                  className="hidden"
                  type="file"
                  accept=".zip,application/zip,application/x-zip-compressed"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) install(file);
                  }}
                />
                <Button variant="outline" onClick={() => fileRef.current?.click()} disabled={busy}>
                  <Upload className="mr-2 h-4 w-4" />
                  {appId ? "Replace mounted copy" : "Install intact ZIP"}
                </Button>
                <Button variant="outline" onClick={() => refresh()} disabled={!appId || busy}>
                  <RefreshCw className="mr-2 h-4 w-4" />Refresh
                </Button>
                {!runtime?.running ? (
                  <Button onClick={start} disabled={!appId || busy}>
                    <Play className="mr-2 h-4 w-4" />Start organism
                  </Button>
                ) : (
                  <Button variant="destructive" onClick={stop} disabled={busy}>
                    <Square className="mr-2 h-4 w-4" />Stop
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {!appId && (
              <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                Choose <strong>Resonance-Network-Social-Organism-MCP-Wired.zip</strong>. Synthai2 will extract it without flattening or redistributing its contents.
              </div>
            )}
            {runtime && (
              <div className="grid gap-3 md:grid-cols-4">
                <Status label="Organism" value={runtime.running ? "running" : "stopped"} good={runtime.running} />
                <Status label="Backend" value={runtime.services.backend.ok ? "online :8811" : "offline"} good={runtime.services.backend.ok} />
                <Status label="MCP membrane" value={runtime.services.opportunity.ok ? "online :8812" : "offline"} good={runtime.services.opportunity.ok} />
                <Status label="Frontend" value={runtime.services.frontend.ok ? "online :8813" : "offline"} good={runtime.services.frontend.ok} />
              </div>
            )}
            {error && <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
          </CardContent>
        </Card>

        {frontendReady && runtime ? (
          <Card className="overflow-hidden">
            <CardHeader className="py-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base">Live Resonance organism</CardTitle>
                  <CardDescription>This is the organism's own frontend, not a recreated Synthai2 screen.</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => window.open(runtime.services.frontend.url, "_blank")}>
                  <ExternalLink className="mr-2 h-4 w-4" />Open separately
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <iframe title="Resonance Network" src={runtime.services.frontend.url} className="h-[78vh] min-h-[620px] w-full border-0 bg-black" />
            </CardContent>
          </Card>
        ) : runtime?.logs?.length ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Runtime log</CardTitle>
              <CardDescription>Startup output is shown here while the organism comes online.</CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="max-h-80 overflow-auto rounded-md bg-muted p-3 text-xs whitespace-pre-wrap">{runtime.logs.slice(-80).join("\n")}</pre>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}

function Status({ label, value, good }: { label: string; value: string; good: boolean }) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="mt-2 flex items-center gap-2">
        <span className={`h-2.5 w-2.5 rounded-full ${good ? "bg-emerald-500" : "bg-muted-foreground/40"}`} />
        <p className="font-medium">{value}</p>
      </div>
    </div>
  );
}
