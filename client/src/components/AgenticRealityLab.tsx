import { useMemo, useState } from "react";
import { Boxes, Brain, CircleDot, Dices, FolderOpen, Map, Play, Sparkles, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  calculateConsciousnessProfile,
  createBuildingAction,
  generateFeatureInstance,
  importSimsCharacters,
  loadBricksFromLegacy,
  runFullOrchestration,
  synthWorldRuntime,
  type ConsciousnessProfile,
  type FeatureInstance,
} from "@/lib/agenticRealityOrchestrator";

type LabTab = "world" | "run" | "agents" | "bricks" | "grammar" | "source";

export function AgenticRealityLab() {
  const [activeTab, setActiveTab] = useState<LabTab>("world");
  const [result, setResult] = useState<ReturnType<typeof runFullOrchestration> | null>(null);

  const bricks = useMemo(() => loadBricksFromLegacy(), []);
  const sims = useMemo(() => importSimsCharacters(), []);
  const profiles = useMemo(() => sims.map(calculateConsciousnessProfile), [sims]);
  const previewActions = useMemo(
    () => profiles.map((profile, index) => createBuildingAction(profile, bricks, ["/skills", "/tasks", "/marketplace"][index] || "/feature")),
    [bricks, profiles],
  );
  const previewFeatures = useMemo(
    () => previewActions.map((action) => generateFeatureInstance(action, profiles.find((profile) => profile.agentId === action.agentId)!, bricks)),
    [bricks, previewActions, profiles],
  );

  const displayedProfiles = result?.profiles ?? profiles;
  const displayedFeatures = result?.features ?? previewFeatures;
  const averageCoherence = Math.round(
    (displayedProfiles.reduce((sum, profile) => sum + profile.coherence, 0) / displayedProfiles.length) * 100,
  );

  return (
    <div className="h-[76vh] overflow-y-auto bg-[#080a12] p-4 text-slate-100">
      <div className="mx-auto max-w-7xl space-y-4">
        <div className="rounded-lg border border-violet-400/20 bg-slate-950/80 p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-violet-300" />
                <h2 className="text-xl font-semibold">SynthWorld</h2>
              </div>
              <p className="mt-1 text-sm text-slate-400">
                Godot world starter, trait engine, sentence grammar, gnome qualities, and agent orchestration in one living layer.
              </p>
            </div>
            <Button onClick={() => setResult(runFullOrchestration())} className="gap-2">
              <Play className="h-4 w-4" />
              Run Orchestration
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <MetricCard icon={Boxes} label="Bricks" value={bricks.length} />
          <MetricCard icon={Users} label="Agents" value={displayedProfiles.length} />
          <MetricCard icon={Dices} label="Behaviors" value={synthWorldRuntime.behaviors.length} />
          <MetricCard icon={Brain} label="Coherence" value={`${averageCoherence}%`} />
        </div>

        <div className="flex gap-2 overflow-x-auto border-b border-slate-800 pb-2">
          {[
            ["world", "World"],
            ["run", "Run"],
            ["agents", "Agents"],
            ["bricks", "Bricks"],
            ["grammar", "Grammar"],
            ["source", "Source"],
          ].map(([id, label]) => (
            <Button
              key={id}
              variant={activeTab === id ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab(id as LabTab)}
            >
              {label}
            </Button>
          ))}
        </div>

        {activeTab === "world" && (
          <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
            <Card className="border-violet-500/20 bg-slate-950/80 text-slate-100">
              <CardHeader>
                <CardTitle>Runtime Agent</CardTitle>
                <CardDescription className="text-slate-400">
                  From the SynthWorld Godot and trait starters.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold">{synthWorldRuntime.agent.name}</p>
                      <p className="text-sm text-slate-400">Authority: {synthWorldRuntime.agent.authority}</p>
                    </div>
                    <Badge variant="outline">autonomy {Math.round(synthWorldRuntime.agent.autonomy * 100)}%</Badge>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {synthWorldRuntime.agent.traits.map((trait) => (
                      <Badge key={trait} className="bg-violet-500/20 text-violet-100 hover:bg-violet-500/30">{trait}</Badge>
                    ))}
                  </div>
                </div>

                <div className="grid gap-2">
                  {Object.entries(synthWorldRuntime.agent.drives).map(([drive, value]) => (
                    <DriveMeter key={drive} label={drive} value={value} />
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4">
              <Card className="border-cyan-500/20 bg-slate-950/80 text-slate-100">
                <CardHeader>
                  <CardTitle>Utility Behaviors</CardTitle>
                  <CardDescription className="text-slate-400">The first live decision layer: cook, wander, socialize.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-2 md:grid-cols-3">
                  {synthWorldRuntime.behaviors.map((behavior) => (
                    <div key={behavior.action} className="rounded-md border border-slate-800 bg-slate-900/70 p-3">
                      <p className="font-medium text-cyan-200">{behavior.action}</p>
                      <p className="mt-1 text-xs text-slate-500">{behavior.score}</p>
                      <Badge className="mt-3" variant="outline">{behavior.cooldownSec}s cooldown</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-emerald-500/20 bg-slate-950/80 text-slate-100">
                <CardHeader>
                  <CardTitle>Biomes</CardTitle>
                  <CardDescription className="text-slate-400">World zones from the Godot starter.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-2 md:grid-cols-2">
                  {synthWorldRuntime.biomes.map((biome) => (
                    <div key={biome.id} className="rounded-md border border-slate-800 bg-slate-900/70 p-3">
                      <div className="flex items-center gap-2">
                        <Map className="h-4 w-4 text-emerald-300" />
                        <p className="font-medium">{biome.id.replace("_", " ")}</p>
                      </div>
                      <p className="mt-2 text-xs text-slate-500">Spawns: {biome.spawn.join(", ")}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === "run" && (
          <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
            <Card className="border-cyan-500/20 bg-slate-950/80 text-slate-100">
              <CardHeader>
                <CardTitle>Pipeline</CardTitle>
                <CardDescription className="text-slate-400">The recovered source describes this as the core bridge.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {["Load app bricks", "Import Sims characters", "Calculate consciousness profiles", "Create building actions", "Generate SynthUniverse features"].map((step, index) => (
                  <div key={step} className="flex items-center gap-3 rounded-md border border-slate-800 bg-slate-900/70 p-3">
                    <CircleDot className="h-4 w-4 text-cyan-300" />
                    <div>
                      <p className="text-sm font-medium">System {index + 1}</p>
                      <p className="text-xs text-slate-400">{step}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-violet-500/20 bg-slate-950/80 text-slate-100">
              <CardHeader>
                <CardTitle>Latest Run</CardTitle>
                <CardDescription className="text-slate-400">
                  This is deterministic local orchestration until upload parsers and live mesh events are connected.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {displayedFeatures.map((feature) => (
                  <FeatureRow key={feature.id} feature={feature} />
                ))}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "agents" && (
          <div className="grid gap-3 md:grid-cols-3">
            {displayedProfiles.map((profile) => {
              const sim = sims.find((item) => item.id === profile.simCharacterId);
              return sim ? <AgentCard key={profile.id} simName={sim.name} traits={sim.traits} profile={profile} /> : null;
            })}
          </div>
        )}

        {activeTab === "bricks" && (
          <div className="grid gap-3 md:grid-cols-3">
            {bricks.map((brick) => (
              <Card key={brick.id} className="border-slate-800 bg-slate-950/80 text-slate-100">
                <CardHeader>
                  <CardTitle className="text-base">{brick.name}</CardTitle>
                  <CardDescription className="text-slate-400">{brick.purpose}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1">
                    {brick.gateResonance.map((gate) => (
                      <Badge key={gate} variant="outline">Gate {gate}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {activeTab === "grammar" && (
          <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
            <Card className="border-amber-500/20 bg-slate-950/80 text-slate-100">
              <CardHeader>
                <CardTitle>Sentence Engine</CardTitle>
                <CardDescription className="text-slate-400">
                  Controlled natural language verbs, objects, and block pieces.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="mb-2 text-sm font-medium text-amber-200">Verbs</p>
                  <div className="flex flex-wrap gap-1">
                    {synthWorldRuntime.verbs.map((verb) => <Badge key={verb} variant="outline">{verb}</Badge>)}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-sm font-medium text-amber-200">Objects</p>
                  <div className="flex flex-wrap gap-1">
                    {synthWorldRuntime.objects.map((object) => <Badge key={object} variant="outline">{object}</Badge>)}
                  </div>
                </div>
                <div className="rounded-md border border-slate-800 bg-slate-900/70 p-3 text-xs text-slate-400">
                  agent:Cynthia | verb:build | object:prop/tree | at:(0,0,8) | when:mood.harmony&gt;=0.7 | scene:yijing/hex-24
                </div>
              </CardContent>
            </Card>

            <Card className="border-violet-500/20 bg-slate-950/80 text-slate-100">
              <CardHeader>
                <CardTitle>Pieces and Gnome Qualities</CardTitle>
                <CardDescription className="text-slate-400">Authoring blocks plus gate personality overlays.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2 md:grid-cols-5">
                  {synthWorldRuntime.pieces.map((piece) => (
                    <div key={piece.id} className="rounded-md border border-slate-800 bg-slate-900/70 p-3">
                      <p className="font-medium text-violet-200">{piece.id}</p>
                      <p className="mt-1 text-xs text-slate-500">{piece.signals.join(", ")}</p>
                    </div>
                  ))}
                </div>
                <div className="grid gap-2 md:grid-cols-2">
                  {synthWorldRuntime.gnomeQualities.map((quality) => (
                    <div key={quality.gate} className="rounded-md border border-slate-800 bg-slate-900/70 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium">Gate {quality.gate}: {quality.role}</p>
                        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: quality.color }} />
                      </div>
                      <p className="mt-1 text-xs text-slate-400">{quality.motto}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "source" && (
          <Card className="border-slate-800 bg-slate-950/80 text-slate-100">
            <CardHeader>
              <CardTitle>Preserved SynthWorld Source Packs</CardTitle>
              <CardDescription className="text-slate-400">
                These packs are now inside the app at <code>/synthworld/source</code> for later Godot, backend, and mesh wiring.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2 md:grid-cols-2">
              {synthWorldRuntime.sourcePacks.map((pack) => (
                <a
                  key={pack}
                  href={`${synthWorldRuntime.sourceBase}/${pack}/README.md`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 rounded-md border border-slate-800 bg-slate-900/70 p-3 text-sm hover:border-violet-400"
                >
                  <FolderOpen className="h-4 w-4 text-violet-300" />
                  {pack}
                </a>
              ))}
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value }: { icon: typeof Boxes; label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/80 p-3">
      <Icon className="mb-2 h-4 w-4 text-violet-300" />
      <p className="text-2xl font-semibold">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}

function DriveMeter({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="capitalize text-slate-400">{label}</span>
        <span className="text-slate-500">{Math.round(value * 100)}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-800">
        <div className="h-full rounded-full bg-gradient-to-r from-violet-400 to-cyan-300" style={{ width: `${value * 100}%` }} />
      </div>
    </div>
  );
}

function AgentCard({ simName, traits, profile }: { simName: string; traits: string[]; profile: ConsciousnessProfile }) {
  return (
    <Card className="border-slate-800 bg-slate-950/80 text-slate-100">
      <CardHeader>
        <CardTitle className="text-base">{simName}</CardTitle>
        <CardDescription className="text-slate-400">Coherence {Math.round(profile.coherence * 100)}%</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-1">
          {traits.map((trait) => (
            <Badge key={trait} className="bg-violet-500/20 text-violet-100 hover:bg-violet-500/30">{trait.replace("_", " ")}</Badge>
          ))}
        </div>
        <div className="flex flex-wrap gap-1">
          {profile.gates.map((gate) => (
            <Badge key={gate} variant="outline">Gate {gate}</Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function FeatureRow({ feature }: { feature: FeatureInstance }) {
  return (
    <div className="rounded-md border border-slate-800 bg-slate-900/70 p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium">{feature.route}</p>
          <p className="text-xs text-slate-500">Built by {feature.builtBy}</p>
        </div>
        <Badge variant="outline">{feature.status}</Badge>
      </div>
      <p className="mt-2 text-xs text-slate-400">
        Gates {feature.consciousnessSignature.gates.join(", ")} with {Math.round(feature.consciousnessSignature.coherence * 100)}% coherence.
      </p>
    </div>
  );
}
