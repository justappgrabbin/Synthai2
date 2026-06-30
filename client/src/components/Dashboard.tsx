import { useLocation } from "wouter";
import { useRef, useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Code2, Play, Bot, Settings, Store, Clock, Sparkles, ArrowRight, FileEdit, FolderTree, Terminal as TerminalIcon, Zap, Brain, Orbit, Rocket, Globe, Cpu, Palette, Gamepad2, MessageSquare, BookOpen, type LucideIcon } from "lucide-react";
import { AppRegistry, type AppModule } from "@/lib/appRegistry";
import { ActivityTracker, type AppActivity } from "@/lib/activityTracker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { WorkspaceOrganizer } from "@/components/WorkspaceOrganizer";
import { SelfEditor } from "@/components/SelfEditor";
import { CommandCenter } from "@/components/CommandCenter";
import { getMeshStatus, publishMeshEvent, type MeshStatus } from "@/lib/meshEvents";
import { systemApi, type AppRunResult, type McpStatus, type MountedApp, type StudioHealth } from "@/lib/systemApi";
import { publishMeshNode } from "@/lib/meshAddressing";
import { toggleAssistant } from "@/lib/assistantDock";
import { OSSetupPanel } from "@/components/OSSetupPanel";
import { GrimoirePanel } from "@/components/GrimoirePanel";
import { BodyView } from "@/components/BodyView";
import { CynthiaBodyLayer } from "@/components/CynthiaBodyLayer";

const CORE_APPS: AppModule[] = [
  {
    id: "ide",
    name: "Launch IDE",
    description: "Code editor & developer environment",
    path: "/ide",
    icon: Code2,
    variant: "primary",
    type: "core",
    version: "1.0.0"
  },
  {
    id: "grove-store",
    name: "Grove Store",
    description: "Discover community apps, agents & templates",
    path: "/grove-store",
    icon: Store,
    variant: "primary",
    type: "core",
    version: "1.0.0"
  },
  {
    id: "zip-manager",
    name: "Ingest & Mount",
    description: "Upload, analyze, preserve, regenerate, and mount files",
    path: "/ingest",
    icon: FolderTree,
    variant: "primary",
    type: "core",
    version: "1.0.0"
  },
  {
    id: "agents",
    name: "Agent Creator",
    description: "Build & manage AI agents",
    path: "/agents",
    icon: Bot,
    type: "core",
    version: "1.0.0"
  },
  {
    id: "settings",
    name: "Settings",
    description: "Configure AI backends & preferences",
    path: "/settings",
    icon: Settings,
    type: "core",
    version: "1.0.0"
  }
];

const FLAGSHIP_FEATURES = [
  {
    id: "universe-creator",
    title: "Semantic Universe Creator",
    description: "Transform text into playable 3D worlds using seven-layer consciousness framework",
    icon: Globe,
    path: "/universe-creator"
  },
  {
    id: "calibration-tank",
    title: "Consciousness Calibration Tank",
    description: "Build multi-model neural networks with visual connection builder and auto-code generation",
    icon: Brain,
    path: "/calibration-tank"
  },
  {
    id: "gan-trainer",
    title: "GAN Trainer",
    description: "Train generative adversarial networks for creative AI model development",
    icon: Cpu,
    path: "/gan-trainer"
  },
  {
    id: "autonomy",
    title: "Autonomy Control Center",
    description: "System self-development with Fu Xi I-Ching codon-based proposal generation",
    icon: Orbit,
    path: "/autonomy"
  },
  {
    id: "mod-manager",
    title: "Deployment Hub",
    description: "Deploy to Netlify, push to GitHub, export to Google Drive with one-click",
    icon: Rocket,
    path: "/mod-manager"
  },
  {
    id: "game-creator",
    title: "Game Creator",
    description: "Build interactive experiences with templates and visual tools",
    icon: Palette,
    path: "/game-creator"
  }
];

type TrayItem = {
  id: string;
  label: string;
  icon: LucideIcon;
  path?: string;
  action?: () => void;
};

type OSPerspective = "overview" | "notebook" | "body-world" | "setup";
type OSWidgetId = "runtime" | "proof-loop" | "recent" | "engines";
type BodyLayer = "map" | "story";

