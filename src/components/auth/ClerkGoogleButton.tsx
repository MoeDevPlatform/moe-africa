import { useState } from "react";
import { useSignIn, useSignUp } from "@clerk/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const SSO_CALLBACK_URL = "/sso-callback";
const AFTER_AUTH_URL = "/marketplace";

const GoogleIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.1V7.06H2.18A11 11 0 0 0 1 12c0 1.77.42 3.45 1.18 4.94l3.66-2.84z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
  </svg>
);

interface ClerkGoogleButtonProps {
  mode: "signIn" | "signUp";
  /** Sign-up only: copied by Clerk onto the new user; read by POST /auth/clerk-verify. */
  unsafeMetadata?: Record<string, unknown>;
  disabled?: boolean;
  /** Optional helper text rendered under the button. */
  hint?: string;
}

/**
 * "Continue with Google" via Clerk's OAuth redirect flow. Clerk bounces to
 * /sso-callback (redirectCallbackUrl) and then to /marketplace (redirectUrl),
 * where ClerkSessionBridge swaps the Clerk session for MOE tokens.
 *
 * Uses the @clerk/react v6 signal hooks — `signIn.sso()` / `signUp.sso()` are
 * the v6 equivalents of the older `authenticateWithRedirect()`.
 * Must render inside <ClerkProvider> — gate on `isClerkEnabled` at the call site.
 */
const ClerkGoogleButton = ({ mode, unsafeMetadata, disabled, hint }: ClerkGoogleButtonProps) => {
  const { signIn } = useSignIn();
  const { signUp } = useSignUp();
  const [redirecting, setRedirecting] = useState(false);

  const handleGoogle = async () => {
    setRedirecting(true);
    try {
      const params = {
        strategy: "oauth_google" as const,
        redirectCallbackUrl: SSO_CALLBACK_URL,
        redirectUrl: AFTER_AUTH_URL,
      };
      const { error } =
        mode === "signIn"
          ? await signIn.sso(params)
          : await signUp.sso({ ...params, unsafeMetadata });
      if (error) throw error;
      // On success Clerk navigates away; nothing more to do here.
    } catch (err) {
      setRedirecting(false);
      const message =
        (err as { errors?: { longMessage?: string }[] })?.errors?.[0]?.longMessage ??
        (err as { message?: string })?.message;
      toast.error(message || "Could not start Google sign-in. Please try again.");
    }
  };

  return (
    <div className="space-y-4 mb-4">
      <Button
        type="button"
        variant="outline"
        className="w-full gap-2 border-primary text-primary hover:bg-primary/5 hover:text-primary"
        onClick={handleGoogle}
        disabled={disabled || redirecting}
      >
        <GoogleIcon />
        {redirecting ? "Redirecting to Google..." : "Continue with Google"}
      </Button>
      {hint && <p className="text-center text-xs text-muted-foreground">{hint}</p>}
      <div className="relative">
        <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
        <div className="relative flex justify-center text-xs"><span className="bg-card px-2 text-muted-foreground">or</span></div>
      </div>
    </div>
  );
};

export default ClerkGoogleButton;
