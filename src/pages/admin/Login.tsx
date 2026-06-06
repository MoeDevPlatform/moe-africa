import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { MoeApiError } from "@/lib/moeApi";
import { authService } from "@/lib/apiServices";
import logo from "@/assets/logo.png";

const Login = () => {
  const navigate = useNavigate();
  const { loginWithTokens, user, isAuthenticated } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (isAuthenticated && user?.role === "admin") {
    return <Navigate to="/admin/dashboard" replace />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await authService.login({ email, password });
      if (res.user?.role !== "admin") {
        toast.error("Access denied — admin accounts only");
        return;
      }
      await loginWithTokens(res.token, res.refreshToken);
      toast.success("Welcome back");
      navigate("/admin/dashboard");
    } catch (err: any) {
      const e = err as MoeApiError;
      toast.error(e?.message || "Invalid credentials");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-subtle p-4">
      <Card className="w-full max-w-md border-border shadow-lg">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto w-32">
            <img loading="lazy" decoding="async" src={logo} alt="MOE" className="h-auto w-full" />
          </div>
          <div>
            <CardTitle className="text-2xl font-display font-bold text-foreground">
              Admin Portal
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Sign in to manage MOE marketplace
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@moe.africa"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border-input bg-background"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border-input bg-background"
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-primary text-primary-foreground hover:bg-primary-dark transition-all duration-300 shadow-md hover:shadow-lg"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
