import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, ArrowRight, BookOpen, Compass, Gamepad2, Globe2, Layers3, Play, Sparkles, UserRound } from "lucide-react";
import { useMorphStore } from "@/lib/useMorphStore";
import { readWorldLife, beginSimlishLife, type WorldLife } from "@/lib/worldLife";
import { shapeSituation } from "@/lib/ichingWorldShaper";

/**
 * One discovery place, multiple independent engines. The original Simlish,
 * Morph, Game Creator, semantic universe and ZIP Player routes are preserved.
 */
export default function WorldsHub() {
  const [, navigate] = useLocation();
  const currentUserId = useMorphStore(state => state.currentUserId);
  const userId = currentUserId || "local";
  const [life, setLife] = useState<WorldLife>(() => readWorldLife(userId));
  const [saveError, setSaveError] = useState(false);

  useEffect(() => {
    const refresh = () => setLife(readWorldLife(userId));
    refresh();
    window.addEventListener("focus", refresh);
    window.addEventListener("pageshow", refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("pageshow", refresh);
    };
  }, [userId]);

  const seed = life.active?.seed || "simlish-life:" + userId + ":chapter:" + (life.chapters.length + 1);
  const shape = useMemo(() => shapeSituation(seed), [seed]);

  const enterEncounter = () => {
    const episode = beginSimlishLife(userId);
    if (!episode) {
      setSaveError(true);
      return;
    }
    setSaveError(false);
    setLife(readWorldLife(userId));
    navigate("/simlish-world");
  };

  return (
    <main className="min-h-screen bg-background px-3 pb-32 pt-5 text-foreground sm:px-6" data-testid="worlds-hub">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">YOU-N-I-VERSE</div>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-5xl">Worlds</h1>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground sm:text-base">One continuing life. Different worlds and experiences. I Ching shapes the encounter; Morph carries the character.</p>
          </div>
          <button type="button" onClick={() => navigate("/")} className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm"><ArrowLeft size={16}/> Home</button>
        </header>

        <section className="relative overflow-hidden rounded-3xl border p-5 text-white shadow-xl sm:p-9"
          style={{background: "radial-gradient(circle at 80% 20%, " + shape.accent + "65, transparent 55%), linear-gradient(145deg, " + shape.shadow + ", #0d1023 80%)"}}>
          <div className="pointer-events-none absolute -right-16 -top-20 h-72 w-72 rounded-full border border-white/15" aria-hidden="true"/>
          <div className="pointer-events-none absolute -right-8 -top-6 h-56 w-56 rounded-full border border-white/10" aria-hidden="true"/>
          <div className="relative grid gap-6 md:grid-cols-[1fr_220px] md:items-center">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/70">Your next chapter · Agent World</p>
              <h2 className="max-w-xl font-serif text-3xl leading-tight sm:text-5xl">A meeting in the {shape.setting}</h2>
              <p className="max-w-2xl text-sm leading-relaxed text-white/85 sm:text-base">{shape.situation}</p>
              <p className="max-w-xl text-sm text-white/90">{shape.invitation}</p>
              <div className="flex flex-wrap gap-2 pt-2">
                <button type="button" onClick={enterEncounter}
                  className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 font-semibold text-slate-950 transition hover:bg-slate-100" data-testid="enter-iching-life">
                  <Play size={17}/> {life.active ? "Continue your encounter" : "Enter your next chapter"} <ArrowRight size={16}/>
                </button>
                <button type="button" onClick={() => navigate("/simlish-world")}
                  className="rounded-full border border-white/50 px-4 py-3 text-sm hover:bg-white/10">
                  Visit Simlish directly
                </button>
              </div>
              {saveError && <p role="alert" className="text-sm text-amber-200">Local life storage is unavailable. Your progress was not started; no result will be invented.</p>}
            </div>
            <div className="rounded-2xl border border-white/20 bg-black/20 p-5 backdrop-blur-sm">
              <div className="mb-3 text-center text-xs uppercase tracking-widest text-white/70">I Ching · six lines</div>
              <div className="mx-auto flex max-w-[145px] flex-col gap-2" aria-label="Hexagram lines, top to bottom">
                {[...shape.lines].reverse().map((line, index) => (
                  <div key={index} className="flex h-4 gap-2" title={"Line " + (6 - index)}>
                    {line === 1 ? <span className="h-3 w-full rounded-[2px] bg-white"/> :
                      <><span className="h-3 w-1/2 rounded-[2px] bg-white"/><span className="h-3 w-1/2 rounded-[2px] bg-white"/></>}
                  </div>
                ))}
              </div>
              <div className="mt-4 text-center text-sm">{shape.upper.symbol} {shape.upper.nature} over {shape.lower.symbol} {shape.lower.nature}</div>
              <div className="mt-1 text-center text-xs text-white/70">Changing line {shape.changingLine}</div>
              <p className="mt-4 text-xs leading-relaxed text-white/75">{shape.transition}</p>
            </div>
          </div>
        </section>

        <section aria-labelledby="morph-create-title">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles size={20}/>
            <h2 id="morph-create-title" className="text-xl font-semibold">Your form, your adventures</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <button type="button" onClick={() => navigate("/simlish-world?studio=1")}
              className="rounded-2xl border bg-card p-5 text-left transition hover:border-primary/50" data-testid="worlds-character-studio">
              <UserRound size={26} className="mb-3 text-primary"/>
              <h3 className="text-lg font-semibold">Morph · Character Studio</h3>
              <p className="mt-2 text-sm text-muted-foreground">Make and reuse your character in the original Simlish studio. Your identity continues between situations; local 2D character reuse is available.</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold">Open character studio <ArrowRight size={15}/></span>
            </button>
            <button type="button" onClick={() => navigate("/game-creator")}
              className="rounded-2xl border bg-card p-5 text-left transition hover:border-primary/50" data-testid="worlds-game-creator">
              <Gamepad2 size={26} className="mb-3 text-primary"/>
              <h3 className="text-lg font-semibold">Game Creator · Experiences</h3>
              <p className="mt-2 text-sm text-muted-foreground">Build or select playable mechanics and game packs. The situation and Morph determine how an experience fits into the player's ongoing life.</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold">Open Game Creator <ArrowRight size={15}/></span>
            </button>
          </div>
        </section>

        <section aria-labelledby="atlas-title">
          <div className="mb-3 flex items-center gap-2"><Compass size={20}/><h2 id="atlas-title" className="text-xl font-semibold">Explore your worlds</h2></div>
          <div className="grid gap-3 sm:grid-cols-3">
            <WorldCard icon={<Play size={23}/>} title="Simlish · Living World" detail="Playable local world with actual object operations, missions and an original character studio." action="Enter world" onClick={() => navigate("/simlish-world")}/>
            <WorldCard icon={<Layers3 size={23}/>} title="SynthWorld · Agent Life" detail="Agent traits, behaviors, biomes and preserved Godot source packs. A working integration lab, not yet a full free-roam game." action="Explore agent systems" onClick={() => navigate("/agent-world")}/>
            <WorldCard icon={<Globe2 size={23}/>} title="Your Universes" detail="Create and revisit semantic environments in the existing Three.js 3D viewer." action="Explore universes" onClick={() => navigate("/universe-creator")}/>
          </div>
        </section>

        <section aria-labelledby="chapters-title" className="rounded-2xl border bg-card p-5 sm:p-6">
          <h2 id="chapters-title" className="flex items-center gap-2 text-xl font-semibold"><BookOpen size={20}/> Your continuing story</h2>
          {life.chapters.length === 0 ?
            <p className="mt-3 text-sm text-muted-foreground">Your first chapter begins in Simlish. Only an actual completed, locally saved mission will enter your life history.</p> :
            <div className="mt-4 space-y-3">
              {[...life.chapters].reverse().slice(0, 6).map(chapter => {
                const chapterShape = shapeSituation(chapter.seed);
                return <div key={chapter.id} className="rounded-xl border p-3">
                  <p className="font-medium">Restoration in {chapterShape.setting}</p>
                  <p className="mt-1 text-sm text-muted-foreground">You transformed the chair in Simlish · {new Date(chapter.completedAt || chapter.startedAt).toLocaleDateString()} · {chapterShape.upper.nature} / {chapterShape.lower.nature} · changing line {chapterShape.changingLine}</p>
                </div>;
              })}
            </div>}
        </section>

        <p className="text-xs text-muted-foreground">The I Ching shapes a symbolic scene, not a calculated Human Design gate. World progress is saved locally on this device. World engines retain their original source and storage.</p>
      </div>
    </main>
  );
}

function WorldCard({ icon, title, detail, action, onClick }: {
  icon: ReactNode; title: string; detail: string; action: string; onClick: () => void;
}) {
  return <button type="button" onClick={onClick} className="flex flex-col items-start rounded-2xl border bg-card p-5 text-left transition hover:border-primary/50">
    <span className="mb-4 text-primary">{icon}</span>
    <span className="text-lg font-semibold">{title}</span>
    <span className="mt-2 flex-1 text-sm text-muted-foreground">{detail}</span>
    <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold">{action} <ArrowRight size={15}/></span>
  </button>;
}
