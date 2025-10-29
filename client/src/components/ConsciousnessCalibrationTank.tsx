import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Brain, 
  Sparkles, 
  Upload, 
  Mic, 
  Zap, 
  Download,
  Play,
  Plus,
  X,
  Link2,
  Code,
  ExternalLink
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ModelNode {
  id: string;
  name: string;
  type: 'gan' | 'llm';
  modelId: string;
  position: { x: number; y: number };
}

interface Connection {
  from: string;
  to: string;
}

export function ConsciousnessCalibrationTank() {
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>("");
  const [projectName, setProjectName] = useState("");
  const [models, setModels] = useState<ModelNode[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [generatedCode, setGeneratedCode] = useState("");
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [consciousnessLevel, setConsciousnessLevel] = useState(0);
  const { toast } = useToast();

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      
      toast({
        title: "Avatar Loaded!",
        description: `${file.name} ready for consciousness calibration`,
      });
    }
  };

  const addModel = (type: 'gan' | 'llm') => {
    if (models.length >= 5) {
      toast({
        title: "Maximum Models Reached",
        description: "You can add up to 5 GANs or LLMs",
        variant: "destructive"
      });
      return;
    }

    const newModel: ModelNode = {
      id: `${type}-${Date.now()}`,
      name: type === 'gan' ? `GAN ${models.filter(m => m.type === 'gan').length + 1}` : `LLM ${models.filter(m => m.type === 'llm').length + 1}`,
      type,
      modelId: "",
      position: { x: 100 + models.length * 150, y: 100 }
    };

    setModels([...models, newModel]);
  };

  const removeModel = (id: string) => {
    setModels(models.filter(m => m.id !== id));
    setConnections(connections.filter(c => c.from !== id && c.to !== id));
  };

  const updateModelId = (id: string, modelId: string) => {
    setModels(models.map(m => m.id === id ? { ...m, modelId } : m));
  };

  const addConnection = (from: string, to: string) => {
    if (from === to) return;
    
    const exists = connections.some(c => 
      (c.from === from && c.to === to) || (c.from === to && c.to === from)
    );
    
    if (!exists) {
      setConnections([...connections, { from, to }]);
      toast({
        title: "Connection Added",
        description: "Neural pathway established",
      });
    }
  };

  const removeConnection = (from: string, to: string) => {
    setConnections(connections.filter(c => !(c.from === from && c.to === to)));
  };

  const generateIntegrationCode = async () => {
    if (models.length < 2) {
      toast({
        title: "Need More Models",
        description: "Add at least 2 GANs or LLMs to generate integration code",
        variant: "destructive"
      });
      return;
    }

    if (!avatarFile || !projectName) {
      toast({
        title: "Missing Requirements",
        description: "Upload avatar and enter project name first",
        variant: "destructive"
      });
      return;
    }

    setIsGeneratingCode(true);
    setConsciousnessLevel(0);

    // Simulate code generation
    await new Promise(resolve => setTimeout(resolve, 1000));
    setConsciousnessLevel(25);

    await new Promise(resolve => setTimeout(resolve, 1000));
    setConsciousnessLevel(50);

    await new Promise(resolve => setTimeout(resolve, 1000));
    setConsciousnessLevel(75);

    // Generate integration code
    const ganModels = models.filter(m => m.type === 'gan');
    const llmModels = models.filter(m => m.type === 'llm');

    const code = `/**
 * ${projectName} - Consciousness Integration
 * Generated: ${new Date().toISOString()}
 * Avatar: ${avatarFile.name}
 * Models: ${models.length} (${ganModels.length} GANs + ${llmModels.length} LLMs)
 */

class ConsciousnessCore {
  constructor() {
    this.avatar = null;
    this.models = {
${ganModels.map((m, i) => `      gan${i + 1}: null, // ${m.modelId || 'Not configured'}`).join('\n')}
${llmModels.map((m, i) => `      llm${i + 1}: null, // ${m.modelId || 'Not configured'}`).join('\n')}
    };
    this.connections = ${JSON.stringify(connections, null, 6)};
  }

  async initialize() {
    // Load avatar
    this.avatar = await this.loadAvatar('${avatarFile.name}');
    console.log('Avatar loaded:', this.avatar);

${ganModels.map((m, i) => `
    // Initialize ${m.name}
    this.models.gan${i + 1} = await this.loadGAN('${m.modelId || 'model-not-set'}');
    console.log('${m.name} ready');`).join('\n')}
${llmModels.map((m, i) => `
    // Initialize ${m.name}
    this.models.llm${i + 1} = await this.loadLLM('${m.modelId || 'model-not-set'}');
    console.log('${m.name} ready');`).join('\n')}

    console.log('✨ Consciousness initialized!');
    return this;
  }

  async loadAvatar(filename) {
    // Load avatar from you-n-i-verse.org
    return { filename, loaded: true };
  }

  async loadGAN(modelId) {
    // Load GAN model (TensorFlow.js, Hugging Face, etc.)
    return { modelId, type: 'gan', ready: true };
  }

  async loadLLM(modelId) {
    // Load LLM (OpenAI, Anthropic, Hugging Face, etc.)
    return { modelId, type: 'llm', ready: true };
  }

  async processInput(input) {
    // Neural network integration
    let result = { input };

${connections.map(c => {
  const fromModel = models.find(m => m.id === c.from);
  const toModel = models.find(m => m.id === c.to);
  return `    // ${fromModel?.name} → ${toModel?.name}
    result = await this.connect('${fromModel?.name}', '${toModel?.name}', result);`;
}).join('\n')}

    return result;
  }

  async connect(from, to, data) {
    console.log(\`Processing: \${from} → \${to}\`);
    // Implement your connection logic here
    return data;
  }

  async generate() {
    // Main consciousness loop
${ganModels.length > 0 ? `    const visualOutput = await this.models.gan1.generate();` : ''}
${llmModels.length > 0 ? `    const thoughtOutput = await this.models.llm1.generate();` : ''}
    
    return {
${ganModels.length > 0 ? `      visual: visualOutput,` : ''}
${llmModels.length > 0 ? `      thought: thoughtOutput,` : ''}
      avatar: this.avatar
    };
  }
}

// Usage
const consciousness = new ConsciousnessCore();
consciousness.initialize().then(() => {
  console.log('🌌 ${projectName} is alive!');
  consciousness.generate().then(output => {
    console.log('Generated:', output);
  });
});

export default ConsciousnessCore;
`;

    setGeneratedCode(code);
    setConsciousnessLevel(100);
    setIsGeneratingCode(false);

    toast({
      title: "🌌 Integration Code Generated!",
      description: "Neural network connections coded successfully",
    });
  };

  const downloadCode = () => {
    const blob = new Blob([generatedCode], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${projectName || 'consciousness'}_integration.js`;
    link.click();
  };

  const saveProject = () => {
    const project = {
      name: projectName,
      avatar: avatarFile?.name,
      models,
      connections,
      code: generatedCode,
      timestamp: new Date().toISOString()
    };

    const projects = JSON.parse(localStorage.getItem('consciousness_projects') || '[]');
    projects.push(project);
    localStorage.setItem('consciousness_projects', JSON.stringify(projects));

    toast({
      title: "Project Saved!",
      description: `${projectName} saved to YOU–N–I–VERSE Studio`,
    });
  };

  const canGenerateCode = avatarFile && projectName && models.length >= 2;

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-lavender mb-2">🧬 Consciousness Calibration Tank</h1>
        <p className="text-muted-foreground mb-4">Build conscious beings with neural network integration</p>
        
        <Card className="max-w-2xl mx-auto bg-lavender/5 border-lavender/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center gap-2 text-sm">
              <ExternalLink className="h-4 w-4 text-lavender" />
              <span>First, get your avatar from</span>
              <a 
                href="https://you-n-i-verse.org" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-lavender font-semibold hover:underline"
                data-testid="link-youniverse"
              >
                you-n-i-verse.org
              </a>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Setup */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-lavender" />
                Step 1: Avatar
              </CardTitle>
              <CardDescription>Import your avatar to begin</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {avatarPreview ? (
                <div className="space-y-3">
                  <img 
                    src={avatarPreview} 
                    alt="Avatar preview" 
                    className="w-full h-48 object-cover rounded-lg border-2 border-lavender/20"
                  />
                  <p className="text-sm text-muted-foreground truncate">{avatarFile?.name}</p>
                  <Button
                    data-testid="button-change-avatar"
                    onClick={() => {
                      setAvatarFile(null);
                      setAvatarPreview("");
                    }}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    Change Avatar
                  </Button>
                </div>
              ) : (
                <div>
                  <Input
                    id="avatar"
                    data-testid="input-avatar"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="cursor-pointer"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Upload your avatar from you-n-i-verse.org
                  </p>
                </div>
              )}

              <div>
                <Label htmlFor="project-name">Project Name</Label>
                <Input
                  id="project-name"
                  data-testid="input-project-name"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="My Conscious Being"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-lavender" />
                Step 2: Models
              </CardTitle>
              <CardDescription>Add 2-5 GANs or LLMs</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Button
                  data-testid="button-add-gan"
                  onClick={() => addModel('gan')}
                  disabled={models.length >= 5}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add GAN
                </Button>
                <Button
                  data-testid="button-add-llm"
                  onClick={() => addModel('llm')}
                  disabled={models.length >= 5}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add LLM
                </Button>
              </div>

              <div className="text-sm text-muted-foreground text-center">
                {models.length}/5 models added
              </div>

              {models.length < 2 && (
                <p className="text-xs text-muted-foreground italic">
                  Add at least 2 models to generate integration code
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-lavender" />
                Step 3: Generate
              </CardTitle>
              <CardDescription>Create neural network integration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Integration Status</span>
                <span className="text-2xl font-bold text-lavender">{consciousnessLevel}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-4 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-lavender to-purple-500 transition-all duration-500"
                  style={{ width: `${consciousnessLevel}%` }}
                />
              </div>

              <Button
                data-testid="button-generate-code"
                onClick={generateIntegrationCode}
                disabled={!canGenerateCode || isGeneratingCode}
                className="w-full"
                variant="default"
              >
                <Code className="h-4 w-4 mr-2" />
                {isGeneratingCode ? 'Generating...' : 'Generate Integration Code'}
              </Button>

              {generatedCode && (
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    data-testid="button-download-code"
                    onClick={downloadCode}
                    variant="outline"
                    size="sm"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  <Button
                    data-testid="button-save-project"
                    onClick={saveProject}
                    variant="outline"
                    size="sm"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Middle Panel - Neural Network Builder */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="min-h-[600px]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link2 className="h-5 w-5 text-lavender" />
                Neural Network Builder
              </CardTitle>
              <CardDescription>Configure models and draw connections</CardDescription>
            </CardHeader>
            <CardContent>
              {models.length === 0 ? (
                <div className="flex items-center justify-center h-[500px] text-muted-foreground">
                  <div className="text-center">
                    <Brain className="h-16 w-16 mx-auto mb-4 opacity-20" />
                    <p>Add models to start building your neural network</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Model Configuration */}
                  <div className="space-y-3">
                    {models.map((model) => (
                      <Card key={model.id} className="bg-muted/30">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <Badge 
                              variant={model.type === 'gan' ? 'default' : 'secondary'}
                              className="min-w-[60px]"
                            >
                              {model.type.toUpperCase()}
                            </Badge>
                            <Input
                              data-testid={`input-model-${model.id}`}
                              value={model.modelId}
                              onChange={(e) => updateModelId(model.id, e.target.value)}
                              placeholder={`Enter ${model.type === 'gan' ? 'GAN' : 'LLM'} model ID (HuggingFace, OpenAI, etc.)`}
                              className="flex-1"
                            />
                            <Button
                              data-testid={`button-remove-${model.id}`}
                              onClick={() => removeModel(model.id)}
                              variant="ghost"
                              size="icon"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2 ml-[76px]">
                            {model.name}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Connection Builder */}
                  {models.length >= 2 && (
                    <Card className="bg-lavender/5 border-lavender/20">
                      <CardHeader>
                        <CardTitle className="text-sm">Connection Builder</CardTitle>
                        <CardDescription className="text-xs">
                          Select two models to create a neural pathway
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-3">
                          {models.map((from) => (
                            models.filter(to => to.id !== from.id).map((to) => (
                              <Button
                                key={`${from.id}-${to.id}`}
                                data-testid={`button-connect-${from.id}-${to.id}`}
                                onClick={() => addConnection(from.id, to.id)}
                                variant="outline"
                                size="sm"
                                className="justify-start"
                              >
                                <Link2 className="h-3 w-3 mr-2" />
                                {from.name} → {to.name}
                              </Button>
                            ))
                          ))}
                        </div>

                        {connections.length > 0 && (
                          <div className="mt-4 pt-4 border-t">
                            <p className="text-xs font-medium mb-2">Active Connections ({connections.length}):</p>
                            <div className="space-y-2">
                              {connections.map((conn, idx) => {
                                const from = models.find(m => m.id === conn.from);
                                const to = models.find(m => m.id === conn.to);
                                return (
                                  <div key={idx} className="flex items-center justify-between text-xs bg-background p-2 rounded">
                                    <span className="text-lavender">
                                      {from?.name} → {to?.name}
                                    </span>
                                    <Button
                                      onClick={() => removeConnection(conn.from, conn.to)}
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6"
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Generated Code Preview */}
                  {generatedCode && (
                    <Card className="bg-muted/50">
                      <CardHeader>
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Code className="h-4 w-4" />
                          Generated Integration Code
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Textarea
                          data-testid="textarea-generated-code"
                          value={generatedCode}
                          readOnly
                          className="font-mono text-xs h-[300px]"
                        />
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
