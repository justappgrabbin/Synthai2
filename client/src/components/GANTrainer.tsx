import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Brain, Search, Zap, Play, Sparkles } from "lucide-react";
import { useLocation } from "wouter";
import { GAN_TEMPLATES } from "@/lib/ganTemplates";
import { FileSystem } from "@/lib/fileSystem";
import { useToast } from "@/hooks/use-toast";
import { TopNav } from "@/components/TopNav";

export function GANTrainer() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  const filteredTemplates = GAN_TEMPLATES.filter(template =>
    template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUseTemplate = (templateId: string) => {
    const template = GAN_TEMPLATES.find(t => t.id === templateId);
    if (!template) return;

    if (confirm(`This will replace all current files with the ${template.title} GAN template. Continue?`)) {
      FileSystem.loadFileTree(template.files);

      toast({
        title: "GAN Template Loaded!",
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
          <div className="flex items-center gap-3 mb-3">
            <Brain className="h-8 w-8 text-lavender" />
            <h1 className="text-3xl font-bold text-lavender">GAN Trainer</h1>
            <Zap className="h-6 w-6 text-lavender/60" />
          </div>
          <p className="text-muted-foreground">
            Generative Adversarial Networks - Create, train, and deploy AI models in your browser
          </p>
        </div>

        <div className="mb-6 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            data-testid="input-search-gan-templates"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search GAN templates..."
            className="pl-10"
          />
        </div>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-lavender" />
            Available GAN Templates
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => (
              <Card
                key={template.id}
                className="p-6 hover:border-lavender/50 transition-all hover:shadow-lg"
              >
                <div className="h-32 bg-gradient-to-br from-purple-500/10 to-lavender/10 rounded-md mb-4 flex items-center justify-center">
                  <Brain className="h-12 w-12 text-lavender/40" />
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-semibold">{template.title}</h3>
                  {template.pretrained && (
                    <span className="text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-500">
                      Pre-trained
                    </span>
                  )}
                  {!template.pretrained && (
                    <span className="text-xs px-2 py-1 rounded-full bg-blue-500/10 text-blue-500">
                      Trainable
                    </span>
                  )}
                </div>
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
                  data-testid={`button-use-gan-template-${template.id}`}
                  className="w-full bg-lavender hover:bg-lavender-hover"
                  onClick={() => handleUseTemplate(template.id)}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Load Template
                </Button>
              </Card>
            ))}
          </div>
        </section>

        <section className="p-8 border-2 border-dashed border-lavender/30 rounded-lg text-center bg-card">
          <Brain className="h-16 w-16 mx-auto mb-4 text-lavender/40" />
          <h3 className="text-lg font-semibold mb-2">Upload Your Own GAN</h3>
          <p className="text-sm text-muted-foreground mb-6">
            You can upload pre-trained models or custom GAN implementations via the Player panel
          </p>
          <Button
            variant="outline"
            onClick={() => setLocation('/player')}
          >
            Go to Player
          </Button>
        </section>
      </div>
    </div>
  );
}
