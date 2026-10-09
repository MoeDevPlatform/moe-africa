import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { authService } from "@/lib/apiServices";
import { MoeApiError } from "@/lib/moeApi";
import { Eye, EyeOff } from "lucide-react";
import logo from "@/assets/logo.png";
import { useAuthRateLimitCooldown } from "@/hooks/useAuthRateLimitCooldown";
import { rateLimitMessage } from "@/lib/authErrors";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { isCoolingDown, cooldownLabel, applyRateLimit } = useAuthRateLimitCooldown();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!token) {
      setError("Reset link is invalid or expired.");
      return;
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setIsLoading(true);
    try {
      await authService.resetPassword({ token, newPassword });
      toast.success("Password updated. You can sign in now.");
      navigate("/auth");
    } catch (err: unknown) {
      if (applyRateLimit(err)) {
        const msg = rateLimitMessage(err);
        setError(msg);
        toast.error(msg);
      } else {
        const msg =
          err instanceof MoeApiError ? err.message : "Failed to reset password.";
        setError(msg);
        toast.error(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="flex justify-center mb-8">
          <img loading="lazy" decoding="async" src={logo} alt="MOE" className="h-16 w-auto" />
        </Link>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-display">Reset password</CardTitle>
            <CardDescription>Choose a new password for your account</CardDescription>
          </CardHeader>
          <CardContent>
            {!token ? (
              <div className="space-y-4 text-center">
                <p className="text-sm text-destructive" data-testid="auth-error">
                  Reset link is invalid or expired.
                </p>
                <Button asChild variant="outline" className="w-full">
                  <Link to="/auth">Back to Sign In</Link>
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="new-password">New password</Label>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={showNew ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={8}
                      className="pr-10"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      aria-label={showNew ? "Hide password" : "Show password"}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowNew((v) => !v)}
                    >
                      {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="confirm-new-password">Confirm password</Label>
                  <div className="relative">
                    <Input
                      id="confirm-new-password"
                      type={showConfirm ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="pr-10"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      aria-label={showConfirm ? "Hide password" : "Show password"}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowConfirm((v) => !v)}
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                {error && (
                  <p className="text-sm text-destructive" data-testid="auth-error" role="alert">
                    {error}
                  </p>
                )}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading || isCoolingDown}
                >
                  {isLoading
                    ? "Updating..."
                    : isCoolingDown
                      ? cooldownLabel
                      : "Update password"}
                </Button>
                <div className="text-center">
                  <Link to="/auth" className="text-sm text-primary hover:underline">
                    Back to Sign In
                  </Link>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;
