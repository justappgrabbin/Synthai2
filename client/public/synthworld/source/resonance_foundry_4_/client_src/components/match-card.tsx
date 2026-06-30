import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ResonanceScore } from "./resonance-score";
import { cn } from "@/lib/utils";
import { ArrowRight, Check, AlertTriangle } from "lucide-react";
import type { User } from "@shared/schema";

interface MatchCardProps {
  user1: User;
  user2: User;
  resonanceScore: number;
  synergyFactors?: string[];
  frictionFactors?: string[];
  onClick?: () => void;
  className?: string;
}

export function MatchCard({ 
  user1, 
  user2, 
  resonanceScore, 
  synergyFactors = [],
  frictionFactors = [],
  onClick,
  className 
}: MatchCardProps) {
  const getInitials = (name: string) => 
    name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <Card 
      className={cn(
        "overflow-hidden",
        onClick && "cursor-pointer hover-elevate",
        className
      )}
      onClick={onClick}
      data-testid="card-match"
    >
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Avatar className="h-12 w-12 flex-shrink-0">
              <AvatarFallback className="bg-primary/10 text-primary font-medium">
                {getInitials(user1.displayName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate" data-testid="text-user1-name">{user1.displayName}</p>
              <p className="text-xs text-muted-foreground">@{user1.username}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
            <ResonanceScore 
              score={resonanceScore} 
              size="sm" 
              showLabel={false} 
              animated={false}
            />
            <ArrowRight className="w-4 h-4 text-muted-foreground rotate-180" />
          </div>

          <div className="flex items-center gap-3 flex-1 min-w-0 flex-row-reverse">
            <Avatar className="h-12 w-12 flex-shrink-0">
              <AvatarFallback className="bg-secondary/10 text-secondary font-medium">
                {getInitials(user2.displayName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0 text-right">
              <p className="font-medium truncate" data-testid="text-user2-name">{user2.displayName}</p>
              <p className="text-xs text-muted-foreground">@{user2.username}</p>
            </div>
          </div>
        </div>

        {(synergyFactors.length > 0 || frictionFactors.length > 0) && (
          <div className="grid grid-cols-2 gap-3">
            {synergyFactors.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-medium text-chart-5">
                  <Check className="w-3.5 h-3.5" />
                  Synergy
                </div>
                <div className="flex flex-wrap gap-1">
                  {synergyFactors.slice(0, 3).map((factor, idx) => (
                    <Badge 
                      key={idx} 
                      variant="outline" 
                      className="text-xs bg-chart-5/10 border-chart-5/20 text-chart-5"
                    >
                      {factor}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {frictionFactors.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-medium text-chart-3">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Watch for
                </div>
                <div className="flex flex-wrap gap-1">
                  {frictionFactors.slice(0, 3).map((factor, idx) => (
                    <Badge 
                      key={idx} 
                      variant="outline" 
                      className="text-xs bg-chart-3/10 border-chart-3/20 text-chart-3"
                    >
                      {factor}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
