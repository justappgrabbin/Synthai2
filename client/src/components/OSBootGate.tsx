import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Terminal, Wifi, ShieldCheck, Server, Sparkles } from "lucide-react";
import { getMeshStatus } from "@/lib/meshEvents";
import { synthiaApi } from "@/lib/synthiaApi";

type BootLine = {
  label: string;
  status: "pending" | "ok" | "warn";
  detail: string;
};

const STORAGE_KEY = "you-n-ide-os.booted";

export function OSBootGate() {
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(STORAGE_KEY) === "true");
  const [booting, setBooting] = useState(true);
  const [lines, setLines] = useState<BootLine[]>([
    { label: "Studio shell", status: "pending", detail: "Preparing mobile OS frame" },
    { label: "Mesh", status: "pending", detail: "Checking event bus" },
    { label: "Synthia server", status: "pending", detail: "Waiting for backend route" },
    { label: "MCP", status: "pending", detail: "Waiting for tool bridge" },
  ]);

  useEffect(() => {
    if (dismissed) return;

    let cancelled = false;
    async function boot() {
      const next = [...lines];
      next[0] = { label: "Studio shell", status: "ok", detail: "YOU-N-I-VERSE frontend loaded" };
      setLines([...next]);

      const mesh = await getMeshStatus();
      if (cancelled) return;
      next[1] = mesh
        ? { label: "Mesh", status: "ok", detail: `${mesh.events ?? 0} events available` }
        : { label: "Mesh", status: "warn", detail: "Backend mesh route is not online yet" };
      setLines([...next]);

      try {
        const health = await synthiaApi.health();
        if (cancelled) return;
        next[2] = { label: "Synthia server", status: "ok", detail: String(health.status || "health route answered") };
      } catch {
        if (cancelled) return;
        next[2] = { label: "Synthia server", status: "warn", detail: "Backend thread still wiring this" };
      }
      setLines([...next]);

      try {
        const response = await fetch("/mcp/status", { cache: "no-store" });
        if (cancelled) return;
        next[3] = response.ok
          ? { label: "MCP", status: "ok", detail: "MCP status route answered" }
          : { label: "MCP", status: "warn", detail: "MCP route returned a non-ready status" };
      } catch {
        if (cancelled) return;
        next[3] = { label: "MCP", status: "warn", detail: "MCP bridge is pending backend wiring" };
      }
      setLines([...next]);
      setBooting(false);
    }

    boot();
    return () => {
      cancelled = true;
    };
    // Intentionally run once for the boot screen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dismissed]);

  const progress = useMemo(() => {
    const complete = lines.filter((line) => line.status !== "pending").length;
    return Math.round((complete / lines.length) * 100);
  }, [lines]);

  if (dismissed) return null;

  const enter = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setDismissed(true);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-lg border bg-card p-5 shadow-2xl">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">YOU-N-I-VERSE OS</h1>
            <p className="text-sm text-muted-foreground">Booting the studio shell</p>
          </div>
        </div>

        <Progress value={progress} className="mb-4 h-2" />

        <div className="space-y-2">
          {lines.map((line) => (
            <div key={line.label} className="flex items-start gap-3 rounded-lg border bg-background/60 p-3">
              <StatusIcon status={line.status} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">{line.label}</p>
                  <Badge variant={line.status === "ok" ? "default" : "outline"}>{line.status}</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{line.detail}</p>
              </div>
            </div>
          ))}
        </div>

        <Button className="mt-5 w-full gap-2" disabled={booting} onClick={enter}>
          <Terminal className="h-4 w-4" />
          {booting ? "Checking system..." : "Begin"}
        </Button>
      </div>
    </div>
  );
}

function StatusIcon({ status }: { status: BootLine["status"] }) {
  if (status === "ok") return <ShieldCheck className="mt-0.5 h-4 w-4 text-primary" />;
  if (status === "warn") return <Wifi className="mt-0.5 h-4 w-4 text-muted-foreground" />;
  return <Server className="mt-0.5 h-4 w-4 animate-pulse text-muted-foreground" />;
}
