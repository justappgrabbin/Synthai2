import { useRef, useState } from "react";
import { useLocation } from "wouter";
import { Bot, Eye, FileArchive, Search, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FlyUpScreen } from "@/components/FlyUpScreen";
import { closeFlyUp } from "@/lib/flyUps";
import { GPT_DASH_DIRECTIVE } from "@/lib/gptDash";
import { askLocalModel, getModelChoice, getTinyLlamaEnabled, LOCAL_MODELS, setModelChoice, setTinyLlamaEnabled, type LocalModelChoice } from "@/lib/localModel";

// Synthia Agent: local Qwen2.5-Coder chat (her Synthia Adaptive v0.5.4 loader, see lib/localModel.ts),
// TinyLlama as an optional lighter fallback (off by default). It can also act: find a zip's entry, run it. UI follows UNO Dash (feature/synthai-continuity-ide-20261018).
// Free and local only; no paid provider is called from here.
type Msg = { role: "user" | "assistant"; content: string };
type Zip = { id: string; name?: string; filename?: string };


export function AgentFlyUp() {
  const [, navigate] = useLocation();
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "Hi Alexis. I run on a local Qwen Coder on this device. Ask me anything, or tap Find entry / Run zip." },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [playUrl, setPlayUrl] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const [choice, setChoice] = useState<LocalModelChoice>(getModelChoice());
  const [tiny, setTiny] = useState(getTinyLlamaEnabled());

  const say = (content: string) => {
    setMessages((m) => [...m, { role: "assistant", content }]);
    setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  };

  async function latestZipEntry(): Promise<{ zip: Zip; entry: string | null } | null> {
    const zips: Zip[] = await fetch("/api/zips").then((r) => r.json()).catch(() => []);
    if (!Array.isArray(zips) || zips.length === 0) return null;
    const zip = zips[zips.length - 1];
    const { entryFile } = await fetch(`/api/zips/${zip.id}/entry-file`).then((r) => r.json()).catch(() => ({ entryFile: null }));
    return { zip, entry: entryFile ?? null };
  }

  async function findEntry() {
    const found = await latestZipEntry();
    if (!found) return say("No zips uploaded yet. Open ZIP manager and upload one.");
    const label = found.zip.name || found.zip.filename || found.zip.id;
    say(found.entry ? `Entry for ${label}: ${found.entry}` : `I couldn't find an HTML entry in ${label}.`);
    return found;
  }

  async function runZip() {
    const found = await findEntry();
    if (found && found.entry) {
      setPlayUrl(`/api/zips/${found.zip.id}/play/${found.entry}`);
      say(`Running ${found.entry} below.`);
    }
  }

  async function chat(text: string) {
    const history = [...messages, { role: "user" as const, content: text }];
    try {
      const { text: reply, via } = await askLocalModel([{ role: "system", content: GPT_DASH_DIRECTIVE }, ...history], { onProgress: (p) => say(p) });
      say(reply + "\n\n(" + via + ")");
    } catch (e: any) {
      say(e.message + ". On the phone this needs the bundled engine (Synthia Adaptive) or a local llama.cpp / Ollama with the model installed. Zip actions still work.");
    }
  }

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: text }]);
    setBusy(true);
    try {
      if (/\b(run|play|launch)\b.*\bzip\b|\brun (it|my)/i.test(text)) await runZip();
      else if (/\bentry\b/i.test(text)) await findEntry();
      else await chat(text);
    } finally { setBusy(false); }
  }

  const tiles = [
    { label: "Find zip entry", icon: Search, run: findEntry },
    { label: "Run latest zip", icon: Eye, run: runZip },
    { label: "ZIP manager / player", icon: FileArchive, run: () => { closeFlyUp(); navigate("/zip-manager"); } },
  ];

  return (
    <FlyUpScreen id="agent" testId="flyup-agent" title="Synthia Agent" icon={<Bot className="h-5 w-5" />}
      description="Local Qwen Coder on this device · finds the zip entry, runs it">
      <div className="flex h-full flex-col">
        <div className="grid grid-cols-3 gap-2 border-b border-purple-500/30 p-3">
          {tiles.map((t) => (
            <Button key={t.label} size="sm" variant="outline" onClick={t.run} disabled={busy}
              className="h-auto min-h-12 justify-start gap-2 whitespace-normal text-left text-xs"
              data-testid={`agent-tile-${t.label.split(" ")[0].toLowerCase()}`}>
              <t.icon className="h-4 w-4 shrink-0" />{t.label}
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2 border-b px-3 py-2 text-xs">
          <select data-testid="agent-model" value={choice} className="rounded-md border bg-background px-2 py-1"
            onChange={(e) => { const c = e.target.value as LocalModelChoice; setModelChoice(c); setChoice(c); }}>
            {(Object.keys(LOCAL_MODELS) as LocalModelChoice[]).filter((k) => k !== "tinyllama" || tiny).map((k) => (
              <option key={k} value={k}>{LOCAL_MODELS[k].label} · {(LOCAL_MODELS[k].bytes / 1e6).toFixed(0)} MB</option>
            ))}
          </select>
          <label className="flex items-center gap-1">
            <input type="checkbox" data-testid="agent-tinyllama-toggle" checked={tiny}
              onChange={(e) => { setTinyLlamaEnabled(e.target.checked); setTiny(e.target.checked); setChoice(getModelChoice()); }} />
            TinyLlama fallback
          </label>
        </div>
        <div className="flex-1 space-y-3 overflow-y-auto p-4 text-sm">
          {messages.map((m, i) => (
            <div key={i} className={m.role === "user"
              ? "ml-auto max-w-[85%] rounded-lg bg-primary p-3 text-primary-foreground"
              : "max-w-[85%] whitespace-pre-wrap rounded-lg bg-muted p-3"}>{m.content}</div>
          ))}
          {playUrl && <iframe title="Zip preview" src={playUrl} className="h-80 w-full rounded-lg border" sandbox="allow-scripts allow-same-origin" />}
          <div ref={endRef} />
        </div>
        <div className="flex gap-2 border-t p-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
          <Textarea value={input} onChange={(e) => setInput(e.target.value)} rows={1} placeholder="Message the agent"
            data-testid="agent-input" className="min-h-10 resize-none"
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} />
          <Button size="icon" onClick={send} disabled={busy} data-testid="agent-send" aria-label="Send"><Send className="h-4 w-4" /></Button>
        </div>
      </div>
    </FlyUpScreen>
  );
}
