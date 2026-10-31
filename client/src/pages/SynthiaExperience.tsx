/**
 * Synthia / YOU-N-I-VERSE recovery entry.
 *
 * This is a non-destructive frontend bridge to SynthAi2's existing local
 * Synthia agent and the recoverable Resonance Quest mechanics from the
 * 2025 YOU-N-I-VERSE archive. The original Flask engines remain separately
 * versioned; this component does NOT substitute simulated outputs for them.
 */
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Bot, BookOpen, Brain, CheckCircle2, Heart, MessageSquare, Play, Sparkles, Upload, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { openFlyUp } from "@/lib/flyUps";

type Field = "body" | "heart" | "mind" | "soul" | "spirit";
type QuestRecord = { field: Field; completedAt: string; before: number; after: number; points: number };
type QuestState = { ratings: Record<Field, number>; completed: QuestRecord[] };
const ARCHIVED_SYTHIS_PORTRAIT_THUMB = "data:image/webp;base64,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";
const ARCHIVED_PORTRAITS = [ARCHIVED_SYTHIS_PORTRAIT_THUMB, "data:image/webp;base64,UklGRhgEAABXRUJQVlA4IAwEAABwGACdASp4AHgAPulur1EpJqQjqBUKgSAdCWUDvr2ykPcPDWitdO5x7g66zdwrJechy+gB67FfdiR+ufWmwa/NEZQrAVBTGOGiDULjsUVLTXJlZvny216yGc8BK5iKtYCkhxDZZNBh16wxrUD+sGii72Q22fphiCqBPj33rXxkWrTiQmVySgqVDLfJDtnhSRqFQfo1UfmOS6ZhkAViEmqlbV6mfAJQQCdFJHIxKx8G34dslghXKLz37p4NAGBqMzijRiIQXwkh7baB1kAA/viD6i/pzdXryCiJTT2g7oPmfcTYv5WM/wxqT3hkmxKo606jgu5cyL+6zOJISNL/PaNGQy/EKw9a1loaZ7Dp9PCjLC5vntUMmT5OcIgNIL1fg20dPEdZLPJTNufkk0Htbo55KcF7p7QUaxsRH19ELGovzIq6yRUCQ9rIkBAmigZXA/R+1QlxavjKbAIrEVdigBSerGDOfA1RpzkwKEQptc9pGTA79a4KsuGqsF3JNP3R2bYVUxpnMSgoBxp2gkzz2lEr5WbN+Z5X2hDodZHvpj99DSnpmX6wrqIncqheZdZeatyYYv76XDQogv4PFf1O3ghiyQYLf7vVzCk3W9UH7M1wNw8CQx49l751+1Y+LEwb0jrnpcq6ib6CEMvGRTLqhQytWLDxpC3xykkjkn6/DUVt6zt2zfLDLGobrQ0BJtbxLrESC/HJ+5UlqrfZ1eqURhEgGJXUz3TX6Moz/rLcY9WmNPM1IBaSA6Sl/m1ax1X7x+2NWqbrqBgSdIi+AU1KDDrT+FvLB78WKSD3mRoYR/SirO4ZtRTQprzu82g/aGP0L4Z0UFWcnmX/U5JWeFjUSVWd13pqR9Z+9vwhe+wwMA5UuPFsdFF6afoOqCEcp5XfZlCJMNakfbZKHrxHshUWMg/HqGv1uO6QGfjFwzUE39zpL6bEANWQWqKpitjuqNhkG5vIvO1jQf4LKDxcp07lNklAdLCBMV7t0whm5c0AyEmrRDrnR6dqNyXu7azqz+S3JzuHR3CmwvoGHyKovGLd/Xx7MQLJ5D5tZMNpGJgON9Yq9QGGVkicrvgvxLcwbr5WuVCSHyF7MLNDLAHD2ipuxhiIFZj1WHwS0etT+LhwMy8VGFeNanJ+ElbpgsFCP/H9gKjDzV53SUQO3wGdnRlFk+OyFsg0UjSEdM1N0Wh+oQQwT/lgninl22Dl0YzHYkr1HXAbvS2SnenDkB6043NeCSFNKXiF8uhGBgpQLcb5gPp34QmIhlDICr3ouXjIbDSqtEvee9o5PTkeg/yG1o9/5wa5ZTsxdnCpqA0jc4jeiSyaY+7DDJGDRnT/a0XnshoGUH8WM1tE2Pyzj/pWUcYhoAWhCxD2kIFNwpZYAAAA", "data:image/webp;base64,UklGRuYBAABXRUJQVlA4INoBAADwDQCdASpuAKUAPulwslUpJaQtIVVY4aAdCWcA0fgQP4vkOW8PVBXTun5GaheI/2lS6IHkTORBvseEtMfABX7KPFsyvyVjd2qOsP457qpzdLQ3hHWVzXs90beOHyRH10sXniQL8HMSrpPvOJ9rtMwNQgSJwD6PssAA/vNpCI3VGAESiXghdN30zLUHVdyous2Q0DsXSbj64oC6gynYS085PGfNL96PinOY4n2vC9eTO4zCgmXw6ULSW8OqqFoJ4F4ycona7b0oKl0SQU/H00PWREyrOlvBTwDLzc1Lm5SEBrUClAwiadx4m1H6SEc1VJ9ttzQuNPZn6rKWftpzol07NZFuOK76rVHQS1Jg6zCud2jmyrigyNw9k7/qfmH29L9IE63x7WWYao9ZL49GuEw59X3QODomHcFgWXuXql/QMQB3A/bDykhP6oa5GBbA+1yAafYcZjpBKEKcEpdmxlKsH0kY16Sp1TlDtSuMDGFBJj4rOSpIkjw8Y80Ew9vLvK8cmWJy73wG1MujAOqVqDt4WZf4/uLim4ecv8qYUikkO4tqbLZw6qtG8QsIrobwE+0elM6ga3Lr+qD7q1m5YuG2nRHdcaPNgPTQrqeWDGTqTmABDB3IWAAAAAA="];
const STORAGE_KEY = "youniverse_recovered_resonance_quest_v1";
const BASE_RATINGS: Record<Field, number> = { body: 5, heart: 5, mind: 5, soul: 5, spirit: 5 };

