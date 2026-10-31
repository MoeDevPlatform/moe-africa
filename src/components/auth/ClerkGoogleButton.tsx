import { useState } from "react";
import { useClerk } from "@clerk/react";
import { toast } from "sonner";
import GoogleContinueButton from "@/components/auth/GoogleContinueButton";

interface ClerkGoogleButtonProps {
  mode: "signIn" | "signUp";
  /** Sign-up only: copied by Clerk onto the new user; read by POST /auth/clerk-verify. */
  unsafeMetadata?: Record<string, unknown>;
  disabled?: boolean;
  /** Return false to stop the redirect, for example when signup consent is missing. */
  onBeforeRedirect?: () => boolean;
  /** Optional helper text rendered under the button. */
  hint?: string;
}

/**
 * "Continue with Google" via Clerk's direct OAuth redirect
 * (`client.signIn/signUp.authenticateWithRedirect`). Absolute callback URLs keep
 * the return path on MOE (`/sso-callback` → `/marketplace`) instead of Clerk's
 * Account Portal (*.accounts.dev).
 *
 * Must render inside <ClerkProvider> — gate on `isClerkEnabled` at the call site.
 */
const ClerkGoogleButton = ({ mode, unsafeMetadata, disabled, onBeforeRedirect, hint }: ClerkGoogleButtonProps) => {
  const clerk = useClerk();
  const [redirecting, setRedirecting] = useState(false);

  const handleGoogle = async () => {
    if (onBeforeRedirect && !onBeforeRedirect()) return;
    if (!clerk.loaded || !clerk.client) return;
    setRedirecting(true);
    try {
      // Absolute URLs are required — relative paths can resolve against Clerk's
      // hosted Account Portal (*.accounts.dev) instead of this origin.
      const redirectUrl = `${window.location.origin}/sso-callback`;
      const redirectUrlComplete = `${window.location.origin}/marketplace`;
      const params = {
        strategy: "oauth_google" as const,
        redirectUrl,
        redirectUrlComplete,
      };

      if (mode === "signIn") {
        await clerk.client.signIn.authenticateWithRedirect(params);
      } else {
        await clerk.client.signUp.authenticateWithRedirect({
          ...params,
          unsafeMetadata,
        });
      }
      // On success Clerk navigates away to Google; nothing more to do here.
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
      <GoogleContinueButton
        onClick={handleGoogle}
        data-testid={mode === "signUp" ? "signup-google" : "signin-google"}
        disabled={disabled || !clerk.loaded}
        loading={redirecting}
      />
      {hint && <p className="text-center text-xs text-muted-foreground">{hint}</p>}
      <div className="relative">
        <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
        <div className="relative flex justify-center text-xs"><span className="bg-card px-2 text-muted-foreground">or</span></div>
      </div>
    </div>
  );
};

export default ClerkGoogleButton;
