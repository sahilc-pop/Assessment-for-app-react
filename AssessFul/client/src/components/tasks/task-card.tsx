import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { TaskWithDetails, ProjectMember, User } from "@shared/schema";

interface TaskCardProps {
  task: TaskWithDetails;
  projectMembers: (ProjectMember & { user: User })[];
  onDragStart?: (e: React.DragEvent, task: TaskWithDetails) => void;
  onDragEnd?: () => void;
  isDragging?: boolean;
}

const priorityColors = {
  low: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  high: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

const statusTransitions = {
  todo: [
    { status: "in_progress", label: "Start Progress", icon: "fa-play" },
    { status: "done", label: "Mark Done", icon: "fa-check" },
  ],
  in_progress: [
    { status: "todo", label: "Move to To Do", icon: "fa-arrow-left" },
    { status: "done", label: "Mark Done", icon: "fa-check" },
  ],
  done: [
    { status: "todo", label: "Reopen", icon: "fa-redo" },
    { status: "in_progress", label: "Move to Progress", icon: "fa-play" },
  ],
};

export default function TaskCard({ task, projectMembers, onDragStart, onDragEnd, isDragging = false }: TaskCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateTaskMutation = useMutation({
    mutationFn: async (updates: Partial<TaskWithDetails>) => {
      const response = await apiRequest("PUT", `/api/tasks/${task.id}`, updates);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", task.projectId, "tasks"] });
      toast({
        title: "Task Updated",
        description: "Task has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update task",
        variant: "destructive",
      });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/tasks/${task.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", task.projectId, "tasks"] });
      toast({
        title: "Task Deleted",
        description: "Task has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete task",
        variant: "destructive",
      });
    },
  });

  const handleStatusChange = (newStatus: string) => {
    updateTaskMutation.mutate({ status: newStatus as any });
  };

  const handleAssigneeChange = (assigneeId: string) => {
    updateTaskMutation.mutate({ 
      assigneeId: assigneeId === "unassign" ? null : assigneeId 
    });
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this task?")) {
      deleteTaskMutation.mutate();
    }
  };

  const getUserInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getProgress = () => {
    switch (task.status) {
      case "todo": return 0;
      case "in_progress": return 50;
      case "done": return 100;
      default: return 0;
    }
  };

  return (
    <Card 
      className={`hover:shadow-md transition-all cursor-move ${isDragging ? 'opacity-50 rotate-3 scale-95' : ''}`}
      data-testid={`task-card-${task.id}`}
      draggable={true}
      onDragStart={onDragStart ? (e) => onDragStart(e, task) : undefined}
      onDragEnd={onDragEnd}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h4 className="font-medium text-foreground mb-2" data-testid={`task-title-${task.id}`}>
              {task.title}
            </h4>
            {task.description && (
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2" data-testid={`task-description-${task.id}`}>
                {task.description}
              </p>
            )}
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6" data-testid={`task-menu-${task.id}`}>
                <i className="fas fa-ellipsis-h text-xs"></i>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {statusTransitions[task.status as keyof typeof statusTransitions]?.map((transition) => (
                <DropdownMenuItem
                  key={transition.status}
                  onClick={() => handleStatusChange(transition.status)}
                >
                  <i className={`fas ${transition.icon} mr-2 w-4`}></i>
                  {transition.label}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <i className="fas fa-edit mr-2 w-4"></i>
                Edit Task
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                <i className="fas fa-trash mr-2 w-4"></i>
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {task.status === "in_progress" && (
          <div className="mb-3">
            <div className="flex items-center justify-between text-sm text-muted-foreground mb-1">
              <span>Progress</span>
              <span>{getProgress()}%</span>
            </div>
            <Progress value={getProgress()} className="h-2" />
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {task.assignee ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 px-2">
                    <Avatar className="w-6 h-6 mr-2">
                      <AvatarImage src={task.assignee.profileImageUrl} />
                      <AvatarFallback className="text-xs">
                        {getUserInitials(task.assignee.firstName, task.assignee.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{task.assignee.firstName}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handleAssigneeChange("unassign")}>
                    Unassign
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {projectMembers.map((member) => (
                    <DropdownMenuItem
                      key={member.userId}
                      onClick={() => handleAssigneeChange(member.userId)}
                    >
                      {member.user.firstName} {member.user.lastName}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground">
                    <i className="fas fa-user-plus mr-2"></i>
                    Assign
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {projectMembers.map((member) => (
                    <DropdownMenuItem
                      key={member.userId}
                      onClick={() => handleAssigneeChange(member.userId)}
                    >
                      {member.user.firstName} {member.user.lastName}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          
          <Badge 
            variant="secondary" 
            className={priorityColors[task.priority]}
            data-testid={`task-priority-${task.id}`}
          >
            {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
