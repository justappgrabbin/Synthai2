import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Link as RouteLink } from "wouter";

type BuildTarget = "grove" | "site";
interface BuildJob {
  id: string; name: string; goal: string; target: BuildTarget;
  phase: string; attempts: number; issues: string[]; tests: string[];
  artifact?: string; siteUrl?: string; mountedAppId?: string;
  model: string; training: string; createdAt: string;
}
async function request<T>(path: string, token: string, options?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...options,
    headers: { "Content-Type": "application/json", "x-synthia-build-token": token, ...(options?.headers || {}) },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Request failed");
  return data as T;
}
export default function SelfBuild() {
  const [goal, setGoal] = useState("");
  const [name, setName] = useState("");
  const [target, setTarget] = useState<BuildTarget>("grove");
  const [token, setToken] = useState(() => sessionStorage.getItem("synthia-build-token") || "");
  const [netlifyApiKey, setNetlifyApiKey] = useState("");
  const [siteName, setSiteName] = useState("");
  const [jobs, setJobs] = useState<BuildJob[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [capability, setCapability] = useState<{ model: string; training: string; verification: string } | null>(null);
  const [message, setMessage] = useState("");
  const [working, setWorking] = useState(false);

  useEffect(() => { sessionStorage.setItem("synthia-build-token", token); }, [token]);
  useEffect(() => {
    let gone = false;
    const refresh = async () => {
      try {
        const [status, list] = await Promise.all([
          request<{ model: string; training: string; verification: string }>("/api/self-build/status", token),
          request<{ jobs: BuildJob[] }>("/api/self-build/jobs", token),
        ]);
        if (!gone) { setCapability(status); setJobs(list.jobs); setMessage(""); }
      } catch (error) {
        if (!gone) { setCapability(null); setMessage(error instanceof Error ? error.message : String(error)); }
      }
    };
    void refresh();
    const timer = setInterval(() => { void refresh(); }, 3000);
    return () => { gone = true; clearInterval(timer); };
  }, [token]);
  const start = async () => {
    if (goal.trim().length < 8) return;
    setWorking(true); setMessage("");
    try {
      const result = await request<{ job: BuildJob }>("/api/self-build/jobs", token, {
        method: "POST",
        body: JSON.stringify({
          prompt: goal, name: name || undefined, target,
          netlifyApiKey: target === "site" ? netlifyApiKey : undefined,
          siteName: target === "site" ? siteName || undefined : undefined,
        }),
      });
      setSelected(result.job.id);
      setJobs((before) => [result.job, ...before.filter((j) => j.id !== result.job.id)]);
      setNetlifyApiKey("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally { setWorking(false); }
  };
  const chosen = jobs.find((job) => job.id === selected) || jobs[0];

  return (
    <main className="max-w-5xl mx-auto p-4 pb-28 space-y-5">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">Synthia2 • Self-Builder</h1>
        <p className="text-sm text-muted-foreground">
          Runs inside your existing Computer. A real model writes the files; checks repair obvious build errors;
          verified source is mounted to Grove or deployed to Netlify.
        </p>
      </header>
      <Card className="p-4 space-y-3">
        <label htmlFor="self-build-goal" className="font-semibold block">What do you want built?</label>
        <Textarea id="self-build-goal" rows={5} value={goal} onChange={(e) => setGoal(e.target.value)}
          placeholder="Describe what the finished app does, its inputs, screens, data, interactions, and expected behavior."
          data-testid="input-self-build-goal" />
        <Input aria-label="App name" placeholder="App name (optional)" value={name} onChange={(e) => setName(e.target.value)} />
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant={target === "grove" ? "default" : "outline"}
            onClick={() => setTarget("grove")}>Publish to Grove</Button>
          <Button type="button" variant={target === "site" ? "default" : "outline"}
            onClick={() => setTarget("site")}>Deploy to site</Button>
        </div>
        {target === "site" && (
          <div className="space-y-2">
            <Input type="password" autoComplete="off" aria-label="Netlify API token"
              placeholder="Netlify API token (sent once, not stored)" value={netlifyApiKey}
              onChange={(e) => setNetlifyApiKey(e.target.value)} />
            <Input aria-label="Netlify site name" placeholder="Existing or new Netlify site name (optional)"
              value={siteName} onChange={(e) => setSiteName(e.target.value)} />
          </div>
        )}
        <details>
          <summary className="text-sm cursor-pointer">Remote Computer authorization</summary>
          <p className="text-sm text-muted-foreground my-2">
            When your backend is hosted, the server needs SYNTHIA_BUILD_TOKEN configured.
            Enter the same token here. Development on localhost can run without a token.
          </p>
          <Input type="password" autoComplete="off" aria-label="Computer build token"
            placeholder="Computer build token" value={token} onChange={(e) => setToken(e.target.value)} />
        </details>
        <Button onClick={() => { void start(); }} disabled={working || goal.trim().length < 8 || (target === "site" && !netlifyApiKey)}
          data-testid="button-self-build">Build and verify</Button>
        <p className="text-xs text-muted-foreground">
          Source generation requires a running Ollama server with the configured code model. This stage makes
          dependency-free web apps; APK packaging, native permissions and weight training are not connected here yet.
        </p>
      </Card>
      {capability && (
        <Card className="p-3 text-sm space-y-1">
          <div><strong>Model:</strong> {capability.model}</div>
          <div><strong>Verification:</strong> {capability.verification}</div>
          <div><strong>Training:</strong> {capability.training}</div>
        </Card>
      )}
      {message && <p role="alert" className="text-sm text-destructive">{message}</p>}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Actual build jobs</h2>
        {jobs.length === 0 && <p className="text-sm text-muted-foreground">No build jobs have run on this Computer.</p>}
        <div className="flex gap-2 flex-wrap">
          {jobs.map((job) => (
            <Button key={job.id} size="sm" variant={chosen?.id === job.id ? "default" : "outline"}
              onClick={() => setSelected(job.id)}>{job.name} · {job.phase}</Button>
          ))}
        </div>
        {chosen && (
          <Card className="p-4 space-y-3">
            <div className="font-semibold">{chosen.name} — {chosen.phase}</div>
            <div className="text-sm">Goal: {chosen.goal}</div>
            <div className="text-sm">Attempts: {chosen.attempts} · Target: {chosen.target} · Model: {chosen.model}</div>
            {chosen.issues.length > 0 && (
              <div className="text-sm text-destructive">
                <strong>Issues:</strong>
                <ul className="list-disc pl-5">{chosen.issues.map((x, i) => <li key={i}>{x}</li>)}</ul>
              </div>
            )}
            <div className="text-sm">
              <strong>Checks:</strong>
              <ul className="list-disc pl-5">{chosen.tests.map((x, i) => <li key={i}>{x}</li>)}</ul>
            </div>
            {chosen.phase === "completed" && chosen.artifact && (
              <div className="space-y-2">
                <a href={chosen.artifact} target="_blank" rel="noopener noreferrer" className="underline text-primary">
                  Open built app
                </a>
                {chosen.siteUrl && (
                  <a href={chosen.siteUrl} target="_blank" rel="noopener noreferrer" className="underline text-primary block">
                    Open deployed site
                  </a>
                )}
                {chosen.mountedAppId && <div className="text-sm">Mounted in Computer: {chosen.mountedAppId}</div>}
                <iframe title="Isolated built application" src={chosen.artifact} sandbox="allow-scripts"
                  className="w-full h-96 border rounded-lg bg-white" />
              </div>
            )}
          </Card>
        )}
      </section>
      <RouteLink href="/grove-store" className="text-sm underline text-primary">Open Grove Store</RouteLink>
    </main>
  );
}
