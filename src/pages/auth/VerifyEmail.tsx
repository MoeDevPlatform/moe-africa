import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { authService } from "@/lib/apiServices";
import { MoeApiError } from "@/lib/moeApi";
import { Loader2 } from "lucide-react";
import logo from "@/assets/logo.png";

type VerifyView = "loading" | "verified" | "expired" | "used" | "invalid";

const verifyRequests = new Map<string, Promise<{ verified: boolean; message: string }>>();

function verifyOnce(token: string) {
  let pending = verifyRequests.get(token);
  if (!pending) {
    pending = authService.verifyEmail(token).catch((err: unknown) => {
      if (!(err instanceof MoeApiError)) verifyRequests.delete(token);
      throw err;
    });
    verifyRequests.set(token, pending);
  }
  return pending;
}

function viewFromStatus(status: string | null): VerifyView | null {
  if (status === "verified" || status === "expired" || status === "used" || status === "invalid") {
    return status;
  }
  return null;
}

function viewFromError(err: unknown): VerifyView {
  const message = err instanceof MoeApiError ? err.message : "";
  if (/expired/i.test(message)) return "expired";
  if (/already been used/i.test(message)) return "used";
  return "invalid";
}

const copy: Record<Exclude<VerifyView, "loading">, { title: string; body: string }> = {
  verified: {
    title: "Email verified",
    body: "Your email is verified. You can sign in.",
  },
  expired: {
    title: "Link expired",
    body: "This verification link has expired. Sign in and resend the verification email.",
  },
  used: {
    title: "Link already used",
    body: "This verification link has already been used. You can sign in.",
  },
  invalid: {
    title: "Link invalid",
    body: "This verification link is invalid.",
  },
};

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const status = searchParams.get("status");
  const [view, setView] = useState<VerifyView>(() => viewFromStatus(status) ?? (token ? "loading" : "invalid"));

  useEffect(() => {
    const fromStatus = viewFromStatus(status);
    if (!token) {
      if (fromStatus) setView(fromStatus);
      return;
    }
    let cancelled = false;
    verifyOnce(token)
      .then(() => {
        if (cancelled) return;
        setView("verified");
        window.history.replaceState({}, "", "/auth/verify-email?status=verified");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const next = viewFromError(err);
        setView(next);
        window.history.replaceState({}, "", `/auth/verify-email?status=${next}`);
      });
    return () => {
      cancelled = true;
    };
  }, [token, status]);

  const shown = view === "loading" ? null : copy[view];

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="flex justify-center mb-8">
          <img loading="lazy" decoding="async" src={logo} alt="MOE" className="h-16 w-auto" />
        </Link>
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-display">
              {view === "loading" ? "Verifying your email" : shown?.title}
            </CardTitle>
            <CardDescription>
              {view === "loading" ? "This only takes a moment." : shown?.body}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            {view === "loading" ? (
              <div className="flex justify-center text-muted-foreground" data-testid="verify-email-loading">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground" data-testid={`verify-email-${view}`}>
                {shown?.body}
              </p>
            )}
            {view !== "loading" && (
              <Button asChild className="w-full">
                <Link to="/auth" data-testid="verify-sign-in">
                  Sign in
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VerifyEmail;
