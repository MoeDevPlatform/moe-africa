import { Navigate } from "react-router-dom";
import { AuthenticateWithRedirectCallback } from "@clerk/react";
import { isClerkEnabled } from "@/lib/clerk";

/**
 * Completes Clerk's Google OAuth redirect started by
 * `authenticateWithRedirect`. Must stay on the MOE origin — do not point
 * signInUrl / signUpUrl at Clerk's Account Portal.
 *
 * Flow: Google → /sso-callback (this page) → /marketplace
 */
export default function SSOCallback() {
  if (!isClerkEnabled) return <Navigate to="/auth" replace />;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" aria-hidden />
      <AuthenticateWithRedirectCallback
        signInUrl="/auth"
        signUpUrl="/auth?tab=signup"
        signInFallbackRedirectUrl="/marketplace"
        signUpFallbackRedirectUrl="/marketplace"
        continueSignUpUrl="/auth?tab=signup"
        transferable
      />
    </div>
  );
}
