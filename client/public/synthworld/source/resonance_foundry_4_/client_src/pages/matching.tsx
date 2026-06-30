import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { UserProfileCard } from "@/components/user-profile-card";
import { MatchCard } from "@/components/match-card";
import { ResonanceScore } from "@/components/resonance-score";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Users, 
  Search, 
  Sparkles, 
  RefreshCw,
  Filter,
  ArrowRight
} from "lucide-react";
import type { User, Match } from "@shared/schema";

export default function Matching() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: currentUser } = useQuery<User>({
    queryKey: ["/api/users/current"]
  });

  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/users"]
  });

  const { data: matches, isLoading: matchesLoading } = useQuery<Match[]>({
    queryKey: ["/api/matches"]
  });

  const findMatchesMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/matches/find", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/matches"] });
      toast({
        title: "Matches Found",
        description: "New resonant connections have been identified!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const filteredUsers = users?.filter(user => 
    user.id !== currentUser?.id &&
    (user.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
     user.username.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getMatchedUser = (match: Match, currentUserId: string): User | undefined => {
    const otherId = match.user1Id === currentUserId ? match.user2Id : match.user1Id;
    return users?.find(u => u.id === otherId);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">
            Matchmaking
          </h1>
          <p className="text-muted-foreground mt-1">
            Find resonant connections based on energy alignment
          </p>
        </div>
        <Button 
          onClick={() => findMatchesMutation.mutate()}
          disabled={findMatchesMutation.isPending}
          data-testid="button-find-matches"
        >
          {findMatchesMutation.isPending ? (
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4 mr-2" />
          )}
          Find Matches
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search members..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="input-search-users"
              />
            </div>
            <Button variant="outline" size="icon" data-testid="button-filter">
              <Filter className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {matches && matches.length > 0 && currentUser && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Your Top Matches</h2>
            <Badge variant="secondary">
              {matches.length} matches
            </Badge>
          </div>
          
          <div className="space-y-4">
            {matchesLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="h-24 w-full" />
                  </CardContent>
                </Card>
              ))
            ) : (
              matches.slice(0, 5).map((match) => {
                const otherUser = getMatchedUser(match, currentUser.id);
                if (!otherUser) return null;
                
                return (
                  <MatchCard
                    key={match.id}
                    user1={currentUser}
                    user2={otherUser}
                    resonanceScore={match.resonanceScore}
                    synergyFactors={match.synergyFactors || []}
                    frictionFactors={match.frictionFactors || []}
                  />
                );
              })
            )}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Network Members</h2>
          <Badge variant="outline">
            {filteredUsers?.length || 0} members
          </Badge>
        </div>

        {usersLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="h-32 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredUsers && filteredUsers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUsers.map((user) => (
              <UserProfileCard 
                key={user.id} 
                user={user}
                showFullProfile={false}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-muted-foreground" />
              </div>
              <h3 className="font-medium mb-1">No members found</h3>
              <p className="text-sm text-muted-foreground">
                {searchQuery 
                  ? "Try adjusting your search" 
                  : "Be the first to join the network!"
                }
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {!currentUser && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-6 text-center">
            <Sparkles className="w-10 h-10 text-primary mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">Create Your Profile First</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Set up your Human Design profile to start finding resonant matches
            </p>
            <Button data-testid="button-create-profile-cta">
              Get Started
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
