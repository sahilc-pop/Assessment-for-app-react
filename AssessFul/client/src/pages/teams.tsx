import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import Navigation from "@/components/layout/navigation";
import { useAuth } from "@/hooks/useAuth";
import type { ProjectWithMembers } from "@shared/schema";

export default function Teams() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [joinCode, setJoinCode] = useState("");
  const [showJoinDialog, setShowJoinDialog] = useState(false);

  const { data: projects = [], isLoading } = useQuery<ProjectWithMembers[]>({
    queryKey: ["/api/projects"],
  });

  const joinTeamMutation = useMutation({
    mutationFn: async (inviteCode: string) => {
      const response = await apiRequest("POST", "/api/projects/join", { inviteCode });
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({
        title: "Team Joined!",
        description: `Successfully joined ${data.name}.`,
      });
      setShowJoinDialog(false);
      setJoinCode("");
    },
    onError: (error) => {
      toast({
        title: "Failed to Join Team",
        description: error.message || "Invalid invite code or you're already a member.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const getUserInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getUserRole = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    const member = project?.members.find(m => m.userId === user?.id);
    return member?.role || 'member';
  };

  const handleJoinTeam = () => {
    if (joinCode.trim()) {
      joinTeamMutation.mutate(joinCode.trim());
    }
  };

  const teamStats = {
    totalTeams: projects.length,
    ownedTeams: projects.filter(p => getUserRole(p.id) === 'owner').length,
    memberTeams: projects.filter(p => getUserRole(p.id) === 'member').length,
    totalMembers: projects.reduce((sum, p) => sum + p.members.length, 0),
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Teams & Projects</h1>
            <p className="text-muted-foreground">
              Collaborate with your teams and manage project memberships
            </p>
          </div>
          
          <Dialog open={showJoinDialog} onOpenChange={setShowJoinDialog}>
            <DialogTrigger asChild>
              <Button data-testid="button-join-team">
                <i className="fas fa-plus mr-2"></i>
                Join Team
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Join a Team</DialogTitle>
                <DialogDescription>
                  Enter the invite code provided by your team leader to join a project.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="invite-code">Invite Code</Label>
                  <Input
                    id="invite-code"
                    placeholder="Enter invite code"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                    data-testid="input-invite-code"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowJoinDialog(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleJoinTeam}
                    disabled={!joinCode.trim() || joinTeamMutation.isPending}
                    data-testid="button-join-submit"
                  >
                    {joinTeamMutation.isPending ? "Joining..." : "Join Team"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Team Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">Total Teams</p>
              <p className="text-2xl font-bold text-foreground" data-testid="stat-total-teams">
                {teamStats.totalTeams}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">Teams I Own</p>
              <p className="text-2xl font-bold text-blue-600" data-testid="stat-owned-teams">
                {teamStats.ownedTeams}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">Teams I'm In</p>
              <p className="text-2xl font-bold text-green-600" data-testid="stat-member-teams">
                {teamStats.memberTeams}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">Total Members</p>
              <p className="text-2xl font-bold text-purple-600" data-testid="stat-total-members">
                {teamStats.totalMembers}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Teams Grid */}
        {projects.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <h3 className="text-lg font-medium text-foreground mb-2">No Teams Yet</h3>
              <p className="text-muted-foreground mb-4">
                You're not part of any teams yet. Create a new project or join an existing team to get started!
              </p>
              <div className="flex justify-center gap-3">
                <Button onClick={() => setShowJoinDialog(true)}>
                  <i className="fas fa-plus mr-2"></i>
                  Join Team
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => {
              const userRole = getUserRole(project.id);
              const isOwner = userRole === 'owner';
              
              return (
                <Card key={project.id} className="hover:shadow-lg transition-shadow" data-testid={`team-card-${project.id}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2" data-testid={`team-name-${project.id}`}>
                          {project.name}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge variant={isOwner ? "default" : "secondary"} data-testid={`user-role-${project.id}`}>
                            {isOwner ? "Owner" : "Member"}
                          </Badge>
                          <Badge variant="outline" data-testid={`team-status-${project.id}`}>
                            {project.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {project.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2" data-testid={`team-description-${project.id}`}>
                        {project.description}
                      </p>
                    )}
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Team Members</span>
                        <span className="font-medium" data-testid={`member-count-${project.id}`}>
                          {project.members.length}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Active Tasks</span>
                        <span className="font-medium" data-testid={`task-count-${project.id}`}>
                          {project.tasks?.length || 0}
                        </span>
                      </div>
                      
                      {project.deadline && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Deadline</span>
                          <span className="font-medium" data-testid={`team-deadline-${project.id}`}>
                            {new Date(project.deadline).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">Team Members</p>
                      <div className="flex items-center gap-2">
                        {project.members.slice(0, 5).map((member) => (
                          <Avatar key={member.id} className="h-6 w-6" data-testid={`member-avatar-${member.userId}`}>
                            <AvatarImage src={member.user.profileImageUrl || undefined} alt={`${member.user.firstName} ${member.user.lastName}`} />
                            <AvatarFallback className="text-xs">
                              {getUserInitials(member.user.firstName, member.user.lastName)}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                        {project.members.length > 5 && (
                          <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs text-muted-foreground">
                            +{project.members.length - 5}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2 pt-2">
                      <Button 
                        size="sm" 
                        className="flex-1"
                        onClick={() => window.location.href = `/projects/${project.id}`}
                        data-testid={`view-project-${project.id}`}
                      >
                        View Project
                      </Button>
                      {isOwner && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          data-testid={`manage-team-${project.id}`}
                        >
                          <i className="fas fa-cog"></i>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}