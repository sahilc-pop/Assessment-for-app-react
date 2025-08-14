import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { ProjectMember, User } from "@shared/schema";

const createTaskSchema = z.object({
  title: z.string().min(1, "Task title is required").max(200, "Title too long"),
  description: z.string().max(1000, "Description too long").optional(),
  priority: z.enum(["low", "medium", "high"]),
  assigneeId: z.string().optional(),
});

type CreateTaskFormData = z.infer<typeof createTaskSchema>;

interface CreateTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  projectMembers: (ProjectMember & { user: User })[];
}

export default function CreateTaskModal({ 
  open, 
  onOpenChange, 
  projectId, 
  projectMembers 
}: CreateTaskModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<CreateTaskFormData>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      priority: "medium",
    },
  });

  const selectedAssignee = watch("assigneeId");
  const selectedPriority = watch("priority");

  const createTaskMutation = useMutation({
    mutationFn: async (data: CreateTaskFormData) => {
      const payload = {
        ...data,
        projectId,
        assigneeId: data.assigneeId || null,
      };
      const response = await apiRequest("POST", `/api/projects/${projectId}/tasks`, payload);
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "tasks"] });
      toast({
        title: "Task Created!",
        description: `"${data.title}" has been created successfully.`,
      });
      reset();
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Failed to Create Task",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateTaskFormData) => {
    createTaskMutation.mutate(data);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      reset();
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Task Title</Label>
            <Input
              id="title"
              placeholder="Enter task title"
              {...register("title")}
              data-testid="input-task-title"
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Describe the task"
              rows={3}
              {...register("description")}
              data-testid="textarea-task-description"
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select 
                value={selectedPriority} 
                onValueChange={(value) => setValue("priority", value as any)}
              >
                <SelectTrigger data-testid="select-task-priority">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Assignee (Optional)</Label>
              <Select 
                value={selectedAssignee} 
                onValueChange={(value) => setValue("assigneeId", value === "none" ? "" : value)}
              >
                <SelectTrigger data-testid="select-task-assignee">
                  <SelectValue placeholder="Select assignee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {projectMembers.map((member) => (
                    <SelectItem key={member.userId} value={member.userId}>
                      {member.user.firstName} {member.user.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              className="flex-1"
              data-testid="button-cancel-task"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createTaskMutation.isPending}
              className="flex-1"
              data-testid="button-create-task-submit"
            >
              {createTaskMutation.isPending ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Creating...
                </>
              ) : (
                "Create Task"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
