import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import type { ProjectWithMembers } from "@shared/schema";

interface ProjectCardProps {
  project: ProjectWithMembers;
}

const statusColors = {
  active: "bg-success/10 text-success",
  completed: "bg-blue-100 text-blue-800",
  on_hold: "bg-destructive/10 text-destructive",
};

const statusLabels = {
  active: "Active",
  completed: "Completed", 
  on_hold: "On Hold",
};

export default function ProjectCard({ project }: ProjectCardProps) {
  const completedTasks = project.tasks.filter(t => t.status === 'done').length;
  const totalTasks = project.tasks.length;
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const getUserInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <Link href={`/projects/${project.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer" data-testid={`project-card-${project.id}`}>
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2" data-testid={`project-name-${project.id}`}>
                {project.name}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-2" data-testid={`project-description-${project.id}`}>
                {project.description || "No description provided"}
              </p>
            </div>
            <Badge 
              className={statusColors[project.status] || statusColors.active}
              data-testid={`project-status-${project.id}`}
            >
              {statusLabels[project.status] || "Active"}
            </Badge>
          </div>
          
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
              <span>Progress</span>
              <span data-testid={`project-progress-${project.id}`}>
                {Math.round(progress)}%
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex -space-x-2">
              {project.members.slice(0, 3).map((member, index) => (
                <Avatar key={member.id} className="w-8 h-8 border-2 border-background">
                  <AvatarImage src={member.user.profileImageUrl} alt={`${member.user.firstName} ${member.user.lastName}`} />
                  <AvatarFallback className="text-xs">
                    {getUserInitials(member.user.firstName, member.user.lastName)}
                  </AvatarFallback>
                </Avatar>
              ))}
              {project.members.length > 3 && (
                <div className="w-8 h-8 rounded-full border-2 border-background bg-muted flex items-center justify-center">
                  <span className="text-xs font-medium text-muted-foreground">
                    +{project.members.length - 3}
                  </span>
                </div>
              )}
            </div>
            <div className="text-sm text-muted-foreground flex items-center">
              <i className="fas fa-calendar mr-1"></i>
              <span data-testid={`project-deadline-${project.id}`}>
                {project.deadline ? formatDate(project.deadline) : "No deadline"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
