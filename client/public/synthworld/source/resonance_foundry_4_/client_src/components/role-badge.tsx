import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Rocket, Hammer, Volume2, Compass, Link, Anchor } from "lucide-react";
import type { GroupRole } from "@shared/schema";

interface RoleBadgeProps {
  role: GroupRole;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
  className?: string;
}

const roleConfig: Record<GroupRole, { 
  label: string; 
  icon: typeof Rocket; 
  bgClass: string;
  textClass: string;
}> = {
  initiator: { 
    label: "Initiator", 
    icon: Rocket,
    bgClass: "bg-chart-1/15 dark:bg-chart-1/25",
    textClass: "text-chart-1"
  },
  builder: { 
    label: "Builder", 
    icon: Hammer,
    bgClass: "bg-chart-2/15 dark:bg-chart-2/25",
    textClass: "text-chart-2"
  },
  amplifier: { 
    label: "Amplifier", 
    icon: Volume2,
    bgClass: "bg-chart-3/15 dark:bg-chart-3/25",
    textClass: "text-chart-3"
  },
  advisor: { 
    label: "Advisor", 
    icon: Compass,
    bgClass: "bg-chart-4/15 dark:bg-chart-4/25",
    textClass: "text-chart-4"
  },
  synthesizer: { 
    label: "Synthesizer", 
    icon: Link,
    bgClass: "bg-chart-5/15 dark:bg-chart-5/25",
    textClass: "text-chart-5"
  },
  stabilizer: { 
    label: "Stabilizer", 
    icon: Anchor,
    bgClass: "bg-secondary/15 dark:bg-secondary/25",
    textClass: "text-secondary"
  }
};

export function RoleBadge({ role, size = "md", showIcon = true, className }: RoleBadgeProps) {
  const config = roleConfig[role];
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
      data-testid={`badge-role-${role}`}
    >
      {showIcon && <Icon className={iconSizes[size]} />}
      {config.label}
    </Badge>
  );
}
