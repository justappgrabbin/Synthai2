import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Archive, Gamepad2, Search, Play, Eye, X, RefreshCw, Download } from "lucide-react";
import { useLocation} from "wouter";
import { GAME_TEMPLATES } from "@/lib/gameTemplates";
import { FileSystem, type FileNode } from "@/lib/fileSystem";
import { useToast } from "@/hooks/use-toast";
import { gameTemplateNode, publishMeshNode } from "@/lib/meshAddressing";
import { systemApi, type GamePack } from "@/lib/systemApi";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function GameCreator() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [gamePacks, setGamePacks] = useState<GamePack[]>([]);
  const [packError, setPackError] = useState("");
  const [mountingPackId, setMountingPackId] = useState<string | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<string | null>(null);
  const [iframeKey, setIframeKey] = useState(0);
  const { toast } = useToast();

  const filteredTemplates = GAME_TEMPLATES.filter(template =>
    template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    publishMeshNode({
      kind: "app",
      domain: "os",
      name: "game-creator",
      purpose: "Game authoring and template launcher",
      tags: ["creator-tool", "games", "templates"],
    }, "app.opened");
    refreshGamePacks();
  }, []);

  const refreshGamePacks = async () => {
    setPackError("");
    try {
      const result = await systemApi.gamePacks();
      setGamePacks(result.packs || []);
    } catch (error) {
      setPackError(error instanceof Error ? error.message : String(error));
    }
  };

  const handleMountGamePack = async (pack: GamePack) => {
    setMountingPackId(pack.id);
    setPackError("");
    try {
      const result = await systemApi.mountGamePack(pack.id);
      publishMeshNode({
        kind: "game",
        domain: "os",
        parent: "game-packs",
        name: pack.name,
        purpose: "Mounted game pack source bundle",
        tags: ["game-pack", pack.status],
        payload: { pack, app: result.app },
      }, "game-pack.mounted");

      toast({
        title: "Game Pack Mounted",
        description: `${pack.name} is now available in mounted apps.`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setPackError(message);
      toast({
        title: "Mount failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setMountingPackId(null);
    }
  };

  const generateExecutableHTML = (files: FileNode[]): string => {
    const indexFile = files.find(f => f.type === 'file' && f.name === 'index.html');
    if (!indexFile || !indexFile.content) return '';

    let html = indexFile.content;

    const getAllFiles = (nodes: FileNode[]): FileNode[] => {
      let result: FileNode[] = [];
      for (const node of nodes) {
        if (node.type === 'file') {
          result.push(node);
        }
        if (node.children) {
          result = result.concat(getAllFiles(node.children));
        }
      }
      return result;
    };

    const allFiles = getAllFiles(files);

    html = html.replace(/<link\s+rel="stylesheet"\s+href="([^"]+)">/g, (match, href) => {
      const cssFile = allFiles.find(f => f.path === href || f.path.endsWith(href));
      if (cssFile && cssFile.content) {
        return `<style>${cssFile.content}</style>`;
      }
      return match;
    });

    html = html.replace(/<script\s+src="([^"]+)"><\/script>/g, (match, src) => {
      const jsFile = allFiles.find(f => f.path === src || f.path.endsWith(src));
      if (jsFile && jsFile.content) {
        return `<script>${jsFile.content}</script>`;
      }
      return match;
    });

    return html;
  };

  const handlePreviewTemplate = (templateId: string) => {
    const template = GAME_TEMPLATES.find(t => t.id === templateId);
    if (template) {
      publishMeshNode(gameTemplateNode(template), "game.template.previewed");
    }
    setPreviewTemplate(templateId);
    setIframeKey(prev => prev + 1);
  };

  const handleUseTemplate = (templateId: string) => {
    const template = GAME_TEMPLATES.find(t => t.id === templateId);
    if (!template) return;

    if (confirm(`This will replace all current files with the ${template.title} template. Continue?`)) {
      publishMeshNode(gameTemplateNode(template), "game.template.loaded");
      FileSystem.loadFileTree(template.files);

      toast({
        title: "Template Loaded!",
        description: `${template.title} is ready in the IDE`,
      });

      setTimeout(() => {
        setLocation('/ide');
      }, 500);
    }
  };

  const handleRefresh = () => {
    setIframeKey(prev => prev + 1);
  };

  const handleDownloadTemplate = (templateId: string) => {
    const template = GAME_TEMPLATES.find(t => t.id === templateId);
    if (!template) return;

    publishMeshNode(gameTemplateNode(template), "game.template.export.requested");

    toast({
      title: "Download Template",
      description: "Use the template first, then export from the IDE",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="p-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">Game Templates</h1>
          <p className="text-muted-foreground">Use built-in templates or mount your installed game packs</p>
        </div>

        <section className="mb-8">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold">Installed Game Packs</h2>
              <p className="text-sm text-muted-foreground">
                Source bundles available from startup. Mount one when you want to inspect, adapt, or run it.
              </p>
            </div>
            <Button variant="outline" onClick={refreshGamePacks}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Packs
            </Button>
          </div>

          {packError && (
            <div className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              {packError}
            </div>
          )}

          {gamePacks.length === 0 ? (
            <Card className="p-6">
              <div className="flex items-center gap-3 text-muted-foreground">
                <Archive className="h-5 w-5" />
                <p className="text-sm">No game packs are registered yet.</p>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {gamePacks.map((pack) => (
                <Card key={pack.id} className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="rounded-md bg-primary/10 p-2 text-primary">
                      <Archive className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold truncate">{pack.name}</h3>
                      <p className="text-xs text-muted-foreground truncate">{pack.filename}</p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="rounded-md bg-muted p-2">
                      <p className="font-semibold">{pack.sizeMb}</p>
                      <p className="text-muted-foreground">MB</p>
                    </div>
                    <div className="rounded-md bg-muted p-2">
                      <p className="font-semibold">{pack.entries}</p>
                      <p className="text-muted-foreground">Files</p>
                    </div>
                    <div className="rounded-md bg-muted p-2">
                      <p className="font-semibold">{pack.nestedZips}</p>
                      <p className="text-muted-foreground">Nested</p>
                    </div>
                  </div>

                  {pack.roots.length > 0 && (
                    <p className="mt-3 text-xs text-muted-foreground truncate">
                      Roots: {pack.roots.join(", ")}
                    </p>
                  )}
                  {pack.warning && (
                    <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">{pack.warning}</p>
                  )}

                  <Button
                    className="mt-4 w-full"
                    variant={pack.status === "ready" ? "default" : "outline"}
                    disabled={pack.status !== "ready" || mountingPackId === pack.id}
                    onClick={() => handleMountGamePack(pack)}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    {mountingPackId === pack.id ? "Mounting..." : "Mount Pack"}
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </section>

        <div className="mb-6 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            data-testid="input-search-templates"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search templates..."
            className="pl-10"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <Card
              key={template.id}
              className="p-6 hover:border-primary transition-all hover:shadow-lg"
            >
              <div className="h-32 bg-card rounded-md mb-4 flex items-center justify-center">
                <Gamepad2 className="h-12 w-12 text-primary/40" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{template.title}</h3>
              <p className="text-sm text-muted-foreground mb-4">{template.description}</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {template.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <Button
                  data-testid={`button-preview-template-${template.id}`}
                  variant="outline"
                  className="flex-1"
                  onClick={() => handlePreviewTemplate(template.id)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
                <Button
                  data-testid={`button-use-template-${template.id}`}
                  className="flex-1"
                  onClick={() => handleUseTemplate(template.id)}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Use
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="max-w-6xl h-[90vh] flex flex-col" data-testid="dialog-template-preview">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Gamepad2 className="w-5 h-5 text-primary" />
                <div>
                  <DialogTitle>
                    {GAME_TEMPLATES.find(t => t.id === previewTemplate)?.title} Preview
                  </DialogTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Interactive template demo
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  data-testid="button-refresh-preview"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => previewTemplate && handleDownloadTemplate(previewTemplate)}
                  data-testid="button-download-template"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setPreviewTemplate(null)}
                  data-testid="button-close-preview"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 bg-muted rounded-lg overflow-hidden border">
            {previewTemplate && (
              <iframe
                key={iframeKey}
                srcDoc={generateExecutableHTML(GAME_TEMPLATES.find(t => t.id === previewTemplate)?.files || [])}
                className="w-full h-full bg-white"
                sandbox={
                  previewTemplate === 'godot-starter'
                    ? "allow-scripts allow-same-origin allow-forms allow-modals allow-pointer-lock"
                    : "allow-scripts allow-same-origin allow-forms"
                }
                title="Template Preview"
                data-testid="iframe-template-preview"
                allow="cross-origin-isolated"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
