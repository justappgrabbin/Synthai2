import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Hexagram, HexagramLine } from "@shared/schema";

interface HexagramDisplayProps {
  hexagram: Hexagram;
  size?: "sm" | "md" | "lg";
  showDetails?: boolean;
  className?: string;
}

function HexagramLine({ 
  line, 
  size 
}: { 
  line: HexagramLine; 
  size: "sm" | "md" | "lg" 
}) {
  const isYang = line === "yang" || line === "changing_yang";
  const isChanging = line === "changing_yin" || line === "changing_yang";
  
  const heights = {
    sm: "h-1.5",
    md: "h-2",
    lg: "h-2.5"
  };

  const widths = {
    sm: "w-12",
    md: "w-16",
    lg: "w-20"
  };

  if (isYang) {
    return (
      <div 
        className={cn(
          heights[size],
          widths[size],
          "rounded-full",
          isChanging 
            ? "bg-gradient-to-r from-primary via-accent to-primary" 
            : "bg-foreground"
        )}
      />
    );
  }

  return (
    <div className={cn("flex items-center gap-1", widths[size])}>
      <div 
        className={cn(
          heights[size],
          "flex-1 rounded-full",
          isChanging 
            ? "bg-gradient-to-r from-primary to-accent" 
            : "bg-foreground"
        )}
      />
      <div className={cn(widths[size] === "w-12" ? "w-2" : widths[size] === "w-16" ? "w-3" : "w-4")} />
      <div 
        className={cn(
          heights[size],
          "flex-1 rounded-full",
          isChanging 
            ? "bg-gradient-to-l from-primary to-accent" 
            : "bg-foreground"
        )}
      />
    </div>
  );
}

export function HexagramDisplay({ 
  hexagram, 
  size = "md", 
  showDetails = true,
  className 
}: HexagramDisplayProps) {
  const gaps = {
    sm: "gap-1",
    md: "gap-1.5",
    lg: "gap-2"
  };

  return (
    <Card className={cn("overflow-hidden", className)} data-testid={`hexagram-${hexagram.number}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-lg font-semibold" data-testid="text-hexagram-name">
              {hexagram.number}. {hexagram.name}
            </CardTitle>
            <p className="text-sm text-muted-foreground font-medium">
              {hexagram.chineseName}
            </p>
          </div>
          <div className={cn("flex flex-col items-center", gaps[size])}>
            {hexagram.lines.slice().reverse().map((line, idx) => (
              <HexagramLine key={idx} line={line} size={size} />
            ))}
          </div>
        </div>
      </CardHeader>
      {showDetails && (
        <CardContent className="space-y-3">
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
              Meaning
            </h4>
            <p className="text-sm" data-testid="text-hexagram-meaning">{hexagram.meaning}</p>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
              Judgment
            </h4>
            <p className="text-sm italic text-muted-foreground" data-testid="text-hexagram-judgment">
              {hexagram.judgment}
            </p>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
              Image
            </h4>
            <p className="text-sm" data-testid="text-hexagram-image">{hexagram.image}</p>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