const OS_TRAY_ITEMS: TrayItem[] = [
  { id: "ide", label: "IDE", icon: Code2, path: "/ide" },
  { id: "mesh", label: "Mesh", icon: Orbit, path: "/mesh" },
  { id: "ingest", label: "Ingest", icon: FolderTree, path: "/ingest" },
  { id: "games", label: "Games", icon: Gamepad2, path: "/game-creator" },
  { id: "guard", label: "Guard", icon: MessageSquare, action: toggleAssistant },
  { id: "store", label: "Store", icon: Store, path: "/grove-store" },
  { id: "setup", label: "Setup", icon: Settings, path: "/settings" },
];

const DEFAULT_TRAY_ORDER = OS_TRAY_ITEMS.map((item) => item.id);

const OS_WIDGETS: Array<{ id: OSWidgetId; label: string; description: string; icon: LucideIcon }> = [
  { id: "runtime", label: "Runtime Status", description: "Studio, mesh, Linux, Python, MCP, and mounted app status.", icon: Orbit },
  { id: "proof-loop", label: "Proof Loop", description: "Mount and run a tiny app through the Linux bridge.", icon: Play },
  { id: "recent", label: "Recent Activity", description: "Return to apps and tools you opened recently.", icon: Clock },
  { id: "engines", label: "Consciousness Engine", description: "Universe, calibration, GAN, autonomy, deploy, and game creator launchers.", icon: Brain },
];

const DEFAULT_WIDGET_ORDER = OS_WIDGETS.map((item) => item.id);

function readStoredStringArray(key: string, fallback: string[]) {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return fallback;
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === "string") : fallback;
  } catch {
    return fallback;
  }
}

