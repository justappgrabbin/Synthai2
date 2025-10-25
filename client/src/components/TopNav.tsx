import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Code2, Gamepad2, Play, Bot, Settings, Home, Store, Brain } from "lucide-react";

export function TopNav() {
  const [location, setLocation] = useLocation();

  const navItems = [
    { path: "/", label: "Dashboard", icon: Home },
    { path: "/grove-store", label: "Grove Store", icon: Store },
    { path: "/ide", label: "IDE", icon: Code2 },
    { path: "/game-creator", label: "Games", icon: Gamepad2 },
    { path: "/gan-trainer", label: "GAN Trainer", icon: Brain },
    { path: "/player", label: "Player", icon: Play },
    { path: "/agents", label: "Agents", icon: Bot },
    { path: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center h-14 px-4 gap-2">
        <div className="flex items-center gap-2 mr-4">
          <div className="h-6 w-6 rounded bg-lavender flex items-center justify-center">
            <span className="text-white text-xs font-bold">Y</span>
          </div>
          <span className="font-semibold text-sm hidden sm:inline">YOU–N–I–VERSE</span>
        </div>
        
        <div className="flex items-center gap-1 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path;
            
            return (
              <Button
                key={item.path}
                data-testid={`nav-${item.label.toLowerCase()}`}
                variant={isActive ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setLocation(item.path)}
                className={`gap-2 ${isActive ? "bg-lavender/10 text-lavender" : ""}`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{item.label}</span>
              </Button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
