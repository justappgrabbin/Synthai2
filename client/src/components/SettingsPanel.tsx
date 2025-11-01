import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AIBackendSelector } from "./AIBackendSelector";
import { TopNav } from "@/components/TopNav";
import { useTheme } from "@/components/ThemeProvider";
import { Moon, Sun, Palette } from "lucide-react";
import { ThemeManager, type ColorTheme, THEME_PRESETS } from "@/lib/themeManager";

const THEME_NAMES: Record<ColorTheme, string> = {
  teal: 'Teal & Amber',
  purple: 'Purple Lavender',
  blue: 'Ocean Blue',
  emerald: 'Emerald Green',
  rose: 'Rose Pink',
  amber: 'Golden Amber'
};

export function SettingsPanel() {
  const { theme, toggleTheme } = useTheme();
  const [colorTheme, setColorTheme] = useState<ColorTheme>(ThemeManager.getCurrentTheme());

  const handleColorThemeChange = (newTheme: ColorTheme) => {
    setColorTheme(newTheme);
    ThemeManager.setTheme(newTheme);
  };

  useEffect(() => {
    ThemeManager.initializeTheme();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <TopNav />

      <div className="p-8 max-w-3xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">Configuration</h1>
          <p className="text-muted-foreground">Manage your AI backends and studio preferences</p>
        </div>

        <section>
          <h2 className="text-xl font-semibold mb-4">AI Configuration</h2>
          <AIBackendSelector />
        </section>

        <section className="p-6 border rounded-lg bg-card">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            Color Palette
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Choose your preferred color scheme
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {(Object.keys(THEME_PRESETS) as ColorTheme[]).map((themeKey) => (
              <button
                key={themeKey}
                data-testid={`button-theme-${themeKey}`}
                onClick={() => handleColorThemeChange(themeKey)}
                className={`p-4 rounded-lg border-2 transition-all hover-elevate ${
                  colorTheme === themeKey 
                    ? 'border-primary bg-primary/10' 
                    : 'border-border bg-card'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div 
                    className="h-8 w-8 rounded-full border-2 border-white/20 shadow-md"
                    style={{ backgroundColor: `hsl(${THEME_PRESETS[themeKey].primary})` }}
                  />
                  <div 
                    className="h-6 w-6 rounded-full border-2 border-white/20 shadow-sm"
                    style={{ backgroundColor: `hsl(${THEME_PRESETS[themeKey].accent})` }}
                  />
                </div>
                <p className="text-sm font-medium text-left">{THEME_NAMES[themeKey]}</p>
                {colorTheme === themeKey && (
                  <p className="text-xs text-primary mt-1">Active</p>
                )}
              </button>
            ))}
          </div>
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
                  <Moon className="h-4 w-4 text-primary" />
                ) : (
                  <Sun className="h-4 w-4 text-primary" />
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
