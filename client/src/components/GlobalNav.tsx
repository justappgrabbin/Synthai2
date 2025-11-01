import { Link, useLocation } from "wouter";
import { Home, Code2, Store, FolderTree, Play, Bot, Settings, Palette, Gamepad2, Layers, Brain, Network } from "lucide-react";
import { Button } from "@/components/ui/button";

const NAV_ITEMS = [
  { path: "/", icon: Home, label: "Dashboard" },
  { path: "/ide", icon: Code2, label: "IDE" },
  { path: "/grove-store", icon: Store, label: "Grove Store" },
  { path: "/zip-manager", icon: FolderTree, label: "ZIP Manager" },
  { path: "/game-creator", icon: Gamepad2, label: "Games" },
  { path: "/gan-trainer", icon: Palette, label: "GAN" },
  { path: "/universe-creator", icon: Network, label: "Universe" },
  { path: "/calibration-tank", icon: Brain, label: "Calibration" },
  { path: "/player", icon: Play, label: "Player" },
  { path: "/agents", icon: Bot, label: "Agents" },
  { path: "/settings", icon: Settings, label: "Settings" },
];

export function GlobalNav() {
  const [location] = useLocation();

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center gap-2 px-4">
        <div className="flex items-center gap-2 mr-4">
          <Layers className="w-5 h-5 text-primary" />
          <span className="font-semibold text-sm hidden sm:inline">YOU-N-I-VERSE</span>
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
      </div>
    </nav>
  );
}
