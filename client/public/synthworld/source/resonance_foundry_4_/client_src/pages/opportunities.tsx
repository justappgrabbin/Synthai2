import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  TrendingUp, 
  Plus,
  Target,
  DollarSign,
  Sparkles,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle
} from "lucide-react";
import type { Opportunity, Group } from "@shared/schema";

const createOpportunitySchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  targetAmount: z.coerce.number().min(1, "Target must be at least $1"),
  groupId: z.string().min(1, "Please select a group"),
});

type CreateOpportunityValues = z.infer<typeof createOpportunitySchema>;

export default function Opportunities() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: opportunities, isLoading: opportunitiesLoading } = useQuery<Opportunity[]>({
    queryKey: ["/api/opportunities"]
  });

  const { data: groups } = useQuery<Group[]>({
    queryKey: ["/api/groups"]
  });

  const form = useForm<CreateOpportunityValues>({
    resolver: zodResolver(createOpportunitySchema),
    defaultValues: {
      title: "",
      description: "",
      targetAmount: 100,
      groupId: "",
    }
  });

  const createOpportunityMutation = useMutation({
    mutationFn: async (values: CreateOpportunityValues) => {
      return apiRequest("POST", "/api/opportunities", values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/opportunities"] });
      setDialogOpen(false);
      form.reset();
      toast({
        title: "Opportunity Created",
        description: "Track your progress toward this goal!",
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

  const updateProgressMutation = useMutation({
    mutationFn: async ({ id, amount }: { id: string; amount: number }) => {
      return apiRequest("PATCH", `/api/opportunities/${id}`, { currentAmount: amount });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/opportunities"] });
      toast({
        title: "Progress Updated",
        description: "Keep up the great work!",
      });
    }
  });

  const onSubmit = (values: CreateOpportunityValues) => {
    createOpportunityMutation.mutate(values);
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "completed":
        return { icon: CheckCircle2, color: "text-chart-5", bg: "bg-chart-5/10" };
      case "active":
        return { icon: Clock, color: "text-chart-2", bg: "bg-chart-2/10" };
      default:
        return { icon: AlertCircle, color: "text-muted-foreground", bg: "bg-muted" };
    }
  };

  const activeOpportunities = opportunities?.filter(o => o.status === "active") || [];
  const completedOpportunities = opportunities?.filter(o => o.status === "completed") || [];

  const totalTarget = opportunities?.reduce((sum, o) => sum + (o.targetAmount || 0), 0) || 0;
  const totalCurrent = opportunities?.reduce((sum, o) => sum + (o.currentAmount || 0), 0) || 0;
  const totalSynergyBonus = opportunities?.reduce((sum, o) => sum + (o.synergyBonus || 0), 0) || 0;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">
            Financial Opportunities
          </h1>
          <p className="text-muted-foreground mt-1">
            Track group income and financial synergy bonuses
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-opportunity">
              <Plus className="w-4 h-4 mr-2" />
              New Opportunity
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Financial Opportunity</DialogTitle>
              <DialogDescription>
                Set a financial goal for your group to work toward
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., First $100 Day" 
                          {...field} 
                          data-testid="input-opportunity-title"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="groupId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Group</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-opportunity-group">
                            <SelectValue placeholder="Select a group" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {groups?.map((group) => (
                            <SelectItem key={group.id} value={group.id}>
                              {group.name}
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
                  name="targetAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Amount ($)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="100" 
                          {...field} 
                          data-testid="input-opportunity-target"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Details about this opportunity..." 
                          {...field} 
                          data-testid="input-opportunity-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={createOpportunityMutation.isPending}
                  data-testid="button-submit-create-opportunity"
                >
                  {createOpportunityMutation.isPending ? "Creating..." : "Create Opportunity"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Target</p>
                <p className="text-2xl font-semibold" data-testid="stat-total-target">
                  ${totalTarget.toLocaleString()}
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-primary/10">
                <Target className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Current Progress</p>
                <p className="text-2xl font-semibold" data-testid="stat-current-progress">
                  ${totalCurrent.toLocaleString()}
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-chart-2/10">
                <DollarSign className="w-5 h-5 text-chart-2" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Synergy Bonus</p>
                <p className="text-2xl font-semibold text-chart-5" data-testid="stat-synergy-bonus">
                  +${totalSynergyBonus.toLocaleString()}
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-chart-5/10">
                <Sparkles className="w-5 h-5 text-chart-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="text-lg">The $100/Day Path</CardTitle>
          <CardDescription>
            Building toward sustainable group income
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="p-3 rounded-lg bg-background/50">
              <p className="font-medium">Daily Goal</p>
              <p className="text-2xl font-bold text-primary">$100</p>
              <p className="text-xs text-muted-foreground mt-1">Per group, shared among members</p>
            </div>
            <div className="p-3 rounded-lg bg-background/50">
              <p className="font-medium">Annual Projection</p>
              <p className="text-2xl font-bold text-chart-2">$36,500</p>
              <p className="text-xs text-muted-foreground mt-1">$100/day x 365 days</p>
            </div>
            <div className="p-3 rounded-lg bg-background/50">
              <p className="font-medium">With 20% Compound</p>
              <p className="text-2xl font-bold text-chart-5">$43,800</p>
              <p className="text-xs text-muted-foreground mt-1">Reinvest group earnings</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Formula: <code className="bg-muted px-1.5 py-0.5 rounded text-xs">Daily Target = (Group Pool / Members) + Synergy Bonus</code>
          </p>
        </CardContent>
      </Card>

      {activeOpportunities.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Active Opportunities</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeOpportunities.map((opportunity) => {
              const progress = ((opportunity.currentAmount || 0) / opportunity.targetAmount) * 100;
              const group = groups?.find(g => g.id === opportunity.groupId);
              
              return (
                <Card key={opportunity.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <CardTitle className="text-base" data-testid={`text-opportunity-title-${opportunity.id}`}>
                          {opportunity.title}
                        </CardTitle>
                        {group && (
                          <Badge variant="outline" className="mt-1 text-xs">
                            {group.name}
                          </Badge>
                        )}
                      </div>
                      <Badge className="bg-chart-2/10 text-chart-2 border-0">
                        Active
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {opportunity.description && (
                      <p className="text-sm text-muted-foreground">
                        {opportunity.description}
                      </p>
                    )}
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">
                          ${opportunity.currentAmount?.toFixed(0)} / ${opportunity.targetAmount.toFixed(0)}
                        </span>
                      </div>
                      <Progress value={Math.min(progress, 100)} className="h-2" />
                    </div>

                    {(opportunity.synergyBonus || 0) > 0 && (
                      <div className="flex items-center gap-2 text-sm text-chart-5">
                        <Sparkles className="w-4 h-4" />
                        <span>+${opportunity.synergyBonus?.toFixed(0)} synergy bonus</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>
                        Created {opportunity.createdAt ? new Date(opportunity.createdAt).toLocaleDateString() : "recently"}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {completedOpportunities.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Completed</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {completedOpportunities.map((opportunity) => {
              const group = groups?.find(g => g.id === opportunity.groupId);
              
              return (
                <Card key={opportunity.id} className="bg-chart-5/5 border-chart-5/20">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-chart-5/10">
                        <CheckCircle2 className="w-5 h-5 text-chart-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{opportunity.title}</p>
                        <p className="text-sm text-chart-5">
                          ${opportunity.targetAmount.toFixed(0)} earned
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {opportunitiesLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!opportunitiesLoading && (!opportunities || opportunities.length === 0) && (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-6 h-6 text-muted-foreground" />
            </div>
            <h3 className="font-medium mb-1">No opportunities yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first financial goal to track group progress
            </p>
            <Button 
              variant="outline" 
              onClick={() => setDialogOpen(true)}
              data-testid="button-create-first-opportunity"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Opportunity
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
