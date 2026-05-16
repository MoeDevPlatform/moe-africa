import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { authService } from "@/lib/apiServices";
import { useAuth } from "@/contexts/AuthContext";
import logo from "@/assets/logo.png";

/**
 * Email verification screen for both:
 *  - Customer/Artisan signup OTP (item 9)
 *  - Admin login OTP (item 11) — when ?mode=admin
 *
 * Email + role are passed via query params (?email=...&mode=admin|verify).
 */
const VerifyEmail = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const email = params.get("email") ?? "";
  const mode = params.get("mode") === "admin" ? "admin" : "verify";
  const { loginWithTokens } = useAuth();

  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  if (!email) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Missing email</CardTitle>
            <CardDescription>Return to sign in and try again.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate(mode === "admin" ? "/admin/login" : "/auth")}>Back</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error("Enter the 6-digit code from your email");
      return;
    }
    setIsLoading(true);
    try {
      const res = mode === "admin"
        ? await authService.adminVerifyOtp({ email, otp })
        : await authService.verifyEmail({ email, otp });
      await loginWithTokens(res.token, res.refreshToken);
      toast.success(mode === "admin" ? "Admin verified" : "Email verified!");
      if (mode === "admin") navigate("/admin");
      else if (res.user?.role === "artisan") navigate("/artisan/dashboard");
      else navigate("/marketplace");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Verification failed";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    try {
      await authService.resendOtp({ email });
      toast.success("A new code has been sent");
      setCooldown(30);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not resend code";
      toast.error(msg);
    } finally {
      setIsResending(false);
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
            <CardTitle className="text-2xl font-display">
              {mode === "admin" ? "Admin Verification" : "Verify Your Email"}
            </CardTitle>
            <CardDescription>
              We sent a 6-digit code to <span className="font-medium text-foreground">{email}</span>.
              Enter it below to continue.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleVerify} className="space-y-4">
              <div>
                <Label htmlFor="otp">Verification code</Label>
                <Input
                  ref={inputRef}
                  id="otp"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="123456"
                  className="text-center text-2xl tracking-[0.5em] font-mono"
                />
                <p className="text-xs text-muted-foreground mt-1">Code expires in 15 minutes.</p>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading || otp.length !== 6}>
                {isLoading ? "Verifying…" : "Verify & continue"}
              </Button>
              {mode !== "admin" && (
                <div className="text-center text-sm">
                  Didn't get it?{" "}
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={isResending || cooldown > 0}
                    className="text-primary hover:underline disabled:text-muted-foreground disabled:no-underline"
                  >
                    {cooldown > 0 ? `Resend in ${cooldown}s` : isResending ? "Sending…" : "Resend code"}
                  </button>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VerifyEmail;
