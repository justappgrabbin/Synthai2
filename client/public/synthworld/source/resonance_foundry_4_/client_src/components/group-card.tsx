import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ResonanceScore } from "./resonance-score";
import { cn } from "@/lib/utils";
import type { Group } from "@shared/schema";
import { Users, Target, TrendingUp, Calendar } from "lucide-react";

interface GroupCardProps {
  group: Group;
  memberCount?: number;
  onClick?: () => void;
  className?: string;
}

const phaseConfig: Record<string, { label: string; color: string; week: number }> = {
  discovery: { label: "Discovery", color: "bg-chart-1/15 text-chart-1", week: 1 },
  assessment: { label: "Assessment", color: "bg-chart-2/15 text-chart-2", week: 2 },
  placement: { label: "Placement", color: "bg-chart-3/15 text-chart-3", week: 3 },
  activation: { label: "Activation", color: "bg-chart-4/15 text-chart-4", week: 4 },
  optimization: { label: "Optimization", color: "bg-chart-5/15 text-chart-5", week: 5 },
  sustain: { label: "Sustain", color: "bg-primary/15 text-primary", week: 6 }
};

export function GroupCard({ group, memberCount = 0, onClick, className }: GroupCardProps) {
  const phaseInfo = phaseConfig[group.phase] || phaseConfig.discovery;
  const progressPercent = (group.totalEarnings! / group.dailyTarget!) * 100;
  
  return (
    <Card 
      className={cn(
        "overflow-hidden transition-all duration-200",
        onClick && "cursor-pointer hover-elevate",
        className
      )}
      onClick={onClick}
      data-testid={`card-group-${group.id}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <CardTitle className="text-lg truncate" data-testid="text-group-name">
                {group.name}
              </CardTitle>
              <Badge 
                variant="outline" 
                className={cn("text-xs border-0 font-medium", phaseInfo.color)}
              >
                Week {phaseInfo.week}: {phaseInfo.label}
              </Badge>
            </div>
            <Badge variant="outline" className="text-xs font-normal">
              {group.niche}
            </Badge>
          </div>
          <ResonanceScore 
            score={group.resonanceScore || 50} 
            size="sm" 
            showLabel={false} 
            animated={false}
          />
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {group.description && (
          <p className="text-sm text-muted-foreground line-clamp-2" data-testid="text-group-description">
            {group.description}
          </p>
        )}

        <div className="grid grid-cols-3 gap-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-muted">
              <Users className="w-4 h-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Members</p>
              <p className="text-sm font-semibold" data-testid="text-member-count">
                {memberCount}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-muted">
              <Target className="w-4 h-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Daily Target</p>
              <p className="text-sm font-semibold" data-testid="text-daily-target">
                ${group.dailyTarget?.toFixed(0)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-muted">
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Earnings</p>
              <p className="text-sm font-semibold" data-testid="text-earnings">
                ${group.totalEarnings?.toFixed(0)}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Progress to daily target</span>
            <span className="font-medium">{Math.min(progressPercent, 100).toFixed(0)}%</span>
          </div>
          <Progress value={Math.min(progressPercent, 100)} className="h-1.5" />
        </div>

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Calendar className="w-3.5 h-3.5" />
          <span>
            Created {group.createdAt ? new Date(group.createdAt).toLocaleDateString() : "recently"}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
