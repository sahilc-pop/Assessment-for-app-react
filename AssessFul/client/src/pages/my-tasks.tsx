import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Navigation from "@/components/layout/navigation";
import { useAuth } from "@/hooks/useAuth";
import type { TaskWithDetails } from "@shared/schema";

const priorityColors = {
  low: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  high: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

const statusColors = {
  todo: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
  in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  done: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
};

export default function MyTasks() {
  const { user } = useAuth();
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");

  const { data: tasks = [], isLoading } = useQuery<TaskWithDetails[]>({
    queryKey: ["/api/my-tasks"],
  });

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
            <div className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-32 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const filteredTasks = tasks.filter(task => {
    const matchesStatus = filterStatus === "all" || task.status === filterStatus;
    const matchesPriority = filterPriority === "all" || task.priority === filterPriority;
    return matchesStatus && matchesPriority;
  });

  const taskStats = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'done').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    todo: tasks.filter(t => t.status === 'todo').length,
  };

  const getUserInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">My Tasks</h1>
          <p className="text-muted-foreground">
            Manage and track all tasks assigned to you across projects
          </p>
        </div>

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
              <p className="text-2xl font-bold text-green-600" data-testid="stat-completed-tasks">
                {taskStats.completed}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">In Progress</p>
              <p className="text-2xl font-bold text-blue-600" data-testid="stat-progress-tasks">
                {taskStats.inProgress}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">To Do</p>
              <p className="text-2xl font-bold text-gray-600" data-testid="stat-todo-tasks">
                {taskStats.todo}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
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
          
          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="w-48" data-testid="select-priority-filter">
              <SelectValue placeholder="Filter by priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="high">High Priority</SelectItem>
              <SelectItem value="medium">Medium Priority</SelectItem>
              <SelectItem value="low">Low Priority</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tasks List */}
        {filteredTasks.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <h3 className="text-lg font-medium text-foreground mb-2">No Tasks Found</h3>
              <p className="text-muted-foreground">
                {tasks.length === 0 
                  ? "You don't have any tasks assigned yet. Join a project to get started!"
                  : "No tasks match your current filters. Try adjusting your filter criteria."
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredTasks.map((task) => (
              <Card key={task.id} className="hover:shadow-md transition-shadow" data-testid={`task-card-${task.id}`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg text-foreground" data-testid={`task-title-${task.id}`}>
                          {task.title}
                        </h3>
                        <Badge 
                          className={statusColors[task.status as keyof typeof statusColors]}
                          data-testid={`task-status-${task.id}`}
                        >
                          {task.status === 'in_progress' ? 'In Progress' : task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                        </Badge>
                        <Badge 
                          className={priorityColors[task.priority as keyof typeof priorityColors]}
                          data-testid={`task-priority-${task.id}`}
                        >
                          {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority
                        </Badge>
                      </div>
                      
                      {task.description && (
                        <p className="text-muted-foreground mb-3" data-testid={`task-description-${task.id}`}>
                          {task.description}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-2">
                          <i className="fas fa-project-diagram"></i>
                          {task.project.name}
                        </span>
                        <span className="flex items-center gap-2">
                          <i className="fas fa-user"></i>
                          Created by {task.creator.firstName} {task.creator.lastName}
                        </span>
                        <span className="flex items-center gap-2">
                          <i className="fas fa-calendar"></i>
                          {new Date(task.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user?.profileImageUrl} alt="Your avatar" />
                        <AvatarFallback>
                          {user ? getUserInitials(user.firstName, user.lastName) : "U"}
                        </AvatarFallback>
                      </Avatar>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.location.href = `/projects/${task.projectId}`}
                        data-testid={`view-project-${task.id}`}
                      >
                        View Project
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}