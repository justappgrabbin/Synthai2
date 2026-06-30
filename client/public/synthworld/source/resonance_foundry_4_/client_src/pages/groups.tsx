import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
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
import { GroupCard } from "@/components/group-card";
import { ProgramPhaseTracker } from "@/components/program-phase-tracker";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Users, 
  Plus,
  Search,
  UserPlus
} from "lucide-react";
import type { Group, Membership } from "@shared/schema";

const createGroupSchema = z.object({
  name: z.string().min(3, "Group name must be at least 3 characters"),
  description: z.string().optional(),
  niche: z.string().min(2, "Please specify a niche or focus area"),
});

type CreateGroupValues = z.infer<typeof createGroupSchema>;

export default function Groups() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: groups, isLoading: groupsLoading } = useQuery<Group[]>({
    queryKey: ["/api/groups"]
  });

  const { data: myMemberships } = useQuery<Membership[]>({
    queryKey: ["/api/memberships/mine"]
  });

  const form = useForm<CreateGroupValues>({
    resolver: zodResolver(createGroupSchema),
    defaultValues: {
      name: "",
      description: "",
      niche: "",
    }
  });

  const createGroupMutation = useMutation({
    mutationFn: async (values: CreateGroupValues) => {
      return apiRequest("POST", "/api/groups", values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
      setDialogOpen(false);
      form.reset();
      toast({
        title: "Group Created",
        description: "Your group is ready for members!",
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

  const joinGroupMutation = useMutation({
    mutationFn: async (groupId: string) => {
      return apiRequest("POST", `/api/groups/${groupId}/join`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
      queryClient.invalidateQueries({ queryKey: ["/api/memberships/mine"] });
      toast({
        title: "Joined Group",
        description: "You are now a member of this group!",
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

  const onSubmit = (values: CreateGroupValues) => {
    createGroupMutation.mutate(values);
  };

  const filteredGroups = groups?.filter(group =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.niche.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const myGroupIds = new Set(myMemberships?.map(m => m.groupId) || []);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">
            Groups
          </h1>
          <p className="text-muted-foreground mt-1">
            Collaborate with resonant groups for collective success
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-group">
              <Plus className="w-4 h-4 mr-2" />
              Create Group
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create a New Group</DialogTitle>
              <DialogDescription>
                Start a cohort around a shared interest or niche
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Group Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., Content Creators Collective" 
                          {...field} 
                          data-testid="input-group-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="niche"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Niche / Focus Area</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., Digital Marketing, Crafts, Tech Services" 
                          {...field} 
                          data-testid="input-group-niche"
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
                          placeholder="What's this group about?" 
                          {...field} 
                          data-testid="input-group-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={createGroupMutation.isPending}
                  data-testid="button-submit-create-group"
                >
                  {createGroupMutation.isPending ? "Creating..." : "Create Group"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search groups by name or niche..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="input-search-groups"
            />
          </div>
        </CardContent>
      </Card>

      {myMemberships && myMemberships.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">My Groups</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {groups?.filter(g => myGroupIds.has(g.id)).map((group) => (
              <GroupCard 
                key={group.id} 
                group={group}
                memberCount={group.memberIds?.length || 0}
              />
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {myMemberships && myMemberships.length > 0 ? "Discover Groups" : "All Groups"}
          </h2>
          <Badge variant="outline">
            {filteredGroups?.length || 0} groups
          </Badge>
        </div>

        {groupsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="h-40 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredGroups && filteredGroups.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredGroups.filter(g => !myGroupIds.has(g.id)).map((group) => (
              <Card key={group.id} className="overflow-hidden">
                <GroupCard 
                  group={group}
                  memberCount={group.memberIds?.length || 0}
                />
                <div className="px-4 pb-4">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => joinGroupMutation.mutate(group.id)}
                    disabled={joinGroupMutation.isPending}
                    data-testid={`button-join-group-${group.id}`}
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Join Group
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-muted-foreground" />
              </div>
              <h3 className="font-medium mb-1">No groups found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchQuery 
                  ? "Try adjusting your search" 
                  : "Be the first to create a group!"
                }
              </p>
              <Button 
                variant="outline" 
                onClick={() => setDialogOpen(true)}
                data-testid="button-create-first-group"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Group
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">6-Week Program Structure</CardTitle>
          <CardDescription>
            Each group follows this structured pathway
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProgramPhaseTracker 
            currentPhase="discovery" 
            orientation="vertical"
          />
        </CardContent>
      </Card>
    </div>
  );
}