// Names and prompts are transcribed from templates/resonance_quest.html in
// YOU-N-I-VERSE (1).zip. They are experiential exercises, not diagnoses.
const QUESTS: Array<{ field: Field; name: string; description: string; guidance: string }> = [
  { field: "body", name: "Body Quest: Ground Your Core", description: "5-minute grounding meditation", guidance: "Breathe deeply. Inhale for 4 counts, hold for 4, exhale for 4." },
  { field: "heart", name: "Heart Quest: Open Your Flow", description: "5-minute gratitude practice", guidance: "Write 3 things you're grateful for. Feel the warmth in your heart." },
  { field: "mind", name: "Mind Quest: Sharpen Your Vision", description: "5-minute visualization", guidance: "Visualize a clear goal. See yourself achieving it step by step." },
  { field: "soul", name: "Soul Quest: Expand Your Light", description: "5-minute essence meditation", guidance: "Imagine a glowing plasma field around you. Feel your authentic essence." },
  { field: "spirit", name: "Spirit Quest: Connect to All", description: "5-minute transcendence practice", guidance: "Set an intention for harmony. Feel your connection to all life." },
];
function loadState(): QuestState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ratings: { ...BASE_RATINGS }, completed: [] };
    const parsed = JSON.parse(raw);
    const ratings = Object.fromEntries(
      QUESTS.map(({ field }) => [field, Number.isFinite(Number(parsed?.ratings?.[field]))
        ? Math.max(1, Math.min(10, Number(parsed.ratings[field]))) : 5])
    ) as Record<Field, number>;
    const completed = Array.isArray(parsed?.completed)
      ? parsed.completed.filter((item: unknown) =>
          Boolean(item && typeof item === "object" && QUESTS.some(q => q.field === (item as QuestRecord).field)
          && typeof (item as QuestRecord).completedAt === "string")).slice(-500)
      : [];
    return { ratings, completed };
  } catch {
    return { ratings: { ...BASE_RATINGS }, completed: [] };
  }
}

