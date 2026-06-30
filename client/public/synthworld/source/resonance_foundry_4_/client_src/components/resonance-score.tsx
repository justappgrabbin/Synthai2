import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface ResonanceScoreProps {
  score: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  animated?: boolean;
  className?: string;
}

export function ResonanceScore({ 
  score, 
  size = "md", 
  showLabel = true,
  animated = true,
  className 
}: ResonanceScoreProps) {
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const sizeClasses = {
    sm: "w-16 h-16",
    md: "w-24 h-24",
    lg: "w-32 h-32"
  };

  const textSizes = {
    sm: "text-sm",
    md: "text-xl",
    lg: "text-3xl"
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "stroke-chart-5";
    if (score >= 60) return "stroke-chart-2";
    if (score >= 40) return "stroke-chart-3";
    return "stroke-destructive";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Developing";
    return "Low";
  };

  return (
    <div className={cn("flex flex-col items-center gap-2", className)} data-testid="resonance-score">
      <div className={cn("relative", sizeClasses[size])}>
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            strokeWidth="8"
            className="stroke-muted"
          />
          <motion.circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            strokeWidth="8"
            strokeLinecap="round"
            className={cn(getScoreColor(score))}
            style={{
              strokeDasharray: circumference,
            }}
            initial={animated ? { strokeDashoffset: circumference } : { strokeDashoffset }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.span 
            className={cn("font-semibold", textSizes[size])}
            initial={animated ? { opacity: 0 } : { opacity: 1 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            data-testid="text-score-value"
          >
            {Math.round(score)}
          </motion.span>
        </div>
      </div>
      {showLabel && (
        <span className="text-xs text-muted-foreground font-medium" data-testid="text-score-label">
          {getScoreLabel(score)}
        </span>
      )}
    </div>
  );
}
