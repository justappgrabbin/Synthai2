import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, Gamepad2, Layers, Network, Plus, Settings2 } from "lucide-react";

type PerspectiveType = "shell" | "notebook" | "body-world" | "mesh-admin" | "studio" | "custom";
type NodeKind = "system" | "person" | "place" | "thing" | "app" | "file" | "game" | "tool";

interface PerspectiveConfig {
  id: string;
  name: string;
  type: PerspectiveType;
  nodeKind: NodeKind;
  mountPoint: string;
  description: string;
  enabled: boolean;
}

const STORAGE_KEY = "youniverse_os_perspectives";

const DEFAULT_PERSPECTIVES: PerspectiveConfig[] = [
  {
    id: "system-home",
    name: "OS Home",
    type: "shell",
    nodeKind: "system",
    mountPoint: "os/home",
    description: "Primary phone-first system shell and launch surface.",
    enabled: true,
  },
  {
    id: "creator-notebook",
    name: "Creator Notebook",
    type: "notebook",
    nodeKind: "file",
    mountPoint: "os/perspectives/notebook",
    description: "Grimoire rebased as a notebook/canvas perspective, not a standalone page.",
    enabled: true,
  },
  {
    id: "body-world",
    name: "Body World Map",
    type: "body-world",
    nodeKind: "place",
    mountPoint: "os/perspectives/body",
    description: "BodyGraph rebased as a traversable game map where body zones are node locations.",
    enabled: true,
  },
  {
    id: "mesh-admin",
    name: "Mesh Admin",
    type: "mesh-admin",
    nodeKind: "system",
    mountPoint: "os/admin/mesh",
    description: "Registry and addressing control for people, places, things, apps, and files.",
    enabled: true,
  },
];

const TYPE_LABELS: Record<PerspectiveType, string> = {
  shell: "OS Shell",
  notebook: "Notebook",
  "body-world": "Body World",
  "mesh-admin": "Mesh Admin",
  studio: "Studio",
  custom: "Custom",
};

const TYPE_ICONS: Record<PerspectiveType, typeof Layers> = {
  shell: Layers,
  notebook: BookOpen,
  "body-world": Gamepad2,
  "mesh-admin": Network,
  studio: Settings2,
  custom: Plus,
};

const emptyDraft: Omit<PerspectiveConfig, "id" | "enabled"> = {
  name: "",
  type: "custom",
  nodeKind: "app",
  mountPoint: "",
  description: "",
};

export function OSSetupPanel() {
  const { toast } = useToast();
  const [perspectives, setPerspectives] = useState<PerspectiveConfig[]>(DEFAULT_PERSPECTIVES);
  const [draft, setDraft] = useState(emptyDraft);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;

    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        setPerspectives(parsed);
      }
    } catch (error) {
      console.error("Failed to load OS perspectives:", error);
    }
  }, []);

  const savePerspectives = (next: PerspectiveConfig[]) => {
    setPerspectives(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const togglePerspective = (id: string, enabled: boolean) => {
    savePerspectives(perspectives.map((item) => item.id === id ? { ...item, enabled } : item));
  };

  const restoreDefaults = () => {
    savePerspectives(DEFAULT_PERSPECTIVES);
    toast({
      title: "OS setup restored",
      description: "Default perspectives are back in place.",
    });
  };

  const addPerspective = () => {
    if (!draft.name.trim() || !draft.mountPoint.trim()) {
      toast({
        title: "Missing setup details",
        description: "Add a name and mount point before saving the perspective.",
        variant: "destructive",
      });
      return;
    }

    const id = draft.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const nextPerspective: PerspectiveConfig = {
      ...draft,
      id: `${id || "perspective"}-${Date.now()}`,
      enabled: true,
    };

    savePerspectives([...perspectives, nextPerspective]);
    setDraft(emptyDraft);
    toast({
      title: "Perspective added",
      description: `${nextPerspective.name} is ready to be wired into the OS shell.`,
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-primary" />
            OS Setup
          </CardTitle>
          <CardDescription>
            Configure system perspectives without turning them into separate destination pages.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-lg border bg-muted/30 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Active Perspectives</p>
              <p className="mt-2 text-2xl font-semibold">{perspectives.filter((item) => item.enabled).length}</p>
            </div>
            <div className="rounded-lg border bg-muted/30 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Notebook Mode</p>
              <p className="mt-2 text-lg font-semibold">
                {perspectives.some((item) => item.type === "notebook" && item.enabled) ? "available" : "disabled"}
              </p>
            </div>
            <div className="rounded-lg border bg-muted/30 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Body World</p>
              <p className="mt-2 text-lg font-semibold">
                {perspectives.some((item) => item.type === "body-world" && item.enabled) ? "available" : "disabled"}
              </p>
            </div>
          </div>

          <div className="rounded-lg border bg-background/60 p-4">
            <p className="font-medium">How this should behave</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Grimoire becomes the Creator Notebook perspective. BodyGraph becomes a traversable Body World perspective.
              Both attach to mesh nodes and OS areas instead of appearing as extra nav pages.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {perspectives.map((perspective) => {
          const Icon = TYPE_ICONS[perspective.type];
          return (
            <Card key={perspective.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold">{perspective.name}</h3>
                        <Badge variant="secondary">{TYPE_LABELS[perspective.type]}</Badge>
                        <Badge variant="outline">{perspective.nodeKind}</Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{perspective.description}</p>
                      <p className="mt-2 font-mono text-xs text-primary">{perspective.mountPoint}</p>
                    </div>
                  </div>
                  <Switch
                    checked={perspective.enabled}
                    onCheckedChange={(enabled) => togglePerspective(perspective.id, enabled)}
                    aria-label={`Toggle ${perspective.name}`}
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            Add Perspective
          </CardTitle>
          <CardDescription>
            Register a future OS view, admin tool, node world, notebook, or creator surface.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="perspective-name">Name</Label>
            <Input
              id="perspective-name"
              value={draft.name}
              onChange={(event) => setDraft({ ...draft, name: event.target.value })}
              placeholder="Example: Dream Lab"
            />
          </div>
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={draft.type} onValueChange={(type: PerspectiveType) => setDraft({ ...draft, type })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Node Kind</Label>
            <Select value={draft.nodeKind} onValueChange={(nodeKind: NodeKind) => setDraft({ ...draft, nodeKind })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["system", "person", "place", "thing", "app", "file", "game", "tool"].map((kind) => (
                  <SelectItem key={kind} value={kind}>{kind}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="perspective-mount">Mount Point</Label>
            <Input
              id="perspective-mount"
              value={draft.mountPoint}
              onChange={(event) => setDraft({ ...draft, mountPoint: event.target.value })}
              placeholder="os/perspectives/dream-lab"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="perspective-description">Purpose</Label>
            <Textarea
              id="perspective-description"
              value={draft.description}
              onChange={(event) => setDraft({ ...draft, description: event.target.value })}
              placeholder="What does this perspective let the user see, edit, visit, or build?"
            />
          </div>
          <div className="flex flex-wrap gap-2 md:col-span-2">
            <Button onClick={addPerspective}>Add Perspective</Button>
            <Button variant="outline" onClick={restoreDefaults}>Restore Defaults</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
