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
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const joinProjectSchema = z.object({
  inviteCode: z.string().min(1, "Invite code is required"),
});

type JoinProjectFormData = z.infer<typeof joinProjectSchema>;

interface JoinProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function JoinProjectModal({ open, onOpenChange }: JoinProjectModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<JoinProjectFormData>({
    resolver: zodResolver(joinProjectSchema),
  });

  const joinProjectMutation = useMutation({
    mutationFn: async (data: JoinProjectFormData) => {
      const response = await apiRequest("POST", "/api/projects/join", data);
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({
        title: "Joined Project!",
        description: `You've successfully joined "${data.name}".`,
      });
      reset();
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Failed to Join Project",
        description: error.message || "Invalid invite code or you're already a member",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: JoinProjectFormData) => {
    joinProjectMutation.mutate(data);
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
          <DialogTitle>Join Project</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="inviteCode">Invite Code</Label>
            <Input
              id="inviteCode"
              placeholder="Enter invite code"
              className="text-center text-lg font-mono"
              {...register("inviteCode")}
              data-testid="input-invite-code"
            />
            {errors.inviteCode && (
              <p className="text-sm text-destructive">{errors.inviteCode.message}</p>
            )}
            <p className="text-sm text-muted-foreground">
              Enter the invite code shared by the project owner
            </p>
          </div>
          
          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              className="flex-1"
              data-testid="button-cancel-join"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={joinProjectMutation.isPending}
              className="flex-1"
              data-testid="button-join-project-submit"
            >
              {joinProjectMutation.isPending ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Joining...
                </>
              ) : (
                "Join Project"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
