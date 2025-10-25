import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Code2, Play, Bot, Settings, Store, Clock, Sparkles, ArrowRight, type LucideIcon } from "lucide-react";
import { AppRegistry, type AppModule } from "@/lib/appRegistry";
import { ActivityTracker, type AppActivity } from "@/lib/activityTracker";

const CORE_APPS: AppModule[] = [
  {
    id: "ide",
    name: "Launch IDE",
    description: "Code editor & developer environment",
    path: "/ide",
    icon: Code2,
    variant: "primary",
    type: "core",
    version: "1.0.0"
  },
  {
    id: "grove-store",
    name: "Grove Store",
    description: "Discover community apps, agents & templates",
    path: "/grove-store",
    icon: Store,
    variant: "primary",
    type: "core",
    version: "1.0.0"
  },
  {
    id: "player",
    name: "YOU–N–I–Versal Player",
    description: "Play & explore creative bundles",
    path: "/player",
    icon: Play,
    type: "core",
    version: "1.0.0"
  },
  {
    id: "agents",
    name: "Agent Creator",
    description: "Build & manage AI agents",
    path: "/agents",
    icon: Bot,
    type: "core",
    version: "1.0.0"
  },
  {
    id: "settings",
    name: "Settings",
    description: "Configure AI backends & preferences",
    path: "/settings",
    icon: Settings,
    type: "core",
    version: "1.0.0"
  }
];

