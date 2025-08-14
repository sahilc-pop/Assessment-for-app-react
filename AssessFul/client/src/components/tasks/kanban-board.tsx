import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import TaskCard from "./task-card";
import type { TaskWithDetails, ProjectMember, User } from "@shared/schema";

interface KanbanBoardProps {
  tasks: TaskWithDetails[];
  projectMembers: (ProjectMember & { user: User })[];
  projectId: string;
}

const columns = [
  {
    id: "todo",
    title: "To Do",
    bgColor: "bg-muted",
    headerColor: "bg-muted/50",
    dotColor: "bg-muted-foreground",
  },
  {
    id: "in_progress",
    title: "In Progress",
    bgColor: "bg-blue-50 dark:bg-blue-950/20",
    headerColor: "bg-blue-100 dark:bg-blue-900/30",
    dotColor: "bg-warning",
  },
  {
    id: "done",
    title: "Done",
    bgColor: "bg-green-50 dark:bg-green-950/20",
    headerColor: "bg-green-100 dark:bg-green-900/30",
    dotColor: "bg-success",
  },
] as const;

export default function KanbanBoard({ tasks, projectMembers, projectId }: KanbanBoardProps) {
  const [draggedTask, setDraggedTask] = useState<TaskWithDetails | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const getTasksByStatus = (status: string) => {
    return tasks.filter(task => task.status === status);
  };

  // Mutation to update task status
  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, newStatus }: { taskId: string; newStatus: string }) => {
      return await apiRequest("PATCH", `/api/projects/${projectId}/tasks/${taskId}`, {
        status: newStatus
      });
    },
    onSuccess: () => {
      // Invalidate the tasks query to refetch data
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "tasks"] });
      toast({
        title: "Task updated",
        description: "Task status updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update task status.",
        variant: "destructive",
      });
    },
  });

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, task: TaskWithDetails) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    
    if (draggedTask && draggedTask.status !== newStatus) {
      updateTaskMutation.mutate({
        taskId: draggedTask.id,
        newStatus
      });
    }
    
    setDraggedTask(null);
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" data-testid="kanban-board">
      {columns.map((column) => {
        const columnTasks = getTasksByStatus(column.id);
        
        return (
          <div key={column.id} className={`rounded-lg p-4 ${column.bgColor}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground flex items-center">
                <div className={`w-3 h-3 rounded-full mr-2 ${column.dotColor}`}></div>
                {column.title}
                <Badge variant="secondary" className="ml-2">
                  {columnTasks.length}
                </Badge>
              </h3>
              <Button 
                variant="ghost" 
                size="icon"
                className="h-6 w-6"
                data-testid={`add-task-${column.id}`}
              >
                <i className="fas fa-plus text-xs"></i>
              </Button>
            </div>
            
            <div 
              className={`space-y-3 min-h-[200px] p-2 rounded-lg transition-colors ${
                draggedTask && draggedTask.status !== column.id ? 'bg-accent/20 border-2 border-dashed border-accent' : ''
              }`}
              data-testid={`column-${column.id}`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              {columnTasks.length === 0 ? (
                <Card className={draggedTask && draggedTask.status !== column.id ? 'opacity-50' : ''}>
                  <CardContent className="p-6 text-center">
                    <p className="text-sm text-muted-foreground">
                      {draggedTask && draggedTask.status !== column.id 
                        ? `Drop task here to move to ${column.title}` 
                        : `No tasks in ${column.title.toLowerCase()}`}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                columnTasks.map((task) => (
                  <TaskCard 
                    key={task.id} 
                    task={task} 
                    projectMembers={projectMembers}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    isDragging={draggedTask?.id === task.id}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
