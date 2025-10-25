import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Code2, Gamepad2, Play, Bot, Settings, Store } from "lucide-react";

export function Dashboard() {
  const [, setLocation] = useLocation();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-lavender/10 to-background p-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-lavender" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          YOU–N–I–VERSE Studio
        </h1>
        <p className="text-muted-foreground text-lg">
          The Indyverse • Your Creative IDE with AI Consciousness
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-5xl">
        <PortalButton
          icon={Code2}
          title="Launch IDE"
          description="Code editor & developer environment"
          onClick={() => setLocation("/ide")}
          variant="primary"
          testId="button-portal-ide"
        />
        <PortalButton
          icon={Store}
          title="Grove Store"
          description="Discover community apps, agents & templates"
          onClick={() => setLocation("/grove-store")}
          variant="primary"
          testId="button-portal-grove-store"
        />
        <PortalButton
          icon={Gamepad2}
          title="Game Creator"
          description="Access game templates & creation tools"
          onClick={() => setLocation("/game-creator")}
          testId="button-portal-game-creator"
        />
        <PortalButton
          icon={Play}
          title="YOU–N–I–Versal Player"
          description="Play & explore creative bundles"
          onClick={() => setLocation("/player")}
          testId="button-portal-player"
        />
        <PortalButton
          icon={Bot}
          title="Agent Creator"
          description="Build & manage AI agents"
          onClick={() => setLocation("/agents")}
          testId="button-portal-agents"
        />
        <PortalButton
          icon={Settings}
          title="Settings"
          description="Configure AI backends & preferences"
          onClick={() => setLocation("/settings")}
          testId="button-portal-settings"
        />
      </div>

      <div className="mt-12 text-center text-sm text-muted-foreground">
        <p>✨ Welcome to your cosmic workspace</p>
      </div>
    </div>
  );
}

interface PortalButtonProps {
  icon: React.ElementType;
  title: string;
  description: string;
  onClick: () => void;
  variant?: "primary" | "default";
  testId?: string;
}

function PortalButton({ icon: Icon, title, description, onClick, variant = "default", testId }: PortalButtonProps) {
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
        <Icon className={`h-12 w-12 mb-4 ${variant === "primary" ? "text-white" : "text-lavender"}`} />
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
