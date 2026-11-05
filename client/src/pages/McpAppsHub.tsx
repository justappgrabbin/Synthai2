import { useEffect, useState } from "react";
import { Activity, Boxes, Network, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { systemApi } from "@/lib/systemApi";

type View = "system" | "mesh" | "apps";
type Event = { id: string; at: string; type: string; topic: string; source: string };
type AppRecord = { id: string; name: string; status?: string; createdAt?: string };

const views: Array<{ id: View; name: string; Icon: typeof Activity }> = [
  { id: "system", name: "System", Icon: Activity },
  { id: "mesh", name: "Mesh Events", Icon: Network },
  { id: "apps", name: "Mounted Apps", Icon: Boxes },
];

export default function McpAppsHub() {
  const [view, setView] = useState<View>("system");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [system, setSystem] = useState<Record<string, unknown>>({});
  const [events, setEvents] = useState<Event[]>([]);
  const [apps, setApps] = useState<AppRecord[]>([]);

  async function refresh(active: View) {
    setBusy(true);
    setError("");
    try {
      if (active === "system") {
        const [health, mcp] = await Promise.all([systemApi.health(), systemApi.mcpStatus()]);
        setSystem({
          studio: health.status,
          service: health.service,
          mesh: health.mesh,
          container: health.container,
          python: health.python,
          workspace: health.workspace,
          mcp: { name: mcp.name, transport: mcp.transport },
        });
      } else if (active === "mesh") {
        const response = await fetch("/api/mesh/events?limit=50");
        if (!response.ok) throw new Error("Mesh events could not be loaded");
        const json = await response.json();
        setEvents((json.events || []).map((item: Event) => ({
          id: item.id,
          at: item.at,
          source: item.source,
          type: item.type,
          topic: item.topic,
        })));
      } else {
        const result = await systemApi.apps();
        setApps((result.apps || []).map((item) => ({
          id: item.id,
          name: item.name,
          status: "mounted",
          createdAt: item.createdAt,
        })));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load the existing SynthAi2 service");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => { void refresh(view); }, [view]);

  return (
    <main className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto max-w-5xl space-y-5">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">MCP Apps</h1>
            <p className="text-sm text-muted-foreground">
              Native view of the same local services exposed as interactive MCP tools.
            </p>
          </div>
          <Button variant="outline" onClick={() => void refresh(view)} disabled={busy}>
            <RefreshCw className="mr-2 h-4 w-4" /> {busy ? "Refreshing…" : "Refresh"}
          </Button>
        </header>
        <nav className="flex flex-wrap gap-2" aria-label="MCP Apps">
          {views.map(({ id, name, Icon }) => (
            <Button key={id} variant={view === id ? "default" : "outline"}
              aria-pressed={view === id} onClick={() => setView(id)}>
              <Icon className="mr-2 h-4 w-4" />{name}
            </Button>
          ))}
        </nav>
        {error && <p role="alert" className="text-destructive">{error}</p>}
        {view === "system" && (
          <div className="grid gap-3 sm:grid-cols-2">
            {Object.entries(system).map(([title, info]) => (
              <Card key={title}>
                <CardHeader><CardTitle className="capitalize text-base">{title}</CardTitle></CardHeader>
                <CardContent><pre className="whitespace-pre-wrap break-words text-sm text-muted-foreground">
                  {typeof info === "object" ? JSON.stringify(info, null, 2) : String(info)}
                </pre></CardContent>
              </Card>
            ))}
          </div>
        )}
        {view === "mesh" && (
          <div className="space-y-2">
            {events.length === 0 && !busy && <p className="text-muted-foreground">No events recorded.</p>}
            {events.map((event) => (
              <Card key={event.id}><CardContent className="p-4">
                <p className="font-medium">{event.type}</p>
                <p className="text-sm text-muted-foreground">{event.topic} · {event.source} · {event.at}</p>
              </CardContent></Card>
            ))}
          </div>
        )}
        {view === "apps" && (
          <div className="grid gap-3 sm:grid-cols-2">
            {apps.length === 0 && !busy && <p className="text-muted-foreground">No locally mounted apps found.</p>}
            {apps.map((item) => (
              <Card key={item.id}><CardHeader><CardTitle className="text-base">{item.name}</CardTitle></CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  {item.status} · {item.createdAt || "Date unavailable"}
                </CardContent></Card>
            ))}
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          This page uses existing SynthAi2 HTTP services. MCP hosts use the authenticated /mcp endpoint
          and receive the matching interactive view. No shell commands or file writes are exposed.
        </p>
      </div>
    </main>
  );
}
