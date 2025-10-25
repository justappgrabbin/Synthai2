import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Dashboard } from "@/components/Dashboard";
import { DeveloperPanel } from "@/components/DeveloperPanel";
import { GameCreator } from "@/components/GameCreator";
import { SettingsPanel } from "@/components/SettingsPanel";
import { PlayerPanel } from "@/components/PlayerPanel";
import { AgentPanel } from "@/components/AgentPanel";
import { GroveStore } from "@/components/GroveStore";
import { GANTrainer } from "@/components/GANTrainer";
import { PersistentAssistant } from "@/components/PersistentAssistant";
import { InstallPrompt } from "@/components/InstallPrompt";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/grove-store" component={GroveStore} />
      <Route path="/ide" component={DeveloperPanel} />
      <Route path="/game-creator" component={GameCreator} />
      <Route path="/gan-trainer" component={GANTrainer} />
      <Route path="/settings" component={SettingsPanel} />
      <Route path="/player" component={PlayerPanel} />
      <Route path="/agents" component={AgentPanel} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Router />
          <PersistentAssistant />
          <InstallPrompt />
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
