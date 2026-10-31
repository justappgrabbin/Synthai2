import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

type AgentStatus = {
  available: boolean;
  running: boolean;
  busy: boolean;
  lastError: string | null;
  progress: {
    step?: number;
    phase?: string;
    blocked?: string | null;
    events?: Array<{ stage: string; ok: boolean; output: string }>;
  };
};

export function AdaptiveBuildPanel() {
  const [status, setStatus] = useState<AgentStatus | null>(null);
  const [watch, setWatch] = useState(() => localStorage.getItem("adaptive_observe_in_app") === "true");
  const [message, setMessage] = useState("");
  useEffect(() => {
    let mounted = true;
    const refresh = () => {
      fetch("/api/adaptive-agent/status")
        .then(res => res.json())
        .then(value => { if (mounted) setStatus(value); })
        .catch(() => { if (mounted) setMessage("The local computer backend is offline."); });
    };
    refresh();
    const interval = setInterval(refresh, 4000);
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  async function command(which: "start" | "stop") {
    try {
      const response = await fetch("/api/adaptive-agent/" + which, { method: "POST" });
      const value = await response.json();
      setMessage(value.ok ? (which === "start" ? "Started: inspecting, checking, then building." : "Stopping after the current step.") : (value.error || "Unable to start"));
      const next = await fetch("/api/adaptive-agent/status");
      setStatus(await next.json());
    } catch {
      setMessage("Unable to reach the local computer backend.");
    }
  }

  function setObservation(enabled: boolean) {
    setWatch(enabled);
    localStorage.setItem("adaptive_observe_in_app", String(enabled));
    window.dispatchEvent(new Event("adaptive-observe-change"));
  }

  const steps = ["Inspect", "Validate", "Build"];
  const count = Math.max(0, Math.min(3, status?.progress.step ?? 0));
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Adaptive Builder · Hands</CardTitle>
        <CardDescription>
          Your preserved adaptive agent. It checks the current SynthAi2 project and builds a verified preview.
          A code-writing Hands connection is still needed for automatic repairs when a check fails.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => command("start")} disabled={!status?.available || Boolean(status?.running || status?.busy)}>
            {status?.running ? "Working…" : "Build autonomously"}
          </Button>
          <Button variant="outline" onClick={() => command("stop")} disabled={!status?.running && !status?.busy}>
            Stop
          </Button>
        </div>
        <div className="text-sm">Progress: {steps.map((label, index) => (index < count ? "✓ " : "○ ") + label).join(" · ")}</div>
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="adaptive-watch">Observe navigation inside SynthAi2</Label>
          <Switch id="adaptive-watch" checked={watch} onCheckedChange={setObservation} />
        </div>
        <p className="text-xs text-muted-foreground">
          This records only which SynthAi2 screens you visit, not what you type. Watching your entire phone
          requires a separate Android permission and is not enabled here.
        </p>
        <p className="text-sm" role="status">{message || status?.lastError || status?.progress.phase || "Checking backend…"}</p>
        {status?.progress.blocked && <pre className="text-xs whitespace-pre-wrap max-h-28 overflow-auto">{status.progress.blocked}</pre>}
        {status?.progress.events && status.progress.events.length > 0 && (
          <div className="text-xs space-y-1">
            {status.progress.events.slice(-3).map((event, index) => (
              <div key={index}>{event.ok ? "✓" : "✗"} {event.stage}</div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