export function Dashboard() {
  const [, setLocation] = useLocation();
  const [apps, setApps] = useState<AppModule[]>(CORE_APPS);
  const [recentlyVisited, setRecentlyVisited] = useState<AppActivity[]>([]);
  const [recentlyCreated, setRecentlyCreated] = useState<AppActivity[]>([]);
  const [recommendations, setRecommendations] = useState<AppActivity[]>([]);

  useEffect(() => {
    const customApps = AppRegistry.getInstalledApps();
    if (customApps.length > 0) {
      setApps([...CORE_APPS, ...customApps]);
    }

    setRecentlyVisited(ActivityTracker.getRecentlyVisited(4));
    setRecentlyCreated(ActivityTracker.getRecentlyCreated(4));
    setRecommendations(ActivityTracker.getRecommendations(6));
  }, []);

  const handleAppClick = (appId: string, appName: string, appType: string, path: string) => {
    ActivityTracker.recordVisit(appId, appName, appType);
    setLocation(path);
  };

  const getIconForApp = (appId: string) => {
    const app = [...CORE_APPS, ...AppRegistry.getInstalledApps()].find(a => a.id === appId);
    return app?.icon || Code2;
  };

  const getPathForApp = (appId: string) => {
    const app = [...CORE_APPS, ...AppRegistry.getInstalledApps()].find(a => a.id === appId);
    return app?.path || `/${appId}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-lavender/10 to-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-lavender" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            YOU–N–I–VERSE Studio
          </h1>
          <p className="text-muted-foreground text-lg">
            The Indyverse • Your Creative IDE with AI Consciousness
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Gateway v1.0.0 • {apps.length} {apps.length === 1 ? 'module' : 'modules'} available
          </p>
        </div>

        {/* Recently Visited */}
        {recentlyVisited.length > 0 && (
          <Card className="mb-6" data-testid="card-recent-apps">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-lavender" />
                <CardTitle>Recent Apps</CardTitle>
              </div>
              <CardDescription>Pick up where you left off</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {recentlyVisited.map((activity) => (
                  <ActivityCard
                    key={activity.appId}
                    activity={activity}
                    icon={getIconForApp(activity.appId)}
                    onClick={() => handleAppClick(
                      activity.appId,
                      activity.appName,
                      activity.appType,
                      getPathForApp(activity.appId)
                    )}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recently Created */}
        {recentlyCreated.length > 0 && (
          <Card className="mb-6" data-testid="card-created-apps">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-lavender" />
                <CardTitle>Recently Created</CardTitle>
              </div>
              <CardDescription>Your latest creations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {recentlyCreated.map((activity) => (
                  <ActivityCard
                    key={activity.appId}
                    activity={activity}
                    icon={getIconForApp(activity.appId)}
                    onClick={() => handleAppClick(
                      activity.appId,
                      activity.appName,
                      activity.appType,
                      getPathForApp(activity.appId)
                    )}
                    showCreatedDate
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Core Apps */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Launch Pad</CardTitle>
            <CardDescription>Your core creative tools</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {apps.map((app) => (
                <PortalButton
                  key={app.id}
                  icon={app.icon}
                  title={app.name}
                  description={app.description}
                  onClick={() => handleAppClick(app.id, app.name, app.type, app.path)}
                  variant={app.variant}
                  testId={`button-portal-${app.id}`}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <Card data-testid="card-recommendations">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-lavender" />
                <CardTitle>For You</CardTitle>
              </div>
              <CardDescription>Recommended based on your activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {recommendations.map((activity) => (
                  <ActivityCard
                    key={activity.appId}
                    activity={activity}
                    icon={getIconForApp(activity.appId)}
                    onClick={() => handleAppClick(
                      activity.appId,
                      activity.appName,
                      activity.appType,
                      getPathForApp(activity.appId)
                    )}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>✨ Welcome to your cosmic workspace</p>
        </div>
      </div>
    </div>
  );
}

interface ActivityCardProps {
  activity: AppActivity;
  icon: LucideIcon | string;
  onClick: () => void;
  showCreatedDate?: boolean;
}

function ActivityCard({ activity, icon: Icon, onClick, showCreatedDate }: ActivityCardProps) {
  const isImageIcon = typeof Icon === 'string';
  const timeAgo = (date: string) => {
    if (!date) return 'New';
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <button
      onClick={onClick}
      data-testid={`activity-card-${activity.appId}`}
      className="flex items-center gap-3 p-3 rounded-md border bg-card hover-elevate active-elevate-2 text-left transition-all"
    >
      <div className="flex-shrink-0">
        {isImageIcon ? (
          <img src={Icon as string} alt={activity.appName} className="h-8 w-8 object-contain" />
        ) : (
          <Icon className="h-8 w-8 text-lavender" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{activity.appName}</p>
        <p className="text-xs text-muted-foreground">
          {showCreatedDate && activity.createdAt
            ? `Created ${timeAgo(activity.createdAt)}`
            : timeAgo(activity.lastVisited)}
        </p>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
    </button>
  );
}

interface PortalButtonProps {
  icon: LucideIcon | string;
  title: string;
  description: string;
  onClick: () => void;
  variant?: "primary" | "default";
  testId?: string;
}

function PortalButton({ icon: Icon, title, description, onClick, variant = "default", testId }: PortalButtonProps) {
  const isImageIcon = typeof Icon === 'string';
  
  return (
    <button
      data-testid={testId}
      onClick={onClick}
      className={`group relative h-40 rounded-lg border-2 transition-all duration-300 hover:scale-105 hover:shadow-xl ${
        variant === "primary"
          ? "bg-lavender border-lavender text-white hover:bg-lavender-hover"
          : "bg-card border-border hover:border-lavender/50"
      }`}
      style={{
        boxShadow: variant === "primary" ? "0 0 20px rgba(155, 135, 245, 0.3)" : undefined
      }}
    >
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        {isImageIcon ? (
          <img 
            src={Icon as string} 
            alt={title} 
            className="h-12 w-12 mb-4 object-contain" 
          />
        ) : (
          <Icon className={`h-12 w-12 mb-4 ${variant === "primary" ? "text-white" : "text-lavender"}`} />
        )}
        <h3 className={`text-lg font-semibold mb-2 ${variant === "primary" ? "text-white" : "text-foreground"}`}>
          {title}
        </h3>
        <p className={`text-sm ${variant === "primary" ? "text-white/80" : "text-muted-foreground"}`}>
          {description}
        </p>
      </div>
    </button>
  );
}