export function Dashboard() {
  const [, setLocation] = useLocation();
  const [apps, setApps] = useState<AppModule[]>(CORE_APPS);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [activePerspective, setActivePerspective] = useState<OSPerspective>(() => {
    const stored = localStorage.getItem("youniverse_active_perspective");
    return stored === "notebook" || stored === "body-world" || stored === "setup" ? stored : "overview";
  });
  const [isEditingShell, setIsEditingShell] = useState(false);
  const [trayOrder, setTrayOrder] = useState<string[]>(() => readStoredStringArray("youniverse_os_tray_order", DEFAULT_TRAY_ORDER));
  const [hiddenTrayItems, setHiddenTrayItems] = useState<string[]>(() => readStoredStringArray("youniverse_os_tray_hidden", []));
  const [widgetOrder, setWidgetOrder] = useState<string[]>(() => readStoredStringArray("youniverse_os_widget_order", DEFAULT_WIDGET_ORDER));
  const [hiddenWidgets, setHiddenWidgets] = useState<string[]>(() => readStoredStringArray("youniverse_os_widget_hidden", []));
  const [bodyLayer, setBodyLayer] = useState<BodyLayer>("story");
  const [recentlyVisited, setRecentlyVisited] = useState<AppActivity[]>([]);
  const [showWorkspaceDialog, setShowWorkspaceDialog] = useState(false);
  const [showSelfEditorDialog, setShowSelfEditorDialog] = useState(false);
  const [showCommandCenterDialog, setShowCommandCenterDialog] = useState(false);
  const [meshStatus, setMeshStatus] = useState<MeshStatus | null>(null);
  const [health, setHealth] = useState<StudioHealth | null>(null);
  const [mcpStatus, setMcpStatus] = useState<McpStatus | null>(null);
  const [mountedApps, setMountedApps] = useState<MountedApp[]>([]);
  const [smokeRun, setSmokeRun] = useState<AppRunResult | null>(null);
  const [systemError, setSystemError] = useState("");
  const [isSystemBusy, setIsSystemBusy] = useState(false);

  const refreshSystemStatus = async () => {
    setSystemError("");
    try {
      const [nextMesh, nextHealth, nextMcp, nextApps] = await Promise.all([
        getMeshStatus(),
        systemApi.health(),
        systemApi.mcpStatus(),
        systemApi.apps(),
      ]);
      setMeshStatus(nextMesh);
      setHealth(nextHealth);
      setMcpStatus(nextMcp);
      setMountedApps(nextApps.apps || []);
    } catch (error) {
      setSystemError(error instanceof Error ? error.message : String(error));
    }
  };

  useEffect(() => {
    const customApps = AppRegistry.getInstalledApps();
    if (customApps.length > 0) {
      setApps([...CORE_APPS, ...customApps]);
    }

    setRecentlyVisited(ActivityTracker.getRecentlyVisited(4));
    refreshSystemStatus();
  }, []);

  useEffect(() => {
    localStorage.setItem("youniverse_os_tray_order", JSON.stringify(trayOrder));
  }, [trayOrder]);

  useEffect(() => {
    localStorage.setItem("youniverse_os_tray_hidden", JSON.stringify(hiddenTrayItems));
  }, [hiddenTrayItems]);

  useEffect(() => {
    localStorage.setItem("youniverse_os_widget_order", JSON.stringify(widgetOrder));
  }, [widgetOrder]);

  useEffect(() => {
    localStorage.setItem("youniverse_os_widget_hidden", JSON.stringify(hiddenWidgets));
  }, [hiddenWidgets]);

  const runSmokeMount = async () => {
    setIsSystemBusy(true);
    setSystemError("");
    setSmokeRun(null);
    try {
      const mounted = await systemApi.mountApp({
        name: "dashboard-smoke-app",
        runCommand: "node hello.js",
        files: [{ path: "hello.js", content: "console.log('mounted app ok')\n" }],
      });
      const result = await systemApi.runApp(mounted.app.id);
      setSmokeRun(result);
      await refreshSystemStatus();
    } catch (error) {
      setSystemError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsSystemBusy(false);
    }
  };

  const handleAppClick = (appId: string, appName: string, appType: string, path: string) => {
    ActivityTracker.recordVisit(appId, appName, appType);
    publishMeshNode({
      kind: "app",
      domain: "os",
      parent: "dashboard",
      name: appId,
      purpose: appName,
      tags: [appType, "launchable"],
      payload: { appId, appName, appType, path },
    }, "app.launched");
    publishMeshEvent({
      source: "dashboard",
      type: "studio.launch",
      topic: appId,
      payload: { appId, appName, appType, path },
    });
    setLocation(path);
  };

  const launchTrayItem = (item: TrayItem) => {
    if (item.action) {
      item.action();
      return;
    }
    handleAppClick(item.id, item.label, "tray", item.path || "/");
  };

  const visibleTrayItems = trayOrder
    .map((id) => OS_TRAY_ITEMS.find((item) => item.id === id))
    .filter((item): item is TrayItem => Boolean(item))
    .filter((item) => !hiddenTrayItems.includes(item.id));

  const availableTrayItems = OS_TRAY_ITEMS.filter((item) => hiddenTrayItems.includes(item.id));

  const visibleWidgets = widgetOrder
    .map((id) => OS_WIDGETS.find((item) => item.id === id))
    .filter((item): item is typeof OS_WIDGETS[number] => Boolean(item))
    .filter((item) => !hiddenWidgets.includes(item.id));

  const availableWidgets = OS_WIDGETS.filter((item) => hiddenWidgets.includes(item.id));

  const startShellLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
    longPressTimer.current = setTimeout(() => setIsEditingShell(true), 550);
  };

  const cancelShellLongPress = () => {
    if (!longPressTimer.current) return;
    clearTimeout(longPressTimer.current);
    longPressTimer.current = null;
  };

  const moveItem = (id: string, direction: -1 | 1, items: string[], setItems: (next: string[]) => void) => {
    const index = items.indexOf(id);
    const nextIndex = index + direction;
    if (index < 0 || nextIndex < 0 || nextIndex >= items.length) return;
    const next = [...items];
    [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
    setItems(next);
  };

  const resetShellLayout = () => {
    setTrayOrder(DEFAULT_TRAY_ORDER);
    setHiddenTrayItems([]);
    setWidgetOrder(DEFAULT_WIDGET_ORDER);
    setHiddenWidgets([]);
    setIsEditingShell(false);
  };

  const switchPerspective = (perspective: OSPerspective) => {
    setActivePerspective(perspective);
    localStorage.setItem("youniverse_active_perspective", perspective);
    publishMeshEvent({
      source: "dashboard",
      type: "os.perspective.changed",
      topic: perspective,
      payload: { perspective },
    });
  };

  const getIconForApp = (appId: string) => {
    const app = [...CORE_APPS, ...AppRegistry.getInstalledApps()].find(a => a.id === appId);
    return app?.icon || Code2;
  };

  const getPathForApp = (appId: string) => {
    const app = [...CORE_APPS, ...AppRegistry.getInstalledApps()].find(a => a.id === appId);
    return app?.path || `/${appId}`;
  };

  const perspectiveButtons: Array<{ id: OSPerspective; label: string; icon: LucideIcon; description: string }> = [
    { id: "overview", label: "Overview", icon: Orbit, description: "Shell status, tray, and launch surface" },
    { id: "notebook", label: "Notebook", icon: BookOpen, description: "Grimoire as a creator notebook" },
    { id: "body-world", label: "Body World", icon: Gamepad2, description: "Bodygraph as a traversable node map" },
    { id: "setup", label: "Setup", icon: Settings, description: "Register and enable OS perspectives" },
  ];

  return (
    <div className="min-h-screen bg-background" data-testid="synthia-os-shell">
      <section className="relative min-h-screen overflow-hidden border-b bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.16),transparent_34%),linear-gradient(135deg,hsl(var(--background)),hsl(var(--muted)/0.72))] px-4 pb-32 pt-4 md:px-8">
        <div className="mx-auto flex min-h-[calc(100vh-9rem)] max-w-7xl flex-col">
          <header className="flex items-center justify-between gap-3 rounded-lg border bg-background/84 px-3 py-3 shadow-sm backdrop-blur md:px-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Synthia OS</p>
              <p className="truncate text-sm text-muted-foreground">Phone shell • mesh online • container bridge ready</p>
            </div>
            <div className="flex items-center gap-2">
              {isEditingShell && (
                <Button variant="outline" size="sm" onClick={resetShellLayout}>
                  Reset Layout
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={refreshSystemStatus} disabled={isSystemBusy}>
                Refresh
              </Button>
              <Button size="sm" onClick={() => setIsEditingShell((editing) => !editing)}>
                {isEditingShell ? "Done" : "Edit"}
              </Button>
            </div>
          </header>

          <main className="grid flex-1 gap-6 py-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div className="space-y-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Home Frame</p>
                <h1 className="mt-3 text-4xl font-bold text-foreground md:text-6xl" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  Your OS is the start screen.
                </h1>
                <p className="mt-4 max-w-2xl text-base text-foreground/78 md:text-lg">
                  Launch apps from the tray, route everything through the mesh, and keep the Verse as the slide-up reality layer instead of a separate homepage.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-lg border bg-background/82 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Mesh</p>
                  <p className="text-lg font-semibold">{meshStatus?.status || health?.mesh?.status || "checking"}</p>
                </div>
                <div className="rounded-lg border bg-background/82 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Linux</p>
                  <p className="text-lg font-semibold">{health?.container?.enabled ? "ready" : "checking"}</p>
                </div>
                <div className="rounded-lg border bg-background/82 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Python</p>
                  <p className="text-lg font-semibold">{health?.python?.running ? "running" : "checking"}</p>
                </div>
                <div className="rounded-lg border bg-background/82 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Apps</p>
                  <p className="text-lg font-semibold">{health?.apps?.mounted ?? mountedApps.length}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button size="lg" onClick={() => handleAppClick("ide", "IDE Studio", "core", "/ide")} data-testid="button-hero-ide">
                  <Code2 className="mr-2 h-5 w-5" />
                  Build
                </Button>
                <Button size="lg" variant="outline" onClick={() => handleAppClick("ingest", "Ingest", "core", "/ingest")} data-testid="button-hero-ingest">
                  <FolderTree className="mr-2 h-5 w-5" />
                  Ingest
                </Button>
                <Button size="lg" variant="outline" onClick={() => setShowCommandCenterDialog(true)} data-testid="button-hero-command">
                  <TerminalIcon className="mr-2 h-5 w-5" />
                  Terminal
                </Button>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                {perspectiveButtons.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => switchPerspective(item.id)}
                    className={`rounded-lg border p-3 text-left transition-all ${
                      activePerspective === item.id
                        ? "border-primary bg-primary text-primary-foreground shadow-md"
                        : "bg-background/82 hover:border-primary"
                    }`}
                    data-testid={`button-os-perspective-${item.id}`}
                  >
                    <div className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      <span className="text-sm font-semibold">{item.label}</span>
                    </div>
                    <p className={`mt-1 text-xs ${activePerspective === item.id ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                      {item.description}
                    </p>
                  </button>
                ))}
              </div>

              <div
                className="rounded-lg border bg-background/82 p-3"
                onPointerDown={startShellLongPress}
                onPointerUp={cancelShellLongPress}
                onPointerLeave={cancelShellLongPress}
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">Widgets</p>
                    <p className="text-xs text-muted-foreground">
                      {isEditingShell ? "Move or remove widgets." : "Long press to customize widgets."}
                    </p>
                  </div>
                  {!isEditingShell && (
                    <Button variant="outline" size="sm" onClick={() => setIsEditingShell(true)}>
                      Customize
                    </Button>
                  )}
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {visibleWidgets.map((widget) => (
                    <div key={widget.id} className="rounded-md border bg-card p-3">
                      {isEditingShell && (
                        <div className="mb-2 flex gap-1">
                          <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => moveItem(widget.id, -1, widgetOrder, setWidgetOrder)} title="Move up">
                            ←
                          </Button>
                          <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => moveItem(widget.id, 1, widgetOrder, setWidgetOrder)} title="Move down">
                            →
                          </Button>
                          <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => setHiddenWidgets((hidden) => [...new Set([...hidden, widget.id])])} title="Remove">
                            ×
                          </Button>
                        </div>
                      )}
                      <div className="flex items-start gap-2">
                        <widget.icon className="mt-0.5 h-4 w-4 text-primary" />
                        <div>
                          <p className="text-sm font-medium">{widget.label}</p>
                          <p className="text-xs text-muted-foreground">{widget.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {isEditingShell && availableWidgets.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {availableWidgets.map((widget) => (
                      <Button
                        key={widget.id}
                        variant="outline"
                        size="sm"
                        onClick={() => setHiddenWidgets((hidden) => hidden.filter((id) => id !== widget.id))}
                      >
                        <widget.icon className="mr-2 h-4 w-4" />
                        Add {widget.label}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-lg border bg-card/92 p-4 shadow-lg backdrop-blur">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">App Tray</p>
                  <p className="text-xs text-muted-foreground">
                    {isEditingShell ? "Move or remove apps. Long press any tile to edit." : "Long press any tile to edit the OS."}
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleAppClick("mesh", "Mesh Registry", "core", "/mesh")}>
                  Mesh
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {visibleTrayItems.map((item) => (
                  <button
                    key={item.id}
                    className="flex min-h-24 flex-col items-center justify-center rounded-lg border bg-background p-3 text-center transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-md"
                    onClick={() => launchTrayItem(item)}
                    onPointerDown={startShellLongPress}
                    onPointerUp={cancelShellLongPress}
                    onPointerLeave={cancelShellLongPress}
                    data-testid={`button-app-tray-${item.id}`}
                  >
                    {isEditingShell && (
                      <div className="mb-2 flex gap-1" onClick={(event) => event.stopPropagation()}>
                        <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => moveItem(item.id, -1, trayOrder, setTrayOrder)} title="Move left">
                          ←
                        </Button>
                        <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => moveItem(item.id, 1, trayOrder, setTrayOrder)} title="Move right">
                          →
                        </Button>
                        <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => setHiddenTrayItems((hidden) => [...new Set([...hidden, item.id])])} title="Remove">
                          ×
                        </Button>
                      </div>
                    )}
                    <item.icon className="mb-2 h-6 w-6 text-primary" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </button>
                ))}
              </div>
              {isEditingShell && availableTrayItems.length > 0 && (
                <div className="mt-4 rounded-lg border bg-background/70 p-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Add Apps</p>
                  <div className="flex flex-wrap gap-2">
                    {availableTrayItems.map((item) => (
                      <Button
                        key={item.id}
                        variant="outline"
                        size="sm"
                        onClick={() => setHiddenTrayItems((hidden) => hidden.filter((id) => id !== item.id))}
                      >
                        <item.icon className="mr-2 h-4 w-4" />
                        {item.label}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>

        <nav className="fixed bottom-3 left-1/2 z-[90] w-[calc(100%-1rem)] max-w-xl -translate-x-1/2 rounded-lg border bg-background/95 px-2 py-2 shadow-xl backdrop-blur" aria-label="Synthia OS dock">
          <div className="grid grid-cols-5 gap-1">
            {visibleTrayItems.filter((item) => ["mesh", "ingest", "guard", "store", "setup"].includes(item.id)).slice(0, 5).map((item) => (
              <button
                key={item.id}
                className="flex h-14 flex-col items-center justify-center rounded-md px-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
                onClick={() => launchTrayItem(item)}
                onPointerDown={startShellLongPress}
                onPointerUp={cancelShellLongPress}
                onPointerLeave={cancelShellLongPress}
                data-testid={`button-os-dock-${item.id}`}
              >
                <item.icon className="mb-1 h-4 w-4" />
                {item.label}
              </button>
            ))}
          </div>
        </nav>
      </section>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 pb-28">
        {activePerspective !== "overview" && (
          <Card className="mb-6 overflow-hidden border-primary/30" data-testid="card-os-perspective-view">
            <CardHeader>
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle>
                    {activePerspective === "notebook" && "Creator Notebook"}
                    {activePerspective === "body-world" && "Body World Map"}
                    {activePerspective === "setup" && "OS Perspective Setup"}
                  </CardTitle>
                  <CardDescription>
                    {activePerspective === "notebook" && "The grimoire mounted as an OS notebook perspective."}
                    {activePerspective === "body-world" && "The bodygraph mounted as a game-like spatial map."}
                    {activePerspective === "setup" && "Register alternate views without turning them into scattered pages."}
                  </CardDescription>
                </div>
                <Button variant="outline" onClick={() => switchPerspective("overview")}>
                  Return to Overview
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {activePerspective === "notebook" && (
                <div className="h-[75vh] min-h-[560px] overflow-hidden">
                  <GrimoirePanel />
                </div>
              )}
              {activePerspective === "body-world" && (
                <div className="h-[75vh] min-h-[560px] overflow-hidden">
                  <div className="flex h-12 items-center gap-2 border-b bg-background px-3">
                    <Button variant={bodyLayer === "story" ? "default" : "outline"} size="sm" onClick={() => setBodyLayer("story")}>
                      Cynthia Story
                    </Button>
                    <Button variant={bodyLayer === "map" ? "default" : "outline"} size="sm" onClick={() => setBodyLayer("map")}>
                      Body Map
                    </Button>
                  </div>
                  <div className="h-[calc(75vh-3rem)] min-h-[512px] overflow-hidden">
                    {bodyLayer === "story" ? <CynthiaBodyLayer /> : <BodyView />}
                  </div>
                </div>
              )}
              {activePerspective === "setup" && (
                <div className="p-4">
                  <OSSetupPanel />
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card className="mb-6 border-primary/30" data-testid="card-os-status">
          <CardHeader>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Orbit className="h-5 w-5 text-primary" />
                  <CardTitle>OS Runtime Status</CardTitle>
                </div>
                <CardDescription>Live bridge status for Studio, mesh, Synthia, Python, Linux execution, and mounted apps</CardDescription>
              </div>
              <Button variant="outline" onClick={refreshSystemStatus} disabled={isSystemBusy}>
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-3">
              <div className="rounded-lg border bg-card p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Studio</p>
                <p className="text-lg font-semibold">{health?.status || "checking"}</p>
                <p className="text-xs text-muted-foreground truncate">{health?.service || "API"}</p>
              </div>
              <div className="rounded-lg border bg-card p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Mesh</p>
                <p className="text-lg font-semibold">{meshStatus?.status || health?.mesh?.status || "checking"}</p>
                <p className="text-xs text-muted-foreground">{meshStatus?.events ?? health?.mesh?.events ?? 0} events</p>
              </div>
              <div className="rounded-lg border bg-card p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Runtime</p>
                <p className="text-lg font-semibold">{health?.container?.enabled ? "enabled" : "checking"}</p>
                <p className="text-xs text-muted-foreground truncate">{health?.container?.shell || "shell"}</p>
              </div>
              <div className="rounded-lg border bg-card p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Python</p>
                <p className="text-lg font-semibold">{health?.python?.running ? "running" : "checking"}</p>
                <p className="text-xs text-muted-foreground truncate">{health?.python?.url || "proxy pending"}</p>
              </div>
              <div className="rounded-lg border bg-card p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">MCP</p>
                <p className="text-lg font-semibold">{mcpStatus?.ok ? "bus ready" : "checking"}</p>
                <p className="text-xs text-muted-foreground truncate">{mcpStatus?.transport || "http-json"}</p>
              </div>
              <div className="rounded-lg border bg-card p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Mounted Apps</p>
                <p className="text-lg font-semibold">{health?.apps?.mounted ?? mountedApps.length}</p>
                <p className="text-xs text-muted-foreground">tray-ready</p>
              </div>
            </div>
            <div className="mt-4 flex flex-col gap-3 rounded-lg border bg-background/60 p-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-medium">Proof Loop</p>
                <p className="text-sm text-muted-foreground">
                  Mount a tiny app into `/workspace/apps`, run it through Linux, and publish mesh events.
                </p>
                {smokeRun && (
                  <p className="mt-2 font-mono text-xs text-primary">
                    exit {smokeRun.run.code}: {smokeRun.run.stdout.trim() || smokeRun.run.stderr.trim()}
                  </p>
                )}
                {systemError && <p className="mt-2 text-xs text-destructive">{systemError}</p>}
              </div>
              <Button onClick={runSmokeMount} disabled={isSystemBusy}>
                {isSystemBusy ? "Running..." : "Run Mount Test"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recently Visited */}
        {recentlyVisited.length > 0 && (
          <Card className="mb-6" data-testid="card-recent-apps">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                <CardTitle>Recent Activity</CardTitle>
              </div>
              <CardDescription>Pick up where you left off</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {recentlyVisited.map((activity) => (
                  <ActivityCard
                    key={activity.appId}
                    activity={activity}
                    icon={getIconForApp(activity.appId)}
                    onClick={() => handleAppClick(
                      activity.appId,
                      activity.appName,
                      activity.appType,
                      getPathForApp(activity.appId)
                    )}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Flagship Features - Consciousness Engine */}
        <Card className="mb-6 border-primary/30" data-testid="card-flagship-features">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Brain className="h-6 w-6 text-primary" />
              <CardTitle className="text-2xl">Consciousness Engine</CardTitle>
            </div>
            <CardDescription>Transformative tools powered by semantic awareness and neural architecture</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {FLAGSHIP_FEATURES.map((feature) => (
                <button
                  key={feature.id}
                  data-testid={`button-flagship-${feature.id}`}
                  onClick={() => setLocation(feature.path)}
                  className="group relative h-48 rounded-lg border-2 border-border bg-card hover:border-primary transition-all duration-300 hover:scale-105 hover:shadow-xl overflow-hidden"
                >
                  <div className="relative flex flex-col items-start justify-between h-full p-6 text-left">
                    <div>
                      <feature.icon className="h-10 w-10 mb-3 text-primary" />
                      <h3 className="text-lg font-semibold mb-2 text-foreground">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-primary text-sm font-medium mt-2">
                      <span>Launch</span>
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Tools */}
        <Card className="mb-6" data-testid="card-quick-tools">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              <CardTitle>Quick Tools</CardTitle>
            </div>
            <CardDescription>Organize workspace and edit code without leaving the dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                data-testid="button-open-workspace"
                onClick={() => setShowWorkspaceDialog(true)}
                className="group relative h-32 rounded-lg border-2 bg-card border-border hover:border-primary transition-all duration-300 hover:scale-105 hover:shadow-lg"
              >
                <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                  <FolderTree className="h-10 w-10 mb-3 text-primary" />
                  <h3 className="text-base font-semibold mb-1">Workspace Organizer</h3>
                  <p className="text-sm text-muted-foreground">Manage project files</p>
                </div>
              </button>
              <button
                data-testid="button-open-self-editor"
                onClick={() => setShowSelfEditorDialog(true)}
                className="group relative h-32 rounded-lg border-2 bg-card border-border hover:border-primary transition-all duration-300 hover:scale-105 hover:shadow-lg"
              >
                <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                  <FileEdit className="h-10 w-10 mb-3 text-primary" />
                  <h3 className="text-base font-semibold mb-1">Self Editor</h3>
                  <p className="text-sm text-muted-foreground">Edit source code</p>
                </div>
              </button>
              <button
                data-testid="button-open-command-center"
                onClick={() => setShowCommandCenterDialog(true)}
                className="group relative h-32 rounded-lg border-2 bg-primary/10 border-primary hover:border-primary transition-all duration-300 hover:scale-105 hover:shadow-lg"
              >
                <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                  <TerminalIcon className="h-10 w-10 mb-3 text-primary" />
                  <h3 className="text-base font-semibold mb-1">Command Center</h3>
                  <p className="text-sm text-muted-foreground">Search & launch tools</p>
                </div>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Core Apps */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Launch Pad</CardTitle>
            <CardDescription>Essential creative tools and platform utilities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {apps.map((app) => (
                <PortalButton
                  key={app.id}
                  icon={app.icon}
                  title={app.name}
                  description={app.description}
                  onClick={() => handleAppClick(app.id, app.name, app.type, app.path)}
                  variant={app.variant}
                  testId={`button-portal-${app.id}`}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center space-y-2">
          <div className="flex items-center justify-center gap-2 text-primary">
            <Sparkles className="h-4 w-4 animate-pulse" />
            <p className="text-sm font-medium">Welcome to your cosmic creative workspace</p>
            <Sparkles className="h-4 w-4 animate-pulse" />
          </div>
          <p className="text-xs text-muted-foreground">
            Gateway v1.0.0 • {apps.length} modules • Powered by consciousness
          </p>
        </div>
      </div>

      {/* Workspace Organizer Dialog */}
      <Dialog open={showWorkspaceDialog} onOpenChange={setShowWorkspaceDialog}>
        <DialogContent className="max-w-6xl max-h-[90vh] p-0">
          <DialogHeader className="p-6 pb-4">
            <DialogTitle className="flex items-center gap-2">
              <FolderTree className="h-5 w-5 text-primary" />
              Workspace Organizer
            </DialogTitle>
            <DialogDescription>
              Manage your project files and folders
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-auto max-h-[calc(90vh-120px)]">
            <WorkspaceOrganizer />
          </div>
        </DialogContent>
      </Dialog>

      {/* Self Editor Dialog */}
      <Dialog open={showSelfEditorDialog} onOpenChange={setShowSelfEditorDialog}>
        <DialogContent className="max-w-6xl max-h-[90vh] p-0">
          <DialogHeader className="p-6 pb-4">
            <DialogTitle className="flex items-center gap-2">
              <FileEdit className="h-5 w-5 text-primary" />
              Self Editor
            </DialogTitle>
            <DialogDescription>
              Edit the source code of YOU–N–I–VERSE Studio itself
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-auto max-h-[calc(90vh-120px)]">
            <SelfEditor />
          </div>
        </DialogContent>
      </Dialog>

      {/* Command Center Dialog */}
      <Dialog open={showCommandCenterDialog} onOpenChange={setShowCommandCenterDialog}>
        <DialogContent className="max-w-6xl max-h-[90vh] p-0">
          <div className="overflow-auto max-h-[90vh]">
            <CommandCenter />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface ActivityCardProps {
  activity: AppActivity;
  icon: LucideIcon | string;
  onClick: () => void;
}

function ActivityCard({ activity, icon: Icon, onClick }: ActivityCardProps) {
  const isImageIcon = typeof Icon === 'string';
  const timeAgo = (date: string) => {
    if (!date) return 'New';
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <button
      onClick={onClick}
      data-testid={`activity-card-${activity.appId}`}
      className="flex items-center gap-3 p-3 rounded-md border bg-card hover-elevate active-elevate-2 text-left transition-all"
    >
      <div className="flex-shrink-0">
        {isImageIcon ? (
          <img src={Icon as string} alt={activity.appName} className="h-8 w-8 object-contain" />
        ) : (
          <Icon className="h-8 w-8 text-primary" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{activity.appName}</p>
        <p className="text-xs text-muted-foreground">{timeAgo(activity.lastVisited)}</p>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
    </button>
  );
}

interface PortalButtonProps {
  icon: LucideIcon | string;
  title: string;
  description: string;
  onClick: () => void;
  variant?: "primary" | "default";
  testId?: string;
}

function PortalButton({ icon: Icon, title, description, onClick, variant = "default", testId }: PortalButtonProps) {
  const isImageIcon = typeof Icon === 'string';
  
  return (
    <button
      data-testid={testId}
      onClick={onClick}
      className={`group relative h-40 rounded-lg border-2 transition-all duration-300 hover:scale-105 hover:shadow-xl ${
        variant === "primary"
          ? "bg-primary border-primary text-white hover:bg-primary/90"
          : "bg-card border-border hover:border-primary"
      }`}
    >
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        {isImageIcon ? (
          <img 
            src={Icon as string} 
            alt={title} 
            className="h-12 w-12 mb-4 object-contain" 
          />
        ) : (
          <Icon className={`h-12 w-12 mb-4 ${variant === "primary" ? "text-white" : "text-primary"}`} />
        )}
        <h3 className={`text-lg font-semibold mb-2 ${variant === "primary" ? "text-white" : "text-foreground"}`}>
          {title}
        </h3>
        <p className={`text-sm ${variant === "primary" ? "text-white/80" : "text-muted-foreground"}`}>
          {description}
        </p>
      </div>
    </button>
  );
}
