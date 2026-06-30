import { Link, useLocation } from "wouter";
import { Home, Code2, Store, FolderTree, Play, Bot, Settings, Palette, Gamepad2, Layers, Brain, Rocket, Presentation, QrCode, Orbit, Upload, Network, PenTool } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/ThemeProvider";
import { Moon, Sun } from "lucide-react";

const NAV_ITEMS = [
  { path: "/", icon: Home, label: "Dashboard" },
  { path: "/grove-store", icon: Store, label: "Store" },
  { path: "/ide", icon: Code2, label: "IDE" },
  { path: "/zip-manager", icon: FolderTree, label: "ZIP Studio" },
  { path: "/ingest", icon: Upload, label: "Ingest" },
  { path: "/mesh", icon: Network, label: "Mesh" },
  { path: "/novel", icon: PenTool, label: "Novel" },
  { path: "/game-creator", icon: Gamepad2, label: "Games" },
  { path: "/gan-trainer", icon: Palette, label: "GAN" },
  { path: "/presentation-planner", icon: Presentation, label: "Planner" },
  { path: "/continuity-glyph", icon: QrCode, label: "Glyphs" },
  { path: "/calibration-tank", icon: Brain, label: "Cal Tank" },
  { path: "/universe-creator", icon: Layers, label: "Universes" },
  { path: "/autonomy", icon: Orbit, label: "Autonomy" },
  { path: "/player", icon: Play, label: "Player" },
  { path: "/agents", icon: Bot, label: "Agents" },
  { path: "/mod-manager", icon: Rocket, label: "Mods" },
  { path: "/settings", icon: Settings, label: "Settings" },
];

const MOBILE_DOCK_ITEMS = [
  { path: "/", icon: Home, label: "Home" },
  { path: "/ide", icon: Code2, label: "IDE" },
  { path: "/ingest", icon: Upload, label: "Ingest" },
  { path: "/game-creator", icon: Gamepad2, label: "Games" },
  { path: "/universe-creator", icon: Layers, label: "Worlds" },
];

export function GlobalNav() {
  const [location] = useLocation();
  const { theme, toggleTheme } = useTheme();

  return (
    <>
      <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center gap-2 px-4">
          <div className="flex items-center gap-2 mr-2">
            <Layers className="w-5 h-5 text-primary" />
            <span className="font-semibold text-sm hidden sm:inline">YOU-N-I-VERSE OS</span>
          </div>
          
          <div className="flex items-center gap-1 flex-1 overflow-x-auto">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.path;
              
              return (
                <Link key={item.path} href={item.path}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    size="sm"
                    className="gap-2 whitespace-nowrap"
                    data-testid={`nav-${item.label.toLowerCase()}`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden lg:inline">{item.label}</span>
                  </Button>
                </Link>
              );
            })}
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            data-testid="button-toggle-theme"
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>
        </div>
      </nav>

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur md:hidden">
        <div className="grid grid-cols-5 gap-1 px-2 py-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)]">
          {MOBILE_DOCK_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path;
            return (
              <Link key={item.path} href={item.path}>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  className="h-12 w-full flex-col gap-1 px-1 text-[11px]"
                  data-testid={`mobile-nav-${item.label.toLowerCase()}`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Button>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
