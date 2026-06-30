import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ResonanceScore } from "@/components/resonance-score";
import { ProgramPhaseTracker } from "@/components/program-phase-tracker";
import { GroupCard } from "@/components/group-card";
import { UserProfileCard } from "@/components/user-profile-card";
import { Link } from "wouter";
import { 
  Users, 
  Sparkles, 
  TrendingUp, 
  ArrowRight, 
  Target,
  Zap,
  BookOpen
} from "lucide-react";
import type { User, Group } from "@shared/schema";

export default function Dashboard() {
  const { data: currentUser, isLoading: userLoading } = useQuery<User>({
    queryKey: ["/api/users/current"]
  });

  const { data: groups, isLoading: groupsLoading } = useQuery<Group[]>({
    queryKey: ["/api/groups"]
  });

  const { data: stats } = useQuery<{
    totalUsers: number;
    activeGroups: number;
    totalEarnings: number;
    avgResonance: number;
  }>({
    queryKey: ["/api/stats"]
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">
            Welcome to Resonance
          </h1>
          <p className="text-muted-foreground mt-1">
            Your pathway to purpose starts here
          </p>
        </div>
        <Link href="/profile">
          <Button data-testid="button-setup-profile">
            <Sparkles className="w-4 h-4 mr-2" />
            Setup Profile
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Network Members</p>
                <p className="text-2xl font-semibold" data-testid="stat-total-users">
                  {stats?.totalUsers ?? 0}
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-primary/10">
                <Users className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Groups</p>
                <p className="text-2xl font-semibold" data-testid="stat-active-groups">
                  {stats?.activeGroups ?? 0}
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-secondary/10">
                <Zap className="w-5 h-5 text-secondary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Earnings</p>
                <p className="text-2xl font-semibold" data-testid="stat-earnings">
                  ${(stats?.totalEarnings ?? 0).toLocaleString()}
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-chart-5/10">
                <TrendingUp className="w-5 h-5 text-chart-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Resonance</p>
                <p className="text-2xl font-semibold" data-testid="stat-avg-resonance">
                  {stats?.avgResonance ?? 0}%
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-accent/10">
                <Target className="w-5 h-5 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {currentUser && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Your Program Journey</CardTitle>
          </CardHeader>
          <CardContent>
            <ProgramPhaseTracker 
              currentPhase="discovery" 
              size="md"
            />
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Active Groups</h2>
            <Link href="/groups">
              <Button variant="ghost" size="sm" data-testid="button-view-all-groups">
                View All
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
          
          {groupsLoading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="h-32 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : groups && groups.length > 0 ? (
            <div className="space-y-4">
              {groups.slice(0, 2).map((group) => (
                <GroupCard 
                  key={group.id} 
                  group={group} 
                  memberCount={group.memberIds?.length || 0}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <Users className="w-6 h-6 text-muted-foreground" />
                </div>
                <h3 className="font-medium mb-1">No groups yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Join or create a group to start collaborating
                </p>
                <Link href="/matching">
                  <Button size="sm" data-testid="button-find-matches">
                    Find Matches
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Quick Actions</h2>
          
          <Card className="hover-elevate cursor-pointer">
            <Link href="/matching">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-primary/10">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Find Resonant Matches</p>
                  <p className="text-sm text-muted-foreground">
                    Connect with aligned individuals
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              </CardContent>
            </Link>
          </Card>

          <Card className="hover-elevate cursor-pointer">
            <Link href="/oracle">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-secondary/10">
                  <BookOpen className="w-5 h-5 text-secondary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Consult the Oracle</p>
                  <p className="text-sm text-muted-foreground">
                    Get I Ching guidance
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              </CardContent>
            </Link>
          </Card>

          <Card className="hover-elevate cursor-pointer">
            <Link href="/opportunities">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-chart-5/10">
                  <TrendingUp className="w-5 h-5 text-chart-5" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">View Opportunities</p>
                  <p className="text-sm text-muted-foreground">
                    Track financial progress
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              </CardContent>
            </Link>
          </Card>

          {currentUser && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Your Resonance
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 flex justify-center">
                <ResonanceScore 
                  score={currentUser.resonanceScore || 50} 
                  size="lg" 
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
