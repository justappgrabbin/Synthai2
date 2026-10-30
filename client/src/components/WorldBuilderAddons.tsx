import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Download, ExternalLink, Copy, Save, House, Cuboid } from "lucide-react";

export const PASCAL_URL_KEY = "synthai_pascal_editor_url";
const PASCAL_INSTALL = "npm install --global @pascal-app/cli && pascal editor";

function openExternal(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}

export function WorldBuilderAddons() {
  const { toast } = useToast();
  const [pascalUrl, setPascalUrl] = useState(() => localStorage.getItem(PASCAL_URL_KEY) || "");
  const [savedPascalUrl, setSavedPascalUrl] = useState(() => localStorage.getItem(PASCAL_URL_KEY) || "");

  const copy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast({ title: "Copied to clipboard" });
    } catch {
      toast({ title: "Copy unavailable", description: "Select and copy the displayed command.", variant: "destructive" });
    }
  };

  const savePascalUrl = () => {
    const trimmed = pascalUrl.trim();
    if (trimmed) {
      try {
        const url = new URL(trimmed);
        if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error("Unsupported URL");
        if (url.username || url.password) throw new Error("Credentials in URLs are not supported");
      } catch {
        toast({ title: "Enter a valid http:// or https:// editor address", variant: "destructive" });
        return;
      }
    }
    localStorage.setItem(PASCAL_URL_KEY, trimmed);
    setPascalUrl(trimmed);
    setSavedPascalUrl(trimmed);
    toast({ title: trimmed ? "Pascal address saved" : "Pascal address cleared", description: "This saves a launch address; it does not verify installation or connect an MCP server." });
  };

  return (
    <div className="space-y-4" data-testid="world-builder-addons">
      <div>
        <h2 className="text-xl font-semibold">Downloadable World Builder Add-ons</h2>
        <p className="text-sm text-muted-foreground">Optional tools for richer buildings and Unity worlds. Neither engine is bundled into the Android app.</p>
      </div>
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2"><House className="w-5 h-5" /> Pascal Editor</CardTitle>
            <Badge variant="secondary">Optional local editor + MCP</Badge>
          </div>
          <CardDescription>Architectural scene editing: floors, walls, doors, windows, rooms, and buildings. Pascal runs as its own web editor with an MCP service.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm">Install in a supported Node.js environment, such as a compatible Termux setup or another computer. The Pascal CLI downloads the editor runtime on first launch.</p>
          <div className="rounded-md bg-muted p-3 font-mono text-xs break-all select-text">{PASCAL_INSTALL}</div>
          <div className="flex flex-wrap gap-2">
            <Button variant="default" onClick={() => copy(PASCAL_INSTALL)}><Copy className="w-4 h-4 mr-2" /> Copy install command</Button>
            <Button variant="outline" onClick={() => openExternal("https://www.npmjs.com/package/@pascal-app/cli")}><ExternalLink className="w-4 h-4 mr-2" /> CLI package</Button>
            <Button variant="outline" onClick={() => openExternal("https://github.com/pascalorg/editor/archive/refs/heads/main.zip")}><Download className="w-4 h-4 mr-2" /> Download source ZIP</Button>
          </div>
          <div className="space-y-2">
            <Label htmlFor="pascal-editor-url">Local or hosted editor URL (after installation)</Label>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input id="pascal-editor-url" type="url" placeholder="http://127.0.0.1:PORT"
                value={pascalUrl} onChange={e => setPascalUrl(e.target.value)} />
              <Button variant="outline" onClick={savePascalUrl}><Save className="w-4 h-4 mr-2" /> Save address</Button>
              <Button disabled={!savedPascalUrl} onClick={() => openExternal(savedPascalUrl)}><ExternalLink className="w-4 h-4 mr-2" /> Open editor</Button>
            </div>
            <p className="text-xs text-muted-foreground">{savedPascalUrl ? "Launch address configured (connection not verified)." : "Not configured. Run Pascal and copy the editor address printed by its CLI."} The CLI chooses an available port automatically.</p>
          </div>
          <p className="text-xs text-muted-foreground">Source: MIT License · <a className="underline" target="_blank" rel="noopener noreferrer" href="https://github.com/pascalorg/editor">Pascal repository</a>. The showcase Pascal Next features are not all part of the open-source editor.</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2"><Cuboid className="w-5 h-5" /> Unity-MCP</CardTitle>
            <Badge variant="secondary">Optional Unity plugin</Badge>
          </div>
          <CardDescription>Agent-controlled Unity scene editing, terrain, objects, scripts, and runtime tools when connected to a compatible Unity project.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm">Download the official Unity package, then import it into a Unity Editor project. This package is not a stand-alone Android app. Unity must run in a supported environment; the phone can be used to access the resulting builds or a separately configured remote bridge.</p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => openExternal("https://github.com/IvanMurzak/Unity-MCP/releases/latest/download/AI-Game-Dev-Installer.unitypackage")}>
              <Download className="w-4 h-4 mr-2" /> Download Unity installer
            </Button>
            <Button variant="outline" onClick={() => openExternal("https://github.com/IvanMurzak/Unity-MCP")}>
              <ExternalLink className="w-4 h-4 mr-2" /> Setup instructions
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Source: Apache-2.0 License. Unity's own installation and licensing requirements still apply. The Unity MCP service is not connected just by downloading this package.</p>
        </CardContent>
      </Card>
    </div>
  );
}
