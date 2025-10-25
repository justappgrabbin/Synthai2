import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Gamepad2, Search, Play } from "lucide-react";
import { useLocation } from "wouter";
import { GAME_TEMPLATES } from "@/lib/gameTemplates";
import { FileSystem } from "@/lib/fileSystem";
import { useToast } from "@/hooks/use-toast";
import { TopNav } from "@/components/TopNav";

export function GameCreator() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  const filteredTemplates = GAME_TEMPLATES.filter(template =>
    template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUseTemplate = (templateId: string) => {
    const template = GAME_TEMPLATES.find(t => t.id === templateId);
    if (!template) return;

    if (confirm(`This will replace all current files with the ${template.title} template. Continue?`)) {
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

  return (
    <div className="min-h-screen bg-background">
      <TopNav />

      <div className="p-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-lavender mb-2">Game Templates</h1>
          <p className="text-muted-foreground">Choose a template to start creating your game</p>
        </div>

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
              className="p-6 hover:border-lavender/50 transition-all hover:shadow-lg"
            >
              <div className="h-32 bg-gradient-to-br from-lavender/10 to-accent/10 rounded-md mb-4 flex items-center justify-center">
                <Gamepad2 className="h-12 w-12 text-lavender/40" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{template.title}</h3>
              <p className="text-sm text-muted-foreground mb-4">{template.description}</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {template.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2 py-1 rounded-full bg-lavender/10 text-lavender"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <Button
                data-testid={`button-use-template-${template.id}`}
                className="w-full bg-lavender hover:bg-lavender-hover"
                onClick={() => handleUseTemplate(template.id)}
              >
                <Play className="h-4 w-4 mr-2" />
                Use Template
              </Button>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
