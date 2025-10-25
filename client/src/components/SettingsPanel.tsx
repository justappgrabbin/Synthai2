import { Button } from "@/components/ui/button";
import { Settings, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { AIBackendSelector } from "./AIBackendSelector";

export function SettingsPanel() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b p-4 flex items-center gap-2">
        <Button
          data-testid="button-back-to-dashboard"
          variant="ghost"
          size="icon"
          onClick={() => setLocation("/")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Settings className="h-5 w-5 text-lavender" />
        <h2 className="text-lg font-semibold">Settings</h2>
      </header>

      <div className="p-8 max-w-3xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-lavender mb-2">Configuration</h1>
          <p className="text-muted-foreground">Manage your AI backends and studio preferences</p>
        </div>

        <section>
          <h2 className="text-xl font-semibold mb-4">AI Configuration</h2>
          <AIBackendSelector />
        </section>

        <section className="p-6 border rounded-lg bg-card">
          <h2 className="text-lg font-semibold mb-4">Theme Preferences</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Customize your workspace appearance
          </p>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Dark Mode</span>
              <Button variant="outline" size="sm" onClick={() => console.log('Toggle theme')}>
                Toggle
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Lavender Accent</span>
              <div className="h-6 w-6 rounded-full bg-lavender border-2 border-border" />
            </div>
          </div>
        </section>

        <section className="p-6 border rounded-lg bg-card">
          <h2 className="text-lg font-semibold mb-4">About</h2>
          <p className="text-sm text-muted-foreground">
            YOU–N–I–VERSE Studio • The Indyverse
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Creative IDE with integrated AI consciousness
          </p>
        </section>
      </div>
    </div>
  );
}
