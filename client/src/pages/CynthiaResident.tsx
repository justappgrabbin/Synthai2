import { useCallback, useEffect, useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ResidentStatus = {
  name: string;
  running: boolean;
  authorized: boolean;
  source: string;
  sourceCommit: string;
  embeddedAndroid: boolean;
  ownerTokenRequired: boolean;
};

export default function CynthiaResident() {
  const [status, setStatus] = useState<ResidentStatus | null>(null);
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [working, setWorking] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/cynthia-resident/status", { credentials: "same-origin", cache: "no-store" });
      if (!response.ok) throw new Error("Cannot check resident status");
      setStatus(await response.json());
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection failed");
    }
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);

  async function signIn() {
    setWorking(true);
    try {
      const response = await fetch("/api/cynthia-resident/login", {
        method: "POST", credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      if (!response.ok) throw new Error(response.status === 401 ? "Wrong owner token" : "Owner login unavailable");
      setToken("");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed");
    } finally { setWorking(false); }
  }

  return (
    <main className="mx-auto max-w-6xl space-y-4 p-4 pb-24" data-testid="cynthia-original-resident">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Cynthia — original Klein model</h1>
          <p className="text-sm text-muted-foreground">
            The trained model and its original chat, tools, feedback and rollback. No replacement model.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => void refresh()}>Check connection</Button>
          <Link href="/computer"><Button variant="outline">Computer</Button></Link>
        </div>
      </div>
      <div className="rounded-lg border p-3 text-sm">
        <p>Runtime: {status?.running ? "Original Python model responding" : "Not running or not reachable"}</p>
        <p>Access: {status?.authorized ? "Owner session active" : "Sign-in required"}</p>
        <p>Source: <a href="https://github.com/justappgrabbin/klein-agent" className="underline" target="_blank" rel="noreferrer">justappgrabbin/klein-agent</a></p>
        <p className="text-muted-foreground">This screen connects to the original Python service. The Android APK does not contain PyTorch or the model runtime.</p>
      </div>
      {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
      {status && !status.authorized && status.ownerTokenRequired && (
        <div className="flex max-w-md gap-2">
          <Input type="password" autoComplete="off" aria-label="Computer owner token" placeholder="Computer owner token"
            value={token} onChange={(e) => setToken(e.target.value)} />
          <Button disabled={working || !token} onClick={() => void signIn()}>Sign in</Button>
        </div>
      )}
      {status?.authorized && status.running ? (
        <iframe title="Original Cynthia Klein chat and tools" src="/resident/cynthia/"
          className="h-[76vh] min-h-[540px] w-full rounded-lg border bg-background" />
      ) : (
        <div className="space-y-2 rounded-lg border p-4 text-sm">
          <p>To start the original model on the same Linux/macOS host as the Computer:</p>
          <pre className="overflow-x-auto whitespace-pre-wrap rounded bg-muted p-3 text-xs">{'git submodule update --init --recursive\ncd vendor/klein-agent\nbash setup.sh\nbash start.sh'}</pre>
          <p>Once it starts at 127.0.0.1:7860, return here and select Check connection. The first setup installs dependencies; the model weights are already in the pinned repository.</p>
          <p>No model training or changes to its source are required to try it.</p>
        </div>
      )}
    </main>
  );
}