export default function SynthiaExperience() {
  const [, navigate] = useLocation();
  const [state, setState] = useState<QuestState>(loadState);
  const [activeField, setActiveField] = useState<Field | null>(null);
  const [before, setBefore] = useState(5);
  const [after, setAfter] = useState(5);
  const [pythonStatus, setPythonStatus] = useState<string>("Checking existing Python runtime");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [portraitIndex, setPortraitIndex] = useState(0);
  const totalPoints = state.completed.reduce((sum, item) => sum + (item.points || 0), 0);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/python/status")
      .then(async r => {
        if (!r.ok) throw new Error("Runtime status unavailable");
        return r.json();
      })
      .then(status => {
        if (!cancelled) setPythonStatus(status.running ? "Python service reported running" : "Python service not running");
      })
      .catch(() => { if (!cancelled) setPythonStatus("Python runtime not reachable"); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => () => { if (avatarUrl) URL.revokeObjectURL(avatarUrl); }, [avatarUrl]);

  function beginQuest(field: Field) {
    setActiveField(field);
    setBefore(state.ratings[field]);
    setAfter(state.ratings[field]);
  }

  function completeQuest() {
    if (!activeField) return;
    const now = new Date().toISOString();
    setState(previous => ({
      ratings: { ...previous.ratings, [activeField]: after },
      completed: [...previous.completed, { field: activeField, before, after, completedAt: now, points: 10 }],
    }));
    setActiveField(null);
  }

  function choosePortrait(file?: File) {
    if (avatarUrl) URL.revokeObjectURL(avatarUrl);
    if (!file || !file.type.startsWith("image/")) {
      setAvatarUrl(null);
      return;
    }
    setAvatarUrl(URL.createObjectURL(file));
  }

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 pb-28" data-testid="synthia-experience">
      <header className="rounded-2xl border border-fuchsia-500/30 bg-gradient-to-br from-violet-950/80 via-background to-cyan-950/50 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-fuchsia-300">Restored from YOU-N-I-VERSE · 2025 archive</p>
            <h1 className="mt-2 text-3xl font-bold">Synthia & Resonance Quest</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              A home for the recovered Synthia experience inside your existing SynthAi2 computer.
              The chat opens SynthAi2's real local agent; quest progress is saved on this device.
            </p>
          </div>
          <Button onClick={() => openFlyUp("agent")} data-testid="synthia-talk">
            <MessageSquare className="mr-2 h-4 w-4" /> Talk with Synthia
          </Button>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Bot className="h-4 w-4" /> Synthia companion</CardTitle>
            <CardDescription>Opens the existing device-local model and agent tools.</CardDescription></CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => openFlyUp("agent")}><Play className="mr-2 h-4 w-4" /> Open agent</Button>
            <p className="mt-3 text-xs text-muted-foreground">The recovered Flask persona, memory databases, and voice engine have not been substituted for your local model.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Volume2 className="h-4 w-4" /> Original avatar</CardTitle>
            <CardDescription>Preview one of your original Synthia portrait files without changing it.</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            {avatarUrl ? <img src={avatarUrl} alt="Your selected original Synthia portrait" className="h-40 w-full rounded-lg object-contain" /> : <img src={ARCHIVED_PORTRAITS[portraitIndex]} alt={`Thumbnail derived from original Synthia portrait ${portraitIndex + 1}`} className="h-40 w-full rounded-lg object-contain" />}
            <div className="flex flex-wrap gap-1" role="group" aria-label="Archived original portrait">
              {ARCHIVED_PORTRAITS.map((_, index) => <Button type="button" size="sm" key={index} variant={portraitIndex === index && !avatarUrl ? "default" : "outline"} onClick={() => { if (avatarUrl) { URL.revokeObjectURL(avatarUrl); setAvatarUrl(null); } setPortraitIndex(index); }}>Portrait {index + 1}</Button>)}
            </div>
            <label className="flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm">
              <Upload className="h-4 w-4" /> Preview original portrait
              <input type="file" accept="image/*" className="sr-only" onChange={event => choosePortrait(event.currentTarget.files?.[0])} />
            </label>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Brain className="h-4 w-4" /> Existing engines</CardTitle>
            <CardDescription>{pythonStatus}</CardDescription></CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => navigate("/human-design")}>Human Design</Button>
            <Button size="sm" variant="outline" onClick={() => navigate("/calibration-tank")}>Calibration</Button>
            <Button size="sm" variant="outline" onClick={() => navigate("/ingest")}>Book & file ingest</Button>
          </CardContent>
        </Card>
      </div>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-bold">Resonance Quest</h2>
            <p className="text-sm text-muted-foreground">Five original field practices, restored as an independent local game. Nothing here changes your canonical Human Design calculations.</p>
          </div>
          <span className="rounded-full border border-fuchsia-500/40 px-3 py-1 text-sm"><Sparkles className="mr-1 inline h-4 w-4" /> {totalPoints} quest points</span>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {QUESTS.map(q => {
            const count = state.completed.filter(record => record.field === q.field).length;
            return <Card key={q.field} className={activeField === q.field ? "border-fuchsia-500/70" : ""}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base"><Heart className="h-4 w-4 text-fuchsia-400" />{q.name}</CardTitle>
                <CardDescription>{q.description} · {count} completed</CardDescription>
              </CardHeader>
              <CardContent>
                {activeField === q.field ? <div className="space-y-3">
                  <p className="text-sm">{q.guidance}</p>
                  <label className="block text-xs">Before: {before}/10
                    <input className="w-full" type="range" min="1" max="10" value={before} onChange={e => setBefore(Number(e.target.value))} />
                  </label>
                  <label className="block text-xs">After: {after}/10
                    <input className="w-full" type="range" min="1" max="10" value={after} onChange={e => setAfter(Number(e.target.value))} />
                  </label>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={completeQuest}><CheckCircle2 className="mr-1 h-4 w-4" /> Complete (+10)</Button>
                    <Button size="sm" variant="ghost" onClick={() => setActiveField(null)}>Cancel</Button>
                  </div>
                </div> : <Button variant="secondary" size="sm" onClick={() => beginQuest(q.field)}>Start quest</Button>}
              </CardContent>
            </Card>;
          })}
        </div>
        <p className="text-xs text-muted-foreground">These are self-reported, symbolic exercises—not measurements of health or scientifically validated field states. Your results stay in this browser's local storage.</p>
      </section>
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><BookOpen className="h-4 w-4" /> Recovered modules</CardTitle>
          <CardDescription>The source archive also contains a book processor, avatar animation, memory and speech engines, and experimental field calculations. Those require separate runtime integration; their presence is not represented as a completed connection here.</CardDescription></CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => navigate("/novel")}>Open writing studio</Button>
          <Button variant="outline" onClick={() => navigate("/player")}>Open player</Button>
          <Button variant="outline" onClick={() => navigate("/mesh")}>Open mesh</Button>
        </CardContent>
      </Card>
    </main>
  );
}
