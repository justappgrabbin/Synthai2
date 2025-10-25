import { useState, useEffect } from "react";
import { Bot, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AIBackend {
  id: string;
  name: string;
  displayName: string;
  requiresKey: boolean;
  keyLabel?: string;
  keyPlaceholder?: string;
  endpoint?: string;
}

const AI_BACKENDS: AIBackend[] = [
  {
    id: "claude",
    name: "Claude",
    displayName: "Claude (Anthropic)",
    requiresKey: true,
    keyLabel: "Anthropic API Key",
    keyPlaceholder: "sk-ant-...",
    endpoint: "https://api.anthropic.com/v1/messages"
  },
  {
    id: "gpt",
    name: "GPT",
    displayName: "GPT (OpenAI)",
    requiresKey: true,
    keyLabel: "OpenAI API Key",
    keyPlaceholder: "sk-...",
    endpoint: "https://api.openai.com/v1/chat/completions"
  },
  {
    id: "codellama",
    name: "CodeLlama",
    displayName: "CodeLlama",
    requiresKey: false,
    endpoint: "http://localhost:11434/api/generate" // Ollama local endpoint
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    displayName: "DeepSeek",
    requiresKey: true,
    keyLabel: "DeepSeek API Key",
    keyPlaceholder: "sk-...",
    endpoint: "https://api.deepseek.com/v1/chat/completions"
  },
  {
    id: "grok",
    name: "Grok",
    displayName: "Grok (xAI)",
    requiresKey: true,
    keyLabel: "Grok API Key",
    keyPlaceholder: "xai-...",
    endpoint: "https://api.x.ai/v1/chat/completions"
  }
];

export function AIBackendSelector() {
  const [selectedBackend, setSelectedBackend] = useState<AIBackend>(AI_BACKENDS[0]);
  const [apiKey, setApiKey] = useState("");
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    // Load saved settings from localStorage
    const savedBackendId = localStorage.getItem("ai_backend");
    const savedKey = localStorage.getItem(`ai_key_${selectedBackend.id}`);
    
    if (savedBackendId) {
      const backend = AI_BACKENDS.find(b => b.id === savedBackendId);
      if (backend) {
        setSelectedBackend(backend);
      }
    }
    
    if (savedKey) {
      setApiKey(savedKey);
      setIsConfigured(true);
    }
  }, []);

  const handleBackendChange = (backend: AIBackend) => {
    setSelectedBackend(backend);
    localStorage.setItem("ai_backend", backend.id);
    
    // Load saved key for this backend
    const savedKey = localStorage.getItem(`ai_key_${backend.id}`);
    if (savedKey) {
      setApiKey(savedKey);
      setIsConfigured(true);
    } else {
      setApiKey("");
      setIsConfigured(false);
    }
  };

  const handleSaveKey = () => {
    if (selectedBackend.requiresKey && apiKey) {
      localStorage.setItem(`ai_key_${selectedBackend.id}`, apiKey);
      setIsConfigured(true);
    } else if (!selectedBackend.requiresKey) {
      setIsConfigured(true);
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-card">
      <div className="flex items-center gap-2">
        <Bot className="h-5 w-5 text-[#9b87f5]" /> {/* Lavender accent */}
        <h3 className="text-base font-medium">AI Assistant Backend</h3>
      </div>

      {/* Backend Selector Dropdown */}
      <div className="space-y-2">
        <Label>Select AI Model</Label>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              className="w-full justify-between hover:border-[#9b87f5] transition-colors"
            >
              <span className="flex items-center gap-2">
                <Bot className="h-4 w-4" />
                {selectedBackend.displayName}
              </span>
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)]">
            <DropdownMenuLabel>Choose AI Backend</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {AI_BACKENDS.map((backend) => (
              <DropdownMenuItem
                key={backend.id}
                onClick={() => handleBackendChange(backend)}
                className={selectedBackend.id === backend.id ? "bg-[#9b87f5]/10" : ""}
              >
                <span className="flex items-center gap-2">
                  {backend.displayName}
                  {!backend.requiresKey && (
                    <span className="text-xs text-muted-foreground">(Local)</span>
                  )}
                </span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* API Key Input (if required) */}
      {selectedBackend.requiresKey && (
        <div className="space-y-2">
          <Label htmlFor="api-key">{selectedBackend.keyLabel}</Label>
          <div className="flex gap-2">
            <Input
              id="api-key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={selectedBackend.keyPlaceholder}
              className="font-mono text-sm"
            />
            <Button 
              onClick={handleSaveKey}
              className="bg-[#9b87f5] hover:bg-[#8b77e5]"
            >
              Save
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            {isConfigured ? "✓ API key configured" : "Enter your API key to enable"}
          </p>
        </div>
      )}

      {/* Local Model Info */}
      {!selectedBackend.requiresKey && (
        <div className="p-3 rounded-md bg-[#9b87f5]/5 border border-[#9b87f5]/20">
          <p className="text-xs text-muted-foreground">
            <strong>{selectedBackend.name}</strong> runs locally via Ollama.
            Make sure Ollama is running on your machine.
          </p>
        </div>
      )}

      {/* Status Indicator */}
      <div className="flex items-center gap-2 pt-2 border-t">
        <div className={`h-2 w-2 rounded-full ${isConfigured ? 'bg-green-500' : 'bg-yellow-500'}`} />
        <span className="text-xs text-muted-foreground">
          {isConfigured ? `${selectedBackend.name} ready` : "Configuration required"}
        </span>
      </div>
    </div>
  );
}
