import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import LoginForm from "@/components/auth/login-form";
import RegisterForm from "@/components/auth/register-form";

export default function Landing() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-background to-purple-50 dark:from-blue-950/20 dark:via-background dark:to-purple-950/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">ProjectFlow</h1>
          <p className="text-muted-foreground">Collaborate seamlessly on projects</p>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">
              {isLogin ? "Welcome back!" : "Create your account"}
            </CardTitle>
            <p className="text-sm text-muted-foreground text-center">
              {isLogin ? "Sign in to your account" : "Join thousands of productive teams"}
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {isLogin ? <LoginForm /> : <RegisterForm />}
            
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
                <Button
                  variant="link"
                  className="p-0 h-auto font-semibold text-primary"
                  onClick={() => setIsLogin(!isLogin)}
                  data-testid={isLogin ? "link-register" : "link-login"}
                >
                  {isLogin ? "Sign up" : "Sign in"}
                </Button>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Features section */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          <div className="space-y-2">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <i className="fas fa-project-diagram text-primary"></i>
            </div>
            <h3 className="font-semibold">Project Management</h3>
            <p className="text-sm text-muted-foreground">Organize tasks and track progress</p>
          </div>
          <div className="space-y-2">
            <div className="mx-auto w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
              <i className="fas fa-users text-secondary"></i>
            </div>
            <h3 className="font-semibold">Team Collaboration</h3>
            <p className="text-sm text-muted-foreground">Work together seamlessly</p>
          </div>
          <div className="space-y-2">
            <div className="mx-auto w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
              <i className="fas fa-bolt text-success"></i>
            </div>
            <h3 className="font-semibold">Real-time Updates</h3>
            <p className="text-sm text-muted-foreground">Stay synchronized instantly</p>
          </div>
        </div>
      </div>
    </div>
  );
}
