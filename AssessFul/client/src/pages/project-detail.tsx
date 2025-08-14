import { useState } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Navigation from "@/components/layout/navigation";
import KanbanBoard from "@/components/tasks/kanban-board";
import CreateTaskModal from "@/components/tasks/create-task-modal";
import { useWebSocket } from "@/hooks/useWebSocket";
import type { ProjectWithMembers, TaskWithDetails } from "@shared/schema";

export default function ProjectDetail() {
  const { projectId } = useParams<{ projectId: string }>();
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [filterAssignee, setFilterAssignee] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const { data: project, isLoading } = useQuery<ProjectWithMembers>({
    queryKey: ["/api/projects", projectId],
    enabled: !!projectId,
  });

  const { data: tasks = [] } = useQuery<TaskWithDetails[]>({
    queryKey: ["/api/projects", projectId, "tasks"],
    enabled: !!projectId,
  });

  // WebSocket for real-time updates
  useWebSocket(projectId);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-muted rounded"></div>
              ))}
            </div>
            <div className="h-96 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardContent className="p-12 text-center">
              <h2 className="text-2xl font-bold text-foreground mb-4">Project Not Found</h2>
              <p className="text-muted-foreground">The project you're looking for doesn't exist or you don't have access to it.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const filteredTasks = tasks.filter(task => {
    const matchesAssignee = filterAssignee === "all" || task.assigneeId === filterAssignee;
    const matchesStatus = filterStatus === "all" || task.status === filterStatus;
    return matchesAssignee && matchesStatus;
  });

  const taskStats = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'done').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    todo: tasks.filter(t => t.status === 'todo').length,
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground" data-testid="project-title">
                {project.name}
              </h1>
              <p className="text-muted-foreground mt-1" data-testid="project-description">
                {project.description || "No description provided"}
              </p>
              <div className="flex items-center mt-2 space-x-4 text-sm text-muted-foreground">
                <span>
                  <i className="fas fa-code mr-1"></i>
                  Invite Code: <code className="bg-muted px-2 py-1 rounded font-mono">{project.inviteCode}</code>
                </span>
                <span>
                  <i className="fas fa-users mr-1"></i>
                  {project.members.length} member{project.members.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button onClick={() => setShowCreateTask(true)} data-testid="button-add-task">
                <i className="fas fa-plus mr-2"></i>
                Add Task
              </Button>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Task Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">Total Tasks</p>
              <p className="text-2xl font-bold text-foreground" data-testid="stat-total-tasks">
                {taskStats.total}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className="text-2xl font-bold text-success" data-testid="stat-completed-tasks">
                {taskStats.completed}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">In Progress</p>
              <p className="text-2xl font-bold text-warning" data-testid="stat-progress-tasks">
                {taskStats.inProgress}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">To Do</p>
              <p className="text-2xl font-bold text-muted-foreground" data-testid="stat-todo-tasks">
                {taskStats.todo}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Task Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <Button 
            variant={filterStatus === "all" ? "default" : "outline"}
            onClick={() => setFilterStatus("all")}
            data-testid="filter-all-tasks"
          >
            All Tasks
          </Button>
          <Button 
            variant={filterStatus === "todo" ? "default" : "outline"}
            onClick={() => setFilterStatus("todo")}
            data-testid="filter-todo-tasks"
          >
            To Do
          </Button>
          <Button 
            variant={filterStatus === "in_progress" ? "default" : "outline"}
            onClick={() => setFilterStatus("in_progress")}
            data-testid="filter-progress-tasks"
          >
            In Progress
          </Button>
          <Button 
            variant={filterStatus === "done" ? "default" : "outline"}
            onClick={() => setFilterStatus("done")}
            data-testid="filter-done-tasks"
          >
            Done
          </Button>
          <Select value={filterAssignee} onValueChange={setFilterAssignee}>
            <SelectTrigger className="w-48" data-testid="select-assignee-filter">
              <SelectValue placeholder="Filter by assignee" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Assignees</SelectItem>
              {project.members.map((member) => (
                <SelectItem key={member.userId} value={member.userId}>
                  {member.user.firstName} {member.user.lastName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Kanban Board */}
        <KanbanBoard tasks={filteredTasks} projectMembers={project.members} projectId={project.id} />
      </main>

      <CreateTaskModal 
        open={showCreateTask} 
        onOpenChange={setShowCreateTask}
        projectId={project.id}
        projectMembers={project.members}
      />
    </div>
  );
}
