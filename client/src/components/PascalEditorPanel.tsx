import { useEffect, useState } from "react";
import { Box, ExternalLink, RefreshCw, Server, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

type PascalState = {
  status: "unconfigured" | "reachable" | "unreachable" | "unhealthy";
  launchUrl: string | null;
  mode: "self-hosted-sidecar";
  setupRequired: boolean;
};

export function PascalEditorPanel() {
  const [service, setService] = useState<PascalState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showEditor, setShowEditor] = useState(true);

  async function refresh() {
    setLoading(true);
    try {
      const response = await fetch("/api/pascal-editor/status", { cache: "no-store" });
      if (!response.ok) throw new Error("Pascal status service is unavailable");
      const next = await response.json() as PascalState;
      setService(next);
      setError("");
    } catch (problem) {
      setService(null);
      setError(problem instanceof Error ? problem.message : String(problem));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void refresh(); }, []);

  return (
    <section className="flex min-h-0 flex-1 flex-col bg-[#090d1a] text-fuchsia-50" data-testid="pascal-editor-panel">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-fuchsia-400/20 bg-[#161529] p-3">
        <div className="flex items-center gap-3">
          <div className="rounded-full border border-fuchsia-300/40 bg-fuchsia-500/10 p-2"><Box className="h-5 w-5 text-fuchsia-200" /></div>
          <div>
            <h3 className="font-semibold">Pascal Editor · 3D Building Studio</h3>
            <p className="text-xs text-slate-300">The actual Pascal project editor, served from your Linux environment</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-white/15 px-3 py-1 text-xs" role="status">
            {loading ? "Checking server…" : service?.status ?? "Unavailable"}
          </span>
          <Button variant="outline" size="sm" onClick={() => void refresh()} disabled={loading}>
            <RefreshCw className="mr-1 h-4 w-4" /> Refresh
          </Button>
          {service?.launchUrl && (
            <a href={service.launchUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex h-9 items-center rounded-md border border-fuchsia-300/40 px-3 text-sm hover:bg-fuchsia-800/30">
              <ExternalLink className="mr-1 h-4 w-4" /> Open full Pascal
            </a>
          )}
        </div>
      </header>

      {error && <p className="m-4 rounded-lg border border-rose-400/40 p-3 text-sm text-rose-200">{error}</p>}

      {service?.status === "reachable" && service.launchUrl ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-3 py-2 text-xs text-slate-300">
            <span>Independent projects and persistent scene storage remain in Pascal.</span>
            <Button variant="ghost" size="sm" onClick={() => setShowEditor(value => !value)}>
              {showEditor ? "Hide embedded editor" : "Show embedded editor"}
            </Button>
          </div>
          {showEditor ? (
            <iframe
              title="Pascal self-hosted 3D building editor"
              src={service.launchUrl}
              data-testid="pascal-editor-frame"
              className="h-full min-h-[440px] w-full flex-1 border-0 bg-[#111222]"
              sandbox="allow-scripts allow-same-origin allow-forms allow-downloads allow-pointer-lock allow-popups"
              allow="fullscreen; clipboard-read; clipboard-write; xr-spatial-tracking"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="flex flex-1 items-center justify-center p-6 text-center text-sm text-slate-300">
              Pascal remains available from the Open full Pascal button.
            </div>
          )}
          <p className="border-t border-white/10 px-3 py-2 text-xs text-slate-400">
            If the editor refuses to load inside the tab, open it directly above. Login or framing policies can block cross-origin editing.
          </p>
        </>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
          <div className="rounded-full border border-teal-300/30 p-5"><Server className="h-10 w-10 text-teal-200" /></div>
          <h4 className="text-xl font-semibold">Connect your self-hosted Pascal editor</h4>
          <p className="max-w-xl text-sm leading-relaxed text-slate-300">
            {service?.status === "unconfigured"
              ? "Pascal has not been configured on this Synthai2 host."
              : service?.status === "unreachable"
              ? "The configured Pascal server did not answer its health check."
              : service?.status === "unhealthy"
              ? "A server answered, but it did not identify itself as the Pascal editor."
              : "Checking your Linux-hosted Pascal service."}
          </p>
          <div className="w-full max-w-xl rounded-xl border border-white/15 bg-[#171829] p-4 text-left text-sm">
            <p className="mb-2 font-medium text-teal-200">Install Pascal in your existing Linux container (no Docker required)</p>
            <code className="block overflow-x-auto rounded-md bg-black/50 p-3 text-xs text-fuchsia-100">
              npx @pascal-app/cli editor --no-open
            </code>
            <p className="mt-3 text-xs leading-5 text-slate-300">
              Requires a supported Node.js release and an initial runtime download. Use the real
              address and port reported by Pascal; its CLI defaults to loopback, so your tablet
              will need a safely reachable private network endpoint.
            </p>
            <p className="mt-3 text-xs text-slate-300">
              Set <code>SYNTHAI_PASCAL_EDITOR_URL</code> for the internal service and
              <code> SYNTHAI_PASCAL_EDITOR_PUBLIC_URL</code> for the tablet-accessible editor URL.
              Protect shared access with Pascal authentication and HTTPS or a trusted private connection.
            </p>
          </div>
          <a className="inline-flex items-center gap-2 text-sm text-fuchsia-200 underline"
            href="https://github.com/pascalorg/editor/blob/main/SETUP.md" target="_blank" rel="noopener noreferrer">
            <ShieldCheck className="h-4 w-4" /> Pascal's official setup instructions
          </a>
        </div>
      )}
    </section>
  );
}
