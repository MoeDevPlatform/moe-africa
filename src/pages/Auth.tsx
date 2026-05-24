import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole, authService, filterMetaService } from "@/lib/apiServices";
import { MoeApiError } from "@/lib/moeApi";
import { User, Palette, Eye, EyeOff, Mail } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useEffect } from "react";
import logo from "@/assets/logo.png";

const Auth = () => {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // Sign in state
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [showSignInPassword, setShowSignInPassword] = useState(false);

  // Sign up state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [role, setRole] = useState<UserRole>("customer");
  const [serviceCategories, setServiceCategories] = useState<string[]>([]);
  const [availableServiceCategories, setAvailableServiceCategories] = useState<string[]>([]);

  // Item 9 — load live service categories for the artisan picker.
  useEffect(() => {
    filterMetaService.artisans().then((m) => {
      const opts = (m.serviceCategories?.length ? m.serviceCategories : m.categories) ?? [];
      setAvailableServiceCategories(opts);
    });
  }, []);

  const toggleServiceCategory = (slug: string) => {
    setServiceCategories((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
    );
  };

  const handleGoogle = () => {
    // Full-page redirect — backend handles the OAuth dance and bounces back to /auth/callback.
    window.location.href = authService.googleOAuthUrl();
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(signInEmail, signInPassword);
      toast.success("Welcome back!");
      navigate("/marketplace");
    } catch (err: any) {
      const e = err as MoeApiError;
      toast.error(e?.message || "Invalid email or password");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (signUpPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (signUpPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (role === "artisan" && serviceCategories.length === 0) {
      toast.error("Select at least one service category");
      return;
    }
    setIsLoading(true);
    try {
      const name = `${firstName} ${lastName}`.trim();
      await register(
        name,
        signUpEmail,
        signUpPassword,
        role,
        role === "artisan" ? serviceCategories : undefined,
      );
      toast.success("Account created successfully!");
      navigate(role === "artisan" ? "/artisan/dashboard" : "/marketplace");
    } catch (err: any) {
      toast.error(err?.message || "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="flex justify-center mb-8">
          <img src={logo} alt="MOE" className="h-16 w-auto" />
        </Link>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-display">Welcome to MOE</CardTitle>
            <CardDescription>Sign in to your account or create a new one</CardDescription>
          </CardHeader>

          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div>
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="your.email@example.com"
                      value={signInEmail}
                      onChange={(e) => setSignInEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="signin-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="signin-password"
                        type={showSignInPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={signInPassword}
                        onChange={(e) => setSignInPassword(e.target.value)}
                        required
                        className="pr-10"
                      />
                      <button
                        type="button"
                        aria-label={showSignInPassword ? "Hide password" : "Show password"}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowSignInPassword((v) => !v)}
                      >
                        {showSignInPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Signing in..." : "Sign In"}
                  </Button>
                  <div className="relative my-2">
                    <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                    <div className="relative flex justify-center text-xs"><span className="bg-card px-2 text-muted-foreground">or</span></div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full gap-2"
                    onClick={handleGoogle}
                    disabled={isLoading}
                  >
                    <Mail className="h-4 w-4" /> Continue with Google
                  </Button>
                  <div className="text-center">
                    <a href="#" className="text-sm text-primary hover:underline">
                      Forgot password?
                    </a>
                  </div>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  {/* Role Selection */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">I want to join as</Label>
                    <RadioGroup
                      value={role}
                      onValueChange={(v) => setRole(v as UserRole)}
                      className="grid grid-cols-2 gap-3"
                    >
                      <Label
                        htmlFor="role-customer"
                        className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          role === "customer"
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/40"
                        }`}
                      >
                        <RadioGroupItem value="customer" id="role-customer" className="sr-only" />
                        <User className="h-6 w-6 text-primary" />
                        <span className="font-medium text-sm">Customer</span>
                        <span className="text-xs text-muted-foreground text-center">Browse &amp; shop</span>
                      </Label>
                      <Label
                        htmlFor="role-artisan"
                        className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          role === "artisan"
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/40"
                        }`}
                      >
                        <RadioGroupItem value="artisan" id="role-artisan" className="sr-only" />
                        <Palette className="h-6 w-6 text-primary" />
                        <span className="font-medium text-sm">Artisan</span>
                        <span className="text-xs text-muted-foreground text-center">Sell your craft</span>
                      </Label>
                    </RadioGroup>
                  </div>

                  {role === "artisan" && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Service categories</Label>
                      <p className="text-xs text-muted-foreground">
                        Pick the crafts you offer. You can refine these later.
                      </p>
                      {availableServiceCategories.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic">Loading categories…</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {availableServiceCategories.map((slug) => {
                            const active = serviceCategories.includes(slug);
                            return (
                              <Badge
                                key={slug}
                                variant={active ? "default" : "outline"}
                                onClick={() => toggleServiceCategory(slug)}
                                className="cursor-pointer capitalize"
                              >
                                {slug}
                              </Badge>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstname">First Name</Label>
                      <Input
                        id="firstname"
                        type="text"
                        placeholder="John"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastname">Last Name</Label>
                      <Input
                        id="lastname"
                        type="text"
                        placeholder="Doe"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="your.email@example.com"
                      value={signUpEmail}
                      onChange={(e) => setSignUpEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="signup-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="signup-password"
                        type={showSignUpPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={signUpPassword}
                        onChange={(e) => setSignUpPassword(e.target.value)}
                        required
                        minLength={8}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        aria-label={showSignUpPassword ? "Hide password" : "Show password"}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowSignUpPassword((v) => !v)}
                      >
                        {showSignUpPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <div className="relative">
                      <Input
                        id="confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className="pr-10"
                      />
                      <button
                        type="button"
                        aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowConfirmPassword((v) => !v)}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Creating account..." : `Create ${role === "artisan" ? "Artisan" : ""} Account`}
                  </Button>
                  <div className="relative my-2">
                    <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                    <div className="relative flex justify-center text-xs"><span className="bg-card px-2 text-muted-foreground">or</span></div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full gap-2"
                    onClick={handleGoogle}
                    disabled={isLoading}
                  >
                    <Mail className="h-4 w-4" /> Continue with Google
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          By continuing, you agree to MOE's{" "}
          <Link to="/terms" className="text-primary hover:underline">Terms of Service</Link>
          {" "}and{" "}
          <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
        </p>
      </div>
    </div>
  );
};

export default Auth;
