import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/lib/theme";
import { 
  Settings as SettingsIcon, 
  Moon, 
  Sun,
  Bell,
  Shield,
  Trash2,
  Download,
  Info
} from "lucide-react";

export default function Settings() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold" data-testid="text-page-title">
          Settings
        </h1>
        <p className="text-muted-foreground mt-1">
          Customize your Resonance experience
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {theme === "dark" ? (
              <Moon className="w-5 h-5" />
            ) : (
              <Sun className="w-5 h-5" />
            )}
            Appearance
          </CardTitle>
          <CardDescription>
            Customize how the app looks
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="dark-mode">Dark Mode</Label>
              <p className="text-sm text-muted-foreground">
                Switch between light and dark themes
              </p>
            </div>
            <Switch
              id="dark-mode"
              checked={theme === "dark"}
              onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
              data-testid="switch-dark-mode"
            />
          </div>
          <Separator />
          <div className="flex gap-2">
            <Button 
              variant={theme === "light" ? "default" : "outline"}
              size="sm"
              onClick={() => setTheme("light")}
              data-testid="button-theme-light"
            >
              <Sun className="w-4 h-4 mr-2" />
              Light
            </Button>
            <Button 
              variant={theme === "dark" ? "default" : "outline"}
              size="sm"
              onClick={() => setTheme("dark")}
              data-testid="button-theme-dark"
            >
              <Moon className="w-4 h-4 mr-2" />
              Dark
            </Button>
            <Button 
              variant={theme === "system" ? "default" : "outline"}
              size="sm"
              onClick={() => setTheme("system")}
              data-testid="button-theme-system"
            >
              <SettingsIcon className="w-4 h-4 mr-2" />
              System
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notifications
          </CardTitle>
          <CardDescription>
            Control how you receive updates
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="match-notifications">Match Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Get notified when new resonant matches are found
              </p>
            </div>
            <Switch id="match-notifications" defaultChecked data-testid="switch-match-notifications" />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="group-notifications">Group Updates</Label>
              <p className="text-sm text-muted-foreground">
                Receive updates about your group's progress
              </p>
            </div>
            <Switch id="group-notifications" defaultChecked data-testid="switch-group-notifications" />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="oracle-notifications">Daily Oracle</Label>
              <p className="text-sm text-muted-foreground">
                Receive a daily I Ching reading
              </p>
            </div>
            <Switch id="oracle-notifications" data-testid="switch-oracle-notifications" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Privacy & Data
          </CardTitle>
          <CardDescription>
            Manage your data and privacy settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="profile-visibility">Public Profile</Label>
              <p className="text-sm text-muted-foreground">
                Allow others to see your profile in matchmaking
              </p>
            </div>
            <Switch id="profile-visibility" defaultChecked data-testid="switch-profile-visibility" />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="resonance-visibility">Show Resonance Score</Label>
              <p className="text-sm text-muted-foreground">
                Display your resonance score to other members
              </p>
            </div>
            <Switch id="resonance-visibility" defaultChecked data-testid="switch-resonance-visibility" />
          </div>
          <Separator />
          <div className="flex flex-col gap-3">
            <Button variant="outline" className="justify-start" data-testid="button-export-data">
              <Download className="w-4 h-4 mr-2" />
              Export My Data
            </Button>
            <Button variant="destructive" className="justify-start" data-testid="button-delete-account">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5" />
            About
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p><strong className="text-foreground">Resonance Network</strong> v1.0.0</p>
          <p>
            A platform for aligning energies through Human Design and I Ching wisdom, 
            enabling collective success through resonant collaboration.
          </p>
          <p className="text-xs">
            Built with the Pathways to Purpose framework.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
