import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Zap, Battery, Sparkles, Eye, Moon } from "lucide-react";
import type { EnergyType } from "@shared/schema";

interface EnergyTypeBadgeProps {
  type: EnergyType;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
  className?: string;
}

const energyTypeConfig: Record<EnergyType, { 
  label: string; 
  icon: typeof Zap; 
  bgClass: string;
  textClass: string;
}> = {
  manifestor: { 
    label: "Manifestor", 
    icon: Zap,
    bgClass: "bg-chart-1/15 dark:bg-chart-1/25",
    textClass: "text-chart-1"
  },
  generator: { 
    label: "Generator", 
    icon: Battery,
    bgClass: "bg-chart-2/15 dark:bg-chart-2/25",
    textClass: "text-chart-2"
  },
  manifesting_generator: { 
    label: "MG", 
    icon: Sparkles,
    bgClass: "bg-chart-3/15 dark:bg-chart-3/25",
    textClass: "text-chart-3"
  },
  projector: { 
    label: "Projector", 
    icon: Eye,
    bgClass: "bg-chart-4/15 dark:bg-chart-4/25",
    textClass: "text-chart-4"
  },
  reflector: { 
    label: "Reflector", 
    icon: Moon,
    bgClass: "bg-chart-5/15 dark:bg-chart-5/25",
    textClass: "text-chart-5"
  }
};

export function EnergyTypeBadge({ type, size = "md", showIcon = true, className }: EnergyTypeBadgeProps) {
  const config = energyTypeConfig[type];
  const Icon = config.icon;

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-1",
    lg: "text-base px-3 py-1.5"
  };

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5"
  };

  return (
    <Badge 
      variant="outline"
      className={cn(
        "font-medium border-0 gap-1.5",
        config.bgClass,
        config.textClass,
        sizeClasses[size],
        className
      )}
      data-testid={`badge-energy-${type}`}
    >
      {showIcon && <Icon className={iconSizes[size]} />}
      {config.label}
    </Badge>
  );
}
