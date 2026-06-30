import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ResonanceScore } from "@/components/resonance-score";
import { EnergyTypeBadge } from "@/components/energy-type-badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  User as UserIcon, 
  Calendar, 
  MapPin, 
  Sparkles, 
  Target,
  Save,
  Plus,
  X
} from "lucide-react";
import type { User, HumanDesignProfile, EnergyType } from "@shared/schema";
import { ENERGY_TYPE_INFO, HD_CENTERS } from "@shared/schema";

const profileFormSchema = z.object({
  displayName: z.string().min(2, "Name must be at least 2 characters"),
  username: z.string().min(3, "Username must be at least 3 characters").regex(/^[a-z0-9_]+$/, "Lowercase letters, numbers, and underscores only"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  birthYear: z.coerce.number().min(1900).max(2010),
  birthMonth: z.coerce.number().min(1).max(12),
  birthDay: z.coerce.number().min(1).max(31),
  birthHour: z.coerce.number().min(0).max(23),
  birthMinute: z.coerce.number().min(0).max(59),
  timezone: z.string().default("UTC"),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function Profile() {
  const { toast } = useToast();
  const [interests, setInterests] = useState<string[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [newInterest, setNewInterest] = useState("");
  const [newSkill, setNewSkill] = useState("");

  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/users/current"]
  });

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      displayName: "",
      username: "",
      email: "",
      birthYear: 1990,
      birthMonth: 1,
      birthDay: 1,
      birthHour: 12,
      birthMinute: 0,
      timezone: "UTC",
    }
  });

  const createProfileMutation = useMutation({
    mutationFn: async (values: ProfileFormValues) => {
      const data = {
        username: values.username,
        displayName: values.displayName,
        email: values.email || undefined,
        interests,
        skills,
        birthData: {
          year: values.birthYear,
          month: values.birthMonth,
          day: values.birthDay,
          hour: values.birthHour,
          minute: values.birthMinute,
          timezone: values.timezone
        }
      };
      return apiRequest("POST", "/api/users", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/current"] });
      toast({
        title: "Profile Created",
        description: "Your Human Design profile has been calculated!",
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

  const addInterest = () => {
    if (newInterest.trim() && !interests.includes(newInterest.trim())) {
      setInterests([...interests, newInterest.trim()]);
      setNewInterest("");
    }
  };

  const removeInterest = (interest: string) => {
    setInterests(interests.filter(i => i !== interest));
  };

  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill("");
    }
  };

  const removeSkill = (skill: string) => {
    setSkills(skills.filter(s => s !== skill));
  };

  const onSubmit = (values: ProfileFormValues) => {
    createProfileMutation.mutate(values);
  };

  if (isLoading) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const hdProfile = user?.hdProfile as HumanDesignProfile | null;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold" data-testid="text-page-title">
          {user ? "Your Profile" : "Create Your Profile"}
        </h1>
        <p className="text-muted-foreground mt-1">
          {user 
            ? "View your Human Design profile and resonance data"
            : "Enter your birth data to calculate your Human Design profile"
          }
        </p>
      </div>

      {user && hdProfile ? (
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
            <TabsTrigger value="design" data-testid="tab-design">Human Design</TabsTrigger>
            <TabsTrigger value="interests" data-testid="tab-interests">Interests & Skills</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="md:col-span-2">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <CardTitle className="text-xl" data-testid="text-user-name">
                        {user.displayName}
                      </CardTitle>
                      <CardDescription>@{user.username}</CardDescription>
                    </div>
                    <EnergyTypeBadge type={hdProfile.type} size="lg" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground flex items-center gap-1.5 mb-1">
                        <Target className="w-4 h-4" />
                        Strategy
                      </p>
                      <p className="font-medium capitalize">
                        {hdProfile.strategy.replace(/_/g, " ")}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground flex items-center gap-1.5 mb-1">
                        <Sparkles className="w-4 h-4" />
                        Authority
                      </p>
                      <p className="font-medium capitalize">
                        {hdProfile.authority}
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Profile: {hdProfile.profile}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {ENERGY_TYPE_INFO[hdProfile.type].description}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-2">Strengths</p>
                    <div className="flex flex-wrap gap-2">
                      {ENERGY_TYPE_INFO[hdProfile.type].strengths.map((strength, idx) => (
                        <Badge key={idx} variant="secondary">
                          {strength}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="text-center">
                  <CardTitle className="text-sm text-muted-foreground font-medium">
                    Resonance Score
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center pb-6">
                  <ResonanceScore 
                    score={user.resonanceScore || 50} 
                    size="lg" 
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="design" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Defined Centers</CardTitle>
                  <CardDescription>
                    Consistent, reliable energy patterns
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {hdProfile.definedCenters.map((center) => (
                      <Badge 
                        key={center} 
                        className="bg-primary/10 text-primary border-0"
                      >
                        {center}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Open Centers</CardTitle>
                  <CardDescription>
                    Areas of wisdom and potential conditioning
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {hdProfile.openCenters.map((center) => (
                      <Badge 
                        key={center} 
                        variant="outline"
                      >
                        {center}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg">Active Gates</CardTitle>
                  <CardDescription>
                    Your activated I Ching gates (1-64)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {hdProfile.gates.map((gate) => (
                      <Badge 
                        key={gate} 
                        variant="secondary"
                        className="font-mono"
                      >
                        {gate}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {hdProfile.channels.length > 0 && (
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-lg">Channels</CardTitle>
                    <CardDescription>
                      Connected gate pairs forming life themes
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {hdProfile.channels.map((channel, idx) => (
                        <Badge 
                          key={idx} 
                          className="bg-secondary/10 text-secondary border-0"
                        >
                          {channel}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="interests" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Interests</CardTitle>
                  <CardDescription>
                    Topics and areas you're passionate about
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {user.interests && user.interests.length > 0 ? (
                      user.interests.map((interest, idx) => (
                        <Badge key={idx} variant="outline">
                          {interest}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No interests added yet
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Skills</CardTitle>
                  <CardDescription>
                    Abilities you bring to the table
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {user.skills && user.skills.length > 0 ? (
                      user.skills.map((skill, idx) => (
                        <Badge key={idx} variant="secondary">
                          {skill}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No skills added yet
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserIcon className="w-5 h-5" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="displayName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Display Name</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Your name" 
                            {...field} 
                            data-testid="input-display-name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="username" 
                            {...field} 
                            data-testid="input-username"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email (optional)</FormLabel>
                      <FormControl>
                        <Input 
                          type="email" 
                          placeholder="email@example.com" 
                          {...field} 
                          data-testid="input-email"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Birth Data
                </CardTitle>
                <CardDescription>
                  Required to calculate your Human Design profile
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="birthYear"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Year</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="1990" 
                            {...field} 
                            data-testid="input-birth-year"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="birthMonth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Month</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={String(field.value)}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-birth-month">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Array.from({ length: 12 }, (_, i) => (
                              <SelectItem key={i + 1} value={String(i + 1)}>
                                {new Date(2000, i).toLocaleString('default', { month: 'long' })}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="birthDay"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Day</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="15" 
                            min={1}
                            max={31}
                            {...field} 
                            data-testid="input-birth-day"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="birthHour"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hour (0-23)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="12" 
                            min={0}
                            max={23}
                            {...field} 
                            data-testid="input-birth-hour"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="birthMinute"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Minute</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="30" 
                            min={0}
                            max={59}
                            {...field} 
                            data-testid="input-birth-minute"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="timezone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Timezone</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-timezone">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="UTC">UTC</SelectItem>
                            <SelectItem value="America/New_York">Eastern</SelectItem>
                            <SelectItem value="America/Chicago">Central</SelectItem>
                            <SelectItem value="America/Denver">Mountain</SelectItem>
                            <SelectItem value="America/Los_Angeles">Pacific</SelectItem>
                            <SelectItem value="Europe/London">London</SelectItem>
                            <SelectItem value="Europe/Paris">Paris</SelectItem>
                            <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Interests & Skills
                </CardTitle>
                <CardDescription>
                  Help us find resonant matches for you
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="mb-2 block">Interests</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      placeholder="Add an interest..."
                      value={newInterest}
                      onChange={(e) => setNewInterest(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addInterest())}
                      data-testid="input-new-interest"
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="icon"
                      onClick={addInterest}
                      data-testid="button-add-interest"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {interests.map((interest, idx) => (
                      <Badge key={idx} variant="outline" className="gap-1">
                        {interest}
                        <button
                          type="button"
                          onClick={() => removeInterest(interest)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="mb-2 block">Skills</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      placeholder="Add a skill..."
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                      data-testid="input-new-skill"
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="icon"
                      onClick={addSkill}
                      data-testid="button-add-skill"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {skills.map((skill, idx) => (
                      <Badge key={idx} variant="secondary" className="gap-1">
                        {skill}
                        <button
                          type="button"
                          onClick={() => removeSkill(skill)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button 
              type="submit" 
              size="lg" 
              className="w-full"
              disabled={createProfileMutation.isPending}
              data-testid="button-create-profile"
            >
              <Save className="w-4 h-4 mr-2" />
              {createProfileMutation.isPending ? "Creating Profile..." : "Create Profile & Calculate Design"}
            </Button>
          </form>
        </Form>
      )}
    </div>
  );
}
