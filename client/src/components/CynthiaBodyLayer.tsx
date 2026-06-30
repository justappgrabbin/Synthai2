import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Lock, Sparkles, Star, Wand2 } from "lucide-react";

const centers = [
  { id: "head", label: "Head Lab", city: "Mind City", story: "Questions, pressure, inspiration, and the first spark of a quest.", active: true },
  { id: "ajna", label: "Ajna Experiments", city: "Mind City", story: "Pattern testing, hypotheses, translation, and mental prototypes.", active: true },
  { id: "throat", label: "Throat Market", city: "Mind City", story: "Broadcasts, shopfronts, declarations, and public signals.", active: false },
  { id: "g", label: "Identity Dashboard", city: "Heart City", story: "Direction, self-recognition, place, and character alignment.", active: true },
  { id: "ego", label: "Will Exchange", city: "Heart City", story: "Contracts, jobs, offers, value, and promises.", active: false },
  { id: "solar", label: "Solar Social", city: "Heart City", story: "Relationships, social weather, emotional arcs, and timing.", active: false },
  { id: "spleen", label: "Wellness Belt", city: "Body City", story: "Instinct, healing, alerts, survival wisdom, and body memory.", active: false },
  { id: "sacral", label: "Love Lounge", city: "Body City", story: "Response, life force, devotion, play, and generated energy.", active: false },
  { id: "root", label: "Root Quests", city: "Body City", story: "Pressure, momentum, tasks, challenge loops, and release.", active: true },
];

const freedoms = [
  { tier: 0, label: "Arrival", requirement: "Start profile", unlocked: true },
  { tier: 1, label: "Skin", requirement: "Day 14 + 8 levels", unlocked: false },
  { tier: 2, label: "City Layout", requirement: "Day 21 + 16 levels", unlocked: false },
  { tier: 3, label: "Avatar Reskin", requirement: "Day 30 + 24 levels", unlocked: false },
  { tier: 4, label: "Companions", requirement: "Day 45 + 36 levels", unlocked: false },
  { tier: 5, label: "Composer", requirement: "Day 60 + 48 levels", unlocked: false },
];

const gnomeSamples = [
  { gate: 61, element: "water", center: "head" },
  { gate: 24, element: "ether", center: "ajna" },
  { gate: 62, element: "air", center: "throat" },
  { gate: 10, element: "fire", center: "g" },
  { gate: 40, element: "earth", center: "ego" },
  { gate: 55, element: "fire", center: "solar" },
  { gate: 34, element: "ether", center: "sacral" },
  { gate: 57, element: "air", center: "spleen" },
  { gate: 58, element: "earth", center: "root" },
];

export function CynthiaBodyLayer() {
  return (
    <div className="min-h-full bg-[#080914] p-4 text-slate-100">
      <div className="mx-auto grid max-w-7xl gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <Card className="border-violet-500/30 bg-slate-950/80 text-slate-100">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-violet-300" />
              <CardTitle>Cynthia Body Story Layer</CardTitle>
            </div>
            <CardDescription className="text-slate-400">
              Progression, body cities, centers, gnome gates, and freedom tiers from Cynthia Full Unified Progression.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-violet-500/20 bg-violet-500/10 p-4">
              <p className="text-sm font-semibold text-violet-200">Current Story State</p>
              <p className="mt-2 text-sm text-slate-300">
                The body opens as cities and districts unlock. Centers become locations, gates become gnomes, and progression decides what can be customized.
              </p>
            </div>
            <div className="grid gap-2">
              {freedoms.map((item) => (
                <div key={item.tier} className="flex items-center justify-between rounded-md border border-slate-800 bg-slate-900/70 p-3">
                  <div>
                    <p className="text-sm font-medium">Tier {item.tier}: {item.label}</p>
                    <p className="text-xs text-slate-500">{item.requirement}</p>
                  </div>
                  <Badge variant={item.unlocked ? "default" : "outline"} className="gap-1">
                    {item.unlocked ? <Sparkles className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                    {item.unlocked ? "open" : "locked"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          <Card className="border-cyan-500/20 bg-slate-950/80 text-slate-100">
            <CardHeader>
              <CardTitle>Body Cities</CardTitle>
              <CardDescription className="text-slate-400">
                Mind City, Heart City, and Body City as navigable center districts.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-3">
                {["Mind City", "Heart City", "Body City"].map((city) => (
                  <div key={city} className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
                    <p className="mb-2 text-sm font-semibold text-cyan-200">{city}</p>
                    <div className="space-y-2">
                      {centers.filter((center) => center.city === city).map((center) => (
                        <div key={center.id} className="rounded-md border border-slate-800 bg-black/20 p-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-medium">{center.label}</span>
                            <Badge variant={center.active ? "default" : "outline"}>{center.active ? "open" : "locked"}</Badge>
                          </div>
                          <p className="mt-1 text-[11px] text-slate-500">{center.story}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-emerald-500/20 bg-slate-950/80 text-slate-100">
            <CardHeader>
              <CardTitle>Gnome Gate Samples</CardTitle>
              <CardDescription className="text-slate-400">
                The backend package maps 64 gates into centers, elements, levels, and fused forms.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                {gnomeSamples.map((gnome) => (
                  <div key={gnome.gate} className="rounded-md border border-slate-800 bg-slate-900/70 p-3">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-amber-300" />
                      <p className="text-sm font-semibold">Gate {gnome.gate}</p>
                    </div>
                    <p className="mt-1 text-xs text-slate-400">{gnome.element} • {gnome.center}</p>
                  </div>
                ))}
              </div>
              <Button className="mt-4" variant="outline">
                <Wand2 className="mr-2 h-4 w-4" />
                Progression API pending
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
