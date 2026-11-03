/**
 * YOU-N-I-VERSE is the world of SynthAI2, not another standalone game.
 *
 * This surface contains real routes into the existing applications and the
 * real saved semantic universes. It never invents agent runs or chart results.
 */
import { Suspense, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stars, Text } from "@react-three/drei";
import { Link, useLocation } from "wouter";
import {
  ArrowRight, Bot, Brain, Code2, Dna, Gamepad2, Globe2, Layers3,
  Network, Orbit, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UniverseViewer3D } from "@/components/UniverseViewer3D";

import { readSavedWorlds, type SavedUniverse } from "@/lib/indiverseWorldStore";

type Portal = {
  dimension: "Movement" | "Evolution" | "Being" | "Design" | "Space";
  label: string;
  description: string;
  path: string;
  color: string;
  position: [number, number, number];
};

const PORTALS: Portal[] = [
  {
    dimension: "Being", label: "Human Design",
    description: "Charts, profiles, relationships, and source-backed interpretation",
    path: "/human-design", color: "#c084fc", position: [0, 1.7, -3.7]
  },
  {
    dimension: "Movement", label: "Agents",
    description: "Employ and guide functioning agents through real work",
    path: "/agents", color: "#34d399", position: [3.5, 0.5, -1.2]
  },
  {
    dimension: "Evolution", label: "Simlish",
    description: "Enter the preserved living Simlish environment",
    path: "/simlish-world", color: "#f59e0b", position: [2.2, -1.2, 2.8]
  },
  {
    dimension: "Design", label: "World Creator",
    description: "Create, save, and render a semantic world",
    path: "/universe-creator", color: "#38bdf8", position: [-2.2, -1.2, 2.8]
  },
  {
    dimension: "Space", label: "Game Creator",
    description: "Design the spaces and mechanics for connected worlds",
    path: "/game-creator", color: "#fb7185", position: [-3.5, 0.5, -1.2]
  }
];

function PortalNode({ portal, enter }: { portal: Portal; enter: (path: string) => void }) {
  return (
    <group position={portal.position}>
      <mesh onClick={(event) => { event.stopPropagation(); enter(portal.path); }} >
        <icosahedronGeometry args={[0.65, 1]} />
        <meshStandardMaterial
          color={portal.color} emissive={portal.color}
          emissiveIntensity={0.32} roughness={0.38} metalness={0.38}
        />
      </mesh>
      <Text position={[0, -1.0, 0]} fontSize={0.3} maxWidth={3}
        color="#ffffff" anchorX="center" anchorY="middle">
        {portal.dimension}
      </Text>
    </group>
  );
}

function WorldMap({ enter }: { enter: (path: string) => void }) {
  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: [0, 4.5, 12], fov: 52 }}
      fallback={<div className="flex h-full items-center justify-center text-sm text-muted-foreground">3D view unavailable; use the accessible world portals below.</div>}
    >
      <Suspense fallback={null}>
        <ambientLight intensity={0.9} />
        <pointLight position={[2, 6, 6]} intensity={85} />
        <Stars radius={40} depth={30} count={1300} factor={2.5} saturation={0} fade />
        <mesh rotation={[0.2, 0.1, 0]}>
          <icosahedronGeometry args={[1.3, 2]} />
          <meshStandardMaterial color="#4338ca" emissive="#312e81" emissiveIntensity={0.45} wireframe />
        </mesh>
        {PORTALS.map((portal) => (
          <PortalNode key={portal.dimension} portal={portal} enter={enter} />
        ))}
        <OrbitControls enablePan={false} minDistance={6} maxDistance={20} />
      </Suspense>
    </Canvas>
  );
}

