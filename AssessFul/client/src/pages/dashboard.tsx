import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import Navigation from "@/components/layout/navigation";
import ProjectCard from "@/components/projects/project-card";
import CreateProjectModal from "@/components/projects/create-project-modal";
import JoinProjectModal from "@/components/projects/join-project-modal";
import { useAuth } from "@/hooks/useAuth";
import { useWebSocket } from "@/hooks/useWebSocket";
import type { ProjectWithMembers } from "@shared/schema";

export default function Dashboard() {
  const { user } = useAuth();
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showJoinProject, setShowJoinProject] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  
  const { data: projects = [], isLoading } = useQuery<ProjectWithMembers[]>({
    queryKey: ["/api/projects"],
  });

  // WebSocket for real-time updates
  useWebSocket();

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         project.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === "all" || project.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const stats = {
    activeProjects: projects.filter(p => p.status === 'active').length,
    pendingTasks: projects.reduce((acc, p) => acc + p.tasks.filter(t => t.status !== 'done').length, 0),
    completedTasks: projects.reduce((acc, p) => acc + p.tasks.filter(t => t.status === 'done').length, 0),
    teamMembers: new Set(projects.flatMap(p => p.members.map(m => m.userId))).size,
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-muted rounded"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-48 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
              <p className="mt-2 text-muted-foreground">
                Welcome back{user ? `, ${user.firstName}` : ''}! Here's what's happening with your projects.
              </p>
            </div>
            <div className="mt-4 sm:mt-0 flex space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowJoinProject(true)}
                data-testid="button-join-project"
              >
                <i className="fas fa-plus mr-2"></i>
                Join Project
              </Button>
              <Button
                onClick={() => setShowCreateProject(true)}
                data-testid="button-create-project"
              >
                <i className="fas fa-plus mr-2"></i>
                New Project
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <i className="fas fa-project-diagram text-primary"></i>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Active Projects</p>
                  <p className="text-2xl font-bold text-foreground" data-testid="stat-active-projects">
                    {stats.activeProjects}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-warning/10 rounded-lg">
                  <i className="fas fa-tasks text-warning"></i>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Pending Tasks</p>
                  <p className="text-2xl font-bold text-foreground" data-testid="stat-pending-tasks">
                    {stats.pendingTasks}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-success/10 rounded-lg">
                  <i className="fas fa-check-circle text-success"></i>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold text-foreground" data-testid="stat-completed-tasks">
                    {stats.completedTasks}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-secondary/10 rounded-lg">
                  <i className="fas fa-users text-secondary"></i>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Team Members</p>
                  <p className="text-2xl font-bold text-foreground" data-testid="stat-team-members">
                    {stats.teamMembers}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Projects Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-foreground">Your Projects</h2>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4"
                  data-testid="input-search-projects"
                />
                <i className="fas fa-search absolute left-3 top-3 text-muted-foreground"></i>
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-48" data-testid="select-filter-status">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="on_hold">On Hold</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {filteredProjects.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                  <i className="fas fa-project-diagram text-2xl text-muted-foreground"></i>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">No projects found</h3>
                <p className="text-muted-foreground mb-6">
                  {projects.length === 0 
                    ? "Create your first project or join an existing one to get started."
                    : "No projects match your current filter criteria."
                  }
                </p>
                <div className="flex justify-center space-x-3">
                  <Button onClick={() => setShowCreateProject(true)}>
                    <i className="fas fa-plus mr-2"></i>
                    Create Project
                  </Button>
                  <Button variant="outline" onClick={() => setShowJoinProject(true)}>
                    <i className="fas fa-user-plus mr-2"></i>
                    Join Project
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">Recent Activity</h2>
            <div className="space-y-4">
              {projects.slice(0, 3).map((project) => (
                <div key={project.id} className="flex items-start space-x-3" data-testid={`activity-${project.id}`}>
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <i className="fas fa-project-diagram text-primary text-xs"></i>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">
                      Project <span className="font-medium">{project.name}</span> was updated
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(project.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
              {projects.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No recent activity to show.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </main>

      <CreateProjectModal open={showCreateProject} onOpenChange={setShowCreateProject} />
      <JoinProjectModal open={showJoinProject} onOpenChange={setShowJoinProject} />
    </div>
  );
}
