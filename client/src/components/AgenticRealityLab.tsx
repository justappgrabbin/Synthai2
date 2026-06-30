import { useMemo, useState } from "react";
import { Boxes, Brain, Building2, CircleDot, Play, Sparkles, Users } from "lucide-react";
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
  type BuildingAction,
  type ConsciousnessProfile,
  type FeatureInstance,
} from "@/lib/agenticRealityOrchestrator";

type LabTab = "run" | "agents" | "bricks" | "world";

export function AgenticRealityLab() {
  const [activeTab, setActiveTab] = useState<LabTab>("run");
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
  const displayedActions = result?.actions ?? previewActions;
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
                <h2 className="text-xl font-semibold">Agentic Reality Lab</h2>
              </div>
              <p className="mt-1 text-sm text-slate-400">
                Recovered bridge: LegacyBuild to Sims agents to GameEngineX profiles to SynthUniverse features.
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
          <MetricCard icon={Building2} label="Features" value={displayedFeatures.length} />
          <MetricCard icon={Brain} label="Coherence" value={`${averageCoherence}%`} />
        </div>

        <div className="flex gap-2 overflow-x-auto border-b border-slate-800 pb-2">
          {[
            ["run", "Run"],
            ["agents", "Agents"],
            ["bricks", "Bricks"],
            ["world", "World Build"],
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

        {activeTab === "world" && (
          <div className="grid gap-3 md:grid-cols-3">
            {displayedActions.map((action) => (
              <WorldActionCard key={`${action.agentId}-${action.targetFeature}`} action={action} />
            ))}
          </div>
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

function WorldActionCard({ action }: { action: BuildingAction }) {
  return (
    <Card className="border-slate-800 bg-slate-950/80 text-slate-100">
      <CardHeader>
        <CardTitle className="text-base">{action.targetFeature}</CardTitle>
        <CardDescription className="text-slate-400">{action.buildingType} planned by {action.agentId}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-slate-400">
        <p>Position: {action.position.x}, {action.position.y}, {action.position.z}</p>
        <p>Bricks: {action.bricksUsed.length ? action.bricksUsed.join(", ") : "waiting for resonance match"}</p>
        <Badge variant="outline">{action.status}</Badge>
      </CardContent>
    </Card>
  );
}