export default function IndiverseWorld() {
  const [, navigate] = useLocation();
  const [savedWorlds, setSavedWorlds] = useState<SavedUniverse[]>(readSavedWorlds);
  const [playingWorld, setPlayingWorld] = useState<SavedUniverse | null>(null);

  useEffect(() => {
    const reload = () => setSavedWorlds(readSavedWorlds());
    window.addEventListener("storage", reload);
    window.addEventListener("focus", reload);
    return () => {
      window.removeEventListener("storage", reload);
      window.removeEventListener("focus", reload);
    };
  }, []);

  return (
    <main className="min-h-screen bg-background pb-28" data-testid="you-n-i-verse-world">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:py-10">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.22em] text-primary">
              <Orbit className="h-4 w-4" /> SynthAI2 / World
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-5xl">YOU-N-I-VERSE</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
              One continuous world. Human Design is its central application;
              Synthia, agents, living worlds, and the creative Computer work inside it.
            </p>
          </div>
          <Link href="/computer">
            <Button variant="outline" className="gap-2">
              <Code2 className="h-4 w-4" /> Open SynthAI2 Computer
            </Button>
          </Link>
        </header>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(280px,1fr)]">
          <section className="overflow-hidden rounded-xl border bg-slate-950" aria-label="Spatial YOU-N-I-VERSE map">
            <div className="relative h-[42vh] min-h-[280px] max-h-[520px] sm:h-[52vh]">
              <WorldMap enter={navigate} />
              <div className="pointer-events-none absolute bottom-3 left-3 rounded-md bg-black/65 px-3 py-2 text-xs text-white">
                Five dimensions · Select a node to enter · Drag to orbit
              </div>
            </div>
          </section>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Dna className="h-5 w-5" /> Your world</CardTitle>
              <CardDescription>
                Each portal opens existing SynthAI2 code, not a placeholder or simulated agent.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {PORTALS.map((portal) => (
                <Link key={portal.dimension} href={portal.path}>
                  <div className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-accent"
                    data-testid={"portal-" + portal.dimension.toLowerCase()}>
                    <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: portal.color }} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">{portal.dimension} · {portal.label}</p>
                      <p className="text-xs text-muted-foreground">{portal.description}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>

        <section className="mt-6 grid gap-3 sm:grid-cols-3" aria-label="World systems">
          <Link href="/synthia">
            <Card className="h-full cursor-pointer hover:bg-accent">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base"><Brain className="h-4 w-4" /> Synthia</CardTitle>
                <CardDescription>The intelligence and guidance interface</CardDescription>
              </CardHeader>
            </Card>
          </Link>
          <Link href="/mesh">
            <Card className="h-full cursor-pointer hover:bg-accent">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base"><Network className="h-4 w-4" /> Resonance Network</CardTitle>
                <CardDescription>Connections, events, and shared context</CardDescription>
              </CardHeader>
            </Card>
          </Link>
          <Link href="/ide">
            <Card className="h-full cursor-pointer hover:bg-accent">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base"><Bot className="h-4 w-4" /> Workbench</CardTitle>
                <CardDescription>Build and inspect the software that runs this world</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </section>

        <section className="mt-8" aria-label="Saved worlds">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 text-xl font-semibold">
                <Globe2 className="h-5 w-5" /> Worlds inside YOU-N-I-VERSE
              </h2>
              <p className="text-sm text-muted-foreground">
                {savedWorlds.length} locally saved semantic {savedWorlds.length === 1 ? "world" : "worlds"};
                open any world in the original 3D viewer.
              </p>
            </div>
            <Link href="/universe-creator">
              <Button className="gap-2"><Sparkles className="h-4 w-4" /> Create world</Button>
            </Link>
          </div>
          {savedWorlds.length ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {savedWorlds.map((world) => (
                <Card key={world.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{world.name}</CardTitle>
                    <CardDescription className="line-clamp-2">{world.prompt}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" size="sm" className="gap-2"
                      onClick={() => setPlayingWorld(world)}>
                      <Gamepad2 className="h-4 w-4" /> Enter saved world
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
              <Layers3 className="mx-auto mb-2 h-6 w-6" />
              No locally saved semantic worlds on this device. The root YOU-N-I-VERSE world is available above.
            </div>
          )}
        </section>
      </div>
      {playingWorld && (
        <UniverseViewer3D universe={playingWorld} onClose={() => setPlayingWorld(null)} />
      )}
    </main>
  );
}
