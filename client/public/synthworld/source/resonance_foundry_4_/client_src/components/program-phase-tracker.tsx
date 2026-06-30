import { cn } from "@/lib/utils";
import { Check, Circle } from "lucide-react";
import type { ProgramPhase } from "@shared/schema";

interface ProgramPhaseTrackerProps {
  currentPhase: ProgramPhase;
  orientation?: "horizontal" | "vertical";
  size?: "sm" | "md";
  className?: string;
}

const phases: { key: ProgramPhase; label: string; week: number; description: string }[] = [
  { key: "discovery", label: "Discovery", week: 1, description: "Find your common thing" },
  { key: "assessment", label: "Assessment", week: 2, description: "Who's good for what" },
  { key: "placement", label: "Placement", week: 3, description: "Bring energy to the table" },
  { key: "activation", label: "Activation", week: 4, description: "See what happens" },
  { key: "optimization", label: "Optimization", week: 5, description: "Financial tweaks" },
  { key: "sustain", label: "Sustain", week: 6, description: "Scale or exit" }
];

export function ProgramPhaseTracker({ 
  currentPhase, 
  orientation = "horizontal",
  size = "md",
  className 
}: ProgramPhaseTrackerProps) {
  const currentIdx = phases.findIndex(p => p.key === currentPhase);

  const isComplete = (idx: number) => idx < currentIdx;
  const isCurrent = (idx: number) => idx === currentIdx;
  const isUpcoming = (idx: number) => idx > currentIdx;

  if (orientation === "vertical") {
    return (
      <div className={cn("space-y-1", className)} data-testid="program-phase-tracker">
        {phases.map((phase, idx) => (
          <div key={phase.key} className="flex items-start gap-3">
            <div className="flex flex-col items-center">
              <div 
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                  isComplete(idx) && "bg-chart-5 text-white",
                  isCurrent(idx) && "bg-primary text-primary-foreground ring-4 ring-primary/20",
                  isUpcoming(idx) && "bg-muted text-muted-foreground"
                )}
              >
                {isComplete(idx) ? (
                  <Check className="w-4 h-4" />
                ) : (
                  phase.week
                )}
              </div>
              {idx < phases.length - 1 && (
                <div 
                  className={cn(
                    "w-0.5 h-12 transition-colors",
                    isComplete(idx) ? "bg-chart-5" : "bg-muted"
                  )}
                />
              )}
            </div>
            <div className="pb-8">
              <p 
                className={cn(
                  "font-medium",
                  isComplete(idx) && "text-chart-5",
                  isCurrent(idx) && "text-primary",
                  isUpcoming(idx) && "text-muted-foreground"
                )}
                data-testid={`text-phase-${phase.key}`}
              >
                {phase.label}
              </p>
              <p className="text-sm text-muted-foreground">{phase.description}</p>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("w-full", className)} data-testid="program-phase-tracker">
      <div className="flex items-center justify-between relative">
        <div className="absolute top-4 left-0 right-0 h-0.5 bg-muted -z-10" />
        <div 
          className="absolute top-4 left-0 h-0.5 bg-chart-5 -z-10 transition-all duration-500"
          style={{ width: `${(currentIdx / (phases.length - 1)) * 100}%` }}
        />
        {phases.map((phase, idx) => (
          <div 
            key={phase.key} 
            className="flex flex-col items-center gap-2"
          >
            <div 
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                isComplete(idx) && "bg-chart-5 text-white",
                isCurrent(idx) && "bg-primary text-primary-foreground ring-4 ring-primary/20",
                isUpcoming(idx) && "bg-muted text-muted-foreground"
              )}
            >
              {isComplete(idx) ? (
                <Check className="w-4 h-4" />
              ) : (
                phase.week
              )}
            </div>
            <div className="text-center">
              <p 
                className={cn(
                  "text-xs font-medium",
                  size === "md" && "text-sm",
                  isComplete(idx) && "text-chart-5",
                  isCurrent(idx) && "text-primary",
                  isUpcoming(idx) && "text-muted-foreground"
                )}
              >
                {phase.label}
              </p>
              {size === "md" && (
                <p className="text-xs text-muted-foreground mt-0.5 max-w-20 hidden sm:block">
                  {phase.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
