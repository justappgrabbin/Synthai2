import { Button } from "@/components/ui/button";
import { Bot, ArrowLeft, Plus } from "lucide-react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";

export function AgentPanel() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button
            data-testid="button-back-to-dashboard"
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Bot className="h-5 w-5 text-lavender" />
          <h2 className="text-lg font-semibold">Agent Creator</h2>
        </div>
        <Button
          data-testid="button-create-agent"
          className="bg-lavender hover:bg-lavender-hover"
          onClick={() => console.log('Creating new agent...')}
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Agent
        </Button>
      </header>

      <div className="p-8 max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-lavender mb-2">AI Agents</h1>
          <p className="text-muted-foreground">
            Build and manage your AI consciousness companions
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AgentCard
            name="Code Assistant"
            role="Development Helper"
            status="active"
          />
          <AgentCard
            name="Creative Advisor"
            role="Idea Generator"
            status="active"
          />
          <AgentCard
            name="Debug Companion"
            role="Error Detective"
            status="inactive"
          />
        </div>

        <div className="mt-12 p-8 border-2 border-dashed border-lavender/30 rounded-lg text-center bg-card">
          <Bot className="h-16 w-16 mx-auto mb-4 text-lavender/40" />
          <h3 className="text-lg font-semibold mb-2">Create Your First Agent</h3>
          <p className="text-sm text-muted-foreground mb-6">
            AI agents can help with coding, creative tasks, debugging, and more
          </p>
          <Button
            className="bg-lavender hover:bg-lavender-hover"
            onClick={() => console.log('Creating agent...')}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Agent
          </Button>
        </div>
      </div>
    </div>
  );
}

function AgentCard({ name, role, status }: { name: string; role: string; status: "active" | "inactive" }) {
  return (
    <Card className="p-6 hover:border-lavender/50 transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className="h-12 w-12 rounded-full bg-lavender/10 flex items-center justify-center">
          <Bot className="h-6 w-6 text-lavender" />
        </div>
        <div className={`h-2 w-2 rounded-full ${status === "active" ? "bg-green-500" : "bg-gray-400"}`} />
      </div>
      <h3 className="font-semibold mb-1">{name}</h3>
      <p className="text-sm text-muted-foreground mb-4">{role}</p>
      <Button
        variant="outline"
        size="sm"
        className="w-full"
        onClick={() => console.log('Configuring agent:', name)}
      >
        Configure
      </Button>
    </Card>
  );
}
