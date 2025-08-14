import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { removeAuthToken } from "@/lib/authUtils";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";

export default function Navigation() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [location] = useLocation();

  const handleLogout = () => {
    removeAuthToken();
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
    // Force redirect to landing page by clearing auth state and reloading
    setTimeout(() => {
      window.location.href = "/";
    }, 500);
  };

  const getUserInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <nav className="bg-gradient-to-r from-blue-600 to-purple-600 border-b border-blue-500/30 shadow-lg sticky top-0 z-40 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link href="/">
                <span className="text-2xl font-bold text-white cursor-pointer hover:text-blue-100 transition-colors">
                  ProjectFlow
                </span>
              </Link>
            </div>
            <div className="hidden md:block ml-10">
              <div className="flex items-baseline space-x-4">
                <Link href="/">
                  <Button 
                    variant="ghost" 
                    className={location === "/" ? "bg-white/20 text-white" : "text-blue-100 hover:text-white hover:bg-white/10"}
                    data-testid="nav-dashboard"
                  >
                    Dashboard
                  </Button>
                </Link>
                <Link href="/my-tasks">
                  <Button 
                    variant="ghost" 
                    className={location === "/my-tasks" ? "bg-white/20 text-white" : "text-blue-100 hover:text-white hover:bg-white/10"}
                    data-testid="nav-tasks"
                  >
                    My Tasks
                  </Button>
                </Link>
                <Link href="/teams">
                  <Button 
                    variant="ghost" 
                    className={location === "/teams" ? "bg-white/20 text-white" : "text-blue-100 hover:text-white hover:bg-white/10"}
                    data-testid="nav-teams"
                  >
                    Teams
                  </Button>
                </Link>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" className="relative text-white hover:text-blue-100 hover:bg-white/10" data-testid="button-notifications">
              <i className="fas fa-bell text-xl"></i>
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                3
              </span>
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-auto px-3 space-x-3 text-white hover:bg-white/10" data-testid="button-user-menu">
                  <Avatar className="h-8 w-8 border-2 border-white/20">
                    <AvatarImage src={user?.profileImageUrl} alt="User avatar" />
                    <AvatarFallback className="bg-white/20 text-white">
                      {user ? getUserInitials(user.firstName, user.lastName) : "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium text-white">
                      {user ? `${user.firstName} ${user.lastName}` : "User"}
                    </p>
                    <p className="text-xs text-blue-100">Project Manager</p>
                  </div>
                  <i className="fas fa-chevron-down text-blue-100 text-sm"></i>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuItem className="flex flex-col items-start">
                  <div className="font-medium">{user ? `${user.firstName} ${user.lastName}` : "User"}</div>
                  <div className="text-xs text-muted-foreground">{user?.email}</div>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <i className="fas fa-user mr-2"></i>
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <i className="fas fa-cog mr-2"></i>
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} data-testid="button-logout">
                  <i className="fas fa-sign-out-alt mr-2"></i>
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
}
