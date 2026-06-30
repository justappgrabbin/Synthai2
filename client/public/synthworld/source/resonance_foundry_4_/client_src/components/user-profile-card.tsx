import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { EnergyTypeBadge } from "./energy-type-badge";
import { ResonanceScore } from "./resonance-score";
import { cn } from "@/lib/utils";
import type { User, HumanDesignProfile } from "@shared/schema";
import { Sparkles, Target, Users } from "lucide-react";

interface UserProfileCardProps {
  user: User;
  showFullProfile?: boolean;
  compact?: boolean;
  className?: string;
}

export function UserProfileCard({ 
  user, 
  showFullProfile = false, 
  compact = false,
  className 
}: UserProfileCardProps) {
  const hdProfile = user.hdProfile as HumanDesignProfile | null;
  const initials = user.displayName
    .split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  if (compact) {
    return (
      <div 
        className={cn("flex items-center gap-3 p-2 rounded-md hover-elevate", className)}
        data-testid={`card-user-compact-${user.id}`}
      >
        <Avatar className="h-10 w-10">
          <AvatarFallback className="bg-primary/10 text-primary font-medium text-sm">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate" data-testid="text-user-name">{user.displayName}</p>
          {hdProfile && (
            <div className="flex items-center gap-2 mt-0.5">
              <EnergyTypeBadge type={hdProfile.type} size="sm" />
            </div>
          )}
        </div>
        {user.resonanceScore && (
          <ResonanceScore score={user.resonanceScore} size="sm" showLabel={false} animated={false} />
        )}
      </div>
    );
  }

  return (
    <Card className={cn("overflow-hidden", className)} data-testid={`card-user-${user.id}`}>
      <CardHeader className="pb-4">
        <div className="flex items-start gap-4">
          <Avatar className="h-14 w-14">
            <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg truncate" data-testid="text-user-display-name">
              {user.displayName}
            </h3>
            <p className="text-sm text-muted-foreground">@{user.username}</p>
            {hdProfile && (
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <EnergyTypeBadge type={hdProfile.type} />
                <Badge variant="outline" className="text-xs">
                  {hdProfile.profile}
                </Badge>
              </div>
            )}
          </div>
          {user.resonanceScore && (
            <ResonanceScore score={user.resonanceScore} size="sm" />
          )}
        </div>
      </CardHeader>
      
      {showFullProfile && hdProfile && (
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                <Target className="w-3.5 h-3.5" />
                Strategy
              </div>
              <p className="text-sm font-medium capitalize">
                {hdProfile.strategy.replace(/_/g, " ")}
              </p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                <Sparkles className="w-3.5 h-3.5" />
                Authority
              </div>
              <p className="text-sm font-medium capitalize">
                {hdProfile.authority}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              <Users className="w-3.5 h-3.5" />
              Defined Centers
            </div>
            <div className="flex flex-wrap gap-1.5">
              {hdProfile.definedCenters.map((center) => (
                <Badge 
                  key={center} 
                  variant="secondary" 
                  className="text-xs"
                >
                  {center}
                </Badge>
              ))}
            </div>
          </div>

          {user.interests && user.interests.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Interests
              </p>
              <div className="flex flex-wrap gap-1.5">
                {user.interests.map((interest, idx) => (
                  <Badge 
                    key={idx} 
                    variant="outline" 
                    className="text-xs"
                  >
                    {interest}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {user.skills && user.skills.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Skills
              </p>
              <div className="flex flex-wrap gap-1.5">
                {user.skills.map((skill, idx) => (
                  <Badge 
                    key={idx} 
                    variant="outline" 
                    className="text-xs bg-secondary/10 border-secondary/30"
                  >
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
