import { Button } from "@/components/ui/button";
import { AIBackendSelector } from "./AIBackendSelector";
import { TopNav } from "@/components/TopNav";
import { useTheme } from "@/components/ThemeProvider";
import { Moon, Sun } from "lucide-react";

export function SettingsPanel() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background">
      <TopNav />

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
              <div className="flex items-center gap-2">
                {theme === "dark" ? (
                  <Moon className="h-4 w-4 text-lavender" />
                ) : (
                  <Sun className="h-4 w-4 text-lavender" />
                )}
                <span className="text-sm font-medium">
                  {theme === "dark" ? "Dark Mode" : "Light Mode"}
                </span>
              </div>
              <Button 
                data-testid="button-toggle-theme"
                variant="outline" 
                size="sm" 
                onClick={toggleTheme}
                className="gap-2"
              >
                {theme === "dark" ? (
                  <>
                    <Sun className="h-4 w-4" />
                    Switch to Light
                  </>
                ) : (
                  <>
                    <Moon className="h-4 w-4" />
                    Switch to Dark
                  </>
                )}
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Lavender Accent</span>
              <div className="h-6 w-6 rounded-full bg-lavender border-2 border-border shadow-sm" />
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

        <section className="p-6 border rounded-lg bg-card/50">
          <h2 className="text-lg font-semibold mb-3 text-lavender">Special Thanks</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            This project was made possible with the incredible assistance of <span className="text-foreground font-medium">ChatGPT</span>, <span className="text-foreground font-medium">Claude</span>, and the amazing <span className="text-foreground font-medium">Replit</span> platform. Thank you for empowering creators to build the future! 🌌
          </p>
        </section>
      </div>
    </div>
  );
}
