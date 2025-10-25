import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Code2, Gamepad2, Play, Bot, Settings, Store, Brain } from "lucide-react";
import { AppRegistry, type AppModule } from "@/lib/appRegistry";

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
    id: "gan-trainer",
    name: "GAN Trainer",
    description: "Train & deploy neural networks",
    path: "/gan-trainer",
    icon: Brain,
    variant: "primary",
    type: "core",
    version: "1.0.0"
  },
  {
    id: "game-creator",
    name: "Game Creator",
    description: "Access game templates & creation tools",
    path: "/game-creator",
    icon: Gamepad2,
    type: "core",
    version: "1.0.0"
  },
  {
    id: "player",
    name: "YOU–N–I–Versal Player",
    description: "Play & explore creative bundles",
    path: "/player",
    icon: Play,
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

export function Dashboard() {
  const [, setLocation] = useLocation();
  const [apps, setApps] = useState<AppModule[]>(CORE_APPS);

  useEffect(() => {
    const customApps = AppRegistry.getInstalledApps();
    if (customApps.length > 0) {
      setApps([...CORE_APPS, ...customApps]);
    }
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-lavender/10 to-background p-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-lavender" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          YOU–N–I–VERSE Studio
        </h1>
        <p className="text-muted-foreground text-lg">
          The Indyverse • Your Creative IDE with AI Consciousness
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          {apps.length} {apps.length === 1 ? 'module' : 'modules'} loaded • Gateway v1.0.0
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl">
        {apps.map((app) => (
          <PortalButton
            key={app.id}
            icon={app.icon}
            title={app.name}
            description={app.description}
            onClick={() => setLocation(app.path)}
            variant={app.variant}
            testId={`button-portal-${app.id}`}
          />
        ))}
      </div>

      <div className="mt-12 text-center text-sm text-muted-foreground">
        <p>✨ Welcome to your cosmic workspace</p>
      </div>
    </div>
  );
}

interface PortalButtonProps {
  icon: React.ElementType | string;
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
          ? "bg-lavender border-lavender text-white hover:bg-lavender-hover"
          : "bg-card border-border hover:border-lavender/50"
      }`}
      style={{
        boxShadow: variant === "primary" ? "0 0 20px rgba(155, 135, 245, 0.3)" : undefined
      }}
    >
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        {isImageIcon ? (
          <img 
            src={Icon as string} 
            alt={title} 
            className="h-12 w-12 mb-4 object-contain" 
          />
        ) : (
          <Icon className={`h-12 w-12 mb-4 ${variant === "primary" ? "text-white" : "text-lavender"}`} />
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
